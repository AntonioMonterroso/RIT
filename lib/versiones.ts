import type { EstadoRit, Version } from "@/lib/almacen";
import { CAPITULOS } from "@/content/capitulos";
import { textoPlano } from "@/lib/texto";

export const MAX_VERSIONES = 10;

const hayTexto = (e: Pick<EstadoRit, "capitulos">) => CAPITULOS.some((c) => textoPlano(e.capitulos[c.key]).length > 0);

/** Guarda una copia del texto actual. No hace nada si todavía no hay texto. Conserva las más recientes. */
export function guardarVersion(e: EstadoRit, etiqueta: string, ahora: Date = new Date()): EstadoRit {
  if (!hayTexto(e)) return e;
  const v: Version = { id: crypto.randomUUID(), etiqueta: etiqueta.trim() || "Versión sin nombre", fecha: ahora.toISOString(), capitulos: e.capitulos };
  return { ...e, versiones: [v, ...e.versiones].slice(0, MAX_VERSIONES) };
}

/** Restaura una versión. Antes guarda el texto actual para poder volver atrás. */
export function restaurarVersion(e: EstadoRit, id: string, ahora: Date = new Date()): EstadoRit {
  const v = e.versiones.find((x) => x.id === id);
  if (!v) return e;
  const respaldado = guardarVersion(e, `Antes de restaurar «${v.etiqueta}»`, ahora);
  return { ...respaldado, capitulos: v.capitulos };
}

export const eliminarVersion = (e: EstadoRit, id: string): EstadoRit => ({ ...e, versiones: e.versiones.filter((v) => v.id !== id) });

export function resumenVersion(v: Version): { articulos: number; palabras: number } {
  let articulos = 0; let palabras = 0;
  for (const c of CAPITULOS) {
    const doc = v.capitulos[c.key];
    palabras += textoPlano(doc).split(/\s+/).filter(Boolean).length;
    for (const n of doc?.content ?? []) if (n.type === "heading" && /^Art[ií]culo/.test(n.content?.[0]?.text ?? "")) articulos++;
  }
  return { articulos, palabras };
}
