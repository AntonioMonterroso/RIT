import type { EstadoRit } from "@/lib/almacen";
import { CAPITULOS } from "@/content/capitulos";
import { sha256Hex } from "@/lib/sha256";

export interface Aprobacion {
  id: string;
  etiqueta: string;
  huella: string;
  nombre: string;
  cargo: string;
  nota: string;
  fecha: string;
}

/** JSON con llaves ordenadas: la misma estructura siempre produce el mismo texto. */
function canonico(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonico).join(",")}]`;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o).sort().map((k) => `${JSON.stringify(k)}:${canonico(o[k])}`).join(",")}}`;
  }
  return JSON.stringify(v) ?? "null";
}

/** Huella SHA-256 del texto de los capítulos, en el orden del reglamento. */
export function huellaDe(capitulos: EstadoRit["capitulos"]): string {
  const orden = CAPITULOS.map((c) => [c.key, capitulos[c.key] ?? null]);
  return sha256Hex(canonico(orden));
}

export type EstadoAprobacion =
  | { estado: "sin_aprobar" }
  | { estado: "aprobado"; ultima: Aprobacion }
  | { estado: "cambios"; ultima: Aprobacion };

export function estadoAprobacion(s: EstadoRit): EstadoAprobacion {
  const ultima = [...s.aprobaciones].sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
  if (!ultima) return { estado: "sin_aprobar" };
  return ultima.huella === huellaDe(s.capitulos) ? { estado: "aprobado", ultima } : { estado: "cambios", ultima };
}

/** Registra una aprobación del texto actual. Las aprobaciones no se editan ni se borran. */
export function aprobar(s: EstadoRit, d: { etiqueta: string; nombre: string; cargo: string; nota: string }): EstadoRit {
  const a: Aprobacion = {
    id: crypto.randomUUID(), etiqueta: d.etiqueta.trim() || "Aprobación del reglamento", huella: huellaDe(s.capitulos),
    nombre: d.nombre.trim(), cargo: d.cargo.trim(), nota: d.nota.trim(), fecha: new Date().toISOString(),
  };
  return { ...s, aprobaciones: [a, ...s.aprobaciones] };
}
