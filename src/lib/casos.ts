import "server-only";
import { randomBytes } from "crypto";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { casos, eventos, pasos, revisiones, usuarios } from "@/db/schema";
import { encolar, enviarPendientes, plantilla } from "./correo";
import { hoyChile, sumarDias } from "./fechas";
import { appUrl } from "./marca";
import { CATEGORIAS, IDEA_NO_HACER_NADA, puntajeOpcion, URGENCIAS, type Categoria, type Urgencia } from "./metodo";
import { avisosDelDia, calcularSalud, ETIQUETA_SALUD, resumenSemanal, type EstadoSalud, type PasoSalud, type Salud } from "./salud";

export type Caso = typeof casos.$inferSelect;
export type Paso = typeof pasos.$inferSelect;
export type Revision = typeof revisiones.$inferSelect;

/** Toda lectura de un caso pasa por aquí: el dueño es parte de la consulta. */
export async function casoDe(usuarioId: string, casoId: string): Promise<Caso | null> {
  if (!/^[0-9a-f-]{36}$/i.test(casoId)) return null;
  const [c] = await db.select().from(casos).where(and(eq(casos.id, casoId), eq(casos.usuarioId, usuarioId))).limit(1);
  return c ?? null;
}

export const pasosDe = (casoId: string) =>
  db.select().from(pasos).where(eq(pasos.casoId, casoId)).orderBy(asc(pasos.orden));

export const revisionesDe = (casoId: string) =>
  db.select().from(revisiones).where(eq(revisiones.casoId, casoId)).orderBy(desc(revisiones.fecha), desc(revisiones.creadoEn));

export const eventosDe = (casoId: string, limite = 40) =>
  db.select().from(eventos).where(eq(eventos.casoId, casoId)).orderBy(desc(eventos.creadoEn)).limit(limite);

export const registrar = (casoId: string, tipo: string, detalle: string, datos?: Record<string, unknown>) =>
  db.insert(eventos).values({ casoId, tipo, detalle, datos });

export function saludDe(caso: Caso, ps: Paso[], rs: Revision[], hoy = hoyChile()): Salud {
  return calcularSalud({
    lineaBase: caso.lineaBase, objetivo: caso.objetivo, fechaInicio: caso.fechaInicio, fechaObjetivo: caso.fechaObjetivo,
    proximaRevision: caso.proximaRevision, ultimaActividad: caso.ultimaActividad, planBActivo: !!caso.planBActivoEn,
  // revisionesDe trae lo más nuevo primero; el motor las necesita en orden cronológico.
  }, ps as PasoSalud[], rs.map((r) => ({ fecha: r.fecha, valor: r.valor, confianza: r.confianza })).reverse(), hoy);
}

/** Tras cualquier cambio: marca actividad y recalcula la salud guardada. */
export async function actualizarSalud(casoId: string, tocar = true) {
  const [caso] = await db.select().from(casos).where(eq(casos.id, casoId));
  if (!caso) return;
  const base = tocar ? { ...caso, ultimaActividad: new Date() } : caso;
  const salud = saludDe(base, await pasosDe(casoId), await revisionesDe(casoId));
  await db.update(casos).set({
    salud: salud.puntaje, saludEstado: salud.estado, ...(tocar ? { ultimaActividad: base.ultimaActividad } : {}),
  }).where(eq(casos.id, casoId));
}

