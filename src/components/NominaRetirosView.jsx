import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  RotateCcw,
  CheckCircle2,
  Eye,
  Lock,
  WalletCards,
  Building2,
  User,
  RefreshCw,
  X,
  Download,
  Trash2,
  AlertCircle,
   Clock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';

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

const formatearFechaHoraColombia = (valor) => {
  if (!valor) return 'Pendiente';

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;

  return fecha.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const formatearTiempoSegundos = (valor) => {
  if (valor === null || valor === undefined) return '—';

  const totalSegundos = Math.max(0, Math.round(Number(valor)));

  if (!Number.isFinite(totalSegundos)) return '—';
  if (totalSegundos < 60) return 'Menos de 1 minuto';

  const dias = Math.floor(totalSegundos / 86400);
  const horas = Math.floor((totalSegundos % 86400) / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const partes = [];

  if (dias > 0) partes.push(`${dias} ${dias === 1 ? 'día' : 'días'}`);
  if (horas > 0) partes.push(`${horas} ${horas === 1 ? 'hora' : 'horas'}`);
  if (minutos > 0) partes.push(`${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`);

  return partes.slice(0, 2).join(' ');
};

const valorTiempoProceso = (valor, tipo = 'dias') => {
  if (valor === null || valor === undefined) return '—';

  if (tipo === 'segundos') {
    return formatearTiempoSegundos(valor);
  }

  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : '—';
};

const textoUnidadTiempo = (valor, tipo = 'dias') => {
  if (valor === null || valor === undefined) return 'Sin información';

  if (tipo === 'segundos') return 'Tiempo real de gestión';

  return Number(valor) === 1 ? 'día calendario' : 'días calendario';
};

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
  fechaPagoLiquidacion: item.FechaPagoLiquidacion || '',
  estado: Number(item.IdEstadoProceso),
  estadoTexto: item.EstadoProceso || item.EstadoCasoRRLL || 'Sin estado',
  estadoCasoRRLL: item.EstadoCasoRRLL || '',
  motivo: item.MotivoRetiro || '',
  tipificacion: item.TipificacionRetiro || '',
  observacionRRLL: item.ObservacionRetiro || item.ObservacionGeneral || '',
  observacionNomina: item.ObservacionNomina || '',
  usuarioObservacionNomina: item.UsuarioObservacionNomina || '',
  fechaObservacionNomina: item.FechaObservacionNomina || '',
  puedeGestionarNomina: Boolean(item.PuedeGestionarNomina),
  fechaPazYSalvo: item.FechaPazYSalvo || '',

diasRetiroPazYSalvo:
  item.DiasRetiroPazYSalvo ?? null,

segundosPazYSalvoCierreRRLL:
  item.SegundosPazYSalvoCierreRRLL ??
  (item.DiasPazYSalvoCierreRRLL !== null && item.DiasPazYSalvoCierreRRLL !== undefined
    ? Number(item.DiasPazYSalvoCierreRRLL) * 86400
    : null),

segundosCierreRRLLNomina:
  item.SegundosCierreRRLLNomina ??
  (item.DiasCierreRRLLNomina !== null && item.DiasCierreRRLLNomina !== undefined
    ? Number(item.DiasCierreRRLLNomina) * 86400
    : null),
});

