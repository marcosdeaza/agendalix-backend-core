import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyCronAuth } from "@/lib/cron";
import { sendWhatsAppText } from "@/lib/whatsapp";
import { formatTimeInZone } from "@/lib/timezone";
import type { Cita, Cliente, Negocio, RecordatorioConfig } from "@/lib/supabase/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DEFAULT_RECORDATORIOS: RecordatorioConfig[] = [
  {
    id: "default_24h",
    horasAntes: 24,
    mensaje: "Hola {nombre}! Recordatorio de tu cita en {negocio} mañana a las {hora}{servicio}. ¿Confirmas? Responde SI o CANCELAR.",
    activo: true,
  },
  {
    id: "default_1h",
    horasAntes: 1,
    mensaje: "Hola {nombre}! Tu cita en {negocio} es hoy a las {hora}{servicio}. ¡Te esperamos!",
    activo: true,
  },
];

function buildMessage(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
}

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createSupabaseAdminClient();
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 3600 * 1000).toISOString();
  const windowMs = 30 * 60 * 1000; // ±30 min window per reminder

  const { data: configs } = await admin.from("agente_config").select("negocio_id, horarios");

  let totalSent = 0;
  const allErrors: Array<{ negocioId: string; remId: string; citaId: string; error: string }> = [];

  for (const cfg of configs ?? []) {
    const horarios = (cfg.horarios ?? {}) as Record<string, unknown>;
    const recordatorios =
      (horarios._recordatorios as RecordatorioConfig[] | undefined) ?? DEFAULT_RECORDATORIOS;
    const sentLog = (horarios._sent_log as Record<string, string> | undefined) ?? {};

    const activeRems = recordatorios.filter((r) => r.activo);
    if (activeRems.length === 0) continue;

    const { data: neg } = await admin
      .from("negocios")
      .select("*")
      .eq("id", cfg.negocio_id)
      .maybeSingle();
    if (!neg) continue;
    const negocio = neg as Negocio;

    const newSentLog: Record<string, string> = { ...sentLog };

    for (const rem of activeRems) {
      const from = new Date(now + rem.horasAntes * 3600 * 1000 - windowMs).toISOString();
      const to = new Date(now + rem.horasAntes * 3600 * 1000 + windowMs).toISOString();

      const { data: citas } = await admin
        .from("citas")
        .select("*")
        .eq("negocio_id", cfg.negocio_id)
        .eq("estado", "confirmada")
        .gte("inicio", from)
        .lte("inicio", to);

      for (const cita of (citas ?? []) as Cita[]) {
        const logKey = `${cita.id}:${rem.id}`;
        if (newSentLog[logKey]) continue;

        try {
          const { data: cli } = cita.cliente_id
            ? await admin.from("clientes").select("*").eq("id", cita.cliente_id).maybeSingle()
            : { data: null };
          const c = cli as Cliente | null;
          if (!c?.telefono) continue;

          const hora = formatTimeInZone(cita.inicio, negocio.zona_horaria);
          const text = buildMessage(rem.mensaje, {
            nombre: c.nombre ? c.nombre.split(" ")[0] : "",
            hora,
            negocio: negocio.nombre,
            servicio: cita.servicio ? ` para ${cita.servicio}` : "",
          });

          await sendWhatsAppText(c.telefono, text, `neg_${negocio.id}`);
          newSentLog[logKey] = new Date().toISOString();
          totalSent++;
        } catch (err) {
          allErrors.push({
            negocioId: cfg.negocio_id,
            remId: rem.id,
            citaId: cita.id,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    // Clean entries older than 7 days
    for (const key of Object.keys(newSentLog)) {
      if (newSentLog[key] < sevenDaysAgo) delete newSentLog[key];
    }

    // Persist updated sent_log if changed
    if (JSON.stringify(newSentLog) !== JSON.stringify(sentLog)) {
      await admin
        .from("agente_config")
        .update({ horarios: { ...horarios, _sent_log: newSentLog } })
        .eq("negocio_id", cfg.negocio_id);
    }
  }

  return NextResponse.json({ ok: true, sent: totalSent, errors: allErrors });
}
