import { evaluarJornada, type EvaluacionJornada } from "@/lib/jornada";
import type { Diagnostico } from "@/lib/tipos";

export interface Recomendacion { nivel: "info" | "aviso" | "alerta"; texto: string }

export const OBLIGATORIO_DESDE = 10; // art. 58 C.T.

export const obligatorio = (d: Diagnostico) => d.trabajadores >= OBLIGATORIO_DESDE;

export const evaluar = (d: Diagnostico): EvaluacionJornada =>
  evaluarJornada({ entrada: d.entrada, salida: d.salida, almuerzoMin: d.almuerzoMin, almuerzoComputa: d.almuerzoComputa, diasLaborales: d.diasLaborales });

export function recomendaciones(d: Diagnostico): Recomendacion[] {
  const out: Recomendacion[] = [];
  out.push(obligatorio(d)
    ? { nivel: "aviso", texto: `Con ${d.trabajadores} trabajadores permanentes su empresa está obligada a tener Reglamento Interior de Trabajo aprobado (art. 58 del Código de Trabajo).` }
    : { nivel: "info", texto: `El art. 58 obliga a tener RIT desde 10 trabajadores permanentes. Con ${d.trabajadores} puede adoptarlo de forma voluntaria; la IGT lo revisa igual.` });
  const j = evaluar(d);
  for (const m of j.mensajes) out.push({ nivel: j.ok ? "info" : "alerta", texto: m });
  if (j.tipo !== "diurna") out.push({ nivel: "aviso", texto: `Su horario se clasifica como jornada ${j.tipo}: los límites legales de horas son menores que en la diurna.` });
  if (d.turnos) out.push({ nivel: "info", texto: "Con turnos rotativos se incluirá la cláusula de asignación y cambio de turnos." });
  if (d.manejaEfectivo) out.push({ nivel: "aviso", texto: "Maneja efectivo o inventarios: defina en Puestos quién custodia cada bien para poder sancionar faltantes." });
  if (d.usaVehiculos) out.push({ nivel: "info", texto: "Se incluirá la cláusula de conducción de vehículos (licencia vigente y reporte de accidentes)." });
  if (d.teletrabajo) out.push({ nivel: "info", texto: "Se incluirá la cláusula de teletrabajo y derecho a la desconexión." });
  if (d.giro === "industria") out.push({ nivel: "aviso", texto: "Industria: revise con un especialista el cumplimiento del reglamento de seguridad (AG 229-2014); incluimos cláusulas de maquinaria y EPP." });
  return out;
}
