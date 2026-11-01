"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

export const celebrar = (texto: string, detalle?: string) =>
  window.dispatchEvent(new CustomEvent("celebrar", { detail: { texto, detalle } }));

const RAYOS = Array.from({ length: 16 }, (_, i) => (i / 16) * 360);

/** Un instante de reconocimiento al avanzar. No bloquea nada: se puede seguir tocando. */
export function Celebraciones() {
  const [actual, setActual] = useState<{ id: number; texto: string; detalle?: string } | null>(null);
  const quieto = useReducedMotion();
  useEffect(() => {
    const oir = (e: Event) => {
      const { texto, detalle } = (e as CustomEvent).detail;
      setActual({ id: Date.now(), texto, detalle });
    };
    window.addEventListener("celebrar", oir);
    return () => window.removeEventListener("celebrar", oir);
  }, []);
  useEffect(() => {
    if (!actual) return;
    const t = setTimeout(() => setActual(null), 1500);
    return () => clearTimeout(t);
  }, [actual]);
  if (quieto) return null;
  return (
    <AnimatePresence>
      {actual && (
        <motion.div key={actual.id} aria-live="polite" className="fixed inset-0 z-50 grid place-items-center pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .22 }}>
          <div className="relative grid place-items-center">
            {RAYOS.map((g, i) => (
              <motion.span key={g} className="absolute h-[3px] w-14 origin-left rounded-full bg-sol" style={{ rotate: g }}
                initial={{ x: 44, scaleX: 0, opacity: 1 }} animate={{ x: 130 + (i % 3) * 22, scaleX: [0, 1, 0], opacity: [1, 1, 0] }} transition={{ duration: .85, ease: "easeOut" }} />
            ))}
            <motion.div className="relative rounded-[28px] bg-noche px-7 py-5 text-center text-white shadow-[0_30px_80px_-20px_rgba(10,20,120,.8)] ring-1 ring-white/15"
              initial={{ scale: .7, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .96 }} transition={{ type: "spring", stiffness: 420, damping: 24 }}>
              <p className="text-[22px] font-semibold tracking-[-.02em]">{actual.texto}</p>
              {actual.detalle && <p className="mt-0.5 text-[15px] text-[#bcc3ec]">{actual.detalle}</p>}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
