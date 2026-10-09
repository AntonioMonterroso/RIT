import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import type { EstadoRit } from "@/lib/almacen";
import { auditar } from "@/lib/auditoria";
import { estadoAprobacion } from "@/lib/aprobaciones";
import { bitacora } from "@/lib/bitacora";
import { CRITERIOS } from "@/content/checklist";
import { falta } from "@/content/plantillas";
import { externosAuditoria } from "@/lib/progreso";
import type { Novedad } from "@/lib/novedades";
import { racha } from "@/lib/rutina";
import { salud } from "@/lib/salud";

const F = "Times New Roman";
const t = (text: string, o: { bold?: boolean; size?: number; italics?: boolean } = {}) => new TextRun({ text, font: F, size: o.size ?? 22, bold: o.bold, italics: o.italics });
const p = (text: string, o: { bold?: boolean; centro?: boolean; italics?: boolean } = {}) =>
  new Paragraph({ alignment: o.centro ? AlignmentType.CENTER : AlignmentType.LEFT, spacing: { after: 120 }, children: [t(text, o)] });
const h = (text: string) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 120 }, children: [t(text, { bold: true, size: 26 })] });

const fecha = (iso: string) => (iso ? new Date(iso).toLocaleDateString("es-GT", { dateStyle: "long" }) : "—");

/** Informe de cumplimiento: estado actual y bitácora. Es un resumen interno, no un dictamen legal. */
export function informeCumplimiento(e: EstadoRit, novedades: Novedad[] = [], ahora: Date = new Date()): Document {
  const aud = auditar(e.capitulos, e.manuales, externosAuditoria(e));
  const apr = estadoAprobacion(e);
  const s = salud(e, novedades, ahora);
  const nombre = falta(e.empresa.razon_social || e.empresa.nombre_comercial, "razón social");
  const hijos: Paragraph[] = [
    p(nombre.toUpperCase(), { bold: true, centro: true }),
    p("INFORME DE CUMPLIMIENTO DEL REGLAMENTO INTERIOR DE TRABAJO", { bold: true, centro: true }),
    p(`Emitido el ${fecha(ahora.toISOString())}`, { centro: true, italics: true }),

    h("1. Estado general"),
    p(`Salud del reglamento: ${s.puntos}% de los controles de mantenimiento al día.`),
    p(`Criterios de la IGT cubiertos: ${aud.marcados} de ${aud.total} (${aud.porcentaje}%).`),
    p(`Trámite ante la IGT: ${{ sin_iniciar: "sin iniciar", presentado: "presentado", con_previo: "con previo", aprobado: "aprobado" }[e.tramite.estado]}${e.tramite.expediente ? `, expediente ${e.tramite.expediente}` : ""}.`),
    p(`Aprobación interna del texto vigente: ${apr.estado === "aprobado" ? `vigente (${apr.ultima.nombre}, ${fecha(apr.ultima.fecha)})` : apr.estado === "cambios" ? "el texto cambió después de la última aprobación" : "sin aprobar"}.`),
    p(`Meses consecutivos con la rutina de cumplimiento cerrada: ${racha(e, ahora)}.`),

    h("2. Controles de mantenimiento"),
    ...s.indicadores.map((i) => p(`${i.ok ? "[Cumple]" : "[Pendiente]"} ${i.texto} — ${i.detalle}`)),

    h("3. Criterios de la IGT"),
    ...CRITERIOS.map((c) => {
      const ok = c.capitulo || c.id in externosAuditoria(e) ? aud.automaticos[c.id] : !!e.manuales[c.id];
      return p(`${ok ? "[Cumple]" : "[Pendiente]"} ${c.id}. ${c.texto}`);
    }),

    h("4. Bitácora de cumplimiento"),
  ];
  const eventos = bitacora(e, novedades);
  if (!eventos.length) hijos.push(p("Aún no hay eventos registrados.", { italics: true }));
  for (const ev of eventos) hijos.push(p(`${fecha(ev.fecha)} — ${ev.texto}`));
  hijos.push(
    new Paragraph({ spacing: { before: 400 }, children: [t("Este informe resume registros internos de la empresa. No constituye dictamen legal ni sustituye la resolución de la Inspección General de Trabajo.", { italics: true, size: 18 })] }),
  );
  return new Document({
    title: "Informe de cumplimiento del RIT",
    styles: { default: { document: { run: { font: F, size: 22 } } } },
    sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } }, children: hijos }],
  });
}

export const informeBlob = (e: EstadoRit, n: Novedad[] = []) => Packer.toBlob(informeCumplimiento(e, n));
