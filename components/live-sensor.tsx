"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useSensorData, EMPTY_DATA } from "@/components/useSensorData";
import { ensurePushSubscription } from "@/components/push";
import type { SensorApiResponse } from "@/lib/sensor-types";
import { LEVEL_LABEL, METRICS, METRIC_KEYS, compareLevels, formatWithUnit, levelFor, type Level, type Metric } from "@/lib/thresholds";

type LiveContext = {
  data: SensorApiResponse;
  loading: boolean;
  error: string | null;
};

const Ctx = createContext<LiveContext>({ data: EMPTY_DATA, loading: true, error: null });

/**
 * Polls the latest reading app-wide and shows in-app toasts when a level changes.
 * (Push notifications are sent by the server, so closed tabs still get them.)
 */
export function LiveSensorProvider({ children }: { children: React.ReactNode }) {
  const live = useSensorData(null, 5000);
  const prevLevels = useRef<Record<Metric, Level> | null>(null);
  const prevOnline = useRef<boolean | null>(null);

  // If the user already granted notification permission, make sure this device is subscribed.
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      ensurePushSubscription().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const latest = live.data.latest;
    if (live.loading || !latest) return;

    const levels = Object.fromEntries(METRIC_KEYS.map((m) => [m, levelFor(m, latest[m])])) as Record<Metric, Level>;
    const before = prevLevels.current;
    prevLevels.current = levels;

    if (before) {
      for (const m of METRIC_KEYS) {
        const now = levels[m];
        if (now === before[m]) continue;
        const cfg = METRICS[m];
        const value = formatWithUnit(m, latest[m]);
        if (compareLevels(now, before[m]) > 0) {
          const fn = now === "critical" ? toast.error : toast.warning;
          fn(`${LEVEL_LABEL[now]}: ${cfg.label} ${value}`, {
            description: now === "critical" ? "Evacuate the area and alert the safety team." : "Increase ventilation and monitor closely.",
            duration: now === "critical" ? 12000 : 8000,
          });
        } else if (now === "safe") {
          toast.success(`${cfg.label} back to safe`, { description: `Now ${value}` });
        }
      }
    }
  }, [live.data.latest, live.loading]);

  useEffect(() => {
    if (live.loading || !live.data.latest) return;
    const was = prevOnline.current;
    prevOnline.current = live.data.online;
    if (was === true && !live.data.online) {
      toast.warning("Sensor node went offline", { description: "No readings received in the last minute." });
    } else if (was === false && live.data.online) {
      toast.success("Sensor node is back online");
    }
  }, [live.data.online, live.data.latest, live.loading]);

  return <Ctx.Provider value={live}>{children}</Ctx.Provider>;
}

export function useLiveSensor() {
  return useContext(Ctx);
}
