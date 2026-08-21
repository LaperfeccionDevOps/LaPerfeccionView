import { getApiUrl } from '../configFiles/api';
import api from './apiClient';

function getToken() {
  return localStorage.getItem('token');
}

export async function getAspirante(id) {
  const token = getToken();
  const url = getApiUrl(`/aspirante_detalle/${id}`);

  const response = await api.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response;
}

export async function getAspirantePorCiclos(id) {
  const token = getToken();
  const url = getApiUrl(`/aspirante_detalle/${id}/ciclos`);

  const response = await api.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response;
}

export async function getDocumentacionIngreso(id) {
  const token = getToken();
  const url = getApiUrl(
    `documentos-ingreso/aspirante/${id}/categoria/6`
  );

  const response = await api.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response;
}

export async function getDocumentacionIngresoPorVinculacion(
  idRegistroPersonal,
  idVinculacionLaboral
) {
  const token = getToken();

  const url = getApiUrl(
    `documentos-ingreso/aspirante/${idRegistroPersonal}/vinculacion/${idVinculacionLaboral}/categoria/6`
  );

  const response = await api.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response;
}

export async function getDocumentosIngresoPorCiclos(idRegistroPersonal) {
  const token = getToken();

  const url = getApiUrl(
    `documentos-ingreso/aspirante/${idRegistroPersonal}/categoria/6/ciclos`
  );

  const response = await api.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response;
}

export async function getDocumentosSeguridad(id) {
  const token = getToken();
  const url = getApiUrl(
    `documentos-ingreso/aspirante/${id}/categoria/3`
  );

  const response = await api.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response;
}

export async function getListaCargo() {
  const token = getToken();
  const url = getApiUrl('/listado-cargo');

  const response = await api.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response;
}