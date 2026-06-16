import { Resend } from "resend";

let cached: Resend | null = null;

function client() {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured");
  cached = new Resend(key);
  return cached;
}

const FROM = () => process.env.RESEND_FROM || "Agendalix <hola@app.agendalix.com>";

function shell(heading: string, body: string, cta?: { href: string; label: string }) {
  const ctaBlock = cta
    ? `<p style="margin:28px 0 0"><a href="${cta.href}" style="background:#2E8F66;color:#ffffff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:500;display:inline-block">${cta.label}</a></p>`
    : "";
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Inter,system-ui,-apple-system,sans-serif;color:#ededed">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a">
    <tr><td align="center" style="padding:36px 20px">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#111111;border:0.5px solid #1e1e1e;border-radius:14px;padding:36px">
        <tr><td style="padding-bottom:20px">
          <div style="display:inline-block;font-weight:600;letter-spacing:-0.01em;font-size:18px;color:#ffffff">Agendalix</div>
        </td></tr>
        <tr><td>
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:500;color:#ffffff">${heading}</h1>
          <div style="font-size:15px;line-height:1.7;color:#cfcfcf">${body}</div>
          ${ctaBlock}
        </td></tr>
        <tr><td style="padding-top:32px;border-top:0.5px solid #1e1e1e;margin-top:28px">
          <p style="margin:20px 0 0;font-size:12px;color:#555">Agendalix · Automatiza tu negocio con IA<br>Si no has solicitado este correo, puedes ignorarlo.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function sendWelcomeEmail(opts: {
  to: string;
  nombre: string;
  negocioNombre: string;
  magicLink: string;
}) {
  const html = shell(
    `¡Bienvenido a Agendalix, ${escapeHtml(opts.nombre)}!`,
    `<p>Hemos creado tu cuenta para <strong>${escapeHtml(opts.negocioNombre)}\
</strong>. Tienes 30 días de prueba gratis — sin tarjeta.</p>\
<p>Accede a tu panel con el siguiente enlace (válido durante 24 horas; después podrás pedir uno nuevo desde la página de acceso):</p>`,
    { href: opts.magicLink, label: "Acceder a mi panel" },
  );
  await client().emails.send({
    from: FROM(),
    to: opts.to,
    subject: "Tu cuenta de Agendalix está lista",
    html,
  });
}

export async function sendMagicLinkEmail(opts: {
  to: string;
  magicLink: string;
}) {
  const html = shell(
    "Tu enlace de acceso",
    `<p>Haz clic en el botón para acceder a tu panel. El enlace es válido durante 15 minutos y solo se puede usar una vez.</p>`,
    { href: opts.magicLink, label: "Entrar al panel" },
  );
  await client().emails.send({
    from: FROM(),
    to: opts.to,
    subject: "Tu acceso a Agendalix",
    html,
  });
}

export async function sendPaymentFailedEmail(opts: { to: string; nombre: string }) {
  const html = shell(
    "Hay un problema con tu pago",
    `<p>Hola ${escapeHtml(opts.nombre)},</p>\
<p>No hemos podido cobrar tu última factura. Actualiza tu método de pago desde el portal de facturación para mantener tu servicio activo.</p>`,
    { href: `${process.env.APP_URL || "https://agendalix.com"}/panel`, label: "Abrir mi panel" },
  );
  await client().emails.send({
    from: FROM(),
    to: opts.to,
    subject: "Acción necesaria: tu pago no se ha completado",
    html,
  });
}

export async function sendAdminBroadcast(opts: {
  to: string[];
  subject: string;
  html: string;
}) {
  if (opts.to.length === 0) return;
  await client().emails.send({
    from: FROM(),
    to: opts.to,
    subject: opts.subject,
    html: shell(escapeHtml(opts.subject), opts.html),
  });
}

export async function sendExcelReport(opts: {
  to: string;
  nombreNegocio: string;
  xlsx: Buffer;
  periodo: string;
  filename: string;
}) {
  const html = shell(
    `Tu resumen semanal, ${escapeHtml(opts.nombreNegocio)}`,
    `<p>Adjuntamos el informe en Excel con los datos de tu negocio durante el periodo <strong>${escapeHtml(opts.periodo)}</strong>.</p>`,
  );
  await client().emails.send({
    from: FROM(),
    to: opts.to,
    subject: "Tu resumen semanal de Agendalix",
    html,
    attachments: [
      {
        filename: opts.filename,
        content: opts.xlsx,
      },
    ],
  });
}

export async function sendPendingApprovalEmail(opts: { to: string; nombre: string }) {
  const html = shell(
    `¡Gracias por unirte a Agendalix, ${escapeHtml(opts.nombre)}!`,
    `<p>Hemos recibido tu solicitud de acceso. Nuestro equipo la revisará en menos de 24 horas.</p><p>Cuando sea aprobada, recibirás un email con tu enlace de acceso al panel.</p><p>Si tienes alguna duda, escríbenos a <a href="mailto:contacto@agendalix.com" style="color:#2E8F66">contacto@agendalix.com</a>.</p>`,
  );
  await client().emails.send({
    from: FROM(),
    to: opts.to,
    subject: "Solicitud recibida — Agendalix",
    html,
  });
}

export async function sendAdminNewUserEmail(opts: {
  email: string;
  nombre: string;
  negocioId: string;
  adminPanelUrl: string;
}) {
  const html = shell(
    "Nuevo negocio registrado",
    `<p><strong>${escapeHtml(opts.nombre)}</strong> (${escapeHtml(opts.email)}) acaba de darse de alta y su prueba de 30 días ya está activa.</p><p>No necesita aprobación — esto es solo para que estéis al tanto.</p>`,
    { href: opts.adminPanelUrl, label: "Ver negocios" },
  );
  await client().emails.send({
    from: FROM(),
    to: [process.env.ADMIN_NOTIFICATION_EMAIL ?? "agendalixteam@gmail.com"],
    subject: `Nuevo registro: ${opts.nombre} (${opts.email})`,
    html,
  });
}

export async function sendApprovedEmail(opts: { to: string; nombre: string; magicLink: string }) {
  const html = shell(
    `¡Tu cuenta ha sido aprobada, ${escapeHtml(opts.nombre)}!`,
    `<p>El equipo de Agendalix ha revisado tu solicitud y <strong>has sido aprobado</strong>. Ya puedes acceder a tu panel y empezar a configurar tu agente de WhatsApp.</p>`,
    { href: opts.magicLink, label: "Acceder a mi panel" },
  );
  await client().emails.send({
    from: FROM(),
    to: opts.to,
    subject: "Tu cuenta de Agendalix ha sido aprobada",
    html,
  });
}

export async function sendTrialWarningEmail(opts: {
  to: string;
  nombre: string;
  diasRestantes: number;
}) {
  const dias = opts.diasRestantes === 1 ? "1 día" : `${opts.diasRestantes} días`;
  const html = shell(
    `Tu prueba gratuita termina en ${dias}`,
    `<p>Hola ${escapeHtml(opts.nombre)},</p>\
<p>Tu periodo de prueba de Agendalix termina en <strong>${dias}</strong>. Para que tu asistente siga atendiendo WhatsApp, reservando citas y enviando recordatorios sin interrupción, elige tu plan desde el panel.</p>\
<p>Tardas menos de 2 minutos y puedes cancelar cuando quieras.</p>`,
    { href: `${process.env.APP_URL || "https://agendalix.com"}/panel/plan`, label: "Elegir mi plan" },
  );
  await client().emails.send({
    from: FROM(),
    to: opts.to,
    subject: `Tu prueba de Agendalix termina en ${dias}`,
    html,
  });
}

export async function sendTrialEndedEmail(opts: { to: string; nombre: string }) {
  const html = shell(
    "Tu prueba gratuita ha terminado",
    `<p>Hola ${escapeHtml(opts.nombre)},</p>\
<p>Tus 30 días de prueba han llegado a su fin y tu asistente se ha puesto en pausa: tus datos, citas y conversaciones siguen guardados, pero el agente ha dejado de responder a tus clientes.</p>\
<p>Reactívalo en 2 minutos eligiendo un plan — todo seguirá exactamente donde lo dejaste.</p>`,
    { href: `${process.env.APP_URL || "https://agendalix.com"}/panel/plan`, label: "Reactivar mi asistente" },
  );
  await client().emails.send({
    from: FROM(),
    to: opts.to,
    subject: "Tu asistente está en pausa — reactívalo en 2 minutos",
    html,
  });
}

export async function sendSupportNewMessageEmail(opts: {
  negocioNombre: string;
  negocioEmail: string;
  texto: string;
}) {
  const html = shell(
    "Nuevo mensaje de soporte",
    `<p><strong>${escapeHtml(opts.negocioNombre)}</strong> (${escapeHtml(opts.negocioEmail)}) ha escrito en el soporte de la plataforma:</p>\
<blockquote style="margin:16px 0;padding:12px 16px;background:#1a1a1a;border-left:3px solid #2E8F66;border-radius:6px">${escapeHtml(opts.texto)}</blockquote>`,
    { href: `${process.env.APP_URL || "https://agendalix.com"}/admin/soporte`, label: "Responder desde el admin" },
  );
  await client().emails.send({
    from: FROM(),
    to: [process.env.ADMIN_NOTIFICATION_EMAIL ?? "agendalixteam@gmail.com"],
    subject: `Soporte: ${opts.negocioNombre}`,
    html,
  });
}

export async function sendSupportReplyEmail(opts: {
  to: string;
  nombre: string;
  texto: string;
}) {
  const html = shell(
    "Te hemos respondido en soporte",
    `<p>Hola ${escapeHtml(opts.nombre)},</p>\
<p>El equipo de Agendalix ha respondido a tu consulta:</p>\
<blockquote style="margin:16px 0;padding:12px 16px;background:#1a1a1a;border-left:3px solid #2E8F66;border-radius:6px">${escapeHtml(opts.texto)}</blockquote>\
<p>Puedes continuar la conversación desde tu panel.</p>`,
    { href: `${process.env.APP_URL || "https://agendalix.com"}/panel/soporte`, label: "Ver respuesta" },
  );
  await client().emails.send({
    from: FROM(),
    to: opts.to,
    subject: "Respuesta de soporte — Agendalix",
    html,
  });
}

export function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
