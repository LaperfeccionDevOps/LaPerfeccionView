// src/hooks/useAspirantes.js
import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// ✅ Endpoint real según Swagger: GET http://localhost:8000/api/aspirantes
const ASPIRANTES_ENDPOINT = `${API_BASE_URL}/aspirantes`;
const NUCLEO_FAMILIAR_ENDPOINT = `${API_BASE_URL}/nucleo-familiar`;

const USE_SAMPLE_FALLBACK =
  String(import.meta.env.VITE_USE_SAMPLE_FALLBACK || 'false').toLowerCase() === 'true';

const mapApiAspiranteToFront = (item) => {
  const idRegistroPersonalRaw =
    item?.IdRegistroPersonal ??
    item?.id_registro_personal ??
    item?.idRegistroPersonal ??
    item?.id ??
    item?.ID ??
    null;

  const idRegistroPersonal =
    typeof idRegistroPersonalRaw === 'number'
      ? idRegistroPersonalRaw
      : (idRegistroPersonalRaw != null &&
          String(idRegistroPersonalRaw).trim() !== '' &&
          !isNaN(Number(idRegistroPersonalRaw)))
      ? Number(idRegistroPersonalRaw)
      : null;

  return {
    id: idRegistroPersonal,
    idRegistroPersonal: idRegistroPersonal,
    nombres: item.Nombres ?? item.nombres ?? '',
    apellidos: item.Apellidos ?? item.apellidos ?? '',
    cedula: item.NumeroIdentificacion ?? item.cedula ?? '',
    telefono: item.Telefono ?? item.telefono ?? '',
    celular: item.Celular ?? item.celular ?? '',
    correo: item.Correo ?? item.correo ?? item.Email ?? '',
    direccion: item.Direccion ?? item.direccion ?? '',
    lugarExpedicion: item.LugarExpedicion ?? item.lugarExpedicion ?? '',
    barrio: item.Barrio ?? item.barrio ?? '',
    direccion: item.Direccion ?? item.direccion ?? '',
    fechaNacimiento: item.FechaNacimiento ?? item.fechaNacimiento ?? null,
    fechaIngreso: item.FechaIngreso ?? item.fechaIngreso ?? null,
    cargo: item.Cargo ?? item.CargoPostulado ?? item.IdCargo ?? item.cargo ?? '',
    cliente: item.NombreCliente ?? item.NombreCliente ?? '',
    fechaExpedicion: item.FechaExpedicion ?? item.fechaExpedicion ?? null,
    fechaNacimiento: item.FechaNacimiento ?? item.fechaNacimiento ?? null,

    estado:
      item.EstadoProcesoNombre ??
      item.EstadoProceso ??
      item.estado ??
      (item.IdEstadoProceso !== undefined && item.IdEstadoProceso !== null
        ? String(item.IdEstadoProceso)
        : 'Nuevo'),

    fechaRegistro: item.FechaCreacion ?? item.fechaRegistro ?? null,

    rh: item.RH ?? item.rh ?? item.GrupoSanguineo ?? '',
    tallaCamisa: item.TallaCamisa ?? item.tallaCamisa ?? '',
    tallaPantalon: item.TallaPantalon ?? item.tallaPantalon ?? '',
    tallaZapato: item.TallaZapato ?? item.tallaZapato ?? '',

    documentos: item.documentos ?? {},
    nucleoFamiliar: item.nucleoFamiliar ?? item.NucleoFamiliar ?? [],
    referencias: item.referencias ?? item.Referencias ?? [],
    referenciasLaborales: item.referenciasLaborales ?? item.ReferenciasLaborales ?? [],
    experienciaLaboral: item.experienciaLaboral ?? item.ExperienciaLaboral ?? [],
    entrevistas: item.entrevistas ?? item.Entrevistas ?? [],
    historialEstados: item.historialEstados ?? item.HistorialEstados ?? [],
    datos_adicionales: item.datos_adicionales ?? item.datos_adicionales ?? [],
    nombreCargo: item.NombreCargo ?? ''
  };
};

// ✅ MAPA: nombre de estado (texto) -> IdEstadoProceso (entero en BD)
// (según tu tabla EstadoProceso)
const ESTADO_PROCESO_ID = {
  NUEVO: 18,
  ENTREVISTA: 19,
  'ENTREVISTA JEFE INMEDIATO': 20,
  EXAMENES: 21,
  SEGURIDAD: 22,
  'AVANZA A CONTRATACION': 24,
  CONTRATADO: 25,
  REFERENCIACION: 26,
  'DESISTE DEL PROCESO': 27,
  RECHAZADO: 28,
};

// Normaliza: quita tildes, mayúsculas, espacios dobles
const normalizeEstadoKey = (value) => {
  if (value == null) return '';
  return String(value)
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
};

// Convierte estado (texto o número) -> ID entero requerido por backend
const estadoProcesoToId = (estado) => {
  if (estado == null) return null;

  if (typeof estado === 'number' && Number.isFinite(estado)) return estado;

  const raw = String(estado).trim();

  if (/^\d+$/.test(raw)) return Number(raw);

  const key = normalizeEstadoKey(raw);
  return ESTADO_PROCESO_ID[key] ?? null;
};

// 🔑 Devuelve el access token "puro" o `null` si no existe.
const getAccessToken = () => {
  const keys = ['token'];

  for (const key of keys) {
    let raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        raw = parsed.access_token || parsed.token || parsed.accessToken || raw;
      }
    } catch (_) {
      // No es JSON, sigue con el valor crudo
    }

    let token = String(raw).trim();
    if (token.toLowerCase().startsWith('bearer ')) token = token.slice(7).trim();
    token = token.replace(/^['"]+|['"]+$/g, '');

    if (token) return token;
  }
  return null;
};

