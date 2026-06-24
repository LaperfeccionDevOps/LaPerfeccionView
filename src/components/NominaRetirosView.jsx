import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  RotateCcw,
  CheckCircle2,
  Eye,
  Lock,
  WalletCards,
  UploadCloud,
  Building2,
  User,
  RefreshCw,
  X,
  Download,
  Trash2,
  AlertCircle,
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

const NominaRetirosView = () => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [retiros, setRetiros] = useState([]);
  const [retiroSeleccionado, setRetiroSeleccionado] = useState(null);

  const [documentosRetiro, setDocumentosRetiro] = useState([]);
  const [cargandoDocumentosRetiro, setCargandoDocumentosRetiro] = useState(false);

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

  const cargarDocumentosRetiro = async (retiro) => {
    const idRegistroPersonal = retiro?.idRegistroPersonal || retiro?.IdRegistroPersonal;

    if (!idRegistroPersonal) {
      setDocumentosRetiro([]);
      return;
    }

    setCargandoDocumentosRetiro(true);

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_BASE_URL}/retiros-laborales/carpeta-digital/${idRegistroPersonal}/documentos`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || data?.message || 'No fue posible consultar documentos de retiro.');
      }

      setDocumentosRetiro(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      console.error('Error cargando documentos de retiro:', error);
      setDocumentosRetiro([]);
      setErrorCarga(error.message || 'Error consultando documentos de retiro.');
    } finally {
      setCargandoDocumentosRetiro(false);
    }
  };

  const cerrarModal = () => {
    setRetiroSeleccionado(null);
    setDocumentosRetiro([]);
    setMensajeAccion('');
    setErrorCarga('');
  };

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

  const handleSubirDocumentoNomina = async (idTipoDocumentoRetiro, archivo) => {
    if (!retiroSeleccionado?.idRetiroLaboral) {
      setErrorCarga('No hay un retiro seleccionado.');
      return;
    }

    if (!archivo) {
      setErrorCarga('Selecciona un archivo para adjuntar.');
      return;
    }

    setProcesando(true);
    setMensajeAccion('');
    setErrorCarga('');

    try {
      const token = localStorage.getItem('token');

      const formData = new FormData();
      formData.append('IdTipoDocumentoRetiro', String(idTipoDocumentoRetiro));
      formData.append('file', archivo);

      const response = await fetch(
        `${API_BASE_URL}/nomina-retiros/${retiroSeleccionado.idRetiroLaboral}/adjuntos`,
        {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data?.detail || data?.message || 'No fue posible adjuntar el documento.');
      }

      setMensajeAccion(data.message || 'Documento adjuntado correctamente.');

      const input = document.getElementById(`archivo-nomina-${idTipoDocumentoRetiro}`);
      if (input) input.value = '';

      await cargarDocumentosRetiro(retiroSeleccionado);
      await cargarRetiros();
    } catch (error) {
      console.error('Error adjuntando documento de nómina:', error);
      setErrorCarga(error.message || 'Error al adjuntar documento de nómina.');
    } finally {
      setProcesando(false);
    }
  };

  const verDocumentoRetiro = async (doc) => {
    try {
      if (doc?.OrigenArchivo === 'ENTREVISTA' && !doc?.IdEntrevistaRetiro) {
        setErrorCarga('No hay entrevista para visualizar.');
        return;
      }

      if (doc?.OrigenArchivo !== 'ENTREVISTA' && !doc?.IdRetiroLaboralAdjunto) {
        setErrorCarga('No hay archivo para visualizar.');
        return;
      }

      const urlDescarga =
        doc?.OrigenArchivo === 'ENTREVISTA'
          ? `${API_BASE_URL}/retiros-laborales/carpeta-digital/entrevista-retiro/${doc.IdEntrevistaRetiro}/descargar`
          : `${API_BASE_URL}/rrll/adjuntos/${doc.IdRetiroLaboralAdjunto}/descargar`;

      const response = await fetch(urlDescarga);

      if (!response.ok) {
        throw new Error('No fue posible visualizar el documento.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      window.open(url, '_blank');

      setTimeout(() => URL.revokeObjectURL(url), 15000);
    } catch (error) {
      console.error('Error visualizando documento de retiro:', error);
      setErrorCarga(error.message || 'No fue posible visualizar el documento.');
    }
  };

  const descargarDocumentoRetiro = async (doc) => {
    try {
      if (doc?.OrigenArchivo === 'ENTREVISTA' && !doc?.IdEntrevistaRetiro) {
        setErrorCarga('No hay entrevista para descargar.');
        return;
      }

      if (doc?.OrigenArchivo !== 'ENTREVISTA' && !doc?.IdRetiroLaboralAdjunto) {
        setErrorCarga('No hay archivo para descargar.');
        return;
      }

      const urlDescarga =
        doc?.OrigenArchivo === 'ENTREVISTA'
          ? `${API_BASE_URL}/retiros-laborales/carpeta-digital/entrevista-retiro/${doc.IdEntrevistaRetiro}/descargar`
          : `${API_BASE_URL}/rrll/adjuntos/${doc.IdRetiroLaboralAdjunto}/descargar`;

      const response = await fetch(urlDescarga);

      if (!response.ok) {
        throw new Error('No fue posible descargar el documento.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');

      a.href = url;
      a.download =
        doc.NombreArchivoOriginal ||
        doc.NombreArchivo ||
        `${doc.NombreDocumento || 'documento_retiro'}.pdf`;

      a.click();

      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (error) {
      console.error('Error descargando documento de retiro:', error);
      setErrorCarga(error.message || 'No fue posible descargar el documento.');
    }
  };

  const eliminarDocumentoNomina = async (doc) => {
    if (!doc?.IdRetiroLaboralAdjunto) {
      setErrorCarga('No hay documento para eliminar.');
      return;
    }

    const confirmar = window.confirm(`¿Seguro que deseas eliminar ${doc.NombreDocumento}?`);
    if (!confirmar) return;

    setProcesando(true);
    setMensajeAccion('');
    setErrorCarga('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_BASE_URL}/rrll/adjuntos/${doc.IdRetiroLaboralAdjunto}`,
        {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || data?.message || 'No fue posible eliminar el documento.');
      }

      setMensajeAccion(data?.message || 'Documento eliminado correctamente.');
      await cargarDocumentosRetiro(retiroSeleccionado);
    } catch (error) {
      console.error('Error eliminando documento de nómina:', error);
      setErrorCarga(error.message || 'Error al eliminar documento de nómina.');
    } finally {
      setProcesando(false);
    }
  };

  const esDocumentoNominaEditable = (doc) => {
    const nombre = String(doc?.NombreDocumento || '').toUpperCase();

    return (
      nombre.includes('RETIRO ARL') ||
      nombre.includes('LIQUIDACIÓN DE CONTRATO') ||
      nombre.includes('LIQUIDACION DE CONTRATO')
    );
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

      <div className="bg-white rounded-2xl shadow-md border overflow-hidden">
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
              Abiertos
            </Button>

            <Button type="button" variant={getFiltroButtonVariant('nomina')} size="sm" onClick={() => setFiltroEstado('nomina')}>
              Cerrados
            </Button>

            <Button type="button" variant={getFiltroButtonVariant('retirados')} size="sm" onClick={() => setFiltroEstado('retirados')}>
              Retirados
            </Button>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-4 min-w-[150px]">Identificación</th>
              <th className="text-left p-4 min-w-[260px]">Trabajador</th>
              <th className="text-left p-4 min-w-[150px]">Estado</th>
              <th className="text-center p-4 min-w-[120px]">Acción</th>
            </tr>
          </thead>

          <tbody>
            {cargando && (
              <tr>
                <td colSpan="4" className="p-10 text-center text-gray-500">
                  Consultando retiros...
                </td>
              </tr>
            )}

            {!cargando && retirosFiltrados.map((r) => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                <td className="p-4 whitespace-nowrap">{r.identificacion}</td>

                <td className="p-4 font-medium">
                  {r.nombre}
                </td>

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
                      setDocumentosRetiro([]);
                      setMensajeAccion('');
                      setErrorCarga('');
                      cargarDocumentosRetiro(r);
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
                <td colSpan="4" className="p-10 text-center text-gray-500">
                  <FileText className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                  No hay retiros para el filtro seleccionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {retiroSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border">
            <div className="sticky top-0 bg-white z-10 border-b px-8 py-5 flex items-center justify-between rounded-t-3xl">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Detalle del retiro
                </h2>
                <p className="text-sm text-gray-500">
                  Información del trabajador y documentos visibles para nómina.
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarModal}
                className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="border rounded-2xl p-5 bg-gray-50">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold mb-4">
                    <User className="w-5 h-5" />
                    Información del trabajador
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 font-semibold">Trabajador</p>
                      <p className="text-gray-900">{retiroSeleccionado.nombre || 'Sin información'}</p>
                    </div>

                    <div>
                      <p className="text-gray-500 font-semibold">Identificación</p>
                      <p className="text-gray-900">{retiroSeleccionado.identificacion || 'Sin información'}</p>
                    </div>

                    <div>
                      <p className="text-gray-500 font-semibold">Fecha de retiro</p>
                      <p className="text-gray-900">{retiroSeleccionado.fechaRetiro || 'Sin fecha'}</p>
                    </div>

                    <div>
                      <p className="text-gray-500 font-semibold">Estado</p>
                      <span className={`inline-flex mt-1 px-3 py-1 rounded-full text-xs font-semibold ${getEstadoBadge(retiroSeleccionado.estado)}`}>
                        {retiroSeleccionado.estadoTexto}
                      </span>
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-gray-500 font-semibold">Cliente</p>
                      <p className="text-gray-900 flex items-center gap-1">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        {retiroSeleccionado.cliente || 'SIN CLIENTE'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-2xl p-5 bg-gray-50">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold mb-4">
                    <FileText className="w-5 h-5" />
                    Información del retiro
                  </div>

                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="text-gray-500 font-semibold">Motivo de retiro</p>
                      <p className="text-gray-900">{retiroSeleccionado.motivo || 'Pendiente'}</p>
                    </div>

                    <div>
                      <p className="text-gray-500 font-semibold">Observación RRLL</p>
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {retiroSeleccionado.observacionRRLL || 'Sin observación'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {puedeGestionar ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm text-emerald-800">
                  Este retiro está enviado a nómina y permite gestionar los documentos propios de nómina.
                </div>
              ) : retiroSeleccionado.estado === 35 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-700 flex gap-2">
                  <Lock className="w-4 h-4 mt-0.5" />
                  Este retiro ya fue finalizado. Se muestra solo como histórico.
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm text-yellow-800 flex gap-2">
                  <Lock className="w-4 h-4 mt-0.5" />
                  Este retiro está abierto en RRLL. Nómina solo puede consultarlo.
                </div>
              )}

              <div className="border rounded-2xl p-5">
                <div className="flex items-center gap-2 text-emerald-700 font-bold mb-4">
                  <WalletCards className="w-5 h-5" />
                  Documentos del retiro
                </div>

                {cargandoDocumentosRetiro ? (
                  <div className="py-10 text-center text-gray-500">
                    Cargando documentos de retiro...
                  </div>
                ) : documentosRetiro.length === 0 ? (
                  <div className="py-10 text-center text-gray-500">
                    No se encontraron documentos de retiro para este trabajador.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {documentosRetiro.map((doc) => {
                      const hasFile = !!doc?.Adjuntado;
                      const editableNomina = esDocumentoNominaEditable(doc);

                      return (
                        <div
                          key={doc.IdTipoDocumentoRetiro}
                          className="border rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between"
                        >
                          <div>
                            <h3 className="font-bold text-gray-800 mb-2 min-h-[42px]">
                              {doc.NombreDocumento}
                            </h3>

                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold mb-4 ${
                                hasFile
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {hasFile ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                              {hasFile ? 'Adjuntado' : 'Sin archivo'}
                            </span>

                            <p className="text-xs text-gray-500 mb-4 truncate">
                              {hasFile
                                ? doc.NombreArchivoOriginal || doc.NombreArchivo || 'Documento disponible'
                                : 'Sin archivo adjunto'}
                            </p>
                          </div>

                          <div className="space-y-2">
                            {hasFile && (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-full text-blue-700 border-blue-300 hover:bg-blue-100"
                                  onClick={() => verDocumentoRetiro(doc)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Ver
                                </Button>

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-full text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                  onClick={() => descargarDocumentoRetiro(doc)}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Descargar
                                </Button>
                              </>
                            )}

                            {!hasFile && editableNomina && puedeGestionar && (
                              <>
                               <input
                                id={`archivo-nomina-${doc.IdTipoDocumentoRetiro}`}
                                type="file"
                                accept=".pdf,image/*,.doc,.docx"
                                disabled={procesando}
                                onChange={(e) => {
                                    const archivo = e.target.files?.[0] || null;
                                    handleSubirDocumentoNomina(doc.IdTipoDocumentoRetiro, archivo);
                                }}
                                className="w-full border rounded-lg p-3 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                                />

                                <p className="text-xs text-gray-500 italic">
                                Selecciona el archivo y se adjuntará automáticamente.
                                </p>
                              </>
                            )}

                            {hasFile && editableNomina && puedeGestionar && doc.OrigenArchivo === 'NOMINA' && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full text-red-700 border-red-300 hover:bg-red-100"
                                disabled={procesando}
                                onClick={() => eliminarDocumentoNomina(doc)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                              </Button>
                            )}

                            {!hasFile && !editableNomina && (
                              <p className="text-xs text-gray-500 italic">
                                Documento pendiente por RRLL.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {mensajeAccion && <p className="text-sm text-emerald-700">{mensajeAccion}</p>}
              {errorCarga && <p className="text-sm text-red-600">{errorCarga}</p>}

              <div className="flex flex-col sm:flex-row gap-3 justify-end border-t pt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={cerrarModal}
                  disabled={procesando}
                >
                  Cerrar
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={!puedeGestionar || procesando}
                  onClick={() => ejecutarAccionNomina('devolver')}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {procesando ? 'Procesando...' : 'Devolver a RRLL'}
                </Button>

                <Button
                  type="button"
                  disabled={!puedeGestionar || procesando}
                  onClick={() => ejecutarAccionNomina('finalizar')}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {procesando ? 'Procesando...' : 'Finalizar retiro'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NominaRetirosView;
