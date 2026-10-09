"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { datos } from "@/lib/datos";
import { abrirRepositorio } from "@/lib/sesion";
import { ESTADO_INICIAL, type EstadoRit } from "@/lib/almacen";
import type { Recordatorio } from "@/lib/biblioteca";
import type { Repositorio } from "@/lib/repositorio";
import { construirAvisos, hoyISO } from "@/lib/avisos";
import Marco from "./Marco";

const fmt = (iso: string) => iso.split("-").reverse().join("/");

export default function Calendario() {
  const router = useRouter();
  const repo = useRef<Repositorio | null>(null);
  const [estado, setEstado] = useState<EstadoRit | null>(null);
  const [generales, setGenerales] = useState<Recordatorio[]>([]);
  const [error, setError] = useState("");
  const [nuevo, setNuevo] = useState({ titulo: "", fecha: "" });

  useEffect(() => {
    (async () => {
      try {
        const r = await abrirRepositorio();
        if (!r) return router.replace("/acceso");
        repo.current = r;
        const [e, g] = await Promise.all([r.cargar(), datos().listarRecordatorios()]);
        setEstado(e); setGenerales(g);
      } catch (x) { setError((x as Error).message); }
    })();
  }, [router]);

  const cambiar = useCallback(async (f: (s: EstadoRit) => EstadoRit) => {
    if (!estado || !repo.current) return;
    const siguiente = f(estado);
    setEstado(siguiente);
    try { await repo.current.guardar(siguiente); setError(""); } catch (x) { setError((x as Error).message); }
  }, [estado]);

  const agregar = (e: React.FormEvent) => {
    e.preventDefault();
    void cambiar((s) => ({ ...s, recordatorios: [...s.recordatorios, { id: crypto.randomUUID(), titulo: nuevo.titulo.trim(), fecha: nuevo.fecha, hecho: false }] }));
    setNuevo({ titulo: "", fecha: "" });
  };

  const avisos = estado ? construirAvisos(estado ?? ESTADO_INICIAL, generales) : null;
  const hoy = hoyISO();

  return (
    <Marco titulo="Calendario" enlaces={[{ href: "/editor", texto: "Constructor" }, { href: "/biblioteca", texto: "Biblioteca" }]}>
      <form onSubmit={agregar} className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <label className="min-w-48 flex-1 text-sm font-semibold">Nuevo recordatorio
          <input required value={nuevo.titulo} onChange={(e) => setNuevo({ ...nuevo, titulo: e.target.value })}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal" placeholder="Ej. Entregar memorial a la IGT" />
        </label>
        <label className="block text-sm font-semibold">Fecha
          <input required type="date" value={nuevo.fecha} onChange={(e) => setNuevo({ ...nuevo, fecha: e.target.value })}
            className="mt-1 rounded border border-slate-300 px-3 py-2 text-sm font-normal" />
        </label>
        <button className="rounded bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">Agregar</button>
      </form>

      {error && <p role="alert" className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {avisos === null && !error && <p className="text-sm text-slate-500" role="status">Cargando…</p>}
      {avisos?.length === 0 && <p className="text-sm text-slate-500">No hay recordatorios por ahora.</p>}
      <ul className="space-y-2">
        {avisos?.map((a) => {
          const vencido = !a.hecho && a.fecha < hoy;
          return (
            <li key={a.clave} className={`flex items-start gap-4 rounded-lg border bg-white p-4 ${a.hecho ? "opacity-60" : ""} ${vencido ? "border-red-300" : a.fecha === hoy ? "border-amber-400" : "border-slate-200"}`}>
              {a.origen === "propio" && (
                <input type="checkbox" aria-label={`Marcar como hecho: ${a.titulo}`} checked={!!a.hecho} className="mt-1 h-4 w-4"
                  onChange={(e) => void cambiar((s) => ({ ...s, recordatorios: s.recordatorios.map((r) => r.id === a.propioId ? { ...r, hecho: e.target.checked } : r) }))} />
              )}
              <time dateTime={a.fecha} className="w-24 shrink-0 text-sm font-bold text-[var(--primary)]">{fmt(a.fecha)}</time>
              <div className="flex-1">
                <p className={`font-semibold ${a.hecho ? "line-through" : ""}`}>
                  {a.titulo}
                  {a.fecha === hoy && !a.hecho && <span className="ml-2 rounded bg-amber-100 px-1.5 text-xs text-amber-800">Hoy</span>}
                  {vencido && <span className="ml-2 rounded bg-red-100 px-1.5 text-xs text-red-800">Vencido</span>}
                </p>
                {a.detalle && <p className="text-sm text-slate-600">{a.detalle}</p>}
              </div>
              {a.origen === "propio" && (
                <button className="text-sm text-red-700 hover:underline" aria-label={`Eliminar: ${a.titulo}`}
                  onClick={() => void cambiar((s) => ({ ...s, recordatorios: s.recordatorios.filter((r) => r.id !== a.propioId) }))}>
                  Eliminar
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </Marco>
  );
}
