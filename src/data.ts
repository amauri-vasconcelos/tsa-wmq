import type {
  AlertLevel,
  AlertLimits,
  EventRecord,
  MetricKey,
  MetricStatus,
  WaterReading,
} from "./types";

export const metricConfig: Record<
  MetricKey,
  {
    label: string;
    unit: string;
    color: string;
    decimals: number;
    limits: AlertLimits;
  }
> = {
  ph: {
    label: "pH",
    unit: "",
    color: "#116466",
    decimals: 2,
    limits: { lowLow: 6.5, low: 6.9, high: 7.35, highHigh: 7.55 },
  },
  ec: {
    label: "EC",
    unit: "mS/cm",
    color: "#2067a8",
    decimals: 2,
    limits: { lowLow: 0.12, low: 0.2, high: 0.3, highHigh: 0.36 },
  },
  cf: {
    label: "CF",
    unit: "",
    color: "#2f8a5f",
    decimals: 1,
    limits: { lowLow: 1.2, low: 2, high: 3, highHigh: 3.6 },
  },
  tds: {
    label: "TDS",
    unit: "ppm",
    color: "#6f4aa8",
    decimals: 0,
    limits: { lowLow: 60, low: 100, high: 150, highHigh: 180 },
  },
  orp: {
    label: "ORP",
    unit: "mV",
    color: "#b24b2d",
    decimals: 0,
    limits: { lowLow: 210, low: 250, high: 310, highHigh: 340 },
  },
  humidity: {
    label: "Humidity",
    unit: "%",
    color: "#1c7c82",
    decimals: 1,
    limits: { lowLow: 40, low: 50, high: 68, highHigh: 74 },
  },
  temperature: {
    label: "Temp",
    unit: "C",
    color: "#d64b35",
    decimals: 1,
    limits: { lowLow: 18, low: 22, high: 27.5, highHigh: 29 },
  },
};

const referenceDate = new Date("2026-05-12T13:00:00-03:00");

export const readings: WaterReading[] = Array.from({ length: 365 }, (_, index) => {
  const timestamp = new Date(referenceDate);
  timestamp.setDate(referenceDate.getDate() - (364 - index));

  const seasonal = Math.sin(index / 22);
  const daily = Math.cos(index / 7);
  const ph = 7.15 + seasonal * 0.28 + daily * 0.08;
  const tds = 128 + seasonal * 24 + daily * 8;
  const ec = tds / 500;
  const cf = ec * 10;
  const humidity = 61 + Math.sin(index / 18) * 9 + daily * 3;
  const temperature = 25.8 + Math.sin(index / 31) * 2.2 + daily * 0.5;

  return {
    id: `r-${String(index + 1).padStart(3, "0")}`,
    timestamp: timestamp.toISOString(),
    ph: Number(ph.toFixed(2)),
    tds: Math.round(tds),
    ec: Number(ec.toFixed(2)),
    cf: Number(cf.toFixed(1)),
    humidity: Number(humidity.toFixed(1)),
    temperature: Number(temperature.toFixed(1)),
    orp: Math.round(292 + seasonal * 28 + daily * 10),
  };
});

export function getMetricStatus(
  metric: MetricKey,
  value: number,
): MetricStatus {
  const level = getAlertLevel(metric, value);
  if (level === "LowLow" || level === "HighHigh") return "danger";
  if (level === "Low" || level === "High") return "warning";
  return "ok";
}

export function getAlertLevel(metric: MetricKey, value: number): AlertLevel {
  const limits = metricConfig[metric].limits;

  if (value <= limits.lowLow) return "LowLow";
  if (value < limits.low) return "Low";
  if (value >= limits.highHigh) return "HighHigh";
  if (value > limits.high) return "High";
  return "Normal";
}

export function formatMetricValue(metric: MetricKey, value: number) {
  const config = metricConfig[metric];
  return value.toFixed(config.decimals);
}

export function getReadingValue(reading: WaterReading, metric: MetricKey) {
  return reading[metric];
}

export function buildEvents(sourceReadings: WaterReading[]): EventRecord[] {
  const events: EventRecord[] = [];

  sourceReadings.forEach((reading) => {
    (Object.keys(metricConfig) as MetricKey[]).forEach((metric) => {
      const value = getReadingValue(reading, metric);
      const config = metricConfig[metric];
      const level = getAlertLevel(metric, value);

      if (level === "Normal") return;

      events.push({
        id: `${reading.id}-${metric}-${level}`,
        timestamp: reading.timestamp,
        metric: config.label,
        level,
        value,
        unit: config.unit,
        message: `${config.label} em ${level}`,
      });
    });
  });

  return events.reverse();
}

export function formatTime(timestamp: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function formatDate(timestamp: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(timestamp));
}
