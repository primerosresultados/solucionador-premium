// Recorrido completo como un cliente real, contra Flow y Anthropic falsos.
// Requiere: servidores falsos en :4599, app en :3091 con .env.qa, base solucionador_qa limpia.
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import pg from "pg";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT ?? "playwright");

const APP = "http://localhost:3091", FALSO = "http://localhost:4599";
const db = new pg.Pool({ connectionString: "postgres://localhost/solucionador_qa" });
const q = async (s, p) => (await db.query(s, p)).rows;
const ok = (m) => console.log(`  ✓ ${m}`);
const sello = Date.now();
const correo = `ana${sello}@prueba.test`;

const VIDEO = !!process.env.QA_VIDEO;
const navegador = await chromium.launch({ slowMo: VIDEO ? 180 : 0 });
const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, ...(VIDEO ? { recordVideo: { dir: "qa/video", size: { width: 390, height: 844 } } } : {}) });
const p = await contexto.newPage();
const errores = [];
p.on("pageerror", (e) => errores.push(`pageerror: ${e.message}`));
p.on("console", (m) => { if (m.type() === "error" && !/favicon|401|404/.test(m.text())) errores.push(`console: ${m.text()}`); });

const cap = (n) => p.screenshot({ path: `qa/capturas/${n}.png`, fullPage: true });
const continuar = async (etapa) => {
  await p.getByRole("button", { name: "Continuar" }).click();
  await p.waitForURL(new RegExp(`/${etapa}$`));
  await p.getByText(`Etapa ${etapa} de 10`).waitFor();
};

async function auditar(nombre) {
  const r = await p.evaluate(() => {
    const ancho = document.documentElement.clientWidth;
    const fuera = [...document.querySelectorAll("body *")].filter((e) => {
      const b = e.getBoundingClientRect();
      return b.width > 0 && b.right > ancho + 1 && !e.closest(".overflow-x-auto, .overflow-hidden, [aria-hidden]");
    }).map((e) => `${e.tagName}.${String(e.className).slice(0, 40)}`);
    const chicos = [...document.querySelectorAll("a, button, input, select, textarea, summary")].filter((e) => {
      const b = e.getBoundingClientRect();
      const s = getComputedStyle(e);
      if (!b.width || s.visibility === "hidden" || e.type === "hidden" || e.type === "radio" || e.type === "checkbox") return false;
      return b.height < 36;
    }).map((e) => `${e.tagName}:${(e.innerText || e.getAttribute("aria-label") || "").slice(0, 24)}(${Math.round(e.getBoundingClientRect().height)})`);
    const deformes = [...document.querySelectorAll(".marca, .prioridad")].filter((e) => {
      const b = e.getBoundingClientRect();
      return Math.abs(b.width - b.height) > .6;
    }).length;
    const hScroll = document.documentElement.scrollWidth > ancho;
    return { hScroll, fuera: [...new Set(fuera)].slice(0, 5), chicos: [...new Set(chicos)].slice(0, 8), deformes };
  });
  if (r.hScroll || r.fuera.length || r.deformes || r.chicos.length) console.log(`  ! ${nombre}:`, JSON.stringify(r));
}

console.log("1. Cuenta y etapa gratis");
await p.goto(APP); await p.waitForTimeout(3000); await p.screenshot({ path: "qa/capturas/01-pliegue.png" }); await cap("01-inicio"); await auditar("inicio");
await p.getByRole("tab", { name: "Las deudas me ahogan" }).click();
await p.getByText("Anotar cada deuda con su saldo y su tasa.").waitFor();
await p.getByLabel("Escribe lo que te tiene dando vueltas").first().fill("Mi negocio vende harto pero a fin de mes no queda plata y no entiendo dónde se va.");
await p.getByRole("button", { name: "Empezar a resolverlo" }).first().click();
await p.waitForURL("**/registro");
await p.getByLabel("Tu nombre").fill("Ana Pérez");
await p.getByLabel("Correo").fill(correo);
await p.getByLabel(/^Clave/).fill("clave-de-prueba-1");
await p.getByRole("button", { name: "Crear mi cuenta" }).click();
await p.waitForTimeout(400);
assert.match(await p.getByRole("alert").first().innerText(), /términos/);
ok("sin aceptar términos no pasa");
await p.getByRole("checkbox").check();
await p.getByRole("button", { name: "Crear mi cuenta" }).click();
await p.waitForURL("**/app/nuevo");
await p.waitForFunction(() => document.querySelector("textarea")?.value.includes("Mi negocio vende harto"));
ok("lo escrito en la portada sigue ahí después de crear la cuenta");
await p.getByRole("button", { name: "Trabajo o negocio" }).click();
await p.getByRole("button", { name: /^Alta/ }).click();
await cap("00-nuevo"); await auditar("nuevo");
await p.getByRole("button", { name: "Abrir mi caso" }).click();
await p.waitForURL(/\/1$/);
const casoId = p.url().split("/").at(-2);
await auditar("etapa1");

