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
import { useMemo, useState } from "react";
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
import { readings, formatDate, formatTime, getMetricStatus } from "./data";
import { hasFirebaseConfig } from "./firebase";
import type { MetricStatus, WaterReading } from "./types";

const latest = readings[readings.length - 1];
const periodOptions = [
  { label: "1 dia", days: 1 },
  { label: "1 semana", days: 7 },
  { label: "1 mes", days: 30 },
  { label: "1 ano", days: 365 },
];

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

export function App() {
  const [selectedDays, setSelectedDays] = useState(7);
  const chartData = useMemo(() => {
    const selectedReadings = readings.slice(-selectedDays);

    return selectedReadings.map((reading) => ({
      time:
        selectedDays === 1
          ? formatTime(reading.timestamp)
          : formatDate(reading.timestamp),
      ph: reading.ph,
      tds: reading.tds,
      temperature: reading.temperature,
    }));
  }, [selectedDays]);

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
            Firebase {hasFirebaseConfig ? "configurado" : "pendente"}
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
          status="ok"
        />
        <MetricCard
          icon={<Waves size={22} />}
          label="CF"
          value={latest.cf.toFixed(1)}
          status="ok"
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
          status="ok"
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
                <Line
                  type="monotone"
                  dataKey="ph"
                  name="pH"
                  stroke="#116466"
                  strokeWidth={3}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="tds"
                  name="TDS"
                  stroke="#6f4aa8"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  name="Temp."
                  stroke="#d64b35"
                  strokeWidth={3}
                  dot={false}
                />
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
            <li>
              <strong>pH ideal</strong>
              <span>6.8 a 8.2</span>
            </li>
            <li>
              <strong>TDS em atencao</strong>
              <span>Acima de 300 ppm</span>
            </li>
            <li>
              <strong>Temperatura</strong>
              <span>22 C a 29 C</span>
            </li>
          </ul>
        </aside>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Firestore</span>
            <h2>Leituras recentes</h2>
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
              {readings
                .slice(-10)
                .reverse()
                .map((reading) => (
                  <ReadingRow key={reading.id} reading={reading} />
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
