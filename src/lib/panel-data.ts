import { createSupabaseServerClient } from "./supabase/server";
import { createSupabaseAdminClient } from "./supabase/admin";
import { cookies, headers } from "next/headers";
import type {
  AgenteConfig,
  Cita,
  Cliente,
  Conversacion,
  Negocio,
} from "./supabase/database.types";

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function getRawCookie(name: string): string | undefined {
  const cookieHeader = headers().get("cookie");
  if (!cookieHeader) return undefined;
  const prefix = `${name}=`;
  return cookieHeader
    .split(/;\s*/)
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
}

function getAccessTokenFromCookieStore(): string | null {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const baseName = `sb-${projectRef}-auth-token`;
  const cookieStore = cookies();
  const direct = getRawCookie(baseName) || cookieStore.get(baseName)?.value;
  const raw =
    direct ||
    Array.from(
      { length: 5 },
      (_, i) => getRawCookie(`${baseName}.${i}`) || cookieStore.get(`${baseName}.${i}`)?.value,
    )
      .filter((value): value is string => Boolean(value))
      .join("");

  if (!raw) return null;

  try {
    const json = raw.startsWith("base64-") ? base64UrlDecode(raw.slice("base64-".length)) : raw;
    const parsed = JSON.parse(json) as { access_token?: string };
    return parsed.access_token || null;
  } catch {
    return null;
  }
}

function getUserIdFromJwt(accessToken: string): string | null {
  try {
    const [, payload] = accessToken.split(".");
    if (!payload) return null;
    const json = base64UrlDecode(payload);
    const parsed = JSON.parse(json) as { sub?: string; exp?: number };
    if (!parsed.sub) return null;
    if (parsed.exp && parsed.exp * 1000 < Date.now()) return null;
    return parsed.sub;
  } catch {
    return null;
  }
}

export async function getCurrentNegocio(): Promise<Negocio | null> {
  const sb = createSupabaseServerClient();
  const { data: auth } = await sb.auth.getUser();
  let userId = auth.user?.id;

  if (!userId) {
    const accessToken = getAccessTokenFromCookieStore();
    if (!accessToken) return null;
    const adminForAuth = createSupabaseAdminClient();
    const { data: fallbackAuth } = await adminForAuth.auth.getUser(accessToken);
    userId = fallbackAuth.user?.id || getUserIdFromJwt(accessToken) || undefined;
  }

  if (!userId) return null;

  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("negocios").select("*").eq("id", userId).maybeSingle();
  return (data as Negocio) || null;
}

export async function getAgenteConfig(negocioId: string): Promise<AgenteConfig | null> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("agente_config").select("*").eq("negocio_id", negocioId).maybeSingle();
  return (data as AgenteConfig) || null;
}

export async function getCitasRange(
  negocioId: string,
  start: Date,
  end: Date,
): Promise<Cita[]> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("citas")
    .select("*")
    .eq("negocio_id", negocioId)
    .gte("inicio", start.toISOString())
    .lte("inicio", end.toISOString())
    .order("inicio", { ascending: true });
  return (data || []) as Cita[];
}

export async function getClientes(negocioId: string): Promise<Cliente[]> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("clientes")
    .select("*")
    .eq("negocio_id", negocioId)
    .order("created_at", { ascending: false });
  return (data || []) as Cliente[];
}

export async function getConversaciones(negocioId: string): Promise<Conversacion[]> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("conversaciones")
    .select("*")
    .eq("negocio_id", negocioId)
    .neq("cliente_telefono", "__soporte__")
    .order("updated_at", { ascending: false });
  return (data || []) as Conversacion[];
}

export async function getUnreadCount(negocioId: string): Promise<number> {
  const convos = await getConversaciones(negocioId);
  let unread = 0;
  for (const c of convos) {
    const leidaAt = new Date(c.leida_hasta).getTime();
    const msgs = Array.isArray(c.mensajes) ? c.mensajes : [];
    const latest = msgs[msgs.length - 1];
    if (latest && latest.role === "cliente" && new Date(latest.timestamp).getTime() > leidaAt) {
      unread += 1;
    }
  }
  return unread;
}
