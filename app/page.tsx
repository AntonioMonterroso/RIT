import type { Metadata } from "next";
import Bienvenida from "@/components/vistas/Bienvenida";

export const metadata: Metadata = { title: "Reglamento Interior de Trabajo, listo para la IGT" };

export default function Home() {
  return <Bienvenida />;
}
