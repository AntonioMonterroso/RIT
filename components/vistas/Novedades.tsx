"use client";

import { useState } from "react";
import Link from "next/link";
import { useRit } from "@/components/EstadoProvider";
import { Aviso, Boton, Insignia, Pagina, Vacio } from "@/components/ui";
import { CAPITULO_POR_KEY } from "@/content/capitulos";
import { aplicarNovedad, descartarNovedad, estadoNovedad, yaIncluida, type Novedad } from "@/lib/novedades";

const cuando = (iso: string) => new Date(iso).toLocaleDateString("es-GT", { dateStyle: "long" });

export default function Novedades() {
  const { estado, actualizar, novedades, permitido, plan } = useRit();
  const [abierta, setAbierta] = useState<string | null>(null);
  const [listo, setListo] = useState("");
  const puede = permitido("editar");

  const pendientes = novedades.filter((n) => estadoNovedad(estado, n) === "pendiente");
  const atendidas = novedades.filter((n) => estadoNovedad(estado, n) !== "pendiente");

  const tarjeta = (n: Novedad) => {
    const st = estadoNovedad(estado, n);
    const cap = n.capitulo ? CAPITULO_POR_KEY[n.capitulo] : null;
    const incluida = yaIncluida(estado, n);
    return (
      <li key={n.id} className="vidrio rounded-[var(--radius)] p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{n.titulo}</h3>
          {st === "pendiente" && <Insignia tono="info">Por atender</Insignia>}
          {st === "aplicada" && <Insignia tono="ok">Aplicada</Insignia>}
          {st === "descartada" && <Insignia>Descartada</Insignia>}
          {incluida && st === "pendiente" && <Insignia tono="ok">Su texto ya lo cubre</Insignia>}
        </div>
        <p className="etiqueta-mono mt-1 text-[10px] text-muted">{cuando(n.publicada_en)}{cap ? ` · Afecta: ${cap.titulo}` : ""}</p>
        <p className="mt-3 text-sm">{n.resumen}</p>
        {st === "pendiente" && (
          <>
            {abierta === n.id && n.texto_sugerido && (
              <div className="mt-3 rounded-xl border border-line bg-hondo p-4 text-sm">
                <p className="etiqueta-mono mb-1 text-[10px] text-muted">Se agregaría al final de «{cap?.titulo}»</p>
                <p>{n.texto_sugerido}</p>
                <p className="mt-3 text-xs text-muted">Antes se guarda una versión de respaldo y se crea un recordatorio para presentar la reforma ante la IGT: un reglamento aprobado no se modifica sin su autorización.</p>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {n.texto_sugerido && n.capitulo && <Boton pequeno variante="secundario" onClick={() => setAbierta(abierta === n.id ? null : n.id)}>{abierta === n.id ? "Ocultar texto" : "Ver texto sugerido"}</Boton>}
              {n.texto_sugerido && n.capitulo && abierta === n.id && (
                <Boton pequeno disabled={!puede} onClick={() => { actualizar((s) => aplicarNovedad(s, n)); setAbierta(null); setListo(`Se agregó a su reglamento: ${n.titulo}`); }}>Aplicar a mi reglamento</Boton>
              )}
              <Boton pequeno variante="fantasma" disabled={!puede} onClick={() => actualizar((s) => descartarNovedad(s, n))}>No aplica a mi empresa</Boton>
            </div>
          </>
        )}
      </li>
    );
  };

  return (
    <Pagina titulo="Novedades legales" descripcion="Cambios de ley o de criterio que pueden afectar su reglamento. Cada novedad le muestra qué capítulo toca y le deja aplicarla con un paso, con respaldo previo.">
      {plan.soloLectura && <Aviso tono="warn">Con el plan vencido puede leer las novedades, pero no aplicarlas. <Link href="/plan" className="font-semibold underline">Ver plan</Link></Aviso>}
      {listo && <Aviso tono="ok">{listo} Revise el texto en <Link href="/editor" className="font-semibold underline">Redacción</Link>.</Aviso>}
      {pendientes.length === 0 ? <Vacio titulo="Está al día">No hay novedades pendientes. Le avisaremos aquí cuando haya una.</Vacio> : <ul className="space-y-4">{pendientes.map(tarjeta)}</ul>}
      {atendidas.length > 0 && (
        <section>
          <h2 className="mb-3 mt-2 text-sm font-semibold text-muted">Ya atendidas</h2>
          <ul className="space-y-3">{atendidas.map(tarjeta)}</ul>
        </section>
      )}
    </Pagina>
  );
}
