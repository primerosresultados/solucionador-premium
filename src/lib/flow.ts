import "server-only";
import { createHmac } from "crypto";

/**
 * Cliente de la API de Flow (https://www.flow.cl/docs/api.html).
 *
 * Flow es la pasarela de pago chilena. El flujo de pago único es:
 *   1. createPayment() → Flow devuelve { url, token, flowOrder }.
 *   2. Redirigimos al comprador a `${url}?token=${token}`.
 *   3. El comprador paga en Flow y Flow:
 *        - hace un POST server-a-servidor a `urlConfirmation` (webhook) con `token`;
 *        - redirige el navegador a `urlReturn` (POST) con `token`.
 *   4. Con el token consultamos getStatus() — la fuente de verdad del estado.
 *
 * Autenticación: cada request lleva `apiKey` y una firma `s` = HMAC-SHA256 (hex)
 * de los parámetros (sin `s`) ordenados por nombre y concatenados como `k+v`,
 * usando el `secretKey` como clave.
 */

const SANDBOX_BASE = "https://sandbox.flow.cl/api";
const PROD_BASE = "https://www.flow.cl/api";

/** Estado de un pago en Flow. */
export const FLOW_STATUS = {
  PENDING: 1,
  PAID: 2,
  REJECTED: 3,
  CANCELED: 4,
} as const;

export type FlowConfig = {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
  sandbox: boolean;
};

/** Lee la config de Flow desde el entorno. Lanza si faltan credenciales. */
export function flowConfig(): FlowConfig {
  const apiKey = process.env.FLOW_API_KEY?.trim();
  const secretKey = process.env.FLOW_SECRET_KEY?.trim();
  // Producción sólo si FLOW_ENV=production explícito; por defecto, sandbox.
  const sandbox = (process.env.FLOW_ENV ?? "sandbox").toLowerCase() !== "production";
  if (!apiKey || !secretKey) {
    throw new Error(
      "Flow no está configurado: definí FLOW_API_KEY y FLOW_SECRET_KEY en el entorno."
    );
  }
  const baseUrl = process.env.FLOW_BASE_URL?.trim() || (sandbox ? SANDBOX_BASE : PROD_BASE);
  return { apiKey, secretKey, baseUrl, sandbox };
}

/** ¿Está Flow configurado? (para no romper el sitio si aún no cargaron llaves). */
export function isFlowConfigured(): boolean {
  return Boolean(process.env.FLOW_API_KEY?.trim() && process.env.FLOW_SECRET_KEY?.trim());
}

type Params = Record<string, string | number | undefined>;

/** Normaliza params a strings y descarta undefined. */
function clean(params: Params): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    out[k] = String(v);
  }
  return out;
}

/** Firma Flow: HMAC-SHA256 hex sobre `k+v` de los params ordenados por nombre. */
export function signParams(params: Record<string, string>, secretKey: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => k + params[k])
    .join("");
  return createHmac("sha256", secretKey).update(toSign).digest("hex");
}

/** GET firmado a un endpoint de Flow. */
async function flowGet<T>(cfg: FlowConfig, path: string, params: Params): Promise<T> {
  const p = clean({ ...params, apiKey: cfg.apiKey });
  const s = signParams(p, cfg.secretKey);
  const qs = new URLSearchParams({ ...p, s }).toString();
  const res = await fetch(`${cfg.baseUrl}${path}?${qs}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  return parseFlowResponse<T>(res);
}

/** POST firmado (form-urlencoded) a un endpoint de Flow. */
async function flowPost<T>(cfg: FlowConfig, path: string, params: Params): Promise<T> {
  const p = clean({ ...params, apiKey: cfg.apiKey });
  const s = signParams(p, cfg.secretKey);
  const body = new URLSearchParams({ ...p, s }).toString();
  const res = await fetch(`${cfg.baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
    cache: "no-store",
  });
  return parseFlowResponse<T>(res);
}

async function parseFlowResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Flow devolvió una respuesta no-JSON (${res.status}): ${text.slice(0, 200)}`);
  }
  // Flow reporta errores con { code, message } y/o HTTP != 2xx.
  if (!res.ok || (data && typeof data === "object" && "code" in data && "message" in data)) {
    const d = data as { code?: number; message?: string };
    throw new Error(`Flow error ${res.status}${d.code ? ` (code ${d.code})` : ""}: ${d.message ?? text}`);
  }
  return data as T;
}

export type FlowCreatePaymentInput = {
  /** Identificador único del comercio (nuestro orderNumber). */
  commerceOrder: string;
  /** Descripción visible del pago. */
  subject: string;
  /** Monto entero en CLP. */
  amount: number;
  /** Email del pagador. */
  email: string;
  /** URL del webhook server-a-servidor. */
  urlConfirmation: string;
  /** URL a la que Flow devuelve el navegador. */
  urlReturn: string;
  currency?: string; // default "CLP"
  /** Medio de pago (opcional). Omitir = Flow muestra todos los disponibles. */
  paymentMethod?: number;
  /** Datos opcionales que Flow devuelve luego en getStatus. */
  optional?: Record<string, string>;
};

export type FlowCreatePaymentResult = {
  /** URL base del pago; redirigir a `${url}?token=${token}`. */
  url: string;
  token: string;
  flowOrder: number;
};

/** Crea un cobro en Flow. Devuelve la URL de pago + token. */
export async function createPayment(
  input: FlowCreatePaymentInput,
  cfg: FlowConfig = flowConfig()
): Promise<FlowCreatePaymentResult & { redirectUrl: string }> {
  const params: Params = {
    commerceOrder: input.commerceOrder,
    subject: input.subject,
    currency: input.currency ?? "CLP",
    amount: Math.round(input.amount), // CLP no admite decimales
    email: input.email,
    urlConfirmation: input.urlConfirmation,
    urlReturn: input.urlReturn,
    paymentMethod: input.paymentMethod,
    optional: input.optional ? JSON.stringify(input.optional) : undefined,
  };
  const res = await flowPost<FlowCreatePaymentResult>(cfg, "/payment/create", params);
  return { ...res, redirectUrl: `${res.url}?token=${res.token}` };
}

export type FlowPaymentStatus = {
  flowOrder: number;
  commerceOrder: string;
  requestDate: string;
  status: number; // 1 pending | 2 paid | 3 rejected | 4 canceled
  subject: string;
  currency: string;
  amount: string;
  payer: string;
  optional?: Record<string, string> | null;
  paymentData?: {
    date?: string;
    media?: string; // medio de pago usado
    conversionDate?: string;
    conversionRate?: number;
    amount?: string;
    currency?: string;
    fee?: string;
    balance?: string;
    transferDate?: string;
  } | null;
};

/** Consulta el estado real de un pago por su token. Fuente de verdad. */
export async function getPaymentStatus(
  token: string,
  cfg: FlowConfig = flowConfig()
): Promise<FlowPaymentStatus> {
  return flowGet<FlowPaymentStatus>(cfg, "/payment/getStatus", { token });
}

/** Mapea el código de estado de Flow a nuestro estado interno de orden. */
export function flowStatusToOrderStatus(status: number): "pending" | "paid" | "rejected" | "canceled" {
  switch (status) {
    case FLOW_STATUS.PAID:
      return "paid";
    case FLOW_STATUS.REJECTED:
      return "rejected";
    case FLOW_STATUS.CANCELED:
      return "canceled";
    default:
      return "pending";
  }
}
