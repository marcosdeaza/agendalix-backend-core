"use client";

import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  initials: string;
};

const ITEMS: Testimonial[] = [
  {
    quote:
      "Antes paraba de cortar para coger el teléfono. Ahora ni lo miro. Las citas llegan solas.",
    name: "Carmen R.",
    role: "Peluquería Carmen, Valencia",
    initials: "CR",
  },
  {
    quote:
      "Mis pacientes confirman solos. Los no-shows han bajado muchísimo desde el primer mes.",
    name: "Dr. Martínez",
    role: "Clínica dental, Madrid",
    initials: "DM",
  },
  {
    quote:
      "Tenemos tres centros y Agendalix los gestiona todos. Antes era un caos.",
    name: "Sara V.",
    role: "Centro de fisioterapia, Barcelona",
    initials: "SV",
  },
];

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="px-6 py-24 sm:py-28"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto max-w-content">
        <div className="text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.4 }}
            className="text-label uppercase font-medium text-brand-deep tracking-[0.14em]"
          >
            Lo que dicen nuestros clientes
          </motion.p>
          <motion.h2
            id="testimonials-heading"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
            className="mt-4 font-serif text-[30px] sm:text-[40px] text-inkl max-w-[640px] mx-auto"
            style={{ lineHeight: 1.12 }}
          >
            Negocios que ya dejaron de atender el teléfono.
          </motion.h2>
        </div>

        <div className="mt-14 -mx-6 px-6 overflow-x-auto snap-x-mandatory md:overflow-visible scrollbar-hide">
          <div className="flex md:grid md:grid-cols-3 gap-4 min-w-max md:min-w-0">
            {ITEMS.map((t, i) => (
              <motion.figure
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
                className="snap-start shrink-0 w-[82vw] sm:w-[340px] md:w-auto relative rounded-2xl bg-white border border-linel p-7 shadow-card"
              >
                <span
                  aria-hidden="true"
                  className="absolute top-4 left-6 font-serif text-ambar opacity-60"
                  style={{ fontSize: "52px", lineHeight: 1 }}
                >
                  &ldquo;
                </span>
                <blockquote className="pt-9 font-serif italic text-[16px] text-inkl-soft leading-[1.65]">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 pt-5 border-t border-linel">
                  <span
                    aria-hidden="true"
                    className="w-[38px] h-[38px] rounded-full bg-brand-soft text-brand-deep flex items-center justify-center text-[13px] font-semibold"
                  >
                    {t.initials}
                  </span>
                  <div>
                    <p className="text-[13.5px] text-inkl font-medium leading-tight">
                      {t.name}
                    </p>
                    <p className="text-[12px] text-inkl-mute leading-tight mt-0.5">
                      {t.role}
                    </p>
                  </div>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
