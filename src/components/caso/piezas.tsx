"use client";

import { Mic, MicOff, Plus, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { pedirCopiloto } from "@/app/app/acciones";
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

type Reconocimiento = {
  lang: string; continuous: boolean; interimResults: boolean; start(): void; stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>>; resultIndex: number }) => void) | null;
  onend: (() => void) | null;
};

/** Dictado por voz del navegador. Si el navegador no lo soporta, no aparece. */
export function Dictar({ alTexto }: { alTexto: (t: string) => void }) {
  const [disponible, setDisponible] = useState(false);
  const [activo, setActivo] = useState(false);
  const rec = useRef<Reconocimiento | null>(null);
  const alTextoActual = useRef(alTexto);
  useEffect(() => { alTextoActual.current = alTexto; });

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => Reconocimiento; webkitSpeechRecognition?: new () => Reconocimiento };
    const R = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!R) return;
    const r = new R();
    r.lang = "es-CL"; r.continuous = true; r.interimResults = false;
    r.onresult = (e) => alTextoActual.current(e.results[e.resultIndex][0].transcript);
    r.onend = () => setActivo(false);
    rec.current = r;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisponible(true);
    return () => r.stop();
  }, []);

  if (!disponible) return null;
  return (
    <button type="button" className="btn btn-2 btn-chico" aria-pressed={activo}
      onClick={() => { if (activo) rec.current?.stop(); else { rec.current?.start(); setActivo(true); } }}>
      {activo ? <MicOff size={18} /> : <Mic size={18} />} {activo ? "Detener" : "Dictar"}
    </button>
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
    <section className="tarjeta" aria-label="Copiloto">
      <div className="flex items-center gap-2 text-acento">
        <Sparkles size={18} aria-hidden /><h2 className="font-titulo font-semibold text-[18px]">{titulo}</h2>
      </div>
      <p className="mt-1 text-[15px] text-tinta-2">{descripcion}</p>
      {pendiente && (
        <div className="mt-4 space-y-2" aria-busy="true" aria-label="El copiloto está pensando">
          <div className="esqueleto h-5 w-3/4" /><div className="esqueleto h-5 w-full" /><div className="esqueleto h-5 w-2/3" />
        </div>
      )}
      {!pendiente && resultado && (
        <div className="mt-4 space-y-4 aparecer">
          {(resultado as { alerta_cuidado?: boolean }).alerta_cuidado && <ApoyoCuidado />}
          {children(resultado)}
        </div>
      )}
      {error && <div className="mt-4"><Alerta>{error}</Alerta></div>}
      <button type="button" onClick={pedir} disabled={pendiente} className={`btn mt-4 w-full sm:w-auto ${resultado ? "btn-2" : "btn-1"}`}>
        {pendiente ? "Pensando…" : resultado ? "Preguntar de nuevo" : boton}
      </button>
    </section>
  );
}

/** Sugerencia que la persona decide si se queda: nada entra solo a su trabajo. */
export function Sugerencia({ texto, detalle, alAgregar, agregada }: { texto: string; detalle?: string; alAgregar?: () => void; agregada?: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-hundido p-3">
      <div className="flex-1 min-w-0">
        <p className="leading-snug">{texto}</p>
        {detalle && <p className="text-[14px] text-tinta-2 mt-1">{detalle}</p>}
      </div>
      {alAgregar && (
        <button type="button" onClick={alAgregar} disabled={agregada} className="btn btn-chico btn-1 !px-3 shrink-0" aria-label={agregada ? "Agregada" : `Agregar: ${texto}`}>
          {agregada ? "Listo" : <Plus size={18} />}
        </button>
      )}
    </div>
  );
}
