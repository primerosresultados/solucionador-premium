import assert from "node:assert/strict";
import { test } from "node:test";
import { avanceIndicador, avisosDelDia, calcularSalud, resumenSemanal, siguientePaso, type CasoSalud, type PasoSalud } from "./salud";
import { causaRaiz, puntajeSalida, salidaElegida, trabajoInicial } from "./metodo";

const caso = (c: Partial<CasoSalud> = {}): CasoSalud => ({
  lineaBase: 100, objetivo: 0, fechaInicio: "2026-10-01", fechaObjetivo: "2026-11-30", proximaRevision: "2026-11-05",
  ultimaActividad: new Date("2026-10-30T12:00:00Z"), planBActivo: false, ...c,
});
const paso = (p: Partial<PasoSalud> & { id: string }): PasoSalud => ({
  titulo: p.id, prioridad: "B", orden: 1, estado: "pendiente", venceEn: "2026-11-10", venceOriginal: "2026-11-10",
  reprogramaciones: 0, dependeDe: null, completadoEn: null, ...p,
});
const HOY = "2026-10-31";

test("caso al día queda en ruta y propone el siguiente paso", () => {
  const s = calcularSalud(caso(), [paso({ id: "a", prioridad: "A" }), paso({ id: "b" })], [], HOY);
  assert.equal(s.estado, "en_ruta");
  assert.deepEqual(s.accion, { tipo: "paso", texto: "a", pasoId: "a" });
});

test("reprogramar no mejora la nota: el atraso se mide contra la fecha original", () => {
  const atrasado = paso({ id: "a", prioridad: "A", venceEn: "2026-11-20", venceOriginal: "2026-10-10", reprogramaciones: 1 });
  const s = calcularSalud(caso(), [atrasado, paso({ id: "b", venceOriginal: "2026-10-12", venceEn: "2026-11-21" })], [], HOY);
  assert.equal(s.avanceEsperado, 100);
  assert.ok(s.puntaje <= 60, `puntaje ${s.puntaje}`);
});

test("pasos cumplidos con el indicador quieto bajan la salud y lo dicen", () => {
  const hechos = [paso({ id: "a", estado: "hecho", venceOriginal: "2026-10-05" }), paso({ id: "b" })];
  const quieto = [{ fecha: "2026-10-30", valor: 100, confianza: 4 }];
  const s = calcularSalud(caso({ fechaObjetivo: "2026-11-05" }), hechos, quieto, HOY);
  assert.ok(s.motivos.some((m) => m.texto.includes("indicador no se está moviendo")));
  assert.ok(s.puntaje < 100);
});

test("el indicador sirve para metas que suben y que bajan", () => {
  assert.equal(avanceIndicador(100, 0, 25), 75);
  assert.equal(avanceIndicador(10, 50, 30), 50);
  assert.equal(avanceIndicador(10, 50, 5), 0);
  assert.equal(avanceIndicador(10, 50, 90), 100);
});

test("el silencio largo marca el caso como detenido", () => {
  const s = calcularSalud(caso({ ultimaActividad: new Date("2026-10-10T12:00:00Z") }), [paso({ id: "a" })], [], HOY);
  assert.equal(s.estado, "detenido");
});

test("siguiente paso respeta dependencias, prioridad y excluye E", () => {
  const ps = [
    paso({ id: "x", prioridad: "E", venceEn: "2026-11-01" }),
    paso({ id: "a", prioridad: "A", dependeDe: "c" }),
    paso({ id: "b", prioridad: "C" }),
    paso({ id: "c", prioridad: "B" }),
  ];
  assert.equal(siguientePaso(ps)?.id, "c");
  assert.equal(siguientePaso(ps.map((p) => p.id === "c" ? { ...p, estado: "hecho" } : p))?.id, "a");
});

