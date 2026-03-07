import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";

/* =========================
   EVITAR PARTICIÓN DE PALABRAS
   ========================= */
Font.registerHyphenationCallback((word) => [word]);

/* =========================
   HELPERS
   ========================= */
const safe = (v, fallback = "") => {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim();
  return s ? s : fallback;
};

// ✅ MAYÚSCULAS SOLO PARA CAMPOS DEL CUADRO (no afecta cláusulas)
const upper = (v, fallback = "") => {
  const s = safe(v, fallback);
  return s ? s.toLocaleUpperCase("es-CO") : fallback;
};

const money = (v, fallback = "") => {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(v);
  if (Number.isNaN(n)) return safe(v, fallback);
  return n.toLocaleString("es-CO");
};

const splitFecha = (fecha) => {
  if (!fecha) return { dia: "", mes: "", anio: "", formato: "" };
  let dia = "",
    mes = "",
    anio = "",
    formato = "";
  let dateStr = String(fecha).trim();
  if (/^\d{4}-\d{2}-\d{2}T/.test(dateStr)) {
    dateStr = dateStr.split("T")[0];
  }
  const normalized = dateStr.replace(/[-.]/g, "/");
  const parts = normalized.split("/");
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      anio = parts[0];
      mes = parts[1];
      dia = parts[2];
    } else if (parts[2].length === 4) {
      dia = parts[0];
      mes = parts[1];
      anio = parts[2];
    }
  }
  if (dia && mes && anio) {
    const dd = dia.padStart(2, "0");
    const mm = mes.padStart(2, "0");
    formato = `${dd}-${mm}.${anio}`;
  }
  return { dia, mes, anio, formato };
};

const GRID = {
  LBL1: "20%",
  VAL1: "30%",
  LBL2: "20%",
  VAL2: "30%",
  HALF: "50%",
};

const fitEmailStyle = (email) => {
  const s = safe(email, "");
  const len = s.length;

  // Ajusta escalones según longitud (puedes afinar)
  if (len <= 22) return { fontSize: 9 };
  if (len <= 28) return { fontSize: 8.5 };
  if (len <= 34) return { fontSize: 8 };
  if (len <= 40) return { fontSize: 7.5 };
  return { fontSize: 7 }; // muy largo
};

// Opcional: si quieres que NUNCA se salga, recorta con "..."
const ellipsize = (text, max = 42) => {
  const s = safe(text, "");
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
};


/* =========================
   CLÁUSULAS (VERSIÓN 22-Enero-2026)
   ========================= */
