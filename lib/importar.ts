import JSZip from "jszip";
import { CAPITULOS, type CapituloKey } from "@/content/capitulos";
import { clausulasDe, type Ctx } from "@/content/plantillas";
import { GUIA } from "@/content/guia";
import type { Nodo } from "@/lib/docx";
import { normalizar } from "@/lib/navegacion";
import { maxArticulo, type Capitulos } from "@/lib/numeracion";
import { clausulaANodos, documento, textoANodos } from "@/lib/texto";
import { revisarCapitulo } from "@/lib/revision";
import { textoPlano } from "@/lib/texto";

/* ───────── 1. Leer el archivo ───────── */

const ENTIDADES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'" };
const decodificar = (t: string) => t.replace(/&(amp|lt|gt|quot|apos);|&#(\d+);/g, (m, _n, num) => (num ? String.fromCharCode(Number(num)) : ENTIDADES[m]));

/** Extrae el texto de un .docx conservando párrafos y viñetas. */
export async function textoDeDocx(datos: ArrayBuffer | Uint8Array): Promise<string> {
  let zip: JSZip;
  try { zip = await JSZip.loadAsync(datos); } catch { throw new Error("El archivo no es un documento de Word (.docx) válido."); }
  const f = zip.file("word/document.xml");
  if (!f) throw new Error("El archivo no es un documento de Word (.docx) válido.");
  const xml = await f.async("string");
  const parrafos = xml.split(/<\/w:p>/).map((p) => {
    const t = [...p.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>|<w:br\/>/g)].map((m) => (m[1] === undefined ? " " : m[1])).join("");
    const texto = decodificar(t).replace(/\s+/g, " ").trim();
    return texto && /<w:numPr>/.test(p) ? `- ${texto}` : texto;
  }).filter(Boolean);
  return parrafos.join("\n");
}

/* ───────── 2. Dividir en secciones ───────── */

export interface Seccion { id: number; titulo: string; lineas: string[] }

const ENCABEZADO = /^(cap[ií]tulo|t[ií]tulo|anexo)\b/i;
const esMayusculas = (l: string) => l.length >= 8 && l.length <= 100 && l === l.toUpperCase() && /[A-ZÁÉÍÓÚÑ]{4}/.test(l) && !/[.;,]$/.test(l);

export function segmentar(texto: string): Seccion[] {
  const lineas = texto.replace(/\r/g, "").split("\n").map((l) => l.trim()).filter(Boolean);
  const secciones: Seccion[] = [];
  let actual: Seccion = { id: 0, titulo: "Inicio del documento", lineas: [] };
  for (const l of lineas) {
    if (ENCABEZADO.test(l) || esMayusculas(l)) {
      if (actual.lineas.length) secciones.push(actual);
      actual = { id: secciones.length + 1, titulo: l, lineas: [] };
    } else actual.lineas.push(l);
  }
  if (actual.lineas.length) secciones.push(actual);
  return secciones.map((s, i) => ({ ...s, id: i }));
}

/* ───────── 3. Clasificar en capítulos ───────── */

const CLAVES: Record<CapituloKey, string[]> = {
  mod_1: ["disposiciones generales", "ambito", "objeto", "generalidades", "aplicacion", "representacion patronal", "definiciones"],
  mod_2: ["ingreso", "contratacion", "periodo de prueba", "seleccion", "admision", "expediente", "contrato individual"],
  mod_3: ["jornada", "horario", "asistencia", "puntualidad", "horas extra", "extraordinari", "tolerancia"],
  mod_4: ["descanso", "vacaciones", "licencia", "asueto", "permisos", "feriados"],
  mod_5: ["salario", "pago", "remuneracion", "aguinaldo", "bono 14", "deduccion", "sueldo"],
  mod_6: ["derechos", "obligaciones", "prohibiciones", "deberes"],
  mod_7: ["higiene", "seguridad", "salud ocupacional", "prevencion de riesgos", "accidente", "proteccion personal", "sso"],
  mod_8: ["disciplin", "faltas", "sancion", "amonestacion", "despido", "debido proceso", "suspension"],
  mod_9: ["reclamo", "acoso", "vigencia", "divulgacion", "disposiciones finales", "reformas", "peticion"],
  mod_puestos: ["puestos", "funciones del puesto", "perfil de puesto", "manual de puestos", "responsabilidades del puesto"],
};

