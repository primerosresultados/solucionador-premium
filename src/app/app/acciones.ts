"use server";

import { randomUUID } from "crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { casos, envios, pasos, revisiones, usuarios } from "@/db/schema";
import { cerrarSesion, cifrarClave, exigirSesion } from "@/lib/auth";
import { actualizarSalud, casoDe, contextoCaso, iniciarEjecucion, pasosDe, registrar, revisionesDe, saludDe, type Caso } from "@/lib/casos";
import { crearOrden, desbloquearCaso } from "@/lib/compras";
import { hoyChile, sumarDias } from "@/lib/fechas";
import { consultar, ErrorCopiloto, verificarCuota } from "@/lib/ia/cliente";
import type { Resultado, TareaId } from "@/lib/ia/tareas";
import { DIAS_VERIFICACION, ETAPA_GRATIS, faltantes, ideasPropias, MIN_IDEAS, MIN_IDEAS_PROPIAS_PARA_COPILOTO, trabajoInicial } from "@/lib/metodo";
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

const casoNuevo = z.object({
  relato: texto(6000).min(30, "Cuéntalo con un poco más de detalle."),
  categoria: z.enum(["personal", "trabajo", "proyecto"]),
  urgencia: z.enum(["baja", "media", "alta"]),
});

export async function crearCaso(datos: unknown): Promise<Respuesta<{ id: string }>> {
  const sesion = await exigirSesion();
  const r = casoNuevo.safeParse(datos);
  if (!r.success) return { ok: false, error: r.error.issues[0].message };
  const { relato, categoria, urgencia } = r.data;
  const trabajo = { ...trabajoInicial(), relato };
  const [c] = await db.insert(casos).values({
    usuarioId: sesion.id, trabajo, categoria, urgencia,
    titulo: relato.length > 60 ? `${relato.slice(0, 57).trimEnd()}…` : relato,
  }).returning({ id: casos.id });
  await registrar(c.id, "creado", "Abriste este caso.");
  return { ok: true, id: c.id };
}

const parche = z.object({
  relato: texto(6000), situacion: texto(1000), importancia: texto(1000),
  definiciones: z.array(texto(400)).max(12), definicionFinal: texto(600), comoSabre: texto(800),
  causas: z.array(z.object({
    id: z.string().max(40), texto: texto(400), evidencia: z.enum(["hecho", "suposicion"]),
    porQue: z.array(texto(300)).max(6), esRaiz: z.boolean(),
  })).max(30),
  empezarDeCero: texto(800),
  ideas: z.array(z.object({ id: z.string().max(40), texto: texto(300), origen: z.enum(["persona", "copiloto", "base"]) })).max(80),
  criterios: z.array(z.object({ id: z.string().max(40), nombre: texto(80), peso: z.number().int().min(1).max(5) })).max(8),
  opciones: z.array(z.object({
    ideaId: z.string().max(40), notas: z.record(z.string(), z.number().min(0).max(5)), favor: texto(400), contra: texto(400),
  })).max(8),
  decisionIdeaId: z.string().max(40).nullable(), razonDecision: texto(800), estrategia: texto(1200),
  riesgos: z.array(z.object({ id: z.string().max(40), texto: texto(300), senal: texto(300), respuesta: texto(300) })).max(12),
  planB: texto(1000), disparadorPlanB: texto(400),
}).partial().strict();

const CAMPOS_GRATIS = new Set(["relato", "situacion", "importancia"]);

export async function guardarTrabajo(casoId: string, cambios: unknown): Promise<Respuesta> {
  const { caso } = await casoPropio(casoId);
  const r = parche.safeParse(cambios);
  if (!r.success) return { ok: false, error: "No pudimos guardar: revisa el largo del texto." };
  if (!caso.desbloqueadoEn && Object.keys(r.data).some((k) => !CAMPOS_GRATIS.has(k)))
    return { ok: false, error: "Desbloquea el caso para seguir." };

  const titulo = r.data.situacion?.trim();
  await db.update(casos).set({
    // Une a nivel de campo en la base: dos guardados seguidos no se pisan.
    trabajo: sql`${casos.trabajo} || ${JSON.stringify(r.data)}::jsonb`,
    ...(titulo ? { titulo: titulo.slice(0, 90) } : {}),
    ultimaActividad: new Date(),
  }).where(eq(casos.id, casoId));
  return { ok: true };
}

function faltaEnEtapaEjecutable(caso: Caso, ps: { prioridad: string }[]): string | null {
  if (caso.etapa === 7 && !caso.indicador) return "Define y guarda la meta.";
  if (caso.etapa === 8) {
    if (ps.length < 3) return "Tu plan necesita al menos 3 pasos.";
    if (!ps.some((p) => p.prioridad === "A")) return "Marca al menos un paso como prioridad A.";
  }
  return null;
}

