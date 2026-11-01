"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

const CITAS = [
  { t: "Lo que estorba el camino se convierte en el camino.", a: "Marco Aurelio", o: "Meditaciones, V, 20" },
  { t: "¿Resultados? ¡Hombre, he obtenido muchísimos resultados! Conozco varios miles de cosas que no funcionan.", a: "Thomas Edison", o: "citado en Edison: His Life and Inventions, 1910" },
  { t: "No es porque las cosas sean difíciles que no nos atrevemos; es porque no nos atrevemos que son difíciles.", a: "Séneca", o: "Cartas a Lucilio, 104" },
  { t: "No hay deshonra en fracasar con honestidad; la hay en tener miedo de fracasar.", a: "Henry Ford", o: "Mi vida y mi obra, 1922" },
];

/** Bajar mueve las citas hacia un lado. En móvil se deslizan con el dedo. */
export function Citas() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-62%"]);
  return (
    <>
      <section ref={ref} className="relative hidden lg:block h-[300svh]" aria-label="Lo que ya sabían">
        <div className="sticky top-0 h-svh overflow-hidden flex items-center">
          <motion.div style={{ x }} className="flex gap-6 pl-[max(32px,calc((100vw-1200px)/2))] w-max">
            {CITAS.map((c, i) => <Tarjeta key={c.a} c={c} i={i} />)}
          </motion.div>
        </div>
      </section>
      <section className="lg:hidden py-16" aria-label="Lo que ya sabían">
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-5 pb-3 [scrollbar-width:none]">
          {CITAS.map((c, i) => <Tarjeta key={c.a} c={c} i={i} />)}
        </div>
      </section>
    </>
  );
}

function Tarjeta({ c, i }: { c: (typeof CITAS)[number]; i: number }) {
  const oscura = i % 2 === 1;
  return (
    <figure className={`snap-center shrink-0 w-[84vw] lg:w-[620px] h-[440px] lg:h-[520px] rounded-[32px] p-7 lg:p-11 flex flex-col justify-between ${oscura ? "bg-cobalto text-papel" : "bg-superficie text-tinta shadow-suave"}`}>
      <span aria-hidden className={`text-[96px] leading-[.7] font-semibold ${oscura ? "text-sol" : "text-cobalto"}`}>«</span>
      <blockquote className="font-semibold text-[27px] lg:text-[38px] leading-[1.1] tracking-[-.03em]">{c.t}</blockquote>
      <figcaption className="text-[15px] opacity-75"><strong className="font-medium">{c.a}</strong><br /><cite className="not-italic">{c.o}</cite></figcaption>
    </figure>
  );
}
