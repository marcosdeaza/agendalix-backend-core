# agendalix-backend-core

Automated B2B scheduling engine. Next.js application handling appointment booking, real-time WhatsApp communication, and subscription billing.

## System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Nginx (443)   │────▶│  Next.js (3000) │────▶│   Supabase      │
│  Reverse Proxy  │     │   App Router    │     │  PostgreSQL     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Evolution API  │     │    DeepSeek     │
│  (WhatsApp)     │     │   (AI Agent)    │
└─────────────────┘     └─────────────────┘
```

- **Frontend / API**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **AI**: DeepSeek API ( conversational agent for customer support)
- **Messaging**: Evolution API (WhatsApp Business integration)
- **Reverse Proxy**: Nginx with TLS 1.2/1.3, HSTS, strict CSP headers

## Infrastructure

- **Host**: Contabo VPS (164.68.102.55)
- **Deployment**: Docker container bound to `127.0.0.1:3010`; Nginx proxies from 443
- **TLS**: Let's Encrypt; automatic HTTP→HTTPS redirect
- **Domain**: agendalix.com

## Security Protocols Implemented

- Container exposed only on localhost (no direct external port access)
- Nginx reverse proxy with TLS 1.3 and modern cipher suite
- Security headers: HSTS (2-year max-age), X-Content-Type-Options nosniff, X-Frame-Options SAMEORIGIN, Permissions-Policy
- Gzip compression with `gzip_min_length 1024`
- Next.js static chunks cached with immutable headers
- Supabase RLS policies enforced on all tables
- Admin dashboard protected by TOTP MFA
- Rate limiting via custom middleware on API routes
- Input validation via Zod schemas on all public endpoints

## Integrations

- **Database**: Supabase (PostgreSQL + realtime subscriptions)
- **Payments**: Stripe (checkout, customer portal, webhook handling)
- **Email**: Resend API (transactional emails from hola@app.agendalix.com)
- **AI**: DeepSeek API (agent-based customer support)
- **Messaging**: Evolution API (WhatsApp Business) + 360dialog legacy webhook
- **Cron**: Vercel-style cron routes for reminders, recoveries, and trial management

## Environment Setup

1. Copy `.env.example` to `.env.local` and fill in all values.
2. Ensure `data/` directory exists for persistent admin TOTP state (`mkdir -p data`).
3. Run `docker compose up -d --build` to start the container.
4. Configure Nginx site config (see `nginx.conf`) and reload.

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| App         | Next.js 14, TypeScript, Tailwind    |
| Database    | Supabase (PostgreSQL + RLS)         |
| Auth        | Supabase Auth + custom TOTP admin   |
| Payments    | Stripe API                          |
| Email       | Resend API                          |
| AI          | DeepSeek API                        |
| Messaging   | Evolution API (WhatsApp)            |
| Proxy       | Nginx with TLS 1.3                  |
| Container   | Docker (host-only port binding)     |

## Directory Structure

```
├── src/
│   ├── app/           Next.js App Router (pages + API routes)
│   ├── components/    React components (admin, panel, marketing)
│   └── lib/           Utilities (auth, stripe, supabase, whatsapp, cron)
├── data/              Persistent admin TOTP state
├── logs/              Application logs
├── supabase/          Database schema
├── nginx.conf         Nginx site configuration
├── docker-compose.yml Production orchestration
└── .env.example       Required environment variables
```

## License

Proprietary — agendalix.com
