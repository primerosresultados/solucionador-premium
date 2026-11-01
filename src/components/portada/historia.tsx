"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { Check, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { Contador, CURVA, Medidor, Tecleo } from "@/components/movimiento/piezas";

const BEATS = [
  { etapa: "Paso 1", titulo: "Lo cuentas una vez.", texto: "Con tus palabras, sin ordenarlo. El copiloto lo lee y encuentra el problema de fondo.", P: Encuadre },
  { etapa: "Paso 2", titulo: "Eliges dónde está la causa.", texto: "Te muestra las causas más probables y cómo comprobarlas. Tú marcas la que te suena.", P: Causas },
  { etapa: "Paso 3", titulo: "Analiza veinte salidas por ti.", texto: "Genera ideas que no habías visto, sin juzgarlas, y después las evalúa con rigor.", P: Ideas },
  { etapa: "Paso 3", titulo: "Te quedas con la mejor.", texto: "Las compara, te muestra lo malo de cada una y busca el supuesto que podría tumbarla.", P: Decision },
  { etapa: "Paso 4", titulo: "Tu plan está listo.", texto: "Meta con número y fecha, pasos con prioridad y plan B. Solo lo revisas y partes.", P: Plan },
  { etapa: "Seguimiento", titulo: "Y no te suelta.", texto: "Te dice qué sigue, mide el resultado y te busca si desapareces. Hasta verificar que no volvió.", P: Seguimiento },
];

/** El producto contándose solo: el teléfono queda fijo y las pantallas cambian al bajar. */
export function Historia() {
  const ref = useRef<HTMLElement>(null);
  const [i, setI] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => setI(Math.min(BEATS.length - 1, Math.floor(v * BEATS.length))));
  const b = BEATS[i];
  return (
    <section ref={ref} id="como" className="escena-noche relative" style={{ height: `${BEATS.length * 90}svh` }} aria-label="Cómo funciona">
      <div className="grano sticky top-0 h-svh overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(50%_55%_at_72%_50%,#17248f,transparent_70%)]" />
        <div className="contenedor relative z-10 h-full grid lg:grid-cols-[1fr_auto] gap-x-20 items-center content-center gap-y-5">
          <div className="order-2 lg:order-1">
            <div className="hidden lg:flex gap-1.5 mb-8" aria-hidden>
              {BEATS.map((x, n) => (
                <span key={x.etapa} className="h-1 w-10 rounded-full overflow-hidden bg-white/15"><motion.span className="block h-full bg-sol" animate={{ width: n <= i ? "100%" : "0%" }} transition={{ duration: .4 }} /></span>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={i} initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: .32, ease: CURVA }}>
                <p className="text-[15px] font-medium text-sol">{b.etapa}</p>
                <h3 className="mt-1.5 text-[34px] sm:text-[62px] leading-[1.02] tracking-[-.035em]">{b.titulo}</h3>
                <p className="mt-3 text-[17px] sm:text-[21px] leading-[1.4] text-tinta-2 max-w-[27em]">{b.texto}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="order-1 lg:order-2 justify-self-center">
            <Telefono><AnimatePresence mode="wait"><motion.div key={i} className="h-full" initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: .25 }}><b.P /></motion.div></AnimatePresence></Telefono>
          </div>
        </div>
      </div>
    </section>
  );
}

function Telefono({ children }: { children: React.ReactNode }) {
  return (
    <div aria-hidden className="relative h-[min(52svh,640px)] lg:h-[min(82svh,660px)] aspect-[9/18.6] rounded-[42px] bg-[#0b0f33] p-[9px] ring-1 ring-white/20 shadow-[0_50px_120px_-30px_rgba(40,60,255,.65),inset_0_0_0_1px_rgba(255,255,255,.04)]">
      <div className="relative h-full overflow-hidden rounded-[34px] bg-[#f4f4f6] text-[#15171c]">
        <span className="absolute left-1/2 top-2 z-10 h-[20px] w-[78px] -translate-x-1/2 rounded-full bg-[#0b0f33]" />
        <div className="h-full pt-9 px-3.5 text-[13px] leading-snug lg:[zoom:1.24] lg:pt-8">{children}</div>
      </div>
    </div>
  );
}

