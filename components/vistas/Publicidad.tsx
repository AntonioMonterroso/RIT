"use client";

import Link from "next/link";
import { useRit } from "@/components/EstadoProvider";
import { Aviso, Pagina, Seleccion, Tarjeta, Texto } from "@/components/ui";
import { fechaVigencia, sumarDias } from "@/lib/fechas";

const fmt = (iso: string) => iso.split("-").reverse().join("/");

export default function Publicidad() {
  const { estado, actualizar } = useRit();
  const p = estado.publicacion;
  const vigencia = /^\d{4}-\d{2}-\d{2}$/.test(p.fecha) ? fechaVigencia(p.fecha) : null;
  const set = (patch: Partial<typeof p>) => actualizar((s) => ({ ...s, publicacion: { ...s.publicacion, ...patch } }));

  return (
    <Pagina titulo="Publicidad y entrada en vigor" descripcion="Una vez aprobado por la IGT, el reglamento debe darse a conocer a los trabajadores y rige 15 días después (art. 59).">
      {estado.tramite.estado !== "aprobado" && (
        <Aviso tono="warn" titulo="Aún no consta la aprobación">
          Solo debe darse a conocer el reglamento ya aprobado. <Link href="/tramite" className="font-semibold underline">Actualizar el trámite</Link>
        </Aviso>
      )}
      <Tarjeta>
        <div className="grid max-w-xl gap-4">
          <Texto etiqueta="Fecha en que se dio a conocer al personal" type="date" value={p.fecha} onChange={(e) => set({ fecha: e.target.value })} />
          <Seleccion etiqueta="Medio de publicidad" value={p.medio} onChange={(e) => set({ medio: e.target.value as typeof p.medio })}>
            <option value="">Seleccione…</option>
            <option value="fijacion">Ejemplares fijados en dos sitios visibles</option>
            <option value="folleto">Folleto entregado a cada trabajador (con constancia firmada)</option>
            <option value="ambos">Ambos</option>
          </Seleccion>
        </div>
      </Tarjeta>
      {vigencia && p.medio ? (
        <Aviso tono="ok" titulo={`El reglamento entra en vigor el ${fmt(vigencia)}.`}>
          Último día antes de regir: {fmt(sumarDias(vigencia, -1))}. Conserve las constancias firmadas: son la prueba de que el reglamento se dio a conocer.{" "}
          <Link href="/formatos" className="font-semibold underline">Descargar formatos de constancia y acta</Link>
        </Aviso>
      ) : (
        <Aviso tono="info">Indique la fecha y el medio para calcular la entrada en vigor.</Aviso>
      )}
    </Pagina>
  );
}
