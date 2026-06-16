"use client";

import { useMemo, useState } from "react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { useToast } from "../ui/Toast";
import { IconCheck, IconTrash, IconBell } from "../icons/Icons";
import type { Cliente, EsperaEstado, ListaEspera } from "@/lib/supabase/database.types";
import { formatDateTimeInZone } from "@/lib/timezone";

type Props = {
  initialEspera: ListaEspera[];
  clientes: Cliente[];
  tz: string;
};

function toneFor(e: EsperaEstado) {
  if (e === "notificado") return "yellow" as const;
  if (e === "convertido") return "green" as const;
  if (e === "cancelado") return "red" as const;
  return "purple" as const;
}

export function Espera({ initialEspera, clientes, tz }: Props) {
  const [items, setItems] = useState(initialEspera);
  const { toast } = useToast();

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => {
        if (a.prioridad !== b.prioridad) return b.prioridad - a.prioridad;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }),
    [items],
  );

  async function patch(id: string, estado: EsperaEstado) {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, estado } : x)));
    const res = await fetch(`/api/panel/espera/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    toast(res.ok ? "success" : "error", res.ok ? "Actualizado" : "Error al guardar");
  }

  async function del(id: string) {
    if (!confirm("¿Quitar de la lista de espera?")) return;
    const res = await fetch(`/api/panel/espera/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((xs) => xs.filter((x) => x.id !== id));
      toast("success", "Eliminado");
    } else {
      toast("error", "No se pudo eliminar");
    }
  }

  if (items.length === 0) {
    return (
      <div className="bg-bg-card border-[0.5px] border-line-subtle rounded-xl">
        <EmptyState
          title="Lista de espera vacía"
          description="Cuando un cliente no encuentre hueco, el agente le ofrecerá añadirse y aparecerá aquí."
        />
      </div>
    );
  }

  return (
    <div className="bg-bg-card border-[0.5px] border-line-subtle rounded-xl overflow-hidden">
      <ul>
        {sorted.map((w) => {
          const cli = clientes.find((c) => c.id === w.cliente_id);
          return (
            <li
              key={w.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3 border-b-[0.5px] border-line-subtle last:border-b-0"
            >
              <div className="flex-1 min-w-[200px]">
                <p className="text-[14px] text-white">{cli?.nombre || "Cliente"}</p>
                <p className="text-[11px] text-ink-muted">
                  {cli?.telefono || ""} · {w.servicio || "Sin servicio"}
                  {w.profesional ? ` · ${w.profesional}` : ""}
                </p>
              </div>
              <div className="text-[12px] text-ink-secondary min-w-[140px]">
                {w.fecha_preferida ? formatDateTimeInZone(w.fecha_preferida, tz) : "Sin preferencia"}
              </div>
              <Badge tone={toneFor(w.estado)}>{w.estado}</Badge>
              <div className="flex gap-2">
                {w.estado === "esperando" ? (
                  <Button size="sm" variant="secondary" onClick={() => patch(w.id, "notificado")}>
                    <IconBell size={14} /> Notificado
                  </Button>
                ) : null}
                {w.estado !== "convertido" ? (
                  <Button size="sm" onClick={() => patch(w.id, "convertido")}>
                    <IconCheck size={14} /> Convertido
                  </Button>
                ) : null}
                <Button size="sm" variant="ghost" onClick={() => del(w.id)}>
                  <IconTrash size={14} />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
