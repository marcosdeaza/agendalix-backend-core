"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

function HandStroke() {
  return (
    <svg viewBox="0 0 220 14" fill="none" aria-hidden="true" preserveAspectRatio="none">
      <path
        d="M3 10C40 4 90 3 130 5c30 1.5 60 2.5 87 1"
        stroke="#D9912B"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative min-h-[92svh] flex items-center justify-center px-6 pt-28 pb-16 overflow-hidden"
    >
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none glow-hero" />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[420px] pointer-events-none dotted-paper opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
          className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand-soft text-[12.5px] font-medium text-brand-deep px-4 py-1.5 mb-8"
        >
          <span aria-hidden="true" className="relative inline-flex w-2 h-2">
            <span className="absolute inline-flex w-full h-full rounded-full bg-brand opacity-60 animate-ping" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-brand" />
          </span>
          Tu recepcionista con IA, dentro de WhatsApp
        </motion.span>

        <h1
          id="hero-heading"
          className="font-serif text-[40px] sm:text-[52px] md:text-[64px] text-inkl font-medium max-w-[760px] mx-auto"
          style={{ lineHeight: 1.06, letterSpacing: "-0.015em" }}
        >
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.25, ease: EASE }}
            className="block"
          >
            Tus citas se reservan{" "}
            <span className="hand-underline italic text-brand-deep">
              solas
              <HandStroke />
            </span>
            .
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.38, ease: EASE }}
            className="block mt-1"
          >
            Tú, a lo tuyo.
          </motion.span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55, ease: EASE }}
          className="mt-7 text-[16px] sm:text-[17px] text-inkl-soft max-w-[540px] mx-auto leading-relaxed"
        >
          Agendalix responde el WhatsApp de tu negocio, reserva, recuerda y
          recupera clientes — las 24 horas, también cuando tienes las manos
          ocupadas.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7, ease: EASE }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-3"
        >
          <Link
            href="/registro"
            className="inline-flex items-center justify-center gap-2 bg-brand text-white text-[15.5px] font-medium px-8 py-4 rounded-full hover:bg-brand-deep transition-all duration-150 hover:scale-[1.02] shadow-lift min-w-[210px]"
          >
            Empieza 30 días gratis
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <a
            href="#demo"
            className="inline-flex items-center justify-center gap-2 bg-white/70 text-inkl-soft text-[15.5px] font-medium px-8 py-4 rounded-full border border-linel-strong hover:border-brand hover:text-brand-deep transition-all duration-150 min-w-[210px]"
          >
            Ver cómo responde
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mt-6 text-[13px] text-inkl-mute"
        >
          Sin tarjeta · Sin permanencia · Lo montas en 10 minutos
        </motion.p>
      </div>
    </section>
  );
}
