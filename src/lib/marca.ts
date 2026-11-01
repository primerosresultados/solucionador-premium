export const MARCA = {
  nombre: "Solucionador",
  razonSocial: process.env.RAZON_SOCIAL ?? "Woob",
  contacto: process.env.CONTACTO_EMAIL ?? "hola@woob.cl",
};

export const appUrl = () => (process.env.APP_URL ?? "http://localhost:3090").replace(/\/$/, "");
