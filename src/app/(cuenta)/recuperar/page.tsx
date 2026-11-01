import type { Metadata } from "next";
import { pedirRecuperacion } from "../acciones";
import { Formulario } from "../formulario";

export const metadata: Metadata = { title: "Recuperar clave" };

export default function Pagina() {
  return (
    <>
      <h1 className="text-[34px] font-semibold mb-6">Recupera tu clave</h1>
      <Formulario accion={pedirRecuperacion} boton="Enviar enlace" campos={[{ name: "email", label: "Correo", type: "email", autoComplete: "email" }]} />
    </>
  );
}
