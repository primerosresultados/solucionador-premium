import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Logo } from "@/components/logo";
import { db } from "@/db";
import { casos, usuarios } from "@/db/schema";
import { pasosDe, revisionesDe, saludDe } from "@/lib/casos";
import { fechaLarga } from "@/lib/fechas";
import { ETIQUETA_SALUD } from "@/lib/salud";

export const metadata: Metadata = { title: "Avance", robots: { index: false }, referrer: "no-referrer" };

/** Vista del compañero: solo avance general, nunca el contenido del caso. */
export default async function Pagina({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [fila] = await db.select({ caso: casos, nombre: usuarios.nombre }).from(casos)
    .innerJoin(usuarios, eq(casos.usuarioId, usuarios.id)).where(eq(casos.companeroToken, token)).limit(1);
  if (!fila) notFound();
  const { caso, nombre } = fila;
  const s = saludDe(caso, await pasosDe(caso.id), await revisionesDe(caso.id));
  const resuelto = caso.estado === "resuelto";
  return (
    <main className="mx-auto max-w-[520px] px-5 py-3">
      <Logo />
      <section className="tarjeta mt-6">
        <p className="etiqueta">{nombre} te eligió para acompañarle</p>
        <h1 className="mt-2 text-[26px] font-semibold leading-tight">{caso.titulo}</h1>
        <div className="mt-4"><span className={`chip chip-${resuelto ? "en_ruta" : s.estado}`}>{resuelto ? "Resuelto" : ETIQUETA_SALUD[s.estado]}</span></div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div><p className="etiqueta">Pasos hechos</p><p className="font-titulo font-semibold text-[36px] leading-tight tabular-nums">{s.avancePasos}%</p></div>
          <div><p className="etiqueta">Fecha límite</p><p className="font-titulo font-semibold text-[22px] leading-tight mt-2">{caso.fechaObjetivo ? fechaLarga(caso.fechaObjetivo) : "—"}</p></div>
        </div>
      </section>
      <p className="mt-4 text-tinta-2 leading-relaxed">No necesitas hacer nada más que estar. Una pregunta a tiempo («¿cómo vas con eso?») es lo que más ayuda.</p>
    </main>
  );
}
