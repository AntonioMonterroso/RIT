import type { Nodo } from "@/lib/docx";

/** Muestra un documento del editor (JSON) como texto de solo lectura, con el mismo estilo de la hoja. */
function Marcado({ n }: { n: Nodo }) {
  let el: React.ReactNode = n.text;
  for (const m of n.marks ?? []) {
    if (m.type === "bold") el = <strong>{el}</strong>;
    else if (m.type === "italic") el = <em>{el}</em>;
    else if (m.type === "underline") el = <u>{el}</u>;
    else if (m.type === "strike") el = <s>{el}</s>;
  }
  return <>{el}</>;
}

const alinear = (n: Nodo): React.CSSProperties | undefined => {
  const a = n.attrs?.textAlign;
  return typeof a === "string" ? { textAlign: a as React.CSSProperties["textAlign"] } : undefined;
};

function Hijos({ nodos }: { nodos?: Nodo[] }) {
  return <>{(nodos ?? []).map((n, i) => <Bloque key={i} n={n} />)}</>;
}

function Bloque({ n }: { n: Nodo }) {
  switch (n.type) {
    case "text": return <Marcado n={n} />;
    case "hardBreak": return <br />;
    case "paragraph": return <p style={alinear(n)}><Hijos nodos={n.content} /></p>;
    case "heading": {
      const nivel = Number(n.attrs?.level ?? 1);
      const Tag = nivel <= 1 ? "h2" : nivel === 2 ? "h3" : "h4";
      return <Tag style={alinear(n)}><Hijos nodos={n.content} /></Tag>;
    }
    case "bulletList": return <ul><Hijos nodos={n.content} /></ul>;
    case "orderedList": return <ol><Hijos nodos={n.content} /></ol>;
    case "listItem": return <li><Hijos nodos={n.content} /></li>;
    case "table": return <table><tbody><Hijos nodos={n.content} /></tbody></table>;
    case "tableRow": return <tr><Hijos nodos={n.content} /></tr>;
    case "tableHeader": return <th><Hijos nodos={n.content} /></th>;
    case "tableCell": return <td><Hijos nodos={n.content} /></td>;
    case "horizontalRule": return <hr />;
    case "pageBreak": return <div className="salto-pagina" />;
    default: return null;
  }
}

export function Documento({ doc }: { doc?: Nodo | null }) {
  // La clase ProseMirror reutiliza los estilos tipográficos de la hoja del editor.
  return <div className="ProseMirror" style={{ minHeight: 0 }}><Hijos nodos={doc?.content} /></div>;
}
