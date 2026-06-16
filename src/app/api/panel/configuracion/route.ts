import { NextResponse } from "next/server";
import { getCurrentNegocio } from "@/lib/panel-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isValidHHMM } from "@/lib/validation";
import type {
  Horarios,
  Profesional,
  Servicio,
} from "@/lib/supabase/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanServicios(raw: unknown): Servicio[] | { error: string } {
  if (!Array.isArray(raw)) return [];
  const out: Servicio[] = [];
  for (const s of raw as Array<Partial<Servicio>>) {
    const nombre = (s.nombre || "").toString().trim();
    if (!nombre) return { error: "Todos los servicios necesitan nombre" };
    const duracion = Number(s.duracion);
    if (!Number.isFinite(duracion) || duracion < 5)
      return { error: "Duración mínima 5 min" };
    const precio = Number(s.precio);
    if (!Number.isFinite(precio) || precio < 0)
      return { error: "Precio inválido" };
    out.push({
      id: (s.id || crypto.randomUUID()).toString(),
      nombre,
      duracion: Math.round(duracion),
      precio,
    });
  }
  return out;
}

function cleanHorarios(raw: unknown): Horarios | { error: string } {
  if (!raw || typeof raw !== "object") return {};
  const src = raw as Horarios;
  const keys: Array<keyof Horarios> = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];
  const out: Horarios = {};
  for (const k of keys) {
    const h = src[k];
    if (!h) continue;
    if (h.abierto) {
      if (!isValidHHMM(h.apertura) || !isValidHHMM(h.cierre) || h.apertura >= h.cierre)
        return { error: `Horario inválido en ${k}` };
    }
    out[k] = {
      abierto: !!h.abierto,
      apertura: h.apertura || "09:00",
      cierre: h.cierre || "20:00",
    };
  }
  return out;
}

function cleanProfesionales(raw: unknown, servicioIds: Set<string>): Profesional[] {
  if (!Array.isArray(raw)) return [];
  const out: Profesional[] = [];
  for (const p of raw as Array<Partial<Profesional>>) {
    const nombre = (p.nombre || "").toString().trim();
    if (!nombre) continue;
    const servicios = Array.isArray(p.servicios)
      ? p.servicios.filter((id) => servicioIds.has(id))
      : [];
    out.push({
      id: (p.id || crypto.randomUUID()).toString(),
      nombre,
      servicios,
    });
  }
  return out;
}

export async function PATCH(req: Request) {
  const negocio = await getCurrentNegocio();
  if (!negocio) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createSupabaseAdminClient();
  const body = (await req.json().catch(() => ({}))) as {
    mensaje_bienvenida?: string;
    servicios?: unknown;
    horarios?: unknown;
    profesionales?: unknown;
    duracion_cita_default?: number;
  };

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.mensaje_bienvenida === "string") {
    patch.mensaje_bienvenida = body.mensaje_bienvenida.trim();
  }

  let servicios: Servicio[] | null = null;
  if (body.servicios !== undefined) {
    const res = cleanServicios(body.servicios);
    if ("error" in res) return NextResponse.json({ error: res.error }, { status: 400 });
    servicios = res;
    patch.servicios = servicios;
  }
  if (body.horarios !== undefined) {
    const res = cleanHorarios(body.horarios);
    if ("error" in res) return NextResponse.json({ error: res.error }, { status: 400 });
    // Preserve internal meta keys (prefixed with _) such as _recordatorios and _sent_log
    const { data: existingForMeta } = await admin
      .from("agente_config")
      .select("horarios")
      .eq("negocio_id", negocio.id)
      .maybeSingle();
    const existingH = (existingForMeta?.horarios ?? {}) as Record<string, unknown>;
    const meta: Record<string, unknown> = {};
    for (const k of Object.keys(existingH)) {
      if (k.startsWith("_")) meta[k] = existingH[k];
    }
    patch.horarios = { ...res, ...meta };
  }
  if (body.profesionales !== undefined) {
    const ids = new Set((servicios || []).map((s) => s.id));
    // If not updating servicios this request, fetch current ones to validate prof.servicios
    if (servicios === null) {
      const { data: cfg } = await admin
        .from("agente_config")
        .select("servicios")
        .eq("negocio_id", negocio.id)
        .maybeSingle();
      for (const s of (cfg?.servicios || []) as Servicio[]) ids.add(s.id);
    }
    patch.profesionales = cleanProfesionales(body.profesionales, ids);
  }
  if (typeof body.duracion_cita_default === "number" && body.duracion_cita_default >= 5) {
    patch.duracion_cita_default = Math.round(body.duracion_cita_default);
  }

  const { error } = await admin
    .from("agente_config")
    .update(patch)
    .eq("negocio_id", negocio.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
