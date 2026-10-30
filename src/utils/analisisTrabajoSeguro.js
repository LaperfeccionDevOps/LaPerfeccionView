// Utilidades del módulo Operaciones > Alturas > Análisis de Trabajo Seguro.
import { ClipboardList, FilePlus2 } from "lucide-react";

export const RUTAS_ANALISIS_TRABAJO_SEGURO = {
  inicio: "/operaciones/alturas/analisis-trabajo-seguro",
  crear: "/operaciones/alturas/analisis-trabajo-seguro/crear",
  consultar: "/operaciones/alturas/analisis-trabajo-seguro/consultar",
  detalle: (idAnalisis) =>
    `/operaciones/alturas/analisis-trabajo-seguro/${idAnalisis}`,
};

// Submódulos: tarjetas de la portada y pestañas de Crear / Consultar.
export const SUBMODULOS_ANALISIS_TRABAJO_SEGURO = [
  {
    to: RUTAS_ANALISIS_TRABAJO_SEGURO.crear,
    label: "Crear análisis",
    descripcion: "Registra un nuevo análisis de trabajo seguro.",
    icon: FilePlus2,
  },
  {
    to: RUTAS_ANALISIS_TRABAJO_SEGURO.consultar,
    label: "Consultar análisis",
    descripcion: "Revisa los análisis de trabajo seguro creados.",
    icon: ClipboardList,
  },
];

// Props comunes del encabezado en las vistas internas del módulo.
export const ENCABEZADO_ANALISIS_TRABAJO_SEGURO = {
  pestanas: SUBMODULOS_ANALISIS_TRABAJO_SEGURO,
  rutaVolver: RUTAS_ANALISIS_TRABAJO_SEGURO.inicio,
  etiquetaVolver: "Análisis de Trabajo Seguro",
};

// Fecha de hoy en Colombia con formato YYYY-MM-DD (para el atributo min).
export const obtenerHoyISO = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(
    new Date()
  );

// Domingo de la semana actual (lunes a domingo) en Colombia, YYYY-MM-DD. El
// análisis cubre solo una semana real.
export const obtenerDomingoSemanaISO = () => {
  const [anio, mes, dia] = obtenerHoyISO().split("-").map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  // getUTCDay: 0 = domingo ... 6 = sábado.
  fecha.setUTCDate(fecha.getUTCDate() + ((7 - fecha.getUTCDay()) % 7));
  return fecha.toISOString().slice(0, 10);
};

// "2026-10-29" -> "jue 29". Se arma sin zona horaria para no correr el día.
const DIAS_SEMANA = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

export const formatearDiaCorto = (valor) => {
  const [anio, mes, dia] = valor.split("-").map(Number);
  const indice = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay();
  return `${DIAS_SEMANA[indice]} ${String(dia).padStart(2, "0")}`;
};

// "2026-10-29" -> "29/10/2026". Se arma a mano porque `new Date("2026-10-29")`
// se interpreta en UTC y en hora de Colombia mostraría el día anterior.
export const formatearFechaSinHora = (valor) => {
  if (!valor) {
    return "—";
  }

  const [anio, mes, dia] = valor.split("-");
  return `${dia}/${mes}/${anio}`;
};

// Listas del bloque 3 (Equipos), del catálogo "OpcionPermisoAlturas".
// `campo` es el nombre en la API y `tipo` el de la base de datos. Sin
// `ordenAlfabetico` se respeta el orden del catálogo (columna "Orden").
export const LISTAS_EQUIPOS_ANALISIS = [
  {
    campo: "sistemas_acceso",
    tipo: "SISTEMA_ACCESO",
    etiqueta: "Sistemas de acceso a utilizar",
  },
  {
    campo: "herramientas_manuales",
    tipo: "HERRAMIENTA_MANUAL",
    etiqueta: "Herramientas manuales a utilizar",
    // Lista larga: se muestra en orden alfabético para encontrar fácil.
    ordenAlfabetico: true,
  },
  {
    campo: "herramientas_electricas",
    tipo: "HERRAMIENTA_ELECTRICA",
    etiqueta: "Herramientas eléctricas a utilizar",
    ordenAlfabetico: true,
  },
  {
    campo: "permisos_requeridos",
    tipo: "PERMISO_REQUERIDO",
    etiqueta: "Para este trabajo se necesita permiso de",
  },
];