const NominaRetirosView = () => {
  const [busqueda, setBusqueda] = useState('');
  const [busquedaIndicador, setBusquedaIndicador] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('abiertos');
  const [retiros, setRetiros] = useState([]);
  const [indicadores, setIndicadores] = useState(indicadoresIniciales);
  const [retiroSeleccionado, setRetiroSeleccionado] = useState(null);

  const [documentosRetiro, setDocumentosRetiro] = useState([]);
  const [cargandoDocumentosRetiro, setCargandoDocumentosRetiro] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [cargandoIndicadores, setCargandoIndicadores] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');
  const [mensajeAccion, setMensajeAccion] = useState('');
  const [editandoObservacionNomina, setEditandoObservacionNomina] = useState(false);
  const [textoObservacionNomina, setTextoObservacionNomina] = useState('');
  const [mostrarModalPagoLiquidacion, setMostrarModalPagoLiquidacion] = useState(false);
  const [fechaPagoLiquidacion, setFechaPagoLiquidacion] = useState('');

  const cargarIndicadores = async () => {
    setCargandoIndicadores(true);

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
        throw new Error(data?.detail || data?.message || 'No fue posible consultar los indicadores.');
      }

      setIndicadores(data.data || indicadoresIniciales);
    } catch (error) {
      console.error('Error cargando indicadores de nómina retiros:', error);
      setIndicadores(indicadoresIniciales);
    } finally {
      setCargandoIndicadores(false);
    }
  };

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

      await cargarIndicadores();
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
    const idRetiroLaboral = retiro?.idRetiroLaboral || retiro?.IdRetiroLaboral;

    if (!idRetiroLaboral) {
      setDocumentosRetiro([]);
      return;
    }

    setCargandoDocumentosRetiro(true);

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_BASE_URL}/nomina-retiros/${idRetiroLaboral}/adjuntos`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data?.detail || data?.message || 'No fue posible consultar documentos de retiro.');
      }

      const documentos = Array.isArray(data?.data) ? data.data : [];

      setDocumentosRetiro(documentos);
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
    setEditandoObservacionNomina(false);
    setTextoObservacionNomina('');
    setMostrarModalPagoLiquidacion(false);
    setFechaPagoLiquidacion('');
  };

  const ejecutarAccionNomina = async (accion) => {
  if (!retiroSeleccionado?.idRetiroLaboral) return;

  if (accion === 'devolver') {
  const confirmar = window.confirm('¿Seguro que deseas devolver este retiro a Relaciones Laborales?');
  if (!confirmar) return;
}

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
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body:
          accion === 'finalizar'
            ? JSON.stringify({ fecha_pago_liquidacion: fechaPagoLiquidacion })
            : undefined,
      }
    );

    const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.success) {

  const detalle = data?.detail;

  if (
    detalle &&
    typeof detalle === 'object' &&
    Array.isArray(detalle.documentos_faltantes)
  ) {

    const lista = detalle.documentos_faltantes.join('\n• ');

    throw new Error(
      `No es posible finalizar el retiro.\n\nFaltan los siguientes documentos obligatorios:\n\n• ${lista}`
    );
  }

  throw new Error(
    data?.detail?.message ||
    data?.detail ||
    data?.message ||
    'No fue posible procesar la acción.'
  );
}
    setMensajeAccion(data.message || 'Acción realizada correctamente.');
    setMostrarModalPagoLiquidacion(false);
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

      const response = await fetch(`${API_BASE_URL}/rrll/adjuntos/${doc.IdRetiroLaboralAdjunto}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

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
      nombre.includes('LIQUIDACION DE CONTRATO') ||
      nombre.includes('SOPORTE NÓMINA') ||
      nombre.includes('SOPORTE NOMINA') ||
      nombre.includes('AUTORIZACIÓN DE DESCUENTO') ||
      nombre.includes('AUTORIZACION DE DESCUENTO')
    );
  };

  const esDocumentoNominaOpcional = (doc) => {
    const nombre = String(doc?.NombreDocumento || '').toUpperCase();

    return (
      nombre.includes('SOPORTE NÓMINA') ||
      nombre.includes('SOPORTE NOMINA') ||
      nombre.includes('AUTORIZACIÓN DE DESCUENTO') ||
      nombre.includes('AUTORIZACION DE DESCUENTO')
    );
  };

  const descargarCertificadoLaboral = (retiro) => {
  if (!retiro?.idRetiroLaboral) return;

  window.open(
    `${API_BASE_URL}/nomina-comunicaciones/${retiro.idRetiroLaboral}/certificado-laboral/descargar`,
    '_blank'
  );
};

const descargarCartaCesantias = (retiro) => {
  if (!retiro?.idRetiroLaboral) return;

  window.open(
    `${API_BASE_URL}/nomina-comunicaciones/${retiro.idRetiroLaboral}/carta-cesantias/descargar`,
    '_blank'
  );
};

const enviarCertificadoLaboral = async (retiro) => {
  if (!retiro?.idRetiroLaboral) return;

  setProcesando(true);
  setMensajeAccion('');
  setErrorCarga('');

  try {
    const token = localStorage.getItem('token');

    const response = await fetch(
      `${API_BASE_URL}/nomina-comunicaciones/${retiro.idRetiroLaboral}/certificado-laboral/enviar-correo`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      throw new Error(data?.detail || data?.message || 'No fue posible enviar el certificado laboral.');
    }

    setMensajeAccion(data.message || 'Certificado laboral enviado correctamente.');
  } catch (error) {
    setErrorCarga(error.message || 'Error enviando certificado laboral.');
  } finally {
    setProcesando(false);
  }
};

