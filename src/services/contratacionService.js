import { getApiUrl } from '../configFiles/api';
import api from './apiClient';

function getToken() {
  return (
    localStorage.getItem("token")
  );
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

export async function obtenerDocumentosContratacion(id) {
    const token = getToken();
    const url = getApiUrl(`documentos-ingreso/aspirante/${id}/categoria/7`);
    const response = await api.get(url, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response;
}