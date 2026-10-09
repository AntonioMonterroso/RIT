import { describe, expect, it } from "vitest";
import { exportarRespaldo, importarRespaldo } from "@/lib/respaldo";
import { ESTADO_INICIAL } from "@/lib/almacen";
import { generarBorrador } from "@/lib/generador";

describe("respaldo", () => {
  it("exporta e importa sin perder datos", () => {
    const empresa = { ...ESTADO_INICIAL.empresa, razon_social: "X, S.A." };
    const e = { ...ESTADO_INICIAL, empresa, capitulos: generarBorrador({ empresa, diagnostico: ESTADO_INICIAL.diagnostico, puestos: [] }).capitulos };
    const r = importarRespaldo(exportarRespaldo(e));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.estado).toEqual(e);
  });

  it("completa con valores por defecto un respaldo parcial", () => {
    const r = importarRespaldo(JSON.stringify({ app: "rit-guatemala", version: 1, estado: { empresa: { razon_social: "Y" } } }));
    expect(r.ok).toBe(true);
    if (r.ok) { expect(r.estado.empresa.departamento).toBe("Guatemala"); expect(r.estado.puestos).toEqual([]); }
  });

  it("rechaza archivos ajenos, inválidos o de versión futura", () => {
    expect(importarRespaldo("no es json").ok).toBe(false);
    expect(importarRespaldo(JSON.stringify({ hola: 1 })).ok).toBe(false);
    expect(importarRespaldo(JSON.stringify({ app: "rit-guatemala", version: 99, estado: {} })).ok).toBe(false);
  });
});
