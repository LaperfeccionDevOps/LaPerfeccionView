import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Users, Filter, RotateCcw, CalendarDays,
  ListChecks, AlertTriangle
} from 'lucide-react';
import {
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const getEstadoColor = (estado = '') => {
  const e = estado.toUpperCase();
  if (e.includes('RECHAZADO') || e.includes('DESISTE')) return '#dc2626';
  if (e.includes('CONTRATADO')) return '#059669';
  if (e.includes('PENDIENTE')) return '#f59e0b';
  if (e.includes('AVANZA')) return '#2563eb';
  if (e.includes('SEGURIDAD')) return '#7c3aed';
  if (e.includes('EXÁMENES')) return '#ea580c';
  if (e.includes('ENTREVISTA')) return '#0ea5e9';
  if (e.includes('REFERENCIACIÓN')) return '#14b8a6';
  if (e.includes('NUEVO')) return '#64748b';
  return '#94a3b8';
};

const meses = [
  { value: '', label: 'Todos los meses' },
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

const anioActual = new Date().getFullYear();
const anios = [
  { value: '', label: 'Todos los años' },
  ...Array.from({ length: 6 }, (_, index) => {
    const year = anioActual - index;
    return { value: String(year), label: String(year) };
  }),
];

const motivoColors = ['#dc2626', '#f59e0b', '#7c3aed', '#0ea5e9', '#059669', '#2563eb'];

const formatearPorcentaje = (value) => {
  const numero = Number(value);
  if (Number.isNaN(numero)) return 0;
  return Math.round(numero);
};

const GESTION_MENSUAL_MODULO = 'SELECCION';
const GESTION_MENSUAL_INDICADOR = 'KPI_SELECCION';

const obtenerNombreUsuario = () => {
  try {
    const raw = localStorage.getItem('user') || localStorage.getItem('usuario');
    if (raw) {
      const parsed = JSON.parse(raw);
      return (
        parsed?.username ||
        parsed?.usuario ||
        parsed?.nombreUsuario ||
        parsed?.email ||
        ''
      );
    }
  } catch (error) {
    console.warn('No fue posible leer el usuario desde localStorage:', error);
  }

  return (
    localStorage.getItem('username') ||
    localStorage.getItem('usuarioNombre') ||
    ''
  );
};

const obtenerRolUsuario = () => {
  try {
    const raw = localStorage.getItem('user') || localStorage.getItem('usuario');
    if (raw) {
      const parsed = JSON.parse(raw);
      return (
        parsed?.rol ||
        parsed?.role ||
        parsed?.nombreRol ||
        parsed?.Rol ||
        ''
      );
    }
  } catch (error) {
    console.warn('No fue posible leer el rol desde localStorage:', error);
  }

  return (
    localStorage.getItem('rol') ||
    localStorage.getItem('role') ||
    ''
  );
};

const formatearFechaColombia = (value) => {
  if (!value) return '';

  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) return '';

  return fecha.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};


const IndicadoresSeleccionView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [dataRotacion, setDataRotacion] = useState(null);
  const [loadingRotacion, setLoadingRotacion] = useState(true);
  const [errorRotacion, setErrorRotacion] = useState('');

  const [anioSeleccionado, setAnioSeleccionado] = useState('');
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [filtrosAplicados, setFiltrosAplicados] = useState({ anio: '', mes: '' });

  const [gestionMensual, setGestionMensual] = useState(null);
  const [analisisMes, setAnalisisMes] = useState('');
  const [planAccion, setPlanAccion] = useState('');
  const [calificacionMensual, setCalificacionMensual] = useState('');
  const [cargandoGestion, setCargandoGestion] = useState(false);
  const [guardandoGestion, setGuardandoGestion] = useState(false);
  const [guardandoCalificacion, setGuardandoCalificacion] = useState(false);
  const [errorGestion, setErrorGestion] = useState('');
  const [mensajeGestion, setMensajeGestion] = useState('');

  const periodoMensualSeleccionado = useMemo(() => {
    const anio = Number(filtrosAplicados.anio);
    const mes = Number(filtrosAplicados.mes);

    if (!anio || !mes) return null;

    return { anio, mes };
  }, [filtrosAplicados]);


  const cargarIndicadores = async (filtros = filtrosAplicados) => {
    const params = new URLSearchParams();
    if (filtros.anio) params.append('anio', filtros.anio);
    if (filtros.mes) params.append('mes', filtros.mes);

    const queryString = params.toString();

    const urlSeleccion =
      `${import.meta.env.VITE_API_BASE_URL}/datos-seleccion/dashboard-indicadores${queryString ? `?${queryString}` : ''}`;

    const urlRotacion =
      `${import.meta.env.VITE_API_BASE_URL}/datos-seleccion/dashboard-indicadores-rotacion-nuevo-personal${queryString ? `?${queryString}` : ''}`;

    setLoading(true);
    setLoadingRotacion(true);
    setErrorRotacion('');

    try {
      const [resultadoSeleccion, resultadoRotacion] = await Promise.allSettled([
        fetch(urlSeleccion),
        fetch(urlRotacion),
      ]);

      if (resultadoSeleccion.status !== 'fulfilled') {
        throw new Error('No fue posible consultar los indicadores principales de Selección.');
      }

      const responseSeleccion = resultadoSeleccion.value;

      if (!responseSeleccion.ok) {
        throw new Error(`Error HTTP ${responseSeleccion.status}`);
      }

      const resultSeleccion = await responseSeleccion.json();
      setData(resultSeleccion);

      if (resultadoRotacion.status === 'fulfilled') {
        const responseRotacion = resultadoRotacion.value;

        if (responseRotacion.ok) {
          const resultRotacion = await responseRotacion.json();
          setDataRotacion(resultRotacion);
        } else {
          setDataRotacion(null);
          setErrorRotacion(
            `No fue posible cargar el KPI 2 de rotación. Error HTTP ${responseRotacion.status}.`,
          );
        }
      } else {
        setDataRotacion(null);
        setErrorRotacion('No fue posible cargar el KPI 2 de rotación del nuevo personal.');
      }
    } catch (error) {
      console.error('Error cargando indicadores de selección:', error);
      setData(null);

      if (!dataRotacion) {
        setErrorRotacion(
          error.message || 'No fue posible cargar los indicadores de Selección.',
        );
      }
    } finally {
      setLoading(false);
      setLoadingRotacion(false);
    }
  };

  useEffect(() => {
    cargarIndicadores();
  }, []);

  const aplicarFiltros = () => {
    const anioParaAplicar =
      mesSeleccionado && !anioSeleccionado
        ? String(anioActual)
        : anioSeleccionado;

    const filtros = {
      anio: anioParaAplicar,
      mes: mesSeleccionado,
    };

    if (anioParaAplicar !== anioSeleccionado) {
      setAnioSeleccionado(anioParaAplicar);
    }

    setFiltrosAplicados(filtros);
    cargarIndicadores(filtros);
  };

  const limpiarFiltros = () => {
    const filtros = { anio: '', mes: '' };
    setAnioSeleccionado('');
    setMesSeleccionado('');
    setFiltrosAplicados(filtros);
    cargarIndicadores(filtros);
  };


  const consultarGestionMensual = async (periodo) => {
    if (!periodo) {
      setGestionMensual(null);
      setAnalisisMes('');
      setPlanAccion('');
      setCalificacionMensual('');
      setErrorGestion('');
      setMensajeGestion('');
      return;
    }

    try {
      setCargandoGestion(true);
      setErrorGestion('');
      setMensajeGestion('');

      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error(
          'No fue posible consultar la gestión mensual porque no se encontró la sesión autenticada.',
        );
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/gestion-mensual-indicadores/${GESTION_MENSUAL_MODULO}/${GESTION_MENSUAL_INDICADOR}/${periodo.anio}/${periodo.mes}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.detail || 'No fue posible consultar la gestión mensual.');
      }

      setGestionMensual(result);
      setAnalisisMes(result?.gestionMensual?.analisisMes || '');
      setPlanAccion(result?.gestionMensual?.planAccion || '');

      const calificacion = result?.gestionMensual?.calificacionMensual;
      setCalificacionMensual(
        calificacion !== null && calificacion !== undefined
          ? String(calificacion)
          : '',
      );
    } catch (error) {
      console.error('Error consultando gestión mensual de Selección:', error);
      setGestionMensual(null);
      setAnalisisMes('');
      setPlanAccion('');
      setCalificacionMensual('');
      setErrorGestion(error.message || 'No fue posible consultar la gestión mensual.');
    } finally {
      setCargandoGestion(false);
    }
  };

  useEffect(() => {
    consultarGestionMensual(periodoMensualSeleccionado);
  }, [periodoMensualSeleccionado]);

  const guardarGestionMensual = async () => {
    if (!periodoMensualSeleccionado) return;

    try {
      setGuardandoGestion(true);
      setErrorGestion('');
      setMensajeGestion('');

      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error(
          'No fue posible guardar porque no se encontró la sesión autenticada.',
        );
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/gestion-mensual-indicadores/${GESTION_MENSUAL_MODULO}/${GESTION_MENSUAL_INDICADOR}/${periodoMensualSeleccionado.anio}/${periodoMensualSeleccionado.mes}/gestion`,
        {
          method: 'PUT',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            analisisMes,
            planAccion,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.detail || 'No fue posible guardar la gestión mensual.');
      }

      setGestionMensual(result);
      setAnalisisMes(result?.gestionMensual?.analisisMes || '');
      setPlanAccion(result?.gestionMensual?.planAccion || '');
      setMensajeGestion('Gestión mensual guardada correctamente.');
    } catch (error) {
      console.error('Error guardando gestión mensual de Selección:', error);
      setErrorGestion(error.message || 'No fue posible guardar la gestión mensual.');
    } finally {
      setGuardandoGestion(false);
    }
  };

  const guardarCampoGestion = async (campo) => {
    if (!periodoMensualSeleccionado) return;

    const permisos = gestionMensual?.permisos || {};

    if (campo === 'analisisMes' && !permisos.puedeEditarAnalisis) return;
    if (campo === 'planAccion' && !permisos.puedeEditarPlanAccion) return;

    try {
      setGuardandoGestion(true);
      setErrorGestion('');
      setMensajeGestion('');

      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error(
          'No fue posible guardar porque no se encontró la sesión autenticada.',
        );
      }

      const payload = {};

      if (campo === 'analisisMes') payload.analisisMes = analisisMes;
      if (campo === 'planAccion') payload.planAccion = planAccion;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/gestion-mensual-indicadores/${GESTION_MENSUAL_MODULO}/${GESTION_MENSUAL_INDICADOR}/${periodoMensualSeleccionado.anio}/${periodoMensualSeleccionado.mes}/gestion`,
        {
          method: 'PUT',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.detail || 'No fue posible guardar el campo.');
      }

      setGestionMensual(result);
      setAnalisisMes(result?.gestionMensual?.analisisMes || '');
      setPlanAccion(result?.gestionMensual?.planAccion || '');
      setMensajeGestion('Cambio guardado correctamente.');
    } catch (error) {
      console.error('Error guardando campo de gestión mensual:', error);
      setErrorGestion(error.message || 'No fue posible guardar el cambio.');
    } finally {
      setGuardandoGestion(false);
    }
  };

  const guardarAnalisisAlSalir = () => guardarCampoGestion('analisisMes');
  const guardarPlanAccionAlSalir = () => guardarCampoGestion('planAccion');

  const guardarCalificacionMensual = async () => {
    if (!periodoMensualSeleccionado) return;

    const valor = Number(calificacionMensual);

    if (
      calificacionMensual === '' ||
      Number.isNaN(valor) ||
      valor < 0 ||
      valor > 100
    ) {
      setErrorGestion('Ingrese una calificación válida entre 0 y 100.');
      return;
    }

    try {
      setGuardandoCalificacion(true);
      setErrorGestion('');
      setMensajeGestion('');

      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error(
          'No fue posible guardar la calificación porque no se encontró la sesión autenticada.',
        );
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/gestion-mensual-indicadores/${GESTION_MENSUAL_MODULO}/${GESTION_MENSUAL_INDICADOR}/${periodoMensualSeleccionado.anio}/${periodoMensualSeleccionado.mes}/calificacion`,
        {
          method: 'PUT',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            calificacionMensual: valor,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.detail || 'No fue posible guardar la calificación.');
      }

      setGestionMensual(result);

      const calificacion = result?.gestionMensual?.calificacionMensual;
      setCalificacionMensual(
        calificacion !== null && calificacion !== undefined
          ? String(calificacion)
          : '',
      );

      setMensajeGestion('Calificación mensual guardada correctamente.');
    } catch (error) {
      console.error('Error guardando calificación mensual:', error);
      setErrorGestion(error.message || 'No fue posible guardar la calificación.');
    } finally {
      setGuardandoCalificacion(false);
    }
  };

  const estadosTabla = useMemo(() => {
    return (data?.estados || []).map((item) => ({
      ...item,
      color: getEstadoColor(item.estado),
    }));
  }, [data]);

  const motivosTabla = useMemo(() => {
    const motivos =
      data?.motivos_rechazo_generales_con_datos
      || data?.motivos_rechazo_con_datos
      || [];

    return motivos
      .filter((item) => item.cantidad > 0)
      .map((item, index) => ({
        ...item,
        color: motivoColors[index % motivoColors.length],
      }));
  }, [data]);

  const serieMensualGrafica = useMemo(() => {
    const serie = Array.isArray(data?.serie_mensual)
      ? data.serie_mensual
      : [];

    if (serie.length === 0) return [];

    const normalizada = serie.map((item) => ({
      ...item,
      anio: Number(item.anio),
      numero_mes: Number(item.numero_mes),
      registrados: Number(item.registrados || 0),
      avanzan_contratacion: Number(item.avanzan_contratacion || 0),
      rechazados_seleccion: Number(item.rechazados_seleccion || 0),
    }));

    const anioFiltro = Number(filtrosAplicados.anio);
    const aniosSerie = [
      ...new Set(
        normalizada
          .map((item) => item.anio)
          .filter(Boolean),
      ),
    ];

    const anioBase =
      anioFiltro
      || (aniosSerie.length === 1 ? aniosSerie[0] : null);

    if (!anioBase) {
      return normalizada.map((item) => ({
        ...item,
        etiquetaGrafica:
          item.etiqueta
          || `${meses.find((m) => Number(m.value) === item.numero_mes)?.label || item.numero_mes} ${item.anio}`,
      }));
    }

    const mesInicial = anioBase === 2026 ? 3 : 1;
    const mesFinal =
      anioBase === anioActual
        ? new Date().getMonth() + 1
        : 12;

    return Array.from(
      { length: Math.max(mesFinal - mesInicial + 1, 0) },
      (_, index) => {
        const numeroMes = mesInicial + index;
        const encontrado = normalizada.find(
          (item) =>
            item.anio === anioBase
            && item.numero_mes === numeroMes,
        );

        const nombreMes =
          meses.find((m) => Number(m.value) === numeroMes)?.label
          || `Mes ${numeroMes}`;

        return {
          clave: `${anioBase}-${String(numeroMes).padStart(2, '0')}`,
          anio: anioBase,
          numero_mes: numeroMes,
          mes: nombreMes.toLowerCase(),
          etiqueta: `${nombreMes} ${anioBase}`,
          etiquetaGrafica: nombreMes.substring(0, 3),
          registrados: encontrado?.registrados || 0,
          avanzan_contratacion: encontrado?.avanzan_contratacion || 0,
          rechazados_seleccion: encontrado?.rechazados_seleccion || 0,
        };
      },
    );
  }, [data, filtrosAplicados.anio]);

  const tarjetas = data?.tarjetas || {};

  const totalRegistrados =
    tarjetas?.registrados?.cantidad
    ?? data?.total
    ?? data?.registrados_seleccion
    ?? 0;

  const porcentajeRegistrados =
    tarjetas?.registrados?.porcentaje
    ?? data?.porcentajes?.registrados
    ?? (totalRegistrados > 0 ? 100 : 0);

  const totalAvanzan =
    tarjetas?.avanzan_contratacion?.cantidad
    ?? data?.avanza_contratacion
    ?? data?.total_personas_avanzadas_contratacion
    ?? 0;

  const porcentajeAvanzan =
    tarjetas?.avanzan_contratacion?.porcentaje
    ?? data?.porcentajes?.avanzan_contratacion
    ?? data?.porcentaje_avanza_contratacion
    ?? 0;

  const totalRechazados =
    tarjetas?.rechazados_seleccion?.cantidad
    ?? data?.rechazados_seleccion
    ?? data?.rechazados_generales
    ?? 0;

  const porcentajeRechazados =
    tarjetas?.rechazados_seleccion?.porcentaje
    ?? data?.porcentajes?.rechazados_seleccion
    ?? data?.porcentaje_rechazados_seleccion
    ?? 0;

  const tarjetasRotacion = dataRotacion?.tarjetas || {};

  const totalContratadosRotacion =
    tarjetasRotacion?.total_contratados?.cantidad
    ?? dataRotacion?.total_contratados
    ?? 0;

  const cortesRotacion = useMemo(() => {
    const configuracion = [
      {
        key: 'hasta_7_dias',
        label: 'Retiro hasta 7 días',
        corto: '≤ 7 días',
        color: '#dc2626',
      },
      {
        key: 'hasta_15_dias',
        label: 'Retiro hasta 15 días',
        corto: '≤ 15 días',
        color: '#ea580c',
      },
      {
        key: 'hasta_30_dias',
        label: 'Retiro hasta 30 días',
        corto: '≤ 30 días',
        color: '#7c3aed',
      },
      {
        key: 'hasta_60_dias',
        label: 'Retiro hasta 60 días',
        corto: '≤ 60 días',
        color: '#2563eb',
      },
    ];

    return configuracion.map((config) => {
      const corte = tarjetasRotacion?.[config.key] || {};

      return {
        ...config,
        corteDias: corte?.corte_dias,
        evaluables: Number(corte?.evaluables || 0),
        evaluablesNaturales: Number(corte?.evaluables_naturales || 0),
        retiros: Number(corte?.retiros || 0),
        tasa:
          corte?.tasa === null || corte?.tasa === undefined
            ? null
            : Number(corte.tasa),
        porcentajeMaduracion: Number(corte?.porcentaje_maduracion || 0),
        umbralMaduracion: Number(corte?.umbral_maduracion || 80),
        estado: corte?.estado || 'PENDIENTE_MADURACION',
      };
    });
  }, [tarjetasRotacion]);

  const serieMensualRotacion = useMemo(() => {
    const serie = Array.isArray(dataRotacion?.serie_mensual)
      ? dataRotacion.serie_mensual
      : [];

    if (serie.length === 0) return [];

    const normalizada = serie.map((item) => ({
      ...item,
      anio: Number(item.anio),
      numero_mes: Number(item.numero_mes),
      total_contratados: Number(item.total_contratados || 0),
      tasa_hasta_7:
        item.tasa_hasta_7 === null || item.tasa_hasta_7 === undefined
          ? null
          : Number(item.tasa_hasta_7),
      tasa_hasta_15:
        item.tasa_hasta_15 === null || item.tasa_hasta_15 === undefined
          ? null
          : Number(item.tasa_hasta_15),
      tasa_hasta_30:
        item.tasa_hasta_30 === null || item.tasa_hasta_30 === undefined
          ? null
          : Number(item.tasa_hasta_30),
      tasa_hasta_60:
        item.tasa_hasta_60 === null || item.tasa_hasta_60 === undefined
          ? null
          : Number(item.tasa_hasta_60),
    }));

    const anioFiltro = Number(filtrosAplicados.anio);
    const aniosSerie = [
      ...new Set(
        normalizada
          .map((item) => item.anio)
          .filter(Boolean),
      ),
    ];

    const anioBase =
      anioFiltro
      || (aniosSerie.length === 1 ? aniosSerie[0] : null);

    if (!anioBase) {
      return normalizada.map((item) => ({
        ...item,
        etiquetaGrafica:
          item.etiqueta
          || `${meses.find((m) => Number(m.value) === item.numero_mes)?.label || item.numero_mes} ${item.anio}`,
      }));
    }

    const mesInicial = anioBase === 2026 ? 3 : 1;
    const mesFinal =
      anioBase === anioActual
        ? new Date().getMonth() + 1
        : 12;

    return Array.from(
      { length: Math.max(mesFinal - mesInicial + 1, 0) },
      (_, index) => {
        const numeroMes = mesInicial + index;
        const encontrado = normalizada.find(
          (item) =>
            item.anio === anioBase
            && item.numero_mes === numeroMes,
        );

        const nombreMes =
          meses.find((m) => Number(m.value) === numeroMes)?.label
          || `Mes ${numeroMes}`;

        return {
          clave: `${anioBase}-${String(numeroMes).padStart(2, '0')}`,
          anio: anioBase,
          numero_mes: numeroMes,
          mes: nombreMes.toLowerCase(),
          etiqueta: `${nombreMes} ${anioBase}`,
          etiquetaGrafica: nombreMes.substring(0, 3),
          total_contratados: encontrado?.total_contratados || 0,
          tasa_hasta_7:
            encontrado?.tasa_hasta_7 === undefined
              ? null
              : encontrado.tasa_hasta_7,
          tasa_hasta_15:
            encontrado?.tasa_hasta_15 === undefined
              ? null
              : encontrado.tasa_hasta_15,
          tasa_hasta_30:
            encontrado?.tasa_hasta_30 === undefined
              ? null
              : encontrado.tasa_hasta_30,
          tasa_hasta_60:
            encontrado?.tasa_hasta_60 === undefined
              ? null
              : encontrado.tasa_hasta_60,
          evaluables_7: Number(encontrado?.evaluables_7 || 0),
          evaluables_15: Number(encontrado?.evaluables_15 || 0),
          evaluables_30: Number(encontrado?.evaluables_30 || 0),
          evaluables_60: Number(encontrado?.evaluables_60 || 0),
          retiros_hasta_7: Number(encontrado?.retiros_hasta_7 || 0),
          retiros_hasta_15: Number(encontrado?.retiros_hasta_15 || 0),
          retiros_hasta_30: Number(encontrado?.retiros_hasta_30 || 0),
          retiros_hasta_60: Number(encontrado?.retiros_hasta_60 || 0),
        };
      },
    );
  }, [dataRotacion, filtrosAplicados.anio]);

  const seleccionarMesDesdeGrafica = (item) => {
    if (!item?.anio || !item?.numero_mes) return;

    const anio = String(item.anio);
    const mes = String(item.numero_mes);

    setAnioSeleccionado(anio);
    setMesSeleccionado(mes);

    const filtros = { anio, mes };
    setFiltrosAplicados(filtros);
    cargarIndicadores(filtros);
  };

  const textoPeriodo =
    filtrosAplicados.anio || filtrosAplicados.mes
      ? `${meses.find((m) => m.value === filtrosAplicados.mes)?.label || 'Todos los meses'} / ${filtrosAplicados.anio || 'Todos los años'}`
      : 'Vista general';

  if (loading) {
    return <div className="p-8 text-gray-500">Cargando indicadores...</div>;
  }

  if (!data) {
    return <div className="p-8 text-red-500">No fue posible cargar los indicadores.</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 border-t-4 border-emerald-600 p-8">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-200">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>

            <div>
              <h1 className="text-3xl font-black text-gray-900">
                Indicadores de Selección
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Seguimiento del proceso de Selección y efectividad del nuevo personal contratado.
              </p>
              <span className="inline-flex items-center gap-2 mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                <CalendarDays className="w-3.5 h-3.5" />
                {textoPeriodo}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Año</label>
                <select
                  value={anioSeleccionado}
                  onChange={(e) => setAnioSeleccionado(e.target.value)}
                  className="w-full min-w-[220px] rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"                >
                  {anios.map((item) => (
                    <option key={item.value || 'todos-anios'} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Mes</label>
                <select
                  value={mesSeleccionado}
                  onChange={(e) => setMesSeleccionado(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {meses.map((item) => (
                    <option key={item.value || 'todos-meses'} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={aplicarFiltros}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition"
              >
                <Filter className="w-4 h-4" />
                Filtrar
              </button>

              <button
                type="button"
                onClick={limpiarFiltros}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-2 text-sm font-bold text-white hover:bg-gray-800 transition"
              >
                <RotateCcw className="w-4 h-4" />
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiPrincipal
          title="Total personal registrado"
          value={totalRegistrados}
          percentage={porcentajeRegistrados}
          subtitle="Universo del aplicativo para el periodo consultado."
        />

        <KpiPrincipal
          title="Total personal avanza a contratación"
          value={totalAvanzan}
          percentage={porcentajeAvanzan}
          subtitle="Personas que finalizaron Selección y avanzaron a Contratación."
        />

        <KpiPrincipal
          title="Total personal rechazado en Selección"
          value={totalRechazados}
          percentage={porcentajeRechazados}
          subtitle="Rechazos ocurridos exclusivamente dentro de Selección."
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <DataTable
          title="Estados del proceso"
          subtitle="Distribución del personal registrado según su resultado dentro de Selección."
          icon={ListChecks}
          rows={estadosTabla}
          columns={[
            { key: 'estado', label: 'Estado' },
            { key: 'cantidad', label: 'Cantidad', align: 'center' },
            { key: 'porcentaje', label: 'Porcentaje', align: 'center', percent: true },
          ]}
          colorResolver={(row) => row.color || getEstadoColor(row.estado)}
          emptyText="No hay estados registrados para el periodo seleccionado."
        />

        <DataTable
          title="Motivos de rechazo"
          subtitle="Distribución de las causas asociadas únicamente a los rechazos de Selección."
          icon={AlertTriangle}
          rows={motivosTabla}
          columns={[
            { key: 'motivo', label: 'Motivo' },
            { key: 'cantidad', label: 'Cantidad', align: 'center' },
            { key: 'porcentaje', label: 'Porcentaje', align: 'center', percent: true },
          ]}
          colorResolver={(row) => row.color}
          emptyText="No hay motivos de rechazo de Selección para el periodo seleccionado."
        />
      </div>

      <ChartCard
        title="Comportamiento mensual de Selección"
        subtitle="Comparativo mensual de personal registrado, personal que avanza a Contratación y rechazados de Selección. Selecciona un mes de la gráfica para consultar su detalle."
        icon={BarChart3}
        heightClass="h-[420px]"
      >
        {serieMensualGrafica.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={serieMensualGrafica}
              margin={{ top: 20, right: 30, left: 0, bottom: 15 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="etiquetaGrafica"
                tick={{ fontSize: 12, fontWeight: 700, fill: '#475569' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4' }}
                content={<TooltipMensualSeleccion />}
              />
              <Line
                type="monotone"
                dataKey="registrados"
                name="Personal registrado"
                stroke="#0f766e"
                strokeWidth={3}
                dot={(props) => (
                  <PuntoMensualSeleccion
                    {...props}
                    color="#0f766e"
                    onSelect={seleccionarMesDesdeGrafica}
                  />
                )}
                activeDot={(props) => (
                  <PuntoMensualSeleccion
                    {...props}
                    color="#0f766e"
                    onSelect={seleccionarMesDesdeGrafica}
                    active
                  />
                )}
              />
              <Line
                type="monotone"
                dataKey="avanzan_contratacion"
                name="Avanza a contratación"
                stroke="#2563eb"
                strokeWidth={3}
                dot={(props) => (
                  <PuntoMensualSeleccion
                    {...props}
                    color="#2563eb"
                    onSelect={seleccionarMesDesdeGrafica}
                  />
                )}
                activeDot={(props) => (
                  <PuntoMensualSeleccion
                    {...props}
                    color="#2563eb"
                    onSelect={seleccionarMesDesdeGrafica}
                    active
                  />
                )}
              />
              <Line
                type="monotone"
                dataKey="rechazados_seleccion"
                name="Rechazados en Selección"
                stroke="#dc2626"
                strokeWidth={3}
                dot={(props) => (
                  <PuntoMensualSeleccion
                    {...props}
                    color="#dc2626"
                    onSelect={seleccionarMesDesdeGrafica}
                  />
                )}
                activeDot={(props) => (
                  <PuntoMensualSeleccion
                    {...props}
                    color="#dc2626"
                    onSelect={seleccionarMesDesdeGrafica}
                    active
                  />
                )}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChartMessage message="No hay información mensual disponible para construir la gráfica." />
        )}
      </ChartCard>

      <section className="overflow-hidden rounded-3xl border border-sky-200 bg-white shadow-xl">
        <div className="border-b border-sky-100 bg-gradient-to-r from-sky-50 via-white to-indigo-50 px-5 py-6 md:px-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex rounded-full border border-sky-200 bg-sky-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-sky-800">
                  KPI 2 · Efectividad
                </span>
                <span className="text-xs font-bold text-gray-500">
                  Cohorte por fecha de ingreso
                </span>
              </div>

              <h2 className="mt-3 text-2xl font-black text-gray-900">
                Tasa de rotación del nuevo personal
              </h2>

              <p className="mt-2 max-w-4xl text-sm leading-6 text-gray-600">
                Mide la permanencia inicial del personal nuevo contratado y los retiros
                ocurridos dentro de los primeros 7, 15, 30 y 60 días. Cada tasa se publica
                cuando al menos el 80 % de la cohorte válida ya alcanzó naturalmente el corte.
              </p>
            </div>

            <div className="w-fit rounded-2xl border border-sky-200 bg-white px-5 py-3 text-sm font-bold text-sky-800 shadow-sm">
              {textoPeriodo}
            </div>
          </div>
        </div>

        <div className="space-y-6 p-5 md:p-7">
          {loadingRotacion ? (
            <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-sky-100 bg-sky-50/40">
              <div className="flex items-center gap-3 text-sm font-semibold text-sky-700">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-200 border-t-sky-700" />
                Cargando KPI 2 de rotación del nuevo personal...
              </div>
            </div>
          ) : errorRotacion ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
              {errorRotacion}
            </div>
          ) : dataRotacion ? (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                <KpiContratadosRotacion
                  total={totalContratadosRotacion}
                />

                {cortesRotacion.map((corte) => (
                  <KpiCorteRotacion
                    key={corte.key}
                    corte={corte}
                  />
                ))}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
                <p className="text-xs leading-5 text-gray-600">
                  <span className="font-black text-gray-800">Cómo leer este KPI:</span>{' '}
                  “Retiros” es el numerador y “Evaluables” es el grupo cuyo resultado ya puede
                  observarse. La tasa solo se publica cuando al menos el 80 % de la cohorte válida
                  ya alcanzó naturalmente el corte; de lo contrario se muestra “Pendiente de maduración”.
                </p>
              </div>

              <ChartCard
                title="Evolución mensual de la rotación del nuevo personal"
                subtitle="Tasas acumuladas por cohorte de ingreso. Las líneas se interrumpen cuando el corte aún no ha madurado. Selecciona un punto para consultar ese mes."
                icon={BarChart3}
                heightClass="h-[430px]"
              >
                {serieMensualRotacion.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={serieMensualRotacion}
                      margin={{ top: 20, right: 30, left: 0, bottom: 15 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="etiquetaGrafica"
                        tick={{ fontSize: 12, fontWeight: 700, fill: '#475569' }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        allowDecimals={false}
                        tickFormatter={(value) => `${value}%`}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4' }}
                        content={<TooltipMensualRotacion />}
                      />

                      <Line
                        type="monotone"
                        dataKey="tasa_hasta_7"
                        name="Hasta 7 días"
                        stroke="#dc2626"
                        strokeWidth={3}
                        connectNulls={false}
                        dot={(props) => (
                          <PuntoMensualRotacion
                            {...props}
                            color="#dc2626"
                            onSelect={seleccionarMesDesdeGrafica}
                          />
                        )}
                        activeDot={(props) => (
                          <PuntoMensualRotacion
                            {...props}
                            color="#dc2626"
                            onSelect={seleccionarMesDesdeGrafica}
                            active
                          />
                        )}
                      />

                      <Line
                        type="monotone"
                        dataKey="tasa_hasta_15"
                        name="Hasta 15 días"
                        stroke="#ea580c"
                        strokeWidth={3}
                        connectNulls={false}
                        dot={(props) => (
                          <PuntoMensualRotacion
                            {...props}
                            color="#ea580c"
                            onSelect={seleccionarMesDesdeGrafica}
                          />
                        )}
                        activeDot={(props) => (
                          <PuntoMensualRotacion
                            {...props}
                            color="#ea580c"
                            onSelect={seleccionarMesDesdeGrafica}
                            active
                          />
                        )}
                      />

                      <Line
                        type="monotone"
                        dataKey="tasa_hasta_30"
                        name="Hasta 30 días"
                        stroke="#7c3aed"
                        strokeWidth={3}
                        connectNulls={false}
                        dot={(props) => (
                          <PuntoMensualRotacion
                            {...props}
                            color="#7c3aed"
                            onSelect={seleccionarMesDesdeGrafica}
                          />
                        )}
                        activeDot={(props) => (
                          <PuntoMensualRotacion
                            {...props}
                            color="#7c3aed"
                            onSelect={seleccionarMesDesdeGrafica}
                            active
                          />
                        )}
                      />

                      <Line
                        type="monotone"
                        dataKey="tasa_hasta_60"
                        name="Hasta 60 días"
                        stroke="#2563eb"
                        strokeWidth={3}
                        connectNulls={false}
                        dot={(props) => (
                          <PuntoMensualRotacion
                            {...props}
                            color="#2563eb"
                            onSelect={seleccionarMesDesdeGrafica}
                          />
                        )}
                        activeDot={(props) => (
                          <PuntoMensualRotacion
                            {...props}
                            color="#2563eb"
                            onSelect={seleccionarMesDesdeGrafica}
                            active
                          />
                        )}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChartMessage message="No hay información mensual disponible para construir el KPI 2." />
                )}
              </ChartCard>

              <ResumenRangosRotacion
                rangos={dataRotacion?.rangos_exclusivos}
              />
            </>
          ) : (
            <EmptyChartMessage message="No hay información disponible para el KPI 2." />
          )}
        </div>
      </section>

      {periodoMensualSeleccionado && (
        <GestionMensualSeleccion
          periodo={periodoMensualSeleccionado}
          gestionMensual={gestionMensual}
          analisisMes={analisisMes}
          setAnalisisMes={setAnalisisMes}
          planAccion={planAccion}
          setPlanAccion={setPlanAccion}
          calificacionMensual={calificacionMensual}
          setCalificacionMensual={setCalificacionMensual}
          cargando={cargandoGestion}
          guardandoGestion={guardandoGestion}
          guardandoCalificacion={guardandoCalificacion}
          error={errorGestion}
          mensaje={mensajeGestion}
          onGuardarGestion={guardarGestionMensual}
          onGuardarAnalisisBlur={guardarAnalisisAlSalir}
          onGuardarPlanBlur={guardarPlanAccionAlSalir}
          onGuardarCalificacion={guardarCalificacionMensual}
        />
      )}
    </motion.div>
  );
};


const KpiContratadosRotacion = ({ total }) => (
  <div className="h-full rounded-2xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-black uppercase tracking-wide text-sky-700">
          Nuevos contratados
        </p>
        <p className="mt-3 text-4xl font-black text-gray-900">{total}</p>
        <p className="mt-2 text-xs leading-5 text-gray-500">
          Universo contratado del periodo según fecha real de ingreso.
        </p>
      </div>

      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
        <Users className="h-6 w-6 text-sky-700" />
      </div>
    </div>
  </div>
);


const KpiCorteRotacion = ({ corte }) => {
  const pendiente = corte?.tasa === null || corte?.estado === 'PENDIENTE_MADURACION';

  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: corte.color }}
        />
        <p className="text-xs font-black uppercase tracking-wide text-gray-600">
          {corte.corto}
        </p>
      </div>

      {pendiente ? (
        <div className="mt-4">
          <p className="text-lg font-black leading-6 text-amber-700">
            Pendiente de maduración
          </p>
          <p className="mt-2 text-xs leading-5 text-gray-500">
            {corte.evaluablesNaturales} personas ya alcanzaron naturalmente este corte.
          </p>
          <p className="mt-1 text-xs font-semibold text-amber-700">
            Maduración: {formatearPorcentaje(corte.porcentajeMaduracion)}% ·
            se publica desde {formatearPorcentaje(corte.umbralMaduracion)}%.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-3 flex items-end gap-2">
            <p className="text-4xl font-black text-gray-900">
              {formatearPorcentaje(corte.tasa)}%
            </p>
          </div>

          <p className="mt-2 text-xs leading-5 text-gray-500">
            {corte.retiros} retiro{corte.retiros === 1 ? '' : 's'} de{' '}
            {corte.evaluables} persona{corte.evaluables === 1 ? '' : 's'} evaluable
            {corte.evaluables === 1 ? '' : 's'}.
          </p>
          <p className="mt-1 text-xs font-semibold text-emerald-700">
            Maduración de cohorte: {formatearPorcentaje(corte.porcentajeMaduracion)}%.
          </p>
        </>
      )}
    </div>
  );
};


const ResumenRangosRotacion = ({ rangos = {} }) => {
  const filas = [
    { label: 'Retiro entre 0 y 7 días', value: rangos?.retiro_0_7 || 0 },
    { label: 'Retiro entre 8 y 15 días', value: rangos?.retiro_8_15 || 0 },
    { label: 'Retiro entre 16 y 30 días', value: rangos?.retiro_16_30 || 0 },
    { label: 'Retiro entre 31 y 60 días', value: rangos?.retiro_31_60 || 0 },
    { label: 'Retiro después de 60 días', value: rangos?.retiro_mas_60 || 0 },
    { label: 'Sin retiro registrado', value: rangos?.sin_retiro_registrado || 0 },
    { label: 'Fechas inconsistentes', value: rangos?.fechas_inconsistentes || 0 },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div>
        <h3 className="text-lg font-black text-gray-900">
          Distribución de permanencia
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Rangos exclusivos para lectura gerencial. Una persona solo puede pertenecer a un rango de retiro.
          Los registros con fechas inconsistentes se muestran aparte y no afectan las tasas.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filas.map((item) => {
          const esInconsistente = item.label === 'Fechas inconsistentes';

          return (
            <div
              key={item.label}
              className={
                esInconsistente
                  ? 'rounded-xl border border-amber-200 bg-amber-50 px-4 py-3'
                  : 'rounded-xl border border-gray-200 bg-gray-50 px-4 py-3'
              }
            >
              <p
                className={
                  esInconsistente
                    ? 'text-xs font-semibold text-amber-700'
                    : 'text-xs font-semibold text-gray-500'
                }
              >
                {item.label}
              </p>
              <p
                className={
                  esInconsistente
                    ? 'mt-1 text-2xl font-black text-amber-800'
                    : 'mt-1 text-2xl font-black text-gray-900'
                }
              >
                {item.value}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};


const PuntoMensualRotacion = ({
  cx,
  cy,
  payload,
  value,
  color,
  onSelect,
  active = false,
}) => {
  if (
    cx === undefined
    || cy === undefined
    || !payload
    || value === null
    || value === undefined
  ) {
    return null;
  }

  const seleccionar = (event) => {
    event?.stopPropagation?.();
    onSelect?.(payload);
  };

  return (
    <circle
      cx={cx}
      cy={cy}
      r={active ? 7 : 4}
      fill={color}
      stroke={active ? '#ffffff' : color}
      strokeWidth={active ? 2 : 0}
      onClick={seleccionar}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          seleccionar(event);
        }
      }}
      role="button"
      tabIndex={0}
      style={{ cursor: 'pointer', outline: 'none' }}
      aria-label={`Consultar ${payload.etiqueta || 'mes seleccionado'}`}
    />
  );
};


const TooltipMensualRotacion = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload || {};

  const filas = [
    {
      label: 'Hasta 7 días',
      tasa: item.tasa_hasta_7,
      retiros: item.retiros_hasta_7,
      evaluables: item.evaluables_7,
      className: 'text-red-700',
    },
    {
      label: 'Hasta 15 días',
      tasa: item.tasa_hasta_15,
      retiros: item.retiros_hasta_15,
      evaluables: item.evaluables_15,
      className: 'text-orange-700',
    },
    {
      label: 'Hasta 30 días',
      tasa: item.tasa_hasta_30,
      retiros: item.retiros_hasta_30,
      evaluables: item.evaluables_30,
      className: 'text-violet-700',
    },
    {
      label: 'Hasta 60 días',
      tasa: item.tasa_hasta_60,
      retiros: item.retiros_hasta_60,
      evaluables: item.evaluables_60,
      className: 'text-blue-700',
    },
  ];

  return (
    <div className="min-w-[290px] rounded-2xl border border-gray-200 bg-white p-4 shadow-xl">
      <p className="text-sm font-black text-gray-900">
        {item.etiqueta || 'Periodo'}
      </p>

      <p className="mt-1 text-xs text-gray-500">
        Nuevos contratados: <span className="font-black">{item.total_contratados || 0}</span>
      </p>

      <div className="mt-3 space-y-3">
        {filas.map((fila) => {
          const pendiente = fila.tasa === null || fila.tasa === undefined;

          return (
            <div key={fila.label} className="border-t border-gray-100 pt-2 first:border-0 first:pt-0">
              <div className="flex items-center justify-between gap-4">
                <span className={`text-sm font-bold ${fila.className}`}>
                  {fila.label}
                </span>

                <span className={`text-sm font-black ${fila.className}`}>
                  {pendiente
                    ? 'Pendiente'
                    : `${formatearPorcentaje(fila.tasa)}%`}
                </span>
              </div>

              <p className="mt-1 text-xs text-gray-500">
                {pendiente
                  ? 'Corte aún pendiente de maduración de la cohorte.'
                  : `${fila.retiros || 0} retiros / ${fila.evaluables || 0} evaluables`}
              </p>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs font-semibold text-sky-700">
        Haz clic en un punto disponible para consultar este mes.
      </p>
    </div>
  );
};


const GestionMensualSeleccion = ({
  periodo,
  gestionMensual,
  analisisMes,
  setAnalisisMes,
  planAccion,
  setPlanAccion,
  calificacionMensual,
  setCalificacionMensual,
  cargando,
  guardandoGestion,
  guardandoCalificacion,
  error,
  mensaje,
  onGuardarGestion,
  onGuardarAnalisisBlur,
  onGuardarPlanBlur,
  onGuardarCalificacion,
}) => {
  const permisos = gestionMensual?.permisos || {};
  const detalle = gestionMensual?.gestionMensual || {};
  const estadoPeriodo = gestionMensual?.periodo || {};

  const nombreMes =
    meses.find((item) => item.value === String(periodo.mes))?.label ||
    `Mes ${periodo.mes}`;

  const textoPermiso = (puedeEditar) => {
    if (!puedeEditar) return 'Solo lectura';
    if (estadoPeriodo.esPeriodoAnterior) {
      return 'Pendiente · un solo guardado';
    }
    return 'Editable';
  };

  if (cargando) {
    return (
      <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-xl">
        <div className="flex items-center gap-3 text-sm font-semibold text-emerald-700">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />
          Cargando gestión mensual del indicador...
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-xl">
      <div className="flex flex-col gap-4 border-b border-emerald-100 px-5 py-6 md:px-7 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold text-emerald-700">
            Gestión mensual del indicador
          </p>
          <h2 className="mt-1 text-xl font-black text-gray-900">
            Análisis, plan de acción y calificación mensual
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Información asociada exclusivamente al mes y año del periodo consultado.
          </p>
        </div>

        <div className="w-fit rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-800">
          {nombreMes.toLowerCase()} de {periodo.anio}
        </div>
      </div>

      <div className="bg-emerald-50/30 p-5 md:p-7">
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {mensaje}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-gray-900">
                Análisis del mes
              </h3>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  permisos.puedeEditarAnalisis
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {textoPermiso(permisos.puedeEditarAnalisis)}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Describa el comportamiento del indicador, causas relevantes y situaciones presentadas durante el mes.
            </p>

            <textarea
              value={analisisMes}
              onChange={(event) => setAnalisisMes(event.target.value)}
              onBlur={onGuardarAnalisisBlur}
              disabled={!permisos.puedeEditarAnalisis || guardandoGestion}
              placeholder="ESCRIBA EL ANÁLISIS DEL MES..."
              className="mt-4 min-h-[220px] w-full resize-y rounded-2xl border border-gray-300 bg-white p-4 text-sm text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-gray-50"
            />

            <p className="mt-3 text-xs text-gray-500">
              {detalle.usuarioAnalisis ? (
                <>
                  Registrado por{' '}
                  <span className="font-semibold text-gray-700">
                    {detalle.usuarioAnalisis}
                  </span>
                  {' · '}
                  {formatearFechaColombia(detalle.fechaAnalisis)}
                </>
              ) : (
                'Pendiente de diligenciar.'
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-gray-900">
                Plan de acción
              </h3>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  permisos.puedeEditarPlanAccion
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {textoPermiso(permisos.puedeEditarPlanAccion)}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Registre las acciones definidas para mejorar, corregir o mantener el resultado del indicador.
            </p>

            <textarea
              value={planAccion}
              onChange={(event) => setPlanAccion(event.target.value)}
              onBlur={onGuardarPlanBlur}
              disabled={!permisos.puedeEditarPlanAccion || guardandoGestion}
              placeholder="ESCRIBA EL PLAN DE ACCIÓN..."
              className="mt-4 min-h-[220px] w-full resize-y rounded-2xl border border-gray-300 bg-white p-4 text-sm text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-gray-50"
            />

            <p className="mt-3 text-xs text-gray-500">
              {detalle.usuarioPlanAccion ? (
                <>
                  Registrado por{' '}
                  <span className="font-semibold text-gray-700">
                    {detalle.usuarioPlanAccion}
                  </span>
                  {' · '}
                  {formatearFechaColombia(detalle.fechaPlanAccion)}
                </>
              ) : (
                'Pendiente de diligenciar.'
              )}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <h3 className="text-base font-bold text-gray-900">
                  Calificación mensual
                </h3>

                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                    permisos.puedeEditarCalificacion
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {permisos.puedeEditarCalificacion
                    ? estadoPeriodo.esPeriodoAnterior
                      ? 'Pendiente · un solo guardado'
                      : 'Editable por Super Administrador'
                    : 'Solo lectura'}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                Calificación mensual del indicador. Solo el Super Administrador puede registrarla o modificarla cuando el periodo lo permita.
              </p>

              <p className="mt-2 text-xs text-gray-500">
                {detalle.usuarioCalificacion ? (
                  <>
                    Calificado por{' '}
                    <span className="font-semibold text-gray-700">
                      {detalle.usuarioCalificacion}
                    </span>
                    {' · '}
                    {formatearFechaColombia(detalle.fechaCalificacion)}
                  </>
                ) : (
                  'Pendiente de calificación.'
                )}
              </p>

              {permisos.puedeEditarCalificacion && (
                <div className="mt-5 max-w-md">
                  <label
                    htmlFor="calificacionMensualSeleccion"
                    className="mb-2 block text-xs font-semibold text-gray-700"
                  >
                    Calificación del indicador
                  </label>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                      <input
                        id="calificacionMensualSeleccion"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={calificacionMensual}
                        onChange={(event) =>
                          setCalificacionMensual(event.target.value)
                        }
                        disabled={guardandoCalificacion}
                        placeholder="0 - 100"
                        className="w-full rounded-xl border border-violet-300 bg-white px-4 py-3 pr-10 text-sm font-semibold text-gray-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-gray-50"
                      />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-violet-700">
                        %
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={onGuardarCalificacion}
                      disabled={guardandoCalificacion}
                      className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-violet-300"
                    >
                      {guardandoCalificacion
                        ? 'Guardando...'
                        : 'Guardar calificación'}
                    </button>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-gray-500">
                    Ingrese un valor entre 0 y 100. En un periodo cerrado, una calificación pendiente solo podrá registrarse una vez.
                  </p>
                </div>
              )}
            </div>

            <div className="min-w-[190px] rounded-2xl border border-violet-200 bg-violet-50 px-6 py-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                Resultado
              </p>
              <p className="mt-1 text-3xl font-bold text-violet-800">
                {detalle.calificacionMensual !== null &&
                detalle.calificacionMensual !== undefined
                  ? `${Number(detalle.calificacionMensual)
                      .toFixed(2)
                      .replace('.', ',')} %`
                  : 'Pendiente'}
              </p>
            </div>
          </div>
        </div>

        {(permisos.puedeEditarAnalisis ||
          permisos.puedeEditarPlanAccion) && (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-gray-500">
              Mientras el mes se encuentre vigente, los cambios se guardan al salir de cada campo y también puede usar el botón Guardar gestión mensual.
            </p>

            <button
              type="button"
              onClick={onGuardarGestion}
              disabled={guardandoGestion}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {guardandoGestion
                ? 'Guardando...'
                : 'Guardar gestión mensual'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};


const KpiPrincipal = ({ title, value, percentage, subtitle }) => (
  <div className="h-full bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-bold text-gray-500">{title}</p>

        <div className="flex flex-wrap items-end gap-3 mt-3">
          <p className="text-5xl font-black text-gray-900">{value}</p>
          <span className="mb-1 inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">
            {formatearPorcentaje(percentage)}%
          </span>
        </div>

        {subtitle && (
          <p className="mt-4 text-xs leading-5 text-gray-500">
            {subtitle}
          </p>
        )}
      </div>

      <div className="w-16 h-16 shrink-0 rounded-2xl bg-emerald-50 flex items-center justify-center">
        <Users className="w-8 h-8 text-emerald-600" />
      </div>
    </div>
  </div>
);

const EstadoMiniCard = ({ item, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-left bg-white rounded-3xl shadow-lg border p-5 transition hover:-translate-y-1 hover:shadow-xl ${
      active ? 'border-gray-900' : 'border-gray-100'
    }`}
  >
    <div className="flex items-center gap-3">
      <span className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
      <p className="text-sm font-black text-gray-800 truncate">{item.estado}</p>
    </div>
    <div className="flex items-end justify-between mt-4">
      <p className="text-3xl font-black text-gray-900">{item.cantidad}</p>
      <span className="text-xs font-bold rounded-full px-3 py-1 bg-gray-50 text-gray-700 border">
        {formatearPorcentaje(item.porcentaje)}%
      </span>
    </div>
  </button>
);

