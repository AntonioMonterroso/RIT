import {
  listarEmpresas, listarLeyes, listarRecordatoriosGlobales, publicarLey, publicarRecordatorio,
  retirarLey, retirarRecordatorio, type EmpresaResumen, type Ley, type Recordatorio,
} from "@/lib/biblioteca";
import { cargarBorrador } from "@/lib/almacen";
import type { Novedad } from "@/lib/novedades";
import { leerPlanLocal } from "@/lib/plan";
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
  listarNovedades(): Promise<Novedad[]>;
  publicarNovedad(n: Pick<Novedad, "titulo" | "resumen" | "capitulo" | "texto_sugerido" | "vigente_desde">): Promise<void>;
  retirarNovedad(id: string): Promise<void>;
  /** Estado de la suscripción de la empresa actual. */
  miPlan(): Promise<{ estado: string; pruebaHasta: string | null }>;
}

const K_LEYES = "rit:leyes:v1";
const K_RECS = "rit:recordatorios-globales:v1";
const K_NOVS = "rit:novedades:v1";

/** Novedades de ejemplo para la demostración local. Se identifican como ejemplo en el título. */
const NOVEDADES_EJEMPLO: Novedad[] = [
  { id: "ejemplo-teletrabajo", titulo: "Ejemplo: regular el trabajo a distancia", resumen: "Ejemplo de demostración de cómo llega una novedad. Si su empresa permite trabajo remoto, conviene dejarlo regulado en el reglamento.", capitulo: "mod_3", texto_sugerido: "El trabajo a distancia, cuando la empresa lo autorice por escrito, se regirá por el horario y las obligaciones de este reglamento. El trabajador conservará todos los derechos y obligaciones de su relación laboral y la empresa definirá los medios de comunicación y de control de la jornada.", vigente_desde: null, publicada_en: "2026-09-01T00:00:00.000Z" },
  { id: "ejemplo-acoso", titulo: "Ejemplo: prevención del acoso laboral", resumen: "Ejemplo de demostración. Una cláusula de prevención y canal de denuncias fortalece el reglamento.", capitulo: "mod_7", texto_sugerido: "Queda prohibido todo acto de acoso o maltrato hacia compañeros o subordinados. Cualquier trabajador podrá presentar su queja por escrito ante el área de personal, la cual será atendida con reserva y sin represalias.", vigente_desde: null, publicada_en: "2026-09-15T00:00:00.000Z" },
];

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
  async listarNovedades() {
    let guardadas: Novedad[] = [];
    try { const raw = localStorage.getItem(K_NOVS); guardadas = raw === null ? NOVEDADES_EJEMPLO : (JSON.parse(raw) as Novedad[]); } catch { guardadas = NOVEDADES_EJEMPLO; }
    return guardadas.sort((a, b) => b.publicada_en.localeCompare(a.publicada_en));
  },
  async publicarNovedad(n) {
    const actuales = await datosLocal.listarNovedades();
    escribir(K_NOVS, [...actuales, { id: id(), ...n, publicada_en: ahora() }]);
  },
  async retirarNovedad(i) { escribir(K_NOVS, (await datosLocal.listarNovedades()).filter((x) => x.id !== i)); },
  async miPlan() { const p = leerPlanLocal(); return { estado: p.estado, pruebaHasta: p.pruebaHasta }; },
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
    listarNovedades: async () => {
      const r = await db.from("novedades_legales").select("*").order("publicada_en", { ascending: false });
      if (r.error) throw new Error(`No se pudieron cargar las novedades: ${r.error.message}`);
      return (r.data ?? []) as Novedad[];
    },
    publicarNovedad: async (n) => {
      const r = await db.from("novedades_legales").insert({ titulo: n.titulo, resumen: n.resumen, capitulo: n.capitulo, texto_sugerido: n.texto_sugerido, vigente_desde: n.vigente_desde });
      if (r.error) throw new Error(`No se pudo publicar la novedad: ${r.error.message}`);
    },
    retirarNovedad: async (i) => {
      const r = await db.from("novedades_legales").delete().eq("id", i);
      if (r.error) throw new Error(`No se pudo retirar la novedad: ${r.error.message}`);
    },
    miPlan: async () => {
      const r = await db.from("empresas").select("estado_suscripcion, prueba_hasta").maybeSingle();
      const d = r.data as { estado_suscripcion: string; prueba_hasta: string | null } | null;
      return { estado: d?.estado_suscripcion ?? "inactiva", pruebaHasta: d?.prueba_hasta ?? null };
    },
  };
}

export function datos(): Datos {
  return clienteSupabase() ? datosSupabase() : datosLocal;
}
