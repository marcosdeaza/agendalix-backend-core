import { NextResponse } from "next/server";
import { getCurrentNegocio } from "@/lib/panel-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppText } from "@/lib/whatsapp";
import type { Mensaje } from "@/lib/supabase/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const negocio = await getCurrentNegocio();
  if (!negocio) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { text?: string };
  const text = (body.text || "").trim();
  if (!text) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data: conv } = await admin
    .from("conversaciones")
    .select("*")
    .eq("id", ctx.params.id)
    .maybeSingle();
  if (!conv || conv.negocio_id !== negocio.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Use the replyJid stored in the last client message to handle @lid WhatsApp privacy JIDs
  const mensajesArr = Array.isArray(conv.mensajes) ? conv.mensajes as (typeof conv.mensajes[0] & { replyJid?: string })[] : [];
  const lastClientMsg = [...mensajesArr].reverse().find((m) => m.role === "cliente");
  const sendTarget = lastClientMsg?.replyJid ?? conv.cliente_telefono;

  try {
    await sendWhatsAppText(sendTarget, text, `neg_${negocio.id}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error WhatsApp";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const nuevoMsg: Mensaje = {
    id: crypto.randomUUID(),
    role: "humano",
    text,
    timestamp: new Date().toISOString(),
  };
  const mensajes = [...(Array.isArray(conv.mensajes) ? conv.mensajes : []), nuevoMsg];
  const { data: updated, error } = await admin
    .from("conversaciones")
    .update({
      mensajes,
      intervenida: true,
      leida_hasta: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", ctx.params.id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conversacion: updated });
}
