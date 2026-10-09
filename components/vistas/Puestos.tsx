"use client";

import { useState } from "react";
import { useRit } from "@/components/EstadoProvider";
import { Aviso, Boton, Insignia, Pagina, Tarjeta, Texto, AreaTexto, Vacio } from "@/components/ui";
import { GIROS, type Puesto } from "@/lib/tipos";
import { PUESTOS_POR_GIRO } from "@/content/puestos";
import { generarAnexoPuestos } from "@/lib/generador";

const nuevo = (): Puesto => ({ id: crypto.randomUUID(), nombre: "", jefe: "", responsabilidades: ["", "", ""], activos: "" });

export default function Puestos() {
  const { estado, actualizar } = useRit();
  const [aplicado, setAplicado] = useState(false);
  const giro = GIROS.find((g) => g.id === estado.diagnostico.giro)!;
  const sugeridos = PUESTOS_POR_GIRO[estado.diagnostico.giro].filter((m) => !estado.puestos.some((p) => p.nombre === m.nombre));

  const cambiar = (id: string, f: (p: Puesto) => Puesto) => { setAplicado(false); actualizar((s) => ({ ...s, puestos: s.puestos.map((p) => (p.id === id ? f(p) : p)) })); };
  const agregar = (p: Puesto) => { setAplicado(false); actualizar((s) => ({ ...s, puestos: [...s.puestos, p] })); };
  const quitar = (id: string) => { setAplicado(false); actualizar((s) => ({ ...s, puestos: s.puestos.filter((p) => p.id !== id) })); };

  const aplicar = () => {
    actualizar((s) => ({ ...s, capitulos: { ...s.capitulos, mod_puestos: generarAnexoPuestos(s) } }));
    setAplicado(true);
  };

  return (
    <Pagina
      titulo="Puestos y responsabilidades"
      descripcion="Defina de 3 a 5 puestos clave. Sin funciones escritas, un despido por «incumplimiento de funciones» suele perderse en el juzgado."
      acciones={<Boton onClick={aplicar} disabled={estado.puestos.length === 0}>Aplicar al reglamento (Anexo)</Boton>}
    >
      {aplicado && <Aviso tono="ok">El Anexo de puestos del reglamento se actualizó con {estado.puestos.length} puesto(s).</Aviso>}

      <Tarjeta titulo={`Puestos sugeridos para ${giro.nombre.toLowerCase()}`} descripcion="Agréguelos con un clic y ajuste el detalle a su empresa.">
        {sugeridos.length === 0 ? <p className="text-sm text-muted">Ya agregó todos los puestos sugeridos.</p> : (
          <div className="flex flex-wrap gap-2">
            {sugeridos.map((m) => (
              <Boton key={m.nombre} variante="secundario" pequeno onClick={() => agregar({ id: crypto.randomUUID(), nombre: m.nombre, jefe: m.jefe, responsabilidades: [...m.responsabilidades], activos: m.activos })}>+ {m.nombre}</Boton>
            ))}
          </div>
        )}
        <div className="mt-3"><Boton variante="fantasma" pequeno onClick={() => agregar(nuevo())}>+ Puesto en blanco</Boton></div>
      </Tarjeta>

      {estado.puestos.length === 0 ? (
        <Vacio titulo="Aún no hay puestos">Agregue los sugeridos o cree uno en blanco.</Vacio>
      ) : estado.puestos.map((p) => (
        <Tarjeta key={p.id} titulo={p.nombre || "Puesto sin nombre"}
          acciones={<div className="flex items-center gap-2"><Insignia tono={p.responsabilidades.filter((r) => r.trim()).length >= 3 ? "ok" : "warn"}>{p.responsabilidades.filter((r) => r.trim()).length} responsabilidades</Insignia><Boton variante="peligro" pequeno onClick={() => quitar(p.id)} aria-label={`Quitar puesto ${p.nombre}`}>Quitar</Boton></div>}>
          <div className="grid gap-4 md:grid-cols-2">
            <Texto etiqueta="Nombre del puesto" value={p.nombre} onChange={(e) => cambiar(p.id, (x) => ({ ...x, nombre: e.target.value }))} />
            <Texto etiqueta="Jefe inmediato" value={p.jefe} onChange={(e) => cambiar(p.id, (x) => ({ ...x, jefe: e.target.value }))} />
            <AreaTexto ancho etiqueta="Responsabilidades críticas (una por línea, de 3 a 5)" rows={4} value={p.responsabilidades.join("\n")}
              onChange={(e) => cambiar(p.id, (x) => ({ ...x, responsabilidades: e.target.value.split("\n").slice(0, 5) }))} />
            <Texto ancho etiqueta="Fondos, inventarios o equipos en custodia" value={p.activos} onChange={(e) => cambiar(p.id, (x) => ({ ...x, activos: e.target.value }))} ayuda="Deje vacío si no custodia bienes." />
          </div>
        </Tarjeta>
      ))}
    </Pagina>
  );
}
