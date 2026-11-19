"use client";

import { Droplets, Flame, Thermometer, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Card, LevelBadge, Skeleton, cx, levelBg, levelText } from "@/components/ui";
import { METRICS, formatValue, levelFor, type Metric } from "@/lib/thresholds";

export const METRIC_ICON: Record<Metric, typeof Flame> = {
  gas: Flame,
  temperature: Thermometer,
  humidity: Droplets,
};

/** Horizontal gauge with safe / warning / critical zones and a marker at the current value. */
export function ThresholdBar({ metric, value }: { metric: Metric; value: number | null }) {
  const cfg = METRICS[metric];
  const pct = (v: number) => Math.min(100, Math.max(0, (v / cfg.max) * 100));
  const level = value == null ? "safe" : levelFor(metric, value);

  return (
    <div className="mt-5">
      <div className="relative h-2 overflow-hidden rounded-full bg-canvas ring-1 ring-line">
        <div className="absolute inset-y-0 left-0 bg-safe/25" style={{ width: `${pct(cfg.warning)}%` }} />
        <div
          className="absolute inset-y-0 bg-warn/25"
          style={{ left: `${pct(cfg.warning)}%`, width: `${pct(cfg.critical) - pct(cfg.warning)}%` }}
        />
        <div className="absolute inset-y-0 right-0 bg-crit/25" style={{ left: `${pct(cfg.critical)}%` }} />
        {value != null ? (
          <div
            className={cx("absolute inset-y-0 left-0 rounded-full transition-[width] duration-700", levelBg[level])}
            style={{ width: `${pct(value)}%` }}
          />
        ) : null}
      </div>
      <div className="relative mt-1.5 h-4 text-[10px] text-faint">
        <span className="absolute left-0">0</span>
        <span className="absolute -translate-x-1/2" style={{ left: `${pct(cfg.warning)}%` }}>
          {cfg.warning}
        </span>
        <span className="absolute -translate-x-1/2" style={{ left: `${pct(cfg.critical)}%` }}>
          {cfg.critical}
        </span>
        <span className="absolute right-0">{cfg.max}</span>
      </div>
    </div>
  );
}

function Trend({ value }: { value: number | null }) {
  if (value == null) {
    return <span className="text-xs text-faint">No data from 1 h ago</span>;
  }
  const flat = Math.abs(value) < 0.5;
  // For every metric here, rising means worse.
  const Icon = flat ? Minus : value > 0 ? TrendingUp : TrendingDown;
  const color = flat ? "text-muted" : value > 0 ? "text-crit" : "text-safe";
  return (
    <span className={cx("inline-flex items-center gap-1 text-xs font-medium", color)}>
      <Icon className="h-3.5 w-3.5" />
      {flat ? "Stable" : `${value > 0 ? "+" : ""}${value.toFixed(1)}%`}
      <span className="font-normal text-faint">vs 1 h ago</span>
    </span>
  );
}

export function MetricCard({
  metric,
  value,
  trend,
  loading,
  selected,
  onSelect,
}: {
  metric: Metric;
  value: number | null;
  trend: number | null;
  loading: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const cfg = METRICS[metric];
  const Icon = METRIC_ICON[metric];
  const level = value == null ? null : levelFor(metric, value);

  return (
    <Card
      as="article"
      className={cx(
        "relative overflow-hidden p-5 transition",
        onSelect && "cursor-pointer hover:border-line-strong",
        selected && "border-brand/50 ring-1 ring-brand/30"
      )}
    >
      {onSelect ? (
        <button onClick={onSelect} className="absolute inset-0 z-10" aria-label={`Show ${cfg.label} chart`} aria-pressed={selected} />
      ) : null}
      {level === "critical" ? <div className="pointer-events-none absolute inset-0 bg-crit/[0.06]" /> : null}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={cx("flex h-10 w-10 items-center justify-center rounded-xl bg-raised ring-1 ring-line", level ? levelText[level] : "text-muted")}>
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-fg">{cfg.label}</p>
            <p className="text-xs text-faint">{cfg.sensor}</p>
          </div>
        </div>
        {level ? <LevelBadge level={level} /> : null}
      </div>

      <div className="mt-5 flex items-baseline gap-1.5">
        {loading ? (
          <Skeleton className="h-10 w-28" />
        ) : (
          <>
            <span className="text-4xl font-semibold tracking-tight text-fg tabular-nums">{formatValue(metric, value)}</span>
            <span className="text-sm text-muted">{cfg.unit}</span>
          </>
        )}
      </div>
      <div className="mt-1.5 h-4">{!loading ? <Trend value={trend} /> : null}</div>

      <ThresholdBar metric={metric} value={value} />
    </Card>
  );
}
