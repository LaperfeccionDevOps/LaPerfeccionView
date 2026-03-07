const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Devuelve la URL completa para un endpoint, sin hacer fetch
 * @param {string} endpoint - El endpoint de la API (ej: '/users')
 * @returns {string} - La URL completa
 */
export function getApiUrl(endpoint) {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${normalizedEndpoint}`;
}

export default API_BASE_URL;
