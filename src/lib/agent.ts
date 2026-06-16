import type {
  AgenteConfig,
  Cita,
  Negocio,
  Servicio,
  Profesional,
} from "./supabase/database.types";
import { formatSlotInZone, todaysOpenSlots } from "./availability";
import { currencySymbol, formatDateTimeInZone, zonedNow } from "./timezone";
import type { DeepSeekTool } from "./deepseek";

const DAY_LABELS: Record<string, string> = {
  lun: "Lunes",
  mar: "Martes",
  mie: "Miércoles",
  jue: "Jueves",
  vie: "Viernes",
  sab: "Sábado",
  dom: "Domingo",
};

function formatServicios(servicios: Servicio[], moneda: string): string {
  if (!servicios.length) return "- (sin servicios configurados)";
  const sym = currencySymbol(moneda);
  return servicios
    .map((s) => `- *${s.nombre}* · ${s.duracion} min · ${s.precio}${sym}`)
    .join("\n");
}

function formatHorarios(config: AgenteConfig): string {
  const keys: Array<keyof typeof DAY_LABELS> = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];
  return keys
    .map((k) => {
      const d = (config.horarios as Record<string, unknown>)?.[k] as import("@/lib/supabase/database.types").HorarioDia | undefined;
      if (!d || !d.abierto) return `- ${DAY_LABELS[k]}: cerrado`;
      return `- ${DAY_LABELS[k]}: ${d.apertura}–${d.cierre}`;
    })
    .join("\n");
}

function formatProfesionales(profesionales: Profesional[]): string {
  if (!profesionales.length) return "- (sin profesionales configurados)";
  return profesionales
    .map((p) => `- *${p.nombre}* (${p.servicios.join(", ") || "todos los servicios"})`)
    .join("\n");
}

export function buildSystemPrompt(opts: {
  negocio: Negocio;
  config: AgenteConfig;
  citasHoy: Cita[];
  now?: Date;
}): string {
  const tz = opts.negocio.zona_horaria || "Europe/Madrid";
  const moneda = opts.negocio.moneda || "EUR";
  const now = opts.now || new Date();
  const huecos = todaysOpenSlots(opts.config, opts.citasHoy, tz, now)
    .map((d) => formatSlotInZone(d, tz))
    .join(", ") || "consultar disponibilidad";

  const ahora = formatDateTimeInZone(now, tz);
  const z = zonedNow(tz, now);
  const fechaIso = `${z.year}-${String(z.month).padStart(2, "0")}-${String(z.day).padStart(2, "0")}`;

  return `Eres el asistente virtual de *${opts.negocio.nombre}*, un negocio de ${opts.negocio.sector}.

HORA REAL AHORA: ${ahora}
FECHA ACTUAL (YYYY-MM-DD): ${fechaIso}
ZONA HORARIA: ${tz}
MONEDA: ${moneda} (${currencySymbol(moneda)})

SERVICIOS DISPONIBLES:
${formatServicios(opts.config.servicios, moneda)}

HORARIOS:
${formatHorarios(opts.config)}

PROFESIONALES:
${formatProfesionales(opts.config.profesionales)}

HUECOS LIBRES HOY:
${huecos}

REGLAS ESENCIALES:
- Responde SIEMPRE en español, tono cercano y natural (no robótico).
- Para reservar una cita necesitas: nombre, servicio, fecha y hora.
- Si el hueco no está disponible, ofrece alternativas reales.
- Los precios se muestran con la moneda ${moneda} (${currencySymbol(moneda)}).
- Si quieren cancelar, pide confirmación y luego usa cancel_booking.
- Si no sabes algo, di que lo consultarás con el equipo.
- Nunca inventes horarios o precios que no estén definidos arriba.
- Cuando el cliente quiere reservar, usa create_booking. Las fechas ISO deben estar en zona ${tz}.

REGLAS DE FORMATO (WhatsApp):
- ASTERISCO SIMPLE para negrita: *texto* (un asterisco a cada lado). NUNCA doble asterisco **texto** — WhatsApp no lo renderiza, aparece como basura visual.
- Usa viñetas con "- " para listar horas disponibles o servicios, facilita el escaneo.
- Añade emojis estratégicamente cuando aporten claridad, NO los pongas en cada frase:
  🗓️ para citas/fechas, ⏰ para horas disponibles, ✅ para confirmaciones, ❌ para cancelaciones.
  Adapta el emoji de servicio al sector del negocio (ej: ✂️ peluquería, 💅 estética, 🦷 dental).
- Respuestas cortas y directas: máx 4 líneas.
- Termina SIEMPRE con un Call to Action claro: pregunta la hora preferida, pide confirmación, etc.
- Nunca pongas párrafos largos ni listas de más de 5 opciones a la vez.`;
}

export const AGENT_TOOLS: DeepSeekTool[] = [
  {
    type: "function",
    function: {
      name: "create_booking",
      description:
        "Crea una cita en el sistema. Úsala cuando el cliente quiera reservar y tengas servicio + fecha + hora.",
      parameters: {
        type: "object",
        properties: {
          nombre_cliente: { type: "string", description: "Nombre del cliente" },
          servicio: { type: "string", description: "Nombre exacto del servicio del catálogo" },
          profesional: { type: "string", description: "Nombre del profesional (opcional)" },
          fecha_iso: {
            type: "string",
            description:
              "Fecha y hora de inicio en ISO 8601. Si la fecha no incluye zona, se interpreta como hora local del negocio.",
          },
          notas: { type: "string", description: "Notas adicionales (opcional)" },
        },
        required: ["nombre_cliente", "servicio", "fecha_iso"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancel_booking",
      description: "Cancela una cita existente. Úsala tras confirmación del cliente.",
      parameters: {
        type: "object",
        properties: {
          fecha_iso: { type: "string", description: "Fecha/hora aproximada de la cita" },
          nombre_cliente: { type: "string", description: "Nombre (opcional)" },
        },
        required: ["fecha_iso"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_appointments",
      description: "Lista las próximas citas del cliente.",
      parameters: {
        type: "object",
        properties: {
          nombre_cliente: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_to_waitlist",
      description:
        "Añade al cliente a la lista de espera cuando el hueco deseado no está disponible y acepta esperar.",
      parameters: {
        type: "object",
        properties: {
          nombre_cliente: { type: "string" },
          servicio: { type: "string" },
          fecha_preferida: { type: "string", description: "Fecha (YYYY-MM-DD) que prefiere" },
          profesional: { type: "string" },
        },
        required: ["servicio"],
      },
    },
  },
];

export function renderBienvenida(raw: string, negocioNombre: string) {
  return (raw || "").replaceAll("{nombre}", negocioNombre);
}
