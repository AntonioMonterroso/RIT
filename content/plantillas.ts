// Biblioteca de cláusulas del RIT. Cada cláusula se adapta a los datos de la empresa y al
// diagnóstico. Redactadas a partir del kit EGE y de los artículos del Código de Trabajo
// citados en él. REQUIEREN REVISIÓN DE UN ABOGADO antes de uso comercial.
//
// Convenciones del texto: párrafos separados por línea en blanco; las líneas que empiezan con
// "- " forman una lista. Los datos que faltan salen como [COMPLETAR: ...] y el sistema avisa.
import type { CapituloKey } from "./capitulos";
import type { Diagnostico, Giro } from "@/lib/tipos";
import { LIMITES, type TipoJornada } from "@/lib/jornada";

export interface Ctx {
  empresa: string;
  comercial: string;
  representante: string;
  departamento: string;
  d: Diagnostico;
  tipo: TipoJornada;
}

export interface Clausula {
  id: string;
  capitulo: CapituloKey;
  titulo: string;
  resumen: string;
  /** ¿Se incluye automáticamente al generar el borrador para este diagnóstico? */
  auto: (d: Diagnostico) => boolean;
  texto: (c: Ctx) => string;
}

export const falta = (valor: string | undefined, etiqueta: string) =>
  valor && valor.trim() ? valor.trim() : `[COMPLETAR: ${etiqueta}]`;

const siempre = () => true;
const nunca = () => false;
const en = (...g: Giro[]) => (d: Diagnostico) => g.includes(d.giro);
const L = (...items: string[]) => items.map((i) => `- ${i}`).join("\n");

const horario = (c: Ctx) => `${c.d.diasLaborales}, de las ${c.d.entrada} a las ${c.d.salida} horas`;

