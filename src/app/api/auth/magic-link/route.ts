import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendMagicLinkEmail } from "@/lib/resend";
import { generateMagicToken } from "@/lib/auth-tokens";
import { isValidEmail } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = (await req.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }
  const email = (body.email || "").trim().toLowerCase();
  if (!isValidEmail(email)) return NextResponse.json({ error: "Email inválido" }, { status: 400 });

  // Evita el bombardeo de emails: por IP y por dirección de destino
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const rlIp = rateLimit(`magic:ip:${ip}`, 10, 15 * 60_000);
  const rlEmail = rateLimit(`magic:to:${email}`, 3, 15 * 60_000);
  if (!rlIp.allowed || !rlEmail.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera unos minutos y prueba de nuevo." },
      { status: 429 },
    );
  }

  const admin = createSupabaseAdminClient();
  const { data: negocio } = await admin
    .from("negocios")
    .select("id,email,status")
    .eq("email", email)
    .maybeSingle();

  if (!negocio) {
    return NextResponse.json(
      { error: "No existe ninguna cuenta con ese email. ¿Quieres registrarte?" },
      { status: 404 },
    );
  }

  const status = (negocio as { status?: string | null }).status ?? "ACTIVE";
  if (status === "PENDING") {
    return NextResponse.json(
      { error: "Tu solicitud está pendiente de aprobación. Te avisaremos por email cuando esté lista." },
      { status: 403 },
    );
  }
  if (status === "REJECTED") {
    return NextResponse.json(
      { error: "Tu cuenta no fue aprobada. Contacta con soporte si crees que es un error." },
      { status: 403 },
    );
  }

  const { token, hash } = generateMagicToken();
  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await admin.from("magic_tokens").insert({
    token_hash: hash,
    email,
    negocio_id: negocio.id,
    expires_at: expires,
  });

  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "https://agendalix.com";
  const magicLink = `${appUrl}/api/auth/verify?token=${encodeURIComponent(token)}`;

  try {
    await sendMagicLinkEmail({ to: email, magicLink });
  } catch (err) {
    console.error("Resend magic link failed", err);
    return NextResponse.json({ error: "No pudimos enviar el email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
