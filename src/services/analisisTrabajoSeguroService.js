import { getApiUrl } from "../configFiles/api";
import { construirHeaders, procesarRespuesta } from "./permisosAlturasService";

// Los clientes y el buscador de personal contratado se comparten con permisos
// de trabajo en alturas (obtenerClientesAlturas, buscarTrabajadoresAlturas).
const RUTA = "/operaciones/alturas/analisis-trabajo-seguro";

export const obtenerAnalisisTrabajoSeguro = async ({ idResponsable } = {}) => {
  const parametros = new URLSearchParams();

  if (idResponsable) {
    parametros.set("id_registro_personal_responsable", idResponsable);
  }

  const consulta = parametros.toString();

  const response = await fetch(
    getApiUrl(`${RUTA}${consulta ? `?${consulta}` : ""}`),
    { headers: construirHeaders() }
  );

  return procesarRespuesta(response);
};

export const crearAnalisisTrabajoSeguro = async ({
  idResponsable,
  idCliente,
  lugarTrabajo,
  fechaFinalizacionActividad,
  alturaAproximadaMetros,
}) => {
  const response = await fetch(getApiUrl(RUTA), {
    method: "POST",
    headers: construirHeaders(),
    body: JSON.stringify({
      id_registro_personal_responsable: idResponsable,
      id_cliente: idCliente,
      lugar_trabajo: lugarTrabajo,
      fecha_finalizacion_actividad: fechaFinalizacionActividad,
      altura_aproximada_metros: alturaAproximadaMetros,
    }),
  });

  return procesarRespuesta(response);
};

export const obtenerAnalisisTrabajoSeguroPorId = async (idAnalisis) => {
  const response = await fetch(getApiUrl(`${RUTA}/${idAnalisis}`), {
    headers: construirHeaders(),
  });

  return procesarRespuesta(response);
};

export const obtenerTrabajadoresAnalisis = async (idAnalisis) => {
  const response = await fetch(getApiUrl(`${RUTA}/${idAnalisis}/trabajadores`), {
    headers: construirHeaders(),
  });

  return procesarRespuesta(response);
};

export const agregarTrabajadorAnalisis = async (
  idAnalisis,
  { idRegistroPersonal, firmaPng }
) => {
  const response = await fetch(getApiUrl(`${RUTA}/${idAnalisis}/trabajadores`), {
    method: "POST",
    headers: construirHeaders(),
    body: JSON.stringify({
      id_registro_personal: idRegistroPersonal,
      firma_png: firmaPng,
    }),
  });

  return procesarRespuesta(response);
};

// Imagen PNG de la firma. Se pide con el token, por eso se devuelve como Blob.
export const obtenerFirmaTrabajadorAnalisis = async (idAnalisis, idTrabajador) => {
  const response = await fetch(
    getApiUrl(`${RUTA}/${idAnalisis}/trabajadores/${idTrabajador}/firma`),
    { headers: construirHeaders() }
  );

  if (!response.ok) {
    throw new Error(`No se pudo obtener la firma. Código HTTP: ${response.status}.`);
  }

  return response.blob();
};

export const quitarTrabajadorAnalisis = async (idAnalisis, idTrabajador) => {
  const response = await fetch(
    getApiUrl(`${RUTA}/${idAnalisis}/trabajadores/${idTrabajador}`),
    {
      method: "DELETE",
      headers: construirHeaders(),
    }
  );

  if (response.status === 204) {
    return null;
  }

  return procesarRespuesta(response);
};

export const guardarEquiposAnalisis = async (
  idAnalisis,
  {
    sistemas_acceso: sistemasAcceso,
    herramientas_manuales: herramientasManuales,
    herramientas_electricas: herramientasElectricas,
    permisos_requeridos: permisosRequeridos,
    descripcion_tarea: descripcionTarea,
    otro_permiso_requerido: otroPermisoRequerido,
  }
) => {
  const response = await fetch(getApiUrl(`${RUTA}/${idAnalisis}/equipos`), {
    method: "PUT",
    headers: construirHeaders(),
    body: JSON.stringify({
      sistemas_acceso: sistemasAcceso,
      herramientas_manuales: herramientasManuales,
      herramientas_electricas: herramientasElectricas,
      permisos_requeridos: permisosRequeridos,
      descripcion_tarea: descripcionTarea,
      otro_permiso_requerido: otroPermisoRequerido || null,
    }),
  });

  return procesarRespuesta(response);
};

// Bloque 4: tareas del análisis.
export const obtenerTareasAnalisis = async (idAnalisis) => {
  const response = await fetch(getApiUrl(`${RUTA}/${idAnalisis}/tareas`), {
    headers: construirHeaders(),
  });

  return procesarRespuesta(response);
};

