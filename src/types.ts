export type WaterReading = {
  id: string;
  timestamp: string;
  ph: number;
  tds: number;
  ec: number;
  cf: number;
  humidity: number;
  temperature: number;
  orp: number;
};

export type MetricStatus = "ok" | "warning" | "danger";

export type MetricKey =
  | "ph"
  | "ec"
  | "cf"
  | "tds"
  | "orp"
  | "humidity"
  | "temperature";

export type AlertLevel = "LowLow" | "Low" | "Normal" | "High" | "HighHigh";

export type AlertLimits = {
  lowLow: number;
  low: number;
  high: number;
  highHigh: number;
};

export type EventRecord = {
  id: string;
  timestamp: string;
  metric: string;
  level: AlertLevel;
  value: number;
  unit: string;
  message: string;
};
