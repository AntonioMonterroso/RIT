"use client";

import Link from "next/link";
import { useRit } from "@/components/EstadoProvider";
import { Aviso, Insignia, Pagina, Tarjeta } from "@/components/ui";
import { BLOQUES, CRITERIOS } from "@/content/checklist";
import { auditar } from "@/lib/auditoria";
import { externosAuditoria } from "@/lib/progreso";
import { pendientesTotales, revisarCapitulo } from "@/lib/revision";

const SEM = {
  listo: { tono: "ok", texto: "Listo para presentar a la IGT" },
  riesgo: { tono: "warn", texto: "Riesgo de previo por parte de la IGT" },
  rechazo: { tono: "danger", texto: "Documentación incompleta" },
} as const;

export default function Auditoria() {
  const { estado, actualizar } = useRit();
  const r = auditar(estado.capitulos, estado.manuales, externosAuditoria(estado));
  const s = SEM[r.semaforo];
  const pend = pendientesTotales(estado.capitulos);

  return (
    <Pagina titulo="Auditoría previa a la IGT" descripcion="Los criterios de contenido se verifican solos leyendo su reglamento. Los documentos de soporte los marca usted.">
      <div className="grid gap-5 md:grid-cols-[260px_1fr]">
        <Tarjeta className="h-fit text-center">
          <p className="text-5xl font-extrabold tracking-tight text-brand-700">{r.porcentaje}%</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted">{r.marcados} de {r.total} criterios</p>
          <div className="mt-4"><Insignia tono={s.tono}>{s.texto}</Insignia></div>
          {pend > 0 && <div className="mt-4 text-left"><Aviso tono="warn">Quedan {pend} dato(s) <b>[COMPLETAR]</b> en el texto.</Aviso></div>}
        </Tarjeta>

        <div className="space-y-5">
          {(Object.keys(BLOQUES) as (keyof typeof BLOQUES)[]).map((b) => (
            <Tarjeta key={b} titulo={`Bloque ${b}: ${BLOQUES[b]}`} relleno={false}>
              <ul className="divide-y divide-line">
                {CRITERIOS.filter((c) => c.bloque === b).map((c) => {
                  const auto = c.id in r.automaticos;
                  const ok = auto ? r.automaticos[c.id] : !!estado.manuales[c.id];
                  const faltan = c.capitulo ? revisarCapitulo(c.capitulo, estado.capitulos[c.capitulo]).requisitos.filter((x) => !x.ok) : [];
                  return (
                    <li key={c.id} className="flex items-start gap-3 px-5 py-3 text-sm">
                      <input type="checkbox" checked={ok} disabled={auto} aria-label={c.texto} className="mt-0.5 h-4 w-4 accent-[var(--brand-700)]"
                        onChange={(e) => actualizar((st) => ({ ...st, manuales: { ...st.manuales, [c.id]: e.target.checked } }))} />
                      <div className="flex-1">
                        <p>{c.texto}</p>
                        {c.capitulo && !ok && (
                          <div className="mt-1 text-xs text-warn">
                            {faltan.length ? <>Falta: {faltan.map((f) => f.texto.toLowerCase()).join("; ")}. </> : <>El capítulo está vacío o es muy corto. </>}
                            <Link href={`/editor?cap=${c.capitulo}`} className="font-semibold underline">Ir a corregir</Link>
                          </div>
                        )}
                        {c.id === "A3" && !ok && <p className="mt-1 text-xs text-warn">Complete el <Link href="/memorial" className="font-semibold underline">memorial</Link>.</p>}
                      </div>
                      <Insignia tono={auto ? "info" : "warn"}>{auto ? "Automático" : "Manual"}</Insignia>
                    </li>
                  );
                })}
              </ul>
            </Tarjeta>
          ))}
        </div>
      </div>
    </Pagina>
  );
}
