export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function isValidSpanishPhone(raw: string): boolean {
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+34")) return /^\+34[6-9]\d{8}$/.test(cleaned);
  if (cleaned.length === 9) return /^[6-9]\d{8}$/.test(cleaned);
  return /^\+?\d{9,15}$/.test(cleaned);
}

export function isValidHHMM(t: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
}

export const SECTORS = [
  "Peluquería",
  "Barbería",
  "Clínica dental",
  "Fisioterapia",
  "Estética",
  "Psicología",
  "Veterinaria",
  "Yoga & Pilates",
  "Academia",
  "Nutrición",
  "Otro",
] as const;
