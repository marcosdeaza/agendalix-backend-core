import { NextResponse } from "next/server";
import { getCurrentNegocio } from "@/lib/panel-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isValidTimezone, isValidCurrency } from "@/lib/timezone";
import { isValidSpanishPhone } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  const negocio = await getCurrentNegocio();
  if (!negocio) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    nombre?: string;
    sector?: string;
    telefono?: string | null;
    whatsapp_number?: string | null;
    zona_horaria?: string;
    moneda?: string;
    onboarding_completo?: boolean;
  };

  const patch: Record<string, unknown> = {};
  if (typeof body.nombre === "string") {
    const n = body.nombre.trim();
    if (!n) return NextResponse.json({ error: "Nombre obligatorio" }, { status: 400 });
    patch.nombre = n;
  }
  if (typeof body.sector === "string") patch.sector = body.sector.trim() || "Otro";
  if (body.telefono !== undefined) {
    const t = (body.telefono || "").toString().trim();
    if (t && !isValidSpanishPhone(t))
      return NextResponse.json({ error: "Teléfono inválido" }, { status: 400 });
    patch.telefono = t || null;
  }
  if (body.whatsapp_number !== undefined) {
    const w = (body.whatsapp_number || "").toString().trim();
    patch.whatsapp_number = w || null;
  }
  if (body.zona_horaria) {
    if (!isValidTimezone(body.zona_horaria))
      return NextResponse.json({ error: "Zona horaria inválida" }, { status: 400 });
    patch.zona_horaria = body.zona_horaria;
  }
  if (body.moneda) {
    const m = body.moneda.toUpperCase();
    if (!isValidCurrency(m))
      return NextResponse.json({ error: "Moneda inválida" }, { status: 400 });
    patch.moneda = m;
  }

  if (typeof body.onboarding_completo === "boolean") {
    patch.onboarding_completo = body.onboarding_completo;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("negocios").update(patch).eq("id", negocio.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
