const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api";

const BASE_URL =
  `${API_URL}/citacion-proceso-disciplinario`;


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
      "No se pudo interpretar el error de citación:",
      error
    );
  }

  throw new Error(mensaje);
}


export async function crearCitacionProcesoDisciplinario(
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
    "No se pudo crear la citación del proceso disciplinario."
  );
}


export async function obtenerCitacionPorProceso(
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
    "No se pudo obtener la citación del proceso disciplinario."
  );
}


export async function obtenerCitacionPorId(
  idCitacion
) {
  if (!idCitacion) {
    return null;
  }

  const response = await fetch(
    `${BASE_URL}/${idCitacion}`
  );

  return procesarRespuesta(
    response,
    "No se pudo obtener la citación del proceso disciplinario."
  );
}


export async function actualizarCitacionProcesoDisciplinario(
  idCitacion,
  data
) {
  const response = await fetch(
    `${BASE_URL}/${idCitacion}`,
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
    "No se pudo actualizar la citación del proceso disciplinario."
  );
}