"use client";

import { motion } from "framer-motion";
import { SECTORS } from "@/lib/constants";

const EASE = [0.22, 1, 0.36, 1] as const;

export function Sectors() {
  return (
    <section
      id="sectors"
      className="px-6 py-24 sm:py-28"
      aria-labelledby="sectors-heading"
    >
      <div className="mx-auto max-w-content text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.4 }}
          className="text-label uppercase font-medium text-brand-deep tracking-[0.14em]"
        >
          Para cualquier negocio local
        </motion.p>
        <motion.h2
          id="sectors-heading"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
          className="mt-4 font-serif text-[30px] sm:text-[40px] text-inkl"
          style={{ lineHeight: 1.12 }}
        >
          Si vives de las citas, esto es para ti.
        </motion.h2>

        <motion.ul
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.025 } },
          }}
          className="mt-12 flex flex-wrap justify-center gap-2.5"
        >
          {SECTORS.map((s) => (
            <motion.li
              key={s}
              variants={{
                hidden: { opacity: 0, y: 8 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <span className="inline-flex items-center rounded-full bg-white border border-linel px-5 py-2.5 text-[13.5px] text-inkl-soft shadow-card hover:border-brand/50 hover:text-brand-deep hover:-translate-y-[1px] transition-all duration-150 cursor-default">
                {s}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
