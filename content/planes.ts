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
    incluye: ["Diagnóstico y borrador de ~57 artículos", "Editor tipo Word y exportación .docx", "Auditoría de 16 criterios IGT", "Memorial, formatos y trámite", "Calendario de plazos y biblioteca legal", "Actualizaciones de las plantillas"],
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
