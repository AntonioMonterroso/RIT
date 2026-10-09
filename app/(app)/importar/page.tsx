import type { Metadata } from "next";
import Importar from "@/components/vistas/Importar";

export const metadata: Metadata = { title: "Importar RIT" };

export default function Page() {
  return <Importar />;
}
