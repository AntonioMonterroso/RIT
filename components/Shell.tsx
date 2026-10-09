"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { saveAs } from "file-saver";
import { generarDocxBlob } from "@/lib/docx";
import { clienteSupabase, supabaseConfigurado } from "@/lib/supabase/cliente";
import { pasos, avanceGeneral } from "@/lib/progreso";
import { pendientesTotales } from "@/lib/revision";
import { useRit } from "./EstadoProvider";
import { Icono, type NombreIcono } from "./Iconos";
import { Boton, Insignia } from "./ui";

interface Item { href: string; texto: string; icono: NombreIcono }

const PROCESO: Item[] = [
  { href: "/diagnostico", texto: "Diagnóstico", icono: "diagnostico" },
  { href: "/puestos", texto: "Puestos", icono: "puestos" },
  { href: "/editor", texto: "Redacción", icono: "redaccion" },
  { href: "/auditoria", texto: "Auditoría IGT", icono: "auditoria" },
  { href: "/memorial", texto: "Memorial", icono: "memorial" },
  { href: "/tramite", texto: "Trámite IGT", icono: "tramite" },
  { href: "/publicidad", texto: "Publicidad y vigencia", icono: "publicidad" },
];
const RECURSOS: Item[] = [
  { href: "/plantillas", texto: "Cláusulas", icono: "plantillas" },
  { href: "/formatos", texto: "Formatos", icono: "formatos" },
  { href: "/biblioteca", texto: "Biblioteca legal", icono: "biblioteca" },
  { href: "/calendario", texto: "Calendario", icono: "calendario" },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const ruta = usePathname();
  const router = useRouter();
  const { estado, guardado, urgentes, listo } = useRit();
  const [abierto, setAbierto] = useState(false);
  // En el editor la barra lateral se reduce a íconos para dar espacio a la hoja.
  const compacto = ruta === "/editor";
  const avance = avanceGeneral(pasos(estado));
  const nombre = estado.empresa.nombre_comercial || estado.empresa.razon_social || "Mi empresa";

  const descargar = async () => {
    const pend = pendientesTotales(estado.capitulos);
    if (pend > 0 && !window.confirm(`Hay ${pend} dato(s) marcados como [COMPLETAR] en el reglamento. ¿Descargar de todos modos?`)) return;
    const blob = await generarDocxBlob({ empresa: estado.empresa, capitulos: estado.capitulos });
    saveAs(blob, `RIT_${nombre.replace(/\s+/g, "_")}.docx`);
  };
  const salir = async () => { await clienteSupabase()?.auth.signOut(); router.replace("/acceso"); };

  const enlace = (i: Item) => {
    const activo = ruta === i.href;
    return (
      <li key={i.href}>
        <Link href={i.href} title={i.texto} onClick={() => setAbierto(false)} aria-current={activo ? "page" : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 ${compacto ? "md:justify-center md:px-0" : ""} text-sm font-medium transition-colors ${activo ? "bg-brand-50 text-brand-700" : "text-ink hover:bg-canvas"}`}>
          <span className="relative text-brand-600"><Icono nombre={i.icono} />{compacto && i.href === "/calendario" && urgentes > 0 && <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-warn" />}</span>
          <span className={`flex-1 ${compacto ? "md:sr-only" : ""}`}>{i.texto}</span>
          {i.href === "/calendario" && urgentes > 0 && <span className={compacto ? "md:hidden" : ""}><Insignia tono="warn">{urgentes}</Insignia></span>}
        </Link>
      </li>
    );
  };
  const grupo = (titulo: string, items: Item[]) => (
    <div className="mt-5">
      <p className={`px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted ${compacto ? "md:hidden" : ""}`}>{titulo}</p>
      <ul className="space-y-0.5">{items.map(enlace)}</ul>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <aside className={`no-imprimir fixed inset-y-0 left-0 z-30 flex w-64 flex-col ${compacto ? "md:w-16 md:px-2" : ""} border-r border-line bg-surface px-3 py-4 transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 ${abierto ? "translate-x-0" : "-translate-x-full max-md:invisible"}`}>
        <Link href="/inicio" onClick={() => setAbierto(false)} aria-label="RIT Guatemala, ir al inicio" className={`flex items-center gap-2.5 px-3 pb-2 ${compacto ? "md:justify-center md:px-0" : ""}`}>
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-700 text-sm font-extrabold text-white">R</span>
          <span className={compacto ? "md:hidden" : ""}><span className="block text-sm font-bold leading-tight">RIT Guatemala</span><span className="block text-xs text-muted">Reglamento Interior de Trabajo</span></span>
        </Link>
        <nav aria-label="Principal" className="flex-1 overflow-y-auto pb-4">
          <ul className="mt-3"><li><Link href="/inicio" onClick={() => setAbierto(false)} aria-current={ruta === "/inicio" ? "page" : undefined}
            title="Inicio" className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${compacto ? "md:justify-center md:px-0" : ""} ${ruta === "/inicio" ? "bg-brand-50 text-brand-700" : "text-ink hover:bg-canvas"}`}>
            <span className="text-brand-600"><Icono nombre="inicio" /></span><span className={compacto ? "md:sr-only" : ""}>Inicio</span></Link></li></ul>
          {grupo("Proceso", PROCESO)}
          {grupo("Recursos", RECURSOS)}
          <ul className="mt-5">{enlace({ href: "/ajustes", texto: "Ajustes y respaldo", icono: "ajustes" })}</ul>
        </nav>
        <div className={`rounded-lg bg-canvas p-3 ${compacto ? "md:hidden" : ""}`}>
          <div className="flex items-baseline justify-between text-xs"><span className="font-semibold">Avance del RIT</span><span className="font-bold text-brand-700">{listo ? `${avance}%` : "…"}</span></div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-brand-600" style={{ width: `${avance}%` }} /></div>
        </div>
      </aside>
      {abierto && <button aria-label="Cerrar menú" onClick={() => setAbierto(false)} className="no-imprimir fixed inset-0 z-20 bg-ink/40 md:hidden" />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-imprimir sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur md:px-8">
          <button onClick={() => setAbierto(true)} aria-label="Abrir menú" className="grid h-9 w-9 place-items-center rounded-lg border border-line md:hidden">☰</button>
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">{nombre}</p>
          <span className="hidden text-xs text-muted sm:inline" role="status" aria-live="polite">
            {guardado === "guardando" ? "Guardando…" : guardado === "ok" ? "Guardado" : guardado === "error" ? "No se pudo guardar" : ""}
          </span>
          <Boton variante="secundario" pequeno onClick={descargar}>Descargar RIT (.docx)</Boton>
          {supabaseConfigurado && <Boton variante="fantasma" pequeno onClick={salir}>Salir</Boton>}
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
