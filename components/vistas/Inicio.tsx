"use client";

import Link from "next/link";
import { useRit } from "@/components/EstadoProvider";
import { Anillo, Aviso, Boton, Insignia, Pagina, Progreso, Tarjeta } from "@/components/ui";
import { auditar } from "@/lib/auditoria";
import { hoyISO } from "@/lib/avisos";
import { obligatorio } from "@/lib/diagnostico";
import { avanceGeneral, externosAuditoria, pasos, siguientePaso } from "@/lib/progreso";
import { capitulosQueCumplen, pendientesTotales } from "@/lib/revision";
import { CAPITULOS } from "@/content/capitulos";
import { pendientes } from "@/lib/novedades";
import { hechasEn, mesDe, racha, TAREAS_RUTINA } from "@/lib/rutina";
import { salud } from "@/lib/salud";

const fmt = (iso: string) => iso.split("-").reverse().join("/");

function Indicador({ etiqueta, valor, sub, tono = "marca" }: { etiqueta: string; valor: string; sub: string; tono?: "marca" | "ok" | "warn" }) {
  const color = { marca: "text-brand-700", ok: "text-ok", warn: "text-warn" }[tono];
  return (
    <div className="vidrio rounded-2xl p-4">
      <p className="etiqueta-mono text-[10px] text-muted">{etiqueta}</p>
      <p className={`etiqueta-mono mt-1.5 text-3xl font-semibold normal-case tracking-tight ${color}`}>{valor}</p>
      <p className="mt-0.5 text-xs text-muted">{sub}</p>
    </div>
  );
}

