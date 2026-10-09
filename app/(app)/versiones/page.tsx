import type { Metadata } from "next";
import Versiones from "@/components/vistas/Versiones";

export const metadata: Metadata = { title: "Versiones" };

export default function Page() {
  return <Versiones />;
}
