"use client";

import { useMemo, useState } from "react";
import { SlideOver } from "../ui/SlideOver";
import { Button } from "../ui/Button";
import { Input, Textarea } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { useToast } from "../ui/Toast";
import { Modal } from "../ui/Modal";
import { IconSearch, IconPlus, IconTrash, IconPhone } from "../icons/Icons";
import type { Cita, Cliente } from "@/lib/supabase/database.types";
import { formatDateTimeInZone, formatPrice, formatPhone } from "@/lib/timezone";

type Props = {
  initialClientes: Cliente[];
  citas: Cita[];
  tz: string;
  moneda: string;
};

type StatusTone = "green" | "yellow" | "red" | "neutral";

function statusFor(cli: Cliente): { tone: StatusTone; label: string } {
  if (!cli.ultima_visita) return { tone: "neutral", label: "Sin visitas" };
  const days = (Date.now() - new Date(cli.ultima_visita).getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 30) return { tone: "green", label: "Activo" };
  if (days <= 90) return { tone: "yellow", label: "Reciente" };
  return { tone: "red", label: "Inactivo" };
}

export function Clientes({ initialClientes, citas, tz, moneda }: Props) {
  const [clientes, setClientes] = useState(initialClientes);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Cliente | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const { toast } = useToast();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter(
      (c) =>
        (c.nombre || "").toLowerCase().includes(q) ||
        c.telefono.split("@")[0].toLowerCase().includes(q),
    );
  }, [clientes, query]);

  const citasByClient = useMemo(() => {
    const map = new Map<string, Cita[]>();
    for (const c of citas) {
      if (!c.cliente_id) continue;
      const arr = map.get(c.cliente_id);
      if (arr) arr.push(c);
      else map.set(c.cliente_id, [c]);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());
    }
    return map;
  }, [citas]);

  function onCreated(cli: Cliente) {
    setClientes((xs) => [cli, ...xs]);
    setCreateOpen(false);
  }

  async function saveNotas(id: string, notas: string) {
    setClientes((xs) => xs.map((x) => (x.id === id ? { ...x, notas } : x)));
    const res = await fetch(`/api/panel/clientes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notas }),
    });
    toast(res.ok ? "success" : "error", res.ok ? "Guardado" : "Error al guardar");
  }

  async function saveNombre(id: string, nombre: string) {
    setClientes((xs) => xs.map((x) => (x.id === id ? { ...x, nombre } : x)));
    const res = await fetch(`/api/panel/clientes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre }),
    });
    if (!res.ok) toast("error", "No se pudo guardar");
  }

  async function del(id: string) {
    if (!confirm("¿Eliminar este cliente? Esta acción no borra sus citas.")) return;
    const res = await fetch(`/api/panel/clientes/${id}`, { method: "DELETE" });
    if (res.ok) {
      setClientes((xs) => xs.filter((x) => x.id !== id));
      setSelected(null);
      toast("success", "Cliente eliminado");
    } else {
      toast("error", "No se pudo eliminar");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-[220px]">
          <Input
            placeholder="Buscar por nombre o teléfono…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            prefix={<IconSearch size={16} />}
          />
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <IconPlus size={16} />
          Nuevo cliente
        </Button>
      </div>

      <div className="bg-bg-card border-[0.5px] border-line-subtle rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            title={query ? "Sin resultados" : "Aún no tienes clientes"}
            description={
              query
                ? "Prueba con otro nombre o número."
                : "Los clientes se crean automáticamente cuando reservan por WhatsApp."
            }
            action={
              !query ? (
                <Button onClick={() => setCreateOpen(true)}>
                  <IconPlus size={16} /> Añadir manualmente
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-bg-card2">
                <tr className="text-[11px] tracking-[0.12em] uppercase text-ink-muted">
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Teléfono</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Última visita</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Visitas</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const s = statusFor(c);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelected(c)}
                      className="cursor-pointer border-t-[0.5px] border-line-subtle hover:bg-bg-card2/60 transition"
                    >
                      <td className="px-4 py-3">
                        <div className="text-[14px] text-white">{c.nombre || "—"}</div>
                        <div className="text-[11px] text-ink-muted sm:hidden">{formatPhone(c.telefono)}</div>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-ink-secondary hidden sm:table-cell">
                        {formatPhone(c.telefono)}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-ink-secondary hidden md:table-cell">
                        {c.ultima_visita ? formatDateTimeInZone(c.ultima_visita, tz) : "—"}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-ink-secondary hidden md:table-cell">
                        {c.total_visitas}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={s.tone}>{s.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SlideOver
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.nombre || "Cliente"}
      >
        {selected ? (
          <ClienteDetail
            cliente={selected}
            historial={citasByClient.get(selected.id) || []}
            tz={tz}
            moneda={moneda}
            onNombre={saveNombre}
            onNotas={saveNotas}
            onDelete={del}
          />
        ) : null}
      </SlideOver>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo cliente">
        <NewClienteForm onCreated={onCreated} onCancel={() => setCreateOpen(false)} />
      </Modal>
    </div>
  );
}

function ClienteDetail({
  cliente,
  historial,
  tz,
  moneda,
  onNombre,
  onNotas,
  onDelete,
}: {
  cliente: Cliente;
  historial: Cita[];
  tz: string;
  moneda: string;
  onNombre: (id: string, n: string) => void;
  onNotas: (id: string, n: string) => void;
  onDelete: (id: string) => void;
}) {
  const [nombre, setNombre] = useState(cliente.nombre || "");
  const [notas, setNotas] = useState(cliente.notas || "");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Input
          label="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onBlur={() => onNombre(cliente.id, nombre)}
        />
      </div>
      <div>
        <p className="text-[11px] tracking-[0.14em] uppercase text-ink-muted mb-1">Teléfono</p>
        <a
          href={`https://wa.me/${cliente.telefono.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[14px] text-purple-light hover:underline"
        >
          <IconPhone size={14} />
          {formatPhone(cliente.telefono)}
        </a>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] tracking-[0.14em] uppercase text-ink-muted mb-1">Visitas totales</p>
          <p className="text-[15px] text-white">{cliente.total_visitas}</p>
        </div>
        <div>
          <p className="text-[11px] tracking-[0.14em] uppercase text-ink-muted mb-1">Alta</p>
          <p className="text-[13px] text-ink-secondary">
            {formatDateTimeInZone(cliente.created_at, tz)}
          </p>
        </div>
      </div>
      <Textarea
        label="Notas internas"
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
        onBlur={() => onNotas(cliente.id, notas)}
      />

      <div>
        <p className="text-[11px] tracking-[0.14em] uppercase text-ink-muted mb-2">Historial</p>
        {historial.length === 0 ? (
          <p className="text-[13px] text-ink-muted">Sin citas todavía.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {historial.slice(0, 30).map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-bg-card2 border-[0.5px] border-line-subtle"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-white truncate">{c.servicio || "Cita"}</p>
                  <p className="text-[11px] text-ink-muted">
                    {formatDateTimeInZone(c.inicio, tz)}
                    {c.precio != null ? ` · ${formatPrice(c.precio, moneda)}` : ""}
                  </p>
                </div>
                <Badge
                  tone={
                    c.estado === "cancelada"
                      ? "red"
                      : c.estado === "completada"
                        ? "green"
                        : c.estado === "pendiente"
                          ? "yellow"
                          : "purple"
                  }
                >
                  {c.estado}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button variant="danger" onClick={() => onDelete(cliente.id)}>
          <IconTrash size={16} /> Eliminar cliente
        </Button>
      </div>
    </div>
  );
}

function NewClienteForm({
  onCreated,
  onCancel,
}: {
  onCreated: (c: Cliente) => void;
  onCancel: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!telefono.trim()) {
      setError("El teléfono es obligatorio");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/panel/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim() || null, telefono: telefono.trim(), notas: notas.trim() || null }),
      });
      const data = (await res.json().catch(() => ({}))) as { cliente?: Cliente; error?: string };
      if (!res.ok || !data.cliente) {
        setError(data.error || "No se pudo crear");
        return;
      }
      onCreated(data.cliente);
      toast("success", "Cliente creado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input
        label="Nombre"
        placeholder="María López"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />
      <Input
        label="Teléfono"
        placeholder="+34 600 123 456"
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
        error={error || undefined}
      />
      <Textarea
        label="Notas (opcional)"
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
      />
      <div className="flex justify-end gap-2 mt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          Crear cliente
        </Button>
      </div>
    </form>
  );
}
