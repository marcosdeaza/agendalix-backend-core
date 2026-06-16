"use client";

import { StatCard } from "../panel/StatCard";
import type { AdminStats } from "@/lib/admin-data";

type Props = { stats: AdminStats };

function fmtEUR(n: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function AdminDashboard({ stats }: Props) {
  return (
    <div className="px-6 md:px-10 py-10 max-w-[1200px]">
      <header className="mb-8">
        <h1 className="text-[28px] font-medium text-white">Resumen</h1>
        <p className="text-[13px] text-ink-secondary mt-1">
          Estado global de la plataforma en tiempo real.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="MRR" value={fmtEUR(stats.mrrActual)} tone="purple" />
        <StatCard label="Negocios activos" value={stats.activos} tone="green" delay={0.05} />
        <StatCard label="Total negocios" value={stats.totalNegocios} delay={0.1} />
        <StatCard label="Nuevos 30d" value={stats.nuevos30d} tone="purple" delay={0.15} />
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <StatCard label="Plan Básico" value={stats.basico} delay={0.2} />
        <StatCard label="Plan Pro" value={stats.pro} delay={0.25} />
        <StatCard label="Plan Clínica" value={stats.clinica} delay={0.3} />
        <StatCard label="En prueba" value={stats.trial} tone="yellow" delay={0.35} />
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        <StatCard label="Pausados" value={stats.pausados} tone="red" delay={0.4} />
        <StatCard label="Citas 30d" value={stats.citasUltimos30d} delay={0.45} />
        <StatCard label="Mensajes 30d" value={stats.mensajesUltimos30d} delay={0.5} />
      </section>
    </div>
  );
}