const CLAUSULAS = [
  "Entre el EMPLEADOR y el TRABAJADOR, de las condiciones ya dichas e identificado como se indica bajo nuestras firmas, se ha celebrado el presente CONTRATO INDIVIDUAL DE TRABAJO POR LA DURACIÓN DE UNA OBRA O LABOR DETERMINADA que se regirá además de las normas legales vigentes y en especial por las cláusulas que a continuación se pactan:",
  `PRIMERA.- Objeto: El EMPLEADOR contrata los servicios personales del TRABAJADOR en desarrollo de lo cual éste último se obliga: a) Poner al servicio del EMPLEADOR en forma personal y exclusiva toda su capacidad normal de trabajo, en el desempeño de las funciones y actividades propias del oficio o actividad para el cual ha sido contratado y en las labores anexas y complementarias a los mismos, de conformidad con las órdenes e instrucciones que en forma verbal o escrita le imparta el EMPLEADOR o sus representantes para el cumplimiento de la OBRA O LABOR determinada en la parte superior o caratula de este contrato. b) No prestar directa ni indirectamente servicios laborales ni de ninguna otra naturaleza a otros EMPLEADORES, ni trabajar por cuenta propia en el mismo oficio o actividad, durante la vigencia de este contrato; c) Guardar reserva absoluta sobre la información, documentos físicos y/o electrónicos, hechos, y en general sobre todos los asuntos de que tenga conocimiento por causa o con ocasión del presente contrato de trabajo; d) Cumplir con las obligaciones consagradas en el artículo 58 del C.S.T. y las demás normas que lo complementen, modifiquen o adicionen; e) Utilizar de manera permanente en las jornadas laborales, los elementos de seguridad, dotación con los diseños, colores distintivos y demás especificaciones entregadas por el EMPLEADOR, debiéndolas conservar en buen estado y a usarlos durante toda la vigencia de la relación laboral; f) Asistir y participar en los eventos de capacitación y entrenamiento que sean programados por el EMPLEADOR dentro o fuera de sus instalaciones, y los demás que a él le correspondan, con el fin de afianzar sus conocimientos y habilidades para aplicarlos en el desarrollo de sus funciones e igualmente; g) Ejecutar por sí mismo las funciones asignadas y cumplir estrictamente las instrucciones que le sean dadas por la empresa, o por quienes la representen, respecto del desarrollo de sus actividades; h) Cuidar permanentemente los intereses de la empresa; i) Dedicar la totalidad de su jornada de trabajo a cumplir a cabalidad con sus funciones; j) Programar diariamente su trabajo y asistir puntualmente a las reuniones que efectúe la empresa a las cuales hubiere sido citado; k) Conservar completa armonía y comprensión con los clientes, con sus superiores y compañeros de trabajo, en sus relaciones personales y en la ejecución de su labor; l) Cumplir permanentemente con espíritu de lealtad, colaboración y disciplina con la empresa; m) Avisar oportunamente y por escrito, a la empresa todo cambio en su dirección, teléfono, correo electrónico o ciudad de residencia; n) Abstenerse de comunicar o divulgar con terceros, salvo autorización expresa y escrita DEL EMPLEADOR las informaciones que tenga sobre su trabajo, especialmente sobre el manejo de las cosas que son de naturaleza reservada y sobre las informaciones y las bases de datos de los diferentes programas de la empresa, así como registros contables, estudios de mercado, estudios de cualquier otra naturaleza, bases de clientes, demás documentos, minutas, procedimientos y tecnología utilizada por EL EMPLEADOR. Igualmente, EL TRABAJADOR se obliga a no acceder a las bases de datos de los diferentes programas de la empresa que no le hayan sido asignados. Únicamente podrá acceder a la base de datos que le ha sido asignada cuando se presenten problemas que requieran solución inmediata o cuando en razón de su cargo deba realizar modificaciones a los programas, pero en ambos eventos EL TRABAJADOR deberá obtener autorización previa y escrita del EMPLEADOR para el acceso a cualquiera de los programas, pero siempre custodiando el carácter reservado y confidencial de la información. Revelar información técnica, científica, comercial, contable o de cualquier otra naturaleza que tenga carácter reservado, o el uso indebido de tal información, o el acceso a la base de datos en circunstancias no contempladas en el presente documento, constituye una falta grave y las partes convienen que constituye una justa causa de despido. Por tal razón el trabajador se obliga a mantener la confidencialidad sobre todos los aspectos antes descritos aún después de terminado su contrato de trabajo, cualquiera sea la causa de terminación del contrato de trabajo, pues todo lo relacionado con estudios, registros contables, bases de clientes y demás documentos, procedimientos y tecnología utilizada por EL EMPLEADOR están protegidos por las normas sobre derechos de autor y la violación de tales derechos de autor de acuerdo con el Título VIII, Capítulo Único del Código Penal, artículos 270 a 272, están tipificadas como delitos que generan penas de prisión y multas, además de la responsabilidad pecuniaria de naturaleza civil. o) Avisar oportunamente y por escrito a EL EMPLEADOR todo cambio de dirección de su residencia, teniéndose en todo caso como suya la última dirección registrada en su hoja de vida. p) No atender durante las horas de trabajo asuntos u ocupaciones distintas a los que el empleador le asigne o encomiende. r) Cuidar con esmero las máquinas, herramientas, utensilios, dotación, e instalaciones y demás bienes del empleador, y evitar todo daño o pérdida que cause perjuicios a su propiedad, por tal razón, el trabajador es responsable de los bienes que con ocasión del trabajo están sometidos a su cuidado, guarda y custodia. s) Acatar los reglamentos del empleador. t) Aceptar los traslados de lugar de trabajo o cambio de funciones que disponga el empleador, siempre que no exceda su capacidad normal de trabajo, cuadro de competencias o causen males a la Empresa u) Acatar las normas de seguridad y salud en el trabajo; v) A Cumplir con las obligaciones previstas en el manual de funciones; w) Ser respetuoso en el manejo de sus relaciones interpersonales, manejándolas en forma correcta acorde a las normas de buen trato, comunicación asertiva, cooperación, trabajo en equipo y buena fe; y) Informar por escrito al Empleador todas aquellas cosas que conozca bien por sus conocimientos específicos o bien porque tuvo acceso a ellos por el desarrollo normal de su labor o en cualquier otra circunstancia y que formen parte del interés legítimo del empleador amén de la prevención de daños y perjuicios; z) Cumplir con las demás obligaciones legales, reglamentarias o que le señale el empleador mediante circulares o memorandos. a1) Realizar por su cuenta todos los cursos o capacitaciones que requiera según la Ley para la habilitación profesional de sus servicios. b1) Acatar estrictamente las órdenes que le impartan sus superiores; c1) Cumplir la jornada de trabajo y atender las normas disciplinarías de horario y descansos; d1) Asistir puntualmente al trabajo y a no dedicar parte alguna de su tiempo laborable a trabajos distintos a los asignados por EL EMPLEADOR; e1). Resaltar con su comportamiento, la imagen de EL EMPLEADOR de tal manera que se constituya en ejemplo del personal que dirige y proyecta los propósitos y objetivos de la organización; f1) Asistir puntualmente a la totalidad de capacitaciones, evaluación de conocimientos, conferencias y demás actividades programadas por EL EMPLEADOR; g1) Guardar conducta intachable en sus relaciones sociales y comerciales, actuando con ética profesional en sus decisiones. h1) Cumplir estrictamente de todas aquellas obligaciones que le impongan las disposiciones legales y éticas, relacionadas con su profesión y de carácter sanitario vigente en la actualidad o que se expidan en el futuro, como los deberes que impone la sana práctica profesional, el orden público, la moral y las buenas costumbres i1) Llevar los registros diarios, y mantener informes estadísticos de atenciones y procedimientos practicados, cuando a ello haya lugar. j1) Presentar y mantener vigentes los permisos, licencias y títulos especiales exigidos por parte de la ley o las autoridades administrativas, civiles o sanitarias, para el ejercicio de las actividades contratadas. k1) Informar en forma oportuna al EL EMPLEADOR todos los casos en que se presenten suplantaciones o fraudes de usuarios. l1). No incorporar, grabar, bajar de Internet, y en general utilizar de cualquier forma, software pirata o no autorizado y legalizado por EL EMPLEADOR, en los equipos de cómputo que tenga a su cargo. m) Las demás obligaciones, que de la naturaleza del presente contrato se deriven o impongan las normas legales, así como las contempladas en el Reglamento Interno de Trabajo adoptado por EL EMPLEADOR. PARÁGRAFO PRIMERO: La renuencia o negativa de EL TRABAJADOR a juicio de EL EMPLEADOR a cumplir cualquiera de estas obligaciones contractuales se considerará como FALTA GRAVE y por lo tanto se tendrá como justa causa POR PARTE DEL EMPLEADOR para dar por terminado UNILATERALMENTE el presente contrato sin previo aviso.`,
  "SEGUNDA. - Duración: El término de duración del contrato se celebra por EL TIEMPO QUE DURE LA OBRA O LA LABOR por la cual fue contratado EL TRABAJADOR de acuerdo a las condiciones que se señalan al inicio del presente contrato.",
  "TERCERA. - Periodo de Prueba: El periodo de prueba será de dos (2) meses. Durante este periodo tanto el EMPLEADOR como el TRABAJADOR podrán terminar unilateralmente el contrato, por cualquier causa, sin necesidad de tener que expresar las razones de su decisión. Todo lo anterior de conformidad con el artículo 7º de la ley 50 de 1.990 que modifica el artículo 78 del C.S.T.",
  "CUARTA. - Salario: EL EMPLEADOR pagará al TRABAJADOR como remuneración mensual, un salario ordinario al equivalente al señalado en la parte superior, pagadero en las oportunidades también señaladas. Las partes acuerdan que dentro de la suma anteriormente mencionada se encuentra incluido el valor de los descansos obligatorios de que trata el título VII, capítulos I y II del C.S.T, así como también se encuentra incluida la remuneración de todas las actividades en general desarrolladas por el TRABAJADOR. Parágrafo Primero: Cláusula de exclusión salarial.- Las partes acuerdan que en todos los eventos en que se le reconozcan al trabajador beneficios o auxilios habituales u ocasionales, diferentes al salario, tales como, auxilio de alimentación, habitación o vivienda, transporte adicional al legal, vestuario distinto a la dotación, pago de quinquenios o decenios o en especie o a cualquier título y bajo cualquier otra denominación, tales reconocimientos o beneficios se considerarán como no constitutivos de salario y por tanto no se tendrán en cuenta como factor salarial para la liquidación de acreencias laborales, ni para el pago de aportes parafiscales, de conformidad con los artículos 15 y 16 de la ley 50/90, en concordancia con el artículo 17 de la ley 344/96, por tal razón las sumas que eventualmente reconozca EL EMPLEADOR al TRABAJADOR, durante la vigencia del contrato de trabajo, por concepto de auxilios extralegales de transporte, alimentación, refrigerios de trabajo etc., las partes expresamente convienen que no serán constitutivos de salario para efectos legales, prestaciones, vacaciones e indemnizaciones ya que no se otorgan como contraprestación directa del servicio, ni para beneficio personal del trabajador, ni para enriquecer su patrimonio, sino para desempeñar a cabalidad sus funciones de conformidad con la ley 789 del 2002, los Artículos 15 y 16 de la Ley 50 de 1990, en concordancia con el Artículo 17 de la ley 344 de 1.996, por tal razón EL EMPLEADOR se reserva el derecho de variar de forma unilateral las condiciones señaladas en esta cláusula, sin que esto constituya desmejoramiento alguno en las condiciones de EL TRABAJADOR por tratarse de un beneficio otorgado de manera libre y voluntario por EL EMPLEADOR y en tal sentido podrá suprimirlos en cualquier momento durante la ejecución del presente contrato, sin menoscabo de sus condiciones laborales, para la cesación de este beneficio AL EMPLEADOR le bastará con el aviso a EL TRABAJADOR con una antelación no inferior a diez (10) días calendario a su efectividad. Parágrafo Segundo: EL TRABAJADOR autoriza al EMPLEADOR Y/O PAGADOR para que le descuente de sus ingresos salariales, beneficios no salariales, vacaciones, prestaciones sociales y en general de toda acreencia laboral a que tenga derecho, aquellas sumas laborales, cualquiera, que por error le haya reconocido el EMPLEADOR al TRABAJADOR. Igualmente autoriza para que se le descuente en caso de terminación del contrato de trabajo, de su liquidación definitiva, el mayor valor pagado por concepto de salarios, prestaciones sociales o beneficios no salariales reconocidos hasta la fecha de terminación del contrato. Del mismo modo, el trabajador autoriza expresamente al Empleador y/o pagador para que descuente de su salario, beneficios no salariales, prestaciones y vacaciones el valor de los intereses generados por planilla cuando por su culpa haga incurrir al Empleador en errores de afiliación y pago de aportes, tales como traslados no informados por escrito de E.P.S o A.F.P. Parágrafo Tercero: El TRABAJADOR autoriza de manera expresa e irrevocable al EMPLEADOR a pagar las acreencias laborales a que este tenga derecho durante la vigencia de la relación laboral o a su terminación, en efectivo o mediante depósito en la cuenta de nómina que para tal efecto registre el TRABAJADOR.",
  "QUINTA. - Jornada De Trabajo: El TRABAJADOR se obliga a laborar la jornada máxima legal, salvo estipulación expresa y escrita en contrario, en los turnos y horarios y horas señaladas por el EMPLEADOR, pudiendo hacer éste ajustes o cambios de horario cuando lo considere conveniente o con el objetivo de ajustarlos cuando la necesidad del servicio lo estime conveniente. Por acuerdo expreso o tácito de las partes, podrán repartirse las horas de la jornada ordinaria en la forma prevista en el artículo 164 del C.S.T., modificado por el artículo 23 de la Ley 50/90, y la Ley 2101 de 2021 teniendo en cuenta que los tiempos de descanso entre las secciones de la jornada no se computan dentro de la misma, según el artículo 167 del C.S.T. De igual manera, las partes podrán acordar que se preste el servicio en los turnos de jornada flexible de trabajo, distribuidas en máximo seis (6) días a la semana con un (1) día de descanso obligatorio, que podrá o no coincidir con el domingo, lo cual está contemplado en el Artículo 51 de la ley 789 de 2002. En éste, el número de horas de trabajo diario podrá repartirse de manera variable durante la respectiva semana y podrá ser de mínimo cuatro (4) horas continuas y hasta nueve (9) horas diarias sin lugar a ningún recargo por trabajo suplementario, cuando el número de horas de trabajo no exceda el promedio de la jornada máxima legal dentro de la jornada ordinaria de 6 a.m. a 7 p.m. Parágrafo Único.- Trabajo Nocturno, Suplementario Dominical y/o Festivo: Todo trabajo nocturno, suplementario o en horas extras y todo trabajo en día domingo o festivos en los que legalmente deba concederse un descanso, se remunerará conforme a la ley, salvo acuerdo en contrario contenido en convención, pacto colectivo o laudo arbitral. Para el reconocimiento y pago de trabajo suplementario, nocturno, dominical o festivo deberán haberlo autorizado previamente y por escrito por el EMPLEADOR o sus representantes. Cuando la necesidad de este trabajo se presente de manera imprevista o inaplazable deberá ejecutarse e informarse inmediatamente para la aprobación por parte del EMPLEADOR o a sus representantes. El EMPLEADOR en consecuencia no reconocerá ningún trabajo suplementario, nocturno, o en días de descanso legalmente obligatorio que no haya sido autorizado previamente o avisado inmediatamente y autorizado, como se estipula. Cuando el TRABAJADOR desempeñe labores que impliquen dirección, manejo o confianza, no habrá lugar al pago de horas extras.",
  "SEXTA.- PROHIBICIONES AL TRABAJADOR QUE AMERITAN LA TERMINACIÓN UNILATERAL DEL CONTRATO DE TRABAJO: SON JUSTAS CAUSAS PARA DAR POR TERMINADO ESTE CONTRATO EN FORMA UNILATERAL las enumeradas en los artículos 62 y 63 del C.S.T., modificados por el artículo 7º del Decreto 2351/65, Y ADEMÁS, por parte del EMPLEADOR las faltas disciplinarias leves que por segunda vez ocurran que se consideran reincidencia y se convierten en Graves, y las faltas que para el efecto se califican como Graves en este contrato, en el Reglamento Interno de Trabajo y demás documentos que contengan reglamentaciones, ordenes, instrucciones o prohibiciones de carácter general o particular, pactos, convenciones colectivas, laudos arbitrales, y las que expresamente se convengan como tales en cualquier otro documento.- DE MANERA EXPRESA SE CALIFICAN COMO GRAVES además de la violación a las obligaciones y prohibiciones contenidas en la cláusula primera del presente contrato: a) ) La violación por parte del TRABAJADOR de cualquiera de sus obligaciones legales contenidas en el Código Sustantivo del Trabajo, contractuales contenidas en el presente documentos o reglamentarias contendidas en el Reglamento Interno de Trabajo, de Seguridad e higiene y demás que adopte la compañía; b) La no asistencia puntual al trabajo, sin excusa suficiente a juicio del EMPLEADOR, así sea por primera vez; c) La ejecución por parte del TRABAJADOR de labores remuneradas al servicio de terceros sin autorización previa y escrita del EMPLEADOR; d) La revelación de secretos, valor de ventas, y datos reservados de la empresa; e) Desavenencias con sus compañeros de trabajo, superiores o jefes inmediatos; f) Queda expresamente prohibido para el TRABAJADOR presentarse al lugar de trabajo, iniciar o ejecutar sus labores bajo los efectos del alcohol, sustancias psicoactivas, estupefacientes, drogas que generen dependencia física o psíquica, o cualquier otra sustancia que afecte su capacidad física, mental, psicomotora o de juicio, así como consumir, portar o ingerir dichas sustancias dentro de las instalaciones de la empresa o durante la jornada laboral, cualquiera sea la modalidad de vinculación. El incumplimiento de esta prohibición constituye una falta grave, por cuanto compromete la seguridad, la salud en el trabajo, la integridad propia y de terceros, y el normal desarrollo de las labores. El TRABAJADOR autoriza de manera expresa, libre e informada, con la suscripción del presente contrato, a que el EMPLEADOR pueda realizar, directamente o a través de terceros autorizados, pruebas de alcoholemia o de detección de sustancias, siempre que exista causa objetiva, razonable y proporcional, o de forma aleatoria dentro de programas de prevención, seguridad y salud en el trabajo, respetando en todo caso: La dignidad humana del trabajador, el derecho a la intimidad y al habeas data, el debido proceso y el derecho de defensa y la confidencialidad de los resultados. La negativa injustificada del TRABAJADOR a practicarse dichas pruebas, cuando estas se soliciten conforme a los criterios anteriores, podrá ser considerada falta grave, y será evaluada dentro del respectivo procedimiento disciplinario interno, pudiendo dar lugar a la imposición de sanciones, incluida la terminación del contrato de trabajo con justa causa. g) El hecho de que el TRABAJADOR abandone el sitio de trabajo sin permiso de sus superiores, así sea por primera vez; h) La no asistencia a una sesión completa de la jornada de trabajo, o más, sin excusa suficiente a juicio del EMPLEADOR, salvo los eventos de fuerza mayor o caso fortuito, sin dar aviso oportuno o sin justa causa por primera vez; i) La negligencia, descuido o impericia del TRABAJADOR; j) El hecho de que el trabajador sea sorprendido dormido en su puesto de trabajo; k) El hecho de que el trabajador presente previamente al ingreso a la compañía o durante el desarrollo del presente contrato, informaciones, recomendaciones, constancias, certificados y en general cualquier documento que sirva de prueba y/o documentos que no correspondan a los reales antecedentes personales y laborales del trabajador. En consecuencia el trabajador autoriza, para que, una vez suscrito el contrato con el empleador, este efectúe todo tipo de averiguaciones encaminadas a verificar la veracidad de la información suministrada por el trabajador; l) El hecho que el TRABAJADOR una vez recibido su puesto de trabajo, lo abandone sin justa causa o sin orden de su superior; m) El hecho de que el trabajador incumpla órdenes o normas u omita la  realización de órdenes dadas por EL EMPLEADOR o presente falsas imputaciones o informes contra sus compañeros, superiores o clientes en general; n) El  hecho que el trabajador encubra faltas o informaciones que a juicio del EMPLEADOR perjudique directa o indirectamente al EMPLEADOR; o) El hecho que el trabajador manipule o haga uso indebido de los elementos o equipos de propiedad del EMPLEADOR o que no siendo de este sea el responsable ante algún tercero de ellas; p) El hecho que el TRABAJADOR, sin justificación alguna incumpla o altere los horarios de programación asignados o realice auto traslados sin previa autorización y sin el cumplimiento del procedimiento; q) El hecho que el TRABAJADOR realice saboteos o en general haga mal uso de los elementos asignados. r) El hecho que el TRABAJADOR realice funciones ajenas a las asignadas por el empleador. s) El hecho que el TRABAJADOR se adjudique funciones que no le corresponden o se extralimite en las mismas. t) El hecho que el trabajador emita opiniones, realice autorizaciones o tome determinaciones en nombre y/o representación de la empresa sin estar expresamente autorizado para ello. u)  Solicitar préstamos especiales o ayuda económica a los clientes y proveedores del EMPLEADOR aprovechándose de su cargo u oficio, o aceptarles donaciones o regalos de cualquier clase sin la previa autorización escrita del EMPLEADOR; v) Utilizar los activos, instalaciones, herramientas, materias primas y recursos colocados a su disposición para la ejecución de sus funciones en actividades personales o en actividades ajenas a las propias de su cargo. w) Autorizar o ejecutar sin ser de su competencia, operaciones que afecten los intereses del EMPLEADOR o negociar bienes y/o mercancías del EMPLEADOR en provecho propio; y) Retener dinero o hacer efectivos cheques recibidos para el EMPLEADOR; z) Presentar cuentas de gastos ficticias o reportar como cumplidas visitas o tareas no efectuadas; a1) Retirar de las instalaciones donde funcione la empresa elementos, máquinas y útiles de propiedad del EMPLEADOR sin su autorización escrita. b1) Ingerir licor o bebida de cualquier clase con cualquier grado de contenido de alcohol, en cualquier cantidad de consumo, dentro de las instalaciones de la empresa durante su jornada de trabajo, o fuera de tal jornada estando dentro de las instalaciones de la empresa. Esta prohibición se hace extensiva a fuera de las instalaciones de la empresa en caso de estar ejecutando su actividad laboral fuera de tales instalaciones. c1) Tener participación económica, directiva o administrativa en empresas, sociedades o con personas naturales a las cuales EL EMPLEADOR preste servicios o que a su vez presten servicios similares a los que presta EL EMPLEADOR. Esta prohibición se hace extensiva a los familiares de EL TRABAJADOR hasta el cuarto grado de consanguinidad, segundo civil, cónyuge y compañero (a) del TRABAJADOR. Si tal situación se produjo antes de la celebración del contrato de trabajo, deberá ponerla en conocimiento de EL EMPLEADOR antes de suscribir tal contrato, o al momento de firmar la presente cláusula adicional. d1) Tomar decisiones que impliquen beneficios para sí mismo, sus familiares hasta el cuarto grado de consanguinidad y/o segundo de afinidad, cónyuge, compañero (a) permanente, o para personas con quienes mantenga amistad íntima. En el evento en que EL EMPLEADOR vaya a celebrar negocios con empresas, sociedades en las que tengan participación económica, directiva o administrativa los familiares de EL TRABAJADOR hasta el cuarto grado de consanguinidad, segundo de afinidad, cónyuge o compañero (a), debe comunicarlo por escrito en forma inmediata a su superior jerárquico. Se entiende por conflicto de intereses toda acción o situación en que los intereses personales, familiares en los grados antes señalados, así como del cónyuge o compañero (a) de EL TRABAJADOR, sean opuestos a los de la empresa. En caso de presentarse tales conflictos de intereses, EL TRABAJADOR debe comunicárselo por escrito en forma inmediata a su superior jerárquico. e1) No informar en forma oportuna al EL EMPLEADOR todos los casos en que se presenten suplantaciones o fraudes de usuarios. f1) No cumplir y acatar las disposiciones contempladas en las Circulares Reglamentarias e instrucciones que expida la entidad. g1) Negarse a desempeñar una labor inherente, conexa o complementaria de sus funciones habituales. h1) Exigir o insinuar a los clientes, proveedores o compradores de EL EMPLEADOR la entrega de cualquier clase de dádivas, valores o especies para el Trabajador o para terceros; i1) Aprovecharse en beneficio propio o de terceros de dineros, valores, recursos o insumos de EL EMPLEADOR; j1) Incurrir en alguna conducta de las previstas en el artículo 7 de la Ley 1010 de 2006, catalogadas de acoso laboral k1) Incumplir cualquiera de las obligaciones mencionadas en la cláusula primera del presente contrato. q1) La usurpación de cuentas IP o usuarios ajenos, sin autorización escrita del Empleador, cualquiera que sea la finalidad. r1) Cualquier conducta contraria a los principios de lealtad, honradez, probidad o buena fe que impelen al trabajador a hacer lo debido y lo correcto en la ejecución de sus labores, o en las relaciones con sus compañeros, superiores, colaboradores, proveedores o beneficiarios de servicios que presta el Empleador. s1) El hecho de que EL TRABAJADOR si conduce vehículos de la compañía o al encomendado en cumplimiento de su jornada de trabajo, incumpla las normas de tránsito en la conducción del vehículo a él asignado, para lo cual, bastara como prueba de su infracción el informe de tránsito, croquis del accidente de tránsito, comparendo o resolución de autoridad competente en la que se le señale como responsable, infractor o contraventor de alguna norma sobre tránsito y transporte. t1) El EMPLEADOR podrá dar por terminado el presente contrato de manera inmediata y con justa causa, cuando el TRABAJADOR(A) incurra en actos de acoso sexual, de conformidad con lo establecido en la Ley 2365 de 2024, la normativa laboral vigente y las políticas internas de la organización. u1) La violación de la cláusula de exclusividad laboral pactada en el presente contrato. PARÁGRAFO PRIMERO: Habrá lugar a la terminación de este contrato por las causales previstas en la Ley, y además por cualquier falta grave calificada como tal, en el presente contrato, en pacto o convención colectiva de trabajo, fallo arbitral, o reglamentos de trabajo e higiene y seguridad y código de conducta de LA EMPRESA, como también en las resoluciones y órdenes emanadas de la Presidencia y Gerencia Respectiva. En caso de terminación unilateral sin justa causa por parte de LA EMPRESA, ésta pagará al TRABAJADOR las indemnizaciones previstas por la Ley.  ",
  "SÉPTIMA. - Equipos y herramientas de trabajo. El TRABAJADOR, se obliga especialmente a responder de manera personal y pecuniariamente por la negligencia, falta de impericia, o dolo que le cause a los vehículos asignados, y los demás equipos, herramientas y elementos de trabajo que reciba para el correcto desempeño exclusivo de sus labores, o que llegue a tener bajo su responsabilidad en la ejecución del contrato. Sobre todos ellos se obliga a reportar oportunamente a su empleador o su custodia cuando sea de su propiedad, cuando requieran mantenimiento correctivo o preventivo a efectos de evitar su deterioro o falla. Todos ellos deberán devolverlos en buen estado, salvo el deterioro natural por el uso cuidadoso de los mismos. Si por descuido o negligencia del TRABAJADOR los equipos y herramientas sufrieran pérdida, daño o destrucción, el TRABAJADOR se obliga a su reparación, remplazo o indemnización dentro de los 8 días a que ocurra el siniestro, término vencido sin que ello ocurra la EMPRESA podrá disponer de la reparación o del remplazo para lo cual las sumas pagadas, desde ya autoriza el empleador sean descontadas de su salario o liquidación final.",
  "OCTAVA.- Modificación de las Condiciones Laborales:El TRABAJADOR acepta desde ahora expresamente todas las modificaciones de sus condiciones laborales determinadas por el EMPLEADOR en ejercicio de su poder subordinante, tales como la jornada de trabajo, el lugar de prestación de los servicios del inicialmente contratado, el cargo u oficio y/o funciones, y la forma de remuneración, siempre que tales modificaciones no afecten su honor, dignidad, o sus derechos, ni impliquen desmejoras sustanciales o graves perjuicios para él, de conformidad con el artículo 23 de C.S.T., modificado por el artículo 1º de la Ley 50/90. Los gastos que se originen con el traslado de lugar de prestación del servicio serán cubiertos por el EMPLEADOR de conformidad con el numeral 8º del artículo 57 del C.S.T. Sin perjuicio de lo anotado anteriormente toda variación en la remuneración del TRABAJADOR y demás modificaciones que acuerden las partes se harán por escrito. Parágrafo Primero: En los términos del Art. 26 de la Ley 789 del 2002, modificada por el Art. 179 del C.S.T., subrogado por el Art. 29 de la ley 50 de 1990 y el Art. 51 de la ley 789 del 2002, se acuerda establecer un día de la semana (Lunes a viernes) como día de descanso obligatorio institucional a cambio del domingo, sin que esta determinación sea definitiva sino que puede ser temporal en razón a las mismas necesidades del servicio en el tiempo, por lo que el TRABAJADOR delega en el EMPLEADOR la facultad de establecer en forma sucesiva o alternativa, la fijación del mencionado día semanal como día de descanso obligatorio institucional, avisándole el cambio con un día de anticipación de acuerdo con la programación asignada. Parágrafo Segundo: Con base en las mismas razones de las necesidades que presente el servicio por el cual fue contratado EL EMPLEADOR, con base en el artículo 51 de la ley 789 de 2002, las partes acuerdan que el TRABAJADOR delega en el EMPLEADOR la aplicación de jornadas flexibles pudiendo establecer esta jornada en forma sucesiva o alternativa y pudiendo cambiar el día de descanso dominical.",
  "NOVENA. - Propiedad Intelectual E Invenciones. 1). Teniendo en cuenta el objeto del contrato de trabajo suscrito entre las partes, el EMPLEADOR y el TRABAJADOR acuerdan que todas las invenciones y trabajos originales de autor (incluyendo descubrimientos, ideas, mejoras, software, hardware o diseños de sistemas, ya sean patentables/ registrables o no), concebidos o hechos por el TRABAJADOR durante la ejecución del presente contrato y que de alguna manera se relacionen con el objeto del mismo pertenecerán al EMPLEADOR. En consecuencia, de lo anterior, el TRABAJADOR se obliga a informar al EMPLEADOR inmediatamente sobre la existencia de dichas invenciones y/o trabajos originales. El trabajador accederá a facilitar el cumplimiento oportuno de las correspondientes formalidades y dará su firma o extenderá los poderes y documentos necesarios para transferir los derechos de autor al EMPLEADOR cuando así se lo solicite el EMPLEADOR, sin que éste quede obligado al pago de compensación alguna. 2). Igualmente convienen las partes que todo lo que cree, invente, descubra, desarrolle o mejore EL TRABAJADOR, con ocasión del presente contrato, pertenece al EMPLEADOR., sin necesidad de autorización alguna, de conformidad con lo dispuesto en el artículo 539 del Código de Comercio en concordancia con el primer inciso de los artículos 22, 88, 114 de la Decisión 486 de 2000 de la Comisión de la Comunidad Andina de Naciones.  En consecuencia, EL EMPLEADOR tendrá el derecho de hacer patentar a su nombre o a nombre de terceros esos inventos, mejoras, diseños o esquemas, respetándose el derecho del TRABAJADOR de ser mencionado como inventor o descubridor si así lo desea. El trabajador accederá a facilitar el cumplimiento oportuno de las correspondientes formalidades y dará su firma o extenderá los poderes y documentos necesarios para tal fin según y cuando se lo solicite el patrono, sin que éste quede obligado al pago de compensación alguna. Parágrafo Primero. Teniendo en cuenta lo dispuesto en la Ley 23 de 1982 y en la Decisión 486 de 2000 de la Comunidad Andina de Naciones y así mismo lo dispuesto en el numeral 1° del artículo 132 del Código Sustantivo del Trabajo, las partes acuerdan que la remuneración salarial reconocida por el EMPLEADOR como contraprestación de los servicios prestados por el TRABAJADOR, incluye y contiene la remuneración por la transferencia de los derechos de autor y derechos de propiedad intelectual mencionadas en las cláusulas anteriores, toda vez que los objetos sobre los cuales recaen los derechos de propiedad industrial son desarrollados por el TRABAJADOR en virtud de su contrato de trabajo, razón por la cual en virtud de la transferencia de los derechos antes mencionados no se causa compensación adicional alguna a favor del TRABAJADOR.",
  "DECIMA. - Uso de Software. El EMPLEADOR tiene licencia de todos los programas de software que utiliza. El TRABAJADOR no es propietario de ese software o de sus manuales, y a menos que sea autorizado por el productor del software, no tiene derecho a reproducirlos.  En cuanto al uso de redes o a las licencias corporativas en los equipos, el Trabajador sólo utilizará el software de acuerdo con lo convenido en la licencia.  El TRABAJADOR, en conocimiento de cualquier uso indebido del software, deberá notificar este hecho a su respectivo e inmediato superior jerárquico.  El TRABAJADOR no podrá hacer, comprar o utilizar copias no autorizadas de software, constituyendo la violación a esta prohibición justa causa para dar por terminado unilateralmente el contrato por parte de El EMPLEADOR.  Así mismo, se le prohíbe al TRABAJADOR el uso de equipos de computación y del respectivo software para elaboración de trabajos personales.",
  "DECIMA PRIMERA. - Entrega de Dotación y de Elementos de Seguridad Industrial:: Con la firma del presente contrato, y en la misma fecha, el EMPLEADOR hace entrega al TRABAJADOR del carné de identificación, la dotación corporativa y los Elementos de Protección Personal (EPP) que correspondan de acuerdo con el cargo, funciones, nivel de riesgo y condiciones del puesto de trabajo asignado, los cuales se encuentran detallados en los formatos y registros internos de entrega, los cuales hacen parte integral del presente contrato. La dotación corporativa comprende, entre otros, uniformes y prendas de uso laboral que contienen logos, signos distintivos, elementos gráficos e identificadores de la EMPRESA, y los EPP incluyen, sin limitarse a ello, monogafas de seguridad, cascos, gorras, barbuquejos, caretas, protectores auditivos, mascarillas, guantes y demás implementos exigidos por el Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST). Todos los elementos antes descritos se entregan a título de comodato, conservando el EMPLEADOR la propiedad sobre los mismos. En consecuencia, el TRABAJADOR se obliga a: i. Usarlos de manera permanente, correcta y obligatoria durante toda la jornada laboral y cada vez que preste servicios para el EMPLEADOR. ii. Conservarlos en buen estado, destinarlos exclusivamente a fines laborales y abstenerse de cederlos, modificarlos o darles un uso diferente. Iii. Custodiarlos diligentemente, evitando su pérdida, daño o destrucción. iv. Hacer la devolución de estos a la finalización del contrato o cuando estos sean cambiados pues la empresa debe garantizar que estas prendas no se usen para fines distintos al cumplimiento de u trabajo contratado y que lo porte un funcionario con contrato vigente. El no uso, uso indebido, pérdida, daño o destrucción injustificada de cualquiera de los elementos entregados constituye FALTA GRAVE, por tratarse de no solo la imagen corporativa, sino además, las herramientas de trabajo esenciales y de elementos de seguridad industrial. A la terminación del contrato de trabajo, por cualquier causa, el TRABAJADOR se obliga a devolver de manera inmediata y en buen estado la totalidad de la dotación corporativa, los EPP y demás elementos entregados, salvo el desgaste normal por el uso adecuado. En caso de pérdida, daño o destrucción imputable al TRABAJADOR, o en caso de no realizar la devolución,este autoriza de manera expresa, previa e inequívocamente al EMPLEADOR para compensar y descontar del salario, prestaciones sociales y/o liquidación final, el valor correspondiente a la reposición de los elementos, hasta su total restitución, de conformidad con lo previsto en el artículo 149 del Código Sustantivo del Trabajo, sin que dicha autorización implique renuncia a derechos laborales ni afecte el salario mínimo legal. La presente cláusula sustituye cualquier autorización genérica o en blanco, constituyendo autorización válida, específica y suficiente para efectos de compensación, sin perjuicio del respeto al debido proceso y al derecho de defensa del TRABAJADOR.",
  "DECIMA SEGUNDA. - El TRABAJADOR manifiesta que con la firma del presente contrato: a) ha leído y conoce el reglamento interno de trabajo de la empresa EMPLEADORA que se encuentra publicado en la empresa y en consecuencia se obliga a cumplirlo y acatarlo. b) ha leído y conoce el reglamento de higiene y seguridad industrial de la empresa y ha recibido y conoce las políticas de calidad, salud ocupacional, medio ambiente, uso de los elementos de protección personal, prevención y control del alcoholismo, tabaquismo, farmacodependencia y en general cualquier sustancias psicoactivas, así como la misión y visión de la empresa EMPLEADORA, las cuales se obliga a acatar y cumplir; c) ha recibido copia del presente contrato de trabajo debidamente firmado por el EMPLEADOR. De igual forma el TRABAJADOR con la firma de este contrato, autoriza de manera expresa e irrevocable a que el EMPLEADORA pueda practicarle al TRABAJADOR ante las entidades legalmente autorizadas o institutos avalados la práctica de exámenes periódicos o aleatorios que procuren, controlen y prevengan el no uso de alcohol o drogas, así como las pruebas de polígrafo cuando se requieran durante su contrato.",
  "DECIMA TERCERA.- Confidencialidad y Competencia  Desleal: EL TRABAJADOR se abstendrá durante la vigencia del presente contrato y con posterioridad a su terminación por cualquier causa de revelar, suministrar, vender, arrendar, publicar, copiar, reproducir, remover, disponer, transferir y en general utilizar directa o indirectamente en favor propio o de  otras personas en forma total o parcial, cualquiera que sea su finalidad, la información confidencial o propiedad intelectual del EMPLEADOR, de sus empresas subsidiarias, filiales, o a las empresas o personas naturales o jurídicas relacionadas con la misma y/o a los clientes o afiliados del EMPLEADOR, a la cual tenga acceso o de la cual tenga conocimiento en desarrollo de su cargo o con ocasión de este sin que medie autorización previa, expresa y escrita del EMPLEADOR para el efecto, particularmente en los relacionado con la información contenida en las bases de datos del EMPLEADOR. En forma adicional el TRABAJADOR se abstendrá durante la vigencia del contrato y con posterioridad a su terminación por cualquier eventualidad, de ejecutar conductas constituyentes de actos de competencia desleal de conformidad con lo dispuesto en la Ley 256 de 1996 y la Decisión 486 de 2001 de la Comisión de la Comunidad Andina cuando las referidas conductas estén vinculadas con el tema de propiedad industrial. Parágrafo Primero. - El TRABAJADOR declara que conoce y entiende las normas legales sobre propiedad intelectual y competencia desleal comprometiéndose por tanto a cumplirlas durante la ejecución de su contrato de trabajo y con posterioridad a su terminación. Parágrafo Segundo.- Las partes a título indicativo declaran que la siguiente información y documentos del EMPLEADOR son de carácter estrictamente confidencial: Estados Financieros de EL EMPLEADOR, Declaraciones de Renta, Balances, software creados o diseñados para EL EMPLEADOR, Informes estadísticos, Manuales de funciones y Procedimientos, Convenios, Contratos, información de productos, la información contenida en las bases de datos de la Compañía, información sobre clientes, accionistas, trabajadores del EMPLEADOR o de sus empresas subsidiarias, filiales, o de las empresas o personas naturales o jurídicas relacionadas con la misma, , así como cualquier otro documento que resulte sensible y relevante para el adecuado giro de los negocios del EMPLEADOR. Parágrafo Tercero. - El TRABAJADOR, a la terminación de su contrato de trabajo por cualquier causa devolverá inmediatamente al EMPLEADOR cualquier documento, información o elemento que le haya sido entregado para el cumplimiento de sus funciones. Parágrafo Cuarto. - Las partes acuerdan expresamente que el incumplimiento de las disposiciones contenidas en la presente cláusula es considerado como una falta grave y en tal sentido constituye justa causa para la terminación del contrato de trabajo de acuerdo con lo dispuesto en el numeral 6º del literal a), del artículo 7 del Decreto Ley 2351 de 1965, subrogatorio del artículo 62 del Código Sustantivo el Trabajo. Lo anterior sin perjuicio de las acciones civiles o penales que puedan emprenderse contra el TRABAJADOR por parte del EMPLEADOR o de terceros como consecuencia de dicho incumplimiento.",
  "DECIMA CUARTA. – Datos de Notificación: Para todos los efectos legales y en especial los contractuales, se tendrán por tales las enunciadas al inicio de este contrato, y por tal razón El TRABAJADOR se compromete a informar por escrito al EMPLEADOR cualquier cambio de dirección, número de teléfono, numero de WhatsApp, dirección de correo electrónico,  mientras no se informe ningún cambio, toda la información notificada será válida para todos los efectos será la registrada en este contrato, y su cambio sin previa notificación será justa causa para dar por terminado el contrato. ",
  "DECIMA QUINTA: AUTORIZACIÓN PARA EL TRATAMIENTO DE DATOS PERSONALES.Teniendo en cuenta que, en la celebración, ejecución e incluso después de la terminación del presente contrato se requiere la recopilación, uso o tratamiento de algunos datos personales de EL TRABAJADOR, de sus hijos, descendientes, custodios y/o de su cónyuge o compañero permanente, EL TRABAJADOR declara que ha leído, conoce y acepta el contenido de la Política de Privacidad general de TRATAMIENTO Y PROTECCIÓN DE DATOS PERSONALES de ASEOS LA PERFECCIÓN SAS.  y que autoriza expresamente a ASEOS LA PERFECCIÓN SAS para incorporar en sus bases de datos los datos personales que sean suministrados, de conformidad con los términos de la mencionada Política de Privacidad y las finalidades allí señaladas.",
  "Parágrafo. DATOS PERSONALES DE MENORES DE EDAD. ASEOS LA PERFECCIÓN SAS. Podrá solicitar los datos personales de los hijos o dependientes del TRABAJADOR. En los casos en que EL TRABAJADOR acepte suministrar a ASEOS LA PERFECCIÓN SAS dichos datos de dichos hijos o dependientes sean menores de edad, EL TRABAJADOR manifiesta que es el representante legal de dichos menores, que son datos de naturaleza pública, y que expresamente autoriza a ASEOS LA PERFECCIÓN SAS para su tratamiento con la finalidad de realizar actividades relacionadas con el bienestar personal y familiar de los empleados/ y de los menores. Para tales efectos, ASEOS LA PERFECCIÓN SAS tendrá en cuenta el respeto y prevalencia de los derechos de los menores, su interés superior y sus derechos fundamentales. ",
  "DECIMA SEXTA. -EL TRABAJADOR está obligado a dar aviso inmediatamente ocurra el hecho u oportuno a LA EMPRESA por teléfono o email, cuando por cualquier causa no pueda concurrir al trabajo. La enfermedad deberá ser comprobada solamente por el certificado médico de la E.P.S o A.R.L. ",
  "DECIMA SÉPTIMA: CLÁUSULA DE VERACIDAD DE LA INFORMACIÓN Y BUENA FE CONTRACTUAL: El/La TRABAJADOR(A) declara que toda la información suministrada a la EMPRESA durante el proceso de selección, la práctica de exámenes médicos de ingreso, la suscripción del presente contrato y cualquier otra etapa previa o posterior al inicio de la relación laboral, es veraz, completa y suministrada de buena fe. En especial, el/la TRABAJADOR(A) manifiesta haber informado de manera cierta y oportuna aquellas condiciones de salud relevantes que, de conformidad con la ley, sean necesarias para determinar su aptitud para el cargo, siempre respetando la confidencialidad y el tratamiento de datos sensibles conforme a la normativa vigente. El suministro de información falsa, inexacta, incompleta o la omisión dolosa de información relevante, que tenga incidencia directa en la aptitud para el cargo, el cumplimiento de las funciones contratadas o la confianza legítima de la EMPRESA, constituirá una violación grave de las obligaciones contractuales y del principio de buena fe, y podrá dar lugar a la terminación del contrato de trabajo con justa causa, de conformidad con el artículo 62 del Código Sustantivo del Trabajo, previo agotamiento del debido proceso. La presente cláusula se aplicará sin perjuicio del respeto a los derechos fundamentales del trabajador, la prohibición de discriminación y la normativa sobre protección de datos personales.",
  "DECIMA OCTAVA: Buena Fe. - Este contrato ha sido redactado estrictamente de acuerdo con la ley y la jurisprudencia y será interpretado de buena fe y en consonancia con el Código Sustantivo del Trabajo cuyo objeto, definido en su artículo 1º, es lograr la justicia en las relaciones entre empleadores y trabajadores dentro de un espíritu de coordinación económica y equilibrio social. ",
  "DECIMA NOVENA: Efectos. - El presente contrato reemplaza en su integridad y deja sin efecto cualquier otro contrato verbal o escrito celebrado entre las partes con anterioridad, pudiendo las partes convenir por escrito modificaciones al mismo que formaría parte integral de este contrato, las cuales siempre deben constar por escrito. Para constancia se firma en dos ejemplares del mismo tenor y valor, ante testigos en la ciudad y fecha que se indican como iniciación de contrato laboral. ",
  "VIGÉSIMA. FIRMA: : Las Partes acuerdan que el presente contrato producirá efectos entre las Partes a partir de la fecha de las firmas del contrato o cualquier comunicación entre estas podrá ser firmada digitalmente ya se firma electrónica o manuscrita o incluso intercambiado por correo electrónico o teléfono WhatsApp el cual autorizan y declaran las partes que le conceden toda la autenticidad y reconocimiento del caso.",
];

