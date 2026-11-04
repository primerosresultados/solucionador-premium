import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { and, count, desc, eq, inArray, notInArray } from "drizzle-orm";
import { db } from "@/db";
import { casos, pasos } from "@/db/schema";
import { PanelHilo } from "@/components/movimiento/panel-hilo";
import { Contador, Medidor } from "@/components/movimiento/piezas";
import { exigirSesion } from "@/lib/auth";
import { pasosDe, revisionesDe, saludDe } from "@/lib/casos";
import { saldoCreditos } from "@/lib/compras";
import { CATEGORIAS, PASOS, type Categoria } from "@/lib/metodo";
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
    <div className="space-y-4 pt-4">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-[36px] leading-tight tracking-[-.03em]">Hola, {nombre}</h1>
          {creditos > 0 && <p className="text-tinta-2">{creditos === 1 ? "Tienes 1 crédito disponible" : `Tienes ${creditos} créditos disponibles`}</p>}
        </div>
        <Link href="/app/nuevo" className="btn btn-2 btn-chico shrink-0"><Plus size={18} /> Nuevo</Link>
      </header>

      {prioridad && (
        <Link href={`/app/caso/${prioridad.caso.id}/seguimiento`} className="escena-noche relative block overflow-hidden rounded-[var(--radius-tarjeta)] p-6 sm:p-8 min-h-[250px] flex flex-col justify-end shadow-[0_30px_70px_-34px_rgba(16,30,160,.9)] transition-transform duration-300 hover:-translate-y-0.5">
          <div aria-hidden className="absolute inset-x-0 top-0 h-[46%] opacity-80"><PanelHilo avance={.3} centro={.5} /></div>
          <div className="relative z-10">
            <p className="text-[14px] font-medium text-sol">Lo más importante hoy</p>
            <p className="mt-1 font-semibold text-[26px] leading-[1.12] tracking-[-.025em]">{prioridad.salud.accion.texto}</p>
            <p className="mt-2 text-[15px] text-tinta-2 truncate">{prioridad.caso.titulo}</p>
          </div>
        </Link>
      )}

      <section className="grid grid-cols-3 gap-3" aria-label="Resumen">
        {[["Resueltos", todos.filter((c) => c.estado === "resuelto").length], ["En marcha", enMarcha.length], ["Por hacer", porHacer]].map(([e, v]) => (
          <div key={e} className="tarjeta !p-4">
            <p className="text-[14px] font-medium text-tinta-3 leading-tight">{e}</p>
            <p className="mt-1.5 font-semibold text-[34px] leading-none tracking-[-.03em]"><Contador valor={v as number} /></p>
          </div>
        ))}
      </section>

      <ul className="space-y-3">
        {todos.map((c) => (
          <li key={c.id}>
            <Link href={`/app/caso/${c.id}`} className="tarjeta !p-5 flex items-center gap-4 transition-transform duration-200 hover:-translate-y-0.5">
              <div className="flex-1 min-w-0">
                <h2 className="font-sans tracking-normal font-semibold text-[17px] leading-snug">{c.titulo}</h2>
                <p className="text-[14px] text-tinta-3 mt-1">{c.etapa > 1 || c.estado !== "metodo" ? `${CATEGORIAS[c.categoria as Categoria]}, ` : ""}{estadoTexto(c.estado, c.etapa, !!c.desbloqueadoEn)}</p>
                {avance.has(c.id) && (
                  <div className="mt-2 h-1.5 rounded-full bg-hundido overflow-hidden" role="img" aria-label={`${avance.get(c.id)}% de los pasos hechos`}>
                    <div className="h-full rounded-full bg-acento" style={{ width: `${avance.get(c.id)}%` }} />
                  </div>
                )}
              </div>
              {c.estado === "ejecucion" && c.saludEstado && (
                <div className="shrink-0 grid justify-items-center">
                  <Medidor valor={c.salud ?? 0} tam={84} grosor={8} />
                  <span className={`chip chip-${c.saludEstado} -mt-1`}>{ETIQUETA_SALUD[c.saludEstado as EstadoSalud]}</span>
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
  return `Paso ${etapa} de 4, ${PASOS[Math.min(etapa, 4) - 1].nombre.toLowerCase()}${desbloqueado ? "" : " (gratis)"}`;
}
