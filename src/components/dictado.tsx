"use client";

import { Mic, Square } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

type Resultado = { isFinal: boolean; 0: { transcript: string } };
type Reconocimiento = {
  lang: string; continuous: boolean; interimResults: boolean; start(): void; stop(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<Resultado> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type Ventana = { SpeechRecognition?: new () => Reconocimiento; webkitSpeechRecognition?: new () => Reconocimiento };

const MENSAJES: Record<string, string> = {
  "not-allowed": "Permite el micrófono en tu navegador y vuelve a tocar Hablar.",
  "service-not-allowed": "Permite el micrófono en tu navegador y vuelve a tocar Hablar.",
  "audio-capture": "No encontramos un micrófono.",
  network: "El dictado necesita conexión. Prueba otra vez o escríbelo.",
};

/** Voz a texto del navegador. Lo que se va diciendo llega en `parcial`; lo confirmado, a `alTexto`. */
export function usarDictado(alTexto: (t: string) => void) {
  const [activo, setActivo] = useState(false);
  const [parcial, setParcial] = useState("");
  const [error, setError] = useState("");
  const rec = useRef<Reconocimiento | null>(null);
  const alTextoActual = useRef(alTexto);
  useEffect(() => { alTextoActual.current = alTexto; });
  useEffect(() => () => rec.current?.stop(), []);

  const alternar = useCallback(() => {
    if (rec.current) { rec.current.stop(); return; }
    const w = window as unknown as Ventana;
    const R = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!R) { setError("Este navegador no permite dictar. Prueba con Chrome o Safari, o escríbelo."); return; }
    setError("");
    const r = new R();
    r.lang = "es-CL"; r.continuous = true; r.interimResults = true;
    r.onresult = (e) => {
      let enCurso = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const x = e.results[i];
        if (x.isFinal) alTextoActual.current(x[0].transcript.trim());
        else enCurso += x[0].transcript;
      }
      setParcial(enCurso);
    };
    r.onerror = (e) => { if (e.error !== "no-speech" && e.error !== "aborted") setError(MENSAJES[e.error] ?? "No pudimos escucharte. Prueba otra vez."); };
    r.onend = () => { rec.current = null; setActivo(false); setParcial(""); };
    rec.current = r;
    r.start();
    setActivo(true);
  }, []);

  return { activo, parcial, error, alternar };
}

function Ondas() {
  return (
    <span aria-hidden className="flex items-center gap-[3px] h-5">
      {[0, 1, 2, 3].map((i) => (
        <motion.span key={i} className="w-[3px] rounded-full bg-current" animate={{ height: [6, 18, 9, 16, 6] }} transition={{ duration: 1, repeat: Infinity, delay: i * .12, ease: "easeInOut" }} />
      ))}
    </span>
  );
}

export function BotonVoz({ activo, alternar, className = "" }: { activo: boolean; alternar: () => void; className?: string }) {
  return (
    <button type="button" onClick={alternar} aria-pressed={activo} aria-label={activo ? "Terminar de dictar" : "Hablar"}
      className={`relative shrink-0 inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-200 ${activo ? "bg-[#0b0f33] text-white" : "bg-cobalto text-white hover:bg-[#2a41e0]"} ${className}`}>
      {activo && <motion.span aria-hidden className="absolute inset-0 rounded-full ring-2 ring-cobalto" animate={{ scale: [1, 1.14], opacity: [.8, 0] }} transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }} />}
      {activo ? <><Ondas /><Square size={13} fill="currentColor" /></> : <><Mic size={20} /> Hablar</>}
    </button>
  );
}

/**
 * El campo principal del producto: donde la persona cuenta su problema.
 * Claro sobre cualquier fondo, y con la voz a un toque.
 */
export function CajaRelato({ valor, alCambiar, etiqueta, placeholder, filas = 3, autoFoco, sombra, children }: {
  valor: string; alCambiar: (v: string) => void; etiqueta: string; placeholder: string; filas?: number; autoFoco?: boolean; sombra: string;
  children: React.ReactNode;
}) {
  const unir = (t: string) => alCambiar(`${valorActual.current} ${t}`.trim());
  const valorActual = useRef(valor);
  useEffect(() => { valorActual.current = valor; });
  const { activo, parcial, error, alternar } = usarDictado(unir);
  return (
    <div>
      <div className={`rounded-[28px] bg-papel p-3 text-[#15171c] outline-2 outline-transparent transition-[outline-color] duration-200 focus-within:outline-cobalto ${sombra}`}>
        <div className="relative">
          <textarea rows={filas} autoFocus={autoFoco} aria-label={etiqueta} value={activo && parcial ? `${valor} ${parcial}`.trim() : valor} onChange={(e) => alCambiar(e.target.value)}
            maxLength={6000} placeholder={activo ? "Te escucho…" : placeholder}
            className="block w-full resize-none bg-transparent px-3 pt-2.5 pb-2 text-[19px] sm:text-[20px] leading-[1.35] tracking-[-.01em] placeholder:text-[#5d6170] outline-none" />
        </div>
        <div className="mt-1 flex items-stretch gap-2">
          <BotonVoz activo={activo} alternar={alternar} className="h-14 min-w-[56px] px-4 sm:px-5 text-[16px]" />
          {children}
        </div>
      </div>
      {error && <p role="alert" className="mt-2 rounded-2xl bg-papel px-4 py-2.5 text-[15px] text-[#b4432f]">{error}</p>}
    </div>
  );
}