/* =========================
   ESTILOS
   ========================= */
const styles = StyleSheet.create({
page: {
  paddingTop: 110,   // 🔥 antes 70
  paddingBottom: 60,
  paddingHorizontal: 40,
  fontSize: 9,
  lineHeight: 1.15,
  color: "#000",
  fontFamily: "Helvetica",
},

  headerFixed: {
  position: "absolute",
  top: 12,
  left: 40,
  right: 40,
  height: 95,              // 🔥 antes estaba como 44 (muy bajito)
  flexDirection: "row",
  alignItems: "center",
},

headerLogoLeft: {
  width: 190,
  height: 70,
  objectFit: "contain",
},

headerLogoRight: {
  width: 200,
  height: 70,
  objectFit: "contain",
},

 headerTitleWrap: {
  flex: 1,
  alignItems: "center",
  paddingHorizontal: 10,
},


 headerTitle: {
  fontSize: 9,    // antes 10
  fontWeight: "bold",
  textAlign: "center",
  textTransform: "uppercase",
},


  // ✅ Bloque derecho (fecha arriba y versión debajo, al costado)
  headerRightWrap: {
    width: 210,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  headerDate: {
    fontSize: 10,
    textAlign: "right",
  },

  // ✅ Versión al costado, gris, debajo de la fecha (en todas las hojas)
  headerVersionRight: {
    marginTop: 2,
    fontSize: 9,
    color: "#6b6b6b",
    textAlign: "right",
  },

  table: {
    display: "table",
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 8,
  },

  tableRow: { flexDirection: "row" },

  cell: {
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    paddingTop: 6,
    paddingBottom: 6,
    paddingHorizontal: 8,
  },

  label: { fontWeight: "bold" },

  labelTight: {
    fontWeight: "bold",
    fontSize: 8.5,
    lineHeight: 1.05,
  },

  labelOneLine: {
    fontWeight: "bold",
    fontSize: 8.5,
    lineHeight: 1.05,
    textAlign: "center",
  },

  cellNoPad: { paddingTop: 0, paddingBottom: 0, paddingHorizontal: 0 },

  fechaHeaderArea: { paddingTop: 6, paddingBottom: 6, paddingHorizontal: 8 },

  fechaGrid: { borderTopWidth: 1, borderTopStyle: "solid" },

  fechaGridRow: { flexDirection: "row" },

  fechaGridCell: {
    width: "33.3333%",
    paddingVertical: 6,
    justifyContent: "center",
    alignItems: "center",
  },

  fechaGridCellBorderL: { borderLeftWidth: 1, borderLeftStyle: "solid" },

  fechaGridHeaderBottom: { borderBottomWidth: 1, borderBottomStyle: "solid" },

  paragraph: {
    marginTop: 2,
    marginBottom: 2,
    textAlign: "justify",
  },

  // ✅ Solo dos “espacios” después del cuadro
  firstParagraph: {
    marginTop: 6,
    marginBottom: 4,
    textAlign: "justify",
  },

  bold: { fontWeight: "bold" },

  footerSpace: { marginTop: 200 },

  signaturesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },

  signatureBox: { width: "45%", textAlign: "center" },

  signatureImg: {
    width: 160,
    height: 45,
    marginTop: 6,
    marginBottom: 2,
    objectFit: "contain",
    alignSelf: "flex-start",
  },

  line: { marginTop: 10, marginBottom: 2 },

  witnessesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },

  witnessBox: { width: "45%", textAlign: "center" },

  // ✅ Pie de página: más pequeño + gris + centrado (como Word)
  footerFixed: {
    position: "absolute",
    left: 40,
    right: 40,
    bottom: 10,
    fontSize: 7,
    lineHeight: 1.05,
    textAlign: "center",
    color: "#6b6b6b",
  },
  footerLine: { marginTop: 1 },
  footerLineTop: { marginTop: 0 },
});

