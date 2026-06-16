"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/Logo";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { IconPlus, IconTrash, IconArrowRight, IconChevronLeft } from "@/components/icons/Icons";
import { SECTORS, isValidEmail, isValidSpanishPhone, isValidHHMM } from "@/lib/validation";
import { TIMEZONES, CURRENCIES, TIMEZONE_CURRENCY, currencySymbol } from "@/lib/timezone";
import type { Horarios, Servicio } from "@/lib/supabase/database.types";

const DAY_ORDER: Array<{ key: keyof Horarios; label: string; defaultOpen: boolean; a: string; c: string }> = [
  { key: "lun", label: "Lunes", defaultOpen: true, a: "09:00", c: "20:00" },
  { key: "mar", label: "Martes", defaultOpen: true, a: "09:00", c: "20:00" },
  { key: "mie", label: "Miércoles", defaultOpen: true, a: "09:00", c: "20:00" },
  { key: "jue", label: "Jueves", defaultOpen: true, a: "09:00", c: "20:00" },
  { key: "vie", label: "Viernes", defaultOpen: true, a: "09:00", c: "20:00" },
  { key: "sab", label: "Sábado", defaultOpen: true, a: "09:00", c: "14:00" },
  { key: "dom", label: "Domingo", defaultOpen: false, a: "10:00", c: "14:00" },
];

// Cambio orientativo desde EUR para el precio de ejemplo (mismo FX que Pricing)
const FX: Record<string, number> = {
  EUR: 1, GBP: 0.86, USD: 1.08, MXN: 20.5, COP: 4400,
  PEN: 4.1, CLP: 1020, ARS: 1050, UYU: 42,
};
function ejemploPrecio(moneda: string): string {
  return String(Math.round(20 * (FX[moneda] ?? 1)));
}

const DEFAULT_HORARIOS: Horarios = DAY_ORDER.reduce((acc, d) => {
  acc[d.key] = { abierto: d.defaultOpen, apertura: d.a, cierre: d.c };
  return acc;
}, {} as Horarios);

type Step1 = {
  nombre: string;
  sector: string;
  tuNombre: string;
  email: string;
  telefono: string;
  zona_horaria: string;
  moneda: string;
};

