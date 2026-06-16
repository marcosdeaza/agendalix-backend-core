"use client";

import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

const STEPS = [
  {
    n: "1",
    title: "Conecta tu WhatsApp",
    desc: "Escaneas un código QR con el móvil del negocio, como WhatsApp Web. No necesitas número nuevo ni instalar nada.",
  },
  {
    n: "2",
    title: "Cuéntale tu negocio",
    desc: "Servicios, precios y horarios. En 10 minutos tu asistente sabe todo lo que necesita para atender como tú lo harías.",
  },
  {
    n: "3",
    title: "Olvídate del teléfono",
    desc: "Tus clientes escriben y la IA reserva, confirma, recuerda y gestiona cancelaciones. Tú lo ves todo desde el panel.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="px-6 py-24 sm:py-28"
      aria-labelledby="how-heading"
    >
      <div className="mx-auto max-w-content">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.4 }}
          className="text-label uppercase font-medium text-brand-deep tracking-[0.14em]"
        >
          Cómo funciona
        </motion.p>
        <motion.h2
          id="how-heading"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
          className="mt-4 font-serif text-[30px] sm:text-[40px] text-inkl max-w-[600px]"
          style={{ lineHeight: 1.12, textWrap: "balance" }}
        >
          Funcionando esta misma tarde, sin saber de tecnología.
        </motion.h2>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: EASE }}
              className="relative rounded-2xl bg-white border border-linel p-7 shadow-card"
            >
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-brand-soft font-serif italic text-[20px] text-brand-deep">
                {s.n}
              </span>
              <h3 className="mt-5 font-serif text-[20px] text-inkl font-medium">
                {s.title}
              </h3>
              <p className="mt-2.5 text-[14.5px] text-inkl-soft leading-relaxed">
                {s.desc}
              </p>
              {i < STEPS.length - 1 && (
                <svg
                  aria-hidden="true"
                  className="hidden md:block absolute top-1/2 -right-[26px] z-10 text-ambar"
                  width="36"
                  height="14"
                  viewBox="0 0 36 14"
                  fill="none"
                >
                  <path
                    d="M1 7c10-3 22-3 30 0m0 0-5-4m5 4-5 4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
