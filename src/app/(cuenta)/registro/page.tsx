import type { Metadata } from "next";
import Link from "next/link";
import { registrar } from "../acciones";
import { Formulario } from "../formulario";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function Pagina() {
  return (
    <>
      <h1 className="text-[34px] font-semibold">Empieza gratis</h1>
      <p className="mt-2 mb-6 text-tinta-2">Crea tu cuenta y cuéntanos qué está pasando.</p>
      <Formulario accion={registrar} boton="Crear mi cuenta" campos={[
        { name: "nombre", label: "Tu nombre", autoComplete: "name" },
        { name: "email", label: "Correo", type: "email", autoComplete: "email" },
        { name: "clave", label: "Clave (mínimo 10 caracteres)", type: "password", autoComplete: "new-password" },
      ]}>
        <label className="flex gap-3 items-start text-[15px] text-tinta-2 py-1">
          <input type="checkbox" name="acepto" className="mt-0.5 size-5 shrink-0 accent-[var(--color-acento)]" />
          <span>Acepto los <Link className="underline" href="/terminos" target="_blank">términos</Link> y la <Link className="underline" href="/privacidad" target="_blank">política de privacidad</Link>.</span>
        </label>
      </Formulario>
      <p className="mt-4 text-[15px] text-tinta-2">¿Ya tienes cuenta? <Link href="/ingresar" className="font-semibold text-acento inline-flex items-center min-h-11">Entrar</Link></p>
    </>
  );
}
