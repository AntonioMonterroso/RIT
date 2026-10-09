import { describe, expect, it } from "vitest";
import { generarMemorialBuffer, MEMORIAL_INICIAL } from "@/lib/memorial";
import JSZip from "jszip";

async function texto(buf: Buffer) {
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file("word/document.xml")!.async("string");
  return xml.replace(/<[^>]+>/g, "");
}

describe("memorial IGT", () => {
  it("incluye los datos de la empresa y del representante", async () => {
    const t = await texto(await generarMemorialBuffer({
      ...MEMORIAL_INICIAL,
      rep_nombre: "Ana López", razon_social: "Comercial Prueba, S.A.", nombre_comercial: "La Tienda",
      rep_dpi: "1234 56789 0101", lugar_fecha: "Guatemala, 9 de octubre de 2026",
    }));
    for (const s of ["Ana López", "Comercial Prueba, S.A.", "La Tienda", "1234 56789 0101", "9 de octubre de 2026", "PETICIÓN", "APROBADO"]) {
      expect(t).toContain(s);
    }
  });

  it("deja marcadores visibles cuando faltan datos", async () => {
    const t = await texto(await generarMemorialBuffer(MEMORIAL_INICIAL));
    expect(t).toContain("[NOMBRE DEL REPRESENTANTE LEGAL]");
    expect(t).toContain("[RAZÓN SOCIAL]");
  });
});
