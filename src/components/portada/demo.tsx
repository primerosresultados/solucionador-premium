"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { CURVA } from "@/components/movimiento/piezas";

const CASOS = [
  { corto: "Mi negocio no deja plata", parecia: "No estoy vendiendo lo suficiente.", era: "No sé cuánto me deja cada venta.", raiz: "Mezclo la plata del negocio con la mía.", paso: "Abrir una cuenta solo para el negocio.", meta: "Margen mensual de 6% a 18% en 90 días" },
  { corto: "Las deudas me ahogan", parecia: "Gano muy poco.", era: "Pago el mínimo en todo y los intereses crecen.", raiz: "Nunca vi el total ni decidí un orden de pago.", paso: "Anotar cada deuda con su saldo y su tasa.", meta: "Cuotas de 65% a 35% del sueldo en 6 meses" },
  { corto: "Mi socio y yo no nos hablamos", parecia: "Tenemos caracteres incompatibles.", era: "Cada uno cree que hace más que el otro.", raiz: "Nunca escribimos quién responde por qué.", paso: "Pedir una reunión con un solo tema: los roles.", meta: "8 reuniones semanales cumplidas seguidas" },
  { corto: "No sé si renunciar", parecia: "Odio mi trabajo.", era: "No sé cuánto aguanto sin sueldo ni qué haría después.", raiz: "Estoy decidiendo con rabia y sin números.", paso: "Calcular cuántos meses de gastos tengo cubiertos.", meta: "De 1 a 6 meses de gastos cubiertos antes de decidir" },
];

export function Demo() {
  const [i, setI] = useState(0);
  const c = CASOS[i];
  const filas = [["Lo que parecía", c.parecia], ["Lo que era", c.era], ["La causa raíz", c.raiz], ["Tu primer paso", c.paso], ["Cómo sabrás que funcionó", c.meta]] as const;
  return (
    <div className="grid lg:grid-cols-[.82fr_1.18fr] gap-8 lg:gap-16 items-start">
      <div role="tablist" aria-label="Ejemplos" className="relative flex flex-col gap-1 -mx-1">
        {CASOS.map((x, n) => (
          <button key={x.corto} role="tab" aria-selected={n === i} onClick={() => setI(n)}
            className={`relative text-left rounded-2xl px-4 py-3 min-h-14 font-semibold tracking-[-.02em] text-[20px] sm:text-[25px] leading-tight transition-colors duration-200 ${n === i ? "text-white" : "text-tinta-2 hover:text-tinta"}`}>
            {n === i && <motion.span layoutId="ejemplo" className="absolute inset-0 rounded-2xl bg-cobalto shadow-[0_18px_40px_-16px_rgba(28,50,201,.7)]" transition={{ type: "spring", stiffness: 340, damping: 32 }} />}
            <span className="relative">{x.corto}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.ol key={i} className="relative" exit={{ opacity: 0, transition: { duration: .12 } }}>
          <motion.span aria-hidden className="absolute left-[6px] top-3 bottom-3 w-[2px] origin-top bg-gradient-to-b from-tinta-3 via-cobalto to-sol" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: .8, ease: CURVA }} />
          {filas.map(([etiqueta, texto], n) => {
            const ultimo = n === filas.length - 1;
            return (
              <motion.li key={etiqueta} className="relative pl-8 pb-6 last:pb-0" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .4, ease: CURVA, delay: n * .1 }}>
                <span aria-hidden className={`absolute left-0 top-[7px] size-[14px] rounded-full ring-4 ring-lienzo ${ultimo ? "bg-sol" : n === 0 ? "bg-tinta-3" : "bg-cobalto"}`} />
                <p className="text-[14px] font-medium text-tinta-3">{etiqueta}</p>
                <p className={`mt-0.5 text-[20px] sm:text-[24px] leading-snug tracking-[-.01em] ${n === 0 ? "text-tinta-3 line-through decoration-1" : n === 3 ? "font-semibold" : ""}`}>{texto}</p>
              </motion.li>
            );
          })}
        </motion.ol>
      </AnimatePresence>
    </div>
  );
}
