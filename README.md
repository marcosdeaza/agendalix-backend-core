<p align="center">
  <img src=".github/assets/logo.svg" alt="Agendalix" width="64" />
</p>

<h1 align="center">agendalix-backend-core</h1>

<p align="center">
  <strong>The scheduling engine that turns WhatsApp conversations into confirmed appointments.</strong>
</p>

<p align="center">
  <a href="https://agendalix.com">agendalix.com</a> · 
  <a href="https://github.com/marcosdeaza/agendalix-backend-core/blob/main/LICENSE">MIT License</a>
</p>

---

## What This Is

Agendalix automates the entire booking lifecycle — from first customer message to calendar block, reminder, and payment collection. This repository contains the **backend core** that powers [agendalix.com](https://agendalix.com).

### What It Solves

- **Conversation-to-appointment**: Customers book via WhatsApp; the system parses intent, checks availability, and commits the slot.
- **No-show prevention**: Automated cron reminders at 24h and 2h before each appointment.
- **Revenue recovery**: Failed payments and abandoned carts trigger WhatsApp follow-ups.
- **Multi-tenant dashboard**: Business owners manage schedules, clients, and staff from a single real-time panel.
- **Subscription billing**: Stripe plans (Basic / Pro / Clínica) with self-service portal and webhook sync.

---

## Architecture

```
User → Nginx (443) → Next.js App (3000)
              ↓
         Supabase (PostgreSQL + RLS)
              ↓
         Evolution API (WhatsApp) + DeepSeek (AI)
```

**Stack**

| Layer | Technology |
|-------|-----------|
| App | Next.js 14 (App Router), TypeScript, Tailwind |
| Database | Supabase (PostgreSQL + RLS + realtime) |
| Auth | Supabase Auth + custom TOTP MFA (admin) |
| Payments | Stripe API |
| Email | Resend API |
| AI | DeepSeek API |
| Messaging | Evolution API (WhatsApp Business) |
| Proxy | Nginx with TLS 1.3 |
| Container | Docker (host-only `127.0.0.1:3010` binding) |

---

## Infrastructure

- **Host**: Contabo VPS `164.68.102.55`
- **Container**: `agendalix:latest` bound to `127.0.0.1:3010` (zero external exposure)
- **TLS**: Let's Encrypt; Nginx handles termination; container never sees plaintext
- **DNS**: `agendalix.com` → A record → VPS
- **Persistence**: `./data` bind mount (admin TOTP state survives redeploys)

---

## Security

- Network isolation: container bound to `127.0.0.1`; only Nginx reaches it.
- TLS: Nginx enforces TLS 1.3; HSTS max-age 2 years.
- Headers: X-Content-Type-Options nosniff, X-Frame-Options SAMEORIGIN, Referrer-Policy, Permissions-Policy.
- Database: Supabase RLS on every table; service role key never exposed to frontend.
- Auth: Supabase Auth for users; custom TOTP MFA for admin dashboard.
- Rate limiting: custom middleware on API routes; Zod validation on all public endpoints.
- Static assets: Next.js `_next/static` cached with `immutable` headers for 1 year.

---

## Integrations

| System | Role | Control |
|--------|------|---------|
| Supabase | Database, auth, realtime | URL + anon key via env; RLS policies in schema |
| Stripe | Checkout, portal, webhooks | Live keys via env; webhook signatures verified |
| Evolution API | WhatsApp gateway | Host + API key via env; webhook routes token-secured |
| DeepSeek | AI intent parsing | API key via env; prompt templates in `lib/agent.ts` |
| Resend | Transactional email | Domain-verified `hola@app.agendalix.com`; API key via env |

---

## Getting Started

```bash
cp .env.example .env.local
# Edit .env.local: fill all variables

mkdir -p data

docker compose up -d --build

cp nginx.conf /etc/nginx/sites-available/agendalix
ln -s /etc/nginx/sites-available/agendalix /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

---

## Directory

```
├── src/
│   ├── app/              Landing, panel, admin, API routes, cron
│   ├── components/       Panel UI, admin dashboard, marketing sections
│   └── lib/              Supabase clients, Stripe, WhatsApp, cron, AI agent
├── supabase/
│   └── schema.sql        Full DDL with RLS policies
├── nginx.conf            Nginx site configuration
├── docker-compose.yml    Production container spec
└── .env.example          Required environment variables
```

---

## Philosophy

Time is a finite resource and scheduling is a negotiation problem. The system does not just store appointments; it actively reduces no-shows, recovers lost revenue, and removes friction from the conversation between business and customer.

---

## License

MIT License — see [LICENSE](LICENSE)

**Proprietary deployment — agendalix.com**
