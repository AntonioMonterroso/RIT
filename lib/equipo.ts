import type { SupabaseClient } from "@supabase/supabase-js";

export type Rol = "empresa_admin" | "editor" | "revisor" | "lector";
export type Accion = "ver" | "editar" | "aprobar" | "administrar";

export interface InfoRol { id: Rol; nombre: string; resumen: string; puede: Accion[] }

export const ROLES: InfoRol[] = [
  { id: "empresa_admin", nombre: "Administrador", resumen: "Todo: redacta, aprueba, invita personas y gestiona el plan.", puede: ["ver", "editar", "aprobar", "administrar"] },
  { id: "editor", nombre: "Redactor", resumen: "Redacta y edita el reglamento. No aprueba su propio texto.", puede: ["ver", "editar"] },
  { id: "revisor", nombre: "Revisor", resumen: "Revisa y aprueba versiones con constancia. No modifica el texto.", puede: ["ver", "aprobar"] },
  { id: "lector", nombre: "Lector", resumen: "Consulta y descarga. Útil para gerencia o asesores externos.", puede: ["ver"] },
];

export const nombreRol = (r: Rol) => ROLES.find((x) => x.id === r)?.nombre ?? r;
export const puede = (rol: Rol, accion: Accion) => ROLES.find((x) => x.id === rol)?.puede.includes(accion) ?? false;

export interface Miembro { user_id: string; rol: Rol; nombre: string }
export interface Invitacion { id: string; rol: Rol; codigo: string; expira_en: string; usada_en: string | null }

type Db = Pick<SupabaseClient, "from" | "rpc">;

const falla = (e: { message: string } | null, que: string) => { if (e) throw new Error(`${que}: ${e.message}`); };

export const equipo = (db: Db) => ({
  async miembros(): Promise<Miembro[]> {
    const { data, error } = await db.from("perfiles").select("user_id, rol, nombre").not("empresa_id", "is", null);
    falla(error, "No se pudo cargar el equipo");
    return ((data ?? []) as Miembro[]).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  },
  async invitaciones(): Promise<Invitacion[]> {
    const { data, error } = await db.from("invitaciones").select("id, rol, codigo, expira_en, usada_en").order("creada_en", { ascending: false });
    falla(error, "No se pudieron cargar las invitaciones");
    return (data ?? []) as Invitacion[];
  },
  async invitar(rol: Rol): Promise<string> {
    const { data, error } = await db.rpc("crear_invitacion", { p_rol: rol });
    falla(error, "No se pudo invitar");
    return data as string;
  },
  async revocar(id: string) { falla((await db.from("invitaciones").delete().eq("id", id)).error, "No se pudo revocar"); },
  async cambiarRol(user: string, rol: Rol) { falla((await db.rpc("cambiar_rol", { p_user: user, p_rol: rol })).error, "No se pudo cambiar el rol"); },
  async quitar(user: string) { falla((await db.rpc("quitar_miembro", { p_user: user })).error, "No se pudo quitar a la persona"); },
});
