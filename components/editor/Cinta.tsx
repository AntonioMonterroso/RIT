"use client";

import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";

function Boton({ activo, onClick, titulo, children, deshabilitado }: {
  activo?: boolean; onClick: () => void; titulo: string; children: React.ReactNode; deshabilitado?: boolean;
}) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      aria-pressed={activo}
      disabled={deshabilitado}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`h-8 min-w-8 px-2 rounded text-sm font-medium transition-colors disabled:opacity-40 ${
        activo ? "bg-blue-100 text-blue-900" : "hover:bg-slate-100 text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

const Sep = () => <span className="mx-1 h-6 w-px bg-slate-200" aria-hidden />;

/** Barra de herramientas tipo cinta de Word. */
export function Cinta({ editor, onClausula }: { editor: Editor; onClausula: () => void }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      h1: e.isActive("heading", { level: 1 }),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      left: e.isActive({ textAlign: "left" }),
      center: e.isActive({ textAlign: "center" }),
      right: e.isActive({ textAlign: "right" }),
      justify: e.isActive({ textAlign: "justify" }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      puedeDeshacer: e.can().undo(),
      puedeRehacer: e.can().redo(),
      enTabla: e.isActive("table"),
    }),
  });
  const c = () => editor.chain().focus();
  const estilo = s.h1 ? "1" : s.h2 ? "2" : s.h3 ? "3" : "0";

  return (
    <div role="toolbar" aria-label="Formato" className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-white px-3 py-1.5">
      <Boton titulo="Deshacer (Ctrl+Z)" deshabilitado={!s.puedeDeshacer} onClick={() => c().undo().run()}>↶</Boton>
      <Boton titulo="Rehacer (Ctrl+Y)" deshabilitado={!s.puedeRehacer} onClick={() => c().redo().run()}>↷</Boton>
      <Sep />
      <select
        aria-label="Estilo de párrafo"
        value={estilo}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "0") c().setParagraph().run();
          else c().setHeading({ level: Number(v) as 1 | 2 | 3 }).run();
        }}
        className="h-8 rounded border border-slate-200 bg-white px-2 text-sm"
      >
        <option value="0">Texto normal</option>
        <option value="1">Título 1</option>
        <option value="2">Título 2</option>
        <option value="3">Título 3</option>
      </select>
      <Sep />
      <Boton titulo="Negrita (Ctrl+B)" activo={s.bold} onClick={() => c().toggleBold().run()}><b>N</b></Boton>
      <Boton titulo="Cursiva (Ctrl+I)" activo={s.italic} onClick={() => c().toggleItalic().run()}><i>K</i></Boton>
      <Boton titulo="Subrayado (Ctrl+U)" activo={s.underline} onClick={() => c().toggleUnderline().run()}><u>S</u></Boton>
      <Sep />
      <Boton titulo="Alinear a la izquierda" activo={s.left} onClick={() => c().setTextAlign("left").run()}>⇤</Boton>
      <Boton titulo="Centrar" activo={s.center} onClick={() => c().setTextAlign("center").run()}>↔</Boton>
      <Boton titulo="Alinear a la derecha" activo={s.right} onClick={() => c().setTextAlign("right").run()}>⇥</Boton>
      <Boton titulo="Justificar" activo={s.justify} onClick={() => c().setTextAlign("justify").run()}>☰</Boton>
      <Sep />
      <Boton titulo="Viñetas" activo={s.bullet} onClick={() => c().toggleBulletList().run()}>• —</Boton>
      <Boton titulo="Numeración" activo={s.ordered} onClick={() => c().toggleOrderedList().run()}>1. —</Boton>
      <Sep />
      <Boton titulo="Insertar tabla" onClick={() => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>▦ Tabla</Boton>
      {s.enTabla && (
        <>
          <Boton titulo="Agregar fila" onClick={() => c().addRowAfter().run()}>+ fila</Boton>
          <Boton titulo="Agregar columna" onClick={() => c().addColumnAfter().run()}>+ col.</Boton>
          <Boton titulo="Eliminar tabla" onClick={() => c().deleteTable().run()}>✕ tabla</Boton>
        </>
      )}
      <Boton titulo="Salto de página" onClick={() => c().insertarSaltoPagina().run()}>⤓ Salto</Boton>
      <Sep />
      <Boton titulo="Abrir la biblioteca de cláusulas de este capítulo" onClick={onClausula}>❏ Cláusulas</Boton>
    </div>
  );
}
