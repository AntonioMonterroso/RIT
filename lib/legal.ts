import { CAPITULOS, type CapituloKey } from "@/content/capitulos";
import { NORMAS, type NormaBase } from "@/content/baselegal";
import { textoPlano, type NodoTexto } from "@/lib/texto";
import type { Capitulos } from "@/lib/numeracion";

/**
 * Verificador legal: busca en el texto cifras o expresiones que parecen contradecir un mínimo legal.
 * Es orientativo (lee texto, no interpreta la ley): «contradice» = la cifra queda por debajo del mínimo;
 * «revisar» = expresión delicada que conviene consultar con un abogado.
 */
export type Gravedad = "contradice" | "revisar";

export interface AlertaLegal {
  regla: string;
  capitulo: CapituloKey;
  gravedad: Gravedad;
  mensaje: string;
  extracto: string;
  norma: NormaBase;
}

interface Regla {
  id: string;
  norma: keyof typeof NORMAS;
  gravedad: Gravedad;
  mensaje: string;
  /** Devuelve los fragmentos que incumplen. */
  detectar: (texto: string) => string[];
}

/** Frases que ya prohíben o protegen: no son una alerta. */
const PROHIBE = /prohib|no (?:se )?(?:podr[aá]n?|aplicar[aá]n?|habr[aá]n?|permite|admite)|sin (?:multas|descuentos)|queda vedado/i;
const NUM = "(\\d{1,3})";
const todos = (texto: string, re: RegExp) => [...texto.matchAll(re)];
const extracto = (t: string, i: number, len: number) => t.slice(Math.max(0, i - 25), Math.min(t.length, i + len + 25)).replace(/\s+/g, " ").trim();

