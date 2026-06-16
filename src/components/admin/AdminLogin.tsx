"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

export function AdminLogin() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/admin";
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!password) {
      setError("Introduce la contraseña");
      return;
    }
    if (!/^\d{6}$/.test(totp)) {
      setError("Código 2FA inválido");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, totp }),
      });
      if (res.status === 429) {
        setError("Demasiados intentos, espera un minuto");
        return;
      }
      if (res.status === 409) {
        router.replace("/admin/setup");
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Credenciales inválidas");
        return;
      }
      router.replace(from.startsWith("/admin") ? from : "/admin");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-6 py-12 bg-[#070707]">
      <div className="w-full max-w-[440px] bg-bg-card border-[0.5px] border-line-subtle rounded-2xl p-8">
        <h1 className="text-[22px] font-medium text-white">Panel administrador</h1>
        <p className="text-[13px] text-ink-secondary mt-1">
          Introduce tu contraseña y el código de 6 dígitos de tu app de autenticación.
        </p>

        <form onSubmit={submit} className="flex flex-col gap-3 mt-6">
          <Input
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="Código de 6 dígitos"
            inputMode="numeric"
            maxLength={6}
            value={totp}
            onChange={(e) => setTotp(e.target.value.replace(/\D/g, ""))}
            error={error || undefined}
          />
          <Button type="submit" loading={submitting} className="mt-2">
            Entrar
          </Button>
        </form>
      </div>
    </main>
  );
}
