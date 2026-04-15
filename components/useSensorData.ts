"use client";

import { useEffect, useState, useRef } from "react";
import { SensorApiResponse } from "@/lib/sensor-types";

const EMPTY_DATA: SensorApiResponse = {
  latest: null,
  history: [],
  trend: { gas: 0, temperature: 0, humidity: 0 },
};

export function useSensorData() {
  const [data, setData] = useState<SensorApiResponse>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prevRef = useRef({ gas: 0, temp: 0, humidity: 0 });

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const response = await fetch("/api/sensor", { cache: "no-store" });
        if (!response.ok) throw new Error("Unable to load sensor data");

        const result: SensorApiResponse = await response.json();
        if (!isMounted) return;

        setData(result);
        setError(null);
        prevRef.current = {
          gas: result.latest?.gas ?? 0,
          temp: result.latest?.temperature ?? 0,
          humidity: result.latest?.humidity ?? 0,
        };
      } catch (err: unknown) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : "Failed to fetch sensor data";
        setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { data, loading, error };
}