await p.getByRole("button", { name: "Ayúdame a encuadrarlo" }).click();
await p.getByText("Otras formas de leerlo").waitFor();
const u = await (await fetch(`${FALSO}/__ultimo`)).json();
assert.equal(u.cuerpo.model, "claude-opus-5-5");
assert.equal(u.cuerpo.fallbacks, "default");
assert.equal(u.cuerpo.thinking.type, "adaptive");
assert.equal(u.cuerpo.output_config.format.type, "json_schema");
assert.equal(u.cuerpo.output_config.effort, "medium");
assert.match(u.beta, /server-side-fallback-2026-07-01/);
ok("pedido a Claude bien formado (modelo, fallback, esquema, esfuerzo)");
await p.getByRole("button", { name: /^Agregar: Mi negocio/ }).click();
await p.getByLabel("¿Qué pierdes si esto sigue igual un año más?").fill("Pierdo el negocio y la tranquilidad en la casa.");
await p.waitForTimeout(900);
await p.reload();
assert.equal(await p.getByLabel("Ahora resúmelo en una sola frase").inputValue(), "Mi negocio vende, pero a fin de mes no queda dinero disponible.");
await p.getByText("Otras formas de leerlo").waitFor();
ok("autoguardado y respuesta del copiloto sobreviven a recargar");
await cap("02-etapa1");

await p.goto(`${APP}/app/caso/${casoId}/2`);
await p.waitForURL(/comprar/);
ok("etapa 2 bloqueada sin pagar, también por URL");
await p.goto(`${APP}/app/caso/${casoId}/1`);
await p.getByRole("button", { name: "Continuar" }).click();
await p.waitForURL(/comprar/);
await p.getByText("Un problema", { exact: true }).waitFor();
await cap("03-comprar"); await auditar("comprar");

console.log("2. Pagos");
await p.getByRole("button", { name: "Pagar con Flow" }).first().click();
await p.waitForURL(`${FALSO}/pagar**`);
await p.getByRole("button", { name: "Rechazar" }).click();
await p.waitForURL("**/app/compra/**");
await p.getByText("El pago fue rechazado").waitFor();
assert.equal((await q("select coalesce(sum(delta),0)::int s from creditos"))[0].s, 0);
ok("pago rechazado no da crédito");
await p.getByRole("link", { name: "Volver a intentar" }).click();
await p.getByRole("button", { name: "Pagar con Flow" }).first().click();
await p.waitForURL(`${FALSO}/pagar**`);
const tokenPago = new URL(p.url()).searchParams.get("token");
await p.getByRole("button", { name: "Pagar" }).click();
await p.waitForURL("**/app/compra/**");
await p.getByText("Pago recibido").waitFor();
await cap("04-pagado");
for (let i = 0; i < 3; i++) await fetch(`${APP}/api/flow/confirmar`, { method: "POST", body: new URLSearchParams({ token: tokenPago }) });
await Promise.all(Array.from({ length: 5 }, () => fetch(`${APP}/api/flow/confirmar`, { method: "POST", body: new URLSearchParams({ token: tokenPago }) })));
const libro = await q("select delta, motivo from creditos order by creado_en");
assert.deepEqual(libro.map((l) => l.delta).sort(), [-1, 1]);
ok("webhook repetido y simultáneo no duplica: +1 compra, -1 caso");
await p.getByRole("link", { name: "Continuar mi caso" }).click();
await p.waitForURL(/\/2$/);

