import "server-only";
import { createSupabaseAdminClient } from "./supabase/admin";
import type { Negocio, Plan, Uso } from "./supabase/database.types";

// MRR per plan in EUR (mirror of public pricing). Kept here so admin metrics
// reflect the current list prices without coupling to the marketing page.
export const PLAN_PRICE_EUR: Record<Plan, number> = {
  trial: 0,
  basico: 39,
  pro: 79,
  clinica: 129,
};

export function planLabel(p: Plan): string {
  return { trial: "Prueba", basico: "Básico", pro: "Pro", clinica: "Clínica" }[p];
}

export async function getAllNegocios(): Promise<Negocio[]> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("negocios")
    .select("*")
    .order("created_at", { ascending: false });
  return (data || []) as Negocio[];
}

export type AdminStats = {
  totalNegocios: number;
  activos: number;
  pausados: number;
  deBaja: number;
  trial: number;
  basico: number;
  pro: number;
  clinica: number;
  mrrActual: number;
  nuevos30d: number;
  citasUltimos30d: number;
  mensajesUltimos30d: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  const sb = createSupabaseAdminClient();
  const now = new Date();
  const thirtyAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const fechaDesde = thirtyAgo.toISOString().slice(0, 10);

  const [negociosRes, citasRes, usoRes] = await Promise.all([
    sb.from("negocios").select("id, plan, activo, created_at, trial_ends_at"),
    sb
      .from("citas")
      .select("id", { count: "exact", head: true })
      .gte("inicio", thirtyAgo.toISOString()),
    sb.from("uso").select("*").gte("fecha", fechaDesde),
  ]);

  const negocios = (negociosRes.data || []) as Array<
    Pick<Negocio, "id" | "plan" | "activo" | "created_at" | "trial_ends_at">
  >;
  const uso = (usoRes.data || []) as Uso[];

  const activos = negocios.filter((n) => n.activo).length;
  const pausados = negocios.filter((n) => !n.activo).length;
  const trial = negocios.filter((n) => n.plan === "trial").length;
  const basico = negocios.filter((n) => n.plan === "basico").length;
  const pro = negocios.filter((n) => n.plan === "pro").length;
  const clinica = negocios.filter((n) => n.plan === "clinica").length;

  // Customers on a paid plan and still active contribute to MRR.
  const mrrActual = negocios.reduce((acc, n) => {
    if (!n.activo) return acc;
    return acc + PLAN_PRICE_EUR[n.plan];
  }, 0);

  const nuevos30d = negocios.filter((n) => {
    const created = new Date(n.created_at).getTime();
    return created >= thirtyAgo.getTime();
  }).length;

  const mensajesUltimos30d = uso.reduce((acc, u) => acc + (u.mensajes_procesados || 0), 0);

  return {
    totalNegocios: negocios.length,
    activos,
    pausados,
    deBaja: pausados,
    trial,
    basico,
    pro,
    clinica,
    mrrActual,
    nuevos30d,
    citasUltimos30d: citasRes.count || 0,
    mensajesUltimos30d,
  };
}

export type AdminUsoSerie = {
  fecha: string;
  mensajes: number;
  citas: number;
  tokens: number;
};

export async function getAdminUsoSerie(days: number): Promise<AdminUsoSerie[]> {
  const sb = createSupabaseAdminClient();
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const { data } = await sb.from("uso").select("*").gte("fecha", from);
  const rows = (data || []) as Uso[];
  const byDate = new Map<string, AdminUsoSerie>();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    byDate.set(d, { fecha: d, mensajes: 0, citas: 0, tokens: 0 });
  }
  for (const r of rows) {
    const entry = byDate.get(r.fecha);
    if (!entry) continue;
    entry.mensajes += r.mensajes_procesados || 0;
    entry.citas += r.citas_gestionadas || 0;
    entry.tokens += r.tokens_deepseek || 0;
  }
  return Array.from(byDate.values());
}
