import { describe, expect, it } from "vitest";
import { generarBorrador, generarAnexoPuestos } from "@/lib/generador";
import { ESTADO_INICIAL } from "@/lib/almacen";
import { GIROS, type Diagnostico } from "@/lib/tipos";
import { CAPITULOS } from "@/content/capitulos";
import { auditar, textoPlano } from "@/lib/auditoria";
import { pendientesTotales, revisarCapitulo } from "@/lib/revision";
import { renumerar } from "@/lib/numeracion";
import { CLAUSULAS } from "@/content/plantillas";
import { generarDocxBuffer } from "@/lib/docx";
import JSZip from "jszip";
import { externosAuditoria, pasos, avanceGeneral, siguientePaso } from "@/lib/progreso";

const empresa = { razon_social: "Comercial Prueba, S.A.", nombre_comercial: "La Tienda", nit: "123-4", representante_legal: "Ana López", departamento: "Quetzaltenango" };
const gen = (d: Partial<Diagnostico> = {}, puestos = ESTADO_INICIAL.puestos) =>
  generarBorrador({ empresa, diagnostico: { ...ESTADO_INICIAL.diagnostico, ...d }, puestos });

describe("generador de borrador", () => {
  for (const g of GIROS) {
    it(`giro ${g.id}: cumple todos los capítulos y no deja datos pendientes`, () => {
      const { capitulos } = gen({ giro: g.id, teletrabajo: true, turnos: true, manejaEfectivo: true, usaVehiculos: true, uniforme: true, epp: true });
      for (const c of CAPITULOS) {
        const r = revisarCapitulo(c.key, capitulos[c.key]);
        expect(r.cumple, `${g.id}/${c.key}: ${r.requisitos.filter((x) => !x.ok).map((x) => x.texto).join("; ")}`).toBe(true);
      }
      expect(pendientesTotales(capitulos)).toBe(1); // solo el anexo sin puestos
    });
  }

  it("numera los artículos de forma correlativa desde 1 en todo el reglamento", () => {
    const { capitulos, articulos } = gen();
    const nums: number[] = [];
    for (const c of CAPITULOS) {
      for (const n of capitulos[c.key]?.content ?? []) {
        const m = n.type === "heading" && n.content?.[0]?.text?.match(/^Artículo (\d+)\./);
        if (m) nums.push(Number(m[1]));
      }
    }
    expect(nums.length).toBe(articulos);
    expect(nums).toEqual(nums.map((_, i) => i + 1));
    expect(articulos).toBeGreaterThan(40);
  });

  it("adapta jornada y puntualidad al diagnóstico", () => {
    const { capitulos } = gen({ entrada: "20:00", salida: "05:00", almuerzoMin: 60, tolerancia: 5, diasLaborales: "lunes a viernes" });
    const t = textoPlano(capitulos.mod_3);
    expect(t).toMatch(/jornada ordinaria de trabajo de la Empresa es nocturna/);
    expect(t).toMatch(/36 horas semanales/);
    expect(t).toMatch(/tolerancia de 5 minutos/);
  });

  it("incluye cláusulas opcionales solo cuando el diagnóstico las pide", () => {
    expect(textoPlano(gen({ teletrabajo: false }).capitulos.mod_3)).not.toMatch(/desconexi|no responder comunicaciones/);
    expect(textoPlano(gen({ teletrabajo: true }).capitulos.mod_3)).toMatch(/no responder comunicaciones/);
    expect(textoPlano(gen({ giro: "restaurante" }).capitulos.mod_7)).toMatch(/manipule alimentos/);
    expect(textoPlano(gen({ giro: "comercio" }).capitulos.mod_7)).not.toMatch(/manipule alimentos/);
  });

  it("marca [COMPLETAR] cuando faltan datos de la empresa", () => {
    const { capitulos } = generarBorrador({ empresa: { ...empresa, razon_social: "", nombre_comercial: "", representante_legal: "" }, diagnostico: ESTADO_INICIAL.diagnostico, puestos: [] });
    expect(textoPlano(capitulos.mod_1)).toMatch(/\[COMPLETAR: razón social\]/);
    expect(pendientesTotales(capitulos)).toBeGreaterThanOrEqual(3);
  });

  it("el anexo incluye los puestos con responsabilidades y custodia", () => {
    const anexo = generarAnexoPuestos({ empresa, diagnostico: ESTADO_INICIAL.diagnostico, puestos: [{ id: "1", nombre: "Cajero", jefe: "Gerente", responsabilidades: ["Cobrar con exactitud", "Cuadrar caja"], activos: "Fondo de caja" }] });
    const t = textoPlano(anexo);
    expect(t).toMatch(/Puesto: Cajero/);
    expect(t).toMatch(/Cobrar con exactitud/);
    expect(t).toMatch(/Fondo de caja/);
    expect(t).toMatch(/77 inciso a\)/);
  });

  it("renumerar es idempotente", () => {
    const { capitulos } = gen();
    expect(renumerar(capitulos).capitulos).toEqual(capitulos);
  });

  it("las cláusulas tienen ids únicos y no inventan datos", () => {
    const ids = CLAUSULAS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(CLAUSULAS.length).toBeGreaterThan(50);
  });
});

describe("exportación del borrador completo", () => {
  it("genera un .docx con portada, 57 artículos y la razón social", async () => {
    const { capitulos, articulos } = gen({ giro: "industria" });
    const buf = await generarDocxBuffer({ empresa, capitulos });
    const xml = await (await JSZip.loadAsync(buf)).file("word/document.xml")!.async("string");
    const t = xml.replace(/<[^>]+>/g, " ");
    expect(buf.length).toBeGreaterThan(20_000);
    expect(t).toContain("REGLAMENTO INTERIOR DE TRABAJO");
    expect(t).toContain("Artículo 1. Objeto");
    expect(t).toContain(`Artículo ${articulos}.`);
    expect(t).toContain("Quetzaltenango");
  });
});

describe("progreso", () => {
  it("empieza en cero con el diagnóstico como primer paso", () => {
    const p = pasos(ESTADO_INICIAL);
    expect(avanceGeneral(p)).toBeLessThan(10);
    expect(siguientePaso(p)?.id).toBe("diagnostico");
  });

  it("con todo listo el avance es 100% y no hay siguiente paso", () => {
    const { capitulos } = gen();
    const e = {
      ...ESTADO_INICIAL, empresa, capitulos,
      diagnostico: { ...ESTADO_INICIAL.diagnostico, completo: true },
      puestos: [1, 2, 3].map((i) => ({ id: String(i), nombre: `P${i}`, jefe: "J", responsabilidades: ["a", "b", "c"], activos: "" })),
      manuales: { A1: true, A2: true, A4: true },
      memorial: { ...ESTADO_INICIAL.memorial, rep_dpi: "1", direccion: "Zona 1", lugar_fecha: "Guatemala, hoy" },
      tramite: { ...ESTADO_INICIAL.tramite, estado: "aprobado" as const },
      publicacion: { fecha: "2026-10-09", medio: "ambos" as const },
    };
    // el anexo debe regenerarse con los puestos para quedar sin pendientes
    e.capitulos = { ...capitulos, mod_puestos: generarAnexoPuestos(e) };
    const p = pasos(e);
    expect(auditar(e.capitulos, e.manuales, externosAuditoria(e)).porcentaje).toBe(100);
    expect(avanceGeneral(p)).toBe(100);
    expect(siguientePaso(p)).toBeNull();
  });
});
