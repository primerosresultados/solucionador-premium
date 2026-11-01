import { Logo } from "@/components/logo";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[440px] px-5 py-3 min-h-dvh flex flex-col">
      <Logo />
      <main className="flex-1 flex flex-col justify-center py-8">{children}</main>
    </div>
  );
}
