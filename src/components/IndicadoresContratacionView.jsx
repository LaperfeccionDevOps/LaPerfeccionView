import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, UserCheck, UserX, Clock } from 'lucide-react';

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

      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Estados del proceso
            </h2>
            <p className="text-sm text-gray-500">
              Distribución actual de candidatos por estado.
            </p>
          </div>
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
                    {item.estado}
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