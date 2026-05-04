// src/services/observacionesNucleoFamiliarService.js

const API_BASE = (
  import.meta?.env?.VITE_API_BASE_URL ||
  import.meta?.env?.VITE_API_URL ||
  ""
).replace(/\/+$/, "");

function buildHeaders(token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function handleResponse(res) {
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    const msg =
      (data && data.detail && (typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail))) ||
      (typeof data === "string" ? data : "Error en la petición");

    throw new Error(msg);
  }

  return data;
}

// GET: trae núcleo familiar por aspirante
export async function getObservacionesNFPorAspirante(idRegistroPersonal, token) {
  const res = await fetch(
    `${API_BASE}/nucleo-familiar/aspirante/${idRegistroPersonal}`,
    {
      method: "GET",
      headers: buildHeaders(token),
    }
  );

  return handleResponse(res);
}

// GET: trae 1 observación por IdNucleoFamiliar
// Nota: actualmente el backend no tiene endpoint individual para esta consulta.
// Se deja controlado para no romper imports existentes.
export async function getObservacionNFPorNucleo(idNucleoFamiliar, token) {
  const res = await fetch(
    `${API_BASE}/nucleo-familiar/${idNucleoFamiliar}`,
    {
      method: "GET",
      headers: buildHeaders(token),
    }
  );

  return handleResponse(res);
}

// PUT: guarda/actualiza observación por IdNucleoFamiliar
export async function upsertObservacionNF(
  idNucleoFamiliar,
  observaciones,
  usuarioActualizacion,
  token
) {
  const payload = {
    observaciones: (observaciones || "").trim(),
  };

  const res = await fetch(
    `${API_BASE}/nucleo-familiar/${idNucleoFamiliar}/observaciones`,
    {
      method: "PUT",
      headers: buildHeaders(token),
      body: JSON.stringify(payload),
    }
  );

  return handleResponse(res);
}