// Cada tarea se crea con su primer peligro de la matriz.
export const agregarTareaAnalisis = async (
  idAnalisis,
  pasoDetallado,
  idMatrizPeligro
) => {
  const response = await fetch(getApiUrl(`${RUTA}/${idAnalisis}/tareas`), {
    method: "POST",
    headers: construirHeaders(),
    body: JSON.stringify({
      paso_detallado: pasoDetallado,
      id_matriz_peligro: idMatrizPeligro,
    }),
  });

  return procesarRespuesta(response);
};

// Matriz de peligros (filas activas, por categoría de riesgo).
export const obtenerMatrizPeligros = async () => {
  const response = await fetch(getApiUrl(`${RUTA}/matriz-peligros`), {
    headers: construirHeaders(),
  });

  return procesarRespuesta(response);
};

export const agregarPeligroTarea = async (idAnalisis, idTarea, idMatrizPeligro) => {
  const response = await fetch(
    getApiUrl(`${RUTA}/${idAnalisis}/tareas/${idTarea}/peligros`),
    {
      method: "POST",
      headers: construirHeaders(),
      body: JSON.stringify({ id_matriz_peligro: idMatrizPeligro }),
    }
  );

  return procesarRespuesta(response);
};

export const quitarPeligroTarea = async (idAnalisis, idTarea, idPeligroTarea) => {
  const response = await fetch(
    getApiUrl(`${RUTA}/${idAnalisis}/tareas/${idTarea}/peligros/${idPeligroTarea}`),
    {
      method: "DELETE",
      headers: construirHeaders(),
    }
  );

  if (response.status === 204) {
    return null;
  }

  return procesarRespuesta(response);
};

export const editarTareaAnalisis = async (idAnalisis, idTarea, pasoDetallado) => {
  const response = await fetch(getApiUrl(`${RUTA}/${idAnalisis}/tareas/${idTarea}`), {
    method: "PUT",
    headers: construirHeaders(),
    body: JSON.stringify({ paso_detallado: pasoDetallado }),
  });

  return procesarRespuesta(response);
};

export const quitarTareaAnalisis = async (idAnalisis, idTarea) => {
  const response = await fetch(getApiUrl(`${RUTA}/${idAnalisis}/tareas/${idTarea}`), {
    method: "DELETE",
    headers: construirHeaders(),
  });

  if (response.status === 204) {
    return null;
  }

  return procesarRespuesta(response);
};

// Bloque 5: verificación diaria.
export const obtenerVerificacionDiaria = async (idAnalisis) => {
  const response = await fetch(
    getApiUrl(`${RUTA}/${idAnalisis}/verificacion-diaria`),
    { headers: construirHeaders() }
  );

  return procesarRespuesta(response);
};

export const diligenciarDiaAnalisis = async (
  idAnalisis,
  { fecha, idRegistroPersonal, respuestas, observaciones }
) => {
  const response = await fetch(
    getApiUrl(`${RUTA}/${idAnalisis}/verificacion-diaria`),
    {
      method: "POST",
      headers: construirHeaders(),
      body: JSON.stringify({
        fecha,
        id_registro_personal: idRegistroPersonal,
        respuestas: Object.entries(respuestas).map(([idItem, respuesta]) => ({
          id_item_permiso_alturas: Number(idItem),
          respuesta,
        })),
        observaciones: observaciones || null,
      }),
    }
  );

  return procesarRespuesta(response);
};

// Bloque 6: visto bueno del coordinador de alturas.
// Lo da el responsable del análisis: solo se envía su firma.
export const darVistoBuenoAnalisis = async (idAnalisis, firmaPng) => {
  const response = await fetch(getApiUrl(`${RUTA}/${idAnalisis}/visto-bueno`), {
    method: "POST",
    headers: construirHeaders(),
    body: JSON.stringify({ firma_png: firmaPng }),
  });

  return procesarRespuesta(response);
};

export const obtenerFirmaCoordinadorAnalisis = async (idAnalisis) => {
  const response = await fetch(getApiUrl(`${RUTA}/${idAnalisis}/firma-coordinador`), {
    headers: construirHeaders(),
  });

  if (!response.ok) {
    throw new Error(`No se pudo obtener la firma. Código HTTP: ${response.status}.`);
  }

  return response.blob();
};

// PDF del análisis (formato F-SS-006). Sin visto bueno sale como borrador.
export const abrirPdfAnalisis = async (idAnalisis) => {
  const ventana = window.open("", "_blank");

  try {
    const response = await fetch(getApiUrl(`${RUTA}/${idAnalisis}/pdf`), {
      headers: construirHeaders(),
    });

    if (!response.ok) {
      throw new Error(`No se pudo generar el PDF. Código HTTP: ${response.status}.`);
    }

    const url = URL.createObjectURL(await response.blob());

    if (ventana) {
      ventana.location.href = url;
    } else {
      // Ventanas emergentes bloqueadas: se descarga el archivo.
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `analisis_trabajo_seguro_${idAnalisis}.pdf`;
      enlace.click();
    }

    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    ventana?.close();
    throw error;
  }
};
