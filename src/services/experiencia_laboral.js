import { getApiUrl } from '../configFiles/api';

function getToken() {
  return localStorage.getItem("token");
}

// ✅ POST: validar experiencia laboral (ya lo tienes)
export async function ValidarExperienciaLaboral(payload) {
  const token = getToken();
  const url = getApiUrl('/experiencia-laboral-validacion/insertar');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  return response;
}

// ✅ PUT: guardar observaciones (ya lo tienes)
export async function ObservacionesExperienciaLaboral(payload, idExperienciaLaboral) {
  const token = getToken();
  const url = getApiUrl(`/observaciones-experiencia-laboral/${idExperienciaLaboral}`);

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

// ✅ GET: traer observaciones guardadas por IdExperienciaLaboral
// (Esto es lo que te falta para que al volver a entrar CARGUE)
export async function GetObservacionesExperienciaLaboral(idExperienciaLaboral) {
  const token = getToken();
  const url = getApiUrl(`/observaciones-experiencia-laboral/${idExperienciaLaboral}`);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return response;
}

export async function EliminarExperienciaLaboral(idExperienciaLaboral) {
  const url = getApiUrl(`/experiencia-laboral/${idExperienciaLaboral}`);

  const response = await fetch(url, {
    method: 'DELETE',
  });

  return response;
}