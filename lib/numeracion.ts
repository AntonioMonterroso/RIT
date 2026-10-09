import { CAPITULOS, type CapituloKey } from "@/content/capitulos";
import type { Nodo } from "@/lib/docx";

const PREFIJO = /^Art[ií]culo\s+(?:\d+|X)\.\s*/;

export type Capitulos = Partial<Record<CapituloKey, Nodo>>;

/** Renumera de forma correlativa todos los encabezados "Artículo N." del reglamento, capítulo por capítulo. */
export function renumerar(capitulos: Capitulos): { capitulos: Capitulos; total: number } {
  let n = 0;
  const salida: Capitulos = {};
  for (const cap of CAPITULOS) {
    const doc = capitulos[cap.key];
    if (!doc) continue;
    salida[cap.key] = {
      ...doc,
      content: (doc.content ?? []).map((nodo) => {
        if (nodo.type !== "heading") return nodo;
        const primero = nodo.content?.[0];
        if (!primero?.text || !PREFIJO.test(primero.text)) return nodo;
        n += 1;
        return { ...nodo, content: [{ ...primero, text: primero.text.replace(PREFIJO, `Artículo ${n}. `) }, ...(nodo.content ?? []).slice(1)] };
      }),
    };
  }
  return { capitulos: salida, total: n };
}

/** Mayor número de artículo usado en el reglamento (en encabezados o al inicio de un párrafo). */
export function maxArticulo(capitulos: Capitulos): number {
  let max = 0;
  for (const c of CAPITULOS) {
    for (const n of capitulos[c.key]?.content ?? []) {
      const t = n.content?.[0]?.text ?? "";
      const m = t.match(/^Art[ií]culo\s+(\d+)/i);
      if (m) max = Math.max(max, Number(m[1]));
    }
  }
  return max;
}
