import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { validables, estadoValidacion, type Validacion } from "@/lib/validables";

const F = "Times New Roman";
const t = (text: string, o: { bold?: boolean; italics?: boolean; size?: number } = {}) => new TextRun({ text, font: F, size: o.size ?? 22, bold: o.bold, italics: o.italics });

/** Documento para que el abogado lea todo el contenido legal fuera del sistema y devuelva sus observaciones. */
export function paqueteRevisionLegal(validaciones: Validacion[] = [], ahora: Date = new Date()): Document {
  const mapa = new Map(validaciones.map((v) => [v.elemento_id, v]));
  const hijos: Paragraph[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [t("PAQUETE DE REVISIÓN LEGAL", { bold: true, size: 30 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [t(`Generado el ${ahora.toLocaleDateString("es-GT", { dateStyle: "long" })}`, { italics: true })] }),
    new Paragraph({ spacing: { after: 240 }, children: [t("Este documento reúne todo el contenido legal que usa el sistema de Reglamento Interior de Trabajo: normas citadas, reglas del verificador, guías por capítulo y el texto completo de las cláusulas. Se pide revisar cada pieza contra el texto oficial vigente (Código de Trabajo, Decreto 1441, y demás normas citadas), señalar errores, citas incorrectas o ausencias, y devolver sus observaciones. Las cláusulas se muestran con todas las opciones activadas y con datos de ejemplo entre corchetes.")] }),
  ];
  let grupo = "";
  for (const v of validables()) {
    if (v.grupo !== grupo) { grupo = v.grupo; hijos.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 160 }, children: [t(grupo, { bold: true, size: 28 })] })); }
    const val = mapa.get(v.id);
    const est = estadoValidacion(v, val);
    hijos.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 100 }, children: [t(v.titulo, { bold: true, size: 24 })] }));
    hijos.push(new Paragraph({ spacing: { after: 80 }, children: [t(`Código: ${v.id} · Estado: ${est === "validada" ? `validada por ${val!.validada_por} (colegiado ${val!.colegiado}, ${val!.fecha_revision})` : est === "desactualizada" ? "validada antes de un cambio: requiere nueva revisión" : "sin revisar"}`, { italics: true, size: 18 })] }));
    for (const linea of v.contenido.split("\n")) hijos.push(new Paragraph({ spacing: { after: 100 }, children: [t(linea)] }));
    hijos.push(new Paragraph({ spacing: { after: 160 }, children: [t("Observaciones del abogado: ______________________________________________", { size: 20 })] }));
  }
  return new Document({
    title: "Paquete de revisión legal",
    styles: { default: { document: { run: { font: F, size: 22 } } } },
    sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } }, children: hijos }],
  });
}

export const paqueteBlob = (v: Validacion[] = []) => Packer.toBlob(paqueteRevisionLegal(v));
