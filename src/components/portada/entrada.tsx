"use client";

import { ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const RELATO_PORTADA = "solucionador_relato";

/** Empezar es escribir: lo que pone aquí lo espera en su primer caso. */
export function Entrada({ destino, id }: { destino: string; id: string }) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const empezar = (e: React.FormEvent) => {
    e.preventDefault();
    if (texto.trim()) localStorage.setItem(RELATO_PORTADA, texto.trim().slice(0, 6000));
    router.push(destino);
  };
  return (
    <form onSubmit={empezar} className="rounded-[26px] bg-white/[.07] p-2 backdrop-blur-xl ring-1 ring-white/15 shadow-[0_30px_80px_-30px_rgba(0,0,0,.9)] transition-shadow focus-within:ring-sol/70">
      <label htmlFor={id} className="sr-only">Escribe lo que te tiene dando vueltas</label>
      <textarea id={id} rows={2} value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={6000}
        placeholder="¿Qué te tiene dando vueltas?"
        className="block w-full resize-none bg-transparent px-3.5 pt-2.5 pb-2 text-[18px] leading-snug text-inherit placeholder:text-current placeholder:opacity-60 outline-none" />
      <button className="group btn w-full !min-h-[54px] !text-[17px] bg-sol text-sol-tinta hover:-translate-y-px shadow-[0_10px_30px_-10px_rgba(255,200,61,.7)]">
        Empezar a resolverlo <ArrowUpRight size={19} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </button>
    </form>
  );
}
