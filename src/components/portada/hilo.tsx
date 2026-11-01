"use client";

import { useState } from "react";

/**
 * El hilo: entra dando vueltas y termina recto en un punto. Es un resorte cuya
 * amplitud se apaga a lo largo del recorrido, calculado para que dibuje igual
 * en servidor y cliente.
 */
function resorte(ancho: number, alto: number, vueltas: number, fin: number) {
  const medio = alto / 2, puntos = 900, l: string[] = [];
  for (let i = 0; i <= puntos; i++) {
    const t = i / puntos;
    const apaga = Math.max(0, 1 - t / fin);
    const amplitud = apaga * apaga * (3 - 2 * apaga);
    const fase = t * vueltas * Math.PI * 2;
    const rx = amplitud * alto * .62, ry = amplitud * alto * .44;
    const x = -rx + t * (ancho + rx) + Math.sin(fase) * rx;
    const y = medio + Math.cos(fase) * ry * (1 + .22 * Math.sin(fase * .37));
    l.push(`${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return l.join("");
}

function Trazo({ ancho, alto, vueltas, fin, grosor, sol, className }: {
  ancho: number; alto: number; vueltas: number; fin: number; grosor: number; sol: number; className: string;
}) {
  const x = ancho - sol * 3;
  // Una vez dibujado queda fijo: si no, girar el teléfono repite la animación y lo borra.
  const [listo, setListo] = useState(false);
  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} className={className} aria-hidden fill="none">
      <clipPath id={`hasta-${ancho}`}><rect width={x} height={alto} /></clipPath>
      <g clipPath={`url(#hasta-${ancho})`}>
        <path d={resorte(ancho, alto, vueltas, fin)} pathLength={1} className={listo ? "" : "hilo"} stroke="var(--color-papel)" strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <circle cx={x} cy={alto / 2} r={sol} fill="var(--color-sol)" className={listo ? "" : "hilo-sol"} onAnimationEnd={() => setListo(true)} />
    </svg>
  );
}

export function Hilo() {
  return (
    <>
      <Trazo ancho={1440} alto={190} vueltas={26} fin={.74} grosor={3} sol={13} className="hidden sm:block w-full h-auto" />
      <Trazo ancho={430} alto={120} vueltas={12} fin={.8} grosor={2.5} sol={9} className="sm:hidden block w-full h-auto" />
    </>
  );
}
