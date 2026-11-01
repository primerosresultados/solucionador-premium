// Arma qa/flujo.pdf con las capturas del QA, una pantalla por página, con su explicación.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT ?? "playwright");

const PANTALLAS = [
  ["01-inicio", "Portada", "Lo primero que ve el visitante. Escribe su problema aquí mismo."],
  ["00-nuevo", "Abrir el caso", "Después de crear la cuenta, su texto sigue ahí. Elige tipo y urgencia."],
  ["02-etapa1", "Etapa 1 · Encuadre (gratis)", "El copiloto convierte el relato en una situación neutra."],
  ["03-comprar", "Pago", "Aquí se decide si sigue. Con Flow, $14.990 o $34.990."],
  ["04-pagado", "Pago recibido", "El crédito se aplica solo y el caso se abre."],
  ["05-etapa2", "Etapa 2 · Definición", "Varias lecturas del problema y la IA las cuestiona."],
  ["06-etapa3", "Etapa 3 · Causas", "Hechos o suposiciones, y la causa raíz con sus por qué."],
  ["07-etapa4", "Etapa 4 · Veinte ideas", "La IA entra después de las primeras cinco propias."],
  ["08-etapa5", "Etapa 5 · Decisión", "Comparación con puntaje y abogado del diablo."],
  ["09-etapa6", "Etapa 6 · Plan B", "Riesgos, señales y qué activa la alternativa."],
  ["10-etapa7", "Etapa 7 · Meta y plazo", "Un número, una línea base, un objetivo y una fecha."],
  ["11-etapa8", "Etapa 8 · Plan de pasos", "Estrategia, pasos con prioridad A-E y fechas."],
  ["12-etapa9", "Etapa 9 · Compromiso", "Se firma, se elige el ritmo y un compañero opcional."],
  ["13-seguimiento-inicio", "Etapa 10 · Seguimiento", "Una sola acción ahora, salud, indicador y plan."],
  ["14-hoja-paso", "Completar un paso", "Hoja inferior para marcar hecho, bloquear o mover."],
  ["15-destrabar", "Destrabar", "Si un paso se traba, la IA busca qué lo frena."],
  ["16-revision-analisis", "Revisión", "Mide el indicador y recibe un solo ajuste."],
  ["17-seguimiento-tiempo", "Línea de tiempo", "El plan completo, con hoy marcado."],
  ["19-resuelto", "Caso resuelto", "Solo se cierra tras 30 días, con lo aprendido."],
  ["18-companero", "Vista del compañero", "Ve avance general, nunca lo que escribió la persona."],
  ["20-inicio-app", "Mis casos", "El panel de la persona, con métricas reales."],
  ["21-ajustes", "Ajustes", "Avisos, descarga de datos y eliminar cuenta."],
  ["22-admin", "Panel de administración", "Ventas, costo de IA y casos en problemas."],
];
const alto = (f) => { const b = readFileSync(f); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
const paginas = PANTALLAS.map(([a, t, d], i) => {
  const f = `qa/capturas/${a}.png`, [w, h] = alto(f), ancho = Math.min(w, 1000), H = Math.round(h * ancho / w) + 170;
  return { i, t, d, ancho: ancho + 80, H, src: `data:image/png;base64,${readFileSync(f).toString("base64")}`, img: ancho };
});
const html = `<!doctype html><meta charset=utf-8><style>
body{margin:0;font-family:-apple-system,Helvetica,Arial,sans-serif;color:#15171c}
${paginas.map((p) => `@page p${p.i}{size:${p.ancho}px ${p.H}px;margin:0}`).join("")}
section{box-sizing:border-box;padding:28px 40px 0;break-after:page;background:#f3f2ee}
h1{font-size:24px;margin:0;font-weight:600}p{margin:6px 0 18px;font-size:15px;color:#4a4e57;line-height:1.35}
img{display:block;border-radius:12px}</style>
${paginas.map((p) => `<section style="page:p${p.i};height:${p.H}px"><h1>${p.t}</h1><p>${p.d}</p><img src="${p.src}" width="${p.img}"></section>`).join("")}`;
const b = await chromium.launch();
const pg = await b.newPage();
await pg.setContent(html, { waitUntil: "load" });
await pg.pdf({ path: "qa/flujo.pdf", preferCSSPageSize: true, printBackground: true });
await b.close();
console.log("qa/flujo.pdf");
