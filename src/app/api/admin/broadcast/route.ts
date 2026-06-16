import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendAdminBroadcast } from "@/lib/resend";
import type { Negocio, Plan, EmailLog } from "@/lib/supabase/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Scope = "todos" | "activos" | "trial" | "basico" | "pro" | "clinica";

function isScope(x: unknown): x is Scope {
  return (
    x === "todos" ||
    x === "activos" ||
    x === "trial" ||
    x === "basico" ||
    x === "pro" ||
    x === "clinica"
  );
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    scope?: string;
    subject?: string;
    body?: string;
  };
  const scope: Scope = isScope(body.scope) ? body.scope : "activos";
  const subject = (body.subject || "").trim();
  const html = (body.body || "").trim();
  if (!subject || !html) {
    return NextResponse.json({ error: "campos_requeridos" }, { status: 400 });
  }
  if (subject.length > 200) {
    return NextResponse.json({ error: "asunto_demasiado_largo" }, { status: 400 });
  }

  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("negocios").select("id, email, plan, activo");
  const all = (data || []) as Array<Pick<Negocio, "id" | "email" | "plan" | "activo">>;

  const filtered = all.filter((n) => {
    if (scope === "todos") return true;
    if (scope === "activos") return n.activo;
    return n.plan === (scope as Plan);
  });
  const emails = Array.from(
    new Set(filtered.map((n) => n.email).filter((e): e is string => !!e)),
  );
  if (emails.length === 0) {
    return NextResponse.json({ error: "sin_destinatarios" }, { status: 400 });
  }

  // Send in batches of 40 to stay under provider limits.
  const BATCH = 40;
  for (let i = 0; i < emails.length; i += BATCH) {
    const chunk = emails.slice(i, i + BATCH);
    try {
      await sendAdminBroadcast({ to: chunk, subject, html });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "resend_error" },
        { status: 502 },
      );
    }
  }

  const { data: logRow } = await sb
    .from("email_log")
    .insert({
      scope,
      subject,
      body: html,
      recipients_count: emails.length,
    })
    .select("*")
    .single();

  return NextResponse.json({ ok: true, log: (logRow || null) as EmailLog | null });
}
