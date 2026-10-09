import type { Metadata } from "next";
import Biblioteca from "@/components/Biblioteca";

export const metadata: Metadata = { title: "Biblioteca legal" };

export default function Page() {
  return <Biblioteca />;
}
