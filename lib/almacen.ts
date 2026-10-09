import type { CapituloKey } from "@/content/capitulos";
import type { Nodo } from "@/lib/docx";
import { MEMORIAL_INICIAL, type DatosMemorial } from "@/lib/memorial";
import type { Aprobacion } from "@/lib/aprobaciones";
import { DIAGNOSTICO_INICIAL, TRAMITE_INICIAL, type Diagnostico, type Puesto, type Tramite } from "@/lib/tipos";

export interface Empresa {
  razon_social: string;
  nombre_comercial: string;
  nit: string;
  representante_legal: string;
  departamento: string;
}

export interface RecordatorioPropio { id: string; titulo: string; fecha: string; hecho: boolean }

export interface Version { id: string; etiqueta: string; fecha: string; capitulos: EstadoRit["capitulos"] }

/** Rutina mensual: por mes ("2026-10"), qué tareas se marcaron y cuándo se cerró el mes. */
export type Rutina = Record<string, { hechos: Record<string, boolean>; cerrada: string | null }>;
/** Novedades legales ya atendidas por la empresa. */
export type NovedadesAtendidas = Record<string, { estado: "aplicada" | "descartada"; fecha: string }>;

export interface EstadoRit {
  empresa: Empresa;
  capitulos: Partial<Record<CapituloKey, Nodo>>;
  manuales: Record<string, boolean>;
  memorial: DatosMemorial;
  publicacion: { fecha: string; medio: "" | "fijacion" | "folleto" | "ambos" };
  recordatorios: RecordatorioPropio[];
  versiones: Version[];
  diagnostico: Diagnostico;
  puestos: Puesto[];
  tramite: Tramite;
  aprobaciones: Aprobacion[];
  rutina: Rutina;
  novedades: NovedadesAtendidas;
  actualizado: string | null;
}

export const ESTADO_INICIAL: EstadoRit = {
  empresa: { razon_social: "", nombre_comercial: "", nit: "", representante_legal: "", departamento: "Guatemala" },
  capitulos: {},
  manuales: {},
  memorial: MEMORIAL_INICIAL,
  publicacion: { fecha: "", medio: "" },
  recordatorios: [],
  versiones: [],
  diagnostico: DIAGNOSTICO_INICIAL,
  puestos: [],
  tramite: TRAMITE_INICIAL,
  aprobaciones: [],
  rutina: {},
  novedades: {},
  actualizado: null,
};

const CLAVE = "rit:borrador:v1";

/** Completa con valores por defecto un estado parcial (borrador antiguo, respaldo importado). */
export function fusionar(p: Partial<EstadoRit>): EstadoRit {
  return {
    ...ESTADO_INICIAL, ...p,
    empresa: { ...ESTADO_INICIAL.empresa, ...p.empresa },
    memorial: { ...MEMORIAL_INICIAL, ...p.memorial },
    publicacion: { ...ESTADO_INICIAL.publicacion, ...p.publicacion },
    diagnostico: { ...DIAGNOSTICO_INICIAL, ...p.diagnostico },
    tramite: { ...TRAMITE_INICIAL, ...p.tramite },
    puestos: p.puestos ?? [],
    recordatorios: p.recordatorios ?? [],
    versiones: p.versiones ?? [],
    aprobaciones: p.aprobaciones ?? [],
    rutina: p.rutina ?? {},
    novedades: p.novedades ?? {},
    capitulos: p.capitulos ?? {},
    manuales: p.manuales ?? {},
  };
}

/** Borrador local. Se reemplaza por Supabase cuando exista la cuenta de la empresa. */
export function cargarBorrador(): EstadoRit {
  try {
    const raw = localStorage.getItem(CLAVE);
    return raw ? fusionar(JSON.parse(raw) as Partial<EstadoRit>) : ESTADO_INICIAL;
  } catch {
    return ESTADO_INICIAL;
  }
}

export function guardarBorrador(estado: EstadoRit): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ ...estado, actualizado: new Date().toISOString() }));
  } catch {
    // Almacenamiento no disponible (modo privado o lleno): se ignora.
  }
}
