"use client";

import { useMemo, useState } from "react";
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
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";
import { StatCard } from "./StatCard";
import { IconDownload } from "../icons/Icons";
import type { Cita, Cliente } from "@/lib/supabase/database.types";
import {
  currencySymbol,
  formatPrice,
  zonedDateKey,
  formatDayInZone,
} from "@/lib/timezone";

type Props = {
  citas: Cita[];
  clientes: Cliente[];
  tz: string;
  moneda: string;
};

type PeriodKey = "7d" | "30d" | "90d" | "180d";
const PERIODS: Array<{ key: PeriodKey; label: string; days: number }> = [
  { key: "7d", label: "7 días", days: 7 },
  { key: "30d", label: "30 días", days: 30 },
  { key: "90d", label: "90 días", days: 90 },
  { key: "180d", label: "6 meses", days: 180 },
];

const COLORS = {
  purple: "#2E8F66",
  purpleLight: "#7FC9A6",
  green: "#5BB96A",
  yellow: "#BA7517",
  red: "#A32D2D",
  grid: "#1e1e1e",
};

export function Informes({ citas, clientes, tz, moneda }: Props) {
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  const { start, end, label } = useMemo(() => {
    const cfg = PERIODS.find((p) => p.key === period)!;
    const e = new Date();
    const s = new Date(e.getTime() - cfg.days * 24 * 60 * 60 * 1000);
    return { start: s, end: e, label: cfg.label };
  }, [period]);

  const filtered = useMemo(
    () =>
      citas.filter((c) => {
        const t = new Date(c.inicio).getTime();
        return t >= start.getTime() && t <= end.getTime();
      }),
    [citas, start, end],
  );

  const metrics = useMemo(() => {
    const confirmadas = filtered.filter((c) => c.estado !== "cancelada").length;
    const completadas = filtered.filter((c) => c.estado === "completada").length;
    const canceladas = filtered.filter((c) => c.estado === "cancelada").length;
    const ingresos = filtered
      .filter((c) => c.estado === "completada")
      .reduce((s, c) => s + Number(c.precio || 0), 0);
    const nuevosClientes = clientes.filter((c) => {
      const t = new Date(c.created_at).getTime();
      return t >= start.getTime() && t <= end.getTime();
    }).length;
    const tasaCompletadas = filtered.length > 0 ? Math.round((completadas / filtered.length) * 100) : 0;
    const ticketMedio = completadas > 0 ? ingresos / completadas : 0;
    return { total: filtered.length, confirmadas, completadas, canceladas, ingresos, nuevosClientes, tasaCompletadas, ticketMedio };
  }, [filtered, clientes, start, end]);

  const byDay = useMemo(() => {
    const map = new Map<string, { key: string; label: string; total: number; ingresos: number }>();
    const cfg = PERIODS.find((p) => p.key === period)!;
    for (let i = cfg.days - 1; i >= 0; i--) {
      const d = new Date(end.getTime() - i * 24 * 60 * 60 * 1000);
      const key = zonedDateKey(d, tz);
      map.set(key, { key, label: formatDayInZone(d, tz), total: 0, ingresos: 0 });
    }
    for (const c of filtered) {
      const key = zonedDateKey(new Date(c.inicio), tz);
      const row = map.get(key);
      if (!row) continue;
      row.total += 1;
      if (c.estado === "completada") row.ingresos += Number(c.precio || 0);
    }
    return Array.from(map.values());
  }, [filtered, end, period, tz]);

  const byService = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of filtered) {
      const key = c.servicio || "Sin servicio";
      map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filtered]);

  const byEstado = useMemo(() => {
    return [
      { name: "Completada", value: metrics.completadas, color: COLORS.green },
      {
        name: "Confirmada",
        value: metrics.confirmadas - metrics.completadas,
        color: COLORS.purple,
      },
      { name: "Cancelada", value: metrics.canceladas, color: COLORS.red },
    ].filter((x) => x.value > 0);
  }, [metrics]);

  async function download() {
    setDownloading(true);
    try {
      const res = await fetch(
        `/api/export/excel?period=${period}`,
        { method: "GET" },
      );
      if (!res.ok) {
        toast("error", "No se pudo generar el informe");
        return;
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") || "";
      const m = cd.match(/filename="?([^";]+)/);
      const filename = m?.[1] || `agendalix-informe-${period}.xlsx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex p-1 bg-bg-card border-[0.5px] border-line-subtle rounded-lg">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 h-9 rounded-md text-[12px] ${
                period === p.key ? "bg-purple text-white" : "text-ink-secondary"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <Button onClick={download} loading={downloading}>
            <IconDownload size={16} />
            Descargar Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Citas totales" value={metrics.total} />
        <StatCard label="Completadas" value={metrics.completadas} tone="green" />
        <StatCard label="Canceladas" value={metrics.canceladas} tone="red" />
        <StatCard
          label="Tasa completadas"
          value={metrics.tasaCompletadas}
          suffix="%"
          tone={metrics.tasaCompletadas >= 70 ? "green" : metrics.tasaCompletadas >= 40 ? "yellow" : "red"}
        />
        <StatCard
          label="Ticket medio"
          value={formatPrice(metrics.ticketMedio, moneda)}
          tone="purple"
        />
        <StatCard
          label="Ingresos totales"
          value={formatPrice(metrics.ingresos, moneda)}
          tone="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-bg-card border-[0.5px] border-line-subtle rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-medium text-white">Citas por día</h3>
            <span className="text-[11px] text-ink-muted">{label}</span>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer>
              <BarChart data={byDay}>
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
                  labelStyle={{ color: "#ddd" }}
                />
                <Bar dataKey="total" fill={COLORS.purple} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-bg-card border-[0.5px] border-line-subtle rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-medium text-white">
              Ingresos ({currencySymbol(moneda)})
            </h3>
            <span className="text-[11px] text-ink-muted">{label}</span>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer>
              <LineChart data={byDay}>
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
                  formatter={(v: number) => formatPrice(v, moneda)}
                />
                <Line
                  type="monotone"
                  dataKey="ingresos"
                  stroke={COLORS.purpleLight}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-bg-card border-[0.5px] border-line-subtle rounded-xl p-4">
          <h3 className="text-[14px] font-medium text-white mb-3">Servicios más reservados</h3>
          {byService.length === 0 ? (
            <p className="text-[13px] text-ink-muted">Sin datos en este período.</p>
          ) : (
            <div className="h-[240px]">
              <ResponsiveContainer>
                <BarChart data={byService} layout="vertical">
                  <CartesianGrid stroke={COLORS.grid} horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: "#8A8A8A", fontSize: 10 }}
                    axisLine={{ stroke: COLORS.grid }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "#ddd", fontSize: 11 }}
                    axisLine={{ stroke: COLORS.grid }}
                    tickLine={false}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#111",
                      border: "0.5px solid #1e1e1e",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" fill={COLORS.purple} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-bg-card border-[0.5px] border-line-subtle rounded-xl p-4">
          <h3 className="text-[14px] font-medium text-white mb-3">Estado de las citas</h3>
          {byEstado.length === 0 ? (
            <p className="text-[13px] text-ink-muted">Sin datos en este período.</p>
          ) : (
            <div className="h-[240px] flex items-center justify-center">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={byEstado}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {byEstado.map((e) => (
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
            {byEstado.map((e) => (
              <li key={e.name} className="flex items-center gap-2 text-[12px] text-ink-secondary">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: e.color }} />
                {e.name} · {e.value}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="text-[12px] text-ink-muted">
        {metrics.nuevosClientes} clientes nuevos en este período.
      </div>
    </div>
  );
}
