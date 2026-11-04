import "server-only";
import { randomBytes } from "crypto";
import { and, eq, isNull, sql, sum } from "drizzle-orm";
import { db, type Tx } from "@/db";
import { casos, creditos, ordenes, usuarios } from "@/db/schema";
import { createPayment, getPaymentStatus, FLOW_STATUS } from "./flow";
import { encolar, enviarPendientes, plantilla } from "./correo";
import { appUrl } from "./marca";
import { PLANES, pesos, type PlanId } from "./planes";

export async function saldoCreditos(usuarioId: string, tx: Pick<Tx, "select"> = db) {
  const [{ total }] = await tx.select({ total: sum(creditos.delta) }).from(creditos).where(eq(creditos.usuarioId, usuarioId));
  return Number(total ?? 0);
}

/** Gasta un crédito y abre el caso. Serializa por usuario para no gastar dos veces el mismo saldo. */
export async function desbloquearCaso(usuarioId: string, casoId: string, ctx?: Tx): Promise<boolean> {
  const correr = async (tx: Tx) => {
    await tx.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.id, usuarioId)).for("update");
    const [caso] = await tx.select({ id: casos.id, desbloqueadoEn: casos.desbloqueadoEn })
      .from(casos).where(and(eq(casos.id, casoId), eq(casos.usuarioId, usuarioId))).limit(1);
    if (!caso) return false;
    if (caso.desbloqueadoEn) return true;
    if ((await saldoCreditos(usuarioId, tx)) < 1) return false;
    await tx.insert(creditos).values({ usuarioId, delta: -1, motivo: "caso", casoId });
    // El muro aparece al terminar los pasos gratis: al abrirse, el caso sigue en el 3.
    await tx.update(casos).set({ desbloqueadoEn: new Date(), etapa: sql`greatest(${casos.etapa}, 3)` }).where(eq(casos.id, casoId));
    return true;
  };
  return ctx ? correr(ctx) : db.transaction(correr);
}

export async function crearOrden(u: { id: string; email: string }, planId: PlanId, casoId: string | null) {
  const plan = PLANES[planId];
  const numero = `S-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const [orden] = await db.insert(ordenes).values({
    numero, usuarioId: u.id, plan: plan.id, monto: plan.monto, creditos: plan.creditos, casoId,
  }).returning();

  const pago = await createPayment({
    commerceOrder: numero,
    subject: `Solucionador: ${plan.nombre}`,
    amount: plan.monto,
    email: u.email,
    urlConfirmation: `${appUrl()}/api/flow/confirmar`,
    urlReturn: `${appUrl()}/api/flow/retorno`,
  });
  await db.update(ordenes).set({ flowToken: pago.token }).where(eq(ordenes.id, orden.id));
  return pago.redirectUrl;
}

/**
 * Sincroniza una orden con Flow. Flow es la fuente de verdad; el webhook y el
 * retorno del navegador llegan en cualquier orden y pueden repetirse, así que
 * el paso a «pagada» ocurre una sola vez, con la fila bloqueada.
 */
export async function sincronizarOrden(token: string) {
  const estado = await getPaymentStatus(token);

  const resultado = await db.transaction(async (tx) => {
    const [orden] = await tx.select().from(ordenes).where(eq(ordenes.flowToken, token)).for("update").limit(1);
    if (!orden) return null;
    if (orden.estado === "pagada") return { orden, recienPagada: false };

    if (estado.commerceOrder !== orden.numero) {
      console.error(`[flow] token de otra orden: ${orden.numero}`);
      return { orden, recienPagada: false };
    }

    if (estado.status === FLOW_STATUS.PAID) {
      if (Math.round(Number(estado.amount)) !== orden.monto) {
        await tx.update(ordenes).set({ estado: "monto_invalido" }).where(eq(ordenes.id, orden.id));
        console.error(`[flow] monto distinto en ${orden.numero}: ${estado.amount} vs ${orden.monto}`);
        return { orden: { ...orden, estado: "monto_invalido" }, recienPagada: false };
      }
      const [pagada] = await tx.update(ordenes).set({ estado: "pagada", pagadoEn: new Date() })
        .where(and(eq(ordenes.id, orden.id), sql`estado <> 'pagada'`)).returning();
      await tx.insert(creditos).values({ usuarioId: orden.usuarioId, delta: orden.creditos, motivo: "compra", ordenId: orden.id })
        .onConflictDoNothing();
      if (orden.casoId) await desbloquearCaso(orden.usuarioId, orden.casoId, tx);
      return { orden: pagada, recienPagada: true };
    }

    const nuevo = estado.status === FLOW_STATUS.REJECTED ? "rechazada" : estado.status === FLOW_STATUS.CANCELED ? "anulada" : orden.estado;
    if (nuevo !== orden.estado) await tx.update(ordenes).set({ estado: nuevo }).where(eq(ordenes.id, orden.id));
    return { orden: { ...orden, estado: nuevo }, recienPagada: false };
  });

  if (resultado?.recienPagada) {
    const { orden } = resultado;
    const [u] = await db.select({ email: usuarios.email }).from(usuarios).where(eq(usuarios.id, orden.usuarioId));
    await encolar({
      clave: `compra:${orden.id}`, para: u.email, usuarioId: orden.usuarioId,
      asunto: "Recibimos tu pago",
      html: plantilla("Recibimos tu pago", `Pagaste ${pesos(orden.monto)} (orden ${orden.numero}). Ya puedes seguir con tu caso.`,
        { texto: "Volver a mi caso", url: `${appUrl()}/app` }),
    });
    await enviarPendientes(5).catch((e) => console.error("[correo]", e));
  }
  return resultado?.orden ?? null;
}

export const casosSinDesbloquear = (usuarioId: string) =>
  db.select({ id: casos.id, titulo: casos.titulo }).from(casos)
    .where(and(eq(casos.usuarioId, usuarioId), isNull(casos.desbloqueadoEn)));