const enviarCartaCesantias = async (retiro) => {
  if (!retiro?.idRetiroLaboral) return;

  setProcesando(true);
  setMensajeAccion('');
  setErrorCarga('');

  try {
    const token = localStorage.getItem('token');

    const response = await fetch(
      `${API_BASE_URL}/nomina-comunicaciones/${retiro.idRetiroLaboral}/carta-cesantias/enviar-correo`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      throw new Error(data?.detail || data?.message || 'No fue posible enviar la carta de cesantías.');
    }

    setMensajeAccion(data.message || 'Carta de cesantías enviada correctamente.');
  } catch (error) {
    setErrorCarga(error.message || 'Error enviando carta de cesantías.');
  } finally {
    setProcesando(false);
  }
};

  const descargarExcelNomina = async () => {
    setProcesando(true);
    setMensajeAccion('');
    setErrorCarga('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/nomina-retiros/reporte-excel`, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || 'No fue posible descargar el reporte Excel.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const fecha = new Date().toISOString().slice(0, 10).replaceAll('-', '');
      const link = document.createElement('a');

      link.href = url;
      link.download = `Reporte_Nomina_Retiros_${fecha}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      setMensajeAccion('Reporte Excel descargado correctamente.');
    } catch (error) {
      console.error('Error descargando reporte Excel de nómina:', error);
      setErrorCarga(error.message || 'Error descargando reporte Excel.');
    } finally {
      setProcesando(false);
    }
  };

  const guardarObservacionNomina = async () => {
    if (!retiroSeleccionado?.idRetiroLaboral) return;

    setProcesando(true);
    setMensajeAccion('');
    setErrorCarga('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_BASE_URL}/nomina-retiros/${retiroSeleccionado.idRetiroLaboral}/observacion-nomina`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            observacion_nomina: textoObservacionNomina,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data?.detail || data?.message || 'No fue posible guardar la observación de nómina.');
      }

      const observacionGuardada =
        data?.data?.ObservacionNomina ??
        data?.data?.observacionNomina ??
        textoObservacionNomina;

      const usuarioGuardado =
        data?.data?.UsuarioObservacionNomina ??
        data?.data?.usuarioObservacionNomina ??
        retiroSeleccionado?.usuarioObservacionNomina ??
        '';

      const fechaGuardada =
        data?.data?.FechaObservacionNomina ??
        data?.data?.fechaObservacionNomina ??
        retiroSeleccionado?.fechaObservacionNomina ??
        '';

      setMensajeAccion(data?.message || 'Observación de nómina guardada correctamente.');
      setEditandoObservacionNomina(false);

      setRetiroSeleccionado((prev) => ({
        ...prev,
        observacionNomina: observacionGuardada,
        usuarioObservacionNomina: usuarioGuardado,
        fechaObservacionNomina: fechaGuardada,
      }));

      setTextoObservacionNomina(observacionGuardada);

      await cargarRetiros();
    } catch (error) {
      console.error('Error guardando observación de nómina:', error);
      setErrorCarga(error.message || 'Error guardando observación de nómina.');
    } finally {
      setProcesando(false);
    }
  };

  const totalGeneral = indicadores?.totales?.total || 0;
  const totalAbiertos = indicadores?.totales?.abiertos || 0;
  const totalNomina = indicadores?.totales?.cerrados || 0;
  const totalRetirados = indicadores?.totales?.retirados || 0;

const grupoEstadoRetiro = (r) => {
  const estadoId = Number(r.estado);
  const texto = String(r.estadoTexto || r.estadoCasoRRLL || '').toLowerCase();

  if (estadoId === 35 || texto.includes('retirado')) return 'retirados';

  if (
    estadoId === 32 ||
    texto.includes('enviado a nómina') ||
    texto.includes('enviado a nomina') ||
    texto.includes('cerrado')
  ) {
    return 'nomina';
  }

  return 'abiertos';
};

const retirosFiltrados = useMemo(() => {
  const q = busqueda.trim().toLowerCase();

  return retiros.filter((r) => {
    const coincideBusqueda =
      !q ||
      String(r.identificacion || '').toLowerCase().includes(q) ||
      String(r.nombre || '').toLowerCase().includes(q) ||
      String(r.cliente || '').toLowerCase().includes(q);

    const coincideEstado = grupoEstadoRetiro(r) === filtroEstado;

      if (q) {
        return coincideBusqueda;
      }

      return coincideEstado;
        });
}, [busqueda, retiros, filtroEstado]);

