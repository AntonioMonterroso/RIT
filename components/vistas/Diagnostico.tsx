"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useRit } from "@/components/EstadoProvider";
import { Aviso, Boton, Insignia, Interruptor, Pagina, Seleccion, Tarjeta, Texto } from "@/components/ui";
import { GIROS, type Diagnostico as Diag, type Giro, type Marca } from "@/lib/tipos";
import { evaluar, obligatorio, recomendaciones } from "@/lib/diagnostico";
import { generarBorrador } from "@/lib/generador";
import { revisarCapitulo } from "@/lib/revision";
import { CAPITULOS } from "@/content/capitulos";

const TONO = { info: "info", aviso: "warn", alerta: "danger" } as const;

export default function Diagnostico() {
  const router = useRouter();
  const { estado, actualizar } = useRit();
  const d = estado.diagnostico;
  const [confirmar, setConfirmar] = useState(false);
  const set = <K extends keyof Diag>(k: K, v: Diag[K]) => actualizar((s) => ({ ...s, diagnostico: { ...s.diagnostico, [k]: v } }));

  const j = evaluar(d);
  const recs = recomendaciones(d);
  const hayTexto = CAPITULOS.some((c) => revisarCapitulo(c.key, estado.capitulos[c.key]).caracteres > 0);

  const generar = () => {
    const { capitulos } = generarBorrador({ empresa: estado.empresa, diagnostico: d, puestos: estado.puestos });
    actualizar((s) => ({ ...s, capitulos, diagnostico: { ...s.diagnostico, completo: true } }));
    router.push("/editor");
  };

  return (
    <Pagina
      titulo="Diagnóstico de la empresa"
      descripcion="Con estas respuestas el sistema elige y adapta las cláusulas de su reglamento: jornada, puntualidad, seguridad, faltas propias de su giro y más."
    >
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <Tarjeta titulo="1. Su empresa">
            <div className="grid gap-4 md:grid-cols-2">
              <Seleccion etiqueta="Giro del negocio" value={d.giro} onChange={(e) => set("giro", e.target.value as Giro)} ayuda={GIROS.find((g) => g.id === d.giro)?.ejemplo}>
                {GIROS.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
              </Seleccion>
              <Texto etiqueta="Trabajadores permanentes" type="number" min={1} value={d.trabajadores} onChange={(e) => set("trabajadores", Math.max(1, Number(e.target.value) || 1))}
                ayuda="El art. 58 obliga a tener RIT desde 10." />
            </div>
          </Tarjeta>

          <Tarjeta titulo="2. Horario y jornada" descripcion="El sistema clasifica la jornada y verifica los límites legales mientras escribe.">
            <div className="grid gap-4 md:grid-cols-3">
              <Texto etiqueta="Hora de entrada" type="time" value={d.entrada} onChange={(e) => set("entrada", e.target.value)} />
              <Texto etiqueta="Hora de salida" type="time" value={d.salida} onChange={(e) => set("salida", e.target.value)} />
              <Texto etiqueta="Almuerzo (minutos)" type="number" min={0} step={5} value={d.almuerzoMin} onChange={(e) => set("almuerzoMin", Math.max(0, Number(e.target.value) || 0))} />
              <Texto etiqueta="Días laborales" value={d.diasLaborales} onChange={(e) => set("diasLaborales", e.target.value)} ayuda="Ej. lunes a viernes, lunes a sábado" />
              <Texto etiqueta="Tolerancia de entrada (min)" type="number" min={0} value={d.tolerancia} onChange={(e) => set("tolerancia", Math.max(0, Number(e.target.value) || 0))} />
              <Seleccion etiqueta="Registro de asistencia" value={d.marca} onChange={(e) => set("marca", e.target.value as Marca)}>
                <option value="biometrico">Biométrico</option><option value="reloj">Reloj marcador</option><option value="libro">Libro de asistencia</option>
              </Seleccion>
              <Seleccion etiqueta="Pago de salarios" value={d.periodo} onChange={(e) => set("periodo", e.target.value as Diag["periodo"])}>
                <option value="quincenal">Quincenal</option><option value="mensual">Mensual</option>
              </Seleccion>
            </div>
            <div className="mt-4"><Interruptor etiqueta="El almuerzo cuenta como tiempo de trabajo efectivo" checked={d.almuerzoComputa} onChange={(v) => set("almuerzoComputa", v)} /></div>
          </Tarjeta>

          <Tarjeta titulo="3. Cómo opera" descripcion="Cada opción activa cláusulas específicas.">
            <div className="grid gap-3 md:grid-cols-2">
              <Interruptor etiqueta="Turnos rotativos" ayuda="Asignación y cambio de turnos" checked={d.turnos} onChange={(v) => set("turnos", v)} />
              <Interruptor etiqueta="Teletrabajo o trabajo híbrido" ayuda="Disponibilidad y derecho a la desconexión" checked={d.teletrabajo} onChange={(v) => set("teletrabajo", v)} />
              <Interruptor etiqueta="Maneja efectivo, inventarios o fondos" ayuda="Custodia de bienes y arqueos" checked={d.manejaEfectivo} onChange={(v) => set("manejaEfectivo", v)} />
              <Interruptor etiqueta="Conducción de vehículos" ayuda="Licencia vigente y reporte de accidentes" checked={d.usaVehiculos} onChange={(v) => set("usaVehiculos", v)} />
              <Interruptor etiqueta="Atención directa al público" ayuda="Trato a clientes" checked={d.atencionCliente} onChange={(v) => set("atencionCliente", v)} />
              <Interruptor etiqueta="Uniforme obligatorio" ayuda="Uso y presentación personal" checked={d.uniforme} onChange={(v) => set("uniforme", v)} />
              <Interruptor etiqueta="Entrega equipo de protección personal" ayuda="Casco, guantes, calzado, etc." checked={d.epp} onChange={(v) => set("epp", v)} />
            </div>
          </Tarjeta>
        </div>

        <div className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <Tarjeta titulo="Evaluación de su jornada">
            <div className="flex items-center gap-2">
              <Insignia tono={j.ok ? "ok" : "danger"}>{j.ok ? "Dentro del límite" : "Excede el límite"}</Insignia>
              <span className="text-sm font-semibold capitalize">Jornada {j.tipo}</span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-muted">Horas efectivas por día</dt><dd className="text-lg font-bold">{j.horasDiarias} <span className="text-xs font-normal text-muted">de {j.limite.diarias}</span></dd></div>
              <div><dt className="text-muted">Horas por semana</dt><dd className="text-lg font-bold">{j.horasSemanales} <span className="text-xs font-normal text-muted">de {j.limite.semanales}</span></dd></div>
            </dl>
          </Tarjeta>

          <Tarjeta titulo="Recomendaciones">
            <ul className="space-y-2">{recs.map((r, i) => <li key={i}><Aviso tono={TONO[r.nivel]}>{r.texto}</Aviso></li>)}</ul>
          </Tarjeta>

          <Tarjeta titulo="Generar mi reglamento">
            <p className="text-sm text-muted">Se creará un borrador con unos 55 artículos adaptados a estas respuestas. Después podrá editar todo en el editor.</p>
            {obligatorio(d) && <p className="mt-2 text-sm font-medium text-warn">Su empresa está obligada a tener RIT.</p>}
            {confirmar ? (
              <div className="mt-4 space-y-3">
                <Aviso tono="warn">Ya hay texto escrito. Generar un borrador <b>reemplazará</b> todos los capítulos.</Aviso>
                <div className="flex gap-2"><Boton onClick={generar}>Sí, reemplazar</Boton><Boton variante="secundario" onClick={() => setConfirmar(false)}>Cancelar</Boton></div>
              </div>
            ) : (
              <Boton className="mt-4 w-full" onClick={hayTexto ? () => setConfirmar(true) : generar}>Generar borrador personalizado</Boton>
            )}
          </Tarjeta>
        </div>
      </div>
    </Pagina>
  );
}
