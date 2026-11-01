import type { Metadata } from "next";
import { cambiarClave } from "../../acciones";
import { Formulario } from "../../formulario";

export const metadata: Metadata = { title: "Clave nueva", referrer: "no-referrer" };

export default async function Pagina({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <>
      <h1 className="text-[34px] font-semibold mb-6">Elige una clave nueva</h1>
      <Formulario accion={cambiarClave} boton="Guardar clave" oculto={{ token }}
        campos={[{ name: "clave", label: "Clave nueva (mínimo 10 caracteres)", type: "password", autoComplete: "new-password" }]} />
    </>
  );
}
