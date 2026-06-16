export const TIMEZONES: Array<{ value: string; label: string }> = [
  { value: "Europe/Madrid", label: "España (Europe/Madrid)" },
  { value: "Europe/Lisbon", label: "Portugal (Europe/Lisbon)" },
  { value: "Europe/London", label: "Reino Unido (Europe/London)" },
  { value: "America/Mexico_City", label: "México (America/Mexico_City)" },
  { value: "America/Bogota", label: "Colombia (America/Bogota)" },
  { value: "America/Lima", label: "Perú (America/Lima)" },
  { value: "America/Santiago", label: "Chile (America/Santiago)" },
  { value: "America/Argentina/Buenos_Aires", label: "Argentina (Buenos Aires)" },
  { value: "America/Montevideo", label: "Uruguay (America/Montevideo)" },
  { value: "America/New_York", label: "EE.UU. Este (America/New_York)" },
  { value: "America/Los_Angeles", label: "EE.UU. Oeste (America/Los_Angeles)" },
];

export const CURRENCIES: Array<{ value: string; label: string; symbol: string }> = [
  { value: "EUR", label: "Euro (€)", symbol: "€" },
  { value: "USD", label: "Dólar EE.UU. ($)", symbol: "$" },
  { value: "GBP", label: "Libra (£)", symbol: "£" },
  { value: "MXN", label: "Peso mexicano (MX$)", symbol: "MX$" },
  { value: "COP", label: "Peso colombiano (COL$)", symbol: "COL$" },
  { value: "PEN", label: "Sol peruano (S/)", symbol: "S/" },
  { value: "CLP", label: "Peso chileno (CLP$)", symbol: "CLP$" },
  { value: "ARS", label: "Peso argentino (AR$)", symbol: "AR$" },
  { value: "UYU", label: "Peso uruguayo ($U)", symbol: "$U" },
];

export const TIMEZONE_CURRENCY: Record<string, string> = {
  "Europe/Madrid": "EUR",
  "Europe/Lisbon": "EUR",
  "Europe/London": "GBP",
  "America/Mexico_City": "MXN",
  "America/Bogota": "COP",
  "America/Lima": "PEN",
  "America/Santiago": "CLP",
  "America/Argentina/Buenos_Aires": "ARS",
  "America/Montevideo": "UYU",
  "America/New_York": "USD",
  "America/Los_Angeles": "USD",
};

export function currencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.value === code)?.symbol || code;
}

export function formatPhone(raw: string): string {
  // Strip WhatsApp JID suffixes (@s.whatsapp.net, @lid, @c.us, etc.)
  const digits = raw.split("@")[0].replace(/\D/g, "");
  if (!digits) return raw;
  // Spanish with country code: 34 + 9 digits = 11 digits total
  if (digits.startsWith("34") && digits.length === 11) {
    const n = digits.slice(2);
    return `+34 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
  }
  // Spanish 9-digit mobile (6xx, 7xx, 8xx, 9xx) without country code
  if (digits.length === 9 && /^[6-9]/.test(digits)) {
    return `+34 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return `+${digits}`;
}

export function formatPrice(amount: number | null | undefined, code: string): string {
  if (amount === null || amount === undefined || !Number.isFinite(Number(amount))) return "-";
  try {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `${amount} ${code}`;
  }
}

export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function isValidCurrency(code: string): boolean {
  return CURRENCIES.some((c) => c.value === code);
}

// ─── Zone-aware date utilities ──────────────────────────────
// These return Date objects whose UTC fields represent the zoned local time.
// Use getUTC* methods on the returned Date to read local components.

type Parts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function partsInZone(d: Date, tz: string): Parts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const byType: Record<string, string> = {};
  for (const p of fmt.formatToParts(d)) byType[p.type] = p.value;
  const hour = byType.hour === "24" ? 0 : Number(byType.hour);
  return {
    year: Number(byType.year),
    month: Number(byType.month),
    day: Number(byType.day),
    hour,
    minute: Number(byType.minute),
    second: Number(byType.second),
  };
}

export function zonedNow(tz: string, now = new Date()): Parts {
  return partsInZone(now, tz);
}

/**
 * Convert a local wall-clock time in `tz` to the UTC Date instant.
 * Uses the offset at that exact instant, so DST transitions resolve correctly.
 */
export function zonedToUTC(tz: string, opts: { year: number; month: number; day: number; hour: number; minute: number }): Date {
  const guess = Date.UTC(opts.year, opts.month - 1, opts.day, opts.hour, opts.minute, 0);
  const p = partsInZone(new Date(guess), tz);
  const actual = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const offsetMs = guess - actual;
  return new Date(guess + offsetMs);
}

export function formatDateTimeInZone(iso: string | Date, tz: string, locale = "es-ES"): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat(locale, {
    timeZone: tz,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatTimeInZone(iso: string | Date, tz: string, locale = "es-ES"): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat(locale, {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatDayInZone(iso: string | Date, tz: string, locale = "es-ES"): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat(locale, {
    timeZone: tz,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
}

export function startOfDayInZone(tz: string, now = new Date()): Date {
  const p = partsInZone(now, tz);
  return zonedToUTC(tz, { year: p.year, month: p.month, day: p.day, hour: 0, minute: 0 });
}

export function endOfDayInZone(tz: string, now = new Date()): Date {
  const d = startOfDayInZone(tz, now);
  return new Date(d.getTime() + 24 * 60 * 60 * 1000 - 1);
}

export function addDaysInZone(tz: string, d: Date, days: number): Date {
  const p = partsInZone(d, tz);
  return zonedToUTC(tz, {
    year: p.year,
    month: p.month,
    day: p.day + days,
    hour: p.hour,
    minute: p.minute,
  });
}

const DAY_KEYS = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"] as const;
export type DayKey = (typeof DAY_KEYS)[number];

export function dayKeyInZone(d: Date, tz: string): DayKey {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
  });
  const wd = fmt.format(d).toLowerCase();
  const map: Record<string, DayKey> = { sun: "dom", mon: "lun", tue: "mar", wed: "mie", thu: "jue", fri: "vie", sat: "sab" };
  return map[wd] || "lun";
}

export function zonedDateKey(d: Date, tz: string): string {
  const p = partsInZone(d, tz);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}
