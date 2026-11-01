import type { Metadata } from "next";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { ordenes } from "@/db/schema";
import { exigirSesion } from "@/lib/auth";
import { pesos } from "@/lib/planes";

export const metadata: Metadata = { title: "Tu compra" };

export default async function Pagina({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = await params;
  const sesion = await exigirSesion();
  const [orden] = await db.select().from(ordenes).where(and(eq(ordenes.numero, numero), eq(ordenes.usuarioId, sesion.id))).limit(1);

  const textos: Record<string, [string, string]> = {
    pagada: ["Pago recibido", orden ? `Pagaste ${pesos(orden.monto)}. Sigamos con tu caso.` : ""],
    pendiente: ["Estamos confirmando tu pago", "Suele tardar unos segundos. Si ya pagaste, tu crédito aparecerá solo."],
    rechazada: ["El pago fue rechazado", "No se hizo ningún cobro. Puedes intentarlo otra vez."],
    anulada: ["Anulaste el pago", "No se hizo ningún cobro. Tu caso sigue guardado."],
    monto_invalido: ["Revisaremos tu pago", "Hubo una diferencia en el monto. Te contactaremos."],
  };
  const [titulo, texto] = (orden && textos[orden.estado]) || ["No encontramos esa compra", "Si pagaste y no ves tu crédito, escríbenos."];

  return (
    <section className="tarjeta text-center py-10 mt-4">
      <h1 className="text-[30px] font-semibold">{titulo}</h1>
      <p className="mt-2 text-tinta-2">{texto}</p>
      {orden && <p className="mt-1 text-[14px] text-tinta-3">Orden {orden.numero}</p>}
      <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
        {orden?.casoId && orden.estado === "pagada" && <Link href={`/app/caso/${orden.casoId}`} className="btn btn-1">Continuar mi caso</Link>}
        {orden?.casoId && orden.estado !== "pagada" && <Link href={`/app/comprar?caso=${orden.casoId}`} className="btn btn-1">Volver a intentar</Link>}
        <Link href="/app" className="btn btn-2">Mis casos</Link>
      </div>
    </section>
  );
}
