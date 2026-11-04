import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Seguimiento } from "@/components/caso/seguimiento";
import { Avance } from "@/components/caso/avance";
import { exigirSesion } from "@/lib/auth";
import { casoDe, eventosDe, pasosDe, revisionesDe, saludDe } from "@/lib/casos";
import { hoyChile } from "@/lib/fechas";
import { siguientePaso, type PasoSalud } from "@/lib/salud";

export const metadata: Metadata = { title: "Seguimiento" };

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caso = await casoDe((await exigirSesion()).id, id);
  if (!caso) notFound();
  if (caso.estado === "metodo") redirect(`/app/caso/${id}/${caso.etapa}`);
  const [pasos, revisiones, eventos] = await Promise.all([pasosDe(id), revisionesDe(id), eventosDe(id)]);
  const hoy = hoyChile();
  const salud = saludDe(caso, pasos, revisiones, hoy);
  return (
    <>
      <div className="mb-4"><Avance actual={5} alcanzado={5} casoId={id} /></div>
      <Seguimiento caso={caso} pasos={pasos} revisiones={revisiones} eventos={eventos} salud={salud} hoy={hoy}
        siguienteId={siguientePaso(pasos as PasoSalud[])?.id} />
    </>
  );
}
