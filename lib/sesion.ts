import { repositorioLocal, repositorioSupabase, type Repositorio } from "@/lib/repositorio";
import { clienteSupabase } from "@/lib/supabase/cliente";

/**
 * Devuelve el repositorio de la empresa actual. Sin Supabase es el borrador local.
 * Devuelve `null` si hay Supabase pero no hay sesión o empresa: hay que ir a /acceso.
 */
export async function abrirRepositorio(): Promise<Repositorio | null> {
  const db = clienteSupabase();
  if (!db) return repositorioLocal;
  const { data: sesion } = await db.auth.getSession();
  if (!sesion.session) return null;
  const { data: perfil } = await db.from("perfiles").select("empresa_id").maybeSingle();
  return perfil?.empresa_id ? repositorioSupabase(db, perfil.empresa_id) : null;
}
