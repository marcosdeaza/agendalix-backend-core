import { NextResponse } from "next/server";
import { getCurrentNegocio } from "@/lib/panel-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireNegocio() {
  return getCurrentNegocio();
}

async function own(id: string, userId: string) {
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("conversaciones").select("*").eq("id", id).maybeSingle();
  if (!data || data.negocio_id !== userId) return null;
  return { admin, conv: data };
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  const negocio = await requireNegocio();
  if (!negocio) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const got = await own(ctx.params.id, negocio.id);
  if (!got) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { intervenida?: boolean };
  if (typeof body.intervenida !== "boolean") {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const { error } = await got.admin
    .from("conversaciones")
    .update({ intervenida: body.intervenida })
    .eq("id", ctx.params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