export default function Inicio() {
  const { estado, avisos, urgentes, listo, novedades } = useRit();
  const lista = pasos(estado);
  const avance = avanceGeneral(lista);
  const siguiente = siguientePaso(lista);
  const hoy = hoyISO();
  const proximos = avisos.filter((a) => !a.hecho && a.fecha >= hoy).slice(0, 4);
  const vencidos = avisos.filter((a) => !a.hecho && a.fecha < hoy);
  const nombre = estado.empresa.nombre_comercial || estado.empresa.razon_social;
  const cumplen = capitulosQueCumplen(estado.capitulos);
  const pend = pendientesTotales(estado.capitulos);
  const sal = salud(estado, novedades);
  const porAtender = pendientes(estado, novedades).length;
  const aud = auditar(estado.capitulos, estado.manuales, externosAuditoria(estado));

  return (
    <Pagina
      titulo={nombre ? `Centro de mando · ${nombre}` : "Centro de mando"}
      descripcion="El sistema redacta, revisa y le recuerda lo que falta hasta que el reglamento esté aprobado y en vigor."
      ancho="max-w-6xl"
    >
      {!listo ? <p role="status" className="text-sm text-muted">Cargando…</p> : (
        <>
          <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
            <Tarjeta className="borde-neon grid place-items-center">
              <Anillo valor={avance} etiqueta="Avance general del reglamento" tamano={200}>
                <p className="etiqueta-mono text-5xl font-semibold normal-case tracking-tight degradado-texto">{avance}%</p>
                <p className="etiqueta-mono mt-1 text-[10px] text-muted">completado</p>
              </Anillo>
            </Tarjeta>

            <Tarjeta className="flex flex-col justify-between">
              <div>
                <p className="etiqueta-mono text-[10px] text-brand-600">{siguiente ? "Siguiente misión" : "Misión cumplida"}</p>
                <h2 className="mt-1.5 text-2xl font-semibold tracking-tight">{siguiente ? siguiente.titulo : "Su reglamento está completo"}</h2>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
                  {siguiente ? siguiente.descripcion : "Todos los pasos están hechos. Mantenga el calendario al día y revise el reglamento cada año."}
                </p>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {siguiente ? <Link href={siguiente.href}><Boton>Continuar →</Boton></Link> : <Insignia tono="ok">Todo completo</Insignia>}
                <Link href="/calendario"><Boton variante="secundario">Ver calendario</Boton></Link>
              </div>
            </Tarjeta>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Indicador etiqueta="Capítulos" valor={`${cumplen}/${CAPITULOS.length}`} sub="cumplen los requisitos" tono={cumplen === CAPITULOS.length ? "ok" : "marca"} />
            <Indicador etiqueta="Auditoría IGT" valor={`${aud.porcentaje}%`} sub="criterios cumplidos" tono={aud.porcentaje >= 90 ? "ok" : "marca"} />
            <Indicador etiqueta="Por completar" valor={String(pend)} sub="datos [COMPLETAR]" tono={pend === 0 ? "ok" : "warn"} />
            <Indicador etiqueta="Avisos urgentes" valor={String(urgentes)} sub="vencidos o en 7 días" tono={urgentes === 0 ? "ok" : "warn"} />
          </div>

          <Tarjeta titulo="Mantenimiento del reglamento" descripcion="Un reglamento aprobado se mantiene: novedades de ley, revisión mensual y aprobaciones al día."
            acciones={<Link href="/cumplimiento" className="text-sm font-semibold text-brand-700 hover:underline">Ver detalle</Link>}>
            <div className="grid gap-4 md:grid-cols-3">
              <Link href="/cumplimiento" className="vidrio rounded-xl p-4 hover:border-brand-600/50"><p className="etiqueta-mono text-[10px] text-muted">Salud</p><p className={`mt-1 text-3xl font-semibold ${sal.puntos >= 80 ? "text-ok" : "text-warn"}`}>{sal.puntos}%</p><p className="text-xs text-muted">{sal.indicadores.filter((i) => !i.ok).length} control(es) por atender</p></Link>
              <Link href="/novedades" className="vidrio rounded-xl p-4 hover:border-brand-600/50"><p className="etiqueta-mono text-[10px] text-muted">Novedades legales</p><p className={`mt-1 text-3xl font-semibold ${porAtender ? "text-warn" : "text-ok"}`}>{porAtender}</p><p className="text-xs text-muted">{porAtender ? "por atender" : "al día"}</p></Link>
              <Link href="/cumplimiento" className="vidrio rounded-xl p-4 hover:border-brand-600/50"><p className="etiqueta-mono text-[10px] text-muted">Rutina del mes</p><p className="mt-1 text-3xl font-semibold text-brand-700">{hechasEn(estado, mesDe())}/{TAREAS_RUTINA.length}</p><p className="text-xs text-muted">{racha(estado)} {racha(estado) === 1 ? "mes seguido" : "meses seguidos"}</p></Link>
            </div>
          </Tarjeta>

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

          <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
            <Tarjeta titulo="Ruta hacia un reglamento aprobado" descripcion="Cada nodo se enciende solo cuando el sistema comprueba que el paso está completo.">
              <ol className="relative ml-4 space-y-1 border-l border-line">
                {lista.map((p, i) => (
                  <li key={p.id} className="relative pl-7">
                    <span aria-hidden className={`absolute -left-[13px] top-4 grid h-6 w-6 place-items-center rounded-full border text-[11px] font-bold ${p.hecho ? "border-ok bg-ok/20 text-ok shadow-[0_0_14px_var(--glow-ok)]" : p.avance > 0 ? "border-brand-600 bg-brand-50 text-brand-700 shadow-[0_0_12px_var(--glow)]" : "border-line bg-solid text-muted"}`}>{p.hecho ? "✓" : i + 1}</span>
                    <Link href={p.href} className="group block rounded-xl px-3 py-3 transition-colors hover:bg-velo2">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-semibold group-hover:text-brand-800">{p.titulo}</span>
                        <span className="etiqueta-mono shrink-0 text-[10px] text-muted">{p.detalle}</span>
                      </span>
                      <span className="mt-0.5 block text-sm text-muted">{p.descripcion}</span>
                      <span className="mt-2 block"><Progreso valor={p.avance * 100} etiqueta={`Avance de ${p.titulo}`} tono={p.hecho ? "ok" : "marca"} /></span>
                    </Link>
                  </li>
                ))}
              </ol>
            </Tarjeta>

            <Tarjeta titulo="Señales próximas" acciones={<Link href="/calendario" className="text-sm font-semibold text-brand-700 hover:underline">Calendario</Link>}>
              {vencidos.length > 0 && <Aviso tono="danger" className="mb-3">{vencidos.length} aviso(s) vencido(s).</Aviso>}
              {proximos.length === 0 ? <p className="text-sm text-muted">No hay avisos próximos.</p> : (
                <ul className="space-y-3">
                  {proximos.map((a) => (
                    <li key={a.clave} className="flex gap-3 text-sm"><time className="etiqueta-mono w-[88px] shrink-0 text-xs font-semibold normal-case text-brand-700" dateTime={a.fecha}>{fmt(a.fecha)}</time><span>{a.titulo}</span></li>
                  ))}
                </ul>
              )}
            </Tarjeta>
          </div>
        </>
      )}
    </Pagina>
  );
}
