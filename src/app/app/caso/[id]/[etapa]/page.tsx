import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Avance } from "@/components/caso/avance";
import { PasoCausa, PasoPlan, PasoProblema, PasoSalida } from "@/components/caso/flujo";
import { exigirSesion } from "@/lib/auth";
import { casoDe } from "@/lib/casos";
import { causaRaiz, PASO_GRATIS } from "@/lib/metodo";

export const metadata: Metadata = { title: "Mi caso" };

export default async function Pagina({ params }: { params: Promise<{ id: string; etapa: string }> }) {
  const { id, etapa: e } = await params;
  const caso = await casoDe((await exigirSesion()).id, id);
  const n = Number(e);
  if (!caso || !Number.isInteger(n) || n < 1 || n > 4) notFound();
  if (caso.estado !== "metodo") redirect(`/app/caso/${id}/seguimiento`);
  if (n > PASO_GRATIS && !caso.desbloqueadoEn) redirect(`/app/comprar?caso=${id}`);
  if (n > caso.etapa) redirect(`/app/caso/${id}/${caso.etapa}`);
  if (n >= 3 && !causaRaiz(caso.trabajo)) redirect(`/app/caso/${id}/2`);

  const m = { casoId: id, alcanzado: caso.etapa, trabajo: caso.trabajo, relato: caso.trabajo.relato };
  return (
    <>
      <Avance actual={n} alcanzado={caso.etapa} casoId={id} />
      {n === 1 && <PasoProblema {...m} />}
      {n === 2 && <PasoCausa {...m} />}
      {n === 3 && <PasoSalida {...m} />}
      {n === 4 && <PasoPlan {...m} urgencia={caso.urgencia} />}
    </>
  );
}