const ChartCard = ({
  title,
  subtitle,
  icon: Icon,
  children,
  heightClass = 'h-[430px]',
}) => (
  <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
    <div className="flex items-start gap-3 mb-4">
      {Icon && (
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <Icon className="w-5 h-5 text-emerald-600" />
        </div>
      )}
      <div>
        <h2 className="text-xl font-black text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>
    </div>
    <div className={`w-full ${heightClass}`}>{children}</div>
  </div>
);

const DetailPanel = ({ title, item, nameKey, colorKey, empty }) => (
  <motion.div
    key={item?.[nameKey] || 'empty'}
    initial={{ opacity: 0, x: 12 }}
    animate={{ opacity: 1, x: 0 }}
    className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6"
  >
    <h2 className="text-xl font-black text-gray-900 mb-5">{title}</h2>

    {item ? (
      <>
        <div
          className="rounded-3xl p-6 text-white shadow-lg"
          style={{ backgroundColor: item[colorKey] }}
        >
          <p className="text-sm font-bold opacity-90">{item[nameKey]}</p>
          <p className="text-5xl font-black mt-4">{item.cantidad}</p>
          <p className="text-sm font-bold opacity-90 mt-1">
            {formatearPorcentaje(item.porcentaje)}% de participación
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
            <p className="text-xs font-bold text-gray-500">Cantidad</p>
            <p className="text-2xl font-black text-gray-900">{item.cantidad}</p>
          </div>
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
            <p className="text-xs font-bold text-gray-500">Porcentaje</p>
            <p className="text-2xl font-black text-gray-900">{formatearPorcentaje(item.porcentaje)}%</p>
          </div>
        </div>
      </>
    ) : (
      <p className="text-sm text-gray-500">{empty}</p>
    )}
  </motion.div>
);

