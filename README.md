![Agendalix Landing](https://raw.githubusercontent.com/marcosdeaza/agendalix-backend-core/main/.github/assets/screenshot-landing.webp)
![Agendalix Panel](https://raw.githubusercontent.com/marcosdeaza/agendalix-backend-core/main/.github/assets/screenshot-panel.webp)

# agendalix-backend-core

**Production backend for [agendalix.com](https://agendalix.com)**  
*Automated scheduling, WhatsApp communication, and subscription billing for service businesses.*

---

## What It Does

Agendalix is a Next.js application that handles the entire lifecycle of a service-business appointment:

1. **Discovery** — Customer visits the landing page and sees real-time availability.
2. **Booking** — Customer books via WhatsApp or web form. The system parses intent, checks conflicts, and commits the slot to a PostgreSQL database (Supabase).
3. **Confirmation** — Automated WhatsApp message sent immediately after booking.
4. **Reminders** — Cron jobs fire at 24 hours and 2 hours before the appointment.
5. **Payment** — Stripe checkout for paid plans or deposits. Self-service portal for plan upgrades.
6. **Recovery** — Failed payments and no-shows trigger follow-up WhatsApp sequences.

The business owner manages everything from a single panel: schedule, clients, staff, conversations, and analytics.

---

## How It Runs

The application is containerized and runs on a Contabo VPS:

- **Next.js** handles the frontend, API routes, and cron jobs in a single process.
- **Supabase** provides PostgreSQL, Row Level Security, authentication, and realtime subscriptions.
- **Evolution API** connects the app to WhatsApp Business for inbound and outbound messaging.
- **DeepSeek** parses natural-language booking intent from WhatsApp messages.
- **Nginx** sits in front with TLS 1.3 termination. The container only binds to `127.0.0.1:3010`.

The `docker-compose.yml` enforces memory limits (512MB max, 256MB reserved) and explicit DNS resolvers to avoid cold-start lookup failures.

---

## Environment Variables

Copy `.env.example` to `.env.local` and set at minimum:

```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
EVOLUTION_API_URL
EVOLUTION_API_KEY
DEEPSEEK_API_KEY
RESEND_API_KEY
ADMIN_JWT_SECRET
CRON_SECRET
```

Create the `data/` directory before first run — it persists the admin TOTP secret across redeploys.

---

## Directory Overview

- `src/app/` — Next.js App Router. Marketing pages, panel dashboard, admin shell, API routes, cron handlers.
- `src/components/` — React components: scheduling UI, admin tables, marketing sections, WhatsApp connect widget.
- `src/lib/` — Business logic: Supabase clients (admin/server/browser), Stripe wrapper, WhatsApp API wrapper, cron orchestrator, DeepSeek agent prompts.
- `supabase/schema.sql` — Full database DDL with Row Level Security policies.
- `nginx.conf` — Nginx site configuration for TLS termination and proxying.
- `docker-compose.yml` — Container spec with healthchecks, memory limits, and log rotation.

---

## Security Checklist

- Container port bound to `127.0.0.1` only. No direct external access.
- TLS 1.3 enforced by Nginx. HSTS max-age: 2 years.
- Headers: X-Content-Type-Options nosniff, X-Frame-Options SAMEORIGIN, Referrer-Policy, Permissions-Policy.
- Database: Supabase RLS policies on every table. Service role key never sent to frontend.
- Auth: Supabase Auth for users; custom TOTP MFA for admin dashboard.
- Rate limiting: custom middleware on API routes; Zod validation on all public endpoints.
- Static assets: Next.js `_next/static` chunks cached with `immutable` headers.

---

## Quick Start

```bash
cp .env.example .env.local
mkdir -p data

docker compose up -d --build

# Nginx (run once on the host)
cp nginx.conf /etc/nginx/sites-available/agendalix
ln -s /etc/nginx/sites-available/agendalix /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

---

## License

MIT License — see [LICENSE](LICENSE)
