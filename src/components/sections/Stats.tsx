"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

type Stat = {
  target: number;
  suffix: string;
  prefix?: string;
  label: string;
};

const STATS: Stat[] = [
  { target: 3, suffix: "h", label: "ahorradas al día de media" },
  { target: 40, suffix: "%", label: "menos citas perdidas" },
  { target: 24, suffix: "/7", label: "tu negocio siempre responde" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function Counter({
  target,
  active,
  duration = 1200,
}: {
  target: number;
  active: boolean;
  duration?: number;
}) {
  const [value, setValue] = useState(0);
  const reduce = useReducedMotion();
  const started = useRef(false);

  useEffect(() => {
    if (!active || started.current) return;
    if (reduce) {
      setValue(target);
      started.current = true;
      return;
    }
    started.current = true;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * easeOutCubic(t)));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration, reduce]);

  return <>{value}</>;
}

export function Stats() {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          obs.disconnect();
        }
      },
      { rootMargin: "-80px 0px" }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="px-6 py-20 sm:py-24 bg-paper-warm" aria-label="Resultados promedio">
      <div ref={ref} className="mx-auto max-w-content grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STATS.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
            className="rounded-2xl bg-white border border-linel p-8 shadow-card"
          >
            <p className="font-serif text-[54px] leading-none text-inkl font-medium tracking-tight">
              <Counter target={s.target} active={active} />
              <span className="text-brand italic">{s.suffix}</span>
            </p>
            <p className="mt-4 text-[14px] text-inkl-soft">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
