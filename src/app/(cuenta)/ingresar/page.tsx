import type { Metadata } from "next";
import Link from "next/link";
import { ingresar } from "../acciones";
import { Formulario } from "../formulario";

export const metadata: Metadata = { title: "Entrar" };

export default function Pagina() {
  return (
    <>
      <h1 className="text-[34px] font-semibold mb-6">Entra a tus casos</h1>
      <Formulario accion={ingresar} boton="Entrar" campos={[
        { name: "email", label: "Correo", type: "email", autoComplete: "email" },
        { name: "clave", label: "Clave", type: "password", autoComplete: "current-password" },
      ]} />
      <div className="mt-4 text-[15px] text-tinta-2 flex justify-between gap-3">
        <Link href="/recuperar" className="min-h-11 inline-flex items-center">Olvidé mi clave</Link>
        <Link href="/registro" className="min-h-11 inline-flex items-center font-semibold text-acento">Crear cuenta</Link>
      </div>
    </>
  );
}
