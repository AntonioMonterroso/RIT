import { CRITERIOS, type Criterio } from "@/content/checklist";
import type { CapituloKey } from "@/content/capitulos";

export const MIN_CARACTERES_COMPLETO = 30;

export interface NodoTexto {
  type?: string;
  text?: string;
  content?: NodoTexto[];
}

/** Texto plano de un documento TipTap/ProseMirror en JSON. */
export function textoPlano(nodo: NodoTexto | null | undefined): string {
  if (!nodo) return "";
  if (nodo.text) return nodo.text;
  return (nodo.content ?? []).map(textoPlano).join(" ").trim();
}

export type Semaforo = "listo" | "riesgo" | "rechazo";

export interface Resultado {
  marcados: number;
  total: number;
  porcentaje: number;
  semaforo: Semaforo;
  automaticos: Record<string, boolean>;
}

export function capituloCompleto(doc: NodoTexto | null | undefined): boolean {
  return textoPlano(doc).length > MIN_CARACTERES_COMPLETO;
}

/**
 * Los criterios ligados a un capítulo se marcan solos; el resto (documentales y de
 * publicidad) los marca la empresa en `manuales`.
 */
export function auditar(
  capitulos: Partial<Record<CapituloKey, NodoTexto>>,
  manuales: Record<string, boolean>,
  criterios: Criterio[] = CRITERIOS,
): Resultado {
  const automaticos: Record<string, boolean> = {};
  let marcados = 0;
  for (const c of criterios) {
    const ok = c.capitulo ? capituloCompleto(capitulos[c.capitulo]) : !!manuales[c.id];
    if (c.capitulo) automaticos[c.id] = ok;
    if (ok) marcados++;
  }
  const total = criterios.length;
  const porcentaje = Math.round((marcados / total) * 100);
  const semaforo: Semaforo = porcentaje >= 90 ? "listo" : porcentaje >= 70 ? "riesgo" : "rechazo";
  return { marcados, total, porcentaje, semaforo, automaticos };
}