const Cae = ({ i = 0, children, className }: { i?: number; children: React.ReactNode; className?: string }) => (
  <motion.div className={className} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4, ease: CURVA, delay: .12 * i }}>{children}</motion.div>
);
const Tarjeta = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <div className={`rounded-2xl bg-white p-3 shadow-[0_6px_16px_-10px_rgba(0,0,0,.25)] ${className}`}>{children}</div>;
const Copiloto = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl bg-[#0b0f33] text-white p-3"><p className="flex items-center gap-1.5 text-[11px] font-medium text-[#ffc83d]"><Sparkles size={12} /> Copiloto</p><div className="mt-1">{children}</div></div>
);

function Encuadre() {
  const [listo, setListo] = useState(false);
  return (
    <div className="space-y-2.5">
      <p className="font-semibold text-[18px] leading-tight">¿Qué está pasando?</p>
      <Tarjeta><p className="min-h-[76px]"><Tecleo velocidad={20} texto="Vendo harto pero a fin de mes no queda nada. Ya no sé dónde se va la plata y me tiene sin dormir." alTerminar={() => setListo(true)} /></p></Tarjeta>
      {listo && <Cae><Copiloto><p className="font-medium">Tu negocio vende, pero no sabes cuánto te deja cada venta.</p></Copiloto></Cae>}
      {listo && <Cae i={1}><Tarjeta><p className="text-[#6f737c] text-[11px]">¿Qué más podría ser?</p><p className="mt-0.5">¿Mezclo mi plata con la del negocio?</p></Tarjeta></Cae>}
    </div>
  );
}

function Causas() {
  const filas = [["Precios sin actualizar", "Suposición", false], ["Descuentos sin control", "Suposición", false], ["Retiros sin registrar", "Hecho", true], ["Costos que subieron", "Suposición", false]] as const;
  return (
    <div className="space-y-2">
      <p className="font-semibold text-[18px] leading-tight">¿Cómo llegó a pasar?</p>
      {filas.map(([t, e, raiz], i) => (
        <Cae key={t} i={i}>
          <motion.div animate={raiz ? { backgroundColor: ["#ffffff", "#ffffff", "#1c32c9"], color: ["#15171c", "#15171c", "#ffffff"] } : undefined} transition={{ duration: 1.1, delay: .6 }} className="rounded-2xl bg-white p-2.5 flex items-center justify-between gap-2 shadow-[0_6px_16px_-10px_rgba(0,0,0,.25)]">
            <span className="font-medium">{t}</span><span className="text-[10px] rounded-full bg-black/5 px-2 py-0.5 shrink-0">{e}</span>
          </motion.div>
        </Cae>
      ))}
      <Cae i={7}><p className="text-[12px] text-[#4a4e57] pl-1">¿Por qué? Porque nunca me fijé un sueldo.</p></Cae>
    </div>
  );
}

function Ideas() {
  const ideas = ["Subir precios", "Sueldo fijo", "Contador", "Vender a empresas", "Cobrar antes", "Cerrar un local", "Menos productos", "Reservar 10%", "Pedir ayuda", "Socio nuevo", "Paquetes", "Delegar"];
  return (
    <div>
      <p className="text-[#6f737c] text-[12px]">Llevas</p>
      <p className="font-semibold text-[54px] leading-none tracking-[-.04em]"><Contador valor={20} duracion={2.2} /></p>
      <div className="mt-2 h-1.5 rounded-full bg-black/10 overflow-hidden"><motion.div className="h-full bg-[#1c32c9] rounded-full" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 2.2, ease: CURVA }} /></div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {ideas.map((x, i) => (
          <motion.span key={x} initial={{ opacity: 0, scale: .6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * .13, type: "spring", stiffness: 400, damping: 18 }} className="rounded-full bg-white px-2.5 py-1 text-[12px] shadow-[0_4px_10px_-6px_rgba(0,0,0,.3)]">{x}</motion.span>
        ))}
      </div>
    </div>
  );
}

