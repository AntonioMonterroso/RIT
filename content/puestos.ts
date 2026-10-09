// Puestos típicos por giro, con responsabilidades críticas y bienes en custodia sugeridos.
import type { Giro } from "@/lib/tipos";

export interface PuestoModelo {
  nombre: string;
  jefe: string;
  responsabilidades: string[];
  activos: string;
}

export const PUESTOS_POR_GIRO: Record<Giro, PuestoModelo[]> = {
  comercio: [
    { nombre: "Gerente de tienda", jefe: "Representante legal", responsabilidades: ["Supervisar la operación diaria y el cumplimiento de metas", "Controlar el inventario y los arqueos de caja", "Administrar al personal y los horarios"], activos: "Llaves, caja fuerte, sistema de ventas" },
    { nombre: "Cajero", jefe: "Gerente de tienda", responsabilidades: ["Cobrar y registrar cada venta con exactitud", "Realizar el cuadre de caja al cierre", "Reportar de inmediato cualquier faltante"], activos: "Fondo de caja y terminal de cobro" },
    { nombre: "Vendedor", jefe: "Gerente de tienda", responsabilidades: ["Atender al cliente con cortesía y asesorarlo", "Mantener ordenada y rotulada el área de ventas", "Registrar correctamente los pedidos"], activos: "Mercadería de su área" },
    { nombre: "Bodeguero", jefe: "Gerente de tienda", responsabilidades: ["Recibir y despachar mercadería con documentos", "Mantener actualizado el inventario", "Resguardar la bodega"], activos: "Inventario de bodega y montacargas o equipo asignado" },
  ],
  restaurante: [
    { nombre: "Administrador", jefe: "Representante legal", responsabilidades: ["Dirigir la operación del turno", "Controlar costos, inventarios y cierres de caja", "Velar por la higiene y la seguridad"], activos: "Llaves, caja fuerte, fondo de caja" },
    { nombre: "Cocinero", jefe: "Administrador", responsabilidades: ["Preparar los platillos según las recetas y estándares", "Cumplir las normas de higiene de alimentos", "Reportar faltantes y mermas"], activos: "Equipo de cocina y materia prima" },
    { nombre: "Mesero", jefe: "Administrador", responsabilidades: ["Atender a los comensales con cortesía", "Registrar correctamente las órdenes y cuentas", "Mantener limpia y ordenada su área"], activos: "Comandas, vajilla y cristalería" },
    { nombre: "Cajero", jefe: "Administrador", responsabilidades: ["Cobrar y registrar cada cuenta", "Realizar el cuadre de caja al cierre", "Reportar diferencias de inmediato"], activos: "Fondo de caja y terminal de cobro" },
  ],
  servicios: [
    { nombre: "Gerente administrativo", jefe: "Representante legal", responsabilidades: ["Dirigir las áreas administrativas y financieras", "Aprobar pagos y controlar presupuestos", "Velar por el cumplimiento de políticas internas"], activos: "Firmas autorizadas y claves de sistemas" },
    { nombre: "Asistente administrativo", jefe: "Gerente administrativo", responsabilidades: ["Atender comunicaciones y archivo", "Preparar documentos y reportes en tiempo", "Resguardar la confidencialidad de la información"], activos: "Equipo de cómputo y archivo físico" },
    { nombre: "Contador", jefe: "Gerente administrativo", responsabilidades: ["Registrar las operaciones contables con exactitud", "Presentar declaraciones y obligaciones tributarias a tiempo", "Resguardar la documentación contable"], activos: "Libros contables y accesos a sistemas contables" },
    { nombre: "Recepcionista", jefe: "Gerente administrativo", responsabilidades: ["Atender visitantes y llamadas con cortesía", "Registrar el ingreso de visitantes", "Resguardar la correspondencia"], activos: "Central telefónica y registros de visitas" },
  ],
  educacion: [
    { nombre: "Director", jefe: "Representante legal", responsabilidades: ["Dirigir la gestión académica y administrativa", "Velar por el cumplimiento del calendario escolar", "Atender a padres de familia y autoridades"], activos: "Archivo académico y sellos oficiales" },
    { nombre: "Docente", jefe: "Director", responsabilidades: ["Planificar e impartir las clases asignadas", "Registrar asistencia y calificaciones en tiempo", "Cuidar la integridad y el trato debido a los alumnos"], activos: "Material didáctico y equipo del aula" },
    { nombre: "Secretaria", jefe: "Director", responsabilidades: ["Atender a padres y alumnos", "Llevar el archivo y las constancias oficiales", "Recibir y registrar pagos cuando corresponda"], activos: "Archivo, fondo de caja chica y sellos" },
    { nombre: "Conserje", jefe: "Director", responsabilidades: ["Mantener limpias las instalaciones", "Abrir y cerrar las instalaciones según el horario", "Reportar daños y riesgos"], activos: "Llaves y materiales de limpieza" },
  ],
  industria: [
    { nombre: "Jefe de producción", jefe: "Representante legal", responsabilidades: ["Planificar y supervisar la producción", "Hacer cumplir las normas de seguridad", "Controlar la calidad y los desperdicios"], activos: "Maquinaria, materia prima y producto en proceso" },
    { nombre: "Operario", jefe: "Jefe de producción", responsabilidades: ["Operar la maquinaria asignada con el procedimiento seguro", "Cumplir las metas y estándares de calidad", "Reportar fallas y condiciones inseguras"], activos: "Herramientas y equipo asignado" },
    { nombre: "Bodeguero", jefe: "Jefe de producción", responsabilidades: ["Recibir, almacenar y despachar con documentos", "Mantener actualizado el inventario", "Aplicar las normas de seguridad en bodega"], activos: "Inventario de materia prima y producto terminado" },
    { nombre: "Piloto", jefe: "Jefe de producción", responsabilidades: ["Conducir con licencia vigente y respetar las leyes de tránsito", "Entregar la mercadería con su documentación", "Reportar cualquier accidente o daño de inmediato"], activos: "Vehículo, combustible y carga transportada" },
  ],
  otro: [
    { nombre: "Gerente general", jefe: "Representante legal", responsabilidades: ["Dirigir la operación y cumplir las metas", "Administrar al personal", "Resguardar los activos de la empresa"], activos: "Llaves y accesos de la empresa" },
    { nombre: "Asistente", jefe: "Gerente general", responsabilidades: ["Apoyar las labores administrativas", "Mantener ordenado el archivo", "Resguardar la información confidencial"], activos: "Equipo de oficina" },
    { nombre: "Operativo", jefe: "Gerente general", responsabilidades: ["Ejecutar las tareas asignadas a su puesto", "Cumplir las normas de seguridad", "Reportar novedades a su jefe inmediato"], activos: "Herramientas y equipo asignado" },
  ],
};
