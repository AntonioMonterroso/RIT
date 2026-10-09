"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { datos } from "@/lib/datos";
import type { EmpresaResumen, Ley, Recordatorio } from "@/lib/biblioteca";
import { clienteSupabase, supabaseConfigurado } from "@/lib/supabase/cliente";
import { Aviso, AreaTexto, Boton, Insignia, Pagina, Tarjeta, Texto } from "./ui";

const fmt = (iso: string) => iso.split("-").reverse().join("/");
const TONO_ESTADO = { prueba: "info", activa: "ok", morosa: "warn", cancelada: "danger", inactiva: "neutro" } as const;

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

  const accion = async (f: () => Promise<unknown>) => { try { await f(); await refrescar(); } catch (x) { setError((x as Error).message); } };
  const salir = async () => { await clienteSupabase()?.auth.signOut(); router.replace("/acceso"); };

  return (
    <div className="min-h-screen">
      <header className="flex h-14 items-center justify-between vidrio-fuerte border-x-0 border-t-0 px-5 md:px-8">
        <p className="text-sm font-bold">RIT Guatemala · Administración</p>
        <div className="flex gap-2">
          {datos().local && <Boton variante="secundario" pequeno onClick={() => router.push("/inicio")}>Ver como empresa</Boton>}
          {supabaseConfigurado && <Boton variante="fantasma" pequeno onClick={salir}>Salir</Boton>}
        </div>
      </header>
      <Pagina titulo="Panel de administración" descripcion="Publique leyes y recordatorios para todas las empresas. No tiene acceso al contenido de sus reglamentos." ancho="max-w-6xl">
        {datos().local && <Aviso tono="info">Modo de prueba local: lo que publique aquí aparece en la biblioteca y el calendario de este mismo navegador.</Aviso>}
        {error && <Aviso tono="danger">{error}</Aviso>}

        <div className="grid gap-5 md:grid-cols-2">
          <Tarjeta titulo="Publicar ley en la biblioteca">
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void accion(async () => { await datos().publicarLey(ley); setLey({ titulo: "", referencia: "", contenido: "" }); }); }}>
              <Texto etiqueta="Título" required value={ley.titulo} onChange={(e) => setLey({ ...ley, titulo: e.target.value })} />
              <Texto etiqueta="Referencia" value={ley.referencia} onChange={(e) => setLey({ ...ley, referencia: e.target.value })} placeholder="Decreto 1441" />
              <AreaTexto etiqueta="Texto" required rows={6} value={ley.contenido} onChange={(e) => setLey({ ...ley, contenido: e.target.value })} />
              <Boton type="submit">Publicar</Boton>
            </form>
            <ul className="mt-4 divide-y divide-line text-sm">
              {leyes.map((l) => (
                <li key={l.id} className="flex items-center justify-between py-2"><span>{l.titulo}</span><Boton variante="fantasma" pequeno onClick={() => void accion(() => datos().retirarLey(l.id))}>Retirar</Boton></li>
              ))}
            </ul>
          </Tarjeta>

          <Tarjeta titulo="Recordatorios para todas las empresas">
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void accion(async () => { await datos().publicarRecordatorio(rec); setRec({ titulo: "", detalle: "", fecha: "" }); }); }}>
              <Texto etiqueta="Título" required value={rec.titulo} onChange={(e) => setRec({ ...rec, titulo: e.target.value })} />
              <Texto etiqueta="Detalle" value={rec.detalle} onChange={(e) => setRec({ ...rec, detalle: e.target.value })} />
              <Texto etiqueta="Fecha" type="date" required value={rec.fecha} onChange={(e) => setRec({ ...rec, fecha: e.target.value })} />
              <Boton type="submit">Crear recordatorio</Boton>
            </form>
            <ul className="mt-4 divide-y divide-line text-sm">
              {recs.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2"><span><b>{fmt(r.fecha)}</b> · {r.titulo}</span><Boton variante="fantasma" pequeno onClick={() => void accion(() => datos().retirarRecordatorio(r.id))}>Eliminar</Boton></li>
              ))}
            </ul>
          </Tarjeta>
        </div>

        <Tarjeta titulo="Empresas" descripcion="Solo se muestran el nombre y el estado de la suscripción." relleno={false}>
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-line text-muted"><th className="px-5 py-2 font-semibold">Empresa</th><th className="font-semibold">Estado</th><th className="font-semibold">Alta</th></tr></thead>
            <tbody>
              {empresas.map((e) => (
                <tr key={e.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-2.5">{e.nombre}</td>
                  <td><Insignia tono={TONO_ESTADO[e.estado_suscripcion as keyof typeof TONO_ESTADO] ?? "neutro"}>{e.estado_suscripcion}</Insignia></td>
                  <td>{fmt(e.creada_en.slice(0, 10))}</td>
                </tr>
              ))}
              {empresas.length === 0 && <tr><td colSpan={3} className="px-5 py-4 text-muted">Aún no hay empresas.</td></tr>}
            </tbody>
          </table>
        </Tarjeta>
      </Pagina>
    </div>
  );
}
