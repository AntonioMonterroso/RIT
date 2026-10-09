"use client";

import { useEffect, useRef, useState } from "react";
import { saveAs } from "file-saver";
import { useRit } from "@/components/EstadoProvider";
import { Aviso, Boton, Pagina, Tarjeta, Texto } from "@/components/ui";
import { ESTADO_INICIAL, type Empresa } from "@/lib/almacen";
import { nombreArchivo } from "@/lib/archivo";
import { exportarRespaldo, importarRespaldo } from "@/lib/respaldo";
import { supabaseConfigurado } from "@/lib/supabase/cliente";
import { aplicarPaleta, aplicarTema, PALETAS, paletaActual, temaActual, type Paleta, type Tema } from "@/lib/tema";

export default function Ajustes() {
  const { estado, actualizar } = useRit();
  const archivo = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ tono: "ok" | "danger"; texto: string } | null>(null);
  const [borrar, setBorrar] = useState(false);
  const [tema, setTema] = useState<Tema>("claro");
  const [paleta, setPaleta] = useState<Paleta>("arena");
  useEffect(() => { setTema(temaActual()); setPaleta(paletaActual()); }, []);
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

      <Tarjeta titulo="Apariencia" descripcion="Elija la paleta y si prefiere el fondo claro u oscuro. Se recuerda en este navegador.">
        <p className="etiqueta-mono mb-2 text-[10px] text-muted">Paleta</p>
        <div role="radiogroup" aria-label="Paleta de color" className="grid gap-3 sm:grid-cols-3">
          {PALETAS.map((p) => (
            <button key={p.id} type="button" role="radio" aria-checked={paleta === p.id} onClick={() => { aplicarPaleta(p.id); setPaleta(p.id); }}
              className={`vidrio rounded-xl p-3 text-left transition-colors ${paleta === p.id ? "border-brand-600 bg-brand-50" : "hover:border-brand-600/50"}`}>
              <span className="flex gap-1.5" aria-hidden>
                {p.muestra.map((c) => <span key={c} className="h-6 w-6 rounded-full border border-line" style={{ background: c }} />)}
              </span>
              <span className="mt-2 block text-sm font-semibold">{p.nombre}</span>
              <span className="block text-xs text-muted">{p.detalle}</span>
            </button>
          ))}
        </div>
        <p className="etiqueta-mono mb-2 mt-5 text-[10px] text-muted">Fondo</p>
        <div role="radiogroup" aria-label="Fondo" className="flex gap-3">
          {([["claro", "Claro"], ["oscuro", "Oscuro"]] as const).map(([t, n]) => (
            <Boton key={t} role="radio" aria-checked={tema === t} variante={tema === t ? "primario" : "secundario"} onClick={() => { aplicarTema(t); setTema(t); }}>{n}</Boton>
          ))}
        </div>
      </Tarjeta>

      <Tarjeta titulo="Copia de seguridad" descripcion={supabaseConfigurado ? "Sus datos están en su cuenta; igual puede guardar una copia." : "Sus datos viven solo en este navegador. Descargue una copia con frecuencia."}>
        {msg && <Aviso tono={msg.tono} className="mb-4">{msg.texto}</Aviso>}
        <div className="flex flex-wrap gap-3">
          <Boton onClick={() => saveAs(new Blob([exportarRespaldo(estado)], { type: "application/json" }), nombreArchivo(`respaldo RIT ${new Date().toISOString().slice(0, 10)}`, "json"))}>Descargar respaldo (.json)</Boton>
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
