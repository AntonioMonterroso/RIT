"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clienteSupabase, supabaseConfigurado } from "@/lib/supabase/cliente";

type Paso = "cargando" | "credenciales" | "empresa";

export default function Acceso() {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>("cargando");
  const [modo, setModo] = useState<"entrar" | "crear">("entrar");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [ocupado, setOcupado] = useState(false);

  /** Decide a dónde ir según haya sesión y empresa. */
  const encaminar = useCallback(async () => {
    const db = clienteSupabase();
    if (!db) return router.replace("/inicio");
    const { data: sesion } = await db.auth.getSession();
    if (!sesion.session) return setPaso("credenciales");
    const { data: perfil, error } = await db.from("perfiles").select("rol").maybeSingle();
    if (error) { setMensaje("No se pudo consultar su cuenta. Intente de nuevo."); return setPaso("credenciales"); }
    if (!perfil) return setPaso("empresa");
    router.replace(perfil.rol === "organizador" ? "/organizador" : "/inicio");
  }, [router]);

  useEffect(() => { void encaminar(); }, [encaminar]);

  async function enviarCredenciales(e: React.FormEvent) {
    e.preventDefault();
    const db = clienteSupabase();
    if (!db) return;
    setOcupado(true); setMensaje("");
    const { data, error } = modo === "entrar"
      ? await db.auth.signInWithPassword({ email: correo, password: clave })
      : await db.auth.signUp({ email: correo, password: clave });
    setOcupado(false);
    if (error) return setMensaje(error.message);
    if (!data.session) return setMensaje("Le enviamos un correo para confirmar su cuenta. Ábralo y vuelva a entrar.");
    await encaminar();
  }

  async function crearEmpresa(e: React.FormEvent) {
    e.preventDefault();
    const db = clienteSupabase();
    if (!db) return;
    setOcupado(true); setMensaje("");
    const { error } = await db.rpc("crear_empresa", { p_nombre: empresa });
    setOcupado(false);
    if (error) return setMensaje(error.message);
    router.replace("/inicio");
  }

  const campo = "mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-normal";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="mb-1 text-2xl font-bold text-[var(--primary)]">RIT Guatemala</h1>
      <p className="mb-6 text-sm text-slate-600">Reglamento Interior de Trabajo de su empresa.</p>

      {!supabaseConfigurado && (
        <p className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Las cuentas no están configuradas en este entorno. Puede usar el{" "}
          <a className="font-semibold underline" href="/inicio">sistema en modo local</a>; su borrador se guarda solo en este navegador.
        </p>
      )}

      {supabaseConfigurado && paso === "cargando" && <p className="text-sm text-slate-500" role="status">Cargando…</p>}

      {paso === "credenciales" && (
        <form onSubmit={enviarCredenciales} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
          <div role="tablist" className="flex gap-4 border-b border-slate-200 text-sm font-semibold">
            {(["entrar", "crear"] as const).map((m) => (
              <button type="button" role="tab" key={m} aria-selected={modo === m} onClick={() => { setModo(m); setMensaje(""); }}
                className={`border-b-2 pb-2 ${modo === m ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-slate-500"}`}>
                {m === "entrar" ? "Entrar" : "Crear cuenta"}
              </button>
            ))}
          </div>
          <label className="block text-sm font-semibold">Correo electrónico
            <input type="email" required autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} className={campo} />
          </label>
          <label className="block text-sm font-semibold">Contraseña
            <input type="password" required minLength={8} autoComplete={modo === "entrar" ? "current-password" : "new-password"}
              value={clave} onChange={(e) => setClave(e.target.value)} className={campo} />
          </label>
          <button disabled={ocupado} className="w-full rounded bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {modo === "entrar" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>
      )}

      {paso === "empresa" && (
        <form onSubmit={crearEmpresa} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-600">Último paso: indique el nombre de su empresa.</p>
          <label className="block text-sm font-semibold">Nombre de la empresa
            <input required minLength={2} value={empresa} onChange={(e) => setEmpresa(e.target.value)} className={campo} />
          </label>
          <button disabled={ocupado} className="w-full rounded bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            Continuar
          </button>
        </form>
      )}

      {mensaje && <p role="alert" className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{mensaje}</p>}
    </main>
  );
}
