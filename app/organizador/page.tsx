import type { Metadata } from "next";
import PanelOrganizador from "@/components/PanelOrganizador";

export const metadata: Metadata = { title: "Panel de administración" };

export default function Page() {
  return <PanelOrganizador />;
}
