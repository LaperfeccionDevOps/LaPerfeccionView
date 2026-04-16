const RAW_BASE =
  import.meta.env.VITE_API_BASE_URL || 'https://apiqa.laperfeccion.app';

// ✅ Normaliza: quita "/" final y quita "/api" si ya viene incluido
const API_BASE_URL = RAW_BASE
  .trim()
  .replace(/\/+$/, '')        // quita slash(es) al final
  .replace(/\/api$/i, '');    // si termina en /api, lo quita

const getAccessToken = () =>
  localStorage.getItem('access_token') ||
  localStorage.getItem('accessToken') ||
  localStorage.getItem('token') ||
  '';

export const MarcarContratadoProceso = async (payload) => {
  const token = getAccessToken();

  const res = await fetch(`${API_BASE_URL}/api/contratado`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { status: res.status, data };
};