console.log("3. Método completo");
const inputs = p.getByPlaceholder("El problema es…");
await inputs.first().fill("No sé cuánto gano por venta");
await p.getByRole("button", { name: "Otra definición" }).click();
await inputs.nth(1).fill("Mezclo la plata del negocio con la mía");
await p.getByRole("button", { name: "Cuestiona mi definición" }).click();
await p.getByText(/describe un síntoma/).waitFor();
await p.getByRole("button", { name: /^Agregar: ¿Cómo separo/ }).click();
await p.getByRole("radio").nth(1).check();
await p.getByRole("button", { name: /^Agregar: Cada mes retiro/ }).click();
await p.waitForTimeout(100);
await cap("05-etapa2"); await auditar("etapa2");
await continuar(3);

await p.getByRole("button", { name: "Muéstrame otras causas" }).click();
await p.getByRole("button", { name: /^Agregar: Los precios/ }).click();
await p.getByRole("button", { name: /^Agregar: Hay retiros/ }).click();
await p.getByRole("button", { name: /^Agregar: Los descuentos/ }).click();
await p.getByRole("button", { name: "Continuar" }).click();
await p.getByText("Marca cuál crees").waitFor();
ok("la etapa no avanza sin causa raíz");
await p.getByRole("button", { name: "Marcar causa raíz" }).nth(1).click();
await p.getByPlaceholder("Porque…", { exact: true }).fill("Porque nunca definí un sueldo");
await p.getByRole("button", { name: "Otro «por qué»" }).click();
await p.getByPlaceholder("Porque…", { exact: true }).nth(1).fill("Porque no sé cuánto deja el negocio");
await cap("06-etapa3"); await auditar("etapa3");
await continuar(4);

await p.getByRole("button", { name: /Escribe 5 más/ }).click();
await p.getByText("primeras 5 ideas").waitFor();
ok("copiloto de ideas exige 5 propias");
for (const t of ["Subir precios", "Bajar gastos", "Contratar contador", "Sueldo fijo mensual", "Cerrar el negocio"]) {
  await p.getByLabel("Nueva idea").fill(t); await p.getByRole("button", { name: "Agregar idea" }).click();
}
await p.waitForTimeout(100);
await p.getByRole("button", { name: "Agrega ideas nuevas" }).click();
await p.getByRole("button", { name: /^Agregar: Idea del copiloto 1$/ }).waitFor();
for (let i = 1; i <= 12; i++) await p.getByRole("button", { name: `Agregar: Idea del copiloto ${i}`, exact: true }).click();
await p.getByLabel("Nueva idea").fill("Cobrar por adelantado"); await p.getByRole("button", { name: "Agregar idea" }).click();
await p.getByLabel("Nueva idea").fill("Vender más caro a empresas"); await p.getByRole("button", { name: "Agregar idea" }).click();
await p.getByLabel(/volverías a empezar/).fill("Sí, el negocio me gusta y tiene clientes.");
await p.getByText("20").first().waitFor();
await cap("07-etapa4"); await auditar("etapa4");
await continuar(5);

for (const t of ["Subir precios", "Sueldo fijo mensual", "Contratar contador"]) await p.getByRole("button", { name: t, exact: true }).click();
const fila = (crit, v, n) => p.getByRole("button", { name: `${crit}: ${v} de 5` }).nth(n);
for (let n = 0; n < 3; n++) { await fila("Impacto en la causa raíz", 5 - n, n).click(); await fila("Bajo riesgo", 4, 0).click().catch(() => {}); }
await p.getByRole("button", { name: "Elegir esta" }).first().click();
await p.getByLabel("¿Por qué esta?").fill("Ataca directo la causa y la puedo partir esta semana.");
await p.getByRole("button", { name: "Pon a prueba mi decisión" }).click();
await p.getByText("Supuesto crítico").waitFor();
await cap("08-etapa5"); await auditar("etapa5");
await continuar(6);

