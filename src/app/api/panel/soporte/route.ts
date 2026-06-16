import { NextResponse } from "next/server";
import { getCurrentNegocio } from "@/lib/panel-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendSupportNewMessageEmail } from "@/lib/resend";
import { rateLimit } from "@/lib/rate-limit";
import { SOPORTE_TELEFONO } from "@/lib/soporte";
import type { Conversacion, Mensaje } from "@/lib/supabase/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const negocio = await getCurrentNegocio();
  if (!negocio) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("conversaciones")
    .select("*")
    .eq("negocio_id", negocio.id)
    .eq("cliente_telefono", SOPORTE_TELEFONO)
    .maybeSingle();

  const mensajes = ((data as Conversacion | null)?.mensajes as Mensaje[]) || [];
  return NextResponse.json({ mensajes });
}

export async function POST(req: Request) {
  const negocio = await getCurrentNegocio();
  if (!negocio) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rl = rateLimit(`soporte:${negocio.id}`, 20, 60 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiados mensajes. Espera un poco." }, { status: 429 });
  }

  const body = (await req.json().catch(() => ({}))) as { texto?: string };
  const texto = (body.texto || "").trim().slice(0, 2000);
  if (!texto) return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });

  const msg: Mensaje = {
    id: crypto.randomUUID(),
    role: "cliente",
    text: texto,
    timestamp: new Date().toISOString(),
  };

  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin
    .from("conversaciones")
    .select("*")
    .eq("negocio_id", negocio.id)
    .eq("cliente_telefono", SOPORTE_TELEFONO)
    .maybeSingle();

  if (existing) {
    const mensajes = [...(((existing as Conversacion).mensajes as Mensaje[]) || []), msg];
    await admin
      .from("conversaciones")
      .update({ mensajes, updated_at: new Date().toISOString() })
      .eq("id", (existing as Conversacion).id);
  } else {
    await admin.from("conversaciones").insert({
      negocio_id: negocio.id,
      cliente_telefono: SOPORTE_TELEFONO,
      mensajes: [msg],
      // intervenida=true: el agente IA jamás responde en este hilo
      intervenida: true,
      leida_hasta: new Date(0).toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  try {
    await sendSupportNewMessageEmail({
      negocioNombre: negocio.nombre,
      negocioEmail: negocio.email,
      texto,
    });
  } catch (err) {
    console.error("support email failed", err);
  }

  return NextResponse.json({ ok: true, mensaje: msg });
}
