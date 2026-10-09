import { repositorioLocal, repositorioSupabase, type Repositorio } from "@/lib/repositorio";
import type { Rol } from "@/lib/equipo";
import { clienteSupabase } from "@/lib/supabase/cliente";

export interface Sesion { repo: Repositorio; rol: Rol; local: boolean }

const K_ROL_DEMO = "rit:rol-demo";

/** Solo modo local: permite probar cómo se ve el sistema con cada rol. */
export function leerRolDemo(): Rol {
  try {
    const r = localStorage.getItem(K_ROL_DEMO);
    if (r === "editor" || r === "revisor" || r === "lector" || r === "empresa_admin") return r;
  } catch { /* sin almacenamiento */ }
  return "empresa_admin";
}
export function fijarRolDemo(r: Rol) { try { localStorage.setItem(K_ROL_DEMO, r); } catch { /* sin almacenamiento */ } }

/**
 * Devuelve el repositorio y el rol de la persona en su empresa. Sin Supabase es el borrador local.
 * Devuelve `null` si hay Supabase pero no hay sesión o empresa: hay que ir a /acceso.
 */
export async function abrirSesion(): Promise<Sesion | null> {
  const db = clienteSupabase();
  if (!db) return { repo: repositorioLocal, rol: leerRolDemo(), local: true };
  const { data: sesion } = await db.auth.getSession();
  if (!sesion.session) return null;
  const { data: perfil } = await db.from("perfiles").select("empresa_id, rol").maybeSingle();
  if (!perfil?.empresa_id) return null;
  return { repo: repositorioSupabase(db, perfil.empresa_id), rol: perfil.rol as Rol, local: false };
}

export async function abrirRepositorio(): Promise<Repositorio | null> {
  return (await abrirSesion())?.repo ?? null;
}
