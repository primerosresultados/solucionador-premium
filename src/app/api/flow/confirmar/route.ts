import { NextResponse } from "next/server";
import { sincronizarOrden } from "@/lib/compras";

/** Webhook de Flow. Si falla respondemos 500 para que Flow reintente: un pago no se pierde. */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const token = String(form?.get("token") ?? "");
  if (!token) return NextResponse.json({ error: "falta token" }, { status: 400 });
  try {
    await sincronizarOrden(token);
    return new NextResponse("OK");
  } catch (e) {
    console.error("[flow] confirmar:", e);
    return NextResponse.json({ error: "reintentar" }, { status: 500 });
  }
}
