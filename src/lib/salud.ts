/**
 * Motor de seguimiento. Función pura: recibe el caso y dice cómo va, por qué y
 * qué hacer ahora. Lo usan las pantallas, el cron y el copiloto, para que los
 * tres cuenten la misma historia.
 */
import { diasEntre, hoyChile, sumarDias } from "./fechas";

export type PasoSalud = {
  id: string;
  titulo: string;
  prioridad: string;
  orden: number;
  estado: string;
  venceEn: string;
  venceOriginal: string;
  reprogramaciones: number;
  dependeDe: string | null;
  completadoEn: Date | null;
};

export type RevisionSalud = { fecha: string; valor: number | null; confianza: number };

export type CasoSalud = {
  lineaBase: number | null;
  objetivo: number | null;
  fechaInicio: string | null;
  fechaObjetivo: string | null;
  proximaRevision: string | null;
  ultimaActividad: Date;
  planBActivo: boolean;
};

export type EstadoSalud = "en_ruta" | "atencion" | "riesgo" | "detenido";

export type Motivo = { peso: "bien" | "ojo" | "mal"; texto: string };

export type Accion =
  | { tipo: "revision"; texto: string }
  | { tipo: "paso"; texto: string; pasoId: string }
  | { tipo: "destrabar"; texto: string; pasoId: string }
  | { tipo: "plan_b"; texto: string }
  | { tipo: "cerrar"; texto: string }
  | { tipo: "replanificar"; texto: string };

export type Salud = {
  puntaje: number;
  estado: EstadoSalud;
  motivos: Motivo[];
  accion: Accion;
  avancePasos: number; // 0–100 hechos sobre el total vigente
  avanceEsperado: number; // 0–100 según el calendario
  avanceIndicador: number | null; // 0–100 del camino de línea base a objetivo
  indicadorEsperado: number | null;
  proyeccion: string | null; // fecha estimada de término al ritmo real
  sugerirPlanB: boolean;
};

const ORDEN_PRIORIDAD: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4 };
const limitar = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n));

const diasSinActividad = (c: CasoSalud, hoy: string) => Math.max(0, diasEntre(hoyChile(c.ultimaActividad), hoy));

export function vigentes(pasos: PasoSalud[]) {
  return pasos.filter((p) => p.estado !== "descartado");
}

/**
 * El siguiente paso que se puede hacer ahora: sin dependencias pendientes,
 * primero la prioridad más alta y, dentro de ella, lo que vence antes.
 * Una prioridad E nunca es «lo siguiente»: E es eliminar.
 */
export function siguientePaso(pasos: PasoSalud[]): PasoSalud | null {
  const hechos = new Set(pasos.filter((p) => p.estado === "hecho" || p.estado === "descartado").map((p) => p.id));
  return vigentes(pasos)
    .filter((p) => p.estado !== "hecho" && p.estado !== "bloqueado" && p.prioridad !== "E")
    .filter((p) => !p.dependeDe || hechos.has(p.dependeDe))
    .sort((a, b) =>
      ORDEN_PRIORIDAD[a.prioridad] - ORDEN_PRIORIDAD[b.prioridad]
      || a.venceEn.localeCompare(b.venceEn)
      || a.orden - b.orden)[0] ?? null;
}

/** % del camino recorrido en el indicador; sirve para metas que suben o bajan. */
export function avanceIndicador(base: number, objetivo: number, valor: number): number {
  if (base === objetivo) return valor === objetivo ? 100 : 0;
  return limitar(((valor - base) / (objetivo - base)) * 100);
}

