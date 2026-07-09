const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const BASE_URL = `${API_URL}/cierre-proceso-disciplinario`;

export async function crearCierreProcesoDisciplinario(data) {
  const response = await fetch(`${BASE_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("No se pudo crear el cierre");
  }

  return response.json();
}

export async function obtenerCierrePorProceso(idProceso) {
  const response = await fetch(`${BASE_URL}/proceso/${idProceso}`);

  if (!response.ok) {
    throw new Error("No se pudo obtener el cierre");
  }

  return response.json();
}

export async function actualizarCierreProcesoDisciplinario(idCierre, data) {
  const response = await fetch(`${BASE_URL}/${idCierre}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("No se pudo actualizar el cierre");
  }

  return response.json();
}