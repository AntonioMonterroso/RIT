"use client";

import { useState } from "react";
import { saveAs } from "file-saver";
import { useRit } from "@/components/EstadoProvider";
import { Aviso, Boton, Insignia, Pagina, Tarjeta, Texto, AreaTexto, Vacio } from "@/components/ui";
import { aprobar, estadoAprobacion } from "@/lib/aprobaciones";
import { nombreArchivo } from "@/lib/archivo";
import { FORMATOS, generarFormatoBlob } from "@/lib/formatos";

const cuando = (iso: string) => new Date(iso).toLocaleString("es-GT", { dateStyle: "medium", timeStyle: "short" });

export default function Aprobaciones() {
  const { estado, actualizar, permitido } = useRit();
  const [f, setF] = useState({ etiqueta: "", nombre: "", cargo: "", nota: "" });
  const st = estadoAprobacion(estado);
  const puede = permitido("aprobar");
  const hayTexto = Object.keys(estado.capitulos).length > 0;

  const registrar = (e: React.FormEvent) => {
    e.preventDefault();
    actualizar((s) => aprobar(s, f), "aprobar");
    setF({ etiqueta: "", nombre: "", cargo: "", nota: "" });
  };
  const acta = FORMATOS.find((x) => x.id === "aprobacion")!;

  return (
    <Pagina titulo="Aprobaciones internas" descripcion="Deje constancia de quién aprobó el texto del reglamento y cuándo. Cada aprobación queda ligada a una huella digital del texto: si luego se modifica, el sistema lo detecta.">
      {st.estado === "aprobado" && <Aviso tono="ok" titulo="El texto vigente está aprobado">Aprobó {st.ultima.nombre} el {cuando(st.ultima.fecha)}.</Aviso>}
      {st.estado === "cambios" && <Aviso tono="warn" titulo="El texto cambió después de la última aprobación">Vuelva a aprobar antes de presentarlo a la IGT o de difundirlo.</Aviso>}
      {st.estado === "sin_aprobar" && <Aviso tono="info" titulo="Todavía no hay aprobación">Un revisor o administrador puede aprobar el texto cuando esté listo.</Aviso>}

      <Tarjeta titulo="Registrar una aprobación" descripcion="Solo lo pueden hacer el administrador y los revisores. Una vez registrada no se puede editar ni borrar.">
        {!puede ? (
          <p className="text-sm text-muted">Su rol o su plan actual no permite aprobar. Pida a un revisor o administrador que lo haga.</p>
        ) : !hayTexto ? (
          <p className="text-sm text-muted">Primero redacte o genere el reglamento.</p>
        ) : (
          <form onSubmit={registrar} className="grid gap-3 md:grid-cols-2">
            <Texto etiqueta="Referencia" value={f.etiqueta} onChange={(e) => setF({ ...f, etiqueta: e.target.value })} placeholder="Ej. Versión para presentar a la IGT" />
            <Texto etiqueta="Nombre de quien aprueba" required value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} />
            <Texto etiqueta="Cargo" value={f.cargo} onChange={(e) => setF({ ...f, cargo: e.target.value })} placeholder="Gerente general" />
            <AreaTexto etiqueta="Observaciones (opcional)" rows={2} value={f.nota} onChange={(e) => setF({ ...f, nota: e.target.value })} />
            <div className="md:col-span-2"><Boton type="submit">Aprobar el texto actual</Boton></div>
          </form>
        )}
        <p className="mt-4 text-xs text-muted">Es un registro interno de la empresa. No es firma electrónica avanzada ni reemplaza la aprobación de la Inspección General de Trabajo.</p>
      </Tarjeta>

      {estado.aprobaciones.length === 0 ? <Vacio titulo="Aún no hay aprobaciones">Cuando registre la primera aparecerá aquí.</Vacio> : (
        <ul className="space-y-3">
          {estado.aprobaciones.map((a, i) => (
            <li key={a.id} className="vidrio rounded-[var(--radius)] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{a.etiqueta}</p>
                {i === 0 && st.estado === "aprobado" && <Insignia tono="ok">Vigente</Insignia>}
                {i === 0 && st.estado === "cambios" && <Insignia tono="warn">Texto modificado</Insignia>}
              </div>
              <p className="mt-1 text-sm">{a.nombre}{a.cargo ? ` · ${a.cargo}` : ""} · {cuando(a.fecha)}</p>
              {a.nota && <p className="mt-1 text-sm text-muted">{a.nota}</p>}
              <p className="etiqueta-mono mt-2 break-all text-[10px] text-muted">SHA-256 {a.huella}</p>
            </li>
          ))}
        </ul>
      )}

      {estado.aprobaciones.length > 0 && (
        <Boton variante="secundario" onClick={async () => saveAs(await generarFormatoBlob(acta, estado), nombreArchivo(`acta de aprobacion ${estado.empresa.nombre_comercial || estado.empresa.razon_social || "empresa"}`, "docx"))}>Descargar acta de aprobación (.docx)</Boton>
      )}
    </Pagina>
  );
}
