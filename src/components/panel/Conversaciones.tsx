"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { useToast } from "../ui/Toast";
import { IconSearch, IconArrowRight, IconChevronLeft } from "../icons/Icons";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  Cliente,
  Conversacion,
  Mensaje,
} from "@/lib/supabase/database.types";
import { formatTimeInZone, formatPhone } from "@/lib/timezone";

type Props = {
  initialConversaciones: Conversacion[];
  clientes: Cliente[];
  tz: string;
};

function lastMsg(c: Conversacion): Mensaje | null {
  const arr = Array.isArray(c.mensajes) ? c.mensajes : [];
  return arr[arr.length - 1] || null;
}

function isUnread(c: Conversacion): boolean {
  const last = lastMsg(c);
  if (!last) return false;
  if (last.role !== "cliente") return false;
  return new Date(last.timestamp).getTime() > new Date(c.leida_hasta).getTime();
}

export function Conversaciones({ initialConversaciones, clientes, tz }: Props) {
  const [items, setItems] = useState(initialConversaciones);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const sb = createSupabaseBrowserClient();
    const channel = sb
      .channel("conversaciones-panel")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversaciones" }, (payload) => {
        const nu = payload.new as Conversacion;
        setItems((xs) => [nu, ...xs.filter((x) => x.id !== nu.id)]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conversaciones" }, (payload) => {
        const nu = payload.new as Conversacion;
        setItems((xs) => {
          const filtered = xs.filter((x) => x.id !== nu.id);
          return [nu, ...filtered].sort(
            (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
          );
        });
      })
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => {
      const cli = clientes.find((cl) => cl.telefono === c.cliente_telefono);
      return (
        (cli?.nombre || "").toLowerCase().includes(q) ||
        c.cliente_telefono.toLowerCase().includes(q)
      );
    });
  }, [items, clientes, query]);

  const active = items.find((c) => c.id === activeId) || null;

  function selectConversacion(id: string) {
    setActiveId(id);
    setMobileView("chat");
  }

  function backToList() {
    setMobileView("list");
  }

  useEffect(() => {
    if (!active) return;
    if (!isUnread(active)) return;
    fetch(`/api/panel/conversaciones/${active.id}/leer`, { method: "POST" }).catch(() => {});
    setItems((xs) =>
      xs.map((x) => (x.id === active.id ? { ...x, leida_hasta: new Date().toISOString() } : x)),
    );
  }, [active]);

  async function toggleIntervenir() {
    if (!active) return;
    const next = !active.intervenida;
    setItems((xs) => xs.map((x) => (x.id === active.id ? { ...x, intervenida: next } : x)));
    const res = await fetch(`/api/panel/conversaciones/${active.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intervenida: next }),
    });
    if (!res.ok) toast("error", "No se pudo actualizar");
  }

  async function send() {
    const text = draft.trim();
    if (!text || !active || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/panel/conversaciones/${active.id}/enviar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        conversacion?: Conversacion;
        error?: string;
      };
      if (!res.ok || !data.conversacion) {
        toast("error", data.error || "No se pudo enviar");
        return;
      }
      setItems((xs) => xs.map((x) => (x.id === active.id ? data.conversacion! : x)));
      setDraft("");
    } finally {
      setSending(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="bg-bg-card border-[0.5px] border-line-subtle rounded-xl">
        <EmptyState
          title="Aún no hay conversaciones"
          description="Cuando tus clientes escriban por WhatsApp aparecerán aquí en tiempo real."
        />
      </div>
    );
  }

  // ─── Panel lista (siempre visible en desktop, condicional en mobile) ───────
  const showList = mobileView === "list";
  const showChat = mobileView === "chat";

  return (
    <div className="relative h-[calc(100dvh-180px)] min-h-[500px] md:h-[calc(100dvh-160px)]">
      {/* Desktop: grid lado a lado */}
      <div className="hidden md:grid md:grid-cols-[300px_1fr] gap-3 h-full">
        <ConvList
          filtered={filtered}
          activeId={activeId}
          clientes={clientes}
          tz={tz}
          query={query}
          onQuery={setQuery}
          onSelect={(id) => setActiveId(id)}
        />
        <ChatPanel
          active={active}
          clientes={clientes}
          tz={tz}
          draft={draft}
          sending={sending}
          onDraft={setDraft}
          onSend={send}
          onToggle={toggleIntervenir}
        />
      </div>

      {/* Mobile: una vista a la vez */}
      <div className="md:hidden h-full">
        {showList && (
          <ConvList
            filtered={filtered}
            activeId={activeId}
            clientes={clientes}
            tz={tz}
            query={query}
            onQuery={setQuery}
            onSelect={selectConversacion}
          />
        )}
        {showChat && (
          <ChatPanel
            active={active}
            clientes={clientes}
            tz={tz}
            draft={draft}
            sending={sending}
            onDraft={setDraft}
            onSend={send}
            onToggle={toggleIntervenir}
            onBack={backToList}
          />
        )}
      </div>
    </div>
  );
}

// ─── Lista de conversaciones ─────────────────────────────────────────────────

function ConvList({
  filtered, activeId, clientes, tz, query, onQuery, onSelect,
}: {
  filtered: Conversacion[];
  activeId: string | null;
  clientes: Cliente[];
  tz: string;
  query: string;
  onQuery: (q: string) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col bg-bg-card border-[0.5px] border-line-subtle rounded-xl overflow-hidden h-full">
      <div className="p-3 border-b-[0.5px] border-line-subtle shrink-0">
        <Input
          placeholder="Buscar…"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          prefix={<IconSearch size={14} />}
        />
      </div>
      <ul className="flex-1 overflow-y-auto">
        {filtered.map((c) => {
          const cli = clientes.find((cl) => cl.telefono === c.cliente_telefono);
          const last = lastMsg(c);
          const unread = isUnread(c);
          return (
            <li key={c.id}>
              <button
                onClick={() => onSelect(c.id)}
                className={`w-full text-left px-4 py-3 border-b-[0.5px] border-line-subtle/50 transition-colors ${
                  activeId === c.id ? "bg-bg-card2" : "hover:bg-bg-card2/60 active:bg-bg-card2"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-white truncate">
                    {cli?.nombre || formatPhone(c.cliente_telefono)}
                  </span>
                  {last && (
                    <span className="text-[10px] text-ink-muted shrink-0">
                      {formatTimeInZone(last.timestamp, tz)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[12px] text-ink-muted truncate flex-1 leading-relaxed">
                    {last ? last.text : "—"}
                  </p>
                  {unread && <span className="w-2 h-2 rounded-full bg-purple shrink-0" />}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Panel de chat ───────────────────────────────────────────────────────────

function ChatPanel({
  active, clientes, tz, draft, sending, onDraft, onSend, onToggle, onBack,
}: {
  active: Conversacion | null;
  clientes: Cliente[];
  tz: string;
  draft: string;
  sending: boolean;
  onDraft: (v: string) => void;
  onSend: () => void;
  onToggle: () => void;
  onBack?: () => void;
}) {
  if (!active) {
    return (
      <div className="flex flex-col bg-bg-card border-[0.5px] border-line-subtle rounded-xl overflow-hidden h-full items-center justify-center">
        <EmptyState title="Selecciona una conversación" />
      </div>
    );
  }

  const clienteNombre =
    clientes.find((cl) => cl.telefono === active.cliente_telefono)?.nombre ||
    formatPhone(active.cliente_telefono);

  return (
    <div className="flex flex-col bg-bg-card border-[0.5px] border-line-subtle rounded-xl overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b-[0.5px] border-line-subtle shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-bg-card2 transition-colors shrink-0"
            aria-label="Volver"
          >
            <IconChevronLeft size={18} stroke="#2E8F66" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium text-white truncate">{clienteNombre}</p>
          <p className="text-[11px] text-ink-muted truncate">{formatPhone(active.cliente_telefono)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge tone={active.intervenida ? "yellow" : "purple"}>
            {active.intervenida ? "Manual" : "IA"}
          </Badge>
          <Button variant="secondary" size="sm" onClick={onToggle}>
            {active.intervenida ? "← IA" : "Intervenir"}
          </Button>
        </div>
      </div>

      {/* Messages */}
      <MessageList conversacion={active} tz={tz} />

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); onSend(); }}
        className="flex items-center gap-2 px-3 py-3 border-t-[0.5px] border-line-subtle shrink-0"
      >
        <input
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          placeholder={
            active.intervenida ? "Escribe un mensaje…" : "Intervén para escribir manualmente"
          }
          disabled={!active.intervenida || sending}
          className="flex-1 h-11 px-3.5 text-[14px] bg-bg-card2 border-[0.5px] border-line-subtle rounded-lg text-white placeholder:text-ink-muted focus:outline-none focus:border-purple disabled:opacity-40"
        />
        <Button type="submit" disabled={!active.intervenida || !draft.trim()} loading={sending}>
          <IconArrowRight size={16} />
        </Button>
      </form>
    </div>
  );
}

// ─── Lista de mensajes ───────────────────────────────────────────────────────

function MessageList({ conversacion, tz }: { conversacion: Conversacion; tz: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const msgs = Array.isArray(conversacion.mensajes) ? conversacion.mensajes : [];

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [msgs.length]);

  return (
    <div ref={ref} className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2 min-h-0">
      {msgs.map((m) => {
        const mine = m.role !== "cliente";
        return (
          <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[78%] px-3 py-2 rounded-xl text-[13px] leading-relaxed whitespace-pre-wrap break-words ${
                mine
                  ? m.role === "humano"
                    ? "bg-[#3a2e12] text-[#F2B560] border-[0.5px] border-[#6B4919]"
                    : "bg-purple/20 text-purple-light border-[0.5px] border-purple/30"
                  : "bg-bg-card2 text-white border-[0.5px] border-line-subtle"
              }`}
            >
              <p>{m.text}</p>
              <p className="text-[10px] mt-1 opacity-50">
                {formatTimeInZone(m.timestamp, tz)}
                {m.role === "humano" ? " · Tú" : m.role === "agente" ? " · IA" : ""}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
