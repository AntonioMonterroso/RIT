import type { EstadoRit } from "@/lib/almacen";
import { nombreMes } from "@/lib/rutina";
import type { Novedad } from "@/lib/novedades";

export type TipoEvento = "version" | "aprobacion" | "tramite" | "publicacion" | "rutina" | "novedad";

export interface Evento { id: string; fecha: string; tipo: TipoEvento; texto: string }

const TRAMITE: [keyof EstadoRit["tramite"], string][] = [
  ["fechaPresentacion", "Reglamento presentado a la Inspección General de Trabajo"],
  ["fechaPrevio", "Recibido el previo de la Inspección General de Trabajo"],
  ["fechaAprobacion", "Reglamento aprobado por la Inspección General de Trabajo"],
];

/** Historial de cumplimiento, derivado de lo que la empresa ya registró. Nada se captura aparte. */
export function bitacora(e: EstadoRit, novedades: Novedad[] = []): Evento[] {
  const out: Evento[] = [];
  for (const v of e.versiones) out.push({ id: `v:${v.id}`, fecha: v.fecha, tipo: "version", texto: `Versión guardada: ${v.etiqueta}` });
  for (const a of e.aprobaciones) out.push({ id: `a:${a.id}`, fecha: a.fecha, tipo: "aprobacion", texto: `Aprobación interna de ${a.nombre}${a.cargo ? ` (${a.cargo})` : ""}: ${a.etiqueta}` });
  for (const [campo, texto] of TRAMITE) {
    const f = e.tramite[campo];
    if (f) out.push({ id: `t:${campo}`, fecha: f, tipo: "tramite", texto: campo === "fechaPresentacion" && e.tramite.expediente ? `${texto} (expediente ${e.tramite.expediente})` : texto });
  }
  if (e.publicacion.fecha) out.push({ id: "pub", fecha: e.publicacion.fecha, tipo: "publicacion", texto: "Reglamento dado a conocer a los trabajadores" });
  for (const [mes, r] of Object.entries(e.rutina)) if (r.cerrada) out.push({ id: `r:${mes}`, fecha: r.cerrada, tipo: "rutina", texto: `Rutina de cumplimiento de ${nombreMes(mes)} completada` });
  for (const [id, n] of Object.entries(e.novedades)) {
    const titulo = novedades.find((x) => x.id === id)?.titulo ?? "novedad legal";
    out.push({ id: `n:${id}`, fecha: n.fecha, tipo: "novedad", texto: `${n.estado === "aplicada" ? "Novedad aplicada" : "Novedad descartada"}: ${titulo}` });
  }
  return out.sort((a, b) => b.fecha.localeCompare(a.fecha));
}
