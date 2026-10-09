"use client";

import { saveAs } from "file-saver";
import { useRit } from "@/components/EstadoProvider";
import { Aviso, Boton, Insignia, Pagina, Tarjeta } from "@/components/ui";
import { moneda, PLANES, precioConfirmado, REQUIERE_PLAN, SIEMPRE_DISPONIBLE } from "@/content/planes";
import { nombreArchivo } from "@/lib/archivo";
import { resumenValor, simularLocal } from "@/lib/plan";
import { exportarRespaldo } from "@/lib/respaldo";

export default function Plan() {
  const { estado, plan, local, refrescarPlan } = useRit();
  const v = resumenValor(estado);
  const p = PLANES[0];
  const nombre = estado.empresa.nombre_comercial || estado.empresa.razon_social || "empresa";
  const simular = async (q: "vencer" | "reiniciar" | "activar") => { simularLocal(q); await refrescarPlan(); };

  const logros: [number, string][] = [
    [v.articulos, "artículos redactados"], [v.puestos, "puestos documentados"], [v.versiones, "versiones guardadas"],
    [v.aprobaciones, "aprobaciones internas"], [v.mesesRutina, "meses de rutina cerrados"], [v.novedadesAplicadas, "novedades legales aplicadas"],
  ];

  return (
    <Pagina titulo="Plan y suscripción" descripcion="Su reglamento es suyo: puede verlo y descargarlo siempre. El plan mantiene el sistema vivo para que siga actualizado y respaldado.">
      {plan.fase === "prueba" && <Aviso tono="info" titulo={`Periodo de prueba: ${plan.diasRestantes} ${plan.diasRestantes === 1 ? "día restante" : "días restantes"}`}>Durante la prueba tiene acceso completo. Al terminar, el sistema queda en solo lectura hasta que active el plan.</Aviso>}
      {plan.fase === "activa" && <Aviso tono="ok" titulo="Plan activo">Todo el sistema está disponible.</Aviso>}
      {plan.fase === "vencida" && <Aviso tono="warn" titulo="Periodo de prueba terminado: solo lectura">Todo su trabajo está guardado. Puede verlo y descargarlo; para modificar, actualizar o seguir con la rutina de cumplimiento, active el plan.</Aviso>}

      <Tarjeta titulo="Lo que ya construyó en el sistema">
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {logros.map(([n, t]) => (
            <li key={t} className="vidrio rounded-xl p-4"><p className="text-2xl font-bold text-brand-700">{n}</p><p className="text-xs text-muted">{t}</p></li>
          ))}
        </ul>
      </Tarjeta>

      <div className="grid gap-5 md:grid-cols-2">
        <Tarjeta titulo="Siempre suyo, con o sin plan">
          <ul className="space-y-2 text-sm">{SIEMPRE_DISPONIBLE.map((t) => <li key={t} className="flex gap-2"><span className="text-ok" aria-hidden>✓</span>{t}</li>)}</ul>
          <Boton className="mt-4" variante="secundario" onClick={() => saveAs(new Blob([exportarRespaldo(estado)], { type: "application/json" }), nombreArchivo(`respaldo ${nombre}`, "json"))}>Descargar mi respaldo completo</Boton>
        </Tarjeta>
        <Tarjeta titulo="Lo que mantiene el plan activo">
          <ul className="space-y-2 text-sm">{REQUIERE_PLAN.map((t) => <li key={t} className="flex gap-2"><span className="text-brand-600" aria-hidden>●</span>{t}</li>)}</ul>
        </Tarjeta>
      </div>

      <Tarjeta titulo={`Plan ${p.nombre}`} acciones={<Insignia tono={precioConfirmado ? "ok" : "warn"}>{precioConfirmado ? "Precio vigente" : "Precio de ejemplo"}</Insignia>}>
        <p className="text-3xl font-bold">{moneda}{p.precio} <span className="text-sm font-normal text-muted">{p.unidad}</span></p>
        <p className="mt-1 text-sm text-muted">{p.para}</p>
        {plan.fase !== "activa" && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Boton disabled={!local} onClick={() => void simular("activar")}>{local ? "Activar plan (demostración)" : "Activar plan"}</Boton>
            {!local && <span className="text-xs text-muted">El pago en línea se habilitará próximamente. Escríbanos para activar su cuenta.</span>}
          </div>
        )}
      </Tarjeta>

      {local && (
        <Tarjeta titulo="Herramientas de demostración" descripcion="Solo existen en este modo local, para mostrar cómo se comporta el sistema.">
          <div className="flex flex-wrap gap-2">
            <Boton pequeno variante="secundario" onClick={() => void simular("vencer")}>Simular fin de la prueba</Boton>
            <Boton pequeno variante="secundario" onClick={() => void simular("reiniciar")}>Reiniciar la prueba</Boton>
          </div>
        </Tarjeta>
      )}
    </Pagina>
  );
}
