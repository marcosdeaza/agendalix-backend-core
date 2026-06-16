import { NextResponse } from "next/server";
import { getCurrentNegocio } from "@/lib/panel-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { EsperaEstado } from "@/lib/supabase/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID: EsperaEstado[] = ["esperando", "notificado", "convertido", "cancelado"];

async function check(id: string, userId: string) {
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("lista_espera").select("negocio_id").eq("id", id).maybeSingle();
  if (!data || data.negocio_id !== userId) return null;
  return admin;
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const negocio = await getCurrentNegocio();
  if (!negocio) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = await check(ctx.params.id, negocio.id);
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { estado?: EsperaEstado };
  if (!body.estado || !VALID.includes(body.estado)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const { error } = await admin
    .from("lista_espera")
    .update({ estado: body.estado })
    .eq("id", ctx.params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  const negocio = await getCurrentNegocio();
  if (!negocio) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = await check(ctx.params.id, negocio.id);
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { error } = await admin.from("lista_espera").delete().eq("id", ctx.params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
