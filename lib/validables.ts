import { CAPITULOS } from "@/content/capitulos";
import { NORMAS } from "@/content/baselegal";
import { CRITERIOS } from "@/content/checklist";
import { GUIA } from "@/content/guia";
import { clausulasDe, type Ctx } from "@/content/plantillas";
import { contexto } from "@/lib/generador";
import { ESTADO_INICIAL } from "@/lib/almacen";
import { fechasLegales } from "@/lib/fechasLegales";
import { RERIT_DOCS, RERIT_NOTA, RERIT_PASOS, SSO_FUENTES, SSO_ITEMS, SSO_NOTA } from "@/content/guiasLegales";
import { LIMITES } from "@/lib/jornada";
import { REGLAS } from "@/lib/legal";
import { sha256Hex } from "@/lib/sha256";

/**
 * Piezas de contenido legal que un abogado debe revisar antes de que el sistema se venda.
 * Cada una tiene una huella de su contenido: si el contenido cambia después de la validación,
 * la validación queda «desactualizada» y hay que revisarla de nuevo.
 */
export interface Validable {
  id: string;
  grupo: "Normas del verificador" | "Reglas del verificador" | "Guía por capítulo" | "Cláusulas por capítulo" | "Otros criterios";
  titulo: string;
  /** Texto que el abogado debe leer. */
  contenido: string;
  huella: string;
}

export interface Validacion {
  elemento_id: string;
  huella: string;
  validada_por: string;
  colegiado: string;
  fecha_revision: string;
  nota: string;
  validada_en: string;
}

export type EstadoValidacion = "sin_revisar" | "validada" | "desactualizada";

/** Contexto con todas las opciones activas, para que el abogado lea el texto completo de cada cláusula. */
const CTX_COMPLETO: Ctx = contexto({
  empresa: { ...ESTADO_INICIAL.empresa, razon_social: "[Empresa de ejemplo, S.A.]", representante_legal: "[Representante legal]" },
  diagnostico: { ...ESTADO_INICIAL.diagnostico, completo: true, teletrabajo: true, turnos: true, manejaEfectivo: true, usaVehiculos: true, uniforme: true, epp: true },
});

const el = (id: string, grupo: Validable["grupo"], titulo: string, contenido: string): Validable => ({ id, grupo, titulo, contenido, huella: sha256Hex(contenido) });

export function validables(): Validable[] {
  const out: Validable[] = [];
  for (const n of Object.values(NORMAS)) {
    out.push(el(`norma:${n.id}`, "Normas del verificador", `${n.norma}${n.articulo ? `, art. ${n.articulo}` : ""}`, `${n.norma}${n.articulo ? `, art. ${n.articulo}` : " (artículo por confirmar)"}\n${n.resumen}`));
  }
  for (const r of REGLAS) {
    out.push(el(`regla:${r.id}`, "Reglas del verificador", r.id, `${r.gravedad === "contradice" ? "Alerta fuerte" : "Alerta de revisión"} — base: ${NORMAS[r.norma].norma}\n${r.mensaje}`));
  }
  for (const c of CAPITULOS) {
    const g = GUIA[c.key];
    out.push(el(`guia:${c.key}`, "Guía por capítulo", c.titulo,
      [g.objetivo, `Debe incluir: ${g.debeIncluir.join("; ")}`, `Fundamento: ${g.fundamento}`, `Errores comunes: ${g.errores.join("; ")}`, `Requisitos revisados: ${g.requisitos.map((r) => r.texto).join("; ")}`].join("\n")));
    const cl = clausulasDe(c.key);
    if (cl.length) out.push(el(`clausulas:${c.key}`, "Cláusulas por capítulo", c.titulo, cl.map((x) => `${x.titulo}\n${x.texto(CTX_COMPLETO)}`).join("\n\n")));
  }
  out.push(el("otros:jornada", "Otros criterios", "Límites de jornada", Object.entries(LIMITES).map(([k, v]) => `${v.nombre}: ${v.diarias} horas diarias, ${v.semanales} semanales (${k})`).join("\n")));
  out.push(el("otros:checklist", "Otros criterios", "Los 16 criterios de la IGT", CRITERIOS.map((c) => `${c.id}. ${c.texto}`).join("\n")));
  out.push(el("otros:fechas", "Otros criterios", "Fechas legales anuales (bono 14 y aguinaldo)", fechasLegales("2026-01-01", 400).slice(0, 3).map((f) => `${f.titulo}: ${f.detalle}`).join("\n")));
  out.push(el("otros:sso", "Otros criterios", "Guía de seguridad y salud ocupacional", [...SSO_ITEMS.map((i) => `${i.texto}${i.ayuda ? ` (${i.ayuda})` : ""}`), `Fuentes: ${SSO_FUENTES.join("; ")}`, SSO_NOTA].join("\n")));
  out.push(el("otros:rerit", "Otros criterios", "Guía de presentación en línea (RERIT)", [...RERIT_PASOS, ...RERIT_DOCS.map((i) => i.texto), RERIT_NOTA].join("\n")));
  return out;
}

export function estadoValidacion(v: Validable, val: Validacion | undefined): EstadoValidacion {
  if (!val) return "sin_revisar";
  return val.huella === v.huella ? "validada" : "desactualizada";
}

export function resumenValidacion(vs: Validable[], validaciones: Validacion[]): { validadas: number; total: number; desactualizadas: number } {
  const mapa = new Map(validaciones.map((x) => [x.elemento_id, x]));
  let validadas = 0; let desactualizadas = 0;
  for (const v of vs) {
    const e = estadoValidacion(v, mapa.get(v.id));
    if (e === "validada") validadas++;
    if (e === "desactualizada") desactualizadas++;
  }
  return { validadas, total: vs.length, desactualizadas };
}

/** Crea el registro de validación para un elemento, con la huella del contenido que se leyó. */
export function validar(v: Validable, d: { por: string; colegiado: string; fecha: string; nota: string }): Omit<Validacion, "validada_en"> {
  return { elemento_id: v.id, huella: v.huella, validada_por: d.por.trim(), colegiado: d.colegiado.trim(), fecha_revision: d.fecha, nota: d.nota.trim() };
}
