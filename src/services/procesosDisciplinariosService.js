const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const BASE_URL = `${API_URL}/procesos-disciplinarios`;

export async function crearProcesoDisciplinario(data) {
  const response = await fetch(`${BASE_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("No se pudo crear el proceso disciplinario");
  }

  return response.json();
}

export async function obtenerProcesoDisciplinario(idProceso) {
  const response = await fetch(`${BASE_URL}/${idProceso}`);

  if (!response.ok) {
    throw new Error("No se pudo obtener el proceso disciplinario");
  }

  return response.json();
}

export async function listarProcesosPorTrabajador(idRegistroPersonal) {
  const response = await fetch(`${BASE_URL}/trabajador/${idRegistroPersonal}`);

  if (!response.ok) {
    throw new Error("No se pudieron listar los procesos del trabajador");
  }

  return response.json();
}

export async function obtenerHistorialDisciplinarioTrabajador(idRegistroPersonal) {
  const response = await fetch(
    `${BASE_URL}/trabajador/${idRegistroPersonal}/historial`
  );

  if (!response.ok) {
    throw new Error("No se pudo obtener el historial disciplinario del trabajador");
  }

  return response.json();
}

export async function obtenerExpedienteDisciplinario(idProceso) {
  const response = await fetch(`${BASE_URL}/${idProceso}/expediente`);

  if (!response.ok) {
    throw new Error("No se pudo obtener el expediente disciplinario");
  }

  return response.json();
}

export async function actualizarProcesoDisciplinario(idProceso, data) {
  const response = await fetch(`${BASE_URL}/${idProceso}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("No se pudo actualizar el proceso disciplinario");
  }

  return response.json();
}