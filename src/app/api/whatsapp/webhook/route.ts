import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parseEvolutionWebhook, sendWhatsAppText, toWhatsAppFormat, transcribeAudio } from "@/lib/whatsapp";
import { rateLimit } from "@/lib/rate-limit";
import {
  deepseekChat,
  type DeepSeekMessage,
  type DeepSeekToolCall,
} from "@/lib/deepseek";
import { AGENT_TOOLS, buildSystemPrompt, renderBienvenida } from "@/lib/agent";
import { checkSlot, formatSlotInZone, nextAvailableSlots } from "@/lib/availability";
import { insertNotificacion } from "@/lib/notifications";
import { startOfDayInZone, zonedNow, zonedToUTC } from "@/lib/timezone";
import type {
  AgenteConfig,
  Cita,
  Cliente,
  Conversacion,
  Mensaje,
  Negocio,
  Servicio,
} from "@/lib/supabase/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const WA_RATE_LIMIT = { limit: 10, windowMs: 60_000 };
const AGENT_TURN_LIMIT = 4;

// Dedup de mensajes: Evolution puede reintentar el webhook y duplicaría
// la respuesta del agente. TTL corto en memoria (contenedor único).
const SEEN_TTL_MS = 10 * 60_000;
const seenMessages = new Map<string, number>();
function alreadyProcessed(messageId: string): boolean {
  if (!messageId) return false;
  const now = Date.now();
  if (seenMessages.size > 2000) {
    for (const [k, t] of seenMessages) {
      if (now - t > SEEN_TTL_MS) seenMessages.delete(k);
    }
  }
  if (seenMessages.has(messageId)) return true;
  seenMessages.set(messageId, now);
  return false;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected =
    process.env.WHATSAPP_VERIFY_TOKEN || process.env.DIALOG360_VERIFY_TOKEN;
  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  // Verificación del secreto: Evolution API envía x-evo-secret en cada webhook
  // (configurado en createInstance/setInstanceWebhook). Sin esto, cualquiera
  // podría inyectar mensajes falsos, gastar tokens de IA y crear/cancelar citas.
  const expectedSecret = process.env.EVOLUTION_WEBHOOK_SECRET;
  if (expectedSecret) {
    const got = req.headers.get("x-evo-secret") || "";
    if (got !== expectedSecret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const incoming = parseEvolutionWebhook(payload);
  if (!incoming) return NextResponse.json({ ok: true });

  if (alreadyProcessed(incoming.messageId)) {
    return NextResponse.json({ ok: true, dedup: true });
  }

  const rawFrom = incoming.from.replace(/\D/g, "");
  // Normalize to E.164: 9-digit Spanish mobiles get +34 prefix
  const from = rawFrom.length === 9 && /^[6-9]/.test(rawFrom)
    ? `+34${rawFrom}`
    : `+${rawFrom}`;

  const rl = rateLimit(`wa:${from}`, WA_RATE_LIMIT.limit, WA_RATE_LIMIT.windowMs);
  if (!rl.allowed) {
    // Silent drop: 200 keeps 360dialog from retrying.
    return NextResponse.json({ ok: true, throttled: true });
  }

  const admin = createSupabaseAdminClient();

  const negocio = await resolveNegocio(admin, incoming.phoneNumberId);
  if (!negocio) {
    return NextResponse.json({ ok: true, reason: "negocio_not_found" });
  }
  if (!negocio.activo) {
    return NextResponse.json({ ok: true, reason: "negocio_inactivo" });
  }

  // Transcribe audio silently — the user only sees the final AI reply,
  // never a "transcribing…" notice or the transcript itself.
  if (incoming.isAudio) {
    const transcript = await transcribeAudio(
      incoming.rawEvolutionData,
      `neg_${negocio.id}`,
    );
    if (!transcript) return NextResponse.json({ ok: true, reason: "audio_skip" });
    incoming.text = transcript;
  }

  const [{ data: cfgRow }, cliente] = await Promise.all([
    admin.from("agente_config").select("*").eq("negocio_id", negocio.id).maybeSingle(),
    ensureCliente(admin, negocio.id, from),
  ]);
  const config = (cfgRow || null) as AgenteConfig | null;
  if (!config) return NextResponse.json({ ok: true, reason: "no_config" });

  const userMsg: Mensaje = {
    id: crypto.randomUUID(),
    role: "cliente",
    text: incoming.text,
    timestamp: new Date(incoming.timestamp * 1000).toISOString(),
    ...(incoming.replyJid ? { replyJid: incoming.replyJid } : {}),
  };

  const conversacion = await appendToConversacion(admin, negocio.id, from, [userMsg]);

  if (conversacion.intervenida) {
    await bumpUso(admin, negocio.id, { mensajes: 1 });
    return NextResponse.json({ ok: true, intervenida: true });
  }

  let reply = "";
  let agentMsgs: Mensaje[] = [];

  try {
    const result = await runAgentLoop({
      admin,
      negocio,
      config,
      cliente,
      conversacion,
      userText: incoming.text,
    });
    reply = result.reply;
    agentMsgs = result.msgs;

    await bumpUso(admin, negocio.id, {
      mensajes: 1,
      tokens: result.tokens,
      citas: result.bookingsCreated,
    });
  } catch (err) {
    console.error("WA agent loop failed", err);
    reply = fallbackReply(config, negocio);
    agentMsgs = [
      {
        id: crypto.randomUUID(),
        role: "agente",
        text: reply,
        timestamp: new Date().toISOString(),
      },
    ];
    await bumpUso(admin, negocio.id, { mensajes: 1 });
  }

  try {
    const instanceName = `neg_${negocio.id}`;
    // Use the full original JID when replying to @lid contacts so Evolution API
    // can route back through the privacy identifier rather than a raw number.
    const replyTarget = incoming.replyJid ?? from;
    await sendWhatsAppText(replyTarget, reply, instanceName);
  } catch (err) {
    console.error("WA send failed", err);
  }

  await appendToConversacion(admin, negocio.id, from, agentMsgs);

  return NextResponse.json({ ok: true });
}

async function resolveNegocio(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  phoneNumberId: string,
): Promise<Negocio | null> {
  if (phoneNumberId) {
    const { data } = await admin
      .from("negocios")
      .select("*")
      .eq("whatsapp_number", phoneNumberId)
      .maybeSingle();
    if (data) return data as Negocio;
  }
  // Fallback: if only one active business exists (dev / single-tenant)
  const { data: all } = await admin
    .from("negocios")
    .select("*")
    .eq("activo", true)
    .limit(2);
  if (all && all.length === 1) return all[0] as Negocio;
  return null;
}

async function ensureCliente(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  negocioId: string,
  telefono: string,
): Promise<Cliente> {
  const { data } = await admin
    .from("clientes")
    .select("*")
    .eq("negocio_id", negocioId)
    .eq("telefono", telefono)
    .maybeSingle();
  if (data) return data as Cliente;
  const { data: created } = await admin
    .from("clientes")
    .insert({ negocio_id: negocioId, telefono })
    .select("*")
    .single();
  return created as Cliente;
}

async function appendToConversacion(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  negocioId: string,
  telefono: string,
  msgs: Mensaje[],
): Promise<Conversacion> {
  const { data: existing } = await admin
    .from("conversaciones")
    .select("*")
    .eq("negocio_id", negocioId)
    .eq("cliente_telefono", telefono)
    .maybeSingle();

  if (existing) {
    const mensajes = [...((existing.mensajes as Mensaje[]) || []), ...msgs];
    const { data } = await admin
      .from("conversaciones")
      .update({ mensajes, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select("*")
      .single();
    return data as Conversacion;
  }

  const { data } = await admin
    .from("conversaciones")
    .insert({
      negocio_id: negocioId,
      cliente_telefono: telefono,
      mensajes: msgs,
      intervenida: false,
      leida_hasta: new Date(0).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  return data as Conversacion;
}

async function bumpUso(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  negocioId: string,
  inc: { mensajes?: number; tokens?: number; citas?: number; recuperacion?: number },
) {
  try {
    const fecha = new Date().toISOString().slice(0, 10);
    const { data: existing } = await admin
      .from("uso")
      .select("*")
      .eq("negocio_id", negocioId)
      .eq("fecha", fecha)
      .maybeSingle();
    if (existing) {
      await admin
        .from("uso")
        .update({
          mensajes_procesados: (existing.mensajes_procesados || 0) + (inc.mensajes || 0),
          tokens_deepseek: (existing.tokens_deepseek || 0) + (inc.tokens || 0),
          citas_gestionadas: (existing.citas_gestionadas || 0) + (inc.citas || 0),
          recuperacion_enviados:
            (existing.recuperacion_enviados || 0) + (inc.recuperacion || 0),
        })
        .eq("id", existing.id);
    } else {
      await admin.from("uso").insert({
        negocio_id: negocioId,
        fecha,
        mensajes_procesados: inc.mensajes || 0,
        tokens_deepseek: inc.tokens || 0,
        citas_gestionadas: inc.citas || 0,
        recuperacion_enviados: inc.recuperacion || 0,
      });
    }
  } catch (err) {
    console.error("bumpUso failed", err);
  }
}

function fallbackReply(config: AgenteConfig, negocio: Negocio): string {
  const raw = config.mensaje_bienvenida?.trim();
  if (raw) return renderBienvenida(raw, negocio.nombre);
  return `Hola, soy el asistente de ${negocio.nombre}. Ahora mismo tengo problemas técnicos, pero te atenderemos pronto.`;
}

type RunResult = {
  reply: string;
  msgs: Mensaje[];
  tokens: number;
  bookingsCreated: number;
};

async function runAgentLoop(opts: {
  admin: ReturnType<typeof createSupabaseAdminClient>;
  negocio: Negocio;
  config: AgenteConfig;
  cliente: Cliente;
  conversacion: Conversacion;
  userText: string;
}): Promise<RunResult> {
  const tz = opts.negocio.zona_horaria;
  const now = new Date();

  // Medianoche en la zona horaria del negocio, no la del servidor
  const startOfDay = startOfDayInZone(tz, now);
  const { data: citasHoyData } = await opts.admin
    .from("citas")
    .select("*")
    .eq("negocio_id", opts.negocio.id)
    .gte("inicio", startOfDay.toISOString())
    .lte("inicio", new Date(startOfDay.getTime() + 24 * 3600 * 1000).toISOString());
  const citasHoy = (citasHoyData || []) as Cita[];

  const history = (opts.conversacion.mensajes as Mensaje[]) || [];
  const dsHistory: DeepSeekMessage[] = history.slice(-14).map((m) => ({
    role: m.role === "cliente" ? "user" : "assistant",
    content: m.text,
  }));

  const system = buildSystemPrompt({
    negocio: opts.negocio,
    config: opts.config,
    citasHoy,
    now,
  });

  const messages: DeepSeekMessage[] = [{ role: "system", content: system }, ...dsHistory];

  let tokensTotal = 0;
  let bookings = 0;
  const agentMsgs: Mensaje[] = [];
  let finalReply = "";

  for (let turn = 0; turn < AGENT_TURN_LIMIT; turn++) {
    const completion = await deepseekChat({
      messages,
      tools: AGENT_TOOLS,
      maxTokens: 400,
    });
    tokensTotal += completion.usage?.total_tokens || 0;
    const choice = completion.choices[0];
    if (!choice) break;
    const assistant = choice.message;
    const toolCalls = assistant.tool_calls || [];

    if (toolCalls.length === 0) {
      finalReply = toWhatsAppFormat((assistant.content || "").trim());
      if (finalReply) {
        agentMsgs.push({
          id: crypto.randomUUID(),
          role: "agente",
          text: finalReply,
          timestamp: new Date().toISOString(),
        });
      }
      break;
    }

    messages.push({
      role: "assistant",
      content: assistant.content ?? null,
      tool_calls: toolCalls,
    });

    for (const call of toolCalls) {
      const res = await executeTool({
        call,
        admin: opts.admin,
        negocio: opts.negocio,
        config: opts.config,
        cliente: opts.cliente,
        tz,
      });
      if (res.bookingCreated) bookings += 1;
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        name: call.function.name,
        content: res.content,
      });
    }
  }

  if (!finalReply) finalReply = "Un momento, te confirmo enseguida.";
  if (agentMsgs.length === 0) {
    agentMsgs.push({
      id: crypto.randomUUID(),
      role: "agente",
      text: finalReply,
      timestamp: new Date().toISOString(),
    });
  }

  return { reply: finalReply, msgs: agentMsgs, tokens: tokensTotal, bookingsCreated: bookings };
}

type ToolResult = { content: string; bookingCreated?: boolean };

async function executeTool(opts: {
  call: DeepSeekToolCall;
  admin: ReturnType<typeof createSupabaseAdminClient>;
  negocio: Negocio;
  config: AgenteConfig;
  cliente: Cliente;
  tz: string;
}): Promise<ToolResult> {
  let args: Record<string, unknown> = {};
  try {
    args = JSON.parse(opts.call.function.arguments || "{}");
  } catch {
    return { content: JSON.stringify({ error: "invalid_arguments" }) };
  }

  const name = opts.call.function.name;
  try {
    if (name === "create_booking") return await toolCreateBooking(opts, args);
    if (name === "cancel_booking") return await toolCancelBooking(opts, args);
    if (name === "list_appointments") return await toolListAppointments(opts, args);
    if (name === "add_to_waitlist") return await toolAddWaitlist(opts, args);
    return { content: JSON.stringify({ error: `unknown_tool:${name}` }) };
  } catch (err) {
    console.error(`tool ${name} failed`, err);
    return { content: JSON.stringify({ error: "tool_error" }) };
  }
}

function resolveServicio(
  config: AgenteConfig,
  nombre: string,
): Servicio | null {
  const q = nombre.trim().toLowerCase();
  if (!q) return null;
  return (
    config.servicios.find((s) => s.nombre.toLowerCase() === q) ||
    config.servicios.find((s) => s.nombre.toLowerCase().includes(q)) ||
    null
  );
}

function parseFechaIso(raw: string, tz: string): Date | null {
  if (!raw) return null;
  const s = raw.trim();
  // If string contains Z or an explicit offset, trust it.
  if (/[Zz]$|[+-]\d{2}:?\d{2}$/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  // Otherwise interpret as local wall-clock in tz.
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!m) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d;
    return null;
  }
  const [, y, mo, da, h, mi] = m;
  return zonedToUTC(tz, {
    year: Number(y),
    month: Number(mo),
    day: Number(da),
    hour: Number(h),
    minute: Number(mi),
  });
}

async function toolCreateBooking(
  opts: {
    admin: ReturnType<typeof createSupabaseAdminClient>;
    negocio: Negocio;
    config: AgenteConfig;
    cliente: Cliente;
    tz: string;
  },
  args: Record<string, unknown>,
): Promise<ToolResult> {
  const nombre_cliente = String(args.nombre_cliente || "").trim();
  const servicioName = String(args.servicio || "").trim();
  const profesional = args.profesional ? String(args.profesional).trim() : null;
  const fecha_iso = String(args.fecha_iso || "").trim();
  const notas = args.notas ? String(args.notas) : null;

  if (!servicioName || !fecha_iso) {
    return { content: JSON.stringify({ error: "missing_fields" }) };
  }
  const servicio = resolveServicio(opts.config, servicioName);
  if (!servicio) {
    return {
      content: JSON.stringify({
        error: "servicio_no_encontrado",
        servicios_disponibles: opts.config.servicios.map((s) => s.nombre),
      }),
    };
  }
  const start = parseFechaIso(fecha_iso, opts.tz);
  if (!start) return { content: JSON.stringify({ error: "fecha_invalida" }) };
  const end = new Date(start.getTime() + servicio.duracion * 60000);

  const windowStart = new Date(start.getTime() - 7 * 24 * 3600 * 1000);
  const windowEnd = new Date(start.getTime() + 7 * 24 * 3600 * 1000);
  const { data: citasWindow } = await opts.admin
    .from("citas")
    .select("*")
    .eq("negocio_id", opts.negocio.id)
    .gte("inicio", windowStart.toISOString())
    .lte("inicio", windowEnd.toISOString());

  const check = checkSlot({
    config: opts.config,
    citas: (citasWindow || []) as Cita[],
    profesional,
    start,
    durationMin: servicio.duracion,
    tz: opts.tz,
  });
  if (!check.available) {
    return {
      content: JSON.stringify({
        error: "no_disponible",
        motivo: check.reason,
        alternativas: check.alternatives.map((d) => ({
          iso: d.toISOString(),
          label: formatSlotInZone(d, opts.tz),
        })),
      }),
    };
  }

  if (nombre_cliente && !opts.cliente.nombre) {
    await opts.admin
      .from("clientes")
      .update({ nombre: nombre_cliente })
      .eq("id", opts.cliente.id);
  }

  const { data, error } = await opts.admin
    .from("citas")
    .insert({
      negocio_id: opts.negocio.id,
      cliente_id: opts.cliente.id,
      servicio: servicio.nombre,
      profesional,
      inicio: start.toISOString(),
      fin: end.toISOString(),
      estado: "confirmada",
      precio: servicio.precio,
      notas,
    })
    .select("*")
    .single();
  if (error) return { content: JSON.stringify({ error: error.message }) };

  const clienteLabel = nombre_cliente || opts.cliente.nombre || opts.cliente.telefono;
  await insertNotificacion({
    negocioId: opts.negocio.id,
    titulo: `Nueva cita — ${clienteLabel}`,
    mensaje: `${servicio.nombre} · ${formatSlotInZone(start, opts.tz)}`,
    tipo: "cita_nueva",
  });

  return {
    bookingCreated: true,
    content: JSON.stringify({
      ok: true,
      cita_id: data?.id,
      label: formatSlotInZone(start, opts.tz),
    }),
  };
}

async function toolCancelBooking(
  opts: {
    admin: ReturnType<typeof createSupabaseAdminClient>;
    negocio: Negocio;
    cliente: Cliente;
    tz: string;
  },
  args: Record<string, unknown>,
): Promise<ToolResult> {
  const fecha = String(args.fecha_iso || "").trim();
  const start = parseFechaIso(fecha, opts.tz);
  if (!start) return { content: JSON.stringify({ error: "fecha_invalida" }) };

  const from = new Date(start.getTime() - 12 * 3600 * 1000).toISOString();
  const to = new Date(start.getTime() + 12 * 3600 * 1000).toISOString();
  const { data } = await opts.admin
    .from("citas")
    .select("*")
    .eq("negocio_id", opts.negocio.id)
    .eq("cliente_id", opts.cliente.id)
    .in("estado", ["confirmada", "pendiente"])
    .gte("inicio", from)
    .lte("inicio", to)
    .order("inicio", { ascending: true });

  const citas = (data || []) as Cita[];
  if (citas.length === 0) {
    return { content: JSON.stringify({ error: "no_encontrada" }) };
  }
  // Cancel the one closest to the requested time
  const closest = citas.reduce((best, c) => {
    const d = Math.abs(new Date(c.inicio).getTime() - start.getTime());
    const bd = Math.abs(new Date(best.inicio).getTime() - start.getTime());
    return d < bd ? c : best;
  });

  await opts.admin.from("citas").update({ estado: "cancelada" }).eq("id", closest.id);

  const clienteLabel = opts.cliente.nombre || opts.cliente.telefono;
  await insertNotificacion({
    negocioId: opts.negocio.id,
    titulo: `Cancelación — ${clienteLabel}`,
    mensaje: `${closest.servicio || "Cita"} · ${formatSlotInZone(new Date(closest.inicio), opts.tz)}`,
    tipo: "cancelacion",
  });

  return {
    content: JSON.stringify({
      ok: true,
      cita_id: closest.id,
      cuando: formatSlotInZone(new Date(closest.inicio), opts.tz),
    }),
  };
}

async function toolListAppointments(
  opts: {
    admin: ReturnType<typeof createSupabaseAdminClient>;
    negocio: Negocio;
    cliente: Cliente;
    tz: string;
  },
  _args: Record<string, unknown>,
): Promise<ToolResult> {
  void _args;
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
  const { data } = await opts.admin
    .from("citas")
    .select("*")
    .eq("negocio_id", opts.negocio.id)
    .eq("cliente_id", opts.cliente.id)
    .in("estado", ["confirmada", "pendiente"])
    .gte("inicio", now.toISOString())
    .lte("inicio", in30.toISOString())
    .order("inicio", { ascending: true });
  const citas = (data || []) as Cita[];
  return {
    content: JSON.stringify({
      citas: citas.map((c) => ({
        id: c.id,
        servicio: c.servicio,
        profesional: c.profesional,
        cuando: formatSlotInZone(new Date(c.inicio), opts.tz),
      })),
    }),
  };
}

async function toolAddWaitlist(
  opts: {
    admin: ReturnType<typeof createSupabaseAdminClient>;
    negocio: Negocio;
    config: AgenteConfig;
    cliente: Cliente;
    tz: string;
  },
  args: Record<string, unknown>,
): Promise<ToolResult> {
  const servicioName = String(args.servicio || "").trim();
  const servicio = servicioName ? resolveServicio(opts.config, servicioName) : null;
  const profesional = args.profesional ? String(args.profesional).trim() : null;
  const fechaRaw = args.fecha_preferida ? String(args.fecha_preferida).trim() : null;

  let fecha: string | null = null;
  if (fechaRaw) {
    const m = fechaRaw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      const z = zonedNow(opts.tz, new Date());
      void z;
      const d = zonedToUTC(opts.tz, {
        year: Number(m[1]),
        month: Number(m[2]),
        day: Number(m[3]),
        hour: 12,
        minute: 0,
      });
      fecha = d.toISOString();
    }
  }

  const { data, error } = await opts.admin
    .from("lista_espera")
    .insert({
      negocio_id: opts.negocio.id,
      cliente_id: opts.cliente.id,
      servicio: servicio?.nombre || servicioName || null,
      profesional,
      fecha_preferida: fecha,
      prioridad: 1,
      estado: "esperando",
    })
    .select("id")
    .single();
  if (error) return { content: JSON.stringify({ error: error.message }) };

  // Sugerencias con la agenda real: sin esto se ofrecían huecos ya ocupados
  const horizon = new Date(Date.now() + 14 * 24 * 3600 * 1000);
  const { data: citasFuturas } = await opts.admin
    .from("citas")
    .select("*")
    .eq("negocio_id", opts.negocio.id)
    .gte("inicio", new Date().toISOString())
    .lte("inicio", horizon.toISOString());

  const nearest = nextAvailableSlots({
    config: opts.config,
    citas: (citasFuturas || []) as Cita[],
    start: new Date(),
    durationMin: servicio?.duracion || opts.config.duracion_cita_default || 60,
    tz: opts.tz,
    maxResults: 3,
  });

  return {
    content: JSON.stringify({
      ok: true,
      espera_id: data?.id,
      sugerencias: nearest.map((d) => formatSlotInZone(d, opts.tz)),
    }),
  };
}