await p.getByRole("button", { name: "Hazme el análisis" }).click();
await p.getByRole("button", { name: /^Agregar: Se pierden/ }).click();
await p.getByRole("button", { name: /^Agregar: Vuelvo a/ }).click();
await p.getByRole("button", { name: /^Agregar: Reducir la carta/ }).click();
await p.getByRole("button", { name: /^Agregar: Si al 30/ }).click();
await cap("09-etapa6"); await auditar("etapa6");
await continuar(7);

await p.getByRole("button", { name: "Propón un indicador" }).click();
await p.getByRole("button", { name: /^Agregar: Margen mensual/ }).click();
await p.getByLabel("Hoy").fill("6");
await p.getByLabel("Objetivo").fill("18");
await cap("10-etapa7"); await auditar("etapa7");
await continuar(8);

await p.getByRole("button", { name: "Continuar" }).click();
await p.getByText("Resume tu estrategia").waitFor();
await p.getByLabel("Tu estrategia, en un párrafo").fill("Primero ordenar la caja, después subir precios, y dejar de dar descuentos.");
await p.getByRole("button", { name: "Arma un borrador" }).click();
await p.waitForTimeout(200);
assert.match((await (await fetch(`${FALSO}/__ultimo`)).json()).cuerpo.messages[0].content, /Estrategia: Primero ordenar/);
ok("la estrategia llega al copiloto, aunque recién se haya escrito");
await p.getByRole("button", { name: "Usar este plan" }).click();
await p.getByText("Separar la cuenta del negocio de la personal").first().waitFor();
await p.waitForTimeout(400);
await cap("11-etapa8"); await auditar("etapa8");
await continuar(9);

assert.equal(await p.getByRole("button", { name: "3 días" }).getAttribute("aria-pressed"), "true");
ok("urgencia alta propone revisar cada 3 días");
await p.getByLabel("Tu compromiso, con tus palabras").fill("Me hago cargo de que el negocio deje margen.");
await p.getByRole("button", { name: "Semanal" }).click();
await p.getByLabel("Nombre").fill("Pedro");
await p.getByLabel("Correo").fill("pedro@prueba.test");
await cap("12-etapa9"); await auditar("etapa9");
await p.getByRole("button", { name: "Firmar y empezar" }).click();
await p.waitForURL(/seguimiento$/);
ok("método completo hasta la firma");

console.log("4. Seguimiento");
await p.getByText("Ahora", { exact: true }).waitFor();
await cap("13-seguimiento-inicio"); await auditar("seguimiento");
assert.ok(await p.getByText("Separar la cuenta del negocio de la personal").first().isVisible());
await p.getByRole("button", { name: "Abrir paso" }).click();
await p.getByRole("button", { name: "Marcar hecho" }).click();
await p.getByLabel("¿Qué quedó hecho? (opcional)").fill("Cuenta abierta en el banco");
await cap("14-hoja-paso"); await auditar("hoja");
await p.getByRole("button", { name: "Confirmar" }).click();
await p.getByRole("dialog").waitFor({ state: "detached" });
ok("paso hecho");

await p.getByRole("button", { name: /Subir precios en los productos/ }).click();
await p.getByRole("button", { name: "Marcar hecho" }).click();
await p.getByRole("button", { name: "Confirmar" }).click();
await p.getByText(/Antes va/).waitFor();
ok("la dependencia impide completar fuera de orden");
await p.getByLabel("Cerrar").last().click();

await p.getByRole("button", { name: /Calcular el costo real/ }).click();
await p.getByRole("button", { name: "Estoy bloqueado" }).click();
await p.getByLabel("¿Qué lo está trabando?").fill("No tengo las facturas del proveedor");
await p.getByRole("button", { name: "Guardar bloqueo" }).click();
await p.getByRole("dialog").waitFor({ state: "detached" });
await p.getByRole("button", { name: /Calcular el costo real/ }).click();
await p.getByRole("button", { name: "Ayúdame a destrabarlo" }).click();
await p.getByText("Mandar un mensaje al contador").waitFor();
await cap("15-destrabar");
ok("bloqueo y destrabar con copiloto");
await p.getByRole("button", { name: "Ya se destrabó" }).click();
await p.getByRole("dialog").waitFor({ state: "detached" });

