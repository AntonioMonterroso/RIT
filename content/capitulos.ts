// Estructura del RIT (9 capítulos + anexo de puestos) y cláusulas estándar de respaldo.
// Textos base tomados del kit EGE. REQUIEREN REVISIÓN DE UN ABOGADO antes de uso comercial.

export type CapituloKey =
  | "mod_1" | "mod_2" | "mod_3" | "mod_4" | "mod_5"
  | "mod_6" | "mod_7" | "mod_8" | "mod_9" | "mod_puestos";

export interface Capitulo {
  key: CapituloKey;
  titulo: string;
  estandar: string;
}

export const CAPITULOS: Capitulo[] = [
  {
    key: "mod_1",
    titulo: "Capítulo I: Disposiciones Generales y Ámbito",
    estandar:
      "El presente Reglamento Interior de Trabajo regula las condiciones obligatorias a que deben sujetarse el patrono y sus trabajadores con motivo de la prestación de servicios, conforme los artículos 57 al 60 del Código de Trabajo de Guatemala.",
  },
  {
    key: "mod_2",
    titulo: "Capítulo II: Ingreso, Contratación y Prueba",
    estandar:
      "Toda persona que aspire a un puesto en la empresa deberá cumplir con el proceso de selección de personal. Los dos primeros meses de trabajo se reputan como período de prueba conforme el artículo 81 del Código de Trabajo.",
  },
  {
    key: "mod_3",
    titulo: "Capítulo III: Jornadas, Horarios y Asistencia",
    estandar:
      "La jornada ordinaria diurna no podrá ser mayor de 8 horas diarias ni de 44 horas semanales, equivalente a 48 horas para efectos del pago de salario. Los horarios específicos serán fijados por la empresa e informados al personal.",
  },
  {
    key: "mod_4",
    titulo: "Capítulo IV: Descansos, Licencias y Vacaciones",
    estandar:
      "Los trabajadores gozarán de un día de descanso remunerado después de cada jornada semanal de trabajo. Asimismo, tendrán derecho a los días de asueto oficial estipulados en el artículo 127 del Código de Trabajo y a 15 días hábiles de vacaciones anuales remuneradas tras un año de servicios continuos.",
  },
  {
    key: "mod_5",
    titulo: "Capítulo V: Salarios y Formas de Pago",
    estandar:
      "Los salarios se devengarán por unidad de tiempo y serán pagados mediante transferencia bancaria o cheque el último día hábil de cada período pactado (quincenal o mensual), respetando el Salario Mínimo legal vigente en Guatemala.",
  },
  {
    key: "mod_6",
    titulo: "Capítulo VI: Derechos, Obligaciones y Prohibiciones",
    estandar:
      "Son obligaciones y prohibiciones para trabajadores y patrono las establecidas en los artículos 61, 62, 63 y 64 del Código de Trabajo de Guatemala y las normas internas operativas estipuladas por la dirección.",
  },
  {
    key: "mod_7",
    titulo: "Capítulo VII: Higiene y Seguridad Ocupacional",
    estandar:
      "Tanto la empresa como los trabajadores se sujetan al Reglamento de Salud y Seguridad Ocupacional (Acuerdo Gubernativo 229-2014 y sus reformas). Es obligatorio el uso del Equipo de Protección Personal (EPP) suministrado.",
  },
  {
    key: "mod_8",
    titulo: "Capítulo VIII: Régimen Disciplinario y Faltas",
    estandar:
      "Las sanciones disciplinarias ante el incumplimiento de normas laborales se graduarán en: a) Amonestación verbal; b) Amonestación escrita; c) Suspensión sin goce de salario de 1 a 8 días, previo cumplimiento del procedimiento interno; d) Despido justificado conforme al artículo 77 del Código de Trabajo. Toda sanción requerirá audiencia previa de descargos.",
  },
  {
    key: "mod_9",
    titulo: "Capítulo IX: Reclamos, Acoso y Vigencia",
    estandar:
      "Todo trabajador tiene derecho a elevar reclamos o peticiones respetuosas a su superior inmediato o a la Gerencia. La empresa garantiza un ambiente libre de acoso laboral o discriminación. Este reglamento entrará en vigor quince días después de ser puesto en conocimiento del personal, una vez aprobado por la Inspección General de Trabajo.",
  },
  {
    key: "mod_puestos",
    titulo: "Anexo: Definición Integrada de Puestos",
    estandar:
      "Los trabajadores están obligados a cumplir con diligencia las atribuciones e instrucciones inherentes a su cargo impartidas por sus superiores. El incumplimiento grave o reiterado de dichas funciones se tipifica como falta grave de conformidad con el artículo 77 inciso a) del Código de Trabajo.",
  },
];

export const CAPITULO_POR_KEY = Object.fromEntries(
  CAPITULOS.map((c) => [c.key, c]),
) as Record<CapituloKey, Capitulo>;
