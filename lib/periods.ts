import type { SensorBucket } from "@/lib/sensor-types";
import { LEVEL_LABEL, METRICS, METRIC_KEYS, formatWithUnit, levelFor, worstLevel, type Level, type Metric } from "@/lib/thresholds";

export function peak(b: SensorBucket, m: Metric) {
  return m === "gas" ? b.gasMax : m === "temperature" ? b.temperatureMax : b.humidityMax;
}

/** Level of a bucket, judged on its peak values so short spikes aren't averaged away. */
export function bucketLevel(b: SensorBucket): Level {
  return worstLevel(METRIC_KEYS.map((m) => levelFor(m, peak(b, m))));
}

export type Period = {
  level: Level;
  from: Date;
  to: Date;
  peaks: Record<Metric, number>;
};

export function periodReasons(p: Period): string[] {
  const reasons = METRIC_KEYS.flatMap((m) => {
    const level = levelFor(m, p.peaks[m]);
    if (level === "safe") return [];
    return [`${METRICS[m].label} peaked at ${formatWithUnit(m, p.peaks[m])} (${LEVEL_LABEL[level].toLowerCase()})`];
  });
  return reasons.length ? reasons : ["All readings within safe range"];
}

/** Merge consecutive buckets with the same level into periods. Gaps (no data) split periods. */
export function buildPeriods(buckets: SensorBucket[], bucketMs: number): Period[] {
  const periods: Period[] = [];
  for (const b of buckets) {
    const level = bucketLevel(b);
    const start = new Date(b.t);
    const end = new Date(start.getTime() + bucketMs);
    const last = periods[periods.length - 1];
    if (last && last.level === level && start.getTime() <= last.to.getTime()) {
      last.to = end;
      for (const m of METRIC_KEYS) last.peaks[m] = Math.max(last.peaks[m], peak(b, m));
    } else {
      periods.push({
        level,
        from: start,
        to: end,
        peaks: { gas: b.gasMax, temperature: b.temperatureMax, humidity: b.humidityMax },
      });
    }
  }
  return periods;
}
