"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconBell } from "../icons/Icons";
import type { Notificacion } from "@/lib/supabase/database.types";

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "ahora";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
}

const TIPO_ICON: Record<string, string> = {
  cita_nueva: "🗓️",
  cancelacion: "❌",
  sistema: "ℹ️",
};

export function NotifBell() {
  const [notifs, setNotifs] = useState<Notificacion[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/panel/notificaciones");
      if (r.ok) {
        const d = await r.json();
        setNotifs(d.notificaciones || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  async function toggle() {
    const wasOpen = open;
    setOpen((v) => !v);
    if (!wasOpen) {
      const hasUnread = notifs.some((n) => !n.leido);
      if (hasUnread) {
        await fetch("/api/panel/notificaciones", { method: "PATCH" });
        setNotifs((prev) => prev.map((n) => ({ ...n, leido: true })));
      }
    }
  }

  const unread = notifs.filter((n) => !n.leido).length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg text-ink-secondary hover:text-white hover:bg-bg-card2 transition-colors"
        aria-label="Notificaciones"
      >
        <IconBell size={18} stroke={unread > 0 ? "#2E8F66" : "currentColor"} />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full bg-purple ring-2 ring-bg-deep" />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-11 w-[300px] bg-bg-card border-[0.5px] border-line-subtle rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b-[0.5px] border-line-subtle flex items-center justify-between">
            <span className="text-[13px] font-medium text-white">Notificaciones</span>
            {notifs.length > 0 && (
              <span className="text-[11px] text-ink-muted">{notifs.length}</span>
            )}
          </div>
          <div className="max-h-[340px] overflow-y-auto divide-y divide-line-subtle/40">
            {notifs.length === 0 ? (
              <p className="text-[13px] text-ink-muted text-center py-10">Sin notificaciones</p>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  className={[
                    "px-4 py-3 flex gap-3 items-start",
                    !n.leido ? "bg-purple/[0.04]" : "",
                  ].join(" ")}
                >
                  <span className="text-[16px] mt-0.5 shrink-0">{TIPO_ICON[n.tipo] ?? "•"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-white truncate">{n.titulo}</p>
                    <p className="text-[12px] text-ink-secondary truncate">{n.mensaje}</p>
                    <p className="text-[11px] text-ink-muted mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.leido && (
                    <span className="w-1.5 h-1.5 rounded-full bg-purple mt-1.5 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
