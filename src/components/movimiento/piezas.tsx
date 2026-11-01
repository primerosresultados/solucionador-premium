"use client";

import { animate, motion, useInView, useScroll, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

export const CURVA = [.22, 1, .36, 1] as const;

/** Número que corre hasta su valor al entrar en pantalla. */
export function Contador({ valor, prefijo = "", sufijo = "", duracion = 1.2 }: { valor: number; prefijo?: string; sufijo?: string; duracion?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const visto = useInView(ref, { once: true });
  const [n, setN] = useState(valor);
  useEffect(() => {
    if (!visto) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = animate(0, valor, { duration: duracion, ease: CURVA, onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [visto, valor, duracion]);
  return <span ref={ref} className="tabular-nums">{prefijo}{n.toLocaleString("es-CL")}{sufijo}</span>;
}

/** Arco de medición: el dato manda, el arco lo acompaña. */
export function Medidor({ valor, tam = 180, grosor = 12, etiqueta, color = "url(#medidor)" }: {
  valor: number; tam?: number; grosor?: number; etiqueta?: string; color?: string;
}) {
  const r = (tam - grosor) / 2, largo = 2 * Math.PI * r * .75;
  return (
    <div className="relative" style={{ width: tam, height: tam * .86 }} role="img" aria-label={`${etiqueta ?? "Salud"}: ${valor} de 100`}>
      <svg width={tam} height={tam} viewBox={`0 0 ${tam} ${tam}`} className="block" aria-hidden>
        <defs>
          <linearGradient id="medidor" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="var(--color-acento)" /><stop offset=".7" stopColor="var(--color-luz)" /><stop offset="1" stopColor="var(--color-sol)" />
          </linearGradient>
        </defs>
        <g transform={`rotate(135 ${tam / 2} ${tam / 2})`} fill="none" strokeWidth={grosor} strokeLinecap="round">
          <circle cx={tam / 2} cy={tam / 2} r={r} stroke="var(--color-hundido)" strokeDasharray={`${largo} ${2 * Math.PI * r}`} />
          <motion.circle cx={tam / 2} cy={tam / 2} r={r} stroke={color} strokeDasharray={`${largo} ${2 * Math.PI * r}`}
            initial={{ strokeDashoffset: largo }} whileInView={{ strokeDashoffset: largo * (1 - valor / 100) }}
            viewport={{ once: true }} transition={{ duration: 1.3, ease: CURVA }} />
        </g>
      </svg>
      <div className="absolute inset-x-0 top-[34%] text-center">
        <p className="font-semibold leading-none tracking-[-.04em]" style={{ fontSize: tam * .3 }}><Contador valor={valor} /></p>
        {etiqueta && <p className="mt-1 text-[13px] text-tinta-3">{etiqueta}</p>}
      </div>
    </div>
  );
}

/** Texto que se enciende palabra por palabra mientras se avanza. */
export function PalabrasScroll({ texto, className }: { texto: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start .85", "end .45"] });
  const palabras = texto.split(" ");
  return (
    <p ref={ref} className={className} aria-label={texto}>
      {palabras.map((p, i) => <Palabra key={i} p={scrollYProgress} rango={[i / palabras.length, (i + 1.5) / palabras.length]}>{p}</Palabra>)}
    </p>
  );
}

function Palabra({ p, rango, children }: { p: MotionValue<number>; rango: [number, number]; children: string }) {
  const opacity = useTransform(p, rango, [.14, 1]);
  return <motion.span aria-hidden style={{ opacity }} className="inline-block mr-[.24em]">{children}</motion.span>;
}

/** Título que sube línea a línea: revela, no decora. */
export function Titulo({ children, className, como: Tag = "h2" }: { children: string; className?: string; como?: "h1" | "h2" | "h3" }) {
  const palabras = children.split(" ");
  const Encabezado = motion[Tag];
  // La vista se observa en el título: cada palabra parte oculta por su recorte y nunca «entraría».
  return (
    <Encabezado className={className} aria-label={children} initial="oculto" whileInView="visible" viewport={{ once: true, margin: "-8% 0px" }}>
      {palabras.map((p, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden align-bottom mr-[.22em] pb-[.08em] -mb-[.08em]">
          <motion.span className="inline-block" variants={{ oculto: { y: "110%" }, visible: { y: 0 } }}
            transition={{ duration: .7, ease: CURVA, delay: i * .035 }}>{p}</motion.span>
        </span>
      ))}
    </Encabezado>
  );
}

export function Aparece({ children, retraso = 0, className }: { children: ReactNode; retraso?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }} transition={{ duration: .6, ease: CURVA, delay: retraso }}>
      {children}
    </motion.div>
  );
}

/** Escritura en vivo. */
export function Tecleo({ texto, velocidad = 26, alTerminar }: { texto: string; velocidad?: number; alTerminar?: () => void }) {
  const [n, setN] = useState(0);
  const termino = useRef(alTerminar);
  useEffect(() => { termino.current = alTerminar; });
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { termino.current?.(); return; }
    const i = setInterval(() => setN((x) => {
      if (x >= texto.length) { clearInterval(i); termino.current?.(); return x; }
      return x + 1;
    }), velocidad);
    return () => clearInterval(i);
  }, [texto, velocidad]);
  const quieto = typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  return <>{quieto ? texto : texto.slice(0, n)}<span aria-hidden className={n >= texto.length || quieto ? "hidden" : "inline-block w-[2px] h-[1em] -mb-[.15em] ml-[1px] bg-current"} /></>;
}

