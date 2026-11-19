import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { sendPushToAll } from "@/lib/push";
import { errorResponse, getSessionEmail, unauthorized } from "@/lib/session";
import { RANGES, type SensorApiResponse, type SensorBucket, type SensorRange } from "@/lib/sensor-types";
import { LEVEL_LABEL, METRICS, METRIC_KEYS, OFFLINE_AFTER_MS, compareLevels, formatWithUnit, levelFor, type Metric } from "@/lib/thresholds";

type SensorDoc = {
  temperature: number;
  humidity: number;
  gas: number;
  timestamp: Date;
};

// Physically plausible ranges for the DHT22 and the ESP8266's 10-bit ADC.
const VALID: Record<Metric, [number, number]> = {
  temperature: [-40, 125],
  humidity: [0, 100],
  gas: [0, 1024],
};

async function collection() {
  const db = await getDb();
  return db.collection<SensorDoc>("sensor_data");
}

function deviceAuthorized(request: Request) {
  const expected = process.env.SENSOR_API_KEY;
  if (!expected) return false;
  const given = request.headers.get("x-api-key") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// POST /api/sensor — called by the ESP8266. Requires the X-API-Key header.
export async function POST(request: Request) {
  if (!process.env.SENSOR_API_KEY) {
    return NextResponse.json({ error: "SENSOR_API_KEY is not configured on the server." }, { status: 503 });
  }
  if (!deviceAuthorized(request)) {
    return NextResponse.json({ error: "Invalid API key." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
    }

    const reading = {} as Record<Metric, number>;
    for (const m of METRIC_KEYS) {
      const v = Number(body[m]);
      const [min, max] = VALID[m];
      if (body[m] === null || body[m] === undefined || !Number.isFinite(v) || v < min || v > max) {
        return NextResponse.json({ error: `Invalid ${m} value: ${body[m]}` }, { status: 400 });
      }
      reading[m] = v;
    }

    const col = await collection();
    const previous = await col.findOne({}, { sort: { timestamp: -1 } });
    const result = await col.insertOne({ ...reading, timestamp: new Date() });

    // Server-side alerting: push once per level change, not on every reading.
    await notifyLevelChanges(reading, previous).catch((err) => console.error("[push]", err));

    return NextResponse.json({ ok: true, id: result.insertedId }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

async function notifyLevelChanges(current: Record<Metric, number>, previous: SensorDoc | null) {
  for (const m of METRIC_KEYS) {
    const now = levelFor(m, current[m]);
    const before = previous ? levelFor(m, previous[m]) : "safe";
    if (now === before) continue;

    const cfg = METRICS[m];
    const value = formatWithUnit(m, current[m]);
    if (compareLevels(now, before) > 0) {
      await sendPushToAll({
        title: `${now === "critical" ? "🚨" : "⚠️"} ${LEVEL_LABEL[now]}: ${cfg.label}`,
        body:
          now === "critical"
            ? `${cfg.label} is ${value}. Evacuate the area and alert the safety team.`
            : `${cfg.label} is ${value}. Increase ventilation and monitor closely.`,
        tag: m,
      });
    } else if (now === "safe") {
      await sendPushToAll({ title: `✅ ${cfg.label} back to safe`, body: `${cfg.label} is now ${value}.`, tag: m });
    }
  }
}

// GET /api/sensor?range=1h|6h|24h|7d — dashboard data. Requires a signed-in user.
export async function GET(request: Request) {
  if (!(await getSessionEmail())) return unauthorized();

  try {
    const url = new URL(request.url);
    const rangeParam = url.searchParams.get("range");
    const range = rangeParam && rangeParam in RANGES ? (rangeParam as SensorRange) : null;

    const col = await collection();
    const now = Date.now();

    const latestDoc = await col.findOne({}, { sort: { timestamp: -1 } });

    // Trend: compare latest value with the average from ~1 hour ago (50–70 min window).
    const [hourAgo] = await col
      .aggregate<{ gas: number; temperature: number; humidity: number }>([
        { $match: { timestamp: { $gte: new Date(now - 70 * 60_000), $lte: new Date(now - 50 * 60_000) } } },
        { $group: { _id: null, gas: { $avg: "$gas" }, temperature: { $avg: "$temperature" }, humidity: { $avg: "$humidity" } } },
      ])
      .toArray();

    const trendFor = (m: Metric) => {
      if (!latestDoc || !hourAgo || !hourAgo[m]) return null;
      return ((latestDoc[m] - hourAgo[m]) / Math.abs(hourAgo[m])) * 100;
    };

    let history: SensorBucket[] = [];
    if (range) {
      const { ms, binMinutes } = RANGES[range];
      history = await col
        .aggregate<SensorBucket>([
          { $match: { timestamp: { $gte: new Date(now - ms) } } },
          {
            $group: {
              _id: { $dateTrunc: { date: "$timestamp", unit: "minute", binSize: binMinutes } },
              gas: { $avg: "$gas" },
              temperature: { $avg: "$temperature" },
              humidity: { $avg: "$humidity" },
              gasMax: { $max: "$gas" },
              temperatureMax: { $max: "$temperature" },
              humidityMax: { $max: "$humidity" },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          {
            $project: {
              _id: 0,
              t: { $dateToString: { date: "$_id", format: "%Y-%m-%dT%H:%M:%S.%LZ" } },
              gas: 1,
              temperature: 1,
              humidity: 1,
              gasMax: 1,
              temperatureMax: 1,
              humidityMax: 1,
              count: 1,
            },
          },
        ])
        .toArray();
    }

    const response: SensorApiResponse = {
      latest: latestDoc
        ? {
            _id: latestDoc._id.toString(),
            gas: latestDoc.gas,
            temperature: latestDoc.temperature,
            humidity: latestDoc.humidity,
            timestamp: latestDoc.timestamp.toISOString(),
          }
        : null,
      online: !!latestDoc && now - latestDoc.timestamp.getTime() < OFFLINE_AFTER_MS,
      trend: { gas: trendFor("gas"), temperature: trendFor("temperature"), humidity: trendFor("humidity") },
      range,
      history,
    };

    return NextResponse.json(response);
  } catch (error) {
    return errorResponse(error);
  }
}
