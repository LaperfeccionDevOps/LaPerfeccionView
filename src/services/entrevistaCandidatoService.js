// src/services/entrevistaCandidatoService.js

import { getApiUrl } from '../configFiles/api';
import axios from 'axios';

/**
 * Base URL
 * - Prioriza VITE_API_BASE_URL
 * - Si no existe, usa VITE_API_URL
 * - Si no existe, queda vacío y getApiUrl / proxy resuelve según entorno
 */
const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  ''
).replace(/\/+$/, '');

/**
 * Backend prefix
 */
const BASE_PATH = '/entrevistas-candidato';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

function getToken() {
  return localStorage.getItem('token');
}

// Interceptor: agrega Authorization automáticamente.
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    '';

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

const is404 = (err) => err?.response?.status === 404;

/**
 * Evita que se mande [object Object] en la URL.
 */
function ensureId(id, name = 'id') {
  if (id === null || id === undefined || id === '') {
    throw new Error(`${name} es requerido`);
  }

  const tipo = typeof id;

  if (tipo === 'object') {
    throw new Error(
      `${name} NO puede ser objeto. Debe ser string/number. Te llegó: ${Object.prototype.toString.call(
        id
      )}`
    );
  }

  return encodeURIComponent(String(id));
}

/**
 * Construye params opcionales para trabajar por ciclo.
 */
function buildVinculacionParams(idVinculacionLaboral) {
  if (
    idVinculacionLaboral === null ||
    idVinculacionLaboral === undefined ||
    idVinculacionLaboral === ''
  ) {
    return undefined;
  }

  return {
    id_vinculacion_laboral: idVinculacionLaboral,
  };
}

