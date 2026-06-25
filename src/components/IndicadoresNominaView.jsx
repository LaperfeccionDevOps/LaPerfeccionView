import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  RefreshCw,
  Users,
  CheckCircle2,
  Clock,
  PieChart,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import { Button } from '@/components/ui/button';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';

const coloresEstado = {
  Abierto: '#F59E0B',
  Cerrado: '#059669',
  Retirado: '#334155',
};

const IndicadoresNominaView = () => {
  const [indicadores, setIndicadores] = useState({
    totales: {
      abiertos: 0,
      cerrados: 0,
      retirados: 0,
      total: 0,
    },
    distribucionEstados: [],
    retirosPorMes: [],
  });

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const cargarIndicadores = async () => {
    setCargando(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/nomina-retiros/indicadores`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.detail || data?.message || 'No fue posible consultar indicadores.');
      }

      setIndicadores(data.data);
    } catch (err) {
      console.error('Error cargando indicadores de nómina:', err);
      setError(err.message || 'Error cargando indicadores de nómina.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarIndicadores();
  }, []);

  const total = indicadores?.totales?.total || 0;
  const abiertos = indicadores?.totales?.abiertos || 0;
  const cerrados = indicadores?.totales?.cerrados || 0;
  const retirados = indicadores?.totales?.retirados || 0;

  const dataEstados = useMemo(() => {
    return (indicadores?.distribucionEstados || []).map((item) => ({
      ...item,
      porcentaje: total > 0 ? Math.round((Number(item.cantidad || 0) / total) * 100) : 0,
    }));
  }, [indicadores, total]);

  const estadoPrincipal = useMemo(() => {
    if (!dataEstados.length) return null;
    return [...dataEstados].sort((a, b) => Number(b.cantidad || 0) - Number(a.cantidad || 0))[0];
  }, [dataEstados]);

  const dataMeses = indicadores?.retirosPorMes || [];

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl shadow-md border p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 font-semibold">Total retiros</p>
              <p className="text-4xl font-black text-gray-900 mt-2">{total}</p>
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
              <p className="text-4xl font-black text-yellow-700 mt-2">{abiertos}</p>
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
              <p className="text-4xl font-black text-emerald-700 mt-2">{cerrados}</p>
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
              <p className="text-4xl font-black text-gray-700 mt-2">{retirados}</p>
            </div>
            <div className="bg-gray-100 text-gray-700 rounded-2xl p-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-3xl shadow-md border p-6">
          <h2 className="text-xl font-bold text-gray-900">Distribución por estados</h2>
          <p className="text-sm text-gray-500 mb-4">Estado actual de los retiros en nómina.</p>

          <div className="h-[360px]">
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
                  label={({ estado, porcentaje }) => `${estado}: ${porcentaje}%`}
                >
                  {dataEstados.map((entry) => (
                    <Cell
                      key={entry.estado}
                      fill={coloresEstado[entry.estado] || '#64748B'}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-md border p-6">
          <h2 className="text-xl font-bold text-gray-900">Detalle interactivo</h2>
          <p className="text-sm text-gray-500 mb-6">Estado con mayor participación.</p>

          <div className="rounded-3xl bg-emerald-600 text-white p-6 shadow-md">
            <p className="text-sm font-bold">Estado principal</p>
            <p className="text-3xl font-black mt-3">
              {estadoPrincipal?.estado || 'Sin datos'}
            </p>
            <p className="text-5xl font-black mt-4">
              {estadoPrincipal?.cantidad || 0}
            </p>
            <p className="text-sm font-bold mt-2">
              {estadoPrincipal?.porcentaje || 0}% de participación
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-5">
            <div className="bg-gray-50 rounded-2xl p-4 border">
              <p className="text-xs text-gray-500 font-semibold">Cantidad</p>
              <p className="text-2xl font-black text-gray-900">
                {estadoPrincipal?.cantidad || 0}
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border">
              <p className="text-xs text-gray-500 font-semibold">Porcentaje</p>
              <p className="text-2xl font-black text-gray-900">
                {estadoPrincipal?.porcentaje || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-md border p-6">
        <h2 className="text-xl font-bold text-gray-900">Retiros por mes</h2>
        <p className="text-sm text-gray-500 mb-4">Cantidad de retiros agrupados por mes.</p>

        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataMeses}>
              <XAxis dataKey="mes" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="cantidad" radius={[10, 10, 0, 0]} fill="#059669" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default IndicadoresNominaView;