import api from "./apiClient";
import { getApiUrl } from "./api";

const API_BASE = (
  import.meta?.env?.VITE_API_BASE_URL ||
  import.meta?.env?.VITE_API_URL ||
  ""
).replace(/\/+$/, "");

export const getMotivoCierre = (idRegistroPersonal) => {
  return api.get(`${API_BASE}/motivo-cierre/${idRegistroPersonal}`);
};

export const upsertMotivoCierre = (idRegistroPersonal, payload) => {
  return api.put(`${API_BASE}/motivo-cierre/${idRegistroPersonal}`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export async function MotivoCierreSeleccion(id_registro_personal) {
  const url = getApiUrl(`/motivo-cierre/${id_registro_personal}`);
  const response = await api.put(url);
  return response;
}