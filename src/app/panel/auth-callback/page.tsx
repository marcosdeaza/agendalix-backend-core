"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const [error, setError] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function completeLogin() {
      const query = new URLSearchParams(window.location.search);
      const code = query.get("code");
      const queryError = query.get("error");

      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const hashError = params.get("error");

      try {
        if (queryError || hashError) throw new Error(queryError || hashError || "auth_failed");

        if (code) {
          const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) throw exchangeErr;
        } else if (accessToken && refreshToken) {
          const { error: sessionErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionErr) throw sessionErr;
        } else {
          throw new Error("missing auth tokens");
        }

        window.location.replace("/panel");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "auth_failed";
        console.error("[auth-callback] login error:", msg);
        setError(true);
        window.location.replace("/panel/login?error=auth_failed");
      }
    }

    void completeLogin();
  }, []);

  if (error) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted">Iniciando sesión…</p>
      </div>
    </div>
  );
}
