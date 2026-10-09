import { Node } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    saltoPagina: { insertarSaltoPagina: () => ReturnType };
  }
}

/** Nodo de bloque que el exportador .docx convierte en un salto de página real. */
export const SaltoPagina = Node.create({
  name: "pageBreak",
  group: "block",
  atom: true,
  parseHTML() { return [{ tag: "div.salto-pagina" }]; },
  renderHTML() { return ["div", { class: "salto-pagina" }]; },
  addCommands() {
    return {
      insertarSaltoPagina: () => ({ commands }) => commands.insertContent({ type: this.name }),
    };
  },
});
