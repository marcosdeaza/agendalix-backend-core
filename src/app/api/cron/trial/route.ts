import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyCronAuth } from "@/lib/cron";
import { sendTrialWarningEmail, sendTrialEndedEmail } from "@/lib/resend";
import { insertNotificacion } from "@/lib/notifications";
import type { Negocio } from "@/lib/supabase/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAY_MS = 24 * 3600 * 1000;

// Idempotencia vía email_log: un registro por (hito, negocio) garantiza que
// cada aviso se envía una sola vez aunque el cron se ejecute varias veces.
async function alreadySent(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  scope: string,
): Promise<boolean> {
  const { data } = await admin
    .from("email_log")
    .select("id")
    .eq("scope", scope)
    .limit(1)
    .maybeSingle();
  return !!data;
}

async function markSent(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  scope: string,
  subject: string,
) {
  await admin.from("email_log").insert({
    scope,
    subject,
    body: "(auto · ciclo de trial)",
    recipients_count: 1,
  });
}

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createSupabaseAdminClient();
  const now = Date.now();

  const { data } = await admin
    .from("negocios")
    .select("*")
    .eq("plan", "trial")
    .eq("status", "ACTIVE")
    .is("stripe_subscription_id", null);

  const negocios = (data || []) as Negocio[];
  const result = { avisos7: 0, avisos1: 0, pausados: 0, errores: [] as string[] };

  for (const n of negocios) {
    try {
      if (!n.trial_ends_at) continue;
      const endsAt = new Date(n.trial_ends_at).getTime();
      const daysLeft = Math.ceil((endsAt - now) / DAY_MS);
      const firstName = (n.nombre || "").split(" ")[0] || n.nombre;

      if (daysLeft <= 0 && n.activo) {
        // Prueba terminada → pausa del agente (los datos se conservan)
        await admin.from("negocios").update({ activo: false }).eq("id", n.id);
        const scope = `trial-fin:${n.id}`;
        if (!(await alreadySent(admin, scope))) {
          await sendTrialEndedEmail({ to: n.email, nombre: firstName });
          await markSent(admin, scope, "Trial terminado");
          await insertNotificacion({
            negocioId: n.id,
            titulo: "Tu prueba gratuita ha terminado",
            mensaje: "Elige un plan para reactivar tu asistente. Tus datos siguen guardados.",
            tipo: "sistema",
          });
        }
        result.pausados += 1;
      } else if (daysLeft > 0 && daysLeft <= 1) {
        const scope = `trial-aviso1:${n.id}`;
        if (!(await alreadySent(admin, scope))) {
          await sendTrialWarningEmail({ to: n.email, nombre: firstName, diasRestantes: 1 });
          await markSent(admin, scope, "Aviso trial 1 día");
          await insertNotificacion({
            negocioId: n.id,
            titulo: "Último día de prueba",
            mensaje: "Tu prueba termina mañana. Elige tu plan para no perder el servicio.",
            tipo: "sistema",
          });
          result.avisos1 += 1;
        }
      } else if (daysLeft > 1 && daysLeft <= 7) {
        const scope = `trial-aviso7:${n.id}`;
        if (!(await alreadySent(admin, scope))) {
          await sendTrialWarningEmail({ to: n.email, nombre: firstName, diasRestantes: daysLeft });
          await markSent(admin, scope, "Aviso trial 7 días");
          await insertNotificacion({
            negocioId: n.id,
            titulo: `Te quedan ${daysLeft} días de prueba`,
            mensaje: "Cuando quieras, elige tu plan desde Configuración → Suscripción.",
            tipo: "sistema",
          });
          result.avisos7 += 1;
        }
      }
    } catch (err) {
      console.error("cron/trial negocio", n.id, err);
      result.errores.push(n.id);
    }
  }

  return NextResponse.json({ ok: true, ...result, total: negocios.length });
}