export const CLAUSULAS: Clausula[] = [
  // ───────────── Capítulo I ─────────────
  {
    id: "c1_objeto", capitulo: "mod_1", titulo: "Objeto", resumen: "Para qué existe el reglamento y su base legal.", auto: siempre,
    texto: (c) => `El presente Reglamento Interior de Trabajo (en adelante, "el Reglamento") ha sido elaborado por ${falta(c.empresa, "razón social")} (en adelante, "la Empresa") con el objeto de precisar y regular las condiciones a que deben sujetarse la Empresa y sus trabajadores con motivo de la ejecución o prestación de servicios, de conformidad con los artículos 57 al 60 del Código de Trabajo de Guatemala (Decreto 1441 del Congreso de la República).`,
  },
  {
    id: "c1_ambito", capitulo: "mod_1", titulo: "Ámbito de aplicación", resumen: "A quién aplica, incluido personal en prueba y directivos.", auto: siempre,
    texto: (c) => `Las disposiciones de este Reglamento se aplican a todos los trabajadores de la Empresa, sin distinción de puesto o jerarquía, incluidos quienes se encuentren en período de prueba, en las instalaciones ubicadas en el departamento de ${falta(c.departamento, "departamento")} y en cualquier lugar donde presten servicios por cuenta de la Empresa.`,
  },
  {
    id: "c1_definiciones", capitulo: "mod_1", titulo: "Definiciones", resumen: "Términos que se usan a lo largo del reglamento.", auto: siempre,
    texto: () => `Para los efectos de este Reglamento se entiende por:\n\n${L("Empresa o patrono: la persona jurídica o individual que da empleo y dirige la prestación de los servicios.", "Trabajador o colaborador: la persona individual que presta a la Empresa sus servicios personales bajo subordinación y a cambio de un salario.", "Jefe inmediato: el trabajador que supervisa directamente a otro y representa al patrono frente a él.", "Reglamento: el presente Reglamento Interior de Trabajo, sus anexos y reformas aprobadas.")}`,
  },
  {
    id: "c1_representacion", capitulo: "mod_1", titulo: "Representación patronal", resumen: "Quién actúa en nombre del patrono.", auto: siempre,
    texto: (c) => `La representación legal de la Empresa corresponde a ${falta(c.representante, "representante legal")}. Los gerentes, administradores, jefes y demás personas que ejerzan funciones de dirección o administración representan al patrono frente a los trabajadores en lo que respecta a las instrucciones y decisiones propias de su cargo, conforme al Código de Trabajo.`,
  },
  {
    id: "c1_jerarquia", capitulo: "mod_1", titulo: "Jerarquía normativa y derechos mínimos", resumen: "Ninguna cláusula puede desmejorar derechos legales.", auto: siempre,
    texto: () => `Ninguna disposición de este Reglamento podrá interpretarse en perjuicio de los derechos mínimos e irrenunciables que la Constitución Política de la República, el Código de Trabajo, los convenios internacionales ratificados por Guatemala, los pactos colectivos y los contratos individuales reconocen a los trabajadores. En caso de contradicción prevalecerá la norma más favorable al trabajador.`,
  },

  // ───────────── Capítulo II ─────────────
  {
    id: "c2_ingreso", capitulo: "mod_2", titulo: "Requisitos de ingreso", resumen: "Qué se pide a quien aspira a un puesto, sin discriminar.", auto: siempre,
    texto: () => `Toda persona que aspire a ocupar un puesto en la Empresa deberá participar en el proceso de selección y presentar la documentación que se le solicite para acreditar su identidad y su idoneidad para el cargo, entre ella:\n\n${L("Documento Personal de Identificación (DPI).", "Número de Identificación Tributaria (NIT), cuando corresponda.", "Constancias o referencias de experiencia y estudios relacionados con el puesto.")}\n\nLa Empresa no discriminará a ningún aspirante por razón de sexo, etnia, religión, estado civil, discapacidad, condición económica o cualquier otra circunstancia ajena a su capacidad para el puesto, ni solicitará pruebas de embarazo ni información que viole la intimidad de la persona.`,
  },
  {
    id: "c2_contrato", capitulo: "mod_2", titulo: "Contrato individual de trabajo", resumen: "El contrato se hace por escrito.", auto: siempre,
    texto: () => `La relación de trabajo se formalizará mediante contrato individual de trabajo por escrito, conforme al artículo 28 del Código de Trabajo, en el que constarán, como mínimo, las partes, el puesto, el lugar de trabajo, el salario, la jornada y la duración del contrato. Cada parte conservará un ejemplar.`,
  },
  {
    id: "c2_prueba", capitulo: "mod_2", titulo: "Período de prueba", resumen: "Dos meses, conforme al artículo 81.", auto: siempre,
    texto: () => `Los dos primeros meses de trabajo se reputan de prueba, de conformidad con el artículo 81 del Código de Trabajo. Durante ese período cualquiera de las partes podrá dar por terminada la relación de trabajo sin responsabilidad. El personal en período de prueba queda sujeto a este Reglamento.`,
  },
  {
    id: "c2_expediente", capitulo: "mod_2", titulo: "Expediente personal", resumen: "Qué documentos se guardan y cómo se protegen.", auto: siempre,
    texto: () => `La Empresa llevará un expediente personal de cada trabajador que contendrá su documentación de ingreso, contrato, constancias de capacitación, amonestaciones y sanciones, licencias y demás documentos de la relación laboral. El expediente es confidencial: solo tendrán acceso a él el trabajador, su jefe inmediato, el área responsable de personal y las autoridades competentes.`,
  },
  {
    id: "c2_induccion", capitulo: "mod_2", titulo: "Inducción y capacitación", resumen: "Se informa del reglamento y las funciones desde el primer día.", auto: siempre,
    texto: () => `Al ingresar, cada trabajador recibirá inducción sobre sus funciones, las normas de seguridad de su puesto y este Reglamento, y firmará constancia de haber recibido un ejemplar. La Empresa podrá organizar capacitaciones que serán de asistencia obligatoria cuando se realicen dentro de la jornada de trabajo.`,
  },

  // ───────────── Capítulo III ─────────────
  {
    id: "c3_jornada", capitulo: "mod_3", titulo: "Jornada ordinaria", resumen: "Tipo de jornada y límite legal de horas, según su horario.", auto: siempre,
    texto: (c) => {
      const l = LIMITES[c.tipo];
      const rango = c.tipo === "diurna" ? "comprendida entre las 6:00 y las 18:00 horas del mismo día" : c.tipo === "nocturna" ? "comprendida entre las 18:00 horas de un día y las 6:00 horas del día siguiente" : "que abarca parte del período diurno y parte del nocturno, siempre que el trabajo nocturno sea menor de cuatro horas";
      const pago = c.tipo === "diurna" ? ", equivalentes a 48 horas para el pago del salario" : "";
      return `La jornada ordinaria de trabajo de la Empresa es ${c.tipo}, ${rango}, y no podrá exceder de ${l.diarias} horas diarias ni de ${l.semanales} horas semanales${pago}, conforme a los artículos 116 al 124 del Código de Trabajo.`;
    },
  },
  {
    id: "c3_horario", capitulo: "mod_3", titulo: "Horario de trabajo", resumen: "Días y horas de entrada y salida.", auto: siempre,
    texto: (c) => `El horario de trabajo es de ${horario(c)}. La Empresa podrá modificarlo cuando lo requiera la naturaleza de sus operaciones, respetando los límites legales de la jornada, informando a los trabajadores con anticipación razonable y sin causarles perjuicio injustificado.`,
  },
  {
    id: "c3_almuerzo", capitulo: "mod_3", titulo: "Tiempo de almuerzo y descansos", resumen: "Duración del almuerzo y si cuenta como tiempo efectivo.", auto: siempre,
    texto: (c) => c.d.almuerzoMin > 0
      ? `Los trabajadores dispondrán de ${c.d.almuerzoMin} minutos para el almuerzo y descanso dentro de la jornada. Este tiempo ${c.d.almuerzoComputa ? "se computa como tiempo de trabajo efectivo" : "no se computa como tiempo de trabajo efectivo, por lo que el trabajador podrá disponer libremente de él"}. El horario de almuerzo se organizará de forma que se garantice la continuidad del servicio.`
      : `La jornada se desarrolla de forma continua y el tiempo de descanso dentro de ella se computa como tiempo de trabajo efectivo, conforme a lo previsto en el Código de Trabajo.`,
  },
  {
    id: "c3_puntualidad", capitulo: "mod_3", titulo: "Puntualidad y tolerancia", resumen: "Margen de tolerancia y qué pasa con los atrasos.", auto: siempre,
    texto: (c) => `Los trabajadores deberán presentarse puntualmente a la hora de inicio de su jornada. Se concede una tolerancia de ${c.d.tolerancia} minutos para el ingreso, que no se considerará atraso. Pasado ese margen, el atraso se registrará y su reiteración podrá ser sancionada conforme al Capítulo de Régimen Disciplinario. La tolerancia no autoriza a salir antes de la hora de finalización de la jornada.`,
  },
  {
    id: "c3_registro", capitulo: "mod_3", titulo: "Registro de asistencia", resumen: "Cómo se marca la entrada y la salida.", auto: siempre,
    texto: (c) => {
      const medio = c.d.marca === "biometrico" ? "el sistema biométrico" : c.d.marca === "reloj" ? "el reloj marcador" : "el libro de asistencia";
      return `Todo trabajador deberá registrar personalmente su hora de entrada y de salida en ${medio} dispuesto por la Empresa. Está prohibido marcar por otra persona o permitir que otra persona marque por uno mismo. Si por una falla del sistema no pudiera registrarse la asistencia, el trabajador lo informará de inmediato a su jefe inmediato para que se deje constancia escrita.`;
    },
  },
  {
    id: "c3_ausencias", capitulo: "mod_3", titulo: "Ausencias y permisos", resumen: "Cómo se avisa y se justifica una inasistencia.", auto: siempre,
    texto: () => `El trabajador que no pueda presentarse a laborar deberá avisar a su jefe inmediato a la brevedad posible, por el medio que la Empresa indique, y acreditar el motivo dentro de las 48 horas siguientes a su reincorporación. La ausencia sin aviso ni justificación se tendrá como inasistencia injustificada. Los permisos para ausentarse durante la jornada deberán solicitarse con anticipación y ser autorizados por el jefe inmediato.`,
  },
  {
    id: "c3_extras", capitulo: "mod_3", titulo: "Horas extraordinarias", resumen: "Se trabajan solo con autorización previa y se pagan con recargo.", auto: siempre,
    texto: () => `Solo se considerará trabajo en jornada extraordinaria el que haya sido ordenado o autorizado previamente por escrito por el jefe inmediato o la gerencia. Las horas extraordinarias se pagarán con el recargo que establece el artículo 121 del Código de Trabajo. El trabajador no podrá prolongar su jornada por iniciativa propia ni se reconocerá tiempo extraordinario no autorizado.`,
  },
  {
    id: "c3_turnos", capitulo: "mod_3", titulo: "Turnos rotativos", resumen: "Cómo se asignan y cambian los turnos.", auto: (d) => d.turnos,
    texto: () => `Cuando las necesidades del servicio lo requieran, la Empresa organizará turnos rotativos que serán comunicados por escrito con al menos una semana de anticipación. Cada turno respetará los límites de su tipo de jornada y los descansos legales. Los cambios de turno entre trabajadores requieren autorización previa del jefe inmediato.`,
  },
  {
    id: "c3_teletrabajo", capitulo: "mod_3", titulo: "Teletrabajo y desconexión", resumen: "Reglas del trabajo a distancia y derecho a desconectarse.", auto: (d) => d.teletrabajo,
    texto: () => `Cuando se pacte trabajo a distancia, el trabajador deberá estar disponible dentro de la jornada acordada, cuidar los equipos y la información que la Empresa le entregue y cumplir las metas y entregables asignados. La Empresa garantiza el derecho del trabajador a no responder comunicaciones de trabajo fuera de su jornada ordinaria, salvo emergencias calificadas por la gerencia.`,
  },

  // ───────────── Capítulo IV ─────────────
  {
    id: "c4_descanso", capitulo: "mod_4", titulo: "Descanso semanal", resumen: "Un día de descanso remunerado por semana.", auto: siempre,
    texto: (c) => `Los trabajadores gozarán de un día de descanso remunerado después de cada semana de trabajo, conforme al artículo 126 del Código de Trabajo. Para el personal con horario de ${c.d.diasLaborales}, el descanso corresponderá a los días restantes de la semana. Quien labore en su día de descanso tendrá derecho a la remuneración que establece la ley.`,
  },
  {
    id: "c4_asuetos", capitulo: "mod_4", titulo: "Asuetos oficiales", resumen: "Días de asueto con goce de salario.", auto: siempre,
    texto: () => `Serán días de asueto con goce de salario los establecidos en el artículo 127 del Código de Trabajo:\n\n${L("1 de enero.", "Jueves, Viernes y Sábado Santos.", "1 de mayo.", "30 de junio.", "15 de septiembre.", "20 de octubre.", "1 de noviembre.", "24 de diciembre, medio día a partir de las 12:00 horas.", "25 de diciembre.", "31 de diciembre, medio día a partir de las 12:00 horas.", "El día de la festividad patronal de la localidad donde se encuentre el centro de trabajo.")}`,
  },
  {
    id: "c4_vacaciones", capitulo: "mod_4", titulo: "Vacaciones anuales", resumen: "15 días hábiles después de un año de servicios.", auto: siempre,
    texto: () => `Todo trabajador tiene derecho a quince días hábiles de vacaciones remuneradas después de cada año de servicios continuos, conforme a los artículos 130 al 137 del Código de Trabajo. La Empresa fijará la época de vacaciones de acuerdo con las necesidades del servicio, procurando conciliarla con el interés del trabajador. Las vacaciones no podrán compensarse en dinero, salvo al terminar la relación de trabajo por lo que esté pendiente, ni acumularse por más de dos años.`,
  },
  {
    id: "c4_licencias", capitulo: "mod_4", titulo: "Licencias con goce de salario", resumen: "Fallecimiento de familiares, matrimonio y nacimiento de hijo.", auto: siempre,
    texto: () => `La Empresa concederá licencia con goce de salario al trabajador en los casos que establece el artículo 61 del Código de Trabajo, entre ellos:\n\n${L("Fallecimiento del cónyuge, de los padres o de los hijos: tres días.", "Matrimonio del trabajador: cinco días.", "Nacimiento de un hijo: dos días.")}\n\nEl trabajador deberá avisar a su jefe inmediato y presentar la constancia que corresponda dentro de los tres días siguientes a su reincorporación.`,
  },
  {
    id: "c4_maternidad", capitulo: "mod_4", titulo: "Protección de la maternidad y lactancia", resumen: "Descansos y garantías de la trabajadora embarazada.", auto: siempre,
    texto: () => `La Empresa respetará los descansos de maternidad y los períodos de lactancia que la ley reconoce a las trabajadoras, así como la protección contra el despido durante el embarazo y el período de lactancia en los términos del Código de Trabajo. La trabajadora que se encuentre en estas condiciones deberá comunicarlo a la Empresa para que se adopten las medidas correspondientes.`,
  },
  {
    id: "c4_sin_goce", capitulo: "mod_4", titulo: "Permisos sin goce de salario", resumen: "Permisos personales fuera de los casos de ley.", auto: nunca,
    texto: () => `Fuera de los casos de licencia con goce de salario, el trabajador podrá solicitar permiso sin goce de salario por causa justificada. La solicitud se presentará por escrito con la anticipación posible y la Empresa resolverá según las necesidades del servicio. Los días autorizados no se computarán para efectos de vacaciones.`,
  },

  // ───────────── Capítulo V ─────────────
  {
    id: "c5_salario", capitulo: "mod_5", titulo: "Salario y período de pago", resumen: "Cada cuánto, dónde y cómo se paga.", auto: siempre,
    texto: (c) => `El salario se pagará por períodos ${c.d.periodo === "quincenal" ? "quincenales" : "mensuales"}, en día hábil y dentro de la jornada de trabajo, mediante transferencia bancaria, cheque o efectivo, según se acuerde en el contrato. El salario no podrá ser inferior al salario mínimo legal vigente que corresponda a la actividad de la Empresa. A cada pago se entregará al trabajador una constancia que detalle devengados y descuentos.`,
  },
  {
    id: "c5_deducciones", capitulo: "mod_5", titulo: "Deducciones", resumen: "Solo descuentos permitidos por la ley.", auto: siempre,
    texto: () => `Del salario del trabajador solo podrán efectuarse las deducciones que autorice la ley, entre ellas:\n\n${L("Las cuotas laborales del Instituto Guatemalteco de Seguridad Social.", "El Impuesto Sobre la Renta, cuando corresponda.", "Las retenciones ordenadas por autoridad judicial competente.", "Los anticipos de salario y descuentos que el trabajador haya autorizado por escrito y que la ley permita.")}\n\nEstá prohibido descontar multas o sanciones económicas por faltas disciplinarias.`,
  },
  {
    id: "c5_prestaciones", capitulo: "mod_5", titulo: "Aguinaldo y Bono 14", resumen: "Prestaciones anuales de ley.", auto: siempre,
    texto: () => `La Empresa pagará a sus trabajadores el aguinaldo conforme al Decreto 76-78 del Congreso de la República y la bonificación anual para trabajadores del sector privado y público (Bono 14) conforme al Decreto 42-92, en las épocas y condiciones que dichas leyes establecen.`,
  },
  {
    id: "c5_igualdad", capitulo: "mod_5", titulo: "Igualdad salarial", resumen: "A trabajo igual, salario igual.", auto: siempre,
    texto: () => `A trabajo igual desempeñado en puesto, jornada y condiciones de eficiencia también iguales, corresponde salario igual, conforme al artículo 89 del Código de Trabajo, sin discriminación alguna.`,
  },
  {
    id: "c5_comisiones", capitulo: "mod_5", titulo: "Comisiones e incentivos", resumen: "Cómo se calculan y pagan comisiones.", auto: en("comercio"),
    texto: () => `Cuando el contrato prevea comisiones o incentivos por ventas o resultados, las condiciones para su cálculo y pago constarán por escrito y se darán a conocer al trabajador. Las comisiones devengadas formarán parte del salario para los efectos legales que correspondan.`,
  },
  {
    id: "c5_propinas", capitulo: "mod_5", titulo: "Propinas", resumen: "Las propinas no sustituyen el salario.", auto: en("restaurante"),
    texto: () => `Las propinas que voluntariamente entreguen los clientes pertenecen a los trabajadores y se distribuirán conforme a las reglas internas que la Empresa dé a conocer. En ningún caso las propinas sustituirán ni se computarán como parte del salario que la Empresa debe pagar.`,
  },

  // ───────────── Capítulo VI ─────────────
  {
    id: "c6_obl_patrono", capitulo: "mod_6", titulo: "Obligaciones de la Empresa", resumen: "Lo que la empresa debe cumplir (art. 61).", auto: siempre,
    texto: () => `Son obligaciones de la Empresa las establecidas en el artículo 61 del Código de Trabajo, entre ellas:\n\n${L("Pagar el salario en la forma, tiempo y lugar convenidos.", "Proporcionar a los trabajadores los útiles, instrumentos y materiales necesarios para ejecutar el trabajo.", "Guardar a los trabajadores la debida consideración, absteniéndose de maltrato de palabra o de obra.", "Conceder las licencias y permisos que la ley establece.", "Mantener condiciones de higiene y seguridad en el centro de trabajo.", "Dar constancia escrita de la terminación del contrato cuando el trabajador la solicite.")}`,
  },
  {
    id: "c6_obl_trabajador", capitulo: "mod_6", titulo: "Obligaciones de los trabajadores", resumen: "Lo que debe cumplir el trabajador (art. 62).", auto: siempre,
    texto: () => `Son obligaciones de los trabajadores las establecidas en el artículo 62 del Código de Trabajo, entre ellas:\n\n${L("Desempeñar el servicio contratado con diligencia, en el tiempo, lugar y forma convenidos.", "Acatar las órdenes e instrucciones de la Empresa y de sus representantes relacionadas con el trabajo.", "Observar buena conducta durante el trabajo y respeto hacia sus compañeros, superiores y terceros.", "Guardar los secretos técnicos, comerciales o de fabricación de los productos a cuya elaboración concurra directa o indirectamente.", "Cuidar los bienes, instalaciones y equipos de la Empresa, y responder por su uso indebido.", "Observar las medidas preventivas e higiénicas que indique la Empresa o las autoridades.")}`,
  },
  {
    id: "c6_proh_patrono", capitulo: "mod_6", titulo: "Prohibiciones a la Empresa", resumen: "Lo que la empresa no puede hacer (art. 63).", auto: siempre,
    texto: () => `Queda prohibido a la Empresa y a sus representantes lo dispuesto en el artículo 63 del Código de Trabajo, entre ello:\n\n${L("Exigir o aceptar dinero de los trabajadores como gratificación para que se les admita en el trabajo.", "Obligar a los trabajadores a comprar artículos en determinados establecimientos.", "Ejercer coacción sobre los trabajadores en el ejercicio de sus derechos.", "Ejecutar o autorizar actos que restrinjan los derechos que la ley otorga a los trabajadores.")}`,
  },
  {
    id: "c6_proh_trabajador", capitulo: "mod_6", titulo: "Prohibiciones a los trabajadores", resumen: "Lo que el trabajador no puede hacer (art. 64).", auto: siempre,
    texto: () => `Queda prohibido a los trabajadores lo dispuesto en el artículo 64 del Código de Trabajo, entre ello:\n\n${L("Abandonar el trabajo en horas de labor sin causa justificada o sin licencia del patrono.", "Presentarse al trabajo bajo la influencia de bebidas alcohólicas, estupefacientes o drogas, o ingerirlas en el centro de trabajo.", "Portar armas de cualquier clase durante las horas de trabajo, salvo que la naturaleza del cargo lo exija.", "Hacer colectas o propaganda de cualquier clase dentro de las instalaciones sin autorización.", "Usar los bienes, equipos o herramientas de la Empresa para fines distintos de aquellos a que están destinados.")}`,
  },
  {
    id: "c6_confidencialidad", capitulo: "mod_6", titulo: "Confidencialidad y propiedad intelectual", resumen: "Protege listas de clientes, precios y bases de datos.", auto: siempre,
    texto: () => `Los trabajadores guardarán reserva sobre la información confidencial de la Empresa, tales como listas de clientes y proveedores, precios, procesos, bases de datos y documentos internos, durante la relación de trabajo y después de ella. La información, documentos y creaciones que el trabajador elabore en ejercicio de sus funciones pertenecen a la Empresa. Su divulgación no autorizada constituye falta grave.`,
  },
  {
    id: "c6_tecnologia", capitulo: "mod_6", titulo: "Uso de recursos tecnológicos", resumen: "Correo, equipos, internet y redes sociales.", auto: siempre,
    texto: () => `El correo institucional, los equipos de cómputo, el acceso a internet y las demás herramientas tecnológicas de la Empresa se entregan para fines laborales. La Empresa podrá supervisar su uso con respeto a la dignidad e intimidad del trabajador. Está prohibido instalar programas no autorizados, compartir claves de acceso y publicar en redes sociales información confidencial o expresiones que dañen la imagen de la Empresa o de sus compañeros.`,
  },
  {
    id: "c6_atencion", capitulo: "mod_6", titulo: "Atención al cliente", resumen: "Trato cortés y respeto al público.", auto: (d) => d.atencionCliente,
    texto: () => `Los trabajadores que atiendan al público brindarán un trato cortés, respetuoso y diligente a clientes y usuarios. Se prohíbe discutir con ellos, tratarlos con descortesía o aceptar de ellos pagos o regalos a cambio de preferencias indebidas.`,
  },
  {
    id: "c6_uniforme", capitulo: "mod_6", titulo: "Uniforme y presentación personal", resumen: "Uso del uniforme y buena presentación.", auto: (d) => d.uniforme,
    texto: () => `Los trabajadores usarán el uniforme que la Empresa entregue y mantendrán una presentación personal aseada y adecuada a sus funciones. El uniforme es propiedad de la Empresa y solo podrá usarse en horas y actividades de trabajo.`,
  },
  {
    id: "c6_custodia", capitulo: "mod_6", titulo: "Custodia de fondos, inventarios y bienes", resumen: "Responsabilidad por lo que se maneja en el puesto.", auto: (d) => d.manejaEfectivo,
    texto: () => `Los trabajadores a quienes se asigne el manejo de dinero, valores, inventarios, vehículos o equipos son responsables de su custodia, de registrar las operaciones con exactitud y de reportar de inmediato cualquier faltante o irregularidad. Los arqueos, conteos e inventarios podrán practicarse en cualquier momento con la presencia del trabajador responsable.`,
  },

  // ───────────── Capítulo VII ─────────────
  {
    id: "c7_sso", capitulo: "mod_7", titulo: "Seguridad y salud ocupacional", resumen: "Cumplimiento del Acuerdo Gubernativo 229-2014.", auto: siempre,
    texto: () => `La Empresa y sus trabajadores se sujetan al Reglamento de Salud y Seguridad Ocupacional (Acuerdo Gubernativo 229-2014 y sus reformas). La Empresa adoptará las medidas necesarias para proteger la vida, la seguridad y la salud de los trabajadores y, cuando por el número de trabajadores corresponda, conformará la organización de seguridad y salud que dicho reglamento exige.`,
  },
  {
    id: "c7_comite", capitulo: "mod_7", titulo: "Comité de seguridad y salud ocupacional", resumen: "Comité bipartito, cuando el reglamento de SSO lo exija.", auto: () => false,
    texto: () => `Cuando el Reglamento de Salud y Seguridad Ocupacional y sus reformas lo exijan, la Empresa conformará el comité bipartito de salud y seguridad ocupacional, integrado por igual número de representantes de la Empresa y de los trabajadores. Los trabajadores deberán colaborar con las actividades, capacitaciones y simulacros que el comité y el plan de salud y seguridad ocupacional determinen.`,
  },
  {
    id: "c7_epp", capitulo: "mod_7", titulo: "Equipo de protección personal", resumen: "Uso obligatorio del EPP entregado.", auto: siempre,
    texto: (c) => `${c.d.epp ? "La Empresa entregará sin costo el equipo de protección personal (EPP) que requiera cada puesto, y su uso será obligatorio durante la ejecución de las tareas que lo exijan." : "Cuando el puesto lo requiera, la Empresa entregará sin costo el equipo de protección personal (EPP) necesario, y su uso será obligatorio."} La negativa injustificada a usar el EPP o a cumplir las medidas de seguridad constituye falta grave.`,
  },
  {
    id: "c7_examenes", capitulo: "mod_7", titulo: "Reconocimientos médicos", resumen: "Exámenes periódicos de salud.", auto: siempre,
    texto: () => `Los trabajadores deberán someterse a los reconocimientos médicos periódicos que disponga la Empresa para la protección de su salud, los cuales se practicarán dentro de la jornada y a costa de la Empresa. Sus resultados serán confidenciales.`,
  },
  {
    id: "c7_accidentes", capitulo: "mod_7", titulo: "Accidentes y condiciones inseguras", resumen: "Cómo se reporta y atiende un accidente.", auto: siempre,
    texto: () => `Todo accidente de trabajo, incidente o condición insegura deberá reportarse de inmediato al jefe inmediato, quien lo comunicará a la gerencia y al Instituto Guatemalteco de Seguridad Social cuando corresponda. La Empresa prestará los primeros auxilios y facilitará el traslado del trabajador al centro asistencial.`,
  },
  {
    id: "c7_emergencias", capitulo: "mod_7", titulo: "Emergencias y evacuación", resumen: "Simulacros y rutas de evacuación.", auto: siempre,
    texto: () => `La Empresa mantendrá señalizadas las rutas de evacuación y los equipos contra incendio, y realizará simulacros periódicos de emergencia. La participación en los simulacros es obligatoria para todo el personal.`,
  },
  {
    id: "c7_maquinaria", capitulo: "mod_7", titulo: "Maquinaria y herramientas", resumen: "Operación segura de equipos.", auto: en("industria"),
    texto: () => `Solo el personal capacitado y autorizado podrá operar maquinaria, equipos y herramientas de la Empresa. Está prohibido retirar resguardos o dispositivos de seguridad, realizar reparaciones sin autorización y operar equipos en mal estado. Todo desperfecto deberá reportarse antes de continuar la labor.`,
  },
  {
    id: "c7_alimentos", capitulo: "mod_7", titulo: "Higiene en el manejo de alimentos", resumen: "Normas de inocuidad.", auto: en("restaurante"),
    texto: () => `El personal que manipule alimentos mantendrá estricta higiene personal, usará la indumentaria asignada, se lavará las manos conforme a los procedimientos de la Empresa y se abstendrá de trabajar con enfermedades transmisibles, informándolo de inmediato a su jefe inmediato.`,
  },
  {
    id: "c7_vehiculos", capitulo: "mod_7", titulo: "Conducción de vehículos", resumen: "Licencia vigente y conducción prudente.", auto: (d) => d.usaVehiculos,
    texto: () => `Los trabajadores que conduzcan vehículos de la Empresa deberán contar con licencia vigente de la categoría correspondiente, respetar las leyes de tránsito, no conducir bajo efectos de alcohol o drogas y reportar de inmediato cualquier accidente o daño al vehículo.`,
  },
  {
    id: "c7_pantallas", capitulo: "mod_7", titulo: "Trabajo con equipo de cómputo", resumen: "Ergonomía y pausas.", auto: en("servicios", "educacion"),
    texto: () => `El personal que trabaje de forma habitual frente a equipos de cómputo observará las pautas ergonómicas y las pausas activas que la Empresa indique para prevenir lesiones y fatiga visual.`,
  },

  // ───────────── Capítulo VIII ─────────────
  {
    id: "c8_escala", capitulo: "mod_8", titulo: "Medidas disciplinarias", resumen: "Escala de sanciones de menor a mayor.", auto: siempre,
    texto: () => `El incumplimiento de las obligaciones laborales o de este Reglamento podrá sancionarse, según su gravedad y de forma proporcional, con:\n\n${L("Amonestación verbal: para faltas leves cometidas por primera vez.", "Amonestación escrita: para la reincidencia en faltas leves o faltas de mediana gravedad, con copia al expediente.", "Suspensión de labores sin goce de salario de uno a ocho días: para faltas graves o reincidencia en faltas leves, previo cumplimiento del procedimiento interno.", "Despido justificado: cuando se incurra en alguna de las causales del artículo 77 del Código de Trabajo.")}`,
  },
  {
    id: "c8_leves", capitulo: "mod_8", titulo: "Faltas leves", resumen: "Atrasos, omisiones y descuidos menores.", auto: siempre,
    texto: (c) => {
      const extra: Record<Giro, string> = {
        comercio: "No mantener ordenados el área de ventas o el inventario asignado.",
        restaurante: "No mantener limpia y ordenada el área de trabajo o la indumentaria asignada.",
        servicios: "No mantener ordenado el espacio de trabajo y los archivos asignados.",
        educacion: "No mantener ordenados los materiales y registros del aula asignada.",
        industria: "No mantener limpia y ordenada el área de producción o bodega asignada.",
        otro: "No mantener ordenada el área de trabajo asignada.",
      };
      return `Son faltas leves, entre otras:\n\n${L("Los atrasos injustificados que excedan la tolerancia.", "Omitir el registro de entrada o salida sin causa justificada.", "Descuido menor en la presentación personal o el uso del uniforme.", "No avisar oportunamente una inasistencia que luego se justifica.", extra[c.d.giro])}`;
    },
  },
  {
    id: "c8_graves", capitulo: "mod_8", titulo: "Faltas graves", resumen: "Reincidencia, abandono, daño a bienes, falta de respeto.", auto: siempre,
    texto: (c) => {
      const extra: Record<Giro, string> = {
        comercio: "Registrar incorrectamente ventas, cobros o inventarios de forma reiterada.",
        restaurante: "Incumplir las normas de higiene en el manejo de alimentos.",
        servicios: "Divulgar información de clientes o casos sin autorización.",
        educacion: "Descuidar la vigilancia o el trato debido a los alumnos.",
        industria: "Omitir los procedimientos de seguridad al operar maquinaria o equipos.",
        otro: "Incumplir de forma reiterada los procedimientos propios del puesto.",
      };
      return `Son faltas graves, entre otras:\n\n${L("La reincidencia en faltas leves de la misma naturaleza.", "La inasistencia injustificada.", "El incumplimiento de las funciones y responsabilidades definidas para el puesto.", "El daño o pérdida de bienes de la Empresa por descuido.", "La falta de respeto a superiores, compañeros, clientes o terceros.", "La desobediencia a órdenes e instrucciones relacionadas con el trabajo.", extra[c.d.giro])}`;
    },
  },
  {
    id: "c8_gravisimas", capitulo: "mod_8", titulo: "Faltas gravísimas", resumen: "Causales de despido justificado del artículo 77.", auto: siempre,
    texto: () => `Son faltas gravísimas las que configuran alguna causal de despido justificado del artículo 77 del Código de Trabajo, entre ellas:\n\n${L("El abandono de trabajo, entendido como la ausencia injustificada por el tiempo que la ley señala.", "Presentarse al trabajo en estado de embriaguez o bajo efectos de drogas.", "La violencia, injuria o malos tratamientos contra el patrono, sus representantes, compañeros o clientes.", "El daño intencional a bienes de la Empresa, la sustracción de bienes o la falta de probidad.", "La revelación de secretos o información confidencial de la Empresa.", "El incumplimiento grave o reiterado de las atribuciones del puesto, conforme al artículo 77 inciso a).")}\n\nLa Empresa podrá dar por terminado el contrato sin responsabilidad de su parte cuando se compruebe la causal, observando el procedimiento de este Capítulo.`,
  },
  {
    id: "c8_debido_proceso", capitulo: "mod_8", titulo: "Audiencia de descargos y debido proceso", resumen: "Antes de sancionar se escucha al trabajador y se levanta acta.", auto: siempre,
    texto: () => `Antes de imponer una suspensión o un despido, la Empresa citará al trabajador a una audiencia en la que se le informará de los hechos que se le atribuyen y se le dará oportunidad de presentar sus explicaciones y pruebas, en respeto de su derecho de defensa. De la audiencia se levantará un acta administrativa que consigne fecha, hora, lugar, hechos, evidencias y manifestaciones del trabajador, la cual será firmada por los participantes. Si el trabajador se negare a firmar, se dejará constancia.`,
  },
  {
    id: "c8_prescripcion", capitulo: "mod_8", titulo: "Plazo para sancionar", resumen: "20 días hábiles desde que se conoce el hecho (art. 259).", auto: siempre,
    texto: () => `La facultad de la Empresa para sancionar o despedir por una falta prescribe en el plazo de veinte días hábiles contados desde que la Empresa tuvo conocimiento de los hechos, conforme al artículo 259 del Código de Trabajo. Dentro de ese plazo deberán realizarse la audiencia de descargos y la notificación de la resolución. Transcurrido el plazo, no podrá imponerse sanción por esa falta.`,
  },
  {
    id: "c8_reincidencia", capitulo: "mod_8", titulo: "Reincidencia", resumen: "Se escala solo por la misma falta o de la misma naturaleza.", auto: siempre,
    texto: () => `Para escalar una sanción por reincidencia, el trabajador deberá haber cometido previamente la misma falta o faltas de la misma naturaleza dentro de los doce meses anteriores y haber sido amonestado por ellas. Las faltas de distinta naturaleza no constituyen reincidencia, salvo que este Reglamento tipifique expresamente la acumulación de faltas leves.`,
  },
  {
    id: "c8_registro", capitulo: "mod_8", titulo: "Registro de las sanciones", resumen: "Toda sanción consta en el expediente.", auto: siempre,
    texto: () => `Toda amonestación escrita, suspensión o despido se notificará por escrito al trabajador y se archivará en su expediente personal. Las amonestaciones no tendrán efectos de reincidencia pasados los doce meses desde su notificación.`,
  },

  // ───────────── Capítulo IX ─────────────
  {
    id: "c9_reclamos", capitulo: "mod_9", titulo: "Reclamos y peticiones", resumen: "Cómo presentar y resolver un reclamo.", auto: siempre,
    texto: () => `Todo trabajador tiene derecho a presentar reclamos o peticiones respetuosas, primero a su jefe inmediato y, si no obtiene respuesta satisfactoria, a la gerencia o al área de personal. La Empresa responderá por escrito dentro de un plazo razonable y no tomará represalias contra quien ejerza este derecho de buena fe.`,
  },
  {
    id: "c9_acoso", capitulo: "mod_9", titulo: "Prevención del acoso laboral y sexual", resumen: "Canal confidencial, investigación y no represalias.", auto: siempre,
    texto: () => `La Empresa no tolera ninguna forma de acoso laboral o sexual, ni conductas de hostigamiento, intimidación o violencia en el trabajo. Quien se considere víctima o testigo podrá denunciar los hechos, de forma verbal o escrita, ante la gerencia o el área de personal; si la persona denunciada fuera uno de ellos, ante el representante legal. La denuncia se tratará con confidencialidad, se investigará con imparcialidad y se garantiza que el denunciante no sufrirá represalias. Los hechos comprobados serán sancionados conforme al Capítulo de Régimen Disciplinario.`,
  },
  {
    id: "c9_no_discriminacion", capitulo: "mod_9", titulo: "Igualdad y no discriminación", resumen: "Trato igualitario en todo el vínculo laboral.", auto: siempre,
    texto: () => `La Empresa garantiza a todos sus trabajadores igualdad de trato y de oportunidades, y prohíbe cualquier distinción, exclusión o preferencia fundada en sexo, etnia, idioma, religión, opinión política, discapacidad, edad o condición social.`,
  },
  {
    id: "c9_divulgacion", capitulo: "mod_9", titulo: "Divulgación del Reglamento", resumen: "Cómo se da a conocer al personal.", auto: siempre,
    texto: () => `Una vez aprobado por la Inspección General de Trabajo, la Empresa dará a conocer este Reglamento a los trabajadores mediante la fijación de ejemplares impresos y legibles en al menos dos de los sitios más visibles del centro de trabajo y la entrega de un ejemplar a cada trabajador, quien firmará constancia de recibido.`,
  },
  {
    id: "c9_vigencia", capitulo: "mod_9", titulo: "Vigencia", resumen: "Rige 15 días después de darse a conocer.", auto: siempre,
    texto: () => `El presente Reglamento entrará en vigencia quince días después de haber sido puesto en conocimiento de los trabajadores, conforme al artículo 59 del Código de Trabajo, una vez aprobado por la Inspección General de Trabajo.`,
  },
  {
    id: "c9_reformas", capitulo: "mod_9", titulo: "Reformas", resumen: "Los cambios requieren nueva aprobación.", auto: siempre,
    texto: () => `Cualquier reforma a este Reglamento deberá ser aprobada por la Inspección General de Trabajo y dada a conocer a los trabajadores con la misma anticipación que el texto original antes de entrar en vigencia. Los casos no previstos se resolverán conforme al Código de Trabajo y demás leyes aplicables.`,
  },

  // ───────────── Anexo de puestos ─────────────
  {
    id: "cp_marco", capitulo: "mod_puestos", titulo: "Asignación de funciones", resumen: "Cláusula marco para vincular las funciones del puesto.", auto: siempre,
    texto: () => `Cada trabajador cumplirá con diligencia las atribuciones e instrucciones inherentes a su puesto, las cuales se detallan en este Anexo y en su contrato individual, así como las que, siendo afines a su cargo, le asigne su jefe inmediato. Se entiende que los bienes, fondos o equipos descritos para cada puesto quedan bajo la custodia y responsabilidad de quien lo ocupa.`,
  },
  {
    id: "cp_77a", capitulo: "mod_puestos", titulo: "Incumplimiento de funciones", resumen: "Respaldo del artículo 77 inciso a).", auto: siempre,
    texto: () => `El incumplimiento grave o reiterado de las responsabilidades definidas para el puesto se tipifica como falta grave y, cuando concurran los supuestos legales, podrá dar lugar a despido justificado conforme al artículo 77 inciso a) del Código de Trabajo, previo el procedimiento de debido proceso establecido en este Reglamento.`,
  },
];

export const CLAUSULA_POR_ID = Object.fromEntries(CLAUSULAS.map((c) => [c.id, c])) as Record<string, Clausula>;

export const clausulasDe = (cap: CapituloKey) => CLAUSULAS.filter((c) => c.capitulo === cap);
