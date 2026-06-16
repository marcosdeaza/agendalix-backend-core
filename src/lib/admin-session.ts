import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

export const ADMIN_COOKIE = "agx_admin";

function secret() {
  const s = process.env.ADMIN_JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("ADMIN_JWT_SECRET (or NEXTAUTH_SECRET) is not configured");
  return new TextEncoder().encode(s);
}

export async function issueAdminJwt(): Promise<string> {
  return await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .setSubject("admin")
    .sign(secret());
}

export async function verifyAdminJwt(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function isAdminRequest(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return await verifyAdminJwt(token);
}

export async function setAdminCookie() {
  const token = await issueAdminJwt();
  cookies().set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export function clearAdminCookie() {
  cookies().set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

// ─── TOTP secret persistence ─────────────────────────
// We prefer env (TOTP_SECRET) for production. In dev / first-time setup,
// we persist to data/admin.json so /admin/setup survives restarts.

const ADMIN_FILE = path.join(process.cwd(), "data", "admin.json");

type AdminFile = {
  totp_secret?: string;
  password_hash?: string;
};

function readAdminFile(): AdminFile {
  try {
    const raw = fs.readFileSync(ADMIN_FILE, "utf8");
    return JSON.parse(raw) as AdminFile;
  } catch {
    return {};
  }
}

function writeAdminFile(data: AdminFile) {
  const dir = path.dirname(ADMIN_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(ADMIN_FILE, JSON.stringify(data, null, 2), "utf8");
}

export function getTotpSecret(): string | null {
  return process.env.TOTP_SECRET || readAdminFile().totp_secret || null;
}

export function saveTotpSecret(secret: string) {
  const data = readAdminFile();
  data.totp_secret = secret;
  writeAdminFile(data);
}

export function getPasswordHash(): string | null {
  return process.env.ADMIN_PASSWORD_HASH || readAdminFile().password_hash || null;
}

export function savePasswordHash(hash: string) {
  const data = readAdminFile();
  data.password_hash = hash;
  writeAdminFile(data);
}

export function isAdminConfigured(): boolean {
  return !!getTotpSecret() && !!getPasswordHash();
}
