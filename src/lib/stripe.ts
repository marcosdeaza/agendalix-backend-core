import Stripe from "stripe";
import type { Plan } from "./supabase/database.types";

let cached: Stripe | null = null;

export function stripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  cached = new Stripe(key, {
    apiVersion: "2024-11-20.acacia",
    typescript: true,
  });
  return cached;
}

export const PLAN_PRICES: Record<Exclude<Plan, "trial">, number> = {
  basico: 39,
  pro: 79,
  clinica: 129,
};

export function priceIdForPlan(plan: Exclude<Plan, "trial">): string {
  switch (plan) {
    case "basico":
      return process.env.STRIPE_PRICE_BASIC || "";
    case "pro":
      return process.env.STRIPE_PRICE_PRO || "";
    case "clinica":
      return process.env.STRIPE_PRICE_CLINICA || "";
  }
}

export function planFromPriceId(priceId: string | null | undefined): Plan | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_BASIC) return "basico";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_CLINICA) return "clinica";
  return null;
}
