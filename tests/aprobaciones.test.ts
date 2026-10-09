import { describe, expect, it } from "vitest";
import { sha256Hex } from "@/lib/sha256";
import { aprobar, estadoAprobacion, huellaDe } from "@/lib/aprobaciones";
import { ESTADO_INICIAL } from "@/lib/almacen";
import { documento, textoANodos } from "@/lib/texto";

const con = (t: string) => ({ ...ESTADO_INICIAL, capitulos: { mod_1: documento(textoANodos(t)) } });

describe("sha256", () => {
  it("coincide con vectores conocidos", () => {
    expect(sha256Hex("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    expect(sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(sha256Hex("a".repeat(1000))).toBe("41edece42d63e8d9bf515a9ba6932e1c20cbc9f5a5d134645adb5db1b9737ea3");
  });
  it("maneja texto con acentos", () => {
    expect(sha256Hex("Reglamento Interior de Trabajo ñ")).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("aprobaciones", () => {
  it("la huella no depende del orden de las llaves y cambia con el texto", () => {
    const a = huellaDe({ mod_1: { type: "doc", content: [{ type: "paragraph" }] } });
    const b = huellaDe({ mod_1: { content: [{ type: "paragraph" }], type: "doc" } });
    expect(a).toBe(b);
    expect(huellaDe(con("uno").capitulos)).not.toBe(huellaDe(con("dos").capitulos));
  });
  it("detecta sin aprobar, aprobado y cambios posteriores", () => {
    const s0 = con("texto original");
    expect(estadoAprobacion(s0).estado).toBe("sin_aprobar");
    const s1 = aprobar(s0, { etiqueta: "", nombre: " Ana ", cargo: "Gerente", nota: "" });
    expect(s1.aprobaciones[0]).toMatchObject({ nombre: "Ana", etiqueta: "Aprobación del reglamento" });
    expect(estadoAprobacion(s1).estado).toBe("aprobado");
    const s2 = { ...s1, capitulos: con("texto modificado").capitulos };
    expect(estadoAprobacion(s2).estado).toBe("cambios");
    expect(s2.aprobaciones).toHaveLength(1); // nunca se pierde el registro
  });
});
