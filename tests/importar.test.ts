import { describe, expect, it } from "vitest";
import { agregarSugeridas, analizarBrechas, asignacionAutomatica, clasificar, combinar, construirCapitulos, lineasANodos, segmentar, textoDeDocx } from "@/lib/importar";
import { generarDocxBuffer } from "@/lib/docx";
import { contexto, generarBorrador } from "@/lib/generador";
import { clausulasDe } from "@/content/plantillas";
import { ESTADO_INICIAL } from "@/lib/almacen";
import { CAPITULOS } from "@/content/capitulos";
import { revisarCapitulo } from "@/lib/revision";
import { textoPlano } from "@/lib/texto";
import { documento } from "@/lib/texto";

const empresa = { razon_social: "Comercial Prueba, S.A.", nombre_comercial: "La Tienda", nit: "1", representante_legal: "Ana López", departamento: "Guatemala" };
const base = { empresa, diagnostico: ESTADO_INICIAL.diagnostico, puestos: [] };
const ctx = contexto(base);

describe("importar un RIT existente", () => {
  it("ida y vuelta: un reglamento exportado a Word se importa en los mismos capítulos", async () => {
    const { capitulos } = generarBorrador(base);
    const buf = await generarDocxBuffer({ empresa, capitulos });
    const texto = await textoDeDocx(buf);
    const secciones = segmentar(texto);
    const asig = asignacionAutomatica(secciones);
    const importado = construirCapitulos(secciones, asig);

    // La portada (razón social y título) no pertenece a ningún capítulo.
    for (const c of CAPITULOS) {
      expect(importado[c.key], `falta el capítulo ${c.key}`).toBeTruthy();
      const r = revisarCapitulo(c.key, importado[c.key]);
      expect(r.cumple, `${c.key} no cumple: ${r.requisitos.filter((x) => !x.ok).map((x) => x.texto).join("; ")}`).toBe(true);
    }
    // El contenido conserva el texto original.
    expect(textoPlano(importado.mod_3)).toContain("jornada ordinaria de trabajo de la Empresa");
  });

  it("lee texto pegado sin formato y reconoce títulos en mayúsculas", () => {
    const secciones = segmentar("REGLAMENTO INTERIOR DE TRABAJO\nCAPÍTULO I DISPOSICIONES GENERALES\nEste reglamento se aplica a todos.\nCAPÍTULO II JORNADAS Y HORARIOS\nLa jornada diurna es de 8 horas.");
    // El título suelto «REGLAMENTO INTERIOR DE TRABAJO» no tiene texto debajo y se descarta.
    expect(secciones.map((s) => clasificar(s))).toEqual(["mod_1", "mod_3"]);
  });

  it("clasifica por el título y no inventa cuando no hay pistas", () => {
    expect(clasificar({ id: 0, titulo: "CAPÍTULO V: DE LAS VACACIONES Y LICENCIAS", lineas: ["texto"] })).toBe("mod_4");
    expect(clasificar({ id: 1, titulo: "Régimen disciplinario", lineas: ["Las faltas se sancionan"] })).toBe("mod_8");
    expect(clasificar({ id: 2, titulo: "Saludo del gerente", lineas: ["Bienvenidos a nuestra familia."] })).toBeNull();
  });

  it("convierte títulos de artículo en encabezados y viñetas en listas", () => {
    const n = lineasANodos(["Artículo 7. Puntualidad", "El trabajador llegará a tiempo y marcará su ingreso, lo cual es obligatorio.", "- Entrada", "- Salida"]);
    expect(n[0].type).toBe("heading");
    expect(n[1].type).toBe("paragraph");
    expect(n[2].type).toBe("bulletList");
    expect(n[2].content).toHaveLength(2);
  });

  it("rechaza archivos que no son Word", async () => {
    await expect(textoDeDocx(new TextEncoder().encode("esto no es un zip"))).rejects.toThrow(/Word/);
  });

  it("combina reemplazando o agregando al final", () => {
    const a = { mod_1: documento([{ type: "paragraph", content: [{ type: "text", text: "A" }] }]) };
    const b = { mod_1: documento([{ type: "paragraph", content: [{ type: "text", text: "B" }] }]), mod_2: documento([{ type: "paragraph", content: [{ type: "text", text: "C" }] }]) };
    expect(textoPlano(combinar(a, b, "reemplazar").mod_1)).toBe("B");
    expect(textoPlano(combinar(a, b, "agregar").mod_1)).toBe("A B");
    expect(textoPlano(combinar(a, b, "agregar").mod_2)).toBe("C");
  });
});

describe("brechas frente a lo que espera la IGT", () => {
  it("un reglamento completo no tiene brechas", () => {
    expect(analizarBrechas(generarBorrador(base).capitulos, ctx)).toEqual([]);
  });

  it("detecta lo que falta y sugiere cláusulas que lo resuelven", () => {
    const flojo = {
      ...generarBorrador(base).capitulos,
      mod_8: documento([{ type: "paragraph", content: [{ type: "text", text: "Quien incumpla este reglamento de trabajo será sancionado por la empresa según su criterio." }] }]),
    };
    const brechas = analizarBrechas(flojo, ctx);
    expect(brechas).toHaveLength(1);
    expect(brechas[0].capitulo).toBe("mod_8");
    expect(brechas[0].faltan.length).toBeGreaterThanOrEqual(4);
    expect(brechas[0].sugeridas.length).toBeGreaterThan(0);

    // Aplicar las sugeridas cierra la brecha.
    const extra = clausulasDe("mod_8").filter((c) => brechas[0].sugeridas.includes(c.id)).map((c) => c.texto(ctx)).join(" ");
    const arreglado = { ...flojo, mod_8: documento([{ type: "paragraph", content: [{ type: "text", text: `${textoPlano(flojo.mod_8)} ${extra}` }] }]) };
    expect(revisarCapitulo("mod_8", arreglado.mod_8).cumple).toBe(true);
  });

  it("un capítulo vacío se reporta con todos sus requisitos", () => {
    const sin = { ...generarBorrador(base).capitulos };
    delete sin.mod_9;
    const b = analizarBrechas(sin, ctx).find((x) => x.capitulo === "mod_9")!;
    expect(b.faltan.length).toBe(3);
  });

  it("agregarSugeridas numera a continuación del último artículo y cierra la brecha", () => {
    const flojo = {
      ...generarBorrador(base).capitulos,
      mod_8: documento([{ type: "paragraph", content: [{ type: "text", text: "Artículo 99. Quien incumpla será sancionado." }] }]),
    };
    const b = analizarBrechas(flojo, ctx)[0];
    const nuevo = agregarSugeridas(flojo, "mod_8", b.sugeridas, ctx);
    const encabezados = (nuevo.mod_8!.content ?? []).filter((n) => n.type === "heading").map((n) => n.content![0].text);
    expect(encabezados[0]).toMatch(/^Artículo \d+\./);
    expect(Number(encabezados[0]!.match(/\d+/)![0])).toBeGreaterThan(99);
    expect(revisarCapitulo("mod_8", nuevo.mod_8).requisitos.filter((r) => !r.ok).length).toBeLessThan(b.faltan.length);
  });
});
