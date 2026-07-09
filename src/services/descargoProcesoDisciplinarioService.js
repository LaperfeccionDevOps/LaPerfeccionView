const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const BASE_URL = `${API_URL}/descargo-proceso-disciplinario`;

export async function crearDescargoProcesoDisciplinario(data) {
  const response = await fetch(`${BASE_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("No se pudo crear el descargo");
  }

  return response.json();
}

export async function obtenerDescargoPorProceso(idProceso) {
  const response = await fetch(`${BASE_URL}/proceso/${idProceso}`);

  if (!response.ok) {
    throw new Error("No se pudo obtener el descargo");
  }

  return response.json();
}

export async function actualizarDescargoProcesoDisciplinario(idDescargo, data) {
  const response = await fetch(`${BASE_URL}/${idDescargo}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("No se pudo actualizar el descargo");
  }

  return response.json();
}