"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

export function AdminSetup() {
  const router = useRouter();
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [totp, setTotp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/setup");
        if (res.status === 409) {
          router.replace("/admin/login");
          return;
        }
        const data = (await res.json()) as { qr: string; secret: string };
        setQr(data.qr);
        setSecret(data.secret);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 10) {
      setError("Contraseña mínima de 10 caracteres");
      return;
    }
    if (password !== password2) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (!/^\d{6}$/.test(totp)) {
      setError("Código 2FA inválido");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, totp }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "No se pudo completar");
        return;
      }
      router.replace("/admin");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-6 py-12 bg-[#070707]">
      <div className="w-full max-w-[440px] bg-bg-card border-[0.5px] border-line-subtle rounded-2xl p-8">
        <h1 className="text-[22px] font-medium text-white">Configurar administrador</h1>
        <p className="text-[13px] text-ink-secondary mt-1">
          Escanea el QR en Google Authenticator o similar, define una contraseña segura e introduce
          el código de 6 dígitos.
        </p>

        {loading ? (
          <p className="text-[13px] text-ink-muted mt-6">Generando QR…</p>
        ) : (
          <>
            {qr ? (
              <div className="flex flex-col items-center mt-6 gap-2">
                <img src={qr} alt="Código QR" className="rounded-lg border-[0.5px] border-line-subtle bg-white p-2 w-44 h-44" />
                {secret ? (
                  <code className="text-[11px] text-ink-muted break-all text-center">{secret}</code>
                ) : null}
              </div>
            ) : null}

            <form onSubmit={submit} className="flex flex-col gap-3 mt-6">
              <Input
                label="Nueva contraseña"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Input
                label="Repite la contraseña"
                type="password"
                autoComplete="new-password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
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
                Activar panel admin
              </Button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
