import { NextResponse } from "next/server";
import { getCurrentNegocio } from "@/lib/panel-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireNegocio() {
  return getCurrentNegocio();
}

export async function GET() {
  const negocio = await requireNegocio();
  if (!negocio) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("clientes")
    .select("*")
    .eq("negocio_id", negocio.id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ clientes: data || [] });
}

export async function POST(req: Request) {
  const negocio = await requireNegocio();
  if (!negocio) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as {
    nombre?: string | null;
    telefono?: string;
    notas?: string | null;
  };
  const telefono = (body.telefono || "").trim();
  if (!telefono) return NextResponse.json({ error: "Teléfono obligatorio" }, { status: 400 });

  const admin = createSupabaseAdminClient();

  const { data: dup } = await admin
    .from("clientes")
    .select("id")
    .eq("negocio_id", negocio.id)
    .eq("telefono", telefono)
    .maybeSingle();
  if (dup) {
    return NextResponse.json(
      { error: "Ya existe un cliente con ese teléfono" },
      { status: 409 },
    );
  }

  const { data, error } = await admin
    .from("clientes")
    .insert({
      negocio_id: negocio.id,
      telefono,
      nombre: body.nombre?.trim() || null,
      notas: body.notas?.trim() || null,
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cliente: data });
}