/* =========================
   FIRMA
   ========================= */
const FirmaBox = ({ titulo, nitLine, ccLine, firmaSrc }) => (
  <View style={styles.signatureBox}>
    <Text style={styles.bold}>{titulo}</Text>

    {firmaSrc ? (
      <>
        {/* <Text style={[styles.label, { marginTop: 4 }]}>FIRMA:</Text> */}
        <Image
          style={
            titulo === "EL EMPLEADOR"
              ? [styles.signatureImg, { marginLeft: 15, width: 220, height: 70 }]
              : styles.signatureImg
          }
          src={firmaSrc}
        />
      </>
    ) : null}

    {titulo === "EL EMPLEADOR" && (
      <View>
        <Text style={styles.line}>{"\n"}_________________________________</Text>
        <Text>{nitLine}</Text>
      </View>
    )}
    {titulo === "EL TRABAJADOR" && (
      <View style={{ marginTop: 100 }}>
        <Text style={styles.line}>{"\n"}_________________________________</Text>
        <Text>{ccLine}</Text>
      </View>
    )}
  </View>
);

/* =========================
   ✅ Resaltar "Parágrafo ..."
   ========================= */
const renderWithBoldParagrafos = (text) => {
  const t = text || "";

  // ✅ Negrilla para:
  // - "Parágrafo ..." (con PRIMERO/SEGUNDO/ÚNICO...)
  // - letras tipo: a) b) c) ... a1) b1) ...
  // - romanos tipo: i. ii. iii. iv. v. ...
  const re =
    /((?:Parágrafo|PARÁGRAFO)\s*(?:[A-Za-zÁÉÍÓÚÑ]+)?\s*(?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[ÉE]PTIMO|ÚNICO|UNICO)?\.?\s*:)|(\b[a-z](?:\d+)?\)\s*)|(\b(?:i|ii|iii|iv|v|vi|vii|viii|ix|x)\.\s*)/gi;

  const parts = [];
  let last = 0;
  let m;

  while ((m = re.exec(t)) !== null) {
    const start = m.index;
    const end = start + m[0].length;

    if (start > last) parts.push({ type: "text", value: t.slice(last, start) });
    parts.push({ type: "bold", value: t.slice(start, end) });

    last = end;
  }

  if (last < t.length) parts.push({ type: "text", value: t.slice(last) });

  return parts.length ? (
    <Text>
      {parts.map((p, i) =>
        p.type === "bold" ? (
          <Text key={i} style={styles.bold}>
            {p.value}
          </Text>
        ) : (
          <Text key={i}>{p.value}</Text>
        )
      )}
    </Text>
  ) : (
    <Text>{t}</Text>
  );
};


