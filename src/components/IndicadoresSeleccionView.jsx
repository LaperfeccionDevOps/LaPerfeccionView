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

const IndicadoresSeleccionView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [anioSeleccionado, setAnioSeleccionado] = useState('');
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [filtrosAplicados, setFiltrosAplicados] = useState({ anio: '', mes: '' });

  const [estadoActivo, setEstadoActivo] = useState(null);
  const [motivoActivo, setMotivoActivo] = useState(null);

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
            title="Total personal rechazado"
            value={data.rechazados_generales || 0}
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
    </motion.div>
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