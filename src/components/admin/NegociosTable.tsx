"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Negocio, Plan } from "@/lib/supabase/database.types";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Modal } from "../ui/Modal";
import { IconSearch } from "../icons/Icons";

type Props = { initial: Negocio[] };

const PLAN_LABELS: Record<Plan, string> = {
  trial: "Prueba", basico: "Básico", pro: "Pro", clinica: "Clínica",
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

type StatusFilter = "todos" | "PENDING" | "ACTIVE" | "REJECTED";

function statusOf(n: Negocio): string {
  return (n as { status?: string }).status ?? "PENDING";
}

export function NegociosTable({ initial }: Props) {
  const [rows, setRows] = useState<Negocio[]>(initial);
  const [query, setQuery] = useState("");
  // Arranca en Pendientes solo si los hay; si no, directo a Activos
  const [filterStatus, setFilterStatus] = useState<StatusFilter>(
    initial.some((n) => statusOf(n) === "PENDING") ? "PENDING" : "ACTIVE",
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Negocio | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [approveModal, setApproveModal] = useState<Negocio | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan>("basico");
  const [approving, setApproving] = useState(false);
  const [migMsg, setMigMsg] = useState<string | null>(null);
  const busyRef = useRef(false);

  // Auto-refresco cada 20s (pausado mientras hay una acción o modal abierto)
  useEffect(() => {
    const id = setInterval(async () => {
      if (busyRef.current) return;
      try {
        const res = await fetch("/api/admin/negocios");
        if (!res.ok) return;
        const d = (await res.json()) as { negocios?: Negocio[] };
        if (d.negocios) setRows(d.negocios);
      } catch {
        // siguiente tick
      }
    }, 20_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    busyRef.current = busyId !== null || !!toDelete || !!approveModal || deleting || approving;
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((n) => {
      const status = statusOf(n);
      if (filterStatus !== "todos" && status !== filterStatus) return false;
      if (!q) return true;
      return (
        n.nombre.toLowerCase().includes(q) ||
        n.email.toLowerCase().includes(q) ||
        (n.telefono || "").toLowerCase().includes(q)
      );
    });
  }, [rows, query, filterStatus]);

  const pendingCount = rows.filter((n) => statusOf(n) === "PENDING").length;

  async function patch(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    try {
      await fetch(`/api/admin/negocios/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      // Refresh
      const res = await fetch("/api/admin/negocios");
      const d = await res.json();
      const next: Negocio[] = d.negocios || [];
      setRows(next);
      // Si era el último pendiente, salta solo a Activos
      if (!next.some((n) => statusOf(n) === "PENDING")) {
        setFilterStatus((f) => (f === "PENDING" ? "ACTIVE" : f));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function confirmApprove() {
    if (!approveModal) return;
    setApproving(true);
    try {
      await patch(approveModal.id, { status: "ACTIVE", plan: selectedPlan });
      setApproveModal(null);
    } finally {
      setApproving(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/negocios/${toDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== toDelete.id));
        setToDelete(null);
      }
    } finally {
      setDeleting(false);
    }
  }

  async function runMigration() {
    const r = await fetch("/api/admin/migrate", { method: "POST" });
    const d = await r.json();
    if (d.ok) {
      setMigMsg("✅ " + d.msg);
    } else {
      setMigMsg("SQL para ejecutar en Supabase SQL Editor:\n\n" + (d.sql || []).join("\n\n"));
    }
  }

  return (
    <div className="px-6 md:px-10 py-10 max-w-[1400px]">
      <header className="mb-4 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[28px] font-medium text-white">Negocios</h1>
          {pendingCount > 0 && (
            <p className="text-[13px] text-amber-400 mt-1">
              ⚠️ {pendingCount} solicitud{pendingCount !== 1 ? "es" : ""} pendiente{pendingCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="flex gap-3 items-end flex-wrap">
          <div className="w-[220px]">
            <Input
              placeholder="Buscar…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              prefix={<IconSearch size={14} />}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as StatusFilter)}
            className="h-11 px-3.5 text-[14px] bg-bg-card border-[0.5px] border-line-subtle rounded-lg text-white focus:outline-none focus:border-purple"
          >
            <option value="PENDING">Pendientes</option>
            <option value="ACTIVE">Activos</option>
            <option value="REJECTED">Rechazados</option>
            <option value="todos">Todos</option>
          </select>
          <Button size="sm" variant="secondary" onClick={runMigration}>
            Migrar DB
          </Button>
        </div>
      </header>

      {migMsg && (
        <pre className="mb-4 text-[12px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 whitespace-pre-wrap">
          {migMsg}
        </pre>
      )}

      <div className="bg-bg-card border-[0.5px] border-line-subtle rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-bg-card2">
              <tr className="text-left text-ink-muted text-[11px] tracking-[0.12em] uppercase">
                <th className="px-4 py-3 font-medium">Negocio</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Solicitud</th>
                <th className="px-4 py-3 font-medium">Alta</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((n) => {
                const status = (n as { status?: string }).status ?? "PENDING";
                return (
                  <tr key={n.id} className="border-t-[0.5px] border-line-subtle hover:bg-bg-card2/50">
                    <td className="px-4 py-3">
                      <div className="text-white">{n.nombre}</div>
                      <div className="text-ink-muted text-[12px]">{n.email}</div>
                      <div className="text-ink-muted text-[11px]">{n.sector}</div>
                    </td>
                    <td className="px-4 py-3">
                      {status === "PENDING" ? (
                        <Badge tone="yellow">Pendiente</Badge>
                      ) : (
                        <Badge tone={n.plan === "trial" ? "yellow" : "purple"}>
                          {PLAN_LABELS[n.plan]}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={status === "ACTIVE" ? "green" : status === "REJECTED" ? "red" : "yellow"}>
                        {status === "ACTIVE" ? "Aprobado" : status === "REJECTED" ? "Rechazado" : "Pendiente"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-ink-secondary">{formatDate(n.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2 flex-wrap">
                        {status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              variant="primary"
                              loading={busyId === n.id}
                              onClick={() => { setApproveModal(n); setSelectedPlan("basico"); }}
                            >
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={busyId === n.id}
                              onClick={() => patch(n.id, { status: "REJECTED" })}
                            >
                              Rechazar
                            </Button>
                          </>
                        )}
                        {status === "ACTIVE" && (
                          <select
                            value={n.plan}
                            disabled={busyId === n.id}
                            onChange={(e) => patch(n.id, { plan: e.target.value })}
                            className="text-[12px] bg-bg-card2 border border-line-subtle text-white rounded-lg px-2 py-1 disabled:opacity-50"
                          >
                            {(Object.entries(PLAN_LABELS) as [Plan, string][]).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                        )}
                        {status === "REJECTED" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={busyId === n.id}
                            onClick={() => { setApproveModal(n); setSelectedPlan("basico"); }}
                          >
                            Reactivar
                          </Button>
                        )}
                        <Button size="sm" variant="danger" onClick={() => setToDelete(n)}>
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-ink-muted">
                    {filterStatus === "PENDING" ? "¡Sin solicitudes pendientes!" : "Sin resultados"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve Modal */}
      <Modal
        open={!!approveModal}
        onClose={() => approving ? null : setApproveModal(null)}
        title={`Aprobar: ${approveModal?.nombre}`}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setApproveModal(null)} disabled={approving}>Cancelar</Button>
            <Button variant="primary" size="sm" loading={approving} onClick={confirmApprove}>
              Aprobar y enviar acceso
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-[13px] text-ink-secondary">
            El usuario recibirá un email con su enlace de acceso al panel.
          </p>
          <div>
            <label className="text-[12px] text-ink-muted block mb-1.5">Plan a asignar</label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value as Plan)}
              className="w-full h-11 px-3.5 text-[14px] bg-bg-card border-[0.5px] border-line-subtle rounded-lg text-white focus:outline-none focus:border-purple"
            >
              <option value="trial">Trial (gratis)</option>
              <option value="basico">Starter — 39€/mes</option>
              <option value="pro">Pro — 79€/mes</option>
              <option value="clinica">Clínica — 129€/mes</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={!!toDelete}
        onClose={() => deleting ? null : setToDelete(null)}
        title="Eliminar negocio"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setToDelete(null)} disabled={deleting}>Cancelar</Button>
            <Button variant="danger" size="sm" loading={deleting} onClick={confirmDelete}>
              Eliminar definitivamente
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-ink-secondary">
          Esta acción eliminará <span className="text-white">{toDelete?.nombre}</span> y todos sus datos. No se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}
