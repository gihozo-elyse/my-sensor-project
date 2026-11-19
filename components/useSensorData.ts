"use client";

import { useEffect, useState } from "react";
import type { SensorApiResponse, SensorRange } from "@/lib/sensor-types";

export const EMPTY_DATA: SensorApiResponse = {
  latest: null,
  online: false,
  trend: { gas: null, temperature: null, humidity: null },
  range: null,
  history: [],
};

/**
 * Polls /api/sensor. Pass a range to also receive bucketed history.
 * Polling pauses while the tab is hidden.
 */
export function useSensorData(range: SensorRange | null = null, intervalMs = 5000) {
  const [data, setData] = useState<SensorApiResponse>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let controller: AbortController | null = null;
    setLoading(true);

    const fetchData = async () => {
      if (document.hidden) return;
      controller?.abort();
      controller = new AbortController();
      try {
        const qs = range ? `?range=${range}` : "";
        const res = await fetch(`/api/sensor${qs}`, { cache: "no-store", signal: controller.signal });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? "Unable to load sensor data");
        if (!alive) return;
        setData(body as SensorApiResponse);
        setError(null);
      } catch (err) {
        if (!alive || (err instanceof DOMException && err.name === "AbortError")) return;
        setError(err instanceof Error ? err.message : "Failed to fetch sensor data");
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, intervalMs);
    const onVisible = () => !document.hidden && fetchData();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      alive = false;
      controller?.abort();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [range, intervalMs]);

  return { data, loading, error };
}
