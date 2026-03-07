import { getApiUrl } from '../configFiles/api';
import api from './apiClient';

function getToken() {
  return (
    localStorage.getItem("token")
  );
}

export async function getReporteSinergy(fechaInicio, fechaFin) {
  const token = getToken();
  // Construir query params si hay fechas
  let query = '';
  if (fechaInicio || fechaFin) {
    const params = [];
    if (fechaInicio) params.push(`fechaInicio=${encodeURIComponent(fechaInicio)}`);
    if (fechaFin) params.push(`fechaFin=${encodeURIComponent(fechaFin)}`);
    query = '?' + params.join('&');
  }
  const url = getApiUrl(`/contratacion/reporte_synergy${query}`);
  const response = await api.get(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response;
}
