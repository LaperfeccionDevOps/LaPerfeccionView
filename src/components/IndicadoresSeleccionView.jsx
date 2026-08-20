import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Users, Filter, RotateCcw, CalendarDays, PieChart as PieIcon,
  ListChecks, AlertTriangle
} from 'lucide-react';
import {
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
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

  const [anioSeleccionado, setAnioSeleccionado] = useState('');
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [filtrosAplicados, setFiltrosAplicados] = useState({ anio: '', mes: '' });

  const [estadoActivo, setEstadoActivo] = useState(null);
  const [motivoActivo, setMotivoActivo] = useState(null);

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
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filtros.anio) params.append('anio', filtros.anio);
      if (filtros.mes) params.append('mes', filtros.mes);

      const queryString = params.toString();
      const url = `${import.meta.env.VITE_API_BASE_URL}/datos-seleccion/dashboard-indicadores${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Error HTTP ${response.status}`);

      const result = await response.json();
      setData(result);
      setEstadoActivo(null);
      setMotivoActivo(null);
    } catch (error) {
      console.error('Error cargando indicadores de selección:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarIndicadores();
  }, []);

  const aplicarFiltros = () => {
    const filtros = { anio: anioSeleccionado, mes: mesSeleccionado };
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

  const estadosChart = useMemo(() => {
    return (data?.estados || [])
      .filter((item) => item.cantidad > 0)
      .map((item) => ({
        ...item,
        color: getEstadoColor(item.estado),
      }));
  }, [data]);

  const motivosChart = useMemo(() => {
    const motivos = data?.motivos_rechazo_generales_con_datos
      || data?.motivos_rechazo_con_datos
      || [];

    return motivos
      .filter((item) => item.cantidad > 0)
      .map((item, index) => ({
        ...item,
        color: motivoColors[index % motivoColors.length],
      }));
  }, [data]);

  const estadoSeleccionado = estadoActivo || estadosChart[0] || null;
  const motivoSeleccionado = motivoActivo || motivosChart[0] || null;

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
                Seguimiento visual del estado actual de los candidatos.
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
            value={data.total}
        />

        <KpiPrincipal
            title="Total personal avanza a contratación"
            value={data.avanza_contratacion || 0}
        />

        <KpiPrincipal
            title="Total personal rechazado en Selección"
            value={data.rechazados_seleccion ?? data.rechazados_generales ?? 0}
        />
        </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ChartCard
            title="Distribución por estados"
            subtitle="Estado actual del proceso de selección"
            icon={PieIcon}
          >
            {estadosChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={estadosChart}
                    dataKey="cantidad"
                    nameKey="estado"
                    cx="50%"
                    cy="48%"
                    outerRadius={140}
                    innerRadius={70}
                    paddingAngle={4}
                    label={({ porcentaje }) => `${porcentaje}%`}
                    onClick={(entry) => setEstadoActivo(entry)}
                    className="cursor-pointer"
                  >
                    {estadosChart.map((entry, index) => (
                      <Cell
                        key={`estado-${index}`}
                        fill={entry.color}
                        stroke={estadoSeleccionado?.estado === entry.estado ? '#111827' : '#ffffff'}
                        strokeWidth={estadoSeleccionado?.estado === entry.estado ? 4 : 2}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value, name, props) => [
                      `${value} registros`,
                      props?.payload?.estado || 'Estado',
                    ]}
                  />

                  <Legend
                    verticalAlign="bottom"
                    height={80}
                    wrapperStyle={{ fontSize: '12px', fontWeight: 700 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartMessage message="No hay estados para el periodo seleccionado." />
            )}
          </ChartCard>
        </div>

        <DetailPanel
          title="Detalle del estado"
          item={estadoSeleccionado}
          nameKey="estado"
          colorKey="color"
          empty="Selecciona un estado para ver el detalle."
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ChartCard
            title="Motivos de rechazo"
            subtitle="Causas registradas dentro del proceso de selección"
            icon={AlertTriangle}
          >
            {motivosChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={motivosChart}
                    dataKey="cantidad"
                    nameKey="motivo"
                    cx="50%"
                    cy="48%"
                    outerRadius={140}
                    innerRadius={70}
                    paddingAngle={4}
                    label={({ porcentaje }) => `${porcentaje}%`}
                    onClick={(entry) => setMotivoActivo(entry)}
                    className="cursor-pointer"
                  >
                    {motivosChart.map((entry, index) => (
                      <Cell
                        key={`motivo-${index}`}
                        fill={entry.color}
                        stroke={motivoSeleccionado?.motivo === entry.motivo ? '#111827' : '#ffffff'}
                        strokeWidth={motivoSeleccionado?.motivo === entry.motivo ? 4 : 2}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value, name, props) => [
                      `${value} registros`,
                      props?.payload?.motivo || 'Motivo',
                    ]}
                  />

                  <Legend
                    verticalAlign="bottom"
                    height={80}
                    wrapperStyle={{ fontSize: '12px', fontWeight: 700 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartMessage message="No hay motivos de rechazo para el periodo seleccionado." />
            )}
          </ChartCard>
        </div>

        <DetailPanel
          title="Detalle del motivo"
          item={motivoSeleccionado}
          nameKey="motivo"
          colorKey="color"
          empty="Selecciona un motivo para ver el detalle."
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <DataTable
          title="Estados del proceso"
          icon={ListChecks}
          rows={data.estados || []}
          columns={[
            { key: 'estado', label: 'Estado' },
            { key: 'cantidad', label: 'Cantidad', align: 'center' },
            { key: 'porcentaje', label: 'Porcentaje', align: 'center', percent: true },
          ]}
          colorResolver={(row) => getEstadoColor(row.estado)}
        />

        <DataTable
          title="Motivos registrados"
          icon={AlertTriangle}
          rows={motivosChart}
          columns={[
            { key: 'motivo', label: 'Motivo' },
            { key: 'cantidad', label: 'Cantidad', align: 'center' },
            { key: 'porcentaje', label: 'Porcentaje', align: 'center', percent: true },
          ]}
          colorResolver={(row) => row.color}
          emptyText="No hay motivos registrados."
        />

      </div>

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


const KpiPrincipal = ({ title, value }) => (
  <div className="h-full bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-bold text-gray-500">{title}</p>
        <p className="text-5xl font-black text-gray-900 mt-3">{value}</p>
      </div>
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
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
        {item.porcentaje}%
      </span>
    </div>
  </button>
);

const ChartCard = ({ title, subtitle, icon: Icon, children }) => (
  <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
    <div className="flex items-start gap-3 mb-4">
      {Icon && (
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <Icon className="w-5 h-5 text-emerald-600" />
        </div>
      )}
      <div>
        <h2 className="text-xl font-black text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
    <div className="w-full h-[430px]">{children}</div>
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
            {item.porcentaje}% de participación
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
            <p className="text-xs font-bold text-gray-500">Cantidad</p>
            <p className="text-2xl font-black text-gray-900">{item.cantidad}</p>
          </div>
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
            <p className="text-xs font-bold text-gray-500">Porcentaje</p>
            <p className="text-2xl font-black text-gray-900">{item.porcentaje}%</p>
          </div>
        </div>
      </>
    ) : (
      <p className="text-sm text-gray-500">{empty}</p>
    )}
  </motion.div>
);

const DataTable = ({ title, icon: Icon, rows, columns, colorResolver, emptyText = 'No hay datos.' }) => (
  <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
    <div className="flex items-center gap-3 mb-5">
      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
        <Icon className="w-5 h-5 text-emerald-600" />
      </div>
      <h2 className="text-xl font-black text-gray-900">{title}</h2>
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
                        {row[col.key]}%
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

const EmptyChartMessage = ({ message }) => (
  <div className="h-full flex items-center justify-center text-gray-500 text-sm text-center px-6">
    {message}
  </div>
);

export default IndicadoresSeleccionView;