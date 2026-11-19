"use client";

import { useState } from "react";
import { History, ShieldCheck, Siren } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useLiveSensor } from "@/components/live-sensor";
import { useSensorData } from "@/components/useSensorData";
import { useSearch } from "@/components/search-context";
import { EventList } from "@/components/event-list";
import { METRIC_ICON } from "@/components/metric-card";
import { Card, CardHeader, LevelBadge, Segmented, Skeleton, cx, levelSoft } from "@/components/ui";
import { buildPeriods, periodReasons } from "@/lib/periods";
import { RANGES, type SensorRange } from "@/lib/sensor-types";
import { METRICS, METRIC_KEYS, formatWithUnit, levelFor } from "@/lib/thresholds";

const GUIDANCE = {
  warning: "Notify the shift supervisor, increase ventilation and monitor closely.",
  critical: "Evacuate all personnel from the zone immediately and alert the safety officer.",
} as const;

export default function AlertsPage() {
  const live = useLiveSensor();
  const { query } = useSearch();
  const [range, setRange] = useState<SensorRange>("24h");
  const history = useSensorData(range, 60_000);

  const latest = live.data.latest;
  const active = latest
    ? METRIC_KEYS.map((m) => ({ m, level: levelFor(m, latest[m]), value: latest[m] })).filter((a) => a.level !== "safe")
    : [];

  const q = query.trim().toLowerCase();
  const periods = buildPeriods(history.data.history, RANGES[range].binMinutes * 60_000).filter(
    (p) => !q || p.level.includes(q) || periodReasons(p).some((r) => r.toLowerCase().includes(q))
  );
  const incidentCount = periods.filter((p) => p.level !== "safe").length;

  return (
    <AppShell title="Alerts" subtitle="Active alarms and incident history">
      <div className="space-y-6">
        {/* Active alerts */}
        {live.loading ? (
          <Skeleton className="h-28 rounded-2xl" />
        ) : active.length === 0 ? (
          <Card className="flex items-center gap-4 border-safe/25 p-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-safe/15 text-safe">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <p className="font-semibold text-fg">No active alerts</p>
              <p className="text-sm text-muted">
                {latest ? "Every channel is within safe limits right now." : "Waiting for the first reading from the sensor node."}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {active.map(({ m, level, value }) => {
              const Icon = METRIC_ICON[m];
              const lvl = level as "warning" | "critical";
              return (
                <Card
                  key={m}
                  as="article"
                  className={cx("p-5", lvl === "critical" ? "border-crit/40 bg-crit/[0.06]" : "border-warn/35 bg-warn/[0.05]")}
                >
                  <div className="flex items-start gap-4">
                    <span className={cx("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset", levelSoft[lvl])}>
                      {lvl === "critical" ? <Siren className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-fg">{METRICS[m].label}</p>
                        <LevelBadge level={lvl} />
                      </div>
                      <p className="mt-1 text-2xl font-semibold text-fg">{formatWithUnit(m, value)}</p>
                      <p className="mt-0.5 text-xs text-faint">
                        Threshold: {lvl === "critical" ? METRICS[m].critical : METRICS[m].warning}
                        {METRICS[m].unit === "ADC" ? " ADC" : METRICS[m].unit}
                      </p>
                      <p className="mt-3 rounded-lg bg-canvas/60 px-3 py-2 text-sm text-fg/90 ring-1 ring-line">{GUIDANCE[lvl]}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* History */}
        <Card>
          <CardHeader
            icon={<History className="h-4 w-4" />}
            title="Incident history"
            description={history.loading ? "Loading…" : `${incidentCount} incident${incidentCount === 1 ? "" : "s"} in the last ${RANGES[range].label.toLowerCase()}`}
            action={
              <Segmented
                label="History range"
                value={range}
                onChange={setRange}
                options={(["6h", "24h", "7d"] as SensorRange[]).map((r) => ({ value: r, label: RANGES[r].label }))}
              />
            }
          />
          {history.loading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          ) : (
            <EventList periods={periods} emptyText={q ? `No incidents match “${query}”.` : undefined} />
          )}
        </Card>
      </div>
    </AppShell>
  );
}
