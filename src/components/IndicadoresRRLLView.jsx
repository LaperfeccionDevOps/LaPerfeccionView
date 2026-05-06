import React, { useEffect, useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Users,
  FolderOpen,
  CheckCircle,
  Clock,
  FileWarning,
  RefreshCw,
  Filter,
  CalendarDays,
  FileText,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const COLORS = [
  '#059669',
  '#ef4444',
  '#f59e0b',
  '#2563eb',
  '#7c3aed',
  '#14b8a6',
  '#db2777',
  '#64748b',
  '#ea580c',
  '#16a34a',
];

const MESES = [
  { value: '', label: 'Todos los meses' },
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

const IndicadoresRRLLView = () => {
  const anioActual = new Date().getFullYear();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [anioSeleccionado, setAnioSeleccionado] = useState(anioActual);
  const [mesSeleccionado, setMesSeleccionado] = useState('');

  const [selectedEstado, setSelectedEstado] = useState(null);
  const [selectedMotivo, setSelectedMotivo] = useState(null);
  const [selectedTipificacion, setSelectedTipificacion] = useState(null);
  const [selectedDocumento, setSelectedDocumento] = useState(null);

  const anios = useMemo(() => {
    const lista = [{ value: '', label: 'Todos los años' }];
    for (let y = anioActual + 1; y >= anioActual - 5; y--) {
      lista.push({ value: y, label: String(y) });
    }
    return lista;
  }, [anioActual]);

  const cargarIndicadores = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (anioSeleccionado) params.append('anio', anioSeleccionado);
      if (mesSeleccionado) params.append('mes', mesSeleccionado);

      const url = `${API_BASE_URL}/retiros-laborales/dashboard-indicadores${
        params.toString() ? `?${params.toString()}` : ''
      }`;

      const resp = await fetch(url);
      const json = await resp.json();

      if (!resp.ok || !json.success) {
        throw new Error(json.detail || 'Error consultando indicadores RRLL');
      }

      setData(json.data);

      setSelectedEstado(
        json.data?.estados?.[0]
          ? {
              name: json.data.estados[0].estado,
              value: Number(json.data.estados[0].cantidad || 0),
            }
          : null
      );

      setSelectedMotivo(
        json.data?.motivos?.[0]
          ? {
              name: json.data.motivos[0].motivo,
              value: Number(json.data.motivos[0].cantidad || 0),
            }
          : null
      );

      setSelectedTipificacion(
        json.data?.tipificaciones?.[0]
          ? {
              name: json.data.tipificaciones[0].tipificacion,
              value: Number(json.data.tipificaciones[0].cantidad || 0),
            }
          : null
      );

      setSelectedDocumento(
        json.data?.documentos?.[0]
          ? {
              name: json.data.documentos[0].documento,
              value: Number(json.data.documentos[0].cantidad || 0),
            }
          : null
      );
    } catch (error) {
      console.error('[IndicadoresRRLLView]', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarIndicadores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const limpiarFiltros = () => {
    setAnioSeleccionado('');
    setMesSeleccionado('');
    setTimeout(() => cargarIndicadores(), 0);
  };

  const toChart = (items, nameKey) =>
    (items || [])
      .filter((item) => Number(item.cantidad || 0) > 0)
      .map((item) => ({
        name: item[nameKey] || 'SIN DATO',
        value: Number(item.cantidad || 0),
      }));

  const estadosChart = useMemo(() => toChart(data?.estados, 'estado'), [data]);
  const motivosChart = useMemo(() => toChart(data?.motivos, 'motivo'), [data]);
  const tipificacionesChart = useMemo(
    () => toChart(data?.tipificaciones, 'tipificacion'),
    [data]
  );
  const documentosChart = useMemo(
    () => toChart(data?.documentos, 'documento'),
    [data]
  );

  const totales = data?.totales || {};

  const periodoTexto = useMemo(() => {
    const mes = MESES.find((m) => String(m.value) === String(mesSeleccionado));
    if (anioSeleccionado && mesSeleccionado) return `${mes?.label || ''} / ${anioSeleccionado}`;
    if (anioSeleccionado) return `Año ${anioSeleccionado}`;
    if (mesSeleccionado) return `${mes?.label || ''}`;
    return 'Vista general';
  }, [anioSeleccionado, mesSeleccionado]);

  const KpiCard = ({ title, value, icon: Icon }) => (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl transition-all">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-bold text-gray-500">{title}</p>
          <h2 className="text-5xl font-black text-gray-900 mt-4">{value ?? 0}</h2>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
          <Icon className="w-8 h-8 text-emerald-600" />
        </div>
      </div>
    </div>
  );

  const DonutChart = ({ title, subtitle, dataChart, selected, setSelected, icon: Icon }) => (
  <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-7">
    <div className="flex items-start gap-4 mb-4">
      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
        <Icon className="w-6 h-6 text-emerald-600" />
      </div>
      <div>
        <h2 className="text-2xl font-black text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>

    {dataChart.length === 0 ? (
      <div className="h-[260px] flex items-center justify-center text-gray-400 font-bold">
        Sin datos para el periodo seleccionado
      </div>
    ) : (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-center">
        <div className="xl:col-span-2 h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
            <Pie
                data={dataChart}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={4}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                labelLine={{ length: 18, length2: 16 }}
                >
                {dataChart.map((item, index) => (
                  <Cell
                    key={`${item.name}-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    cursor="pointer"
                    onMouseDown={(event) => {
                      event?.preventDefault?.();
                      event?.stopPropagation?.();
                    }}
                    onClick={(event) => {
                      event?.preventDefault?.();
                      event?.stopPropagation?.();
                      setSelected({
                        name: item.name,
                        value: item.value,
                      });
                    }}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} registros`, name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-3xl bg-gray-50 border border-gray-100 p-6 min-h-[230px]">
          <p className="text-xs font-bold text-gray-500 uppercase">
            Detalle seleccionado
          </p>
          <h3 className="text-xl font-black text-gray-900 mt-3 break-words">
            {selected?.name || 'Sin selección'}
          </h3>
          <p className="text-5xl font-black text-emerald-600 mt-5">
            {selected?.value || 0}
          </p>
          <p className="text-sm text-gray-500 mt-2">registros asociados</p>
        </div>
      </div>
    )}
  </div>
);

  if (loading) {
    return (
      <div className="p-8 bg-white rounded-2xl shadow-xl">
        <p className="font-bold text-gray-600">Cargando indicadores RRLL...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl shadow-xl p-8 border-t-4 border-emerald-600">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
              <FolderOpen className="w-8 h-8 text-white" />
            </div>

            <div>
              <h1 className="text-4xl font-black text-gray-900">
                Indicadores RRLL - Retiros
              </h1>
              <p className="text-gray-500 mt-1">
                Dashboard visual del proceso de retiros laborales.
              </p>
              <div className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-sm border border-emerald-100">
                <CalendarDays className="w-4 h-4" />
                {periodoTexto}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-3xl p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div>
                <label className="block text-xs font-black text-gray-600 mb-1">Año</label>
                <select
                  value={anioSeleccionado}
                  onChange={(e) => setAnioSeleccionado(e.target.value)}
                  className="w-full md:w-[210px] rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-900"
                >
                  {anios.map((item) => (
                    <option key={item.label} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-600 mb-1">Mes</label>
                <select
                  value={mesSeleccionado}
                  onChange={(e) => setMesSeleccionado(e.target.value)}
                  className="w-full md:w-[220px] rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-900"
                >
                  {MESES.map((item) => (
                    <option key={item.label} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={cargarIndicadores}
                className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-7 py-3 rounded-xl font-black hover:bg-emerald-700 transition mt-5 md:mt-5"
              >
                <Filter className="w-5 h-5" />
                Filtrar
              </button>

              <button
                type="button"
                onClick={limpiarFiltros}
                className="flex items-center justify-center gap-2 bg-gray-900 text-white px-7 py-3 rounded-xl font-black hover:bg-gray-800 transition mt-5 md:mt-5"
              >
                <RefreshCw className="w-5 h-5" />
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KpiCard title="Total retiros registrados" value={totales.total_retiros} icon={Users} />
        <KpiCard title="Retiros abiertos" value={totales.retiros_abiertos} icon={Clock} />
        <KpiCard title="Retiros cerrados" value={totales.retiros_cerrados} icon={CheckCircle} />
        <KpiCard title="Pendientes documentación" value={totales.pendientes_documentacion} icon={FileWarning} />
      </div>

      <DonutChart
        title="Distribución por estado"
        subtitle="Retiros abiertos y cerrados registrados."
        dataChart={estadosChart}
        selected={selectedEstado}
        setSelected={setSelectedEstado}
        icon={Clock}
      />

      <DonutChart
        title="Motivos de retiro"
        subtitle="Principales causas registradas en RRLL."
        dataChart={motivosChart}
        selected={selectedMotivo}
        setSelected={setSelectedMotivo}
        icon={AlertTriangle}
      />

      <DonutChart
        title="Tipificaciones de retiro"
        subtitle="Clasificación detallada registrada al cierre o gestión del retiro."
        dataChart={tipificacionesChart}
        selected={selectedTipificacion}
        setSelected={setSelectedTipificacion}
        icon={ClipboardList}
      />

      <DonutChart
        title="Documentos de retiro"
        subtitle="Documentos adjuntados dentro del proceso de retiro."
        dataChart={documentosChart}
        selected={selectedDocumento}
        setSelected={setSelectedDocumento}
        icon={FileText}
      />

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-7">
        <h2 className="text-2xl font-black text-gray-900">Retiros recientes</h2>
        <p className="text-sm text-gray-500 mb-5">
          Últimos 10 procesos según el filtro aplicado.
        </p>

        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full text-left">
            <thead className="bg-gray-900 text-white">
              <tr>
                <th className="p-4">Trabajador</th>
                <th className="p-4">Identificación</th>
                <th className="p-4">Motivo</th>
                <th className="p-4">Tipificación</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Fecha retiro</th>
              </tr>
            </thead>

            <tbody>
              {(data?.retiros_recientes || []).length > 0 ? (
                data.retiros_recientes.map((item) => (
                  <tr key={item.IdRetiroLaboral} className="border-b hover:bg-emerald-50/40">
                    <td className="p-4 font-bold">
                      {`${item.Nombres || ''} ${item.Apellidos || ''}`.toUpperCase()}
                    </td>
                    <td className="p-4">{item.NumeroIdentificacion}</td>
                    <td className="p-4">{item.motivo_retiro || 'Sin motivo'}</td>
                    <td className="p-4">{item.tipificacion_retiro || 'Sin tipificación'}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {item.EstadoCasoRRLL || 'SIN ESTADO'}
                      </span>
                    </td>
                    <td className="p-4">
                      {item.FechaRetiro
                        ? new Date(item.FechaRetiro).toLocaleDateString('es-CO')
                        : 'Sin fecha'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400 font-bold">
                    Sin retiros para el periodo seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IndicadoresRRLLView;