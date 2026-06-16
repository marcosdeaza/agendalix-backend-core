"use client";

import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

type Msg =
  | { kind: "incoming"; text: string; time: string }
  | { kind: "outgoing"; text: string; time: string }
  | { kind: "typing" };

const MESSAGES: Msg[] = [
  {
    kind: "incoming",
    text: "Hola! Quería pedir cita para mañana por la tarde, corte y mechas",
    time: "23:47",
  },
  {
    kind: "outgoing",
    text: "¡Hola! Soy el asistente de Peluquería Carmen ✂️ Mañana tengo libre a las 17:00 o a las 18:30. ¿Cuál te viene mejor?",
    time: "23:47",
  },
  { kind: "incoming", text: "Las 17h perfecto!", time: "23:48" },
  {
    kind: "outgoing",
    text: "✅ Hecho, María. Cita confirmada: mañana jueves a las 17:00 — corte y mechas con Carmen. Te mando un recordatorio por la mañana. ¡Hasta mañana!",
    time: "23:48",
  },
  { kind: "typing" },
];

export function Demo() {
  const reduce = useReducedMotion();

  return (
    <section
      id="demo"
      className="px-6 py-24 sm:py-28 bg-paper-warm"
      aria-labelledby="demo-heading"
    >
      <div className="mx-auto max-w-content">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Texto lateral */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.4 }}
              className="text-label uppercase font-medium text-brand-deep tracking-[0.14em]"
            >
              Así se ve en acción
            </motion.p>
            <motion.h2
              id="demo-heading"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
              className="mt-4 font-serif text-[30px] sm:text-[40px] text-inkl"
              style={{ lineHeight: 1.12, textWrap: "balance" }}
            >
              Son las 23:47. Tu clienta escribe. Y alguien le responde.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
              className="mt-5 text-[15.5px] text-inkl-soft leading-relaxed max-w-[440px] mx-auto lg:mx-0"
            >
              El 40 % de las citas se piden fuera de horario. Antes se perdían;
              ahora tu asistente las cierra al momento, con tus servicios, tus
              precios y tus huecos reales. Nada de respuestas enlatadas.
            </motion.p>
            <motion.ul
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
              className="mt-7 flex flex-col gap-3 text-left max-w-[400px] mx-auto lg:mx-0"
            >
              {[
                "Conoce tu agenda real: nunca da una cita ocupada",
                "Habla natural, como tú lo harías",
                "Si algo se le escapa, te avisa y tomas tú el control",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-[14.5px] text-inkl-soft">
                  <svg className="mt-0.5 shrink-0 text-brand" width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                    <path d="m8.5 12.5 2.4 2.4 4.6-5.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t}
                </li>
              ))}
            </motion.ul>
          </div>

          {/* Teléfono */}
          <div className="flex justify-center order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, y: 30, rotate: 1.5 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: EASE }}
              className="relative"
            >
              <div
                className="relative w-[330px] sm:w-[360px] h-[660px] rounded-[44px] bg-inkl shadow-phone p-[10px]"
                role="img"
                aria-label="Mockup de chat WhatsApp con el asistente de Agendalix"
              >
                <div className="relative w-full h-full rounded-[36px] overflow-hidden flex flex-col bg-white">
                  {/* Notch */}
                  <div
                    aria-hidden="true"
                    className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-inkl rounded-full z-20"
                  />

                  {/* Header estilo WhatsApp */}
                  <div className="flex items-center gap-3 px-4 pt-10 pb-3 bg-[#075E54]">
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" className="text-white/90">
                      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        aria-hidden="true"
                        className="w-9 h-9 rounded-full bg-ambar flex items-center justify-center text-white text-[14px] font-semibold"
                      >
                        P
                      </div>
                      <div className="text-left">
                        <p className="text-[14px] text-white font-medium leading-tight">
                          Peluquería Carmen
                        </p>
                        <p className="text-[11px] text-white/75 leading-tight">en línea</p>
                      </div>
                    </div>
                  </div>

                  {/* Chat */}
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-120px" }}
                    variants={{
                      hidden: {},
                      visible: {
                        transition: { staggerChildren: reduce ? 0 : 0.4 },
                      },
                    }}
                    className="flex-1 px-3.5 py-4 flex flex-col gap-2 overflow-hidden wa-chat-bg"
                  >
                    {MESSAGES.map((m, i) => {
                      if (m.kind === "typing") {
                        return (
                          <motion.div
                            key={i}
                            variants={{
                              hidden: { opacity: 0, y: 8 },
                              visible: { opacity: 1, y: 0 },
                            }}
                            transition={{ duration: 0.35, ease: EASE }}
                            className="self-end bg-[#D9FDD3] rounded-[14px_4px_14px_14px] px-4 py-3 flex items-center gap-1.5 shadow-[0_1px_1px_rgba(32,28,18,0.10)]"
                            aria-label="Escribiendo"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7a8f78] animate-typing" style={{ animationDelay: "0ms" }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7a8f78] animate-typing" style={{ animationDelay: "180ms" }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7a8f78] animate-typing" style={{ animationDelay: "360ms" }} />
                          </motion.div>
                        );
                      }

                      const isOut = m.kind === "outgoing";
                      return (
                        <motion.div
                          key={i}
                          variants={{
                            hidden: { opacity: 0, y: 10, scale: 0.98 },
                            visible: { opacity: 1, y: 0, scale: 1 },
                          }}
                          transition={{ duration: 0.35, ease: EASE }}
                          className={[
                            "max-w-[78%] px-3 py-2 text-[13.5px] shadow-[0_1px_1px_rgba(32,28,18,0.10)]",
                            isOut
                              ? "self-end bg-[#D9FDD3] text-[#111B21] rounded-[14px_4px_14px_14px]"
                              : "self-start bg-white text-[#111B21] rounded-[4px_14px_14px_14px]",
                          ].join(" ")}
                        >
                          <p className="leading-[1.4]">{m.text}</p>
                          <p className="text-[10px] mt-1 text-right text-[#667781] flex items-center justify-end gap-1">
                            {m.time}
                            {isOut && (
                              <svg width="14" height="9" viewBox="0 0 18 11" fill="none" aria-hidden="true">
                                <path d="m1 5.5 3.2 3.2L10 2.5" stroke="#53BDEB" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="m7.5 5.5 3.2 3.2L16.5 2.5" stroke="#53BDEB" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </p>
                        </motion.div>
                      );
                    })}
                  </motion.div>

                  {/* Input bar */}
                  <div className="px-3 py-2.5 bg-[#F0F2F5] flex items-center gap-2">
                    <div className="flex-1 h-9 rounded-full bg-white px-4 flex items-center text-[12px] text-[#8696A0]">
                      Escribe un mensaje
                    </div>
                    <button
                      aria-label="Enviar"
                      className="w-9 h-9 rounded-full bg-[#00A884] flex items-center justify-center"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="none">
                        <path d="M4 12l16-8-6 18-3-7-7-3Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Etiqueta flotante */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 1.6, duration: 0.5, ease: EASE }}
                className="absolute -right-3 sm:-right-10 top-16 bg-white border border-linel rounded-xl shadow-lift px-4 py-3 hidden sm:block"
              >
                <p className="text-[11px] uppercase tracking-[0.1em] text-inkl-mute">Mientras dormías</p>
                <p className="font-serif text-[18px] text-inkl mt-0.5">
                  +1 cita <span className="italic text-brand">confirmada</span>
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