export function clasificar(s: Seccion): CapituloKey | null {
  const titulo = normalizar(s.titulo);
  const cuerpo = normalizar(s.lineas.slice(0, 6).join(" ")).slice(0, 600);
  let mejor: CapituloKey | null = null; let max = 0;
  for (const c of CAPITULOS) {
    let puntos = 0;
    for (const k of CLAVES[c.key]) { if (titulo.includes(k)) puntos += 6; if (cuerpo.includes(k)) puntos += 1; }
    if (puntos > max) { max = puntos; mejor = c.key; }
  }
  return max >= 3 ? mejor : null;
}

/* ───────── 4. Construir los capítulos ───────── */

const VINETA = /^(?:[-•–·*])\s+/;
const TITULO_ARTICULO = /^Art[ií]culo\s+\d+\s*[.:°º-]?\s+[^.;:]{2,70}$/i;

/** Convierte líneas de texto en nodos del editor: títulos de artículo, viñetas y párrafos. */
export function lineasANodos(lineas: string[]): Nodo[] {
  const out: Nodo[] = [];
  let lista: string[] = [];
  const cerrar = () => { if (lista.length) { out.push(...textoANodos(lista.map((l) => `- ${l}`).join("\n"))); lista = []; } };
  for (const l of lineas) {
    if (VINETA.test(l)) { lista.push(l.replace(VINETA, "")); continue; }
    cerrar();
    if (TITULO_ARTICULO.test(l)) out.push({ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: l }] });
    else out.push({ type: "paragraph", content: [{ type: "text", text: l }] });
  }
  cerrar();
  return out;
}

export type Asignacion = Record<number, CapituloKey | null>;

export function asignacionAutomatica(secciones: Seccion[]): Asignacion {
  return Object.fromEntries(secciones.map((s) => [s.id, clasificar(s)]));
}

export function construirCapitulos(secciones: Seccion[], asignacion: Asignacion): Capitulos {
  const porCapitulo: Partial<Record<CapituloKey, string[]>> = {};
  for (const s of secciones) {
    const k = asignacion[s.id];
    if (!k) continue;
    (porCapitulo[k] ??= []).push(...s.lineas);
  }
  const out: Capitulos = {};
  for (const c of CAPITULOS) { const l = porCapitulo[c.key]; if (l?.length) out[c.key] = documento(lineasANodos(l)); }
  return out;
}

/** Une el texto importado con el existente: «reemplazar» o «agregar» al final de cada capítulo. */
export function combinar(actual: Capitulos, importado: Capitulos, modo: "reemplazar" | "agregar"): Capitulos {
  const out: Capitulos = { ...actual };
  for (const c of CAPITULOS) {
    const nuevo = importado[c.key];
    if (!nuevo) continue;
    out[c.key] = modo === "agregar" && actual[c.key]?.content?.length ? documento([...(actual[c.key]!.content ?? []), ...(nuevo.content ?? [])]) : nuevo;
  }
  return out;
}

/* ───────── 5. Brechas frente a lo que espera la IGT ───────── */

export interface Brecha { capitulo: CapituloKey; faltan: string[]; sugeridas: string[] }

/** Para cada requisito sin cubrir, busca una cláusula de la biblioteca que lo resuelva. */
export function analizarBrechas(capitulos: Capitulos, ctx: Ctx): Brecha[] {
  const out: Brecha[] = [];
  for (const c of CAPITULOS) {
    const texto = textoPlano(capitulos[c.key]);
    const r = revisarCapitulo(c.key, capitulos[c.key]);
    if (r.cumple) continue;
    const faltan = r.requisitos.filter((x) => !x.ok);
    const sugeridas = new Set<string>();
    for (const f of faltan) {
      const patron = new RegExp(GUIA[c.key].requisitos.find((q) => q.texto === f.texto)!.patron, "i");
      const clausula = clausulasDe(c.key).find((cl) => patron.test(cl.texto(ctx)) && !texto.includes(cl.titulo));
      if (clausula) sugeridas.add(clausula.id);
    }
    out.push({ capitulo: c.key, faltan: faltan.map((x) => x.texto), sugeridas: [...sugeridas] });
  }
  return out;
}

/** Agrega al final de un capítulo las cláusulas sugeridas, numeradas a continuación del último artículo. */
export function agregarSugeridas(capitulos: Capitulos, key: CapituloKey, ids: string[], ctx: Ctx): Capitulos {
  let n = maxArticulo(capitulos);
  const nodos: Nodo[] = [];
  for (const cl of clausulasDe(key).filter((c) => ids.includes(c.id))) nodos.push(...clausulaANodos(cl.titulo, cl.texto(ctx), ++n));
  if (!nodos.length) return capitulos;
  return { ...capitulos, [key]: documento([...(capitulos[key]?.content ?? []), ...nodos]) };
}