/**
 * Hook principal
 */
export const useAspirantes = () => {
  const [aspirantes, setAspirantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🧠 Cargar listado desde la API /api/aspirantes (con filtros opcionales)
  const loadAspirantes = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (filters.fechaDesde) params.append('fecha_desde', filters.fechaDesde);
      if (filters.fechaHasta) params.append('fecha_hasta', filters.fechaHasta);

      if (filters.idEstado !== undefined && filters.idEstado !== null && String(filters.idEstado).trim() !== '') {
        params.append('id_estado', String(filters.idEstado));
      }

      if (filters.search && String(filters.search).trim()) {
        params.append('search', String(filters.search).trim());
      }

      const token = getAccessToken() || localStorage.getItem('token');

      const url = `${ASPIRANTES_ENDPOINT}${params.toString() ? `?${params.toString()}` : ''}`;

      const headers = {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const resp = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        console.error('[useAspirantes] Respuesta no OK:', resp.status, text);
        throw new Error(`Error al cargar aspirantes (${resp.status})`);
      }

      const data = await resp.json();
      const mapped = Array.isArray(data) ? data.map(mapApiAspiranteToFront) : [];
      setAspirantes(mapped);
    } catch (err) {
      console.error('[useAspirantes] Error cargando aspirantes desde API:', err);
      setError(err.message || 'Error cargando aspirantes');

      if (USE_SAMPLE_FALLBACK) {
        console.warn('[useAspirantes] Fallback activado: usando sampleData (solo UI)');
        setAspirantes(sampleData.map(mapApiAspiranteToFront));
      } else {
        setAspirantes([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAspirantes();
  }, [loadAspirantes]);

  const saveAspirantesInState = (newAspirantes) => {
    setAspirantes(newAspirantes);
  };

  // ✅ NUEVO: actualizar observaciones de un familiar (PATCH)
  const updateObservacionesNucleoFamiliar = async (idNucleoFamiliar, observaciones) => {
    if (!idNucleoFamiliar) throw new Error('Falta idNucleoFamiliar para actualizar observaciones');

    const token = getAccessToken() || localStorage.getItem('token');
    const url = `${NUCLEO_FAMILIAR_ENDPOINT}/${idNucleoFamiliar}/observaciones`;

    const resp = await fetch(url, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ observaciones: observaciones ?? '' }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      console.error('[useAspirantes] Error PATCH observaciones núcleo familiar:', resp.status, text);
      throw new Error(`Error actualizando observaciones (${resp.status})`);
    }

    const updated = await resp.json().catch(() => null);

    setAspirantes((prev) =>
      prev.map((a) => ({
        ...a,
        nucleoFamiliar: Array.isArray(a.nucleoFamiliar)
          ? a.nucleoFamiliar.map((nf) => {
              const id = nf?.IdNucleoFamiliar ?? nf?.idNucleoFamiliar ?? nf?.id;
              if (String(id) === String(idNucleoFamiliar)) {
                return { ...nf, Observaciones: observaciones ?? '', observaciones: observaciones ?? '' };
              }
              return nf;
            })
          : a.nucleoFamiliar,
      })),
    );

    return updated;
  };

  // ✏️ Actualizar un aspirante (optimista + intento de sync con API)
  const updateAspirante = async (updatedAspirante) => {
    const newAspirantes = aspirantes.map((a) =>
      a.id === updatedAspirante.id ? { ...a, ...updatedAspirante } : a
    );
    saveAspirantesInState(newAspirantes);

    try {
      if (!updatedAspirante.id || updatedAspirante.estado === undefined || updatedAspirante.estado === null) {
        console.warn('[useAspirantes] updateAspirante sin id o estado, no se llama a la API', updatedAspirante);
        return;
      }

      const estadoId = estadoProcesoToId(updatedAspirante.estado);
      if (!estadoId) {
        console.warn(
          '[useAspirantes] No se pudo convertir estado a ID. Estado recibido:',
          updatedAspirante.estado,
        );
        return;
      }

      const token = getAccessToken();

      const params = new URLSearchParams({
        nuevo_estado: String(estadoId),
        motivo: updatedAspirante.motivoCambio || updatedAspirante.motivo || 'Cambio de estado desde frontend',
        observaciones: updatedAspirante.observacionesCambio || updatedAspirante.observaciones || '',
        usuario: updatedAspirante.usuarioCambio || 'frontend',
      });

      const url = `${ASPIRANTES_ENDPOINT}/${updatedAspirante.id}/estado/cambiar?${params.toString()}`;

      const headers = {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const resp = await fetch(url, {
        method: 'POST',
        headers,
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        console.error('[useAspirantes] Error en cambio de estado:', resp.status, text);
      }
    } catch (err) {
      console.error('[useAspirantes] Error sincronizando cambio de estado con API:', err);
    }
  };

  // ➕ Crear aspirante (por ahora solo en front)
  const addAspirante = async (newAspirante) => {
    const localId = -Date.now();

    const aspiranteConId =
      newAspirante.id != null
        ? newAspirante
        : { ...newAspirante, id: localId, idRegistroPersonal: null, isLocal: true };

    const newAspirantes = [...aspirantes, aspiranteConId];
    saveAspirantesInState(newAspirantes);
  };

  return {
    aspirantes,
    loading,
    error,
    loadAspirantes,
    updateAspirante,
    addAspirante,
    updateObservacionesNucleoFamiliar,
    token: getAccessToken(),
  };
};