const retiroIndicador = useMemo(() => {
  const q = busquedaIndicador.trim().toLowerCase();

  if (!q) return null;

  return retiros.find((r) =>
    String(r.identificacion || '').toLowerCase().includes(q) ||
    String(r.nombre || '').toLowerCase().includes(q)
  ) || null;
}, [busquedaIndicador, retiros]);

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold">Total Retiros</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">
            {cargandoIndicadores ? '...' : totalGeneral}
          </p>
        </div>

        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold">Abiertos RRLL</p>
          <p className="text-3xl font-bold text-yellow-700 mt-1">
            {cargandoIndicadores ? '...' : totalAbiertos}
          </p>
        </div>

        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold">Cerrados</p>
          <p className="text-3xl font-bold text-emerald-700 mt-1">
            {cargandoIndicadores ? '...' : totalNomina}
          </p>
        </div>

        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 font-semibold">Retirados</p>
          <p className="text-3xl font-bold text-gray-700 mt-1">
            {cargandoIndicadores ? '...' : totalRetirados}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md border p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            Seguimiento individual del retiro
          </h2>
          <p className="text-sm text-gray-500">
            Consulta los tiempos del proceso para un trabajador específico.
          </p>
        </div>
      </div>

      <Input
        value={busquedaIndicador}
        onChange={(e) => setBusquedaIndicador(e.target.value)}
        placeholder="Buscar por identificación o nombre..."
        className="mb-6"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <p className="text-sm font-semibold text-blue-700">
            Último día laborado → Paz y Salvo cargado
          </p>

          <p className="text-4xl font-black text-blue-900 mt-3">
            {valorTiempoProceso(retiroIndicador?.diasRetiroPazYSalvo)}
          </p>

          <p className="text-xs text-blue-700 mt-2">
            {textoUnidadTiempo(retiroIndicador?.diasRetiroPazYSalvo)}
          </p>
          <p className="text-xs text-gray-500 mt-3">
            Tiempo desde el último día laborado hasta la carga del Paz y Salvo.
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
          <p className="text-sm font-semibold text-emerald-700">
            Paz y Salvo cargado → envío a Nómina
          </p>

          <p className="text-4xl font-black text-emerald-900 mt-3">
            {valorTiempoProceso(retiroIndicador?.segundosPazYSalvoCierreRRLL, 'segundos')}
          </p>

          <p className="text-xs text-emerald-700 mt-2">
            {textoUnidadTiempo(retiroIndicador?.segundosPazYSalvoCierreRRLL, 'segundos')}
          </p>
          <p className="text-xs text-gray-500 mt-3">
            Tiempo utilizado por RRLL para completar y remitir el proceso.
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
          <p className="text-sm font-semibold text-gray-700">
            Envío a Nómina → retiro finalizado
          </p>

          <p className="text-4xl font-black text-gray-900 mt-3">
            {valorTiempoProceso(retiroIndicador?.segundosCierreRRLLNomina, 'segundos')}
          </p>

          <p className="text-xs text-gray-700 mt-2">
            {textoUnidadTiempo(retiroIndicador?.segundosCierreRRLLNomina, 'segundos')}
          </p>
          <p className="text-xs text-gray-500 mt-3">
            Tiempo utilizado por Nómina para finalizar el retiro.
          </p>
        </div>

      </div>

      {retiroIndicador && (
        <div className="mt-5 p-4 rounded-xl bg-gray-50 border">
          <p className="font-bold text-gray-800">
            {retiroIndicador.nombre}
          </p>

          <p className="text-sm text-gray-500">
            {retiroIndicador.identificacion}
          </p>
        </div>
      )}
    </div>

      <div className="bg-white rounded-2xl shadow-md border p-6">
        <label className="text-sm font-semibold text-gray-700">Buscar trabajador</label>

        <div className="flex flex-col lg:flex-row gap-3 mt-2">
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por identificación, nombre o cliente"
            className="flex-1"
          />

          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="button" onClick={cargarRetiros} disabled={cargando || procesando}>
              <RefreshCw className={`w-4 h-4 mr-2 ${cargando ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={descargarExcelNomina}
              disabled={procesando}
              className="border-emerald-500 text-emerald-700 hover:bg-emerald-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar Excel
            </Button>
          </div>
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
              <th className="text-center p-4 min-w-[300px]">Comunicaciones</th>
              <th className="text-left p-4 min-w-[190px]">Fecha pago liquidación</th>
              <th className="text-center p-4 min-w-[120px]">Acción</th>
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
                <td className="p-4 whitespace-nowrap">{r.identificacion}</td>

                <td className="p-4 font-medium">
                  {r.nombre}
                </td>

                <td className="p-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getEstadoBadge(r.estado)}`}>
                  {grupoEstadoRetiro(r) === 'nomina'
                    ? 'Cerrado'
                    : grupoEstadoRetiro(r) === 'retirados'
                      ? 'Retirado'
                      : 'Abierto'}
                </span>
              </td>

            <td className="p-4">
            <div className="flex flex-row items-center justify-center gap-1.5 whitespace-nowrap">
              <button
                type="button"
                title="Enviar certificado laboral"
                onClick={() => enviarCertificadoLaboral(r)}
                disabled={procesando}
                className="w-8 h-8 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 flex items-center justify-center text-sm disabled:opacity-50"
              >
                ✉️
              </button>

              <button
                type="button"
                title="Descargar certificado laboral"
                onClick={() => descargarCertificadoLaboral(r)}
                className="w-8 h-8 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 flex items-center justify-center text-sm"
              >
                ⬇️
              </button>

              <span className="w-px h-6 bg-gray-300 mx-1" />

              <button
                type="button"
                title="Enviar carta de cesantías"
                onClick={() => enviarCartaCesantias(r)}
                disabled={procesando}
                className="w-8 h-8 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 flex items-center justify-center text-sm disabled:opacity-50"
              >
                💰
              </button>

              <button
                type="button"
                title="Descargar carta de cesantías"
                onClick={() => descargarCartaCesantias(r)}
                className="w-8 h-8 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 flex items-center justify-center text-sm"
              >
                ⬇️
              </button>
            </div>
          </td>

              <td className="p-4 whitespace-nowrap">
                {r.fechaPagoLiquidacion
                  ? new Date(`${r.fechaPagoLiquidacion}T00:00:00`).toLocaleDateString('es-CO', {
                      timeZone: 'America/Bogota',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                  : 'Sin fecha'}
              </td>

              <td className="p-4 text-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                    setRetiroSeleccionado(r);
                    setTextoObservacionNomina(r.observacionNomina || '');
                    setEditandoObservacionNomina(false);
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
                <td colSpan="6" className="p-10 text-center text-gray-500">
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
                        {grupoEstadoRetiro(retiroSeleccionado) === 'nomina'
                          ? 'Cerrado'
                          : grupoEstadoRetiro(retiroSeleccionado) === 'retirados'
                            ? 'Retirado'
                            : 'Abierto'}
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

              <div className="border rounded-2xl p-5 bg-white">
              <div className="flex items-center gap-2 text-blue-700 font-bold mb-4">
                <Clock className="w-5 h-5" />
                Tiempos del proceso de este trabajador
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                  <p className="text-blue-800 font-bold">Último día laborado → Paz y Salvo cargado</p>
                  <p className="text-3xl font-black text-blue-900 mt-2">
                    {valorTiempoProceso(retiroSeleccionado.diasRetiroPazYSalvo)}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">{textoUnidadTiempo(retiroSeleccionado.diasRetiroPazYSalvo)}</p>
                  <p className="text-xs text-gray-500 mt-3">
                    Tiempo desde el último día laborado hasta la carga del Paz y Salvo.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Paz y Salvo: {formatearFechaHoraColombia(retiroSeleccionado.fechaPazYSalvo)}
                  </p>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                  <p className="text-emerald-800 font-bold">Paz y Salvo cargado → envío a Nómina</p>
                  <p className="text-3xl font-black text-emerald-900 mt-2">
                    {valorTiempoProceso(retiroSeleccionado.segundosPazYSalvoCierreRRLL, 'segundos')}
                  </p>
                  <p className="text-xs text-emerald-700 mt-1">{textoUnidadTiempo(retiroSeleccionado.segundosPazYSalvoCierreRRLL, 'segundos')}</p>
                  <p className="text-xs text-gray-500 mt-3">
                    Tiempo utilizado por RRLL para completar y remitir el proceso.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Envío a Nómina: {formatearFechaHoraColombia(retiroSeleccionado.fechaCierre)}
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                  <p className="text-gray-800 font-bold">Envío a Nómina → retiro finalizado</p>
                  <p className="text-3xl font-black text-gray-900 mt-2">
                    {valorTiempoProceso(retiroSeleccionado.segundosCierreRRLLNomina, 'segundos')}
                  </p>
                  <p className="text-xs text-gray-700 mt-1">{textoUnidadTiempo(retiroSeleccionado.segundosCierreRRLLNomina, 'segundos')}</p>
                  <p className="text-xs text-gray-500 mt-3">
                    Tiempo utilizado por Nómina para finalizar el retiro.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {retiroSeleccionado.fechaEnvioNomina
                      ? `Retiro finalizado: ${formatearFechaHoraColombia(retiroSeleccionado.fechaEnvioNomina)}`
                      : 'Estado: Pendiente de finalización por Nómina'}
                  </p>
                </div>
              </div>
            </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-sm text-emerald-900">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-bold text-emerald-700 mb-3">
                      <FileText className="w-5 h-5" />
                      Observaciones Nómina
                    </div>

                    {editandoObservacionNomina ? (
                      <textarea
                        value={textoObservacionNomina}
                        onChange={(e) => setTextoObservacionNomina(e.target.value)}
                        rows={3}
                        className="w-full border border-emerald-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                        placeholder="Escribe aquí la observación de nómina..."
                        disabled={procesando}
                      />
                    ) : (
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {retiroSeleccionado.observacionNomina || 'Sin observaciones de nómina registradas.'}
                      </p>
                    )}

                    {(retiroSeleccionado.usuarioObservacionNomina || retiroSeleccionado.fechaObservacionNomina) && (
                      <p className="text-xs text-gray-500 mt-3">
                        Registrado por {retiroSeleccionado.usuarioObservacionNomina || 'Nómina'}
                        {retiroSeleccionado.fechaObservacionNomina
                      ? ` • ${new Date(retiroSeleccionado.fechaObservacionNomina).toLocaleString('es-CO', {
                          timeZone: 'America/Bogota',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}`
                      : ''}
                      </p>
                    )}
                  </div>

                  {puedeGestionar && (
                    <div className="flex gap-2 justify-end">
                      {editandoObservacionNomina ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            disabled={procesando}
                            onClick={guardarObservacionNomina}
                          >
                            Guardar
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={procesando}
                            onClick={() => {
                              setTextoObservacionNomina(retiroSeleccionado.observacionNomina || '');
                              setEditandoObservacionNomina(false);
                            }}
                          >
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-emerald-500 text-emerald-700 hover:bg-emerald-100"
                          onClick={() => {
                            setTextoObservacionNomina(retiroSeleccionado.observacionNomina || '');
                            setEditandoObservacionNomina(true);
                          }}
                        >
                          Editar
                        </Button>
                      )}
                    </div>
                  )}
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

                            {esDocumentoNominaOpcional(doc) && (
                              <span className="inline-flex mb-3 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                                Opcional
                              </span>
                            )}

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
                                  {esDocumentoNominaOpcional(doc)
                                    ? 'Documento opcional. Selecciona el archivo y se adjuntará automáticamente.'
                                    : 'Documento obligatorio. Selecciona el archivo y se adjuntará automáticamente.'}
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
                  onClick={() => {
                  setFechaPagoLiquidacion(retiroSeleccionado.fechaPagoLiquidacion || '');
                  setMostrarModalPagoLiquidacion(true);
                }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {procesando ? 'Procesando...' : 'Finalizar retiro'}
                </Button>
              </div>
            </div>
          </div>
        </div>
           )}

      {mostrarModalPagoLiquidacion && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Fecha de pago liquidación
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Selecciona la fecha en la que se pagará la liquidación del trabajador.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMostrarModalPagoLiquidacion(false)}
                className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-gray-100"
                disabled={procesando}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="text-sm font-semibold text-gray-700">
              Fecha de pago
            </label>

            <input
              type="date"
              value={fechaPagoLiquidacion}
              onChange={(e) => setFechaPagoLiquidacion(e.target.value)}
              disabled={procesando}
              className="w-full mt-2 border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />

            {!fechaPagoLiquidacion && (
              <p className="text-xs text-red-600 mt-2">
                Debes seleccionar una fecha para finalizar el retiro.
              </p>
            )}

            {errorCarga && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                <div className="font-bold mb-1">
                  No se puede finalizar el retiro
                </div>
                <p className="whitespace-pre-line">
                  {errorCarga}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                disabled={procesando}
                onClick={() => setMostrarModalPagoLiquidacion(false)}
              >
                Cancelar
              </Button>

              <Button
                type="button"
                disabled={procesando || !fechaPagoLiquidacion}
                onClick={() => ejecutarAccionNomina('finalizar')}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {procesando ? 'Finalizando...' : 'Confirmar finalización'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NominaRetirosView;