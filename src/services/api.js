const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000")
  .replace(/\/+$/, ""); // quitar / al final si existe

export function getApiUrl(endpoint) {
  if (typeof endpoint !== "string") {
    throw new Error(`getApiUrl() esperaba string y recibió: ${Object.prototype.toString.call(endpoint)}`);
  }
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${normalizedEndpoint}`;
}

export default API_BASE_URL;
