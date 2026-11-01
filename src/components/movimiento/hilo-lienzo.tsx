"use client";

import { useMotionValueEvent, type MotionValue } from "motion/react";
import { useEffect, useRef } from "react";

const limitar = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const suave = (n: number) => n * n * (3 - 2 * n);
const mezclar = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * La cinta: decenas de hebras que forman un resorte en torsión. Con `progreso`
 * en 0 da vueltas; en 1 es una línea recta que termina en el sol.
 */
export function HiloLienzo({ progreso, centro = .5, compacto = false }: {
  progreso: MotionValue<number>; centro?: number; compacto?: boolean;
}) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const dibujar = useRef<(() => void) | null>(null);

  useMotionValueEvent(progreso, "change", () => dibujar.current?.());

  useEffect(() => {
    const c = lienzo.current!;
    const ctx = c.getContext("2d")!;
    const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, raf = 0, visible = true;
    // Un equipo lento pierde hebras antes que fluidez.
    let calidad = 1, ultimo = 0, media = 16;
    const puntero = { x: -1, y: 0, fx: 0 };

    const medir = () => {
      const r = c.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 1.6);
      W = r.width; H = r.height;
      c.width = W * d; c.height = H * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    };

    const pintar = (t: number) => {
      const p = progreso.get(), angosto = W < 700;
      const hebras = Math.max(5, Math.round((compacto ? 12 : angosto ? 16 : 30) * calidad));
      const tramos = Math.max(160, Math.round((compacto ? 340 : angosto ? 460 : 800) * calidad));
      const vueltas = angosto || compacto ? 9 : 15;
      const R = Math.min(H * (compacto ? .3 : .19), angosto ? 96 : 150);
      const cy = H * centro;
      const fin = mezclar(.9, .05, suave(limitar(p * 1.25)));
      const finX = W * (angosto ? .9 : .94);

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createLinearGradient(0, 0, finX, 0);
      g.addColorStop(0, "#3a4dff"); g.addColorStop(.45, "#8ea0ff"); g.addColorStop(.8, "#ffffff"); g.addColorStop(1, "#ffc83d");
      ctx.strokeStyle = g; ctx.lineJoin = "round";

      const traza = (o: number, ancho: number, alfa: number) => {
        ctx.beginPath(); ctx.lineWidth = ancho; ctx.globalAlpha = alfa;
        for (let j = 0; j <= tramos; j++) {
          const s = j / tramos;
          const a = suave(limitar(1 - s / fin));
          const fase = s * vueltas * Math.PI * 2 + t * .22;
          const ola = Math.sin(s * 8 + t * .5 + o);
          const rx = a * R * 1.3, ry = a * R * (1 + .16 * ola);
          let x = s * (finX + 30) - 30 + Math.sin(fase) * rx;
          let y = cy + Math.cos(fase) * ry;
          const giro = fase * .5 + t * .3;
          const banda = mezclar(.5, compacto ? 12 : 30, a);
          x += o * banda * Math.sin(giro) * .7;
          y += o * banda * Math.cos(giro);
          if (puntero.x >= 0) {
            const d = (x - puntero.x) / (W * .16), f = Math.exp(-d * d) * puntero.fx * a;
            y += (puntero.y - y) * .28 * f;
          }
          if (j) ctx.lineTo(Math.min(x, finX), y); else ctx.moveTo(x, y);
        }
        ctx.stroke();
      };

      for (let i = 0; i < hebras; i++) traza((i / (hebras - 1)) * 2 - 1, 1, .34);
      traza(0, 2, .9);

      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      const pulso = 1 + .08 * Math.sin(t * 1.6);
      const r = (angosto ? 8 : 11) * (1 + p * .5) * pulso;
      const halo = ctx.createRadialGradient(finX, cy, 0, finX, cy, r * 9);
      halo.addColorStop(0, "rgba(255,200,61,.75)"); halo.addColorStop(.3, "rgba(255,200,61,.2)"); halo.addColorStop(1, "rgba(255,200,61,0)");
      ctx.fillStyle = halo; ctx.fillRect(finX - r * 9, cy - r * 9, r * 18, r * 18);
      ctx.fillStyle = "#ffc83d"; ctx.beginPath(); ctx.arc(finX, cy, r, 0, Math.PI * 2); ctx.fill();
    };

    const inicio = performance.now();
    const ciclo = (ahora: number) => {
      if (ultimo) {
        media += (ahora - ultimo - media) * .08;
        if (media > 24 && calidad > .35) { calidad *= .82; media = 16; }
      }
      ultimo = ahora;
      puntero.fx *= .96;
      pintar((ahora - inicio) / 1000);
      raf = visible ? requestAnimationFrame(ciclo) : 0;
    };
    const arrancar = () => { if (!raf && !quieto) raf = requestAnimationFrame(ciclo); };

    medir();
    pintar(0);
    dibujar.current = quieto ? () => pintar(0) : null;
    arrancar();

    const ro = new ResizeObserver(() => { medir(); pintar(0); });
    ro.observe(c);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) arrancar(); });
    io.observe(c);
    const mover = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      puntero.x = e.clientX - r.left; puntero.y = e.clientY - r.top; puntero.fx = 1;
    };
    window.addEventListener("pointermove", mover, { passive: true });
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); window.removeEventListener("pointermove", mover); };
  }, [progreso, centro, compacto]);

  return <canvas ref={lienzo} aria-hidden className="absolute inset-0 size-full" />;
}