test("sin pasos activos utilizables, la acción no se inventa", () => {
  const s = calcularSalud(caso(), [paso({ id: "a", estado: "bloqueado" })], [], HOY);
  assert.deepEqual(s.accion, { tipo: "destrabar", texto: "Destraba «a».", pasoId: "a" });
});

test("pasos terminados: cerrar solo si el indicador llegó", () => {
  const hechos = [paso({ id: "a", estado: "hecho" })];
  assert.equal(calcularSalud(caso(), hechos, [{ fecha: HOY, valor: 0, confianza: 5 }], HOY).accion.tipo, "cerrar");
  assert.equal(calcularSalud(caso(), hechos, [{ fecha: HOY, valor: 60, confianza: 5 }], HOY).accion.tipo, "replanificar");
});

test("dos revisiones con confianza baja sugieren plan B", () => {
  const rs = [{ fecha: "2026-10-20", valor: 90, confianza: 2 }, { fecha: "2026-10-27", valor: 90, confianza: 1 }];
  const s = calcularSalud(caso(), [paso({ id: "a" })], rs, HOY);
  assert.equal(s.sugerirPlanB, true);
  assert.equal(calcularSalud(caso({ planBActivo: true }), [paso({ id: "a" })], rs, HOY).sugerirPlanB, false);
});

test("un paso sin dependencia pendiente vencido ayer avisa una vez con clave estable", () => {
  const ps = [paso({ id: "a", prioridad: "A", venceEn: "2026-10-30" })];
  const s = calcularSalud(caso(), ps, [], HOY);
  const uno = avisosDelDia("c", "T", caso(), ps, s, HOY);
  const dos = avisosDelDia("c", "T", caso(), ps, s, HOY);
  assert.deepEqual(uno.map((a) => a.clave), dos.map((a) => a.clave));
  assert.equal(uno.filter((a) => a.tipo === "paso_vencido").length, 1);
  assert.equal(avisosDelDia("c", "T", caso(), ps, s, "2026-11-03").filter((a) => a.tipo === "paso_vencido").length, 0);
});

test("el aviso de silencio no se pierde si el cron falla justo ese día", () => {
  const c = caso({ ultimaActividad: new Date("2026-10-20T12:00:00Z") });
  const ps = [paso({ id: "a" })];
  const s = calcularSalud(c, ps, [], HOY);
  const aviso = avisosDelDia("c", "T", c, ps, s, HOY).find((a) => a.tipo === "silencio");
  assert.equal(aviso?.clave, "silencio:c:7:2026-10-20");
});

test("el resumen semanal parte por lo que necesita atención", () => {
  const r = resumenSemanal([
    { titulo: "Bien", accion: "seguir", estado: "en_ruta" },
    { titulo: "Mal", accion: "retomar", estado: "detenido" },
  ]);
  assert.match(r.asunto, /un caso necesita atención/);
  assert.ok(r.texto.startsWith("«Mal»"));
  assert.equal(resumenSemanal([{ titulo: "Bien", accion: "seguir", estado: "en_ruta" }]).asunto, "Tu semana: vas en ruta");
});

test("el puntaje de una salida pondera y normaliza", () => {
  assert.equal(puntajeSalida({ impacto: 5, viable: 5, rapido: 5, riesgo: 5 }), 100);
  assert.equal(puntajeSalida({ impacto: 5, viable: 1, rapido: 1, riesgo: 1 }), 47);
  assert.equal(puntajeSalida({ impacto: 9, viable: 5, rapido: 5, riesgo: 5 }), 100);
});

test("la causa raíz y la salida elegidas se encuentran en el trabajo", () => {
  const t = trabajoInicial();
  assert.equal(causaRaiz(t), null);
  t.causas = [{ id: "a", texto: "x", evidencia: "hecho", porQue: [], esRaiz: true }];
  assert.equal(causaRaiz(t)?.id, "a");
  t.ideas = [{ id: "i", texto: "y", origen: "copiloto" }];
  t.decisionIdeaId = "i";
  assert.equal(salidaElegida(t)?.texto, "y");
});
