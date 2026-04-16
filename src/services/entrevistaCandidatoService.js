// src/services/entrevistaCandidatoService.js
import { getApiUrl } from '../configFiles/api';
import axios from "axios";

/**
 * ✅ Base URL
 * - Prioriza VITE_API_BASE_URL (según tu otro helper)
 * - Si no existe, usa VITE_API_URL
 * - Si no existe, https://apiqa.laperfeccion.app
 */
const API_BASE =
  (import.meta?.env?.VITE_API_BASE_URL ||
    import.meta?.env?.VITE_API_URL ||
    "https://apiqa.laperfeccion.app"
  ).replace(/\/+$/, ""); // quita / al final

/**
 * ✅ Backend prefix
 */
const BASE_PATH = "/api/entrevistas-candidato";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});
function getToken() {
  return (
    localStorage.getItem("token")
  );
}

// ✅ Interceptor: mete Authorization automáticamente
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    "";

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const is404 = (err) => err?.response?.status === 404;

/**
 * ✅ Evita que se mande [object Object] en la URL
 * Si te llega un objeto, aquí lo detectas de una con error claro
 */
function ensureId(id, name = "id") {
  if (id === null || id === undefined || id === "") {
    throw new Error(`${name} es requerido`);
  }
  const t = typeof id;
  if (t === "object") {
    // Esto es EXACTAMENTE lo que te genera [object Object]
    throw new Error(
      `${name} NO puede ser objeto. Debe ser string/number. Te llegó: ${Object.prototype.toString.call(
        id
      )}`
    );
  }
  return encodeURIComponent(String(id));
}

const entrevistaCandidatoService = {
  // ✅ Ping (si lo tienes en swagger)
  async ping() {
    const { data } = await api.get(`${BASE_PATH}/ping`);
    return data;
  },

  /**
   * ✅ Prefill
   * GET /api/entrevistas-candidato/prefill/{id_registro_perso}
   */
  async prefill(idRegistroPersonal) {
    const id = ensureId(idRegistroPersonal, "idRegistroPersonal");
    const { data } = await api.get(`${BASE_PATH}/prefill/${id}`);
    return data;
  },

  /**
   * ✅ Guardar (según swagger)
   * POST /api/entrevistas-candidato/guardar
   */
  async guardar(payload) {
    if (!payload || typeof payload !== "object") {
      throw new Error("payload es requerido y debe ser un objeto");
    }
    const { data } = await api.post(`${BASE_PATH}/guardar`, payload);
    return data;
  },

  /**
   * ✅ Listar por registro (según swagger)
   * GET /api/entrevistas-candidato/por-registro/{id_registro_perso}
   */
  async listarPorRegistro(idRegistroPersonal) {
    const id = ensureId(idRegistroPersonal, "idRegistroPersonal");
    const { data } = await api.get(`${BASE_PATH}/por-registro/${id}`);
    return data;
  },

  /**
   * ✅ Actualizar última por registro (según swagger)
   * PUT /api/entrevistas-candidato/por-registro/{id_registro_perso}
   */
  async actualizarUltimaPorRegistro(idRegistroPersonal, payload) {
    const id = ensureId(idRegistroPersonal, "idRegistroPersonal");
    const { data } = await api.put(`${BASE_PATH}/por-registro/${id}`, payload);
    return data;
  },

  /**
   * ✅ Obtener última por registro (alias según swagger)
   * GET /api/entrevistas-candidato/{id_registro_perso}
   */
  async obtenerPorRegistroPersonal(idRegistroPersonal) {
    const id = ensureId(idRegistroPersonal, "idRegistroPersonal");
    const { data } = await api.get(`${BASE_PATH}/${id}`);
    return data;
  },

  /**
   * ✅ Upsert general (alias según swagger)
   * PUT /api/entrevistas-candidato/{id_registro_perso}
   */
  async upsertEntrevista(idRegistroPersonal, payload) {
    const id = ensureId(idRegistroPersonal, "idRegistroPersonal");
    const { data } = await api.put(`${BASE_PATH}/${id}`, payload);
    return data;
  },

  /**
   * ✅ Decisión final (según swagger)
   * PUT /api/entrevistas-candidato/{id}/decision-final
   * (y deja fallback por si en tu backend existen variaciones)
   */
  async actualizarDecisionFinal(idRegistroPersonal, payload) {
    const id = ensureId(idRegistroPersonal, "idRegistroPersonal");

    // 1) Ruta principal (swagger)
    try {
      const { data } = await api.put(`${BASE_PATH}/${id}/decision-final`, payload);
      return data;
    } catch (error1) {
      if (!is404(error1)) throw error1;

      // 2) Variante alternativa (por si existe en tu backend)
      try {
        const { data } = await api.put(
          `${BASE_PATH}/${id}/decision-final-entrevista`,
          payload
        );
        return data;
      } catch (error2) {
        if (!is404(error2)) throw error2;

        // 3) Último fallback: update general
        const { data } = await api.put(`${BASE_PATH}/${id}`, payload);
        return data;
      }
    }
  },

  /**
   * ✅ Obtener decisión final (si la usas)
   * GET /api/entrevistas-candidato/{id}/decision-final
   */
  async obtenerDecisionFinal(idRegistroPersonal) {
    const id = ensureId(idRegistroPersonal, "idRegistroPersonal");
    const { data } = await api.get(`${BASE_PATH}/${id}/decision-final`);
    return data;
  },

  /**
   * ✅ Obtener por ID de entrevista (según swagger)
   * GET /api/entrevistas-candidato/id/{id_entrevista}
   */
  async obtenerPorId(idEntrevista) {
    const id = ensureId(idEntrevista, "idEntrevista");
    const { data } = await api.get(`${BASE_PATH}/id/${id}`);
    return data;
  },

  /**
   * ✅ Actualizar por ID de entrevista (según swagger)
   * PUT /api/entrevistas-candidato/id/{id_entrevista}
   */
  async actualizarPorId(idEntrevista, payload) {
    const id = ensureId(idEntrevista, "idEntrevista");
    const { data } = await api.put(`${BASE_PATH}/id/${id}`, payload);
    return data;
  },

  /**
   * 📄 Exportar entrevista a PDF (si tu backend lo tiene)
   * GET /api/entrevistas-candidato/{idRegistroPersonal}/pdf
   */
  async exportarPdf(idRegistroPersonal) {
    const id = ensureId(idRegistroPersonal, "idRegistroPersonal");
    const response = await api.get(`${BASE_PATH}/${id}/pdf`, {
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * (Opcional) Listar entrevistas por aspirante (si tu backend lo tiene)
   * GET /api/entrevistas-candidato/aspirante/{idAspirante}
   */
  async listarPorAspirante(idAspirante) {
    const id = ensureId(idAspirante, "idAspirante");
    const { data } = await api.get(`${BASE_PATH}/aspirante/${id}`);
    return data;
  },

  /**
   * ❗️Tu método "RegistrarEntrevista" estaba duplicado y no registra nada.
   * Lo dejo por compatibilidad, pero hace lo mismo que listarPorAspirante.
   */
  async RegistrarEntrevista(payload) {
      const token = getToken();
      const url = getApiUrl('/entrevistas-candidato/guardar');
      const resp = await fetch(url, {
        method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      return resp;
  },
};

export default entrevistaCandidatoService;
