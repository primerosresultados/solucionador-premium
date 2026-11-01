"use client";

import { useMotionValue } from "motion/react";
import { HiloLienzo } from "./hilo-lienzo";

/** La cinta sola, para dar fondo vivo a un panel oscuro. */
export function PanelHilo({ avance = .2, centro = .5, compacto = true }: { avance?: number; centro?: number; compacto?: boolean }) {
  const p = useMotionValue(avance);
  return <HiloLienzo progreso={p} centro={centro} compacto={compacto} />;
}
