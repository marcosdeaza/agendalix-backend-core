import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import {
  getPasswordHash,
  getTotpSecret,
  isAdminConfigured,
  savePasswordHash,
  saveTotpSecret,
  setAdminCookie,
} from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET: ensure a TOTP secret exists (pending-setup state) and return a QR.
// Once configuration is complete, returns 409 so the UI redirects to /admin/login.
export async function GET() {
  if (isAdminConfigured()) {
    return NextResponse.json({ error: "already_configured" }, { status: 409 });
  }
  let secret = getTotpSecret();
  if (!secret) {
    secret = authenticator.generateSecret();
    saveTotpSecret(secret);
  }
  const label = "Agendalix%20Admin";
  const issuer = "Agendalix";
  const otpauth = authenticator.keyuri("admin", issuer, secret);
  const qr = await QRCode.toDataURL(otpauth);
  return NextResponse.json({ secret, otpauth, qr, needsPassword: !getPasswordHash(), label });
}

export async function POST(req: Request) {
  if (isAdminConfigured()) {
    return NextResponse.json({ error: "already_configured" }, { status: 409 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    password?: string;
    totp?: string;
  };
  const password = (body.password || "").trim();
  const totp = (body.totp || "").trim();
  if (password.length < 10) {
    return NextResponse.json({ error: "Contraseña mínima de 10 caracteres" }, { status: 400 });
  }
  if (!/^\d{6}$/.test(totp)) {
    return NextResponse.json({ error: "Código 2FA inválido" }, { status: 400 });
  }

  const secret = getTotpSecret();
  if (!secret) {
    return NextResponse.json({ error: "Secreto TOTP no generado" }, { status: 400 });
  }
  if (!authenticator.check(totp, secret)) {
    return NextResponse.json({ error: "Código 2FA incorrecto" }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 12);
  savePasswordHash(hash);
  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
