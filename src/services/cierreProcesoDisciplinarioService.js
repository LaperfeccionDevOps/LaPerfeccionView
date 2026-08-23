const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api";

const BASE_URL =
  `${API_URL}/cierre-proceso-disciplinario`;


function obtenerToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("jwt") ||
    ""
  );
}


function construirHeaders() {
  const token = obtenerToken();

  return {
    "Content-Type": "application/json",
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
}


async function obtenerDetalleError(
  response,
  mensajePredeterminado
) {
  try {
    const data = await response.json();

    if (typeof data?.detail === "string") {
      return data.detail;
    }

    if (data?.detail?.mensaje) {
      return data.detail.mensaje;
    }

    if (
      Array.isArray(data?.detail) &&
      data.detail.length > 0
    ) {
      return (
        data.detail[0]?.msg ||
        mensajePredeterminado
      );
    }
  } catch {
    // La respuesta no contenía JSON.
  }

  return (
    `${mensajePredeterminado} ` +
    `Código HTTP: ${response.status}.`
  );
}


export async function crearCierreProcesoDisciplinario(
  data
) {
  const response = await fetch(
    `${BASE_URL}/`,
    {
      method: "POST",
      headers: construirHeaders(),
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(
      await obtenerDetalleError(
        response,
        "No se pudo guardar el borrador del cierre."
      )
    );
  }

  return response.json();
}


export async function obtenerCierrePorProceso(
  idProceso
) {
  const response = await fetch(
    `${BASE_URL}/proceso/${idProceso}`,
    {
      method: "GET",
      headers: construirHeaders(),
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      await obtenerDetalleError(
        response,
        "No se pudo obtener el cierre."
      )
    );
  }

  return response.json();
}


export async function actualizarCierreProcesoDisciplinario(
  idCierre,
  data
) {
  const response = await fetch(
    `${BASE_URL}/${idCierre}`,
    {
      method: "PUT",
      headers: construirHeaders(),
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(
      await obtenerDetalleError(
        response,
        "No se pudo actualizar el borrador del cierre."
      )
    );
  }

  return response.json();
}


export async function finalizarCierreProcesoDisciplinario(
  idCierre
) {
  const response = await fetch(
    `${BASE_URL}/${idCierre}/finalizar`,
    {
      method: "POST",
      headers: construirHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      await obtenerDetalleError(
        response,
        "No se pudo finalizar el proceso disciplinario."
      )
    );
  }

  return response.json();
}