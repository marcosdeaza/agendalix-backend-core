import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyCronAuth } from "@/lib/cron";
import { sendWhatsAppText } from "@/lib/whatsapp";
import type { Cliente, Negocio } from "@/lib/supabase/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Re-engages dormant clients (no visit in 45-90 days, at least 1 past visit).
// Runs daily. Limits each negocio to 20 per day to avoid WhatsApp bans.
const PER_NEGOCIO_DAILY = 20;

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createSupabaseAdminClient();
  const { data: negs } = await admin.from("negocios").select("*").eq("activo", true);
  const negocios = (negs || []) as Negocio[];

  const now = Date.now();
  const minSince = new Date(now - 90 * 24 * 3600 * 1000).toISOString();
  const maxSince = new Date(now - 45 * 24 * 3600 * 1000).toISOString();

  let totalSent = 0;
  const errors: Array<{ negocio: string; error: string }> = [];

  for (const neg of negocios) {
    try {
      const { data: clientes } = await admin
        .from("clientes")
        .select("*")
        .eq("negocio_id", neg.id)
        .gte("ultima_visita", minSince)
        .lte("ultima_visita", maxSince)
        .gt("total_visitas", 0)
        .order("ultima_visita", { ascending: true })
        .limit(PER_NEGOCIO_DAILY);

      const list = (clientes || []) as Cliente[];
      for (const cli of list) {
        try {
          // Skip if we already have an active future cita for this cliente
          const { data: future } = await admin
            .from("citas")
            .select("id")
            .eq("cliente_id", cli.id)
            .in("estado", ["confirmada", "pendiente"])
            .gte("inicio", new Date().toISOString())
            .limit(1);
          if (future && future.length > 0) continue;

          const first = (cli.nombre || "").split(" ")[0];
          const text = `Hola${first ? ` ${first}` : ""}! Hace tiempo que no nos vemos por ${neg.nombre}. ¿Te reservamos un hueco esta semana? Respóndenos y buscamos horario.`;

          await sendWhatsAppText(cli.telefono, text, "neg_" + neg.id);
          totalSent += 1;

          const fecha = new Date().toISOString().slice(0, 10);
          const { data: uso } = await admin
            .from("uso")
            .select("*")
            .eq("negocio_id", neg.id)
            .eq("fecha", fecha)
            .maybeSingle();
          if (uso) {
            await admin
              .from("uso")
              .update({ recuperacion_enviados: (uso.recuperacion_enviados || 0) + 1 })
              .eq("id", uso.id);
          } else {
            await admin
              .from("uso")
              .insert({ negocio_id: neg.id, fecha, recuperacion_enviados: 1 });
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "error";
          errors.push({ negocio: neg.id, error: `${cli.id}:${msg}` });
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "error";
      errors.push({ negocio: neg.id, error: msg });
    }
  }

  return NextResponse.json({ ok: true, sent: totalSent, errors });
}
