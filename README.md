# Solucionador

Producto para resolver un problema real con un método de 10 etapas, copiloto de IA y seguimiento hasta verificar que no volvió. Se paga por caso; la primera etapa es gratis.

**Stack:** Next 16, React 19, TypeScript, Tailwind 4, Drizzle + Postgres, Claude (`@anthropic-ai/sdk`), Flow, Resend, Railway.

## Correr en local

```bash
npm install
cp .env.example .env.local        # completar
npx tsx scripts/migrar.ts
npm run build && PORT=3090 npm start   # next dev da EMFILE en este Mac
```

Sin claves reales: `npm run qa:servidores` levanta Flow y Anthropic falsos en `:4599`, y `.env.qa` apunta a ellos.

## Recorrerlo a mano

`npm run build && npm run demo` y abrir http://localhost:3091. Crea una cuenta; el pago usa un Flow falso y el copiloto da respuestas fijas.

## Verificar

| Comando | Qué hace |
|---|---|
| `npm test` | Motor de salud y reglas del método |
| `npm run qa` | Recorrido completo con Playwright: base limpia, pagos, seguridad, cron, cierre. Capturas en `qa/capturas` |
| `QA_VIDEO=1 npm run qa` | Lo mismo, grabando video en `qa/video` |
| `npm run probar:claude` | Prueba las 11 tareas del copiloto contra la API real. Gasta tokens |

GitHub Actions está apagado: corre esto antes de un PR.

## Publicar en Railway

1. Servicio web con Postgres. Variables de `.env.example`, con `FLOW_ENV=production`.
2. Migra solo al arrancar (`railway.json`).
3. Servicio cron diario que llame `GET /api/cron/seguimiento` con `Authorization: Bearer $CRON_SECRET`, por ejemplo a las 12:00 UTC.
4. Dominio verificado en Resend y `APP_URL` con https.

## Dónde está cada cosa

- `src/lib/metodo.ts`: las etapas y lo que exige cada una.
- `src/lib/salud.ts`: motor de seguimiento, función pura.
- `src/lib/ia/tareas.ts`: las 11 tareas del copiloto con su esquema.
- `src/lib/compras.ts`: Flow y libro de créditos.
- `src/app/app/acciones.ts`: todas las acciones del usuario.
- `docs/`: método, contexto y decisiones.
