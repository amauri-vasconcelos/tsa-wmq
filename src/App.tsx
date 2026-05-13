import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Droplets,
  Gauge,
  Percent,
  RadioTower,
  Thermometer,
  Waves,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import {
  buildEvents,
  formatDate,
  formatTime,
  getMetricStatus,
  metricConfig,
  readings as mockReadings,
} from "./data";
import { db, hasFirebaseConfig } from "./firebase";
import type { EventRecord, MetricKey, MetricStatus, WaterReading } from "./types";

const periodOptions = [
  { label: "1 dia", days: 1 },
  { label: "1 semana", days: 7 },
  { label: "1 mes", days: 30 },
  { label: "1 ano", days: 365 },
];
const metricKeys = Object.keys(metricConfig) as MetricKey[];
const defaultChartMetrics: MetricKey[] = ["ph", "tds", "temperature"];
const firebaseDeviceId =
  import.meta.env.VITE_FIREBASE_DEVICE_ID || "tuya-yinmik-simulado";

function toReading(id: string, data: Record<string, unknown>): WaterReading {
  return {
    id,
    timestamp:
      typeof data.timestamp === "string"
        ? data.timestamp
        : new Date().toISOString(),
    ph: Number(data.ph),
    ec: Number(data.ec),
    cf: Number(data.cf),
    tds: Number(data.tds),
    orp: Number(data.orp),
    humidity: Number(data.humidity),
    temperature: Number(data.temperature),
  };
}

function statusLabel(status: MetricStatus) {
  if (status === "danger") return "Critico";
  if (status === "warning") return "Atencao";
  return "Normal";
}

function MetricCard({
  icon,
  label,
  value,
  unit,
  status,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  unit?: string;
  status: MetricStatus;
}) {
  return (
    <article className="metric-card">
      <div className="metric-topline">
        <span className="metric-icon">{icon}</span>
        <span className={`status-pill ${status}`}>{statusLabel(status)}</span>
      </div>
      <p>{label}</p>
      <strong>
        {value}
        {unit && <small>{unit}</small>}
      </strong>
    </article>
  );
}

function ReadingRow({ reading }: { reading: WaterReading }) {
  return (
    <tr>
      <td>{formatDate(reading.timestamp)}</td>
      <td>{reading.ph.toFixed(2)}</td>
      <td>{reading.ec.toFixed(2)}</td>
      <td>{reading.cf.toFixed(1)}</td>
      <td>{reading.tds}</td>
      <td>{reading.orp}</td>
      <td>{reading.humidity.toFixed(1)}</td>
      <td>{reading.temperature.toFixed(1)} C</td>
    </tr>
  );
}

function EventRow({ event }: { event: EventRecord }) {
  return (
    <tr>
      <td>{formatDate(event.timestamp)}</td>
      <td>{event.metric}</td>
      <td>
        <span className={`event-level ${event.level.toLowerCase()}`}>
          {event.level}
        </span>
      </td>
      <td>
        {event.value}
        {event.unit && ` ${event.unit}`}
      </td>
      <td>{event.message}</td>
    </tr>
  );
}

