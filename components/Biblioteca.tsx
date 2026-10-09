"use client";

import { useEffect, useMemo, useState } from "react";
import { clienteSupabase } from "@/lib/supabase/cliente";
import { listarLeyes, type Ley } from "@/lib/biblioteca";
import Marco from "./Marco";

export default function Biblioteca() {
  const [leyes, setLeyes] = useState<Ley[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [abierta, setAbierta] = useState<string | null>(null);

  useEffect(() => {
    const db = clienteSupabase();
    if (!db) return setLeyes([]);
    listarLeyes(db).then(setLeyes).catch((e: Error) => setError(e.message));
  }, []);

  const visibles = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (leyes ?? []).filter((l) => !t || `${l.titulo} ${l.referencia ?? ""} ${l.contenido}`.toLowerCase().includes(t));
  }, [leyes, q]);

  return (
    <Marco titulo="Biblioteca legal" enlaces={[{ href: "/editor", texto: "Constructor" }, { href: "/calendario", texto: "Calendario" }]}>
      <input
        type="search" aria-label="Buscar en la biblioteca" placeholder="Buscar por título, referencia o texto…"
        value={q} onChange={(e) => setQ(e.target.value)}
        className="mb-4 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
      />
      {error && <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {leyes === null && !error && <p className="text-sm text-slate-500" role="status">Cargando…</p>}
      {leyes && visibles.length === 0 && !error && (
        <p className="text-sm text-slate-500">{leyes.length ? "Ningún resultado." : "Aún no hay leyes publicadas."}</p>
      )}
      <ul className="space-y-3">
        {visibles.map((l) => (
          <li key={l.id} className="rounded-lg border border-slate-200 bg-white">
            <button onClick={() => setAbierta(abierta === l.id ? null : l.id)} aria-expanded={abierta === l.id}
              className="flex w-full items-baseline justify-between gap-3 px-4 py-3 text-left">
              <span className="font-semibold">{l.titulo}</span>
              <span className="text-xs text-slate-500">{l.referencia}</span>
            </button>
            {abierta === l.id && <div className="whitespace-pre-wrap border-t border-slate-100 px-4 py-3 text-sm leading-relaxed">{l.contenido}</div>}
          </li>
        ))}
      </ul>
    </Marco>
  );
}
