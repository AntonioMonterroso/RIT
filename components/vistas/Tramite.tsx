"use client";

import Link from "next/link";
import { useRit } from "@/components/EstadoProvider";
import { Aviso, Pagina, Seleccion, Tarjeta, Texto, AreaTexto, Insignia } from "@/components/ui";
import type { EstadoTramite, Tramite as T } from "@/lib/tipos";
import { auditar } from "@/lib/auditoria";
import { externosAuditoria } from "@/lib/progreso";
import { RERIT_DOCS, RERIT_NOTA, RERIT_PASOS } from "@/content/guiasLegales";

const ETAPAS: { id: EstadoTramite; titulo: string; texto: string }[] = [
  { id: "sin_iniciar", titulo: "Preparación", texto: "Redactar, auditar y preparar el memorial y sus anexos." },
  { id: "presentado", titulo: "Presentado", texto: "Se entregó el memorial con dos ejemplares y los documentos de soporte." },
  { id: "con_previo", titulo: "Previo de la IGT", texto: "La IGT observó cláusulas; hay que corregir y volver a presentar." },
  { id: "aprobado", titulo: "Aprobado", texto: "Resolución favorable. Pasa a la publicidad de 15 días." },
];

export default function Tramite() {
  const { estado, actualizar, permitido } = useRit();
  const t = estado.tramite;
  const set = <K extends keyof T>(k: K, v: T[K]) => actualizar((s) => ({ ...s, tramite: { ...s.tramite, [k]: v } }));
  const idx = ETAPAS.findIndex((e) => e.id === t.estado);
  const aud = auditar(estado.capitulos, estado.manuales, externosAuditoria(estado));

  return (
    <Pagina titulo="Trámite ante la IGT" descripcion="Registre en qué etapa va su solicitud para no perder fechas ni documentos.">
      {t.estado === "sin_iniciar" && aud.porcentaje < 90 && (
        <Aviso tono="warn" titulo={`Su auditoría va en ${aud.porcentaje}%`}>
          Presentar con criterios incompletos aumenta el riesgo de previo. <Link href="/auditoria" className="font-semibold underline">Revisar auditoría</Link>
        </Aviso>
      )}

      <Tarjeta titulo="Etapa actual">
        <ol className="grid gap-3 md:grid-cols-4">
          {ETAPAS.map((e, i) => (
            <li key={e.id} className={`rounded-xl border p-3 ${i === idx ? "border-brand-600 bg-brand-50" : i < idx ? "border-ok-line bg-ok-bg" : "border-line bg-velo"}`}>
              <p className="flex items-center gap-2 text-sm font-bold">{i < idx ? "✓" : i + 1}. {e.titulo}{i === idx && <Insignia tono="marca">Aquí</Insignia>}</p>
              <p className="mt-1 text-xs text-muted">{e.texto}</p>
            </li>
          ))}
        </ol>
        <div className="mt-4 max-w-sm">
          <Seleccion etiqueta="Estado del trámite" value={t.estado} onChange={(e) => set("estado", e.target.value as EstadoTramite)}>
            {ETAPAS.map((e) => <option key={e.id} value={e.id}>{e.titulo}</option>)}
          </Seleccion>
        </div>
      </Tarjeta>

      <Tarjeta titulo="Datos del expediente">
        <div className="grid gap-4 md:grid-cols-2">
          <Texto etiqueta="Fecha de presentación" type="date" value={t.fechaPresentacion} onChange={(e) => set("fechaPresentacion", e.target.value)} />
          <Texto etiqueta="Número de expediente" value={t.expediente} onChange={(e) => set("expediente", e.target.value)} />
          {(t.estado === "con_previo" || t.fechaPrevio) && (
            <>
              <Texto etiqueta="Fecha en que se notificó el previo" type="date" value={t.fechaPrevio} onChange={(e) => set("fechaPrevio", e.target.value)} />
              <span />
              <AreaTexto ancho etiqueta="Observaciones de la IGT" rows={3} value={t.notaPrevio} onChange={(e) => set("notaPrevio", e.target.value)} ayuda="Anote qué cláusulas observó para corregirlas en la Redacción." />
            </>
          )}
          {(t.estado === "aprobado" || t.fechaAprobacion) && <Texto etiqueta="Fecha de la resolución de aprobación" type="date" value={t.fechaAprobacion} onChange={(e) => set("fechaAprobacion", e.target.value)} />}
        </div>
      </Tarjeta>

      <Tarjeta titulo="Presentación en línea (RERIT)" descripcion="Pasos y documentos que piden las guías consultadas para presentar el reglamento.">
        <ol className="list-decimal space-y-1 pl-5 text-sm">{RERIT_PASOS.map((p) => <li key={p}>{p}</li>)}</ol>
        <p className="mt-4 text-sm font-semibold">Documentos para cargar ({RERIT_DOCS.filter((d) => estado.checks[d.id]).length} de {RERIT_DOCS.length} listos)</p>
        <ul className="mt-2 space-y-2">
          {RERIT_DOCS.map((d) => (
            <li key={d.id} className="flex items-start gap-3 text-sm">
              <input type="checkbox" id={d.id} checked={!!estado.checks[d.id]} disabled={!permitido("editar")} onChange={(e) => actualizar((s) => ({ ...s, checks: { ...s.checks, [d.id]: e.target.checked } }))} className="mt-1 h-4 w-4 accent-[var(--brand-600)]" />
              <label htmlFor={d.id}>{d.texto}</label>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted">{RERIT_NOTA} Esta guía aún no ha sido validada por un abogado colegiado.</p>
      </Tarjeta>

      {t.estado === "aprobado" && (
        <Aviso tono="ok" titulo="Siguiente paso: darlo a conocer">
          El reglamento rige 15 días después de ponerse en conocimiento de los trabajadores. <Link href="/publicidad" className="font-semibold underline">Registrar la publicidad</Link>
        </Aviso>
      )}
    </Pagina>
  );
}
