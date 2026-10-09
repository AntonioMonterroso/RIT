import type { Metadata } from "next";
import Equipo from "@/components/vistas/Equipo";

export const metadata: Metadata = { title: "Equipo y roles" };

export default function Page() {
  return <Equipo />;
}
