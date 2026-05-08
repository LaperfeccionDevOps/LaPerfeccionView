import api from "./apiClient";
import { getApiUrl } from "./api";

export const getMotivoCierre = (idRegistroPersonal) => {
  const url = getApiUrl(`/motivo-cierre/${idRegistroPersonal}`);
  return api.get(url);
};

export const upsertMotivoCierre = (idRegistroPersonal, payload) => {
  const url = getApiUrl(`/motivo-cierre/${idRegistroPersonal}`);

  return api.put(url, payload, {
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