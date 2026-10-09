"use client";

import { useEffect, useState } from "react";
import { clienteSupabase } from "@/lib/supabase/cliente";
import { listarRecordatoriosGlobales, type Recordatorio } from "@/lib/biblioteca";
import { fechaVigencia } from "@/lib/fechas";
import { cargarBorrador } from "@/lib/almacen";
import Marco from "./Marco";

interface Aviso { clave: string; titulo: string; detalle?: string | null; fecha: string }

const fmt = (iso: string) => iso.split("-").reverse().join("/");
const hoyISO = () => new Date().toISOString().slice(0, 10);

export default function Calendario() {
  const [avisos, setAvisos] = useState<Aviso[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const db = clienteSupabase();
      const propios: Aviso[] = [];
      let globales: Recordatorio[] = [];
      try {
        if (db) {
          globales = await listarRecordatoriosGlobales(db);
          const { data } = await db.from("publicaciones").select("fecha").maybeSingle();
          if (data?.fecha) propios.push({ clave: "vig", titulo: "Entrada en vigor del RIT", detalle: "15 días después de darlo a conocer (Art. 59)", fecha: fechaVigencia(data.fecha) });
        } else {
          const p = cargarBorrador().publicacion;
          if (p.fecha) propios.push({ clave: "vig", titulo: "Entrada en vigor del RIT", detalle: "15 días después de darlo a conocer (Art. 59)", fecha: fechaVigencia(p.fecha) });
        }
        setAvisos([...propios, ...globales.map((g) => ({ clave: g.id, titulo: g.titulo, detalle: g.detalle, fecha: g.fecha }))]
          .sort((a, b) => a.fecha.localeCompare(b.fecha)));
      } catch (e) { setError((e as Error).message); }
    })();
  }, []);

  const hoy = hoyISO();
  return (
    <Marco titulo="Calendario" enlaces={[{ href: "/editor", texto: "Constructor" }, { href: "/biblioteca", texto: "Biblioteca" }]}>
      {error && <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {avisos === null && !error && <p className="text-sm text-slate-500" role="status">Cargando…</p>}
      {avisos?.length === 0 && <p className="text-sm text-slate-500">No hay recordatorios por ahora.</p>}
      <ul className="space-y-2">
        {avisos?.map((a) => {
          const pasado = a.fecha < hoy;
          return (
            <li key={a.clave} className={`flex gap-4 rounded-lg border bg-white p-4 ${pasado ? "border-slate-200 opacity-60" : a.fecha === hoy ? "border-amber-400" : "border-slate-200"}`}>
              <time dateTime={a.fecha} className="w-24 shrink-0 text-sm font-bold text-[var(--primary)]">{fmt(a.fecha)}</time>
              <div>
                <p className="font-semibold">{a.titulo}{a.fecha === hoy && <span className="ml-2 rounded bg-amber-100 px-1.5 text-xs text-amber-800">Hoy</span>}</p>
                {a.detalle && <p className="text-sm text-slate-600">{a.detalle}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </Marco>
  );
}
