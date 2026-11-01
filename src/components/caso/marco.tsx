"use client";

import { ArrowLeft, ArrowRight, Check, CloudOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { avanzarEtapa } from "@/app/app/acciones";
import { Regla } from "@/components/regla";
import { ETAPAS } from "@/lib/metodo";
import { Alerta } from "./piezas";
import type { EstadoGuardado } from "./usar-trabajo";

export type PropsMarco = { casoId: string; etapa: number; alcanzada: number; bloqueado: boolean };

export function Marco({ casoId, etapa, alcanzada, bloqueado, guardado = "guardado", antesDeAvanzar, accion, children }: PropsMarco & {
  guardado?: EstadoGuardado; antesDeAvanzar?: () => Promise<boolean>; accion?: ReactNode; children: ReactNode;
}) {
  const e = ETAPAS[etapa - 1];
  const router = useRouter();
  const [error, setError] = useState("");
  const [pendiente, iniciar] = useTransition();

  const continuar = () => iniciar(async () => {
    setError("");
    if (antesDeAvanzar && !(await antesDeAvanzar())) { setError("No pudimos guardar. Revisa tu conexión."); return; }
    if (etapa < alcanzada) { router.push(`/app/caso/${casoId}/${etapa + 1}`); return; }
    const r = await avanzarEtapa(casoId);
    if (!r.ok) { setError(r.error); return; }
    router.push(r.requierePago ? `/app/comprar?caso=${casoId}` : `/app/caso/${casoId}/${r.etapa}`);
  });

  return (
    <div className="pb-28">
      <Regla actual={etapa} alcanzada={alcanzada} casoId={bloqueado ? undefined : casoId} />
      <header className="mt-7">
        <p className="etiqueta">Etapa {etapa} de 10 · {e.nombre}</p>
        <h1 className="mt-1 text-[32px] sm:text-[40px] leading-[1.08] font-semibold">{e.pregunta}</h1>
        <p className="mt-2 text-[17px] text-tinta-2">{e.promesa}</p>
      </header>
      <div className="mt-6 space-y-4">{children}</div>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-lienzo/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-[760px] px-5 py-3">
          {error && <div className="mb-2"><Alerta tipo="ojo">{error}</Alerta></div>}
          <div className="flex items-center gap-2">
            {etapa > 1 && (
              <Link href={`/app/caso/${casoId}/${etapa - 1}`} aria-label="Etapa anterior" className="btn btn-2 !px-0 w-12 shrink-0"><ArrowLeft size={18} /></Link>
            )}
            <span className="flex-1 min-w-0 text-[14px] text-tinta-3 inline-flex items-center gap-1.5">
              {guardado === "guardando" && <><Loader2 size={15} className="animate-spin" /> Guardando</>}
              {guardado === "guardado" && <><Check size={15} /> Guardado</>}
              {guardado === "error" && <span className="text-mal inline-flex items-center gap-1.5"><CloudOff size={15} /> Sin guardar</span>}
            </span>
            {accion ?? (
              <button type="button" className="btn btn-1" disabled={pendiente} onClick={continuar}>
                {pendiente ? "Un momento…" : <>Continuar <ArrowRight size={18} /></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
