"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

const CITAS = [
  { t: "Lo que estorba el camino se convierte en el camino.", a: "Marco Aurelio", o: "Meditaciones, V, 20" },
  { t: "¿Resultados? ¡Hombre, he obtenido muchísimos resultados! Conozco varios miles de cosas que no funcionan.", a: "Thomas Edison", o: "citado en Edison: His Life and Inventions, 1910" },
  { t: "No es porque las cosas sean difíciles que no nos atrevemos; es porque no nos atrevemos que son difíciles.", a: "Séneca", o: "Cartas a Lucilio, 104" },
  { t: "No hay deshonra en fracasar con honestidad; la hay en tener miedo de fracasar.", a: "Henry Ford", o: "Mi vida y mi obra, 1922" },
];

/** Carrusel nativo: se desliza con el dedo, el trackpad o las flechas, sin tocar el scroll de la página. */
export function Citas() {
  const fila = useRef<HTMLDivElement>(null);
  const mover = (dir: number) => fila.current?.scrollBy({ left: dir * (fila.current.clientWidth * .6), behavior: "smooth" });
  return (
    <section className="pb-20 sm:pb-32" aria-label="Lo que ya sabían">
      <div className="contenedor flex items-end justify-between gap-4 mb-8">
        <h2 className="text-[40px] sm:text-[72px] leading-[1.02] tracking-[-.04em]">Esto no es nuevo.</h2>
        <div className="hidden sm:flex gap-2 shrink-0">
          <button aria-label="Cita anterior" onClick={() => mover(-1)} className="size-12 grid place-items-center rounded-full bg-hundido hover:bg-acento-suave transition-colors"><ChevronLeft size={20} /></button>
          <button aria-label="Cita siguiente" onClick={() => mover(1)} className="size-12 grid place-items-center rounded-full bg-hundido hover:bg-acento-suave transition-colors"><ChevronRight size={20} /></button>
        </div>
      </div>
      <div ref={fila} className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-5 sm:px-[max(32px,calc((100vw-1200px)/2))] scroll-px-5 sm:scroll-px-[max(32px,calc((100vw-1200px)/2))]">
        {CITAS.map((c, i) => {
          const oscura = i % 2 === 1;
          return (
            <figure key={c.a} className={`snap-start shrink-0 w-[84vw] sm:w-[520px] h-[400px] sm:h-[460px] rounded-[32px] p-7 sm:p-10 flex flex-col justify-between ${oscura ? "bg-cobalto text-papel" : "bg-superficie text-tinta shadow-suave"}`}>
              <span aria-hidden className={`text-[96px] leading-[.7] font-semibold ${oscura ? "text-sol" : "text-cobalto"}`}>«</span>
              <blockquote className="font-semibold text-[26px] sm:text-[33px] leading-[1.12] tracking-[-.03em]">{c.t}</blockquote>
              <figcaption className="text-[15px] opacity-75"><strong className="font-medium">{c.a}</strong><br /><cite className="not-italic">{c.o}</cite></figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
