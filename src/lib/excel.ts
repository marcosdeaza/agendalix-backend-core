import ExcelJS from "exceljs";
import type { Cita, Cliente } from "./supabase/database.types";
import { currencySymbol, formatDateTimeInZone } from "./timezone";

export type ExcelPeriod = {
  label: string;
  start: Date;
  end: Date;
};

function fmtDate(d: Date | string | null, tz: string): string {
  if (!d) return "";
  return formatDateTimeInZone(d, tz);
}

const HEAD_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2E8F66" } } as const;
const HEAD_FONT = { color: { argb: "FFFFFFFF" }, bold: true } as const;

export async function generateInformeExcel(opts: {
  negocioNombre: string;
  period: ExcelPeriod;
  citas: Cita[];
  clientes: Cliente[];
  tz: string;
  moneda: string;
}): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Agendalix";
  wb.created = new Date();
  const sym = currencySymbol(opts.moneda);

  // ── Sheet 1: Resumen ────────────────────────────────
  const resumen = wb.addWorksheet("Resumen");
  resumen.columns = [
    { key: "k", width: 34 },
    { key: "v", width: 22 },
  ];
  const confirmadas = opts.citas.filter((c) => c.estado !== "cancelada").length;
  const completadas = opts.citas.filter((c) => c.estado === "completada").length;
  const canceladas = opts.citas.filter((c) => c.estado === "cancelada").length;
  const ingresos = opts.citas
    .filter((c) => c.estado === "completada")
    .reduce((s, c) => s + Number(c.precio || 0), 0);
  const nuevosClientes = opts.clientes.filter((c) => {
    const t = new Date(c.created_at).getTime();
    return t >= opts.period.start.getTime() && t <= opts.period.end.getTime();
  }).length;

  resumen.addRow(["Negocio", opts.negocioNombre]);
  resumen.addRow(["Periodo", opts.period.label]);
  resumen.addRow(["Desde", fmtDate(opts.period.start, opts.tz)]);
  resumen.addRow(["Hasta", fmtDate(opts.period.end, opts.tz)]);
  resumen.addRow(["Moneda", opts.moneda]);
  resumen.addRow([]);
  resumen.addRow(["Citas totales", opts.citas.length]);
  resumen.addRow(["Citas confirmadas", confirmadas]);
  resumen.addRow(["Citas completadas", completadas]);
  resumen.addRow(["Citas canceladas", canceladas]);
  resumen.addRow(["Clientes nuevos", nuevosClientes]);
  resumen.addRow([`Ingresos estimados (${sym})`, Number(ingresos.toFixed(2))]);
  resumen.getColumn(1).font = { bold: true };

  // ── Sheet 2: Citas detalle ──────────────────────────
  const citas = wb.addWorksheet("Citas");
  citas.columns = [
    { header: "Fecha", key: "fecha", width: 28 },
    { header: "Cliente", key: "cliente", width: 24 },
    { header: "Teléfono", key: "tel", width: 18 },
    { header: "Servicio", key: "servicio", width: 24 },
    { header: "Profesional", key: "profesional", width: 18 },
    { header: "Estado", key: "estado", width: 14 },
    { header: `Precio (${sym})`, key: "precio", width: 14 },
    { header: "Notas", key: "notas", width: 30 },
  ];
  citas.getRow(1).fill = HEAD_FILL as ExcelJS.Fill;
  citas.getRow(1).font = HEAD_FONT;
  for (const c of opts.citas) {
    const cli = opts.clientes.find((x) => x.id === c.cliente_id);
    citas.addRow({
      fecha: fmtDate(c.inicio, opts.tz),
      cliente: cli?.nombre ?? "-",
      tel: cli?.telefono ?? "-",
      servicio: c.servicio ?? "-",
      profesional: c.profesional ?? "-",
      estado: c.estado,
      precio: c.precio ?? 0,
      notas: c.notas ?? "",
    });
  }

  // ── Sheet 3: Clientes ───────────────────────────────
  const clientes = wb.addWorksheet("Clientes");
  clientes.columns = [
    { header: "Nombre", key: "nombre", width: 24 },
    { header: "Teléfono", key: "tel", width: 18 },
    { header: "Última visita", key: "ult", width: 28 },
    { header: "Visitas totales", key: "visitas", width: 14 },
    { header: "Notas", key: "notas", width: 30 },
    { header: "Alta", key: "alta", width: 28 },
  ];
  clientes.getRow(1).fill = HEAD_FILL as ExcelJS.Fill;
  clientes.getRow(1).font = HEAD_FONT;
  for (const c of opts.clientes) {
    clientes.addRow({
      nombre: c.nombre ?? "-",
      tel: c.telefono,
      ult: fmtDate(c.ultima_visita, opts.tz),
      visitas: c.total_visitas,
      notas: c.notas ?? "",
      alta: fmtDate(c.created_at, opts.tz),
    });
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function filenameForPeriod(label: string, end: Date): string {
  const iso = end.toISOString().slice(0, 10);
  const safe = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `agendalix-informe-${safe}-${iso}.xlsx`;
}
