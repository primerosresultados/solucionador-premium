import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { MARCA } from "@/lib/marca";

export const metadata: Metadata = { title: "Términos" };

export default function Pagina() {
  return (
    <main className="mx-auto max-w-[680px] px-5 py-3 pb-16">
      <Logo />
      <h1 className="text-[34px] font-semibold mt-8">Términos de uso</h1>
      <div className="mt-5 space-y-4 text-tinta-2 leading-relaxed">
        <p>{MARCA.nombre} es una herramienta digital de {MARCA.razonSocial} para ordenar y hacer seguimiento a problemas personales o de trabajo. Al crear una cuenta aceptas estas condiciones.</p>
        <p><strong className="text-tinta">Qué compras.</strong> Cada crédito desbloquea un caso completo: las etapas restantes del método, el copiloto dentro de un límite de uso razonable y el seguimiento hasta cerrarlo. Los créditos no vencen.</p>
        <p><strong className="text-tinta">Qué no es.</strong> No es terapia ni asesoría médica, legal, tributaria o financiera, y no garantiza un resultado. El copiloto usa inteligencia artificial y puede equivocarse: las decisiones son tuyas. Si estás en riesgo o alguien lo está, busca ayuda profesional o de emergencia.</p>
        <p><strong className="text-tinta">Pagos.</strong> Los cobros se realizan a través de Flow, en pesos chilenos con IVA incluido. Tus derechos como consumidor se rigen por la ley chilena.</p>
        <p><strong className="text-tinta">Tu contenido.</strong> Lo que escribes es tuyo. Solo lo usamos para prestarte el servicio.</p>
        <p><strong className="text-tinta">Contacto.</strong> {MARCA.contacto}</p>
      </div>
    </main>
  );
}
