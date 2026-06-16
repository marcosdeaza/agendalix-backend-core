# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────
# Agendalix · multi-stage build for production
#   • deps   → install with cache
#   • build  → next build (standalone)
#   • runner → distroless-style alpine, non-root, ~150 MB
# ─────────────────────────────────────────────────────────────

ARG NODE_VERSION=20.18.0

FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_ vars must be baked in at build time (client bundle)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root user (matches Next.js docs). `--ingroup nodejs` is important so
# the process can read bind-mounted files that are group-owned by gid 1001
# (otherwise `--system` puts the user in `nogroup`).
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 --ingroup nodejs nextjs

# Copy standalone server + static + public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public          ./public

# /app/.env.local lives on a bind-mount (see docker-compose.yml).
# Make sure /app is writable so the runtime can persist TOTP_SECRET
# back into .env.local from /mail/setup.
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q -O- http://127.0.0.1:3000/ > /dev/null || exit 1

CMD ["node", "server.js"]
