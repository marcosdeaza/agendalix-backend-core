import { NextResponse } from "next/server";
import { getCurrentNegocio } from "@/lib/panel-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppText } from "@/lib/whatsapp";
import { formatTimeInZone } from "@/lib/timezone";
import type { Cliente, Negocio } from "@/lib/supabase/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireNegocio() {
  return getCurrentNegocio();
}

export async function GET(req: Request) {
  const negocio = await requireNegocio();
  if (!negocio) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");

  const admin = createSupabaseAdminClient();
  let query = admin
    .from("citas")
    .select("*")
    .eq("negocio_id", negocio.id)
    .order("inicio", { ascending: true });
  if (start) query = query.gte("inicio", start);
  if (end) query = query.lte("inicio", end);

  const { data } = await query;
  return NextResponse.json({ citas: data || [] });
}

export async function PATCH(req: Request) {
  const negocio = await requireNegocio();
  if (!negocio) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json()) as {
    id?: string;
    estado?: "confirmada" | "pendiente" | "cancelada" | "completada";
    notas?: string;
    precio?: number;
  };
  if (!body.id) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const admin = createSupabaseAdminClient();

  const { data: existing } = await admin.from("citas").select("negocio_id,cliente_id").eq("id", body.id).maybeSingle();
  if (!existing || existing.negocio_id !== negocio.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const patch: Record<string, unknown> = {};
  if (body.estado) patch.estado = body.estado;
  if (typeof body.notas === "string") patch.notas = body.notas;
  if (typeof body.precio === "number") patch.precio = body.precio;

  const { error } = await admin.from("citas").update(patch).eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.estado === "completada" && existing.cliente_id) {
    const { data: cli } = await admin.from("clientes").select("total_visitas").eq("id", existing.cliente_id).maybeSingle();
    await admin
      .from("clientes")
      .update({
        ultima_visita: new Date().toISOString(),
        total_visitas: (cli?.total_visitas ?? 0) + 1,
      })
      .eq("id", existing.cliente_id);
  }

  // Send WhatsApp cancellation notification when operator cancels from panel
  if (body.estado === "cancelada" && existing.cliente_id) {
    try {
      const [{ data: cli }, { data: neg }, { data: citaFull }] = await Promise.all([
        admin.from("clientes").select("*").eq("id", existing.cliente_id).maybeSingle(),
        admin.from("negocios").select("*").eq("id", existing.negocio_id).maybeSingle(),
        admin.from("citas").select("*").eq("id", body.id).maybeSingle(),
      ]);
      if (cli && neg && citaFull) {
        const c = cli as Cliente;
        const n = neg as Negocio;
        const hora = formatTimeInZone(citaFull.inicio, n.zona_horaria);
        const nombre = c.nombre ? ` ${c.nombre.split(" ")[0]}` : "";
        const servicio = citaFull.servicio ? ` de ${citaFull.servicio}` : "";
        const msg = `Hola${nombre}, te informamos que tu cita${servicio} en ${n.nombre} del ${hora} ha sido cancelada. Disculpa las molestias. Para reprogramar, escríbenos cuando quieras.`;

        // Use most recent replyJid from conversation if available (handles @lid JIDs)
        type MsgWithJid = { role: string; replyJid?: string };
        const { data: conv } = await admin
          .from("conversaciones")
          .select("mensajes")
          .eq("negocio_id", n.id)
          .eq("cliente_telefono", c.telefono)
          .maybeSingle();
        const msgs = (conv?.mensajes ?? []) as MsgWithJid[];
        const lastClientMsg = [...msgs].reverse().find((m) => m.role === "cliente");
        const sendTo = lastClientMsg?.replyJid ?? c.telefono;

        await sendWhatsAppText(sendTo, msg, `neg_${n.id}`);
      }
    } catch {
      // Non-fatal — cancellation is already saved, notification failure shouldn't block response
    }
  }

  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const negocio = await requireNegocio();
  if (!negocio) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json()) as {
    inicio?: string;
    fin?: string;
    servicio?: string;
    profesional?: string;
    cliente_id?: string;
    cliente_nombre?: string;
    cliente_telefono?: string;
    notas?: string;
    precio?: number;
  };
  if (!body.inicio || !body.fin) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const admin = createSupabaseAdminClient();
  let clienteId = body.cliente_id || null;
  if (!clienteId && body.cliente_telefono) {
    const telefono = body.cliente_telefono.trim();
    const { data: existing } = await admin
      .from("clientes")
      .select("id")
      .eq("negocio_id", negocio.id)
      .eq("telefono", telefono)
      .maybeSingle();
    if (existing) {
      clienteId = existing.id;
    } else {
      const { data: newC } = await admin
        .from("clientes")
        .insert({ negocio_id: negocio.id, telefono, nombre: body.cliente_nombre || null })
        .select("id")
        .single();
      clienteId = newC?.id || null;
    }
  }

  const { data, error } = await admin
    .from("citas")
    .insert({
      negocio_id: negocio.id,
      cliente_id: clienteId,
      servicio: body.servicio || null,
      profesional: body.profesional || null,
      inicio: body.inicio,
      fin: body.fin,
      notas: body.notas || null,
      precio: body.precio ?? null,
      estado: "confirmada",
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, cita: data });
}
