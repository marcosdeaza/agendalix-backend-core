"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;
const ROTATE_MS = 3200;

type Feature = {
  title: string;
  desc: string;
  icon: ReactNode;
};

const stroke = {
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none",
};

const FEATURES: Feature[] = [
  {
    title: "Agente WhatsApp 24h",
    desc: "Reserva, cancela y responde mientras duermes.",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
          d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H10l-4 4v-4H6a2 2 0 0 1-2-2V6Z"
          {...stroke}
        />
        <path d="M8 9h8M8 12h5" {...stroke} />
      </svg>
    ),
  },
  {
    title: "Recordatorios automáticos",
    desc: "Aviso 24 h antes. Las ausencias caen un 40 %.",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z" {...stroke} />
        <path d="M10 20a2 2 0 0 0 4 0" {...stroke} />
        <circle cx="17.5" cy="6.5" r="1.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Lista de espera inteligente",
    desc: "Si alguien cancela, el hueco se cubre solo.",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <circle cx="9" cy="8" r="3" {...stroke} />
        <path d="M3 19a6 6 0 0 1 12 0" {...stroke} />
        <circle cx="16" cy="9" r="2.4" {...stroke} />
        <path d="M14.5 19a5 5 0 0 1 6.5-4.8" {...stroke} />
      </svg>
    ),
  },
  {
    title: "Informe semanal en Excel",
    desc: "Cada lunes a las 9: citas, ingresos y clientes nuevos.",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" {...stroke} />
        <path d="M13 3v5h5" {...stroke} />
        <path d="M8.5 13h7M8.5 16h5" {...stroke} />
      </svg>
    ),
  },
  {
    title: "Recuperación de clientes",
    desc: "Si no aparece en 6 semanas, le escribimos por ti.",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M20 12a8 8 0 1 1-3.2-6.4L20 8" {...stroke} />
        <path d="M20 4v4h-4" {...stroke} />
      </svg>
    ),
  },
  {
    title: "Multisede",
    desc: "Varios centros, un único panel de control.",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M4 20V10l8-6 8 6v10" {...stroke} />
        <path d="M9 20v-6h6v6" {...stroke} />
        <path d="M4 20h16" {...stroke} />
      </svg>
    ),
  },
];

export function Features() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduce || paused) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % FEATURES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [reduce, paused]);

  return (
    <section
      id="features"
      className="px-6 py-24 sm:py-28"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-content">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.4 }}
          className="text-label uppercase font-medium text-brand-deep tracking-[0.14em]"
        >
          Lo que hace Agendalix
        </motion.p>
        <motion.h2
          id="features-heading"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
          className="mt-4 font-serif text-[30px] sm:text-[40px] text-inkl max-w-[640px]"
          style={{ lineHeight: 1.12, textWrap: "balance" }}
        >
          El trabajo aburrido, hecho. Sin que lo notes.
        </motion.h2>

        <div
          className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {FEATURES.map((f, i) => {
            const isActive = i === active;
            return (
              <motion.article
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.5,
                  delay: (i % 3) * 0.08 + Math.floor(i / 3) * 0.05,
                  ease: EASE,
                }}
                onMouseEnter={() => setActive(i)}
                className={[
                  "group relative overflow-hidden rounded-2xl p-6 cursor-default bg-white",
                  "border transition-[border-color,transform,box-shadow] duration-500 ease-out",
                  isActive
                    ? "border-brand/40 -translate-y-[3px] shadow-lift"
                    : "border-linel shadow-card",
                ].join(" ")}
              >
                <div
                  className={[
                    "relative w-11 h-11 rounded-xl flex items-center justify-center",
                    "transition-[background-color,color,transform] duration-500 ease-out",
                    isActive
                      ? "bg-brand text-white scale-[1.05]"
                      : "bg-brand-soft text-brand-deep",
                  ].join(" ")}
                >
                  {f.icon}
                </div>

                <h3
                  className="relative mt-5 font-serif text-[19px] text-inkl font-medium"
                  style={{ textWrap: "balance" }}
                >
                  {f.title}
                </h3>
                <p
                  className="relative mt-2 text-[14px] text-inkl-soft leading-relaxed"
                  style={{ textWrap: "pretty", hyphens: "none" }}
                >
                  {f.desc}
                </p>

                <span
                  aria-hidden="true"
                  className={[
                    "absolute left-6 right-6 bottom-0 h-[2px] rounded-full",
                    "bg-gradient-to-r from-transparent via-ambar to-transparent",
                    "transition-opacity duration-500",
                    isActive ? "opacity-70" : "opacity-0",
                  ].join(" ")}
                />
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
