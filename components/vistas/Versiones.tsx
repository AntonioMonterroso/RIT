"use client";

import { useState } from "react";
import { useRit } from "@/components/EstadoProvider";
import { Aviso, Boton, Pagina, Tarjeta, Texto, Vacio } from "@/components/ui";
import { eliminarVersion, guardarVersion, MAX_VERSIONES, restaurarVersion, resumenVersion } from "@/lib/versiones";

const cuando = (iso: string) => new Date(iso).toLocaleString("es-GT", { dateStyle: "medium", timeStyle: "short" });

export default function Versiones() {
  const { estado, actualizar } = useRit();
  const [etiqueta, setEtiqueta] = useState("");
  const [aviso, setAviso] = useState("");
  const [confirmar, setConfirmar] = useState<string | null>(null);

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    actualizar((s) => guardarVersion(s, etiqueta));
    setEtiqueta(""); setAviso("Versión guardada.");
  };

  return (
    <Pagina titulo="Historial de versiones" descripcion={`Copias del texto del reglamento para poder volver atrás. Se conservan las ${MAX_VERSIONES} más recientes. También se guarda una automáticamente antes de reemplazar texto.`}>
      <Tarjeta titulo="Guardar una versión ahora">
        <form onSubmit={guardar} className="flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1"><Texto etiqueta="Nombre de la versión" value={etiqueta} onChange={(e) => setEtiqueta(e.target.value)} placeholder="Ej. Antes de presentar a la IGT" /></div>
          <Boton type="submit">Guardar versión</Boton>
        </form>
        {aviso && <Aviso tono="ok" className="mt-4">{aviso}</Aviso>}
      </Tarjeta>

      {estado.versiones.length === 0 ? <Vacio titulo="Aún no hay versiones">Guarde la primera cuando tenga texto en el reglamento.</Vacio> : (
        <ul className="space-y-3">
          {estado.versiones.map((v) => {
            const r = resumenVersion(v);
            return (
              <li key={v.id} className="vidrio flex flex-wrap items-center gap-4 rounded-[var(--radius)] p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{v.etiqueta}</p>
                  <p className="etiqueta-mono text-[10px] text-muted">{cuando(v.fecha)} · {r.articulos} artículos · {r.palabras.toLocaleString("es")} palabras</p>
                </div>
                {confirmar === v.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-warn">Se reemplaza el texto actual (se respalda antes).</span>
                    <Boton pequeno onClick={() => { actualizar((s) => restaurarVersion(s, v.id)); setConfirmar(null); setAviso(`Se restauró «${v.etiqueta}».`); }}>Sí, restaurar</Boton>
                    <Boton pequeno variante="fantasma" onClick={() => setConfirmar(null)}>Cancelar</Boton>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Boton pequeno variante="secundario" onClick={() => setConfirmar(v.id)} aria-label={`Restaurar ${v.etiqueta}`}>Restaurar</Boton>
                    <Boton pequeno variante="fantasma" onClick={() => actualizar((s) => eliminarVersion(s, v.id))} aria-label={`Eliminar ${v.etiqueta}`}>Eliminar</Boton>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Pagina>
  );
}
