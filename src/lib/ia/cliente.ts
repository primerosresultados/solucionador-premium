import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { and, count, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { usosIa } from "@/db/schema";
import { SISTEMA, TAREAS, type Resultado, type TareaId } from "./tareas";

const modelo = () => process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5";

export const LIMITE_GRATIS_POR_CASO = 3;
export const LIMITE_POR_CASO = 80;
export const LIMITE_POR_HORA = 30;

export class ErrorCopiloto extends Error {}

let cliente: Anthropic | null = null;
const anthropic = () => (cliente ??= new Anthropic({ timeout: 120_000, maxRetries: 2 }));

/** Límites de uso: la IA es el único costo variable por cliente. */
export async function verificarCuota(usuarioId: string, casoId: string, desbloqueado: boolean) {
  const [{ n: delCaso }] = await db.select({ n: count() }).from(usosIa)
    .where(and(eq(usosIa.casoId, casoId), eq(usosIa.ok, true)));
  const tope = desbloqueado ? LIMITE_POR_CASO : LIMITE_GRATIS_POR_CASO;
  if (delCaso >= tope)
    throw new ErrorCopiloto(desbloqueado
      ? "Este caso llegó al máximo de consultas al copiloto."
      : "Usaste las consultas gratis de este caso. Desbloquéalo para seguir con el copiloto.");

  const [{ n: enLaHora }] = await db.select({ n: count() }).from(usosIa)
    .where(and(eq(usosIa.usuarioId, usuarioId), gt(usosIa.creadoEn, new Date(Date.now() - 3_600_000))));
  if (enLaHora >= LIMITE_POR_HORA) throw new ErrorCopiloto("Vas muy rápido. Prueba de nuevo en un rato.");
}

export async function consultar<T extends TareaId>(
  tarea: T, contexto: string, pedido: string, quien: { usuarioId: string; casoId: string | null },
): Promise<Resultado<T>> {
  const def = TAREAS[tarea];
  const inicio = Date.now();
  const registrar = (ok: boolean, entrada = 0, salida = 0) =>
    db.insert(usosIa).values({
      ...quien, tarea, modelo: modelo(), ok, tokensEntrada: entrada, tokensSalida: salida, milisegundos: Date.now() - inicio,
    }).catch((e) => console.error("[ia] no se registró el uso", e));

  try {
    const r = await anthropic().beta.messages.parse({
      model: modelo(),
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      system: [{ type: "text", text: SISTEMA, cache_control: { type: "ephemeral" } }],
      output_config: { effort: def.esfuerzo, format: betaZodOutputFormat(def.esquema) },
      messages: [{ role: "user", content: `<caso>\n${contexto}\n</caso>\n\n<tarea>${tarea}</tarea>\n${def.instruccion}\n${pedido}` }],
    });

    if (r.stop_reason === "refusal") {
      await registrar(false, r.usage.input_tokens, r.usage.output_tokens);
      throw new ErrorCopiloto("El copiloto no pudo responder esto. Reformúlalo o sigue por tu cuenta.");
    }
    if (r.stop_reason === "max_tokens" || !r.parsed_output) {
      await registrar(false, r.usage.input_tokens, r.usage.output_tokens);
      throw new ErrorCopiloto("La respuesta quedó incompleta. Inténtalo de nuevo.");
    }
    await registrar(true, r.usage.input_tokens + (r.usage.cache_read_input_tokens ?? 0), r.usage.output_tokens);
    return r.parsed_output as Resultado<T>;
  } catch (e) {
    if (e instanceof ErrorCopiloto) throw e;
    await registrar(false);
    console.error(`[ia] ${tarea}:`, e);
    if (e instanceof Anthropic.RateLimitError) throw new ErrorCopiloto("El copiloto está saturado. Prueba en un minuto.");
    if (e instanceof Anthropic.APIConnectionError) throw new ErrorCopiloto("No pudimos conectar con el copiloto. Prueba de nuevo.");
    throw new ErrorCopiloto("El copiloto no está disponible ahora. Tu trabajo quedó guardado.");
  }
}
