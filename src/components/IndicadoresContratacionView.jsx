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
  const [actividadesPlanAccion, setActividadesPlanAccion] = useState([
    { idActividad: null, actividad: '', fechaCompromiso: '' },
  ]);
  const [cargandoGestion, setCargandoGestion] = useState(false);
  const [guardandoGestion, setGuardandoGestion] = useState(false);
  const [guardandoCalificaciones, setGuardandoCalificaciones] = useState(false);
  const [errorGestion, setErrorGestion] = useState('');
  const [mensajeGestion, setMensajeGestion] = useState('');

  const rolUsuarioActual = obtenerRolUsuario();
  const rolNormalizado = String(rolUsuarioActual || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');

  const esSuperAdministradorLocal =
    rolNormalizado === 'SUPER ADMINISTRADOR'
    || rolNormalizado === 'SUPERADMIN'
    || rolNormalizado === 'SUPER ADMIN';

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
    setActividadesPlanAccion([
      { idActividad: null, actividad: '', fechaCompromiso: '' },
    ]);
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
      setGestionMensual(null);
      setAnalisisMes('');
      setActividadesPlanAccion([
        { idActividad: null, actividad: '', fechaCompromiso: '' },
      ]);
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
        `${obtenerBaseApi()}/gestion-mensual-indicadores/${MODULO_GESTION_MENSUAL}/${CODIGO_INDICADOR_GESTION_MENSUAL}/${periodo.anio}/${periodo.mes}`,
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
      const actividades = result?.gestionMensual?.actividadesPlanAccion || [];
      setActividadesPlanAccion(
        actividades.length > 0
          ? actividades.map((item) => ({
              idActividad: item.idActividad ?? null,
              actividad: item.actividad || '',
              fechaCompromiso: item.fechaCompromiso || '',
              calificacion: item.calificacion ?? null,
              usuarioCalificacion: item.usuarioCalificacion || null,
              fechaCalificacion: item.fechaCalificacion || null,
              puedeCalificar: Boolean(item.puedeCalificar),
            }))
          : [{ idActividad: null, actividad: '', fechaCompromiso: '' }],
      );
    } catch (error) {
      console.error('Error consultando gestión mensual de Contratación:', error);
      setGestionMensual(null);
      setAnalisisMes('');
      setActividadesPlanAccion([
        { idActividad: null, actividad: '', fechaCompromiso: '' },
      ]);
      setErrorGestion(error.message || 'No fue posible consultar la gestión mensual.');
    } finally {
      setCargandoGestion(false);
    }
  };


  const guardarAnalisisAlSalir = async () => {
    if (!periodoMensualSeleccionado) return;

    const permisos = gestionMensual?.permisos || {};
    if (!permisos.puedeEditarAnalisis) return;

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
        `${obtenerBaseApi()}/gestion-mensual-indicadores/${MODULO_GESTION_MENSUAL}/${CODIGO_INDICADOR_GESTION_MENSUAL}/${periodoMensualSeleccionado.anio}/${periodoMensualSeleccionado.mes}/gestion`,
        {
          method: 'PUT',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ analisisMes }),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.detail || 'No fue posible guardar el análisis.');
      }

      setGestionMensual(result);
      setAnalisisMes(result?.gestionMensual?.analisisMes || '');
      setMensajeGestion('Análisis guardado correctamente.');
    } catch (error) {
      console.error('Error guardando análisis mensual:', error);
      setErrorGestion(error.message || 'No fue posible guardar el análisis.');
    } finally {
      setGuardandoGestion(false);
    }
  };

  const actualizarActividadLocal = (index, campo, valor) => {
    setActividadesPlanAccion((actuales) =>
      actuales.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [campo]: valor }
          : item,
      ),
    );
  };

  const agregarActividad = () => {
    setErrorGestion('');

    if (actividadesPlanAccion.length >= 5) {
      setErrorGestion('El plan de acción permite máximo 5 actividades.');
      return;
    }

    setActividadesPlanAccion((actuales) => [
      ...actuales,
      { idActividad: null, actividad: '', fechaCompromiso: '' },
    ]);
  };

  const eliminarActividad = (index) => {
    if (actividadesPlanAccion.length <= 1) {
      setErrorGestion('El plan de acción debe conservar al menos una actividad.');
      return;
    }

    setActividadesPlanAccion((actuales) =>
      actuales.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const validarActividades = () => {
    if (
      actividadesPlanAccion.length < 1
      || actividadesPlanAccion.length > 5
    ) {
      return 'El plan de acción debe contener entre 1 y 5 actividades.';
    }

    const incompleta = actividadesPlanAccion.some(
      (item) => !item.actividad.trim() || !item.fechaCompromiso,
    );

    if (incompleta) {
      return 'Cada actividad debe tener actividad y fecha de compromiso.';
    }

    return '';
  };

  const guardarPlanAccion = async () => {
    if (!periodoMensualSeleccionado) return;

    const permisos = gestionMensual?.permisos || {};

    if (
      !permisos.puedeEditarPlanAccion
      || esSuperAdministradorLocal
    ) {
      setErrorGestion(
        'El plan de acción está en solo lectura para este periodo o usuario.',
      );
      return;
    }

    const errorValidacion = validarActividades();
    if (errorValidacion) {
      setErrorGestion(errorValidacion);
      return;
    }

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
        `${obtenerBaseApi()}/gestion-mensual-indicadores/${MODULO_GESTION_MENSUAL}/${CODIGO_INDICADOR_GESTION_MENSUAL}/${periodoMensualSeleccionado.anio}/${periodoMensualSeleccionado.mes}/gestion`,
        {
          method: 'PUT',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            actividadesPlanAccion: actividadesPlanAccion.map((item) => ({
              idActividad: item.idActividad || undefined,
              actividad: item.actividad.trim(),
              fechaCompromiso: item.fechaCompromiso,
            })),
          }),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.detail || 'No fue posible guardar el plan de acción.');
      }

      setGestionMensual(result);

      const actividades = result?.gestionMensual?.actividadesPlanAccion || [];
      setActividadesPlanAccion(
        actividades.map((item) => ({
          ...item,
          actividad: item.actividad || '',
          fechaCompromiso: item.fechaCompromiso || '',
        })),
      );

      setMensajeGestion('Plan de acción guardado correctamente.');
    } catch (error) {
      console.error('Error guardando plan de acción:', error);
      setErrorGestion(error.message || 'No fue posible guardar el plan de acción.');
    } finally {
      setGuardandoGestion(false);
    }
  };

  const guardarGestionMensualCompleta = async () => {
    if (!periodoMensualSeleccionado) return;

    const permisos = gestionMensual?.permisos || {};
    const payload = {};

    if (permisos.puedeEditarAnalisis) {
      if (!analisisMes.trim()) {
        setErrorGestion('El análisis del mes no puede quedar vacío.');
        return;
      }
      payload.analisisMes = analisisMes;
    }

    if (
      permisos.puedeEditarPlanAccion
      && !esSuperAdministradorLocal
    ) {
      const errorValidacion = validarActividades();
      if (errorValidacion) {
        setErrorGestion(errorValidacion);
        return;
      }

      payload.actividadesPlanAccion = actividadesPlanAccion.map((item) => ({
        idActividad: item.idActividad || undefined,
        actividad: item.actividad.trim(),
        fechaCompromiso: item.fechaCompromiso,
      }));
    }

    if (Object.keys(payload).length === 0) return;

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
        `${obtenerBaseApi()}/gestion-mensual-indicadores/${MODULO_GESTION_MENSUAL}/${CODIGO_INDICADOR_GESTION_MENSUAL}/${periodoMensualSeleccionado.anio}/${periodoMensualSeleccionado.mes}/gestion`,
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
        throw new Error(result?.detail || 'No fue posible guardar la gestión mensual.');
      }

      setGestionMensual(result);
      setAnalisisMes(result?.gestionMensual?.analisisMes || '');

      const actividades = result?.gestionMensual?.actividadesPlanAccion || [];
      setActividadesPlanAccion(
        actividades.map((item) => ({
          ...item,
          actividad: item.actividad || '',
          fechaCompromiso: item.fechaCompromiso || '',
        })),
      );

      setMensajeGestion('Gestión mensual guardada correctamente.');
    } catch (error) {
      console.error('Error guardando gestión mensual de Contratación:', error);
      setErrorGestion(error.message || 'No fue posible guardar la gestión mensual.');
    } finally {
      setGuardandoGestion(false);
    }
  };

  const guardarCalificacionesActividades = async () => {
    if (!periodoMensualSeleccionado) return;

    const permisos = gestionMensual?.permisos || {};
    const actividadesGuardadas = actividadesPlanAccion.filter(
      (item) => Boolean(item.idActividad),
    );

    if (
      !esSuperAdministradorLocal
      || !permisos.puedeCalificarActividades
    ) {
      setErrorGestion(
        'Las calificaciones solo pueden ser registradas por el Super Administrador.',
      );
      return;
    }

    if (actividadesGuardadas.length === 0) {
      setErrorGestion(
        'El plan de acción todavía no tiene actividades guardadas para calificar.',
      );
      return;
    }

    const actividadesPayload = [];
    let existeCalificacion = false;

    for (const item of actividadesGuardadas) {
      const valorEntrada =
        item.calificacion === null
        || item.calificacion === undefined
        || String(item.calificacion).trim() === ''
          ? null
          : Number(String(item.calificacion).replace(',', '.'));

      if (
        valorEntrada !== null
        && (
          Number.isNaN(valorEntrada)
          || valorEntrada < 0
          || valorEntrada > 100
        )
      ) {
        setErrorGestion(
          `La calificación de "${item.actividad}" debe estar entre 0 y 100 %.`,
        );
        return;
      }

      if (valorEntrada !== null) {
        existeCalificacion = true;
      }

      actividadesPayload.push({
        idActividad: item.idActividad,
        calificacion:
          valorEntrada === null
            ? null
            : Number(valorEntrada.toFixed(2)),
      });
    }

    if (!existeCalificacion) {
      setErrorGestion(
        'Debe registrar al menos una calificación antes de guardar la evaluación.',
      );
      return;
    }

    try {
      setGuardandoCalificaciones(true);
      setErrorGestion('');
      setMensajeGestion('');

      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error(
          'No fue posible guardar las calificaciones porque no se encontró la sesión autenticada.',
        );
      }

      const response = await fetch(
        `${obtenerBaseApi()}/gestion-mensual-indicadores/${MODULO_GESTION_MENSUAL}/${CODIGO_INDICADOR_GESTION_MENSUAL}/${periodoMensualSeleccionado.anio}/${periodoMensualSeleccionado.mes}/actividades/calificaciones`,
        {
          method: 'PUT',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            actividades: actividadesPayload,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.detail
          || 'No fue posible guardar las calificaciones de las actividades.',
        );
      }

      setGestionMensual(result);

      const actividades =
        result?.gestionMensual?.actividadesPlanAccion || [];

      setActividadesPlanAccion(
        actividades.map((item) => ({
          idActividad: item.idActividad ?? null,
          actividad: item.actividad || '',
          fechaCompromiso: item.fechaCompromiso || '',
          calificacion: item.calificacion ?? null,
          usuarioCalificacion: item.usuarioCalificacion || null,
          fechaCalificacion: item.fechaCalificacion || null,
          puedeCalificar: Boolean(item.puedeCalificar),
        })),
      );

      setMensajeGestion(
        'Calificaciones guardadas correctamente. El plan de acción quedó cerrado para el área.',
      );
    } catch (error) {
      console.error(
        'Error guardando calificaciones de actividades:',
        error,
      );

      setErrorGestion(
        error.message
        || 'No fue posible guardar las calificaciones de las actividades.',
      );
    } finally {
      setGuardandoCalificaciones(false);
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
              actividadesPlanAccion={actividadesPlanAccion}
              cargando={cargandoGestion}
              guardandoGestion={guardandoGestion}
              guardandoCalificaciones={guardandoCalificaciones}
              error={errorGestion}
              mensaje={mensajeGestion}
              onGuardarGestion={guardarGestionMensualCompleta}
              onGuardarAnalisisBlur={guardarAnalisisAlSalir}
              onActualizarActividad={actualizarActividadLocal}
              onAgregarActividad={agregarActividad}
              onEliminarActividad={eliminarActividad}
              onGuardarPlan={guardarPlanAccion}
              onGuardarCalificaciones={guardarCalificacionesActividades}
              esSuperAdministradorLocal={esSuperAdministradorLocal}
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
  actividadesPlanAccion,
  cargando,
  guardandoGestion,
  guardandoCalificaciones,
  error,
  mensaje,
  onGuardarGestion,
  onGuardarAnalisisBlur,
  onActualizarActividad,
  onAgregarActividad,
  onEliminarActividad,
  onGuardarPlan,
  onGuardarCalificaciones,
  esSuperAdministradorLocal,
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

  const actividadesGuardadas = Array.isArray(detalle.actividadesPlanAccion)
    ? detalle.actividadesPlanAccion
    : [];

  // El frontend no inventa reglas de fechas.
  // Usa exactamente los permisos calculados por el backend:
  // - periodo actual: editable
  // - periodo anterior vacío: un solo guardado
  // - periodo anterior ya diligenciado: solo lectura
  // - periodo futuro: solo lectura
  const puedeEditarPlanLocal =
    Boolean(permisos.puedeEditarPlanAccion)
    && !esSuperAdministradorLocal;

  const actividadesVisibles = puedeEditarPlanLocal
    ? actividadesPlanAccion
    : actividadesPlanAccion.filter(
        (item) =>
          item?.idActividad
          || String(item?.actividad || '').trim()
          || item?.fechaCompromiso,
      );

  const esPlanLegacy =
    Boolean(detalle.planAccionLegacy)
    && Boolean(String(detalle.planAccion || '').trim())
    && actividadesGuardadas.length === 0;

  const totalActividades = actividadesGuardadas.length;

  const actividadesCalificadas = actividadesGuardadas.filter(
    (item) =>
      item?.calificacion !== null
      && item?.calificacion !== undefined
      && !Number.isNaN(Number(item.calificacion)),
  ).length;

  const sumaCalificaciones = actividadesGuardadas.reduce(
    (acumulado, item) => {
      const valor = Number(item?.calificacion);
      return acumulado + (Number.isNaN(valor) ? 0 : valor);
    },
    0,
  );

  const resultadoMensualAutomatico =
    totalActividades > 0
      ? Number((sumaCalificaciones / totalActividades).toFixed(2))
      : null;

  const puedeCalificarActividades =
    Boolean(permisos.puedeCalificarActividades)
    && esSuperAdministradorLocal;

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

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
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
              className="mt-4 min-h-[180px] w-full resize-y rounded-2xl border border-gray-300 bg-white p-4 text-sm text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-gray-50"
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Plan de acción
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Registre de 1 a 5 actividades con su fecha de compromiso. Se aplica la misma validación mensual ya existente del indicador.
                </p>
              </div>

              <span
                className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                  puedeEditarPlanLocal
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {esSuperAdministradorLocal
                  ? 'Solo lectura · califica actividades'
                  : detalle.planCerrado
                    ? 'Cerrado · calificado'
                    : textoPermiso(puedeEditarPlanLocal)}
              </span>
            </div>

            {esPlanLegacy && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-amber-800">
                  Plan de acción registrado con el formato anterior
                </p>
                <p className="mt-2 text-xs leading-5 text-amber-700">
                  Este periodo ya tiene un plan guardado. Se conserva en solo lectura
                  y no se reemplaza automáticamente por actividades.
                </p>
                <div className="mt-3 whitespace-pre-wrap rounded-xl border border-amber-200 bg-white p-4 text-sm leading-6 text-gray-800">
                  {detalle.planAccion}
                </div>
              </div>
            )}

            <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200">
              <div className="hidden grid-cols-[minmax(260px,1.55fr)_180px_160px] gap-3 bg-gray-900 px-4 py-3 text-xs font-bold uppercase tracking-wide text-white md:grid">
                <span>Actividad</span>
                <span>Fecha de compromiso</span>
                <span>Calificación</span>
              </div>

              <div className="divide-y divide-gray-100">
                {!puedeEditarPlanLocal
                  && actividadesVisibles.length === 0
                  && !esPlanLegacy && (
                    <div className="bg-white p-5 text-center text-sm font-semibold text-gray-500">
                      No hay actividades registradas en el plan de acción para este periodo.
                    </div>
                  )}

                {actividadesVisibles.map((item, index) => {
                  const guardada = Boolean(item.idActividad);
                  const puedeCalificar = Boolean(item.puedeCalificar);

                  return (
                    <div
                      key={item.idActividad || `actividad-nueva-${index}`}
                      className="grid grid-cols-1 gap-3 bg-white p-4 md:grid-cols-[minmax(260px,1.55fr)_180px_160px]"
                    >
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-500 md:hidden">
                          Actividad
                        </label>
                        {puedeEditarPlanLocal ? (
                          <div className="flex gap-2">
                            <textarea
                              value={item.actividad}
                              onChange={(event) =>
                                onActualizarActividad(index, 'actividad', event.target.value)
                              }
                              disabled={guardandoGestion}
                              maxLength={1000}
                              rows={2}
                              placeholder={`Actividad ${index + 1}`}
                              className="min-h-[70px] flex-1 resize-y rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-gray-50"
                            />

                            {actividadesPlanAccion.length > 1 && (
                              <button
                                type="button"
                                onClick={() => onEliminarActividad(index)}
                                disabled={guardandoGestion}
                                className="h-10 rounded-lg border border-red-200 px-3 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                title="Eliminar actividad"
                              >
                                Quitar
                              </button>
                            )}
                          </div>
                        ) : (
                          <p className="rounded-xl bg-gray-50 px-3 py-3 text-sm font-semibold text-gray-800">
                            {item.actividad || 'Sin actividad'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-500 md:hidden">
                          Fecha de compromiso
                        </label>
                        {puedeEditarPlanLocal ? (
                          <input
                            type="date"
                            value={item.fechaCompromiso || ''}
                            onChange={(event) =>
                              onActualizarActividad(
                                index,
                                'fechaCompromiso',
                                event.target.value,
                              )
                            }
                            disabled={guardandoGestion}
                            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm font-semibold text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-gray-50"
                          />
                        ) : (
                          <p className="rounded-xl bg-gray-50 px-3 py-3 text-sm font-semibold text-gray-800">
                            {item.fechaCompromiso || 'Sin fecha'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-500 md:hidden">
                          Calificación
                        </label>

                        {guardada && puedeCalificarActividades && puedeCalificar ? (
                          <div>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={
                                  item.calificacion === null
                                  || item.calificacion === undefined
                                    ? ''
                                    : item.calificacion
                                }
                                onChange={(event) =>
                                  onActualizarActividad(
                                    index,
                                    'calificacion',
                                    event.target.value,
                                  )
                                }
                                disabled={guardandoCalificaciones}
                                placeholder="0 - 100"
                                className="w-full rounded-xl border border-violet-300 bg-white px-3 py-3 pr-8 text-sm font-bold text-gray-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-gray-50"
                              />
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-black text-violet-700">
                                %
                              </span>
                            </div>

                            <p className="mt-1 text-[11px] leading-4 text-gray-500">
                              {item.calificacion === null
                              || item.calificacion === undefined
                              || String(item.calificacion).trim() === ''
                                ? 'Sin calificación: contará como 0 %'
                                : 'Calificación lista para guardar'}
                            </p>
                          </div>
                        ) : item.calificacion !== null &&
                          item.calificacion !== undefined ? (
                          <div>
                            <div className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-3 text-center text-lg font-black text-violet-800">
                              {Number(item.calificacion)
                                .toFixed(2)
                                .replace('.', ',')} %
                            </div>
                            {item.usuarioCalificacion && (
                              <p className="mt-1 text-[11px] leading-4 text-gray-500">
                                {item.usuarioCalificacion}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-center text-xs font-semibold text-gray-500">
                            {guardada
                              ? 'Pendiente de calificación'
                              : 'Guarde el plan primero'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {esSuperAdministradorLocal
              && puedeCalificarActividades
              && actividadesGuardadas.length > 0 && (
                <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-violet-200 bg-violet-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-violet-900">
                      Calificación del plan de acción
                    </p>
                    <p className="mt-1 text-xs leading-5 text-violet-700">
                      Ingrese las calificaciones que correspondan y guárdelas todas en un solo paso.
                      Las actividades sin nota cuentan como 0 % en el resultado mensual.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onGuardarCalificaciones}
                    disabled={guardandoCalificaciones}
                    className="shrink-0 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-violet-300"
                  >
                    {guardandoCalificaciones
                      ? 'Guardando calificaciones...'
                      : 'Guardar calificaciones'}
                  </button>
                </div>
              )}

            {puedeEditarPlanLocal && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onAgregarActividad}
                  disabled={guardandoGestion || actividadesPlanAccion.length >= 5}
                  className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Agregar actividad
                </button>

                <button
                  type="button"
                  onClick={onGuardarPlan}
                  disabled={guardandoGestion}
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  {guardandoGestion ? 'Guardando...' : 'Guardar plan de acción'}
                </button>
              </div>
            )}

            {!esSuperAdministradorLocal && detalle.planCerrado && (
              <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs font-semibold leading-5 text-violet-800">
                Este plan ya fue calificado por Super Administrador. El análisis,
                las actividades y las fechas quedaron cerrados en modo lectura.
              </div>
            )}

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
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-base font-bold text-gray-900">
                  Calificación mensual
                </h3>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                  Resultado automático
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                El resultado mensual se calcula automáticamente sumando las
                calificaciones registradas y dividiendo siempre entre el total de
                actividades comprometidas. Una actividad sin calificación cuenta
                como 0 % para el resultado.
              </p>

              <p className="mt-2 text-xs font-semibold text-gray-600">
                {totalActividades > 0
                  ? `${actividadesCalificadas} de ${totalActividades} actividades calificadas.`
                  : 'El plan de acción aún no tiene actividades guardadas.'}
              </p>

              {detalle.usuarioCalificacion && actividadesCalificadas > 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  Última calificación registrada por{' '}
                  <span className="font-semibold text-gray-700">
                    {detalle.usuarioCalificacion}
                  </span>
                  {' · '}
                  {formatearFechaColombia(detalle.fechaCalificacion)}
                </p>
              )}
            </div>

            <div className="min-w-[210px] rounded-2xl border border-violet-200 bg-violet-50 px-6 py-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                Resultado
              </p>
              <p className="mt-1 text-3xl font-bold text-violet-800">
                {resultadoMensualAutomatico !== null
                  ? `${resultadoMensualAutomatico
                      .toFixed(2)
                      .replace('.', ',')} %`
                  : 'Pendiente'}
              </p>

              {totalActividades > 0 && actividadesCalificadas < totalActividades && (
                <p className="mt-2 text-[11px] font-semibold text-violet-600">
                  Las actividades sin calificación se toman como 0 %
                </p>
              )}
            </div>
          </div>
        </div>

        {(permisos.puedeEditarAnalisis ||
          puedeEditarPlanLocal) && (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-gray-500">
              El plan de acción usa la misma validación mensual del análisis:
              cuando el periodo lo permite, el líder registra las actividades y fechas;
              las calificaciones individuales son registradas por el Super Administrador.
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