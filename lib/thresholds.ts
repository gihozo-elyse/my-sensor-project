// Single source of truth for alert thresholds.
// Keep the WARN_/CRIT_ constants in firmware/mine_safety/mine_safety.ino in sync with these.

export type Level = "safe" | "warning" | "critical";
export type Metric = "gas" | "temperature" | "humidity";

export type MetricConfig = {
  key: Metric;
  label: string;
  unit: string;
  sensor: string;
  warning: number;
  critical: number;
  /** Upper bound used when drawing gauges. */
  max: number;
  decimals: number;
};

export const METRICS: Record<Metric, MetricConfig> = {
  gas: {
    key: "gas",
    label: "Gas level",
    unit: "ADC",
    sensor: "MQ135",
    warning: 400,
    critical: 800,
    max: 1023,
    decimals: 0,
  },
  temperature: {
    key: "temperature",
    label: "Temperature",
    unit: "°C",
    sensor: "DHT22",
    warning: 35,
    critical: 40,
    max: 50,
    decimals: 1,
  },
  humidity: {
    key: "humidity",
    label: "Humidity",
    unit: "%",
    sensor: "DHT22",
    warning: 70,
    critical: 90,
    max: 100,
    decimals: 1,
  },
};

export const METRIC_KEYS: Metric[] = ["gas", "temperature", "humidity"];

/** A device is considered offline if no reading arrived within this window. */
export const OFFLINE_AFTER_MS = 60_000;

export function levelFor(metric: Metric, value: number): Level {
  const cfg = METRICS[metric];
  if (value > cfg.critical) return "critical";
  if (value > cfg.warning) return "warning";
  return "safe";
}

const RANK: Record<Level, number> = { safe: 0, warning: 1, critical: 2 };

export function worstLevel(levels: Level[]): Level {
  return levels.reduce<Level>((worst, l) => (RANK[l] > RANK[worst] ? l : worst), "safe");
}

export function compareLevels(a: Level, b: Level) {
  return RANK[a] - RANK[b];
}

export function formatValue(metric: Metric, value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(METRICS[metric].decimals);
}

export function formatWithUnit(metric: Metric, value: number | null | undefined) {
  const cfg = METRICS[metric];
  const v = formatValue(metric, value);
  return v === "—" ? v : `${v}${cfg.unit === "ADC" ? " " : ""}${cfg.unit}`;
}

export const LEVEL_LABEL: Record<Level, string> = {
  safe: "Safe",
  warning: "Warning",
  critical: "Critical",
};
