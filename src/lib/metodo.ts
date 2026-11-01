/**
 * El método de 10 etapas. Es una síntesis propia: los principios vienen de la
 * literatura de resolución de problemas (ver docs/METODO.md); los textos y el
 * orden son del producto.
 *
 * Todo lo que se decide aquí es puro y sin base de datos, para poder probarlo.
 */

export type EstadoAfirmacion = "hecho" | "suposicion";

export type Causa = {
  id: string;
  texto: string;
  evidencia: EstadoAfirmacion;
  porQue: string[];
  esRaiz: boolean;
};

export type Idea = { id: string; texto: string; origen: "persona" | "copiloto" | "base" };

export type Criterio = { id: string; nombre: string; peso: number };

export type Opcion = {
  ideaId: string;
  notas: Record<string, number>; // criterioId → 1 a 5
  favor: string;
  contra: string;
};

export type Riesgo = { id: string; texto: string; senal: string; respuesta: string };

export type Trabajo = {
  relato: string;
  situacion: string;
  importancia: string;
  definiciones: string[];
  definicionFinal: string;
  comoSabre: string;
  causas: Causa[];
  empezarDeCero: string;
  ideas: Idea[];
  criterios: Criterio[];
  opciones: Opcion[];
  decisionIdeaId: string | null;
  razonDecision: string;
  estrategia: string;
  riesgos: Riesgo[];
  planB: string;
  disparadorPlanB: string;
  responsable: string;
  compromiso: string;
  /** Última respuesta del copiloto por tarea: pagada, no se pierde al recargar. */
  copiloto: Record<string, unknown>;
};

export const IDEA_NO_HACER_NADA = "no-hacer-nada";

export const trabajoInicial = (): Trabajo => ({
  relato: "",
  situacion: "",
  importancia: "",
  definiciones: [],
  definicionFinal: "",
  comoSabre: "",
  causas: [],
  empezarDeCero: "",
  ideas: [{ id: IDEA_NO_HACER_NADA, texto: "No hacer nada y aceptar lo que venga", origen: "base" }],
  criterios: [
    { id: "impacto", nombre: "Impacto en la causa raíz", peso: 5 },
    { id: "viable", nombre: "Lo puedo hacer con lo que tengo", peso: 4 },
    { id: "rapido", nombre: "Velocidad del resultado", peso: 3 },
    { id: "riesgo", nombre: "Bajo riesgo", peso: 3 },
  ],
  opciones: [],
  decisionIdeaId: null,
  razonDecision: "",
  estrategia: "",
  riesgos: [],
  planB: "",
  disparadorPlanB: "",
  responsable: "",
  compromiso: "",
  copiloto: {},
});

export const FASES = [
  { nombre: "Entender", etapas: [1, 2, 3] },
  { nombre: "Crear", etapas: [4, 5, 6] },
  { nombre: "Ejecutar", etapas: [7, 8, 9, 10] },
] as const;

export const ETAPAS = [
  { n: 1, slug: "encuadre", nombre: "Encuadre", pregunta: "¿Qué está pasando, sin dramatizar?", promesa: "Pasas de un problema que pesa a una situación que se puede trabajar." },
  { n: 2, slug: "definicion", nombre: "Definición", pregunta: "¿Qué es exactamente? ¿Y qué más podría ser?", promesa: "Una definición por escrito, con varias lecturas antes de elegir." },
  { n: 3, slug: "causas", nombre: "Causas", pregunta: "¿Cómo llegó a pasar esto?", promesa: "Separas hechos de suposiciones y llegas a la causa raíz." },
  { n: 4, slug: "ideas", nombre: "Veinte ideas", pregunta: "¿Cuáles son todas las salidas posibles?", promesa: "Primero cantidad, sin juzgar. Las mejores llegan después de la décima." },
  { n: 5, slug: "decision", nombre: "Decisión", pregunta: "¿Cuál es la mejor salida y por qué?", promesa: "Comparas opciones con criterios explícitos y te quedas con una." },
  { n: 6, slug: "plan-b", nombre: "Plan B", pregunta: "¿Qué harás si sale mal?", promesa: "Anticipas lo peor y dejas escrita la señal que activa la alternativa." },
  { n: 7, slug: "meta", nombre: "Meta y plazo", pregunta: "¿Cómo sabrás que se resolvió, y para cuándo?", promesa: "Un indicador, una línea base, un objetivo y una fecha." },
  { n: 8, slug: "plan", nombre: "Plan de pasos", pregunta: "¿Qué pasos concretos llevan hasta ahí?", promesa: "Pasos con prioridad, fecha y una definición clara de hecho." },
  { n: 9, slug: "compromiso", nombre: "Compromiso", pregunta: "¿Quién responde por esto?", promesa: "Te haces cargo por escrito y eliges a quién le rindes cuentas." },
  { n: 10, slug: "seguimiento", nombre: "Seguimiento", pregunta: "¿Va funcionando?", promesa: "Mides, revisas, corriges y no cierras hasta verificar que no volvió." },
] as const;

