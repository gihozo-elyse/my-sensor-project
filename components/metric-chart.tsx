"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SensorBucket, SensorRange } from "@/lib/sensor-types";
import { METRICS, formatWithUnit, type Metric } from "@/lib/thresholds";
import { useTheme } from "@/components/theme";

// SVG attributes can't read CSS variables reliably, so chart colours are picked per theme.
const PALETTE = {
  light: { axis: "#8a93a3", grid: "#e3e6eb", cursor: "#cfd4dc", warn: "#d97706", crit: "#dc2626" },
  dark: { axis: "#636c7b", grid: "#252a35", cursor: "#343b49", warn: "#fbbf24", crit: "#f87171" },
};

const SERIES_COLOR: Record<Metric, string> = {
  gas: "#f59e0b",
  temperature: "#f43f5e",
  humidity: "#0ea5e9",
};

function tickFormatter(range: SensorRange) {
  return (iso: string) => {
    const d = new Date(iso);
    if (range === "7d") return d.toLocaleDateString([], { weekday: "short" });
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
}

type TooltipProps = { active?: boolean; payload?: { payload: SensorBucket }[]; metric: Metric };

function ChartTooltip({ active, payload, metric }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const b = payload[0].payload;
  const peakKey = `${metric}Max` as const;
  return (
    <div className="rounded-xl border border-line-strong bg-raised/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <p className="mb-1 text-muted">
        {new Date(b.t).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })}
      </p>
      <p className="font-semibold text-fg">
        Avg {formatWithUnit(metric, b[metric])}
        <span className="ml-2 font-normal text-muted">peak {formatWithUnit(metric, b[peakKey])}</span>
      </p>
      <p className="mt-0.5 text-faint">{b.count} reading{b.count === 1 ? "" : "s"}</p>
    </div>
  );
}

export function MetricChart({
  data,
  metric,
  range,
  height = 300,
}: {
  data: SensorBucket[];
  metric: Metric;
  range: SensorRange;
  height?: number;
}) {
  const cfg = METRICS[metric];
  const color = SERIES_COLOR[metric];
  const c = PALETTE[useTheme()];
  const AXIS = { fontSize: 11, fill: c.axis };
  const maxVal = Math.max(cfg.critical * 1.1, ...data.map((d) => d[`${metric}Max`]));
  const minVal = Math.min(0, ...data.map((d) => d[metric]));

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id={`fill-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={c.grid} strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="t"
            tick={AXIS}
            tickLine={false}
            axisLine={false}
            tickFormatter={tickFormatter(range)}
            minTickGap={40}
          />
          <YAxis
            tick={AXIS}
            tickLine={false}
            axisLine={false}
            domain={[Math.floor(minVal), Math.ceil(maxVal)]}
            width={48}
          />
          <ReferenceLine
            y={cfg.warning}
            stroke={c.warn}
            strokeDasharray="5 5"
            strokeOpacity={0.7}
            label={{ value: "Warning", position: "insideTopRight", fill: c.warn, fontSize: 10 }}
          />
          <ReferenceLine
            y={cfg.critical}
            stroke={c.crit}
            strokeDasharray="5 5"
            strokeOpacity={0.8}
            label={{ value: "Critical", position: "insideTopRight", fill: c.crit, fontSize: 10 }}
          />
          <Tooltip content={<ChartTooltip metric={metric} />} cursor={{ stroke: c.cursor }} />
          <Area
            type="monotone"
            dataKey={metric}
            stroke={color}
            strokeWidth={2}
            fill={`url(#fill-${metric})`}
            isAnimationActive={false}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export { SERIES_COLOR };