export async function avanzarEtapa(casoId: string): Promise<Respuesta<{ etapa: number; requierePago?: boolean }>> {
  const { caso } = await casoPropio(casoId);
  const faltas = faltantes(caso.etapa, caso.trabajo);
  if (faltas.length) return { ok: false, error: faltas[0].mensaje };

  const falta = faltaEnEtapaEjecutable(caso, await pasosDe(casoId));
  if (falta) return { ok: false, error: falta };

  if (caso.etapa === ETAPA_GRATIS && !caso.desbloqueadoEn) return { ok: true, etapa: caso.etapa, requierePago: true };
  if (caso.etapa >= 9) return { ok: false, error: "Firma tu compromiso para empezar." };

  await db.update(casos).set({ etapa: sql`greatest(${casos.etapa}, ${caso.etapa + 1})`, ultimaActividad: new Date() }).where(eq(casos.id, casoId));
  await registrar(casoId, "etapa", `Completaste la etapa ${caso.etapa}.`);
  refrescar(casoId);
  return { ok: true, etapa: caso.etapa + 1 };
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
  const desbloqueado = !!caso.desbloqueadoEn;
  if (!desbloqueado && tarea !== "encuadrar") return { ok: false, error: "Desbloquea el caso para usar el copiloto aquí." };
  if (tarea === "ideas" && ideasPropias(caso.trabajo) < MIN_IDEAS_PROPIAS_PARA_COPILOTO)
    return { ok: false, error: `Escribe tus primeras ${MIN_IDEAS_PROPIAS_PARA_COPILOTO} ideas: las tuyas abren el camino.` };
  if ((tarea === "desafiar" || tarea === "premortem") && !caso.trabajo.decisionIdeaId)
    return { ok: false, error: "Primero elige una opción." };
  if (tarea === "plan" && !caso.indicador) return { ok: false, error: "Primero guarda la meta." };

  const pedidoExtra = texto(800).safeParse(extra ?? "");
  if (!pedidoExtra.success) return { ok: false, error: "El texto es demasiado largo." };

  try {
    await verificarCuota(sesion.id, casoId, desbloqueado);
    const ps = await pasosDe(casoId);
    const rs = await revisionesDe(casoId);
    const cuantas = Math.max(5, Math.min(12, MIN_IDEAS - caso.trabajo.ideas.length + 3));
    const pedido = tarea === "ideas" ? `Propón ${cuantas} ideas nuevas.\n${pedidoExtra.data}` : pedidoExtra.data;
    const resultado = await consultar(tarea, contextoCaso(caso, ps, rs), pedido, { usuarioId: sesion.id, casoId });
    await db.update(casos).set({
      trabajo: sql`jsonb_set(${casos.trabajo}, ${`{copiloto,${tarea}}`}::text[], ${JSON.stringify(resultado)}::jsonb)`,
    }).where(eq(casos.id, casoId));
    return { ok: true, resultado };
  } catch (e) {
    if (e instanceof ErrorCopiloto) return { ok: false, error: e.message };
    throw e;
  }
}

const meta = z.object({
  indicador: texto(160).min(3, "Di qué vas a medir."),
  unidad: texto(40).min(1, "Falta la unidad."),
  lineaBase: z.number({ error: "Escribe el número de hoy." }).finite(),
  objetivo: z.number({ error: "Escribe el número al que quieres llegar." }).finite(),
  fechaObjetivo: fecha,
}).refine((m) => m.lineaBase !== m.objetivo, { message: "El objetivo debe ser distinto de la línea base." });

export async function guardarMeta(casoId: string, datos: unknown): Promise<Respuesta> {
  await casoPropio(casoId);
  const r = meta.safeParse(datos);
  if (!r.success) return { ok: false, error: r.error.issues[0].message };
  if (r.data.fechaObjetivo <= hoyChile()) return { ok: false, error: "La fecha debe ser futura." };
  await db.update(casos).set(r.data).where(eq(casos.id, casoId));
  refrescar(casoId);
  return { ok: true };
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

/** Carga el plan que propuso el copiloto, reemplazando solo si no hay pasos. */
export async function aplicarPlanCopiloto(casoId: string): Promise<Respuesta> {
  const { caso, sesion } = await casoPropio(casoId);
  const plan = caso.trabajo.copiloto.plan as Resultado<"plan"> | undefined;
  if (!plan) return { ok: false, error: "Primero pide el plan al copiloto." };
  if ((await pasosDe(casoId)).length) return { ok: false, error: "Ya tienes pasos: agrégalos de a uno." };
  const hoy = hoyChile();
  const responsable = await responsableDe(caso, sesion.nombre);
  const ids = plan.pasos.map(() => randomUUID());
  await db.insert(pasos).values(plan.pasos.map((p, i) => {
    const vence = sumarDias(hoy, Math.max(1, Math.round(p.dias_desde_hoy)));
    const previo = p.depende_del_paso;
    return {
      id: ids[i], casoId, orden: i + 1, titulo: p.titulo.slice(0, 200), criterioHecho: p.criterio_hecho.slice(0, 300),
      prioridad: p.prioridad, responsable, venceEn: vence, venceOriginal: vence,
      dependeDe: previo && previo >= 1 && previo <= i ? ids[previo - 1] : null,
    };
  }));
  await registrar(casoId, "paso", `Cargaste un plan de ${plan.pasos.length} pasos.`);
  await actualizarSalud(casoId);
  refrescar(casoId);
  return { ok: true };
}

const compromiso = z.object({
  responsable: texto(120).min(2, "Escribe tu nombre."),
  compromiso: texto(600).min(15, "Escribe tu compromiso con tus palabras."),
  ritmoDias: z.union([z.literal(3), z.literal(7), z.literal(14)]),
  companeroNombre: texto(120).optional(),
  companeroEmail: z.union([z.literal(""), z.email("Ese correo no es válido.")]).optional(),
});

export async function firmarCompromiso(casoId: string, datos: unknown): Promise<Respuesta> {
  const { caso, sesion } = await casoPropio(casoId);
  if (caso.etapa !== 9) return { ok: false, error: "Termina las etapas anteriores." };
  const r = compromiso.safeParse(datos);
  if (!r.success) return { ok: false, error: r.error.issues[0].message };
  await db.update(pasos).set({ responsable: r.data.responsable }).where(eq(pasos.casoId, casoId));
  await iniciarEjecucion(caso, sesion, r.data);
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