await p.getByRole("button", { name: /Eliminar los descuentos/ }).click();
await p.getByRole("button", { name: "Mover" }).click();
await p.getByLabel("Nueva fecha").fill(new Date(Date.now() + 40 * 86_400_000).toISOString().slice(0, 10));
await p.getByLabel("¿Por qué cambia?").fill("Temporada alta");
await p.getByRole("button", { name: "Mover paso" }).click();
await p.getByRole("dialog").waitFor({ state: "detached" });
const [mov] = await q("select reprogramaciones r, vence_en <> vence_original d from pasos where titulo like 'Eliminar%'");
assert.deepEqual([mov.r, mov.d], [1, true]);
ok("reprogramar guarda la fecha original y cuenta la postergación");

await p.getByRole("button", { name: "Hacer revisión" }).click();
await p.getByLabel(/Margen mensual/).fill("");
await p.getByRole("button", { name: "Confianza 4 de 5" }).click();
await p.getByLabel("¿Qué pasó desde la última vez?").fill("Separé las cuentas y empecé a costear.");
await p.getByLabel("¿A qué te comprometes de aquí a la próxima?").fill("Terminar la planilla de costos");
await p.getByRole("button", { name: "Guardar y analizar" }).click();
await p.getByText(/Mide tu indicador/).waitFor();
ok("la revisión exige medir el indicador");
await p.getByLabel(/Margen mensual/).fill("9");
await p.getByRole("button", { name: "Guardar y analizar" }).click();
await p.getByRole("dialog").getByText("El ajuste").waitFor();
await cap("16-revision-analisis"); await auditar("revision");
await p.getByRole("dialog").getByRole("button", { name: /^Agregar: Agendar reunión/ }).click();
await p.waitForTimeout(500);
await p.getByRole("dialog").getByRole("button", { name: "Volver" }).click();
await p.reload();
await p.getByText("Última lectura del copiloto").waitFor();
await p.getByText("Agendar reunión con el proveedor principal").first().waitFor();
ok("revisión + análisis + paso sugerido quedan guardados");
const ics = await p.request.get(`${APP}/api/caso/${casoId}/calendario`);
const textoIcs = await ics.text();
assert.match(ics.headers()["content-type"], /text\/calendar/);
assert.match(textoIcs, /BEGIN:VCALENDAR/);
assert.match(textoIcs, /SUMMARY:Calcular el costo real/);
assert.ok(!textoIcs.includes("SUMMARY:Separar la cuenta"), "un paso hecho no debe ir al calendario");
assert.ok(textoIcs.split("\r\n").every((l) => Buffer.byteLength(l) <= 75), "líneas ICS sin plegar");
ok("el plan se descarga a calendario, solo lo pendiente");
await p.getByRole("button", { name: "Tiempo" }).click();
await cap("17-seguimiento-tiempo"); await auditar("linea de tiempo");
await p.getByRole("button", { name: "Lista" }).click();

await fetch(`${FALSO}/__claude?modo=caido`);
await p.getByRole("button", { name: "Hacer revisión" }).click();
await p.getByRole("button", { name: "Confianza 3 de 5" }).click();
await p.getByLabel("¿Qué pasó desde la última vez?").fill("Semana floja.");
await p.getByLabel("¿A qué te comprometes de aquí a la próxima?").fill("Retomar costos");
await p.getByRole("button", { name: "Guardar y analizar" }).click();
await p.getByText(/no está disponible/).waitFor({ timeout: 30000 });
await fetch(`${FALSO}/__claude?modo=normal`);
assert.equal((await q("select count(*)::int n from revisiones"))[0].n, 2);
ok("con la IA caída la revisión igual queda guardada");
await p.getByRole("button", { name: "Volver" }).click();

{
  const c = await navegador.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, storageState: await contexto.storageState() });
  const v = await c.newPage();
  await v.goto(`${APP}/app/caso/${casoId}/seguimiento`);
  await v.waitForTimeout(300);
  await v.locator("section").filter({ hasText: "Plan" }).filter({ has: v.getByRole("button", { name: "Tiempo" }) }).screenshot({ path: "qa/capturas/p-plan.png" });
  await v.locator("figure").screenshot({ path: "qa/capturas/p-grafico.png" });
  await v.locator("nav").first().screenshot({ path: "qa/capturas/p-regla.png" });
  await c.close();
}