/** Resumen del caso para el copiloto. Solo lo necesario para la tarea. */
export function contextoCaso(c: Caso, ps: Paso[] = [], rs: Revision[] = []) {
  const t = c.trabajo;
  const decision = t.ideas.find((i) => i.id === t.decisionIdeaId);
  const l: string[] = [];
  const agregar = (etiqueta: string, valor?: string | number | null) => {
    if (valor !== undefined && valor !== null && String(valor).trim()) l.push(`${etiqueta}: ${valor}`);
  };
  agregar("Tipo de problema", CATEGORIAS[c.categoria as Categoria]);
  agregar("Urgencia", URGENCIAS[c.urgencia as Urgencia]?.nombre);
  agregar("Lo que cuenta la persona", t.relato);
  agregar("Situación", t.situacion);
  agregar("Por qué importa", t.importancia);
  if (t.definiciones.length) l.push(`Definiciones:\n${t.definiciones.map((d) => `- ${d}`).join("\n")}`);
  agregar("Definición elegida", t.definicionFinal);
  agregar("Cómo se vería resuelto", t.comoSabre);
  if (t.causas.length) l.push(`Causas:\n${t.causas.map((x) => `- ${x.texto} (${x.evidencia}${x.esRaiz ? ", CAUSA RAÍZ" : ""})${x.porQue.length ? `; por qué: ${x.porQue.join(" → ")}` : ""}`).join("\n")}`);
  agregar("Si empezara de cero", t.empezarDeCero);
  if (t.ideas.length > 1) l.push(`Ideas existentes:\n${t.ideas.filter((i) => i.id !== IDEA_NO_HACER_NADA).map((i) => `- ${i.texto}`).join("\n")}`);
  if (t.opciones.length) l.push(`Opciones comparadas:\n${t.opciones.map((o) => `- ${t.ideas.find((i) => i.id === o.ideaId)?.texto} (${puntajeOpcion(o, t.criterios)}/100)`).join("\n")}`);
  agregar("Opción elegida", decision?.texto);
  agregar("Razón", t.razonDecision);
  agregar("Estrategia", t.estrategia);
  agregar("Plan B", t.planB);
  agregar("Disparador del plan B", t.disparadorPlanB);
  if (c.indicador) l.push(`Meta: ${c.indicador} (${c.unidad}) de ${c.lineaBase} a ${c.objetivo} para el ${c.fechaObjetivo}`);
  if (ps.length) l.push(`Pasos:\n${ps.map((p, i) => `${i + 1}. [${p.prioridad}] ${p.titulo}: ${p.estado}, vence ${p.venceEn}${p.reprogramaciones ? `, postergado ${p.reprogramaciones} veces` : ""}${p.bloqueo ? `, bloqueo: ${p.bloqueo}` : ""}`).join("\n")}`);
  if (rs.length) l.push(`Revisiones (más reciente primero):\n${rs.slice(0, 6).map((r) => `- ${r.fecha}: valor ${r.valor ?? "sin medir"}, confianza ${r.confianza}/5; avances: ${r.avances}; trabas: ${r.trabas || "ninguna"}; compromiso: ${r.compromiso}`).join("\n")}`);
  l.push(`Hoy es ${hoyChile()}`);
  return l.join("\n");
}

export type InicioEjecucion = {
  responsable: string; compromiso: string; ritmoDias: number; companeroNombre?: string; companeroEmail?: string;
};

export async function iniciarEjecucion(caso: Caso, usuario: { id: string; nombre: string }, d: InicioEjecucion) {
  const hoy = hoyChile();
  const token = d.companeroEmail ? randomBytes(24).toString("base64url") : null;
  await db.update(casos).set({
    estado: "ejecucion", etapa: 10, fechaInicio: hoy, iniciadoEn: new Date(), ritmoDias: d.ritmoDias,
    proximaRevision: sumarDias(hoy, d.ritmoDias),
    companeroNombre: d.companeroNombre || null, companeroEmail: d.companeroEmail || null, companeroToken: token,
    trabajo: sql`${casos.trabajo} || ${JSON.stringify({ responsable: d.responsable, compromiso: d.compromiso })}::jsonb`,
  }).where(eq(casos.id, caso.id));
  await registrar(caso.id, "inicio", `Compromiso firmado por ${d.responsable}.`);

  if (d.companeroEmail && token) {
    await encolar({
      clave: `companero:${caso.id}:${d.companeroEmail}`, para: d.companeroEmail, casoId: caso.id, usuarioId: usuario.id,
      asunto: `${usuario.nombre} te eligió para acompañarle`,
      html: plantilla(`${usuario.nombre} te eligió como compañero de compromiso`,
        `Se comprometió a resolver algo importante y quiere que alguien de confianza vea cómo va. Solo verás el avance general, y cada lunes un resumen breve. Una pregunta tuya a tiempo vale mucho.`,
        { texto: "Ver el avance", url: `${appUrl()}/companero/${token}` }),
    });
    await enviarPendientes(5).catch((e) => console.error("[correo]", e));
  }
  await actualizarSalud(caso.id);
}

