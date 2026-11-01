#!/bin/bash
# Para recorrerlo a mano sin claves reales: Flow y Claude falsos, app en :3091.
set -u
cd "$(dirname "$0")/.."
set -a; . ./.env.qa; set +a
# Con túnel: APP_PUBLICO y FLOW_PUBLICO traen las direcciones públicas.
# .env.qa está en el repo: un demo público usa claves nuevas en cada arranque.
if [ -n "${APP_PUBLICO:-}" ]; then
  export APP_URL="$APP_PUBLICO"
  export AUTH_SECRET="$(openssl rand -base64 48)" CRON_SECRET="$(openssl rand -hex 24)" ADMIN_EMAIL=
fi
node scripts/servidores-falsos.mjs & F=$!
npx next start -p 3091 & A=$!
trap 'kill $F $A 2>/dev/null' EXIT
wait
