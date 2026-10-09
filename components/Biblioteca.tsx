"use client";

import { useEffect, useMemo, useState } from "react";
import { datos } from "@/lib/datos";
import type { Ley } from "@/lib/biblioteca";
import { Aviso, Pagina, Vacio, Texto } from "./ui";

export default function Biblioteca() {
  const [leyes, setLeyes] = useState<Ley[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [abierta, setAbierta] = useState<string | null>(null);

  useEffect(() => { datos().listarLeyes().then(setLeyes).catch((e: Error) => setError(e.message)); }, []);

  const visibles = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (leyes ?? []).filter((l) => !t || `${l.titulo} ${l.referencia ?? ""} ${l.contenido}`.toLowerCase().includes(t));
  }, [leyes, q]);

  return (
    <Pagina titulo="Biblioteca legal" descripcion="Leyes y reglamentos de consulta para redactar y aplicar su reglamento." ancho="max-w-4xl">
      <Texto etiqueta="Buscar en la biblioteca" type="search" placeholder="Título, referencia o texto…" value={q} onChange={(e) => setQ(e.target.value)} />
      {error && <Aviso tono="danger">{error}</Aviso>}
      {leyes === null && !error && <p className="text-sm text-muted" role="status">Cargando…</p>}
      {leyes && visibles.length === 0 && !error && <Vacio titulo={leyes.length ? "Ningún resultado." : "Aún no hay leyes publicadas."} />}
      <ul className="space-y-3">
        {visibles.map((l) => (
          <li key={l.id} className="rounded-[var(--radius)] border border-line bg-surface shadow-card">
            <button onClick={() => setAbierta(abierta === l.id ? null : l.id)} aria-expanded={abierta === l.id} className="flex w-full items-baseline justify-between gap-3 px-5 py-3 text-left">
              <span className="font-semibold">{l.titulo}</span>
              <span className="text-xs text-muted">{l.referencia}</span>
            </button>
            {abierta === l.id && <div className="whitespace-pre-wrap border-t border-line px-5 py-4 text-sm leading-relaxed">{l.contenido}</div>}
          </li>
        ))}
      </ul>
    </Pagina>
  );
}
