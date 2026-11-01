import { sumarDias } from "./fechas";

export type EventoCalendario = { id: string; fecha: string; titulo: string; detalle: string; url: string };

const escapar = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** RFC 5545: máximo 75 bytes por línea; la continuación parte con un espacio. */
function plegar(linea: string) {
  const partes: string[] = [];
  let actual = "", bytes = 0;
  for (const c of linea) {
    const b = Buffer.byteLength(c);
    if (bytes + b > (partes.length ? 74 : 75)) { partes.push(actual); actual = ""; bytes = 0; }
    actual += c; bytes += b;
  }
  partes.push(actual);
  return partes.join("\r\n ");
}

const sinGuiones = (f: string) => f.replaceAll("-", "");

export function calendarioIcs(eventos: EventoCalendario[], ahora = new Date()) {
  const sello = ahora.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const lineas = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Solucionador//Plan//ES", "CALSCALE:GREGORIAN",
    ...eventos.flatMap((e) => [
      "BEGIN:VEVENT",
      `UID:${e.id}@solucionador`,
      `DTSTAMP:${sello}`,
      `DTSTART;VALUE=DATE:${sinGuiones(e.fecha)}`,
      `DTEND;VALUE=DATE:${sinGuiones(sumarDias(e.fecha, 1))}`,
      `SUMMARY:${escapar(e.titulo)}`,
      `DESCRIPTION:${escapar(e.detalle)}`,
      `URL:${e.url}`,
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];
  return lineas.map(plegar).join("\r\n") + "\r\n";
}
