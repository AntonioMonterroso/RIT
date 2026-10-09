import type { Metadata } from "next";
import Ayuda from "@/components/vistas/Ayuda";

export const metadata: Metadata = { title: "Ayuda" };

export default function Page() {
  return <Ayuda />;
}
