"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clienteSupabase } from "@/lib/supabase/cliente";

/** Cabecera común de las pantallas de apoyo (biblioteca, calendario, organizador). */
export default function Marco({ titulo, enlaces, children }: {
  titulo: string; enlaces: { href: string; texto: string }[]; children: React.ReactNode;
}) {
  const router = useRouter();
  const salir = async () => { await clienteSupabase()?.auth.signOut(); router.replace("/acceso"); };
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between bg-[var(--primary)] px-5 py-2.5 text-white">
        <h1 className="text-base font-semibold">{titulo}</h1>
        <nav className="flex items-center gap-4 text-sm">
          {enlaces.map((e) => <Link key={e.href} href={e.href} className="hover:underline">{e.texto}</Link>)}
          <button onClick={salir} className="rounded bg-white/15 px-3 py-1 font-semibold hover:bg-white/25">Salir</button>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 p-6">{children}</main>
    </div>
  );
}
