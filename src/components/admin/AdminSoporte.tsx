"use client";

import { useEffect, useRef, useState } from "react";
import { IconSend } from "../icons/Icons";
import { Badge } from "../ui/Badge";
import type { Mensaje } from "@/lib/supabase/database.types";

type Thread = {
  negocio_id: string;
  negocio_nombre: string;
  negocio_email: string;
  plan: string;
  updated_at: string;
  pendiente: boolean;
  mensajes: Mensaje[];
};

function fmtTime(iso: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function AdminSoporte() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch("/api/admin/soporte");
      const data = (await res.json()) as { threads?: Thread[] };
      setThreads(data.threads || []);
    } catch {
      // siguiente poll
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 25_000);
    return () => clearInterval(id);
  }, []);

  const active = threads.find((t) => t.negocio_id === selected) || null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.mensajes.length, selected]);

  async function reply(e: React.FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t || !active || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/soporte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ negocio_id: active.negocio_id, texto: t }),
      });
      const data = (await res.json()) as { ok?: boolean; mensaje?: Mensaje };
      if (res.ok && data.mensaje) {
        setThreads((prev) =>
          prev.map((th) =>
            th.negocio_id === active.negocio_id
              ? { ...th, mensajes: [...th.mensajes, data.mensaje!], pendiente: false }
              : th,
          ),
        );
        setTexto("");
      }
    } finally {
      setSending(false);
    }
  }

  const pendientes = threads.filter((t) => t.pendiente).length;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-medium text-white">Soporte</h1>
          <p className="text-[13px] text-ink-secondary mt-1">
            Mensajes de los negocios desde su panel.
            {pendientes > 0 ? ` ${pendientes} pendiente${pendientes === 1 ? "" : "s"} de respuesta.` : " Todo respondido."}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        {/* Lista de hilos */}
        <div className="bg-bg-card border-[0.5px] border-line-subtle rounded-2xl overflow-hidden">
          {loading ? (
            <p className="text-[13px] text-ink-muted text-center py-10">Cargando…</p>
          ) : threads.length === 0 ? (
            <p className="text-[13px] text-ink-muted text-center py-10 px-4">
              Aún no hay conversaciones de soporte.
            </p>
          ) : (
            <ul className="divide-y divide-line-subtle max-h-[560px] overflow-y-auto">
              {threads.map((t) => (
                <li key={t.negocio_id}>
                  <button
                    onClick={() => setSelected(t.negocio_id)}
                    className={[
                      "w-full text-left px-4 py-3.5 transition-colors",
                      selected === t.negocio_id ? "bg-bg-card2" : "hover:bg-bg-card2/60",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] text-white truncate">{t.negocio_nombre}</p>
                      {t.pendiente && (
                        <span className="w-2 h-2 rounded-full bg-[#F2B560] shrink-0" aria-label="Pendiente" />
                      )}
                    </div>
                    <p className="text-[11.5px] text-ink-muted truncate mt-0.5">
                      {t.mensajes[t.mensajes.length - 1]?.text || ""}
                    </p>
                    <p className="text-[10.5px] text-ink-faint mt-1">{fmtTime(t.updated_at)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Conversación */}
        <div className="bg-bg-card border-[0.5px] border-line-subtle rounded-2xl flex flex-col" style={{ minHeight: 480 }}>
          {!active ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[13px] text-ink-muted">Selecciona una conversación</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-3.5 border-b-[0.5px] border-line-subtle flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] text-white truncate">{active.negocio_nombre}</p>
                  <p className="text-[12px] text-ink-muted truncate">{active.negocio_email}</p>
                </div>
                <Badge tone={active.plan === "trial" ? "yellow" : "purple"}>{active.plan}</Badge>
              </div>

              <div className="flex-1 p-5 flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: 420 }}>
                {active.mensajes.map((m) => {
                  const fromBusiness = m.role === "cliente";
                  return (
                    <div
                      key={m.id}
                      className={[
                        "max-w-[80%] px-4 py-2.5 rounded-2xl text-[13.5px] leading-relaxed",
                        fromBusiness
                          ? "self-start bg-bg-card2 text-[#ddd] rounded-bl-md border-[0.5px] border-line-subtle"
                          : "self-end bg-purple text-white rounded-br-md",
                      ].join(" ")}
                    >
                      <p className="whitespace-pre-wrap">{m.text}</p>
                      <p className={["text-[10px] mt-1.5 text-right", fromBusiness ? "text-ink-muted" : "text-white/60"].join(" ")}>
                        {fmtTime(m.timestamp)}
                      </p>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={reply} className="border-t-[0.5px] border-line-subtle p-3 flex items-end gap-2">
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      reply(e);
                    }
                  }}
                  placeholder={`Responder a ${active.negocio_nombre}…`}
                  rows={1}
                  className="flex-1 bg-bg-card2 border-[0.5px] border-line-subtle rounded-xl px-4 py-3 text-[13.5px] text-white placeholder:text-ink-muted resize-none focus:outline-none focus:border-purple min-h-[46px] max-h-[140px]"
                />
                <button
                  type="submit"
                  disabled={!texto.trim() || sending}
                  aria-label="Enviar respuesta"
                  className="w-[46px] h-[46px] shrink-0 rounded-xl bg-purple hover:bg-purple-dark disabled:opacity-40 flex items-center justify-center transition-colors"
                >
                  {sending ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <IconSend size={18} stroke="#fff" />
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
