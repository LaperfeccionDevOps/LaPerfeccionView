const API_URL = import.meta.env.VITE_API_URL || "https://apiqa.laperfeccion.app";

// ajusta la key si tu token se guarda con otro nombre
function getToken() {
  return localStorage.getItem("access_token") || localStorage.getItem("token") || "";
}

/**
 * Normaliza/valida el IdRegistroPersonal.
 * Evita que por error se mande un timestamp (ej: 1715432100000) u otros valores raros.
 */
function normalizeIdRegistroPersonal(idRegistroPersonal) {
  // Si por error llega un objeto aspirante, intentamos sacar el id correcto
  if (idRegistroPersonal && typeof idRegistroPersonal === "object") {
    idRegistroPersonal =
      idRegistroPersonal.IdRegistroPersonal ??
      idRegistroPersonal.id_registro_personal ??
      idRegistroPersonal.idRegistroPersonal ??
      idRegistroPersonal.id ??
      idRegistroPersonal.Id;
  }

  if (idRegistroPersonal === null || idRegistroPersonal === undefined || idRegistroPersonal === "") {
    throw new Error("IdRegistroPersonal inválido: viene vacío/null. Debes enviar el IdRegistroPersonal real del aspirante.");
  }

  // Si viene como string numérico, lo convertimos
  if (typeof idRegistroPersonal === "string") {
    const trimmed = idRegistroPersonal.trim();
    if (/^\d+$/.test(trimmed)) idRegistroPersonal = Number(trimmed);
  }

  // Validación final
  if (typeof idRegistroPersonal !== "number" || !Number.isFinite(idRegistroPersonal)) {
    throw new Error(
      `IdRegistroPersonal inválido: (${String(idRegistroPersonal)}). Debes enviar un número (IdRegistroPersonal).`
    );
  }

  // Detectar timestamps típicos (13 dígitos en ms) u otros números enormes
  // Esto fue lo que te salió: 1715432100000
  if (idRegistroPersonal >= 1000000000000) {
    throw new Error(
      `IdRegistroPersonal parece un timestamp (${idRegistroPersonal}). ` +
        `Estás enviando Date.now() en vez del IdRegistroPersonal real del aspirante.`
    );
  }

  // Evitar negativos o cero
  if (idRegistroPersonal <= 0) {
    throw new Error(`IdRegistroPersonal inválido (${idRegistroPersonal}). Debe ser mayor a 0.`);
  }

  return idRegistroPersonal;
}

async function apiFetch(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }

  // Si el backend alguna vez responde vacío, evitamos crash
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export function getDatosProcesoAspirante(idRegistroPersonal) {
  const id = normalizeIdRegistroPersonal(idRegistroPersonal);
  return apiFetch(`/api/datos-proceso-aspirante/${id}`, { method: "GET" });
}

export function putDatosProcesoAspirante(idRegistroPersonal, payload) {
  const id = normalizeIdRegistroPersonal(idRegistroPersonal);
  return apiFetch(`/api/datos-proceso-aspirante/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// Si en tu combo el endpoint es distinto, cámbialo aquí:
export async function getTiposCargo() {
  return apiFetch(`/api/tipo-cargo`, { method: "GET" });
}
