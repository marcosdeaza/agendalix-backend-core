import type { Negocio } from "./supabase/database.types";

const DAY_MS = 24 * 3600 * 1000;

/** Días restantes de prueba (null si el negocio ya tiene suscripción o no es trial). */
export function trialDaysLeft(n: Negocio): number | null {
  if (n.plan !== "trial" || n.stripe_subscription_id || !n.trial_ends_at) return null;
  return Math.ceil((new Date(n.trial_ends_at).getTime() - Date.now()) / DAY_MS);
}

/** Prueba caducada y sin suscripción → el panel muestra el paywall. */
export function isTrialExpired(n: Negocio): boolean {
  const left = trialDaysLeft(n);
  return left !== null && left <= 0;
}
