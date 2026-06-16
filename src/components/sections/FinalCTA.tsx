"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { WHATSAPP_LINK } from "@/lib/constants";

const EASE = [0.22, 1, 0.36, 1] as const;

export function FinalCTA() {
  return (
    <section
      className="relative px-6 py-24 sm:py-28 overflow-hidden"
      aria-labelledby="final-cta-heading"
    >
      <div className="mx-auto max-w-content">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="relative rounded-[28px] bg-brand-ink text-center px-6 py-16 sm:py-20 overflow-hidden"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none opacity-50"
            style={{
              background:
                "radial-gradient(ellipse 700px 360px at 50% 0%, rgba(217,145,43,0.18) 0%, transparent 65%)",
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none dotted-paper opacity-[0.12]"
          />

          <div className="relative z-10">
            <h2
              id="final-cta-heading"
              className="font-serif text-[32px] sm:text-[44px] text-paper max-w-[640px] mx-auto font-medium"
              style={{ lineHeight: 1.12 }}
            >
              Esta noche te van a escribir.{" "}
              <span className="italic text-ambar">¿Quién responde?</span>
            </h2>
            <p className="mt-5 text-[15.5px] text-paper/70 max-w-[440px] mx-auto">
              Pruébalo 30 días gratis. Sin tarjeta, sin permanencia, sin
              instalar nada.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/registro"
                className="inline-flex items-center justify-center gap-2 bg-paper text-brand-ink text-[16px] font-medium px-10 py-4 rounded-full hover:bg-white transition-all duration-150 hover:scale-[1.02]"
              >
                Crear mi asistente gratis
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 text-paper/85 text-[15px] font-medium px-8 py-4 rounded-full border border-paper/25 hover:border-paper/60 hover:text-paper transition-all duration-150"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M20.5 3.5A11 11 0 0 0 3.5 17.9L2 22l4.2-1.4A11 11 0 1 0 20.5 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 10.5c0-1 .6-2.5 2-2.5.3 0 .6.4.9 1l.5 1.2c.1.3 0 .5-.2.7l-.6.5c.6 1.2 1.4 2 2.6 2.6l.5-.6c.2-.2.4-.3.7-.2l1.2.5c.6.3 1 .6 1 .9 0 1.4-1.5 2-2.5 2-1.5 0-6.1-2.1-6.1-6.1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Hablar con una persona
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
