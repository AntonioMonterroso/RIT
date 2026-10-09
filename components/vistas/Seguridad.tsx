"use client";

import { useRit } from "@/components/EstadoProvider";
import { Aviso, Pagina, Progreso, Tarjeta } from "@/components/ui";
import { SSO_FUENTES, SSO_ITEMS, SSO_NOTA } from "@/content/guiasLegales";

export default function Seguridad() {
  const { estado, actualizar, permitido } = useRit();
  const hechos = SSO_ITEMS.filter((i) => estado.checks[i.id]).length;
  const n = estado.diagnostico.trabajadores;
  return (
    <Pagina titulo="Seguridad y salud ocupacional" descripcion="El reglamento interior remite al Reglamento de Salud y Seguridad Ocupacional. Esta lista le ayuda a no dejar sin cubrir lo que ese reglamento pide a su empresa.">
      <Aviso tono="info" titulo={estado.diagnostico.completo ? `Su empresa declaró ${n} trabajadores` : "Complete el diagnóstico para ver su número de trabajadores"}>{SSO_NOTA}</Aviso>
      <Tarjeta titulo="Lista de cumplimiento" descripcion={`${hechos} de ${SSO_ITEMS.length} puntos marcados`}>
        <Progreso valor={(hechos / SSO_ITEMS.length) * 100} etiqueta="Avance de seguridad y salud ocupacional" tono={hechos === SSO_ITEMS.length ? "ok" : "marca"} />
        <ul className="mt-4 space-y-2">
          {SSO_ITEMS.map((i) => (
            <li key={i.id} className="vidrio flex items-start gap-3 rounded-xl p-3.5">
              <input type="checkbox" id={i.id} checked={!!estado.checks[i.id]} disabled={!permitido("editar")} onChange={(e) => actualizar((s) => ({ ...s, checks: { ...s.checks, [i.id]: e.target.checked } }))} className="mt-1 h-4 w-4 accent-[var(--brand-600)]" />
              <label htmlFor={i.id} className="flex-1 text-sm"><span className="font-medium">{i.texto}</span>{i.ayuda && <span className="mt-0.5 block text-muted">{i.ayuda}</span>}</label>
            </li>
          ))}
        </ul>
      </Tarjeta>
      <Tarjeta titulo="Normas de referencia">
        <ul className="list-disc space-y-1 pl-5 text-sm">{SSO_FUENTES.map((f) => <li key={f}>{f}</li>)}</ul>
        <p className="mt-3 text-xs text-muted">Esta guía aún no ha sido validada por un abogado colegiado. Si su reglamento aún no incluye la cláusula del comité, puede agregarla desde Cláusulas, en el capítulo de seguridad e higiene.</p>
      </Tarjeta>
    </Pagina>
  );
}
