/**
 * El método. La persona cuenta su problema una vez; la IA hace el análisis de
 * las etapas (definir, buscar causas, generar salidas, evaluar, anticipar,
 * planificar) y la persona elige en cuatro pasos. Ver docs/METODO.md.
 *
 * Puro y sin base de datos, para poder probarlo.
 */

export type EstadoAfirmacion = "hecho" | "suposicion";

export type Causa = { id: string; texto: string; evidencia: EstadoAfirmacion; porQue: string[]; esRaiz: boolean };
export type Idea = { id: string; texto: string; origen: "persona" | "copiloto" };
export type Riesgo = { id: string; texto: string; senal: string; respuesta: string };

export type Trabajo = {
  relato: string;
  situacion: string;
  importancia: string;
  definicionFinal: string;
  causas: Causa[];
  ideas: Idea[];
  decisionIdeaId: string | null;
  razonDecision: string;
  estrategia: string;
  riesgos: Riesgo[];
  planB: string;
  disparadorPlanB: string;
  responsable: string;
  compromiso: string;
  /** Lo que propuso la IA en cada momento. Se paga: no se pierde al recargar. */
  copiloto: Record<string, unknown>;
};

export const trabajoInicial = (): Trabajo => ({
  relato: "", situacion: "", importancia: "", definicionFinal: "", causas: [], ideas: [],
  decisionIdeaId: null, razonDecision: "", estrategia: "", riesgos: [], planB: "", disparadorPlanB: "",
  responsable: "", compromiso: "", copiloto: {},
});

export const PASOS = [
  { n: 1, nombre: "Problema", pregunta: "¿Cuál describe mejor lo que te pasa?", ayuda: "Leí lo que contaste. Elige la que más te calce." },
  { n: 2, nombre: "Causa", pregunta: "¿Dónde crees que está la causa?", ayuda: "Elige la que más te suene. Después la comprobamos." },
  { n: 3, nombre: "Salida", pregunta: "¿Cuál salida te hace más sentido?", ayuda: "Analicé veinte ideas y estas son las mejores para tu caso." },
  { n: 4, nombre: "Plan", pregunta: "Este es tu plan", ayuda: "Revísalo y ajusta lo que quieras. Todo se puede cambiar después." },
] as const;

export const PASO_GRATIS = 2;
export const DIAS_VERIFICACION = 30;

export const CATEGORIAS = { personal: "Personal", trabajo: "Trabajo o negocio", proyecto: "Proyecto nuevo" } as const;
export const URGENCIAS = {
  baja: { nombre: "Baja", ritmoDias: 14 },
  media: { nombre: "Media", ritmoDias: 7 },
  alta: { nombre: "Alta", ritmoDias: 3 },
} as const;
export type Categoria = keyof typeof CATEGORIAS;
export type Urgencia = keyof typeof URGENCIAS;

export const causaRaiz = (t: Trabajo) => t.causas.find((c) => c.esRaiz) ?? null;
export const salidaElegida = (t: Trabajo) => t.ideas.find((i) => i.id === t.decisionIdeaId) ?? null;

export type NotasFinalista = { impacto: number; viable: number; rapido: number; riesgo: number };
const PESOS: NotasFinalista = { impacto: 5, viable: 4, rapido: 3, riesgo: 3 };

/** Puntaje ponderado de una salida, normalizado a 0–100. */
export function puntajeSalida(n: NotasFinalista): number {
  const claves = Object.keys(PESOS) as (keyof NotasFinalista)[];
  const total = claves.reduce((s, k) => s + PESOS[k], 0);
  const suma = claves.reduce((s, k) => s + PESOS[k] * Math.min(5, Math.max(0, n[k])), 0);
  return Math.round((suma / (total * 5)) * 100);
}