export const CATEGORIAS = { personal: "Personal", trabajo: "Trabajo o negocio", proyecto: "Proyecto nuevo" } as const;
export const URGENCIAS = {
  baja: { nombre: "Baja", detalle: "Puede esperar", ritmoDias: 14 },
  media: { nombre: "Media", detalle: "Pide atención pronto", ritmoDias: 7 },
  alta: { nombre: "Alta", detalle: "Hay que actuar ya", ritmoDias: 3 },
} as const;
export type Categoria = keyof typeof CATEGORIAS;
export type Urgencia = keyof typeof URGENCIAS;

export const ETAPA_GRATIS = 1;
export const MIN_DEFINICIONES = 3;
export const MIN_IDEAS = 20;
export const MIN_IDEAS_PROPIAS_PARA_COPILOTO = 5;
export const DIAS_VERIFICACION = 30;

export type Falta = { campo: string; mensaje: string };

const lleno = (s: string, min = 1) => s.trim().length >= min;

export const ideasPropias = (t: Trabajo) => t.ideas.filter((i) => i.origen === "persona").length;

/** Puntaje ponderado de una opción, normalizado a 0–100. */
export function puntajeOpcion(opcion: Opcion, criterios: Criterio[]): number {
  const pesoTotal = criterios.reduce((s, c) => s + c.peso, 0);
  if (!pesoTotal) return 0;
  const suma = criterios.reduce((s, c) => s + c.peso * (opcion.notas[c.id] ?? 0), 0);
  return Math.round((suma / (pesoTotal * 5)) * 100);
}

/** Lo que falta para salir de una etapa de método. Vacío = puede avanzar. */
export function faltantes(etapa: number, t: Trabajo): Falta[] {
  const f: Falta[] = [];
  switch (etapa) {
    case 1:
      if (!lleno(t.relato, 30)) f.push({ campo: "relato", mensaje: "Cuenta lo que pasa con un poco más de detalle." });
      if (!lleno(t.situacion, 10)) f.push({ campo: "situacion", mensaje: "Resume en una sola frase lo que está pasando." });
      if (!lleno(t.importancia, 10)) f.push({ campo: "importancia", mensaje: "Di qué pierdes si esto sigue igual." });
      break;
    case 2:
      if (t.definiciones.filter((d) => lleno(d)).length < MIN_DEFINICIONES)
        f.push({ campo: "definiciones", mensaje: `Escribe al menos ${MIN_DEFINICIONES} formas de definirlo.` });
      if (!lleno(t.definicionFinal, 10)) f.push({ campo: "definicionFinal", mensaje: "Elige la definición con la que vas a trabajar." });
      if (!lleno(t.comoSabre, 10)) f.push({ campo: "comoSabre", mensaje: "Di cómo se vería resuelto." });
      break;
    case 3:
      if (t.causas.length < 3) f.push({ campo: "causas", mensaje: "Anota al menos 3 causas posibles." });
      if (!t.causas.some((c) => c.esRaiz)) f.push({ campo: "causas", mensaje: "Marca cuál crees que es la causa raíz." });
      if (t.causas.some((c) => c.esRaiz && c.porQue.filter((p) => lleno(p)).length < 2))
        f.push({ campo: "causas", mensaje: "Pregúntate «¿por qué?» al menos dos veces sobre la causa raíz." });
      break;
    case 4:
      if (t.ideas.length < MIN_IDEAS) f.push({ campo: "ideas", mensaje: `Llevas ${t.ideas.length} de ${MIN_IDEAS} ideas.` });
      if (!lleno(t.empezarDeCero, 5)) f.push({ campo: "empezarDeCero", mensaje: "Responde la pregunta de empezar de cero." });
      break;
    case 5:
      if (t.opciones.length < 3) f.push({ campo: "opciones", mensaje: "Compara al menos 3 opciones." });
      if (!t.decisionIdeaId) f.push({ campo: "decision", mensaje: "Elige una opción." });
      if (t.decisionIdeaId === IDEA_NO_HACER_NADA && !lleno(t.razonDecision, 20))
        f.push({ campo: "razonDecision", mensaje: "No hacer nada también es decidir: explica por qué." });
      if (!lleno(t.razonDecision, 10)) f.push({ campo: "razonDecision", mensaje: "Escribe por qué elegiste esa opción." });
      break;
    case 6:
      if (t.riesgos.length < 2) f.push({ campo: "riesgos", mensaje: "Anticipa al menos 2 cosas que podrían salir mal." });
      if (!lleno(t.planB, 10)) f.push({ campo: "planB", mensaje: "Escribe tu plan B." });
      if (!lleno(t.disparadorPlanB, 5)) f.push({ campo: "disparadorPlanB", mensaje: "Di qué señal concreta activa el plan B." });
      break;
    case 8:
      if (!lleno(t.estrategia, 15)) f.push({ campo: "estrategia", mensaje: "Resume tu estrategia antes de seguir." });
      break;
  }
  return f;
}
