"use client";

import { motion } from "motion/react";
import { Check, Lock, Trash2, X } from "lucide-react";
import { Aparece, CURVA } from "@/components/movimiento/piezas";

const vista = { once: true, margin: "-10% 0px" } as const;

function EscenaDecides() {
  return (
    <div className="space-y-2 w-full max-w-[290px]">
      {[["Subir precios 8%", true], ["Cerrar el local", false]].map(([t, si], i) => (
        <motion.div key={t as string} initial={{ opacity: 0, x: -14 }} whileInView={{ opacity: 1, x: 0 }} viewport={vista} transition={{ delay: i * .18 + .1, ease: CURVA, duration: .5 }} className="flex items-center gap-2 rounded-xl bg-hundido px-3 py-2.5 text-[14px]">
          <span className="flex-1">{t as string}</span>
          <motion.span initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={vista} transition={{ delay: i * .18 + .6, type: "spring", stiffness: 400, damping: 15 }} className={`size-6 grid place-items-center rounded-full ${si ? "bg-bien text-superficie" : "bg-tinta-3 text-superficie"}`}>{si ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}</motion.span>
        </motion.div>
      ))}
    </div>
  );
}

function EscenaPrivado() {
  return (
    <div className="relative grid place-items-center size-[120px]">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="absolute inset-0 rounded-full ring-1 ring-cobalto/40" animate={{ scale: [.5, 1.25], opacity: [.8, 0] }} transition={{ duration: 2.6, repeat: Infinity, delay: i * .85, ease: "easeOut" }} />
      ))}
      <span className="relative size-14 grid place-items-center rounded-2xl bg-cobalto text-papel shadow-[0_12px_30px_-10px_rgba(28,50,201,.8)]"><Lock size={22} /></span>
    </div>
  );
}

function EscenaGratis() {
  return (
    <div className="w-full max-w-[290px]">
      <div className="flex gap-1">
        {Array.from({ length: 10 }, (_, i) => (
          <motion.span key={i} className={`h-2.5 flex-1 rounded-full ${i === 0 ? "bg-sol" : "bg-hundido"}`} initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={vista} transition={{ delay: i * .05, duration: .4, ease: CURVA }} />
        ))}
      </div>
      <p className="mt-2 text-[14px] text-tinta-2">La etapa 1 corre por nuestra cuenta.</p>
    </div>
  );
}

function EscenaBorrar() {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-hundido px-4 py-3">
      <motion.span animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: .5, repeat: Infinity, repeatDelay: 2.4 }}><Trash2 size={22} className="text-tinta-2" /></motion.span>
      <span className="text-[14px] text-tinta-2">Descargas o borras todo cuando quieras</span>
    </div>
  );
}

const ITEMS = [
  { t: "Tú decides.", d: "La IA pregunta, cuestiona y propone. Nada entra a tu caso sin que lo aceptes.", E: EscenaDecides, c: "lg:col-span-7" },
  { t: "Lo tuyo es tuyo.", d: "Solo tú lees tu caso, y no se usa para entrenar modelos.", E: EscenaPrivado, c: "lg:col-span-5" },
  { t: "Pruebas antes de pagar.", d: "Sin tarjeta. Pagas si quieres seguir, una sola vez, con Flow.", E: EscenaGratis, c: "lg:col-span-5" },
  { t: "Sin promesas de milagro.", d: "No reemplaza a un médico, un abogado ni un terapeuta. Es un método para ordenar y actuar.", E: EscenaBorrar, c: "lg:col-span-7" },
];

export function Confianza() {
  return (
    <div className="grid lg:grid-cols-12 gap-3">
      {ITEMS.map(({ t, d, E, c }, i) => (
        <Aparece key={t} retraso={i * .06} className={c}>
          <article className="h-full min-h-[270px] rounded-[28px] bg-superficie shadow-suave p-6 sm:p-8 flex flex-col justify-between gap-6 transition-transform duration-300 hover:-translate-y-1">
            <div className="min-h-[92px] flex items-center"><E /></div>
            <div><h3 className="text-[23px]">{t}</h3><p className="mt-1 text-[17px] leading-relaxed text-tinta-2 max-w-[32em]">{d}</p></div>
          </article>
        </Aparece>
      ))}
    </div>
  );
}
