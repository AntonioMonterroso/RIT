import { describe, expect, it } from "vitest";
import { auditar, textoPlano } from "@/lib/auditoria";
import { CAPITULOS } from "@/content/capitulos";

const doc = (t: string) => ({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: t }] }] });

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

  it("con todo completo es listo", () => {
    const caps = Object.fromEntries(CAPITULOS.map((c) => [c.key, doc(c.estandar)]));
    const manuales = { A1: true, A2: true, A3: true, A4: true, D1: true, D2: true };
    const r = auditar(caps, manuales);
    expect(r.porcentaje).toBe(100);
    expect(r.semaforo).toBe("listo");
  });

  it("solo capítulos, sin documentos, da riesgo", () => {
    const caps = Object.fromEntries(CAPITULOS.map((c) => [c.key, doc(c.estandar)]));
    const r = auditar(caps, {});
    expect(r.marcados).toBe(10);
    expect(r.semaforo).toBe("rechazo");
  });
});
