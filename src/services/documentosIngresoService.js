
const API_BASE = (
  import.meta?.env?.VITE_API_BASE_URL ||
  import.meta?.env?.VITE_API_URL ||
  ""
).replace(/\/+$/, "");

// Si tú guardas el token en localStorage, ajusta la key aquí:
const getToken = () => localStorage.getItem("access_token") || localStorage.getItem("token") || "";

const buildHeaders = () => {
  const token = getToken();
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
};

export async function listarDocumentosIngreso(idRegistroPersonal) {
  const url = `${API_BASE}/api/documentos-ingreso/aspirante/${idRegistroPersonal}`;
  const res = await fetch(url, { headers: buildHeaders() });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error listando documentos (${res.status}): ${text}`);
  }
  return res.json();
}

export async function obtenerDocumentoIngresoBase64(idRegistroPersonal, idTipoDocumentacion) {
  const url = `${API_BASE}/api/documentos-ingreso/aspirante/${idRegistroPersonal}/tipo/${idTipoDocumentacion}`;
  const res = await fetch(url, { headers: buildHeaders() });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error obteniendo documento (${res.status}): ${text}`);
  }
  return res.json(); // { DocumentoBase64, IdDocumento, ... }
}
