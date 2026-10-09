import { useEffect, type ComponentType } from "react";
import EstadoProvider from "@/components/EstadoProvider";
import Shell from "@/components/Shell";
import PanelOrganizador from "@/components/PanelOrganizador";
import Biblioteca from "@/components/Biblioteca";
import Calendario from "@/components/Calendario";
import Inicio from "@/components/vistas/Inicio";
import Diagnostico from "@/components/vistas/Diagnostico";
import Puestos from "@/components/vistas/Puestos";
import Redaccion from "@/components/editor/Redaccion";
import Auditoria from "@/components/vistas/Auditoria";
import Memorial from "@/components/vistas/Memorial";
import Tramite from "@/components/vistas/Tramite";
import Publicidad from "@/components/vistas/Publicidad";
import Plantillas from "@/components/vistas/Plantillas";
import Formatos from "@/components/vistas/Formatos";
import Ajustes from "@/components/vistas/Ajustes";
import VistaPrevia from "@/components/vistas/VistaPrevia";
import Versiones from "@/components/vistas/Versiones";
import Ayuda from "@/components/vistas/Ayuda";
import Importar from "@/components/vistas/Importar";
import Aprobaciones from "@/components/vistas/Aprobaciones";
import Equipo from "@/components/vistas/Equipo";
import Novedades from "@/components/vistas/Novedades";
import Cumplimiento from "@/components/vistas/Cumplimiento";
import Plan from "@/components/vistas/Plan";
import Bienvenida from "@/components/vistas/Bienvenida";
import { usePathname } from "./shims/navigation";

const PANTALLAS: Record<string, ComponentType> = {
  "/inicio": Inicio, "/diagnostico": Diagnostico, "/puestos": Puestos, "/editor": Redaccion,
  "/auditoria": Auditoria, "/memorial": Memorial, "/tramite": Tramite, "/publicidad": Publicidad,
  "/plantillas": Plantillas, "/formatos": Formatos, "/biblioteca": Biblioteca, "/calendario": Calendario, "/ajustes": Ajustes,
  "/vista-previa": VistaPrevia, "/versiones": Versiones, "/ayuda": Ayuda, "/importar": Importar,
  "/aprobaciones": Aprobaciones, "/equipo": Equipo, "/novedades": Novedades, "/cumplimiento": Cumplimiento, "/plan": Plan,
};

export default function Raiz() {
  const ruta = usePathname();
  useEffect(() => { window.scrollTo(0, 0); }, [ruta]);

  // La raíz muestra la portada; una ruta desconocida lleva al Inicio.
  const publica = ruta === "/" || ruta === "/bienvenida";
  useEffect(() => { if (!publica && ruta !== "/organizador" && !PANTALLAS[ruta]) window.location.replace("#/inicio"); }, [ruta, publica]);

  if (publica) return <Bienvenida />;
  if (ruta === "/organizador") return <PanelOrganizador />;
  const Pantalla = PANTALLAS[ruta] ?? Inicio;
  return (
    <EstadoProvider>
      <Shell><Pantalla /></Shell>
    </EstadoProvider>
  );
}
