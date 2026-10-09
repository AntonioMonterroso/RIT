"use client";

import { saveAs } from "file-saver";
import { useRit } from "@/components/EstadoProvider";
import { Boton, Pagina, Tarjeta } from "@/components/ui";
import { FORMATOS, generarFormatoBlob } from "@/lib/formatos";

export default function Formatos() {
  const { estado } = useRit();
  return (
    <Pagina titulo="Formatos listos para usar" descripcion="Documentos de apoyo del proceso, ya completados con los datos de su empresa. Revíselos antes de firmarlos.">
      <div className="grid gap-5 md:grid-cols-2">
        {FORMATOS.map((f) => (
          <Tarjeta key={f.id} titulo={f.titulo}>
            <p className="text-sm">{f.uso}</p>
            <p className="mt-2 text-sm text-muted"><b className="text-ink">Cuándo:</b> {f.cuando}</p>
            <Boton className="mt-4" variante="secundario" onClick={async () => saveAs(await generarFormatoBlob(f, estado), `${f.id}_${(estado.empresa.nombre_comercial || estado.empresa.razon_social || "empresa").replace(/\s+/g, "_")}.docx`)}>Descargar (.docx)</Boton>
          </Tarjeta>
        ))}
      </div>
    </Pagina>
  );
}
