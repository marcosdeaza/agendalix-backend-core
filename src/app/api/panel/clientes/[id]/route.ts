import { NextResponse } from "next/server";
import { getCurrentNegocio } from "@/lib/panel-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireNegocio() {
  return getCurrentNegocio();
}

async function assertOwns(id: string, userId: string) {
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("clientes").select("id,negocio_id").eq("id", id).maybeSingle();
  if (!data || data.negocio_id !== userId) return null;
  return admin;
}

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const negocio = await requireNegocio();
  if (!negocio) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = await assertOwns(ctx.params.id, negocio.id);
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const [{ data: cliente }, { data: citas }] = await Promise.all([
    admin.from("clientes").select("*").eq("id", ctx.params.id).maybeSingle(),
    admin
      .from("citas")
      .select("*")
      .eq("cliente_id", ctx.params.id)
      .order("inicio", { ascending: false }),
  ]);
  if (!cliente) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ cliente, citas: citas || [] });
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const negocio = await requireNegocio();
  if (!negocio) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = await assertOwns(ctx.params.id, negocio.id);
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as {
    nombre?: string | null;
    notas?: string | null;
    telefono?: string;
  };
  const patch: Record<string, unknown> = {};
  if (typeof body.nombre === "string") patch.nombre = body.nombre.trim() || null;
  if (typeof body.notas === "string") patch.notas = body.notas || null;
  if (typeof body.telefono === "string" && body.telefono.trim()) {
    patch.telefono = body.telefono.trim();
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });
  }

  const { error } = await admin.from("clientes").update(patch).eq("id", ctx.params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  const negocio = await requireNegocio();
  if (!negocio) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = await assertOwns(ctx.params.id, negocio.id);
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { error } = await admin.from("clientes").delete().eq("id", ctx.params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
