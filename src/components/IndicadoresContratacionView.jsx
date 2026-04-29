import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, UserCheck, UserX, Clock } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line,
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

const motivoColors = [
  '#2563eb',
  '#dc2626',
  '#059669',
  '#f59e0b',
  '#7c3aed',
  '#0ea5e9',
  '#ea580c',
];

const IndicadoresContratacionView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/datos-seleccion/dashboard-indicadores`)
      .then((res) => res.json())
      .then((res) => setData(res))
      .catch((err) => console.error('Error cargando indicadores:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-gray-500">Cargando indicadores...</div>;
  }

  if (!data) {
    return <div className="p-8 text-red-500">No fue posible cargar los indicadores.</div>;
  }

  const estadosChart = (data.estados || []).map((item) => ({
    estado: item.estado,
    cantidad: item.cantidad,
    porcentaje: item.porcentaje,
    color: getEstadoColor(item.estado),
  }));

  const pieChartData = estadosChart.filter((item) => item.cantidad > 0);

  const tendenciaMensualCompleta = (data.registros_por_mes || []).map((item) => ({
    mes: item.mes,
    registros: item.registros,
  }));

  const tendenciaMensual = tendenciaMensualCompleta.slice(-12);

  const motivosRechazo = (data.motivos_rechazo || []).map((item, index) => ({
    motivo: item.motivo,
    cantidad: item.cantidad,
    porcentaje: item.porcentaje,
    color: motivoColors[index % motivoColors.length],
  }));

  const motivosConDatos = motivosRechazo.filter((item) => item.cantidad > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-emerald-600">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Indicadores de Contratación
            </h1>
            <p className="text-sm text-gray-500">
              Dashboard de seguimiento del proceso de contratación.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard title="Total registros" value={data.total} icon={Users} />
          <KpiCard title="Contratados" value={data.contratados} icon={UserCheck} />
          <KpiCard title="Rechazados" value={data.rechazados} icon={UserX} />
          <KpiCard title="Pendiente contratación" value={data.pendiente_contratacion} icon={Clock} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Distribución por estados"
          subtitle="Visualización actual de candidatos por estado del proceso."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={estadosChart} margin={{ top: 20, right: 30, left: 10, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="estado"
                angle={-35}
                textAnchor="end"
                interval={0}
                height={90}
                tick={{ fontSize: 11 }}
              />
              <YAxis allowDecimals={false} />
              <Tooltip
                formatter={(value, name, props) => [
                  `${value} candidatos`,
                  props?.payload?.estado || 'Estado',
                ]}
                labelFormatter={() => ''}
              />
              <Bar dataKey="cantidad" radius={[8, 8, 0, 0]} barSize={42}>
                {estadosChart.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Participación por estado"
          subtitle="Estados con candidatos registrados actualmente."
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieChartData}
                dataKey="cantidad"
                nameKey="estado"
                cx="50%"
                cy="48%"
                outerRadius={120}
                innerRadius={55}
                paddingAngle={3}
                label={({ porcentaje }) => `${porcentaje}%`}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`pie-${index}`} fill={entry.color} />
                ))}
              </Pie>

              <Tooltip
                formatter={(value, name, props) => [
                  `${value} candidatos`,
                  props?.payload?.estado || 'Estado',
                ]}
              />

              <Legend
                verticalAlign="bottom"
                height={70}
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Tendencia mensual"
          subtitle="Evolución de registros por mes. Se muestran los últimos 12 meses."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={tendenciaMensual} margin={{ top: 20, right: 30, left: 10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="mes"
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis allowDecimals={false} />
              <Tooltip
                formatter={(value) => [`${value} registros`, 'Registros']}
              />
              <Line
                type="monotone"
                dataKey="registros"
                stroke="#059669"
                strokeWidth={4}
                dot={{ r: 6, strokeWidth: 2 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Motivos de rechazo"
          subtitle="Principales causas registradas en procesos rechazados."
        >
          {motivosConDatos.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={motivosConDatos}
                layout="vertical"
                margin={{ top: 20, right: 40, left: 80, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="motivo"
                  width={150}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value, name, props) => [
                    `${value} registros`,
                    props?.payload?.motivo || 'Motivo',
                  ]}
                  labelFormatter={() => ''}
                />
                <Bar dataKey="cantidad" radius={[0, 8, 8, 0]} barSize={28}>
                  {motivosConDatos.map((entry, index) => (
                    <Cell key={`motivo-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
              No hay motivos de rechazo registrados.
            </div>
          )}
        </ChartCard>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-800">
            Histórico mensual
          </h2>
          <p className="text-sm text-gray-500">
            Tabla completa de registros por mes.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 max-h-[360px] overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-900 text-white">
                <th className="px-5 py-3 text-sm font-semibold">Mes</th>
                <th className="px-5 py-3 text-sm font-semibold text-center">Registros</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {tendenciaMensualCompleta.map((item, index) => (
                <tr key={index} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="px-5 py-3 text-sm font-semibold text-gray-800">
                    {item.mes}
                  </td>

                  <td className="px-5 py-3 text-sm text-center font-bold text-gray-700">
                    {item.registros}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-800">
            Estados del proceso
          </h2>
          <p className="text-sm text-gray-500">
            Tabla general con todos los estados, incluyendo los que están en cero.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="px-5 py-3 text-sm font-semibold">Estado</th>
                <th className="px-5 py-3 text-sm font-semibold text-center">Cantidad</th>
                <th className="px-5 py-3 text-sm font-semibold text-center">Porcentaje</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {data.estados?.map((item, index) => (
                <tr key={index} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="px-5 py-3 text-sm font-semibold text-gray-800">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full inline-block"
                        style={{ backgroundColor: getEstadoColor(item.estado) }}
                      />
                      {item.estado}
                    </div>
                  </td>

                  <td className="px-5 py-3 text-sm text-center font-bold text-gray-700">
                    {item.cantidad}
                  </td>

                  <td className="px-5 py-3 text-sm text-center">
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
                      {item.porcentaje}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

const ChartCard = ({ title, subtitle, children }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800">
          {title}
        </h2>
        <p className="text-sm text-gray-500">
          {subtitle}
        </p>
      </div>

      <div className="w-full h-[380px]">
        {children}
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, icon: Icon }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-2">{value}</p>
        </div>

        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
          <Icon className="w-6 h-6 text-emerald-600" />
        </div>
      </div>
    </div>
  );
};

export default IndicadoresContratacionView;