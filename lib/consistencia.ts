import { CAPITULOS, type CapituloKey } from "@/content/capitulos";
import type { EstadoRit } from "@/lib/almacen";
import { normalizar } from "@/lib/navegacion";
import { textoPlano } from "@/lib/texto";

export interface Inconsistencia {
  id: string;
  capitulo: CapituloKey | null;
  mensaje: string;
}

const EXTERNA = /C[oó]digo|Decreto|Ley\b|Constituci[oó]n|Acuerdo|Reglamento\s+(?:de|General)|Convenio/i;

/** Números de artículo que tienen encabezado «Artículo N.» en el reglamento, en orden de aparición. */
function encabezados(e: EstadoRit): number[] {
  const out: number[] = [];
  for (const c of CAPITULOS) {
    for (const n of e.capitulos[c.key]?.content ?? []) {
      const m = (n.content?.[0]?.text ?? "").match(/^Art[ií]culo\s+(\d+)\./i);
      if (m) out.push(Number(m[1]));
    }
  }
  return out;
}

/** Revisa que las partes del reglamento digan lo mismo que el diagnóstico y entre sí. */
export function consistencia(e: EstadoRit): Inconsistencia[] {
  const out: Inconsistencia[] = [];
  const d = e.diagnostico;
  const t = (k: CapituloKey) => normalizar(textoPlano(e.capitulos[k]));
  const todo = CAPITULOS.map((c) => t(c.key)).join(" ");
  const hayTexto = todo.trim().length > 0;
  if (!hayTexto) return out;

  // 1. Numeración: correlativa, sin saltos ni repetidos.
  const nums = encabezados(e);
  const repetidos = nums.filter((n, i) => nums.indexOf(n) !== i);
  if (repetidos.length) out.push({ id: "num-repetidos", capitulo: null, mensaje: `Hay artículos con el mismo número (${[...new Set(repetidos)].join(", ")}). Use «Renumerar artículos» en el editor.` });
  else if (nums.some((n, i) => n !== i + 1)) out.push({ id: "num-saltos", capitulo: null, mensaje: "La numeración de artículos no es correlativa. Use «Renumerar artículos» en el editor." });

  // 2. Referencias internas a artículos que no existen.
  const existentes = new Set(nums);
  const faltantes = new Set<number>();
  for (const c of CAPITULOS) {
    const texto = textoPlano(e.capitulos[c.key]);
    for (const m of texto.matchAll(/art[ií]culos?\s+(\d{1,3})(?![\d.]*\.\s)/gi)) {
      const despues = texto.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 60);
      const antes = texto.slice(Math.max(0, (m.index ?? 0) - 25), m.index ?? 0);
      if (EXTERNA.test(despues) || /\bdel?\s+C[oó]digo/i.test(antes)) continue;
      if (/^Art[ií]culo\s+\d+\./i.test(texto.slice(m.index ?? 0, (m.index ?? 0) + 14)) && (m.index ?? 0) < 2) continue;
      if (!existentes.has(Number(m[1])) && /de este reglamento|del presente reglamento|anterior|siguiente|precedente/i.test(despues + antes)) faltantes.add(Number(m[1]));
    }
  }
  if (faltantes.size) out.push({ id: "ref-inexistente", capitulo: null, mensaje: `El texto remite a artículo(s) de este reglamento que no existen: ${[...faltantes].join(", ")}.` });

  // 3. Horario del diagnóstico frente al capítulo de jornada.
  if (d.completo && t("mod_3").length > 0) {
    const horas = [...textoPlano(e.capitulos.mod_3).matchAll(/de las (\d{1,2}:\d{2}) a las (\d{1,2}:\d{2}) horas/g)];
    if (horas.length > 0 && !horas.some((m) => m[1] === d.entrada && m[2] === d.salida)) {
      out.push({ id: "horario", capitulo: "mod_3", mensaje: `El horario del diagnóstico (${d.entrada} a ${d.salida}) no coincide con el escrito en el capítulo de jornada. Corrija uno de los dos.` });
    }
    if (horas.length === 0 && !/horario/.test(t("mod_3"))) out.push({ id: "horario-falta", capitulo: "mod_3", mensaje: "El capítulo de jornada no indica el horario de trabajo." });
  }

  // 4. Lo que declaró en el diagnóstico debe estar regulado en el texto.
  const exige: [boolean, RegExp, string, CapituloKey | null][] = [
    [d.teletrabajo, /teletrabajo|trabajo a distancia|trabajo remoto/, "Declaró teletrabajo, pero ningún capítulo lo regula.", "mod_3"],
    [d.turnos, /turno/, "Declaró turnos, pero ningún capítulo los regula.", "mod_3"],
    [d.manejaEfectivo, /efectivo|fondos|caja|arqueo/, "Declaró manejo de efectivo o fondos, pero ningún capítulo lo regula.", "mod_6"],
    [d.usaVehiculos, /vehiculo/, "Declaró uso de vehículos, pero ningún capítulo lo regula.", "mod_6"],
    [d.uniforme, /uniforme/, "Declaró uniforme, pero ningún capítulo lo regula.", "mod_6"],
    [d.epp, /equipo de proteccion|epp/, "Declaró equipo de protección, pero ningún capítulo lo regula.", "mod_7"],
  ];
  if (d.completo) for (const [activo, patron, mensaje, capitulo] of exige) if (activo && !patron.test(todo)) out.push({ id: `diag-${patron.source.slice(0, 8)}`, capitulo, mensaje });

  // 5. Datos de la empresa y puestos.
  const razon = normalizar(e.empresa.razon_social || e.empresa.nombre_comercial).trim();
  if (razon && !t("mod_1").includes(razon)) out.push({ id: "razon-social", capitulo: "mod_1", mensaje: "La razón social de la empresa no aparece en el capítulo I." });
  const anexo = t("mod_puestos");
  if (anexo.length > 0) {
    for (const p of e.puestos) if (p.nombre.trim() && !anexo.includes(normalizar(p.nombre).trim())) out.push({ id: `puesto-${p.id}`, capitulo: "mod_puestos", mensaje: `El puesto «${p.nombre}» no aparece en el anexo de puestos. Regenere el anexo.` });
  }
  return out;
}
