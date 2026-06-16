# ESTADO.md — Agendalix · Traspaso de contexto (2026-06-10)

Documento para retomar el trabajo (otra IA o desarrollador) sin contexto previo.

## Qué es
SaaS multi-tenant: agente IA que atiende el WhatsApp de negocios locales (peluquerías, clínicas…),
reserva citas, envía recordatorios y recupera clientes. Modelo: trial 30 días gratis sin tarjeta →
suscripción Stripe (Básico 39€ / Pro 79€ / Clínica 129€).

## Infra
- VPS 164.68.102.55 (root). App SOLO en Docker. Fuente: `/var/www/agendalix`.
- Deploy: `cd /var/www/agendalix && docker compose build && docker compose up -d` (puerto 127.0.0.1:3010, nginx del host hace TLS para agendalix.com).
- Stack: Next.js 14 App Router + TS + Tailwind + Supabase (dgkmnpgglxniguvefwpg) + Stripe live + Resend + Evolution API (contenedor `evolution-api`, WhatsApp vía Baileys/QR) + DeepSeek.
- Backups: `/var/www/agendalix-BACKUP-pre-claude-20260610.tar.gz` (estado original) · imágenes `agendalix:backup-pre-claude-20260610` (original) y `agendalix:v2-saas-20260610` (fase 2).
- Crontab del host (4 entradas agendalix): recordatorios cada 30min · trial diario 9:15 · excel lunes 9:00 · recuperación diario 10:00. Auth: `Authorization: Bearer cron_agendalix_2024_secure`.

## Hecho el 2026-06-10 (sesión Claude)
1. **Rediseño completo** landing/registro/login: tema claro "papel" (#FAF7F0) + verde #1E6B4F + ámbar #D9912B + serif Fraunces. Tokens Tailwind nuevos: `paper/inkl/brand/ambar/linel`. El panel sigue oscuro con acento verde (#2E8F66, token `purple` re-apuntado). Secciones nuevas: HowItWorks, FAQ. Demo con estética WhatsApp real.
2. **Bugs corregidos**: verificación `x-evo-secret` en webhook WhatsApp (401 sin secreto), dedup de messageId, rate-limit en /api/registro y magic-link, timezone del negocio en citasHoy, lista de espera con agenda real, CTAs → /registro (antes iban a un wa.me UK).
3. **SaaS autónomo**: alta instantánea (sin aprobación; welcome email con magic link 24h), `trial_ends_at = +30 días` explícito en el alta, cron `/api/cron/trial` (avisos 7d/1d + pausa al expirar; idempotente vía tabla `email_log` con scope `trial-*:<negocio_id>`), paywall `/panel/plan` (PlanSelector → /api/stripe/checkout y /api/stripe/portal para gestionar/cancelar), redirect en `src/app/panel/layout.tsx` si `isTrialExpired()` (`src/lib/trial.ts`), onboarding wizard primer login (`components/panel/Onboarding.tsx`, flag `negocios.onboarding_completo`), soporte integrado panel↔admin (hilo en `conversaciones` con `cliente_telefono='__soporte__'`, ver `src/lib/soporte.ts`; APIs `/api/panel/soporte` y `/api/admin/soporte`; UI `panel/soporte` y `admin/soporte`; emails de aviso en ambos sentidos).
4. **Marca v3** ("la firma del check"): trazo manuscrito — bucle de "a" cursiva ámbar + check verde. `src/components/Logo.tsx` (variants mark/compact/full, tone dark/light, animate). Favicon/icon SVG regenerados.

## ⚠️ PENDIENTE CRÍTICO (en orden)
1. **STRIPE_WEBHOOK_SECRET**: en `/var/www/agendalix/.env.local` hay un `we_...` (ID de endpoint). Hace falta el signing secret `whsec_...` (Stripe Dashboard → Developers → Webhooks → endpoint `https://agendalix.com/api/stripe/webhook` → Reveal signing secret). Sin esto los pagos NO activan la suscripción. Tras cambiarlo: `docker restart agendalix`. Verificar evento `checkout.session.completed` con un pago de prueba.
2. **PNGs/ICO de iconos**: `public/favicon.ico`, `apple-touch-icon.png`, `icon-192/512.png`, `og-image.png` siguen con el diseño viejo (morado). Regenerar desde `public/favicon.svg` (logo nuevo). El SVG ya está referenciado en layout.tsx y es lo que muestran los navegadores modernos.
3. **DDL pendiente en Supabase SQL Editor** (opcional pero recomendado): `ALTER TABLE negocios ALTER COLUMN trial_ends_at SET DEFAULT now() + interval '30 days';` (el código ya lo fija explícitamente en el alta, esto es solo coherencia).
4. **Límite "50 citas/mes" del trial** se anuncia en plan-features.ts pero no se aplica en ningún sitio (decidir si implementarlo).
5. Negocio legacy "Peluqueria Noelia" en status PENDING (email desechable, parece test) — borrar o aprobar desde /admin.
6. La cuenta "HairStyle" (test) conserva trial de 60 días (alta anterior al cambio).

## Cómo verificar rápido
- `curl -s http://127.0.0.1:3010/` → 200 con "Tus citas se reservan"
- Webhook: POST a `/api/whatsapp/webhook` sin header → 401; con `x-evo-secret: <EVOLUTION_WEBHOOK_SECRET del .env.local>` → 200
- Cron trial: `curl -H "Authorization: Bearer cron_agendalix_2024_secure" http://127.0.0.1:3010/api/cron/trial` → JSON con contadores
- Registro E2E: POST `/api/registro` (ver payload en src) → `{ok:true,active:true}`; limpiar el negocio + auth user de prueba después.

## Decisiones de diseño que NO romper
- Cero DDL: todo lo nuevo reutiliza tablas existentes (email_log para idempotencia, conversaciones para soporte).
- El hilo de soporte se excluye de las conversaciones de WhatsApp en `getConversaciones` (filtro `neq cliente_telefono '__soporte__'`).
- `intervenida: true` en el hilo de soporte → el agente IA jamás responde ahí.
- Token Tailwind `purple` = verde de marca (alias histórico, lo usa todo el panel).
- Copia local de trabajo del código: `C:\Users\dazas\Desktop\agendalix-work\agendalix` (Windows del CEO).
