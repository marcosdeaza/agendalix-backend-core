"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "../Logo";
import { WhatsAppConnect } from "./WhatsAppConnect";
import { IconArrowRight, IconCheck, IconSparkle } from "../icons/Icons";

const EASE = [0.22, 1, 0.36, 1] as const;

function Sparkles() {
  // Chispas artesanas: pequeños destellos dorados animados alrededor del centro
  const sparks = [
    { x: "12%", y: "18%", d: 0.0, s: 14 },
    { x: "85%", y: "14%", d: 0.3, s: 10 },
    { x: "8%", y: "72%", d: 0.55, s: 11 },
    { x: "90%", y: "66%", d: 0.2, s: 16 },
    { x: "70%", y: "88%", d: 0.7, s: 9 },
    { x: "26%", y: "90%", d: 0.45, s: 12 },
  ];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {sparks.map((sp, i) => (
        <motion.svg
          key={i}
          initial={{ opacity: 0, scale: 0, rotate: -30 }}
          animate={{ opacity: [0, 1, 0.6, 1], scale: 1, rotate: 0 }}
          transition={{ duration: 1.2, delay: sp.d, ease: EASE }}
          width={sp.s}
          height={sp.s}
          viewBox="0 0 24 24"
          fill="none"
          className="absolute"
          style={{ left: sp.x, top: sp.y }}
        >
          <path
            d="M12 2c.8 5 2.5 7.2 8 8-5.5.8-7.2 3-8 8-.8-5-2.5-7.2-8-8 5.5-.8 7.2-3 8-8Z"
            fill="#D9912B"
            opacity="0.9"
          />
        </motion.svg>
      ))}
    </div>
  );
}

export function Onboarding({ negocioNombre }: { negocioNombre: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [closing, setClosing] = useState(false);

  const firstName = negocioNombre.split(" ")[0];

  async function finish() {
    setClosing(true);
    try {
      await fetch("/api/panel/negocio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding_completo: true }),
      });
    } catch {
      // No bloqueamos la salida si falla; se reintentará al recargar
    }
    router.refresh();
  }

  const TOTAL = 3;

  return (
    <AnimatePresence>
      {!closing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[60] bg-[#0a0a0aF2] backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Bienvenida a Agendalix"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="relative w-full max-w-[560px] bg-bg-card border-[0.5px] border-line-mid rounded-3xl p-7 sm:p-10 my-auto overflow-hidden"
          >
            {/* halo cálido */}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 420px 240px at 50% 0%, rgba(46,143,102,0.14) 0%, transparent 65%)",
              }}
            />

            {/* progreso */}
            <div className="relative flex items-center justify-center gap-2 mb-8">
              {Array.from({ length: TOTAL }).map((_, i) => (
                <span
                  key={i}
                  className={[
                    "h-1.5 rounded-full transition-all duration-500",
                    i === step ? "w-8 bg-purple" : i < step ? "w-4 bg-purple/50" : "w-4 bg-line-mid",
                  ].join(" ")}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="s0"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="relative text-center"
                >
                  <Sparkles />
                  <div className="flex justify-center mb-6">
                    <Logo variant="mark" size={56} animate />
                  </div>
                  <h2 className="font-serif text-[26px] sm:text-[30px] text-white font-medium leading-tight">
                    Bienvenido, {firstName}.
                  </h2>
                  <p className="mt-4 text-[14.5px] text-ink-secondary leading-relaxed max-w-[400px] mx-auto">
                    Acabas de contratar a tu primer empleado que no duerme, no
                    libra y nunca deja un WhatsApp sin responder. Vamos a
                    presentárselo a tus clientes — son 2 minutos.
                  </p>
                  <button
                    onClick={() => setStep(1)}
                    className="mt-8 inline-flex items-center justify-center gap-2 bg-purple text-white text-[14.5px] font-medium px-8 h-12 rounded-full hover:bg-purple-dark transition-all hover:scale-[1.02]"
                  >
                    Empezamos <IconArrowRight size={16} stroke="#fff" />
                  </button>
                  <p className="mt-5 text-[12px] text-ink-muted">
                    Tienes <span className="text-[#7FC9A6]">30 días gratis</span> · sin tarjeta
                  </p>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="s1"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="relative"
                >
                  <h2 className="font-serif text-[22px] sm:text-[26px] text-white font-medium text-center">
                    Conecta tu WhatsApp
                  </h2>
                  <p className="mt-3 text-[13.5px] text-ink-secondary text-center max-w-[400px] mx-auto">
                    Igual que WhatsApp Web: abre WhatsApp en el móvil del negocio
                    → Dispositivos vinculados → escanea el código.
                  </p>
                  <div className="mt-6">
                    <WhatsAppConnect />
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <button
                      onClick={() => setStep(0)}
                      className="text-[13px] text-ink-secondary hover:text-white transition-colors"
                    >
                      ← Atrás
                    </button>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setStep(2)}
                        className="text-[13px] text-ink-muted hover:text-white transition-colors"
                      >
                        Lo haré luego
                      </button>
                      <button
                        onClick={() => setStep(2)}
                        className="inline-flex items-center gap-2 bg-purple text-white text-[14px] font-medium px-6 h-11 rounded-full hover:bg-purple-dark transition-colors"
                      >
                        Continuar <IconArrowRight size={15} stroke="#fff" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="s2"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="relative text-center"
                >
                  <Sparkles />
                  <div className="flex justify-center mb-6">
                    <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2E8F6622] border border-[#2E8F6655]">
                      <IconCheck size={28} stroke="#7FC9A6" />
                    </span>
                  </div>
                  <h2 className="font-serif text-[24px] sm:text-[28px] text-white font-medium">
                    Tu asistente ya sabe atender.
                  </h2>
                  <p className="mt-4 text-[14px] text-ink-secondary leading-relaxed max-w-[420px] mx-auto">
                    Conoce tus servicios, precios y horarios del registro. Puedes
                    afinarlo cuando quieras en{" "}
                    <span className="text-white">Configuración</span>: tono del
                    agente, profesionales, recordatorios y más.
                  </p>
                  <ul className="mt-6 flex flex-col gap-2.5 text-left max-w-[360px] mx-auto">
                    {[
                      "Escríbele por WhatsApp y pruébalo tú mismo",
                      "Las citas aparecerán en tu Agenda al instante",
                      "¿Dudas? El Soporte está dentro del panel",
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-2.5 text-[13.5px] text-ink-secondary">
                        <span className="mt-0.5 shrink-0">
                          <IconSparkle size={14} stroke="#D9912B" />
                        </span>
                        {t}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={finish}
                    className="mt-8 inline-flex items-center justify-center gap-2 bg-purple text-white text-[15px] font-medium px-9 h-12 rounded-full hover:bg-purple-dark transition-all hover:scale-[1.02]"
                  >
                    Ir a mi panel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
