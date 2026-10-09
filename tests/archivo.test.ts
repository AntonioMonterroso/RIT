import { describe, expect, it } from "vitest";
import { nombreArchivo } from "@/lib/archivo";

describe("nombreArchivo", () => {
  it("quita acentos y símbolos", () => {
    expect(nombreArchivo("RIT_Sabor Chapín, S.A.", "docx")).toBe("RIT_Sabor_Chapin_S.A.docx");
    expect(nombreArchivo("Comercializadora del Suroccidente, Sociedad Anónima", ".docx")).toBe("Comercializadora_del_Suroccidente_Sociedad_Anonima.docx");
  });
  it("conserva ñ como n y no deja caracteres peligrosos", () => {
    expect(nombreArchivo("Niño/Año:*?", "json")).toBe("Nino_Ano.json");
  });
  it("tiene nombre aunque la base esté vacía y limita el largo", () => {
    expect(nombreArchivo("", "docx")).toBe("documento.docx");
    expect(nombreArchivo("   ¿¿??", "docx")).toBe("documento.docx");
    expect(nombreArchivo("a".repeat(300), "docx").length).toBeLessThanOrEqual(86);
  });
});
