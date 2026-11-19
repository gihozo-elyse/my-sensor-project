export type SensorReading = {
  _id?: string;
  temperature: number;
  humidity: number;
  gas: number;
  timestamp: string;
};

/** Aggregated readings for one time bucket: averages plus peak values. */
export type SensorBucket = {
  t: string;
  gas: number;
  temperature: number;
  humidity: number;
  gasMax: number;
  temperatureMax: number;
  humidityMax: number;
  count: number;
};

export type SensorRange = "1h" | "6h" | "24h" | "7d";

/** Window length and bucket size for each history range. */
export const RANGES: Record<SensorRange, { ms: number; binMinutes: number; label: string }> = {
  "1h": { ms: 60 * 60_000, binMinutes: 1, label: "1H" },
  "6h": { ms: 6 * 60 * 60_000, binMinutes: 5, label: "6H" },
  "24h": { ms: 24 * 60 * 60_000, binMinutes: 15, label: "24H" },
  "7d": { ms: 7 * 24 * 60 * 60_000, binMinutes: 60, label: "7D" },
};

export type SensorTrend = {
  gas: number | null;
  temperature: number | null;
  humidity: number | null;
};

export type SensorApiResponse = {
  latest: SensorReading | null;
  online: boolean;
  /** % change of the latest value vs. the average about one hour ago (null if no data then). */
  trend: SensorTrend;
  range: SensorRange | null;
  history: SensorBucket[];
};
