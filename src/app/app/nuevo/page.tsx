"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Alerta, Dictar } from "@/components/caso/piezas";
import { RELATO_PORTADA } from "@/components/portada/entrada";
import { CATEGORIAS, URGENCIAS, type Categoria, type Urgencia } from "@/lib/metodo";
import { crearCaso } from "../acciones";

function Selector<T extends string>({ titulo, opciones, valor, alCambiar, columnas }: {
  titulo: string; opciones: { id: T; nombre: string; detalle?: string }[]; valor: T; alCambiar: (v: T) => void; columnas: string;
}) {
  return (
    <fieldset>
      <legend className="font-semibold">{titulo}</legend>
      <div className={`mt-2 grid gap-2 ${columnas}`}>
        {opciones.map((o) => (
          <button key={o.id} type="button" aria-pressed={valor === o.id} onClick={() => alCambiar(o.id)}
            className={`min-h-12 flex flex-col ${o.detalle ? "justify-start" : "justify-center"} rounded-2xl px-3 py-2.5 text-left leading-tight ${valor === o.id ? "bg-acento text-acento-tinta" : "bg-hundido"}`}>
            <span className="block font-semibold">{o.nombre}</span>
            {o.detalle && <span className="block text-[13px] opacity-80">{o.detalle}</span>}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function Pagina() {
  const router = useRouter();
  const [relato, setRelato] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("personal");
  const [urgencia, setUrgencia] = useState<Urgencia>("media");
  const [error, setError] = useState("");
  const [pendiente, iniciar] = useTransition();
  // Lo que escribió en la portada antes de crear su cuenta.
  useEffect(() => {
    const guardado = localStorage.getItem(RELATO_PORTADA);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (guardado) setRelato(guardado);
  }, []);
  const alDictar = useCallback((t: string) => setRelato((r) => `${r} ${t}`.trim()), []);
  const enviar = () => iniciar(async () => {
    setError("");
    const r = await crearCaso({ relato, categoria, urgencia });
    if (!r.ok) { setError(r.error); return; }
    localStorage.removeItem(RELATO_PORTADA);
    router.push(`/app/caso/${r.id}/1`);
  });
  return (
    <div>
      <h1 className="text-[34px] sm:text-[42px] leading-[1.08] font-semibold">¿Qué te tiene dando vueltas?</h1>
      <p className="mt-2 text-[17px] text-tinta-2">Cuéntalo como te salga, sin ordenarlo. Nadie más lo va a leer.</p>
      <section className="tarjeta mt-5 space-y-4">
        <textarea className="campo" rows={8} aria-label="Tu relato" value={relato} onChange={(e) => setRelato(e.target.value)}
          placeholder="Ej: mi negocio vende bien, pero a fin de mes no me queda plata y ya no sé dónde se va…" />
        <Dictar alTexto={alDictar} />
        <Selector titulo="¿De qué tipo es?" columnas="sm:grid-cols-3" valor={categoria} alCambiar={setCategoria}
          opciones={(Object.keys(CATEGORIAS) as Categoria[]).map((id) => ({ id, nombre: CATEGORIAS[id] }))} />
        <Selector titulo="¿Qué tan urgente es?" columnas="grid-cols-3" valor={urgencia} alCambiar={setUrgencia}
          opciones={(Object.keys(URGENCIAS) as Urgencia[]).map((id) => ({ id, nombre: URGENCIAS[id].nombre, detalle: URGENCIAS[id].detalle }))} />
        {error && <Alerta tipo="ojo">{error}</Alerta>}
        <button className="btn btn-1 w-full" disabled={pendiente} onClick={enviar}>{pendiente ? "Abriendo…" : <>Abrir mi caso <ArrowRight size={18} /></>}</button>
      </section>
    </div>
  );
}
