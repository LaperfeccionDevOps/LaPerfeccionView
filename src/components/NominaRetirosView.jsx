import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
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

const documentosRRLLIniciales = [];
const documentosNominaIniciales = [];

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

const NominaRetirosView = () => {
  const [busqueda, setBusqueda] = useState('');
  const [retiros, setRetiros] = useState([]);
  const [retiroSeleccionado, setRetiroSeleccionado] = useState(null);
  const [observacionNomina, setObservacionNomina] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');

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

  const retirosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    if (!q) return retiros;

    return retiros.filter((r) =>
      String(r.identificacion || '').toLowerCase().includes(q) ||
      String(r.nombre || '').toLowerCase().includes(q) ||
      String(r.cliente || '').toLowerCase().includes(q)
    );
  }, [busqueda, retiros]);

  const puedeGestionar = retiroSeleccionado?.puedeGestionarNomina === true || retiroSeleccionado?.estado === 32;

  const getEstadoBadge = (estado) => {
    if (estado === 32) return 'bg-emerald-100 text-emerald-700';
    if (estado === 35) return 'bg-gray-200 text-gray-700';
    return 'bg-yellow-100 text-yellow-700';
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

      <div className="bg-white rounded-2xl shadow-md border p-6">
        <label className="text-sm font-semibold text-gray-700">
          Buscar trabajador
        </label>

        <div className="flex gap-3 mt-2">
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por identificación, nombre o cliente"
          />

          <Button type="button" onClick={cargarRetiros} disabled={cargando}>
            <RefreshCw className={`w-4 h-4 mr-2 ${cargando ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {errorCarga && (
          <p className="text-sm text-red-600 mt-3">
            {errorCarga}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-md border overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-bold text-gray-800">Retiros recibidos</h2>
            <p className="text-xs text-gray-500">
              Los retiros abiertos son solo consulta. Los enviados a nómina permiten gestión.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3">Identificación</th>
                  <th className="text-left p-3">Trabajador</th>
                  <th className="text-left p-3">Cliente</th>
                  <th className="text-left p-3">Fecha retiro</th>
                  <th className="text-left p-3">Estado</th>
                  <th className="text-center p-3">Acción</th>
                </tr>
              </thead>

              <tbody>
                {cargando && (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-gray-500">
                      Consultando retiros...
                    </td>
                  </tr>
                )}

                {!cargando && retirosFiltrados.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{r.identificacion}</td>
                    <td className="p-3 font-medium">{r.nombre}</td>
                    <td className="p-3">{r.cliente}</td>
                    <td className="p-3">{r.fechaRetiro || 'Sin fecha'}</td>
                    <td className="p-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoBadge(r.estado)}`}>
                        {r.estadoTexto}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRetiroSeleccionado(r);
                          setObservacionNomina('');
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
                    <td colSpan="6" className="p-10 text-center text-gray-500">
                      <FileText className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                      No hay retiros cargados todavía.
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
                  <p><b>Fecha retiro:</b> {retiroSeleccionado.fechaRetiro || 'Sin fecha'}</p>
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

                <div className="pt-2 border-t">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Documentos RRLL</p>

                  {documentosRRLLIniciales.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      Los documentos RRLL se conectarán en el siguiente paso.
                    </p>
                  ) : (
                    documentosRRLLIniciales.map((doc) => (
                      <div key={doc.id} className="text-sm border rounded-lg p-2 mb-2">
                        {doc.nombre}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {puedeGestionar ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
                  Este retiro está enviado a nómina y puede ser gestionado.
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
                  disabled={!puedeGestionar}
                  placeholder="Observaciones de nómina..."
                  className="w-full min-h-24 border rounded-lg p-3 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                />

                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Documentos Nómina</p>

                  {documentosNominaIniciales.length === 0 ? (
                    <p className="text-xs text-gray-500 mb-3">
                      No hay documentos de nómina cargados.
                    </p>
                  ) : (
                    documentosNominaIniciales.map((doc) => (
                      <div key={doc.id} className="text-sm border rounded-lg p-2 mb-2">
                        {doc.nombre}
                      </div>
                    ))
                  )}

                  <Button type="button" variant="outline" className="w-full" disabled={!puedeGestionar}>
                    <UploadCloud className="w-4 h-4 mr-2" />
                    Adjuntar documento nómina
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Button type="button" className="w-full" disabled={!puedeGestionar}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Finalizar retiro
                </Button>

                <Button type="button" variant="outline" className="w-full" disabled={!puedeGestionar}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Devolver a RRLL
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