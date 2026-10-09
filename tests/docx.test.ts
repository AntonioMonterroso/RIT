import { describe, expect, it } from "vitest";
import { generarDocxBuffer, type Nodo } from "@/lib/docx";

const p = (t: string, marks: string[] = []): Nodo => ({
  type: "paragraph",
  content: [{ type: "text", text: t, marks: marks.map((type) => ({ type })) }],
});

describe("exportación docx", () => {
  it("genera un .docx válido (zip) con tablas y listas", async () => {
    const buf = await generarDocxBuffer({
      empresa: { razon_social: "Comercial Prueba, S.A." },
      capitulos: {
        mod_1: { type: "doc", content: [
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Artículo 1" }] },
          p("Texto con negrita", ["bold"]),
          { type: "bulletList", content: [{ type: "listItem", content: [p("uno")] }] },
          { type: "orderedList", content: [{ type: "listItem", content: [p("dos")] }] },
          { type: "table", content: [{ type: "tableRow", content: [{ type: "tableHeader", content: [p("A")] }, { type: "tableCell", content: [p("B")] }] }] },
        ] },
      },
    });
    expect(buf.subarray(0, 2).toString()).toBe("PK");
    expect(buf.length).toBeGreaterThan(2000);
  });
});
