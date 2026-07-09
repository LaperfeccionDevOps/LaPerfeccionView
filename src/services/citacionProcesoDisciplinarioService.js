const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const BASE_URL = `${API_URL}/citacion-proceso-disciplinario`;

export async function crearCitacionProcesoDisciplinario(data) {
  const response = await fetch(`${BASE_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("No se pudo crear la citación del proceso disciplinario");
  }

  return response.json();
}

export async function obtenerCitacionPorProceso(idProceso) {
  const response = await fetch(`${BASE_URL}/proceso/${idProceso}`);

  if (!response.ok) {
    throw new Error("No se pudo obtener la citación del proceso disciplinario");
  }

  return response.json();
}

export async function actualizarCitacionProcesoDisciplinario(idCitacion, data) {
  const response = await fetch(`${BASE_URL}/${idCitacion}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("No se pudo actualizar la citación del proceso disciplinario");
  }

  return response.json();
}