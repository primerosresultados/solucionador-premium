"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Alerta, Dictar } from "@/components/caso/piezas";
import { RELATO_PORTADA } from "@/components/portada/entrada";
import { crearCaso } from "../acciones";

const IDEAS = ["Mi negocio vende, pero no me queda plata", "Tengo deudas y no sé por dónde partir", "Mi socio y yo ya no nos entendemos", "No sé si renunciar a mi trabajo"];

export default function Pagina() {
  const router = useRouter();
  const [relato, setRelato] = useState("");
  const [error, setError] = useState("");
  const [pendiente, iniciar] = useTransition();
  const alDictar = useCallback((t: string) => setRelato((r) => `${r} ${t}`.trim()), []);
  const enviado = useRef(false);

  const enviar = useCallback((texto: string) => iniciar(async () => {
    setError("");
    const r = await crearCaso(texto);
    if (!r.ok) { setError(r.error); return; }
    localStorage.removeItem(RELATO_PORTADA);
    router.push(`/app/caso/${r.id}/1`);
  }), [router]);

  // Quien ya lo contó en la portada no vuelve a llenar nada: partimos altiro.
  useEffect(() => {
    const guardado = localStorage.getItem(RELATO_PORTADA);
    if (!guardado || enviado.current) return;
    enviado.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRelato(guardado);
    enviar(guardado);
  }, [enviar]);

  return (
    <div className="mx-auto max-w-[760px] pt-6 sm:pt-12">
      <h1 className="text-[34px] sm:text-[52px] leading-[1.04] tracking-[-.035em]">¿Qué te tiene dando vueltas?</h1>
      <p className="mt-3 text-[18px] text-tinta-2">Cuéntalo como te salga. Yo hago el análisis y tú solo eliges.</p>
      <section className="tarjeta mt-6 space-y-3">
        <textarea autoFocus className="campo" rows={6} aria-label="Tu relato" value={relato} onChange={(e) => setRelato(e.target.value)}
          placeholder="Ej: mi negocio vende bien, pero a fin de mes no me queda plata y ya no sé dónde se va…" />
        {error && <Alerta tipo="ojo">{error}</Alerta>}
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <Dictar alTexto={alDictar} />
          <button className="btn btn-1 flex-1 sm:flex-none sm:ml-auto" disabled={pendiente} onClick={() => enviar(relato)}>
            {pendiente ? "Abriendo tu caso…" : <><Sparkles size={18} /> Analizar mi caso <ArrowRight size={18} /></>}
          </button>
        </div>
      </section>
      <div className="mt-5">
        <p className="text-[14px] font-medium text-tinta-3">¿No sabes cómo partir?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {IDEAS.map((x) => <button key={x} className="btn btn-2 btn-chico !font-medium !text-[14px]" onClick={() => setRelato(`${x}. `)}>{x}</button>)}
        </div>
      </div>
    </div>
  );
}
