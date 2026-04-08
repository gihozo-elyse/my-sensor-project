import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://elysegihozo123:elyse123456@cluster0.t9vzx.mongodb.net/mine_safety?retryWrites=true&w=majority";

const client = new MongoClient(uri);

type SensorDoc = {
  temperature: number;
  humidity: number;
  gas: number;
  timestamp: Date;
};

async function getCollection() {
  await client.connect();
  return client.db("mine_safety").collection<SensorDoc>("sensor_data");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const collection = await getCollection();

    const result = await collection.insertOne({
      temperature: Number(body.temperature) || 0,
      humidity: Number(body.humidity) || 0,
      gas: Number(body.gas) || 0,
      timestamp: new Date(),
    });

    return NextResponse.json({ message: "Data Saved!", id: result.insertedId }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const collection = await getCollection();
    const history = await collection.find().sort({ timestamp: -1 }).limit(24).toArray();

    const orderedHistory = [...history].reverse();
    const latest = orderedHistory[orderedHistory.length - 1] ?? null;
    const previous = orderedHistory[orderedHistory.length - 2] ?? null;

    const calcTrend = (current: number, prev: number) => {
      if (!prev) return 0;
      return ((current - prev) / prev) * 100;
    };

    return NextResponse.json({
      latest,
      history: orderedHistory,
      trend: {
        gas: latest ? calcTrend(latest.gas, previous?.gas ?? 0) : 0,
        temperature: latest ? calcTrend(latest.temperature, previous?.temperature ?? 0) : 0,
        humidity: latest ? calcTrend(latest.humidity, previous?.humidity ?? 0) : 0,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}