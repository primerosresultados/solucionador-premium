"use client";

import { useState, useTransition } from "react";
import { agregarPaso } from "@/app/app/acciones";
import type { Paso } from "@/lib/casos";
import { hoyChile, sumarDias } from "@/lib/fechas";
import { Alerta, Campo } from "./piezas";

export function FormPaso({ casoId, alListo, pasos = [] }: { casoId: string; alListo: () => void; pasos?: Paso[] }) {
  const [f, setF] = useState({ titulo: "", criterioHecho: "", prioridad: "B", venceEn: sumarDias(hoyChile(), 7), dependeDe: "" });
  const [error, setError] = useState("");
  const [pendiente, iniciar] = useTransition();
  const set = (c: Partial<typeof f>) => setF((x) => ({ ...x, ...c }));
  const enviar = () => iniciar(async () => {
    setError("");
    const r = await agregarPaso(casoId, { ...f, dependeDe: f.dependeDe || null });
    if (!r.ok) { setError(r.error); return; }
    setF({ titulo: "", criterioHecho: "", prioridad: "B", venceEn: f.venceEn, dependeDe: "" });
    alListo();
  });
  return (
    <div className="space-y-3">
      <Campo etiqueta="Paso"><input className="campo" placeholder="Empieza con un verbo" value={f.titulo} onChange={(e) => set({ titulo: e.target.value })} /></Campo>
      <Campo etiqueta="¿Cómo sabrás que quedó hecho?"><input className="campo" value={f.criterioHecho} onChange={(e) => set({ criterioHecho: e.target.value })} /></Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Prioridad">
          <select className="campo" value={f.prioridad} onChange={(e) => set({ prioridad: e.target.value })}>
            <option value="A">A · Clave</option><option value="B">B · Importante</option><option value="C">C · Bueno tenerlo</option><option value="D">D · Delegar</option><option value="E">E · Eliminar</option>
          </select>
        </Campo>
        <Campo etiqueta="Vence"><input className="campo" type="date" value={f.venceEn} onChange={(e) => set({ venceEn: e.target.value })} /></Campo>
      </div>
      {pasos.length > 0 && (
        <Campo etiqueta="Depende de">
          <select className="campo" value={f.dependeDe} onChange={(e) => set({ dependeDe: e.target.value })}>
            <option value="">Ningún paso</option>
            {pasos.filter((p) => p.estado !== "descartado").map((p) => <option key={p.id} value={p.id}>{p.titulo}</option>)}
          </select>
        </Campo>
      )}
      {error && <Alerta tipo="ojo">{error}</Alerta>}
      <button type="button" className="btn btn-1 w-full" disabled={pendiente} onClick={enviar}>{pendiente ? "Agregando…" : "Agregar paso"}</button>
    </div>
  );
}
