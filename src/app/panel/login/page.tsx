"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { isValidEmail } from "@/lib/validation";

function errorLabel(code: string | null): string | null {
  if (!code) return null;
  if (code === "invalid") return "Enlace inválido. Pide uno nuevo.";
  if (code === "expired") return "El enlace ha caducado. Pide uno nuevo.";
  if (code === "auth_failed") return "No pudimos iniciar sesión. Inténtalo de nuevo.";
  return "Error al iniciar sesión.";
}

function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const externalErr = errorLabel(params.get("error"));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "No pudimos enviar el email. Prueba de nuevo.");
        return;
      }
      setSent(true);
    } catch {
      setErr("No pudimos enviar el email. Prueba de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[420px] bg-white border border-linel rounded-2xl p-8 shadow-lift"
    >
      <div className="flex flex-col items-center mb-7">
        <Logo variant="mark" size={38} tone="light" />
        <h1 className="mt-5 font-serif text-[24px] font-medium text-inkl">Accede a tu panel</h1>
        <p className="text-[13px] text-inkl-soft mt-2 text-center">
          Te enviaremos un enlace mágico por email. Sin contraseñas.
        </p>
      </div>

      {sent ? (
        <div className="text-center text-[14px] text-inkl-soft py-4">
          <p className="text-inkl font-medium">Revisa tu email —</p>
          <p className="mt-1">enviamos el enlace a <span className="text-inkl font-medium">{email}</span></p>
          <p className="mt-4 text-[12px] text-inkl-mute">
            Puede tardar 1 minuto. Revisa también tu carpeta de spam.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input
            tone="light"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {externalErr ? <p className="text-[12px] text-[#B23B3B]">{externalErr}</p> : null}
          {err ? <p className="text-[12px] text-[#B23B3B]">{err}</p> : null}
          <Button tone="light" type="submit" disabled={!isValidEmail(email)} loading={loading}>
            Enviar enlace de acceso
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-[12px] text-inkl-mute">
        ¿Aún no tienes cuenta? <a href="/registro" className="text-brand-deep font-medium hover:text-brand">Créala gratis</a>
      </p>
    </motion.div>
  );
}

export default function Page() {
  return (
    <main className="surface-light min-h-screen bg-paper text-inkl flex items-center justify-center px-6">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
