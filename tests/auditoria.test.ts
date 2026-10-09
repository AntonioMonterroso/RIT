import { describe, expect, it } from "vitest";
import { auditar, textoPlano } from "@/lib/auditoria";
import { generarBorrador } from "@/lib/generador";
import { ESTADO_INICIAL } from "@/lib/almacen";
import { CAPITULOS } from "@/content/capitulos";

const doc = (t: string) => ({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: t }] }] });
const empresa = { ...ESTADO_INICIAL.empresa, razon_social: "Comercial Prueba, S.A.", representante_legal: "Ana López" };
const borrador = () => generarBorrador({ empresa, diagnostico: ESTADO_INICIAL.diagnostico, puestos: [] }).capitulos;

describe("auditoría IGT", () => {
  it("extrae texto plano", () => {
    expect(textoPlano(doc("hola"))).toBe("hola");
  });

  it("sin contenido ni documentos es rechazo", () => {
    const r = auditar({}, {});
    expect(r.porcentaje).toBe(0);
    expect(r.semaforo).toBe("rechazo");
    expect(r.total).toBe(16);
  });

  it("un texto corto que no cubre los requisitos no cuenta como capítulo cumplido", () => {
    const r = auditar({ mod_8: doc("Se sanciona a quien incumpla este reglamento de trabajo.") }, {});
    expect(r.automaticos.B7).toBe(false);
  });

  it("el borrador generado cumple todos los capítulos; con documentos manuales llega a 100%", () => {
    const manuales = { A1: true, A2: true, A4: true };
    const r = auditar(borrador(), manuales, { A3: true, D1: true, D2: true });
    expect(r.porcentaje).toBe(100);
    expect(r.semaforo).toBe("listo");
  });

  it("sin documentos manuales el borrador queda en riesgo, no listo", () => {
    const r = auditar(borrador(), {}, { A3: false, D1: true, D2: true });
    expect(r.marcados).toBe(12);
    expect(r.semaforo).toBe("riesgo");
  });

  it("los criterios externos se marcan solos", () => {
    const r = auditar({}, {}, { A3: true });
    expect(r.automaticos.A3).toBe(true);
    expect(r.marcados).toBe(1);
  });

  it("cubre los 10 capítulos", () => {
    expect(Object.keys(borrador())).toHaveLength(CAPITULOS.length);
  });
});
