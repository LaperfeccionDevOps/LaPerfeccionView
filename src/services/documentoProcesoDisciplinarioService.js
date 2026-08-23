import { API_URL } from "@/configFiles/api";

const BASE_URL = `${API_URL}/documento-proceso-disciplinario`;

export async function crearDocumentoProcesoDisciplinario(data) {
  const response = await fetch(`${BASE_URL}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error("No se pudo crear el documento");

  return response.json();
}

export async function obtenerDocumentosPorProceso(idProceso) {
  const response = await fetch(`${BASE_URL}/proceso/${idProceso}`);

  if (!response.ok) throw new Error("No se pudieron obtener los documentos");

  return response.json();
}

export async function actualizarDocumentoProcesoDisciplinario(idDocumento, data) {
  const response = await fetch(`${BASE_URL}/${idDocumento}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error("No se pudo actualizar el documento");

  return response.json();
}