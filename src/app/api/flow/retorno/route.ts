import { type NextRequest, NextResponse } from "next/server";
import { sincronizarOrden } from "@/lib/compras";
import { appUrl } from "@/lib/marca";

async function responder(token: string | null) {
  const orden = token ? await sincronizarOrden(token).catch((e) => { console.error("[flow] retorno:", e); return null; }) : null;
  return NextResponse.redirect(`${appUrl()}/app/compra/${orden?.numero ?? "desconocida"}`, 303);
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  return responder((form?.get("token") as string | null) ?? req.nextUrl.searchParams.get("token"));
}

export const GET = (req: NextRequest) => responder(req.nextUrl.searchParams.get("token"));
