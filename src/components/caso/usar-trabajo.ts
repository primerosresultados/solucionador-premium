"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { guardarTrabajo } from "@/app/app/acciones";
import type { Trabajo } from "@/lib/metodo";

export type EstadoGuardado = "guardado" | "guardando" | "error";

/** Guarda solo, agrupando cambios. `vaciar` asegura que todo llegó antes de avanzar. */
export function usarTrabajo(casoId: string, inicial: Trabajo) {
  const [trabajo, setTrabajo] = useState(inicial);
  const [guardado, setGuardado] = useState<EstadoGuardado>("guardado");
  const pendiente = useRef<Partial<Trabajo>>({});
  const reloj = useRef<ReturnType<typeof setTimeout> | null>(null);

  const vaciar = useCallback(async () => {
    if (reloj.current) clearTimeout(reloj.current);
    const lote = pendiente.current;
    if (!Object.keys(lote).length) return true;
    pendiente.current = {};
    setGuardado("guardando");
    const r = await guardarTrabajo(casoId, lote).catch(() => ({ ok: false as const, error: "" }));
    if (!r.ok) {
      pendiente.current = { ...lote, ...pendiente.current };
      setGuardado("error");
      return false;
    }
    setGuardado("guardado");
    return true;
  }, [casoId]);

  const cambiar = useCallback((c: Partial<Trabajo>) => {
    setTrabajo((t) => ({ ...t, ...c }));
    pendiente.current = { ...pendiente.current, ...c };
    setGuardado("guardando");
    if (reloj.current) clearTimeout(reloj.current);
    reloj.current = setTimeout(vaciar, 700);
  }, [vaciar]);

  useEffect(() => {
    const salir = () => { void vaciar(); };
    window.addEventListener("pagehide", salir);
    return () => { window.removeEventListener("pagehide", salir); void vaciar(); };
  }, [vaciar]);

  return { trabajo, cambiar, guardado, vaciar };
}
