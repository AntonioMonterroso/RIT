"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useRit } from "@/components/EstadoProvider";
import { Aviso, Boton, Insignia, Pagina, Seleccion, Texto } from "@/components/ui";
import { CAPITULOS, type CapituloKey } from "@/content/capitulos";
import { CLAUSULAS } from "@/content/plantillas";
import { contexto, nodosDeClausula } from "@/lib/generador";
import { leerParametro } from "@/lib/consulta";
import { renumerar } from "@/lib/numeracion";
import { documento, textoPlano } from "@/lib/texto";

export default function Plantillas() {
  const router = useRouter();
  const { estado, actualizar } = useRit();
  const [cap, setCap] = useState<CapituloKey | "todos">("todos");
  const [q, setQ] = useState("");
  const [abierta, setAbierta] = useState<string | null>(null);
  const [agregada, setAgregada] = useState<string | null>(null);
  const ctx = useMemo(() => contexto(estado), [estado]);
  useEffect(() => { const t = leerParametro("q"); if (t) { setQ(t); } }, []);

  const visibles = CLAUSULAS.filter((c) => (cap === "todos" || c.capitulo === cap) && (!q.trim() || `${c.titulo} ${c.resumen}`.toLowerCase().includes(q.toLowerCase())));
  const yaEsta = (titulo: string, k: CapituloKey) => textoPlano(estado.capitulos[k]).includes(titulo);

  const agregar = (id: string) => {
    const c = CLAUSULAS.find((x) => x.id === id)!;
    actualizar((s) => {
      const previo = s.capitulos[c.capitulo];
      const doc = documento([...(previo?.content ?? []), ...nodosDeClausula(c, s)]);
      return { ...s, capitulos: renumerar({ ...s.capitulos, [c.capitulo]: doc }).capitulos };
    });
    setAgregada(id);
  };

  return (
    <Pagina titulo="Biblioteca de cláusulas" descripcion={`${CLAUSULAS.length} cláusulas listas para usar. Se adaptan a los datos de su empresa y se agregan al final del capítulo que corresponde.`}>
      {agregada && <Aviso tono="ok">Cláusula agregada y artículos renumerados. <button className="font-semibold underline" onClick={() => router.push(`/editor?cap=${CLAUSULAS.find((c) => c.id === agregada)!.capitulo}`)}>Verla en el editor</button></Aviso>}
      <div className="grid gap-4 md:grid-cols-2">
        <Seleccion etiqueta="Capítulo" value={cap} onChange={(e) => setCap(e.target.value as CapituloKey | "todos")}>
          <option value="todos">Todos los capítulos</option>
          {CAPITULOS.map((c) => <option key={c.key} value={c.key}>{c.titulo}</option>)}
        </Seleccion>
        <Texto etiqueta="Buscar" type="search" placeholder="Jornada, vacaciones, acoso…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <ul className="space-y-3">
        {visibles.map((c) => {
          const chap = CAPITULOS.find((x) => x.key === c.capitulo)!;
          const incluida = yaEsta(c.titulo, c.capitulo);
          return (
            <li key={c.id} className="vidrio rounded-[var(--radius)]">
              <div className="flex flex-wrap items-center gap-3 px-5 py-3">
                <button className="min-w-0 flex-1 text-left" aria-expanded={abierta === c.id} onClick={() => setAbierta(abierta === c.id ? null : c.id)}>
                  <span className="block font-semibold">{c.titulo}</span>
                  <span className="block text-sm text-muted">{c.resumen}</span>
                </button>
                <span className="hidden text-xs text-muted sm:inline">{chap.titulo.split(":")[0]}</span>
                {c.auto(estado.diagnostico) ? <Insignia tono="marca">Incluida en su borrador</Insignia> : <Insignia>Opcional</Insignia>}
                {incluida && <Insignia tono="ok">Ya en su RIT</Insignia>}
                <Boton pequeno variante="secundario" onClick={() => agregar(c.id)} aria-label={`Agregar cláusula ${c.titulo}`}>Agregar</Boton>
              </div>
              {abierta === c.id && <div className="whitespace-pre-wrap border-t border-line px-5 py-4 text-sm leading-relaxed">{c.texto(ctx)}</div>}
            </li>
          );
        })}
        {visibles.length === 0 && <p className="text-sm text-muted">Ninguna cláusula coincide.</p>}
      </ul>
    </Pagina>
  );
}
