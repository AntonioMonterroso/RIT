"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CLAUSULAS } from "@/content/plantillas";
import { normalizar, PROCESO, RECURSOS, AJUSTES, INICIO } from "@/lib/navegacion";
import { Icono, type NombreIcono } from "./Iconos";

export interface Accion { id: string; texto: string; icono: NombreIcono; ejecutar: () => void; claves?: string }

interface Resultado { id: string; grupo: string; texto: string; detalle?: string; icono: NombreIcono; ir: () => void }

/** Buscador de comandos: Ctrl/⌘+K. Salta a pantallas, cláusulas y acciones. */
export default function Paleta({ abierta, onCerrar, acciones }: { abierta: boolean; onCerrar: () => void; acciones: Accion[] }) {
  // El diálogo se monta de nuevo cada vez que se abre: el texto y la selección nacen vacíos
  // y el campo toma el foco al instante, sin efectos que borren lo que se escribe rápido.
  return abierta ? <Dialogo onCerrar={onCerrar} acciones={acciones} /> : null;
}

function Dialogo({ onCerrar, acciones }: { onCerrar: () => void; acciones: Accion[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [activo, setActivo] = useState(0);
  const entrada = useRef<HTMLInputElement>(null);
  const lista = useId();

  const todos = useMemo<Resultado[]>(() => {
    const dest = (g: string, items: typeof PROCESO) => items.map((d) => ({ id: d.href, grupo: g, texto: d.texto, detalle: d.claves, icono: d.icono, ir: () => router.push(d.href) }));
    return [
      ...acciones.map((a) => ({ id: a.id, grupo: "Acciones", texto: a.texto, detalle: a.claves, icono: a.icono, ir: a.ejecutar })),
      ...dest("Ir a", [INICIO, ...PROCESO, ...RECURSOS, AJUSTES]),
      ...CLAUSULAS.map((c) => ({ id: c.id, grupo: "Cláusulas", texto: c.titulo, detalle: c.resumen, icono: "plantillas" as NombreIcono, ir: () => router.push(`/plantillas?q=${encodeURIComponent(c.titulo)}`) })),
    ];
  }, [acciones, router]);

  const visibles = useMemo(() => {
    const t = normalizar(q.trim());
    if (!t) return todos.filter((r) => r.grupo !== "Cláusulas").slice(0, 12);
    return todos.filter((r) => normalizar(`${r.texto} ${r.detalle ?? ""}`).includes(t)).slice(0, 12);
  }, [q, todos]);

  useEffect(() => { setActivo(0); }, [q]);

  const elegir = (r: Resultado | undefined) => { if (!r) return; onCerrar(); r.ir(); };
  const tecla = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); onCerrar(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActivo((a) => Math.min(a + 1, visibles.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActivo((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); elegir(visibles[activo]); }
  };

  return (
    <div className="no-imprimir fixed inset-0 z-50 grid place-items-start justify-items-center bg-black/60 px-4 pt-[14vh] backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div role="dialog" aria-modal="true" aria-label="Buscador de comandos" onKeyDown={tecla} className="vidrio-fuerte borde-neon aparece w-full max-w-xl overflow-hidden rounded-2xl shadow-pop">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <span className="text-brand-600"><Icono nombre="diagnostico" /></span>
          <input ref={entrada} autoFocus value={q} onChange={(e) => setQ(e.target.value)} role="combobox" aria-expanded aria-controls={lista} aria-activedescendant={visibles[activo] ? `${lista}-${activo}` : undefined}
            aria-label="Buscar pantallas, cláusulas y acciones" placeholder="Buscar pantallas, cláusulas y acciones…" className="h-14 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted/70 focus-visible:outline-none" />
          <kbd className="etiqueta-mono rounded border border-line px-1.5 py-0.5 text-[10px] text-muted">Esc</kbd>
        </div>
        <ul id={lista} role="listbox" aria-label="Resultados" className="max-h-[50vh] overflow-y-auto p-2">
          {visibles.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">Sin resultados para «{q}».</li>}
          {visibles.map((r, i) => (
            <li key={`${r.grupo}-${r.id}`} id={`${lista}-${i}`} role="option" aria-selected={i === activo}
              onMouseEnter={() => setActivo(i)} onClick={() => elegir(r)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${i === activo ? "bg-brand-50 text-brand-800 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.35)]" : "text-ink"}`}>
              <span className={i === activo ? "text-brand-600" : "text-muted"}><Icono nombre={r.icono} /></span>
              <span className="flex-1 truncate">{r.texto}</span>
              <span className="etiqueta-mono text-[10px] text-muted">{r.grupo}</span>
            </li>
          ))}
        </ul>
        <div className="etiqueta-mono flex gap-4 border-t border-line px-4 py-2 text-[10px] text-muted"><span>↑↓ moverse</span><span>↵ abrir</span><span>Esc cerrar</span></div>
      </div>
    </div>
  );
}
