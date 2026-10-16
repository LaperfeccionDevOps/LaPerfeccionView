import { getApiUrl } from "../configFiles/api";
import {
  CONDICIONES_SALUD,
  IMPEDIMENTOS_ALTURAS,
} from "../utils/permisosAlturas";

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
    const detalle =
      typeof data?.detail === "string"
        ? data.detail
        : `Código HTTP: ${response.status}.`;

    throw new Error(detalle);
  }

  return data;
};

export const obtenerClientesAlturas = async () => {
  const response = await fetch(
    getApiUrl("/operaciones/alturas/clientes"),
    { headers: construirHeaders() }
  );

  return procesarRespuesta(response);
};

export const obtenerPermisosAlturas = async ({ idResponsable } = {}) => {
  const parametros = new URLSearchParams();

  if (idResponsable) {
    parametros.set("id_registro_personal_responsable", idResponsable);
  }

  const consulta = parametros.toString();

  const response = await fetch(
    getApiUrl(`/operaciones/alturas/permisos${consulta ? `?${consulta}` : ""}`),
    { headers: construirHeaders() }
  );

  return procesarRespuesta(response);
};

export const obtenerCiudadesAlturas = async () => {
  const response = await fetch(
    getApiUrl("/operaciones/alturas/ciudades"),
    { headers: construirHeaders() }
  );

  return procesarRespuesta(response);
};

export const crearPermisoAlturas = async ({
  idResponsable,
  idCliente,
  idCiudad,
  lugarTrabajo,
  horaInicioTarea,
  horaFinTarea,
}) => {
  const response = await fetch(
    getApiUrl("/operaciones/alturas/permisos"),
    {
      method: "POST",
      headers: construirHeaders(),
      body: JSON.stringify({
        id_registro_personal_responsable: Number(idResponsable),
        id_cliente: Number(idCliente),
        id_ciudad: Number(idCiudad),
        lugar_trabajo: lugarTrabajo || null,
        hora_inicio_tarea: horaInicioTarea,
        hora_fin_tarea: horaFinTarea,
      }),
    }
  );

  return procesarRespuesta(response);
};

export const buscarTrabajadoresAlturas = async (criterio) => {
  const parametros = new URLSearchParams({ q: criterio });

  const response = await fetch(
    getApiUrl(`/operaciones/alturas/trabajadores/buscar?${parametros.toString()}`),
    { headers: construirHeaders() }
  );

  return procesarRespuesta(response);
};

export const obtenerTrabajadoresPermiso = async (idPermiso) => {
  const response = await fetch(
    getApiUrl(`/operaciones/alturas/permisos/${idPermiso}/trabajadores`),
    { headers: construirHeaders() }
  );

  return procesarRespuesta(response);
};

export const agregarTrabajadorPermiso = async (idPermiso, trabajador) => {
  const response = await fetch(
    getApiUrl(`/operaciones/alturas/permisos/${idPermiso}/trabajadores`),
    {
      method: "POST",
      headers: construirHeaders(),
      body: JSON.stringify({
        id_registro_personal: Number(trabajador.idRegistroPersonal),
        fecha_examen_medico: trabajador.fechaExamenMedico,
        fecha_certificado_alturas: trabajador.fechaCertificadoAlturas,
        seguridad_social_verificada: trabajador.seguridadSocialVerificada === "SI",
        presenta_impedimento_alturas:
          trabajador.presentaImpedimentoAlturas === "SI",
        // Si no presenta impedimento, el backend guarda las subpreguntas en NO.
        ...(trabajador.presentaImpedimentoAlturas === "SI"
          ? {
              ...Object.fromEntries(
                IMPEDIMENTOS_ALTURAS.map(({ campo, api }) => [
                  api,
                  trabajador[campo] === "SI",
                ])
              ),
              otro_impedimento_alturas:
                trabajador.otroImpedimentoAlturas || null,
            }
          : {}),
        consume_medicamentos: trabajador.consumeMedicamentos === "SI",
        // Si no consume medicamentos, el backend guarda las subpreguntas en NO.
        ...(trabajador.consumeMedicamentos === "SI"
          ? {
              medicamentos_presion_arterial:
                trabajador.medicamentosPresionArterial === "SI",
              medicamentos_somnolencia:
                trabajador.medicamentosSomnolencia === "SI",
              cual_medicamento_somnolencia:
                trabajador.cualMedicamentoSomnolencia || null,
              otro_medicamento: trabajador.otroMedicamento || null,
            }
          : {}),
        presenta_condicion_salud: trabajador.presentaCondicionSalud === "SI",
        firma_png: trabajador.firmaPng,
        otra_condicion_salud: trabajador.otraCondicionSalud || null,
        // Si no presenta condición de salud, el backend guarda todas en NO.
        ...(trabajador.presentaCondicionSalud === "SI"
          ? Object.fromEntries(
              CONDICIONES_SALUD.map(({ campo, api }) => [
                api,
                trabajador[campo] === "SI",
              ])
            )
          : {}),
      }),
    }
  );

  return procesarRespuesta(response);
};

