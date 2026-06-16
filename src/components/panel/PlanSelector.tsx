"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { IconCheck, IconSparkle } from "@/components/icons/Icons";
import type { Plan } from "@/lib/supabase/database.types";

const EASE = [0.22, 1, 0.36, 1] as const;

type PlanCard = {
  id: Exclude<Plan, "trial">;
  name: string;
  price: number;
  tagline: string;
  featured?: boolean;
  features: string[];
};

const PLANS: PlanCard[] = [
  {
    id: "basico",
    name: "Básico",
    price: 39,
    tagline: "Para empezar a delegar el teléfono",
    features: ["WhatsApp automático 24h", "Recordatorios de cita", "1 profesional", "Soporte por email"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 79,
    featured: true,
    tagline: "El negocio entero en piloto automático",
    features: [
      "Todo lo del plan Básico",
      "Lista de espera inteligente",
      "Recuperación de clientes dormidos",
      "Informe semanal + Excel",
      "Hasta 5 profesionales",
      "Soporte prioritario",
    ],
  },
  {
    id: "clinica",
    name: "Clínica",
    price: 129,
    tagline: "Para equipos y varios centros",
    features: [
      "Todo lo del plan Pro",
      "Multi-sede",
      "Profesionales ilimitados",
      "Onboarding personalizado",
      "Soporte WhatsApp directo",
    ],
  },
];

export function PlanSelector({
  trialExpired,
  trialDaysLeft,
  currentPlan,
  hasSubscription,
}: {
  trialExpired: boolean;
  trialDaysLeft: number | null;
  currentPlan: Plan;
  hasSubscription: boolean;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkout(plan: PlanCard["id"]) {
    setLoading(plan);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "No pudimos iniciar el pago");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setLoading(null);
    }
  }

  async function openPortal() {
    setLoading("portal");
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "No pudimos abrir el portal");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setLoading(null);
    }
  }

  return (
    <div className="max-w-[960px] mx-auto">
      <header className="text-center mb-10">
        {trialExpired ? (
          <>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#BA751726] border border-[#BA751755] text-[#F2B560] text-[12px] px-3.5 py-1.5 mb-5">
              <IconSparkle size={14} /> Tu prueba gratuita ha terminado
            </span>
            <h1 className="text-[26px] sm:text-[32px] font-medium text-white">
              Tu asistente está en pausa. Reactívalo en 2 minutos.
            </h1>
            <p className="mt-3 text-[14px] text-ink-secondary max-w-[480px] mx-auto">
              Tus citas, clientes y conversaciones siguen guardados. Elige un plan
              y todo vuelve a funcionar exactamente donde lo dejaste.
            </p>
          </>
        ) : (
          <>
            {trialDaysLeft !== null && (
              <span className="inline-flex items-center gap-2 rounded-full bg-[#2E8F6626] border border-[#2E8F6655] text-[#7FC9A6] text-[12px] px-3.5 py-1.5 mb-5">
                <IconSparkle size={14} />
                {trialDaysLeft > 0
                  ? `Te quedan ${trialDaysLeft} ${trialDaysLeft === 1 ? "día" : "días"} de prueba`
                  : "Prueba activa"}
              </span>
            )}
            <h1 className="text-[26px] sm:text-[32px] font-medium text-white">
              Elige tu plan
            </h1>
            <p className="mt-3 text-[14px] text-ink-secondary">
              Sin permanencia. Cancela cuando quieras desde aquí mismo.
            </p>
          </>
        )}
      </header>

      {error && (
        <p className="text-center text-[13px] text-[#E08383] mb-6">{error}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((p, i) => {
          const isCurrent = currentPlan === p.id;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.08, ease: EASE }}
              className={[
                "relative rounded-2xl bg-bg-card p-6 flex flex-col",
                p.featured
                  ? "border border-purple shadow-featured md:-translate-y-1.5"
                  : "border-[0.5px] border-line-subtle",
              ].join(" ")}
            >
              {p.featured && (
                <span className="absolute -top-3 left-6 inline-flex items-center bg-purple text-white text-[11px] font-medium px-3 py-1 rounded-full">
                  El que eligen casi todos
                </span>
              )}
              <h2 className="text-[18px] text-white font-medium">{p.name}</h2>
              <p className="mt-0.5 text-[12px] text-ink-muted italic">{p.tagline}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-[38px] leading-none text-white font-medium">{p.price}€</span>
                <span className="text-[12px] text-ink-muted">/mes</span>
              </div>
              <ul className="mt-5 mb-6 flex flex-col gap-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[13px] text-ink-secondary">
                    <span className="mt-0.5 text-purple shrink-0">
                      <IconCheck size={14} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => checkout(p.id)}
                disabled={loading !== null || (isCurrent && hasSubscription)}
                className={[
                  "mt-auto inline-flex items-center justify-center gap-2 rounded-full text-[14px] font-medium h-11 transition-all duration-150 disabled:opacity-50",
                  p.featured
                    ? "bg-purple text-white hover:bg-purple-dark"
                    : "border-[0.5px] border-line-mid text-white hover:border-purple",
                ].join(" ")}
              >
                {loading === p.id ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : isCurrent && hasSubscription ? (
                  "Tu plan actual"
                ) : (
                  `Elegir ${p.name}`
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-10 text-center">
        {hasSubscription ? (
          <button
            type="button"
            onClick={openPortal}
            disabled={loading !== null}
            className="text-[13px] text-ink-secondary hover:text-white underline underline-offset-4 transition-colors"
          >
            {loading === "portal" ? "Abriendo portal…" : "Gestionar o cancelar mi suscripción"}
          </button>
        ) : (
          <p className="text-[12px] text-ink-muted max-w-[440px] mx-auto">
            Pago seguro con Stripe. Podrás cambiar de plan, actualizar la tarjeta o
            cancelar en cualquier momento desde esta misma página — sin llamadas ni emails.
          </p>
        )}
      </div>
    </div>
  );
}
