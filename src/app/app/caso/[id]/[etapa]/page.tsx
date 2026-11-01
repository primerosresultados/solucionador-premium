import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Etapa1, Etapa2, Etapa3 } from "@/components/caso/entender";
import { Etapa4, Etapa5, Etapa6 } from "@/components/caso/crear";
import { Etapa7, Etapa8, Etapa9 } from "@/components/caso/ejecutar";
import { exigirSesion } from "@/lib/auth";
import { casoDe, pasosDe } from "@/lib/casos";
import { ETAPAS, URGENCIAS, type Urgencia } from "@/lib/metodo";

export const metadata: Metadata = { title: "Mi caso" };

export default async function Pagina({ params }: { params: Promise<{ id: string; etapa: string }> }) {
  const { id, etapa: e } = await params;
  const sesion = await exigirSesion();
  const caso = await casoDe(sesion.id, id);
  const n = Number(e);
  if (!caso || !Number.isInteger(n) || n < 1 || n > 9 || !ETAPAS[n - 1]) notFound();
  if (n > 1 && !caso.desbloqueadoEn) redirect(`/app/comprar?caso=${id}`);
  if (n > caso.etapa) redirect(`/app/caso/${id}/${caso.etapa}`);

  const m = { casoId: id, etapa: n, alcanzada: caso.etapa, bloqueado: !caso.desbloqueadoEn };
  const t = caso.trabajo;
  switch (n) {
    case 1: return <Etapa1 {...m} inicial={t} />;
    case 2: return <Etapa2 {...m} inicial={t} />;
    case 3: return <Etapa3 {...m} inicial={t} />;
    case 4: return <Etapa4 {...m} inicial={t} />;
    case 5: return <Etapa5 {...m} inicial={t} />;
    case 6: return <Etapa6 {...m} inicial={t} />;
    case 7: return <Etapa7 {...m} trabajo={t} meta={caso} />;
    case 8: return <Etapa8 {...m} trabajo={t} pasos={await pasosDe(id)} />;
    default:
      if (caso.estado !== "metodo") redirect(`/app/caso/${id}/seguimiento`);
      return <Etapa9 {...m} nombre={sesion.nombre} ritmoSugerido={URGENCIAS[caso.urgencia as Urgencia]?.ritmoDias ?? 7} />;
  }
}
