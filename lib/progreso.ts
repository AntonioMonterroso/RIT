import { CAPITULOS } from "@/content/capitulos";
import { auditar } from "@/lib/auditoria";
import type { EstadoRit } from "@/lib/almacen";
import { capitulosQueCumplen, pendientesTotales } from "@/lib/revision";
import type { EstadoTramite } from "@/lib/tipos";

export interface Paso {
  id: string;
  titulo: string;
  descripcion: string;
  href: string;
  /** 0 a 1 */
  avance: number;
  hecho: boolean;
  detalle: string;
}

const AVANCE_TRAMITE: Record<EstadoTramite, number> = { sin_iniciar: 0, presentado: 0.4, con_previo: 0.6, aprobado: 1 };

/** Campos que el memorial necesita; la razón social y el representante se heredan de la empresa. */
const camposMemorial = (e: EstadoRit) => [
  e.memorial.razon_social || e.empresa.razon_social,
  e.memorial.rep_nombre || e.empresa.representante_legal,
  e.memorial.rep_dpi, e.memorial.direccion, e.memorial.lugar_fecha,
];
export const memorialCompleto = (e: EstadoRit) => camposMemorial(e).every(Boolean);

/** Criterios que el sistema comprueba por su cuenta, además de los capítulos. */
export function externosAuditoria(e: EstadoRit): Record<string, boolean> {
  const mod9 = JSON.stringify(e.capitulos.mod_9 ?? "");
  return {
    A3: memorialCompleto(e),
    D1: /quince d[ií]as|15 d[ií]as/i.test(mod9),
    D2: /sitios (m[aá]s )?visibles|folleto|ejemplar/i.test(mod9),
  };
}

export function pasos(e: EstadoRit): Paso[] {
  const cumplen = capitulosQueCumplen(e.capitulos);
  const pend = pendientesTotales(e.capitulos);
  const aud = auditar(e.capitulos, e.manuales, externosAuditoria(e));
  const empresaOk = [e.empresa.razon_social, e.empresa.nit, e.empresa.representante_legal].filter(Boolean).length;
  const memo = camposMemorial(e).filter(Boolean).length;
  const pub = [e.publicacion.fecha, e.publicacion.medio].filter(Boolean).length;

  return [
    { id: "diagnostico", titulo: "Diagnóstico de la empresa", descripcion: "Giro, horario y operación para personalizar el reglamento.", href: "/diagnostico",
      avance: e.diagnostico.completo ? 1 : 0, hecho: e.diagnostico.completo, detalle: e.diagnostico.completo ? "Completado" : "Pendiente" },
    { id: "empresa", titulo: "Datos de la empresa", descripcion: "Razón social, NIT y representante legal.", href: "/ajustes",
      avance: empresaOk / 3, hecho: empresaOk === 3, detalle: `${empresaOk} de 3 datos` },
    { id: "puestos", titulo: "Puestos y responsabilidades", descripcion: "Defina 3 a 5 puestos clave con su custodia de bienes.", href: "/puestos",
      avance: Math.min(e.puestos.length / 3, 1), hecho: e.puestos.length >= 3, detalle: `${e.puestos.length} puesto(s)` },
    { id: "redaccion", titulo: "Redacción del reglamento", descripcion: "Los 9 capítulos y el anexo de puestos.", href: "/editor",
      avance: cumplen / CAPITULOS.length, hecho: cumplen === CAPITULOS.length && pend === 0,
      detalle: pend > 0 ? `${cumplen} de ${CAPITULOS.length} capítulos; ${pend} dato(s) por completar` : `${cumplen} de ${CAPITULOS.length} capítulos` },
    { id: "auditoria", titulo: "Auditoría IGT", descripcion: "Verifique los 16 criterios antes de presentar.", href: "/auditoria",
      avance: aud.porcentaje / 100, hecho: aud.porcentaje >= 90, detalle: `${aud.porcentaje}% de cumplimiento` },
    { id: "memorial", titulo: "Memorial de solicitud", descripcion: "Escrito dirigido al Inspector General de Trabajo.", href: "/memorial",
      avance: memo / 5, hecho: memorialCompleto(e), detalle: memorialCompleto(e) ? "Listo para descargar" : "Faltan datos" },
    { id: "tramite", titulo: "Trámite ante la IGT", descripcion: "Presentación, previos y aprobación.", href: "/tramite",
      avance: AVANCE_TRAMITE[e.tramite.estado], hecho: e.tramite.estado === "aprobado",
      detalle: ({ sin_iniciar: "Sin iniciar", presentado: "Presentado", con_previo: "Con previo por atender", aprobado: "Aprobado" } as const)[e.tramite.estado] },
    { id: "publicidad", titulo: "Publicidad y vigencia", descripcion: "Dar a conocer el reglamento 15 días antes de que rija.", href: "/publicidad",
      avance: pub / 2, hecho: pub === 2, detalle: pub === 2 ? "Registrada" : "Pendiente" },
  ];
}

export const avanceGeneral = (p: Paso[]) => Math.round((p.reduce((s, x) => s + x.avance, 0) / p.length) * 100);
export const siguientePaso = (p: Paso[]) => p.find((x) => !x.hecho) ?? null;