console.log("5. Seguridad");
const otro = await navegador.newContext();
const q2 = await otro.newPage();
assert.equal((await q2.request.get(`${APP}/api/caso/${casoId}/calendario`)).status(), 401);
await q2.goto(`${APP}/registro`);
await q2.getByLabel("Tu nombre").fill("Intruso");
await q2.getByLabel("Correo").fill(`intruso${sello}@prueba.test`);
await q2.getByLabel(/^Clave/).fill("clave-de-prueba-2");
await q2.getByRole("checkbox").check();
await q2.getByRole("button", { name: "Crear mi cuenta" }).click();
await q2.waitForURL("**/app/nuevo");
assert.equal((await q2.request.get(`${APP}/api/caso/${casoId}/calendario`)).status(), 404);
for (const ruta of [`/app/caso/${casoId}`, `/app/caso/${casoId}/seguimiento`, `/app/caso/${casoId}/3`]) {
  const r = await q2.goto(`${APP}${ruta}`);
  assert.equal(r.status(), 404, ruta);
}
ok("otro usuario recibe 404 en casos ajenos");
assert.equal((await q2.goto(`${APP}/admin`)).status(), 404);
ok("/admin no abre sin ser admin");
assert.equal((await fetch(`${APP}/api/cron/seguimiento`)).status, 401);
assert.equal((await fetch(`${APP}/api/cron/seguimiento`, { headers: { authorization: "Bearer malo" } })).status, 401);
assert.equal((await fetch(`${APP}/api/mis-datos`)).status, 401);
ok("cron y descarga de datos exigen credencial");

const [{ companero_token: tokenComp }] = await q("select companero_token from casos where id=$1", [casoId]);
const r = await q2.goto(`${APP}/companero/${tokenComp}`);
assert.equal(r.status(), 200);
const textoComp = await q2.innerText("body");
assert.ok(!/plan b|Separar la cuenta|retiros/i.test(textoComp), "fuga de contenido al compañero");
await q2.setViewportSize({ width: 390, height: 844 });
await q2.screenshot({ path: "qa/capturas/18-companero.png", fullPage: true });
ok("compañero ve avance, no contenido");

// Monto alterado en Flow: no acredita.
await q2.goto(`${APP}/app/comprar`);
await q2.getByRole("button", { name: "Pagar con Flow" }).first().click();
await q2.waitForURL(`${FALSO}/pagar**`);
const tokenMalo = new URL(q2.url()).searchParams.get("token");
await fetch(`${FALSO}/__pago?token=${tokenMalo}&monto=10&s=2`);
await fetch(`${APP}/api/flow/confirmar`, { method: "POST", body: new URLSearchParams({ token: tokenMalo }) });
assert.equal((await q("select estado from ordenes where flow_token=$1", [tokenMalo]))[0].estado, "monto_invalido");
assert.equal((await q("select count(*)::int n from creditos c join ordenes o on o.id=c.orden_id where o.flow_token=$1", [tokenMalo]))[0].n, 0);
ok("monto alterado no entrega crédito");
assert.equal((await fetch(`${APP}/api/flow/confirmar`, { method: "POST", body: new URLSearchParams({ token: "inventado" }) })).status, 500);
ok("token inventado se rechaza");

console.log("6. Motor diario y correos");
const cron = async () => (await fetch(`${APP}/api/cron/seguimiento`, { headers: { authorization: "Bearer cron-qa" } })).json();
await q("update casos set proxima_revision = (now() at time zone 'America/Santiago')::date where id=$1", [casoId]);
await q("update pasos set vence_en = (now() at time zone 'America/Santiago')::date + 1 where titulo like 'Calcular%'");
const a = await cron(); const b = await cron();
assert.ok(a.avisos >= 2, JSON.stringify(a));
assert.equal(b.avisos, 0);
const tipos = (await q("select asunto, estado from envios where caso_id=$1", [casoId]));
assert.ok(tipos.some((t) => /Hoy toca revisar/.test(t.asunto)) && tipos.some((t) => /Mañana vence/.test(t.asunto)));
ok(`cron genera ${a.avisos} avisos y no duplica al repetirse`);

