"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { saveAs } from "file-saver";
import { CAPITULOS, CAPITULO_POR_KEY, type CapituloKey } from "@/content/capitulos";
import { BLOQUES, CRITERIOS } from "@/content/checklist";
import { auditar, capituloCompleto, textoPlano } from "@/lib/auditoria";
import { generarDocxBlob, type Nodo } from "@/lib/docx";
import { generarMemorialBlob, type DatosMemorial } from "@/lib/memorial";
import { fechaVigencia, sumarDias } from "@/lib/fechas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ESTADO_INICIAL, type EstadoRit } from "@/lib/almacen";
import { repositorioLocal, repositorioSupabase, type Repositorio } from "@/lib/repositorio";
import { clienteSupabase } from "@/lib/supabase/cliente";
import { Cinta } from "./Cinta";
import { SaltoPagina } from "./SaltoPagina";

type Vista = "redaccion" | "auditoria" | "memorial" | "publicidad" | "empresa";

const SEMAFORO = {
  listo: { clase: "bg-green-100 text-green-800 border-green-300", texto: "Listo para presentar a la IGT" },
  riesgo: { clase: "bg-amber-100 text-amber-800 border-amber-300", texto: "Riesgo de prevención por la IGT" },
  rechazo: { clase: "bg-red-100 text-red-800 border-red-300", texto: "Documentación incompleta" },
} as const;

