import { getApiUrl } from '../configFiles/api';
import api from './apiClient';

function getToken() {
  return localStorage.getItem('token');
}

export async function RegistrarDocumentosSeguridad(payload) {
  const token = getToken();
  const url = getApiUrl('/documentos-seguridad/upload');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return response;
}

export async function obtenerDocumentoSeguridadBase64(id) {
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

export async function obtenerDocumentoSeguridadBase64PorVinculacion(
  idRegistroPersonal,
  idVinculacionLaboral
) {
  const token = getToken();

  const url = getApiUrl(
    `documentos-ingreso/aspirante/${idRegistroPersonal}/vinculacion/${idVinculacionLaboral}/categoria/3`
  );

  const response = await api.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response;
}

export async function EliminarDocumentoSeguridadPorTipo(
  idRegistroPersonal,
  idTipoDocumentacion,
  idVinculacionLaboral = null
) {
  const token = getToken();

  let endpoint = `/documentos-seguridad/registro/${idRegistroPersonal}/tipo/${idTipoDocumentacion}`;

  if (idVinculacionLaboral !== null && idVinculacionLaboral !== undefined) {
    endpoint += `?id_vinculacion_laboral=${encodeURIComponent(
      idVinculacionLaboral
    )}`;
  }

  const url = getApiUrl(endpoint);

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return response;
}