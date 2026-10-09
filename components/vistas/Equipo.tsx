"use client";

import { useCallback, useEffect, useState } from "react";
import { useRit } from "@/components/EstadoProvider";
import { Aviso, Boton, Insignia, Pagina, Seleccion, Tarjeta } from "@/components/ui";
import { equipo, nombreRol, ROLES, type Invitacion, type Miembro, type Rol } from "@/lib/equipo";
import { clienteSupabase } from "@/lib/supabase/cliente";

const ACCIONES = [["ver", "Ver y descargar"], ["editar", "Redactar y editar"], ["aprobar", "Aprobar versiones"], ["administrar", "Invitar y gestionar el plan"]] as const;

export default function Equipo() {
  const { local, rol, cambiarRolDemo, permitido } = useRit();
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [invs, setInvs] = useState<Invitacion[]>([]);
  const [nuevoRol, setNuevoRol] = useState<Rol>("editor");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const admin = permitido("administrar");

  const cargar = useCallback(async () => {
    const db = clienteSupabase();
    if (!db) return;
    try {
      const api = equipo(db);
      setMiembros(await api.miembros());
      if (admin) setInvs(await api.invitaciones());
      setError("");
    } catch (x) { setError((x as Error).message); }
  }, [admin]);
  useEffect(() => { void cargar(); }, [cargar]);

  const hacer = async (f: () => Promise<unknown>) => { try { await f(); await cargar(); } catch (x) { setError((x as Error).message); } };
  const db = clienteSupabase();

  return (
    <Pagina titulo="Equipo y roles" descripcion="Cada persona entra con su propio acceso y solo puede hacer lo que su rol permite. Quien redacta no aprueba su propio texto.">
      {error && <Aviso tono="danger">{error}</Aviso>}

      <Tarjeta titulo="Qué puede hacer cada rol" relleno={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead><tr className="border-b border-line text-muted"><th className="px-5 py-2 font-semibold">Rol</th>{ACCIONES.map(([, t]) => <th key={t} className="px-2 py-2 text-center font-semibold">{t}</th>)}</tr></thead>
            <tbody>
              {ROLES.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-2.5"><b>{r.nombre}</b><span className="block text-xs text-muted">{r.resumen}</span></td>
                  {ACCIONES.map(([a, t]) => <td key={a} className="px-2 text-center" aria-label={`${r.nombre}: ${t}`}>{r.puede.includes(a) ? <span className="text-ok">✓</span> : <span className="text-muted/50">—</span>}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Tarjeta>

      {local && (
        <Tarjeta titulo="Probar el sistema con cada rol" descripcion="Vista de demostración: aún no hay cuentas conectadas. Cambie el rol para ver cómo trabaja cada persona.">
          <div className="max-w-xs" data-lectura-ok>
            <Seleccion etiqueta="Estoy trabajando como" value={rol} onChange={(e) => cambiarRolDemo(e.target.value as Rol)} data-lectura-ok>
              {ROLES.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </Seleccion>
          </div>
        </Tarjeta>
      )}

      {db && (
        <>
          <Tarjeta titulo="Personas con acceso" relleno={false}>
            <ul className="divide-y divide-line text-sm">
              {miembros.map((m) => (
                <li key={m.user_id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <span className="min-w-0 flex-1 font-medium">{m.nombre || "Sin nombre"}</span>
                  {admin ? (
                    <>
                      <select aria-label={`Rol de ${m.nombre || "persona"}`} value={m.rol} onChange={(e) => void hacer(() => equipo(db).cambiarRol(m.user_id, e.target.value as Rol))} className="rounded-lg border border-line bg-campo px-2 py-1 text-sm">
                        {ROLES.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                      </select>
                      <Boton pequeno variante="fantasma" onClick={() => { if (window.confirm(`¿Quitar el acceso de ${m.nombre || "esta persona"}?`)) void hacer(() => equipo(db).quitar(m.user_id)); }}>Quitar</Boton>
                    </>
                  ) : <Insignia>{nombreRol(m.rol)}</Insignia>}
                </li>
              ))}
              {miembros.length === 0 && <li className="px-5 py-3 text-muted">Cargando…</li>}
            </ul>
          </Tarjeta>

          {admin && (
            <Tarjeta titulo="Invitar a alguien" descripcion="Genera un código de un solo uso que vence en 7 días. La persona crea su cuenta y lo escribe en «Tengo un código de invitación».">
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-48"><Seleccion etiqueta="Rol" value={nuevoRol} onChange={(e) => setNuevoRol(e.target.value as Rol)}>{ROLES.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}</Seleccion></div>
                <Boton onClick={() => void hacer(async () => setCodigo(await equipo(db).invitar(nuevoRol)))}>Generar código</Boton>
              </div>
              {codigo && <Aviso tono="ok" className="mt-4" titulo="Código generado">Compártalo con la persona: <b className="etiqueta-mono text-base">{codigo}</b></Aviso>}
              <ul className="mt-4 divide-y divide-line text-sm">
                {invs.filter((i) => !i.usada_en).map((i) => (
                  <li key={i.id} className="flex items-center gap-3 py-2"><span className="etiqueta-mono">{i.codigo}</span><Insignia>{nombreRol(i.rol)}</Insignia><span className="flex-1 text-xs text-muted">vence {new Date(i.expira_en).toLocaleDateString("es-GT")}</span><Boton pequeno variante="fantasma" onClick={() => void hacer(() => equipo(db).revocar(i.id))}>Revocar</Boton></li>
                ))}
              </ul>
            </Tarjeta>
          )}
        </>
      )}
    </Pagina>
  );
}
