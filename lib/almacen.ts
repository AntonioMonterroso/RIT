import type { CapituloKey } from "@/content/capitulos";
import type { Nodo } from "@/lib/docx";

export interface Empresa {
  razon_social: string;
  nombre_comercial: string;
  nit: string;
  representante_legal: string;
  departamento: string;
}

export interface EstadoRit {
  empresa: Empresa;
  capitulos: Partial<Record<CapituloKey, Nodo>>;
  manuales: Record<string, boolean>;
  actualizado: string | null;
}

export const ESTADO_INICIAL: EstadoRit = {
  empresa: { razon_social: "", nombre_comercial: "", nit: "", representante_legal: "", departamento: "Guatemala" },
  capitulos: {},
  manuales: {},
  actualizado: null,
};

const CLAVE = "rit:borrador:v1";

/** Borrador local. Se reemplaza por Supabase cuando exista la cuenta de la empresa. */
export function cargarBorrador(): EstadoRit {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (!raw) return ESTADO_INICIAL;
    const p = JSON.parse(raw) as Partial<EstadoRit>;
    return { ...ESTADO_INICIAL, ...p, empresa: { ...ESTADO_INICIAL.empresa, ...p.empresa } };
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