/* =========================
   ✅ Detectar encabezado de cláusula
   ========================= */
const splitClauseHeading = (tRaw) => {
  const t = (tRaw || "").trim();
  if (!t) return null;

  if (/^(Parágrafo|PARÁGRAFO)\b/.test(t)) {
    const idxColon = t.indexOf(":");
    if (idxColon !== -1 && idxColon < 140) {
      return { head: t.slice(0, idxColon + 1), rest: t.slice(idxColon + 1).trimStart() };
    }
    const idxDot = t.indexOf(". ");
    if (idxDot !== -1 && idxDot < 140) {
      return { head: t.slice(0, idxDot + 1), rest: t.slice(idxDot + 1).trimStart() };
    }
    return { head: t, rest: "" };
  }

  const idxColon = t.indexOf(":");
  if (idxColon !== -1 && idxColon < 140) {
    if (/^[A-ZÁÉÍÓÚÑ]/.test(t)) {
      return { head: t.slice(0, idxColon + 1), rest: t.slice(idxColon + 1).trimStart() };
    }
  }

  const idxDot = t.indexOf(". ");
  if (idxDot !== -1 && idxDot < 140) {
    if (
      /^(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|S[ÉE]PTIMA|SEPTIMA|OCTAVA|NOVENA|D[ÉE]CIMA|DECIMA|VIG[ÉE]SIMA|VIGESIMA)\b/i.test(
        t
      )
    ) {
      return { head: t.slice(0, idxDot + 1), rest: t.slice(idxDot + 1).trimStart() };
    }
  }

  return null;
};

