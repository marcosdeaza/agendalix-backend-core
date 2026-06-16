import type { AgenteConfig, Cita, HorarioDia, Horarios } from "./supabase/database.types";
import {
  addDaysInZone,
  dayKeyInZone,
  formatDateTimeInZone,
  startOfDayInZone,
  zonedDateKey,
  zonedNow,
  zonedToUTC,
} from "./timezone";

export function parseHHMM(s: string): [number, number] {
  const [h, m] = (s || "").split(":").map((x) => parseInt(x, 10));
  return [Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0];
}

export function horarioFor(config: AgenteConfig, date: Date, tz: string): HorarioDia | null {
  const k = dayKeyInZone(date, tz);
  const h = config.horarios?.[k as keyof Horarios];
  return h?.abierto ? h : null;
}

export function isDayClosed(config: AgenteConfig, date: Date, tz: string): boolean {
  if ((config.dias_cierre || []).includes(zonedDateKey(date, tz))) return true;
  const k = dayKeyInZone(date, tz);
  const h = config.horarios?.[k as keyof Horarios];
  return !h?.abierto;
}

function withLocalTime(date: Date, tz: string, hhmm: string): Date {
  const p = zonedNow(tz, date);
  const [h, m] = parseHHMM(hhmm);
  return zonedToUTC(tz, { year: p.year, month: p.month, day: p.day, hour: h, minute: m });
}

export function addMinutes(d: Date, min: number): Date {
  return new Date(d.getTime() + min * 60000);
}

export type SlotCheckResult = {
  available: boolean;
  reason?: "cerrado" | "fuera_horario" | "solapado";
  alternatives: Date[];
};

export function checkSlot(opts: {
  config: AgenteConfig;
  citas: Cita[];
  profesional?: string | null;
  start: Date;
  durationMin: number;
  tz: string;
}): SlotCheckResult {
  const reason = reasonUnavailable(opts);
  if (!reason) return { available: true, alternatives: [] };
  return {
    available: false,
    reason,
    alternatives: nextAvailableSlots({ ...opts, maxResults: 5 }),
  };
}

function reasonUnavailable(opts: {
  config: AgenteConfig;
  citas: Cita[];
  profesional?: string | null;
  start: Date;
  durationMin: number;
  tz: string;
}): "cerrado" | "fuera_horario" | "solapado" | null {
  if (isDayClosed(opts.config, opts.start, opts.tz)) return "cerrado";
  const h = horarioFor(opts.config, opts.start, opts.tz);
  if (!h) return "cerrado";
  const openAt = withLocalTime(opts.start, opts.tz, h.apertura);
  const closeAt = withLocalTime(opts.start, opts.tz, h.cierre);
  const end = addMinutes(opts.start, opts.durationMin);
  if (opts.start < openAt || end > closeAt) return "fuera_horario";
  if (overlapsAnyCita(opts.citas, opts.start, end, opts.profesional)) return "solapado";
  return null;
}

function overlapsAnyCita(
  citas: Cita[],
  start: Date,
  end: Date,
  profesional?: string | null,
): boolean {
  const s = start.getTime();
  const e = end.getTime();
  return citas.some((c) => {
    if (c.estado === "cancelada") return false;
    if (profesional && c.profesional && c.profesional !== profesional) return false;
    const cs = new Date(c.inicio).getTime();
    const ce = new Date(c.fin).getTime();
    return s < ce && e > cs;
  });
}

export function nextAvailableSlots(opts: {
  config: AgenteConfig;
  citas: Cita[];
  profesional?: string | null;
  start: Date;
  durationMin: number;
  maxResults?: number;
  stepMin?: number;
  daysAhead?: number;
  tz: string;
}): Date[] {
  const step = opts.stepMin ?? 30;
  const max = opts.maxResults ?? 5;
  const days = opts.daysAhead ?? 14;
  const out: Date[] = [];
  let cursor = new Date(opts.start);
  const limit = addDaysInZone(opts.tz, opts.start, days);

  while (cursor <= limit && out.length < max) {
    if (!isDayClosed(opts.config, cursor, opts.tz)) {
      const h = horarioFor(opts.config, cursor, opts.tz);
      if (h) {
        const openAt = withLocalTime(cursor, opts.tz, h.apertura);
        const closeAt = withLocalTime(cursor, opts.tz, h.cierre);
        if (cursor < openAt) cursor = new Date(openAt);
        // Round up to step boundary
        const cursorMin = new Date(cursor).getMinutes();
        const remainder = cursorMin % step;
        if (remainder !== 0) {
          cursor = new Date(cursor.getTime() + (step - remainder) * 60000);
        }
        while (cursor < closeAt && out.length < max) {
          const end = addMinutes(cursor, opts.durationMin);
          if (end > closeAt) break;
          if (!overlapsAnyCita(opts.citas, cursor, end, opts.profesional)) {
            out.push(new Date(cursor));
          }
          cursor = new Date(cursor.getTime() + step * 60000);
        }
      }
    }
    // Advance to the next day start in the negocio's timezone
    const next = startOfDayInZone(opts.tz, addDaysInZone(opts.tz, cursor, 1));
    if (next <= cursor) break;
    cursor = next;
  }
  return out;
}

export function formatSlotInZone(d: Date, tz: string): string {
  return formatDateTimeInZone(d, tz);
}

export function todaysOpenSlots(
  config: AgenteConfig,
  citas: Cita[],
  tz: string,
  now = new Date(),
): Date[] {
  return nextAvailableSlots({
    config,
    citas,
    start: now,
    durationMin: config.duracion_cita_default || 60,
    maxResults: 6,
    stepMin: 30,
    daysAhead: 1,
    tz,
  }).filter((d) => zonedDateKey(d, tz) === zonedDateKey(now, tz));
}
