import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { exigirSesion } from "@/lib/auth";
import { saldoCreditos } from "@/lib/compras";
import { salir } from "../acciones";
import { Avisos, EliminarCuenta } from "./controles";

export const metadata: Metadata = { title: "Ajustes" };

export default async function Pagina() {
  const s = await exigirSesion();
  const [u] = await db.select().from(usuarios).where(eq(usuarios.id, s.id));
  return (
    <div className="space-y-4">
      <h1 className="text-[32px] font-semibold">Ajustes</h1>
      <section className="tarjeta">
        <p className="font-semibold">{u.nombre}</p>
        <p className="text-tinta-2">{u.email}</p>
        <p className="mt-3 text-tinta-2">Créditos disponibles: <strong className="text-tinta tabular-nums">{await saldoCreditos(s.id)}</strong></p>
        <form action={salir}><button className="btn btn-2 mt-4">Cerrar sesión</button></form>
      </section>
      <Avisos activo={u.recibirCorreos} />
      <section className="tarjeta">
        <h2 className="text-[20px] font-semibold">Tus datos</h2>
        <p className="mt-1 text-tinta-2">Descarga todo lo que has escrito o elimina tu cuenta.</p>
        <a href="/api/mis-datos" className="btn btn-2 mt-4">Descargar mis datos</a>
        <EliminarCuenta />
      </section>
    </div>
  );
}
