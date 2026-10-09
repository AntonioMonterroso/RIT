"use client";

import { saveAs } from "file-saver";
import { useRit } from "@/components/EstadoProvider";
import { Aviso, Boton, Pagina, Tarjeta, Texto } from "@/components/ui";
import { nombreArchivo } from "@/lib/archivo";
import { generarMemorialBlob, type DatosMemorial } from "@/lib/memorial";
import { memorialCompleto } from "@/lib/progreso";

const CAMPOS: [keyof DatosMemorial, string, boolean, string?][] = [
  ["autoridad", "Autoridad a la que se dirige", true],
  ["rep_nombre", "Nombre del representante legal", false],
  ["rep_datos", "Edad, estado civil y profesión", false, "Ej. cuarenta años de edad, casado, guatemalteco, administrador de empresas"],
  ["rep_dpi", "DPI del representante", false],
  ["calidad", "Calidad con la que actúa", false],
  ["razon_social", "Razón social", false],
  ["nombre_comercial", "Nombre comercial", false],
  ["direccion", "Dirección para notificaciones", true],
  ["lugar_fecha", "Lugar y fecha del memorial", true, "Ej. Guatemala, 9 de octubre de 2026"],
];

export default function Memorial() {
  const { estado, actualizar } = useRit();
  // Mientras el usuario no escriba el dato, se hereda de «Datos de la empresa».
  const m: DatosMemorial = {
    ...estado.memorial,
    rep_nombre: estado.memorial.rep_nombre || estado.empresa.representante_legal,
    razon_social: estado.memorial.razon_social || estado.empresa.razon_social,
    nombre_comercial: estado.memorial.nombre_comercial || estado.empresa.nombre_comercial,
  };
  const set = (k: keyof DatosMemorial, v: string) => actualizar((s) => ({ ...s, memorial: { ...s.memorial, [k]: v } }));
  const completo = memorialCompleto(estado);

  return (
    <Pagina
      titulo="Memorial de solicitud"
      descripcion="Escrito dirigido al Inspector General de Trabajo para pedir la aprobación del reglamento. Los datos de la empresa se completan solos."
      acciones={<Boton onClick={async () => saveAs(await generarMemorialBlob(m), nombreArchivo(`Memorial IGT ${m.razon_social || "empresa"}`, "docx"))}>Descargar memorial (.docx)</Boton>}
    >
      {!completo && <Aviso tono="warn">Faltan datos obligatorios. Puede descargar el memorial, pero los campos vacíos saldrán como [MARCADOR].</Aviso>}
      <Tarjeta>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
          {CAMPOS.map(([k, et, ancho, ayuda]) => <Texto key={k} etiqueta={et} ancho={ancho} ayuda={ayuda} value={m[k]} onChange={(e) => set(k, e.target.value)} />)}
        </form>
      </Tarjeta>
      <Tarjeta titulo="Documentos que acompañan al memorial">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Dos ejemplares impresos del reglamento.</li>
          <li>Fotocopia del nombramiento del representante legal inscrito en el Registro Mercantil.</li>
          <li>Fotocopia de la patente de comercio de sociedad y de empresa.</li>
          <li>Fotocopia del DPI del representante legal.</li>
          <li>Planilla del IGSS o Informe Anual del Empleador que acredite el número de trabajadores.</li>
        </ul>
      </Tarjeta>
    </Pagina>
  );
}
