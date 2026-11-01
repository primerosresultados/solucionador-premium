// Flow y Anthropic falsos para QA: la app corre su código real contra esto.
// Valida lo que un servidor real rechazaría (firma de Flow, forma del pedido a Claude).
import { createHmac } from "node:crypto";
import http from "node:http";

const PUERTO = Number(process.env.PUERTO ?? 4599);
const SECRETO = process.env.FLOW_SECRET_KEY ?? "secreto-falso";
const pagos = new Map();
let ultimoClaude = null;
let modoClaude = "normal";
let n = 0;

const ideas = (k) => Array.from({ length: k }, (_, i) => ({ texto: `Idea del copiloto ${i + 1}`, angulo: "Invertir el problema" }));
const RESPUESTAS = {
  encuadrar: { situacion_neutra: "Mi negocio vende, pero a fin de mes no queda dinero disponible.", lecturas: ["Es un problema de márgenes", "Es un problema de orden de caja", "Es un problema de precios"], preguntas: ["¿Sabes cuánto ganas por venta?", "¿Mezclas cuentas personales y del negocio?"], alerta_cuidado: false },
  definir: { critica: "Tu definición describe un síntoma. Falta decir qué parte depende de ti.", definiciones: ["¿Cómo puedo saber el margen real de cada venta?", "¿Cómo separo la caja del negocio de la mía?", "¿Cómo subo el precio sin perder clientes?", "¿Cómo bajo los gastos fijos?"], como_se_veria: "Cada mes retiro un sueldo fijo y queda un excedente.", alerta_cuidado: false },
  causas: { causas: [{ texto: "Los precios no se actualizan hace dos años", tipo: "suposicion", como_verificar: "Compara tu lista con la de hace dos años" }, { texto: "Hay retiros personales sin registro", tipo: "hecho", como_verificar: "Revisa la cartola del último mes" }, { texto: "Los descuentos no se controlan", tipo: "suposicion", como_verificar: "Suma los descuentos de un mes" }, { texto: "Los costos subieron sin notarlo", tipo: "suposicion", como_verificar: "Compara tres facturas" }], pregunta_clave: "¿Cuánto retiras tú antes de saber si hubo ganancia?", alerta_cuidado: false },
  ideas: { ideas: ideas(12), alerta_cuidado: false },
  desafiar: { debilidades: ["Podría bajar la demanda", "Requiere disciplina mensual", "No resuelve los costos"], supuesto_critico: "Tus clientes aceptarán un alza del 8%.", como_probarlo: "Prueba el alza con 10 clientes esta semana.", mejora: "Agrega un paquete de mayor valor.", alerta_cuidado: false },
  premortem: { riesgos: [{ texto: "Se pierden clientes por el alza", senal: "Caen las ventas 15% en dos semanas", respuesta: "Ofrecer paquete de menor precio" }, { texto: "Vuelvo a mezclar cuentas", senal: "Un retiro sin registrar", respuesta: "Bloquear la tarjeta del negocio" }, { texto: "Falta caja en temporada baja", senal: "Saldo bajo el mínimo", respuesta: "Reservar 10% de cada venta" }], plan_b: "Reducir la carta a los 5 productos con mejor margen.", disparador: "Si al 30 de diciembre el margen sigue bajo 12%.", alerta_cuidado: false },
  meta: { indicador: "Margen mensual del negocio", unidad: "%", como_medir: "Ganancia dividida por ventas del mes", plazo_dias: 90, razon: "Mide el resultado y no el esfuerzo.", alerta_cuidado: false },
  plan: { pasos: [
    { titulo: "Separar la cuenta del negocio de la personal", criterio_hecho: "Cuenta nueva abierta y retiros solo por sueldo", prioridad: "A", dias_desde_hoy: 3, depende_del_paso: null },
    { titulo: "Calcular el costo real de los 10 productos principales", criterio_hecho: "Planilla con costo por producto", prioridad: "A", dias_desde_hoy: 10, depende_del_paso: null },
    { titulo: "Subir precios en los productos bajo el margen mínimo", criterio_hecho: "Lista de precios publicada", prioridad: "A", dias_desde_hoy: 20, depende_del_paso: 2 },
    { titulo: "Eliminar los descuentos no autorizados", criterio_hecho: "Regla escrita y comunicada", prioridad: "B", dias_desde_hoy: 25, depende_del_paso: null },
    { titulo: "Renegociar con los dos proveedores principales", criterio_hecho: "Nuevas condiciones por escrito", prioridad: "B", dias_desde_hoy: 40, depende_del_paso: null },
  ], primer_movimiento: "Pide hora en el banco para abrir la cuenta del negocio.", alerta_cuidado: false },
  revision: { lectura: "El margen subió tres puntos: el cambio de precios está funcionando.", patron: "Postergas lo que implica hablar con proveedores.", ajuste: "Agenda la reunión con proveedores esta misma semana.", proximo_paso: "Llama al proveedor principal hoy.", pasos_sugeridos: [{ titulo: "Agendar reunión con el proveedor principal", criterio_hecho: "Reunión con fecha confirmada", prioridad: "A", dias_desde_hoy: 4 }], evaluar_plan_b: false, alerta_cuidado: false },
  destrabar: { diagnostico: "Falta un dato, no voluntad.", opciones: ["Pedir el dato al contador", "Estimarlo con tres facturas", "Delegarlo"], paso_minimo: "Mandar un mensaje al contador.", alerta_cuidado: false },
  cierre: { resumen: "Pasaste de vender sin margen a retirar un sueldo fijo.", funciono: ["Separar las cuentas"], no_funciono: ["Postergar a proveedores"], regla: "Primero el margen, después el descuento.", senales_recaida: ["Un retiro sin registrar"], alerta_cuidado: false },
};

