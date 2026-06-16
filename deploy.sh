#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Agendalix · Deploy script (Docker)
# Uso (en el VPS):  ./deploy.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")"

echo "▸ Pulling latest changes..."
git pull origin main

echo "▸ Asegurando .env.local..."
if [[ ! -f .env.local ]]; then
  echo "  ✗ Falta .env.local — copia .env.example y rellénalo antes de continuar."
  exit 1
fi

mkdir -p logs

echo "▸ Reconstruyendo imagen Docker..."
docker compose build --pull

echo "▸ Reiniciando contenedor..."
docker compose up -d

echo "▸ Limpiando imágenes huérfanas..."
docker image prune -f >/dev/null

echo "✓ Deploy completo — Agendalix está corriendo en el contenedor 'agendalix'."
docker compose ps
