"use client";

import Link from "next/link";
import { Insignia } from "@/components/ui";
import { CAPITULO_POR_KEY } from "@/content/capitulos";
import { FUENTE_OFICIAL } from "@/content/baselegal";
import type { AlertaLegal } from "@/lib/legal";
import type { Validacion } from "@/lib/validables";

/** Lista de alertas del verificador legal. Siempre aclara que es orientativo y que la base aún no la valida un abogado. */
export default function AlertasLegales({ alertas, enlazar = false, validaciones = [] }: { alertas: AlertaLegal[]; enlazar?: boolean; validaciones?: Validacion[] }) {
  if (alertas.length === 0) return <p className="text-sm text-muted">No se detectaron cifras ni expresiones que contradigan los mínimos revisados.</p>;
  return (
    <ul className="space-y-3">
      {alertas.map((a, i) => (
        <li key={`${a.regla}-${i}`} className="rounded-xl border border-line bg-velo p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Insignia tono={a.gravedad === "contradice" ? "danger" : "warn"}>{a.gravedad === "contradice" ? "Contradice un mínimo" : "Conviene revisar"}</Insignia>
            {enlazar && <Link href={`/editor?cap=${a.capitulo}`} className="text-xs font-semibold text-brand-700 underline">{CAPITULO_POR_KEY[a.capitulo].titulo}</Link>}
          </div>
          <p className="mt-2 font-medium">{a.mensaje}</p>
          <p className="mt-1 text-muted">«…{a.extracto}…»</p>
          <p className="mt-1 text-xs text-muted">Base: {a.norma.norma}{a.norma.articulo ? `, art. ${a.norma.articulo}` : ""}. {a.norma.resumen} {validaciones.some((v) => v.elemento_id === `norma:${a.norma.id}`) ? "Referencia revisada por abogado colegiado." : "Referencia pendiente de validación por un abogado."}</p>
        </li>
      ))}
      <li className="text-xs text-muted">Orientativo: el sistema lee cifras y expresiones, no interpreta la ley. {FUENTE_OFICIAL}</li>
    </ul>
  );
}
