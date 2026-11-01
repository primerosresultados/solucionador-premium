"use client";

import { Check, Plus, Sparkles, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { pedirCopiloto } from "@/app/app/acciones";
import { BotonVoz, usarDictado } from "@/components/dictado";
import type { Resultado, TareaId } from "@/lib/ia/tareas";

export function Campo({ etiqueta, ayuda, children }: { etiqueta: string; ayuda?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block font-semibold">{etiqueta}</span>
      {ayuda && <span className="block text-[15px] text-tinta-2 mt-0.5">{ayuda}</span>}
      <span className="block mt-2">{children}</span>
    </label>
  );
}

export function Dictar({ alTexto }: { alTexto: (t: string) => void }) {
  const { activo, parcial, error, alternar } = usarDictado(alTexto);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <BotonVoz activo={activo} alternar={alternar} className="h-11 min-w-[44px] px-4 text-[15px]" />
      {activo && parcial && <span className="text-[15px] text-tinta-2">{parcial}</span>}
      {error && <span role="alert" className="text-[14px] text-mal">{error}</span>}
    </div>
  );
}

export function ListaTextos({ valores, alCambiar, placeholder, agregar }: {
  valores: string[]; alCambiar: (v: string[]) => void; placeholder: string; agregar: string;
}) {
  return (
    <div className="space-y-2">
      {valores.map((v, i) => (
        <div key={i} className="flex gap-2">
          <input className="campo" value={v} placeholder={placeholder} aria-label={`${placeholder} ${i + 1}`}
            onChange={(e) => alCambiar(valores.map((x, j) => (j === i ? e.target.value : x)))} />
          <button type="button" aria-label="Quitar" className="btn btn-3 !px-3 shrink-0" onClick={() => alCambiar(valores.filter((_, j) => j !== i))}><X size={18} /></button>
        </div>
      ))}
      <button type="button" className="btn btn-2 btn-chico" onClick={() => alCambiar([...valores, ""])}><Plus size={18} /> {agregar}</button>
    </div>
  );
}

export function Alerta({ children, tipo = "mal" }: { children: ReactNode; tipo?: "mal" | "ojo" | "acento" }) {
  const c = { mal: "bg-mal-suave text-mal", ojo: "bg-ojo-suave text-ojo", acento: "bg-acento-suave text-acento" }[tipo];
  return <div role="alert" className={`rounded-2xl p-4 text-[15px] leading-relaxed ${c}`}>{children}</div>;
}

export function ApoyoCuidado() {
  return (
    <Alerta>
      <p className="font-semibold">Lo que cuentas importa más que este método.</p>
      <p className="mt-1">Si tú o alguien está en riesgo, habla hoy con una persona. En Chile, la línea de prevención del suicidio <strong>*4141</strong> atiende gratis las 24 horas, y Salud Responde está en el <strong>600 360 7777</strong>. En una emergencia, llama al <strong>131</strong> o <strong>133</strong>.</p>
    </Alerta>
  );
}

/** Pide ayuda al copiloto y guarda la última respuesta, que sobrevive a recargar. */
export function Copiloto<T extends TareaId>({ casoId, tarea, titulo, descripcion, boton, inicial, extra, antes, children }: {
  casoId: string; tarea: T; titulo: string; descripcion: string; boton: string;
  inicial?: unknown; extra?: string; antes?: () => Promise<unknown>; children: (r: Resultado<T>) => ReactNode;
}) {
  const [resultado, setResultado] = useState<Resultado<T> | null>((inicial as Resultado<T>) ?? null);
  const [error, setError] = useState("");
  const [pendiente, iniciar] = useTransition();

  const pedir = () => iniciar(async () => {
    setError("");
    // Lo recién escrito debe llegar antes: el copiloto lee el caso desde la base.
    await antes?.();
    const r = await pedirCopiloto(casoId, tarea, extra).catch(() => ({ ok: false as const, error: "No pudimos conectar. Tu trabajo quedó guardado." }));
    if (r.ok) setResultado(r.resultado as Resultado<T>); else setError(r.error);
  });

  return (
    <section data-copiloto className="escena-noche grano relative overflow-hidden rounded-[var(--radius-tarjeta)] p-5 sm:p-6 shadow-[0_24px_60px_-28px_rgba(16,30,160,.8)]" aria-label="Copiloto">
      <span aria-hidden className="absolute -right-16 -top-20 size-56 rounded-full bg-cobalto/50 blur-3xl" />
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <Orbe activo={pendiente} />
          <h2 className="text-[19px]">{titulo}</h2>
        </div>
        <p className="mt-2 text-[15px] text-tinta-2">{descripcion}</p>
        {pendiente && (
          <div className="mt-4 space-y-2.5" aria-busy="true" aria-label="El copiloto está pensando">
            <p className="brillo-texto text-[15px] font-medium">Leyendo tu caso…</p>
            <div className="esqueleto h-4 w-3/4" /><div className="esqueleto h-4 w-full" /><div className="esqueleto h-4 w-2/3" />
          </div>
        )}
        {!pendiente && resultado && (
          <motion.div className="mt-4 space-y-4" initial="o" animate="v" variants={{ v: { transition: { staggerChildren: .07 } } }}>
            {(resultado as { alerta_cuidado?: boolean }).alerta_cuidado && <ApoyoCuidado />}
            {children(resultado)}
          </motion.div>
        )}
        {error && <div className="mt-4"><Alerta>{error}</Alerta></div>}
        <button type="button" onClick={pedir} disabled={pendiente} className={`btn mt-4 w-full ${resultado ? "btn-2" : "bg-sol text-sol-tinta"}`}>
          {pendiente ? "Pensando…" : resultado ? "Preguntar de nuevo" : boton}
        </button>
      </div>
    </section>
  );
}

function Orbe({ activo }: { activo: boolean }) {
  return (
    <span aria-hidden className="relative size-9 flex-none">
      <motion.span className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#ffc83d,#8ea0ff,#ffffff,#1c32c9,#ffc83d)]"
        animate={{ rotate: 360 }} transition={{ duration: activo ? 1.1 : 7, repeat: Infinity, ease: "linear" }} />
      <span className="absolute inset-[3px] rounded-full bg-noche grid place-items-center text-sol"><Sparkles size={15} /></span>
    </span>
  );
}

/** Sugerencia que la persona decide si se queda: nada entra solo a su trabajo. */
export function Sugerencia({ texto, detalle, alAgregar, agregada }: { texto: string; detalle?: string; alAgregar?: () => void; agregada?: boolean }) {
  return (
    <motion.div variants={{ o: { opacity: 0, y: 10 }, v: { opacity: 1, y: 0 } }} className={`flex items-start gap-3 rounded-2xl p-3 transition-colors duration-200 ${agregada ? "bg-acento-suave" : "bg-hundido"}`}>
      <div className="flex-1 min-w-0">
        <p className="leading-snug">{texto}</p>
        {detalle && <p className="text-[14px] text-tinta-2 mt-1">{detalle}</p>}
      </div>
      {alAgregar && (
        <button type="button" onClick={alAgregar} disabled={agregada} className="btn btn-chico btn-1 !px-3 shrink-0" aria-label={agregada ? "Agregada" : `Agregar: ${texto}`}>
          {agregada
            ? <motion.span initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}><Check size={18} strokeWidth={3} /></motion.span>
            : <Plus size={18} />}
        </button>
      )}
    </motion.div>
  );
}