const DataTable = ({ title, subtitle, icon: Icon, rows, columns, colorResolver, emptyText = 'No hay datos.' }) => (
  <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
    <div className="flex items-center gap-3 mb-5">
      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
        <Icon className="w-5 h-5 text-emerald-600" />
      </div>
      <div>
        <h2 className="text-xl font-black text-gray-900">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
    </div>

    <div className="overflow-x-auto rounded-2xl border border-gray-200 max-h-[420px] overflow-y-auto">
      <table className="w-full text-left">
        <thead className="sticky top-0 z-10">
          <tr className="bg-gray-900 text-white">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-5 py-3 text-sm font-bold ${col.align === 'center' ? 'text-center' : ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {rows?.length > 0 ? (
            rows.map((row, index) => (
              <tr key={index} className="hover:bg-emerald-50/40 transition">
                {columns.map((col, colIndex) => (
                  <td
                    key={col.key}
                    className={`px-5 py-3 text-sm font-semibold text-gray-800 ${col.align === 'center' ? 'text-center' : ''}`}
                  >
                    {colIndex === 0 ? (
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: colorResolver(row) }}
                        />
                        {row[col.key]}
                      </div>
                    ) : col.percent ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-black">
                        {formatearPorcentaje(row[col.key])}%
                      </span>
                    ) : (
                      row[col.key]
                    )}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-5 py-6 text-center text-sm text-gray-500">
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const PuntoMensualSeleccion = ({
  cx,
  cy,
  payload,
  color,
  onSelect,
  active = false,
}) => {
  if (cx === undefined || cy === undefined || !payload) return null;

  const seleccionar = (event) => {
    event?.stopPropagation?.();
    onSelect?.(payload);
  };

  return (
    <circle
      cx={cx}
      cy={cy}
      r={active ? 7 : 4}
      fill={color}
      stroke={active ? '#ffffff' : color}
      strokeWidth={active ? 2 : 0}
      onClick={seleccionar}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          seleccionar(event);
        }
      }}
      role="button"
      tabIndex={0}
      style={{ cursor: 'pointer', outline: 'none' }}
      aria-label={`Consultar ${payload.etiqueta || 'mes seleccionado'}`}
    />
  );
};


const TooltipMensualSeleccion = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload || {};

  return (
    <div className="min-w-[230px] rounded-2xl border border-gray-200 bg-white p-4 shadow-xl">
      <p className="text-sm font-black text-gray-900">
        {item.etiqueta || 'Periodo'}
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Haz clic en el punto para consultar este mes.
      </p>

      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-5">
          <span className="font-semibold text-gray-600">Registrados</span>
          <span className="font-black text-gray-900">{item.registrados || 0}</span>
        </div>

        <div className="flex items-center justify-between gap-5">
          <span className="font-semibold text-blue-700">Avanza a contratación</span>
          <span className="font-black text-blue-700">{item.avanzan_contratacion || 0}</span>
        </div>

        <div className="flex items-center justify-between gap-5">
          <span className="font-semibold text-red-700">Rechazados Selección</span>
          <span className="font-black text-red-700">{item.rechazados_seleccion || 0}</span>
        </div>
      </div>
    </div>
  );
};


const EmptyChartMessage = ({ message }) => (
  <div className="h-full flex items-center justify-center text-gray-500 text-sm text-center px-6">
    {message}
  </div>
);

export default IndicadoresSeleccionView;