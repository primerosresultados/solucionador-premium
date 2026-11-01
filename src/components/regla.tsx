"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ETAPAS, FASES } from "@/lib/metodo";

/** La regla de 10 etapas: el elemento que identifica al producto. */
export function Regla({ actual, alcanzada, casoId }: { actual: number; alcanzada: number; casoId?: string }) {
  return (
    <nav aria-label="Etapas del método" className="grid grid-cols-[3fr_3fr_4fr] gap-2.5">
      {FASES.map((f) => (
        <div key={f.nombre} className="min-w-0">
          <p className={`text-[13px] font-medium mb-1.5 ${(f.etapas as readonly number[]).includes(actual) ? "text-tinta" : "text-tinta-3"}`}>{f.nombre}</p>
          <div className="flex gap-[3px]">
            {f.etapas.map((n) => {
              const barra = (
                <span className="relative block h-[7px] w-full rounded-full bg-hundido overflow-hidden">
                  {n <= alcanzada && (
                    <motion.span className={`absolute inset-0 rounded-full origin-left ${n === actual ? "bg-gradient-to-r from-acento to-sol" : "bg-acento"}`}
                      initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: .5, delay: (n - 1) * .03, ease: [.22, 1, .36, 1] }} />
                  )}
                </span>
              );
              const accesible = casoId && n <= alcanzada;
              return (
                <span key={n} className="flex-1 min-w-0">
                  {accesible ? (
                    <Link href={`/app/caso/${casoId}/${n === 10 ? "seguimiento" : n}`} aria-label={`Etapa ${n}: ${ETAPAS[n - 1].nombre}`} className="block py-[18px] -my-[18px]">{barra}</Link>
                  ) : barra}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
