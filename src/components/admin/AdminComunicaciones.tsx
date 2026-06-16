"use client";

import { useMemo, useState } from "react";
import { Input, Textarea } from "../ui/Input";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { useToast } from "../ui/Toast";
import type { EmailLog, Negocio, Plan } from "@/lib/supabase/database.types";

type Scope = "todos" | "activos" | "trial" | "basico" | "pro" | "clinica";

type Props = {
  logs: EmailLog[];
  negocios: Array<Pick<Negocio, "id" | "nombre" | "email" | "plan" | "activo">>;
};

const SCOPES: Array<{ value: Scope; label: string }> = [
  { value: "todos", label: "Todos los negocios" },
  { value: "activos", label: "Solo activos" },
  { value: "trial", label: "Plan Prueba" },
  { value: "basico", label: "Plan Básico" },
  { value: "pro", label: "Plan Pro" },
  { value: "clinica", label: "Plan Clínica" },
];

function filterByScope(
  negocios: Props["negocios"],
  scope: Scope,
): Props["negocios"] {
  if (scope === "todos") return negocios;
  if (scope === "activos") return negocios.filter((n) => n.activo);
  const plan = scope as Plan;
  return negocios.filter((n) => n.plan === plan);
}

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AdminComunicaciones({ logs: initialLogs, negocios }: Props) {
  const [scope, setScope] = useState<Scope>("activos");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [logs, setLogs] = useState<EmailLog[]>(initialLogs);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const recipients = useMemo(() => filterByScope(negocios, scope), [negocios, scope]);

  async function send() {
    if (!subject.trim() || !body.trim()) {
      toast("error", "Completa asunto y cuerpo del mensaje");
      return;
    }
    if (recipients.length === 0) {
      toast("error", "No hay destinatarios en este segmento");
      return;
    }
    if (
      !window.confirm(
        `Se enviará a ${recipients.length} negocios. ¿Confirmas el envío?`,
      )
    ) {
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, subject, body }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        log?: EmailLog;
        error?: string;
      };
      if (!res.ok) {
        toast("error", data.error || "No se pudo enviar");
        return;
      }
      toast("success", `Enviado a ${recipients.length} destinatarios`);
      if (data.log) setLogs((prev) => [data.log as EmailLog, ...prev]);
      setSubject("");
      setBody("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="px-6 md:px-10 py-10 max-w-[1200px]">
      <header className="mb-8">
        <h1 className="text-[28px] font-medium text-white">Comunicaciones</h1>
        <p className="text-[13px] text-ink-secondary mt-1">
          Envía anuncios a segmentos de negocios y revisa el historial.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-bg-card border-[0.5px] border-line-subtle rounded-xl p-5">
          <h2 className="text-[15px] font-medium text-white mb-4">Nuevo anuncio</h2>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[12px] text-ink-secondary block mb-1.5">Segmento</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as Scope)}
                className="w-full h-11 px-3.5 text-[14px] bg-bg-card2 border-[0.5px] border-line-subtle rounded-lg text-white focus:outline-none focus:border-purple"
              >
                {SCOPES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-ink-muted mt-1.5">
                {recipients.length} destinatarios
              </p>
            </div>
            <Input
              label="Asunto"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={140}
            />
            <Textarea
              label="Mensaje (HTML permitido)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="min-h-[200px]"
            />
            <div className="flex justify-end">
              <Button onClick={send} loading={sending} disabled={recipients.length === 0}>
                Enviar a {recipients.length}
              </Button>
            </div>
          </div>
        </section>

        <section className="bg-bg-card border-[0.5px] border-line-subtle rounded-xl p-5">
          <h2 className="text-[15px] font-medium text-white mb-4">Destinatarios</h2>
          <div className="max-h-[420px] overflow-y-auto space-y-2">
            {recipients.map((n) => (
              <div
                key={n.id}
                className="flex items-center justify-between text-[12px] py-1.5 border-b-[0.5px] border-line-subtle last:border-0"
              >
                <div>
                  <div className="text-white truncate max-w-[180px]">{n.nombre}</div>
                  <div className="text-ink-muted truncate max-w-[180px]">{n.email}</div>
                </div>
                <Badge tone={n.activo ? "green" : "red"}>
                  {n.activo ? "Activo" : "Pausado"}
                </Badge>
              </div>
            ))}
            {recipients.length === 0 ? (
              <p className="text-[12px] text-ink-muted">Sin destinatarios en este segmento.</p>
            ) : null}
          </div>
        </section>
      </div>

      <section className="mt-8 bg-bg-card border-[0.5px] border-line-subtle rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b-[0.5px] border-line-subtle">
          <h2 className="text-[15px] font-medium text-white">Historial</h2>
          <p className="text-[12px] text-ink-muted mt-0.5">Últimos 40 envíos</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-bg-card2">
              <tr className="text-left text-ink-muted text-[11px] tracking-[0.12em] uppercase">
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Segmento</th>
                <th className="px-4 py-3 font-medium">Asunto</th>
                <th className="px-4 py-3 font-medium text-right">Destinatarios</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t-[0.5px] border-line-subtle">
                  <td className="px-4 py-3 text-ink-secondary whitespace-nowrap">
                    {formatDateTime(l.sent_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="purple">{l.scope}</Badge>
                  </td>
                  <td className="px-4 py-3 text-white">{l.subject}</td>
                  <td className="px-4 py-3 text-right text-ink-secondary">
                    {l.recipients_count}
                  </td>
                </tr>
              ))}
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-ink-muted">
                    Sin envíos todavía.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
