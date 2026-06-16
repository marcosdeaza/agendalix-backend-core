import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateInformeExcel, filenameForPeriod } from "@/lib/excel";
import type { Cita, Cliente, Negocio } from "@/lib/supabase/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PERIODS: Record<string, { days: number; label: string }> = {
  "7d": { days: 7, label: "7 dias" },
  "30d": { days: 30, label: "30 dias" },
  "90d": { days: 90, label: "90 dias" },
  "180d": { days: 180, label: "6 meses" },
};

export async function GET(req: Request) {
  const sb = createSupabaseServerClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const periodKey = url.searchParams.get("period") || "30d";
  const cfg = PERIODS[periodKey] || PERIODS["30d"];

  const admin = createSupabaseAdminClient();
  const { data: neg } = await admin
    .from("negocios")
    .select("*")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (!neg) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const end = new Date();
  const start = new Date(end.getTime() - cfg.days * 24 * 60 * 60 * 1000);

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
    negocioNombre: (neg as Negocio).nombre,
    period: { label: cfg.label, start, end },
    citas: (citas || []) as Cita[],
    clientes: (clientes || []) as Cliente[],
    tz: (neg as Negocio).zona_horaria,
    moneda: (neg as Negocio).moneda,
  });
  const filename = filenameForPeriod(cfg.label, end);

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