function Decision() {
  const op = [["Sueldo fijo y cuentas separadas", 86], ["Subir precios", 71], ["Contratar contador", 52]] as const;
  return (
    <div className="space-y-2.5">
      <p className="font-semibold text-[18px] leading-tight">¿Cuál es la mejor salida?</p>
      {op.map(([t, v], i) => (
        <Tarjeta key={t}>
          <div className="flex justify-between gap-2"><span className="font-medium">{t}</span><span className="font-semibold"><Contador valor={v} /></span></div>
          <div className="mt-1.5 h-1.5 rounded-full bg-black/10 overflow-hidden"><motion.div className={`h-full rounded-full ${i ? "bg-black/30" : "bg-[#1c32c9]"}`} initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 1, ease: CURVA, delay: i * .12 }} /></div>
        </Tarjeta>
      ))}
      <Cae i={6}><Copiloto><p>El supuesto crítico: tus clientes aceptan un alza del 8%. Pruébalo con diez esta semana.</p></Copiloto></Cae>
    </div>
  );
}

function Plan() {
  const pasos = [["A", "Separar las cuentas", "3 nov"], ["A", "Costear 10 productos", "10 nov"], ["A", "Subir precios", "20 nov"], ["B", "Eliminar descuentos", "25 nov"]];
  return (
    <div className="space-y-2">
      <Tarjeta><p className="text-[#6f737c] text-[11px]">Meta</p><p className="font-semibold">Margen mensual de 6% a 18%</p><p className="text-[12px] text-[#6f737c]">Antes del 29 de enero</p></Tarjeta>
      {pasos.map(([p, t, f], i) => (
        <Cae key={t} i={i + 1}>
          <div className="rounded-2xl bg-white p-2.5 flex items-center gap-2 shadow-[0_6px_16px_-10px_rgba(0,0,0,.25)]">
            <span className={`size-6 flex-none grid place-items-center rounded-lg text-[11px] font-semibold ${p === "A" ? "bg-[#1c32c9] text-white" : "bg-black/5"}`}>{p}</span>
            <span className="flex-1 min-w-0 font-medium truncate">{t}</span><span className="text-[11px] text-[#6f737c]">{f}</span>
          </div>
        </Cae>
      ))}
    </div>
  );
}

function Seguimiento() {
  return (
    <div className="space-y-2.5" style={{ "--color-hundido": "#e6e6ea", "--color-acento": "#1c32c9", "--color-tinta-3": "#6f737c" } as React.CSSProperties}>
      <div className="rounded-2xl bg-[#0b0f33] text-white p-3"><p className="text-[11px] text-[#ffc83d] font-medium">Ahora</p><p className="font-semibold text-[15px] leading-tight mt-0.5">Subir precios en los 4 productos bajo el margen</p></div>
      <div className="flex justify-center"><Medidor valor={82} tam={150} grosor={11} etiqueta="En ruta" /></div>
      <Tarjeta>
        <div className="flex justify-between text-[12px]"><span className="text-[#6f737c]">Margen mensual</span><span className="font-semibold">11% de 18%</span></div>
        <svg viewBox="0 0 200 54" className="mt-1 w-full">
          <line x1="4" y1="46" x2="196" y2="6" stroke="#b6b8be" strokeDasharray="2 5" strokeWidth="1.5" strokeLinecap="round" />
          <motion.path d="M4 46 L40 41 L72 36 L104 30 L128 26" fill="none" stroke="#1c32c9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: CURVA }} />
          <motion.circle cx="128" cy="26" r="4" fill="#ffc83d" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.1, type: "spring" }} />
        </svg>
      </Tarjeta>
      <Cae i={8}><div className="flex items-center gap-2 text-[12px]"><span className="size-5 grid place-items-center rounded-full bg-[#1d7a55] text-white"><Check size={12} strokeWidth={3} /></span> Separar las cuentas, hecho</div></Cae>
    </div>
  );
}
