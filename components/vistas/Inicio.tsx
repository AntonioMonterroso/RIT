"use client";

import Link from "next/link";
import { useRit } from "@/components/EstadoProvider";
import { Aviso, Boton, Insignia, Pagina, Progreso, Tarjeta } from "@/components/ui";
import { avanceGeneral, pasos, siguientePaso } from "@/lib/progreso";
import { obligatorio } from "@/lib/diagnostico";
import { hoyISO } from "@/lib/avisos";

const fmt = (iso: string) => iso.split("-").reverse().join("/");

export default function Inicio() {
  const { estado, avisos, listo } = useRit();
  const lista = pasos(estado);
  const avance = avanceGeneral(lista);
  const siguiente = siguientePaso(lista);
  const hoy = hoyISO();
  const proximos = avisos.filter((a) => !a.hecho && a.fecha >= hoy).slice(0, 4);
  const vencidos = avisos.filter((a) => !a.hecho && a.fecha < hoy);
  const nombre = estado.empresa.nombre_comercial || estado.empresa.razon_social;

  return (
    <Pagina
      titulo={nombre ? `Reglamento de ${nombre}` : "Su Reglamento Interior de Trabajo"}
      descripcion="Siga los pasos en orden: el sistema redacta, revisa y le recuerda lo que falta hasta que el reglamento esté aprobado y en vigor."
    >
      {!listo ? <p role="status" className="text-sm text-muted">Cargando…</p> : (
        <>
          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <Tarjeta>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted">Avance general</p>
                  <p className="text-5xl font-extrabold tracking-tight text-brand-700">{avance}%</p>
                </div>
                {siguiente ? (
                  <Link href={siguiente.href}><Boton>Continuar: {siguiente.titulo} →</Boton></Link>
                ) : (
                  <Insignia tono="ok">Todo completo</Insignia>
                )}
              </div>
              <div className="mt-4"><Progreso valor={avance} etiqueta="Avance general del reglamento" /></div>
              {siguiente && <p className="mt-3 text-sm text-muted"><b className="text-ink">Siguiente paso:</b> {siguiente.descripcion}</p>}
            </Tarjeta>

            <Tarjeta titulo="Próximos avisos" acciones={<Link href="/calendario" className="text-sm font-semibold text-brand-700 hover:underline">Ver calendario</Link>}>
              {vencidos.length > 0 && <Aviso tono="danger" className="mb-3">{vencidos.length} aviso(s) vencido(s). Revíselos en el calendario.</Aviso>}
              {proximos.length === 0 ? <p className="text-sm text-muted">No hay avisos próximos.</p> : (
                <ul className="space-y-2">
                  {proximos.map((a) => (
                    <li key={a.clave} className="flex gap-3 text-sm"><time className="w-20 shrink-0 font-bold text-brand-700" dateTime={a.fecha}>{fmt(a.fecha)}</time><span>{a.titulo}</span></li>
                  ))}
                </ul>
              )}
            </Tarjeta>
          </div>

          {!estado.diagnostico.completo && (
            <Aviso tono="info" titulo="Empiece por el diagnóstico">
              Responda unas preguntas sobre su empresa y el sistema generará un borrador completo, con las cláusulas que corresponden a su giro y su horario.{" "}
              <Link href="/diagnostico" className="font-semibold underline">Hacer el diagnóstico</Link>
            </Aviso>
          )}
          {estado.diagnostico.completo && obligatorio(estado.diagnostico) && (
            <Aviso tono="warn" titulo="Obligación legal">
              Con {estado.diagnostico.trabajadores} trabajadores permanentes, el Código de Trabajo (art. 58) obliga a contar con un Reglamento Interior de Trabajo aprobado.
            </Aviso>
          )}

          <Tarjeta titulo="Ruta hacia un reglamento aprobado" descripcion="Cada paso se marca solo cuando el sistema comprueba que está completo." relleno={false}>
            <ol className="divide-y divide-line">
              {lista.map((p, i) => (
                <li key={p.id}>
                  <Link href={p.href} className="flex items-center gap-4 px-5 py-4 hover:bg-canvas">
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${p.hecho ? "bg-ok text-white" : "bg-brand-50 text-brand-700"}`} aria-hidden>{p.hecho ? "✓" : i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-ink">{p.titulo}</span>
                      <span className="block text-sm text-muted">{p.descripcion}</span>
                    </span>
                    <span className="hidden w-40 sm:block"><Progreso valor={p.avance * 100} etiqueta={`Avance de ${p.titulo}`} tono={p.hecho ? "ok" : "marca"} /></span>
                    <span className="w-44 text-right text-xs font-medium text-muted">{p.detalle}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </Tarjeta>
        </>
      )}
    </Pagina>
  );
}
