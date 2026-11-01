/** Fechas como 'YYYY-MM-DD', siempre en la zona de Chile, sin hora. */

const ZONA = "America/Santiago";

export function hoyChile(ahora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(ahora);
}

const utc = (f: string) => Date.parse(`${f}T00:00:00Z`);

export const sumarDias = (f: string, dias: number) =>
  new Date(utc(f) + dias * 86_400_000).toISOString().slice(0, 10);

export const diasEntre = (desde: string, hasta: string) =>
  Math.round((utc(hasta) - utc(desde)) / 86_400_000);

export function fechaLarga(f: string): string {
  return new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "long", timeZone: "UTC" }).format(utc(f));
}

export function fechaCorta(f: string): string {
  return new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", timeZone: "UTC" })
    .format(utc(f)).replace(".", "");
}
