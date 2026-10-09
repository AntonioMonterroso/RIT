"use client";

import { useState } from "react";
import { saveAs } from "file-saver";
import { Aviso, Boton, Insignia, Tarjeta, Texto, AreaTexto } from "@/components/ui";
import { nombreArchivo } from "@/lib/archivo";
import { paqueteBlob } from "@/lib/paqueteLegal";
import { estadoValidacion, resumenValidacion, validables, validar, type Validable, type Validacion } from "@/lib/validables";

const TONO = { sin_revisar: "neutro", validada: "ok", desactualizada: "warn" } as const;
const TEXTO = { sin_revisar: "Sin revisar", validada: "Validada", desactualizada: "Cambió después de validar" } as const;
const hoy = () => new Date().toISOString().slice(0, 10);

/** Panel del abogado: lee cada pieza de contenido legal y deja constancia de su revisión. */
export default function RevisionLegal({ validaciones, onGuardar, onQuitar }: {
  validaciones: Validacion[];
  onGuardar: (v: Omit<Validacion, "validada_en">) => Promise<void>;
  onQuitar: (id: string) => Promise<void>;
}) {
  const todos = validables();
  const mapa = new Map(validaciones.map((v) => [v.elemento_id, v]));
  const r = resumenValidacion(todos, validaciones);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [f, setF] = useState({ por: "", colegiado: "", fecha: hoy(), nota: "" });
  const [error, setError] = useState("");
  const grupos = [...new Set(todos.map((v) => v.grupo))];

  const guardar = async (e: React.FormEvent, v: Validable) => {
    e.preventDefault();
    try { await onGuardar(validar(v, f)); setAbierto(null); setError(""); } catch (x) { setError((x as Error).message); }
  };

  return (
    <Tarjeta titulo="Revisión legal del contenido" descripcion={`${r.validadas} de ${r.total} piezas validadas${r.desactualizadas ? ` · ${r.desactualizadas} cambiaron después de validarse` : ""}. Un abogado colegiado lee cada pieza y deja su constancia; si el contenido cambia, la validación se marca como desactualizada.`}
      acciones={<Boton pequeno variante="secundario" onClick={async () => saveAs(await paqueteBlob(validaciones), nombreArchivo("paquete de revision legal", "docx"))}>Descargar paquete para el abogado (.docx)</Boton>}>
      {error && <Aviso tono="danger" className="mb-3">{error}</Aviso>}
      <div className="space-y-5">
        {grupos.map((g) => (
          <section key={g}>
            <h3 className="mb-2 text-sm font-semibold">{g}</h3>
            <ul className="divide-y divide-line rounded-xl border border-line text-sm">
              {todos.filter((v) => v.grupo === g).map((v) => {
                const val = mapa.get(v.id);
                const est = estadoValidacion(v, val);
                return (
                  <li key={v.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="min-w-0 flex-1 font-medium">{v.titulo}</span>
                      <Insignia tono={TONO[est]}>{TEXTO[est]}</Insignia>
                      <Boton pequeno variante="fantasma" onClick={() => { setAbierto(abierto === v.id ? null : v.id); setF({ por: val?.validada_por ?? "", colegiado: val?.colegiado ?? "", fecha: hoy(), nota: "" }); }}>{abierto === v.id ? "Cerrar" : "Revisar"}</Boton>
                    </div>
                    {val && est === "validada" && <p className="mt-1 text-xs text-muted">{val.validada_por} · colegiado {val.colegiado} · {val.fecha_revision}{val.nota ? ` · ${val.nota}` : ""}</p>}
                    {abierto === v.id && (
                      <div className="mt-3 space-y-3">
                        <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-hondo p-3 text-xs">{v.contenido}</pre>
                        <form onSubmit={(e) => void guardar(e, v)} className="grid gap-3 md:grid-cols-3">
                          <Texto etiqueta="Nombre del abogado" required minLength={3} value={f.por} onChange={(e) => setF({ ...f, por: e.target.value })} />
                          <Texto etiqueta="Número de colegiado" required value={f.colegiado} onChange={(e) => setF({ ...f, colegiado: e.target.value })} />
                          <Texto etiqueta="Fecha de revisión" type="date" required value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} />
                          <div className="md:col-span-3"><AreaTexto etiqueta="Observaciones (opcional)" rows={2} value={f.nota} onChange={(e) => setF({ ...f, nota: e.target.value })} /></div>
                          <div className="flex gap-2 md:col-span-3"><Boton type="submit" pequeno>Validar esta pieza</Boton>{val && <Boton type="button" pequeno variante="fantasma" onClick={() => void onQuitar(v.id)}>Quitar validación</Boton>}</div>
                        </form>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </Tarjeta>
  );
}
