// Evolution API v2 integration

const EVO_URL = process.env.EVOLUTION_API_URL || "http://evolution-api:8080";
const EVO_KEY = process.env.EVOLUTION_API_KEY || "";

export type WhatsAppIncoming = {
  from: string;
  text: string;
  messageId: string;
  phoneNumberId: string;
  timestamp: number;
  // Full original JID preserved so replies can be routed correctly (e.g. @lid privacy JIDs)
  replyJid?: string;
};

// ─── Evolution API helpers ───────────────────────────────────────────────────

function evoHeaders() {
  return { "Content-Type": "application/json", apikey: EVO_KEY };
}

export async function evoRequest(
  path: string,
  method: "GET" | "POST" | "DELETE" = "GET",
  body?: unknown
): Promise<unknown> {
  const res = await fetch(`${EVO_URL}${path}`, {
    method,
    headers: evoHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Evolution API ${res.status} ${path}: ${err}`);
  }
  return res.json();
}

// ─── Instance management ─────────────────────────────────────────────────────

export async function createInstance(instanceName: string): Promise<{ instance?: { instanceId?: string }; hash?: string } | null> {
  const webhookUrl = (process.env.APP_URL || "https://agendalix.com") + "/api/whatsapp/webhook";
  return evoRequest("/instance/create", "POST", {
    instanceName,
    qrcode: true,
    integration: "WHATSAPP-BAILEYS",
    webhook: {
      enabled: true,
      url: webhookUrl,
      headers: { "x-evo-secret": process.env.EVOLUTION_WEBHOOK_SECRET || "" },
      events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE", "QRCODE_UPDATED"],
    },
  }) as Promise<{ instance?: { instanceId?: string }; hash?: string } | null>;
}

export async function setInstanceWebhook(instanceName: string): Promise<void> {
  const webhookUrl = (process.env.APP_URL || "https://agendalix.com") + "/api/whatsapp/webhook";
  await evoRequest(`/webhook/set/${instanceName}`, "POST", {
    webhook: {
      enabled: true,
      url: webhookUrl,
      headers: { "x-evo-secret": process.env.EVOLUTION_WEBHOOK_SECRET || "" },
      events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE", "QRCODE_UPDATED"],
      webhookByEvents: false,
      webhookBase64: false,
    },
  }).catch(() => null);
}

export async function connectInstance(instanceName: string) {
  return evoRequest(`/instance/connect/${instanceName}`);
}

export async function getInstanceStatus(instanceName: string) {
  try {
    const data = (await evoRequest(`/instance/connectionState/${instanceName}`)) as {
      instance?: { state?: string };
    };
    return data?.instance?.state ?? "unknown";
  } catch {
    return "not_found";
  }
}

export async function deleteInstance(instanceName: string) {
  return evoRequest(`/instance/delete/${instanceName}`, "DELETE");
}

export async function getQrCode(instanceName: string): Promise<{ qrcode?: string } | null> {
  try {
    const data = (await evoRequest(`/instance/connect/${instanceName}`)) as {
      base64?: string;
      code?: string;
    };
    if (data?.base64) return { qrcode: data.base64 };
    console.error("[whatsapp.getQrCode] no base64", JSON.stringify(data).slice(0,300));
    return null;
  } catch (e) {
    console.error("[whatsapp.getQrCode] error", (e as Error).message);
    return null;
  }
}

// ─── Send message ────────────────────────────────────────────────────────────

/**
 * Convierte markdown estándar al formato propio de WhatsApp.
 * El modelo a veces cuela **negrita** o __cursiva__ pese al prompt; WhatsApp
 * solo entiende *negrita* y _cursiva_, así que normalizamos siempre al enviar.
 */
export function toWhatsAppFormat(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, "*_$1_*")
    .replace(/\*\*(.+?)\*\*/g, "*$1*")
    .replace(/__(.+?)__/g, "_$1_")
    .replace(/^#{1,6}\s+(.+)$/gm, "*$1*")
    .replace(/^\s*[•·]\s+/gm, "- ");
}

export async function sendWhatsAppText(to: string, text: string, instanceName?: string) {
  const instance = instanceName ?? process.env.EVOLUTION_DEFAULT_INSTANCE ?? "default";
  return evoRequest(`/message/sendText/${instance}`, "POST", {
    number: to.includes("@") ? to : normalizePhone(to),
    text: toWhatsAppFormat(text),
  });
}

// ─── Webhook parsing (Evolution API format) ──────────────────────────────────

export function parseEvolutionWebhook(body: unknown): WhatsAppIncoming | null {
  if (!body || typeof body !== "object") return null;
  const b = body as {
    event?: string;
    data?: {
      key?: { remoteJid?: string; id?: string; fromMe?: boolean };
      message?: { conversation?: string; extendedTextMessage?: { text?: string } };
      messageTimestamp?: number;
      instanceId?: string;
    };
  };

  if (b.event !== "messages.upsert") return null;
  if (b.data?.key?.fromMe) return null;

  const jid = b.data?.key?.remoteJid ?? "";
  const participant = (b.data?.key as Record<string, unknown>)?.participant as string | undefined;

  let from: string;
  if (jid.endsWith("@lid")) {
    // @lid is a WhatsApp privacy JID used on modern iOS/Android.
    // The real phone may be in the participant field (e.g. "34622437976@s.whatsapp.net").
    if (participant && !participant.endsWith("@lid")) {
      from = participant.split("@")[0];
    } else {
      // participant is absent: use the @lid number itself as the identifier.
      // Evolution API can route outbound replies using the full @lid JID.
      from = jid.split("@")[0];
    }
  } else {
    from = jid.split("@")[0];
  }

  const text =
    b.data?.message?.conversation ??
    b.data?.message?.extendedTextMessage?.text ??
    "";

  if (!from || !text) return null;

  return {
    from,
    text,
    messageId: b.data?.key?.id ?? "",
    phoneNumberId: b.data?.instanceId ?? "",
    timestamp: b.data?.messageTimestamp ?? Math.floor(Date.now() / 1000),
    replyJid: jid,
  };
}

// ─── Legacy Meta webhook parser (kept for backwards compat) ──────────────────

export function parseMetaWebhook(body: unknown): WhatsAppIncoming | null {
  if (!body || typeof body !== "object") return null;
  const b = body as {
    object?: string;
    entry?: Array<{
      changes?: Array<{
        field?: string;
        value?: {
          metadata?: { phone_number_id?: string; display_phone_number?: string };
          messages?: Array<{
            from?: string;
            id?: string;
            timestamp?: string;
            type?: string;
            text?: { body?: string };
          }>;
        };
      }>;
    }>;
  };
  const change = b.entry?.[0]?.changes?.[0]?.value;
  const msg = change?.messages?.[0];
  if (!msg || msg.type !== "text") return null;
  const text = msg.text?.body;
  const from = msg.from;
  const phoneNumberId =
    change?.metadata?.phone_number_id || change?.metadata?.display_phone_number || "";
  if (!text || !from) return null;
  return {
    from,
    text,
    messageId: msg.id ?? "",
    phoneNumberId,
    timestamp: Number(msg.timestamp || Math.floor(Date.now() / 1000)),
  };
}

// ─── Utils ───────────────────────────────────────────────────────────────────

export function normalizePhone(raw: string): string {
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned.slice(1);
  if (cleaned.startsWith("00")) return cleaned.slice(2);
  if (cleaned.length === 9) return "34" + cleaned;
  return cleaned;
}
