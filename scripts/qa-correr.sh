#!/bin/bash
# Base limpia, servidores falsos, app en :3091 y recorrido completo.
set -u
cd "$(dirname "$0")/.."
psql -q -d postgres -c 'drop database if exists solucionador_qa' -c 'create database solucionador_qa'
ENV_FILE=.env.qa npx tsx scripts/migrar.ts >/dev/null
set -a; . ./.env.qa; set +a
node scripts/servidores-falsos.mjs & F=$!
PORT=3091 npx next start -p 3091 > /tmp/solucionador-app.log 2>&1 & A=$!
trap 'kill $F $A 2>/dev/null' EXIT
for i in $(seq 1 40); do curl -sf -o /dev/null localhost:3091 && break; sleep .25; done
PLAYWRIGHT="${PLAYWRIGHT:-$HOME/Desktop/Claude/InmoPilot-hoy/node_modules/playwright}" node scripts/qa.mjs