// Campos abiertos del bloque 3 (obligatorios, hasta 4000 caracteres).
export const TEXTOS_EQUIPOS_ANALISIS = [
  { campo: "descripcion_tarea", etiqueta: "Descripción de la tarea a realizar" },
];

// Las opciones "No aplica" tienen un código terminado en este sufijo (p. ej.
// PER_NA, HEL_NA): no se eligen junto con otras de la misma lista y, en orden
// alfabético, quedan de últimas.
export const esOpcionNoAplica = (codigo) => Boolean(codigo?.endsWith("_NA"));

// Estados del análisis. Con el visto bueno del coordinador queda aprobado y
// los bloques 1 a 4 ya no se modifican.
export const ESTADO_ANALISIS_APROBADO = "APROBADO";

export const ESTADOS_ANALISIS = {
  EN_DILIGENCIAMIENTO: {
    etiqueta: "En diligenciamiento",
    clase: "bg-amber-100 text-amber-800",
  },
  APROBADO: {
    etiqueta: "Aprobado",
    clase: "bg-emerald-100 text-emerald-800",
  },
};

// Opción "Otro" de los permisos requeridos: exige escribir cuál.
export const CODIGO_PERMISO_OTRO = "PER_OT";

// Pasos (bloques) del análisis.
export const PASOS_ANALISIS_TRABAJO_SEGURO = [
  { numero: 1, titulo: "Datos" },
  { numero: 2, titulo: "Trabajadores" },
  { numero: 3, titulo: "Equipos" },
  { numero: 4, titulo: "Tareas y peligros" },
  { numero: 5, titulo: "Verificación diaria" },
  { numero: 6, titulo: "Visto bueno" },
];

export const pasoAnalisisCompleto = (numero, analisis) => {
  if (numero === 1) {
    return true;
  }

  if (numero === 2) {
    return analisis?.cantidad_trabajadores > 0;
  }

  if (numero === 3) {
    return (
      LISTAS_EQUIPOS_ANALISIS.every(
        ({ campo }) => analisis?.[campo]?.length > 0
      ) &&
      TEXTOS_EQUIPOS_ANALISIS.every(({ campo }) => Boolean(analisis?.[campo]))
    );
  }

  // Al menos una tarea y todas con al menos un peligro.
  if (numero === 4) {
    return analisis?.cantidad_tareas > 0 && !analisis?.tareas_sin_peligro;
  }

  // Todos los días hasta hoy diligenciados.
  if (numero === 5) {
    return analisis?.dias_diligenciados > 0 && !analisis?.dias_pendientes;
  }

  if (numero === 6) {
    return analisis?.estado === ESTADO_ANALISIS_APROBADO;
  }

  return false;
};

// Bloques 2 a 4 sin completar (requisito para el visto bueno).
export const bloquesPendientesVistoBueno = (analisis) =>
  [2, 3, 4]
    .filter((numero) => !pasoAnalisisCompleto(numero, analisis))
    .map(
      (numero) =>
        `${numero}. ${
          PASOS_ANALISIS_TRABAJO_SEGURO.find((p) => p.numero === numero).titulo
        }`
    );

// Primer paso que falta por diligenciar (para "Continuar").
export const primerPasoPendienteAnalisis = (analisis) =>
  PASOS_ANALISIS_TRABAJO_SEGURO.find(
    ({ numero }) => !pasoAnalisisCompleto(numero, analisis)
  )?.numero ?? PASOS_ANALISIS_TRABAJO_SEGURO.length;
