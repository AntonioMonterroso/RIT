import { CRITERIOS, type Criterio } from "@/content/checklist";
import type { CapituloKey } from "@/content/capitulos";
import { revisarCapitulo } from "@/lib/revision";
import { textoPlano, type NodoTexto } from "@/lib/texto";

export { textoPlano, type NodoTexto };
export const MIN_CARACTERES_COMPLETO = 30;

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
 * Los criterios ligados a un capítulo se marcan solos cuando el texto cumple los requisitos de
 * la guía del capítulo. `externos` marca otros criterios que el sistema puede comprobar por su
 * cuenta (por ejemplo, memorial completo). El resto los marca la empresa en `manuales`.
 */
export function auditar(
  capitulos: Partial<Record<CapituloKey, NodoTexto>>,
  manuales: Record<string, boolean>,
  externos: Record<string, boolean> = {},
  criterios: Criterio[] = CRITERIOS,
): Resultado {
  const automaticos: Record<string, boolean> = {};
  let marcados = 0;
  for (const c of criterios) {
    let ok: boolean;
    if (c.capitulo) { ok = revisarCapitulo(c.capitulo, capitulos[c.capitulo]).cumple; automaticos[c.id] = ok; }
    else if (c.id in externos) { ok = externos[c.id]; automaticos[c.id] = ok; }
    else ok = !!manuales[c.id];
    if (ok) marcados++;
  }
  const total = criterios.length;
  const porcentaje = Math.round((marcados / total) * 100);
  const semaforo: Semaforo = porcentaje >= 90 ? "listo" : porcentaje >= 70 ? "riesgo" : "rechazo";
  return { marcados, total, porcentaje, semaforo, automaticos };
}
