import { getApiUrl } from "../configFiles/api";

const RUTA = "/contabilidad/centros-costo";

const construirHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const procesarRespuesta = async (response) => {
  if (response.status === 401) {
    throw new Error(
      "La sesión no está autorizada o venció. Cierra sesión e ingresa nuevamente."
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : `Código HTTP: ${response.status}.`
    );
  }

  return data;
};

// Listas para los filtros: proyectos (con cliente y NIT), departamentos,
// líneas de negocio y servicios asociados.
export const obtenerFiltrosCentrosCosto = async () => {
  const response = await fetch(getApiUrl(`${RUTA}/filtros`), {
    headers: construirHeaders(),
  });

  return procesarRespuesta(response);
};

// Departamentos de Colombia (código DANE), para ubicar un CEN 2 nuevo.
export const obtenerDepartamentosGeograficos = async () => {
  const response = await fetch(getApiUrl(`${RUTA}/geografia/departamentos`), {
    headers: construirHeaders(),
  });

  return procesarRespuesta(response);
};

// Municipios de un departamento, por su código DANE (p. ej. "25").
export const obtenerMunicipios = async (codigoDane) => {
  const response = await fetch(
    getApiUrl(`${RUTA}/geografia/departamentos/${codigoDane}/municipios`),
    { headers: construirHeaders() }
  );

  return procesarRespuesta(response);
};

// Sedes (CEN 3) de un proyecto, con los CEN 2 donde ya tienen centros.
export const listarSedesProyecto = async (idProyecto) => {
  const response = await fetch(getApiUrl(`${RUTA}/sedes?id_proyecto=${idProyecto}`), {
    headers: construirHeaders(),
  });

  return procesarRespuesta(response);
};

// Indica si un código CEN 3 está libre en todos los proyectos.
export const validarCodigoSede = async (codigo) => {
  const response = await fetch(
    getApiUrl(`${RUTA}/sedes/validar-codigo?codigo=${encodeURIComponent(codigo)}`),
    { headers: construirHeaders() }
  );

  return procesarRespuesta(response);
};

// Crea un centro de costo ABIERTO (fecha de apertura: hoy) y, en la misma
// operación, lo que venga como nuevo (cliente/proyecto, CEN 2, sede, línea, servicio).
export const crearCentroCosto = async (datos) => {
  const response = await fetch(getApiUrl(RUTA), {
    method: "POST",
    headers: construirHeaders(),
    body: JSON.stringify(datos),
  });

  return procesarRespuesta(response);
};

// Indica si ya existe un centro con esa combinación de códigos CEN 2 a CEN 5.
export const validarCombinacionCentroCosto = async ({ cen2, cen3, cen4, cen5 }) => {
  const parametros = new URLSearchParams({ cen2, cen3, cen4, cen5 });
  const response = await fetch(getApiUrl(`${RUTA}/combinacion?${parametros}`), {
    headers: construirHeaders(),
  });

  return procesarRespuesta(response);
};

export const consultarCentrosCosto = async ({
  idProyecto,
  idDepartamento,
  idSede,
  idLinea,
  idServicio,
  estado,
  pendienteRevision,
  texto,
  pagina = 1,
  tamanoPagina = 50,
} = {}) => {
  const parametros = new URLSearchParams();
  const agregar = (clave, valor) => {
    if (valor !== undefined && valor !== null && valor !== "") {
      parametros.set(clave, valor);
    }
  };

  agregar("id_proyecto", idProyecto);
  agregar("id_departamento", idDepartamento);
  agregar("id_sede", idSede);
  agregar("id_linea", idLinea);
  agregar("id_servicio", idServicio);
  agregar("estado", estado);
  agregar("pendiente_revision", pendienteRevision);
  agregar("q", texto?.trim());
  agregar("pagina", pagina);
  agregar("tamano_pagina", tamanoPagina);

  const response = await fetch(getApiUrl(`${RUTA}?${parametros.toString()}`), {
    headers: construirHeaders(),
  });

  return procesarRespuesta(response);
};

// Detalle de un centro de costo con su historial (más reciente primero).
export const obtenerCentroCosto = async (idCentro) => {
  const response = await fetch(getApiUrl(`${RUTA}/${idCentro}`), {
    headers: construirHeaders(),
  });

  return procesarRespuesta(response);
};

// accion: "cerrar" o "reabrir". `fecha` es la fecha efectiva (YYYY-MM-DD).
export const cambiarEstadoCentroCosto = async (idCentro, accion, { fecha, motivo }) => {
  const response = await fetch(getApiUrl(`${RUTA}/${idCentro}/${accion}`), {
    method: "POST",
    headers: construirHeaders(),
    body: JSON.stringify({ fecha, motivo }),
  });

  return procesarRespuesta(response);
};

// ─── Asignación de operarios ───
const RUTA_ASIGNACIONES = "/contabilidad/asignaciones";

// Modalidades de días, cargos activos y parámetros legales vigentes.
export const obtenerCatalogosAsignacion = async () => {
  const response = await fetch(getApiUrl(`${RUTA_ASIGNACIONES}/catalogos`), {
    headers: construirHeaders(),
  });

  return procesarRespuesta(response);
};

// Horas semanales de un horario, sin guardar: { codigo_modalidad, horario_general, horario_sabado? }.
export const calcularHorasAsignacion = async (datos) => {
  const response = await fetch(getApiUrl(`${RUTA_ASIGNACIONES}/calcular`), {
    method: "POST",
    headers: construirHeaders(),
    body: JSON.stringify(datos),
  });

  return procesarRespuesta(response);
};

// Asignación vigente del centro (con líneas) y las anteriores.
export const obtenerAsignacionCentro = async (idCentro) => {
  const response = await fetch(getApiUrl(`${RUTA_ASIGNACIONES}/centros/${idCentro}`), {
    headers: construirHeaders(),
  });

  return procesarRespuesta(response);
};

// Registra una asignación desde una fecha; reemplaza a la vigente.
export const guardarAsignacionCentro = async (idCentro, datos) => {
  const response = await fetch(getApiUrl(`${RUTA_ASIGNACIONES}/centros/${idCentro}`), {
    method: "POST",
    headers: construirHeaders(),
    body: JSON.stringify(datos),
  });

  return procesarRespuesta(response);
};

// Finaliza la asignación vigente sin registrar otra.
export const finalizarAsignacionCentro = async (idCentro, fecha) => {
  const response = await fetch(getApiUrl(`${RUTA_ASIGNACIONES}/centros/${idCentro}/finalizar`), {
    method: "POST",
    headers: construirHeaders(),
    body: JSON.stringify({ fecha }),
  });

  return procesarRespuesta(response);
};
