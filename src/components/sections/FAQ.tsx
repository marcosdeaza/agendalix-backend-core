"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

const ITEMS: Array<{ q: string; a: string }> = [
  {
    q: "¿Necesito un número de WhatsApp nuevo?",
    a: "No. Agendalix se conecta al WhatsApp que ya usas en tu negocio, escaneando un código QR igual que WhatsApp Web. Tus clientes no notan ningún cambio de número.",
  },
  {
    q: "¿Y si la IA dice algo raro a un cliente?",
    a: "El asistente solo trabaja con tus servicios, precios y horarios reales: no puede inventarse nada. Y si una conversación se complica, puedes intervenir tú en cualquier momento desde el panel y la IA se aparta automáticamente.",
  },
  {
    q: "¿Puedo seguir apuntando citas yo a mano?",
    a: "Claro. El panel tiene una agenda completa donde tú (o tu equipo) podéis crear, mover o cancelar citas. La IA y tú trabajáis sobre la misma agenda, sin dobles reservas.",
  },
  {
    q: "¿Cuánto tarda en estar funcionando?",
    a: "Unos 10 minutos: te registras, indicas servicios y horarios, conectas WhatsApp con el QR y listo. No hay instalación ni necesitas conocimientos técnicos.",
  },
  {
    q: "¿Qué pasa cuando acaban los 30 días gratis?",
    a: "Decides si quieres continuar con alguno de los planes. No pedimos tarjeta al empezar, así que no hay cobros sorpresa: si no sigues, no pagas nada.",
  },
  {
    q: "¿Mis datos y los de mis clientes están seguros?",
    a: "Sí. Los datos se almacenan cifrados en servidores dentro de la UE y cumplimos el RGPD. Nunca compartimos tus datos ni los de tus clientes con terceros.",
  },
];

function Item({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-linel">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
      >
        <span className="font-serif text-[17px] sm:text-[18px] text-inkl group-hover:text-brand-deep transition-colors duration-150">
          {q}
        </span>
        <span
          className={[
            "shrink-0 w-8 h-8 rounded-full border border-linel-strong flex items-center justify-center text-inkl-soft transition-transform duration-300",
            open ? "rotate-45 border-brand text-brand-deep" : "",
          ].join(" ")}
          aria-hidden="true"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="pb-6 pr-12 text-[14.5px] text-inkl-soft leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="px-6 py-24 sm:py-28 bg-paper-warm" aria-labelledby="faq-heading">
      <div className="mx-auto max-w-[760px]">
        <div className="text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.4 }}
            className="text-label uppercase font-medium text-brand-deep tracking-[0.14em]"
          >
            Preguntas frecuentes
          </motion.p>
          <motion.h2
            id="faq-heading"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
            className="mt-4 font-serif text-[30px] sm:text-[40px] text-inkl"
            style={{ lineHeight: 1.12 }}
          >
            Lo que todos preguntan antes de empezar.
          </motion.h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
          className="mt-12 bg-white border border-linel rounded-2xl px-7 sm:px-9 py-2 shadow-card"
        >
          {ITEMS.map((it, i) => (
            <Item
              key={i}
              q={it.q}
              a={it.a}
              open={open === i}
              onToggle={() => setOpen(open === i ? null : i)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
