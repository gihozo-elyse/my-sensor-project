"use client";

import { useEffect, useState } from "react";
import { BellRing, Cpu, Lightbulb, MonitorSmartphone, Radio, Search } from "lucide-react";
import { useLiveSensor } from "@/components/live-sensor";
import { useSearch } from "@/components/search-context";
import { METRIC_ICON, ThresholdBar } from "@/components/metric-card";
import { Card, CardHeader, EmptyState, LevelBadge, LiveDot, cx, timeAgo } from "@/components/ui";
import { METRICS, METRIC_KEYS, formatWithUnit, levelFor, type Metric } from "@/lib/thresholds";

type Row = {
  id: string;
  metric: Metric;
  name: string;
  pin: string;
};

const ROWS: Row[] = [
  { id: "S-01", metric: "gas", name: "MQ135 gas sensor", pin: "A0" },
  { id: "S-02", metric: "temperature", name: "DHT22 temperature", pin: "D4" },
  { id: "S-03", metric: "humidity", name: "DHT22 humidity", pin: "D4" },
];

const PERIPHERALS = [
  { icon: MonitorSmartphone, name: "16×2 I²C LCD", detail: "Shows readings and warnings on site" },
  { icon: BellRing, name: "Buzzer", detail: "D5 · beeps on warning, rapid on critical" },
  { icon: Lightbulb, name: "Status LEDs", detail: "Green = safe, red = alarm" },
];

export function SensorsTable() {
  const { data, loading } = useLiveSensor();
  const { query } = useSearch();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const latest = data.latest;
  const q = query.trim().toLowerCase();
  const rows = ROWS.filter((r) =>
    [r.id, r.name, METRICS[r.metric].label, r.pin, "shaft a"].some((s) => s.toLowerCase().includes(q))
  );

  return (
    <div className="space-y-6">
      {/* Node overview */}
      <Card className="p-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-raised text-brand ring-1 ring-line">
              <Cpu className="h-7 w-7" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-fg">Node 01</h2>
                <span
                  className={cx(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                    data.online ? "bg-safe/10 text-safe ring-safe/25" : "bg-raised text-muted ring-line"
                  )}
                >
                  <LiveDot online={data.online} />
                  {data.online ? "Online" : "Offline"}
                </span>
              </div>
              <p className="text-sm text-muted">ESP8266 NodeMCU · Shaft A</p>
            </div>
          </div>
          <dl className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3 md:ml-auto md:max-w-xl">
            {[
              { k: "Last reading", v: loading ? "…" : timeAgo(latest?.timestamp, now) },
              { k: "Upload interval", v: "Every 10 s" },
              { k: "Sensors", v: `${ROWS.length} channels` },
            ].map((s) => (
              <div key={s.k} className="rounded-xl bg-canvas/60 px-3 py-2 ring-1 ring-line">
                <dt className="text-xs text-faint">{s.k}</dt>
                <dd className="mt-0.5 text-sm font-medium text-fg">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Card>

      {/* Sensor channels */}
      <Card>
        <CardHeader icon={<Radio className="h-4 w-4" />} title="Sensor channels" description="Live value and alert level for each channel" />
        {rows.length === 0 ? (
          <EmptyState icon={<Search className="h-5 w-5" />} title="No sensors match your search" description={`Nothing found for “${query}”.`} />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-faint">
                    <th className="px-5 py-3 font-medium">Sensor</th>
                    <th className="px-5 py-3 font-medium">Pin</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Reading</th>
                    <th className="w-[28%] px-5 py-3 font-medium">Range</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const Icon = METRIC_ICON[row.metric];
                    const value = latest ? latest[row.metric] : null;
                    const level = value == null ? null : levelFor(row.metric, value);
                    return (
                      <tr key={row.id} className="border-t border-line transition hover:bg-raised/40">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-raised text-muted ring-1 ring-line">
                              <Icon className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="font-medium text-fg">{row.name}</p>
                              <p className="text-xs text-faint">
                                {row.id} · {METRICS[row.metric].label}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-muted">{row.pin}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-2 text-xs text-muted">
                            <LiveDot online={data.online} />
                            {data.online ? "Reporting" : "No signal"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-fg tabular-nums">{formatWithUnit(row.metric, value)}</span>
                            {level ? <LevelBadge level={level} /> : null}
                          </div>
                        </td>
                        <td className="px-5 py-2">
                          <ThresholdBar metric={row.metric} value={value} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-line md:hidden">
              {rows.map((row) => {
                const Icon = METRIC_ICON[row.metric];
                const value = latest ? latest[row.metric] : null;
                const level = value == null ? null : levelFor(row.metric, value);
                return (
                  <li key={row.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-muted" />
                      <p className="flex-1 font-medium text-fg">{row.name}</p>
                      {level ? <LevelBadge level={level} /> : null}
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-fg">{formatWithUnit(row.metric, value)}</p>
                    <ThresholdBar metric={row.metric} value={value} />
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Card>

      {/* On-site outputs */}
      <div className="grid gap-4 sm:grid-cols-3">
        {PERIPHERALS.map((p) => (
          <Card key={p.name} className="flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-raised text-brand ring-1 ring-line">
              <p.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-fg">{p.name}</p>
              <p className="text-xs text-muted">{p.detail}</p>
            </div>
          </Card>
        ))}
      </div>

      <p className="text-xs text-faint">
        Note: the MQ135 reports a raw 0–1023 analog value (ADC), not calibrated PPM. Thresholds: gas {METRICS.gas.warning}/{METRICS.gas.critical},
        temperature {METRICS.temperature.warning}/{METRICS.temperature.critical} °C, humidity {METRICS.humidity.warning}/{METRICS.humidity.critical} %
        (warning/critical). {METRIC_KEYS.length} channels on one node.
      </p>
    </div>
  );
}
