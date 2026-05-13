export type WaterReading = {
  id: string;
  timestamp: string;
  ph: number;
  tds: number;
  ec: number;
  temperature: number;
  orp: number;
};

export type MetricStatus = "ok" | "warning" | "danger";
