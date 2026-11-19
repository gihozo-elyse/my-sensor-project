"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, ShieldCheck, ShieldX, WifiOff } from "lucide-react";
import { LiveDot, cx, timeAgo } from "@/components/ui";
import type { SensorReading } from "@/lib/sensor-types";
import { LEVEL_LABEL, METRICS, METRIC_KEYS, formatWithUnit, levelFor, worstLevel } from "@/lib/thresholds";

export function StatusHero({ latest, online, loading }: { latest: SensorReading | null; online: boolean; loading: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return <div className="h-[116px] animate-pulse rounded-2xl border border-line bg-surface" />;
  }

  const level = latest ? worstLevel(METRIC_KEYS.map((m) => levelFor(m, latest[m]))) : null;
  const issues = latest
    ? METRIC_KEYS.filter((m) => levelFor(m, latest[m]) !== "safe").map(
        (m) => `${METRICS[m].label} ${formatWithUnit(m, latest[m])} (${LEVEL_LABEL[levelFor(m, latest[m])].toLowerCase()})`
      )
    : [];

  const view = !latest
    ? {
        Icon: WifiOff,
        title: "No readings yet",
        text: "Power on the sensor node. Readings appear here as soon as they arrive.",
        tone: "border-line bg-surface",
        icon: "bg-raised text-muted",
      }
    : level === "critical"
      ? {
          Icon: ShieldX,
          title: "Critical conditions: evacuate the zone",
          text: issues.join(" · "),
          tone: "border-crit/40 bg-gradient-to-r from-crit/15 via-crit/5 to-transparent",
          icon: "bg-crit/20 text-crit",
        }
      : level === "warning"
        ? {
            Icon: ShieldAlert,
            title: "Warning: conditions need attention",
            text: issues.join(" · "),
            tone: "border-warn/35 bg-gradient-to-r from-warn/12 via-warn/5 to-transparent",
            icon: "bg-warn/20 text-warn",
          }
        : {
            Icon: ShieldCheck,
            title: "All clear: conditions are safe",
            text: "Gas, temperature and humidity are all within safe limits.",
            tone: "border-safe/25 bg-gradient-to-r from-safe/10 via-safe/[0.03] to-transparent",
            icon: "bg-safe/15 text-safe",
          };

  return (
    <section
      className={cx("flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center", view.tone)}
      role={level === "critical" ? "alert" : "status"}
    >
      <span className={cx("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl", view.icon)}>
        <view.Icon className="h-7 w-7" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold text-fg">{view.title}</h2>
        <p className="mt-0.5 text-sm text-muted">{view.text}</p>
      </div>
      {latest ? (
        <div className="flex shrink-0 flex-col gap-1 text-xs text-muted sm:items-end">
          <span className="inline-flex items-center gap-2 font-medium text-fg">
            <LiveDot online={online} />
            {online ? "Node 01 · Shaft A · Live" : "Node 01 · Offline"}
          </span>
          <span>Updated {timeAgo(latest.timestamp, now)}</span>
        </div>
      ) : null}
    </section>
  );
}
