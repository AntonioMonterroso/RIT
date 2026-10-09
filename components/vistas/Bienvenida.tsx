"use client";

import Link from "next/link";
import { Anillo, Boton, Insignia } from "@/components/ui";
import { Icono, type NombreIcono } from "@/components/Iconos";
import TemaToggle from "@/components/TemaToggle";
import { moneda, PLANES, precioConfirmado } from "@/content/planes";
import { GIROS } from "@/lib/tipos";

const ir = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

const PASOS: { icono: NombreIcono; titulo: string; texto: string }[] = [
  { icono: "diagnostico", titulo: "Diagnostique", texto: "Responda sobre su giro, horario y operación. El sistema clasifica su jornada y avisa si excede el límite legal." },
  { icono: "redaccion", titulo: "Redacte", texto: "Reciba un borrador de unos 57 artículos a su medida y edítelo en un editor tipo Word con guía legal en cada capítulo." },
  { icono: "auditoria", titulo: "Audite", texto: "Los 16 criterios de la IGT se verifican leyendo su texto. Sabe qué falta y dónde corregirlo antes de presentar." },
  { icono: "tramite", titulo: "Presente y publique", texto: "Memorial, seguimiento del trámite, constancias de recibo y cálculo de la entrada en vigor a los 15 días." },
];

const FUNCIONES: { icono: NombreIcono; titulo: string; texto: string }[] = [
  { icono: "plantillas", titulo: "55+ cláusulas listas", texto: "Adaptadas a su empresa y a su giro: comercio, restaurante, servicios, educación e industria." },
  { icono: "puestos", titulo: "Anexo de puestos", texto: "Responsabilidades y custodia de bienes por puesto, para poder sancionar con respaldo." },
  { icono: "formatos", titulo: "Formatos en Word", texto: "Constancia de recibo, acta de divulgación, comunicado al personal y solicitud de reformas." },
  { icono: "calendario", titulo: "Calendario de plazos", texto: "Vigencia a 15 días, recordatorios propios y avisos generales con indicador de urgentes." },
  { icono: "biblioteca", titulo: "Biblioteca legal", texto: "Leyes y reglamentos de consulta, con búsqueda, publicados para todas las empresas." },
  { icono: "ajustes", titulo: "Respaldo y control", texto: "Copia de seguridad descargable y restauración. Cada empresa ve solo lo suyo." },
];

