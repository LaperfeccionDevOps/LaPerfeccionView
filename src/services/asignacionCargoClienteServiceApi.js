import { getApiUrl } from "../configFiles/api";

// ✅ Token consistente (en tu proyecto a veces existe como access_token o token)
function getToken() {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    ""
  );
}

function buildHeaders(tokenOverride = "") {
  const token = tokenOverride || getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * ✅ POST /api/asignacion-cargo-cliente
 * payload esperado:
 * { IdRegistroPersonal, IdCargo, IdCliente, Salario, UsuarioActualizacion }
 */
export async function upsertAsignacionCargoCliente(payload, token = "") {
  const url = getApiUrl("/asignacion-cargo-cliente");

  const response = await fetch(url, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify(payload),
  });

  // 🔎 Si quieres ver el error real en consola cuando no sea 200
  if (!response.ok) {
    const txt = await response.text();
    console.error("Error upsertAsignacionCargoCliente:", response.status, txt);
  }

  return response; // ✅ lo dejo igual que tú: retorna el response para que lo manejes donde lo llamas
}

/**
 * ✅ GET /api/asignacion-cargo-cliente/{idRegistroPersonal}
 */
export async function getAsignacionCargoCliente(idRegistroPersonal, token = "") {
  const url = getApiUrl(`/asignacion-cargo-cliente/${idRegistroPersonal}`);

  const res = await fetch(url, {
    method: "GET",
    headers: buildHeaders(token),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * ✅ (Opcional) GET /api/catalogos/cargos
 * Para llenar el Select de Cargo con IDs reales
 */
export async function listarCargos(token = "") {
  const url = getApiUrl("/catalogos/cargos");

  const res = await fetch(url, {
    method: "GET",
    headers: buildHeaders(token),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * ✅ (Opcional) GET /api/catalogos/clientes
 * Para llenar el Select de Cliente con IDs reales
 */
export async function listarClientes(token = "") {
  const url = getApiUrl("/catalogos/clientes");

  const res = await fetch(url, {
    method: "GET",
    headers: buildHeaders(token),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }
  return res.json();
}