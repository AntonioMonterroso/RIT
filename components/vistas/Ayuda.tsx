"use client";

import { useState } from "react";
import Link from "next/link";
import { Pagina, Tarjeta, Texto } from "@/components/ui";
import { GLOSARIO, PREGUNTAS } from "@/content/ayuda";
import { normalizar } from "@/lib/navegacion";

export default function Ayuda() {
  const [q, setQ] = useState("");
  const t = normalizar(q.trim());
  const preguntas = PREGUNTAS.filter((p) => !t || normalizar(`${p.q} ${p.a}`).includes(t));
  const glosario = GLOSARIO.filter((g) => !t || normalizar(`${g.t} ${g.d}`).includes(t));

  return (
    <Pagina titulo="Centro de ayuda" descripcion="Respuestas a las dudas más comunes sobre el reglamento y su trámite, y un glosario de términos." ancho="max-w-4xl">
      <Texto etiqueta="Buscar en la ayuda" type="search" placeholder="Obligatorio, previo, vigencia, jornada…" value={q} onChange={(e) => setQ(e.target.value)} />
      <Tarjeta titulo="Preguntas frecuentes" relleno={false}>
        {preguntas.length === 0 ? <p className="p-6 text-sm text-muted">Ninguna pregunta coincide.</p> : (
          <div className="divide-y divide-line">
            {preguntas.map((p) => (
              <details key={p.q} className="group px-6 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {p.q}<span aria-hidden className="text-brand-600 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{p.a}</p>
              </details>
            ))}
          </div>
        )}
      </Tarjeta>
      <Tarjeta titulo="Glosario">
        {glosario.length === 0 ? <p className="text-sm text-muted">Ningún término coincide.</p> : (
          <dl className="grid gap-x-8 gap-y-4 md:grid-cols-2">
            {glosario.map((g) => <div key={g.t}><dt className="font-semibold text-brand-800">{g.t}</dt><dd className="mt-0.5 text-sm leading-relaxed text-muted">{g.d}</dd></div>)}
          </dl>
        )}
      </Tarjeta>
      <p className="text-sm text-muted">¿No encuentra su duda? Empiece por el <Link href="/diagnostico" className="font-semibold text-brand-700 underline">diagnóstico</Link>: el sistema le guía paso a paso.</p>
    </Pagina>
  );
}
