import type { EstadoRit } from "@/lib/almacen";
import { auditar } from "@/lib/auditoria";
import { estadoAprobacion } from "@/lib/aprobaciones";
import { pendientes, type Novedad } from "@/lib/novedades";
import { externosAuditoria } from "@/lib/progreso";
import { mesDe } from "@/lib/rutina";

export interface Indicador { id: string; texto: string; ok: boolean; detalle: string; href: string }

const MS_DIA = 86_400_000;

/** Qué tan al día está el reglamento. No es un dictamen legal: son controles de mantenimiento. */
export function salud(e: EstadoRit, novedades: Novedad[], ahora: Date = new Date()): { puntos: number; indicadores: Indicador[] } {
  const aud = auditar(e.capitulos, e.manuales, externosAuditoria(e));
  const apr = estadoAprobacion(e);
  const pend = pendientes(e, novedades).length;
  const mes = mesDe(ahora);
  const mesAnterior = mesDe(new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1));
  const rutinaAlDia = !!(e.rutina[mes]?.cerrada || e.rutina[mesAnterior]?.cerrada);
  const ultima = e.aprobaciones[0] ? new Date(e.aprobaciones[0].fecha) : null;
  const revisadoEsteAnio = !!ultima && (ahora.getTime() - ultima.getTime()) / MS_DIA < 365;
  const vencidos = e.recordatorios.filter((r) => !r.hecho && r.fecha < ahora.toISOString().slice(0, 10)).length;

  const indicadores: Indicador[] = [
    { id: "auditoria", texto: "Cumple los criterios de la IGT", ok: aud.porcentaje >= 90, detalle: `${aud.marcados} de ${aud.total} criterios`, href: "/auditoria" },
    { id: "aprobacion", texto: "El texto vigente tiene aprobación interna", ok: apr.estado === "aprobado", detalle: apr.estado === "cambios" ? "Hay cambios posteriores a la última aprobación" : apr.estado === "aprobado" ? "Aprobado" : "Sin aprobar", href: "/aprobaciones" },
    { id: "revision", texto: "Revisión anual al día", ok: revisadoEsteAnio, detalle: ultima ? `Última aprobación: ${ultima.toLocaleDateString("es-GT")}` : "Aún sin revisión", href: "/aprobaciones" },
    { id: "novedades", texto: "Sin novedades legales pendientes", ok: pend === 0, detalle: pend === 0 ? "Al día" : `${pend} por atender`, href: "/novedades" },
    { id: "rutina", texto: "Rutina mensual al día", ok: rutinaAlDia, detalle: rutinaAlDia ? "Cerrada" : "Pendiente este mes", href: "/cumplimiento" },
    { id: "plazos", texto: "Sin plazos vencidos", ok: vencidos === 0, detalle: vencidos === 0 ? "Al día" : `${vencidos} vencido(s)`, href: "/calendario" },
  ];
  return { puntos: Math.round((indicadores.filter((i) => i.ok).length / indicadores.length) * 100), indicadores };
}
