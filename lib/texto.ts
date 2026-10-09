import type { Nodo } from "@/lib/docx";

const t = (text: string): Nodo => ({ type: "text", text });

/** Párrafos separados por línea en blanco; bloques cuyas líneas empiezan con "- " son listas. */
export function textoANodos(texto: string): Nodo[] {
  return texto
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((bloque): Nodo => {
      const lineas = bloque.split("\n").map((l) => l.trim());
      if (lineas.every((l) => l.startsWith("- "))) {
        return {
          type: "bulletList",
          content: lineas.map((l) => ({ type: "listItem", content: [{ type: "paragraph", content: [t(l.slice(2))] }] })),
        };
      }
      return { type: "paragraph", content: [t(lineas.join(" "))] };
    });
}

/** Cláusula = título de artículo (nivel 2) + cuerpo. `numero` "X" se numera luego con renumerar(). */
export function clausulaANodos(titulo: string, texto: string, numero: number | "X" = "X"): Nodo[] {
  return [
    { type: "heading", attrs: { level: 2 }, content: [t(`Artículo ${numero}. ${titulo}`)] },
    ...textoANodos(texto),
  ];
}

export const documento = (content: Nodo[]): Nodo => ({ type: "doc", content });

export interface NodoTexto {
  type?: string;
  text?: string;
  content?: NodoTexto[];
}

/** Texto plano de un documento TipTap/ProseMirror en JSON. */
export function textoPlano(nodo: NodoTexto | null | undefined): string {
  if (!nodo) return "";
  if (nodo.text) return nodo.text;
  return (nodo.content ?? []).map(textoPlano).join(" ").trim();
}
