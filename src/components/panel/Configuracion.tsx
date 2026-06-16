"use client";

import { useState } from "react";
import { Button } from "../ui/Button";
import { Input, Select, Textarea } from "../ui/Input";
import { Tabs } from "../ui/Tabs";
import { Badge } from "../ui/Badge";
import { useToast } from "../ui/Toast";
import { IconPlus, IconTrash } from "../icons/Icons";
import { WhatsAppConnect } from "./WhatsAppConnect";
import {
  TIMEZONES,
  CURRENCIES,
  currencySymbol,
} from "@/lib/timezone";
import { SECTORS } from "@/lib/validation";
import type {
  AgenteConfig,
  HorarioDia,
  Horarios,
  HorariosConMeta,
  Negocio,
  Profesional,
  RecordatorioConfig,
  Servicio,
} from "@/lib/supabase/database.types";

type Props = {
  negocio: Negocio;
  config: AgenteConfig | null;
};

type TabId = "negocio" | "servicios" | "horarios" | "profesionales" | "agente" | "recordatorios" | "whatsapp";

const TAB_DEFS: Array<{ value: TabId; label: string }> = [
  { value: "negocio", label: "Negocio" },
  { value: "servicios", label: "Servicios" },
  { value: "horarios", label: "Horarios" },
  { value: "profesionales", label: "Profesionales" },
  { value: "agente", label: "Agente IA" },
  { value: "recordatorios", label: "Recordatorios" },
  { value: "whatsapp", label: "WhatsApp" },
];

