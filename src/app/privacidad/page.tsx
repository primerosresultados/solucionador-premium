import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { MARCA } from "@/lib/marca";

export const metadata: Metadata = { title: "Privacidad" };

export default function Pagina() {
  return (
    <main className="mx-auto max-w-[680px] px-5 py-3 pb-16">
      <Logo />
      <h1 className="text-[34px] font-semibold mt-8">Política de privacidad</h1>
      <div className="mt-5 space-y-4 text-tinta-2 leading-relaxed">
        <p><strong className="text-tinta">Qué guardamos.</strong> Tu nombre, correo, tus casos y compras. No guardamos datos de tarjetas: los maneja Flow.</p>
        <p><strong className="text-tinta">Para qué.</strong> Para darte el servicio, enviarte recordatorios y cobrar. No vendemos tus datos ni enviamos publicidad de terceros.</p>
        <p><strong className="text-tinta">Con quién se comparte.</strong> Anthropic procesa tu texto para que el copiloto responda; Flow procesa los pagos y Resend entrega los correos. Si eliges a un compañero, verá el título de tu caso y tu avance general, nunca el contenido.</p>
        <p><strong className="text-tinta">Tus derechos.</strong> Desde Ajustes puedes descargar todos tus datos o eliminar tu cuenta. Eliminarla borra tus casos; las órdenes de compra se conservan sin tus datos personales por obligaciones contables.</p>
        <p><strong className="text-tinta">Contacto.</strong> {MARCA.contacto}</p>
      </div>
    </main>
  );
}
