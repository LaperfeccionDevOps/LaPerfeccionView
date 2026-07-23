import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Filter,
  FolderOpen,
  RefreshCw,
  Send,
  TimerReset,
  TrendingUp,
  Users,
} from 'lucide-react';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  '';

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

const numero = (valor) => {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
};

const entero = (valor) =>
  new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
  }).format(numero(valor));

const decimal = (valor) =>
  new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numero(valor));

const porcentaje = (valor) => `${decimal(valor)}%`;

const fechaColombia = (valor) => {
  if (!valor) return 'Sin fecha';

  const texto = String(valor);
  const coincidencia = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (coincidencia) {
    return `${coincidencia[3]}/${coincidencia[2]}/${coincidencia[1]}`;
  }

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(fecha);
};

const IndicadoresRRLLView = () => {
  const anioActual = new Date().getFullYear();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [anio, setAnio] = useState(anioActual);
  const [mes, setMes] = useState('');
  const [cliente, setCliente] = useState('');
  const [tipoPeriodo, setTipoPeriodo] = useState('gestion');
  const [anioGrafica, setAnioGrafica] = useState(Math.max(2026, anioActual));

  const cargarIndicadores = async (forzados = null) => {
    try {
      setLoading(true);
      setError('');

      const filtros = forzados || {
        anio,
        mes,
        cliente,
        tipoPeriodo,
        anioGrafica,
      };

      const params = new URLSearchParams();
      params.append('anio', filtros.anio || anioActual);
      params.append('tipo_periodo', filtros.tipoPeriodo || 'gestion');
      params.append(
        'anio_grafica',
        filtros.anioGrafica || Math.max(2026, anioActual)
      );

      if (filtros.mes) params.append('mes', filtros.mes);
      if (filtros.cliente) params.append('id_cliente', filtros.cliente);

      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_BASE_URL}/retiros-laborales/dashboard-indicadores?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(
          json?.detail ||
            json?.message ||
            'No fue posible consultar los indicadores RRLL.'
        );
      }

      setData(json.data || null);
    } catch (err) {
      console.error('[IndicadoresRRLLView]', err);
      setData(null);
      setError(err.message || 'Error cargando indicadores RRLL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarIndicadores({
      anio: anioActual,
      mes: '',
      cliente: '',
      tipoPeriodo: 'gestion',
      anioGrafica: Math.max(2026, anioActual),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      cargarIndicadores({
        anio,
        mes,
        cliente,
        tipoPeriodo,
        anioGrafica,
      });
    }, 60000);

    return () => window.clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anio, mes, cliente, tipoPeriodo, anioGrafica]);

  const aniosGrafica = useMemo(() => {
    const ultimoAnio = Math.max(2026, anioActual);
    return Array.from(
      { length: ultimoAnio - 2026 + 1 },
      (_, index) => 2026 + index
    ).reverse();
  }, [anioActual]);

  const limpiarFiltros = () => {
    setAnio(anioActual);
    setMes('');
    setCliente('');
    setTipoPeriodo('gestion');
    setAnioGrafica(Math.max(2026, anioActual));

    cargarIndicadores({
      anio: anioActual,
      mes: '',
      cliente: '',
      tipoPeriodo: 'gestion',
      anioGrafica: Math.max(2026, anioActual),
    });
  };

  const filtros = data?.filtros || {};
  const totales = data?.totales || {};
  const tiempo = data?.tiempo_gestion_rrll || {};

  const anios = useMemo(() => {
    const disponibles = (filtros.anios_disponibles || [])
      .map(numero)
      .filter((item) => item > 0);

    return Array.from(new Set([anioActual, ...disponibles])).sort(
      (a, b) => b - a
    );
  }, [filtros.anios_disponibles, anioActual]);

  const clientes = filtros.clientes || [];

  const periodoTexto = useMemo(() => {
    const mesTexto = MESES.find(
      (item) => String(item.value) === String(mes)
    )?.label;

    const clienteTexto = clientes.find(
      (item) => String(item.id_cliente) === String(cliente)
    )?.cliente;

    const partes = [
      tipoPeriodo === 'gestion'
        ? 'Actividad de RRLL'
        : 'Último día laborado',
      mesTexto,
      anio,
      clienteTexto,
    ].filter(Boolean);

    return partes.join(' · ');
  }, [tipoPeriodo, mes, anio, cliente, clientes]);

  const normalizar = (items, labelKey) =>
    (items || [])
      .map((item) => ({
        ...item,
        [labelKey]: item[labelKey] || 'SIN DATO',
        cantidad: numero(item.cantidad),
        porcentaje: numero(item.porcentaje),
      }))
      .sort((a, b) => b.cantidad - a.cantidad);

  const sedes = useMemo(
    () => normalizar(data?.sedes, 'sede'),
    [data]
  );
  const motivos = useMemo(
    () => normalizar(data?.motivos, 'motivo'),
    [data]
  );
  const tipificaciones = useMemo(
    () => normalizar(data?.tipificaciones, 'tipificacion'),
    [data]
  );

  const motivosPorSede = useMemo(
    () =>
      (data?.motivos_por_sede || []).map((item) => ({
        ...item,
        etiqueta: `${item.sede || 'SIN SEDE REGISTRADA'} · ${
          item.motivo || 'SIN MOTIVO'
        }`,
        cantidad: numero(item.cantidad),
        porcentaje: numero(item.porcentaje_dentro_sede),
      }))
        .sort((a, b) => b.cantidad - a.cantidad),
    [data]
  );

  const tipificacionesPorSede = useMemo(
    () =>
      (data?.tipificaciones_por_sede || []).map((item) => ({
        ...item,
        etiqueta: `${item.sede || 'SIN SEDE REGISTRADA'} · ${
          item.tipificacion || 'SIN TIPIFICACIÓN'
        }`,
        cantidad: numero(item.cantidad),
        porcentaje: numero(item.porcentaje_dentro_sede),
      }))
        .sort((a, b) => b.cantidad - a.cantidad),
    [data]
  );

  const entrevistas = useMemo(
    () =>
      (data?.entrevistas || []).map((item) => ({
        estado: item.estado,
        cantidad: numero(item.cantidad),
        porcentaje: numero(item.porcentaje),
      })),
    [data]
  );

  const gestionMensual = useMemo(
    () =>
      (data?.gestion_mensual || []).map((item) => ({
        ...item,
        procesos_iniciados: numero(item.procesos_iniciados),
        enviados_nomina: numero(item.enviados_nomina),
      })),
    [data]
  );

  const Kpi = ({ title, value, detail, icon: Icon, accent = false }) => (
    <article className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="break-words text-sm font-bold text-gray-500">
            {title}
          </p>
          <p
            className={`mt-3 break-words text-4xl font-black ${
              accent ? 'text-emerald-700' : 'text-gray-900'
            }`}
          >
            {value}
          </p>
          <p className="mt-2 break-words text-xs text-gray-500">
            {detail}
          </p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
          <Icon className="h-6 w-6 text-emerald-700" />
        </div>
      </div>
    </article>
  );

  const Encabezado = ({ title, subtitle, icon: Icon }) => (
    <div className="mb-5 flex min-w-0 items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
        <Icon className="h-5 w-5 text-emerald-700" />
      </div>
      <div className="min-w-0">
        <h2 className="break-words text-xl font-black text-gray-900">
          {title}
        </h2>
        <p className="mt-1 break-words text-sm text-gray-500">
          {subtitle}
        </p>
      </div>
    </div>
  );

  const TooltipDetalle = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;

    const fila = payload[0]?.payload || {};

    return (
      <div className="max-w-[300px] rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
        <p className="break-words text-sm font-black text-gray-900">
          {label || fila.etiqueta || 'Detalle'}
        </p>

        {payload.map((item) => (
          <p
            key={`${item.dataKey}-${item.name}`}
            className="mt-1 text-sm text-gray-600"
          >
            {item.name}: <strong>{entero(item.value)}</strong>
          </p>
        ))}

        {fila.porcentaje !== undefined ? (
          <p className="mt-1 text-sm text-emerald-700">
            Porcentaje: <strong>{porcentaje(fila.porcentaje)}</strong>
          </p>
        ) : null}
      </div>
    );
  };

  const Tabla = ({
    rows,
    labelKey,
    labelTitle,
    percentageKey = 'porcentaje',
  }) => (
    <div className="mt-5 overflow-hidden rounded-xl border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px] table-fixed text-left">
          <thead className="bg-gray-900 text-white">
            <tr>
              <th className="w-[58%] px-4 py-3 text-xs font-black uppercase">
                {labelTitle}
              </th>
              <th className="w-[21%] px-4 py-3 text-right text-xs font-black uppercase">
                Cantidad
              </th>
              <th className="w-[21%] px-4 py-3 text-right text-xs font-black uppercase">
                Porcentaje
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((item, index) => (
                <tr
                  key={`${item[labelKey]}-${index}`}
                  className="border-t border-gray-100"
                >
                  <td className="break-words px-4 py-3 text-sm font-bold text-gray-800">
                    {item[labelKey]}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700">
                    {entero(item.cantidad)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-black text-emerald-700">
                    {porcentaje(item[percentageKey])}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="3"
                  className="px-4 py-6 text-center text-sm font-bold text-gray-400"
                >
                  Sin información para los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const Distribucion = ({
    title,
    subtitle,
    icon,
    rows,
    labelKey,
    labelTitle,
    top = 10,
  }) => {
    const grafica = rows.slice(0, top);

    return (
      <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <Encabezado title={title} subtitle={subtitle} icon={icon} />

        {grafica.length ? (
          <div className="h-[320px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={grafica}
                layout="vertical"
                barCategoryGap="55%"
                margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey={labelKey}
                  width={135}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) =>
                    String(value).length > 22
                      ? `${String(value).slice(0, 22)}…`
                      : value
                  }
                />
                <Tooltip content={<TooltipDetalle />} />
                <Bar
                  dataKey="cantidad"
                  name="Cantidad"
                  fill="#059669"
                  maxBarSize={18}
                  radius={[0, 5, 5, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm font-bold text-gray-400">
            Sin información para los filtros seleccionados.
          </div>
        )}

        <Tabla
          rows={rows.slice(0, top)}
          labelKey={labelKey}
          labelTitle={labelTitle}
        />
      </section>
    );
  };

  if (loading && !data) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 text-gray-700">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-700" />
          <p className="font-bold">Cargando indicadores RRLL...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6 overflow-x-hidden pb-8">
      <header className="rounded-2xl border border-gray-200 border-t-4 border-t-emerald-600 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex min-w-0 flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600">
              <FolderOpen className="h-7 w-7 text-white" />
            </div>

            <div className="min-w-0">
              <h1 className="break-words text-2xl font-black text-gray-900 sm:text-3xl">
                Indicadores RRLL - Retiros
              </h1>
              <p className="mt-1 break-words text-sm text-gray-500">
                Estados, causas, sedes, entrevistas y tiempos reales del
                proceso gestionado por Relaciones Laborales.
              </p>

              <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-800">
                <CalendarDays className="h-4 w-4 shrink-0" />
                <span className="truncate">{periodoTexto}</span>
              </div>
            </div>
          </div>

          <div className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-3 xl:max-w-[980px]">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
              <label className="min-w-0 xl:col-span-3">
                <span className="mb-1 block text-[11px] font-black text-gray-600">
                  Analizar por
                </span>
                <select
                  value={tipoPeriodo}
                  onChange={(event) =>
                    setTipoPeriodo(event.target.value)
                  }
                  className="h-10 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs font-bold text-gray-900"
                >
                  <option value="gestion">Actividad de RRLL</option>
                  <option value="retiro">Último día laborado</option>
                </select>
              </label>

              <label className="min-w-0 xl:col-span-2">
                <span className="mb-1 block text-[11px] font-black text-gray-600">
                  Año
                </span>
                <select
                  value={anio}
                  onChange={(event) => setAnio(event.target.value)}
                  className="h-10 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs font-bold text-gray-900"
                >
                  {anios.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="min-w-0 xl:col-span-2">
                <span className="mb-1 block text-[11px] font-black text-gray-600">
                  Mes
                </span>
                <select
                  value={mes}
                  onChange={(event) => setMes(event.target.value)}
                  className="h-10 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs font-bold text-gray-900"
                >
                  {MESES.map((item) => (
                    <option key={item.label} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="min-w-0 md:col-span-2 xl:col-span-5">
                <span className="mb-1 block text-[11px] font-black text-gray-600">
                  Sede / cliente
                </span>
                <select
                  value={cliente}
                  onChange={(event) => setCliente(event.target.value)}
                  className="h-10 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs font-bold text-gray-900"
                >
                  <option value="">Todas las sedes</option>
                  {clientes.map((item) => (
                    <option
                      key={item.id_cliente}
                      value={item.id_cliente}
                    >
                      {item.cliente}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => cargarIndicadores()}
                disabled={loading}
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60 xl:col-span-6"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Filter className="h-4 w-4" />
                )}
                Filtrar
              </button>

              <button
                type="button"
                onClick={limpiarFiltros}
                disabled={loading}
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-black text-white hover:bg-gray-800 disabled:opacity-60 xl:col-span-6"
              >
                <RefreshCw className="h-4 w-4" />
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-black">No fue posible cargar los indicadores.</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        </div>
      ) : null}

      <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Kpi
          title="Total procesos RRLL"
          value={entero(totales.total_retiros)}
          detail="Todos los procesos incluidos en el filtro."
          icon={Users}
        />
        <Kpi
          title="En gestión por RRLL"
          value={entero(totales.en_gestion_rrll)}
          detail="Todos los procesos con estado ABIERTO."
          icon={Clock3}
        />
        <Kpi
          title="Enviados a Nómina"
          value={entero(totales.enviados_nomina)}
          detail="Procesos con estado ENVIADO_NOMINA o CERRADO."
          icon={Send}
          accent
        />
        <Kpi
          title="Entrevistas de retiro realizadas"
          value={entero(totales.entrevistas_realizadas)}
          detail="Procesos abiertos con entrevista de retiro en PDF."
          icon={ClipboardCheck}
          accent
        />
        <Kpi
          title="Entrevistas de retiro pendientes"
          value={entero(totales.entrevistas_pendientes)}
          detail="Procesos abiertos que aún no tienen entrevista de retiro."
          icon={ClipboardCheck}
        />
        <Kpi
          title="Cobertura de entrevistas de retiro"
          value={porcentaje(totales.porcentaje_entrevistas)}
          detail={`${entero(
            totales.entrevistas_realizadas
          )} entrevistas realizadas de ${entero(
            totales.en_gestion_rrll
          )} procesos abiertos.`}
          icon={TimerReset}
          accent
        />
      </section>

      <section className="grid min-w-0 grid-cols-1 gap-6 2xl:grid-cols-2">
        <Distribucion
          title="Retiros por sede"
          subtitle="Cantidad de procesos por sede o cliente y participación sobre el total filtrado."
          icon={BarChart3}
          rows={sedes}
          labelKey="sede"
          labelTitle="Sede / cliente"
        />
        <Distribucion
          title="Motivos de retiro"
          subtitle="Motivos generales registrados en los procesos incluidos."
          icon={AlertTriangle}
          rows={motivos}
          labelKey="motivo"
          labelTitle="Motivo"
        />
        <Distribucion
          title="Tipificaciones de retiro"
          subtitle="Causas específicas registradas por RRLL."
          icon={ClipboardCheck}
          rows={tipificaciones}
          labelKey="tipificacion"
          labelTitle="Tipificación"
        />

        <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <Encabezado
              title="Evolución mensual de retiros"
              subtitle="Cada línea representa el momento en que ocurrió una etapa del proceso."
              icon={TrendingUp}
            />

            <label className="flex shrink-0 items-center gap-2 self-start rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="text-xs font-black text-gray-600">Año</span>
              <select
                value={anioGrafica}
                onChange={(event) => {
                  const nuevoAnio = Number(event.target.value);
                  setAnioGrafica(nuevoAnio);
                  cargarIndicadores({
                    anio,
                    mes,
                    cliente,
                    tipoPeriodo,
                    anioGrafica: nuevoAnio,
                  });
                }}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-black text-gray-900"
              >
                {aniosGrafica.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-blue-900">
              <strong>Azul:</strong> cuando RRLL inició el proceso.
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-emerald-900">
              <strong>Verde:</strong> cuando RRLL envió el proceso a Nómina.
            </div>
          </div>

          <div className="h-[320px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={gestionMensual}
                margin={{ top: 15, right: 20, left: 0, bottom: 45 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="mes"
                  interval={0}
                  angle={-22}
                  textAnchor="end"
                  height={70}
                  tick={{ fontSize: 10 }}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip content={<TooltipDetalle />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="procesos_iniciados"
                  name="Procesos iniciados"
                  stroke="#2563eb"
                  strokeWidth={1.25}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="enviados_nomina"
                  name="Enviados a Nómina"
                  stroke="#059669"
                  strokeWidth={1.25}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left">
                <thead className="bg-gray-900 text-white">
                  <tr>
                    <th className="px-4 py-3 text-xs font-black uppercase">
                      Mes
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-black uppercase">
                      Iniciados por RRLL
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-black uppercase">
                      Enviados a Nómina
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {gestionMensual.map((item) => (
                    <tr
                      key={item.numero_mes}
                      className="border-t border-gray-100"
                    >
                      <td className="px-4 py-3 text-sm font-bold text-gray-800">
                        {item.mes}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {entero(item.procesos_iniciados)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-black text-emerald-700">
                        {entero(item.enviados_nomina)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </section>

      <section className="grid min-w-0 grid-cols-1 gap-6 2xl:grid-cols-2">
        <Distribucion
          title="Motivos por sede"
          subtitle="Motivos dentro de cada sede. El porcentaje se calcula contra el total de esa misma sede."
          icon={BarChart3}
          rows={motivosPorSede}
          labelKey="etiqueta"
          labelTitle="Sede · motivo"
          top={12}
        />
        <Distribucion
          title="Tipificaciones por sede"
          subtitle="Tipificaciones dentro de cada sede. El porcentaje se calcula contra el total de esa misma sede."
          icon={ClipboardCheck}
          rows={tipificacionesPorSede}
          labelKey="etiqueta"
          labelTitle="Sede · tipificación"
          top={12}
        />
      </section>

      <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <Encabezado
          title="Entrevistas de retiro"
          subtitle="Cobertura calculada únicamente sobre los procesos abiertos incluidos en el filtro."
          icon={ClipboardCheck}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <article className="rounded-xl border border-gray-200 bg-gray-50 p-5">
            <p className="text-sm font-black text-gray-600">
              Total procesos abiertos
            </p>
            <p className="mt-2 text-4xl font-black text-gray-900">
              {entero(totales.total_retiros)}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Base de procesos abiertos para medir la cobertura.
            </p>
          </article>

          <article className="rounded-xl border border-gray-200 bg-gray-50 p-5">
            <p className="text-sm font-black text-gray-600">
              Entrevistas de retiro realizadas
            </p>
            <p className="mt-2 text-4xl font-black text-emerald-700">
              {entero(totales.entrevistas_realizadas)}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Con PDF generado y disponible.
            </p>
          </article>

          <article className="rounded-xl border border-gray-200 bg-gray-50 p-5">
            <p className="text-sm font-black text-gray-600">
              Cobertura de entrevistas
            </p>
            <p className="mt-2 text-4xl font-black text-emerald-700">
              {porcentaje(totales.porcentaje_entrevistas)}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {entero(totales.entrevistas_pendientes)} entrevistas de retiro pendientes.
            </p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, numero(totales.porcentaje_entrevistas))
                  )}%`,
                }}
              />
            </div>
          </article>
        </div>
      </section>

      <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <Encabezado
          title="Retiros recientes"
          subtitle="Últimos 10 procesos que coinciden con año, mes, sede y tipo de análisis seleccionados."
          icon={Users}
        />

        <div className="overflow-hidden rounded-xl border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1160px] text-left">
              <thead className="bg-gray-900 text-white">
                <tr>
                  <th className="px-4 py-3 text-xs font-black uppercase">
                    Trabajador
                  </th>
                  <th className="px-4 py-3 text-xs font-black uppercase">
                    Identificación
                  </th>
                  <th className="px-4 py-3 text-xs font-black uppercase">
                    Sede
                  </th>
                  <th className="px-4 py-3 text-xs font-black uppercase">
                    Motivo
                  </th>
                  <th className="px-4 py-3 text-xs font-black uppercase">
                    Tipificación
                  </th>
                  <th className="px-4 py-3 text-xs font-black uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-xs font-black uppercase">
                    Inicio del proceso RRLL
                  </th>
                  <th className="px-4 py-3 text-xs font-black uppercase">
                    Envío a Nómina
                  </th>
                </tr>
              </thead>
              <tbody>
                {(data?.retiros_recientes || []).length ? (
                  data.retiros_recientes.map((item) => (
                    <tr
                      key={item.IdRetiroLaboral}
                      className="border-t border-gray-100 align-top hover:bg-emerald-50/40"
                    >
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">
                        {`${item.Nombres || ''} ${
                          item.Apellidos || ''
                        }`.trim() || 'SIN NOMBRE'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.NumeroIdentificacion || 'Sin identificación'}
                      </td>
                      <td className="max-w-[200px] break-words px-4 py-3 text-sm">
                        {item.sede_cliente || 'SIN SEDE REGISTRADA'}
                      </td>
                      <td className="max-w-[230px] break-words px-4 py-3 text-sm">
                        {item.motivo_retiro || 'SIN MOTIVO'}
                      </td>
                      <td className="max-w-[230px] break-words px-4 py-3 text-sm">
                        {item.tipificacion_retiro || 'SIN TIPIFICACIÓN'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
                          {item.EstadoCasoRRLL || 'SIN ESTADO'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        {fechaColombia(item.FechaProceso)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        {fechaColombia(item.FechaCierre)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-4 py-8 text-center text-sm font-bold text-gray-400"
                    >
                      Sin procesos para los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default IndicadoresRRLLView;