// Imagen PNG de la firma del trabajador. Se pide con el token (por eso no
// sirve un <img src> directo) y se devuelve como Blob.
export const obtenerFirmaTrabajadorPermiso = async (idPermiso, idPermisoTrabajador) => {
  const response = await fetch(
    getApiUrl(
      `/operaciones/alturas/permisos/${idPermiso}/trabajadores/${idPermisoTrabajador}/firma`
    ),
    { headers: construirHeaders() }
  );

  if (!response.ok) {
    throw new Error(`No se pudo obtener la firma. Código HTTP: ${response.status}.`);
  }

  return response.blob();
};

export const quitarTrabajadorPermiso = async (idPermiso, idPermisoTrabajador) => {
  const response = await fetch(
    getApiUrl(
      `/operaciones/alturas/permisos/${idPermiso}/trabajadores/${idPermisoTrabajador}`
    ),
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

export const obtenerPermisoAlturas = async (idPermiso) => {
  const response = await fetch(
    getApiUrl(`/operaciones/alturas/permisos/${idPermiso}`),
    { headers: construirHeaders() }
  );

  return procesarRespuesta(response);
};

// Paso 3: datos básicos de la tarea y medidas de prevención.
// Opciones activas de las listas del paso 3 (mecanismos, herramientas,
// sistemas de acceso y de ingeniería).
export const obtenerOpcionesTareaAlturas = async () => {
  const response = await fetch(
    getApiUrl("/operaciones/alturas/opciones-tarea"),
    { headers: construirHeaders() }
  );

  return procesarRespuesta(response);
};

export const guardarTareaPermisoAlturas = async (idPermiso, tarea) => {
  const response = await fetch(
    getApiUrl(`/operaciones/alturas/permisos/${idPermiso}/tarea`),
    {
      method: "PUT",
      headers: construirHeaders(),
      body: JSON.stringify({
        descripcion_procedimiento: tarea.descripcionProcedimiento,
        altura_aproximada_metros: Number(tarea.alturaAproximadaMetros),
        re_entrenamiento: tarea.reEntrenamiento === "SI",
        aplica_medidas_colectivas: tarea.aplicaMedidasColectivas === "SI",
        medidas_colectivas: tarea.medidasColectivas || null,
        trabajo_suspension: tarea.trabajoSuspension === "SI",
        // Ids elegidos en cada lista.
        mecanismos: tarea.mecanismos,
        herramientas: tarea.herramientas,
        sistemas_acceso: tarea.sistemas_acceso,
        sistemas_ingenieria: tarea.sistemas_ingenieria,
      }),
    }
  );

  return procesarRespuesta(response);
};

// Paso 4: elementos de protección (Sí / No / No aplica) y "Otro ¿cuál?".
export const obtenerProteccionPermisoAlturas = async (idPermiso) => {
  const response = await fetch(
    getApiUrl(`/operaciones/alturas/permisos/${idPermiso}/proteccion`),
    { headers: construirHeaders() }
  );

  const datos = await procesarRespuesta(response);

  return {
    items: datos.items,
    otro: datos.otro_elemento_proteccion,
  };
};

export const guardarProteccionPermisoAlturas = async (
  idPermiso,
  respuestas,
  otro
) => {
  const response = await fetch(
    getApiUrl(`/operaciones/alturas/permisos/${idPermiso}/proteccion`),
    {
      method: "PUT",
      headers: construirHeaders(),
      body: JSON.stringify({
        respuestas,
        otro_elemento_proteccion: otro || null,
      }),
    }
  );

  return procesarRespuesta(response);
};

// Paso 5: lista de verificación (Sí / No / No aplica).
export const obtenerVerificacionPermisoAlturas = async (idPermiso) => {
  const response = await fetch(
    getApiUrl(`/operaciones/alturas/permisos/${idPermiso}/verificacion`),
    { headers: construirHeaders() }
  );

  const datos = await procesarRespuesta(response);

  return { items: datos.items, otro: null };
};

export const guardarVerificacionPermisoAlturas = async (idPermiso, respuestas) => {
  const response = await fetch(
    getApiUrl(`/operaciones/alturas/permisos/${idPermiso}/verificacion`),
    {
      method: "PUT",
      headers: construirHeaders(),
      body: JSON.stringify({ respuestas }),
    }
  );

  return procesarRespuesta(response);
};

// Paso 6: identificación de peligros (Sí / No / No aplica).
export const obtenerPeligrosPermisoAlturas = async (idPermiso) => {
  const response = await fetch(
    getApiUrl(`/operaciones/alturas/permisos/${idPermiso}/peligros`),
    { headers: construirHeaders() }
  );

  const datos = await procesarRespuesta(response);

  return { items: datos.items, otro: null };
};

export const guardarPeligrosPermisoAlturas = async (idPermiso, respuestas) => {
  const response = await fetch(
    getApiUrl(`/operaciones/alturas/permisos/${idPermiso}/peligros`),
    {
      method: "PUT",
      headers: construirHeaders(),
      body: JSON.stringify({ respuestas }),
    }
  );

  return procesarRespuesta(response);
};

// Paso 7: autorización con firmas. Al autorizar, el permiso queda bloqueado y
// el backend lo envía por correo a los destinatarios configurados.
export const autorizarPermisoAlturas = async (idPermiso, datos) => {
  const response = await fetch(
    getApiUrl(`/operaciones/alturas/permisos/${idPermiso}/autorizar`),
    {
      method: "POST",
      headers: construirHeaders(),
      body: JSON.stringify({
        id_registro_personal_autoriza: datos.autoriza.id_registro_personal,
        firma_autoriza: datos.firmaAutoriza,
        firma_coordinador: datos.firmaCoordinador,
        id_registro_personal_emergencias: datos.emergencias.id_registro_personal,
        firma_emergencias: datos.firmaEmergencias,
        aplica_ayudante_seguridad: datos.aplicaAyudante === "SI",
        id_registro_personal_ayudante:
          datos.aplicaAyudante === "SI"
            ? datos.ayudante?.id_registro_personal
            : null,
        firma_ayudante:
          datos.aplicaAyudante === "SI" ? datos.firmaAyudante : null,
        observaciones: datos.observaciones || null,
      }),
    }
  );

  return procesarRespuesta(response);
};

export const reenviarCorreoPermisoAlturas = async (idPermiso) => {
  const response = await fetch(
    getApiUrl(`/operaciones/alturas/permisos/${idPermiso}/reenviar-correo`),
    { method: "POST", headers: construirHeaders() }
  );

  return procesarRespuesta(response);
};

// Imagen PNG de una firma del paso 7 (AUTORIZA, COORDINADOR, EMERGENCIAS,
// AYUDANTE). Se pide con el token y se devuelve como Blob.
export const obtenerFirmaPermisoAlturas = async (idPermiso, rol) => {
  const response = await fetch(
    getApiUrl(`/operaciones/alturas/permisos/${idPermiso}/firmas/${rol}`),
    { headers: construirHeaders() }
  );

  if (!response.ok) {
    throw new Error(`No se pudo obtener la firma. Código HTTP: ${response.status}.`);
  }

  return response.blob();
};


// Abre el PDF del permiso (formato F-SS-007) en una pestaña nueva. Se pide con
// el token, por eso no sirve un enlace directo. La pestaña se abre antes de la
// descarga para que el navegador no la bloquee como ventana emergente.
export const abrirPdfPermisoAlturas = async (idPermiso) => {
  const ventana = window.open("", "_blank");

  try {
    const response = await fetch(
      getApiUrl(`/operaciones/alturas/permisos/${idPermiso}/pdf`),
      { headers: construirHeaders() }
    );

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
      enlace.download = `permiso_alturas_${idPermiso}.pdf`;
      enlace.click();
    }

    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    ventana?.close();
    throw error;
  }
};
