"use client";

import { startTransition, useActionState } from "react";
import type { Estado } from "./acciones";

export type Campo = { name: string; label: string; type?: string; autoComplete?: string };

export function Formulario({ accion, campos, boton, oculto, children }: {
  accion: (e: Estado, f: FormData) => Promise<Estado>; campos: Campo[]; boton: string;
  oculto?: Record<string, string>; children?: React.ReactNode;
}) {
  const [estado, enviar, pendiente] = useActionState(accion, {});
  return (
    // onSubmit y no action: con action, React vacía el formulario y un error borraría lo escrito.
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault();
      const datos = new FormData(e.currentTarget);
      startTransition(() => enviar(datos));
    }}>
      {Object.entries(oculto ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {campos.map((c) => (
        <label key={c.name} className="block">
          <span className="block mb-1.5 font-semibold text-[15px]">{c.label}</span>
          <input className="campo" name={c.name} type={c.type ?? "text"} autoComplete={c.autoComplete} required />
        </label>
      ))}
      {children}
      {estado.error && <p role="alert" className="text-mal text-[15px]">{estado.error}</p>}
      {estado.aviso && <p role="status" className="text-bien text-[15px]">{estado.aviso}</p>}
      <button className="btn btn-1 w-full" disabled={pendiente}>{pendiente ? "Un momento…" : boton}</button>
    </form>
  );
}
