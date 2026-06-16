import Link from "next/link";
import {
  getCurrentNegocio,
  getAgenteConfig,
  getCitasRange,
  getConversaciones,
  getClientes,
} from "@/lib/panel-data";
import { StatCard } from "@/components/panel/StatCard";
import { Onboarding } from "@/components/panel/Onboarding";
import { trialDaysLeft } from "@/lib/trial";
import { formatPhone } from "@/lib/timezone";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { IconCalendar, IconUsers, IconEuro, IconChat, IconArrowRight } from "@/components/icons/Icons";
import type { Cita, Cliente, Conversacion } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

function startOfDay(d = new Date()) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d = new Date()) { const x = new Date(d); x.setHours(23,59,59,999); return x; }
function startOfWeek(d = new Date()) {
  const x = startOfDay(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x;
}
function endOfWeek(d = new Date()) {
  const x = startOfWeek(d);
  x.setDate(x.getDate() + 7);
  x.setMilliseconds(-1);
  return x;
}

function fmtTime(iso: string) {
  return new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}
function fmtDayTime(iso: string) {
  return new Intl.DateTimeFormat("es-ES", { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "hace un instante";
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}

function stripForPreview(text: string): string {
  return text.split(String.fromCharCode(42)).join("").split(String.fromCharCode(10)).join(" ").trim();
}

const ESTADO_CONFIG: Record<string, { dot: string; label: string; labelClass: string }> = {
  confirmada:  { dot: "#2E8F66", label: "Confirmada",  labelClass: "text-[#7FC9A6]" },
  pendiente:   { dot: "#BA7517", label: "Pendiente",   labelClass: "text-[#F2B560]" },
  completada:  { dot: "#5BB96A", label: "Completada",  labelClass: "text-[#8CE9A3]" },
  cancelada:   { dot: "#555",    label: "Cancelada",   labelClass: "text-ink-muted" },
};

function statusDot(estado: string) {
  const color = ESTADO_CONFIG[estado]?.dot ?? "#555";
  return <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} aria-hidden="true" />;
}

function fmtEur(n: number, moneda = "EUR") {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: moneda, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
}

export default async function PanelHome({
  searchParams,
}: {
  searchParams?: { billing?: string };
}) {
  const billing = searchParams?.billing;
  const negocio = await getCurrentNegocio();
  if (!negocio) return null;
  const config = await getAgenteConfig(negocio.id);

  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const citasWeek = await getCitasRange(negocio.id, weekStart, weekEnd);
  const citasHoy = citasWeek.filter((c) => {
    const t = new Date(c.inicio);
    return t >= startOfDay(now) && t <= endOfDay(now);
  });

  const clientes = await getClientes(negocio.id);
  const clientesActivos = clientes.filter(
    (c) => c.ultima_visita && Date.now() - new Date(c.ultima_visita).getTime() < 60 * 24 * 3600 * 1000,
  ).length;

  // Real revenue: only completed appointments with a price set
  const ingresosSemanales = citasWeek
    .filter((c) => c.estado === "completada")
    .reduce((s, c) => s + Number(c.precio || 0), 0);

  const ingresosHoy = citasHoy
    .filter((c) => c.estado === "completada")
    .reduce((s, c) => s + Number(c.precio || 0), 0);

  const completadasSemana = citasWeek.filter((c) => c.estado === "completada").length;
  const canceladasSemana = citasWeek.filter((c) => c.estado === "cancelada").length;

  // Next 5 upcoming, non-cancelled
  const nextFive = citasWeek
    .filter((c) => new Date(c.inicio).getTime() >= now.getTime() && c.estado !== "cancelada")
    .slice(0, 5);

  const conversaciones = await getConversaciones(negocio.id);
  const lastFive = conversaciones.slice(0, 5);

  const clienteById = (id: string | null) => (id ? clientes.find((c) => c.id === id) : null);

  const isEmpty = clientes.length === 0 && citasWeek.length === 0 && conversaciones.length === 0;

  const moneda = negocio.moneda || "EUR";
  const diasTrial = trialDaysLeft(negocio);

  return (
    <div className="flex flex-col gap-6">
      {billing === "ok" ? (
        <div className="flex items-center gap-3 rounded-xl border border-[#2E8F6655] bg-[#2E8F6618] px-4 py-3">
          <span className="text-[18px]" aria-hidden="true">✅</span>
          <div>
            <p className="text-[13.5px] text-[#7FC9A6] font-medium">¡Suscripción activada!</p>
            <p className="text-[12.5px] text-ink-secondary mt-0.5">
              El pago se ha completado. Tu asistente sigue trabajando sin interrupción —
              puedes gestionar tu plan cuando quieras desde la insignia del menú lateral.
            </p>
          </div>
        </div>
      ) : billing === "cancel" ? (
        <div className="flex items-center gap-3 rounded-xl border border-[#BA751755] bg-[#BA751714] px-4 py-3">
          <span className="text-[18px]" aria-hidden="true">ℹ️</span>
          <div>
            <p className="text-[13.5px] text-[#F2B560] font-medium">Pago cancelado</p>
            <p className="text-[12.5px] text-ink-secondary mt-0.5">
              No se ha realizado ningún cargo. Puedes retomarlo cuando quieras desde la página de planes.
            </p>
          </div>
        </div>
      ) : null}
      {!negocio.onboarding_completo ? (
        <Onboarding negocioNombre={negocio.nombre} />
      ) : null}
      {diasTrial !== null && diasTrial > 0 && diasTrial <= 7 ? (
        <Link
          href="/panel/plan"
          className="flex items-center justify-between gap-3 rounded-xl border border-[#BA751755] bg-[#BA751714] px-4 py-3 hover:border-[#BA7517] transition-colors"
        >
          <p className="text-[13px] text-[#F2B560]">
            Tu prueba gratuita termina en {diasTrial} {diasTrial === 1 ? "día" : "días"}.
            Elige tu plan para que el asistente no se detenga.
          </p>
          <span className="text-[13px] text-white whitespace-nowrap">Ver planes →</span>
        </Link>
      ) : null}
      <header>
        <h1 className="text-[24px] font-medium text-white">Hola, {negocio.nombre}</h1>
        <p className="text-[13px] text-ink-secondary mt-1">
          Resumen de hoy · {new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" }).format(now)}
        </p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Citas hoy" value={citasHoy.length} icon={<IconCalendar size={18} />} delay={0.02} />
        <StatCard label="Clientes activos" value={clientesActivos} icon={<IconUsers size={18} />} delay={0.06} />
        <StatCard
          label="Ingresos hoy"
          value={fmtEur(ingresosHoy, moneda)}
          icon={<IconEuro size={18} />}
          delay={0.1}
          tone={ingresosHoy > 0 ? "green" : "default"}
        />
        <StatCard
          label="Ingresos esta semana"
          value={fmtEur(ingresosSemanales, moneda)}
          icon={<IconEuro size={18} />}
          delay={0.14}
          tone={ingresosSemanales > 0 ? "purple" : "default"}
        />
      </section>

      {/* Weekly summary row */}
      <section className="grid grid-cols-3 gap-3">
        <div className="bg-bg-card border-[0.5px] border-line-subtle rounded-xl p-4 flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-widest text-ink-muted">Esta semana</span>
          <span className="text-[22px] font-medium text-white">{citasWeek.length}</span>
          <span className="text-[12px] text-ink-secondary">citas totales</span>
        </div>
        <div className="bg-bg-card border-[0.5px] border-line-subtle rounded-xl p-4 flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-widest text-ink-muted">Completadas</span>
          <span className="text-[22px] font-medium text-[#8CE9A3]">{completadasSemana}</span>
          <span className="text-[12px] text-ink-secondary">
            {citasWeek.length > 0
              ? `${Math.round((completadasSemana / citasWeek.length) * 100)}% del total`
              : "sin citas"}
          </span>
        </div>
        <div className="bg-bg-card border-[0.5px] border-line-subtle rounded-xl p-4 flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-widest text-ink-muted">Canceladas</span>
          <span className="text-[22px] font-medium text-[#E08383]">{canceladasSemana}</span>
          <span className="text-[12px] text-ink-secondary">no contabilizan</span>
        </div>
      </section>

      {isEmpty ? (
        <Card>
          <EmptyState
            title="Tu negocio está listo"
            description="Conecta WhatsApp y configura tu agente para empezar a recibir citas automáticas."
            action={
              <Link href="/panel/configuracion" className="inline-flex items-center gap-2 bg-purple text-white text-[13px] font-medium h-10 px-4 rounded-lg hover:bg-purple-dark">
                Configurar agente <IconArrowRight size={16} />
              </Link>
            }
          />
        </Card>
      ) : null}

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-medium text-white">Próximas citas</h2>
            <Link href="/panel/agenda" className="text-[12px] text-purple hover:text-purple-light">Ver todas</Link>
          </div>
          {nextFive.length === 0 ? (
            <EmptyState title="Sin citas próximas" description="Cuando tus clientes reserven, aparecerán aquí." />
          ) : (
            <ul className="divide-y divide-line-subtle -mx-2">
              {nextFive.map((c: Cita) => {
                const cli = clienteById(c.cliente_id);
                const cfg = ESTADO_CONFIG[c.estado] ?? ESTADO_CONFIG.confirmada;
                return (
                  <li key={c.id} className="flex items-center gap-3 px-2 py-3">
                    {statusDot(c.estado)}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-white truncate">{cli?.nombre || (cli?.telefono ? formatPhone(cli.telefono) : "Cliente")}</p>
                      <p className="text-[12px] text-ink-muted truncate">
                        {c.servicio || "-"}{c.profesional ? ` · ${c.profesional}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-[12px] text-ink-secondary whitespace-nowrap">{fmtDayTime(c.inicio)} · {fmtTime(c.inicio)}</span>
                      {c.precio != null && c.precio > 0 ? (
                        <span className="text-[11px] text-[#8CE9A3]">{fmtEur(c.precio, moneda)}</span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-medium text-white">Últimas conversaciones</h2>
            <Link href="/panel/conversaciones" className="text-[12px] text-purple hover:text-purple-light">Ir al chat</Link>
          </div>
          {lastFive.length === 0 ? (
            <EmptyState title="Sin mensajes recientes" description="Aquí verás las conversaciones de WhatsApp con tus clientes." />
          ) : (
            <ul className="divide-y divide-line-subtle -mx-2">
              {lastFive.map((cv: Conversacion) => {
                const msgs = Array.isArray(cv.mensajes) ? cv.mensajes : [];
                const last = msgs[msgs.length - 1];
                const cli = clientes.find((x: Cliente) => x.telefono === cv.cliente_telefono);
                return (
                  <li key={cv.id} className="flex items-center gap-3 px-2 py-3">
                    <div className="w-8 h-8 rounded-full bg-bg-card2 flex items-center justify-center">
                      <IconChat size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-white truncate">{cli?.nombre || cv.cliente_telefono}</p>
                      <p className="text-[12px] text-ink-muted truncate">{last?.text ? stripForPreview(last.text) : "(sin mensajes)"}</p>
                    </div>
                    <span className="text-[11px] text-ink-muted whitespace-nowrap">{timeAgo(cv.updated_at)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
