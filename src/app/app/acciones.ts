"use server";

import { randomUUID } from "crypto";
import { and, count, eq, gt, inArray, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { casos, envios, pasos, revisiones, usuarios } from "@/db/schema";
import { cerrarSesion, cifrarClave, exigirSesion } from "@/lib/auth";
import { actualizarSalud, casoDe, contextoCaso, iniciarEjecucion, pasosDe, registrar, revisionesDe, saludDe, type Caso } from "@/lib/casos";
import { crearOrden, desbloquearCaso } from "@/lib/compras";
import { hoyChile, sumarDias } from "@/lib/fechas";
import { consultar, ErrorCopiloto, LIMITE_CASOS_GRATIS_POR_DIA, verificarCuota } from "@/lib/ia/cliente";
import type { Resultado, TareaId } from "@/lib/ia/tareas";
import { causaRaiz, DIAS_VERIFICACION, salidaElegida, trabajoInicial, type Trabajo } from "@/lib/metodo";
import { PLANES, type PlanId } from "@/lib/planes";

export type Respuesta<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const texto = (max: number) => z.string().trim().max(max);
const id = z.string().uuid();

/** Trae el caso del usuario o corta: ninguna acción opera sobre un caso ajeno. */
async function casoPropio(casoId: string) {
  const sesion = await exigirSesion();
  const caso = await casoDe(sesion.id, casoId);
  if (!caso) throw new Error("Caso no encontrado");
  return { sesion, caso };
}

const refrescar = (casoId: string) => revalidatePath(`/app/caso/${casoId}`, "layout");

export async function crearCaso(relato: string): Promise<Respuesta<{ id: string }>> {
  const sesion = await exigirSesion();
  const r = texto(6000).min(30, "Cuéntalo con un poco más de detalle: unas dos frases bastan.").safeParse(relato);
  if (!r.success) return { ok: false, error: r.error.issues[0].message };
  const [{ n }] = await db.select({ n: count() }).from(casos)
    .where(and(eq(casos.usuarioId, sesion.id), isNull(casos.desbloqueadoEn), gt(casos.creadoEn, new Date(Date.now() - 86_400_000))));
  if (n >= LIMITE_CASOS_GRATIS_POR_DIA) return { ok: false, error: "Abriste varios casos hoy. Sigue con alguno de los que tienes o vuelve mañana." };
  const [c] = await db.insert(casos).values({
    usuarioId: sesion.id, trabajo: { ...trabajoInicial(), relato: r.data },
    titulo: r.data.length > 60 ? `${r.data.slice(0, 57).trimEnd()}…` : r.data,
  }).returning({ id: casos.id });
  await registrar(c.id, "creado", "Abriste este caso.");
  return { ok: true, id: c.id };
}

const PROPUESTAS = ["diagnostico", "salidas", "ejecucion"] as const;
type Propuesta = (typeof PROPUESTAS)[number];

/** Pide a la IA lo que necesita el paso. Si ya existe y nadie pidió ajustar, lo devuelve sin gastar. */
export async function generar<T extends Propuesta>(casoId: string, tarea: T, ajuste?: string): Promise<Respuesta<{ resultado: Resultado<T> }>> {
  const { sesion, caso } = await casoPropio(casoId);
  if (!PROPUESTAS.includes(tarea)) return { ok: false, error: "Tarea no válida." };
  const t = caso.trabajo;
  if (tarea !== "diagnostico" && !caso.desbloqueadoEn) return { ok: false, error: "Desbloquea el caso para seguir." };
  if (tarea === "salidas" && !causaRaiz(t)) return { ok: false, error: "Primero elige la causa." };
  if (tarea === "ejecucion" && !t.decisionIdeaId) return { ok: false, error: "Primero elige una salida." };

  const nota = texto(800).safeParse(ajuste ?? "");
  if (!nota.success) return { ok: false, error: "El texto es demasiado largo." };
  if (!nota.data && t.copiloto[tarea]) return { ok: true, resultado: t.copiloto[tarea] as Resultado<T> };

  try {
    await verificarCuota(sesion.id, casoId, !!caso.desbloqueadoEn);
    const pedido = nota.data ? `La persona agrega esto: ${nota.data}\nTenlo en cuenta y vuelve a proponer.` : "";
    const resultado = await consultar(tarea, contextoCaso(caso), pedido, { usuarioId: sesion.id, casoId });
    const cambios: Partial<Caso> = {};
    let extra: Partial<Trabajo> = {};
    if (tarea === "diagnostico") {
      const d = resultado as Resultado<"diagnostico">;
      cambios.titulo = d.titulo.slice(0, 90); cambios.categoria = d.categoria; cambios.urgencia = d.urgencia;
      extra = { situacion: d.situacion, importancia: d.importancia };
    }
    await db.update(casos).set({
      ...cambios,
      trabajo: sql`jsonb_set(${casos.trabajo} || ${JSON.stringify(extra)}::jsonb, ${`{copiloto,${tarea}}`}::text[], ${JSON.stringify(resultado)}::jsonb)`,
      ultimaActividad: new Date(),
    }).where(eq(casos.id, casoId));
    refrescar(casoId);
    return { ok: true, resultado };
  } catch (e) {
    if (e instanceof ErrorCopiloto) return { ok: false, error: e.message };
    throw e;
  }
}

/** Avanza el caso y guarda la elección. Cambiar de opinión invalida lo que dependía de ella. */
async function aplicar(casoId: string, etapa: number, cambios: Partial<Trabajo>, invalida: Propuesta[]) {
  const quitar = invalida.map((k) => sql`#- ${`{copiloto,${k}}`}::text[]`);
  const base = sql`${casos.trabajo} || ${JSON.stringify(cambios)}::jsonb`;
  await db.update(casos).set({
    trabajo: sql.join([base, ...quitar], sql` `),
    etapa: sql`greatest(${casos.etapa}, ${etapa})`, ultimaActividad: new Date(),
  }).where(eq(casos.id, casoId));
  refrescar(casoId);
}

export async function elegirProblema(casoId: string, elegido: string): Promise<Respuesta> {
  const { caso } = await casoPropio(casoId);
  const r = texto(600).min(8, "Elige una opción o escribe la tuya.").safeParse(elegido);
  if (!r.success) return { ok: false, error: r.error.issues[0].message };
  const cambio = r.data !== caso.trabajo.definicionFinal;
  await aplicar(casoId, 2, { definicionFinal: r.data }, cambio && caso.trabajo.definicionFinal ? ["salidas", "ejecucion"] : []);
  return { ok: true };
}

export async function elegirCausa(casoId: string, elegido: { texto: string; tipo: "hecho" | "suposicion"; porQue: string[] }): Promise<Respuesta<{ requierePago: boolean }>> {
  const { caso } = await casoPropio(casoId);
  const r = z.object({ texto: texto(400).min(5, "Elige una opción o escribe la tuya."), tipo: z.enum(["hecho", "suposicion"]), porQue: z.array(texto(300)).max(6) }).safeParse(elegido);
  if (!r.success) return { ok: false, error: r.error.issues[0].message };
  const previa = causaRaiz(caso.trabajo);
  const cambio = !!previa && previa.texto !== r.data.texto;
  const causa = { id: randomUUID(), texto: r.data.texto, evidencia: r.data.tipo, porQue: r.data.porQue, esRaiz: true };
  await aplicar(casoId, caso.desbloqueadoEn ? 3 : 2, { causas: [causa] }, cambio ? ["salidas", "ejecucion"] : []);
  await registrar(casoId, "etapa", `Elegiste la causa: ${r.data.texto}`);
  return { ok: true, requierePago: !caso.desbloqueadoEn };
}

export async function elegirSalida(casoId: string, elegido: { texto: string; razon: string; ideas: string[] }): Promise<Respuesta> {
  const { caso } = await casoPropio(casoId);
  if (!caso.desbloqueadoEn) return { ok: false, error: "Desbloquea el caso para seguir." };
  const r = z.object({ texto: texto(300).min(5, "Elige una opción o escribe la tuya."), razon: texto(600), ideas: z.array(texto(300)).max(40) }).safeParse(elegido);
  if (!r.success) return { ok: false, error: r.error.issues[0].message };
  const previa = salidaElegida(caso.trabajo);
  const id = randomUUID();
  const ideas = [{ id, texto: r.data.texto, origen: "copiloto" as const }, ...r.data.ideas.filter((x) => x !== r.data.texto).map((x) => ({ id: randomUUID(), texto: x, origen: "copiloto" as const }))];
  await aplicar(casoId, 4, { ideas, decisionIdeaId: id, razonDecision: r.data.razon }, previa && previa.texto !== r.data.texto ? ["ejecucion"] : []);
  await registrar(casoId, "etapa", `Elegiste la salida: ${r.data.texto}`);
  return { ok: true };
}

const planFinal = z.object({
  indicador: texto(160).min(3, "Di qué vas a medir."),
  unidad: texto(40).min(1, "Falta la unidad de tu meta."),
  lineaBase: z.number({ error: "Escribe el número de hoy." }).finite(),
  objetivo: z.number({ error: "Escribe el número al que quieres llegar." }).finite(),
  fechaObjetivo: fecha,
  pasos: z.array(z.object({
    titulo: texto(200).min(3, "Hay un paso sin descripción."),
    criterioHecho: texto(300).min(3, "Hay un paso sin criterio."),
    prioridad: z.enum(["A", "B", "C", "D"]),
    venceEn: fecha,
    depende: z.number().int().nullable(),
  })).min(3, "Tu plan necesita al menos 3 pasos.").max(14),
  compromiso: texto(600).min(10, "Escribe tu compromiso."),
  ritmoDias: z.union([z.literal(3), z.literal(7), z.literal(14)]),
  companeroNombre: texto(120).optional(),
  companeroEmail: z.union([z.literal(""), z.email("El correo del compañero no es válido.")]).optional(),
}).refine((m) => m.lineaBase !== m.objetivo, { message: "La meta debe ser distinta del valor de hoy." });

export async function empezarPlan(casoId: string, datos: unknown): Promise<Respuesta> {
  const { caso, sesion } = await casoPropio(casoId);
  if (caso.estado !== "metodo" || caso.etapa !== 4) return { ok: false, error: "Termina los pasos anteriores." };
  const r = planFinal.safeParse(datos);
  if (!r.success) return { ok: false, error: r.error.issues[0].message };
  const d = r.data;
  if (d.fechaObjetivo <= hoyChile()) return { ok: false, error: "La fecha de la meta debe ser futura." };

  const e = caso.trabajo.copiloto.ejecucion as Resultado<"ejecucion"> | undefined;
  const ids = d.pasos.map(() => randomUUID());
  await db.update(casos).set({
    indicador: d.indicador, unidad: d.unidad, lineaBase: d.lineaBase, objetivo: d.objetivo, fechaObjetivo: d.fechaObjetivo,
    trabajo: sql`${casos.trabajo} || ${JSON.stringify({
      estrategia: e?.estrategia ?? "", planB: e?.plan_b ?? "", disparadorPlanB: e?.disparador ?? "",
      riesgos: (e?.riesgos ?? []).map((x) => ({ id: randomUUID(), ...x })),
    })}::jsonb`,
  }).where(eq(casos.id, casoId));
  await db.insert(pasos).values(d.pasos.map((p, i) => ({
    id: ids[i], casoId, orden: i + 1, titulo: p.titulo, criterioHecho: p.criterioHecho, prioridad: p.prioridad,
    responsable: sesion.nombre, venceEn: p.venceEn, venceOriginal: p.venceEn,
    dependeDe: p.depende && p.depende >= 1 && p.depende <= i ? ids[p.depende - 1] : null,
  })));
  await registrar(casoId, "paso", `Tu plan tiene ${d.pasos.length} pasos.`);
  await iniciarEjecucion({ ...caso }, sesion, {
    responsable: sesion.nombre, compromiso: d.compromiso, ritmoDias: d.ritmoDias,
    companeroNombre: d.companeroNombre, companeroEmail: d.companeroEmail,
  });
  refrescar(casoId);
  return { ok: true };
}

export async function usarCredito(casoId: string): Promise<Respuesta> {
  const { sesion, caso } = await casoPropio(casoId);
  if (!(await desbloquearCaso(sesion.id, caso.id))) return { ok: false, error: "No tienes créditos disponibles." };
  await registrar(caso.id, "desbloqueo", "Desbloqueaste el caso.");
  refrescar(casoId);
  return { ok: true };
}

export async function comprar(planId: string, casoId: string | null): Promise<Respuesta> {
  const sesion = await exigirSesion();
  if (!(planId in PLANES)) return { ok: false, error: "Plan no válido." };
  if (casoId && !(await casoDe(sesion.id, casoId))) return { ok: false, error: "Caso no encontrado." };
  let destino: string;
  try {
    destino = await crearOrden(sesion, planId as PlanId, casoId);
  } catch (e) {
    console.error("[compra]", e);
    return { ok: false, error: "No pudimos iniciar el pago. Inténtalo de nuevo en unos minutos." };
  }
  redirect(destino);
}

export async function pedirCopiloto<T extends TareaId>(casoId: string, tarea: T, extra?: string): Promise<Respuesta<{ resultado: Resultado<T> }>> {
  const { sesion, caso } = await casoPropio(casoId);
  if (tarea !== "destrabar") return { ok: false, error: "Tarea no válida." };
  const pedido = texto(800).safeParse(extra ?? "");
  if (!pedido.success) return { ok: false, error: "El texto es demasiado largo." };
  try {
    await verificarCuota(sesion.id, casoId, !!caso.desbloqueadoEn);
    const resultado = await consultar(tarea, contextoCaso(caso, await pasosDe(casoId), await revisionesDe(casoId)), pedido.data, { usuarioId: sesion.id, casoId });
    return { ok: true, resultado };
  } catch (e) {
    if (e instanceof ErrorCopiloto) return { ok: false, error: e.message };
    throw e;
  }
}

const nuevoPaso = z.object({
  titulo: texto(200).min(3, "Describe el paso."),
  criterioHecho: texto(300).min(3, "Di cómo sabrás que quedó hecho."),
  prioridad: z.enum(["A", "B", "C", "D", "E"]),
  venceEn: fecha,
  dependeDe: id.nullable().optional(),
});

async function responsableDe(caso: Caso, nombre: string) {
  return caso.trabajo.responsable || nombre;
}

export async function agregarPaso(casoId: string, datos: unknown): Promise<Respuesta> {
  const { caso, sesion } = await casoPropio(casoId);
  const r = nuevoPaso.safeParse(datos);
  if (!r.success) return { ok: false, error: r.error.issues[0].message };
  const orden = (await pasosDe(casoId)).length + 1;
  await db.insert(pasos).values({
    ...r.data, casoId, orden, dependeDe: r.data.dependeDe ?? null, venceOriginal: r.data.venceEn, responsable: await responsableDe(caso, sesion.nombre),
  });
  await registrar(casoId, "paso", `Agregaste el paso «${r.data.titulo}».`);
  await actualizarSalud(casoId);
  refrescar(casoId);
  return { ok: true };
}

const EN_MARCHA = ["ejecucion", "verificacion"];

export async function cambiarPaso(casoId: string, pasoId: string, cambio: unknown): Promise<Respuesta> {
  const { caso } = await casoPropio(casoId);
  if (!EN_MARCHA.includes(caso.estado) && caso.etapa < 8) return { ok: false, error: "El caso no está en ejecución." };
  const [p] = await db.select().from(pasos).where(and(eq(pasos.id, pasoId), eq(pasos.casoId, casoId)));
  if (!p) return { ok: false, error: "Paso no encontrado." };

  const r = z.discriminatedUnion("accion", [
    z.object({ accion: z.literal("empezar") }),
    z.object({ accion: z.literal("hecho"), evidencia: texto(500).optional() }),
    z.object({ accion: z.literal("reabrir") }),
    z.object({ accion: z.literal("bloquear"), motivo: texto(400).min(3, "Di qué lo traba.") }),
    z.object({ accion: z.literal("desbloquear") }),
    z.object({ accion: z.literal("reprogramar"), fecha, motivo: texto(300).min(3, "Di por qué cambia la fecha.") }),
    z.object({ accion: z.literal("descartar"), motivo: texto(300).min(3, "Di por qué ya no hace falta.") }),
  ]).safeParse(cambio);
  if (!r.success) return { ok: false, error: r.error.issues[0].message };
  const c = r.data;

  switch (c.accion) {
    case "empezar":
      await db.update(pasos).set({ estado: "en_curso" }).where(eq(pasos.id, pasoId));
      break;
    case "hecho": {
      if (p.dependeDe) {
        const [previo] = await db.select({ estado: pasos.estado, titulo: pasos.titulo }).from(pasos).where(eq(pasos.id, p.dependeDe));
        if (previo && previo.estado !== "hecho" && previo.estado !== "descartado")
          return { ok: false, error: `Antes va «${previo.titulo}».` };
      }
      await db.update(pasos).set({ estado: "hecho", completadoEn: new Date(), evidencia: c.evidencia || null, bloqueo: null }).where(eq(pasos.id, pasoId));
      await registrar(casoId, "paso_hecho", `Completaste «${p.titulo}».`);
      break;
    }
    case "reabrir":
      await db.update(pasos).set({ estado: "pendiente", completadoEn: null }).where(eq(pasos.id, pasoId));
      await registrar(casoId, "paso", `Reabriste «${p.titulo}».`);
      break;
    case "bloquear":
      await db.update(pasos).set({ estado: "bloqueado", bloqueo: c.motivo }).where(eq(pasos.id, pasoId));
      await registrar(casoId, "bloqueo", `Se bloqueó «${p.titulo}»: ${c.motivo}`);
      break;
    case "desbloquear":
      await db.update(pasos).set({ estado: "pendiente", bloqueo: null }).where(eq(pasos.id, pasoId));
      await registrar(casoId, "bloqueo", `Destrabaste «${p.titulo}».`);
      break;
    case "reprogramar":
      if (c.fecha < hoyChile()) return { ok: false, error: "La fecha no puede ser pasada." };
      await db.update(pasos).set({ venceEn: c.fecha, reprogramaciones: p.reprogramaciones + 1 }).where(eq(pasos.id, pasoId));
      await registrar(casoId, "reprogramado", `«${p.titulo}» pasó al ${c.fecha}: ${c.motivo}`);
      break;
    case "descartar":
      await db.update(pasos).set({ estado: "descartado" }).where(eq(pasos.id, pasoId));
      await registrar(casoId, "paso", `Descartaste «${p.titulo}»: ${c.motivo}`);
      break;
  }
  await actualizarSalud(casoId);
  refrescar(casoId);
  return { ok: true };
}

const revision = z.object({
  valor: z.number().finite().nullable(),
  confianza: z.number().int().min(1).max(5),
  avances: texto(1500).min(3, "Cuenta qué pasó desde la última vez."),
  trabas: texto(1500),
  compromiso: texto(500).min(3, "Di qué harás de aquí a la próxima."),
});

export async function registrarRevision(casoId: string, datos: unknown): Promise<Respuesta<{ revisionId: string }>> {
  const { caso } = await casoPropio(casoId);
  if (caso.estado !== "ejecucion") return { ok: false, error: "El caso no está en ejecución." };
  const r = revision.safeParse(datos);
  if (!r.success) return { ok: false, error: r.error.issues[0].message };
  if (caso.indicador && r.data.valor === null) return { ok: false, error: "Mide tu indicador: es lo que dice si esto funciona." };

  const hoy = hoyChile();
  const [fila] = await db.insert(revisiones).values({ ...r.data, casoId, fecha: hoy }).returning({ id: revisiones.id });
  await db.update(casos).set({ proximaRevision: sumarDias(hoy, caso.ritmoDias) }).where(eq(casos.id, casoId));
  await registrar(casoId, "revision", `Revisión: ${r.data.valor ?? "sin medición"}${caso.unidad ? ` ${caso.unidad}` : ""}, confianza ${r.data.confianza}/5.`);
  await actualizarSalud(casoId);
  refrescar(casoId);
  return { ok: true, revisionId: fila.id };
}

/** Va aparte de guardar la revisión: si la IA falla, la revisión ya quedó. */
export async function analizarRevision(casoId: string, revisionId: string): Promise<Respuesta<{ resultado: Resultado<"revision"> }>> {
  const { sesion, caso } = await casoPropio(casoId);
  try {
    await verificarCuota(sesion.id, casoId, true);
    const ps = await pasosDe(casoId);
    const rs = await revisionesDe(casoId);
    const s = saludDe(caso, ps, rs);
    const resultado = await consultar("revision", contextoCaso(caso, ps, rs),
      `Salud calculada: ${s.puntaje}/100 (${s.estado}). Pasos ${s.avancePasos}% vs ${s.avanceEsperado}% esperado. Indicador ${s.avanceIndicador ?? "sin medir"}% vs ${s.indicadorEsperado ?? "?"}% esperado.`,
      { usuarioId: sesion.id, casoId });
    await db.update(revisiones).set({ analisis: resultado }).where(and(eq(revisiones.id, revisionId), eq(revisiones.casoId, casoId)));
    refrescar(casoId);
    return { ok: true, resultado };
  } catch (e) {
    if (e instanceof ErrorCopiloto) return { ok: false, error: e.message };
    throw e;
  }
}

export async function activarPlanB(casoId: string): Promise<Respuesta> {
  const { caso } = await casoPropio(casoId);
  if (caso.planBActivoEn) return { ok: true };
  await db.update(casos).set({ planBActivoEn: new Date() }).where(eq(casos.id, casoId));
  await registrar(casoId, "plan_b", `Activaste el plan B: ${caso.trabajo.planB}`);
  await actualizarSalud(casoId);
  refrescar(casoId);
  return { ok: true };
}

export async function marcarLogrado(casoId: string): Promise<Respuesta> {
  const { caso } = await casoPropio(casoId);
  if (caso.estado !== "ejecucion") return { ok: false, error: "El caso no está en ejecución." };
  const hoy = hoyChile();
  await db.update(casos).set({ estado: "verificacion", verificarEn: sumarDias(hoy, DIAS_VERIFICACION) }).where(eq(casos.id, casoId));
  await registrar(casoId, "logrado", `Marcaste la meta como lograda. Se verifica en ${DIAS_VERIFICACION} días.`);
  await actualizarSalud(casoId);
  refrescar(casoId);
  return { ok: true };
}

export async function verificar(casoId: string, sigueResuelto: boolean): Promise<Respuesta> {
  const { sesion, caso } = await casoPropio(casoId);
  if (caso.estado !== "verificacion") return { ok: false, error: "El caso no está en verificación." };
  if (sigueResuelto && caso.verificarEn && hoyChile() < caso.verificarEn) return { ok: false, error: `Podrás confirmarlo desde el ${caso.verificarEn}.` };
  if (!sigueResuelto) {
    await db.update(casos).set({ estado: "ejecucion", verificarEn: null, proximaRevision: sumarDias(hoyChile(), caso.ritmoDias) }).where(eq(casos.id, casoId));
    await registrar(casoId, "recaida", "El problema volvió. El caso siguió en ejecución.");
    await actualizarSalud(casoId);
    refrescar(casoId);
    return { ok: true };
  }
  await db.update(casos).set({ estado: "resuelto", resueltoEn: new Date() }).where(eq(casos.id, casoId));
  await registrar(casoId, "resuelto", "Verificaste que se sostuvo. Caso resuelto.");
  try {
    const resultado = await consultar("cierre", contextoCaso(caso, await pasosDe(casoId), await revisionesDe(casoId)), "", { usuarioId: sesion.id, casoId });
    await db.update(casos).set({ trabajo: sql`jsonb_set(${casos.trabajo}, '{copiloto,cierre}', ${JSON.stringify(resultado)}::jsonb)` }).where(eq(casos.id, casoId));
  } catch (e) {
    if (!(e instanceof ErrorCopiloto)) console.error("[cierre]", e);
  }
  refrescar(casoId);
  return { ok: true };
}

export async function pausar(casoId: string, pausado: boolean): Promise<Respuesta> {
  const { caso } = await casoPropio(casoId);
  if (pausado && caso.estado !== "ejecucion") return { ok: false, error: "Solo se pausa un caso en ejecución." };
  if (!pausado && caso.estado !== "pausado") return { ok: false, error: "El caso no está en pausa." };
  await db.update(casos).set(pausado
    ? { estado: "pausado" }
    : { estado: "ejecucion", proximaRevision: sumarDias(hoyChile(), caso.ritmoDias) }).where(eq(casos.id, casoId));
  await registrar(casoId, pausado ? "pausa" : "reanudado", pausado ? "Pusiste el caso en pausa." : "Retomaste el caso.");
  await actualizarSalud(casoId);
  refrescar(casoId);
  return { ok: true };
}

export async function cambiarAvisos(recibir: boolean) {
  const s = await exigirSesion();
  await db.update(usuarios).set({ recibirCorreos: recibir }).where(eq(usuarios.id, s.id));
  revalidatePath("/app/ajustes");
}

/** Borra el contenido y deja anónima la cuenta: las órdenes se conservan por obligación contable. */
export async function eliminarCuenta(confirmacion: string): Promise<Respuesta> {
  const s = await exigirSesion();
  if (confirmacion.trim().toUpperCase() !== "ELIMINAR") return { ok: false, error: "Escribe ELIMINAR para confirmar." };
  await db.transaction(async (tx) => {
    const ids = (await tx.select({ id: casos.id }).from(casos).where(eq(casos.usuarioId, s.id))).map((c) => c.id);
    if (ids.length) await tx.delete(casos).where(inArray(casos.id, ids));
    await tx.delete(envios).where(eq(envios.usuarioId, s.id));
    await tx.update(usuarios).set({
      email: `eliminada-${s.id}@cuenta.invalid`, nombre: "Cuenta eliminada",
      claveHash: await cifrarClave(randomUUID()), recibirCorreos: false,
    }).where(eq(usuarios.id, s.id));
  });
  await cerrarSesion();
  redirect("/");
}

export async function salir() {
  await cerrarSesion();
  redirect("/");
}

