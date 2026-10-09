import { describe, expect, it } from "vitest";
import { eliminarVersion, guardarVersion, MAX_VERSIONES, restaurarVersion, resumenVersion } from "@/lib/versiones";
import { ESTADO_INICIAL } from "@/lib/almacen";
import { generarBorrador } from "@/lib/generador";

const empresa = { ...ESTADO_INICIAL.empresa, razon_social: "X, S.A.", representante_legal: "Ana" };
const con = (extra = {}) => ({ ...ESTADO_INICIAL, empresa, capitulos: generarBorrador({ empresa, diagnostico: ESTADO_INICIAL.diagnostico, puestos: [] }).capitulos, ...extra });
const otroTexto = { mod_1: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Texto distinto" }] }] } };

describe("versiones", () => {
  it("no guarda nada si todavía no hay texto", () => {
    expect(guardarVersion(ESTADO_INICIAL, "vacía").versiones).toHaveLength(0);
  });

  it("guarda una copia con etiqueta y fecha, la más reciente primero", () => {
    let e = guardarVersion(con(), "Primera", new Date("2026-10-09T10:00:00Z"));
    e = guardarVersion(e, "Segunda", new Date("2026-10-10T10:00:00Z"));
    expect(e.versiones.map((v) => v.etiqueta)).toEqual(["Segunda", "Primera"]);
    expect(e.versiones[1].fecha).toBe("2026-10-09T10:00:00.000Z");
  });

  it("conserva solo las más recientes", () => {
    let e = con();
    for (let i = 0; i < MAX_VERSIONES + 3; i++) e = guardarVersion(e, `v${i}`);
    expect(e.versiones).toHaveLength(MAX_VERSIONES);
    expect(e.versiones[0].etiqueta).toBe(`v${MAX_VERSIONES + 2}`);
  });

  it("restaurar vuelve al texto guardado y respalda el actual antes", () => {
    let e = guardarVersion(con(), "Buena");
    e = { ...e, capitulos: otroTexto };
    const r = restaurarVersion(e, e.versiones[0].id);
    expect(r.capitulos).toEqual(con().capitulos);
    expect(r.versiones[0].etiqueta).toBe("Antes de restaurar «Buena»");
    expect(r.versiones[0].capitulos).toEqual(otroTexto);
  });

  it("restaurar una versión inexistente no cambia nada", () => {
    const e = con();
    expect(restaurarVersion(e, "no-existe")).toBe(e);
  });

  it("elimina una versión y resume artículos y palabras", () => {
    const e = guardarVersion(con(), "Una");
    const r = resumenVersion(e.versiones[0]);
    expect(r.articulos).toBeGreaterThan(40);
    expect(r.palabras).toBeGreaterThan(3000);
    expect(eliminarVersion(e, e.versiones[0].id).versiones).toHaveLength(0);
  });
});
