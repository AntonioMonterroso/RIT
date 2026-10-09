import {
  AlignmentType, Document, HeadingLevel, LevelFormat, Packer, PageBreak, Paragraph,
  Table, TableCell, TableRow, TextRun, WidthType, type ParagraphChild,
} from "docx";
import { CAPITULOS, type CapituloKey } from "@/content/capitulos";

export interface Nodo {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string }[];
  content?: Nodo[];
}

export interface DatosRit {
  empresa: { razon_social: string; nombre_comercial?: string };
  capitulos: Partial<Record<CapituloKey, Nodo>>;
}

const FUENTE = "Times New Roman";
const TAM = 24; // 12 pt en medios puntos
const REF_NUM = "rit-numerado";

const ALINEACION: Record<string, (typeof AlignmentType)[keyof typeof AlignmentType]> = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  justify: AlignmentType.JUSTIFIED,
};

const HEADINGS = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3];

function runs(nodos: Nodo[] = [], base: { bold?: boolean; size?: number } = {}): ParagraphChild[] {
  const out: ParagraphChild[] = [];
  for (const n of nodos) {
    if (n.type === "hardBreak") {
      out.push(new TextRun({ break: 1 }));
    } else if (n.type === "text" && n.text) {
      const m = new Set((n.marks ?? []).map((x) => x.type));
      out.push(
        new TextRun({
          text: n.text,
          font: FUENTE,
          size: base.size ?? TAM,
          bold: base.bold || m.has("bold"),
          italics: m.has("italic"),
          underline: m.has("underline") ? {} : undefined,
          strike: m.has("strike"),
        }),
      );
    }
  }
  return out;
}

function alineacion(n: Nodo) {
  return ALINEACION[String(n.attrs?.textAlign ?? "")] ?? AlignmentType.JUSTIFIED;
}

function bloques(nodos: Nodo[] = [], nivelLista = 0, tipoLista?: "bullet" | "ordered"): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  for (const n of nodos) {
    switch (n.type) {
      case "paragraph":
        out.push(new Paragraph({
          children: runs(n.content),
          alignment: alineacion(n),
          spacing: { after: 160, line: 360 },
          ...(tipoLista === "bullet" ? { bullet: { level: nivelLista } } : {}),
          ...(tipoLista === "ordered" ? { numbering: { reference: REF_NUM, level: nivelLista } } : {}),
        }));
        break;
      case "heading": {
        const nivel = Math.min(Math.max(Number(n.attrs?.level ?? 1), 1), 3);
        out.push(new Paragraph({
          children: runs(n.content, { bold: true, size: nivel === 1 ? 28 : TAM }),
          heading: HEADINGS[nivel - 1],
          alignment: nivel === 1 ? AlignmentType.CENTER : AlignmentType.LEFT,
          spacing: { before: 240, after: 160 },
        }));
        break;
      }
      case "bulletList":
      case "orderedList":
        for (const li of n.content ?? []) {
          out.push(...bloques(li.content, nivelLista, n.type === "bulletList" ? "bullet" : "ordered"));
        }
        break;
      case "table":
        out.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: (n.content ?? []).map((fila) => new TableRow({
            children: (fila.content ?? []).map((celda) => new TableCell({
              children: celdaBloques(celda),
              shading: celda.type === "tableHeader" ? { fill: "E2E8F0" } : undefined,
            })),
          })),
        }));
        out.push(new Paragraph({ children: [] }));
        break;
      case "pageBreak":
        out.push(new Paragraph({ children: [new PageBreak()] }));
        break;
      case "horizontalRule":
        out.push(new Paragraph({ border: { bottom: { style: "single", size: 6, color: "000000", space: 1 } }, children: [] }));
        break;
      default:
        break;
    }
  }
  return out;
}

function celdaBloques(celda: Nodo): Paragraph[] {
  const res = bloques(celda.content).filter((b): b is Paragraph => b instanceof Paragraph);
  return res.length ? res : [new Paragraph({ children: [] })];
}

export function construirDocumento(rit: DatosRit): Document {
  const nombre = rit.empresa.razon_social || rit.empresa.nombre_comercial || "NOMBRE DE LA EMPRESA, S.A.";

  const portada: Paragraph[] = [
    new Paragraph({ children: [], spacing: { before: 3600 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: nombre.toUpperCase(), font: FUENTE, size: 36, bold: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 480 },
      children: [new TextRun({ text: "REGLAMENTO INTERIOR DE TRABAJO", font: FUENTE, size: 32 })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  const cuerpo: (Paragraph | Table)[] = [];
  for (const cap of CAPITULOS) {
    const doc = rit.capitulos[cap.key];
    if (!doc?.content?.length) continue;
    cuerpo.push(new Paragraph({
      children: [new TextRun({ text: cap.titulo.toUpperCase(), font: FUENTE, size: 26, bold: true })],
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 360, after: 200 },
    }));
    cuerpo.push(...bloques(doc.content));
  }

  return new Document({
    creator: nombre,
    title: `Reglamento Interior de Trabajo - ${nombre}`,
    styles: { default: { document: { run: { font: FUENTE, size: TAM } } } },
    numbering: {
      config: [{
        reference: REF_NUM,
        levels: [0, 1, 2].map((level) => ({
          level,
          format: LevelFormat.DECIMAL,
          text: `%${level + 1}.`,
          alignment: AlignmentType.START,
        })),
      }],
    },
    sections: [{
      properties: {
        // Carta (8.5" x 11") con márgenes de 1".
        page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
      },
      children: [...portada, ...cuerpo],
    }],
  });
}

export async function generarDocxBlob(rit: DatosRit): Promise<Blob> {
  return Packer.toBlob(construirDocumento(rit));
}

export async function generarDocxBuffer(rit: DatosRit): Promise<Buffer> {
  return Packer.toBuffer(construirDocumento(rit));
}
