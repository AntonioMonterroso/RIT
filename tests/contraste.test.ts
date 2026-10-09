import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

// Lee los tokens de app/globals.css y mide el contraste de los pares texto/fondo (WCAG 2.x).
const css = fs.readFileSync(path.resolve(__dirname, "../app/globals.css"), "utf8");

function tokens(bloque: RegExp, base: Record<string, string> = {}): Record<string, string> {
  const m = css.match(bloque);
  if (!m) throw new Error("No se encontró el bloque de tokens");
  const out = { ...base };
  for (const [, k, v] of m[1].matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) out[k] = v.trim();
  return out;
}

type RGBA = [number, number, number, number];
function color(v: string): RGBA {
  const h = v.match(/^#([0-9a-f]{6})$/i);
  if (h) return [parseInt(h[1].slice(0, 2), 16), parseInt(h[1].slice(2, 4), 16), parseInt(h[1].slice(4, 6), 16), 1];
  const r = v.match(/^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)$/);
  if (r) return [+r[1], +r[2], +r[3], r[4] === undefined ? 1 : +r[4]];
  throw new Error(`Color no reconocido: ${v}`);
}
const sobre = (fg: RGBA, bg: RGBA): RGBA => [0, 1, 2].map((i) => Math.round(fg[i] * fg[3] + bg[i] * (1 - fg[3]))).concat(1) as RGBA;
const lum = ([r, g, b]: RGBA) => {
  const c = [r, g, b].map((x) => { const s = x / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a: RGBA, b: RGBA) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const claro = tokens(/\n:root \{([\s\S]*?)\n\}/);
const oscuro = tokens(/:root\[data-tema="oscuro"\] \{([\s\S]*?)\n\}/, claro);

describe.each([["Porcelana (claro)", claro], ["Pizarra (oscuro)", oscuro]])("contraste · %s", (_n, t) => {
  const canvas = color(t["canvas"]);
  const en = (k: string, fondo: RGBA = canvas) => sobre(color(t[k]), fondo);
  const tarjeta = sobre(color(t["surface"]), canvas);
  const par = (texto: RGBA, fondo: RGBA) => ratio(texto, fondo);

  it("texto principal y secundario legibles sobre el fondo y las tarjetas", () => {
    expect(par(en("ink"), canvas)).toBeGreaterThanOrEqual(7);
    expect(par(en("muted"), canvas)).toBeGreaterThanOrEqual(4.5);
    expect(par(en("muted", tarjeta), tarjeta)).toBeGreaterThanOrEqual(4.5);
    expect(par(en("ink", tarjeta), tarjeta)).toBeGreaterThanOrEqual(7);
  });

  it("enlaces y acento de texto cumplen 4.5:1, también sobre el velo del acento", () => {
    for (const k of ["brand-700", "brand-800"]) {
      expect(par(en(k), canvas), k).toBeGreaterThanOrEqual(4.5);
      expect(par(en(k, tarjeta), sobre(color(t["brand-50"]), tarjeta)), `${k} sobre velo`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("el acento medio (íconos, bordes de foco) cumple 3:1", () => {
    expect(par(en("brand-600"), canvas)).toBeGreaterThanOrEqual(3);
  });

  it("los botones con degradado tienen texto legible en ambos extremos", () => {
    for (const k of ["btn-a", "btn-b"]) expect(par(color(t["btn-ink"]), color(t[k])), k).toBeGreaterThanOrEqual(4.5);
  });

  it.each(["ok", "warn", "danger", "info"])("estado %s: texto sobre su fondo suave", (e) => {
    const fondo = sobre(color(t[`${e}-bg`]), tarjeta);
    expect(par(en(e, fondo), fondo)).toBeGreaterThanOrEqual(4.5);
  });
});
