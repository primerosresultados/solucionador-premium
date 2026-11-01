#!/bin/bash
# Para recorrerlo a mano sin claves reales: Flow y Claude falsos, app en :3091.
set -u
cd "$(dirname "$0")/.."
set -a; . ./.env.qa; set +a
node scripts/servidores-falsos.mjs & F=$!
npx next start -p 3091 & A=$!
trap 'kill $F $A 2>/dev/null' EXIT
wait
