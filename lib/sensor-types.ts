export type SensorReading = {
  _id?: string;
  temperature: number;
  humidity: number;
  gas: number;
  timestamp?: string;
};

export type SensorApiResponse = {
  latest: SensorReading | null;
  history: SensorReading[];
  trend: {
    gas: number;
    temperature: number;
    humidity: number;
  };
};