const entrevistaCandidatoService = {
  async ping() {
    const { data } = await api.get(`${BASE_PATH}/ping`);
    return data;
  },

  /**
   * Prefill
   * GET /api/entrevistas-candidato/prefill/{id_registro_perso}
   */
  async prefill(idRegistroPersonal) {
    const id = ensureId(idRegistroPersonal, 'idRegistroPersonal');

    const { data } = await api.get(
      `${BASE_PATH}/prefill/${id}`
    );

    return data;
  },

  /**
   * Guardar
   * POST /api/entrevistas-candidato/guardar
   *
   * Si el payload contiene IdVinculacionLaboral,
   * el backend trabajará únicamente sobre ese ciclo.
   */
  async guardar(payload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error(
        'payload es requerido y debe ser un objeto'
      );
    }

    const { data } = await api.post(
      `${BASE_PATH}/guardar`,
      payload
    );

    return data;
  },

  /**
   * Listar por registro.
   *
   * Sin idVinculacionLaboral:
   * conserva el comportamiento legado.
   *
   * Con idVinculacionLaboral:
   * devuelve únicamente entrevistas de ese ciclo.
   */
  async listarPorRegistro(
    idRegistroPersonal,
    idVinculacionLaboral = null
  ) {
    const id = ensureId(
      idRegistroPersonal,
      'idRegistroPersonal'
    );

    const params = buildVinculacionParams(
      idVinculacionLaboral
    );

    const { data } = await api.get(
      `${BASE_PATH}/por-registro/${id}`,
      {
        params,
      }
    );

    return data;
  },

  /**
   * Listado separado por ciclos.
   *
   * GET /api/entrevistas-candidato/por-registro/{id}/ciclos
   */
  async listarPorCiclos(idRegistroPersonal) {
    const id = ensureId(
      idRegistroPersonal,
      'idRegistroPersonal'
    );

    const { data } = await api.get(
      `${BASE_PATH}/por-registro/${id}/ciclos`
    );

    return data;
  },

  /**
   * Actualizar última entrevista por registro.
   */
  async actualizarUltimaPorRegistro(
    idRegistroPersonal,
    payload,
    idVinculacionLaboral = null
  ) {
    const id = ensureId(
      idRegistroPersonal,
      'idRegistroPersonal'
    );

    const params = buildVinculacionParams(
      idVinculacionLaboral
    );

    const { data } = await api.put(
      `${BASE_PATH}/por-registro/${id}`,
      payload,
      {
        params,
      }
    );

    return data;
  },

  /**
   * Obtener última por registro.
   */
  async obtenerPorRegistroPersonal(
    idRegistroPersonal,
    idVinculacionLaboral = null
  ) {
    const id = ensureId(
      idRegistroPersonal,
      'idRegistroPersonal'
    );

    const params = buildVinculacionParams(
      idVinculacionLaboral
    );

    const { data } = await api.get(
      `${BASE_PATH}/${id}`,
      {
        params,
      }
    );

    return data;
  },

  /**
   * Upsert general.
   */
  async upsertEntrevista(
    idRegistroPersonal,
    payload,
    idVinculacionLaboral = null
  ) {
    const id = ensureId(
      idRegistroPersonal,
      'idRegistroPersonal'
    );

    const params = buildVinculacionParams(
      idVinculacionLaboral
    );

    const { data } = await api.put(
      `${BASE_PATH}/${id}`,
      payload,
      {
        params,
      }
    );

    return data;
  },

  /**
   * Actualizar decisión final.
   */
  async actualizarDecisionFinal(
    idRegistroPersonal,
    payload,
    idVinculacionLaboral = null
  ) {
    const id = ensureId(
      idRegistroPersonal,
      'idRegistroPersonal'
    );

    const params = buildVinculacionParams(
      idVinculacionLaboral
    );

    try {
      const { data } = await api.put(
        `${BASE_PATH}/${id}/decision-final`,
        payload,
        {
          params,
        }
      );

      return data;
    } catch (error1) {
      if (!is404(error1)) {
        throw error1;
      }

      try {
        const { data } = await api.put(
          `${BASE_PATH}/${id}/decision-final-entrevista`,
          payload,
          {
            params,
          }
        );

        return data;
      } catch (error2) {
        if (!is404(error2)) {
          throw error2;
        }

        const { data } = await api.put(
          `${BASE_PATH}/${id}`,
          payload,
          {
            params,
          }
        );

        return data;
      }
    }
  },

  /**
   * Obtener decisión final.
   */
  async obtenerDecisionFinal(
    idRegistroPersonal,
    idVinculacionLaboral = null
  ) {
    const id = ensureId(
      idRegistroPersonal,
      'idRegistroPersonal'
    );

    const params = buildVinculacionParams(
      idVinculacionLaboral
    );

    const { data } = await api.get(
      `${BASE_PATH}/${id}/decision-final`,
      {
        params,
      }
    );

    return data;
  },

  /**
   * Obtener por ID de entrevista.
   */
  async obtenerPorId(idEntrevista) {
    const id = ensureId(
      idEntrevista,
      'idEntrevista'
    );

    const { data } = await api.get(
      `${BASE_PATH}/id/${id}`
    );

    return data;
  },

  /**
   * Actualizar por ID de entrevista.
   */
  async actualizarPorId(idEntrevista, payload) {
    const id = ensureId(
      idEntrevista,
      'idEntrevista'
    );

    const { data } = await api.put(
      `${BASE_PATH}/id/${id}`,
      payload
    );

    return data;
  },

  /**
   * Exportar entrevista a PDF.
   */
  async exportarPdf(idRegistroPersonal) {
    const id = ensureId(
      idRegistroPersonal,
      'idRegistroPersonal'
    );

    const response = await api.get(
      `${BASE_PATH}/${id}/pdf`,
      {
        responseType: 'blob',
      }
    );

    return response.data;
  },

  /**
   * Listar entrevistas por aspirante.
   */
  async listarPorAspirante(idAspirante) {
    const id = ensureId(
      idAspirante,
      'idAspirante'
    );

    const { data } = await api.get(
      `${BASE_PATH}/aspirante/${id}`
    );

    return data;
  },

  /**
   * Compatibilidad con el método existente.
   *
   * El payload puede incluir IdVinculacionLaboral.
   */
  async RegistrarEntrevista(payload) {
    const token = getToken();

    const url = getApiUrl(
      '/entrevistas-candidato/guardar'
    );

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