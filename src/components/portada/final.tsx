"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Entrada } from "./entrada";

/** El sol del comienzo crece hasta llenar la pantalla. */
export function Final({ destino }: { destino: string }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const escala = useTransform(scrollYProgress, [.12, .62], [.012, 1]);
  const texto = useTransform(scrollYProgress, [.5, .72], [0, 1]);
  const y = useTransform(scrollYProgress, [.5, .72], [40, 0]);
  return (
    <section ref={ref} id="empezar" className="escena-noche relative h-[170svh]">
      <div className="sticky top-0 h-svh overflow-hidden grid place-items-center">
        <motion.div aria-hidden style={{ scale: escala }} className="absolute left-1/2 top-1/2 -ml-[120vmax] -mt-[120vmax] size-[240vmax] rounded-full bg-sol shadow-[0_0_120px_40px_rgba(255,200,61,.5)]" />
        <motion.div style={{ opacity: texto, y }} className="contenedor relative z-10 grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-16 items-center text-sol-tinta">
          <figure>
            <blockquote className="font-semibold tracking-[-.035em] text-[36px] sm:text-[62px] leading-[1.02]">«El fracaso es solo la oportunidad de volver a empezar con más inteligencia.»</blockquote>
            <figcaption className="mt-4 text-[16px] opacity-75">Henry Ford, <cite className="not-italic">Mi vida y mi obra, 1922</cite></figcaption>
          </figure>
          <div className="[&_form]:bg-sol-tinta/90 [&_form]:text-papel">
            <p className="text-[21px] font-semibold mb-3">Empieza hoy. Lo primero es escribirlo.</p>
            <Entrada destino={destino} id="relato-cierre" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
