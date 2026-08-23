import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api";

export const obtenerAsistentesPorProceso = async (
  idProceso
) => {
  const { data } = await axios.get(
    `${API_URL}/asistente-descargo-proceso-disciplinario/proceso/${idProceso}`
  );

  return data;
};

export const guardarBorradorAsistentes = async (
  payload
) => {
  const { data } = await axios.post(
    `${API_URL}/asistente-descargo-proceso-disciplinario/guardar-borrador`,
    payload
  );

  return data;
};

export const actualizarAsistente = async (
  idAsistente,
  payload
) => {
  const { data } = await axios.put(
    `${API_URL}/asistente-descargo-proceso-disciplinario/${idAsistente}`,
    payload
  );

  return data;
};