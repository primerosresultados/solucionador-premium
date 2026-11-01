import type { Metadata } from "next";
import { Check } from "lucide-react";
import { redirect } from "next/navigation";
import { exigirSesion } from "@/lib/auth";
import { casoDe } from "@/lib/casos";
import { saldoCreditos } from "@/lib/compras";
import { causaRaiz } from "@/lib/metodo";
import { Planes } from "./planes";

export const metadata: Metadata = { title: "Desbloquear" };

export default async function Pagina({ searchParams }: { searchParams: Promise<{ caso?: string }> }) {
  const sesion = await exigirSesion();
  const { caso: id } = await searchParams;
  const caso = id ? await casoDe(sesion.id, id) : null;
  if (caso?.desbloqueadoEn) redirect(`/app/caso/${caso.id}`);
  const causa = caso ? causaRaiz(caso.trabajo)?.texto : null;
  return (
    <div className="mx-auto max-w-[860px] space-y-5 pt-6">
      <header>
        <h1 className="text-[32px] sm:text-[46px] leading-[1.06] tracking-[-.035em]">Ya sabes dónde está el problema. Ahora vamos por la salida.</h1>
        {caso && causa && <p className="mt-3 text-[18px] text-tinta-2">La causa que elegiste: {causa}</p>}
      </header>
      <ul className="tarjeta space-y-2">
        {["Veinte salidas analizadas, con las mejores para tu caso", "Tu plan listo: meta, pasos, fechas y plan B", "Seguimiento con revisiones, recordatorios y medición", "Verificación a 30 días para confirmar que no volvió"].map((t) => (
          <li key={t} className="flex gap-2.5"><Check size={18} className="mt-0.5 text-acento shrink-0" aria-hidden /> {t}</li>
        ))}
      </ul>
      <Planes casoId={caso?.id ?? null} creditos={await saldoCreditos(sesion.id)} />
    </div>
  );
}
