// Guía por capítulo: qué debe contener, fundamento legal, errores comunes y requisitos que el
// sistema revisa automáticamente en el texto. REQUIERE REVISIÓN DE UN ABOGADO.
import type { CapituloKey } from "./capitulos";

export interface Requisito {
  texto: string;
  /** Expresión regular (sin distinguir mayúsculas) que debe aparecer en el capítulo. */
  patron: string;
}

export interface Guia {
  objetivo: string;
  debeIncluir: string[];
  fundamento: string;
  errores: string[];
  requisitos: Requisito[];
}

export const GUIA: Record<CapituloKey, Guia> = {
  mod_1: {
    objetivo: "Define a quién aplica el reglamento, su objeto y quién representa al patrono.",
    debeIncluir: ["Objeto y base legal", "Ámbito: todo el personal, también en período de prueba", "Representación patronal", "Qué norma prevalece si hay contradicción"],
    fundamento: "Código de Trabajo, arts. 57 al 60. Principio tutelar: el reglamento no puede desmejorar derechos mínimos.",
    errores: ["Excluir a directivos o a personal en prueba", "No citar la base legal"],
    requisitos: [
      { texto: "Cita los artículos 57 al 60 del Código de Trabajo", patron: "\\b(57|58|59|60)\\b" },
      { texto: "Define el ámbito de aplicación", patron: "[áa]mbito|se aplican|aplica a todos" },
      { texto: "Identifica al patrono o su representante", patron: "representante|patrono|empresa" },
    ],
  },
  mod_2: {
    objetivo: "Regula cómo se contrata: requisitos, contrato por escrito, expediente y período de prueba.",
    debeIncluir: ["Requisitos de ingreso y no discriminación", "Contrato escrito", "Expediente personal", "Período de prueba de dos meses"],
    fundamento: "Código de Trabajo, arts. 18, 19, 28 y 81.",
    errores: ["Exigir requisitos discriminatorios (por ejemplo, pruebas de embarazo)", "Período de prueba mayor al legal"],
    requisitos: [
      { texto: "Regula el período de prueba (art. 81)", patron: "prueba" },
      { texto: "Menciona el contrato de trabajo", patron: "contrato" },
      { texto: "Define el expediente personal", patron: "expediente" },
    ],
  },
  mod_3: {
    objetivo: "Fija jornadas, horarios, control de asistencia, puntualidad y horas extraordinarias.",
    debeIncluir: ["Tipo de jornada y límites de horas", "Horario, almuerzo y descansos", "Marca de asistencia", "Tolerancia de puntualidad", "Autorización previa de horas extra"],
    fundamento: "Código de Trabajo, arts. 116 al 124. Diurna 8 h/día y 44 h/semana (48 de pago); mixta 7 h y 42 h; nocturna 6 h y 36 h.",
    errores: ["Horarios que exceden el límite legal de la jornada", "No exigir autorización previa para horas extra", "No explicar cómo se registra la asistencia"],
    requisitos: [
      { texto: "Indica el tipo de jornada (diurna, mixta o nocturna)", patron: "diurna|mixta|nocturna" },
      { texto: "Define el registro de asistencia", patron: "marca|registro de asistencia|biom[ée]tric|reloj" },
      { texto: "Regula las horas extraordinarias", patron: "extraordinari|horas extra" },
      { texto: "Fija una tolerancia o regla de puntualidad", patron: "toleranc|puntualidad" },
    ],
  },
  mod_4: {
    objetivo: "Establece descansos, asuetos, vacaciones y licencias.",
    debeIncluir: ["Descanso semanal remunerado", "Asuetos oficiales", "15 días hábiles de vacaciones", "Licencias con goce de salario"],
    fundamento: "Código de Trabajo, arts. 61, 126, 127 y 130 al 137.",
    errores: ["Compensar vacaciones en dinero", "Acumular vacaciones por más de dos años", "Omitir el asueto de la fiesta patronal"],
    requisitos: [
      { texto: "Regula las vacaciones (15 días hábiles)", patron: "vacaciones" },
      { texto: "Menciona los asuetos", patron: "asueto" },
      { texto: "Garantiza el descanso semanal", patron: "descanso" },
    ],
  },
  mod_5: {
    objetivo: "Define cómo, cuándo y dónde se paga, qué se puede descontar y las prestaciones.",
    debeIncluir: ["Período y día de pago", "Respeto al salario mínimo", "Deducciones permitidas", "Aguinaldo y Bono 14", "Igualdad salarial"],
    fundamento: "Código de Trabajo, arts. 88 al 99; Decreto 76-78 (aguinaldo) y 42-92 (Bono 14).",
    errores: ["Descuentos no autorizados por la ley", "Pagar por debajo del salario mínimo"],
    requisitos: [
      { texto: "Define la forma y período de pago", patron: "pago|pagar|pagado" },
      { texto: "Regula las deducciones", patron: "deducci|descuent" },
      { texto: "Menciona el salario mínimo", patron: "salario m[ií]nimo" },
    ],
  },
  mod_6: {
    objetivo: "Enumera derechos, obligaciones y prohibiciones de la empresa y de los trabajadores.",
    debeIncluir: ["Obligaciones del patrono", "Obligaciones del trabajador", "Prohibiciones de ambos", "Confidencialidad y uso de tecnología"],
    fundamento: "Código de Trabajo, arts. 61 (patronos), 62 (trabajadores), 63 y 64 (prohibiciones).",
    errores: ["Prohibiciones tan generales que no se pueden sancionar", "Contradecir las obligaciones legales del patrono"],
    requisitos: [
      { texto: "Enumera obligaciones", patron: "obligacion" },
      { texto: "Enumera prohibiciones", patron: "prohibi" },
      { texto: "Cita los artículos 61 al 64", patron: "\\b(61|62|63|64)\\b" },
    ],
  },
  mod_7: {
    objetivo: "Incorpora las normas de higiene y seguridad ocupacional.",
    debeIncluir: ["Cumplimiento del reglamento de SSO", "Uso del equipo de protección personal", "Reconocimientos médicos", "Reporte de accidentes y emergencias"],
    fundamento: "Acuerdo Gubernativo 229-2014 y reformas.",
    errores: ["No exigir el uso de EPP", "No definir cómo se reporta un accidente"],
    requisitos: [
      { texto: "Cita el Acuerdo Gubernativo 229-2014", patron: "229-2014" },
      { texto: "Regula el equipo de protección personal", patron: "protecci[oó]n personal|\\bEPP\\b" },
      { texto: "Regula el reporte de accidentes", patron: "accidente" },
    ],
  },
  mod_8: {
    objetivo: "Tipifica faltas, gradúa sanciones y garantiza el debido proceso. Es el capítulo que más pesa en un juicio.",
    debeIncluir: ["Faltas leves, graves y gravísimas", "Escala: verbal, escrita, suspensión de 1 a 8 días, despido", "Audiencia de descargos y acta", "Plazo de 20 días hábiles para sancionar", "Regla de reincidencia"],
    fundamento: "Código de Trabajo, arts. 60, 76, 77, 80 y 259. Constitución, art. 12 (derecho de defensa).",
    errores: ["Sancionar sin audiencia de descargos", "Notificar la sanción después de 20 días hábiles (prescribe)", "Escalar por faltas de distinta naturaleza"],
    requisitos: [
      { texto: "Establece la amonestación verbal y escrita", patron: "amonestaci" },
      { texto: "Regula la suspensión sin goce de salario", patron: "suspensi" },
      { texto: "Remite al artículo 77 para el despido justificado", patron: "\\b77\\b" },
      { texto: "Garantiza audiencia de descargos", patron: "descargo|audiencia" },
      { texto: "Fija el plazo de 20 días hábiles", patron: "20 d[ií]as|veinte d[ií]as|259" },
      { texto: "Regula la reincidencia", patron: "reincid" },
    ],
  },
  mod_9: {
    objetivo: "Cubre reclamos, prevención del acoso, divulgación y entrada en vigor.",
    debeIncluir: ["Procedimiento de reclamos", "Canal confidencial contra el acoso", "No discriminación", "Entrada en vigor 15 días después de darlo a conocer", "Cómo se divulga"],
    fundamento: "Código de Trabajo, arts. 57 al 60.",
    errores: ["No indicar cómo se da a conocer el reglamento", "Canal de acoso que pasa por el propio acosador"],
    requisitos: [
      { texto: "Regula el acoso laboral o sexual", patron: "acoso" },
      { texto: "Fija la vigencia a los 15 días", patron: "quince d[ií]as|15 d[ií]as" },
      { texto: "Establece un procedimiento de reclamos", patron: "reclamo|petici[oó]n" },
    ],
  },
  mod_puestos: {
    objetivo: "Define puestos clave, responsabilidades críticas y bienes en custodia para poder sancionar incumplimientos.",
    debeIncluir: ["Puesto y jefe inmediato", "3 a 5 responsabilidades críticas", "Fondos, inventarios o equipos en custodia", "Respaldo del art. 77 inciso a)"],
    fundamento: "Código de Trabajo, art. 77 inciso a).",
    errores: ["Despedir por incumplir funciones que nunca se definieron", "Puestos sin responsabilidades concretas"],
    requisitos: [
      { texto: "Respalda el incumplimiento de funciones (art. 77 a)", patron: "\\b77\\b" },
      { texto: "Define responsabilidades de puestos", patron: "responsabilidad|atribucion|funciones" },
    ],
  },
};
