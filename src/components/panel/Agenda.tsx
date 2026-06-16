"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { SlideOver } from "../ui/SlideOver";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { useToast } from "../ui/Toast";
import { IconChevronLeft, IconChevronRight } from "../icons/Icons";
import type { Cita, Cliente, Profesional } from "@/lib/supabase/database.types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatPrice, formatPhone } from "@/lib/timezone";

type Props = {
  initialCitas: Cita[];
  clientes: Cliente[];
  profesionales: Profesional[];
  tz: string;
  moneda: string;
  negocioId: string;
};

const TIME_START = 8;
const TIME_END = 22;
const SLOT_MIN = 30;

function hoursMinutesInTz(d: Date, tz: string): { hours: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const byType: Record<string, string> = {};
  for (const x of parts) byType[x.type] = x.value;
  const h = byType.hour === "24" ? 0 : Number(byType.hour);
  return { hours: h, minutes: Number(byType.minute) };
}

function ymdInTz(d: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const byType: Record<string, string> = {};
  for (const x of parts) byType[x.type] = x.value;
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function estadoTone(e: Cita["estado"]): { bg: string; border: string; text: string } {
  if (e === "confirmada") return { bg: "rgba(46,143,102,0.18)", border: "#2E8F66", text: "#7FC9A6" };
  if (e === "pendiente") return { bg: "rgba(186,117,23,0.18)", border: "#BA7517", text: "#F2B560" };
  if (e === "completada") return { bg: "rgba(91,185,106,0.15)", border: "#5BB96A", text: "#8CE9A3" };
  return { bg: "rgba(85,85,85,0.18)", border: "#555", text: "#888" };
}

export function Agenda({ initialCitas, clientes, profesionales, tz, moneda, negocioId }: Props) {
  const [citas, setCitas] = useState(initialCitas);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [view, setView] = useState<"week" | "day">(
    typeof window !== "undefined" && window.innerWidth < 768 ? "day" : "week",
  );
  const [dayOffset, setDayOffset] = useState(0);
  const [filterProf, setFilterProf] = useState<string>("all");
  const [selected, setSelected] = useState<Cita | null>(null);
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 768) setView("day");
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    async function fetchCitas() {
      try {
        const start = new Date(weekStart);
        start.setDate(start.getDate() - 7);
        const end = new Date(weekStart);
        end.setDate(end.getDate() + 42);
        const r = await fetch(
          `/api/panel/citas?start=${start.toISOString()}&end=${end.toISOString()}`,
        );
        if (r.ok) {
          const d = await r.json();
          setCitas(d.citas || []);
        }
      } catch {}
    }

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`citas-${negocioId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "citas", filter: `negocio_id=eq.${negocioId}` },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setCitas((prev) =>
              prev.map((c) => (c.id === (payload.new as Cita).id ? (payload.new as Cita) : c)),
            );
            setSelected((s) => (s && s.id === (payload.new as Cita).id ? (payload.new as Cita) : s));
          } else if (payload.eventType === "INSERT") {
            setCitas((prev) => {
              if (prev.some((c) => c.id === (payload.new as Cita).id)) return prev;
              return [...prev, payload.new as Cita];
            });
          } else if (payload.eventType === "DELETE") {
            setCitas((prev) => prev.filter((c) => c.id !== (payload.old as Cita).id));
            setSelected((s) => (s && s.id === (payload.old as Cita).id ? null : s));
          }
        },
      )
      .subscribe();

    const pollId = setInterval(fetchCitas, 120_000);
    return () => {
      clearInterval(pollId);
      supabase.removeChannel(channel);
    };
  }, [weekStart, negocioId]);

  const timeFmt = useMemo(
    () => new Intl.DateTimeFormat("es-ES", { timeZone: tz, hour: "2-digit", minute: "2-digit" }),
    [tz],
  );
  const weekdayShort = useMemo(
    () => new Intl.DateTimeFormat("es-ES", { timeZone: tz, weekday: "short" }),
    [tz],
  );
  const dayLong = useMemo(
    () => new Intl.DateTimeFormat("es-ES", { timeZone: tz, weekday: "long", day: "numeric", month: "long" }),
    [tz],
  );
  const rangeFmt = useMemo(
    () => new Intl.DateTimeFormat("es-ES", { timeZone: tz, day: "numeric", month: "short" }),
    [tz],
  );

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const slots = useMemo(() => {
    const out: string[] = [];
    for (let h = TIME_START; h < TIME_END; h++) {
      for (let m = 0; m < 60; m += SLOT_MIN) {
        out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    }
    return out;
  }, []);

  const filtered = useMemo(() => {
    if (filterProf === "all") return citas;
    return citas.filter((c) => c.profesional === filterProf);
  }, [citas, filterProf]);

  function citasForDay(d: Date) {
    const key = ymdInTz(d, tz);
    return filtered.filter((c) => ymdInTz(new Date(c.inicio), tz) === key);
  }

  function citaTop(c: Cita): number {
    const { hours, minutes } = hoursMinutesInTz(new Date(c.inicio), tz);
    const total = (hours - TIME_START) * 60 + minutes;
    return (total / SLOT_MIN) * 40;
  }
  function citaHeight(c: Cita): number {
    const s = new Date(c.inicio).getTime();
    const e = new Date(c.fin).getTime();
    const min = Math.max(15, (e - s) / 60000);
    return (min / SLOT_MIN) * 40;
  }

  async function updateEstado(id: string, estado: Cita["estado"]) {
    setCitas((xs) => xs.map((x) => (x.id === id ? { ...x, estado } : x)));
    startTransition(async () => {
      const res = await fetch("/api/panel/citas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, estado }),
      });
      if (!res.ok) {
        toast("error", "No se pudo actualizar la cita");
      } else {
        toast("success", "Cita actualizada");
      }
    });
    setSelected(null);
  }

  async function saveNotas(id: string, notas: string) {
    setCitas((xs) => xs.map((x) => (x.id === id ? { ...x, notas } : x)));
    const res = await fetch("/api/panel/citas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, notas }),
    });
    toast(res.ok ? "success" : "error", res.ok ? "Guardado" : "Error al guardar");
  }

  const dayToShow = view === "day" ? addDays(weekStart, dayOffset) : null;
  const weekLabel = `${rangeFmt.format(weekStart)} – ${rangeFmt.format(addDays(weekStart, 6))}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center bg-bg-card border-[0.5px] border-line-subtle rounded-lg overflow-hidden">
          <button
            onClick={() => (view === "week" ? setWeekStart(addDays(weekStart, -7)) : setDayOffset((d) => d - 1))}
            aria-label="Anterior"
            className="px-3 h-10 hover:bg-bg-card2"
          >
            <IconChevronLeft size={16} />
          </button>
          <button
            onClick={() => {
              setWeekStart(startOfWeek(new Date()));
              setDayOffset(0);
            }}
            className="px-3 h-10 text-[12px] text-ink-secondary hover:text-white border-x-[0.5px] border-line-subtle"
          >
            Hoy
          </button>
          <button
            onClick={() => (view === "week" ? setWeekStart(addDays(weekStart, 7)) : setDayOffset((d) => d + 1))}
            aria-label="Siguiente"
            className="px-3 h-10 hover:bg-bg-card2"
          >
            <IconChevronRight size={16} />
          </button>
        </div>
        <div className="text-[13px] text-white font-medium">
          {view === "week" ? weekLabel : dayToShow ? dayLong.format(dayToShow) : ""}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="inline-flex p-1 bg-bg-card border-[0.5px] border-line-subtle rounded-lg">
            <button
              onClick={() => setView("week")}
              className={`px-3 h-8 rounded-md text-[12px] ${view === "week" ? "bg-purple text-white" : "text-ink-secondary"}`}
            >
              Semana
            </button>
            <button
              onClick={() => setView("day")}
              className={`px-3 h-8 rounded-md text-[12px] ${view === "day" ? "bg-purple text-white" : "text-ink-secondary"}`}
            >
              Día
            </button>
          </div>
          {profesionales.length > 0 ? (
            <select
              value={filterProf}
              onChange={(e) => setFilterProf(e.target.value)}
              className="bg-bg-card border-[0.5px] border-line-subtle rounded-lg h-10 px-3 text-[12px] text-white focus:outline-none focus:border-purple"
            >
              <option value="all">Todos</option>
              {profesionales.map((p) => (
                <option key={p.id} value={p.nombre}>
                  {p.nombre}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </div>

      <div className="bg-bg-card border-[0.5px] border-line-subtle rounded-xl overflow-hidden">
        {view === "week" ? (
          <div className="hidden md:grid" style={{ gridTemplateColumns: "60px repeat(7, minmax(0,1fr))" }}>
            <div className="h-12 border-b-[0.5px] border-line-subtle" />
            {days.map((d) => {
              const isToday = ymdInTz(new Date(), tz) === ymdInTz(d, tz);
              return (
                <div
                  key={d.toISOString()}
                  className="h-12 border-b-[0.5px] border-l-[0.5px] border-line-subtle flex items-center justify-center gap-2"
                >
                  <span className={`text-[12px] ${isToday ? "text-purple" : "text-ink-secondary"}`}>
                    {weekdayShort.format(d)}
                  </span>
                  <span className={`text-[13px] font-medium ${isToday ? "text-purple" : "text-white"}`}>{d.getDate()}</span>
                </div>
              );
            })}

            <div className="relative">
              {slots.map((t) => (
                <div
                  key={t}
                  className="h-10 border-b-[0.5px] border-line-subtle flex items-start justify-end pr-2 pt-1 text-[10px] text-ink-muted"
                >
                  {t.endsWith(":00") ? t : ""}
                </div>
              ))}
            </div>

            {days.map((d) => (
              <div key={d.toISOString()} className="relative border-l-[0.5px] border-line-subtle">
                {slots.map((t) => (
                  <div key={t} className="h-10 border-b-[0.5px] border-line-subtle" />
                ))}
                {citasForDay(d).map((c) => {
                  const tone = estadoTone(c.estado);
                  const cli = clientes.find((cl) => cl.id === c.cliente_id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelected(c)}
                      className="absolute left-1 right-1 rounded-md text-left px-2 py-1 hover:brightness-125 transition text-[11px] overflow-hidden"
                      style={{
                        top: citaTop(c),
                        height: citaHeight(c),
                        background: tone.bg,
                        border: `0.5px solid ${tone.border}`,
                        color: tone.text,
                      }}
                    >
                      <div className="font-medium truncate">{cli?.nombre || (cli?.telefono ? formatPhone(cli.telefono) : "Cliente")}</div>
                      <div className="truncate opacity-80">{c.servicio || ""}</div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        ) : null}

        <div className={view === "day" ? "block" : "md:hidden"}>
          <DayView
            day={view === "day" ? (dayToShow as Date) : new Date()}
            citas={view === "day" ? citasForDay(dayToShow as Date) : citasForDay(new Date())}
            clientes={clientes}
            timeFmt={timeFmt}
            onSelect={setSelected}
            onSwipe={(dir) => setDayOffset((d) => d + dir)}
          />
        </div>
      </div>

      <SlideOver open={!!selected} onClose={() => setSelected(null)} title="Detalle de cita">
        {selected ? (
          <CitaDetail
            cita={selected}
            clientes={clientes}
            tz={tz}
            moneda={moneda}
            onEstado={updateEstado}
            onNotas={saveNotas}
          />
        ) : null}
      </SlideOver>
    </div>
  );
}

function DayView({
  day,
  citas,
  clientes,
  timeFmt,
  onSelect,
  onSwipe,
}: {
  day: Date;
  citas: Cita[];
  clientes: Cliente[];
  timeFmt: Intl.DateTimeFormat;
  onSelect: (c: Cita) => void;
  onSwipe: (dir: 1 | -1) => void;
}) {
  void day;
  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.12}
      onDragEnd={(_, info) => {
        if (info.offset.x > 80) onSwipe(-1);
        else if (info.offset.x < -80) onSwipe(1);
      }}
      className="min-h-[400px] p-3"
    >
      {citas.length === 0 ? (
        <div className="text-[13px] text-ink-muted text-center py-16">Sin citas este día.</div>
      ) : (
        <ul className="flex flex-col gap-2">
          {citas.map((c) => {
            const tone = estadoTone(c.estado);
            const cli = clientes.find((cl) => cl.id === c.cliente_id);
            return (
              <li key={c.id}>
                <button
                  onClick={() => onSelect(c)}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-3 hover:brightness-125 transition text-left"
                  style={{ background: tone.bg, border: `0.5px solid ${tone.border}` }}
                >
                  <div className="text-[12px] font-medium w-14" style={{ color: tone.text }}>
                    {timeFmt.format(new Date(c.inicio))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-white truncate">{cli?.nombre || (cli?.telefono ? formatPhone(cli.telefono) : "Cliente")}</p>
                    <p className="text-[11px] text-ink-muted truncate">
                      {c.servicio || ""} · {c.profesional || "—"}
                    </p>
                  </div>
                  <Badge
                    tone={
                      c.estado === "cancelada"
                        ? "red"
                        : c.estado === "completada"
                          ? "green"
                          : c.estado === "pendiente"
                            ? "yellow"
                            : "purple"
                    }
                  >
                    {c.estado}
                  </Badge>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
}

function CitaDetail({
  cita,
  clientes,
  tz,
  moneda,
  onEstado,
  onNotas,
}: {
  cita: Cita;
  clientes: Cliente[];
  tz: string;
  moneda: string;
  onEstado: (id: string, e: Cita["estado"]) => void;
  onNotas: (id: string, n: string) => void;
}) {
  const [notas, setNotas] = useState(cita.notas || "");
  const cli = clientes.find((c) => c.id === cita.cliente_id);
  const f = new Intl.DateTimeFormat("es-ES", {
    timeZone: tz,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[11px] tracking-[0.14em] uppercase text-ink-muted mb-1">Cliente</p>
        <p className="text-[15px] text-white">{cli?.nombre || "—"}</p>
        <p className="text-[12px] text-ink-muted">{cli?.telefono || ""}</p>
      </div>
      <div>
        <p className="text-[11px] tracking-[0.14em] uppercase text-ink-muted mb-1">Cuándo</p>
        <p className="text-[14px] text-white">{f.format(new Date(cita.inicio))}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] tracking-[0.14em] uppercase text-ink-muted mb-1">Servicio</p>
          <p className="text-[14px] text-white">{cita.servicio || "—"}</p>
        </div>
        <div>
          <p className="text-[11px] tracking-[0.14em] uppercase text-ink-muted mb-1">Profesional</p>
          <p className="text-[14px] text-white">{cita.profesional || "—"}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] tracking-[0.14em] uppercase text-ink-muted mb-1">Estado</p>
          <Badge
            tone={
              cita.estado === "cancelada"
                ? "red"
                : cita.estado === "completada"
                  ? "green"
                  : cita.estado === "pendiente"
                    ? "yellow"
                    : "purple"
            }
          >
            {cita.estado}
          </Badge>
        </div>
        <div>
          <p className="text-[11px] tracking-[0.14em] uppercase text-ink-muted mb-1">Precio</p>
          <p className="text-[14px] text-white">{formatPrice(cita.precio, moneda)}</p>
        </div>
      </div>
      <Textarea
        label="Notas"
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
        onBlur={() => onNotas(cita.id, notas)}
      />
      <div className="flex gap-2 mt-2">
        {cita.estado !== "completada" ? (
          <Button variant="secondary" onClick={() => onEstado(cita.id, "completada")}>
            Completar
          </Button>
        ) : null}
        {cita.estado !== "cancelada" ? (
          <Button variant="danger" onClick={() => onEstado(cita.id, "cancelada")}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </div>
  );
}
