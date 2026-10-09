import type { SupabaseClient } from "@supabase/supabase-js";

export interface Ley { id: string; titulo: string; referencia: string | null; contenido: string; publicada_en: string }
export interface Recordatorio { id: string; titulo: string; detalle: string | null; fecha: string }
export interface EmpresaResumen { id: string; nombre: string; estado_suscripcion: string; creada_en: string }

type Db = Pick<SupabaseClient, "from">;

function ok<T>(r: { data: T | null; error: { message: string } | null }, que: string): T {
  if (r.error) throw new Error(`${que}: ${r.error.message}`);
  return (r.data ?? ([] as unknown)) as T;
}

export const listarLeyes = async (db: Db) =>
  ok<Ley[]>(await db.from("biblioteca_leyes").select("*").order("titulo"), "No se pudo cargar la biblioteca");

export const listarRecordatoriosGlobales = async (db: Db) =>
  ok<Recordatorio[]>(await db.from("recordatorios_globales").select("*").order("fecha"), "No se pudo cargar el calendario");

// Solo el organizador puede escribir; las políticas RLS lo hacen cumplir en la base.
export const publicarLey = async (db: Db, l: { titulo: string; referencia: string; contenido: string }) =>
  ok(await db.from("biblioteca_leyes").insert({ titulo: l.titulo, referencia: l.referencia || null, contenido: l.contenido }), "No se pudo publicar la ley");

export const retirarLey = async (db: Db, id: string) =>
  ok(await db.from("biblioteca_leyes").delete().eq("id", id), "No se pudo retirar la ley");

export const publicarRecordatorio = async (db: Db, r: { titulo: string; detalle: string; fecha: string }) =>
  ok(await db.from("recordatorios_globales").insert({ titulo: r.titulo, detalle: r.detalle || null, fecha: r.fecha }), "No se pudo crear el recordatorio");

export const retirarRecordatorio = async (db: Db, id: string) =>
  ok(await db.from("recordatorios_globales").delete().eq("id", id), "No se pudo eliminar el recordatorio");

// El organizador ve únicamente nombre y estado de suscripción de cada empresa.
export const listarEmpresas = async (db: Db) =>
  ok<EmpresaResumen[]>(await db.from("empresas").select("id, nombre, estado_suscripcion, creada_en").order("nombre"), "No se pudo cargar las empresas");
