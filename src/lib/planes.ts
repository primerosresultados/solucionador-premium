/** Precios en un solo lugar. CLP con IVA incluido. Un crédito resuelve un caso. */
export const PLANES = {
  uno: { id: "uno", nombre: "Un problema", creditos: 1, monto: 14990, detalle: "Para lo que hoy te quita el sueño." },
  tres: { id: "tres", nombre: "Tres problemas", creditos: 3, monto: 34990, detalle: "Para ordenar varios frentes a la vez." },
} as const;

export type PlanId = keyof typeof PLANES;

export const pesos = (n: number) => `$${n.toLocaleString("es-CL")}`;