export default function RitEditor() {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoRit>(ESTADO_INICIAL);
  const [listo, setListo] = useState(false);
  const [guardado, setGuardado] = useState<"" | "guardando" | "ok" | "error">("");
  const repoRef = useRef<Repositorio>(repositorioLocal);
  const [vista, setVista] = useState<Vista>("redaccion");
  const [capitulo, setCapitulo] = useState<CapituloKey>("mod_1");
  const capRef = useRef(capitulo);
  capRef.current = capitulo;
  const estadoRef = useRef(estado);
  estadoRef.current = estado;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Redacte aquí las cláusulas de este capítulo…" }),
      Table.configure({ resizable: false }),
      TableRow, TableHeader, TableCell,
      SaltoPagina,
    ],
    editorProps: { attributes: { "aria-label": "Contenido del capítulo", spellcheck: "true", lang: "es" } },
    onUpdate: ({ editor: e }) => {
      const key = capRef.current;
      const json = e.getJSON() as Nodo;
      setEstado((s) => ({ ...s, capitulos: { ...s.capitulos, [key]: json } }));
    },
  });

  // Carga inicial del borrador (solo en el navegador).
  useEffect(() => {
    let vivo = true;
    (async () => {
      const db = clienteSupabase();
      if (db) {
        const { data: sesion } = await db.auth.getSession();
        const { data: perfil } = sesion.session ? await db.from("perfiles").select("empresa_id").maybeSingle() : { data: null };
        if (!perfil?.empresa_id) return router.replace("/acceso");
        repoRef.current = repositorioSupabase(db, perfil.empresa_id);
      }
      try {
        const cargado = await repoRef.current.cargar();
        if (vivo) { setEstado(cargado); setListo(true); }
      } catch {
        if (vivo) { setGuardado("error"); setListo(true); }
      }
    })();
    return () => { vivo = false; };
  }, [router]);

  // Guardado automático con espera de 600 ms.
  useEffect(() => {
    if (!listo) return;
    const t = setTimeout(async () => {
      setGuardado("guardando");
      try { await repoRef.current.guardar(estado); setGuardado("ok"); } catch { setGuardado("error"); }
    }, 600);
    return () => clearTimeout(t);
  }, [estado, listo]);

  // Al cerrar o recargar la pestaña se guarda de inmediato lo que esté pendiente.
  useEffect(() => {
    if (!listo) return;
    const volcar = () => { void repoRef.current.guardar(estadoRef.current).catch(() => {}); };
    window.addEventListener("pagehide", volcar);
    document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && volcar());
    return () => window.removeEventListener("pagehide", volcar);
  }, [listo]);

  // Cambio de capítulo o carga del borrador: se vuelca el contenido en el editor.
  useEffect(() => {
    if (!editor || !listo) return;
    const doc = estadoRef.current.capitulos[capitulo];
    editor.commands.setContent(doc ?? "", { emitUpdate: false });
  }, [editor, capitulo, listo]);

  const insertarClausula = useCallback(() => {
    if (!editor) return;
    const texto = CAPITULO_POR_KEY[capRef.current].estandar;
    editor.chain().focus("end").insertContent({ type: "paragraph", content: [{ type: "text", text: texto }] }).run();
  }, [editor]);

  const exportar = async () => {
    const blob = await generarDocxBlob({ empresa: estado.empresa, capitulos: estado.capitulos });
    saveAs(blob, `RIT_${(estado.empresa.nombre_comercial || estado.empresa.razon_social || "empresa").replace(/\s+/g, "_")}.docx`);
  };

  const setMemorial = (campo: keyof DatosMemorial, valor: string) =>
    setEstado((s) => ({ ...s, memorial: { ...s.memorial, [campo]: valor } }));
  // El memorial se rellena con los datos de la empresa mientras el usuario no lo haya escrito a mano.
  const memorial: DatosMemorial = {
    ...estado.memorial,
    rep_nombre: estado.memorial.rep_nombre || estado.empresa.representante_legal,
    razon_social: estado.memorial.razon_social || estado.empresa.razon_social,
    nombre_comercial: estado.memorial.nombre_comercial || estado.empresa.nombre_comercial,
  };
  const exportarMemorial = async () => {
    const blob = await generarMemorialBlob(memorial);
    saveAs(blob, `MEMORIAL_IGT_${(memorial.razon_social || "empresa").replace(/\s+/g, "_")}.docx`);
  };
  const pub = estado.publicacion;
  const vigencia = /^\d{4}-\d{2}-\d{2}$/.test(pub.fecha) ? fechaVigencia(pub.fecha) : null;
  const medioOk = pub.medio !== "";

  const resultado = auditar(estado.capitulos, estado.manuales);
  const sem = SEMAFORO[resultado.semaforo];
  const setEmpresa = (campo: keyof EstadoRit["empresa"], valor: string) =>
    setEstado((s) => ({ ...s, empresa: { ...s.empresa, [campo]: valor } }));

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between bg-[var(--primary)] px-5 py-2.5 text-white">
        <div className="flex items-center gap-3">
          <span className="rounded bg-white px-2 py-0.5 text-sm font-extrabold text-[var(--primary)]">RIT</span>
          <h1 className="text-base font-semibold">
            {estado.empresa.nombre_comercial || estado.empresa.razon_social || "Reglamento Interior de Trabajo"}
          </h1>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="opacity-80" aria-live="polite">
            {guardado === "guardando" ? "Guardando…" : guardado === "ok" ? "Guardado" : guardado === "error" ? "No se pudo guardar" : ""}
          </span>
          <Link href="/biblioteca" className="hover:underline">Biblioteca</Link>
          <Link href="/calendario" className="hover:underline">Calendario</Link>
          <button onClick={exportar} className="rounded bg-white/15 px-3 py-1.5 font-semibold hover:bg-white/25">
            Descargar Word (.docx)
          </button>
        </div>
      </header>

      <nav className="flex border-b border-slate-200 bg-white px-3" aria-label="Secciones">
        {([["redaccion", "Redacción"], ["auditoria", "Auditoría IGT"], ["memorial", "Memorial"], ["publicidad", "Publicidad y vigencia"], ["empresa", "Datos de la empresa"]] as const).map(([k, t]) => (
          <button
            key={k}
            onClick={() => setVista(k)}
            aria-current={vista === k ? "page" : undefined}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold ${
              vista === k ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      {vista === "redaccion" && (
        <div className="flex min-h-0 flex-1">
          <aside className="w-72 shrink-0 overflow-y-auto border-r border-slate-200 bg-white">
            <p className="border-b border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              Estructura del reglamento
            </p>
            <ul>
              {CAPITULOS.map((c) => {
                const largo = textoPlano(estado.capitulos[c.key]).length;
                const estadoCap = capituloCompleto(estado.capitulos[c.key]) ? "completo" : largo > 0 ? "parcial" : "vacío";
                return (
                  <li key={c.key}>
                    <button
                      onClick={() => setCapitulo(c.key)}
                      aria-current={capitulo === c.key ? "true" : undefined}
                      className={`flex w-full items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 text-left text-sm ${
                        capitulo === c.key ? "border-l-4 border-l-[var(--primary)] bg-[var(--primary-soft)] font-bold text-[var(--primary)]" : "hover:bg-slate-50"
                      }`}
                    >
                      <span>{c.titulo}</span>
                      <span
                        title={estadoCap}
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                          estadoCap === "completo" ? "bg-green-500" : estadoCap === "parcial" ? "bg-amber-500" : "bg-slate-300"
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>
          <main className="flex min-w-0 flex-1 flex-col">
            {editor && <Cinta editor={editor} onClausula={insertarClausula} />}
            <div className="flex-1 overflow-auto bg-slate-200 px-6 py-8">
              <div className="hoja">
                <h2 className="mb-6 text-center text-lg font-bold uppercase" style={{ fontFamily: "inherit" }}>
                  {CAPITULO_POR_KEY[capitulo].titulo}
                </h2>
                <EditorContent editor={editor} />
              </div>
            </div>
          </main>
        </div>
      )}

      {vista === "auditoria" && (
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[280px_1fr]">
            <section className="h-fit rounded-lg border border-slate-200 bg-white p-5 text-center">
              <p className="text-5xl font-extrabold text-[var(--primary)]">{resultado.porcentaje}%</p>
              <p className="mt-1 text-xs font-bold uppercase text-slate-500">
                {resultado.marcados} de {resultado.total} criterios
              </p>
              <p className={`mt-4 rounded border px-3 py-2 text-sm font-bold ${sem.clase}`} role="status">{sem.texto}</p>
            </section>
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              {(Object.keys(BLOQUES) as (keyof typeof BLOQUES)[]).map((b) => (
                <div key={b} className="mb-5 last:mb-0">
                  <h3 className="mb-2 rounded bg-slate-100 px-3 py-2 text-sm font-bold">Bloque {b}: {BLOQUES[b]}</h3>
                  {CRITERIOS.filter((c) => c.bloque === b).map((c) => {
                    const auto = !!c.capitulo;
                    const marcado = auto ? !!resultado.automaticos[c.id] : !!estado.manuales[c.id];
                    return (
                      <label key={c.id} className="flex items-start gap-3 border-b border-slate-100 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={marcado}
                          disabled={auto}
                          onChange={(e) => setEstado((s) => ({ ...s, manuales: { ...s.manuales, [c.id]: e.target.checked } }))}
                          className="mt-0.5 h-4 w-4"
                        />
                        <span className="flex-1">{c.texto}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${auto ? "bg-sky-100 text-sky-800" : "bg-amber-100 text-amber-800"}`}>
                          {auto ? "Automático" : "Manual"}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ))}
            </section>
          </div>
        </main>
      )}

      {vista === "memorial" && (
        <main className="flex-1 overflow-auto p-6">
          <form className="mx-auto grid max-w-3xl gap-4 rounded-lg border border-slate-200 bg-white p-6 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
            <p className="text-sm text-slate-600 md:col-span-2">
              Memorial dirigido a la Inspección General de Trabajo. Los datos de la empresa se completan solos; revise y ajuste.
            </p>
            {([
              ["autoridad", "Autoridad a la que se dirige", true],
              ["rep_nombre", "Nombre del representante legal", false],
              ["rep_datos", "Edad, estado civil y profesión", false],
              ["rep_dpi", "DPI del representante", false],
              ["calidad", "Calidad con la que actúa", false],
              ["razon_social", "Razón social", false],
              ["nombre_comercial", "Nombre comercial", false],
              ["direccion", "Dirección para notificaciones", true],
              ["lugar_fecha", "Lugar y fecha del memorial", true],
            ] as const).map(([campo, etiqueta, ancho]) => (
              <label key={campo} className={`block text-sm font-semibold ${ancho ? "md:col-span-2" : ""}`}>
                {etiqueta}
                <input
                  value={memorial[campo]}
                  onChange={(e) => setMemorial(campo, e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal"
                />
              </label>
            ))}
            <div className="md:col-span-2">
              <button type="button" onClick={exportarMemorial} className="rounded bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                Descargar memorial (.docx)
              </button>
            </div>
          </form>
        </main>
      )}

      {vista === "publicidad" && (
        <main className="flex-1 overflow-auto p-6">
          <section className="mx-auto max-w-xl space-y-4 rounded-lg border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-600">
              Una vez aprobado por la IGT, el reglamento debe darse a conocer a los trabajadores y rige 15 días después.
            </p>
            <label className="block text-sm font-semibold">
              Fecha en que se dio a conocer al personal
              <input
                type="date"
                value={pub.fecha}
                onChange={(e) => setEstado((s) => ({ ...s, publicacion: { ...s.publicacion, fecha: e.target.value } }))}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal"
              />
            </label>
            <label className="block text-sm font-semibold">
              Medio de publicidad
              <select
                value={pub.medio}
                onChange={(e) => setEstado((s) => ({ ...s, publicacion: { ...s.publicacion, medio: e.target.value as typeof pub.medio } }))}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal"
              >
                <option value="">Seleccione…</option>
                <option value="fijacion">Ejemplares fijados en dos sitios visibles</option>
                <option value="folleto">Folleto entregado a cada trabajador (con constancia firmada)</option>
                <option value="ambos">Ambos</option>
              </select>
            </label>
            <div role="status" aria-live="polite" className={`rounded border px-4 py-3 text-sm ${vigencia && medioOk ? "border-green-300 bg-green-50 text-green-900" : "border-amber-300 bg-amber-50 text-amber-900"}`}>
              {vigencia && medioOk ? (
                <>
                  <p className="font-bold">El reglamento entra en vigor el {vigencia.split("-").reverse().join("/")}.</p>
                  <p className="mt-1">Conserve la constancia de publicidad. Último día antes de regir: {sumarDias(vigencia, -1).split("-").reverse().join("/")}.</p>
                </>
              ) : (
                <p>Indique la fecha y el medio para calcular la entrada en vigor.</p>
              )}
            </div>
          </section>
        </main>
      )}

      {vista === "empresa" && (
        <main className="flex-1 overflow-auto p-6">
          <form className="mx-auto max-w-xl space-y-4 rounded-lg border border-slate-200 bg-white p-6" onSubmit={(e) => e.preventDefault()}>
            {([
              ["razon_social", "Razón social (según patente)"],
              ["nombre_comercial", "Nombre comercial"],
              ["nit", "NIT"],
              ["representante_legal", "Representante legal"],
              ["departamento", "Departamento"],
            ] as const).map(([campo, etiqueta]) => (
              <label key={campo} className="block text-sm font-semibold">
                {etiqueta}
                <input
                  value={estado.empresa[campo]}
                  onChange={(e) => setEmpresa(campo, e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal"
                />
              </label>
            ))}
          </form>
        </main>
      )}
    </div>
  );
}
