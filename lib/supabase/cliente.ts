import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CLAVE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Sin variables de entorno el sistema funciona en modo local (borrador en el navegador). */
export const supabaseConfigurado = Boolean(URL && CLAVE);

let instancia: SupabaseClient | null = null;

export function clienteSupabase(): SupabaseClient | null {
  if (!supabaseConfigurado) return null;
  instancia ??= createBrowserClient(URL!, CLAVE!);
  return instancia;
}
