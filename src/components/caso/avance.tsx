"use client";

import { Check } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { PASOS } from "@/lib/metodo";

const NOMBRES = [...PASOS.map((p) => p.nombre), "Seguimiento"];

/** Dónde estás y qué falta. Lo ya hecho se puede volver a abrir. */
export function Avance({ actual, alcanzado, casoId }: { actual: number; alcanzado: number; casoId: string }) {
  return (
    <nav aria-label="Avance del caso" className="sticky top-[60px] z-20 -mx-5 sm:-mx-8 px-5 sm:px-8 py-2.5 bg-lienzo/85 backdrop-blur-xl">
      <ol className="flex items-center gap-1 sm:gap-2">
        {NOMBRES.map((nombre, i) => {
          const n = i + 1, hecho = n < alcanzado || (n < actual), activo = n === actual;
          const punto = (
            <span className={`relative size-7 flex-none grid place-items-center rounded-full text-[13px] font-semibold tabular-nums transition-colors duration-200 ${activo ? "bg-acento text-acento-tinta" : hecho ? "bg-acento-suave text-acento" : "bg-hundido text-tinta-3"}`}>
              {hecho && !activo ? <Check size={14} strokeWidth={3} /> : n}
              {activo && <motion.span aria-hidden layoutId="avance-activo" className="absolute -inset-[3px] rounded-full ring-2 ring-acento/30" />}
            </span>
          );
          const contenido = <>{punto}<span className={`text-[14px] font-medium whitespace-nowrap ${activo ? "text-tinta" : "text-tinta-3 hidden sm:inline"}`}>{nombre}</span></>;
          const llegable = n <= alcanzado && n !== actual && (n < 5 ? alcanzado < 5 : true);
          return (
            <li key={nombre} className={`flex items-center gap-1 sm:gap-2 ${i < NOMBRES.length - 1 ? "flex-1 min-w-0" : ""}`} aria-current={activo ? "step" : undefined}>
              {llegable
                ? <Link href={`/app/caso/${casoId}/${n === 5 ? "seguimiento" : n}`} aria-label={nombre} className="flex items-center gap-2 min-h-11">{contenido}</Link>
                : <span className="flex items-center gap-2 min-h-11">{contenido}</span>}
              {i < NOMBRES.length - 1 && <span aria-hidden className="relative h-[2px] flex-1 min-w-2 rounded-full bg-hundido overflow-hidden"><motion.span className="absolute inset-0 origin-left bg-acento" initial={false} animate={{ scaleX: hecho ? 1 : 0 }} transition={{ duration: .4 }} /></span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
