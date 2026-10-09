import { CAPITULOS, type CapituloKey } from "@/content/capitulos";
import { CLAUSULAS, clausulasDe, falta, type Clausula, type Ctx } from "@/content/plantillas";
import type { EstadoRit } from "@/lib/almacen";
import type { Nodo } from "@/lib/docx";
import { clasificarJornada } from "@/lib/jornada";
import { renumerar, type Capitulos } from "@/lib/numeracion";
import { clausulaANodos, documento, textoANodos } from "@/lib/texto";
import type { Puesto } from "@/lib/tipos";

type Base = Pick<EstadoRit, "empresa" | "diagnostico">;

export function contexto(e: Base): Ctx {
  return {
    empresa: e.empresa.razon_social || e.empresa.nombre_comercial,
    comercial: e.empresa.nombre_comercial,
    representante: e.empresa.representante_legal,
    departamento: e.empresa.departamento,
    d: e.diagnostico,
    tipo: clasificarJornada(e.diagnostico.entrada, e.diagnostico.salida),
  };
}

export const clausulasAutomaticas = (e: Base): Clausula[] => CLAUSULAS.filter((c) => c.auto(e.diagnostico));

/** Bloque del anexo con los puestos definidos por la empresa. */
export function bloquePuestos(puestos: Puesto[]): Nodo[] {
  if (!puestos.length) {
    return textoANodos("[COMPLETAR: defina los puestos clave de la empresa en la sección Puestos]");
  }
  const out: Nodo[] = [];
  for (const p of puestos) {
    out.push({ type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: `Puesto: ${p.nombre || "[COMPLETAR: nombre del puesto]"}` }] });
    out.push(...textoANodos(`Jefe inmediato: ${falta(p.jefe, "jefe inmediato")}.`));
    const resp = p.responsabilidades.filter((r) => r.trim());
    out.push(...textoANodos(resp.length ? `Responsabilidades críticas:\n\n${resp.map((r) => `- ${r.trim()}`).join("\n")}` : "Responsabilidades críticas: [COMPLETAR: 3 a 5 responsabilidades]"));
    out.push(...textoANodos(`Bienes, fondos o equipos en custodia: ${p.activos.trim() || "ninguno"}.`));
  }
  return out;
}

/** Reconstruye el anexo de puestos: cláusula marco + puestos + respaldo del art. 77 a). */
export function generarAnexoPuestos(e: Base & Pick<EstadoRit, "puestos">): Nodo {
  const ctx = contexto(e);
  const marco = clausulasDe("mod_puestos");
  const pieza = (id: string) => marco.find((c) => c.id === id)!;
  return documento([
    ...clausulaANodos(pieza("cp_marco").titulo, pieza("cp_marco").texto(ctx)),
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Artículo X. Puestos y responsabilidades" }] },
    ...bloquePuestos(e.puestos),
    ...clausulaANodos(pieza("cp_77a").titulo, pieza("cp_77a").texto(ctx)),
  ]);
}

/** Genera el borrador completo del RIT con las cláusulas que corresponden al diagnóstico. */
export function generarBorrador(e: Base & Pick<EstadoRit, "puestos">): { capitulos: Capitulos; articulos: number } {
  const ctx = contexto(e);
  const crudo: Capitulos = {};
  for (const cap of CAPITULOS) {
    if (cap.key === "mod_puestos") { crudo[cap.key] = generarAnexoPuestos(e); continue; }
    const seleccion = clausulasAutomaticas(e).filter((c) => c.capitulo === cap.key);
    crudo[cap.key] = documento(seleccion.flatMap((c) => clausulaANodos(c.titulo, c.texto(ctx))));
  }
  const { capitulos, total } = renumerar(crudo);
  return { capitulos, articulos: total };
}

/** Nodos de una sola cláusula para insertarla en el editor. */
export function nodosDeClausula(c: Clausula, e: Base): Nodo[] {
  return clausulaANodos(c.titulo, c.texto(contexto(e)));
}

export const hayCapitulo = (c: Capitulos, k: CapituloKey) => !!c[k]?.content?.length;

/** Regenera un solo capítulo con las cláusulas automáticas del diagnóstico. No renumera. */
export function generarCapitulo(key: CapituloKey, e: Base & Pick<EstadoRit, "puestos">): Nodo {
  if (key === "mod_puestos") return generarAnexoPuestos(e);
  const ctx = contexto(e);
  return documento(clausulasAutomaticas(e).filter((c) => c.capitulo === key).flatMap((c) => clausulaANodos(c.titulo, c.texto(ctx))));
}
