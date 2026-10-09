import type { EstadoRit } from "@/lib/almacen";
import { textoPlano } from "@/lib/texto";
import { CAPITULOS } from "@/content/capitulos";

export const DIAS_PRUEBA = 14;

export type FaseSuscripcion = "prueba" | "activa" | "vencida";

export interface InfoPlan {
  fase: FaseSuscripcion;
  /** Días que quedan de prueba (0 si venció o ya es activa). */
  diasRestantes: number;
  /** Solo lectura: se puede ver y descargar todo, pero no modificar. */
  soloLectura: boolean;
}

const MS_DIA = 86_400_000;

/** Fase a partir del estado guardado en la empresa. `pruebaHasta` nulo = prueba sin límite. */
export function calcularPlan(estado: string, pruebaHasta: string | null, ahora: Date = new Date()): InfoPlan {
  if (estado === "activa") return { fase: "activa", diasRestantes: 0, soloLectura: false };
  if (estado === "prueba") {
    if (!pruebaHasta) return { fase: "prueba", diasRestantes: DIAS_PRUEBA, soloLectura: false };
    const dias = Math.ceil((new Date(pruebaHasta).getTime() - ahora.getTime()) / MS_DIA);
    return dias > 0 ? { fase: "prueba", diasRestantes: dias, soloLectura: false } : { fase: "vencida", diasRestantes: 0, soloLectura: true };
  }
  return { fase: "vencida", diasRestantes: 0, soloLectura: true };
}

/* ───────── Modo local (demostración, sin cuentas) ───────── */

interface PlanLocal { estado: "prueba" | "activa"; pruebaHasta: string }
const K_PLAN = "rit:plan:v1";

export function leerPlanLocal(ahora: Date = new Date()): PlanLocal {
  try {
    const raw = localStorage.getItem(K_PLAN);
    if (raw) return JSON.parse(raw) as PlanLocal;
  } catch { /* sin almacenamiento */ }
  const p: PlanLocal = { estado: "prueba", pruebaHasta: new Date(ahora.getTime() + DIAS_PRUEBA * MS_DIA).toISOString() };
  escribirPlanLocal(p);
  return p;
}
export function escribirPlanLocal(p: PlanLocal) {
  try { localStorage.setItem(K_PLAN, JSON.stringify(p)); } catch { /* sin almacenamiento */ }
}
/** Solo para demostración: adelanta o restablece el fin de la prueba. */
export function simularLocal(que: "vencer" | "reiniciar" | "activar", ahora: Date = new Date()) {
  if (que === "activar") escribirPlanLocal({ estado: "activa", pruebaHasta: new Date(ahora.getTime() + DIAS_PRUEBA * MS_DIA).toISOString() });
  if (que === "reiniciar") escribirPlanLocal({ estado: "prueba", pruebaHasta: new Date(ahora.getTime() + DIAS_PRUEBA * MS_DIA).toISOString() });
  if (que === "vencer") escribirPlanLocal({ estado: "prueba", pruebaHasta: new Date(ahora.getTime() - MS_DIA).toISOString() });
}

/* ───────── Lo que la empresa ya construyó (se muestra en la página del plan) ───────── */

export interface ResumenValor {
  articulos: number;
  palabras: number;
  versiones: number;
  aprobaciones: number;
  mesesRutina: number;
  novedadesAplicadas: number;
  puestos: number;
}

export function resumenValor(e: EstadoRit): ResumenValor {
  let articulos = 0; let palabras = 0;
  for (const c of CAPITULOS) {
    const doc = e.capitulos[c.key];
    palabras += textoPlano(doc).split(/\s+/).filter(Boolean).length;
    for (const n of doc?.content ?? []) if (n.type === "heading" && /^Art[ií]culo/.test(n.content?.[0]?.text ?? "")) articulos++;
  }
  return {
    articulos, palabras, versiones: e.versiones.length, aprobaciones: e.aprobaciones.length,
    mesesRutina: Object.values(e.rutina).filter((m) => m.cerrada).length,
    novedadesAplicadas: Object.values(e.novedades).filter((n) => n.estado === "aplicada").length,
    puestos: e.puestos.length,
  };
}
