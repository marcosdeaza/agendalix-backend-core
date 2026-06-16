import type { Plan } from "./supabase/database.types";

export type Feature =
  | "informes_avanzados"
  | "whatsapp_ilimitado"
  | "ia_personalizada"
  | "soporte_prioritario";

const FEATURES: Record<Plan, Feature[]> = {
  trial: [],
  basico: [],
  pro: ["informes_avanzados", "whatsapp_ilimitado", "ia_personalizada"],
  clinica: ["informes_avanzados", "whatsapp_ilimitado", "ia_personalizada", "soporte_prioritario"],
};

export function hasFeature(plan: Plan, feature: Feature): boolean {
  return FEATURES[plan].includes(feature);
}

export const UPGRADE_TARGET: Record<Plan, Plan | null> = {
  trial: "pro",
  basico: "pro",
  pro: "clinica",
  clinica: null,
};

export const PLAN_LABELS: Record<Plan, string> = {
  trial: "Prueba",
  basico: "Básico",
  pro: "Pro",
  clinica: "Clínica",
};

export const PLAN_PRICES: Record<Plan, string> = {
  trial: "Gratis",
  basico: "39€/mes",
  pro: "79€/mes",
  clinica: "129€/mes",
};

export const PLAN_FEATURES_LIST: Record<Plan, string[]> = {
  trial: ["Bot de WhatsApp básico", "Hasta 50 citas/mes", "Panel de gestión"],
  basico: ["Bot de WhatsApp", "Hasta 200 citas/mes", "Panel de gestión", "Lista de espera"],
  pro: ["Citas ilimitadas", "IA personalizada", "Informes avanzados", "WhatsApp ilimitado", "Multi-profesional"],
  clinica: ["Todo en Pro", "Soporte prioritario", "Onboarding personalizado", "Exportación completa"],
};
