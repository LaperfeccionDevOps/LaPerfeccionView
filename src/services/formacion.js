import { getApiUrl } from '../configFiles/api';

function getToken() {
  return localStorage.getItem("token");
}

export async function ActualizarFormacionEducacion(id,payload) {
  const token = getToken();
  const url = getApiUrl(`/candidatos/${id}/formacion-educacion`);

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  return response;
}
