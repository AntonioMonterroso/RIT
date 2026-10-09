// Criterios de verificación previos a la presentación ante la IGT (16 ítems del kit EGE).
import type { CapituloKey } from "./capitulos";

export interface Criterio {
  id: string;
  bloque: "A" | "B" | "C" | "D";
  texto: string;
  /** Si existe, se marca solo cuando ese capítulo tiene contenido suficiente. */
  capitulo?: CapituloKey;
}

export const BLOQUES: Record<Criterio["bloque"], string> = {
  A: "Requisitos formales y documentación de soporte",
  B: "Contenido normativo imperativo (Arts. 57 al 60 C.T.)",
  C: "Salud ocupacional, acoso y puestos clave",
  D: "Publicidad y entrada en vigencia",
};

export const CRITERIOS: Criterio[] = [
  { id: "A1", bloque: "A", texto: "Copia legible de la Patente de Comercio de Empresa / Sociedad." },
  { id: "A2", bloque: "A", texto: "Copia del nombramiento del Representante Legal inscrito en el Registro Mercantil." },
  { id: "A3", bloque: "A", texto: "Memorial de solicitud de aprobación dirigido al Inspector General de Trabajo." },
  { id: "A4", bloque: "A", texto: "Planilla pagada del IGSS o constancia del Informe Anual del Empleador que acredita 10 o más trabajadores (Art. 58 C.T.)." },
  { id: "B1", bloque: "B", capitulo: "mod_1", texto: "Capítulo I: disposiciones generales, ámbito de aplicación y representación patronal." },
  { id: "B2", bloque: "B", capitulo: "mod_2", texto: "Capítulo II: requisitos de ingreso, expediente personal y período de prueba (Art. 81 C.T.)." },
  { id: "B3", bloque: "B", capitulo: "mod_3", texto: "Capítulo III: jornadas (diurna, mixta, nocturna), horarios y marcas de asistencia." },
  { id: "B4", bloque: "B", capitulo: "mod_4", texto: "Capítulo IV: descansos semanales, asuetos oficiales y 15 días hábiles de vacaciones." },
  { id: "B5", bloque: "B", capitulo: "mod_5", texto: "Capítulo V: salarios, períodos, formas de pago y deducciones autorizadas." },
  { id: "B6", bloque: "B", capitulo: "mod_6", texto: "Capítulo VI: derechos, obligaciones y prohibiciones para patrono y trabajadores." },
  { id: "B7", bloque: "B", capitulo: "mod_8", texto: "Capítulo VIII: régimen disciplinario gradual (verbal, escrita, suspensión 1-8 días y despido justificado Art. 77)." },
  { id: "C1", bloque: "C", capitulo: "mod_7", texto: "Capítulo VII: cumplimiento del Reglamento SSO (Acuerdo Gubernativo 229-2014 y reformas)." },
  { id: "C2", bloque: "C", capitulo: "mod_9", texto: "Capítulo IX: canal interno para la prevención y atención del acoso laboral o sexual." },
  { id: "C3", bloque: "C", capitulo: "mod_puestos", texto: "Anexo de puestos: respaldo de responsabilidad operativa y custodia de activos." },
  { id: "D1", bloque: "D", texto: "Estipulación de entrada en vigencia 15 días después de ponerse en conocimiento del personal (Art. 59 C.T.)." },
  { id: "D2", bloque: "D", texto: "Compromiso de fijar el RIT en dos sitios visibles o entregar folleto impreso a cada trabajador." },
];
