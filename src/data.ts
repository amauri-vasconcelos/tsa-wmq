import type { MetricStatus, WaterReading } from "./types";

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
  metric: "ph" | "tds" | "temperature" | "humidity",
  value: number,
): MetricStatus {
  if (metric === "ph") {
    if (value < 6.5 || value > 8.5) return "danger";
    if (value < 6.8 || value > 8.2) return "warning";
    return "ok";
  }

  if (metric === "tds") {
    if (value > 500) return "danger";
    if (value > 300) return "warning";
    return "ok";
  }

  if (metric === "humidity") {
    if (value < 35 || value > 85) return "danger";
    if (value < 45 || value > 75) return "warning";
    return "ok";
  }

  if (value < 18 || value > 32) return "danger";
  if (value < 22 || value > 29) return "warning";
  return "ok";
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