export const REGLAS: Regla[] = [
  {
    id: "vacaciones-minimas", norma: "vacaciones", gravedad: "contradice",
    mensaje: "Las vacaciones no pueden ser menores a 15 días hábiles por año de servicio.",
    detectar: (t) => [
      ...todos(t, new RegExp(`${NUM}\\s+d[ií]as\\s+(?:h[aá]biles\\s+)?(?:de\\s+)?vacaciones`, "gi")),
      ...todos(t, new RegExp(`vacaciones[^.\\n]{0,60}?${NUM}\\s+d[ií]as`, "gi")),
    ].filter((m) => Number(m[1]) < 15).map((m) => extracto(t, m.index ?? 0, m[0].length)),
  },
  {
    id: "jornada-semanal", norma: "jornada", gravedad: "contradice",
    mensaje: "Ninguna jornada ordinaria puede pasar de 44 horas semanales.",
    detectar: (t) => todos(t, new RegExp(`${NUM}\\s+horas\\s+(?:a la semana|semanales|por semana)`, "gi"))
      .filter((m) => Number(m[1]) > 44).map((m) => extracto(t, m.index ?? 0, m[0].length)),
  },
  {
    id: "jornada-diurna", norma: "jornada", gravedad: "contradice",
    mensaje: "La jornada ordinaria diurna no puede pasar de 8 horas diarias.",
    detectar: (t) => todos(t, new RegExp(`jornada\\s+(?:ordinaria\\s+)?diurna[^.\\n]{0,80}?${NUM}\\s+horas\\s+(?:diarias|al d[ií]a|por d[ií]a)`, "gi"))
      .filter((m) => Number(m[1]) > 8).map((m) => extracto(t, m.index ?? 0, m[0].length)),
  },
  {
    id: "recargo-extra", norma: "extras", gravedad: "contradice",
    mensaje: "Las horas extraordinarias se pagan con un recargo mínimo del 50%.",
    detectar: (t) => todos(t, new RegExp(`(?:horas\\s+extra\\w*|extraordinari\\w+)[^.\\n]{0,120}?${NUM}\\s*%`, "gi"))
      .filter((m) => Number(m[1]) < 50).map((m) => extracto(t, m.index ?? 0, m[0].length)),
  },
  {
    id: "periodo-prueba", norma: "prueba", gravedad: "contradice",
    mensaje: "El periodo de prueba no puede exceder de dos meses.",
    detectar: (t) => todos(t, new RegExp(`per[ií]odo\\s+de\\s+prueba[^.\\n]{0,80}?${NUM}\\s+(meses|mes|d[ií]as)`, "gi"))
      .filter((m) => (/mes/i.test(m[2]) ? Number(m[1]) > 2 : Number(m[1]) > 60)).map((m) => extracto(t, m.index ?? 0, m[0].length)),
  },
  {
    id: "aguinaldo-bono14", norma: "aguinaldo", gravedad: "contradice",
    mensaje: "El aguinaldo y el bono 14 equivalen al 100% del salario ordinario mensual; no pueden ser menores.",
    detectar: (t) => todos(t, new RegExp(`(?:aguinaldo|bono\\s*14)[^.\\n]{0,80}?${NUM}\\s*%`, "gi"))
      .filter((m) => Number(m[1]) < 100).map((m) => extracto(t, m.index ?? 0, m[0].length)),
  },
  {
    id: "multas-descuentos", norma: "descuentos", gravedad: "revisar",
    mensaje: "Las sanciones no deben consistir en multas o descuentos al salario fuera de lo que permite la ley.",
    detectar: (t) => [
      ...todos(t, /\bmultas?\b/gi),
      ...todos(t, /descuent\w+[^.\n]{0,60}(?:salario|sueldo)[^.\n]{0,60}(?:sanci[oó]n|falta)/gi),
    ].filter((m) => !PROHIBE.test(t.slice(Math.max(0, (m.index ?? 0) - 60), (m.index ?? 0) + m[0].length + 20))).map((m) => extracto(t, m.index ?? 0, m[0].length)),
  },
  {
    id: "embarazo-despido", norma: "embarazo", gravedad: "revisar",
    mensaje: "El despido de una trabajadora embarazada o en lactancia requiere autorización previa de la autoridad de trabajo.",
    detectar: (t) => todos(t, /(?:embarazo|lactancia)[^.\n]{0,100}(?:despid|terminar el contrato|cancelar el contrato)|(?:despedir|despid\w+|terminar el contrato|cancelar el contrato)[^.\n]{0,100}(?:embarazo|lactancia)/gi)
      .filter((m) => !/autorizaci[oó]n|protecci[oó]n|prohib|garantiz|no (?:podr|se)/i.test(extracto(t, m.index ?? 0, m[0].length + 80))).map((m) => extracto(t, m.index ?? 0, m[0].length)),
  },
  {
    id: "discriminacion", norma: "discriminacion", gravedad: "revisar",
    mensaje: "Exigir un sexo o estado civil para contratar puede ser discriminatorio.",
    detectar: (t) => todos(t, /(?:solo|únicamente|exclusivamente)\s+(?:para\s+)?(?:hombres|mujeres)|(?:ser|estar)\s+(?:soltera|soltero|casada|casado)/gi)
      .map((m) => extracto(t, m.index ?? 0, m[0].length)),
  },
];

export function alertasDeCapitulo(key: CapituloKey, doc: NodoTexto | null | undefined): AlertaLegal[] {
  const texto = textoPlano(doc);
  if (!texto) return [];
  const out: AlertaLegal[] = [];
  for (const r of REGLAS) {
    for (const ex of new Set(r.detectar(texto))) out.push({ regla: r.id, capitulo: key, gravedad: r.gravedad, mensaje: r.mensaje, extracto: ex, norma: NORMAS[r.norma] });
  }
  return out;
}

export function alertasLegales(capitulos: Capitulos): AlertaLegal[] {
  return CAPITULOS.flatMap((c) => alertasDeCapitulo(c.key, capitulos[c.key]));
}

export const contradicciones = (capitulos: Capitulos) => alertasLegales(capitulos).filter((a) => a.gravedad === "contradice").length;
