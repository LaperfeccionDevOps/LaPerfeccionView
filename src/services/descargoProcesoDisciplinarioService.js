const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api";

const BASE_URL =
  `${API_URL}/descargo-proceso-disciplinario`;


async function procesarRespuesta(
  response,
  mensajePredeterminado
) {
  if (response.ok) {
    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  let mensaje = mensajePredeterminado;

  try {
    const errorData = await response.json();

    if (typeof errorData?.detail === "string") {
      mensaje = errorData.detail;
    } else if (errorData?.detail?.mensaje) {
      mensaje = errorData.detail.mensaje;
    }
  } catch (error) {
    console.error(
      "No se pudo interpretar la respuesta de error:",
      error
    );
  }

  throw new Error(mensaje);
}


export async function crearDescargoProcesoDisciplinario(
  data
) {
  const response = await fetch(
    `${BASE_URL}/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  return procesarRespuesta(
    response,
    "No se pudo crear el descargo."
  );
}


export async function guardarBorradorDescargoProcesoDisciplinario(
  data
) {
  const response = await fetch(
    `${BASE_URL}/guardar-borrador`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  return procesarRespuesta(
    response,
    "No se pudo guardar el borrador del descargo."
  );
}


export async function obtenerDescargoPorProceso(
  idProceso
) {
  if (!idProceso) {
    return null;
  }

  const response = await fetch(
    `${BASE_URL}/proceso/${idProceso}`
  );

  return procesarRespuesta(
    response,
    "No se pudo obtener el descargo."
  );
}


export async function obtenerDescargoPorId(
  idDescargo
) {
  if (!idDescargo) {
    return null;
  }

  const response = await fetch(
    `${BASE_URL}/${idDescargo}`
  );

  return procesarRespuesta(
    response,
    "No se pudo obtener el descargo."
  );
}


export async function actualizarDescargoProcesoDisciplinario(
  idDescargo,
  data
) {
  const response = await fetch(
    `${BASE_URL}/${idDescargo}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  return procesarRespuesta(
    response,
    "No se pudo actualizar el descargo."
  );
}