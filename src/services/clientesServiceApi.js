import { getApiUrl } from "../configFiles/api";

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

// GET /api/clientes
export async function listarClientes(token = "") {
  const url = getApiUrl("/clientes");
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

// POST /api/clientes
export async function crearCliente(payload, token = "") {
  const url = getApiUrl("/clientes");
  const res = await fetch(url, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify(payload),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const error = new Error(data?.detail || `HTTP ${res.status}`);
    error.status = res.status;
    error.detail = data?.detail || "";
    throw error;
  }

  return data;
}
