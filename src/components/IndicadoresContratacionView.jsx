import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Clock3,
  Filter,
  Hourglass,
  RotateCcw,
  TrendingUp,
  UserCheck,
  Users,
  UserX,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

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

const coloresMotivos = [
  '#dc2626',
  '#f59e0b',
  '#7c3aed',
  '#0ea5e9',
  '#059669',
  '#2563eb',
];

const MODULO_GESTION_MENSUAL = 'CONTRATACION';
const CODIGO_INDICADOR_GESTION_MENSUAL = 'KPI_CONTRATACION';

const formatearFechaColombia = (fecha) => {
  if (!fecha) return 'Sin fecha registrada';

  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return 'Fecha no válida';

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Bogota',
  }).format(valor);
};

const formatearSoloFechaColombia = (fecha) => {
  if (!fecha) return 'Sin fecha registrada';

  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return 'Fecha no válida';

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Bogota',
  }).format(valor);
};

const IndicadoresContratacionView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [anioSeleccionado, setAnioSeleccionado] = useState('');
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    anio: '',
    mes: '',
  });

  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [buscandoTrabajadores, setBuscandoTrabajadores] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState('');
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState(null);

  const [gestionMensual, setGestionMensual] = useState(null);
  const [analisisMes, setAnalisisMes] = useState('');
  const [planAccion, setPlanAccion] = useState('');
  const [analisisGuardado, setAnalisisGuardado] = useState('');
  const [planAccionGuardado, setPlanAccionGuardado] = useState('');
  const [calificacionMensual, setCalificacionMensual] = useState('');
  const [calificacionGuardada, setCalificacionGuardada] = useState('');
  const [cargandoGestion, setCargandoGestion] = useState(false);
  const [guardandoGestion, setGuardandoGestion] = useState(false);
  const [guardandoCalificacion, setGuardandoCalificacion] = useState(false);
  const [errorGestion, setErrorGestion] = useState('');
  const [mensajeGestion, setMensajeGestion] = useState('');

  const contenedorBusquedaRef = useRef(null);

  const modoIndividual = data?.modo_consulta === 'individual';

  const periodoMensualSeleccionado = useMemo(() => {
    if (
      modoIndividual ||
      !filtrosAplicados.anio ||
      !filtrosAplicados.mes
    ) {
      return null;
    }

    const anio = Number(filtrosAplicados.anio);
    const mes = Number(filtrosAplicados.mes);

    if (!anio || !mes || mes < 1 || mes > 12) {
      return null;
    }

    return { anio, mes };
  }, [
    filtrosAplicados.anio,
    filtrosAplicados.mes,
    modoIndividual,
  ]);

  const obtenerBaseApi = () => {
    const base = String(
      import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.VITE_API_URL ||
        '',
    ).replace(/\/$/, '');

    return base.endsWith('/api') ? base : `${base}/api`;
  };

  const limpiarGestionMensual = () => {
    setGestionMensual(null);
    setAnalisisMes('');
    setPlanAccion('');
    setAnalisisGuardado('');
    setPlanAccionGuardado('');
    setCalificacionMensual('');
    setCalificacionGuardada('');
    setErrorGestion('');
    setMensajeGestion('');
  };

  const cargarIndicadoresGenerales = async (
    filtros = { anio: '', mes: '' },
  ) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (filtros.anio) params.append('anio', filtros.anio);
      if (filtros.mes) params.append('mes', filtros.mes);

      const queryString = params.toString();
      const url = `${import.meta.env.VITE_API_BASE_URL}/datos-seleccion/dashboard-contratacion${
        queryString ? `?${queryString}` : ''
      }`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error cargando indicadores de contratación:', err);
      setData(null);
      setError('No fue posible cargar los indicadores de contratación.');
    } finally {
      setLoading(false);
    }
  };

  const cargarIndicadorIndividual = async (trabajador) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      params.append('id_registro_personal', trabajador.id_registro_personal);

      const url = `${import.meta.env.VITE_API_BASE_URL}/datos-seleccion/dashboard-contratacion?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      setTrabajadorSeleccionado(trabajador);
      setTextoBusqueda('');
      setResultadosBusqueda([]);
      setMostrarResultados(false);
    } catch (err) {
      console.error('Error cargando indicador individual:', err);
      setError('No fue posible cargar la información del trabajador.');
    } finally {
      setLoading(false);
    }
  };

  const consultarGestionMensual = async (periodo) => {
    if (!periodo) {
      limpiarGestionMensual();
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      limpiarGestionMensual();
      setErrorGestion(
        'No fue posible consultar la gestión mensual porque no se encontró la sesión autenticada.',
      );
      return;
    }

    setCargandoGestion(true);
    setErrorGestion('');
    setMensajeGestion('');

    try {
      const url =
        `${obtenerBaseApi()}/gestion-mensual-indicadores/` +
        `${MODULO_GESTION_MENSUAL}/` +
        `${CODIGO_INDICADOR_GESTION_MENSUAL}/` +
        `${periodo.anio}/${periodo.mes}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result?.detail ||
            'No fue posible consultar la gestión mensual del indicador.',
        );
      }

      const analisisCargado =
        result?.gestionMensual?.analisisMes || '';
      const planCargado =
        result?.gestionMensual?.planAccion || '';
      const calificacionCargada =
        result?.gestionMensual?.calificacionMensual;
      const calificacionTexto =
        calificacionCargada !== null &&
        calificacionCargada !== undefined
          ? String(calificacionCargada)
          : '';

      setGestionMensual(result);
      setAnalisisMes(analisisCargado);
      setPlanAccion(planCargado);
      setCalificacionMensual(calificacionTexto);
      setAnalisisGuardado(analisisCargado);
      setPlanAccionGuardado(planCargado);
      setCalificacionGuardada(calificacionTexto);
    } catch (err) {
      console.error(
        'Error consultando gestión mensual de Contratación:',
        err,
      );

      limpiarGestionMensual();
      setErrorGestion(
        err?.message ||
          'No fue posible consultar la gestión mensual del indicador.',
      );
    } finally {
      setCargandoGestion(false);
    }
  };

  const guardarCamposGestionMensual = async (
    campos,
    { mostrarConfirmacion = true } = {},
  ) => {
    if (!periodoMensualSeleccionado || !gestionMensual) {
      return false;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      setErrorGestion(
        'No fue posible guardar porque no se encontró la sesión autenticada.',
      );
      setMensajeGestion('');
      return false;
    }

    setGuardandoGestion(true);
    setErrorGestion('');

    if (mostrarConfirmacion) {
      setMensajeGestion('');
    }

    try {
      const url =
        `${obtenerBaseApi()}/gestion-mensual-indicadores/` +
        `${MODULO_GESTION_MENSUAL}/` +
        `${CODIGO_INDICADOR_GESTION_MENSUAL}/` +
        `${periodoMensualSeleccionado.anio}/` +
        `${periodoMensualSeleccionado.mes}/gestion`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(campos),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result?.detail ||
            'No fue posible guardar la gestión mensual.',
        );
      }

      const analisisCargado =
        result?.gestionMensual?.analisisMes || '';
      const planCargado =
        result?.gestionMensual?.planAccion || '';
      const calificacionCargada =
        result?.gestionMensual?.calificacionMensual;
      const calificacionTexto =
        calificacionCargada !== null &&
        calificacionCargada !== undefined
          ? String(calificacionCargada)
          : '';

      setGestionMensual(result);
      setAnalisisMes(analisisCargado);
      setPlanAccion(planCargado);
      setCalificacionMensual(calificacionTexto);
      setAnalisisGuardado(analisisCargado);
      setPlanAccionGuardado(planCargado);
      setCalificacionGuardada(calificacionTexto);

      if (mostrarConfirmacion) {
        setMensajeGestion(
          'La gestión mensual fue guardada correctamente.',
        );
      }

      return true;
    } catch (err) {
      console.error(
        'Error guardando gestión mensual de Contratación:',
        err,
      );

      setErrorGestion(
        err?.message ||
          'No fue posible guardar la gestión mensual.',
      );
      setMensajeGestion('');
      return false;
    } finally {
      setGuardandoGestion(false);
    }
  };

  const guardarGestionMensual = async () => {
    if (!periodoMensualSeleccionado || !gestionMensual) {
      return;
    }

    const permisos = gestionMensual?.permisos || {};
    const body = {};
    const analisisActual = analisisMes.trim();
    const planActual = planAccion.trim();

    if (
      permisos.puedeEditarAnalisis &&
      analisisActual &&
      analisisActual !== analisisGuardado.trim()
    ) {
      body.analisisMes = analisisActual;
    }

    if (
      permisos.puedeEditarPlanAccion &&
      planActual &&
      planActual !== planAccionGuardado.trim()
    ) {
      body.planAccion = planActual;
    }

    if (Object.keys(body).length === 0) {
      setErrorGestion('No hay cambios pendientes por guardar.');
      setMensajeGestion('');
      return;
    }

    await guardarCamposGestionMensual(body);
  };

  const guardarAnalisisAlSalir = async () => {
    if (
      !gestionMensual?.periodo?.esPeriodoActual ||
      !gestionMensual?.permisos?.puedeEditarAnalisis ||
      guardandoGestion
    ) {
      return;
    }

    const valorActual = analisisMes.trim();

    if (!valorActual || valorActual === analisisGuardado.trim()) {
      return;
    }

    await guardarCamposGestionMensual(
      { analisisMes: valorActual },
      { mostrarConfirmacion: false },
    );
  };

  const guardarPlanAccionAlSalir = async () => {
    if (
      !gestionMensual?.periodo?.esPeriodoActual ||
      !gestionMensual?.permisos?.puedeEditarPlanAccion ||
      guardandoGestion
    ) {
      return;
    }

    const valorActual = planAccion.trim();

    if (!valorActual || valorActual === planAccionGuardado.trim()) {
      return;
    }

    await guardarCamposGestionMensual(
      { planAccion: valorActual },
      { mostrarConfirmacion: false },
    );
  };

  const guardarCalificacionMensual = async () => {
    if (
      !periodoMensualSeleccionado ||
      !gestionMensual?.permisos?.puedeEditarCalificacion
    ) {
      return;
    }

    const valorTexto = String(calificacionMensual).trim();

    if (!valorTexto) {
      setErrorGestion(
        'Debe ingresar una calificación mensual entre 0 y 100.',
      );
      setMensajeGestion('');
      return;
    }

    const valorNumerico = Number(valorTexto.replace(',', '.'));

    if (
      Number.isNaN(valorNumerico) ||
      valorNumerico < 0 ||
      valorNumerico > 100
    ) {
      setErrorGestion(
        'La calificación mensual debe estar entre 0 y 100.',
      );
      setMensajeGestion('');
      return;
    }

    if (
      String(valorNumerico) ===
      String(calificacionGuardada).replace(',', '.')
    ) {
      setErrorGestion(
        'No hay cambios pendientes en la calificación.',
      );
      setMensajeGestion('');
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      setErrorGestion(
        'No fue posible guardar la calificación porque no se encontró la sesión autenticada.',
      );
      setMensajeGestion('');
      return;
    }

    setGuardandoCalificacion(true);
    setErrorGestion('');
    setMensajeGestion('');

    try {
      const url =
        `${obtenerBaseApi()}/gestion-mensual-indicadores/` +
        `${MODULO_GESTION_MENSUAL}/` +
        `${CODIGO_INDICADOR_GESTION_MENSUAL}/` +
        `${periodoMensualSeleccionado.anio}/` +
        `${periodoMensualSeleccionado.mes}/calificacion`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          calificacionMensual: valorNumerico,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result?.detail ||
            'No fue posible guardar la calificación mensual.',
        );
      }

      const calificacionCargada =
        result?.gestionMensual?.calificacionMensual;
      const calificacionTexto =
        calificacionCargada !== null &&
        calificacionCargada !== undefined
          ? String(calificacionCargada)
          : '';

      setGestionMensual(result);
      setCalificacionMensual(calificacionTexto);
      setCalificacionGuardada(calificacionTexto);
      setMensajeGestion(
        'La calificación mensual fue guardada correctamente.',
      );
    } catch (err) {
      console.error(
        'Error guardando calificación mensual de Contratación:',
        err,
      );

      setErrorGestion(
        err?.message ||
          'No fue posible guardar la calificación mensual.',
      );
    } finally {
      setGuardandoCalificacion(false);
    }
  };

  useEffect(() => {
    cargarIndicadoresGenerales({ anio: '', mes: '' });
  }, []);

  useEffect(() => {
    consultarGestionMensual(periodoMensualSeleccionado);
  }, [periodoMensualSeleccionado?.anio, periodoMensualSeleccionado?.mes]);

  useEffect(() => {
    const manejarClickExterno = (event) => {
      if (
        contenedorBusquedaRef.current &&
        !contenedorBusquedaRef.current.contains(event.target)
      ) {
        setMostrarResultados(false);
      }
    };

    document.addEventListener('mousedown', manejarClickExterno);
    return () => document.removeEventListener('mousedown', manejarClickExterno);
  }, []);

  useEffect(() => {
    const texto = textoBusqueda.trim();

    if (trabajadorSeleccionado || texto.length < 2) {
      setResultadosBusqueda([]);
      setErrorBusqueda('');
      setBuscandoTrabajadores(false);
      return undefined;
    }

    const controlador = new AbortController();
    const temporizador = setTimeout(async () => {
      try {
        setBuscandoTrabajadores(true);
        setErrorBusqueda('');

        const params = new URLSearchParams();
        params.append('texto_busqueda', texto);
        params.append('limite', '20');

        const url = `${import.meta.env.VITE_API_BASE_URL}/datos-seleccion/buscar-trabajadores-contratacion?${params.toString()}`;
        const response = await fetch(url, { signal: controlador.signal });

        if (!response.ok) {
          throw new Error(`Error HTTP ${response.status}`);
        }

        const result = await response.json();
        setResultadosBusqueda(result?.resultados || []);
        setMostrarResultados(true);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error buscando trabajadores:', err);
          setResultadosBusqueda([]);
          setErrorBusqueda('No fue posible realizar la búsqueda.');
          setMostrarResultados(true);
        }
      } finally {
        if (!controlador.signal.aborted) {
          setBuscandoTrabajadores(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(temporizador);
      controlador.abort();
    };
  }, [textoBusqueda, trabajadorSeleccionado]);

  const aplicarFiltros = () => {
    const nuevosFiltros = {
      anio: anioSeleccionado,
      mes: mesSeleccionado,
    };

    setTrabajadorSeleccionado(null);
    setTextoBusqueda('');
    setResultadosBusqueda([]);
    setMostrarResultados(false);
    setFiltrosAplicados(nuevosFiltros);
    cargarIndicadoresGenerales(nuevosFiltros);
  };

  const limpiarTodo = () => {
    const filtrosLimpios = { anio: '', mes: '' };

    setAnioSeleccionado('');
    setMesSeleccionado('');
    setFiltrosAplicados(filtrosLimpios);
    setTextoBusqueda('');
    setResultadosBusqueda([]);
    setMostrarResultados(false);
    setTrabajadorSeleccionado(null);
    setErrorBusqueda('');
    cargarIndicadoresGenerales(filtrosLimpios);
  };

  const limpiarTrabajador = () => {
    setTextoBusqueda('');
    setResultadosBusqueda([]);
    setMostrarResultados(false);
    setTrabajadorSeleccionado(null);
    setErrorBusqueda('');
    cargarIndicadoresGenerales(filtrosAplicados);
  };

  const indicadores = useMemo(() => {
    const registrados = Number(data?.registrados_seleccion || 0);
    const avanzan = Number(
      data?.comparativo_avanzan_contratados?.avanzan_contratacion || 0,
    );
    const contratados = Number(
      data?.comparativo_avanzan_contratados?.contratados || 0,
    );
    const pendientes = Number(data?.pendientes_contratacion?.total || 0);
    const rechazados = Number(data?.rechazados?.total || 0);
    const porcentajeContratacion = Number(
      data?.comparativo_avanzan_contratados?.porcentaje_contratados || 0,
    );
    return {
      registrados,
      avanzan,
      contratados,
      pendientes,
      rechazados,
      porcentajeContratacion,
    };
  }, [data]);

  const comparativoProceso = useMemo(
    () => [
      { nombre: 'Registrados', cantidad: indicadores.registrados, color: '#2563eb' },
      { nombre: 'Avanzan', cantidad: indicadores.avanzan, color: '#f59e0b' },
      { nombre: 'Pendientes', cantidad: indicadores.pendientes, color: '#0ea5e9' },
      { nombre: 'Contratados', cantidad: indicadores.contratados, color: '#059669' },
    ],
    [indicadores],
  );

  const resultadoContratacion = useMemo(() => {
    const total =
      indicadores.contratados +
      indicadores.pendientes +
      indicadores.rechazados;

    return [
      {
        estado: 'Contratados',
        cantidad: indicadores.contratados,
        porcentaje: total
          ? Number(((indicadores.contratados / total) * 100).toFixed(2))
          : 0,
        color: '#059669',
      },
      {
        estado: 'Pendientes',
        cantidad: indicadores.pendientes,
        porcentaje: total
          ? Number(((indicadores.pendientes / total) * 100).toFixed(2))
          : 0,
        color: '#0ea5e9',
      },
      {
        estado: 'Rechazados',
        cantidad: indicadores.rechazados,
        porcentaje: total
          ? Number(((indicadores.rechazados / total) * 100).toFixed(2))
          : 0,
        color: '#dc2626',
      },
    ].filter((item) => item.cantidad > 0);
  }, [indicadores]);

  const motivosRechazo = useMemo(
    () =>
      (data?.rechazados?.motivos || [])
        .filter((item) => Number(item?.cantidad || 0) > 0)
        .map((item, index) => ({
          motivo: item?.motivo || 'Sin motivo',
          cantidad: Number(item?.cantidad || 0),
          porcentaje: Number(item?.porcentaje || 0),
          color: coloresMotivos[index % coloresMotivos.length],
        })),
    [data],
  );

  const textoPeriodo = useMemo(() => {
    if (modoIndividual) {
      return 'Consulta individual del trabajador seleccionado.';
    }

    if (!filtrosAplicados.anio && !filtrosAplicados.mes) {
      return 'Vista general: todos los periodos.';
    }

    const nombreMes =
      meses.find((item) => item.value === filtrosAplicados.mes)?.label ||
      'Todos los meses';

    return `Periodo consultado: ${nombreMes} de ${
      filtrosAplicados.anio || 'todos los años'
    }.`;
  }, [data, filtrosAplicados, modoIndividual]);

  if (loading && !data) {
    return (
      <div className="min-h-[320px] flex items-center justify-center bg-white rounded-2xl shadow-xl">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
          <p className="text-sm font-semibold text-gray-500">Cargando indicadores...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 bg-white rounded-2xl shadow-xl border border-red-100">
        <p className="text-sm font-semibold text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => cargarIndicadoresGenerales(filtrosAplicados)}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <section className="bg-white rounded-2xl shadow-xl p-5 md:p-8 border-t-4 border-emerald-600">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200 shrink-0">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-800">Indicadores de Contratación</h1>
              <p className="text-sm text-gray-500">
                Seguimiento ejecutivo y consulta individual del proceso de contratación.
              </p>
              <p className="text-xs text-emerald-700 font-semibold mt-1">{textoPeriodo}</p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 w-full xl:w-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Año</label>
                <select
                  value={anioSeleccionado}
                  onChange={(event) => setAnioSeleccionado(event.target.value)}
                  disabled={modoIndividual}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:text-gray-400"
                >
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
                  onChange={(event) => setMesSeleccionado(event.target.value)}
                  disabled={modoIndividual}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:text-gray-400"
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
                disabled={modoIndividual || loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition-colors disabled:bg-emerald-300"
              >
                <Filter className="w-4 h-4" />
                Filtrar
              </button>

              <button
                type="button"
                onClick={limpiarTodo}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white hover:bg-gray-800 transition-colors disabled:bg-gray-400"
              >
                <RotateCcw className="w-4 h-4" />
                Limpiar
              </button>
            </div>
          </div>
        </div>

        <div ref={contenedorBusquedaRef} className="relative mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Buscar trabajador por nombre o número de identificación
          </label>

          <div className="relative">
            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={textoBusqueda}
              onChange={(event) => {
                setTextoBusqueda(event.target.value);
                setTrabajadorSeleccionado(null);
                setMostrarResultados(true);
              }}
              onFocus={() => {
                if (textoBusqueda.trim().length >= 2 && !trabajadorSeleccionado) {
                  setMostrarResultados(true);
                }
              }}
              placeholder=""
              className="w-full rounded-2xl border border-gray-300 bg-white py-3 pl-12 pr-12 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {textoBusqueda && (
              <button
                type="button"
                onClick={limpiarTrabajador}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Limpiar trabajador"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            )}
          </div>

          {mostrarResultados && !trabajadorSeleccionado && textoBusqueda.trim().length >= 2 && (
            <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
              {buscandoTrabajadores ? (
                <div className="flex items-center gap-3 p-4 text-sm text-gray-500">
                  <div className="w-5 h-5 rounded-full border-2 border-emerald-100 border-t-emerald-600 animate-spin" />
                  Buscando trabajadores...
                </div>
              ) : errorBusqueda ? (
                <div className="p-4 text-sm font-semibold text-red-600">{errorBusqueda}</div>
              ) : resultadosBusqueda.length > 0 ? (
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                  {resultadosBusqueda.map((trabajador) => (
                    <button
                      key={trabajador.id_registro_personal}
                      type="button"
                      onClick={() => cargarIndicadorIndividual(trabajador)}
                      className="w-full p-4 text-left hover:bg-emerald-50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">
                            {trabajador.nombre_completo}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                            <Users className="w-4 h-4" />
                            {trabajador.numero_identificacion}
                          </p>
                        </div>
                        <span className="inline-flex w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
                          {trabajador.estado_actual}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-sm text-gray-500">
                  No se encontraron trabajadores con ese nombre o identificación.
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {loading && data && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            <div className="w-5 h-5 rounded-full border-2 border-emerald-200 border-t-emerald-700 animate-spin" />
            Actualizando información...
          </div>
        )}

        {!modoIndividual ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <KpiCard title="Registrados por Selección" value={indicadores.registrados} icon={Users} accentClass="text-blue-600" backgroundClass="bg-blue-50" />
            <KpiCard title="Avanzan a Contratación" value={indicadores.avanzan} icon={ArrowRight} accentClass="text-amber-600" backgroundClass="bg-amber-50" />
            <KpiCard title="Pendientes de Contratación" subtitle="Avanzaron y aún no tienen decisión final C o NC" value={indicadores.pendientes} icon={Hourglass} accentClass="text-sky-600" backgroundClass="bg-sky-50" />
            <KpiCard title="Contratados" value={indicadores.contratados} icon={UserCheck} accentClass="text-emerald-600" backgroundClass="bg-emerald-50" />
            <KpiCard title="Rechazados" value={indicadores.rechazados} icon={UserX} accentClass="text-red-600" backgroundClass="bg-red-50" />
            <KpiCard title="Porcentaje de contratación" subtitle="Contratados respecto a quienes avanzaron" value={`${indicadores.porcentajeContratacion}%`} icon={TrendingUp} accentClass="text-violet-600" backgroundClass="bg-violet-50" />
          </div>
        ) : (
          <IndividualSummary data={data} />
        )}
      </section>

      {!modoIndividual ? (
        <>
          <GeneralDashboard
            comparativoProceso={comparativoProceso}
            resultadoContratacion={resultadoContratacion}
            motivosRechazo={motivosRechazo}
            indicadores={indicadores}
          />

          {periodoMensualSeleccionado && (
            <GestionMensualContratacion
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
        </>
      ) : (
        <IndividualDashboard data={data} />
      )}
    </motion.div>
  );
};

const GeneralDashboard = ({
  comparativoProceso,
  resultadoContratacion,
  motivosRechazo,
  indicadores,
}) => (
  <>
    <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <ChartCard
        title="Comparativo del proceso"
        subtitle="Registrados por Selección, personas que avanzan, pendientes y personas contratadas."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={comparativoProceso} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => [`${value} personas`, 'Cantidad']} />
            <Bar dataKey="cantidad" radius={[10, 10, 0, 0]} maxBarSize={80}>
              {comparativoProceso.map((entry) => (
                <Cell key={entry.nombre} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Distribución de resultados registrados"
        subtitle="Comparación visual entre contratados, pendientes y rechazos registrados en el periodo."
      >
        {resultadoContratacion.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={resultadoContratacion}
                dataKey="cantidad"
                nameKey="estado"
                cx="50%"
                cy="46%"
                outerRadius={125}
                innerRadius={62}
                paddingAngle={4}
                label={({ porcentaje }) => `${porcentaje}%`}
              >
                {resultadoContratacion.map((entry) => (
                  <Cell key={entry.estado} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name, props) => [
                  `${value} personas`,
                  props?.payload?.estado || 'Estado',
                ]}
              />
              <Legend verticalAlign="bottom" height={60} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChartMessage message="No hay personas contratadas, pendientes o rechazadas para el periodo seleccionado." />
        )}
      </ChartCard>
    </section>

    <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <ChartCard
        title="Motivos de rechazo"
        subtitle="Distribución de los motivos registrados en los procesos rechazados."
      >
        {motivosRechazo.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={motivosRechazo}
                dataKey="cantidad"
                nameKey="motivo"
                cx="50%"
                cy="46%"
                outerRadius={120}
                innerRadius={58}
                paddingAngle={3}
                label={({ porcentaje }) => `${porcentaje}%`}
              >
                {motivosRechazo.map((entry) => (
                  <Cell key={entry.motivo} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name, props) => [
                  `${value} registros`,
                  props?.payload?.motivo || 'Motivo',
                ]}
              />
              <Legend verticalAlign="bottom" height={80} wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChartMessage message="No hay motivos de rechazo registrados para el periodo seleccionado." />
        )}
      </ChartCard>

      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-800">Resumen ejecutivo</h2>
          <p className="text-sm text-gray-500">Lectura rápida de los indicadores mostrados en el tablero.</p>
        </div>

        <div className="space-y-3">
          <ExecutiveRow label="Registrados por Selección" value={indicadores.registrados} color="bg-blue-600" />
          <ExecutiveRow label="Avanzan a Contratación" value={indicadores.avanzan} color="bg-amber-500" />
          <ExecutiveRow label="Pendientes de Contratación" value={indicadores.pendientes} color="bg-sky-600" />
          <ExecutiveRow label="Contratados" value={indicadores.contratados} color="bg-emerald-600" />
          <ExecutiveRow label="Rechazados" value={indicadores.rechazados} color="bg-red-600" />
          <ExecutiveRow label="Porcentaje de contratación" value={`${indicadores.porcentajeContratacion}%`} color="bg-violet-600" />
        </div>
      </div>
    </section>
  </>
);

const GestionMensualContratacion = ({
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
      <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-xl">
        <div className="flex items-center gap-3 text-sm font-semibold text-emerald-700">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />
          Cargando gestión mensual del indicador...
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-xl">
      <div className="flex flex-col gap-4 border-b border-emerald-100 px-5 py-6 md:px-7 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold text-emerald-700">
            Gestión mensual del indicador
          </p>
          <h2 className="mt-1 text-xl font-bold text-gray-900">
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
                    htmlFor="calificacionMensualContratacion"
                    className="mb-2 block text-xs font-semibold text-gray-700"
                  >
                    Calificación del indicador
                  </label>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                      <input
                        id="calificacionMensualContratacion"
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


const IndividualSummary = ({ data }) => {
  const trabajador = data?.trabajador || {};
  const tiempo = data?.tiempo_contratacion || {};
  const contratacion = data?.contratacion || {};
  const avance = data?.avance_contratacion || {};

  const esMigrado = Boolean(trabajador?.es_activo_migrado);
  const estadoContratado = Number(trabajador?.id_estado_actual) === 25;
  const tieneContratacion = Boolean(contratacion?.existe) || estadoContratado;

  const tituloRegistro = esMigrado
    ? 'Registro histórico en el aplicativo'
    : 'Registro en Selección';

  const valorAvance = esMigrado
    ? 'No aplica'
    : avance?.existe
      ? formatearSoloFechaColombia(avance?.fecha)
      : 'Pendiente';

  const subtituloAvance = esMigrado
    ? 'El trabajador ingresó mediante migración histórica'
    : undefined;

  const tituloContratacion = esMigrado
    ? 'Fecha de contratación'
    : 'Confirmado como Contratado';

  const valorContratacion = contratacion?.fecha
    ? formatearSoloFechaColombia(contratacion.fecha)
    : tieneContratacion
      ? 'Contratado Historico'
      : 'Pendiente';

  const subtituloContratacion = esMigrado
    ? (
      contratacion?.fuente === 'CONTRATACION_BASICA'
        ? 'Fecha tomada de ContratacionBasica'
        : 'Información histórica disponible'
    )
    : undefined;

  const subtituloTiempo = esMigrado
    ? 'No se calcula porque no recorrió el flujo 24 → 25 del aplicativo'
    : 'Desde el estado 24 hasta la confirmación de contratación';

  const valorTiempo = esMigrado
    ? 'No aplica'
    : tiempo?.disponible
      ? tiempo.formateado
      : 'No disponible';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <KpiCard
        title="Trabajador"
        subtitle={esMigrado ? 'Origen: migración histórica' : 'Origen: aplicativo'}
        value={trabajador.nombre_completo || 'Sin información'}
        icon={Users}
        accentClass="text-blue-600"
        backgroundClass="bg-blue-50"
        compactValue
      />
      <KpiCard
        title="Estado actual"
        value={trabajador.estado_actual || 'Sin información'}
        icon={UserCheck}
        accentClass="text-emerald-600"
        backgroundClass="bg-emerald-50"
        compactValue
      />
      <KpiCard
        title={tituloRegistro}
        subtitle={
          esMigrado
            ? 'Corresponde a la incorporación del registro histórico'
            : undefined
        }
        value={formatearSoloFechaColombia(data?.registro_seleccion?.fecha)}
        icon={Clock3}
        accentClass="text-violet-600"
        backgroundClass="bg-violet-50"
        compactValue
      />
      <KpiCard
        title="Avanzó a Contratación"
        subtitle={subtituloAvance}
        value={valorAvance}
        icon={ArrowRight}
        accentClass="text-amber-600"
        backgroundClass="bg-amber-50"
        compactValue
      />
      <KpiCard
        title={tituloContratacion}
        subtitle={subtituloContratacion}
        value={valorContratacion}
        icon={UserCheck}
        accentClass="text-emerald-600"
        backgroundClass="bg-emerald-50"
        compactValue
      />
      {!esMigrado && (
        <KpiCard
          title="Tiempo de contratación"
          subtitle={subtituloTiempo}
          value={valorTiempo}
          icon={Clock3}
          accentClass="text-sky-600"
          backgroundClass="bg-sky-50"
          compactValue
          centerValue
        />
      )}
    </div>
  );
};

const IndividualDashboard = ({ data }) => {
  const trabajador = data?.trabajador || {};
  const tiempo = data?.tiempo_contratacion || {};
  const rechazo = data?.rechazo || {};
  const eventosOriginales = Array.isArray(data?.linea_tiempo)
    ? data.linea_tiempo
    : [];

  const esMigrado = Boolean(trabajador?.es_activo_migrado);
  const estadoContratado = Number(trabajador?.id_estado_actual) === 25;
  const avanzo = Boolean(data?.avance_contratacion?.existe);
  const contratado = Boolean(data?.contratacion?.existe) || estadoContratado;

  const eventos = esMigrado
    ? [
      {
        evento: 'Registro histórico en el aplicativo',
        completado: Boolean(data?.registro_seleccion?.fecha),
        fecha: data?.registro_seleccion?.fecha,
        fuente: 'RegistroPersonal.FechaCreacion',
      },
      {
        evento: 'Contratado',
        completado: contratado,
        fecha: data?.contratacion?.fecha || null,
        fuente: data?.contratacion?.fuente || 'Estado actual del trabajador',
      },
      ...(rechazo?.existe
        ? [
          {
            evento: 'Rechazado en Contratación',
            completado: true,
            fecha: rechazo?.fecha,
            usuario: rechazo?.usuario,
            origen_movimiento: rechazo?.origen_movimiento,
            motivo: rechazo?.motivo,
          },
        ]
        : []),
    ]
    : eventosOriginales;

  const tituloPendiente = !avanzo
    ? 'Pendiente de avanzar a Contratación'
    : 'Pendiente de confirmación como Contratado';

  const mensajePendiente = !avanzo
    ? 'El trabajador todavía no registra el movimiento al estado 24 desde Selección.'
    : 'El trabajador ya avanzó a Contratación, pero todavía no tiene confirmación registrada.';

  return (
    <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 bg-white rounded-2xl shadow-xl p-5 md:p-7 border border-gray-100">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {esMigrado
              ? 'Información histórica del trabajador'
              : 'Línea de tiempo del trabajador'}
          </h2>
          <p className="text-sm text-gray-500">
            {esMigrado
              ? 'Se muestran únicamente las fechas históricas disponibles. La ausencia de los estados 24 y 25 no significa que el trabajador esté pendiente.'
              : 'Fechas reales registradas durante el proceso de contratación.'}
          </p>
        </div>

        {eventos.length > 0 ? (
          <div className="space-y-0">
            {eventos.map((evento, index) => (
              <TimelineItem
                key={`${evento?.evento || 'evento'}-${index}`}
                evento={evento}
                index={index}
                esUltimo={index === eventos.length - 1}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <p className="font-bold text-gray-800">Sin línea de tiempo disponible</p>
            <p className="mt-2 text-sm text-gray-600">
              No se encontraron eventos históricos para este trabajador.
            </p>
          </div>
        )}

        {rechazo?.existe && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-5">
            <p className="text-sm font-bold text-red-700">Motivo de rechazo</p>
            <p className="mt-2 text-sm text-red-900">
              {rechazo.motivo || 'Sin motivo registrado'}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-5 md:p-7 border border-gray-100">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center">
            <Clock3 className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {esMigrado ? 'Trazabilidad histórica' : 'Tiempo de contratación'}
            </h2>
            <p className="text-xs text-gray-500">
              {esMigrado
                ? 'Información disponible del registro migrado.'
                : 'Estado 24 hasta la confirmación de contratación.'}
            </p>
          </div>
        </div>

        {esMigrado ? (
          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
            <p className="font-bold text-violet-900">Trabajador migrado</p>
            <p className="mt-2 text-sm leading-relaxed text-violet-800">
              Este trabajador no recorrió dentro del aplicativo el flujo de
              Selección → estado 24 → estado 25. Por eso no se muestra como
              pendiente y no se calcula un tiempo de contratación.
            </p>

            <div className="mt-4 space-y-3">
              <DateDetail
                label="Fecha de contratación"
                value={
                  data?.contratacion?.fecha
                    ? formatearFechaColombia(data.contratacion.fecha)
                    : 'Sin fecha histórica disponible'
                }
              />
              <DateDetail
                label="Fuente"
                value={
                  data?.contratacion?.fuente === 'CONTRATACION_BASICA'
                    ? 'ContratacionBasica.FechaIngreso'
                    : data?.contratacion?.fuente || 'Estado actual del trabajador'
                }
              />
            </div>
          </div>
        ) : tiempo?.disponible ? (
          <>
            <div className="rounded-2xl bg-sky-50 border border-sky-100 p-5 mb-5 text-center">
              <p className="text-sm font-semibold text-sky-700">Tiempo real</p>
              <p className="text-3xl font-black text-sky-950 mt-2 break-words">
                {tiempo.formateado}
              </p>
            </div>

            <div className="space-y-4">
              <DateDetail
                label="Avanzó a Contratación"
                value={formatearFechaColombia(tiempo.fecha_inicio)}
              />
              <DateDetail
                label="Confirmado como Contratado"
                value={formatearFechaColombia(tiempo.fecha_fin)}
              />
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="font-bold text-amber-900">{tituloPendiente}</p>
            <p className="mt-2 text-sm leading-relaxed text-amber-800">
              {tiempo?.mensaje || mensajePendiente}
            </p>

            {avanzo && !contratado && data?.avance_contratacion?.fecha && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-white/70 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                  Fecha de avance
                </p>
                <p className="mt-2 text-sm font-bold text-gray-900">
                  {formatearFechaColombia(data.avance_contratacion.fecha)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

const TimelineItem = ({ evento, index, esUltimo }) => {
  const completado = Boolean(evento?.completado);

  const estilosCompletado = [
    {
      circulo: 'bg-violet-600 text-white',
      linea: 'bg-violet-200',
    },
    {
      circulo: 'bg-amber-500 text-white',
      linea: 'bg-amber-200',
    },
    {
      circulo: 'bg-emerald-600 text-white',
      linea: 'bg-emerald-200',
    },
  ];

  const estilo =
    estilosCompletado[index] ||
    estilosCompletado[estilosCompletado.length - 1];

  const claseCirculo = completado
    ? estilo.circulo
    : 'bg-gray-200 text-gray-500';

  const claseLinea = completado ? estilo.linea : 'bg-gray-200';

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center border-4 border-white shadow-md ${claseCirculo}`}
        >
          {completado ? (
            <UserCheck className="w-6 h-6" />
          ) : (
            <Clock3 className="w-6 h-6" />
          )}
        </div>

        {!esUltimo && (
          <div className={`w-1 min-h-20 flex-1 ${claseLinea}`} />
        )}
      </div>

      <div className={`pb-8 pt-1 flex-1 ${esUltimo ? 'pb-0' : ''}`}>
        <p
          className={`text-base font-bold ${
            completado ? 'text-gray-900' : 'text-gray-500'
          }`}
        >
          {evento?.evento || 'Evento sin nombre'}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {completado
            ? formatearFechaColombia(evento?.fecha)
            : 'Pendiente'}
        </p>
      </div>
    </div>
  );
};

const DateDetail = ({ label, value }) => (
  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p>
    <p className="mt-2 text-sm font-bold text-gray-900 leading-relaxed">{value}</p>
  </div>
);

const ChartCard = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-2xl shadow-xl p-5 md:p-6 border border-gray-100">
    <div className="mb-5">
      <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
    <div className="w-full h-[380px] md:h-[420px]">{children}</div>
  </div>
);

const KpiCard = ({
  title,
  subtitle,
  value,
  icon: Icon,
  accentClass,
  backgroundClass,
  compactValue = false,
  centerValue = false,
}) => (
  <motion.div
    whileHover={{ y: -3 }}
    className="bg-white border border-gray-200 rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow"
  >
    <div
      className={`flex items-start justify-between gap-4 ${
        centerValue ? 'text-center' : ''
      }`}
    >
      <div className={`min-w-0 flex-1 ${centerValue ? 'px-2' : ''}`}>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            {subtitle}
          </p>
        )}
        <p
          className={`font-extrabold text-gray-900 mt-2 break-words ${
            compactValue ? 'text-xl md:text-2xl' : 'text-3xl'
          }`}
        >
          {value}
        </p>
      </div>

      {!centerValue && (
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${backgroundClass}`}
        >
          <Icon className={`w-6 h-6 ${accentClass}`} />
        </div>
      )}
    </div>

    {centerValue && (
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mt-4 ${backgroundClass}`}
      >
        <Icon className={`w-6 h-6 ${accentClass}`} />
      </div>
    )}
  </motion.div>
);

const ExecutiveRow = ({ label, value, color }) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 p-4">
    <div className="flex items-center gap-3 min-w-0">
      <span className={`w-3 h-3 rounded-full shrink-0 ${color}`} />
      <span className="text-sm font-semibold text-gray-700">{label}</span>
    </div>
    <span className="text-sm font-black text-gray-900 text-right">{value}</span>
  </div>
);

const EmptyChartMessage = ({ message }) => (
  <div className="h-full flex items-center justify-center text-gray-500 text-sm text-center px-6">
    {message}
  </div>
);

export default IndicadoresContratacionView;