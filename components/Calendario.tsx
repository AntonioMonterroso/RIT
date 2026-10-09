"use client";

import { useState } from "react";
import { useRit } from "@/components/EstadoProvider";
import { Boton, Insignia, Pagina, Tarjeta, Texto, Vacio } from "@/components/ui";
import { hoyISO } from "@/lib/avisos";

const fmt = (iso: string) => iso.split("-").reverse().join("/");

export default function Calendario() {
  const { avisos, actualizar, listo } = useRit();
  const [nuevo, setNuevo] = useState({ titulo: "", fecha: "" });
  const hoy = hoyISO();

  const agregar = (e: React.FormEvent) => {
    e.preventDefault();
    actualizar((s) => ({ ...s, recordatorios: [...s.recordatorios, { id: crypto.randomUUID(), titulo: nuevo.titulo.trim(), fecha: nuevo.fecha, hecho: false }] }));
    setNuevo({ titulo: "", fecha: "" });
  };

  return (
    <Pagina titulo="Calendario" descripcion="Plazos del reglamento, avisos generales y sus propios recordatorios.">
      <Tarjeta titulo="Nuevo recordatorio">
        <form onSubmit={agregar} className="flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1"><Texto required etiqueta="Qué hay que hacer" value={nuevo.titulo} onChange={(e) => setNuevo({ ...nuevo, titulo: e.target.value })} placeholder="Ej. Entregar memorial a la IGT" /></div>
          <div><Texto required etiqueta="Fecha" type="date" value={nuevo.fecha} onChange={(e) => setNuevo({ ...nuevo, fecha: e.target.value })} /></div>
          <Boton type="submit">Agregar</Boton>
        </form>
      </Tarjeta>

      {!listo ? <p role="status" className="text-sm text-muted">Cargando…</p> : avisos.length === 0 ? <Vacio titulo="No hay recordatorios por ahora" /> : (
        <ul className="space-y-2">
          {avisos.map((a) => {
            const vencido = !a.hecho && a.fecha < hoy;
            return (
              <li key={a.clave} className={`flex items-start gap-4 vidrio rounded-[var(--radius)] p-4 ${a.hecho ? "opacity-60" : ""} ${vencido ? "border-danger-line" : a.fecha === hoy ? "border-warn-line" : "border-line"}`}>
                {a.origen === "propio" && (
                  <input type="checkbox" aria-label={`Marcar como hecho: ${a.titulo}`} checked={!!a.hecho} className="mt-1 h-4 w-4 accent-[var(--brand-700)]"
                    onChange={(e) => actualizar((s) => ({ ...s, recordatorios: s.recordatorios.map((r) => (r.id === a.propioId ? { ...r, hecho: e.target.checked } : r)) }))} />
                )}
                <time dateTime={a.fecha} className="w-24 shrink-0 text-sm font-bold text-brand-700">{fmt(a.fecha)}</time>
                <div className="flex-1">
                  <p className={`flex flex-wrap items-center gap-2 font-semibold ${a.hecho ? "line-through" : ""}`}>
                    {a.titulo}
                    {a.fecha === hoy && !a.hecho && <Insignia tono="warn">Hoy</Insignia>}
                    {vencido && <Insignia tono="danger">Vencido</Insignia>}
                    {a.origen === "sistema" && <Insignia tono="info">Plazo del sistema</Insignia>}
                  </p>
                  {a.detalle && <p className="text-sm text-muted">{a.detalle}</p>}
                </div>
                {a.origen === "propio" && (
                  <Boton variante="fantasma" pequeno aria-label={`Eliminar: ${a.titulo}`} onClick={() => actualizar((s) => ({ ...s, recordatorios: s.recordatorios.filter((r) => r.id !== a.propioId) }))}>Eliminar</Boton>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Pagina>
  );
}
