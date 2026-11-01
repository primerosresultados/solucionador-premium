// Prueba cada tarea del copiloto contra la API real. Gasta tokens: unos pocos centavos de dólar.
// Uso: ANTHROPIC_API_KEY=... npm run probar:claude
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { SISTEMA, TAREAS, type TareaId } from "../src/lib/ia/tareas";

const CASO = `Lo que cuenta la persona: tengo una cafetería, vendo bien pero a fin de mes no me queda plata.
Definición elegida: no sé cuánto gano por producto y mezclo mi plata con la del negocio.
Causas: retiros personales sin registro (hecho, CAUSA RAÍZ).
Opción elegida: fijarme un sueldo y separar las cuentas.
Meta: margen mensual (%) de 6 a 18 para el 2027-02-01
Pasos:
1. [A] Abrir cuenta del negocio: bloqueado, vence 2026-11-05, bloqueo: falta el inicio de actividades
Hoy es ${new Date().toISOString().slice(0, 10)}`;

const cliente = new Anthropic();
let fallas = 0, entrada = 0, salida = 0;
for (const tarea of Object.keys(TAREAS) as TareaId[]) {
  const def = TAREAS[tarea];
  const inicio = Date.now();
  try {
    const r = await cliente.beta.messages.parse({
      model: process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      system: [{ type: "text", text: SISTEMA, cache_control: { type: "ephemeral" } }],
      output_config: { effort: def.esfuerzo, format: betaZodOutputFormat(def.esquema) },
      messages: [{ role: "user", content: `<caso>\n${CASO}\n</caso>\n\n<tarea>${tarea}</tarea>\n${def.instruccion}` }],
    });
    if (!r.parsed_output) throw new Error(`sin salida (${r.stop_reason})`);
    entrada += r.usage.input_tokens; salida += r.usage.output_tokens;
    console.log(`✓ ${tarea} ${((Date.now() - inicio) / 1000).toFixed(1)}s ${r.usage.input_tokens}/${r.usage.output_tokens}`);
    if (process.env.VER) console.log(JSON.stringify(r.parsed_output, null, 2));
  } catch (e) {
    fallas++;
    console.error(`✗ ${tarea}:`, e instanceof Error ? e.message : e);
  }
}
console.log(`\n${fallas} fallas. Tokens: ${entrada} entrada, ${salida} salida. US$${(entrada * 4e-6 + salida * 20e-6).toFixed(3)}`);
process.exit(fallas ? 1 : 0);