export default function RegistroPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [s1, setS1] = useState<Step1>({
    nombre: "",
    sector: SECTORS[0],
    tuNombre: "",
    email: "",
    telefono: "",
    zona_horaria: TIMEZONES[0].value,
    moneda: CURRENCIES[0].value,
  });
  const [horarios, setHorarios] = useState<Horarios>(DEFAULT_HORARIOS);
  const [servicios, setServicios] = useState<Servicio[]>([
    { id: crypto.randomUUID(), nombre: "Servicio 1", duracion: NaN, precio: NaN },
  ]);

  const s1Errors = useMemo(() => {
    const e: Partial<Record<keyof Step1, string>> = {};
    if (!s1.nombre.trim()) e.nombre = "Ponle un nombre a tu negocio";
    if (!s1.sector) e.sector = "Selecciona un sector";
    if (!s1.tuNombre.trim()) e.tuNombre = "Dinos cómo te llamas";
    if (!s1.email.trim()) e.email = "Introduce un email";
    else if (!isValidEmail(s1.email)) e.email = "Email no válido";
    if (s1.telefono && !isValidSpanishPhone(s1.telefono)) e.telefono = "Teléfono no válido";
    return e;
  }, [s1]);
  const s1Valid = Object.keys(s1Errors).length === 0;

  const horariosValid = useMemo(() => {
    for (const d of DAY_ORDER) {
      const h = horarios[d.key];
      if (!h) return false;
      if (h.abierto) {
        if (!isValidHHMM(h.apertura) || !isValidHHMM(h.cierre)) return false;
        if (h.apertura >= h.cierre) return false;
      }
    }
    return true;
  }, [horarios]);

  const serviciosErrors = useMemo(() => {
    if (servicios.length === 0) return "Añade al menos un servicio";
    for (const s of servicios) {
      if (!s.nombre.trim()) return "Todos los servicios necesitan un nombre";
      if (!Number.isFinite(s.duracion)) return "Indica la duración de cada servicio";
      if (s.duracion < 5) return "La duración mínima es de 5 minutos";
      if (!Number.isFinite(s.precio)) return "Indica el precio de cada servicio (puede ser 0)";
      if (s.precio < 0) return "El precio no puede ser negativo";
    }
    return null;
  }, [servicios]);

  async function submit() {
    if (!s1Valid || !horariosValid || serviciosErrors) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...s1, horarios, servicios }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "No pudimos crear tu cuenta");
      router.push(`/registro/gracias?email=${encodeURIComponent(s1.email)}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Error inesperado");
      setSubmitting(false);
    }
  }

  return (
    <main className="surface-light min-h-screen bg-paper text-inkl flex flex-col">
      <header className="px-6 py-5 border-b border-linel">
        <div className="mx-auto max-w-content flex items-center justify-between">
          <a href="/" aria-label="Volver a Agendalix" className="hover:opacity-90">
            <Logo variant="compact" size={30} tone="light" />
          </a>
          <a href="/panel/login" className="text-[13px] text-inkl-soft hover:text-inkl transition">
            Ya tengo cuenta
          </a>
        </div>
      </header>

      <div className="flex-1 px-6 py-10 sm:py-16">
        <div className="mx-auto w-full max-w-[520px]">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[11px] tracking-[0.14em] uppercase text-inkl-mute">Paso {step} de 3</span>
            <div className="flex-1"><ProgressBar step={step} total={3} tone="light" /></div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.section
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1 className="font-serif text-[30px] font-medium text-inkl leading-tight">Cuéntanos sobre tu negocio</h1>
                <p className="text-[14px] text-inkl-soft mt-2 mb-8">Empieza con 30 días gratis, sin tarjeta.</p>

                <div className="flex flex-col gap-4">
                  <Input
                    tone="light"
                    label="Nombre del negocio"
                    value={s1.nombre}
                    onChange={(e) => setS1((x) => ({ ...x, nombre: e.target.value }))}
                    error={s1.nombre ? s1Errors.nombre : undefined}
                    autoFocus
                  />
                  <Select
                    tone="light"
                    label="Sector"
                    value={s1.sector}
                    onChange={(e) => setS1((x) => ({ ...x, sector: e.target.value }))}
                    options={SECTORS.map((s) => ({ value: s, label: s }))}
                  />
                  <Input
                    tone="light"
                    label="Tu nombre"
                    value={s1.tuNombre}
                    onChange={(e) => setS1((x) => ({ ...x, tuNombre: e.target.value }))}
                    error={s1.tuNombre ? s1Errors.tuNombre : undefined}
                  />
                  <Input
                    tone="light"
                    label="Email"
                    type="email"
                    autoComplete="email"
                    value={s1.email}
                    onChange={(e) => setS1((x) => ({ ...x, email: e.target.value }))}
                    error={s1.email ? s1Errors.email : undefined}
                  />
                  <Input
                    tone="light"
                    label="Teléfono (opcional)"
                    type="tel"
                    inputMode="tel"
                    placeholder="+34 6XX XXX XXX"
                    value={s1.telefono}
                    onChange={(e) => setS1((x) => ({ ...x, telefono: e.target.value }))}
                    error={s1.telefono ? s1Errors.telefono : undefined}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select
                      tone="light"
                      label="Zona horaria"
                      value={s1.zona_horaria}
                      onChange={(e) => setS1((x) => ({ ...x, zona_horaria: e.target.value, moneda: TIMEZONE_CURRENCY[e.target.value] ?? x.moneda }))}
                      options={TIMEZONES.map((t) => ({ value: t.value, label: t.label }))}
                    />
                    <Select
                      tone="light"
                      label="Moneda"
                      value={s1.moneda}
                      onChange={(e) => setS1((x) => ({ ...x, moneda: e.target.value }))}
                      options={CURRENCIES.map((c) => ({ value: c.value, label: c.label }))}
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button tone="light" onClick={() => setStep(2)} disabled={!s1Valid}>
                    Continuar <IconArrowRight size={18} />
                  </Button>
                </div>
              </motion.section>
            ) : step === 2 ? (
              <motion.section
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1 className="font-serif text-[30px] font-medium text-inkl leading-tight">¿Cuándo abres?</h1>
                <p className="text-[14px] text-inkl-soft mt-2 mb-8">Podrás ajustarlo más adelante.</p>

                <div className="flex flex-col gap-3">
                  {DAY_ORDER.map((d) => {
                    const h = horarios[d.key]!;
                    return (
                      <div
                        key={d.key}
                        className="flex items-center gap-3 bg-white border border-linel rounded-xl px-3 py-2.5 shadow-card"
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={h.abierto}
                            onChange={(e) =>
                              setHorarios({ ...horarios, [d.key]: { ...h, abierto: e.target.checked } })
                            }
                            className="w-4 h-4 accent-brand"
                          />
                          <span className="text-[13px] text-inkl w-20">{d.label}</span>
                        </label>
                        {h.abierto ? (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <input
                              type="time"
                              value={h.apertura}
                              onChange={(e) =>
                                setHorarios({ ...horarios, [d.key]: { ...h, apertura: e.target.value } })
                              }
                              className="no-focus-ring bg-paper-warm border border-linel rounded px-2 py-1 text-[13px] text-inkl focus:border-brand transition-colors"
                            />
                            <span className="text-inkl-mute text-[13px]">—</span>
                            <input
                              type="time"
                              value={h.cierre}
                              onChange={(e) =>
                                setHorarios({ ...horarios, [d.key]: { ...h, cierre: e.target.value } })
                              }
                              className="no-focus-ring bg-paper-warm border border-linel rounded px-2 py-1 text-[13px] text-inkl focus:border-brand transition-colors"
                            />
                          </div>
                        ) : (
                          <span className="text-[12px] text-inkl-mute">Cerrado</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 flex items-center justify-between">
                  <Button tone="light" variant="ghost" onClick={() => setStep(1)}>
                    <IconChevronLeft size={18} /> Atrás
                  </Button>
                  <Button tone="light" onClick={() => setStep(3)} disabled={!horariosValid}>
                    Continuar <IconArrowRight size={18} />
                  </Button>
                </div>
              </motion.section>
            ) : (
              <motion.section
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1 className="font-serif text-[30px] font-medium text-inkl leading-tight">¿Qué servicios ofreces?</h1>
                <p className="text-[14px] text-inkl-soft mt-2 mb-8">Podrás añadir o modificar más tarde.</p>

                <div className="flex flex-col gap-3">
                  {servicios.map((s, idx) => (
                    <div key={s.id} className="bg-white border border-linel rounded-xl p-3 shadow-card">
                      <div className="flex gap-2 items-start">
                        <input
                          placeholder="Nombre del servicio"
                          value={s.nombre}
                          onChange={(e) =>
                            setServicios(servicios.map((x) => (x.id === s.id ? { ...x, nombre: e.target.value } : x)))
                          }
                          className="no-focus-ring flex-1 bg-paper-warm border border-linel rounded-md px-3 py-2 text-[13px] text-inkl focus:border-brand transition-colors"
                        />
                        <button
                          onClick={() => setServicios(servicios.filter((x) => x.id !== s.id))}
                          disabled={servicios.length === 1}
                          aria-label="Eliminar servicio"
                          className="w-9 h-9 flex items-center justify-center rounded-md text-inkl-soft hover:bg-paper-deep disabled:opacity-30 transition"
                        >
                          <IconTrash size={16} />
                        </button>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <div className="flex items-center bg-paper-warm border border-linel rounded-md px-2 flex-1 focus-within:border-brand transition-colors">
                          <input
                            type="number"
                            min={5}
                            step={5}
                            value={Number.isFinite(s.duracion) ? s.duracion : ""}
                            placeholder="60"
                            onChange={(e) =>
                              setServicios(
                                servicios.map((x) =>
                                  x.id === s.id
                                    ? { ...x, duracion: e.target.value === "" ? NaN : parseInt(e.target.value, 10) }
                                    : x,
                                ),
                              )
                            }
                            className="no-focus-ring flex-1 bg-transparent py-2 text-[13px] text-inkl"
                          />
                          <span className="text-[11px] text-inkl-mute pr-1">min</span>
                        </div>
                        <div className="flex items-center bg-paper-warm border border-linel rounded-md px-2 flex-1 focus-within:border-brand transition-colors">
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={Number.isFinite(s.precio) ? s.precio : ""}
                            placeholder={ejemploPrecio(s1.moneda)}
                            onChange={(e) =>
                              setServicios(
                                servicios.map((x) =>
                                  x.id === s.id
                                    ? { ...x, precio: e.target.value === "" ? NaN : parseFloat(e.target.value) }
                                    : x,
                                ),
                              )
                            }
                            className="no-focus-ring flex-1 bg-transparent py-2 text-[13px] text-inkl"
                          />
                          <span className="text-[11px] text-inkl-mute pr-1">{currencySymbol(s1.moneda)}</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-inkl-mute mt-1">Servicio #{idx + 1}</div>
                    </div>
                  ))}
                  <Button
                    tone="light"
                    variant="secondary"
                    onClick={() =>
                      setServicios([
                        ...servicios,
                        { id: crypto.randomUUID(), nombre: "", duracion: NaN, precio: NaN },
                      ])
                    }
                  >
                    <IconPlus size={16} /> Añadir servicio
                  </Button>
                </div>

                {serviciosErrors ? (
                  <p className="mt-4 text-[12px] text-[#B23B3B]">{serviciosErrors}</p>
                ) : null}
                {serverError ? (
                  <p className="mt-4 text-[12px] text-[#B23B3B]">{serverError}</p>
                ) : null}

                <div className="mt-8 flex items-center justify-between">
                  <Button tone="light" variant="ghost" onClick={() => setStep(2)} disabled={submitting}>
                    <IconChevronLeft size={18} /> Atrás
                  </Button>
                  <Button tone="light" onClick={submit} disabled={!!serviciosErrors} loading={submitting}>
                    Crear mi cuenta
                  </Button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
