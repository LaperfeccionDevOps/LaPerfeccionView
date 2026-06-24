import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  RotateCcw,
  CheckCircle2,
  Eye,
  Lock,
  WalletCards,
  UploadCloud,
  ClipboardList,
  Building2,
  User,
  RefreshCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';

const mapRetiroApi = (item) => ({
  id: item.IdRetiroLaboral,
  idRetiroLaboral: item.IdRetiroLaboral,
  idRegistroPersonal: item.IdRegistroPersonal,
  identificacion: item.NumeroIdentificacion || '',
  nombre: `${item.Nombres || ''} ${item.Apellidos || ''}`.trim(),
  cliente: item.NombreCliente || 'SIN CLIENTE',
  fechaRetiro: item.FechaRetiro || '',
  fechaProceso: item.FechaProceso || '',
  fechaCierre: item.FechaCierre || '',
  fechaEnvioNomina: item.FechaEnvioNomina || '',
  estado: Number(item.IdEstadoProceso),
  estadoTexto: item.EstadoProceso || item.EstadoCasoRRLL || 'Sin estado',
  estadoCasoRRLL: item.EstadoCasoRRLL || '',
  motivo: item.MotivoRetiro || '',
  tipificacion: item.TipificacionRetiro || '',
  observacionRRLL: item.ObservacionRetiro || item.ObservacionGeneral || '',
  puedeGestionarNomina: Boolean(item.PuedeGestionarNomina),
});

const formatearFecha = (fecha) => {
  if (!fecha) return 'Pendiente';

  try {
    return new Date(fecha).toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Pendiente';
  }
};

