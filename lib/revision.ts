import { CAPITULOS, type CapituloKey } from "@/content/capitulos";
import { GUIA } from "@/content/guia";
import { textoPlano, type NodoTexto } from "@/lib/texto";
import type { Capitulos } from "@/lib/numeracion";

export const MARCADOR = /\[COMPLETAR[^\]]*\]/g;

export interface ResultadoRevision {
  requisitos: { texto: string; ok: boolean }[];
  cumple: boolean;
  pendientes: number;
  caracteres: number;
}

export function revisarCapitulo(key: CapituloKey, doc: NodoTexto | null | undefined): ResultadoRevision {
  const texto = textoPlano(doc);
  const requisitos = GUIA[key].requisitos.map((r) => ({ texto: r.texto, ok: new RegExp(r.patron, "i").test(texto) }));
  const pendientes = (texto.match(MARCADOR) ?? []).length;
  return { requisitos, cumple: texto.length > 30 && requisitos.every((r) => r.ok), pendientes, caracteres: texto.length };
}

export function pendientesTotales(capitulos: Capitulos): number {
  return CAPITULOS.reduce((n, c) => n + revisarCapitulo(c.key, capitulos[c.key]).pendientes, 0);
}

export function capitulosQueCumplen(capitulos: Capitulos): number {
  return CAPITULOS.filter((c) => revisarCapitulo(c.key, capitulos[c.key]).cumple).length;
}
