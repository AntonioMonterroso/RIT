"use client";

import { useRef, useState } from "react";
import { saveAs } from "file-saver";
import { useRit } from "@/components/EstadoProvider";
import { Aviso, Boton, Pagina, Tarjeta, Texto } from "@/components/ui";
import { ESTADO_INICIAL, type Empresa } from "@/lib/almacen";
import { exportarRespaldo, importarRespaldo } from "@/lib/respaldo";
import { supabaseConfigurado } from "@/lib/supabase/cliente";

export default function Ajustes() {
  const { estado, actualizar } = useRit();
  const archivo = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ tono: "ok" | "danger"; texto: string } | null>(null);
  const [borrar, setBorrar] = useState(false);
  const setE = (k: keyof Empresa, v: string) => actualizar((s) => ({ ...s, empresa: { ...s.empresa, [k]: v } }));

  const importar = async (f: File | undefined) => {
    if (!f) return;
    const r = importarRespaldo(await f.text());
    if (!r.ok) return setMsg({ tono: "danger", texto: r.error });
    actualizar(() => r.estado);
    setMsg({ tono: "ok", texto: "Respaldo restaurado." });
    if (archivo.current) archivo.current.value = "";
  };

  return (
    <Pagina titulo="Ajustes y respaldo" descripcion="Datos legales de la empresa y copia de seguridad de todo su reglamento.">
      <Tarjeta titulo="Datos de la empresa" descripcion="Se usan en el reglamento, el memorial y los formatos.">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
          <Texto etiqueta="Razón social (según patente)" value={estado.empresa.razon_social} onChange={(e) => setE("razon_social", e.target.value)} />
          <Texto etiqueta="Nombre comercial" value={estado.empresa.nombre_comercial} onChange={(e) => setE("nombre_comercial", e.target.value)} />
          <Texto etiqueta="NIT" value={estado.empresa.nit} onChange={(e) => setE("nit", e.target.value)} />
          <Texto etiqueta="Representante legal" value={estado.empresa.representante_legal} onChange={(e) => setE("representante_legal", e.target.value)} />
          <Texto etiqueta="Departamento" value={estado.empresa.departamento} onChange={(e) => setE("departamento", e.target.value)} />
        </form>
      </Tarjeta>

      <Tarjeta titulo="Copia de seguridad" descripcion={supabaseConfigurado ? "Sus datos están en su cuenta; igual puede guardar una copia." : "Sus datos viven solo en este navegador. Descargue una copia con frecuencia."}>
        {msg && <Aviso tono={msg.tono} className="mb-4">{msg.texto}</Aviso>}
        <div className="flex flex-wrap gap-3">
          <Boton onClick={() => saveAs(new Blob([exportarRespaldo(estado)], { type: "application/json" }), `respaldo_RIT_${new Date().toISOString().slice(0, 10)}.json`)}>Descargar respaldo (.json)</Boton>
          <Boton variante="secundario" onClick={() => archivo.current?.click()}>Restaurar desde un respaldo…</Boton>
          <input ref={archivo} type="file" accept="application/json,.json" className="hidden" aria-label="Archivo de respaldo" onChange={(e) => void importar(e.target.files?.[0])} />
        </div>
        <p className="mt-3 text-xs text-muted">Restaurar reemplaza todo el contenido actual.</p>
      </Tarjeta>

      <Tarjeta titulo="Borrar todo">
        {borrar ? (
          <div className="space-y-3">
            <Aviso tono="danger">Se borrarán el reglamento, los puestos, el trámite y los recordatorios. No se puede deshacer; descargue un respaldo antes.</Aviso>
            <div className="flex gap-2"><Boton variante="peligro" onClick={() => { actualizar(() => ESTADO_INICIAL); setBorrar(false); setMsg({ tono: "ok", texto: "Se borró todo." }); }}>Sí, borrar todo</Boton><Boton variante="secundario" onClick={() => setBorrar(false)}>Cancelar</Boton></div>
          </div>
        ) : <Boton variante="peligro" onClick={() => setBorrar(true)}>Borrar todo el contenido…</Boton>}
      </Tarjeta>
    </Pagina>
  );
}
