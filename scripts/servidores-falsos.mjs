// Flow y Anthropic falsos para QA: la app corre su código real contra esto.
// Valida lo que un servidor real rechazaría (firma de Flow, forma del pedido a Claude).
import { createHmac } from "node:crypto";
import http from "node:http";

const PUERTO = Number(process.env.PUERTO ?? 4599);
const SECRETO = process.env.FLOW_SECRET_KEY ?? "secreto-falso";
const PUBLICO = process.env.FLOW_PUBLICO ?? `http://localhost:${PUERTO}`;
const pagos = new Map();
let ultimoClaude = null;
let modoClaude = "normal";
let n = 0;

const nombresIdeas = ["Fijarme un sueldo y separar las cuentas", "Subir precios en lo que deja menos", "Contratar un contador", "Eliminar los descuentos", "Cobrar por adelantado", "Vender a empresas", "Reducir la carta", "Reservar 10% de cada venta", "Renegociar con proveedores", "Cerrar los días flojos", "Delegar la caja", "Crear paquetes", "Pedir ayuda a un mentor", "Buscar un socio", "Vender por internet", "Bajar el arriendo", "Medir el margen semanal", "Dejar el producto menos rentable", "Hacer preventa", "No hacer nada"];
const RESPUESTAS = {
  diagnostico: {
    titulo: "Mi negocio vende, pero no deja plata", categoria: "trabajo", urgencia: "alta",
    situacion: "Mi negocio vende, pero a fin de mes no queda dinero disponible.", importancia: "Puedo perder el negocio y la tranquilidad en mi casa.",
    definiciones: [
      { texto: "No sé cuánto me deja cada venta", por_que: "Dices que no entiendes dónde se va la plata." },
      { texto: "Mezclo la plata del negocio con la mía", por_que: "A fin de mes no hay un sueldo claro." },
      { texto: "Mis precios quedaron atrás de mis costos", por_que: "Vendes harto y aun así no queda." },
      { texto: "Trabajo mucho sin ver el resultado", por_que: "Lo que más pesa es no ver frutos." },
    ],
    causas: [
      { texto: "Retiro plata sin registrar", tipo: "suposicion", como_verificar: "Revisa la cartola del último mes.", por_que: ["Nunca definí un sueldo", "No sé cuánto deja el negocio"] },
      { texto: "Mis precios no se actualizan hace dos años", tipo: "suposicion", como_verificar: "Compara tu lista con la de hace dos años.", por_que: ["No sé cuánto me cuesta cada producto"] },
      { texto: "Los descuentos no se controlan", tipo: "suposicion", como_verificar: "Suma los descuentos de un mes.", por_que: ["Cada vendedor decide"] },
      { texto: "Los costos subieron sin notarlo", tipo: "suposicion", como_verificar: "Compara tres facturas.", por_que: ["No reviso a proveedores"] },
      { texto: "Vendo harto a pérdida", tipo: "hecho", como_verificar: "Costea tu producto más vendido.", por_que: ["Nunca lo calculé"] },
    ],
    aclaracion: null, alerta_cuidado: false,
  },
  salidas: {
    ideas: nombresIdeas.map((texto) => ({ texto, angulo: "Ordenar" })),
    finalistas: [
      { idea: 1, impacto: 5, viable: 5, rapido: 4, riesgo: 4, por_que: "Ataca directo la causa y parte esta semana.", contra: "Exige disciplina mensual." },
      { idea: 2, impacto: 4, viable: 4, rapido: 4, riesgo: 3, por_que: "Mejora el margen sin vender más.", contra: "Podría bajar la demanda." },
      { idea: 3, impacto: 3, viable: 3, rapido: 2, riesgo: 5, por_que: "Te da números claros.", contra: "Agrega un costo fijo." },
    ],
    supuesto_critico: "Tus clientes aceptarán un alza del 8%.", como_probarlo: "Prueba el alza con 10 clientes esta semana.", alerta_cuidado: false,
  },
  ejecucion: {
    indicador: "Margen mensual del negocio", unidad: "%", hoy: null, objetivo: 18, plazo_dias: 90,
    estrategia: "Primero ordenar la caja, después subir precios. Dejamos de dar descuentos sin control.",
    pasos: [
      { titulo: "Separar la cuenta del negocio de la personal", criterio_hecho: "Cuenta nueva abierta y retiros solo por sueldo", prioridad: "A", dias_desde_hoy: 3, depende_del_paso: null },
      { titulo: "Calcular el costo real de los 10 productos principales", criterio_hecho: "Planilla con costo por producto", prioridad: "A", dias_desde_hoy: 10, depende_del_paso: null },
      { titulo: "Subir precios en los productos bajo el margen mínimo", criterio_hecho: "Lista de precios publicada", prioridad: "A", dias_desde_hoy: 20, depende_del_paso: 2 },
      { titulo: "Eliminar los descuentos no autorizados", criterio_hecho: "Regla escrita y comunicada", prioridad: "B", dias_desde_hoy: 25, depende_del_paso: null },
      { titulo: "Renegociar con los dos proveedores principales", criterio_hecho: "Nuevas condiciones por escrito", prioridad: "B", dias_desde_hoy: 40, depende_del_paso: null },
    ],
    riesgos: [{ texto: "Se pierden clientes por el alza", senal: "Caen las ventas 15% en dos semanas", respuesta: "Ofrecer un paquete de menor precio" }, { texto: "Vuelvo a mezclar cuentas", senal: "Un retiro sin registrar", respuesta: "Bloquear la tarjeta del negocio" }, { texto: "Falta caja en temporada baja", senal: "Saldo bajo el mínimo", respuesta: "Reservar 10% de cada venta" }],
    plan_b: "Reducir la carta a los 5 productos con mejor margen.", disparador: "Si al 30 de diciembre el margen sigue bajo 12%.",
    compromiso: "Me hago cargo de que el negocio deje margen y de revisar los números cada semana.", alerta_cuidado: false,
  },
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
    return json(res, { url: `${PUBLICO}/pagar`, token, flowOrder: n });
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
