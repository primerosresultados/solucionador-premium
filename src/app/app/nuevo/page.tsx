"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Alerta } from "@/components/caso/piezas";
import { CajaRelato } from "@/components/dictado";
import { RELATO_PORTADA } from "@/components/portada/entrada";
import { crearCaso } from "../acciones";

const IDEAS = ["Mi negocio vende, pero no me queda plata", "Tengo deudas y no sé por dónde partir", "Mi socio y yo ya no nos entendemos", "No sé si renunciar a mi trabajo"];

export default function Pagina() {
  const router = useRouter();
  const [relato, setRelato] = useState("");
  const [error, setError] = useState("");
  const [pendiente, iniciar] = useTransition();
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
      <p className="mt-3 text-[18px] text-tinta-2">Escríbelo o dilo en voz alta, como te salga. Yo hago el análisis y tú solo eliges.</p>
      <div className="mt-6">
        <CajaRelato valor={relato} alCambiar={setRelato} etiqueta="Tu relato" filas={5} autoFoco placeholder="Ej: mi negocio vende bien, pero a fin de mes no me queda plata y ya no sé dónde se va…"
          sombra="shadow-[0_0_0_1px_rgba(21,23,28,.05),0_30px_70px_-30px_rgba(28,50,201,.5)]">
          <button className="btn btn-1 flex-1 min-w-0 !min-h-14 !px-3" disabled={pendiente} onClick={() => enviar(relato)}>
            {pendiente ? "Abriendo tu caso…" : <><Sparkles size={18} className="hidden sm:block" /> Analizar mi caso</>}
          </button>
        </CajaRelato>
        {error && <div className="mt-3"><Alerta tipo="ojo">{error}</Alerta></div>}
      </div>
      <div className="mt-5">
        <p className="text-[14px] font-medium text-tinta-3">¿No sabes cómo partir?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {IDEAS.map((x) => <button key={x} className="btn btn-2 btn-chico !font-medium !text-[14px]" onClick={() => setRelato(`${x}. `)}>{x}</button>)}
        </div>
      </div>
    </div>
  );
}
