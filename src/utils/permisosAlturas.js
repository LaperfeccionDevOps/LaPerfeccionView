// Utilidades compartidas del módulo Operaciones > Alturas > Permisos de trabajo.

export const RUTAS_PERMISOS_ALTURAS = {
  inicio: "/operaciones/alturas/permisos-trabajo",
  crear: "/operaciones/alturas/permisos-trabajo/crear",
  consultar: "/operaciones/alturas/permisos-trabajo/consultar",
  detalle: (idPermiso) => `/operaciones/alturas/permisos-trabajo/${idPermiso}`,
};

// Estados del permiso (columna "Estado"). Solo se edita en diligenciamiento.
export const ESTADO_EN_DILIGENCIAMIENTO = "EN_DILIGENCIAMIENTO";

export const ESTADOS_PERMISO = {
  EN_DILIGENCIAMIENTO: {
    etiqueta: "En diligenciamiento",
    clase: "bg-amber-100 text-amber-800",
  },
  AUTORIZADO: {
    etiqueta: "Autorizado",
    clase: "bg-emerald-100 text-emerald-800",
  },
  CERRADO: {
    etiqueta: "Cerrado",
    clase: "bg-gray-100 text-gray-700",
  },
};

// Pasos del formulario del permiso. Los marcados como pendientes aún no
// están construidos.
export const PASOS_PERMISO_ALTURAS = [
  { numero: 1, titulo: "Datos" },
  { numero: 2, titulo: "Trabajadores" },
  { numero: 3, titulo: "Tarea" },
  { numero: 4, titulo: "Protección" },
  { numero: 5, titulo: "Verificación" },
  { numero: 6, titulo: "Peligros" },
  { numero: 7, titulo: "Autorización" },
];

// El paso 3 está completo cuando tiene todos sus campos obligatorios.
export const tareaCompleta = (permiso) =>
  Boolean(
    permiso?.tipo_trabajo_alturas &&
      permiso?.descripcion_procedimiento &&
      permiso?.herramientas_utensilios &&
      permiso?.altura_aproximada_metros &&
      permiso?.re_entrenamiento != null &&
      permiso?.sistemas_acceso &&
      permiso?.trabajo_suspension != null
  );

// Pasos 2 a 6 sin completar (deben estar completos para autorizar).
export const pasosPendientesAutorizacion = (permiso) =>
  [
    [!permiso?.cantidad_trabajadores, "2. Trabajadores"],
    [!tareaCompleta(permiso), "3. Tarea"],
    [!permiso?.proteccion_completa, "4. Protección"],
    [!permiso?.verificacion_completa, "5. Verificación"],
    [!permiso?.peligros_completa, "6. Peligros"],
  ]
    .filter(([pendiente]) => pendiente)
    .map(([, paso]) => paso);

// Roles de las firmas del paso 7.
export const ROLES_FIRMA_PERMISO = {
  AUTORIZA: "Persona que autoriza el trabajo",
  COORDINADOR: "Coordinador (responsable del permiso)",
  EMERGENCIAS: "Responsable de activar el plan de emergencias",
  AYUDANTE: "Ayudante de seguridad",
};

// Primer paso que falta por diligenciar (para "Continuar"). Un permiso ya
// autorizado abre directamente el resumen de la autorización.
export const primerPasoPendiente = (permiso) => {
  if (permiso?.estado && permiso.estado !== ESTADO_EN_DILIGENCIAMIENTO) {
    return 7;
  }

  if (!permiso?.cantidad_trabajadores) {
    return 2;
  }

  if (!tareaCompleta(permiso)) {
    return 3;
  }

  if (!permiso.proteccion_completa) {
    return 4;
  }

  if (!permiso.verificacion_completa) {
    return 5;
  }

  if (!permiso.peligros_completa) {
    return 6;
  }

  return 7;
};

// Condiciones de salud específicas del trabajador. Solo se preguntan si
// declara que presenta alguna condición de salud; si no, quedan en NO.
// `campo` es el nombre en el formulario y `api` el que espera el backend.
export const CONDICIONES_SALUD = [
  {
    campo: "problemasCorazon",
    api: "problemas_corazon",
    pregunta: "¿Actualmente percibe problemas de corazón?",
    corto: "Corazón",
  },
  {
    campo: "problemasRespiratorios",
    api: "problemas_respiratorios",
    pregunta: "¿Actualmente tiene problemas para respirar?",
    corto: "Respiración",
  },
  {
    campo: "diabetes",
    api: "diabetes",
    pregunta: "¿Actualmente sufre de diabetes?",
    corto: "Diabetes",
  },
  {
    campo: "epilepsia",
    api: "epilepsia",
    pregunta: "¿Actualmente sufre de epilepsia?",
    corto: "Epilepsia",
  },
  {
    campo: "problemasSistemaNervioso",
    api: "problemas_sistema_nervioso",
    pregunta: "¿Actualmente sufre del sistema nervioso?",
    corto: "Sistema nervioso",
  },
  {
    campo: "problemasAudicion",
    api: "problemas_audicion",
    pregunta: "¿Actualmente sufre de problemas de audición?",
    corto: "Audición",
  },
  {
    campo: "problemasVisuales",
    api: "problemas_visuales",
    pregunta:
      "¿Actualmente tiene problemas de capacidad visual que le limiten en el trabajo?",
    corto: "Visión",
  },
];