await q("update casos set ultima_actividad = now() - interval '7 days' where id=$1", [casoId]);
const c = await cron();
assert.ok((await q("select 1 from envios where asunto like '¿Seguimos con%'")).length === 1, JSON.stringify(c));
ok("a los 7 días de silencio sale el rescate");
await q("update casos set ultima_actividad = now() - interval '16 days' where id=$1", [casoId]);
await cron();
assert.equal((await q("select salud_estado s from casos where id=$1", [casoId]))[0].s, "detenido");
ok("a los 14+ días el caso queda detenido");
await fetch(`${APP}/api/cron/seguimiento?fecha=2026-11-02`, { headers: { authorization: "Bearer cron-qa" } });
assert.equal((await q("select count(*)::int n from envios where asunto like 'Tu semana%'"))[0].n, 1);
await fetch(`${APP}/api/cron/seguimiento?fecha=2026-11-02`, { headers: { authorization: "Bearer cron-qa" } });
assert.equal((await q("select count(*)::int n from envios where asunto like 'Tu semana%'"))[0].n, 1);
ok("resumen de los lunes, una sola vez");
await q("update casos set ultima_actividad = now() where id=$1", [casoId]);

await p.goto(`${APP}/app/caso/${casoId}/seguimiento`);
await p.getByRole("button", { name: "Pausar este caso" }).click();
await p.getByRole("button", { name: "Retomar" }).waitFor();
const antes = (await q("select count(*)::int n from envios"))[0].n;
await q("update casos set proxima_revision = (now() at time zone 'America/Santiago')::date where id=$1", [casoId]);
await cron();
assert.equal((await q("select count(*)::int n from envios where caso_id=$1 and asunto like 'Hoy%'", [casoId]))[0].n, 1);
assert.ok((await q("select count(*)::int n from envios"))[0].n >= antes);
ok("un caso en pausa no recibe avisos");
await p.getByRole("button", { name: "Retomar" }).click();
await p.getByRole("button", { name: "Hacer revisión" }).waitFor();

console.log("7. Cierre con verificación");
await q("update pasos set estado='hecho', completado_en=now() where caso_id=$1", [casoId]);
await p.reload();
await p.getByRole("button", { name: "Hacer revisión" }).click();
await p.getByLabel(/Margen mensual/).fill("18");
await p.getByRole("button", { name: "Confianza 5 de 5" }).click();
await p.getByLabel("¿Qué pasó desde la última vez?").fill("Llegué al margen objetivo.");
await p.getByLabel("¿A qué te comprometes de aquí a la próxima?").fill("Sostenerlo");
await p.getByRole("button", { name: "Guardar y analizar" }).click();
await p.getByRole("button", { name: "Volver" }).click();
await p.reload();
await p.getByRole("button", { name: "Marcar meta lograda" }).click();
await p.getByText("Un problema está resuelto cuando no vuelve.").waitFor();
assert.ok(await p.getByRole("button", { name: "Sigue resuelto" }).isDisabled());
ok("cerrar exige 30 días de verificación");
await p.getByRole("button", { name: "Volvió a pasar" }).click();
await p.getByRole("button", { name: "Hacer revisión" }).waitFor();
ok("si vuelve, el caso regresa a ejecución");
await p.getByRole("button", { name: "Marcar meta lograda" }).click();
await p.getByText("Un problema está resuelto cuando no vuelve.").waitFor();
await q("update casos set verificar_en = (now() at time zone 'America/Santiago')::date where id=$1", [casoId]);
await p.reload();
await p.getByRole("button", { name: "Sigue resuelto" }).click();
await p.getByText("Lo que te llevas de este caso").waitFor();
await cap("19-resuelto"); await auditar("resuelto");
ok("caso resuelto con aprendizaje");

await p.goto(`${APP}/app`); await cap("20-inicio-app"); await auditar("app");
await p.goto(`${APP}/app/ajustes`); await cap("21-ajustes"); await auditar("ajustes");
const descarga = await p.request.get(`${APP}/api/mis-datos`);
const datos = await descarga.json();
assert.equal(datos.casos.length, 1);
assert.ok(!JSON.stringify(datos).includes(tokenComp));
ok("descarga de datos completa y sin tokens internos");

