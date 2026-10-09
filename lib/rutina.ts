import type { EstadoRit } from "@/lib/almacen";

export interface TareaRutina { id: string; titulo: string; detalle: string; href: string }

export const TAREAS_RUTINA: TareaRutina[] = [
  { id: "planilla", titulo: "Contar trabajadores", detalle: "Con 10 o más trabajadores el reglamento es obligatorio (Art. 58). Confirme si su planilla cambió.", href: "/diagnostico" },
  { id: "puestos", titulo: "Revisar puestos y horarios", detalle: "¿Hay puestos nuevos o cambios de jornada? El anexo de puestos y el horario deben coincidir con la realidad.", href: "/puestos" },
  { id: "sso", titulo: "Revisar seguridad y salud ocupacional", detalle: "Plan de SSO, comité, capacitaciones y constancias de entrega de equipo al día.", href: "/seguridad" },
  { id: "novedades", titulo: "Atender novedades legales", detalle: "Aplique o descarte cada novedad publicada este mes.", href: "/novedades" },
  { id: "plazos", titulo: "Revisar plazos y recordatorios", detalle: "Confirme que no hay plazos vencidos y programe los de las próximas semanas.", href: "/calendario" },
  { id: "ejemplares", titulo: "Verificar ejemplares y constancias", detalle: "Los ejemplares fijados deben seguir visibles y cada trabajador nuevo debe firmar su constancia.", href: "/formatos" },
  { id: "respaldo", titulo: "Guardar un respaldo", detalle: "Descargue la copia de seguridad de su reglamento y datos.", href: "/ajustes" },
];

/** Mes en formato "2026-10". */
export const mesDe = (d: Date = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const nombreMes = (mes: string) => { const [y, m] = mes.split("-").map(Number); return `${MESES[m - 1]} de ${y}`; };

const anterior = (mes: string) => { const [y, m] = mes.split("-").map(Number); return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`; };

export const hechasEn = (e: EstadoRit, mes: string) => TAREAS_RUTINA.filter((t) => e.rutina[mes]?.hechos[t.id]).length;

/** Marca o desmarca una tarea; el mes queda cerrado cuando todas están hechas. */
export function marcarTarea(e: EstadoRit, mes: string, id: string, valor: boolean, ahora: Date = new Date()): EstadoRit {
  const actual = e.rutina[mes] ?? { hechos: {}, cerrada: null };
  const hechos = { ...actual.hechos, [id]: valor };
  const completa = TAREAS_RUTINA.every((t) => hechos[t.id]);
  const cerrada = completa ? (actual.cerrada ?? ahora.toISOString()) : null;
  return { ...e, rutina: { ...e.rutina, [mes]: { hechos, cerrada } } };
}

/** Meses seguidos con la rutina cerrada, contando hacia atrás. El mes en curso suma si ya está cerrado. */
export function racha(e: EstadoRit, hoy: Date = new Date()): number {
  let mes = mesDe(hoy);
  let n = 0;
  if (e.rutina[mes]?.cerrada) n++;
  mes = anterior(mes);
  while (e.rutina[mes]?.cerrada) { n++; mes = anterior(mes); }
  return n;
}
