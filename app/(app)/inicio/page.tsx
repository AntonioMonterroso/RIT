import type { Metadata } from "next";
import Inicio from "@/components/vistas/Inicio";

export const metadata: Metadata = { title: "Inicio" };

export default function Page() {
  return <Inicio />;
}