export function App() {
  const [selectedDays, setSelectedDays] = useState(7);
  const [activeMetrics, setActiveMetrics] =
    useState<MetricKey[]>(defaultChartMetrics);
  const [firebaseReadings, setFirebaseReadings] = useState<WaterReading[]>([]);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const dashboardReadings =
    firebaseReadings.length > 0 ? firebaseReadings : mockReadings;
  const latest = dashboardReadings[dashboardReadings.length - 1];

  useEffect(() => {
    if (!db) return undefined;

    const readingsQuery = query(
      collection(db, "devices", firebaseDeviceId, "readings"),
      orderBy("createdAt", "desc"),
      limit(365),
    );

    return onSnapshot(
      readingsQuery,
      (snapshot) => {
        const nextReadings = snapshot.docs
          .map((documentSnapshot) =>
            toReading(documentSnapshot.id, documentSnapshot.data()),
          )
          .filter((reading) =>
            metricKeys.every((metric) => Number.isFinite(reading[metric])),
          )
          .reverse();

        setFirebaseReadings(nextReadings);
        setFirebaseError(null);
      },
      (error) => {
        setFirebaseError(error.message);
      },
    );
  }, []);

  const chartData = useMemo(() => {
    const selectedReadings = dashboardReadings.slice(-selectedDays);

    return selectedReadings.map((reading) => ({
      time:
        selectedDays === 1
          ? formatTime(reading.timestamp)
          : formatDate(reading.timestamp),
      ph: reading.ph,
      ec: reading.ec,
      cf: reading.cf,
      tds: reading.tds,
      orp: reading.orp,
      humidity: reading.humidity,
      temperature: reading.temperature,
    }));
  }, [dashboardReadings, selectedDays]);
  const events = useMemo(() => buildEvents(dashboardReadings).slice(0, 20), [
    dashboardReadings,
  ]);

  function toggleChartMetric(metric: MetricKey) {
    setActiveMetrics((currentMetrics) => {
      const isActive = currentMetrics.includes(metric);

      if (isActive && currentMetrics.length === 1) {
        return currentMetrics;
      }

      if (isActive) {
        return currentMetrics.filter((currentMetric) => currentMetric !== metric);
      }

      return [...currentMetrics, metric];
    });
  }

  return (
    <main>
      <header className="app-header">
        <div>
          <span className="eyebrow">TSA Water Monitoring</span>
          <h1>Qualidade da agua</h1>
          <p>
            Painel inicial para o sensor YINMIK via Tuya, com historico pronto
            para receber dados do n8n no Firebase.
          </p>
        </div>
        <div className="connection-panel" aria-label="Estado das integracoes">
          <span>
            <RadioTower size={18} />
            Tuya via n8n
          </span>
          <span className={hasFirebaseConfig ? "online" : "pending"}>
            <Cloud size={18} />
            Firebase{" "}
            {firebaseReadings.length > 0
              ? "online"
              : hasFirebaseConfig
                ? "configurado"
                : "pendente"}
          </span>
        </div>
      </header>

      <section className="metrics-grid" aria-label="Leitura atual">
        <MetricCard
          icon={<Droplets size={22} />}
          label="pH"
          value={latest.ph.toFixed(2)}
          status={getMetricStatus("ph", latest.ph)}
        />
        <MetricCard
          icon={<Zap size={22} />}
          label="EC"
          value={latest.ec.toFixed(2)}
          unit="mS/cm"
          status={getMetricStatus("ec", latest.ec)}
        />
        <MetricCard
          icon={<Waves size={22} />}
          label="CF"
          value={latest.cf.toFixed(1)}
          status={getMetricStatus("cf", latest.cf)}
        />
        <MetricCard
          icon={<Gauge size={22} />}
          label="TDS"
          value={String(latest.tds)}
          unit="ppm"
          status={getMetricStatus("tds", latest.tds)}
        />
        <MetricCard
          icon={<Activity size={22} />}
          label="ORP"
          value={String(latest.orp)}
          unit="mV"
          status={getMetricStatus("orp", latest.orp)}
        />
        <MetricCard
          icon={<Percent size={22} />}
          label="Humidity"
          value={latest.humidity.toFixed(1)}
          unit="%"
          status={getMetricStatus("humidity", latest.humidity)}
        />
        <MetricCard
          icon={<Thermometer size={22} />}
          label="Temp"
          value={latest.temperature.toFixed(1)}
          unit="C"
          status={getMetricStatus("temperature", latest.temperature)}
        />
      </section>

      <section className="content-grid">
        <article className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Historico</span>
              <h2>Leituras por periodo</h2>
            </div>
            <div className="chart-actions">
              <div className="period-tabs" aria-label="Periodo do grafico">
                {periodOptions.map((option) => (
                  <button
                    key={option.days}
                    type="button"
                    className={selectedDays === option.days ? "active" : ""}
                    onClick={() => setSelectedDays(option.days)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <span className="healthy">
                <CheckCircle2 size={18} />
                Operacao normal
              </span>
            </div>
          </div>
          <div className="chart-legend" aria-label="Dados exibidos no grafico">
            {metricKeys.map((metric) => {
              const config = metricConfig[metric];
              const checked = activeMetrics.includes(metric);

              return (
                <button
                  key={metric}
                  type="button"
                  className={checked ? "legend-item active" : "legend-item"}
                  onClick={() => toggleChartMetric(metric)}
                  aria-pressed={checked}
                >
                  <span
                    className="legend-color"
                    style={{ backgroundColor: config.color }}
                  />
                  {config.label}
                </button>
              );
            })}
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 12, right: 18, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#d8e1df" />
                <XAxis dataKey="time" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={34} />
                <Tooltip />
                {activeMetrics.map((metric) => (
                  <Line
                    key={metric}
                    type="monotone"
                    dataKey={metric}
                    name={metricConfig[metric].label}
                    stroke={metricConfig[metric].color}
                    strokeWidth={metric === "ph" || metric === "temperature" ? 3 : 2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <aside className="panel alert-panel">
          <div className="panel-heading compact">
            <div>
              <span className="eyebrow">Regras</span>
              <h2>Alertas</h2>
            </div>
            <AlertTriangle size={20} />
          </div>
          <ul className="alert-list">
            {metricKeys.slice(0, 4).map((metric) => {
              const config = metricConfig[metric];
              const limits = config.limits;

              return (
                <li key={metric}>
                  <strong>{config.label}</strong>
                  <span>
                    LL {limits.lowLow} | L {limits.low} | H {limits.high} | HH{" "}
                    {limits.highHigh}
                  </span>
                </li>
              );
            })}
          </ul>
        </aside>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Firestore</span>
            <h2>Leituras recentes</h2>
            {firebaseError && <p className="panel-note">{firebaseError}</p>}
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>pH</th>
                <th>EC mS/cm</th>
                <th>CF</th>
                <th>TDS ppm</th>
                <th>ORP mV</th>
                <th>Humidity %</th>
                <th>Temp. C</th>
              </tr>
            </thead>
            <tbody>
              {dashboardReadings
                .slice(-10)
                .reverse()
                .map((reading) => (
                  <ReadingRow key={reading.id} reading={reading} />
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Eventos</span>
            <h2>Eventos ocorridos</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table className="events-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Dado</th>
                <th>Evento</th>
                <th>Valor</th>
                <th>Mensagem</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
