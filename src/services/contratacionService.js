import { getApiUrl } from '../configFiles/api';
import api from './apiClient';


function getToken() {
  return localStorage.getItem('token');
}


export async function RegistrarDocumentosContratacion(payload) {
  const token = getToken();
  const url = getApiUrl('/documentos-contratacion/upload');

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


/**
 * Consulta documentos de contratación por trabajador.
 *
 * Se conserva para compatibilidad con flujos anteriores
 * que todavía consultan solamente por IdRegistroPersonal.
 */
export async function obtenerDocumentosContratacion(id) {
  const token = getToken();

  const url = getApiUrl(
    `/documentos-ingreso/aspirante/${id}/categoria/7`
  );

  const response = await api.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response;
}


/**
 * Consulta exclusivamente los documentos de contratación
 * asociados a una vinculación laboral.
 */
export async function obtenerDocumentosContratacionPorVinculacion(
  idRegistroPersonal,
  idVinculacionLaboral
) {
  const token = getToken();

  const url = getApiUrl(
    `/documentos-ingreso/aspirante/${idRegistroPersonal}/vinculacion/${idVinculacionLaboral}/categoria/7`
  );

  const response = await api.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response;
}


/**
 * Consulta la estructura documental de contratación separada
 * por ciclos laborales.
 *
 * Se usa en Carpeta Digital para resolver correctamente:
 * - ciclo actual;
 * - ciclos históricos;
 * - documentos legacy sin IdVinculacionLaboral.
 */
export async function obtenerDocumentosContratacionPorCiclos(
  idRegistroPersonal
) {
  const token = getToken();

  const url = getApiUrl(
    `/documentos-ingreso/aspirante/${idRegistroPersonal}/categoria/7/ciclos`
  );

  const response = await api.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response;
}


/**
 * Elimina un documento de contratación específico por IdDocumento.
 *
 * Se utiliza especialmente para documentos múltiples:
 * 36 = Entrega de dotación
 * 64 = Otro sí
 */
export async function eliminarDocumentoContratacion(idDocumento) {
  const token = getToken();

  const url = getApiUrl(
    `/documentos-contratacion/documento/${idDocumento}`
  );

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response;
}
