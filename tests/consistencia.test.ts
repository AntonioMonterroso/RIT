import { describe, expect, it } from "vitest";
import { consistencia } from "@/lib/consistencia";
import { fechasLegales } from "@/lib/fechasLegales";
import { generarBorrador } from "@/lib/generador";
import { ESTADO_INICIAL, type EstadoRit } from "@/lib/almacen";
import { GIROS, type Giro } from "@/lib/tipos";
import { clausulaANodos, documento } from "@/lib/texto";
import { renumerar } from "@/lib/numeracion";

const empresa = { ...ESTADO_INICIAL.empresa, razon_social: "Comercial Prueba, S.A." };
const base = (giro: Giro = "comercio", extra = {}): EstadoRit => {
  const diagnostico = { ...ESTADO_INICIAL.diagnostico, completo: true, giro, ...extra };
  const puestos = [{ id: "p1", nombre: "Cajero", jefe: "Gerente", responsabilidades: ["Cobrar", "Cuadrar caja", "Atender"], activos: "Fondo de caja" }];
  const { capitulos } = generarBorrador({ empresa, diagnostico, puestos });
  return { ...ESTADO_INICIAL, empresa, diagnostico, puestos, capitulos: renumerar(capitulos).capitulos };
};

describe("consistencia interna", () => {
  for (const g of GIROS) {
    it(`el borrador de ${g.id} es consistente consigo mismo y con el diagnóstico`, () => {
      const e = base(g.id, { teletrabajo: true, turnos: true, manejaEfectivo: true, usaVehiculos: true, uniforme: true, epp: true });
      expect(consistencia(e)).toEqual([]);
    });
  }
  it("detecta un horario que ya no coincide con el diagnóstico", () => {
    const e = base();
    const cambiado = { ...e, diagnostico: { ...e.diagnostico, entrada: "07:00", salida: "16:00" } };
    expect(consistencia(cambiado).map((x) => x.id)).toContain("horario");
  });
  it("detecta numeración repetida o con saltos", () => {
    const e = base();
    const dup = { ...e, capitulos: { ...e.capitulos, mod_2: documento([...clausulaANodos("Repetido", "x", 1), ...(e.capitulos.mod_2?.content ?? [])]) } };
    expect(consistencia(dup).map((x) => x.id)).toContain("num-repetidos");
    const salto = { ...e, capitulos: { mod_1: documento([...clausulaANodos("A", "x", 1), ...clausulaANodos("B", "x", 3)]) } };
    expect(consistencia(salto).map((x) => x.id)).toContain("num-saltos");
  });
  it("detecta remisiones a artículos inexistentes pero no a los del Código de Trabajo", () => {
    const mal = { ...ESTADO_INICIAL, capitulos: { mod_1: documento([...clausulaANodos("A", "Se aplica lo dispuesto en el artículo 99 de este reglamento.", 1)]) } };
    expect(consistencia(mal).map((x) => x.id)).toContain("ref-inexistente");
    const bien = { ...ESTADO_INICIAL, capitulos: { mod_1: documento([...clausulaANodos("A", "Conforme al artículo 77 del Código de Trabajo y al artículo 1 de este reglamento.", 1)]) } };
    expect(consistencia(bien).map((x) => x.id)).not.toContain("ref-inexistente");
  });
  it("detecta lo declarado en el diagnóstico que el texto no regula, y puestos fuera del anexo", () => {
    const e = base();
    const sinTele = { ...e, diagnostico: { ...e.diagnostico, teletrabajo: true } };
    expect(consistencia(sinTele).some((x) => /teletrabajo/.test(x.mensaje))).toBe(true);
    const nuevo = { ...e, puestos: [...e.puestos, { id: "p2", nombre: "Bodeguero", jefe: "", responsabilidades: [], activos: "" }] };
    expect(consistencia(nuevo).some((x) => x.id === "puesto-p2")).toBe(true);
  });
  it("no opina si el reglamento está vacío", () => {
    expect(consistencia(ESTADO_INICIAL)).toEqual([]);
  });
});

describe("fechas legales anuales", () => {
  it("devuelve las próximas ocurrencias en orden y sin fechas pasadas", () => {
    const f = fechasLegales("2026-10-09");
    expect(f.map((x) => x.fecha)).toEqual(["2026-12-15", "2027-01-15", "2027-07-15"]);
    expect(f.every((x) => /confirm/i.test(x.detalle))).toBe(true);
  });
  it("cruza de año y no repite", () => {
    const f = fechasLegales("2026-12-20");
    expect(f[0].fecha).toBe("2027-01-15");
    expect(new Set(f.map((x) => x.clave)).size).toBe(f.length);
  });
});