const NominaRetirosView = () => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [retiros, setRetiros] = useState([]);
  const [retiroSeleccionado, setRetiroSeleccionado] = useState(null);
  const [observacionNomina, setObservacionNomina] = useState('');
  const [cargando, setCargando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');
  const [mensajeAccion, setMensajeAccion] = useState('');

  const cargarRetiros = async () => {
    setCargando(true);
    setErrorCarga('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/nomina-retiros`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.detail || data?.message || 'No fue posible consultar los retiros.');
      }

      const lista = Array.isArray(data.data) ? data.data.map(mapRetiroApi) : [];
      setRetiros(lista);

      if (retiroSeleccionado) {
        const actualizado = lista.find((r) => r.id === retiroSeleccionado.id);
        setRetiroSeleccionado(actualizado || null);
      }
    } catch (error) {
      console.error('Error cargando retiros de nómina:', error);
      setErrorCarga(error.message || 'Error consultando retiros de nómina.');
      setRetiros([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarRetiros();
  }, []);

  const ejecutarAccionNomina = async (accion) => {
    if (!retiroSeleccionado?.idRetiroLaboral) return;

    const confirmar =
      accion === 'finalizar'
        ? window.confirm('¿Seguro que deseas finalizar este retiro? El trabajador pasará a estado Retirado.')
        : window.confirm('¿Seguro que deseas devolver este retiro a Relaciones Laborales?');

    if (!confirmar) return;

    setProcesando(true);
    setMensajeAccion('');
    setErrorCarga('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_BASE_URL}/nomina-retiros/${retiroSeleccionado.idRetiroLaboral}/${accion}`,
        {
          method: 'PUT',
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data?.detail || data?.message || 'No fue posible procesar la acción.');
      }

      setMensajeAccion(data.message || 'Acción realizada correctamente.');
      await cargarRetiros();
    } catch (error) {
      console.error(`Error al ${accion} retiro:`, error);
      setErrorCarga(error.message || 'Error procesando acción de nómina.');
    } finally {
      setProcesando(false);
    }
  };

  const totalAbiertos = retiros.filter((r) => r.estado === 30).length;
  const totalNomina = retiros.filter((r) => r.estado === 32).length;
  const totalRetirados = retiros.filter((r) => r.estado === 35).length;

  const retirosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    return retiros.filter((r) => {
      const coincideBusqueda =
        !q ||
        String(r.identificacion || '').toLowerCase().includes(q) ||
        String(r.nombre || '').toLowerCase().includes(q) ||
        String(r.cliente || '').toLowerCase().includes(q);

      const coincideEstado =
        filtroEstado === 'todos' ||
        (filtroEstado === 'abiertos' && r.estado === 30) ||
        (filtroEstado === 'nomina' && r.estado === 32) ||
        (filtroEstado === 'retirados' && r.estado === 35);

      return coincideBusqueda && coincideEstado;
    });
  }, [busqueda, retiros, filtroEstado]);

  const puedeGestionar =
    retiroSeleccionado?.puedeGestionarNomina === true ||
    retiroSeleccionado?.estado === 32;

  const getEstadoBadge = (estado) => {
    if (estado === 32) return 'bg-emerald-100 text-emerald-700';
    if (estado === 35) return 'bg-gray-200 text-gray-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const getFiltroButtonVariant = (value) => {
    return filtroEstado === value ? 'default' : 'outline';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-2xl shadow-md border p-6">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 text-emerald-700 rounded-xl p-3">
            <WalletCards className="w-7 h-7" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-800">Nómina Retiros</h1>
            <p className="text-sm text-gray-500">
              Gestión de retiros recibidos desde Relaciones Laborales.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold">Abiertos RRLL</p>
          <p className="text-3xl font-bold text-yellow-700 mt-1">{totalAbiertos}</p>
        </div>

        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold">Enviados a Nómina</p>
          <p className="text-3xl font-bold text-emerald-700 mt-1">{totalNomina}</p>
        </div>

        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold">Retirados</p>
          <p className="text-3xl font-bold text-gray-700 mt-1">{totalRetirados}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md border p-6">
        <label className="text-sm font-semibold text-gray-700">Buscar trabajador</label>

        <div className="flex flex-col md:flex-row gap-3 mt-2">
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por identificación, nombre o cliente"
          />

          <Button type="button" onClick={cargarRetiros} disabled={cargando || procesando}>
            <RefreshCw className={`w-4 h-4 mr-2 ${cargando ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {mensajeAccion && <p className="text-sm text-emerald-700 mt-3">{mensajeAccion}</p>}
        {errorCarga && <p className="text-sm text-red-600 mt-3">{errorCarga}</p>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 bg-white rounded-2xl shadow-md border overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-bold text-gray-800">Retiros recibidos</h2>
            <p className="text-xs text-gray-500">
              Los retiros abiertos son solo consulta. Los enviados a nómina permiten gestión. Los retirados quedan como histórico.
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
              <Button type="button" variant={getFiltroButtonVariant('todos')} size="sm" onClick={() => setFiltroEstado('todos')}>
                Todos
              </Button>

              <Button type="button" variant={getFiltroButtonVariant('abiertos')} size="sm" onClick={() => setFiltroEstado('abiertos')}>
                Abiertos RRLL
              </Button>

              <Button type="button" variant={getFiltroButtonVariant('nomina')} size="sm" onClick={() => setFiltroEstado('nomina')}>
                Enviados a Nómina
              </Button>

              <Button type="button" variant={getFiltroButtonVariant('retirados')} size="sm" onClick={() => setFiltroEstado('retirados')}>
                Retirados
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1250px] w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-4 min-w-[140px]">Identificación</th>
                  <th className="text-left p-4 min-w-[230px]">Trabajador</th>
                  <th className="text-left p-4 min-w-[260px]">Cliente</th>
                  <th className="text-left p-4 min-w-[150px]">Fecha cierre RRLL</th>
                  <th className="text-left p-4 min-w-[190px]">Fecha gestión nómina</th>
                  <th className="text-left p-4 min-w-[150px]">Estado</th>
                  <th className="text-center p-4 min-w-[110px]">Acción</th>
                </tr>
              </thead>

              <tbody>
                {cargando && (
                  <tr>
                    <td colSpan="7" className="p-10 text-center text-gray-500">
                      Consultando retiros...
                    </td>
                  </tr>
                )}

                {!cargando && retirosFiltrados.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    <td className="p-4 whitespace-nowrap">{r.identificacion}</td>
                    <td className="p-4 font-medium">{r.nombre}</td>
                    <td className="p-4">{r.cliente}</td>
                    <td className="p-4 whitespace-nowrap">{r.fechaRetiro || 'Sin fecha'}</td>
                    <td className="p-4 whitespace-nowrap">{formatearFecha(r.fechaCierre)}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getEstadoBadge(r.estado)}`}>
                        {r.estadoTexto}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRetiroSeleccionado(r);
                          setObservacionNomina('');
                          setMensajeAccion('');
                          setErrorCarga('');
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                    </td>
                  </tr>
                ))}

                {!cargando && retirosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-10 text-center text-gray-500">
                      <FileText className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                      No hay retiros para el filtro seleccionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md border p-6">
          {!retiroSeleccionado ? (
            <div className="text-center text-gray-500 py-10">
              <FileText className="w-10 h-10 mx-auto mb-3 text-gray-400" />
              Selecciona un retiro para ver el detalle.
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h2 className="font-bold text-gray-800">Detalle del retiro</h2>
                <p className="text-xs text-gray-500">
                  Información recibida desde Relaciones Laborales.
                </p>
              </div>

              <div className="border rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                  <User className="w-4 h-4" />
                  Información del trabajador
                </div>

                <div className="space-y-2 text-sm">
                  <p><b>Trabajador:</b> {retiroSeleccionado.nombre}</p>
                  <p><b>Identificación:</b> {retiroSeleccionado.identificacion}</p>
                  <p><b>Fecha cierre RRLL:</b> {retiroSeleccionado.fechaRetiro || 'Sin fecha'}</p>
                  <p><b>Fecha gestión nómina:</b> {formatearFecha(retiroSeleccionado.fechaCierre)}</p>
                  <p className="flex items-center gap-1">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <b>Cliente:</b> {retiroSeleccionado.cliente}
                  </p>
                </div>
              </div>

              <div className="border rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                  <ClipboardList className="w-4 h-4" />
                  Información RRLL
                </div>

                <div className="space-y-2 text-sm">
                  <p><b>Motivo:</b> {retiroSeleccionado.motivo || 'Pendiente'}</p>
                  <p><b>Tipificación:</b> {retiroSeleccionado.tipificacion || 'Pendiente'}</p>
                  <p><b>Estado RRLL:</b> {retiroSeleccionado.estadoCasoRRLL || 'Sin estado'}</p>
                  <p><b>Observación RRLL:</b> {retiroSeleccionado.observacionRRLL || 'Sin observación'}</p>
                </div>
              </div>

              {puedeGestionar ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
                  Este retiro está enviado a nómina y puede ser gestionado.
                </div>
              ) : retiroSeleccionado.estado === 35 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 flex gap-2">
                  <Lock className="w-4 h-4 mt-0.5" />
                  Este retiro ya fue finalizado. Se muestra solo como histórico.
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800 flex gap-2">
                  <Lock className="w-4 h-4 mt-0.5" />
                  Este retiro está abierto en RRLL. Nómina solo puede consultarlo.
                </div>
              )}

              <div className="border rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                  <WalletCards className="w-4 h-4" />
                  Gestión Nómina
                </div>

                <textarea
                  value={observacionNomina}
                  onChange={(e) => setObservacionNomina(e.target.value)}
                  disabled={!puedeGestionar || procesando}
                  placeholder="Observaciones de nómina..."
                  className="w-full min-h-24 border rounded-lg p-3 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                />

                <Button type="button" variant="outline" className="w-full" disabled={!puedeGestionar || procesando}>
                  <UploadCloud className="w-4 h-4 mr-2" />
                  Adjuntar documento nómina
                </Button>
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  className="w-full"
                  disabled={!puedeGestionar || procesando}
                  onClick={() => ejecutarAccionNomina('finalizar')}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {procesando ? 'Procesando...' : 'Finalizar retiro'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={!puedeGestionar || procesando}
                  onClick={() => ejecutarAccionNomina('devolver')}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {procesando ? 'Procesando...' : 'Devolver a RRLL'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NominaRetirosView;