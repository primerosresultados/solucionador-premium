"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { comprar, usarCredito } from "../acciones";
import { Alerta } from "@/components/caso/piezas";
import { PLANES, pesos } from "@/lib/planes";

export function Planes({ casoId, creditos }: { casoId: string | null; creditos: number }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pendiente, iniciar] = useTransition();

  const pagar = (plan: string) => iniciar(async () => {
    setError("");
    const r = await comprar(plan, casoId);
    if (r && !r.ok) setError(r.error);
  });
  const gastar = () => iniciar(async () => {
    setError("");
    const r = await usarCredito(casoId!);
    if (!r.ok) { setError(r.error); return; }
    router.push(`/app/caso/${casoId}`);
  });

  return (
    <div className="space-y-4">
      {creditos > 0 && casoId ? (
        <section className="tarjeta">
          <p className="font-semibold">Tienes {creditos === 1 ? "1 crédito disponible" : `${creditos} créditos disponibles`}.</p>
          <button className="btn btn-1 w-full mt-4" disabled={pendiente} onClick={gastar}>Usar un crédito en este caso</button>
        </section>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {Object.values(PLANES).map((p) => (
            <section key={p.id} className="tarjeta flex flex-col">
              <h2 className="text-[20px] font-semibold">{p.nombre}</h2>
              <p className="mt-1 text-tinta-2">{p.detalle}</p>
              <p className="mt-4 font-titulo font-semibold text-[38px] leading-none tabular-nums">{pesos(p.monto)}</p>
              <p className="mt-1 text-[14px] text-tinta-3">IVA incluido</p>
              <button className={`btn mt-5 ${p.id === "uno" ? "btn-1" : "btn-2"}`} disabled={pendiente} onClick={() => pagar(p.id)}>{pendiente ? "Un momento…" : "Pagar con Flow"}</button>
            </section>
          ))}
        </div>
      )}
      {error && <Alerta tipo="ojo">{error}</Alerta>}
    </div>
  );
}
