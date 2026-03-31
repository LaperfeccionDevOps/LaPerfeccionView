import { getApiUrl } from '../configFiles/api';

function getToken() {
  return localStorage.getItem("token");
}

// ✅ POST: validar experiencia laboral
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

// ✅ POST: generar PDF consolidado de referencias laborales
export async function GenerarPdfConsolidadoReferencias(idRegistroPersonal) {
  const token = getToken();
  const url = getApiUrl(`/experiencia-laboral-validacion/generar-consolidado/${idRegistroPersonal}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return response;
}

// ✅ PUT: guardar observaciones
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

// ✅ DELETE: eliminar experiencia laboral
export async function EliminarExperienciaLaboral(idExperienciaLaboral) {
  const url = getApiUrl(`/experiencia-laboral/${idExperienciaLaboral}`);

  const response = await fetch(url, {
    method: 'DELETE',
  });

  return response;
}