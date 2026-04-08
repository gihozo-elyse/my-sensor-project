"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
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
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const response = await fetch("/api/sensor", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to load sensor data");
        }

        const result: SensorApiResponse = await response.json();
        if (!isMounted) {
          return;
        }

        setData(result);
        setError(null);

        const gasValue = result.latest?.gas ?? 0;
        if (gasValue > 500 && !isCritical) {
          toast.error(`Critical gas alert: ${gasValue} PPM`, {
            description: "Gas concentration crossed the safety threshold.",
          });
          setIsCritical(true);
        } else if (gasValue <= 500 && isCritical) {
          setIsCritical(false);
        }
      } catch (err: unknown) {
        if (!isMounted) {
          return;
        }

        const message =
          err instanceof Error ? err.message : "Failed to fetch sensor data";
        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isCritical]);

  return { data, loading, error };
}
