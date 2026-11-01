import type { Metadata } from "next";
import { Check } from "lucide-react";
import { redirect } from "next/navigation";
import { exigirSesion } from "@/lib/auth";
import { casoDe } from "@/lib/casos";
import { saldoCreditos } from "@/lib/compras";
import { Planes } from "./planes";

export const metadata: Metadata = { title: "Desbloquear" };

export default async function Pagina({ searchParams }: { searchParams: Promise<{ caso?: string }> }) {
  const sesion = await exigirSesion();
  const { caso: id } = await searchParams;
  const caso = id ? await casoDe(sesion.id, id) : null;
  if (caso?.desbloqueadoEn) redirect(`/app/caso/${caso.id}`);
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[32px] sm:text-[40px] leading-[1.08] font-semibold">Ya hiciste la parte difícil: decirlo por escrito.</h1>
        {caso && <p className="mt-2 text-[17px] text-tinta-2">Sigue con «{caso.titulo}» hasta resolverlo.</p>}
      </header>
      <ul className="tarjeta space-y-2">
        {["Las 9 etapas restantes, con copiloto en cada una", "Plan de pasos con prioridades y fechas", "Revisiones, recordatorios y medición del resultado", "Verificación a 30 días para confirmar que no volvió"].map((t) => (
          <li key={t} className="flex gap-2.5"><Check size={18} className="mt-0.5 text-acento shrink-0" aria-hidden /> {t}</li>
        ))}
      </ul>
      <Planes casoId={caso?.id ?? null} creditos={await saldoCreditos(sesion.id)} />
    </div>
  );
}