const DAYS: Array<{ key: keyof Horarios; label: string }> = [
  { key: "lun", label: "Lunes" },
  { key: "mar", label: "Martes" },
  { key: "mie", label: "Miércoles" },
  { key: "jue", label: "Jueves" },
  { key: "vie", label: "Viernes" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
];

const DEFAULT_HORARIO: HorarioDia = { abierto: true, apertura: "09:00", cierre: "20:00" };
const DEFAULT_CLOSED: HorarioDia = { abierto: false, apertura: "09:00", cierre: "20:00" };

const PRESET_MENSAJES = [
  "Hola {nombre}! Recordatorio de tu cita en {negocio} mañana a las {hora}{servicio}. ¿Confirmas? Responde SI o CANCELAR.",
  "Hola {nombre}! Tu cita en {negocio} es hoy a las {hora}{servicio}. ¡Te esperamos!",
  "¡Hola {nombre}! Mañana a las {hora} tienes cita en {negocio}{servicio}. ¡Te esperamos!",
  "Hola {nombre}, recuerda que en 2 horas tienes tu cita en {negocio} a las {hora}{servicio}.",
  "Hola {nombre}! Este es un recordatorio de tu próxima cita en {negocio} a las {hora}{servicio}.",
];

const DEFAULT_RECORDATORIOS: RecordatorioConfig[] = [
  {
    id: "default_24h",
    horasAntes: 24,
    mensaje: PRESET_MENSAJES[0],
    activo: true,
  },
  {
    id: "default_1h",
    horasAntes: 1,
    mensaje: PRESET_MENSAJES[1],
    activo: true,
  },
];

export function Configuracion({ negocio, config }: Props) {
  const { toast } = useToast();
  const [tab, setTab] = useState<TabId>("negocio");

  const [nombre, setNombre] = useState(negocio.nombre);
  const [sector, setSector] = useState(negocio.sector);
  const [telefono, setTelefono] = useState(negocio.telefono || "");
  const [zona, setZona] = useState(negocio.zona_horaria);
  const [moneda, setMoneda] = useState(negocio.moneda);
  const [savingNeg, setSavingNeg] = useState(false);

  const [bienvenida, setBienvenida] = useState(config?.mensaje_bienvenida || "");
  const [servicios, setServicios] = useState<Servicio[]>(config?.servicios || []);
  const [horarios, setHorarios] = useState<Horarios>(
    config?.horarios && Object.keys(config.horarios).length > 0
      ? config.horarios
      : (Object.fromEntries(
          DAYS.map((d) => [d.key, d.key === "dom" ? DEFAULT_CLOSED : DEFAULT_HORARIO]),
        ) as Horarios),
  );
  const [profesionales, setProfesionales] = useState<Profesional[]>(config?.profesionales || []);
  const [savingCfg, setSavingCfg] = useState(false);

  const configHorarios = config?.horarios as HorariosConMeta | undefined;
  const [recordatorios, setRecordatorios] = useState<RecordatorioConfig[]>(
    configHorarios?._recordatorios ?? DEFAULT_RECORDATORIOS,
  );
  const [savingRec, setSavingRec] = useState(false);

  async function saveNegocio() {
    setSavingNeg(true);
    try {
      const res = await fetch("/api/panel/negocio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          sector,
          telefono: telefono || null,
          zona_horaria: zona,
          moneda,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) toast("error", data.error || "No se pudo guardar");
      else toast("success", "Guardado");
    } finally {
      setSavingNeg(false);
    }
  }

  async function saveConfig() {
    setSavingCfg(true);
    try {
      const res = await fetch("/api/panel/configuracion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensaje_bienvenida: bienvenida,
          servicios,
          horarios,
          profesionales,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) toast("error", data.error || "No se pudo guardar");
      else toast("success", "Configuración guardada");
    } finally {
      setSavingCfg(false);
    }
  }

  async function saveRecordatorios() {
    setSavingRec(true);
    try {
      const res = await fetch("/api/panel/recordatorios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordatorios }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) toast("error", data.error || "No se pudo guardar");
      else toast("success", "Recordatorios guardados");
    } finally {
      setSavingRec(false);
    }
  }

  function addRecordatorio() {
    setRecordatorios((xs) => [
      ...xs,
      { id: crypto.randomUUID(), horasAntes: 2, mensaje: PRESET_MENSAJES[4], activo: true },
    ]);
  }
  function updateRecordatorio(id: string, patch: Partial<RecordatorioConfig>) {
    setRecordatorios((xs) => xs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function removeRecordatorio(id: string) {
    setRecordatorios((xs) => xs.filter((r) => r.id !== id));
  }

  function addServicio() {
    setServicios((xs) => [
      ...xs,
      { id: crypto.randomUUID(), nombre: "", duracion: 30, precio: 0 },
    ]);
  }
  function updateServicio(id: string, patch: Partial<Servicio>) {
    setServicios((xs) => xs.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
  function removeServicio(id: string) {
    setServicios((xs) => xs.filter((s) => s.id !== id));
    setProfesionales((xs) => xs.map((p) => ({ ...p, servicios: p.servicios.filter((x) => x !== id) })));
  }

  function updateHorario(day: keyof Horarios, patch: Partial<HorarioDia>) {
    setHorarios((h) => ({ ...h, [day]: { ...(h[day] ?? DEFAULT_HORARIO), ...patch } }));
  }

  function addProfesional() {
    setProfesionales((xs) => [...xs, { id: crypto.randomUUID(), nombre: "", servicios: [] }]);
  }
  function updateProfesional(id: string, patch: Partial<Profesional>) {
    setProfesionales((xs) => xs.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
  function removeProfesional(id: string) {
    setProfesionales((xs) => xs.filter((p) => p.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs tabs={TAB_DEFS} value={tab} onChange={(v) => setTab(v)} />

      {tab === "negocio" ? (
        <div className="bg-bg-card border-[0.5px] border-line-subtle rounded-xl p-5 flex flex-col gap-4">
          <Input label="Nombre del negocio" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <Select
            label="Sector"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            options={SECTORS.map((s) => ({ value: s, label: s }))}
          />
          <Input label="Teléfono de contacto" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+34 600 000 000" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              label="Zona horaria"
              value={zona}
              onChange={(e) => setZona(e.target.value)}
              options={TIMEZONES}
            />
            <Select
              label="Moneda"
              value={moneda}
              onChange={(e) => setMoneda(e.target.value)}
              options={CURRENCIES.map((c) => ({ value: c.value, label: c.label }))}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[12px] text-ink-muted flex items-center gap-2">
              <span>Email: {negocio.email}</span>
              <Badge tone="purple">{negocio.plan}</Badge>
            </p>
            <Button onClick={saveNegocio} loading={savingNeg}>
              Guardar
            </Button>
          </div>
        </div>
      ) : null}

      {tab === "servicios" ? (
        <div className="bg-bg-card border-[0.5px] border-line-subtle rounded-xl p-5 flex flex-col gap-3">
          {servicios.length === 0 ? (
            <p className="text-[13px] text-ink-muted">Añade tu primer servicio.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {servicios.map((s) => (
                <li
                  key={s.id}
                  className="grid grid-cols-1 md:grid-cols-[1fr_110px_140px_auto] gap-3 items-end"
                >
                  <Input
                    label="Nombre"
                    value={s.nombre}
                    onChange={(e) => updateServicio(s.id, { nombre: e.target.value })}
                  />
                  <Input
                    label="Duración (min)"
                    type="number"
                    min={5}
                    step={5}
                    value={s.duracion}
                    onChange={(e) =>
                      updateServicio(s.id, { duracion: Math.max(5, Number(e.target.value) || 5) })
                    }
                  />
                  <Input
                    label={`Precio (${currencySymbol(moneda)})`}
                    type="number"
                    min={0}
                    step={0.01}
                    value={s.precio}
                    onChange={(e) =>
                      updateServicio(s.id, { precio: Math.max(0, Number(e.target.value) || 0) })
                    }
                  />
                  <Button
                    variant="ghost"
                    onClick={() => removeServicio(s.id)}
                    aria-label="Eliminar"
                    className="h-11"
                  >
                    <IconTrash size={16} />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center justify-between mt-2">
            <Button variant="secondary" onClick={addServicio}>
              <IconPlus size={16} /> Añadir servicio
            </Button>
            <Button onClick={saveConfig} loading={savingCfg}>
              Guardar
            </Button>
          </div>
        </div>
      ) : null}

      {tab === "horarios" ? (
        <div className="bg-bg-card border-[0.5px] border-line-subtle rounded-xl p-5 flex flex-col gap-3">
          <ul className="flex flex-col gap-2">
            {DAYS.map(({ key, label }) => {
              const h = horarios[key] ?? DEFAULT_CLOSED;
              return (
                <li
                  key={key}
                  className="flex flex-col sm:grid sm:grid-cols-[110px_110px_1fr_1fr] sm:items-center gap-2 sm:gap-3 py-2 border-b-[0.5px] border-line-subtle last:border-b-0"
                >
                  <div className="flex items-center justify-between sm:contents">
                    <span className="text-[13px] text-white">{label}</span>
                    <label className="flex items-center gap-2 text-[12px] text-ink-secondary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={h.abierto}
                        onChange={(e) => updateHorario(key, { abierto: e.target.checked })}
                        className="accent-purple"
                      />
                      {h.abierto ? "Abierto" : "Cerrado"}
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:contents">
                    <Input
                      type="time"
                      value={h.apertura}
                      onChange={(e) => updateHorario(key, { apertura: e.target.value })}
                      disabled={!h.abierto}
                    />
                    <Input
                      type="time"
                      value={h.cierre}
                      onChange={(e) => updateHorario(key, { cierre: e.target.value })}
                      disabled={!h.abierto}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-end mt-2">
            <Button onClick={saveConfig} loading={savingCfg}>
              Guardar
            </Button>
          </div>
        </div>
      ) : null}

      {tab === "profesionales" ? (
        <div className="bg-bg-card border-[0.5px] border-line-subtle rounded-xl p-5 flex flex-col gap-3">
          {profesionales.length === 0 ? (
            <p className="text-[13px] text-ink-muted">
              Sin profesionales. Añade uno si tienes varios colaboradores.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {profesionales.map((p) => (
                <li key={p.id} className="flex flex-col gap-2 p-3 bg-bg-card2 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Input
                        label="Nombre"
                        value={p.nombre}
                        onChange={(e) => updateProfesional(p.id, { nombre: e.target.value })}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => removeProfesional(p.id)}
                      aria-label="Eliminar"
                      className="h-11 mt-5"
                    >
                      <IconTrash size={16} />
                    </Button>
                  </div>
                  <div>
                    <p className="text-[12px] text-ink-secondary mb-1.5">Servicios que ofrece</p>
                    <div className="flex flex-wrap gap-2">
                      {servicios.length === 0 ? (
                        <p className="text-[12px] text-ink-muted">Añade servicios primero.</p>
                      ) : (
                        servicios.map((s) => {
                          const active = p.servicios.includes(s.id);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() =>
                                updateProfesional(p.id, {
                                  servicios: active
                                    ? p.servicios.filter((x) => x !== s.id)
                                    : [...p.servicios, s.id],
                                })
                              }
                              className={`px-3 h-8 rounded-md text-[12px] border-[0.5px] ${
                                active
                                  ? "bg-purple/20 text-purple-light border-purple/30"
                                  : "bg-bg-card text-ink-secondary border-line-subtle hover:text-white"
                              }`}
                            >
                              {s.nombre || "Sin nombre"}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center justify-between mt-2">
            <Button variant="secondary" onClick={addProfesional}>
              <IconPlus size={16} /> Añadir profesional
            </Button>
            <Button onClick={saveConfig} loading={savingCfg}>
              Guardar
            </Button>
          </div>
        </div>
      ) : null}

      {tab === "agente" ? (
        <div className="bg-bg-card border-[0.5px] border-line-subtle rounded-xl p-5 flex flex-col gap-4">
          <Textarea
            label="Mensaje de bienvenida"
            hint="El primer mensaje que enviará tu agente IA cuando un cliente escriba por WhatsApp."
            value={bienvenida}
            onChange={(e) => setBienvenida(e.target.value)}
            rows={6}
          />
          <div className="flex items-center justify-end">
            <Button onClick={saveConfig} loading={savingCfg}>
              Guardar
            </Button>
          </div>
        </div>
      ) : null}

      {tab === "recordatorios" ? (
        <div className="bg-bg-card border-[0.5px] border-line-subtle rounded-xl p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-[13px] text-ink-secondary">
              Configura los avisos automáticos por WhatsApp antes de cada cita. Usa{" "}
              <span className="font-mono text-[12px] bg-bg-card2 px-1 rounded">{"{nombre}"}</span>,{" "}
              <span className="font-mono text-[12px] bg-bg-card2 px-1 rounded">{"{hora}"}</span>,{" "}
              <span className="font-mono text-[12px] bg-bg-card2 px-1 rounded">{"{negocio}"}</span>,{" "}
              <span className="font-mono text-[12px] bg-bg-card2 px-1 rounded">{"{servicio}"}</span>{" "}
              en el mensaje.
            </p>
          </div>

          {recordatorios.length === 0 ? (
            <p className="text-[13px] text-ink-muted">No hay recordatorios configurados.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {recordatorios.map((rec) => (
                <li
                  key={rec.id}
                  className="border-[0.5px] border-line-subtle rounded-lg p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateRecordatorio(rec.id, { activo: !rec.activo })}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                          rec.activo ? "bg-purple" : "bg-line-mid"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${
                            rec.activo ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                      <span className="text-[12px] text-ink-secondary">
                        {rec.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRecordatorio(rec.id)}
                      className="text-ink-muted hover:text-red-400 transition-colors"
                    >
                      <IconTrash size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-3 items-start">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-medium text-ink-secondary uppercase tracking-wide">
                        Horas antes
                      </label>
                      <input
                        type="number"
                        min="0.25"
                        max="168"
                        step="0.25"
                        value={rec.horasAntes}
                        onChange={(e) =>
                          updateRecordatorio(rec.id, { horasAntes: Number(e.target.value) })
                        }
                        className="bg-bg-card2 border-[0.5px] border-line-subtle rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-purple"
                      />
                      <span className="text-[11px] text-ink-muted">
                        {rec.horasAntes === 24
                          ? "1 día antes"
                          : rec.horasAntes === 1
                            ? "1 hora antes"
                            : rec.horasAntes < 1
                              ? `${Math.round(rec.horasAntes * 60)} min antes`
                              : `${rec.horasAntes}h antes`}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-medium text-ink-secondary uppercase tracking-wide">
                        Mensaje
                      </label>
                      <textarea
                        value={rec.mensaje}
                        onChange={(e) => updateRecordatorio(rec.id, { mensaje: e.target.value })}
                        rows={3}
                        className="bg-bg-card2 border-[0.5px] border-line-subtle rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-purple resize-none"
                      />
                      <div className="flex flex-wrap gap-1 mt-1">
                        {PRESET_MENSAJES.map((preset, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => updateRecordatorio(rec.id, { mensaje: preset })}
                            className="text-[10px] text-ink-muted hover:text-purple-light border-[0.5px] border-line-subtle hover:border-purple rounded px-2 py-0.5 transition-colors"
                          >
                            Plantilla {i + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between mt-2">
            <Button variant="secondary" onClick={addRecordatorio}>
              <IconPlus size={16} /> Añadir recordatorio
            </Button>
            <Button onClick={saveRecordatorios} loading={savingRec}>
              Guardar
            </Button>
          </div>
        </div>
      ) : null}

      {tab === "whatsapp" ? <WhatsAppConnect /> : null}
    </div>
  );
}
