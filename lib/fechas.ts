// Cálculo de fechas legales para Guatemala. Todo opera con fechas ISO (YYYY-MM-DD) en UTC
// para evitar desfases por zona horaria.

const DIA_MS = 86_400_000;

export function aDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function aISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function sumarDias(iso: string, dias: number): string {
  return aISO(new Date(aDate(iso).getTime() + dias * DIA_MS));
}

/** Domingo de Pascua (algoritmo de Meeus/Jones/Butcher). */
export function pascua(anio: number): string {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return aISO(new Date(Date.UTC(anio, mes - 1, dia)));
}

/**
 * Asuetos de día completo (Art. 127 C.T.). 24 y 31 de diciembre son medio día y no se
 * excluyen (criterio conservador al contar plazos). El 15 de agosto aplica solo al
 * municipio de Guatemala y la fiesta patronal varía por lugar: se agregan con `extras`.
 */
export function feriadosGT(anio: number, extras: string[] = []): Set<string> {
  const p = pascua(anio);
  return new Set([
    `${anio}-01-01`,
    sumarDias(p, -3), // Jueves Santo
    sumarDias(p, -2), // Viernes Santo
    sumarDias(p, -1), // Sábado Santo
    `${anio}-05-01`,
    `${anio}-06-30`,
    `${anio}-09-15`,
    `${anio}-10-20`,
    `${anio}-11-01`,
    `${anio}-12-25`,
    ...extras,
  ]);
}

export function esHabil(iso: string, extras: string[] = []): boolean {
  const dia = aDate(iso).getUTCDay();
  if (dia === 0 || dia === 6) return false;
  return !feriadosGT(Number(iso.slice(0, 4)), extras).has(iso);
}

/** Días hábiles transcurridos después de `desde` hasta `hasta` (inclusive). */
export function diasHabilesEntre(desde: string, hasta: string, extras: string[] = []): number {
  let n = 0;
  for (let cur = sumarDias(desde, 1); cur <= hasta; cur = sumarDias(cur, 1)) {
    if (esHabil(cur, extras)) n++;
  }
  return n;
}

export function sumarDiasHabiles(iso: string, dias: number, extras: string[] = []): string {
  let cur = iso;
  let n = 0;
  while (n < dias) {
    cur = sumarDias(cur, 1);
    if (esHabil(cur, extras)) n++;
  }
  return cur;
}

/** Art. 59 C.T.: el RIT rige 15 días después de darse a conocer a los trabajadores. */
export const DIAS_PUBLICIDAD = 15;

export function fechaVigencia(publicadoISO: string): string {
  return sumarDias(publicadoISO, DIAS_PUBLICIDAD);
}
