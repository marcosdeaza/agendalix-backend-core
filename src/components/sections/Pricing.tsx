"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CURRENCIES, TIMEZONE_CURRENCY } from "@/lib/timezone";

const EASE = [0.22, 1, 0.36, 1] as const;

// Fixed exchange rates from EUR (auditable, no external API)
const FX: Record<string, number> = {
  EUR: 1, GBP: 0.86, USD: 1.08, MXN: 20.5, COP: 4400,
  PEN: 4.1, CLP: 1020, ARS: 1050, UYU: 42,
};

function detectCurrency(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const saved = typeof window !== "undefined" && localStorage.getItem("agx_currency");
    if (saved && CURRENCIES.find((c) => c.value === saved)) return saved;
    return TIMEZONE_CURRENCY[tz] ?? "EUR";
  } catch { return "EUR"; }
}

function convertPrice(eur: number, code: string): string {
  const rate = FX[code] ?? 1;
  const converted = Math.round(eur * rate);
  const sym = CURRENCIES.find((c) => c.value === code)?.symbol ?? code;
  return sym + String(converted);
}

type Plan = { name: string; priceEUR: number; featured?: boolean; badge?: string; tagline: string; features: string[]; };

const PLANS: Plan[] = [
  {
    name: "Básico",
    priceEUR: 39,
    tagline: "Para empezar a delegar el teléfono",
    features: ["WhatsApp automático 24h", "Recordatorios de cita", "1 profesional", "Soporte por email"],
  },
  {
    name: "Pro",
    priceEUR: 79,
    featured: true,
    badge: "El que eligen casi todos",
    tagline: "El negocio entero en piloto automático",
    features: ["Todo lo del plan Básico", "Lista de espera inteligente", "Recuperación de clientes dormidos", "Informe semanal + Excel", "Hasta 5 profesionales", "Soporte prioritario"],
  },
  {
    name: "Clínica",
    priceEUR: 129,
    tagline: "Para equipos y varios centros",
    features: ["Todo lo del plan Pro", "Multi-sede", "Profesionales ilimitados", "Onboarding personalizado", "Soporte WhatsApp directo"],
  },
];

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 py-2.5 border-b border-linel/70 last:border-b-0">
      <svg className="mt-0.5 shrink-0 text-brand" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m5 12.5 4.2 4.2L19 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-[13.5px] text-inkl-soft">{children}</span>
    </li>
  );
}

export function Pricing() {
  const [currency, setCurrency] = useState("EUR");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCurrency(detectCurrency());
    setMounted(true);
  }, []);

  const currencyLabel = CURRENCIES.find((c) => c.value === currency)?.label ?? currency;

  function handleCurrencyChange(code: string) {
    setCurrency(code);
    try { localStorage.setItem("agx_currency", code); } catch { /* ignore */ }
  }

  return (
    <section id="pricing" className="px-6 py-24 sm:py-28 bg-paper-warm" aria-labelledby="pricing-heading">
      <div className="mx-auto max-w-content text-center">
        <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }} className="text-label uppercase font-medium text-brand-deep tracking-[0.14em]">
          Precios
        </motion.p>
        <motion.h2 id="pricing-heading" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.5, delay: 0.1, ease: EASE }} className="mt-4 font-serif text-[30px] sm:text-[40px] text-inkl" style={{ lineHeight: 1.12 }}>
          Menos de lo que cuesta una cita perdida.
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4, delay: 0.15 }} className="mt-4 text-[15px] text-inkl-soft">
          30 días gratis en cualquier plan. Sin permanencia. Sin comisiones por reserva.
        </motion.p>

        {mounted && (
          <div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
            <span className="text-[12px] text-inkl-mute">Mostrar en:</span>
            {CURRENCIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => handleCurrencyChange(c.value)}
                className={[
                  "text-[12px] px-2.5 py-1 rounded-full border transition-colors duration-150",
                  currency === c.value
                    ? "border-brand bg-brand-soft text-brand-deep font-medium"
                    : "border-linel text-inkl-mute hover:border-brand/50 hover:text-inkl",
                ].join(" ")}
              >
                {c.symbol} {c.value}
              </button>
            ))}
          </div>
        )}
        {mounted && currency !== "EUR" && (
          <p className="mt-2 text-[11px] text-inkl-mute">
            Precios en {currencyLabel} · cambio orientativo, facturación en EUR
          </p>
        )}

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
              className={[
                "relative rounded-2xl bg-white p-7 flex flex-col",
                plan.featured
                  ? "border-2 border-brand shadow-lift md:-translate-y-2"
                  : "border border-linel shadow-card",
              ].join(" ")}
            >
              {plan.badge && (
                <span className="absolute -top-3.5 left-7 inline-flex items-center bg-brand text-white text-[11.5px] font-medium px-3.5 py-1 rounded-full tracking-wide">
                  {plan.badge}
                </span>
              )}
              <h3 className="font-serif text-[22px] text-inkl font-medium">{plan.name}</h3>
              <p className="mt-1 text-[13px] text-inkl-mute italic font-serif">{plan.tagline}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-serif text-[44px] leading-none text-inkl font-medium">
                  {mounted ? convertPrice(plan.priceEUR, currency) : plan.priceEUR + "€"}
                </span>
                <span className="text-[13px] text-inkl-mute">/mes</span>
              </div>
              <ul className="mt-6 mb-8">
                {plan.features.map((f) => (<Bullet key={f}>{f}</Bullet>))}
              </ul>
              <Link
                href="/registro"
                className={[
                  "mt-auto inline-flex items-center justify-center rounded-full text-[14.5px] font-medium py-3.5 transition-all duration-150",
                  plan.featured
                    ? "bg-brand text-white hover:bg-brand-deep hover:scale-[1.02] shadow-card"
                    : "bg-transparent border border-linel-strong text-inkl hover:border-brand hover:text-brand-deep",
                ].join(" ")}
              >
                Probar 30 días gratis
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 text-[13px] text-inkl-mute">
          ¿Más de 3 centros o necesidades especiales?{" "}
          <a href="mailto:contacto@agendalix.com" className="text-brand-deep underline underline-offset-2 hover:text-brand">
            Escríbenos
          </a>
        </p>
      </div>
    </section>
  );
}
