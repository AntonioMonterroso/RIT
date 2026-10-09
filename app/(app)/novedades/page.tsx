import type { Metadata } from "next";
import Novedades from "@/components/vistas/Novedades";

export const metadata: Metadata = { title: "Novedades legales" };

export default function Page() {
  return <Novedades />;
}
