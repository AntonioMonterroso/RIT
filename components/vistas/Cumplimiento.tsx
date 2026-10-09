"use client";

import Link from "next/link";
import { saveAs } from "file-saver";
import { useRit } from "@/components/EstadoProvider";
import { Anillo, Boton, Insignia, Pagina, Tarjeta, Vacio } from "@/components/ui";
import { bitacora } from "@/lib/bitacora";
import { nombreArchivo } from "@/lib/archivo";
import { informeBlob } from "@/lib/informe";
import { hechasEn, marcarTarea, mesDe, nombreMes, racha, TAREAS_RUTINA } from "@/lib/rutina";
import { salud } from "@/lib/salud";

const cuando = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString("es-GT", { dateStyle: "medium" });

export default function Cumplimiento() {
  const { estado, actualizar, novedades, permitido } = useRit();
  const mes = mesDe();
  const s = salud(estado, novedades);
  const hechas = hechasEn(estado, mes);
  const eventos = bitacora(estado, novedades);
  const puede = permitido("editar");
  const nombre = estado.empresa.nombre_comercial || estado.empresa.razon_social || "empresa";

  return (
    <Pagina titulo="Rutina y bitácora de cumplimiento" descripcion="Un reglamento aprobado no se archiva: se mantiene. Aquí ve qué tan al día está, cierra la revisión del mes y conserva el historial que respalda a su empresa ante una inspección."
      acciones={<Boton variante="secundario" onClick={async () => saveAs(await informeBlob(estado, novedades), nombreArchivo(`informe de cumplimiento ${nombre}`, "docx"))}>Descargar informe (.docx)</Boton>}>
      <div className="grid gap-5 md:grid-cols-[auto,1fr]">
        <Tarjeta titulo="Salud del reglamento">
          <Anillo valor={s.puntos} etiqueta="Salud del reglamento" tamano={150}><span className="text-3xl font-bold">{s.puntos}%</span></Anillo>
          <p className="mt-3 text-center text-xs text-muted">Controles de mantenimiento al día</p>
        </Tarjeta>
        <Tarjeta titulo="Controles" relleno={false}>
          <ul className="divide-y divide-line text-sm">
            {s.indicadores.map((i) => (
              <li key={i.id} className="flex items-center gap-3 px-5 py-2.5">
                <span aria-hidden className={i.ok ? "text-ok" : "text-warn"}>{i.ok ? "✓" : "•"}</span>
                <span className="flex-1"><span className="font-medium">{i.texto}</span><span className="block text-xs text-muted">{i.detalle}</span></span>
                {!i.ok && <Link href={i.href} className="text-xs font-semibold text-brand-700 underline">Atender</Link>}
              </li>
            ))}
          </ul>
        </Tarjeta>
      </div>

      <Tarjeta titulo={`Rutina de ${nombreMes(mes)}`} descripcion={`${hechas} de ${TAREAS_RUTINA.length} tareas · ${racha(estado) > 0 ? `${racha(estado)} ${racha(estado) === 1 ? "mes seguido" : "meses seguidos"} cerrados` : "Cierre el mes para iniciar su racha"}`}
        acciones={estado.rutina[mes]?.cerrada ? <Insignia tono="ok">Mes cerrado</Insignia> : undefined}>
        <ul className="space-y-2">
          {TAREAS_RUTINA.map((t) => {
            const hecho = !!estado.rutina[mes]?.hechos[t.id];
            return (
              <li key={t.id} className="vidrio flex items-start gap-3 rounded-xl p-3.5">
                <input type="checkbox" id={`r-${t.id}`} checked={hecho} disabled={!puede} onChange={(e) => actualizar((st) => marcarTarea(st, mes, t.id, e.target.checked))} className="mt-1 h-4 w-4 accent-[var(--brand-600)]" />
                <label htmlFor={`r-${t.id}`} className="flex-1 text-sm"><span className="font-medium">{t.titulo}</span><span className="block text-muted">{t.detalle}</span></label>
                <Link href={t.href} className="text-xs font-semibold text-brand-700 underline">Ir</Link>
              </li>
            );
          })}
        </ul>
      </Tarjeta>

      <Tarjeta titulo="Bitácora" descripcion="Se arma sola con lo que usted ya registra: versiones, aprobaciones, trámite, publicidad, rutina y novedades." relleno={false}>
        {eventos.length === 0 ? <div className="p-5"><Vacio titulo="Aún no hay eventos">Cada versión, aprobación o trámite quedará aquí con su fecha.</Vacio></div> : (
          <ol className="divide-y divide-line text-sm">
            {eventos.map((e) => (
              <li key={e.id} className="flex gap-4 px-5 py-2.5"><span className="etiqueta-mono w-28 shrink-0 text-[11px] text-muted">{cuando(e.fecha)}</span><span>{e.texto}</span></li>
            ))}
          </ol>
        )}
      </Tarjeta>
    </Pagina>
  );
}
