"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { useRit } from "@/components/EstadoProvider";
import { Aviso, Boton, Insignia } from "@/components/ui";
import { CAPITULOS, CAPITULO_POR_KEY, type CapituloKey } from "@/content/capitulos";
import { GUIA } from "@/content/guia";
import { clausulasDe } from "@/content/plantillas";
import { generarCapitulo, nodosDeClausula } from "@/lib/generador";
import { leerParametro } from "@/lib/consulta";
import { renumerar } from "@/lib/numeracion";
import { pendientesTotales, revisarCapitulo } from "@/lib/revision";
import type { Nodo } from "@/lib/docx";
import { Cinta } from "./Cinta";
import { Pendientes } from "./Pendientes";
import { SaltoPagina } from "./SaltoPagina";

type Panel = "guia" | "revision" | "clausulas";
const VACIO: Nodo = { type: "doc", content: [{ type: "paragraph" }] };

export default function Redaccion() {
  const { estado, actualizar, listo } = useRit();
  const [cap, setCap] = useState<CapituloKey>("mod_1");
  const [panel, setPanel] = useState<Panel>("guia");
  const [confirmar, setConfirmar] = useState(false);
  const [nota, setNota] = useState("");
  const capRef = useRef(cap);
  capRef.current = cap;
  const buscarAlCargar = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Redacte aquí o agregue cláusulas desde el panel de la derecha…" }),
      Table.configure({ resizable: false }), TableRow, TableHeader, TableCell,
      SaltoPagina, Pendientes,
    ],
    editorProps: { attributes: { "aria-label": "Contenido del capítulo", spellcheck: "true", lang: "es" } },
    onUpdate: ({ editor: e }) => {
      const key = capRef.current;
      const json = e.getJSON() as Nodo;
      actualizar((s) => ({ ...s, capitulos: { ...s.capitulos, [key]: json } }));
    },
  });

  // Capítulo inicial desde ?cap=
  useEffect(() => {
    const k = leerParametro("cap") as CapituloKey | null;
    if (k && k in CAPITULO_POR_KEY) setCap(k);
  }, []);

  // Mantiene el editor igual al estado: cambia de capítulo o recibe texto desde fuera (cláusulas, regenerar).
  const docActual = estado.capitulos[cap];
  useEffect(() => {
    if (!editor || !listo) return;
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(docActual ?? VACIO)) {
      editor.commands.setContent(docActual ?? "", { emitUpdate: false });
    }
    if (buscarAlCargar.current) { buscarAlCargar.current = false; irAlPendiente(editor); }
  }, [editor, listo, cap, docActual]);

  const rev = revisarCapitulo(cap, docActual);
  const pendTotal = pendientesTotales(estado.capitulos);
  const guia = GUIA[cap];

  const renumerarTodo = useCallback(() => {
    let total = 0;
    actualizar((s) => { const r = renumerar(s.capitulos); total = r.total; return { ...s, capitulos: r.capitulos }; });
    setNota("Artículos renumerados.");
    return total;
  }, [actualizar]);

  const insertar = (id: string) => {
    if (!editor) return;
    const c = clausulasDe(cap).find((x) => x.id === id)!;
    editor.chain().focus("end").insertContent(nodosDeClausula(c, estado)).run();
    setTimeout(() => actualizar((s) => ({ ...s, capitulos: renumerar(s.capitulos).capitulos })), 0);
    setNota(`Se agregó «${c.titulo}».`);
  };

  const regenerar = () => {
    actualizar((s) => renumerarEstado({ ...s, capitulos: { ...s.capitulos, [cap]: generarCapitulo(cap, s) } }));
    setConfirmar(false);
    setNota("Capítulo regenerado con las cláusulas de su diagnóstico.");
  };

  function irAlPendiente(e: Editor) {
    let desde = -1; let largo = 0;
    e.state.doc.descendants((nodo, pos) => {
      if (desde >= 0 || !nodo.isText || !nodo.text) return;
      const m = nodo.text.match(/\[COMPLETAR[^\]]*\]/);
      if (m) { desde = pos + (m.index ?? 0); largo = m[0].length; }
    });
    if (desde >= 0) e.chain().focus().setTextSelection({ from: desde, to: desde + largo }).scrollIntoView().run();
  }

  const siguientePendiente = () => {
    if (!editor) return;
    if (rev.pendientes > 0) return irAlPendiente(editor);
    const orden = CAPITULOS.map((c) => c.key);
    const resto = [...orden.slice(orden.indexOf(cap) + 1), ...orden.slice(0, orden.indexOf(cap))];
    const k = resto.find((x) => revisarCapitulo(x, estado.capitulos[x]).pendientes > 0);
    if (k) { buscarAlCargar.current = true; setCap(k); }
  };

  return (
    <div className="vidrio flex h-[calc(100vh-6.25rem)] min-h-[560px] flex-col overflow-hidden rounded-2xl xl:flex-row">
      <aside aria-label="Capítulos" className="shrink-0 overflow-y-auto border-b border-line bg-hondo xl:w-64 xl:border-b-0 xl:border-r">
        <p className="etiqueta-mono border-b border-line px-4 py-3 text-[10px] text-muted">Capítulos</p>
        <ul className="flex gap-0 overflow-x-auto xl:block">
          {CAPITULOS.map((c) => {
            const r = revisarCapitulo(c.key, estado.capitulos[c.key]);
            const tono = r.cumple ? "bg-ok" : r.caracteres > 0 ? "bg-warn" : "bg-line";
            return (
              <li key={c.key} className="shrink-0 xl:shrink">
                <button onClick={() => { setCap(c.key); setConfirmar(false); setNota(""); }} aria-current={cap === c.key ? "true" : undefined}
                  className={`flex w-full items-center justify-between gap-2 border-b border-line px-4 py-3 text-left text-sm xl:border-b ${cap === c.key ? "border-l-[3px] border-l-brand-600 bg-brand-50 font-semibold text-brand-800" : "hover:bg-velo2"}`}>
                  <span className="max-w-48 xl:max-w-none">{c.titulo}</span>
                  <span title={r.cumple ? "Cumple" : r.caracteres > 0 ? "En redacción" : "Vacío"} className={`h-2.5 w-2.5 shrink-0 rounded-full ${tono}`} />
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        {editor && <Cinta editor={editor} onClausula={() => setPanel("clausulas")} />}
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-velo px-4 py-2">
          <Boton pequeno variante="secundario" onClick={renumerarTodo}>Renumerar artículos</Boton>
          {confirmar ? (
            <>
              <span className="text-xs font-medium text-warn">Se reemplazará el texto de este capítulo.</span>
              <Boton pequeno variante="peligro" onClick={regenerar}>Sí, regenerar</Boton>
              <Boton pequeno variante="fantasma" onClick={() => setConfirmar(false)}>Cancelar</Boton>
            </>
          ) : <Boton pequeno variante="secundario" onClick={() => setConfirmar(true)}>Regenerar este capítulo</Boton>}
          <span className="ml-auto text-xs text-muted" role="status" aria-live="polite">{nota}</span>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-campo px-4 py-8">
          <div className="hoja">
            <h2 className="mb-6 text-center text-lg font-bold uppercase" style={{ fontFamily: "inherit" }}>{CAPITULO_POR_KEY[cap].titulo}</h2>
            <EditorContent editor={editor} />
          </div>
        </div>
      </section>

      <aside aria-label="Ayuda del capítulo" className="flex shrink-0 flex-col border-t border-line bg-hondo xl:w-80 xl:border-l xl:border-t-0">
        <div role="tablist" className="flex border-b border-line">
          {([["guia", "Guía"], ["revision", "Revisión"], ["clausulas", "Cláusulas"]] as const).map(([k, t]) => (
            <button key={k} role="tab" aria-selected={panel === k} onClick={() => setPanel(k)}
              className={`flex-1 border-b-2 px-3 py-3 text-sm font-semibold ${panel === k ? "border-brand-600 text-brand-800" : "border-transparent text-muted hover:text-ink"}`}>
              {t}{k === "revision" && rev.pendientes > 0 && <span className="ml-1.5"><Insignia tono="warn">{rev.pendientes}</Insignia></span>}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 text-sm xl:max-h-none max-h-80">
          {panel === "guia" && (
            <>
              <p>{guia.objetivo}</p>
              <div><p className="font-bold">Debe incluir</p><ul className="mt-1 list-disc space-y-0.5 pl-5">{guia.debeIncluir.map((x) => <li key={x}>{x}</li>)}</ul></div>
              <div><p className="font-bold">Fundamento legal</p><p className="mt-1 text-muted">{guia.fundamento}</p></div>
              <div><p className="font-bold text-warn">Errores comunes</p><ul className="mt-1 list-disc space-y-0.5 pl-5">{guia.errores.map((x) => <li key={x}>{x}</li>)}</ul></div>
            </>
          )}
          {panel === "revision" && (
            <>
              <p className="text-muted">El sistema lee este capítulo y comprueba lo que la IGT espera encontrar.</p>
              <ul className="space-y-2">
                {rev.requisitos.map((r) => (
                  <li key={r.texto} className="flex items-start gap-2"><span aria-hidden className={r.ok ? "text-ok" : "text-danger"}>{r.ok ? "✓" : "✗"}</span><span className={r.ok ? "" : "font-medium"}>{r.texto}<span className="sr-only">{r.ok ? ": cumple" : ": falta"}</span></span></li>
                ))}
              </ul>
              {rev.pendientes > 0
                ? <Aviso tono="warn">Hay {rev.pendientes} dato(s) por completar en este capítulo (resaltados en amarillo).</Aviso>
                : rev.cumple ? <Aviso tono="ok">Este capítulo cumple los requisitos.</Aviso> : null}
              {pendTotal > 0 && <Boton variante="secundario" pequeno className="w-full" onClick={siguientePendiente}>Ir al siguiente dato pendiente ({pendTotal})</Boton>}
            </>
          )}
          {panel === "clausulas" && (
            <>
              <p className="text-muted">Cláusulas de este capítulo, adaptadas a su empresa. «Insertar» las agrega al final del texto.</p>
              <ul className="space-y-2">
                {clausulasDe(cap).map((c) => (
                  <li key={c.id} className="rounded-lg border border-line p-3">
                    <p className="font-semibold">{c.titulo}</p>
                    <p className="text-xs text-muted">{c.resumen}</p>
                    <Boton pequeno variante="secundario" className="mt-2" onClick={() => insertar(c.id)} aria-label={`Insertar cláusula ${c.titulo}`}>Insertar</Boton>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function renumerarEstado<T extends { capitulos: Parameters<typeof renumerar>[0] }>(s: T): T {
  return { ...s, capitulos: renumerar(s.capitulos).capitulos };
}
