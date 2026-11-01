import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, count, desc, eq, gte, inArray, sql, sum } from "drizzle-orm";
import { Logo } from "@/components/logo";
import { db } from "@/db";
import { casos, envios, ordenes, usosIa, usuarios } from "@/db/schema";
import { esAdmin, exigirSesion } from "@/lib/auth";
import { pesos } from "@/lib/planes";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

const USD_ENTRADA = 4 / 1_000_000, USD_SALIDA = 20 / 1_000_000;

export default async function Pagina() {
  if (!esAdmin(await exigirSesion())) notFound();
  const hace30 = new Date(Date.now() - 30 * 86_400_000);

  const [{ cuentas }] = await db.select({ cuentas: count() }).from(usuarios);
  const [venta] = await db.select({ total: sum(ordenes.monto), n: count() }).from(ordenes).where(and(eq(ordenes.estado, "pagada"), gte(ordenes.pagadoEn, hace30)));
  const porEstado = await db.select({ estado: casos.estado, n: count() }).from(casos).groupBy(casos.estado);
  const [ia] = await db.select({ e: sum(usosIa.tokensEntrada), s: sum(usosIa.tokensSalida), n: count(), malas: sql<number>`count(*) filter (where not ${usosIa.ok})` }).from(usosIa).where(gte(usosIa.creadoEn, hace30));
  const [correos] = await db.select({ n: count() }).from(envios).where(inArray(envios.estado, ["error", "pendiente"]));
  const atascados = await db.select({ id: casos.id, titulo: casos.titulo, salud: casos.salud, actividad: casos.ultimaActividad }).from(casos)
    .where(inArray(casos.saludEstado, ["riesgo", "detenido"])).orderBy(desc(casos.ultimaActividad)).limit(20);
  const ultimas = await db.select().from(ordenes).orderBy(desc(ordenes.creadoEn)).limit(10);

  const costo = Number(ia.e ?? 0) * USD_ENTRADA + Number(ia.s ?? 0) * USD_SALIDA;
  const n = (e: string) => porEstado.find((x) => x.estado === e)?.n ?? 0;
  const pagados = n("ejecucion") + n("verificacion") + n("resuelto");

  return (
    <div className="mx-auto max-w-[1040px] px-5 py-3 pb-12">
      <Logo href="/app" />
      <h1 className="text-[32px] font-semibold mt-4">Panel</h1>
      <section className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Dato e="Ventas 30 días" v={pesos(Number(venta.total ?? 0))} n={`${venta.n} órdenes`} />
        <Dato e="Cuentas" v={`${cuentas}`} n={`${porEstado.reduce((s, x) => s + x.n, 0)} casos`} />
        <Dato e="En ejecución" v={`${n("ejecucion")}`} n={`${n("resuelto")} resueltos de ${pagados}`} />
        <Dato e="Costo IA 30 días" v={`US$${costo.toFixed(2)}`} n={`${ia.n} consultas, ${ia.malas} fallidas`} />
      </section>
      {correos.n > 0 && <p className="mt-3 text-ojo">{correos.n} correos sin salir.</p>}
      <div className="mt-4 grid lg:grid-cols-2 gap-4">
        <section className="tarjeta">
          <h2 className="text-[20px] font-semibold">Casos en problemas</h2>
          {!atascados.length && <p className="mt-2 text-tinta-2">Ninguno.</p>}
          <ul className="mt-2">{atascados.map((c) => (
            <li key={c.id} className="flex justify-between gap-3 py-2 border-b border-hundido last:border-0">
              <span className="min-w-0 truncate">{c.titulo}</span><span className="tabular-nums text-tinta-2">{c.salud}</span>
            </li>
          ))}</ul>
        </section>
        <section className="tarjeta">
          <h2 className="text-[20px] font-semibold">Últimas órdenes</h2>
          {!ultimas.length && <p className="mt-2 text-tinta-2">Aún no hay órdenes.</p>}
          <ul className="mt-2">{ultimas.map((o) => (
            <li key={o.id} className="flex justify-between gap-3 py-2 border-b border-hundido last:border-0">
              <span className="min-w-0 truncate">{o.numero}</span>
              <span className="tabular-nums text-tinta-2 shrink-0">{pesos(o.monto)} · {o.estado}</span>
            </li>
          ))}</ul>
        </section>
      </div>
    </div>
  );
}

function Dato({ e, v, n }: { e: string; v: string; n: string }) {
  return (
    <div className="tarjeta !p-4">
      <p className="etiqueta">{e}</p>
      <p className="mt-1 font-titulo font-semibold text-[28px] leading-none tabular-nums">{v}</p>
      <p className="mt-1 text-[14px] text-tinta-3">{n}</p>
    </div>
  );
}
