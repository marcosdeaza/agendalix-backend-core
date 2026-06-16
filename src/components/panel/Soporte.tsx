"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { IconHelp, IconSend } from "../icons/Icons";
import type { Mensaje } from "@/lib/supabase/database.types";

const EASE = [0.22, 1, 0.36, 1] as const;

function fmtTime(iso: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function Soporte() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch("/api/panel/soporte");
      const data = (await res.json()) as { mensajes?: Mensaje[] };
      setMensajes(data.mensajes || []);
    } catch {
      // silencioso; reintento en el siguiente poll
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/panel/soporte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: t }),
      });
      const data = (await res.json()) as { ok?: boolean; mensaje?: Mensaje; error?: string };
      if (!res.ok || !data.mensaje) throw new Error(data.error || "No pudimos enviar el mensaje");
      setMensajes((m) => [...m, data.mensaje!]);
      setTexto("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-[720px] mx-auto flex flex-col gap-5">
      <header>
        <h1 className="text-[24px] font-medium text-white">Soporte</h1>
        <p className="text-[13px] text-ink-secondary mt-1">
          Escríbenos desde aquí — somos personas, no bots. Respondemos normalmente
          en menos de 24 h y te avisaremos por email.
        </p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="bg-bg-card border-[0.5px] border-line-subtle rounded-2xl flex flex-col overflow-hidden"
        style={{ minHeight: 420 }}
      >
        <div className="flex-1 p-5 flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: 480 }}>
          {loading ? (
            <p className="text-[13px] text-ink-muted text-center py-10">Cargando…</p>
          ) : mensajes.length === 0 ? (
            <div className="flex flex-col items-center text-center py-12">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#2E8F6618] mb-4">
                <IconHelp size={22} />
              </span>
              <p className="text-[14px] text-white">¿En qué podemos ayudarte?</p>
              <p className="text-[12.5px] text-ink-muted mt-1.5 max-w-[320px]">
                Dudas sobre el asistente, tu plan, la conexión de WhatsApp…
                cuéntanos y nos ponemos con ello.
              </p>
            </div>
          ) : (
            mensajes.map((m) => {
              const own = m.role === "cliente";
              return (
                <div
                  key={m.id}
                  className={[
                    "max-w-[80%] px-4 py-2.5 rounded-2xl text-[13.5px] leading-relaxed",
                    own
                      ? "self-end bg-purple text-white rounded-br-md"
                      : "self-start bg-bg-card2 text-[#ddd] rounded-bl-md border-[0.5px] border-line-subtle",
                  ].join(" ")}
                >
                  {!own && (
                    <p className="text-[11px] text-[#7FC9A6] font-medium mb-1">Equipo Agendalix</p>
                  )}
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <p className={["text-[10px] mt-1.5 text-right", own ? "text-white/60" : "text-ink-muted"].join(" ")}>
                    {fmtTime(m.timestamp)}
                  </p>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {error && <p className="px-5 pb-2 text-[12px] text-[#E08383]">{error}</p>}

        <form onSubmit={send} className="border-t-[0.5px] border-line-subtle p-3 flex items-end gap-2">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(e);
              }
            }}
            placeholder="Escribe tu mensaje…"
            rows={1}
            className="flex-1 bg-bg-card2 border-[0.5px] border-line-subtle rounded-xl px-4 py-3 text-[13.5px] text-white placeholder:text-ink-muted resize-none focus:outline-none focus:border-purple min-h-[46px] max-h-[140px]"
          />
          <button
            type="submit"
            disabled={!texto.trim() || sending}
            aria-label="Enviar"
            className="w-[46px] h-[46px] shrink-0 rounded-xl bg-purple hover:bg-purple-dark disabled:opacity-40 flex items-center justify-center transition-colors"
          >
            {sending ? (
              <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <IconSend size={18} stroke="#fff" />
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
