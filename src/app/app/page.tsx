import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { and, count, desc, eq, inArray, notInArray } from "drizzle-orm";
import { db } from "@/db";
import { casos, pasos } from "@/db/schema";
import { exigirSesion } from "@/lib/auth";
import { pasosDe, revisionesDe, saludDe } from "@/lib/casos";
import { saldoCreditos } from "@/lib/compras";
import { CATEGORIAS, ETAPAS, type Categoria } from "@/lib/metodo";
import { ETIQUETA_SALUD, type EstadoSalud } from "@/lib/salud";

export const metadata: Metadata = { title: "Mis casos" };

const ORDEN: Record<string, number> = { detenido: 0, riesgo: 1, atencion: 2, en_ruta: 3 };
const ORDEN_URGENCIA: Record<string, number> = { alta: 0, media: 1, baja: 2 };

export default async function Pagina() {
  const sesion = await exigirSesion();
  const todos = await db.select().from(casos).where(eq(casos.usuarioId, sesion.id)).orderBy(desc(casos.ultimaActividad));
  const creditos = await saldoCreditos(sesion.id);
  const conSalud = await Promise.all(todos.filter((c) => c.estado === "ejecucion").map(async (c) => ({ caso: c, salud: saludDe(c, await pasosDe(c.id), await revisionesDe(c.id)) })));
  const prioridad = [...conSalud].sort((a, b) =>
    ORDEN[a.salud.estado] - ORDEN[b.salud.estado]
    || ORDEN_URGENCIA[a.caso.urgencia] - ORDEN_URGENCIA[b.caso.urgencia]
    || a.salud.puntaje - b.salud.puntaje)[0];
  const avance = new Map(conSalud.map((c) => [c.caso.id, c.salud.avancePasos]));
  const enMarcha = todos.filter((c) => ["ejecucion", "verificacion"].includes(c.estado)).map((c) => c.id);
  const [{ porHacer }] = enMarcha.length
    ? await db.select({ porHacer: count() }).from(pasos).where(and(inArray(pasos.casoId, enMarcha), notInArray(pasos.estado, ["hecho", "descartado"])))
    : [{ porHacer: 0 }];
  const nombre = sesion.nombre.split(" ")[0];

  if (!todos.length) {
    return (
      <section className="tarjeta text-center py-12 mt-4">
        <h1 className="text-[30px] font-semibold">Hola, {nombre}</h1>
        <p className="mt-2 text-tinta-2 max-w-[26em] mx-auto">¿Qué es lo que te tiene dando vueltas? Empieza contándolo: la primera etapa es gratis.</p>
        <Link href="/app/nuevo" className="btn btn-1 mt-6">Abrir mi primer caso <ArrowRight size={18} /></Link>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-[32px] font-semibold leading-tight">Hola, {nombre}</h1>
          {creditos > 0 && <p className="text-tinta-2">{creditos === 1 ? "Tienes 1 crédito disponible" : `Tienes ${creditos} créditos disponibles`}</p>}
        </div>
        <Link href="/app/nuevo" className="btn btn-2 btn-chico shrink-0"><Plus size={18} /> Nuevo</Link>
      </header>

      {prioridad && (
        <Link href={`/app/caso/${prioridad.caso.id}/seguimiento`} className="block rounded-[var(--radius-tarjeta)] bg-contraste text-contraste-tinta p-5 sm:p-7">
          <p className="text-[12px] font-semibold tracking-[.08em] text-contraste-2">Lo más importante hoy</p>
          <p className="mt-1 font-titulo font-semibold text-[24px] leading-[1.15]">{prioridad.salud.accion.texto}</p>
          <p className="mt-2 text-[15px] text-contraste-2 truncate">{prioridad.caso.titulo}</p>
        </Link>
      )}

      <section className="grid grid-cols-3 gap-3" aria-label="Resumen">
        {[["Resueltos", todos.filter((c) => c.estado === "resuelto").length], ["En marcha", enMarcha.length], ["Por hacer", porHacer]].map(([e, v]) => (
          <div key={e} className="tarjeta !p-4">
            <p className="etiqueta leading-tight">{e}</p>
            <p className="mt-1 font-titulo font-semibold text-[30px] leading-none tabular-nums">{v}</p>
          </div>
        ))}
      </section>

      <ul className="space-y-3">
        {todos.map((c) => (
          <li key={c.id}>
            <Link href={`/app/caso/${c.id}`} className="tarjeta !p-5 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="font-sans tracking-normal font-semibold text-[17px] leading-snug">{c.titulo}</h2>
                <p className="text-[14px] text-tinta-3 mt-1">{CATEGORIAS[c.categoria as Categoria]} · {estadoTexto(c.estado, c.etapa, !!c.desbloqueadoEn)}</p>
                {avance.has(c.id) && (
                  <div className="mt-2 h-1.5 rounded-full bg-hundido overflow-hidden" role="img" aria-label={`${avance.get(c.id)}% de los pasos hechos`}>
                    <div className="h-full rounded-full bg-acento" style={{ width: `${avance.get(c.id)}%` }} />
                  </div>
                )}
              </div>
              {c.estado === "ejecucion" && c.saludEstado && (
                <div className="text-right shrink-0">
                  <p className="font-titulo font-semibold text-[28px] leading-none tabular-nums">{c.salud}</p>
                  <span className={`chip chip-${c.saludEstado} mt-1`}>{ETIQUETA_SALUD[c.saludEstado as EstadoSalud]}</span>
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function estadoTexto(estado: string, etapa: number, desbloqueado: boolean) {
  if (estado === "resuelto") return "Resuelto";
  if (estado === "verificacion") return "En verificación";
  if (estado === "pausado") return "En pausa";
  if (estado === "ejecucion") return "En ejecución";
  if (!desbloqueado && etapa === 1) return "Etapa gratis";
  return `Etapa ${etapa} de 10 · ${ETAPAS[etapa - 1].nombre}`;
}
