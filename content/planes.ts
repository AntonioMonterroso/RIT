// Planes y precios de la portada. Edite aquí; la portada lee solo este archivo.
// IMPORTANTE: los montos son EJEMPLOS. Mientras `precioConfirmado` sea false, la portada lo avisa.
// Cuando se conecte Stripe, cada plan tendrá su identificador de precio (stripePriceId).

export const precioConfirmado = false;
export const moneda = "Q";

export interface Plan {
  id: "empresa" | "despacho" | "corporativo";
  nombre: string;
  para: string;
  precio: number | null;          // null = a la medida
  unidad: string;
  destacado?: boolean;
  incluye: string[];
  stripePriceId?: string;
}

export const PLANES: Plan[] = [
  {
    id: "empresa", nombre: "Empresa", para: "Una empresa que necesita su RIT aprobado y vigente.",
    precio: 450, unidad: "por mes", destacado: true,
    incluye: ["Diagnóstico y borrador de ~57 artículos", "Editor tipo Word y exportación .docx", "Auditoría de 16 criterios IGT", "Memorial, formatos y trámite", "Calendario de plazos y biblioteca legal", "Novedades legales con aplicación guiada", "Rutina mensual, bitácora e informe de cumplimiento", "Equipo con roles y aprobaciones con huella digital"],
  },
  {
    id: "despacho", nombre: "Despacho", para: "Consultoras y escuelas que atienden a varias empresas.",
    precio: 300, unidad: "por empresa al mes (desde 5 empresas)",
    incluye: ["Todo lo del plan Empresa, por cada cliente", "Publique leyes y recordatorios para todas", "Panel con el estado de cada suscripción", "Sin acceso al contenido de sus clientes"],
  },
  {
    id: "corporativo", nombre: "Corporativo", para: "Grupos con muchas sedes o necesidades propias.",
    precio: null, unidad: "a la medida",
    incluye: ["Varias razones sociales y sedes", "Cláusulas y formatos propios", "Acompañamiento en la implementación"],
  },
];

/** Siempre disponible, aunque el plan no esté activo: el trabajo de la empresa nunca queda retenido. */
export const SIEMPRE_DISPONIBLE = [
  "Ver todo su reglamento y su vista previa",
  "Descargar el RIT en Word, los formatos y el memorial",
  "Descargar el respaldo completo de sus datos",
  "Consultar la biblioteca legal",
];

/** Lo que el plan activo mantiene vivo. */
export const REQUIERE_PLAN = [
  "Editar y regenerar el reglamento",
  "Novedades legales con su impacto en su texto",
  "Rutina mensual, bitácora e informe de cumplimiento",
  "Aprobaciones internas y trabajo en equipo con roles",
  "Versiones, importación y plantillas",
  "Recordatorios y avisos de plazos",
];
