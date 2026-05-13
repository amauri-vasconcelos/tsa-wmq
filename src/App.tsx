import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Droplets,
  Gauge,
  RadioTower,
  Thermometer,
} from "lucide-react";
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
import { readings, formatTime, getMetricStatus } from "./data";
import { hasFirebaseConfig } from "./firebase";
import type { MetricStatus, WaterReading } from "./types";

const latest = readings[readings.length - 1];

const chartData = readings.map((reading) => ({
  time: formatTime(reading.timestamp),
  ph: reading.ph,
  tds: reading.tds,
  temperature: reading.temperature,
}));

function statusLabel(status: MetricStatus) {
  if (status === "danger") return "Crítico";
  if (status === "warning") return "Atenção";
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
      <td>{formatTime(reading.timestamp)}</td>
      <td>{reading.ph.toFixed(2)}</td>
      <td>{reading.tds}</td>
      <td>{reading.ec}</td>
      <td>{reading.temperature.toFixed(1)} C</td>
      <td>{reading.orp}</td>
    </tr>
  );
}

export function App() {
  return (
    <main>
      <header className="app-header">
        <div>
          <span className="eyebrow">TSA Water Monitoring</span>
          <h1>Qualidade da água</h1>
          <p>
            Painel inicial para o sensor YINMIK via Tuya, com histórico pronto
            para receber dados do n8n no Firebase.
          </p>
        </div>
        <div className="connection-panel" aria-label="Estado das integrações">
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
          icon={<Gauge size={22} />}
          label="TDS"
          value={String(latest.tds)}
          unit="ppm"
          status={getMetricStatus("tds", latest.tds)}
        />
        <MetricCard
          icon={<Activity size={22} />}
          label="Condutividade"
          value={String(latest.ec)}
          unit="uS/cm"
          status="ok"
        />
        <MetricCard
          icon={<Thermometer size={22} />}
          label="Temperatura"
          value={latest.temperature.toFixed(1)}
          unit="C"
          status={getMetricStatus("temperature", latest.temperature)}
        />
      </section>

      <section className="content-grid">
        <article className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Hoje</span>
              <h2>Histórico por hora</h2>
            </div>
            <span className="healthy">
              <CheckCircle2 size={18} />
              Operação normal
            </span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 12, right: 18, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8e1df" />
                <XAxis dataKey="time" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={34} />
                <Tooltip />
                <Line type="monotone" dataKey="ph" name="pH" stroke="#116466" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="temperature" name="Temp." stroke="#d64b35" strokeWidth={3} dot={false} />
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
              <strong>TDS em atenção</strong>
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
                <th>Hora</th>
                <th>pH</th>
                <th>TDS</th>
                <th>EC</th>
                <th>Temp.</th>
                <th>ORP</th>
              </tr>
            </thead>
            <tbody>
              {readings
                .slice()
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