// Condiciones o situaciones que impiden trabajar en alturas de manera segura.
// Solo se preguntan si declara que presenta alguna; si no, quedan en NO.
export const IMPEDIMENTOS_ALTURAS = [
  {
    campo: "ingirioAlcohol12Horas",
    api: "ingirio_alcohol_12_horas",
    pregunta: "¿Ha ingerido bebidas alcohólicas en las últimas 12 horas?",
    corto: "Alcohol (12 h)",
  },
  {
    campo: "miedoAlturasVertigo",
    api: "miedo_alturas_vertigo",
    pregunta:
      "¿Le tiene miedo a las alturas o actualmente sufre de vértigo o mareo?",
    corto: "Miedo / vértigo",
  },
  {
    campo: "consumeSustancias",
    api: "consume_sustancias",
    pregunta:
      "¿Ha consumido recientemente sustancias psicoactivas, alcohol u otras sustancias que puedan afectar su estado de alerta, coordinación, equilibrio o capacidad de reacción para realizar trabajos en alturas?",
    corto: "Sustancias",
  },
];

// Texto en minúsculas y sin tildes, para comparar en búsquedas ("Bogotá" = "bogota").
export const normalizarTexto = (valor) =>
  String(valor || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

// Las fechas se muestran siempre en hora de Colombia, igual que las guarda el
// backend, y en formato de 24 horas (sin a. m. / p. m.).
export const ZONA_HORARIA = "America/Bogota";

export const formatearFecha = (valor) => {
  if (!valor) {
    return "";
  }

  return new Date(valor).toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
    hourCycle: "h23",
    timeZone: ZONA_HORARIA,
  });
};

export const formatearHora = (valor) => {
  if (!valor) {
    return "—";
  }

  return new Date(valor).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: ZONA_HORARIA,
  });
};

export const formatearFechaDia = (valor) => {
  if (!valor) {
    return "—";
  }

  return new Date(valor).toLocaleDateString("es-CO", {
    dateStyle: "short",
    timeZone: ZONA_HORARIA,
  });
};

export const obtenerFechaHoyTexto = () =>
  new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: ZONA_HORARIA,
  });

// Temporal, mientras no existan los roles: se recuerda el último responsable
// elegido para que Crear y Consultar lo compartan. Luego el responsable saldrá
// del usuario autenticado.
//
// El dato queda atado al inicio de sesión con el que se eligió: se guarda una
// huella del token (cada login genera uno nuevo) y, si el token cambió o ya no
// existe —cerró sesión, venció o entró otro usuario—, el dato se descarta.
const CLAVE_RESPONSABLE = "permisosAlturas.responsable";

const obtenerHuellaSesion = () => {
  try {
    const token = window.localStorage.getItem("token");
    // La firma del JWT (final del token) es distinta en cada inicio de sesión.
    return token ? token.slice(-16) : null;
  } catch {
    return null;
  }
};

export const leerResponsableSesion = () => {
  try {
    const valor = window.sessionStorage.getItem(CLAVE_RESPONSABLE);

    if (!valor) {
      return null;
    }

    const { sesion, persona } = JSON.parse(valor);
    const huella = obtenerHuellaSesion();

    if (!huella || sesion !== huella) {
      window.sessionStorage.removeItem(CLAVE_RESPONSABLE);
      return null;
    }

    return persona || null;
  } catch {
    return null;
  }
};

export const guardarResponsableSesion = (persona) => {
  try {
    const huella = obtenerHuellaSesion();

    if (persona && huella) {
      window.sessionStorage.setItem(
        CLAVE_RESPONSABLE,
        JSON.stringify({ sesion: huella, persona })
      );
    } else {
      window.sessionStorage.removeItem(CLAVE_RESPONSABLE);
    }
  } catch {
    // Sin almacenamiento disponible: simplemente no se recuerda.
  }
};
