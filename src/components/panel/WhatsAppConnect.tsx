"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "../ui/Button";

type Status = "loading" | "connected" | "connecting" | "disconnected";

export function WhatsAppConnect() {
  const [status, setStatus] = useState<Status>("loading");
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  const fetchStatus = useCallback(async (): Promise<{ status: Status; qrcode: string | null }> => {
    try {
      const res = await fetch("/api/panel/whatsapp");
      const data = (await res.json()) as { status?: string; qrcode?: string };
      const valid: Status[] = ["loading", "connected", "connecting", "disconnected"];
      const next: Status = (valid.includes(data.status as Status) ? (data.status as Status) : "disconnected");
      const nextQr = data.qrcode ?? null;
      setStatus(next);
      setQrcode(nextQr);
      return { status: next, qrcode: nextQr };
    } catch {
      return { status: "disconnected", qrcode: null };
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Poll while connecting or while disconnected with QR visible (waiting for scan)
  useEffect(() => {
    const shouldPoll =
      status === "connecting" ||
      status === "loading" ||
      (status === "disconnected" && qrcode !== null);
    if (!shouldPoll) return;

    setPolling(true);
    const id = setInterval(async () => {
      const result = await fetchStatus();
      // Stop only when fully connected, or when truly disconnected (no QR)
      if (result.status === "connected" || (result.status === "disconnected" && !result.qrcode)) {
        clearInterval(id);
        setPolling(false);
      }
    }, 3000);
    return () => {
      clearInterval(id);
      setPolling(false);
    };
  }, [status, qrcode, fetchStatus]);

  async function handleConnect() {
    setStatus("connecting");
    setQrcode(null);
    const res = await fetch("/api/panel/whatsapp", { method: "POST" });
    const data = (await res.json()) as { qrcode?: string };
    setQrcode(data.qrcode ?? null);
    setStatus("connecting");
  }

  async function handleDisconnect() {
    await fetch("/api/panel/whatsapp", { method: "DELETE" });
    setStatus("disconnected");
    setQrcode(null);
  }

  return (
    <div className="bg-bg-card border-[0.5px] border-line-subtle rounded-xl p-5 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[14px] font-medium text-white">Conexión WhatsApp</p>
          <p className="text-[12px] text-ink-secondary mt-0.5">
            Escanea el QR con tu móvil para vincular WhatsApp al agente IA.
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {status === "connected" ? (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-ink-secondary">
            WhatsApp conectado. El agente IA responde automáticamente.
          </p>
          <div className="flex">
            <Button variant="ghost" onClick={handleDisconnect}>
              Desconectar
            </Button>
          </div>
        </div>
      ) : null}

      {(status === "connecting" || status === "disconnected") ? (
        <div className="flex flex-col items-center gap-4">
          {qrcode ? (
            <div className="bg-white p-3 rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrcode.startsWith("data:") ? qrcode : `data:image/png;base64,${qrcode}`}
                alt="QR WhatsApp"
                width={220}
                height={220}
                className="block"
              />
            </div>
          ) : (
            <div className="w-[220px] h-[220px] bg-bg-muted rounded-xl flex items-center justify-center">
              {status === "connecting" || polling ? (
                <span className="text-[12px] text-ink-muted animate-pulse">Generando QR…</span>
              ) : (
                <span className="text-[12px] text-ink-muted">Sin QR</span>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={handleConnect} loading={status === "connecting" && !qrcode}>
              {qrcode ? "Regenerar QR" : "Generar QR"}
            </Button>
          </div>
          {status === "connecting" && qrcode ? (
            <p className="text-[12px] text-ink-secondary text-center">
              Abre WhatsApp en tu móvil → Dispositivos vinculados → Vincular dispositivo
            </p>
          ) : null}
        </div>
      ) : null}

      {status === "loading" ? (
        <div className="h-[60px] flex items-center justify-center">
          <span className="text-[13px] text-ink-muted animate-pulse">Cargando…</span>
        </div>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { label: string; color: string }> = {
    connected: { label: "Conectado", color: "bg-green-500/15 text-green-400" },
    connecting: { label: "Conectando…", color: "bg-yellow-500/15 text-yellow-400" },
    disconnected: { label: "Desconectado", color: "bg-red-500/15 text-red-400" },
    loading: { label: "…", color: "bg-ink-muted/20 text-ink-muted" },
  };
  const { label, color } = map[status];
  return (
    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${color}`}>{label}</span>
  );
}
