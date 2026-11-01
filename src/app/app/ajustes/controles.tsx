"use client";

import { useState, useTransition } from "react";
import { Alerta } from "@/components/caso/piezas";
import { cambiarAvisos, eliminarCuenta } from "../acciones";

export function Avisos({ activo }: { activo: boolean }) {
  const [pendiente, iniciar] = useTransition();
  return (
    <section className="tarjeta flex items-center justify-between gap-4">
      <div><h2 className="text-[20px] font-semibold">Recordatorios por correo</h2><p className="mt-1 text-[15px] text-tinta-2">Vencimientos, revisiones y avisos cuando un caso se detiene.</p></div>
      <button role="switch" aria-checked={activo} aria-label="Recordatorios por correo" disabled={pendiente} onClick={() => iniciar(() => cambiarAvisos(!activo))}
        className="flex-none h-11 w-[52px] flex items-center">
        <span className={`relative block w-[52px] h-8 rounded-full transition-colors ${activo ? "bg-acento" : "bg-hundido"}`}>
          <span className={`absolute top-1 size-6 rounded-full bg-superficie shadow-suave transition-[left] duration-150 ${activo ? "left-6" : "left-1"}`} />
        </span>
      </button>
    </section>
  );
}

export function EliminarCuenta() {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState("");
  const [pendiente, iniciar] = useTransition();
  if (!abierto) return <button className="btn btn-3 mt-2 !text-mal" onClick={() => setAbierto(true)}>Eliminar mi cuenta</button>;
  return (
    <div className="mt-4 space-y-3">
      <Alerta>Se borran tus casos para siempre. Escribe ELIMINAR para confirmar.</Alerta>
      <input className="campo" aria-label="Confirmación" value={texto} onChange={(e) => setTexto(e.target.value)} />
      {error && <Alerta tipo="ojo">{error}</Alerta>}
      <button className="btn btn-2 w-full !text-mal" disabled={pendiente} onClick={() => iniciar(async () => {
        const r = await eliminarCuenta(texto);
        if (r && !r.ok) setError(r.error);
      })}>Eliminar definitivamente</button>
    </div>
  );
}
