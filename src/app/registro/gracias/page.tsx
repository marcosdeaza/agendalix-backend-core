"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { AnimatedCheck } from "@/components/ui/AnimatedCheck";

function Content() {
  const params = useSearchParams();
  const email = params.get("email") || "";
  return (
    <main className="surface-light min-h-screen bg-paper text-inkl flex flex-col">
      <header className="px-6 py-5 border-b border-linel">
        <div className="mx-auto max-w-content">
          <a href="/" aria-label="Volver a Agendalix" className="hover:opacity-90 inline-block">
            <Logo variant="compact" size={30} tone="light" />
          </a>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="flex flex-col items-center text-center max-w-[460px]">
          <AnimatedCheck />
          <h1 className="mt-6 font-serif text-[30px] font-medium text-inkl leading-tight">¡Todo listo!</h1>
          <p className="mt-3 text-[15px] text-inkl-soft leading-relaxed">
            {email ? (
              <>
                Te hemos enviado un email a <span className="text-inkl font-medium">{email}</span> con tu enlace de acceso.
                Revisa tu bandeja de entrada (y la carpeta de spam por si acaso).
              </>
            ) : (
              "Te hemos enviado un email con tu enlace de acceso. Revisa tu bandeja."
            )}
          </p>
          <p className="mt-6 text-[12px] text-inkl-mute">
            ¿No te llega? Espera 1 minuto y revisa spam.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Content />
    </Suspense>
  );
}