const leer = (req) => new Promise((ok) => { let b = ""; req.on("data", (d) => (b += d)); req.on("end", () => ok(b)); });
const json = (res, data, st = 200) => { res.writeHead(st, { "content-type": "application/json" }); res.end(JSON.stringify(data)); };

function firma(p) {
  const { s, ...r } = p;
  return createHmac("sha256", SECRETO).update(Object.keys(r).sort().map((k) => k + r[k]).join("")).digest("hex") === s;
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PUERTO}`);

  if (url.pathname === "/v1/messages" && req.method === "POST") {
    const cuerpo = JSON.parse(await leer(req));
    ultimoClaude = { cuerpo, beta: req.headers["anthropic-beta"], clave: req.headers["x-api-key"] };
    const tarea = /<tarea>(\w+)<\/tarea>/.exec(cuerpo.messages[0].content)?.[1];
    if (modoClaude === "caido") return json(res, { type: "error", error: { type: "api_error", message: "caído" } }, 500);
    const base = { id: `msg_${++n}`, type: "message", role: "assistant", model: cuerpo.model, stop_sequence: null, usage: { input_tokens: 900, output_tokens: 300, cache_read_input_tokens: 400 } };
    if (modoClaude === "rechazo") return json(res, { ...base, content: [], stop_reason: "refusal", stop_details: { type: "refusal", category: null } });
    const r = { ...RESPUESTAS[tarea] };
    if (/hacerme daño/i.test(cuerpo.messages[0].content)) r.alerta_cuidado = true;
    return setTimeout(() => json(res, { ...base, content: [{ type: "text", text: JSON.stringify(r) }], stop_reason: "end_turn" }), 150);
  }

  if (url.pathname === "/api/payment/create" && req.method === "POST") {
    const p = Object.fromEntries(new URLSearchParams(await leer(req)));
    if (!firma(p)) return json(res, { code: 108, message: "firma inválida" }, 401);
    const token = `tok_${++n}_${Date.now()}`;
    pagos.set(token, { ...p, status: 1, flowOrder: n });
    return json(res, { url: `http://localhost:${PUERTO}/pagar`, token, flowOrder: n });
  }
  if (url.pathname === "/api/payment/getStatus") {
    const p = Object.fromEntries(url.searchParams);
    if (!firma(p)) return json(res, { code: 108, message: "firma inválida" }, 401);
    const x = pagos.get(p.token);
    if (!x) return json(res, { code: 105, message: "no existe" }, 400);
    return json(res, { flowOrder: x.flowOrder, commerceOrder: x.commerceOrder, status: x.status, amount: `${x.montoPagado ?? x.amount}`, subject: x.subject, currency: "CLP", payer: x.email, requestDate: "" });
  }
  if (url.pathname === "/pagar") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    return res.end(`<h1>Flow falso</h1><form method=post action=/resolver?token=${url.searchParams.get("token")}&s=2><button>Pagar</button></form><form method=post action=/resolver?token=${url.searchParams.get("token")}&s=3><button>Rechazar</button></form>`);
  }
  if (url.pathname === "/resolver") {
    const token = url.searchParams.get("token");
    const x = pagos.get(token);
    x.status = Number(url.searchParams.get("s"));
    await fetch(x.urlConfirmation, { method: "POST", body: new URLSearchParams({ token }) });
    res.writeHead(200, { "content-type": "text/html" });
    return res.end(`<form id=f method=post action="${x.urlReturn}"><input type=hidden name=token value="${token}"></form><script>f.submit()</script>`);
  }

  // Control para las pruebas
  if (url.pathname === "/__ultimo") return json(res, ultimoClaude);
  if (url.pathname === "/__claude") { modoClaude = url.searchParams.get("modo"); return json(res, { modoClaude }); }
  if (url.pathname === "/__pago") {
    const x = pagos.get(url.searchParams.get("token"));
    if (url.searchParams.has("monto")) x.montoPagado = Number(url.searchParams.get("monto"));
    if (url.searchParams.has("s")) x.status = Number(url.searchParams.get("s"));
    return json(res, x);
  }
  json(res, { error: "no existe" }, 404);
}).listen(PUERTO, () => console.log(`Servidores falsos en :${PUERTO}`));
