import type { Metadata } from "next";
import Puestos from "@/components/vistas/Puestos";

export const metadata: Metadata = { title: "Puestos" };

export default function Page() {
  return <Puestos />;
}
