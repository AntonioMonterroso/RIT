"use client";

import { useRit } from "@/components/EstadoProvider";
import { Documento } from "@/components/Documento";
import { Aviso, Boton, Pagina } from "@/components/ui";
import { CAPITULOS } from "@/content/capitulos";
import { pendientesTotales } from "@/lib/revision";
import { resumenVersion } from "@/lib/versiones";

const ir = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "auto", block: "start" });

export default function VistaPrevia() {
  const { estado, listo } = useRit();
  const nombre = estado.empresa.razon_social || estado.empresa.nombre_comercial || "NOMBRE DE LA EMPRESA, S.A.";
  const pend = pendientesTotales(estado.capitulos);
  const con = CAPITULOS.filter((c) => estado.capitulos[c.key]?.content?.length);
  const { articulos, palabras } = resumenVersion({ id: "", etiqueta: "", fecha: "", capitulos: estado.capitulos });

  return (
    <Pagina
      titulo="Vista previa del reglamento"
      descripcion={`Así queda el documento completo: portada, índice y capítulos. ${articulos} artículos · ${palabras.toLocaleString("es")} palabras.`}
      acciones={<Boton onClick={() => window.print()}>Imprimir o guardar como PDF</Boton>}
      ancho="max-w-5xl"
    >
      {pend > 0 && <Aviso tono="warn" className="no-imprimir">Quedan {pend} dato(s) marcados como [COMPLETAR]. Complételos en Redacción antes de imprimir.</Aviso>}
      {!listo ? <p role="status" className="text-sm text-muted">Cargando…</p> : con.length === 0 ? (
        <Aviso tono="info">Todavía no hay texto. Genere el borrador desde el Diagnóstico o escriba en Redacción.</Aviso>
      ) : (
        <div className="space-y-8">
          <div className="hoja" style={{ minHeight: 0 }}>
            <section className="portada-doc flex min-h-[560px] flex-col items-center justify-center text-center">
              <p className="text-2xl font-bold uppercase tracking-wide">{nombre}</p>
              <p className="mt-6 text-xl">REGLAMENTO INTERIOR DE TRABAJO</p>
              {estado.empresa.departamento && <p className="mt-10 text-sm">{estado.empresa.departamento}, Guatemala</p>}
            </section>
          </div>

          <div className="hoja" style={{ minHeight: 0 }}>
            <h2 className="mb-5 text-center text-lg font-bold uppercase">Índice</h2>
            <ol className="space-y-1.5">
              {con.map((c) => (
                <li key={c.key}><button type="button" onClick={() => ir(`cap-${c.key}`)} className="text-left underline-offset-2 hover:underline" style={{ color: "#1e3a6e" }}>{c.titulo}</button></li>
              ))}
            </ol>
          </div>

          {con.map((c) => (
            <div key={c.key} id={`cap-${c.key}`} className="hoja capitulo-doc scroll-mt-24" style={{ minHeight: 0 }}>
              <h2 className="mb-6 text-center text-lg font-bold uppercase">{c.titulo}</h2>
              <Documento doc={estado.capitulos[c.key]} />
            </div>
          ))}
        </div>
      )}
    </Pagina>
  );
}
