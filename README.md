# agendalix-backend-core

> **The scheduling engine that turns WhatsApp conversations into confirmed appointments. Built for service businesses that move fast.**

Agendalix automates the entire booking lifecycle — from first customer message to calendar block, reminder, and payment collection. It runs as a single Next.js application on a locked-down Docker container, reverse-proxied by Nginx, with Supabase as the single source of truth.

This repository contains the **backend core** that powers [agendalix.com](https://agendalix.com).

---

## What It Solves

- **Conversation-to-appointment**: Customers book via WhatsApp; the system parses intent, checks availability, and writes the slot to the database.
- **No-show prevention**: Automated reminder cron jobs fire 24h and 2h before each appointment.
- **Revenue recovery**: Failed payments and abandoned carts trigger targeted WhatsApp follow-ups.
- **Multi-tenant dashboard**: Business owners manage schedules, clients, and staff from a single panel with real-time updates.
- **Subscription billing**: Stripe plans (Basic / Pro / Clínica) with self-service portal and webhook-driven entitlement sync.

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                        Nginx (443/80)                       │
│        TLS 1.3 · HSTS · gzip · immutable cache headers      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js App (3000)                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ │
│  │ Landing │ │  Panel  │ │  Admin  │ │   API   │ │  Cron  │ │
│  │  pages  │ │  pages  │ │  pages  │ │ routes  │ │ routes │ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └────────┘ │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌──────────────┐     ┌────────────────┐
│   Supabase   │     │  Evolution API │
│ PostgreSQL   │     │  (WhatsApp)    │
│ + RLS        │     │                │
│ + Realtime   │     │  DeepSeek      │
│              │     │  (AI agent)    │
└──────────────┘     └────────────────┘
```

- **App layer**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS) and realtime subscriptions
- **Messaging**: Evolution API (WhatsApp Business) for inbound/outbound conversational flow
- **AI**: DeepSeek API for natural-language intent parsing and customer support
- **Reverse proxy**: Nginx with TLS 1.3, host-only Docker binding, and strict security headers

---

## Infrastructure Footprint

| Resource | Spec | Notes |
|----------|------|-------|
| Host | Contabo VPS `164.68.102.55` | Shared with other stacks; Agendalix runs isolated on its own Docker network |
| Container | `agendalix:latest` | Binds to `127.0.0.1:3010` only; zero direct external exposure |
| TLS | Let's Encrypt | Nginx handles termination; container never sees unencrypted traffic |
| DNS | `agendalix.com` | A record → VPS; Nginx server_name match |
| Persistence | `./data` bind mount | Stores `admin.json` (bcrypt + TOTP secret) across redeploys |

---

## Security Protocols

- **Network isolation**: Container port bound to `127.0.0.1`; only Nginx can reach it.
- **TLS**: Nginx enforces TLS 1.3 with modern cipher suites; HSTS max-age 2 years.
- **Headers**: X-Content-Type-Options nosniff, X-Frame-Options SAMEORIGIN, Referrer-Policy, Permissions-Policy.
- **Database**: Supabase RLS policies on every table; service role key never exposed to frontend.
- **Auth**: Supabase Auth for end users; custom TOTP MFA for admin dashboard.
- **Rate limiting**: Custom middleware on API routes; Zod validation on all public endpoints.
- **Static assets**: Next.js `_next/static` chunks cached with `immutable` headers for 1 year.

---

## Integration Surface

| System | Role | How It Is Controlled |
|--------|------|----------------------|
| **Supabase** | Database, auth, realtime | URL and anon key via env; RLS policies defined in schema |
| **Stripe** | Checkout, portal, webhooks | Live keys via env; webhook endpoint verifies signatures |
| **Evolution API** | WhatsApp Business gateway | Host and API key via env; webhook routes secured by verify token |
| **DeepSeek** | AI intent parsing | API key via env; prompt templates in `lib/agent.ts` |
| **Resend** | Transactional email | Domain-verified `hola@app.agendalix.com`; API key via env |

---

## Getting Started

```bash
# 1. Environment
cp .env.example .env.local
# Edit .env.local: fill all variables

# 2. Data directory
mkdir -p data

# 3. Run
docker compose up -d --build

# 4. Nginx
cp nginx.conf /etc/nginx/sites-available/agendalix
ln -s /etc/nginx/sites-available/agendalix /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

---

## Directory Map

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

## Philosophy

Agendalix treats **time as a finite resource** and **scheduling as a negotiation problem**. The system does not just store appointments; it actively reduces no-shows, recovers lost revenue, and removes friction from the conversation between business and customer.

---

**Proprietary — agendalix.com**
