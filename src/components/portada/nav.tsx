"use client";

import { motion, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/logo";

/** Cabecera de la portada: siempre presente, se condensa al bajar y ofrece empezar. */
export function NavPortada({ conSesion }: { conSesion: boolean }) {
  const { scrollY } = useScroll();
  const [abajo, setAbajo] = useState(false);
  const [cta, setCta] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => { setAbajo(y > 24); setCta(y > window.innerHeight * 1.1); });
  return (
    <header className="fixed inset-x-0 top-0 z-40 pointer-events-none">
      <div className="contenedor pt-2.5">
        <div className={`escena-noche !bg-transparent pointer-events-auto -mx-4 flex items-center justify-between gap-3 rounded-full h-[52px] pl-4 pr-1.5 transition-[background-color,box-shadow] duration-300 ${abajo ? "!bg-[#0b0f33cc] backdrop-blur-xl shadow-[0_12px_32px_-14px_rgba(0,0,0,.6)] ring-1 ring-white/10" : ""}`}>
          <Logo />
          <nav className="flex items-center gap-1" aria-label="Principal">
            <a href="#como" className="hidden md:inline-flex items-center px-3 min-h-11 text-[15px] font-medium text-tinta-2 hover:text-tinta transition-colors">Cómo funciona</a>
            <a href="#precio" className="hidden sm:inline-flex items-center px-3 min-h-11 text-[15px] font-medium text-tinta-2 hover:text-tinta transition-colors">Precio</a>
            <Link href={conSesion ? "/app" : "/ingresar"} className="inline-flex items-center px-3 sm:px-4 min-h-11 text-[15px] font-medium hover:text-tinta transition-colors">{conSesion ? "Mis casos" : "Entrar"}</Link>
            <motion.span className="overflow-hidden" initial={false} animate={{ width: cta ? "auto" : 0, opacity: cta ? 1 : 0 }} transition={{ duration: .25 }}>
              <a href="#empezar" tabIndex={cta ? 0 : -1} className="inline-flex items-center h-10 px-4 rounded-full bg-sol text-sol-tinta text-[15px] font-semibold whitespace-nowrap">Empezar</a>
            </motion.span>
          </nav>
        </div>
      </div>
    </header>
  );
}
