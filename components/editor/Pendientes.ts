import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/** Resalta en el editor los datos que faltan: [COMPLETAR: ...]. */
export const Pendientes = Extension.create({
  name: "pendientes",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("pendientes"),
        props: {
          decorations(state) {
            const marcas: Decoration[] = [];
            state.doc.descendants((nodo, pos) => {
              if (!nodo.isText || !nodo.text) return;
              for (const m of nodo.text.matchAll(/\[COMPLETAR[^\]]*\]/g)) {
                const desde = pos + (m.index ?? 0);
                marcas.push(Decoration.inline(desde, desde + m[0].length, { class: "pendiente" }));
              }
            });
            return DecorationSet.create(state.doc, marcas);
          },
        },
      }),
    ];
  },
});
