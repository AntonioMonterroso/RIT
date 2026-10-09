import type { CapituloKey } from "@/content/capitulos";
import type { EstadoRit } from "@/lib/almacen";
import { sumarDias, aISO } from "@/lib/fechas";
import { clausulaANodos, documento, textoPlano } from "@/lib/texto";
import { maxArticulo } from "@/lib/numeracion";
import { guardarVersion } from "@/lib/versiones";
import { normalizar } from "@/lib/navegacion";

export interface Novedad {
  id: string;
  titulo: string;
  resumen: string;
  capitulo: CapituloKey | null;
  texto_sugerido: string;
  vigente_desde: string | null;
  publicada_en: string;
}

export type EstadoNovedad = "pendiente" | "aplicada" | "descartada";

export const estadoNovedad = (e: EstadoRit, n: Novedad): EstadoNovedad => e.novedades[n.id]?.estado ?? "pendiente";

/** ¿El reglamento ya dice lo que sugiere la novedad? Compara el inicio del texto sugerido. */
export function yaIncluida(e: EstadoRit, n: Novedad): boolean {
  if (!n.capitulo || !n.texto_sugerido.trim()) return false;
  const base = normalizar(textoPlano(e.capitulos[n.capitulo])).replace(/\s+/g, " ");
  const muestra = normalizar(n.texto_sugerido).replace(/\s+/g, " ").trim().slice(0, 60);
  return muestra.length >= 20 && base.includes(muestra);
}

export const pendientes = (e: EstadoRit, todas: Novedad[]) => todas.filter((n) => estadoNovedad(e, n) === "pendiente");

/**
 * Aplica la novedad: respalda el texto actual, agrega el artículo sugerido al final del capítulo
 * y deja un recordatorio para presentar la reforma ante la IGT (un reglamento aprobado no se
 * modifica sin autorización).
 */
export function aplicarNovedad(e: EstadoRit, n: Novedad, ahora: Date = new Date()): EstadoRit {
  if (estadoNovedad(e, n) !== "pendiente" || !n.capitulo) return e;
  const respaldado = guardarVersion(e, `Antes de novedad: ${n.titulo}`.slice(0, 80), ahora);
  const nodos = clausulaANodos(n.titulo, n.texto_sugerido, maxArticulo(e.capitulos) + 1);
  const capitulos = { ...e.capitulos, [n.capitulo]: documento([...(e.capitulos[n.capitulo]?.content ?? []), ...nodos]) };
  const hoy = aISO(ahora);
  return {
    ...respaldado, capitulos,
    novedades: { ...e.novedades, [n.id]: { estado: "aplicada", fecha: ahora.toISOString() } },
    recordatorios: [...e.recordatorios, { id: crypto.randomUUID(), titulo: `Presentar a la IGT la reforma: ${n.titulo}`.slice(0, 120), fecha: sumarDias(hoy, 7), hecho: false }],
  };
}

export const descartarNovedad = (e: EstadoRit, n: Novedad, ahora: Date = new Date()): EstadoRit =>
  estadoNovedad(e, n) === "pendiente" ? { ...e, novedades: { ...e.novedades, [n.id]: { estado: "descartada", fecha: ahora.toISOString() } } } : e;
