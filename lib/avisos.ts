import type { EstadoRit } from "@/lib/almacen";
import type { Recordatorio } from "@/lib/biblioteca";
import { fechaVigencia, sumarDias } from "@/lib/fechas";

export interface Aviso {
  clave: string;
  titulo: string;
  detalle?: string | null;
  fecha: string;
  origen: "sistema" | "propio" | "general";
  hecho?: boolean;
  /** Id del recordatorio propio, para marcarlo o borrarlo. */
  propioId?: string;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
export const hoyISO = () => iso(new Date());

/** Junta los plazos calculados por el sistema, los recordatorios propios y los generales. */
export function construirAvisos(estado: EstadoRit, generales: Recordatorio[]): Aviso[] {
  const out: Aviso[] = [];
  const p = estado.publicacion;
  if (p.fecha) {
    out.push({ clave: "vigencia", origen: "sistema", titulo: "Entrada en vigor del RIT", detalle: "15 días después de darlo a conocer (Art. 59)", fecha: fechaVigencia(p.fecha) });
  }
  for (const r of estado.recordatorios) {
    out.push({ clave: `propio:${r.id}`, origen: "propio", titulo: r.titulo, fecha: r.fecha, hecho: r.hecho, propioId: r.id });
  }
  for (const g of generales) {
    out.push({ clave: `general:${g.id}`, origen: "general", titulo: g.titulo, detalle: g.detalle, fecha: g.fecha });
  }
  return out.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/** Avisos pendientes que vencen dentro de `dias` días o ya vencieron (los hechos no cuentan). */
export function contarUrgentes(avisos: Aviso[], hoy: string = hoyISO(), dias = 7): number {
  const limite = sumarDias(hoy, dias);
  return avisos.filter((a) => !a.hecho && a.fecha <= limite).length;
}
