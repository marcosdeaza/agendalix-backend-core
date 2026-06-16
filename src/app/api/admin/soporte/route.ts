import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendSupportReplyEmail } from "@/lib/resend";
import { insertNotificacion } from "@/lib/notifications";
import { SOPORTE_TELEFONO } from "@/lib/soporte";
import type { Conversacion, Mensaje } from "@/lib/supabase/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const [{ data: threads }, { data: negocios }] = await Promise.all([
    admin
      .from("conversaciones")
      .select("*")
      .eq("cliente_telefono", SOPORTE_TELEFONO)
      .order("updated_at", { ascending: false }),
    admin.from("negocios").select("id, nombre, email, plan"),
  ]);

  const negById = new Map(
    ((negocios || []) as Array<{ id: string; nombre: string; email: string; plan: string }>).map(
      (n) => [n.id, n],
    ),
  );

  const out = ((threads || []) as Conversacion[]).map((t) => {
    const neg = negById.get(t.negocio_id as string);
    const mensajes = (t.mensajes as Mensaje[]) || [];
    const last = mensajes[mensajes.length - 1];
    return {
      negocio_id: t.negocio_id,
      negocio_nombre: neg?.nombre || "(desconocido)",
      negocio_email: neg?.email || "",
      plan: neg?.plan || "trial",
      updated_at: t.updated_at,
      // Pendiente de respuesta si el último mensaje es del negocio
      pendiente: last?.role === "cliente",
      mensajes,
    };
  });

  return NextResponse.json({ threads: out });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    negocio_id?: string;
    texto?: string;
  };
  const negocioId = (body.negocio_id || "").trim();
  const texto = (body.texto || "").trim().slice(0, 2000);
  if (!negocioId || !texto) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin
    .from("conversaciones")
    .select("*")
    .eq("negocio_id", negocioId)
    .eq("cliente_telefono", SOPORTE_TELEFONO)
    .maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: "Hilo no encontrado" }, { status: 404 });
  }

  const msg: Mensaje = {
    id: crypto.randomUUID(),
    role: "humano",
    text: texto,
    timestamp: new Date().toISOString(),
  };
  const mensajes = [...(((existing as Conversacion).mensajes as Mensaje[]) || []), msg];
  await admin
    .from("conversaciones")
    .update({ mensajes, updated_at: new Date().toISOString() })
    .eq("id", (existing as Conversacion).id);

  // Avisar al negocio: campanita del panel + email
  const { data: neg } = await admin
    .from("negocios")
    .select("nombre, email")
    .eq("id", negocioId)
    .maybeSingle();

  await insertNotificacion({
    negocioId,
    titulo: "Soporte te ha respondido",
    mensaje: texto.slice(0, 120),
    tipo: "sistema",
  });

  if (neg?.email) {
    try {
      await sendSupportReplyEmail({
        to: neg.email,
        nombre: (neg.nombre || "").split(" ")[0] || neg.nombre,
        texto,
      });
    } catch (err) {
      console.error("support reply email failed", err);
    }
  }

  return NextResponse.json({ ok: true, mensaje: msg });
}