/* =========================
   Render cláusula
   ========================= */
const renderClausula = (txt, idx) => {
  const t = (txt || "").trim();
  const sp = splitClauseHeading(t);

  // ✅ Si detecta encabezado (PRIMERA.- Objeto:, SEGUNDA..., etc)
  // pone ese encabezado en negrilla y el resto lo procesa con negrillas internas.
  if (sp) {
    return (
      <Text key={idx} style={styles.paragraph}>
        <Text style={styles.bold}>{sp.head} </Text>
        {renderWithBoldParagrafos(sp.rest)}
      </Text>
    );
  }

  // ✅ Si no hay encabezado, igual aplica negrillas a Parágrafo, a) b) c), i. ii. etc
  return (
    <Text key={idx} style={styles.paragraph}>
      {renderWithBoldParagrafos(t)}
    </Text>
  );
};

const formatCedula = (v) => {
  if (v === null || v === undefined) return "";
  // deja solo dígitos
  const digits = String(v).replace(/\D/g, "");
  if (!digits) return String(v);

  // separador de miles con puntos (es-CO)
  return Number(digits).toLocaleString("es-CO");
};

/* =========================
   DOCUMENTO
   ========================= */
export default function CreateContract({ data = {} }) {
  const da = data?.datos_adicionales ?? data?.datosAdicionales ?? data?.DatosAdicionales ?? [];
  const d0 = Array.isArray(da) ? (da[0] || {}) : (da || {});

  const pick = (...vals) => {
    for (const v of vals) {
      if (v !== null && v !== undefined && String(v).trim() !== "") return v;
    }
    return null;
  };

  const nombreCompleto = data?.nombres && data?.apellidos ? `${data.nombres} ${data.apellidos}` : "";

  const direccion = safe(pick(d0?.Direccion, d0?.direccion, data?.Direccion, data?.direccion), "");
  const cedula = safe(data?.cedula, "");

  const barrioSolo = safe(pick(d0?.Barrio, d0?.barrio, data?.Barrio, data?.barrio), "");

  // ✅ si llega como objeto, intenta sacar un "nombre/label/value"
const asText = (v) => {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    return (
      v.nombre ??
      v.Nombre ??
      v.label ??
      v.value ??
      v.descripcion ??
      v.Descripcion ??
      ""
    );
  }
  return String(v);
};

