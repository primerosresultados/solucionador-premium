import { notFound, redirect } from "next/navigation";
import { exigirSesion } from "@/lib/auth";
import { casoDe } from "@/lib/casos";

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caso = await casoDe((await exigirSesion()).id, id);
  if (!caso) notFound();
  redirect(`/app/caso/${id}/${caso.estado === "metodo" ? caso.etapa : "seguimiento"}`);
}
