// Registro de la base legal que usa el verificador. NINGUNA entrada está validada por un abogado:
// `validada` pasa a true solo cuando un profesional la revise contra el texto oficial vigente.
// `articulo` queda en null cuando no se pudo confirmar el número exacto contra el texto oficial.

export interface NormaBase {
  id: string;
  norma: string;
  articulo: string | null;
  resumen: string;
  validada: boolean;
}

export const NORMAS: Record<string, NormaBase> = {
  vacaciones: { id: "vacaciones", norma: "Código de Trabajo (Decreto 1441)", articulo: "130", resumen: "Tras cada año continuo de servicio, vacaciones remuneradas de al menos 15 días hábiles.", validada: false },
  jornada: { id: "jornada", norma: "Código de Trabajo (Decreto 1441)", articulo: "116 y siguientes", resumen: "Jornada ordinaria diurna: máximo 8 horas diarias y 44 semanales. Mixta: 7 y 42. Nocturna: 6 y 36.", validada: false },
  extras: { id: "extras", norma: "Código de Trabajo (Decreto 1441)", articulo: "capítulo de jornadas", resumen: "El trabajo en jornada extraordinaria se paga con un recargo mínimo del 50% sobre el salario. Confirmar el artículo exacto.", validada: false },
  prueba: { id: "prueba", norma: "Código de Trabajo (Decreto 1441)", articulo: null, resumen: "El periodo de prueba no puede exceder de dos meses.", validada: false },
  aguinaldo: { id: "aguinaldo", norma: "Decreto 76-78 (aguinaldo) y Decreto 42-92 (bono 14)", articulo: null, resumen: "Aguinaldo y bono 14: equivalen al 100% del salario ordinario mensual, no menos.", validada: false },
  descuentos: { id: "descuentos", norma: "Código de Trabajo (Decreto 1441)", articulo: null, resumen: "Las retenciones y descuentos al salario están limitados por la ley; una sanción disciplinaria no debe consistir en multas ni rebajas salariales fuera de esos casos.", validada: false },
  embarazo: { id: "embarazo", norma: "Código de Trabajo (Decreto 1441)", articulo: "151", resumen: "Protección de la mujer en embarazo o lactancia: no se le despide sin autorización previa de la autoridad de trabajo.", validada: false },
  discriminacion: { id: "discriminacion", norma: "Constitución Política (art. 102) y Código de Trabajo", articulo: "14 bis", resumen: "Se prohíbe la discriminación en las relaciones de trabajo.", validada: false },
};

export const FUENTE_OFICIAL = "Texto oficial: Decreto 1441 del Congreso de la República (Código de Trabajo), publicado por el Ministerio de Trabajo y Previsión Social.";
