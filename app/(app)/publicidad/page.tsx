import type { Metadata } from "next";
import Publicidad from "@/components/vistas/Publicidad";

export const metadata: Metadata = { title: "Publicidad y vigencia" };

export default function Page() {
  return <Publicidad />;
}