const expedidaEn = upper(
  safe(
    pick(
      // ----- Variantes comunes -----
      data?.expedida_en,
      data?.expedidaEn,
      data?.ExpedidaEn,

      // ✅ “Lugar de Expedición” (muy probable que venga así)
      data?.lugar_expedicion,
      data?.lugarExpedicion,
      data?.LugarExpedicion,
      data?.lugarDeExpedicion,
      data?.LugarDeExpedicion,

      // Otras variantes
      data?.ciudad_expedicion,
      data?.CiudadExpedicion,
      data?.ciudadExpedicion,

      // En datos adicionales (d0)
      d0?.lugar_expedicion,
      d0?.lugarExpedicion,
      d0?.LugarExpedicion,
      d0?.CiudadExpedicion,
      d0?.ciudadExpedicion,
      d0?.ExpedidaEn,
      d0?.expedidaEn,

      // Si viene anidado
      data?.registro_personal?.expedida_en,
      data?.registro_personal?.expedidaEn,
      data?.registro_personal?.ExpedidaEn,
      data?.registro_personal?.lugarExpedicion,
      data?.registro_personal?.LugarExpedicion,
      data?.registro_personal?.ciudadExpedicion
    ),
    ""
  ).trim()
    ? asText(
        pick(
          data?.expedida_en,
          data?.expedidaEn,
          data?.ExpedidaEn,
          data?.lugar_expedicion,
          data?.lugarExpedicion,
          data?.LugarExpedicion,
          data?.lugarDeExpedicion,
          data?.LugarDeExpedicion,
          data?.ciudad_expedicion,
          data?.CiudadExpedicion,
          data?.ciudadExpedicion,
          d0?.lugar_expedicion,
          d0?.lugarExpedicion,
          d0?.LugarExpedicion,
          d0?.CiudadExpedicion,
          d0?.ciudadExpedicion,
          d0?.ExpedidaEn,
          d0?.expedidaEn,
          data?.registro_personal?.expedida_en,
          data?.registro_personal?.expedidaEn,
          data?.registro_personal?.ExpedidaEn,
          data?.registro_personal?.lugarExpedicion,
          data?.registro_personal?.LugarExpedicion,
          data?.registro_personal?.ciudadExpedicion
        )
      )
    : "",
  ""
);

  const telefonoFijo = safe(data?.telefono_fijo || data?.celular, "");
  const correo = safe(data?.correo, "");
  const celular = safe(data?.celular, "");

  const fechaNacimiento = safe(pick(data?.fechaNacimiento, data?.FechaNacimiento, data?.fecha_nacimiento), "");
  const nacionalidad = safe(pick(data?.nacionalidad, data?.Nacionalidad, data?.nacionalidad_nombre), "");

  const cargo = safe(data?.cargo_nombre || data?.cargo, "");
  const salario = data?.salario !== undefined ? money(data?.salario, "") : "";
  const periodoPago = safe(data?.periodo_pago, "Mensual");

  const duracionContrato = safe(data?.duracion_contrato, "Por la duración de una obra o labor determinada.");

  const fecha = splitFecha(data?.fechaIngreso);
  const fechaInicioDia = safe(fecha.dia, "");
  const fechaInicioMes = safe(fecha.mes, "");
  const fechaInicioAnio = safe(fecha.anio, "");

  const lugarLabores = safe(
    data?.cliente,
    "Territorio Nacional Colombiano donde el EMPLEADOR desarrolle operaciones."
  );

  const fechaContrato = safe(data?.fecha_contrato, "26-OCT-2018");

  const firmaEmpleador = "/FIRMA/FIRMA_EMPLEADORV1.png";
  const firmaTrabajador = data?.firma_trabajador || null;

  // ✅ versión (solo una vez y al costado)
  const versionContrato = "Versión 22-Enero -2026";

  const tituloHeader =
    "CONTRATO INDIVIDUAL DE TRABAJO POR LA DURACIÓN DE UNA OBRA O LABOR DETERMINADA";

  const nombreCompletoUpper = upper(nombreCompleto, "");
  const direccionUpper = upper(direccion, "");
  const barrioSoloUpper = upper(barrioSolo, "");
  const correoUpper = upper(correo, "");
  const cargoUpper = upper(cargo, "");

  console.log("DATA CreateContract:", data);
