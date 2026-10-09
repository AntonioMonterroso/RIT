import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { FORMATOS, generarFormatoBuffer } from "@/lib/formatos";
import { ESTADO_INICIAL } from "@/lib/almacen";

const texto = async (b: Buffer) => (await (await JSZip.loadAsync(b)).file("word/document.xml")!.async("string")).replace(/<[^>]+>/g, " ");
const e = {
  ...ESTADO_INICIAL,
  empresa: { ...ESTADO_INICIAL.empresa, razon_social: "Comercial Prueba, S.A.", representante_legal: "Ana López", departamento: "Guatemala" },
  publicacion: { fecha: "2026-10-09", medio: "ambos" as const },
  tramite: { ...ESTADO_INICIAL.tramite, expediente: "123-2026" },
  aprobaciones: [{ id: "a1", etiqueta: "v1", huella: "a".repeat(64), nombre: "Ana López", cargo: "Gerente", nota: "", fecha: "2026-10-09T10:00:00Z" }],
};

describe("formatos descargables", () => {
  it("hay cinco formatos con id único", () => {
    expect(FORMATOS).toHaveLength(5);
    expect(new Set(FORMATOS.map((f) => f.id)).size).toBe(5);
  });

  it("todos generan un .docx con los datos de la empresa", async () => {
    for (const f of FORMATOS) {
      const buf = await generarFormatoBuffer(f, e);
      expect(buf.subarray(0, 2).toString()).toBe("PK");
      const t = await texto(buf);
      expect(t).toContain(f.id === "reforma" ? "Comercial Prueba, S.A." : "COMERCIAL PRUEBA, S.A.".slice(0, 10).toUpperCase());
      if (f.id !== "constancia") expect(t).toContain("Ana López"); // la hoja de firmas no lleva representante
    }
  });

  it("la constancia calcula la vigencia a 15 días y el acta cita el expediente", async () => {
    const constancia = await texto(await generarFormatoBuffer(FORMATOS.find((f) => f.id === "constancia")!, e));
    expect(constancia).toContain("24 de octubre de 2026");
    const acta = await texto(await generarFormatoBuffer(FORMATOS.find((f) => f.id === "acta")!, e));
    expect(acta).toContain("123-2026");
    expect(acta).toContain("9 de octubre de 2026");
  });

  it("deja marcadores si faltan datos", async () => {
    const t = await texto(await generarFormatoBuffer(FORMATOS[1], ESTADO_INICIAL));
    expect(t).toContain("[COMPLETAR: razón social]");
  });
});
