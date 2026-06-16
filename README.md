<p align="center">
  <img src=".github/assets/logo-agendalix.svg" alt="Agendalix Core" width="120" />
</p>

<h1 align="center">agendalix-backend-core</h1>

<p align="center">
  <strong>The scheduling engine that turns WhatsApp conversations into confirmed appointments. Built for service businesses that move fast.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Stripe-008CDD?style=for-the-badge&logo=stripe&logoColor=white" />
  <img src="https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" />
  <img src="https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

---

## ⚡ Flow Engine

Agendalix automates the entire booking lifecycle — from first customer message to calendar block, reminder, and payment collection. It runs as a single Next.js application on a locked-down Docker container, reverse-proxied by Nginx, with Supabase as the single source of truth.

This repository contains the **backend core** that powers [agendalix.com](https://agendalix.com).

### What It Solves

- **Conversation-to-appointment**: Customers book via WhatsApp; the system parses intent, checks availability, and writes the slot to the database.
- **No-show prevention**: Automated reminder cron jobs fire 24h and 2h before each appointment.
- **Revenue recovery**: Failed payments and abandoned carts trigger targeted WhatsApp follow-ups.
- **Multi-tenant dashboard**: Business owners manage schedules, clients, and staff from a single panel with real-time updates.
- **Subscription billing**: Stripe plans (Basic / Pro / Clínica) with self-service portal and webhook-driven entitlement sync.

---

## 🌐 Runtime Map

<p align="center">
  <img src=".github/assets/arch-agendalix.svg" alt="Architecture Diagram" width="800" />
</p>

### Layer Breakdown

| Layer | Technology | Role |
|-------|-----------|------|
| **App** | Next.js 14 (App Router), TypeScript, Tailwind | Landing, dashboard, admin, API routes, cron jobs |
| **Database** | Supabase (PostgreSQL) | RLS policies, realtime subscriptions, auth |
| **Messaging** | Evolution API | WhatsApp Business gateway for inbound/outbound |
| **AI** | DeepSeek API | Natural-language intent parsing and customer support |
| **Proxy** | Nginx | TLS 1.3 termination, host-only container binding |

---

## 🏭 Infrastructure Footprint

| Resource | Spec | Notes |
|----------|------|-------|
| **Host** | Contabo VPS `164.68.102.55` | Shared with other stacks; isolated Docker network |
| **Container** | `agendalix:latest` | Binds to `127.0.0.1:3010` only; zero direct external exposure |
| **TLS** | Let's Encrypt | Nginx handles termination; container never sees unencrypted traffic |
| **DNS** | `agendalix.com` | A record → VPS; Nginx `server_name` match |
| **Persistence** | `./data` bind mount | Stores `admin.json` (bcrypt + TOTP secret) across redeploys |

---

## 🛡️ Perimeter Defense

- **Network isolation**: Container port bound to `127.0.0.1`; only Nginx can reach it.
- **TLS**: Nginx enforces TLS 1.3 with modern cipher suites; HSTS max-age 2 years.
- **Headers**: X-Content-Type-Options nosniff, X-Frame-Options SAMEORIGIN, Referrer-Policy, Permissions-Policy.
- **Database**: Supabase RLS policies on every table; service role key never exposed to frontend.
- **Auth**: Supabase Auth for end users; custom TOTP MFA for admin dashboard.
- **Rate limiting**: Custom middleware on API routes; Zod validation on all public endpoints.
- **Static assets**: Next.js `_next/static` chunks cached with `immutable` headers for 1 year.

---

## 🔌 Wire Protocols

| System | Role | How It Is Controlled |
|--------|------|----------------------|
| **Supabase** | Database, auth, realtime | URL and anon key via env; RLS policies defined in schema |
| **Stripe** | Checkout, portal, webhooks | Live keys via env; webhook endpoint verifies signatures |
| **Evolution API** | WhatsApp Business gateway | Host and API key via env; webhook routes secured by verify token |
| **DeepSeek** | AI intent parsing | API key via env; prompt templates in `lib/agent.ts` |
| **Resend** | Transactional email | Domain-verified `hola@app.agendalix.com`; API key via env |

---

## 🚀 Ignition

```bash
# 1. Environment
cp .env.example .env.local
# Edit .env.local: fill all variables

# 2. Data directory
mkdir -p data

# 3. Launch
docker compose up -d --build

# 4. Nginx
cp nginx.conf /etc/nginx/sites-available/agendalix
ln -s /etc/nginx/sites-available/agendalix /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

---

## 🗺️ Directory Map

```
├── src/
│   ├── app/
│   │   ├── (marketing)/      # Landing, pricing, registration
│   │   ├── panel/            # Business dashboard (agenda, clients, settings)
│   │   ├── admin/            # Super-admin shell (metrics, comms, support)
│   │   └── api/              # Route handlers (auth, cron, stripe, whatsapp)
│   ├── components/
│   │   ├── panel/            # Scheduling UI components
│   │   ├── admin/            # Admin dashboard components
│   │   └── sections/         # Marketing page sections
│   └── lib/
│       ├── supabase/         # Client, server, and admin clients
│       ├── stripe.ts         # Stripe SDK initialization
│       ├── whatsapp.ts       # Evolution API wrappers
│       ├── cron.ts           # Cron job orchestration
│       └── agent.ts          # DeepSeek AI prompt assembly
├── supabase/
│   └── schema.sql            # Full DDL with RLS policies
├── nginx.conf                # Nginx site configuration
├── docker-compose.yml        # Production container spec
└── .env.example              # Required environment variables
```

---

## 🎯 Philosophy

Agendalix treats **time as a finite resource** and **scheduling as a negotiation problem**. The system does not just store appointments; it actively reduces no-shows, recovers lost revenue, and removes friction from the conversation between business and customer.

---

## 📜 License

MIT License — see [LICENSE](LICENSE)

**Proprietary deployment — agendalix.com**
