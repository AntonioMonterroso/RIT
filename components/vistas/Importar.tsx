"use client";

import Link from "next/link";
import { useState } from "react";
import { useRit } from "@/components/EstadoProvider";
import { Aviso, AreaTexto, Boton, Insignia, Pagina, Seleccion, Tarjeta } from "@/components/ui";
import { CAPITULOS, CAPITULO_POR_KEY, type CapituloKey } from "@/content/capitulos";
import { contexto } from "@/lib/generador";
import { agregarSugeridas, analizarBrechas, asignacionAutomatica, combinar, construirCapitulos, segmentar, textoDeDocx, type Asignacion, type Seccion } from "@/lib/importar";
import { capitulosQueCumplen } from "@/lib/revision";
import { guardarVersion } from "@/lib/versiones";

const MAX_BYTES = 8 * 1024 * 1024;

export default function Importar() {
  const { estado, actualizar } = useRit();
  const [texto, setTexto] = useState("");
  const [secciones, setSecciones] = useState<Seccion[] | null>(null);
  const [asig, setAsig] = useState<Asignacion>({});
  const [modo, setModo] = useState<"reemplazar" | "agregar">("reemplazar");
  const [error, setError] = useState("");
  const [hecho, setHecho] = useState("");
  const [abierta, setAbierta] = useState<number | null>(null);

  const hayTexto = CAPITULOS.some((c) => estado.capitulos[c.key]?.content?.length);
  const ctx = contexto(estado);
  const brechas = hayTexto ? analizarBrechas(estado.capitulos, ctx) : [];
  const cumplen = capitulosQueCumplen(estado.capitulos);

  const analizar = (t: string) => {
    setError(""); setHecho("");
    const s = segmentar(t);
    if (s.length === 0) { setSecciones(null); return setError("No se encontró texto para importar."); }
    setSecciones(s); setAsig(asignacionAutomatica(s));
  };

  const leerArchivo = async (f: File | undefined) => {
    if (!f) return;
    setError(""); setHecho("");
    if (f.size > MAX_BYTES) return setError("El archivo pesa más de 8 MB. Pruebe con una copia más liviana.");
    try {
      const t = /\.docx$/i.test(f.name) ? await textoDeDocx(await f.arrayBuffer()) : /\.(txt|md)$/i.test(f.name) ? await f.text() : null;
      if (t === null) return setError("Use un archivo de Word (.docx) o de texto (.txt). Los .doc antiguos y los PDF no se pueden leer: guárdelo como .docx.");
      setTexto(t); analizar(t);
    } catch (e) { setError((e as Error).message); }
  };

  const importar = () => {
    if (!secciones) return;
    const nuevo = construirCapitulos(secciones, asig);
    const n = Object.keys(nuevo).length;
    if (n === 0) return setError("Asigne al menos una sección a un capítulo.");
    actualizar((s) => ({ ...guardarVersion(s, "Antes de importar un reglamento"), capitulos: combinar(s.capitulos, nuevo, modo) }));
    setHecho(`Se importaron ${n} capítulo(s). Se guardó una versión del texto anterior por si quiere volver atrás.`);
    setSecciones(null); setTexto("");
  };

  const agregar = (k: CapituloKey, ids: string[]) => {
    actualizar((s) => ({ ...guardarVersion(s, `Antes de completar: ${CAPITULO_POR_KEY[k].titulo}`), capitulos: agregarSugeridas(s.capitulos, k, ids, contexto(s)) }));
    setHecho(`Se agregaron ${ids.length} cláusula(s) a ${CAPITULO_POR_KEY[k].titulo}.`);
  };

  const sinAsignar = secciones?.filter((s) => !asig[s.id]).length ?? 0;

  return (
    <Pagina titulo="Importar su reglamento actual" descripcion="¿Ya tiene un reglamento? Súbalo en Word o pegue el texto. El sistema lo divide por capítulos y le dice qué le falta frente a lo que revisa la IGT.">
      {error && <Aviso tono="danger">{error}</Aviso>}
      {hecho && <Aviso tono="ok">{hecho}</Aviso>}

      <Tarjeta titulo="1. Cargue su documento">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="archivo-rit" className="block text-[13px] font-semibold">Archivo de Word (.docx) o texto (.txt)</label>
            <input id="archivo-rit" type="file" accept=".docx,.txt,.md" onChange={(e) => void leerArchivo(e.target.files?.[0])}
              className="mt-1.5 block w-full rounded-xl border border-dashed border-line bg-campo p-4 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-800" />
            <p className="mt-1.5 text-xs text-muted">El archivo se lee en su navegador; no se envía a ningún servidor.</p>
          </div>
          <div>
            <AreaTexto etiqueta="O pegue el texto aquí" rows={5} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="CAPÍTULO I. DISPOSICIONES GENERALES…" />
            <Boton className="mt-3" variante="secundario" onClick={() => analizar(texto)} disabled={!texto.trim()}>Analizar texto</Boton>
          </div>
        </div>
      </Tarjeta>

      {secciones && (
        <Tarjeta titulo="2. Revise a qué capítulo va cada parte" descripcion={`${secciones.length} sección(es) detectadas${sinAsignar ? `, ${sinAsignar} sin capítulo asignado` : ""}. Corrija las que no coincidan.`}>
          <ul className="space-y-3">
            {secciones.map((s) => (
              <li key={s.id} className="rounded-xl border border-line bg-velo p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" className="min-w-0 flex-1 text-left" aria-expanded={abierta === s.id} onClick={() => setAbierta(abierta === s.id ? null : s.id)}>
                    <span className="block truncate text-sm font-semibold">{s.titulo}</span>
                    <span className="etiqueta-mono text-[10px] text-muted">{s.lineas.length} párrafos · {s.lineas.join(" ").length.toLocaleString("es")} caracteres</span>
                  </button>
                  <div className="w-full sm:w-72">
                    <Seleccion etiqueta={`Capítulo para «${s.titulo.slice(0, 40)}»`} value={asig[s.id] ?? ""} onChange={(e) => setAsig({ ...asig, [s.id]: (e.target.value || null) as CapituloKey | null })}>
                      <option value="">No importar</option>
                      {CAPITULOS.map((c) => <option key={c.key} value={c.key}>{c.titulo}</option>)}
                    </Seleccion>
                  </div>
                </div>
                {abierta === s.id && <p className="mt-3 line-clamp-6 whitespace-pre-wrap border-t border-line pt-3 text-sm text-muted">{s.lineas.slice(0, 6).join("\n")}</p>}
              </li>
            ))}
          </ul>
          <fieldset className="mt-5">
            <legend className="text-[13px] font-semibold">Qué hacer con el texto actual</legend>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              {([["reemplazar", "Reemplazar los capítulos importados"], ["agregar", "Agregar al final de cada capítulo"]] as const).map(([v, t]) => (
                <label key={v} className="flex items-center gap-2"><input type="radio" name="modo-importar" checked={modo === v} onChange={() => setModo(v)} className="accent-[var(--brand-600)]" />{t}</label>
              ))}
            </div>
          </fieldset>
          <Boton className="mt-5" onClick={importar}>Importar al sistema</Boton>
        </Tarjeta>
      )}

      {hayTexto && (
        <Tarjeta titulo="Diagnóstico de su reglamento" descripcion={`${cumplen} de ${CAPITULOS.length} capítulos cumplen lo que espera la IGT.`}
          acciones={<Link href="/auditoria"><Boton variante="secundario" pequeno>Ver auditoría completa</Boton></Link>}>
          {brechas.length === 0 ? <Aviso tono="ok">No hay brechas: todos los capítulos cubren los requisitos que el sistema revisa.</Aviso> : (
            <ul className="space-y-3">
              {brechas.map((b) => (
                <li key={b.capitulo} className="rounded-xl border border-warn-line bg-warn-bg p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-warn">{CAPITULO_POR_KEY[b.capitulo].titulo}</p>
                      <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm text-warn">{b.faltan.map((f) => <li key={f}>Falta: {f.charAt(0).toLowerCase() + f.slice(1)}</li>)}</ul>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {b.sugeridas.length > 0 && <Boton pequeno onClick={() => agregar(b.capitulo, b.sugeridas)}>Agregar {b.sugeridas.length} cláusula(s) sugerida(s)</Boton>}
                      <Link href={`/editor?cap=${b.capitulo}`} className="text-sm font-semibold text-brand-700 underline">Abrir el capítulo</Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 flex items-center gap-2 text-xs text-muted"><Insignia tono="info">Nota</Insignia>El sistema revisa la presencia de los elementos que la IGT espera, no la calidad jurídica del texto. Un abogado debe revisar el reglamento.</p>
        </Tarjeta>
      )}
    </Pagina>
  );
}
