import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  RefreshCw,
  Users,
  CheckCircle2,
  Clock,
  PieChart,
  TrendingUp,
  Building2,
  AlertCircle,
  WalletCards,
  Crown,
  Filter,
  RotateCcw,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import { Button } from '@/components/ui/button';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';

const MODULO_GESTION_MENSUAL = 'NOMINA_RETIROS';
const CODIGO_INDICADOR_GESTION_MENSUAL = 'PANEL_GERENCIAL';

const coloresEstado = {
  Abierto: '#F59E0B',
  Cerrado: '#059669',
  Retirado: '#334155',
};

const mesesOrden = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const mesesOpciones = [
  { value: 'todos', label: 'Todos los meses' },
  { value: 'enero', label: 'Enero' },
  { value: 'febrero', label: 'Febrero' },
  { value: 'marzo', label: 'Marzo' },
  { value: 'abril', label: 'Abril' },
  { value: 'mayo', label: 'Mayo' },
  { value: 'junio', label: 'Junio' },
  { value: 'julio', label: 'Julio' },
  { value: 'agosto', label: 'Agosto' },
  { value: 'septiembre', label: 'Septiembre' },
  { value: 'octubre', label: 'Octubre' },
  { value: 'noviembre', label: 'Noviembre' },
  { value: 'diciembre', label: 'Diciembre' },
];

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

  return localStorage.getItem('rol') || localStorage.getItem('role') || '';
};

const indicadoresIniciales = {
  totales: {
    abiertos: 0,
    cerrados: 0,
    retirados: 0,
    total: 0,
  },
  distribucionEstados: [],
  retirosPorMes: [],
};

const normalizarTexto = (valor, defecto = 'SIN INFORMACIÓN') => {
  const texto = String(valor || defecto)
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return texto || defecto;
};

const extraerMesAnio = (valorMes) => {
  const texto = normalizarTexto(valorMes, '').toLowerCase();
  const partes = texto.split('-');

  if (partes.length >= 2) {
    return {
      mesNombre: partes[0],
      anio: partes[1],
    };
  }

  return {
    mesNombre: texto,
    anio: '',
  };
};

const ordenarMeses = (items) => {
  return [...items].sort((a, b) => {
    const mesA = extraerMesAnio(a.mes);
    const mesB = extraerMesAnio(b.mes);

    const anioA = Number(mesA.anio || 0);
    const anioB = Number(mesB.anio || 0);

    if (anioA !== anioB) return anioA - anioB;

    return mesesOrden.indexOf(mesA.mesNombre) - mesesOrden.indexOf(mesB.mesNombre);
  });
};

const mapRetiroApi = (item) => ({
  id: item.IdRetiroLaboral,
  idRetiroLaboral: item.IdRetiroLaboral,
  identificacion: item.NumeroIdentificacion || '',
  nombre: normalizarTexto(`${item.Nombres || ''} ${item.Apellidos || ''}`, 'SIN NOMBRE'),
  cliente: normalizarTexto(item.NombreCliente, 'SIN CLIENTE'),
  fechaRetiro: item.FechaRetiro || '',
  fechaPagoLiquidacion: item.FechaPagoLiquidacion || '',
  estado: Number(item.IdEstadoProceso),
  estadoTexto: item.EstadoProceso || item.EstadoCasoRRLL || 'Sin estado',
  estadoCasoRRLL: item.EstadoCasoRRLL || '',
  puedeGestionarNomina: Boolean(item.PuedeGestionarNomina),
});

const grupoEstadoRetiro = (r) => {
  const estadoId = Number(r.estado);
  const texto = String(r.estadoTexto || r.estadoCasoRRLL || '').toLowerCase();

  if (estadoId === 35 || texto.includes('retirado')) return 'Retirado';

  if (
    estadoId === 32 ||
    texto.includes('enviado a nómina') ||
    texto.includes('enviado a nomina') ||
    texto.includes('cerrado')
  ) {
    return 'Cerrado';
  }

  return 'Abierto';
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white border rounded-xl shadow-lg p-3 text-sm">
      <p className="font-bold text-gray-800">{label}</p>
      <p className="text-emerald-700 font-semibold">
        {payload[0]?.value || 0} retiros
      </p>
    </div>
  );
};

