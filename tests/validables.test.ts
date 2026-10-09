import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { estadoValidacion, resumenValidacion, validables, validar } from "@/lib/validables";
import { paqueteRevisionLegal } from "@/lib/paqueteLegal";
import { Packer } from "docx";

describe("validación legal del contenido", () => {
  const todos = validables();
  it("las piezas tienen id único, contenido y huella SHA-256", () => {
    expect(new Set(todos.map((v) => v.id)).size).toBe(todos.length);
    for (const v of todos) { expect(v.contenido.length).toBeGreaterThan(10); expect(v.huella).toMatch(/^[0-9a-f]{64}$/); }
    expect(todos.some((v) => v.id === "norma:vacaciones")).toBe(true);
    expect(todos.some((v) => v.id === "clausulas:mod_4")).toBe(true);
    expect(todos.some((v) => v.id === "guia:mod_puestos")).toBe(true);
    expect(todos.some((v) => v.id === "otros:sso")).toBe(true);
    expect(todos.some((v) => v.id === "otros:rerit")).toBe(true);
  });
  it("el contenido es estable entre llamadas", () => {
    expect(validables().map((v) => v.huella)).toEqual(todos.map((v) => v.huella));
  });
  it("validar y detectar que el contenido cambió después", () => {
    const v = todos[0];
    const val = { ...validar(v, { por: " Lic. Ana ", colegiado: "123", fecha: "2026-10-09", nota: "" }), validada_en: "x" };
    expect(val.validada_por).toBe("Lic. Ana");
    expect(estadoValidacion(v, undefined)).toBe("sin_revisar");
    expect(estadoValidacion(v, val)).toBe("validada");
    expect(estadoValidacion(v, { ...val, huella: "0".repeat(64) })).toBe("desactualizada");
    expect(resumenValidacion(todos, [val])).toEqual({ validadas: 1, total: todos.length, desactualizadas: 0 });
    expect(resumenValidacion(todos, [{ ...val, huella: "0".repeat(64) }]).desactualizadas).toBe(1);
  });
  it("el paquete para el abogado es un .docx con todo el contenido", async () => {
    const buf = await Packer.toBuffer(paqueteRevisionLegal([]));
    const xml = (await (await JSZip.loadAsync(buf)).file("word/document.xml")!.async("string")).replace(/<[^>]+>/g, " ");
    expect(xml).toContain("PAQUETE DE REVISIÓN LEGAL");
    expect(xml).toContain("Vacaciones");
    expect(xml).toContain("Observaciones del abogado");
  });
});
