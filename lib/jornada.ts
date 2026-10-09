// Clasificación y validación de jornadas según el Código de Trabajo (arts. 116 al 124),
// con los límites que usa el kit EGE. REQUIERE REVISIÓN DE UN ABOGADO.

export type TipoJornada = "diurna" | "mixta" | "nocturna";

export const LIMITES: Record<TipoJornada, { diarias: number; semanales: number; nombre: string }> = {
  diurna: { diarias: 8, semanales: 44, nombre: "Diurna (6:00 a 18:00)" },
  mixta: { diarias: 7, semanales: 42, nombre: "Mixta" },
  nocturna: { diarias: 6, semanales: 36, nombre: "Nocturna (18:00 a 6:00)" },
};

const aMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** Minutos del intervalo [ini, fin) que caen entre las 18:00 y las 6:00. Soporta cruce de medianoche. */
function minutosNocturnos(ini: number, fin: number): number {
  if (fin <= ini) fin += 1440;
  let n = 0;
  for (let t = ini; t < fin; t += 1) {
    const h = (t % 1440) / 60;
    if (h >= 18 || h < 6) n++;
  }
  return n;
}

export function minutosTotales(entrada: string, salida: string): number {
  const ini = aMin(entrada);
  let fin = aMin(salida);
  if (fin <= ini) fin += 1440;
  return fin - ini;
}

/** Diurna si no hay horas nocturnas; nocturna si hay 4 o más (o todo es nocturno); mixta en otro caso. */
export function clasificarJornada(entrada: string, salida: string): TipoJornada {
  const total = minutosTotales(entrada, salida);
  const noct = minutosNocturnos(aMin(entrada), aMin(salida));
  if (noct === 0) return "diurna";
  if (noct >= 240 || noct === total) return "nocturna";
  return "mixta";
}

export interface EvaluacionJornada {
  tipo: TipoJornada;
  horasDiarias: number;     // tiempo efectivo por día
  diasPorSemana: number;
  horasSemanales: number;
  limite: { diarias: number; semanales: number };
  excedeDiario: boolean;
  excedeSemanal: boolean;
  ok: boolean;
  mensajes: string[];
}

export function diasDeLaSemana(texto: string): number {
  const t = texto.toLowerCase();
  const orden = ["lunes", "martes", "mi[eé]rcoles", "jueves", "viernes", "s[aá]bado", "domingo"];
  const rango = t.match(/(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s+a\s+(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)/);
  if (rango) {
    const idx = (d: string) => orden.findIndex((o) => new RegExp(`^${o}$`).test(d));
    const a = idx(rango[1]); const b = idx(rango[2]);
    if (a >= 0 && b >= a) return b - a + 1;
  }
  const sueltos = orden.filter((o) => new RegExp(o).test(t)).length;
  return Math.min(Math.max(sueltos, 1), 7);
}

export function evaluarJornada(p: {
  entrada: string; salida: string; almuerzoMin: number; almuerzoComputa: boolean; diasLaborales: string;
}): EvaluacionJornada {
  const tipo = clasificarJornada(p.entrada, p.salida);
  const bruto = minutosTotales(p.entrada, p.salida);
  const efectivos = bruto - (p.almuerzoComputa ? 0 : p.almuerzoMin);
  const horasDiarias = Math.round((efectivos / 60) * 100) / 100;
  const diasPorSemana = diasDeLaSemana(p.diasLaborales);
  const horasSemanales = Math.round(horasDiarias * diasPorSemana * 100) / 100;
  const limite = LIMITES[tipo];
  const excedeDiario = horasDiarias > limite.diarias;
  const excedeSemanal = horasSemanales > limite.semanales;
  const mensajes: string[] = [];
  if (excedeDiario) mensajes.push(`La jornada ${tipo} permite hasta ${limite.diarias} horas diarias y su horario suma ${horasDiarias}.`);
  if (excedeSemanal) mensajes.push(`La jornada ${tipo} permite hasta ${limite.semanales} horas semanales y su horario suma ${horasSemanales}. Lo que exceda son horas extraordinarias.`);
  if (!p.almuerzoComputa && p.almuerzoMin === 0) mensajes.push("Sin tiempo de almuerzo definido, todo el horario cuenta como tiempo efectivo.");
  return { tipo, horasDiarias, diasPorSemana, horasSemanales, limite, excedeDiario, excedeSemanal, ok: !excedeDiario && !excedeSemanal, mensajes };
}
