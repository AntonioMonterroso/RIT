import type { NombreIcono } from "@/components/Iconos";

export interface Destino {
  href: string;
  texto: string;
  icono: NombreIcono;
  /** Palabras extra para el buscador de comandos. */
  claves?: string;
}

export const INICIO: Destino = { href: "/inicio", texto: "Inicio", icono: "inicio", claves: "panel avance resumen" };

export const PROCESO: Destino[] = [
  { href: "/diagnostico", texto: "Diagnóstico", icono: "diagnostico", claves: "giro horario jornada generar borrador" },
  { href: "/importar", texto: "Importar RIT", icono: "importar", claves: "subir word existente documento pegar brechas" },
  { href: "/puestos", texto: "Puestos", icono: "puestos", claves: "anexo responsabilidades custodia" },
  { href: "/editor", texto: "Redacción", icono: "redaccion", claves: "editor capítulos artículos escribir" },
  { href: "/vista-previa", texto: "Vista previa", icono: "vista", claves: "documento completo índice imprimir pdf" },
  { href: "/auditoria", texto: "Auditoría IGT", icono: "auditoria", claves: "criterios checklist cumplimiento" },
  { href: "/memorial", texto: "Memorial", icono: "memorial", claves: "solicitud inspector escrito" },
  { href: "/tramite", texto: "Trámite IGT", icono: "tramite", claves: "presentado previo aprobado expediente" },
  { href: "/publicidad", texto: "Publicidad y vigencia", icono: "publicidad", claves: "15 días entrada en vigor" },
];

export const RECURSOS: Destino[] = [
  { href: "/plantillas", texto: "Cláusulas", icono: "plantillas", claves: "plantillas biblioteca artículos" },
  { href: "/formatos", texto: "Formatos", icono: "formatos", claves: "constancia acta comunicado reforma" },
  { href: "/versiones", texto: "Versiones", icono: "versiones", claves: "historial restaurar copia anterior" },
  { href: "/biblioteca", texto: "Biblioteca legal", icono: "biblioteca", claves: "leyes código de trabajo" },
  { href: "/calendario", texto: "Calendario", icono: "calendario", claves: "recordatorios plazos avisos" },
  { href: "/ayuda", texto: "Ayuda", icono: "ayuda", claves: "preguntas frecuentes glosario dudas" },
];

export const CUMPLIMIENTO: Destino[] = [
  { href: "/novedades", texto: "Novedades legales", icono: "novedades", claves: "cambios ley actualizar reforma aplicar" },
  { href: "/cumplimiento", texto: "Rutina y bitácora", icono: "rutina", claves: "mensual salud informe historial racha revisión anual" },
  { href: "/seguridad", texto: "Seguridad y salud", icono: "seguridad", claves: "sso comité plan 229-2014 epp capacitación emergencias" },
  { href: "/aprobaciones", texto: "Aprobaciones", icono: "aprobacion", claves: "acta aprobar constancia revisor huella firma interna" },
];

export const CUENTA: Destino[] = [
  { href: "/equipo", texto: "Equipo y roles", icono: "equipo", claves: "invitar usuarios editor revisor lector permisos" },
  { href: "/plan", texto: "Plan y suscripción", icono: "plan", claves: "pago mensualidad prueba precio activar" },
];

export const AJUSTES: Destino = { href: "/ajustes", texto: "Ajustes y respaldo", icono: "ajustes", claves: "empresa datos copia seguridad restaurar" };

export const TODOS: Destino[] = [INICIO, ...PROCESO, ...CUMPLIMIENTO, ...RECURSOS, ...CUENTA, AJUSTES];

/** Minúsculas y sin acentos, para comparar texto en el buscador. */
export const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