const IndicadoresNominaView = () => {
  const [indicadores, setIndicadores] = useState(indicadoresIniciales);
  const [retiros, setRetiros] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [anioSeleccionado, setAnioSeleccionado] = useState('todos');
  const [mesSeleccionado, setMesSeleccionado] = useState('todos');
  const [anioFiltro, setAnioFiltro] = useState('todos');
  const [mesFiltro, setMesFiltro] = useState('todos');

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

  const periodoMensualSeleccionado = useMemo(() => {
    if (anioSeleccionado === 'todos' || mesSeleccionado === 'todos') {
      return null;
    }

    const numeroMes = mesesOrden.indexOf(mesSeleccionado) + 1;

    if (!numeroMes) return null;

    return {
      anio: Number(anioSeleccionado),
      mes: numeroMes,
    };
  }, [anioSeleccionado, mesSeleccionado]);

  const periodoCompletoSeleccionado = Boolean(periodoMensualSeleccionado);

  const cargarActividadesGestion = (resultado) => {
    const actividades =
      resultado?.gestionMensual?.actividadesPlanAccion || [];

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

  const consultarGestionMensual = async (periodo) => {
    if (!periodo?.anio || !periodo?.mes) {
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
      const response = await fetch(
        `${API_BASE_URL}/gestion-mensual-indicadores/${MODULO_GESTION_MENSUAL}/${CODIGO_INDICADOR_GESTION_MENSUAL}/${periodo.anio}/${periodo.mes}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result?.detail ||
          'No fue posible consultar la gestión mensual de Nómina.',
        );
      }

      setGestionMensual(result);
      setAnalisisMes(result?.gestionMensual?.analisisMes || '');
      cargarActividadesGestion(result);
    } catch (error) {
      console.error('Error consultando gestión mensual de Nómina:', error);
      limpiarGestionMensual();
      setErrorGestion(
        error?.message ||
        'No fue posible consultar la gestión mensual de Nómina.',
      );
    } finally {
      setCargandoGestion(false);
    }
  };

  const guardarAnalisisAlSalir = async () => {
    if (!periodoMensualSeleccionado) return;

    const permisos = gestionMensual?.permisos || {};

    if (!permisos.puedeEditarAnalisis) return;

    const valorActual = analisisMes.trim();
    if (!valorActual) return;

    const token = localStorage.getItem('token');

    if (!token) {
      setErrorGestion(
        'No fue posible guardar porque no se encontró la sesión autenticada.',
      );
      return;
    }

    try {
      setGuardandoGestion(true);
      setErrorGestion('');

      const response = await fetch(
        `${API_BASE_URL}/gestion-mensual-indicadores/${MODULO_GESTION_MENSUAL}/${CODIGO_INDICADOR_GESTION_MENSUAL}/${periodoMensualSeleccionado.anio}/${periodoMensualSeleccionado.mes}/gestion`,
        {
          method: 'PUT',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ analisisMes: valorActual }),
        },
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.detail || 'No fue posible guardar el análisis.');
      }

      setGestionMensual(result);
      setAnalisisMes(result?.gestionMensual?.analisisMes || '');
      cargarActividadesGestion(result);
    } catch (error) {
      console.error('Error guardando análisis mensual de Nómina:', error);
      setErrorGestion(
        error?.message || 'No fue posible guardar el análisis.',
      );
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
      setErrorGestion(
        'El plan de acción debe conservar al menos una actividad.',
      );
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
      (item) =>
        !String(item.actividad || '').trim()
        || !item.fechaCompromiso,
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

    const token = localStorage.getItem('token');

    if (!token) {
      setErrorGestion(
        'No fue posible guardar porque no se encontró la sesión autenticada.',
      );
      return;
    }

    try {
      setGuardandoGestion(true);
      setErrorGestion('');
      setMensajeGestion('');

      const response = await fetch(
        `${API_BASE_URL}/gestion-mensual-indicadores/${MODULO_GESTION_MENSUAL}/${CODIGO_INDICADOR_GESTION_MENSUAL}/${periodoMensualSeleccionado.anio}/${periodoMensualSeleccionado.mes}/gestion`,
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
              actividad: String(item.actividad || '').trim(),
              fechaCompromiso: item.fechaCompromiso,
            })),
          }),
        },
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result?.detail || 'No fue posible guardar el plan de acción.',
        );
      }

      setGestionMensual(result);
      setAnalisisMes(result?.gestionMensual?.analisisMes || '');
      cargarActividadesGestion(result);
      setMensajeGestion('Plan de acción guardado correctamente.');
    } catch (error) {
      console.error('Error guardando plan de acción de Nómina:', error);
      setErrorGestion(
        error?.message || 'No fue posible guardar el plan de acción.',
      );
    } finally {
      setGuardandoGestion(false);
    }
  };

  const guardarGestionMensual = async () => {
    if (!periodoMensualSeleccionado || !gestionMensual) return;

    const permisos = gestionMensual?.permisos || {};
    const payload = {};

    if (permisos.puedeEditarAnalisis && analisisMes.trim()) {
      payload.analisisMes = analisisMes.trim();
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

      payload.actividadesPlanAccion =
        actividadesPlanAccion.map((item) => ({
          idActividad: item.idActividad || undefined,
          actividad: String(item.actividad || '').trim(),
          fechaCompromiso: item.fechaCompromiso,
        }));
    }

    if (Object.keys(payload).length === 0) {
      setMensajeGestion('Los cambios ya se encuentran guardados.');
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      setErrorGestion(
        'No fue posible guardar porque no se encontró la sesión autenticada.',
      );
      return;
    }

    try {
      setGuardandoGestion(true);
      setErrorGestion('');
      setMensajeGestion('');

      const response = await fetch(
        `${API_BASE_URL}/gestion-mensual-indicadores/${MODULO_GESTION_MENSUAL}/${CODIGO_INDICADOR_GESTION_MENSUAL}/${periodoMensualSeleccionado.anio}/${periodoMensualSeleccionado.mes}/gestion`,
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

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result?.detail || 'No fue posible guardar la gestión mensual.',
        );
      }

      setGestionMensual(result);
      setAnalisisMes(result?.gestionMensual?.analisisMes || '');
      cargarActividadesGestion(result);
      setMensajeGestion('Gestión mensual guardada correctamente.');
    } catch (error) {
      console.error('Error guardando gestión mensual de Nómina:', error);
      setErrorGestion(
        error?.message || 'No fue posible guardar la gestión mensual.',
      );
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

    const token = localStorage.getItem('token');

    if (!token) {
      setErrorGestion(
        'No fue posible guardar las calificaciones porque no se encontró la sesión autenticada.',
      );
      return;
    }

    try {
      setGuardandoCalificaciones(true);
      setErrorGestion('');
      setMensajeGestion('');

      const response = await fetch(
        `${API_BASE_URL}/gestion-mensual-indicadores/${MODULO_GESTION_MENSUAL}/${CODIGO_INDICADOR_GESTION_MENSUAL}/${periodoMensualSeleccionado.anio}/${periodoMensualSeleccionado.mes}/actividades/calificaciones`,
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

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result?.detail ||
          'No fue posible guardar las calificaciones de las actividades.',
        );
      }

      setGestionMensual(result);
      setAnalisisMes(result?.gestionMensual?.analisisMes || '');
      cargarActividadesGestion(result);
      setMensajeGestion(
        'Calificaciones guardadas correctamente. El plan de acción quedó cerrado para Nómina.',
      );
    } catch (error) {
      console.error(
        'Error guardando calificaciones de actividades de Nómina:',
        error,
      );
      setErrorGestion(
        error?.message ||
        'No fue posible guardar las calificaciones de las actividades.',
      );
    } finally {
      setGuardandoCalificaciones(false);
    }
  };


  const cargarIndicadores = async () => {
    setCargando(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      const [responseIndicadores, responseRetiros] = await Promise.all([
        fetch(`${API_BASE_URL}/nomina-retiros/indicadores`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }),
        fetch(`${API_BASE_URL}/nomina-retiros`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }),
      ]);

      const dataIndicadores = await responseIndicadores.json().catch(() => ({}));
      const dataRetiros = await responseRetiros.json().catch(() => ({}));

      if (!responseIndicadores.ok || !dataIndicadores.success) {
        throw new Error(
          dataIndicadores?.detail ||
          dataIndicadores?.message ||
          'No fue posible consultar indicadores.'
        );
      }

      if (!responseRetiros.ok || !dataRetiros.success) {
        throw new Error(
          dataRetiros?.detail ||
          dataRetiros?.message ||
          'No fue posible consultar retiros.'
        );
      }

      setIndicadores({
        ...indicadoresIniciales,
        ...(dataIndicadores.data || {}),
        totales: {
          ...indicadoresIniciales.totales,
          ...(dataIndicadores.data?.totales || {}),
        },
      });

      const lista = Array.isArray(dataRetiros.data) ? dataRetiros.data.map(mapRetiroApi) : [];
      setRetiros(lista);
    } catch (err) {
      console.error('Error cargando indicadores de nómina:', err);
      setError(err.message || 'Error cargando indicadores de nómina.');
      setIndicadores(indicadoresIniciales);
      setRetiros([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarIndicadores();
  }, []);

  useEffect(() => {
    if (!periodoMensualSeleccionado) {
      limpiarGestionMensual();
      return;
    }

    consultarGestionMensual(periodoMensualSeleccionado);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    periodoMensualSeleccionado?.anio,
    periodoMensualSeleccionado?.mes,
  ]);

  const aplicarFiltroPeriodo = () => {
    setAnioSeleccionado(anioFiltro);
    setMesSeleccionado(mesFiltro);
    setEstadoSeleccionado(null);
  };

  const limpiarFiltroPeriodo = () => {
    setAnioFiltro('todos');
    setMesFiltro('todos');
    setAnioSeleccionado('todos');
    setMesSeleccionado('todos');
    setEstadoSeleccionado(null);
  };

  const periodoFiltroAplicado =
    anioSeleccionado !== 'todos' || mesSeleccionado !== 'todos';

  const retirosPeriodo = useMemo(() => {
    if (!periodoFiltroAplicado) return retiros;

    return retiros.filter((retiro) => {
      const fechaRetiro = String(retiro.fechaRetiro || '').slice(0, 10);
      const [anioRetiro, mesRetiro] = fechaRetiro.split('-').map(Number);
      const nombreMesRetiro = mesesOrden[mesRetiro - 1] || '';

      const coincideAnio =
        anioSeleccionado === 'todos'
        || anioRetiro === Number(anioSeleccionado);
      const coincideMes =
        mesSeleccionado === 'todos'
        || nombreMesRetiro === mesSeleccionado;

      return coincideAnio && coincideMes;
    });
  }, [retiros, periodoFiltroAplicado, anioSeleccionado, mesSeleccionado]);

  const totalesPeriodo = useMemo(() => {
    if (!periodoFiltroAplicado) {
      return {
        total: indicadores?.totales?.total || 0,
        abiertos: indicadores?.totales?.abiertos || 0,
        cerrados: indicadores?.totales?.cerrados || 0,
        retirados: indicadores?.totales?.retirados || 0,
      };
    }

    return retirosPeriodo.reduce(
      (totales, retiro) => {
        const grupo = grupoEstadoRetiro(retiro);

        totales.total += 1;
        if (grupo === 'Abierto') totales.abiertos += 1;
        if (grupo === 'Cerrado') totales.cerrados += 1;
        if (grupo === 'Retirado') totales.retirados += 1;

        return totales;
      },
      { total: 0, abiertos: 0, cerrados: 0, retirados: 0 },
    );
  }, [indicadores, periodoFiltroAplicado, retirosPeriodo]);

  const total = totalesPeriodo.total;
  const abiertos = totalesPeriodo.abiertos;
  const cerrados = totalesPeriodo.cerrados;
  const retirados = totalesPeriodo.retirados;

  const dataEstados = useMemo(() => {
    const base = !periodoFiltroAplicado && indicadores?.distribucionEstados?.length
      ? indicadores.distribucionEstados
      : [
          { estado: 'Abierto', cantidad: abiertos },
          { estado: 'Cerrado', cantidad: cerrados },
          { estado: 'Retirado', cantidad: retirados },
        ];

    return base.map((item) => ({
      ...item,
      estado: item.estado || 'Sin estado',
      cantidad: Number(item.cantidad || 0),
      porcentaje: total > 0 ? Math.round((Number(item.cantidad || 0) / total) * 100) : 0,
    }));
  }, [indicadores, periodoFiltroAplicado, total, abiertos, cerrados, retirados]);

  const estadoPrincipal = useMemo(() => {
    if (!dataEstados.length) return null;
    return [...dataEstados].sort((a, b) => Number(b.cantidad || 0) - Number(a.cantidad || 0))[0];
  }, [dataEstados]);

  const estadoActivo =
    dataEstados.find((item) => item.estado === estadoSeleccionado?.estado)
    || estadoPrincipal;

  useEffect(() => {
    if (!estadoSeleccionado && estadoPrincipal) {
      setEstadoSeleccionado(estadoPrincipal);
    }
  }, [estadoPrincipal, estadoSeleccionado]);

  const dataMesesBase = useMemo(() => {
    const meses = Array.isArray(indicadores?.retirosPorMes) ? indicadores.retirosPorMes : [];

    return ordenarMeses(
      meses.map((item) => ({
        ...item,
        cantidad: Number(item.cantidad || 0),
      }))
    );
  }, [indicadores]);

  const aniosDisponibles = useMemo(() => {
    const anios = new Set();

    dataMesesBase.forEach((item) => {
      const { anio } = extraerMesAnio(item.mes);
      if (anio) anios.add(anio);
    });

    return [...anios].sort((a, b) => Number(b) - Number(a));
  }, [dataMesesBase]);

  const dataMesesFiltrada = useMemo(() => {
    const filtrada = dataMesesBase.filter((item) => {
      const { mesNombre, anio } = extraerMesAnio(item.mes);

      const coincideAnio = anioSeleccionado === 'todos' || anio === anioSeleccionado;
      const coincideMes = mesSeleccionado === 'todos' || mesNombre === mesSeleccionado;

      return coincideAnio && coincideMes;
    });

    if (anioSeleccionado === 'todos' && mesSeleccionado === 'todos') {
      return filtrada.slice(-12);
    }

    return filtrada;
  }, [dataMesesBase, anioSeleccionado, mesSeleccionado]);

  const totalPeriodo = useMemo(() => {
    return dataMesesFiltrada.reduce((acc, item) => acc + Number(item.cantidad || 0), 0);
  }, [dataMesesFiltrada]);

  const promedioMensualPeriodo = dataMesesFiltrada.length > 0
    ? (totalPeriodo / dataMesesFiltrada.length).toFixed(2).replace('.', ',')
    : '0';

  const mesMayorPeriodo = useMemo(() => {
    if (!dataMesesFiltrada.length) return null;

    return [...dataMesesFiltrada].sort(
      (a, b) => Number(b.cantidad || 0) - Number(a.cantidad || 0)
    )[0];
  }, [dataMesesFiltrada]);

  const textoPeriodo = useMemo(() => {
    if (anioSeleccionado === 'todos' && mesSeleccionado === 'todos') {
      return `Últimos ${dataMesesFiltrada.length || 0} meses disponibles.`;
    }

    if (anioSeleccionado !== 'todos' && mesSeleccionado !== 'todos') {
      const mesLabel = mesesOpciones.find((m) => m.value === mesSeleccionado)?.label || mesSeleccionado;
      return `${mesLabel} de ${anioSeleccionado}.`;
    }

    if (anioSeleccionado !== 'todos') {
      return `Año ${anioSeleccionado}.`;
    }

    const mesLabel = mesesOpciones.find((m) => m.value === mesSeleccionado)?.label || mesSeleccionado;
    return `Mes ${mesLabel} en todos los años.`;
  }, [anioSeleccionado, mesSeleccionado, dataMesesFiltrada.length]);

  const totalPendientesPago = useMemo(() => {
    return retirosPeriodo.filter(
      (r) => grupoEstadoRetiro(r) === 'Cerrado' && !r.fechaPagoLiquidacion,
    ).length;
  }, [retirosPeriodo]);

  const porcentajeFinalizacion = total > 0 ? Math.round((retirados / total) * 100) : 0;
  const porcentajeGestionable = total > 0 ? Math.round((cerrados / total) * 100) : 0;
  const porcentajeAbiertos = total > 0 ? Math.round((abiertos / total) * 100) : 0;

  const topClientes = useMemo(() => {
    const acumulado = {};

    retirosPeriodo.forEach((retiro) => {
      const cliente = normalizarTexto(retiro.cliente, 'SIN CLIENTE').toUpperCase();
      acumulado[cliente] = (acumulado[cliente] || 0) + 1;
    });

    return Object.entries(acumulado)
      .map(([cliente, cantidad]) => ({ cliente, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);
  }, [retirosPeriodo]);

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-3xl shadow-md border p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100 text-emerald-700 rounded-2xl p-4 shadow-sm">
              <BarChart3 className="w-8 h-8" />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">Indicadores de Nómina</h1>
              <p className="text-sm text-gray-500">
                Seguimiento visual de los retiros gestionados por nómina.
              </p>
              <span className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                <PieChart className="w-4 h-4" />
                Vista general
              </span>
            </div>
          </div>

          <Button
            type="button"
            onClick={cargarIndicadores}
            disabled={cargando}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${cargando ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
      </div>

      <div className="rounded-3xl border bg-white p-6 shadow-md">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
              <Filter className="h-4 w-4" />
              Filtro del periodo
            </div>
            <h2 className="mt-1 text-xl font-bold text-gray-900">
              Consultar indicadores por año y mes
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Selecciona un año y un mes específico para consultar el periodo y habilitar la gestión mensual.
            </p>
          </div>

          <div className="rounded-2xl border bg-gray-50 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(180px,1fr)_minmax(200px,1fr)_auto] sm:items-end">
              <label className="text-xs font-bold text-gray-600">
                Año
                <select
                  value={anioFiltro}
                  onChange={(e) => setAnioFiltro(e.target.value)}
                  className="mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  <option value="todos">Todos los años</option>
                  {aniosDisponibles.map((anio) => (
                    <option key={anio} value={anio}>
                      {anio}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-bold text-gray-600">
                Mes
                <select
                  value={mesFiltro}
                  onChange={(e) => setMesFiltro(e.target.value)}
                  className="mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  {mesesOpciones.map((mes) => (
                    <option key={mes.value} value={mes.value}>
                      {mes.label}
                    </option>
                  ))}
                </select>
              </label>

              <Button
                type="button"
                onClick={aplicarFiltroPeriodo}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filtrar
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={limpiarFiltroPeriodo}
              className="mt-3 border-gray-900 bg-gray-900 text-white hover:bg-gray-800 hover:text-white"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Limpiar
            </Button>
          </div>
        </div>

        {!periodoCompletoSeleccionado
          && (anioSeleccionado !== 'todos' || mesSeleccionado !== 'todos') && (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-700">
            Selecciona un año y un mes específico para abrir el análisis, el plan de acción y la calificación mensual.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl shadow-md border p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 font-semibold">Total retiros</p>
              <p className="text-4xl font-black text-gray-900 mt-2">{cargando ? '...' : total}</p>
            </div>
            <div className="bg-emerald-50 text-emerald-700 rounded-2xl p-4">
              <Users className="w-7 h-7" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md border p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 font-semibold">Abiertos RRLL</p>
              <p className="text-4xl font-black text-yellow-700 mt-2">{cargando ? '...' : abiertos}</p>
            </div>
            <div className="bg-yellow-50 text-yellow-700 rounded-2xl p-4">
              <Clock className="w-7 h-7" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md border p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 font-semibold">Cerrados</p>
              <p className="text-4xl font-black text-emerald-700 mt-2">{cargando ? '...' : cerrados}</p>
            </div>
            <div className="bg-emerald-50 text-emerald-700 rounded-2xl p-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md border p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 font-semibold">Retirados</p>
              <p className="text-4xl font-black text-gray-700 mt-2">{cargando ? '...' : retirados}</p>
            </div>
            <div className="bg-gray-100 text-gray-700 rounded-2xl p-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-md border p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-emerald-50 text-emerald-700 rounded-2xl p-3">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Indicadores de gestión</h2>
            <p className="text-sm text-gray-500">
              Resumen operativo general del proceso de retiros.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-2xl border bg-yellow-50 p-6">
            <div className="flex justify-between items-start gap-3">
              <div>
                <p className="text-sm font-bold text-yellow-800">Pendientes por RRLL</p>
                <p className="text-4xl font-black text-yellow-900 mt-3">
                  {cargando ? '...' : abiertos}
                </p>
                <p className="text-xs text-yellow-700 mt-3">
                  Casos abiertos que nómina visualiza solo como consulta.
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-700" />
            </div>
          </div>

          <div className="rounded-2xl border bg-emerald-50 p-6">
            <div className="flex justify-between items-start gap-3">
              <div>
                <p className="text-sm font-bold text-emerald-800">Gestionables por Nómina</p>
                <p className="text-4xl font-black text-emerald-900 mt-3">
                  {cargando ? '...' : cerrados}
                </p>
                <p className="text-xs text-emerald-700 mt-3">
                  Casos cerrados por RRLL que nómina puede gestionar.
                </p>
              </div>
              <WalletCards className="w-8 h-8 text-emerald-700" />
            </div>
          </div>

          <div className="rounded-2xl border bg-red-50 p-6">
            <div className="flex justify-between items-start gap-3">
              <div>
                <p className="text-sm font-bold text-red-800">Cerrados sin fecha de pago</p>
                <p className="text-4xl font-black text-red-900 mt-3">
                  {cargando ? '...' : totalPendientesPago}
                </p>
                <p className="text-xs text-red-700 mt-3">
                  Casos en gestión que aún no tienen fecha de pago de liquidación.
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-700" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          <div className="bg-gray-50 rounded-2xl p-5 border">
            <p className="text-xs text-gray-500 font-semibold">Avance de finalización</p>
            <p className="text-3xl font-black text-gray-900 mt-2">{porcentajeFinalizacion}%</p>
            <p className="text-xs text-gray-500 mt-2">Retiros finalizados frente al total.</p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-5 border">
            <p className="text-xs text-gray-500 font-semibold">Carga actual de Nómina</p>
            <p className="text-3xl font-black text-gray-900 mt-2">{porcentajeGestionable}%</p>
            <p className="text-xs text-gray-500 mt-2">Casos cerrados disponibles para gestión.</p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-5 border">
            <p className="text-xs text-gray-500 font-semibold">Pendiente RRLL</p>
            <p className="text-3xl font-black text-gray-900 mt-2">{porcentajeAbiertos}%</p>
            <p className="text-xs text-gray-500 mt-2">Casos abiertos frente al total.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-3xl shadow-md border p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-blue-50 text-blue-700 rounded-2xl p-3">
              <PieChart className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Distribución por estados</h2>
              <p className="text-sm text-gray-500">
                Selecciona un color para ver el detalle de ese estado.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
            <div className="lg:col-span-3 h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={dataEstados}
                    dataKey="cantidad"
                    nameKey="estado"
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={130}
                    paddingAngle={3}
                    label={({ estado, porcentaje }) => `${estado}: ${porcentaje}%`}
                    onClick={(data) => setEstadoSeleccionado(data)}
                  >
                    {dataEstados.map((entry) => (
                      <Cell
                        key={entry.estado}
                        fill={coloresEstado[entry.estado] || '#64748B'}
                        stroke={estadoActivo?.estado === entry.estado ? '#111827' : '#ffffff'}
                        strokeWidth={estadoActivo?.estado === entry.estado ? 3 : 2}
                        className="cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-2 space-y-3">
              {dataEstados.map((item) => (
                <button
                  key={item.estado}
                  type="button"
                  onClick={() => setEstadoSeleccionado(item)}
                  className={`w-full text-left rounded-2xl border p-4 transition ${
                    estadoActivo?.estado === item.estado
                      ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: coloresEstado[item.estado] || '#64748B' }}
                      />
                      <div>
                        <p className="font-bold text-gray-900">{item.estado}</p>
                        <p className="text-xs text-gray-500">{item.cantidad} retiros</p>
                      </div>
                    </div>

                    <p className="font-black text-gray-900">{item.porcentaje}%</p>
                  </div>
                </button>
              ))}

              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-800 font-semibold">
                Datos actualizados desde la información real del sistema.
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-md border p-6">
          <h2 className="text-xl font-bold text-gray-900">Estado seleccionado</h2>
          <p className="text-sm text-gray-500 mb-6">Detalle del estado elegido en la gráfica.</p>

          <div
            className="rounded-3xl text-white p-6 shadow-md"
            style={{ backgroundColor: coloresEstado[estadoActivo?.estado] || '#059669' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Crown className="w-6 h-6" />
              </div>

              <div>
                <p className="text-sm font-bold">Estado</p>
                <p className="text-3xl font-black mt-1">
                  {estadoActivo?.estado || 'Sin datos'}
                </p>
              </div>
            </div>

            <p className="text-6xl font-black mt-6">
              {estadoActivo?.cantidad || 0}
            </p>

            <p className="text-sm font-bold mt-2">
              {estadoActivo?.porcentaje || 0}% de participación
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-5">
            <div className="bg-gray-50 rounded-2xl p-4 border">
              <p className="text-xs text-gray-500 font-semibold">Cantidad</p>
              <p className="text-2xl font-black text-gray-900">
                {estadoActivo?.cantidad || 0}
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border">
              <p className="text-xs text-gray-500 font-semibold">Porcentaje</p>
              <p className="text-2xl font-black text-gray-900">
                {estadoActivo?.porcentaje || 0}%
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border bg-gray-50 p-4">
            <p className="text-xs text-gray-500 font-semibold">Lectura rápida</p>
            <p className="text-sm text-gray-700 mt-2">
              {estadoActivo?.estado === 'Abierto'
                ? 'Casos que aún están en Relaciones Laborales y son visibles para Nómina solo como consulta.'
                : estadoActivo?.estado === 'Cerrado'
                  ? 'Casos cerrados por RRLL que ya pueden ser gestionados por Nómina.'
                  : estadoActivo?.estado === 'Retirado'
                    ? 'Casos que Nómina ya finalizó y quedan como histórico.'
                    : 'No hay información disponible para este estado.'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-md border p-6">
        <div className="mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Retiros por mes</h2>
            <p className="text-sm text-gray-500">
              Evolución mensual de los retiros registrados con filtro por año y mes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3">
            <p className="text-sm text-gray-500 mb-4">
              {textoPeriodo}
            </p>

            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataMesesFiltrada}>
                  <defs>
                    <linearGradient id="colorRetiros" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />

                  <Area
                    type="monotone"
                    dataKey="cantidad"
                    stroke="#059669"
                    strokeWidth={3}
                    fill="url(#colorRetiros)"
                    dot={{
                      r: 5,
                      strokeWidth: 3,
                      fill: '#ffffff',
                      stroke: '#059669',
                    }}
                    activeDot={{
                      r: 7,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-50 rounded-3xl border p-5">
            <h3 className="text-lg font-bold text-gray-900">Resumen del periodo</h3>
            <p className="text-sm text-gray-500 mb-5">
              {textoPeriodo}
            </p>

            <div className="space-y-4">
              <div className="bg-white rounded-2xl border p-4">
                <p className="text-xs text-gray-500 font-semibold">Total retiros del periodo</p>
                <p className="text-3xl font-black text-gray-900">
                  {totalPeriodo}
                </p>
              </div>

              <div className="bg-white rounded-2xl border p-4">
                <p className="text-xs text-gray-500 font-semibold">Promedio mensual</p>
                <p className="text-3xl font-black text-gray-900">
                  {promedioMensualPeriodo}
                </p>
              </div>

              <div className="bg-white rounded-2xl border p-4">
                <p className="text-xs text-gray-500 font-semibold">Mes con más retiros</p>
                <p className="text-xl font-black text-emerald-700">
                  {mesMayorPeriodo?.mes || 'Sin datos'}
                </p>
                <p className="text-sm text-gray-500">
                  {mesMayorPeriodo?.cantidad || 0} retiros
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-md border p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-blue-50 text-blue-700 rounded-2xl p-3">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Top clientes / sedes</h2>
            <p className="text-sm text-gray-500">Clientes o sedes con mayor cantidad de retiros.</p>
          </div>
        </div>

        {topClientes.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            No hay información de clientes.
          </div>
        ) : (
          <div className="overflow-hidden border rounded-2xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-4 w-[80px]">#</th>
                  <th className="text-left p-4">Cliente / Sede</th>
                  <th className="text-center p-4 w-[180px]">Cantidad de retiros</th>
                </tr>
              </thead>

              <tbody>
                {topClientes.map((item, index) => (
                  <tr key={`${item.cliente}-${index}`} className="border-t hover:bg-gray-50">
                    <td className="p-4 font-black text-emerald-700">
                      {index + 1}
                    </td>

                    <td className="p-4 font-semibold text-gray-800">
                      {item.cliente}
                    </td>

                    <td className="p-4 text-center">
                      <span className="inline-flex px-4 py-1 rounded-full bg-emerald-50 text-emerald-700 font-black border border-emerald-100">
                        {item.cantidad}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {periodoCompletoSeleccionado && (
        <GestionMensualNomina
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
          onGuardarGestion={guardarGestionMensual}
          onGuardarAnalisisBlur={guardarAnalisisAlSalir}
          onActualizarActividad={actualizarActividadLocal}
          onAgregarActividad={agregarActividad}
          onEliminarActividad={eliminarActividad}
          onGuardarPlan={guardarPlanAccion}
          onGuardarCalificaciones={guardarCalificacionesActividades}
          esSuperAdministradorLocal={esSuperAdministradorLocal}
        />
      )}
    </div>
  );
};

const GestionMensualNomina = ({
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

  const formatearFechaHoraGestionNomina = (fecha) => {
    if (!fecha) {
      return '—';
    }

    try {
      return new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Bogota',
      }).format(new Date(fecha));
    } catch {
      return String(fecha);
    }
  };

  const permisos = gestionMensual?.permisos || {};
  const detalle = gestionMensual?.gestionMensual || {};
  const estadoPeriodo = gestionMensual?.periodo || {};

  const nombresMeses = {
    1: 'Enero',
    2: 'Febrero',
    3: 'Marzo',
    4: 'Abril',
    5: 'Mayo',
    6: 'Junio',
    7: 'Julio',
    8: 'Agosto',
    9: 'Septiembre',
    10: 'Octubre',
    11: 'Noviembre',
    12: 'Diciembre',
  };

  const nombreMes =
    nombresMeses[Number(periodo?.mes)] ||
    `Mes ${periodo?.mes || ''}`;

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
                  {formatearFechaHoraGestionNomina(detalle.fechaAnalisis)}
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
                  {formatearFechaHoraGestionNomina(detalle.fechaPlanAccion)}
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
                  {formatearFechaHoraGestionNomina(detalle.fechaCalificacion)}
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

export default IndicadoresNominaView;
