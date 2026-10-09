import type { Metadata } from "next";
import Seguridad from "@/components/vistas/Seguridad";

export const metadata: Metadata = { title: "Seguridad y salud" };

export default function Page() {
  return <Seguridad />;
}
