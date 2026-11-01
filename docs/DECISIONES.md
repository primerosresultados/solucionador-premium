# Decisiones

- **Next 16 + Drizzle + Postgres + jose, sin Supabase.** Es el stack de `woob`. Login propio con cookie httpOnly.
- **Pago por caso con créditos.** Etapa 1 gratis con 3 consultas de IA: la persona prueba el valor antes de pagar. Libro de créditos solo-agregar, con índices únicos que impiden doble acreditación.
- **Flow.** `src/lib/flow.ts` viene de `woob`. A diferencia de woob, el webhook responde 500 si falla, para que Flow reintente y no se pierda un pago.
- **`claude-opus-5-5` con salidas estructuradas y `fallbacks: "default"`.** Modelo configurable en `ANTHROPIC_MODEL`.
- **QA con servidores falsos, sin ramas de simulación en el código.** Se cambia la URL base, corre el código real.
- **El motor de salud es una función pura**, compartida por pantallas, cron y copiloto.
- **Eliminar cuenta anonimiza órdenes** en vez de borrarlas, por obligación contable.
- **Tipografía Geist, una sola familia en peso semibold.** Pedido de Jorge: más formal y moderna. Nunca serif.
