import { Logo } from "@/components/logo";
import { PanelHilo } from "@/components/movimiento/panel-hilo";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:grid lg:grid-cols-[1.1fr_1fr] min-h-dvh">
      <aside className="escena-noche relative overflow-hidden h-[170px] lg:h-auto">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_60%_at_20%_50%,#1b2bb0,transparent_70%)]" />
        <PanelHilo avance={.08} centro={.52} compacto={false} />
        <div className="relative z-10 p-5 lg:p-8"><Logo /></div>
        <figure className="absolute z-10 bottom-10 left-8 right-8 hidden lg:block max-w-[30em]">
          <blockquote className="text-[30px] font-semibold leading-[1.12] tracking-[-.03em]">«El fracaso es solo la oportunidad de volver a empezar con más inteligencia.»</blockquote>
          <figcaption className="mt-3 text-[15px] text-tinta-3">Henry Ford, <cite className="not-italic">Mi vida y mi obra, 1922</cite></figcaption>
        </figure>
      </aside>
      <main className="flex flex-col justify-center px-5 py-8 w-full max-w-[460px] mx-auto">{children}</main>
    </div>
  );
}
