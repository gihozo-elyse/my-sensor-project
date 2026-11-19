"use client";

import { useState } from "react";
import { Activity, History } from "lucide-react";
import Link from "next/link";
import { useLiveSensor } from "@/components/live-sensor";
import { useSensorData } from "@/components/useSensorData";
import { MetricCard, METRIC_ICON } from "@/components/metric-card";
import { MetricChart } from "@/components/metric-chart";
import { StatusHero } from "@/components/status-hero";
import { EventList } from "@/components/event-list";
import { Card, CardHeader, EmptyState, Segmented, Skeleton, cx } from "@/components/ui";
import { buildPeriods } from "@/lib/periods";
import { RANGES, type SensorRange } from "@/lib/sensor-types";
import { METRICS, METRIC_KEYS, type Metric } from "@/lib/thresholds";

const RANGE_OPTIONS = (Object.keys(RANGES) as SensorRange[]).map((r) => ({ value: r, label: RANGES[r].label }));

export function DashboardView() {
  const live = useLiveSensor();
  const [range, setRange] = useState<SensorRange>("1h");
  const [metric, setMetric] = useState<Metric>("gas");
  const history = useSensorData(range, range === "1h" ? 10_000 : 60_000);

  const latest = live.data.latest;
  const buckets = history.data.history;
  const periods = buildPeriods(buckets, RANGES[range].binMinutes * 60_000);

  return (
    <div className="space-y-6">
      {live.error ? (
        <div className="rounded-xl border border-crit/30 bg-crit/10 px-4 py-3 text-sm text-crit">{live.error}</div>
      ) : null}

      <StatusHero latest={latest} online={live.data.online} loading={live.loading} />

      <section className="grid gap-4 md:grid-cols-3">
        {METRIC_KEYS.map((m) => (
          <MetricCard
            key={m}
            metric={m}
            value={latest ? latest[m] : null}
            trend={live.data.trend[m]}
            loading={live.loading}
            selected={metric === m}
            onSelect={() => setMetric(m)}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            icon={<Activity className="h-4 w-4" />}
            title={`${METRICS[metric].label} history`}
            description={`Average per ${RANGES[range].binMinutes === 60 ? "hour" : `${RANGES[range].binMinutes} min`} · dashed lines mark alert thresholds`}
            action={<Segmented label="Time range" value={range} options={RANGE_OPTIONS} onChange={setRange} />}
          />
          <div className="flex gap-1 px-5 pt-4">
            {METRIC_KEYS.map((m) => {
              const Icon = METRIC_ICON[m];
              return (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={cx(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition",
                    metric === m ? "bg-raised text-fg ring-1 ring-line-strong" : "text-muted hover:text-fg"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {METRICS[m].label}
                </button>
              );
            })}
          </div>
          <div className="px-3 pb-4 pt-2">
            {history.loading ? (
              <Skeleton className="mx-2 h-[300px]" />
            ) : buckets.length === 0 ? (
              <EmptyState
                icon={<Activity className="h-5 w-5" />}
                title="No readings in this time range"
                description="Try a longer range, or check that the sensor node is powered and online."
              />
            ) : (
              <MetricChart data={buckets} metric={metric} range={range} />
            )}
          </div>
        </Card>

        <Card className="flex flex-col">
          <CardHeader
            icon={<History className="h-4 w-4" />}
            title="Recent incidents"
            description={`Last ${RANGES[range].label.toLowerCase()}`}
            action={
              <Link href="/alerts" className="text-xs font-medium text-brand hover:underline">
                View all
              </Link>
            }
          />
          <div className="max-h-[400px] flex-1 overflow-y-auto">
            {history.loading ? (
              <div className="space-y-3 p-5">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : (
              <EventList periods={periods} />
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
