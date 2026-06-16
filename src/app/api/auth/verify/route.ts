import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/auth-tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return redirectWithError("invalid");

  const hash = hashToken(token);
  const admin = createSupabaseAdminClient();

  const { data: row } = await admin
    .from("magic_tokens")
    .select("*")
    .eq("token_hash", hash)
    .maybeSingle();

  if (!row || row.used_at) return redirectWithError("invalid");
  if (new Date(row.expires_at).getTime() < Date.now()) return redirectWithError("expired");

  const { data: userData, error: userErr } = await admin.auth.admin.getUserById(row.negocio_id);
  if (userErr || !userData?.user?.email) return redirectWithError("auth_failed");

  const appUrl = process.env.APP_URL ?? "https://agendalix.com";

  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: userData.user.email,
    options: { redirectTo: `${appUrl}/panel/auth-callback` },
  });

  const tokenHash = linkData?.properties?.hashed_token;
  if (linkErr || !tokenHash) {
    console.error("[verify] generateLink failed:", linkErr?.message);
    return redirectWithError("auth_failed");
  }

  const res = NextResponse.redirect(new URL("/panel", appUrl));
  const supabase = createServerClient(
    (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)!,
    (process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  const { error: verifyErr } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });

  if (verifyErr) {
    console.error("[verify] verifyOtp failed:", verifyErr.message);
    return redirectWithError("auth_failed");
  }

  await admin.from("magic_tokens").update({ used_at: new Date().toISOString() }).eq("id", row.id);
  await admin.from("negocios").update({ last_login_at: new Date().toISOString() }).eq("id", row.negocio_id);

  return res;
}

function redirectWithError(code: string) {
  const appUrl = process.env.APP_URL ?? "https://agendalix.com";
  const url = new URL("/panel/login", appUrl);
  url.searchParams.set("error", code);
  return NextResponse.redirect(url);
}
