# Decisiones

- **Next 16 + Drizzle + Postgres + jose, sin Supabase.** Es el stack de `woob`. Login propio con cookie httpOnly.
- **Pago por caso con créditos.** Gratis hasta ver problema y causa: la persona prueba el valor antes de pagar. Libro de créditos solo-agregar, con índices únicos que impiden doble acreditación.
- **Flow.** `src/lib/flow.ts` viene de `woob`. A diferencia de woob, el webhook responde 500 si falla, para que Flow reintente y no se pierda un pago.
- **`claude-opus-5-5` con salidas estructuradas y `fallbacks: "default"`.** Modelo configurable en `ANTHROPIC_MODEL`.
- **QA con servidores falsos, sin ramas de simulación en el código.** Se cambia la URL base, corre el código real.
- **El motor de salud es una función pura**, compartida por pantallas, cron y copiloto.
- **Eliminar cuenta anonimiza órdenes** en vez de borrarlas, por obligación contable.
- **Tipografía Geist, una sola familia en peso semibold.** Pedido de Jorge: más formal y moderna. Nunca serif.
- **El usuario elige, no escribe.** Pedido de Jorge: una sola descripción y la IA propone todo. Son 4 pasos de selección y 3 llamadas a la IA en vez de 9 formularios. Título, tipo y urgencia los deduce la IA.
- **Portada y app comparten `.contenedor`**: un solo borde para todo el sitio.