export default function Bienvenida() {
  return (
    <div className="min-h-screen overflow-x-clip">
      <header className="vidrio-fuerte sticky top-3 z-20 mx-3 mt-3 flex h-14 items-center gap-4 rounded-2xl px-4 md:mx-auto md:max-w-6xl">
        <span className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-xl degradado-boton text-sm font-black shadow-[0_0_20px_-2px_var(--glow)]">R</span>
          <span className="text-sm font-semibold tracking-tight">RIT Guatemala</span>
        </span>
        <nav aria-label="Secciones" className="ml-6 hidden items-center gap-5 text-sm text-muted md:flex">
          <button className="hover:text-ink" onClick={() => ir("como")}>Cómo funciona</button>
          <button className="hover:text-ink" onClick={() => ir("incluye")}>Qué incluye</button>
          <button className="hover:text-ink" onClick={() => ir("planes")}>Planes</button>
        </nav>
        <span className="ml-auto flex items-center gap-2"><TemaToggle /><Link href="/inicio"><Boton pequeno>Entrar al sistema</Boton></Link></span>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-16 md:px-8 lg:grid-cols-[1.15fr_1fr] lg:pt-24">
          <div className="aparece">
            <p className="etiqueta-mono mb-4 text-[11px] text-brand-600">Reglamento Interior de Trabajo · Guatemala</p>
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl">
              Su reglamento, <span className="degradado-texto">listo para la IGT</span> y en vigor.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Diagnostica su empresa, redacta unos 57 artículos a su medida, audita los 16 criterios de la Inspección General de Trabajo y le acompaña hasta la fecha de vigencia.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/diagnostico"><Boton className="h-12 px-6 text-base">Empezar el diagnóstico →</Boton></Link>
              <Boton variante="secundario" className="h-12 px-6 text-base" onClick={() => ir("como")}>Ver cómo funciona</Boton>
            </div>
            <p className="mt-4 text-xs text-muted">Sin tarjeta. Sus datos quedan en su navegador mientras prueba.</p>
          </div>

          <div aria-hidden className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-6 -z-10 sm:-inset-10 rounded-full bg-[radial-gradient(closest-side,var(--glow),transparent)]" />
            <div className="rotate-[-3deg] rounded-md bg-white p-7 shadow-[0_0_60px_-10px_var(--glow),0_30px_80px_-20px_rgba(0,0,0,0.7)]" style={{ fontFamily: '"Times New Roman", serif', color: "#0f172a" }}>
              <p className="text-center text-xs font-bold uppercase tracking-wide">Capítulo III: Jornadas, horarios y asistencia</p>
              <p className="mt-4 text-sm font-bold">Artículo 11. Jornada ordinaria</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-700">La jornada ordinaria de trabajo de la Empresa es diurna, comprendida entre las 6:00 y las 18:00 horas, y no podrá exceder de 8 horas diarias ni de 44 horas semanales, conforme a los artículos 116 al 124 del Código de Trabajo.</p>
              <div className="mt-4 space-y-2"><div className="h-1.5 rounded bg-slate-200" /><div className="h-1.5 w-11/12 rounded bg-slate-200" /><div className="h-1.5 w-4/5 rounded bg-slate-200" /></div>
              <p className="mt-5 text-sm font-bold">Artículo 12. Horario de trabajo</p>
              <div className="mt-2 space-y-2"><div className="h-1.5 rounded bg-slate-200" /><div className="h-1.5 w-9/12 rounded bg-slate-200" /></div>
            </div>
            <div className="vidrio-fuerte absolute right-0 -top-6 sm:-right-4 rounded-2xl p-3"><Anillo valor={100} etiqueta="Auditoría de ejemplo" tamano={84}><span className="etiqueta-mono text-sm font-semibold normal-case text-brand-700">100%</span></Anillo></div>
            <div className="vidrio-fuerte absolute -bottom-5 left-0 sm:-left-5 flex items-center gap-2 rounded-xl px-3 py-2 text-xs"><span className="h-2 w-2 rounded-full bg-ok shadow-[0_0_8px_var(--ok)]" />16 de 16 criterios IGT</div>
          </div>
        </section>

        <section aria-label="Cifras" className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-5 md:grid-cols-4 md:px-8">
          {[["57", "artículos generados"], ["55+", "cláusulas disponibles"], ["16", "criterios IGT auditados"], ["5", "giros con texto propio"]].map(([n, t]) => (
            <div key={t} className="vidrio rounded-2xl p-5"><p className="etiqueta-mono text-4xl font-semibold normal-case degradado-texto">{n}</p><p className="mt-1 text-sm text-muted">{t}</p></div>
          ))}
        </section>

        <section id="como" className="mx-auto max-w-6xl scroll-mt-24 px-5 pt-24 md:px-8">
          <p className="etiqueta-mono text-[11px] text-brand-600">Cómo funciona</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">De cero a un reglamento aprobado, en el orden correcto.</h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {PASOS.map((p, i) => (
              <li key={p.titulo} className="vidrio rounded-2xl p-6">
                <span className="flex items-center gap-3 text-brand-600"><Icono nombre={p.icono} className="h-6 w-6" /><span className="etiqueta-mono text-[10px] text-muted">Paso {i + 1}</span></span>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">{p.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="incluye" className="mx-auto max-w-6xl scroll-mt-24 px-5 pt-24 md:px-8">
          <p className="etiqueta-mono text-[11px] text-brand-600">Qué incluye</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">Todo lo que rodea al reglamento, no solo el documento.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FUNCIONES.map((f) => (
              <div key={f.titulo} className="rounded-2xl border border-line bg-velo p-6 transition-colors hover:border-brand-600/40">
                <span className="text-brand-600"><Icono nombre={f.icono} className="h-6 w-6" /></span>
                <h3 className="mt-4 font-semibold tracking-tight">{f.titulo}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.texto}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-2"><span className="mr-1 text-sm text-muted">Textos adaptados para:</span>{GIROS.filter((g) => g.id !== "otro").map((g) => <Insignia key={g.id} tono="marca">{g.nombre}</Insignia>)}</div>
        </section>

        <section id="planes" className="mx-auto max-w-6xl scroll-mt-24 px-5 pt-24 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="etiqueta-mono text-[11px] text-brand-600">Planes</p><h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Una suscripción por empresa.</h2></div>
            {!precioConfirmado && <Insignia tono="warn">Precios de ejemplo</Insignia>}
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {PLANES.map((p) => (
              <article key={p.id} className={`vidrio flex flex-col rounded-3xl p-7 ${p.destacado ? "borde-neon shadow-[0_0_50px_-12px_var(--glow)]" : ""}`}>
                <div className="flex items-center justify-between"><h3 className="text-lg font-semibold tracking-tight">{p.nombre}</h3>{p.destacado && <Insignia tono="marca">Más elegido</Insignia>}</div>
                <p className="mt-2 min-h-10 text-sm text-muted">{p.para}</p>
                <p className="mt-5"><span className="etiqueta-mono text-4xl font-semibold normal-case">{p.precio === null ? "A medida" : `${moneda} ${p.precio}`}</span></p>
                <p className="text-xs text-muted">{p.unidad}</p>
                <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                  {p.incluye.map((x) => <li key={x} className="flex gap-2.5"><span aria-hidden className="mt-0.5 text-ok">✓</span><span>{x}</span></li>)}
                </ul>
                <Link href="/inicio" className="mt-7"><Boton variante={p.destacado ? "primario" : "secundario"} className="w-full">{p.precio === null ? "Hablemos" : "Empezar"}</Boton></Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-24 md:px-8">
          <div className="vidrio borde-neon rounded-3xl p-8 text-center md:p-12">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">Empiece hoy: el diagnóstico toma cinco minutos.</h2>
            <Link href="/diagnostico"><Boton className="mt-7 h-12 px-8 text-base">Empezar el diagnóstico →</Boton></Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line px-5 py-8 text-center text-xs leading-relaxed text-muted md:px-8">
        <p className="mx-auto max-w-3xl">RIT Guatemala entrega plantillas y cálculos para elaborar su reglamento. No constituye asesoría legal: se recomienda que un abogado lo revise antes de presentarlo a la Inspección General de Trabajo.</p>
      </footer>
    </div>
  );
}
