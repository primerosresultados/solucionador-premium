"use client";

import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import { HiloLienzo } from "@/components/movimiento/hilo-lienzo";
import { CURVA } from "@/components/movimiento/piezas";
import { Entrada } from "./entrada";

/** La escena fija: bajar es desenredar. Al final queda la línea y el sol. */
export function Heroe({ destino }: { destino: string }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: .4 });
  const opacidad1 = useTransform(p, [0, .34], [1, 0]);
  const y1 = useTransform(p, [0, .34], [0, -46]);
  const eventos = useTransform(p, (v) => (v < .28 ? "auto" : "none"));
  const opacidad2 = useTransform(p, [.55, .82], [0, 1]);
  const y2 = useTransform(p, [.55, .82], [46, 0]);
  const pistaOp = useTransform(p, [0, .08], [1, 0]);

  return (
    <section ref={ref} className="escena-noche relative h-[165svh]">
      <div className="grano sticky top-0 h-svh overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_60%_at_18%_44%,#1b2bb0_0%,transparent_70%),radial-gradient(45%_40%_at_92%_46%,rgba(255,200,61,.14),transparent_70%)]" />
        <HiloLienzo progreso={p} centro={.455} />

        <div className="contenedor relative z-10 flex h-full flex-col pt-[68px]">
          <motion.div style={{ opacity: opacidad1, y: y1, pointerEvents: eventos }} className="flex flex-1 flex-col">
            <h1 className="pt-5 sm:pt-7 font-semibold text-[56px] leading-[.98] sm:text-[clamp(60px,8.6vw,124px)] tracking-[-.04em]">
              {"Deja de darle vueltas.".split(" ").map((x, i) => (
                <span key={i} className="inline-block overflow-hidden align-bottom mr-[.22em] pb-[.1em] -mb-[.1em]">
                  <motion.span className="inline-block" initial={{ y: "112%" }} animate={{ y: 0 }} transition={{ duration: .9, ease: CURVA, delay: .1 + i * .07 }}>{x}</motion.span>
                </span>
              ))}
            </h1>
            <div className="mt-auto pb-7 sm:pb-10 grid lg:grid-cols-[1fr_1.15fr] gap-5 lg:gap-14 items-end">
              <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, ease: CURVA, delay: .55 }}
                className="text-[18px] sm:text-[22px] leading-[1.35] text-tinta-2 max-w-[26em] [@media(max-height:760px)]:hidden">
                Cuéntalo una vez. La IA hace el análisis, tú eliges lo que más te hace sentido y en minutos tienes un plan que te acompaña hasta resolverlo.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, ease: CURVA, delay: .7 }}>
                <Entrada destino={destino} />
                <p className="mt-3 text-[15px] text-tinta-2">Escríbelo o dilo en voz alta. Gratis, sin tarjeta y solo tú lo lees.</p>
              </motion.div>
            </div>
          </motion.div>

          <motion.div style={{ opacity: opacidad2, y: y2 }} className="contenedor pointer-events-none !absolute inset-x-0 top-[56%]">
            <p className="font-semibold text-[64px] sm:text-[clamp(84px,12vw,176px)] leading-none tracking-[-.045em]">Resuélvelo.</p>
            <p className="mt-3 text-[18px] sm:text-[22px] text-tinta-2">En cuatro decisiones, desde hoy hasta que deje de ser un problema.</p>
          </motion.div>
        </div>

        <motion.span aria-hidden style={{ opacity: pistaOp }} className="absolute z-10 bottom-3 left-1/2 -translate-x-1/2 h-8 w-[2px] overflow-hidden rounded-full bg-white/15 hidden sm:block">
          <motion.span className="block h-1/2 w-full bg-sol" animate={{ y: ["-100%", "200%"] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} />
        </motion.span>
      </div>
    </section>
  );
}
