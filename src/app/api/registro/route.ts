import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail, sendAdminNewUserEmail } from "@/lib/resend";
import { generateMagicToken } from "@/lib/auth-tokens";
import { isValidEmail, isValidSpanishPhone, isValidHHMM } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { isValidTimezone, isValidCurrency } from "@/lib/timezone";
import type { Horarios, Servicio } from "@/lib/supabase/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  nombre?: string;
  sector?: string;
  tuNombre?: string;
  email?: string;
  telefono?: string;
  zona_horaria?: string;
  moneda?: string;
  horarios?: Horarios;
  servicios?: Servicio[];
};

export async function POST(req: Request) {
  // Frena la creación masiva de cuentas y el spam de emails transaccionales
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const rl = rateLimit(`registro:${ip}`, 5, 60 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Prueba de nuevo en un rato." },
      { status: 429 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const nombre = (body.nombre || "").trim();
  const sector = (body.sector || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const telefono = (body.telefono || "").trim();
  const zona_horaria = (body.zona_horaria || "Europe/Madrid").trim();
  const moneda = (body.moneda || "EUR").trim().toUpperCase();
  const horarios = body.horarios || {};
  const servicios = Array.isArray(body.servicios) ? body.servicios : [];

  if (!nombre || !sector) return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  if (!isValidEmail(email)) return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  if (telefono && !isValidSpanishPhone(telefono))
    return NextResponse.json({ error: "Teléfono inválido" }, { status: 400 });
  if (!isValidTimezone(zona_horaria))
    return NextResponse.json({ error: "Zona horaria inválida" }, { status: 400 });
  if (!isValidCurrency(moneda))
    return NextResponse.json({ error: "Moneda inválida" }, { status: 400 });
  if (servicios.length === 0)
    return NextResponse.json({ error: "Añade al menos un servicio" }, { status: 400 });

  for (const s of servicios) {
    if (!s.nombre?.trim()) return NextResponse.json({ error: "Todos los servicios necesitan nombre" }, { status: 400 });
    if (!Number.isFinite(s.duracion) || s.duracion < 5)
      return NextResponse.json({ error: "Duración mínima 5 min" }, { status: 400 });
    if (!Number.isFinite(s.precio) || s.precio < 0)
      return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
  }

  for (const k of Object.keys(horarios) as Array<keyof Horarios>) {
    const h = horarios[k];
    if (!h) continue;
    if (h.abierto && (!isValidHHMM(h.apertura) || !isValidHHMM(h.cierre) || h.apertura >= h.cierre)) {
      return NextResponse.json({ error: "Horarios inválidos" }, { status: 400 });
    }
  }

  const admin = createSupabaseAdminClient();

  const { data: exists } = await admin
    .from("negocios")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (exists) {
    return NextResponse.json(
      { error: "Ya existe una cuenta con ese email. Usa el login para acceder." },
      { status: 409 },
    );
  }

  // Un teléfono = una cuenta: evita altas duplicadas del mismo negocio con
  // emails distintos. Comparamos normalizando a solo dígitos con prefijo 34.
  if (telefono) {
    const norm = (t: string) => {
      const d = t.replace(/\D/g, "");
      return d.length === 9 ? `34${d}` : d.replace(/^00/, "");
    };
    const target = norm(telefono);
    const { data: conTel } = await admin
      .from("negocios")
      .select("telefono")
      .not("telefono", "is", null);
    const dup = (conTel || []).some(
      (r) => r.telefono && norm(r.telefono as string) === target,
    );
    if (dup) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese teléfono. Si es tuya, entra desde el login o escríbenos a contacto@agendalix.com." },
        { status: 409 },
      );
    }
  }

  const authRes = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { nombre_negocio: nombre, owner: body.tuNombre || null },
  });
  if (authRes.error || !authRes.data.user) {
    return NextResponse.json(
      { error: authRes.error?.message || "No pudimos crear el usuario" },
      { status: 500 },
    );
  }
  const uid = authRes.data.user.id;

  // Alta self-service: la cuenta queda activa al instante con 30 días de
  // prueba (trial_ends_at lo pone la BD). El onboarding guiado se muestra
  // en el primer acceso al panel.
  const { error: negErr } = await admin
    .from("negocios")
    .insert({
      id: uid,
      nombre,
      sector,
      email,
      telefono: telefono || null,
      zona_horaria,
      moneda,
      activo: true,
      status: "ACTIVE",
      onboarding_completo: false,
      trial_ends_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    });
  if (negErr) {
    await admin.auth.admin.deleteUser(uid);
    return NextResponse.json({ error: negErr.message }, { status: 500 });
  }

  const cleanServicios: Servicio[] = servicios.map((s) => ({
    id: s.id || crypto.randomUUID(),
    nombre: s.nombre.trim(),
    duracion: Math.round(s.duracion),
    precio: Number(s.precio),
  }));

  const { error: cfgErr } = await admin.from("agente_config").insert({
    negocio_id: uid,
    servicios: cleanServicios,
    horarios,
    profesionales: [],
    dias_cierre: [],
    duracion_cita_default: cleanServicios[0]?.duracion || 60,
  });
  if (cfgErr) {
    return NextResponse.json({ error: cfgErr.message }, { status: 500 });
  }

  const appUrl = process.env.APP_URL || "https://agendalix.com";
  const firstName = (body.tuNombre || nombre).split(" ")[0];

  // Email de bienvenida con acceso directo al panel (magic link)
  try {
    const { token, hash } = generateMagicToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await admin.from("magic_tokens").insert({
      token_hash: hash,
      email,
      negocio_id: uid,
      expires_at: expires,
    });
    const magicLink = `${appUrl}/api/auth/verify?token=${encodeURIComponent(token)}`;
    await sendWelcomeEmail({ to: email, nombre: firstName, negocioNombre: nombre, magicLink });
  } catch (err) {
    console.error("Resend welcome email failed", err);
  }

  // Aviso informativo al equipo (ya no requiere aprobación)
  try {
    await sendAdminNewUserEmail({
      email,
      nombre,
      negocioId: uid,
      adminPanelUrl: `${appUrl}/admin/negocios`,
    });
  } catch (err) {
    console.error("Resend admin notification failed", err);
  }

  return NextResponse.json({ ok: true, active: true });
}
