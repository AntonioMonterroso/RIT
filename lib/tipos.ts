export type Giro = "comercio" | "restaurante" | "servicios" | "educacion" | "industria" | "otro";

export const GIROS: { id: Giro; nombre: string; ejemplo: string }[] = [
  { id: "comercio", nombre: "Comercio", ejemplo: "Tiendas, distribuidoras, ferreterías" },
  { id: "restaurante", nombre: "Restaurante y alimentos", ejemplo: "Restaurantes, cafeterías, panaderías" },
  { id: "servicios", nombre: "Servicios y oficinas", ejemplo: "Despachos, agencias, clínicas, call centers" },
  { id: "educacion", nombre: "Educación", ejemplo: "Colegios, academias, institutos" },
  { id: "industria", nombre: "Industria y producción", ejemplo: "Fábricas, talleres, bodegas, logística" },
  { id: "otro", nombre: "Otro giro", ejemplo: "Se aplicarán cláusulas generales" },
];

export type Marca = "biometrico" | "reloj" | "libro";

export interface Diagnostico {
  completo: boolean;
  giro: Giro;
  trabajadores: number;
  entrada: string;          // HH:MM
  salida: string;           // HH:MM
  almuerzoMin: number;
  almuerzoComputa: boolean; // si el almuerzo cuenta como tiempo efectivo
  diasLaborales: string;
  tolerancia: number;
  periodo: "quincenal" | "mensual";
  marca: Marca;
  turnos: boolean;
  teletrabajo: boolean;
  manejaEfectivo: boolean;
  usaVehiculos: boolean;
  atencionCliente: boolean;
  uniforme: boolean;
  epp: boolean;
}

export const DIAGNOSTICO_INICIAL: Diagnostico = {
  completo: false, giro: "comercio", trabajadores: 10,
  entrada: "08:00", salida: "17:00", almuerzoMin: 60, almuerzoComputa: false,
  diasLaborales: "lunes a viernes", tolerancia: 10, periodo: "quincenal", marca: "biometrico",
  turnos: false, teletrabajo: false, manejaEfectivo: false, usaVehiculos: false,
  atencionCliente: true, uniforme: false, epp: false,
};

export interface Puesto {
  id: string;
  nombre: string;
  jefe: string;
  responsabilidades: string[]; // 3 a 5
  activos: string;             // bienes o fondos bajo custodia
}

export type EstadoTramite = "sin_iniciar" | "presentado" | "con_previo" | "aprobado";

export interface Tramite {
  estado: EstadoTramite;
  fechaPresentacion: string;
  expediente: string;
  fechaPrevio: string;
  notaPrevio: string;
  fechaAprobacion: string;
}

export const TRAMITE_INICIAL: Tramite = {
  estado: "sin_iniciar", fechaPresentacion: "", expediente: "", fechaPrevio: "", notaPrevio: "", fechaAprobacion: "",
};
