import {
  listarEmpresas, listarLeyes, listarRecordatoriosGlobales, publicarLey, publicarRecordatorio,
  retirarLey, retirarRecordatorio, type EmpresaResumen, type Ley, type Recordatorio,
} from "@/lib/biblioteca";
import { cargarBorrador } from "@/lib/almacen";
import { clienteSupabase } from "@/lib/supabase/cliente";

/**
 * Datos compartidos: biblioteca legal, recordatorios globales y lista de empresas.
 * Con Supabase vienen de la base; sin él se guardan en el navegador para poder probar
 * todo el flujo (el panel y las vistas de la empresa comparten el mismo navegador).
 */
export interface Datos {
  local: boolean;
  esOrganizador(): Promise<boolean>;
  listarLeyes(): Promise<Ley[]>;
  publicarLey(l: { titulo: string; referencia: string; contenido: string }): Promise<void>;
  retirarLey(id: string): Promise<void>;
  listarRecordatorios(): Promise<Recordatorio[]>;
  publicarRecordatorio(r: { titulo: string; detalle: string; fecha: string }): Promise<void>;
  retirarRecordatorio(id: string): Promise<void>;
  listarEmpresas(): Promise<EmpresaResumen[]>;
}

const K_LEYES = "rit:leyes:v1";
const K_RECS = "rit:recordatorios-globales:v1";

function leer<T>(clave: string): T[] {
  try { return JSON.parse(localStorage.getItem(clave) ?? "[]") as T[]; } catch { return []; }
}
function escribir(clave: string, v: unknown[]) {
  try { localStorage.setItem(clave, JSON.stringify(v)); } catch { /* almacenamiento no disponible */ }
}
const id = () => crypto.randomUUID();
const ahora = () => new Date().toISOString();

export const datosLocal: Datos = {
  local: true,
  async esOrganizador() { return true; },
  async listarLeyes() { return leer<Ley>(K_LEYES).sort((a, b) => a.titulo.localeCompare(b.titulo, "es")); },
  async publicarLey(l) {
    escribir(K_LEYES, [...leer<Ley>(K_LEYES), { id: id(), titulo: l.titulo, referencia: l.referencia || null, contenido: l.contenido, publicada_en: ahora() }]);
  },
  async retirarLey(i) { escribir(K_LEYES, leer<Ley>(K_LEYES).filter((x) => x.id !== i)); },
  async listarRecordatorios() { return leer<Recordatorio>(K_RECS).sort((a, b) => a.fecha.localeCompare(b.fecha)); },
  async publicarRecordatorio(r) {
    escribir(K_RECS, [...leer<Recordatorio>(K_RECS), { id: id(), titulo: r.titulo, detalle: r.detalle || null, fecha: r.fecha }]);
  },
  async retirarRecordatorio(i) { escribir(K_RECS, leer<Recordatorio>(K_RECS).filter((x) => x.id !== i)); },
  async listarEmpresas() {
    const e = cargarBorrador().empresa;
    return [{ id: "local", nombre: e.nombre_comercial || e.razon_social || "Mi empresa", estado_suscripcion: "prueba", creada_en: ahora() }];
  },
};

export function datosSupabase(): Datos {
  const db = clienteSupabase()!;
  return {
    local: false,
    async esOrganizador() {
      const { data } = await db.from("perfiles").select("rol").maybeSingle();
      return data?.rol === "organizador";
    },
    listarLeyes: () => listarLeyes(db),
    publicarLey: async (l) => { await publicarLey(db, l); },
    retirarLey: async (i) => { await retirarLey(db, i); },
    listarRecordatorios: () => listarRecordatoriosGlobales(db),
    publicarRecordatorio: async (r) => { await publicarRecordatorio(db, r); },
    retirarRecordatorio: async (i) => { await retirarRecordatorio(db, i); },
    listarEmpresas: () => listarEmpresas(db),
  };
}

export function datos(): Datos {
  return clienteSupabase() ? datosSupabase() : datosLocal;
}
