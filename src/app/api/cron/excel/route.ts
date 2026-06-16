import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyCronAuth } from "@/lib/cron";
import { generateInformeExcel, filenameForPeriod } from "@/lib/excel";
import { sendExcelReport } from "@/lib/resend";
import type { Cita, Cliente, Negocio } from "@/lib/supabase/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Weekly Excel report for every active negocio. Run once per week (e.g. Monday 08:00).
export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createSupabaseAdminClient();
  const { data: negs } = await admin.from("negocios").select("*").eq("activo", true);
  const negocios = (negs || []) as Negocio[];

  const end = new Date();
  const start = new Date(end.getTime() - 7 * 24 * 3600 * 1000);

  let sent = 0;
  const errors: Array<{ negocio: string; error: string }> = [];

  for (const neg of negocios) {
    try {
      const [{ data: citas }, { data: clientes }] = await Promise.all([
        admin
          .from("citas")
          .select("*")
          .eq("negocio_id", neg.id)
          .gte("inicio", start.toISOString())
          .lte("inicio", end.toISOString())
          .order("inicio", { ascending: true }),
        admin.from("clientes").select("*").eq("negocio_id", neg.id),
      ]);

      const buf = await generateInformeExcel({
        negocioNombre: neg.nombre,
        period: { label: "Últimos 7 días", start, end },
        citas: (citas || []) as Cita[],
        clientes: (clientes || []) as Cliente[],
        tz: neg.zona_horaria,
        moneda: neg.moneda,
      });

      await sendExcelReport({
        to: neg.email,
        nombreNegocio: neg.nombre,
        xlsx: buf,
        periodo: "Últimos 7 días",
        filename: filenameForPeriod("7dias", end),
      });
      sent += 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "error";
      errors.push({ negocio: neg.id, error: msg });
    }
  }

  return NextResponse.json({ ok: true, sent, total: negocios.length, errors });
}