console.log("D0 (datos_adicionales[0]):", d0);
console.log("registro_personal:", data?.registro_personal);


  return (
    <Document>
      <Page size="LETTER" style={styles.page} wrap>
        {/* HEADER */}
        <View fixed style={styles.headerFixed}>
          {/* Logo izquierda (ASEOS) */}
          <Image style={styles.headerLogoLeft} src="/LOGO/LOGO_EMPRESA.jpeg" />

          {/* Título centrado */}
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>{tituloHeader}</Text>
          </View>

          {/* Bloque derecho: Logo MANTENER + versión debajo */}
          <View style={styles.headerRightWrap}>
            <Image style={styles.headerLogoRight} src="/LOGO/LOGO_EMPRESA2.jpeg" />
            <Text style={styles.headerVersionRight}>{versionContrato}</Text>
          </View>
        </View>

       {/* CUADRO */}
        <View style={styles.table}>
          {/* FILA 1 */}
          <View style={styles.tableRow}>
            <View style={[styles.cell, { width: GRID.HALF }]}>
              <Text style={styles.label}>NOMBRE DEL EMPLEADOR:</Text>
              <Text>ASEOS LA PERFECCIÓN S.A.S</Text>
              <Text>NIT. 800.068.462-4</Text>
            </View>

            <View style={[styles.cell, { width: GRID.HALF }]}>
              <Text style={styles.label}>DOMICILIO DEL EMPLEADOR:</Text>
              <Text>CALLE 4 BIS #53C-50 GALÁN</Text>
            </View>
          </View>

          <View style={styles.tableRow}>
            <View style={[styles.cell, { width: GRID.HALF }]}>
              <Text style={styles.label}>NOMBRE DEL TRABAJADOR:</Text>
              <Text>{nombreCompletoUpper}</Text>
            </View>
            <View style={[styles.cell, { width: GRID.HALF }]}>
              <Text style={styles.label}>DIRECCIÓN DEL DOMICILIO DEL TRABAJADOR:</Text>
              <Text>{direccionUpper}</Text>
            </View>
          </View>

          <View style={styles.tableRow}>
            <View style={[styles.cell, { width: GRID.LBL1 }]}>
              <Text style={styles.labelTight}>Cédula No.:</Text>
            </View>
            <View style={[styles.cell, { width: GRID.VAL1 }]}>
              <Text>{formatCedula(cedula)}</Text>
            </View>
            <View style={[styles.cell, { width: GRID.LBL2 }]}>
              <Text style={styles.labelTight}>Ciudad/Barrio</Text>
            </View>
            <View style={[styles.cell, { width: GRID.VAL2 }]}>
              <Text>{barrioSoloUpper}</Text>
            </View>
          </View>

          <View style={styles.tableRow}>
            <View style={[styles.cell, { width: GRID.LBL1 }]}>
              <Text style={styles.labelTight}>Expedida en:</Text>
            </View>
            <View style={[styles.cell, { width: GRID.VAL1 }]}>
              <Text>{expedidaEn}</Text>
            </View>
            <View style={[styles.cell, { width: GRID.LBL2 }]}>
              <Text style={styles.labelTight}>Teléfono Fijo</Text>
            </View>
            <View style={[styles.cell, { width: GRID.VAL2 }]}>
              <Text>{telefonoFijo}</Text>
            </View>
          </View>

          
         <View style={styles.tableRow}>
            <View style={[styles.cell, { width: GRID.HALF, borderBottomWidth: 0, padding: 0 }]}>
              <Text> </Text>
            </View>

            <View style={[styles.cell, { width: GRID.LBL2, paddingHorizontal: 6 }]}>
              <Text style={styles.labelOneLine}>{"Correo\u00A0electrónico"}</Text>
            </View>

            <View style={[styles.cell, { width: GRID.VAL2 }]}>
              <Text wrap={false} style={fitEmailStyle(correoUpper)}>
                {ellipsize(correoUpper, 42)}
              </Text>
            </View>
          </View>



          <View style={styles.tableRow}>
            <View style={[styles.cell, { width: GRID.HALF }]}>
              <Text style={styles.label}>FECHA DE NACIMIENTO y NACIONALIDAD:</Text>
              <Text>{fechaNacimiento}</Text>
              <Text>{nacionalidad}</Text>
            </View>
            <View style={[styles.cell, { width: GRID.HALF }]}>
              <Text style={styles.label}>CARGO QUE DESEMPEÑARA EL TRABAJADOR:</Text>
              <Text>{cargoUpper}</Text>
            </View>
          </View>

          <View style={styles.tableRow}>
            <View style={[styles.cell, { width: GRID.HALF }]}>
              <Text>
                <Text style={styles.label}>SALARIO: $ </Text>
                {salario}
              </Text>
            </View>
            <View style={[styles.cell, { width: GRID.HALF }]}>
              <Text>
                <Text style={styles.label}>PERIODOS DE PAGO: </Text>
                {periodoPago}
              </Text>
            </View>
          </View>

          <View style={styles.tableRow}>
            <View style={[styles.cell, { width: GRID.HALF }]}>
              <Text>
                <Text style={styles.label}>DURACIÓN DEL CONTRATO: </Text>
                {duracionContrato}
              </Text>
            </View>

            <View style={[styles.cell, styles.cellNoPad, { width: GRID.HALF }]}>
              <View style={styles.fechaHeaderArea}>
                <Text style={styles.label}>FECHA DE INICIACIÓN DE LABORES:</Text>
              </View>

              <View style={styles.fechaGrid}>
                <View style={styles.fechaGridRow}>
                  <View style={[styles.fechaGridCell, styles.fechaGridHeaderBottom]}>
                    <Text style={styles.label}>DIA</Text>
                  </View>
                  <View style={[styles.fechaGridCell, styles.fechaGridCellBorderL, styles.fechaGridHeaderBottom]}>
                    <Text style={styles.label}>MES</Text>
                  </View>
                  <View style={[styles.fechaGridCell, styles.fechaGridCellBorderL, styles.fechaGridHeaderBottom]}>
                    <Text style={styles.label}>AÑO</Text>
                  </View>
                </View>

                <View style={styles.fechaGridRow}>
                  <View style={styles.fechaGridCell}>
                    <Text>{fechaInicioDia}</Text>
                  </View>
                  <View style={[styles.fechaGridCell, styles.fechaGridCellBorderL]}>
                    <Text>{fechaInicioMes}</Text>
                  </View>
                  <View style={[styles.fechaGridCell, styles.fechaGridCellBorderL]}>
                    <Text>{fechaInicioAnio}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

        <View style={styles.tableRow}>
        <View style={[styles.cell, { width: GRID.HALF }]}>
          <Text style={styles.label}>LUGAR DONDE DESEMPEÑARA LAS LABORES</Text>

          <Text>
            {"Territorio Nacional Colombiano donde el EMPLEADOR desarrolle operaciones"}
            {lugarLabores ? `: ${lugarLabores}` : ""}
          </Text>
        </View>

        <View style={[styles.cell, { width: GRID.HALF }]}>
          <Text> </Text>
        </View>
      </View>
      </View>

        {/* ✅ CLÁUSULAS: empiezan cerca del cuadro (sin “OBRA O LABOR…”) */}
        {CLAUSULAS.map((t, i) => {
          if (i === 0) {
            return (
              <Text key={i} style={styles.firstParagraph}>
                {t}
              </Text>
            );
          }
          return renderClausula(t, i);
        })}

        <View style={styles.footerSpace} />

        {/* FIRMAS (NO TOCADO) */}
        <View style={styles.signaturesRow}>
          <FirmaBox titulo="EL EMPLEADOR" nitLine="NIT. 800.068.462-4" firmaSrc={firmaEmpleador} />
          <FirmaBox titulo="EL TRABAJADOR" ccLine="C.C. #" firmaSrc={firmaTrabajador} />
        </View>

        {/* Espacio extra entre firmas y testigos */}
        <View style={{ marginTop: 100 }} />

        <View style={styles.witnessesRow}>
          <View style={styles.witnessBox}>
            <Text style={styles.bold}>Testigo:</Text>
            <Text>{"\n"}_________________________________</Text>
            <Text>C.C. #</Text>
          </View>

          <View style={styles.witnessBox}>
            <Text style={styles.bold}>Testigo:</Text>
            <Text>{"\n"}_________________________________</Text>
            <Text>C.C. #</Text>
          </View>
        </View>

        {/* PIE DE PÁGINA (gris + pequeño + centrado) */}
        <View fixed style={styles.footerFixed}>
          <Text style={styles.footerLineTop}>
            TECNICOS EN LIMPIEZA DE: EMPRESAS, BANCOS, COLEGIOS, UNIVERSIDADES, CENTROS COMERCIALES, CENTRO DE RECREACION, EDIFICIOS (OFICINAS Y VIVIENDA), HOSPITALES, SUPERMERCADOS, LAVADO Y PINTURA DE FACHADAS, LAVADO DE VIDRIOS, TAPETES Y CORTINAS.
          </Text>
          <Text style={styles.footerLine}>
            Calle 4 Bis No. 53C-50 Bogotá, D.C – Colombia – PBX: 4204893
          </Text>
          <Text style={styles.footerLine}>
            dcomercial@aseoslaperfeccion.com – comercial2@aseoslaperfeccion.com
          </Text>
          <Text style={styles.footerLine}>www.aseoslaperfeccion.com</Text>
        </View>
      </Page>
    </Document>
  );
}