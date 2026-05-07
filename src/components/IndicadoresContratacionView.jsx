import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Users,
  UserCheck,
  UserX,
  Filter,
  RotateCcw,
  MousePointerClick,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import {
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
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

const IndicadoresContratacionView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [anioSeleccionado, setAnioSeleccionado] = useState('');
  const [mesSeleccionado, setMesSeleccionado] = useState('');

  const [filtrosAplicados, setFiltrosAplicados] = useState({
    anio: '',
    mes: '',
  });

  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);

  const cargarIndicadores = async (filtros = filtrosAplicados) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (filtros.anio) params.append('anio', filtros.anio);
      if (filtros.mes) params.append('mes', filtros.mes);

      const queryString = params.toString();
      const url = `${import.meta.env.VITE_API_BASE_URL}/datos-seleccion/dashboard-indicadores${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      setEstadoSeleccionado(null);
    } catch (err) {
      console.error('Error cargando indicadores de contratación:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarIndicadores();
  }, []);

  const aplicarFiltros = () => {
    const nuevosFiltros = {
      anio: anioSeleccionado,
      mes: mesSeleccionado,
    };

    setFiltrosAplicados(nuevosFiltros);
    cargarIndicadores(nuevosFiltros);
  };

  const limpiarFiltros = () => {
    const filtrosLimpios = {
      anio: '',
      mes: '',
    };

    setAnioSeleccionado('');
    setMesSeleccionado('');
    setFiltrosAplicados(filtrosLimpios);
    cargarIndicadores(filtrosLimpios);
  };

  const indicadoresContratacion = useMemo(() => {
    const contratados = Number(data?.contratados || 0);
    const rechazados = Number(data?.rechazados || 0);
    const totalAvanzados = contratados + rechazados;

    const porcentajeContratados = totalAvanzados
      ? Math.round((contratados / totalAvanzados) * 100)
      : 0;

    const porcentajeRechazados = totalAvanzados
      ? Math.round((rechazados / totalAvanzados) * 100)
      : 0;

    return {
      contratados,
      rechazados,
      totalAvanzados,
      porcentajeContratados,
      porcentajeRechazados,
    };
  }, [data]);

  const tortaContratacion = [
    {
      estado: 'CONTRATADOS',
      cantidad: indicadoresContratacion.contratados,
      porcentaje: indicadoresContratacion.porcentajeContratados,
      color: '#059669',
      descripcion: 'Personas que finalizaron exitosamente el proceso de contratación.',
    },
    {
      estado: 'RECHAZADOS',
      cantidad: indicadoresContratacion.rechazados,
      porcentaje: indicadoresContratacion.porcentajeRechazados,
      color: '#dc2626',
      descripcion: 'Personas que no continuaron o fueron cerradas como rechazadas dentro del proceso.',
    },
  ].filter((item) => item.cantidad > 0);

  const motivosRechazo = (data?.motivos_rechazo || [])
    .filter((item) => item.cantidad > 0)
    .map((item, index) => ({
      ...item,
      color: ['#dc2626', '#f59e0b', '#7c3aed', '#0ea5e9', '#059669', '#2563eb'][index % 6],
    }));

  const motivosRechazoTorta = motivosRechazo.map((item) => ({
    motivo: item.motivo,
    cantidad: item.cantidad,
    porcentaje: item.porcentaje,
    color: item.color,
  }));

  const estadoActivo = estadoSeleccionado || tortaContratacion[0] || null;

  const textoPeriodo =
    filtrosAplicados.anio || filtrosAplicados.mes
      ? `Periodo filtrado: ${
          meses.find((item) => item.value === filtrosAplicados.mes)?.label || 'Todos los meses'
        } / ${filtrosAplicados.anio || 'Todos los años'}`
      : 'Vista general sin filtros aplicados.';

  if (loading) {
    return <div className="p-8 text-gray-500">Cargando indicadores...</div>;
  }

  if (!data) {
    return <div className="p-8 text-red-500">No fue posible cargar los indicadores.</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-emerald-600">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Indicadores de Contratación
              </h1>
              <p className="text-sm text-gray-500">
                Dashboard ejecutivo del cierre del proceso de contratación.
              </p>
              <p className="text-xs text-emerald-700 font-semibold mt-1">
                {textoPeriodo}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Año
                </label>
                <select
                  value={anioSeleccionado}
                  onChange={(e) => setAnioSeleccionado(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {anios.map((item) => (
                    <option key={item.value || 'todos-anios'} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Mes
                </label>
                <select
                  value={mesSeleccionado}
                  onChange={(e) => setMesSeleccionado(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filtrar
              </button>

              <button
                type="button"
                onClick={limpiarFiltros}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white hover:bg-gray-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Limpiar
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard
            title="Total personas avanzadas a contratación"
            value={indicadoresContratacion.totalAvanzados}
            icon={Users}
          />
          <KpiCard
            title="Contratados"
            value={indicadoresContratacion.contratados}
            icon={UserCheck}
          />
          <KpiCard
            title="Rechazados"
            value={indicadoresContratacion.rechazados}
            icon={UserX}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ChartCard
            title="Resultado de contratación"
            subtitle="Haz clic sobre la torta para ver el detalle del estado seleccionado."
          >
            {tortaContratacion.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tortaContratacion}
                    dataKey="cantidad"
                    nameKey="estado"
                    cx="50%"
                    cy="48%"
                    outerRadius={135}
                    innerRadius={68}
                    paddingAngle={4}
                    label={({ estado, porcentaje }) => `${estado}: ${porcentaje}%`}
                    onClick={(entry) => setEstadoSeleccionado(entry)}
                    className="cursor-pointer"
                  >
                    {tortaContratacion.map((entry, index) => (
                      <Cell
                        key={`contratacion-pie-${index}`}
                        fill={entry.color}
                        stroke={estadoActivo?.estado === entry.estado ? '#111827' : '#ffffff'}
                        strokeWidth={estadoActivo?.estado === entry.estado ? 4 : 2}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value, name, props) => [
                      `${value} personas`,
                      props?.payload?.estado || 'Estado',
                    ]}
                  />

                  <Legend
                    verticalAlign="bottom"
                    height={70}
                    wrapperStyle={{ fontSize: '13px', fontWeight: 700 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartMessage message="No hay personas contratadas o rechazadas para el periodo seleccionado." />
            )}
          </ChartCard>
        </div>

        <motion.div
          key={estadoActivo?.estado || 'sin-estado'}
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100"
        >
          <div className="flex items-center gap-2 mb-4">
            <MousePointerClick className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-800">
              Detalle interactivo
            </h2>
          </div>

          {estadoActivo ? (
            <>
              <div
                className="rounded-2xl p-5 text-white mb-5"
                style={{ backgroundColor: estadoActivo.color }}
              >
                <p className="text-sm font-semibold opacity-90">
                  Estado seleccionado
                </p>
                <h3 className="text-2xl font-extrabold mt-1">
                  {estadoActivo.estado}
                </h3>
                <p className="text-4xl font-black mt-4">
                  {estadoActivo.cantidad}
                </p>
                <p className="text-sm font-semibold opacity-90">
                  {estadoActivo.porcentaje}% del resultado de contratación
                </p>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed mb-5">
                {estadoActivo.descripcion}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <MiniMetric
                  icon={TrendingUp}
                  title="Participación"
                  value={`${estadoActivo.porcentaje}%`}
                />
                <MiniMetric
                  icon={Users}
                  title="Personas"
                  value={estadoActivo.cantidad}
                />
              </div>

              {estadoActivo.estado === 'RECHAZADOS' && (
                <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <p className="text-sm font-bold text-red-700">
                      Motivos registrados
                    </p>
                  </div>

                  {motivosRechazo.length > 0 ? (
                    <div className="space-y-2">
                      {motivosRechazo.map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{item.motivo}</span>
                          <span className="font-bold text-gray-900">
                            {item.cantidad}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No hay motivos de rechazo registrados para este periodo.
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500">
              Selecciona un segmento de la torta para ver información detallada.
            </p>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Motivos de rechazo"
          subtitle="Distribución de causas registradas en procesos rechazados."
        >
          {motivosRechazoTorta.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={motivosRechazoTorta}
                  dataKey="cantidad"
                  nameKey="motivo"
                  cx="50%"
                  cy="48%"
                  outerRadius={125}
                  innerRadius={60}
                  paddingAngle={3}
                  label={({ porcentaje }) => `${porcentaje}%`}
                >
                  {motivosRechazoTorta.map((entry, index) => (
                    <Cell key={`motivo-pie-${index}`} fill={entry.color} />
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
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartMessage message="No hay motivos de rechazo registrados para el periodo seleccionado." />
          )}
        </ChartCard>

        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-800">
              Resumen ejecutivo
            </h2>
            <p className="text-sm text-gray-500">
              Lectura rápida del resultado de contratación.
            </p>
          </div>

          <div className="space-y-4">
            <ExecutiveRow
              label="Personas avanzadas a contratación"
              value={indicadoresContratacion.totalAvanzados}
              color="bg-gray-900"
            />
            <ExecutiveRow
              label="Contratados"
              value={`${indicadoresContratacion.contratados} (${indicadoresContratacion.porcentajeContratados}%)`}
              color="bg-emerald-600"
            />
            <ExecutiveRow
              label="Rechazados"
              value={`${indicadoresContratacion.rechazados} (${indicadoresContratacion.porcentajeRechazados}%)`}
              color="bg-red-600"
            />
          </div>

          <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
            <p className="text-sm text-emerald-800 font-semibold leading-relaxed">
              Este tablero resume únicamente el resultado del proceso de contratación:
              personas contratadas y personas rechazadas. Los estados operativos
              completos deben visualizarse en el dashboard de Selección.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ChartCard = ({ title, subtitle, children }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>

      <div className="w-full h-[420px]">{children}</div>
    </div>
  );
};

const KpiCard = ({ title, value, icon: Icon }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-2">{value}</p>
        </div>

        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6 text-emerald-600" />
        </div>
      </div>
    </div>
  );
};

const MiniMetric = ({ icon: Icon, title, value }) => {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <Icon className="w-5 h-5 text-emerald-600 mb-2" />
      <p className="text-xs text-gray-500 font-semibold">{title}</p>
      <p className="text-xl font-black text-gray-900">{value}</p>
    </div>
  );
};

const ExecutiveRow = ({ label, value, color }) => {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-100 p-4">
      <div className="flex items-center gap-3">
        <span className={`w-3 h-3 rounded-full ${color}`} />
        <span className="text-sm font-semibold text-gray-700">{label}</span>
      </div>
      <span className="text-sm font-black text-gray-900">{value}</span>
    </div>
  );
};

const EmptyChartMessage = ({ message }) => {
  return (
    <div className="h-full flex items-center justify-center text-gray-500 text-sm text-center px-6">
      {message}
    </div>
  );
};

export default IndicadoresContratacionView;