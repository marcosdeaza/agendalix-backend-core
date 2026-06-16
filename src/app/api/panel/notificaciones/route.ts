import { NextResponse } from "next/server";
import { getCurrentNegocio } from "@/lib/panel-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const negocio = await getCurrentNegocio();
  if (!negocio) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("notificaciones")
    .select("*")
    .eq("negocio_id", negocio.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ notificaciones: data || [] });
}

export async function PATCH() {
  const negocio = await getCurrentNegocio();
  if (!negocio) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createSupabaseAdminClient();
  await admin
    .from("notificaciones")
    .update({ leido: true })
    .eq("negocio_id", negocio.id)
    .eq("leido", false);

  return NextResponse.json({ ok: true });
}
