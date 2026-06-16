import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";
import { sendApprovedEmail } from "@/lib/resend";
import { generateMagicToken } from "@/lib/auth-tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_PLANS = ["trial", "basico", "pro", "clinica"] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!UUID.test(params.id)) {
    return NextResponse.json({ error: "id_invalido" }, { status: 400 });
  }

  type Body = {
    activo?: boolean;
    status?: string;
    plan?: string;
  };
  const body = (await req.json().catch(() => ({}))) as Body;
  const sb = createSupabaseAdminClient();

  // ── Approve / Reject (status change) ──
  if (body.status === "ACTIVE" || body.status === "REJECTED") {
    const plan = VALID_PLANS.includes(body.plan as typeof VALID_PLANS[number])
      ? body.plan
      : "trial";

    const updates: Record<string, unknown> = {
      status: body.status,
      activo: body.status === "ACTIVE",
    };
    if (body.status === "ACTIVE") updates.plan = plan;

    const { error } = await sb.from("negocios").update(updates).eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Send approval email with fresh magic link
    if (body.status === "ACTIVE") {
      try {
        const { data: negocio } = await sb
          .from("negocios")
          .select("email, nombre")
          .eq("id", params.id)
          .single();

        if (negocio) {
          const { token, hash } = generateMagicToken();
          const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h
          await sb.from("magic_tokens").insert({
            token_hash: hash,
            email: negocio.email,
            negocio_id: params.id,
            expires_at: expires,
          });

          const appUrl = process.env.APP_URL ?? "https://agendalix.com";
          const magicLink = `${appUrl}/api/auth/verify?token=${encodeURIComponent(token)}`;
          await sendApprovedEmail({
            to: negocio.email,
            nombre: negocio.nombre.split(" ")[0],
            magicLink,
          });
        }
      } catch (err) {
        console.error("Approval email failed", err);
      }
    }

    return NextResponse.json({ ok: true });
  }

  // ── Toggle activo (legacy) ──
  if (typeof body.activo === "boolean") {
    const { error } = await sb
      .from("negocios")
      .update({ activo: body.activo })
      .eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // ── Change plan ──
  if (body.plan && VALID_PLANS.includes(body.plan as typeof VALID_PLANS[number])) {
    const { error } = await sb
      .from("negocios")
      .update({ plan: body.plan })
      .eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Sin cambios válidos" }, { status: 400 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!UUID.test(params.id)) {
    return NextResponse.json({ error: "id_invalido" }, { status: 400 });
  }
  const sb = createSupabaseAdminClient();

  const tables = [
    "citas", "clientes", "conversaciones", "lista_espera",
    "uso", "agente_config", "magic_tokens",
  ] as const;
  for (const t of tables) {
    await sb.from(t).delete().eq("negocio_id", params.id);
  }

  const del = await sb.from("negocios").delete().eq("id", params.id);
  if (del.error) return NextResponse.json({ error: del.error.message }, { status: 500 });

  try {
    const authAdmin = createClient(
      (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    await authAdmin.auth.admin.deleteUser(params.id);
  } catch {
    // Non-fatal
  }

  return NextResponse.json({ ok: true });
}
