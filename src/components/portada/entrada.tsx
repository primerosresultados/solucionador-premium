"use client";

import { ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CajaRelato } from "@/components/dictado";

export const RELATO_PORTADA = "solucionador_relato";

/** Empezar es contarlo: lo que pone aquí abre su primer caso. */
export function Entrada({ destino, tono = "noche" }: { destino: string; tono?: "noche" | "sol" }) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const empezar = (e: React.FormEvent) => {
    e.preventDefault();
    if (texto.trim()) localStorage.setItem(RELATO_PORTADA, texto.trim().slice(0, 6000));
    router.push(destino);
  };
  return (
    <form onSubmit={empezar}>
      <CajaRelato valor={texto} alCambiar={setTexto} etiqueta="Escribe lo que te tiene dando vueltas" placeholder="Cuéntame qué te tiene dando vueltas…"
        sombra={tono === "noche" ? "shadow-[0_0_0_6px_rgba(142,160,255,.18),0_34px_90px_-24px_rgba(50,70,255,.75)]" : "shadow-[0_28px_60px_-26px_rgba(90,60,0,.45)]"}>
        <button className={`group btn flex-1 min-w-0 !min-h-14 !px-3 !text-[16px] sm:!text-[17px] hover:-translate-y-px ${tono === "noche" ? "bg-sol text-sol-tinta" : "bg-[#0b0f33] text-white"}`}>
          <span className="truncate">Empezar a resolverlo</span>
          <ArrowUpRight size={19} className="hidden sm:block shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </CajaRelato>
    </form>
  );
}
