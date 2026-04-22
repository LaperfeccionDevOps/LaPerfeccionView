// src/services/observacionesNucleoFamiliarService.js

  const API_BASE =
  (import.meta?.env?.VITE_API_URL || "https://apiqa.laperfeccion.app").replace(/\/$/, "");


function buildHeaders(token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function handleResponse(res) {
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const msg =
      (data && data.detail && (typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail))) ||
      (typeof data === "string" ? data : "Error en la petición");
    throw new Error(msg);
  }
  return data;
}

// ✅ GET: trae todas las observaciones por aspirante (para cargar al abrir modal)
export async function getObservacionesNFPorAspirante(idRegistroPersonal, token) {
  const res = await fetch(
    `${API_BASE}/api/observaciones-nucleo-familiar/aspirante/${idRegistroPersonal}`,
    { method: "GET", headers: buildHeaders(token) }
  );
  return handleResponse(res);
}

// ✅ GET: trae 1 observación por IdNucleoFamiliar
export async function getObservacionNFPorNucleo(idNucleoFamiliar, token) {
  const res = await fetch(
    `${API_BASE}/api/observaciones-nucleo-familiar/${idNucleoFamiliar}`,
    { method: "GET", headers: buildHeaders(token) }
  );
  return handleResponse(res);
}

// ✅ PUT: guarda/actualiza observación por IdNucleoFamiliar (ESTE ES EL QUE NECESITAS)
export async function upsertObservacionNF(idNucleoFamiliar, observaciones, usuarioActualizacion, token) {
  const payload = {
    // OJO: el backend lo pide así, en minúscula:
    observaciones: (observaciones || "").trim(),
    usuarioActualizacion: usuarioActualizacion || null,
  };

  const res = await fetch(
    `${API_BASE}/api/observaciones-nucleo-familiar/${idNucleoFamiliar}`,
    {
      method: "PUT",
      headers: buildHeaders(token),
      body: JSON.stringify(payload),
    }
  );

  return handleResponse(res);
}
