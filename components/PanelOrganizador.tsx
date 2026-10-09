"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { datos } from "@/lib/datos";
import type { EmpresaResumen, Ley, Recordatorio } from "@/lib/biblioteca";
import Marco from "./Marco";

const campo = "mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal";
const boton = "rounded bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60";

export default function PanelOrganizador() {
  const router = useRouter();
  const [leyes, setLeyes] = useState<Ley[]>([]);
  const [recs, setRecs] = useState<Recordatorio[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaResumen[]>([]);
  const [error, setError] = useState("");
  const [ley, setLey] = useState({ titulo: "", referencia: "", contenido: "" });
  const [rec, setRec] = useState({ titulo: "", detalle: "", fecha: "" });

  const refrescar = useCallback(async () => {
    try {
      const d = datos();
      const [l, r, e] = await Promise.all([d.listarLeyes(), d.listarRecordatorios(), d.listarEmpresas()]);
      setLeyes(l); setRecs(r); setEmpresas(e); setError("");
    } catch (x) { setError((x as Error).message); }
  }, []);

  useEffect(() => {
    (async () => {
      if (!(await datos().esOrganizador())) return router.replace("/acceso");
      void refrescar();
    })();
  }, [router, refrescar]);

  const accion = (f: () => Promise<unknown>) => async () => {
    try { await f(); await refrescar(); } catch (x) { setError((x as Error).message); }
  };

  return (
    <Marco titulo="Panel de administración" enlaces={[]}>
      {datos().local && (
        <p className="mb-4 rounded border border-sky-300 bg-sky-50 p-3 text-sm text-sky-900">
          Modo de prueba local: lo que publique aquí aparece en la biblioteca y el calendario de este mismo navegador.
        </p>
      )}
      {error && <p role="alert" className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-bold">Publicar ley en la biblioteca</h2>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void accion(async () => { await datos().publicarLey(ley); setLey({ titulo: "", referencia: "", contenido: "" }); })(); }}>
            <label className="block text-sm font-semibold">Título<input required value={ley.titulo} onChange={(e) => setLey({ ...ley, titulo: e.target.value })} className={campo} /></label>
            <label className="block text-sm font-semibold">Referencia<input value={ley.referencia} onChange={(e) => setLey({ ...ley, referencia: e.target.value })} className={campo} placeholder="Decreto 1441" /></label>
            <label className="block text-sm font-semibold">Texto<textarea required rows={6} value={ley.contenido} onChange={(e) => setLey({ ...ley, contenido: e.target.value })} className={campo} /></label>
            <button className={boton}>Publicar</button>
          </form>
          <ul className="divide-y divide-slate-100 text-sm">
            {leyes.map((l) => (
              <li key={l.id} className="flex items-center justify-between py-2">
                <span>{l.titulo}</span>
                <button onClick={accion(() => datos().retirarLey(l.id))} className="text-red-700 hover:underline">Retirar</button>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-bold">Recordatorios para todas las empresas</h2>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void accion(async () => { await datos().publicarRecordatorio(rec); setRec({ titulo: "", detalle: "", fecha: "" }); })(); }}>
            <label className="block text-sm font-semibold">Título<input required value={rec.titulo} onChange={(e) => setRec({ ...rec, titulo: e.target.value })} className={campo} /></label>
            <label className="block text-sm font-semibold">Detalle<input value={rec.detalle} onChange={(e) => setRec({ ...rec, detalle: e.target.value })} className={campo} /></label>
            <label className="block text-sm font-semibold">Fecha<input required type="date" value={rec.fecha} onChange={(e) => setRec({ ...rec, fecha: e.target.value })} className={campo} /></label>
            <button className={boton}>Crear recordatorio</button>
          </form>
          <ul className="divide-y divide-slate-100 text-sm">
            {recs.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2">
                <span><b>{r.fecha.split("-").reverse().join("/")}</b> · {r.titulo}</span>
                <button onClick={accion(() => datos().retirarRecordatorio(r.id))} className="text-red-700 hover:underline">Eliminar</button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-bold">Empresas</h2>
        <p className="mb-3 text-sm text-slate-600">Solo se muestran el nombre y el estado de la suscripción.</p>
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-slate-200 text-slate-500"><th className="py-2">Empresa</th><th>Estado</th><th>Alta</th></tr></thead>
          <tbody>
            {empresas.map((e) => (
              <tr key={e.id} className="border-b border-slate-100">
                <td className="py-2">{e.nombre}</td><td className="capitalize">{e.estado_suscripcion}</td>
                <td>{e.creada_en.slice(0, 10).split("-").reverse().join("/")}</td>
              </tr>
            ))}
            {empresas.length === 0 && <tr><td colSpan={3} className="py-3 text-slate-500">Aún no hay empresas.</td></tr>}
          </tbody>
        </table>
      </section>
    </Marco>
  );
}
