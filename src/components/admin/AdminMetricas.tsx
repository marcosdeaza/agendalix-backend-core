"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { StatCard } from "../panel/StatCard";
import type { AdminStats, AdminUsoSerie } from "@/lib/admin-data";

type Props = {
  stats: AdminStats;
  serie: AdminUsoSerie[];
};

const COLORS = {
  purple: "#2E8F66",
  purpleLight: "#7FC9A6",
  green: "#5BB96A",
  yellow: "#BA7517",
  red: "#A32D2D",
  grid: "#1e1e1e",
};

function dayLabel(fecha: string): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" }).format(d);
}

export function AdminMetricas({ stats, serie }: Props) {
  const chartData = serie.map((r) => ({ ...r, label: dayLabel(r.fecha) }));

  const planDistribution = [
    { name: "Básico", value: stats.basico, color: COLORS.purple },
    { name: "Pro", value: stats.pro, color: COLORS.purpleLight },
    { name: "Clínica", value: stats.clinica, color: COLORS.green },
    { name: "Prueba", value: stats.trial, color: COLORS.yellow },
  ].filter((p) => p.value > 0);

  return (
    <div className="px-6 md:px-10 py-10 max-w-[1400px]">
      <header className="mb-8">
        <h1 className="text-[28px] font-medium text-white">Métricas</h1>
        <p className="text-[13px] text-ink-secondary mt-1">
          Uso de la plataforma en los últimos 30 días.
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Mensajes" value={stats.mensajesUltimos30d} tone="purple" />
        <StatCard label="Citas" value={stats.citasUltimos30d} tone="green" delay={0.05} />
        <StatCard label="Negocios activos" value={stats.activos} delay={0.1} />
        <StatCard label="Altas" value={stats.nuevos30d} tone="purple" delay={0.15} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <div className="bg-bg-card border-[0.5px] border-line-subtle rounded-xl p-4">
          <h3 className="text-[14px] font-medium text-white mb-3">Mensajes por día</h3>
          <div className="h-[240px]">
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid stroke={COLORS.grid} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#8A8A8A", fontSize: 10 }}
                  axisLine={{ stroke: COLORS.grid }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#8A8A8A", fontSize: 10 }}
                  axisLine={{ stroke: COLORS.grid }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#111",
                    border: "0.5px solid #1e1e1e",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="mensajes" fill={COLORS.purple} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-bg-card border-[0.5px] border-line-subtle rounded-xl p-4">
          <h3 className="text-[14px] font-medium text-white mb-3">Citas por día</h3>
          <div className="h-[240px]">
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid stroke={COLORS.grid} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#8A8A8A", fontSize: 10 }}
                  axisLine={{ stroke: COLORS.grid }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#8A8A8A", fontSize: 10 }}
                  axisLine={{ stroke: COLORS.grid }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#111",
                    border: "0.5px solid #1e1e1e",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="citas"
                  stroke={COLORS.green}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-bg-card border-[0.5px] border-line-subtle rounded-xl p-4">
          <h3 className="text-[14px] font-medium text-white mb-3">Tokens DeepSeek</h3>
          <div className="h-[240px]">
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid stroke={COLORS.grid} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#8A8A8A", fontSize: 10 }}
                  axisLine={{ stroke: COLORS.grid }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#8A8A8A", fontSize: 10 }}
                  axisLine={{ stroke: COLORS.grid }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#111",
                    border: "0.5px solid #1e1e1e",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="tokens"
                  stroke={COLORS.purpleLight}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-bg-card border-[0.5px] border-line-subtle rounded-xl p-4">
          <h3 className="text-[14px] font-medium text-white mb-3">Distribución por plan</h3>
          {planDistribution.length === 0 ? (
            <p className="text-[13px] text-ink-muted">Sin datos.</p>
          ) : (
            <div className="h-[240px]">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={planDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {planDistribution.map((e) => (
                      <Cell key={e.name} fill={e.color} stroke="#0a0a0a" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#111",
                      border: "0.5px solid #1e1e1e",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <ul className="flex flex-wrap gap-3 mt-3 justify-center">
            {planDistribution.map((e) => (
              <li key={e.name} className="flex items-center gap-2 text-[12px] text-ink-secondary">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: e.color }} />
                {e.name} · {e.value}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
