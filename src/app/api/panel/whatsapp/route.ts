import { NextResponse } from "next/server";
import { getCurrentNegocio } from "@/lib/panel-data";
import {
  createInstance,
  getQrCode,
  getInstanceStatus,
  deleteInstance,
  setInstanceWebhook,
  evoRequest,
} from "@/lib/whatsapp";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateResponse = {
  instance?: { instanceId?: string };
  qrcode?: { base64?: string; code?: string };
};

function extractQrFromCreate(created: unknown): string | null {
  const c = created as CreateResponse | null;
  return c?.qrcode?.base64 ?? null;
}

async function forceDeleteInstance(instanceName: string): Promise<void> {
  try {
    await evoRequest(`/instance/delete/${instanceName}`, "DELETE");
  } catch {
    // Might not exist — OK
  }
  // Give Evolution API a moment to complete deletion
  await new Promise((r) => setTimeout(r, 800));
}

async function freshQr(instanceName: string, negocioId: string): Promise<string | null> {
  await forceDeleteInstance(instanceName);

  const created = await createInstance(instanceName).catch((e: Error) => {
    console.error("[whatsapp] createInstance failed", e?.message);
    return null;
  });

  const newInstanceId = (created as CreateResponse | null)?.instance?.instanceId;
  if (newInstanceId) {
    const admin = createSupabaseAdminClient();
    try { await admin.from("negocios").update({ whatsapp_number: newInstanceId }).eq("id", negocioId); } catch { /* ignore */ }
  }

  const qrFromCreate = extractQrFromCreate(created);
  if (qrFromCreate) return qrFromCreate;

  // Fallback: /instance/connect
  const qr = await getQrCode(instanceName);
  return qr?.qrcode ?? null;
}

// GET /api/panel/whatsapp
export async function GET() {
  const negocio = await getCurrentNegocio();
  if (!negocio) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const instanceName = `neg_${negocio.id}`;
  const status = await getInstanceStatus(instanceName);

  if (status === "open") {
    await setInstanceWebhook(instanceName).catch(() => null);
    return NextResponse.json({ status: "connected" });
  }

  if (status === "not_found" || status === "unknown" || status === "close") {
    const created = await createInstance(instanceName).catch(() => null);
    const newInstanceId = (created as CreateResponse | null)?.instance?.instanceId;
    if (newInstanceId) {
      const admin = createSupabaseAdminClient();
      try { await admin.from("negocios").update({ whatsapp_number: newInstanceId }).eq("id", negocio.id); } catch { /* ignore */ }
    }
    const qrFromCreate = extractQrFromCreate(created);
    if (qrFromCreate) {
      return NextResponse.json({ status: "connecting", qrcode: qrFromCreate });
    }
  } else {
    await setInstanceWebhook(instanceName).catch(() => null);
  }

  const qr = await getQrCode(instanceName);
  const finalStatus = status === "not_found" || status === "close" ? "disconnected" : "connecting";
  return NextResponse.json({ status: finalStatus, qrcode: qr?.qrcode ?? null });
}

// POST /api/panel/whatsapp -> force reconnect / refresh QR
export async function POST() {
  const negocio = await getCurrentNegocio();
  if (!negocio) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const instanceName = `neg_${negocio.id}`;

  // Try to get QR from existing instance first (fastest path)
  const existingStatus = await getInstanceStatus(instanceName);
  if (existingStatus !== "not_found" && existingStatus !== "close" && existingStatus !== "open") {
    const existingQr = await getQrCode(instanceName);
    if (existingQr?.qrcode) {
      return NextResponse.json({ qrcode: existingQr.qrcode });
    }
  }

  // If no valid QR from existing instance, force delete + recreate
  const qr = await freshQr(instanceName, negocio.id);
  if (!qr) {
    console.error("[whatsapp POST] no QR after fresh create for", instanceName);
    return NextResponse.json({ qrcode: null, error: "no_qr" }, { status: 200 });
  }
  return NextResponse.json({ qrcode: qr });
}

// DELETE /api/panel/whatsapp -> disconnect instance
export async function DELETE() {
  const negocio = await getCurrentNegocio();
  if (!negocio) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const instanceName = `neg_${negocio.id}`;
  await deleteInstance(instanceName).catch(() => null);
  return NextResponse.json({ ok: true });
}
