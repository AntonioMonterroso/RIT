import type { Metadata } from "next";
import Acceso from "@/components/Acceso";

export const metadata: Metadata = { title: "Acceso" };

export default function Page() {
  return <Acceso />;
}
