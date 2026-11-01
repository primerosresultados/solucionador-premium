"use client";

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
    <form onSubmit={empezar} className="rounded-[26px] bg-papel p-2.5 text-[#15171c] shadow-[0_24px_60px_-24px_rgba(5,10,60,.7)]">
      <label htmlFor={id} className="sr-only">Escribe lo que te tiene dando vueltas</label>
      <textarea id={id} rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={6000}
        placeholder="Escribe aquí lo que te tiene dando vueltas…"
        className="block w-full resize-none bg-transparent px-3.5 pt-3 pb-2 text-[18px] leading-snug placeholder:text-[#5d6170] outline-none" />
      <button className="btn w-full !min-h-14 !text-[17px] bg-sol text-sol-tinta hover:brightness-105">Empezar a resolverlo</button>
    </form>
  );
}
