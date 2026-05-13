import type { MetricStatus, WaterReading } from "./types";

export const readings: WaterReading[] = [
  {
    id: "r-001",
    timestamp: "2026-05-12T08:00:00-03:00",
    ph: 7.08,
    tds: 118,
    ec: 236,
    temperature: 25.4,
    orp: 284,
  },
  {
    id: "r-002",
    timestamp: "2026-05-12T09:00:00-03:00",
    ph: 7.14,
    tds: 121,
    ec: 242,
    temperature: 25.6,
    orp: 291,
  },
  {
    id: "r-003",
    timestamp: "2026-05-12T10:00:00-03:00",
    ph: 7.21,
    tds: 125,
    ec: 250,
    temperature: 26.0,
    orp: 300,
  },
  {
    id: "r-004",
    timestamp: "2026-05-12T11:00:00-03:00",
    ph: 7.32,
    tds: 129,
    ec: 258,
    temperature: 26.4,
    orp: 305,
  },
  {
    id: "r-005",
    timestamp: "2026-05-12T12:00:00-03:00",
    ph: 7.28,
    tds: 132,
    ec: 264,
    temperature: 26.6,
    orp: 309,
  },
  {
    id: "r-006",
    timestamp: "2026-05-12T13:00:00-03:00",
    ph: 7.41,
    tds: 136,
    ec: 272,
    temperature: 26.9,
    orp: 316,
  },
];

export function getMetricStatus(
  metric: "ph" | "tds" | "temperature",
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
