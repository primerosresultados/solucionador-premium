"use client";

import { useState } from "react";

const CASOS = [
  { corto: "Mi negocio no deja plata", parecia: "No estoy vendiendo lo suficiente.", era: "No sé cuánto me deja cada venta.", raiz: "Mezclo la plata del negocio con la mía.", paso: "Abrir una cuenta solo para el negocio.", meta: "Margen mensual de 6% a 18% en 90 días" },
  { corto: "Las deudas me ahogan", parecia: "Gano muy poco.", era: "Pago el mínimo en todo y los intereses crecen.", raiz: "Nunca vi el total ni decidí un orden de pago.", paso: "Anotar cada deuda con su saldo y su tasa.", meta: "Cuotas de 65% a 35% del sueldo en 6 meses" },
  { corto: "Mi socio y yo no nos hablamos", parecia: "Tenemos caracteres incompatibles.", era: "Cada uno cree que hace más que el otro.", raiz: "Nunca escribimos quién responde por qué.", paso: "Pedir una reunión con un solo tema: los roles.", meta: "8 reuniones semanales cumplidas seguidas" },
  { corto: "No sé si renunciar", parecia: "Odio mi trabajo.", era: "No sé cuánto aguanto sin sueldo ni qué haría después.", raiz: "Estoy decidiendo con rabia y sin números.", paso: "Calcular cuántos meses de gastos tengo cubiertos.", meta: "De 1 a 6 meses de gastos cubiertos antes de decidir" },
];

export function Demo() {
  const [i, setI] = useState(0);
  const c = CASOS[i];
  const filas = [
    ["Lo que parecía", c.parecia, "text-tinta-3 line-through decoration-1"],
    ["Lo que era", c.era, ""],
    ["La causa raíz", c.raiz, ""],
    ["Tu primer paso", c.paso, "font-semibold"],
    ["Cómo sabrás que funcionó", c.meta, ""],
  ] as const;
  return (
    <div className="grid lg:grid-cols-[.8fr_1.2fr] gap-8 lg:gap-16">
      <div role="tablist" aria-label="Ejemplos" className="flex flex-col gap-1 -mx-1">
        {CASOS.map((x, n) => (
          <button key={x.corto} role="tab" aria-selected={n === i} onClick={() => setI(n)}
            className={`text-left rounded-2xl px-4 py-3 min-h-14 font-titulo font-semibold text-[21px] sm:text-[26px] leading-tight transition-colors duration-150 ${n === i ? "bg-acento text-acento-tinta" : "text-tinta-2 hover:bg-hundido"}`}>
            {x.corto}
          </button>
        ))}
      </div>
      <ol key={i} className="aparecer relative">
        <span aria-hidden className="absolute left-[6px] top-3 bottom-3 w-[2px] bg-hundido" />
        {filas.map(([etiqueta, texto, clase], n) => (
          <li key={etiqueta} className="relative pl-8 pb-6 last:pb-0">
            <span aria-hidden className={`absolute left-0 top-[7px] size-[14px] rounded-full ${n === filas.length - 1 ? "bg-sol" : n === 0 ? "bg-tinta-3" : "bg-acento"}`} />
            <p className="text-[14px] font-semibold text-tinta-3">{etiqueta}</p>
            <p className={`mt-0.5 text-[20px] sm:text-[24px] leading-snug ${clase}`}>{texto}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
