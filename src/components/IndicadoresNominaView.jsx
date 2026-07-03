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

  const total = indicadores?.totales?.total || 0;
  const abiertos = indicadores?.totales?.abiertos || 0;
  const cerrados = indicadores?.totales?.cerrados || 0;
  const retirados = indicadores?.totales?.retirados || 0;

  const dataEstados = useMemo(() => {
    const base = indicadores?.distribucionEstados?.length
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
  }, [indicadores, total, abiertos, cerrados, retirados]);

  const estadoPrincipal = useMemo(() => {
    if (!dataEstados.length) return null;
    return [...dataEstados].sort((a, b) => Number(b.cantidad || 0) - Number(a.cantidad || 0))[0];
  }, [dataEstados]);

  const estadoActivo = estadoSeleccionado || estadoPrincipal;

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
    return retiros.filter((r) => grupoEstadoRetiro(r) === 'Cerrado' && !r.fechaPagoLiquidacion).length;
  }, [retiros]);

  const porcentajeFinalizacion = total > 0 ? Math.round((retirados / total) * 100) : 0;
  const porcentajeGestionable = total > 0 ? Math.round((cerrados / total) * 100) : 0;
  const porcentajeAbiertos = total > 0 ? Math.round((abiertos / total) * 100) : 0;

  const topClientes = useMemo(() => {
    const acumulado = {};

    retiros.forEach((retiro) => {
      const cliente = normalizarTexto(retiro.cliente, 'SIN CLIENTE').toUpperCase();
      acumulado[cliente] = (acumulado[cliente] || 0) + 1;
    });

    return Object.entries(acumulado)
      .map(([cliente, cantidad]) => ({ cliente, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);
  }, [retiros]);

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
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Retiros por mes</h2>
            <p className="text-sm text-gray-500">
              Evolución mensual de los retiros registrados con filtro por año y mes.
            </p>
          </div>

          <div className="bg-gray-50 border rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 text-gray-600 font-semibold text-sm">
              <Filter className="w-4 h-4" />
              Filtros
            </div>

            <select
              value={anioSeleccionado}
              onChange={(e) => setAnioSeleccionado(e.target.value)}
              className="border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              <option value="todos">Todos los años</option>
              {aniosDisponibles.map((anio) => (
                <option key={anio} value={anio}>
                  {anio}
                </option>
              ))}
            </select>

            <select
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(e.target.value)}
              className="border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              {mesesOpciones.map((mes) => (
                <option key={mes.value} value={mes.value}>
                  {mes.label}
                </option>
              ))}
            </select>
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
    </div>
  );
};

export default IndicadoresNominaView;