export function calcularSalud(caso: CasoSalud, pasos: PasoSalud[], revisiones: RevisionSalud[], hoy: string): Salud {
  const activos = vigentes(pasos).filter((p) => p.prioridad !== "E");
  const hechos = activos.filter((p) => p.estado === "hecho");
  const pendientes = activos.filter((p) => p.estado !== "hecho");
  const vencidos = pendientes.filter((p) => p.venceEn < hoy);
  const vencidosA = vencidos.filter((p) => p.prioridad === "A");
  const bloqueados = pendientes.filter((p) => p.estado === "bloqueado");

  const avancePasos = activos.length ? Math.round((hechos.length / activos.length) * 100) : 0;

  // Lo que debería estar hecho a hoy según las fechas ORIGINALES: reprogramar no mejora la nota.
  const avanceEsperado = activos.length
    ? Math.round((activos.filter((p) => p.venceOriginal < hoy).length / activos.length) * 100)
    : 0;

  const motivos: Motivo[] = [];
  let puntaje = 100;

  // 1. Calendario (hasta -40)
  const atraso = Math.max(0, avanceEsperado - avancePasos);
  puntaje -= Math.min(40, atraso * 0.8);
  if (atraso >= 15) motivos.push({ peso: atraso >= 35 ? "mal" : "ojo", texto: `Vas ${atraso} puntos detrás del calendario original.` });
  else if (activos.length && avancePasos >= avanceEsperado && hechos.length) motivos.push({ peso: "bien", texto: "Vas al día con tus pasos." });

  // 2. Vencidos (hasta -30): pesan más los de prioridad A
  puntaje -= Math.min(30, vencidosA.length * 15 + (vencidos.length - vencidosA.length) * 5);
  if (vencidosA.length) motivos.push({ peso: "mal", texto: `${vencidosA.length === 1 ? "Un paso clave está vencido" : `${vencidosA.length} pasos clave están vencidos`}.` });
  else if (vencidos.length) motivos.push({ peso: "ojo", texto: `${vencidos.length === 1 ? "Un paso está vencido" : `${vencidos.length} pasos están vencidos`}.` });

  // 3. Bloqueos (hasta -15)
  puntaje -= Math.min(15, bloqueados.length * 8);
  if (bloqueados.length) motivos.push({ peso: "ojo", texto: `${bloqueados.length === 1 ? "Tienes un paso bloqueado" : `Tienes ${bloqueados.length} pasos bloqueados`}.` });

  // 4. Pasos que se postergan una y otra vez: señal de que el paso está mal planteado
  const postergados = pendientes.filter((p) => p.reprogramaciones >= 2);
  puntaje -= Math.min(10, postergados.length * 4);
  if (postergados.length) motivos.push({ peso: "ojo", texto: `«${postergados[0].titulo}» ya se postergó ${postergados[0].reprogramaciones} veces.` });

  // 5. Indicador (hasta -25): el plan puede cumplirse y el problema seguir igual
  const conValor = revisiones.filter((r) => r.valor !== null).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const ultimaMedicion = conValor.at(-1);
  let avanceInd: number | null = null;
  let indEsperado: number | null = null;
  const hayMeta = caso.lineaBase !== null && caso.objetivo !== null && caso.fechaInicio && caso.fechaObjetivo;
  if (hayMeta) {
    const total = Math.max(1, diasEntre(caso.fechaInicio!, caso.fechaObjetivo!));
    indEsperado = Math.round(limitar((diasEntre(caso.fechaInicio!, hoy) / total) * 100));
    if (ultimaMedicion) {
      avanceInd = Math.round(avanceIndicador(caso.lineaBase!, caso.objetivo!, ultimaMedicion.valor!));
      const brecha = indEsperado - avanceInd;
      if (brecha > 0) puntaje -= Math.min(25, brecha * 0.5);
      if (brecha >= 25) motivos.push({ peso: "mal", texto: "Tus pasos avanzan, pero el indicador no se está moviendo al ritmo necesario." });
      else if (avanceInd >= indEsperado && avanceInd > 0) motivos.push({ peso: "bien", texto: "El indicador va a ritmo o mejor." });
    }
  }

  // 6. Confianza: lo que la persona siente que nadie más puede medir (hasta -10)
  const confianzas = [...revisiones].sort((a, b) => a.fecha.localeCompare(b.fecha)).map((r) => r.confianza);
  const ultimaConfianza = confianzas.at(-1);
  if (ultimaConfianza !== undefined && ultimaConfianza <= 2) {
    puntaje -= 10;
    motivos.push({ peso: "ojo", texto: "Tu confianza en lograrlo está baja." });
  }

  // 7. Silencio y revisión atrasada
  const diasSilencio = diasSinActividad(caso, hoy);
  const revisionAtrasada = caso.proximaRevision ? Math.max(0, diasEntre(caso.proximaRevision, hoy)) : 0;
  if (revisionAtrasada > 0) {
    puntaje -= Math.min(15, revisionAtrasada * 2);
    motivos.push({ peso: revisionAtrasada > 7 ? "mal" : "ojo", texto: `Tu revisión está atrasada ${revisionAtrasada} ${revisionAtrasada === 1 ? "día" : "días"}.` });
  }

  puntaje = Math.round(limitar(puntaje));

  let estado: EstadoSalud = puntaje >= 75 ? "en_ruta" : puntaje >= 50 ? "atencion" : "riesgo";
  if (diasSilencio >= 14) {
    estado = "detenido";
    motivos.unshift({ peso: "mal", texto: `Sin movimiento hace ${diasSilencio} días.` });
  }

  // Proyección: al ritmo real de pasos hechos, ¿cuándo se termina?
  let proyeccion: string | null = null;
  if (caso.fechaInicio && hechos.length && pendientes.length) {
    const dias = Math.max(1, diasEntre(caso.fechaInicio, hoy));
    proyeccion = sumarDias(hoy, Math.ceil((pendientes.length / hechos.length) * dias));
  }

  // Dos revisiones seguidas con confianza baja, o pasada la fecha con el indicador lejos.
  const ultimasDos = confianzas.slice(-2);
  const fechaPasada = !!caso.fechaObjetivo && caso.fechaObjetivo < hoy;
  const sugerirPlanB = !caso.planBActivo && (
    (ultimasDos.length === 2 && ultimasDos.every((c) => c <= 2))
    || (estado === "riesgo" && vencidosA.length >= 2)
    || (fechaPasada && avanceInd !== null && avanceInd < 70)
  );

  return {
    puntaje, estado, motivos,
    accion: elegirAccion({ pendientes, activos, avanceInd, revisionAtrasada, sugerirPlanB, pasos, fechaPasada, bloqueados }),
    avancePasos, avanceEsperado,
    avanceIndicador: avanceInd, indicadorEsperado: indEsperado,
    proyeccion, sugerirPlanB,
  };
}

function elegirAccion(c: {
  pendientes: PasoSalud[]; activos: PasoSalud[]; avanceInd: number | null; revisionAtrasada: number;
  sugerirPlanB: boolean; pasos: PasoSalud[]; fechaPasada: boolean; bloqueados: PasoSalud[];
}): Accion {
  if (c.sugerirPlanB) return { tipo: "plan_b", texto: "Evalúa activar tu plan B." };
  if (c.activos.length && !c.pendientes.length) {
    return c.avanceInd !== null && c.avanceInd >= 100
      ? { tipo: "cerrar", texto: "Lograste la meta: pasa a verificar que se sostenga." }
      : { tipo: "replanificar", texto: "Terminaste los pasos y la meta no llega: faltan pasos nuevos." };
  }
  if (c.revisionAtrasada > 0) return { tipo: "revision", texto: "Haz tu revisión pendiente." };
  const sig = siguientePaso(c.pasos);
  if (sig) return { tipo: "paso", texto: sig.titulo, pasoId: sig.id };
  if (c.bloqueados[0]) return { tipo: "destrabar", texto: `Destraba «${c.bloqueados[0].titulo}».`, pasoId: c.bloqueados[0].id };
  return { tipo: "replanificar", texto: "Agrega el próximo paso." };
}

export const ETIQUETA_SALUD: Record<EstadoSalud, string> = {
  en_ruta: "En ruta", atencion: "Atención", riesgo: "En riesgo", detenido: "Detenido",
};

/** Resumen de los lunes: una línea por caso, lo que más necesita atención primero. */
export function resumenSemanal(casos: { titulo: string; accion: string; estado: EstadoSalud }[]) {
  const peso: Record<EstadoSalud, number> = { detenido: 0, riesgo: 1, atencion: 2, en_ruta: 3 };
  const orden = [...casos].sort((a, b) => peso[a.estado] - peso[b.estado]);
  const enRiesgo = casos.filter((c) => c.estado === "riesgo" || c.estado === "detenido").length;
  return {
    asunto: enRiesgo ? `Tu semana: ${enRiesgo === 1 ? "un caso necesita" : `${enRiesgo} casos necesitan`} atención` : "Tu semana: vas en ruta",
    texto: orden.map((c) => `«${c.titulo}» (${ETIQUETA_SALUD[c.estado]}): ${c.accion}`).join(" "),
  };
}

/** Avisos que tocan hoy para un caso. La clave evita repetir el mismo aviso. */
export type Aviso = { clave: string; tipo: string; asunto: string; texto: string };

export function avisosDelDia(casoId: string, titulo: string, caso: CasoSalud, pasos: PasoSalud[], salud: Salud, hoy: string): Aviso[] {
  const a: Aviso[] = [];
  const manana = sumarDias(hoy, 1);

  for (const p of vigentes(pasos)) {
    if (p.estado === "hecho" || p.estado === "bloqueado" || p.prioridad === "E") continue;
    if (p.venceEn === manana)
      a.push({ clave: `paso-manana:${p.id}:${p.venceEn}`, tipo: "paso_manana", asunto: `Mañana vence: ${p.titulo}`, texto: `En «${titulo}», el paso «${p.titulo}» vence mañana.` });
    if (p.venceEn < hoy && diasEntre(p.venceEn, hoy) <= 3 && (p.prioridad === "A" || p.prioridad === "B"))
      a.push({ clave: `paso-vencido:${p.id}:${p.venceEn}`, tipo: "paso_vencido", asunto: `Quedó vencido: ${p.titulo}`, texto: `En «${titulo}» venció «${p.titulo}». Hazlo hoy, bájalo a un paso más chico o reprográmalo con un motivo.` });
  }

  if (caso.proximaRevision === hoy)
    a.push({ clave: `revision:${casoId}:${hoy}`, tipo: "revision", asunto: `Hoy toca revisar: ${titulo}`, texto: "Son cinco minutos: mides el indicador, cuentas qué pasó y te comprometes con lo siguiente." });

  // Por umbral, no por día exacto: si el cron falla un día, el aviso sale al siguiente.
  const silencio = diasSinActividad(caso, hoy);
  const umbral = [30, 14, 7].find((d) => silencio >= d);
  if (umbral)
    a.push({ clave: `silencio:${casoId}:${umbral}:${hoyChile(caso.ultimaActividad)}`, tipo: "silencio", asunto: `¿Seguimos con «${titulo}»?`, texto: `Llevas ${silencio} días sin movimiento. No necesitas ponerte al día: elige el paso más chico que puedas hacer hoy.` });

  if (salud.sugerirPlanB)
    a.push({ clave: `plan-b:${casoId}:${hoy.slice(0, 7)}`, tipo: "plan_b", asunto: `Es momento de mirar tu plan B: ${titulo}`, texto: "Las señales que dejaste escritas están apareciendo. Revisa si conviene activar la alternativa." });

  return a;
}
