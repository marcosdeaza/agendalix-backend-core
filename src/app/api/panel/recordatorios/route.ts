import { NextResponse } from "next/server";
import { getCurrentNegocio } from "@/lib/panel-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { RecordatorioConfig } from "@/lib/supabase/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  const negocio = await getCurrentNegocio();
  if (!negocio) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { recordatorios?: unknown };
  if (!Array.isArray(body.recordatorios)) {
    return NextResponse.json({ error: "recordatorios debe ser un array" }, { status: 400 });
  }

  const recordatorios: RecordatorioConfig[] = [];
  for (const r of body.recordatorios as Array<Partial<RecordatorioConfig>>) {
    const horasAntes = Number(r.horasAntes);
    if (!Number.isFinite(horasAntes) || horasAntes < 0.25 || horasAntes > 168) {
      return NextResponse.json(
        { error: "horasAntes debe estar entre 0.25 y 168 horas" },
        { status: 400 },
      );
    }
    const mensaje = (r.mensaje ?? "").toString().trim();
    if (!mensaje) {
      return NextResponse.json({ error: "El mensaje no puede estar vacío" }, { status: 400 });
    }
    recordatorios.push({
      id: (r.id ?? crypto.randomUUID()).toString(),
      horasAntes,
      mensaje,
      activo: r.activo !== false,
    });
  }

  const admin = createSupabaseAdminClient();

  const { data: cfg } = await admin
    .from("agente_config")
    .select("horarios")
    .eq("negocio_id", negocio.id)
    .maybeSingle();

  const currentHorarios = (cfg?.horarios ?? {}) as Record<string, unknown>;
  const updatedHorarios = { ...currentHorarios, _recordatorios: recordatorios };

  const { error } = await admin
    .from("agente_config")
    .update({ horarios: updatedHorarios, updated_at: new Date().toISOString() })
    .eq("negocio_id", negocio.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
