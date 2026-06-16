import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import {
  getPasswordHash,
  getTotpSecret,
  isAdminConfigured,
  setAdminCookie,
} from "@/lib/admin-session";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 409 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const rl = rateLimit(`admin_login:${ip}`, 6, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "demasiados_intentos" }, { status: 429 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    password?: string;
    totp?: string;
  };
  const password = (body.password || "").trim();
  const totp = (body.totp || "").trim();
  if (!password || !/^\d{6}$/.test(totp)) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 400 });
  }

  const hash = getPasswordHash();
  const secret = getTotpSecret();
  if (!hash || !secret) {
    return NextResponse.json({ error: "not_configured" }, { status: 409 });
  }

  const passOk = await bcrypt.compare(password, hash);
  if (!passOk) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }
  if (!authenticator.check(totp, secret)) {
    return NextResponse.json({ error: "Código 2FA incorrecto" }, { status: 401 });
  }

  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
