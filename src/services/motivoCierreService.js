import api from "./apiClient";

<<<<<<< HEAD
const API_BASE = import.meta?.env?.VITE_API_URL || "https://api.laperfeccion.app/api";
=======
const API_BASE = import.meta?.env?.VITE_API_URL || "https://apiqa.laperfeccion.app/api";
>>>>>>> juan_arreglos_rrll


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
