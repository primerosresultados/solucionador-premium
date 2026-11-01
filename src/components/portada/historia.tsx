"use client";

import { AnimatePresence, motion, useInView } from "motion/react";
import { Check, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
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

const DURACION = 7.5;

/** El producto contándose solo. Avanza por su cuenta y cede el control apenas la persona lo toma. */
export function Historia() {
  const ref = useRef<HTMLElement>(null);
  const visible = useInView(ref, { amount: .45 });
  const [i, setI] = useState(0);
  const [encima, setEncima] = useState(false);
  const [elegido, setElegido] = useState(false);
  const corre = visible && !encima && !elegido;
  const ir = (n: number) => { setI((n + BEATS.length) % BEATS.length); setElegido(true); };
  const b = BEATS[i];

  return (
    <section ref={ref} id="como" className="escena-noche grano relative scroll-mt-16" aria-label="Cómo funciona">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(50%_55%_at_74%_50%,#17248f,transparent_70%)]" />
      <div className="contenedor relative z-10 py-20 sm:py-28">
        <div className="grid lg:grid-cols-[1fr_auto] gap-x-20 gap-y-6 lg:items-center">
          <h2 className="lg:col-start-1 lg:self-end text-[38px] sm:text-[60px] leading-[1.03] tracking-[-.04em] max-w-[13em]">Cuatro decisiones y tienes tu plan.</h2>
          <div role="tablist" aria-label="Pasos" className="hidden lg:block lg:col-start-1 lg:self-start lg:mt-4" onMouseEnter={() => setEncima(true)} onMouseLeave={() => setEncima(false)}>
            {BEATS.map((x, n) => {
              const activo = n === i;
              return (
                <button key={x.titulo} role="tab" aria-selected={activo} onClick={() => ir(n)} className="group relative block w-full text-left py-4 border-t border-white/10 last:border-b">
                  <span aria-hidden className="absolute -top-px left-0 h-px overflow-hidden" style={{ width: "100%" }}>
                    {activo && <span className={`relleno block h-full bg-sol ${corre ? "" : "pausado"} ${elegido ? "lleno" : ""}`} style={{ "--d": `${DURACION}s` } as React.CSSProperties} onAnimationEnd={() => setI((v) => (v + 1) % BEATS.length)} />}
                  </span>
                  <span className="flex items-baseline gap-3">
                    <span className={`text-[14px] font-medium w-24 shrink-0 transition-colors ${activo ? "text-sol" : "text-tinta-3"}`}>{x.etapa}</span>
                    <span className={`text-[24px] font-semibold tracking-[-.025em] leading-tight transition-colors ${activo ? "text-tinta" : "text-tinta-3 group-hover:text-tinta-2"}`}>{x.titulo}</span>
                  </span>
                  <AnimatePresence initial={false}>
                    {activo && (
                      <motion.span className="block overflow-hidden pl-[108px]" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .28, ease: CURVA }}>
                        <span className="block pt-2 text-[17px] leading-[1.4] text-tinta-2 max-w-[28em]">{x.texto}</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>

          <motion.div className="justify-self-center touch-pan-y lg:col-start-2 lg:row-start-1 lg:row-span-2" drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={.18}
            onDragEnd={(_, d) => { if (Math.abs(d.offset.x) > 44) ir(i + (d.offset.x < 0 ? 1 : -1)); }}
            onMouseEnter={() => setEncima(true)} onMouseLeave={() => setEncima(false)}>
            <Telefono><AnimatePresence mode="wait"><motion.div key={i} className="h-full" initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: .22 }}><b.P /></motion.div></AnimatePresence></Telefono>
          </motion.div>

          <div className="lg:hidden">
            <AnimatePresence mode="wait">
              <motion.div key={i} className="min-h-[136px]" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .22, ease: CURVA }}>
                <p className="text-[15px] font-medium text-sol">{b.etapa}</p>
                <h3 className="mt-1 text-[27px] leading-[1.08] tracking-[-.03em]">{b.titulo}</h3>
                <p className="mt-2 text-[17px] leading-[1.4] text-tinta-2">{b.texto}</p>
              </motion.div>
            </AnimatePresence>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex items-center" role="tablist" aria-label="Pasos">
                {BEATS.map((x, n) => (
                  <button key={x.titulo} role="tab" aria-selected={n === i} aria-label={x.titulo} onClick={() => ir(n)} className="h-11 w-8 grid place-items-center">
                    <span className={`block h-1.5 rounded-full transition-all duration-200 ${n === i ? "w-5 bg-sol" : "w-1.5 bg-white/25"}`} />
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button aria-label="Anterior" onClick={() => ir(i - 1)} className="size-11 grid place-items-center rounded-full bg-white/10"><ChevronLeft size={20} /></button>
                <button aria-label="Siguiente" onClick={() => ir(i + 1)} className="size-11 grid place-items-center rounded-full bg-white/10"><ChevronRight size={20} /></button>
              </div>
            </div>
            {!elegido && <span aria-hidden className={`relleno-oculto ${corre ? "" : "pausado"}`} style={{ "--d": `${DURACION}s` } as React.CSSProperties} onAnimationEnd={() => setI((v) => (v + 1) % BEATS.length)} key={i} />}
          </div>
        </div>
      </div>
    </section>
  );
}

function Telefono({ children }: { children: React.ReactNode }) {
  return (
    <div aria-hidden className="relative h-[min(50svh,480px)] lg:h-[640px] aspect-[9/18.6] rounded-[42px] bg-[#0b0f33] p-[9px] ring-1 ring-white/20 shadow-[0_50px_120px_-30px_rgba(40,60,255,.65),inset_0_0_0_1px_rgba(255,255,255,.04)]">
      <div className="relative h-full overflow-hidden rounded-[34px] bg-[#f4f4f6] text-[#15171c]">
        <span className="absolute left-1/2 top-2 z-10 h-[20px] w-[78px] -translate-x-1/2 rounded-full bg-[#0b0f33]" />
        <div className="h-full pt-9 pb-5 px-3.5 text-[13px] leading-snug lg:[zoom:1.24] lg:pt-8 [&>div>div]:min-h-full [&>div>div]:flex [&>div>div]:flex-col [&>div>div]:justify-center">{children}</div>
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
      <p className="font-semibold text-[18px] leading-tight">Cuéntalo como te salga</p>
      <Tarjeta><p className="min-h-[76px]"><Tecleo velocidad={20} texto="Vendo harto pero a fin de mes no queda nada. Ya no sé dónde se va la plata y me tiene sin dormir." alTerminar={() => setListo(true)} /></p></Tarjeta>
      {listo && <Cae><Copiloto><p className="font-medium">Tu negocio vende, pero no sabes cuánto te deja cada venta.</p></Copiloto></Cae>}
      {listo && <Cae i={1}><Tarjeta><p className="text-[#6f737c] text-[11px]">También podría ser</p><p className="mt-0.5">Mezclo mi plata con la del negocio</p></Tarjeta></Cae>}
    </div>
  );
}

function Causas() {
  const filas = [["Retiros sin registrar", "Lo dijiste", true], ["Precios sin actualizar", "Por comprobar", false], ["Descuentos sin control", "Por comprobar", false], ["Costos que subieron", "Por comprobar", false]] as const;
  return (
    <div className="space-y-2">
      <p className="font-semibold text-[18px] leading-tight">¿Dónde crees que está la causa?</p>
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
  const pasos = [["A", "Separar cuentas", "3 nov"], ["A", "Costear productos", "10 nov"], ["A", "Subir precios", "20 nov"], ["B", "Sin descuentos", "25 nov"]];
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