/** Avisos diarios. La clave única de `envios` hace que correrlo dos veces no duplique. */
export async function correrSeguimiento(hoy = hoyChile()) {
  const activos = await db.select({ caso: casos, usuario: usuarios }).from(casos)
    .innerJoin(usuarios, eq(casos.usuarioId, usuarios.id))
    .where(inArray(casos.estado, ["ejecucion", "verificacion"]));

  const lunes = new Date(`${hoy}T12:00:00Z`).getUTCDay() === 1;
  let avisos = 0;
  const semana = new Map<string, { usuario: typeof usuarios.$inferSelect; lineas: { titulo: string; accion: string; estado: EstadoSalud }[] }>();

  for (const { caso, usuario } of activos) {
    const ps = await pasosDe(caso.id);
    const rs = await revisionesDe(caso.id);
    const salud = saludDe(caso, ps, rs, hoy);
    await db.update(casos).set({ salud: salud.puntaje, saludEstado: salud.estado }).where(eq(casos.id, caso.id));

    const url = `${appUrl()}/app/caso/${caso.id}`;

    if (caso.saludEstado && caso.saludEstado !== salud.estado && (salud.estado === "riesgo" || salud.estado === "detenido"))
      await registrar(caso.id, "salud", `El caso pasó a «${ETIQUETA_SALUD[salud.estado as EstadoSalud]}».`);

    if (caso.estado === "verificacion") {
      if (caso.verificarEn === hoy && usuario.recibirCorreos && await encolar({
        clave: `verificar:${caso.id}:${hoy}`, para: usuario.email, usuarioId: usuario.id, casoId: caso.id,
        asunto: `¿Sigue resuelto? ${caso.titulo}`,
        html: plantilla("Pasaron 30 días. ¿Se sostuvo?", `Un problema está resuelto cuando no vuelve. Mide de nuevo tu indicador y cierra «${caso.titulo}».`, { texto: "Verificar", url }),
      })) avisos++;
      continue;
    }

    if (usuario.recibirCorreos) {
      for (const a of avisosDelDia(caso.id, caso.titulo, {
        lineaBase: caso.lineaBase, objetivo: caso.objetivo, fechaInicio: caso.fechaInicio, fechaObjetivo: caso.fechaObjetivo,
        proximaRevision: caso.proximaRevision, ultimaActividad: caso.ultimaActividad, planBActivo: !!caso.planBActivoEn,
      }, ps as PasoSalud[], salud, hoy)) {
        if (await encolar({
          clave: a.clave, para: usuario.email, usuarioId: usuario.id, casoId: caso.id, asunto: a.asunto,
          html: plantilla(a.asunto, a.texto, { texto: "Abrir mi caso", url }),
        })) avisos++;
      }
    }

    if (lunes) {
      const fila = semana.get(usuario.id) ?? { usuario, lineas: [] };
      fila.lineas.push({ titulo: caso.titulo, accion: salud.accion.texto, estado: salud.estado });
      semana.set(usuario.id, fila);
    }

    if (lunes && caso.companeroEmail && caso.companeroToken) {
      if (await encolar({
        clave: `companero-semana:${caso.id}:${hoy}`, para: caso.companeroEmail, casoId: caso.id,
        asunto: `Cómo va ${usuario.nombre}: ${ETIQUETA_SALUD[salud.estado]}`,
        html: plantilla(`Cómo va ${usuario.nombre}`, `Estado: ${ETIQUETA_SALUD[salud.estado]}. Pasos hechos: ${salud.avancePasos}%. ${salud.estado === "en_ruta" ? "Va bien: un mensaje de apoyo suma." : "Es un buen momento para preguntarle cómo va."}`,
          { texto: "Ver el avance", url: `${appUrl()}/companero/${caso.companeroToken}` }),
      })) avisos++;
    }
  }

  for (const { usuario, lineas } of semana.values()) {
    if (!usuario.recibirCorreos) continue;
    const r = resumenSemanal(lineas);
    if (await encolar({
      clave: `semana:${usuario.id}:${hoy}`, para: usuario.email, usuarioId: usuario.id,
      asunto: r.asunto, html: plantilla(r.asunto, r.texto, { texto: "Ver mis casos", url: `${appUrl()}/app` }),
    })) avisos++;
  }

  const envio = await enviarPendientes(200);
  return { casos: activos.length, avisos, ...envio };
}