console.log("7b. Capturas de diseño");
for (const [nombre, opciones] of [["1440", { viewport: { width: 1440, height: 900 } }], ["oscuro", { viewport: { width: 390, height: 844 }, colorScheme: "dark", deviceScaleFactor: 2 }], ["oscuro-1440", { viewport: { width: 1440, height: 900 }, colorScheme: "dark" }]]) {
  const c = await navegador.newContext({ ...opciones, storageState: await contexto.storageState() });
  const v = await c.newPage();
  await v.goto(APP); await v.waitForTimeout(3000);
  await v.screenshot({ path: `qa/capturas/d-${nombre}-pliegue.png` });
  await v.screenshot({ path: `qa/capturas/d-${nombre}-inicio.png`, fullPage: true });
  for (const [ruta, n] of [ [`/app/caso/${casoId}/seguimiento`, "seguimiento"], [`/app/caso/${casoId}/5`, "decision"], ["/app", "app"]]) {
    await v.goto(`${APP}${ruta}`);
    await v.waitForTimeout(300);
    await v.screenshot({ path: `qa/capturas/d-${nombre}-${n}.png`, fullPage: true });
  }
  await c.close();
}

console.log("8. Admin, seguridad en el copiloto, eliminar cuenta");
await q("update usuarios set email='admin-qa@solucionador.test' where email=$1", [correo]);
const adm = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
const pa = await adm.newPage();
await pa.goto(`${APP}/ingresar`);
await pa.getByLabel("Correo").fill("admin-qa@solucionador.test");
await pa.getByLabel("Clave").fill("clave-de-prueba-1");
await pa.getByRole("button", { name: "Entrar" }).click();
await pa.waitForURL("**/app");
const ra = await pa.goto(`${APP}/admin`);
assert.equal(ra.status(), 200);
await pa.getByText("$14.990").first().waitFor();
await pa.screenshot({ path: "qa/capturas/22-admin.png", fullPage: true });
ok("admin ve ventas y costo de IA");

await q2.goto(`${APP}/app/nuevo`);
await q2.getByLabel("Tu relato").fill("A veces pienso en hacerme daño porque no veo salida a las deudas que tengo.");
await q2.getByRole("button", { name: "Abrir mi caso" }).click();
await q2.waitForURL(/\/1$/);
await q2.getByRole("button", { name: "Ayúdame a encuadrarlo" }).click();
await q2.getByText("*4141").waitFor();
await q2.screenshot({ path: "qa/capturas/23-cuidado.png", fullPage: true });
ok("relato de riesgo muestra ayuda real");

for (let i = 0; i < 2; i++) { await q2.getByRole("button", { name: "Preguntar de nuevo" }).click(); await q2.getByText("*4141").waitFor(); }
await q2.getByRole("button", { name: "Preguntar de nuevo" }).click();
await q2.getByText("Usaste las consultas gratis").waitFor();
ok("tope de IA gratis por caso");

await q2.goto(`${APP}/app/ajustes`);
await q2.getByRole("button", { name: "Eliminar mi cuenta" }).click();
await q2.getByLabel("Confirmación").fill("ELIMINAR");
await q2.getByRole("button", { name: "Eliminar definitivamente" }).click();
await q2.waitForURL(`${APP}/`);
assert.equal((await q("select count(*)::int n from usuarios where email like $1", [`intruso${sello}%`]))[0].n, 0);
ok("eliminar cuenta borra casos y datos personales");

console.log("9. Ingreso");
const ctx = await navegador.newContext();
const pi = await ctx.newPage();
for (let i = 0; i < 9; i++) {
  await pi.goto(`${APP}/ingresar`);
  await pi.getByLabel("Correo").fill("admin-qa@solucionador.test");
  await pi.getByLabel("Clave").fill("mala");
  await pi.getByRole("button", { name: "Entrar" }).click();
  await pi.locator("form [role=alert]").waitFor();
}
assert.match(await pi.locator("form [role=alert]").innerText(), /Demasiados intentos/);
ok("fuerza bruta frenada");

console.log("\nErrores de navegador:", errores.length ? errores : "ninguno");
await contexto.close(); await navegador.close(); await db.end();
process.exit(errores.length ? 1 : 0);
