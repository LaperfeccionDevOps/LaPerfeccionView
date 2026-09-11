import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  HeartPulse,
  RefreshCw,
  Search,
  User,
  X,
  XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  '';

const REGISTROS_POR_PAGINA = 10;


const TIPOS_INCAPACIDAD_EDITABLES = [
  {
    value: 'INCAPACIDAD_1_2_DIAS',
    label: 'INCAPACIDAD DE 1 Y 2 DÍAS',
  },
  {
    value: 'ACCIDENTE_TRANSITO',
    label: 'ACCIDENTE DE TRÁNSITO',
  },
  {
    value: 'ACCIDENTE_TRABAJO',
    label: 'ACCIDENTE DE TRABAJO (ARL)',
  },
  {
    value: 'INCAPACIDAD_3_MAS_DIAS',
    label: 'INCAPACIDAD DE 3 O MÁS DÍAS',
  },
  {
    value: 'LICENCIA_MATERNA',
    label: 'LICENCIA MATERNA',
  },
  {
    value: 'LICENCIA_PATERNA',
    label: 'LICENCIA PATERNA',
  },
];


const formatearFecha = (valor) => {
  if (!valor) return 'Sin fecha';

  const texto = String(valor).slice(0, 10);
  const partes = texto.split('-');

  if (partes.length !== 3) return valor;

  const [anio, mes, dia] = partes;

  return `${dia}/${mes}/${anio}`;
};


const calcularFechaFinal = (fechaInicio, dias) => {
  const diasNumero = Number(dias);

  if (
    !fechaInicio ||
    !Number.isInteger(diasNumero) ||
    diasNumero <= 0
  ) {
    return '';
  }

  const partes = String(fechaInicio).slice(0, 10).split('-');

  if (partes.length !== 3) {
    return '';
  }

  const [anio, mes, dia] = partes.map(Number);
  const fecha = new Date(anio, mes - 1, dia);

  if (Number.isNaN(fecha.getTime())) {
    return '';
  }

  fecha.setDate(fecha.getDate() + diasNumero - 1);

  const anioFinal = fecha.getFullYear();
  const mesFinal = String(fecha.getMonth() + 1).padStart(2, '0');
  const diaFinal = String(fecha.getDate()).padStart(2, '0');

  return `${anioFinal}-${mesFinal}-${diaFinal}`;
};


const formatearFechaHoraColombia = (valor) => {
  if (!valor) return 'Sin fecha';

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return String(valor);
  }

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


const normalizarEstado = (valor) => {
  const estado = String(valor || 'REGISTRADA')
    .trim()
    .toUpperCase();

  return estado || 'REGISTRADA';
};


const obtenerReglaDias = (tipoIncapacidad) => {
  const tipo = String(tipoIncapacidad || '')
    .trim()
    .toUpperCase();

  if (tipo === 'INCAPACIDAD_1_2_DIAS') {
    return {
      min: 1,
      max: 2,
      mensaje: 'Para este tipo de incapacidad debe registrar 1 o 2 días.',
    };
  }

  if (tipo === 'INCAPACIDAD_3_MAS_DIAS') {
    return {
      min: 3,
      max: null,
      mensaje: 'Para este tipo de incapacidad debe registrar mínimo 3 días.',
    };
  }

  return {
    min: 1,
    max: null,
    mensaje: 'Debe registrar una cantidad válida de días de incapacidad.',
  };
};


const formatearTipoIncapacidad = (valor) => {
  if (!valor) return 'Sin información';

  const codigo = String(valor)
    .trim()
    .toUpperCase();

  const nombres = {
    INCAPACIDAD_1_2_DIAS: 'INCAPACIDAD 1 Y 2 DÍAS',
    INCAPACIDAD_1_Y_2_DIAS: 'INCAPACIDAD 1 Y 2 DÍAS',
    ACCIDENTE_TRANSITO: 'ACCIDENTE DE TRÁNSITO',
    ACCIDENTE_DE_TRANSITO: 'ACCIDENTE DE TRÁNSITO',
    ACCIDENTE_TRABAJO_ARL: 'ACCIDENTE DE TRABAJO (ARL)',
    ACCIDENTE_DE_TRABAJO_ARL: 'ACCIDENTE DE TRABAJO (ARL)',
    INCAPACIDAD_3_MAS_DIAS: 'INCAPACIDAD DE 3 O MÁS DÍAS',
    INCAPACIDAD_DE_3_O_MAS_DIAS: 'INCAPACIDAD DE 3 O MÁS DÍAS',
    LICENCIA_MATERNA: 'LICENCIA MATERNA',
    LICENCIA_PATERNA: 'LICENCIA PATERNA',
  };

  return (
    nombres[codigo] ||
    codigo
      .replaceAll('_', ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
};


const getEstadoBadge = (estadoOriginal) => {
  const estado = normalizarEstado(estadoOriginal);

  if (estado === 'APROBADA') {
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  }

  if (estado === 'RECHAZADA' || estado === 'NEGADA' || estado === 'NEGADO') {
    return 'bg-red-100 text-red-700 border-red-200';
  }

  if (estado === 'RADICADO') {
    return 'bg-blue-100 text-blue-700 border-blue-200';
  }

  if (estado === 'PENDIENTE RADICACION') {
    return 'bg-amber-100 text-amber-700 border-amber-200';
  }

  if (estado === 'EN PROCESO DE PAGO') {
    return 'bg-violet-100 text-violet-700 border-violet-200';
  }

  if (estado === 'PAGADO') {
    return 'bg-teal-100 text-teal-700 border-teal-200';
  }

  return 'bg-yellow-100 text-yellow-700 border-yellow-200';
};


const mapIncapacidadApi = (item) => ({
  id:
    item?.id_incapacidad ??
    item?.IdIncapacidadTrabajador ??
    item?.id,

  idIncapacidad:
    item?.id_incapacidad ??
    item?.IdIncapacidadTrabajador ??
    item?.id,

  idRegistroPersonal:
    item?.id_registro_personal ??
    item?.IdRegistroPersonal ??
    null,

  identificacion:
    item?.numero_identificacion ??
    item?.NumeroIdentificacion ??
    '',

  nombres:
    item?.nombres ??
    item?.Nombres ??
    '',

  apellidos:
    item?.apellidos ??
    item?.Apellidos ??
    '',

  nombre:
    (
      item?.nombre_completo ??
      item?.NombreCompleto ??
      `${item?.nombres ?? item?.Nombres ?? ''} ${item?.apellidos ?? item?.Apellidos ?? ''}`
    )
      .toUpperCase()
      .trim(),

  eps:
    item?.eps ??
    item?.Eps ??
    'No registrada',

  tipoIncapacidad:
    item?.tipo_incapacidad ??
    item?.TipoIncapacidad ??
    '',

  descripcionTipo:
    item?.descripcion_tipo ??
    item?.DescripcionTipoIncapacidad ??
    '',

  fechaInicio:
    item?.fecha_inicio ??
    item?.FechaInicio ??
    '',

  diasIncapacidad:
    Number(
      item?.dias_incapacidad ??
      item?.DiasIncapacidad ??
      0,
    ),

  fechaFinal:
    item?.fecha_final ??
    item?.FechaFinal ??
    '',

  esProrroga: Boolean(
    item?.es_prorroga ??
    item?.EsProrroga ??
    false,
  ),

  estado: normalizarEstado(
    item?.estado ??
    item?.Estado ??
    'REGISTRADA',
  ),

  observacionNomina:
    item?.observacion_nomina ??
    item?.ObservacionNomina ??
    '',

  usuarioGestionNomina:
    item?.usuario_gestion_nomina ??
    item?.UsuarioGestionNomina ??
    '',

  fechaGestionNomina:
    item?.fecha_gestion_nomina ??
    item?.FechaGestionNomina ??
    '',

  numeroRadicado:
    item?.numero_radicado ??
    item?.NumeroRadicado ??
    '',

  fechaRadicacion:
    item?.fecha_radicacion ??
    item?.FechaRadicacion ??
    '',

  causalNegacion:
    item?.causal_negacion ??
    item?.CausalNegacion ??
    '',

  valorPagado:
    item?.valor_pagado ??
    item?.ValorPagado ??
    null,

  fechaCreacion:
    item?.fecha_creacion ??
    item?.FechaCreacion ??
    '',

  fechaActualizacion:
    item?.fecha_actualizacion ??
    item?.FechaActualizacion ??
    '',

  totalDocumentos:
    Number(
      item?.total_documentos ??
      item?.TotalDocumentos ??
      0,
    ),

  fueCorregida: Boolean(
    item?.fue_corregida ??
    item?.FueCorregida ??
    false,
  ),

  totalCorrecciones:
    Number(
      item?.total_correcciones ??
      item?.TotalCorrecciones ??
      0,
    ),

  motivoUltimaCorreccion:
    item?.motivo_ultima_correccion ??
    item?.MotivoUltimaCorreccion ??
    '',

  estadoUltimaCorreccion:
    item?.estado_ultima_correccion ??
    item?.EstadoUltimaCorreccion ??
    '',

  fechaSolicitudUltimaCorreccion:
    item?.fecha_solicitud_ultima_correccion ??
    item?.FechaSolicitudUltimaCorreccion ??
    '',

  fechaReenvioUltimaCorreccion:
    item?.fecha_reenvio_ultima_correccion ??
    item?.FechaReenvioUltimaCorreccion ??
    '',

  documentos: Array.isArray(item?.documentos)
    ? item.documentos
    : Array.isArray(item?.Documentos)
      ? item.Documentos
      : [],
});


const mapDocumentoApi = (item) => ({
  idDocumento:
    item?.id_documento ??
    item?.IdDocumentoIncapacidadTrabajador ??
    item?.id,

  idIncapacidad:
    item?.id_incapacidad ??
    item?.IdIncapacidadTrabajador ??
    null,

  tipoDocumento:
    item?.tipo_documento ??
    item?.TipoDocumento ??
    'Documento',

  nombreArchivo:
    item?.nombre_archivo ??
    item?.NombreArchivo ??
    'Documento',

  formato:
    item?.formato ??
    item?.Formato ??
    '',

  mimeType:
    item?.mime_type ??
    item?.MimeType ??
    '',

  tamanoBytes:
    Number(
      item?.tamano_bytes ??
      item?.TamanoBytes ??
      0,
    ),

  fechaCreacion:
    item?.fecha_creacion ??
    item?.FechaCreacion ??
    '',
});


const formatearTamano = (bytes) => {
  const valor = Number(bytes || 0);

  if (!Number.isFinite(valor) || valor <= 0) {
    return 'Sin información';
  }

  if (valor < 1024) {
    return `${valor} B`;
  }

  if (valor < 1024 * 1024) {
    return `${(valor / 1024).toFixed(1)} KB`;
  }

  return `${(valor / (1024 * 1024)).toFixed(1)} MB`;
};


const formatearMonedaColombia = (valor) => {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return 'Sin información';
  }

  return numero.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};


const NominaIncapacidadesView = () => {
  const [incapacidades, setIncapacidades] = useState([]);
  const [incapacidadSeleccionada, setIncapacidadSeleccionada] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [pestanaActiva, setPestanaActiva] = useState('REGISTRADAS');

  const [cargando, setCargando] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [abriendoDocumento, setAbriendoDocumento] = useState(null);
  const [descargandoDocumento, setDescargandoDocumento] = useState(null);
  const [descargandoTodosDocumentos, setDescargandoTodosDocumentos] = useState(false);
  const [procesandoGestion, setProcesandoGestion] = useState(false);

  const [mostrarRechazo, setMostrarRechazo] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const rechazoRef = useRef(null);
  const motivoRechazoRef = useRef(null);
  const [mensajeGestion, setMensajeGestion] = useState('');

  const [numeroRadicado, setNumeroRadicado] = useState('');
  const [fechaRadicacion, setFechaRadicacion] = useState('');

  const [mostrarNegacion, setMostrarNegacion] = useState(false);
  const [causalNegacion, setCausalNegacion] = useState('');

  const [valorPagado, setValorPagado] = useState('');
  const [tipoIncapacidadEditada, setTipoIncapacidadEditada] = useState('');

  const [fechaInicioEditada, setFechaInicioEditada] = useState('');
  const [diasIncapacidadEditados, setDiasIncapacidadEditados] = useState('');
  const [esProrrogaEditada, setEsProrrogaEditada] = useState(false);

  const [errorCarga, setErrorCarga] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);


  const cargarIncapacidades = async () => {
    setCargando(true);
    setErrorCarga('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_BASE_URL}/nomina-incapacidades`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
        },
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.detail ||
          data?.message ||
          'No fue posible consultar las incapacidades.',
        );
      }

      const lista = Array.isArray(data?.data)
        ? data.data.map(mapIncapacidadApi)
        : [];

      setIncapacidades(lista);

      if (incapacidadSeleccionada?.idIncapacidad) {
        const actualizado = lista.find(
          (item) =>
            item.idIncapacidad ===
            incapacidadSeleccionada.idIncapacidad,
        );

        if (!actualizado) {
          setIncapacidadSeleccionada(null);
        }
      }
    } catch (error) {
      console.error(
        'Error cargando incapacidades de nómina:',
        error,
      );

      setErrorCarga(
        error?.message ||
        'Error consultando incapacidades de nómina.',
      );

      setIncapacidades([]);
    } finally {
      setCargando(false);
    }
  };


  useEffect(() => {
    cargarIncapacidades();
  }, []);


  useEffect(() => {
    if (!mostrarRechazo) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      rechazoRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      motivoRechazoRef.current?.focus({
        preventScroll: true,
      });
    }, 120);

    return () => {
      window.clearTimeout(timer);
    };
  }, [mostrarRechazo]);


  const abrirDetalle = async (incapacidad) => {
    if (!incapacidad?.idIncapacidad) return;

    setCargandoDetalle(true);
    setErrorCarga('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_BASE_URL}/nomina-incapacidades/${incapacidad.idIncapacidad}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
        },
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.detail ||
          data?.message ||
          'No fue posible consultar el detalle de la incapacidad.',
        );
      }

      const detalle = mapIncapacidadApi(
        data?.data || incapacidad,
      );

      detalle.documentos = Array.isArray(data?.data?.documentos)
        ? data.data.documentos.map(mapDocumentoApi)
        : [];

      setIncapacidadSeleccionada(detalle);
      setTipoIncapacidadEditada(detalle.tipoIncapacidad || '');
      setFechaInicioEditada(
        String(detalle.fechaInicio || '').slice(0, 10),
      );
      setDiasIncapacidadEditados(
        String(detalle.diasIncapacidad || ''),
      );
      setEsProrrogaEditada(Boolean(detalle.esProrroga));
    } catch (error) {
      console.error(
        'Error cargando detalle de incapacidad:',
        error,
      );

      setErrorCarga(
        error?.message ||
        'No fue posible consultar el detalle.',
      );
    } finally {
      setCargandoDetalle(false);
    }
  };


  const cerrarDetalle = () => {
    setIncapacidadSeleccionada(null);
    setErrorCarga('');
    setMensajeGestion('');
    setMostrarRechazo(false);
    setMotivoRechazo('');
    setNumeroRadicado('');
    setFechaRadicacion('');
    setMostrarNegacion(false);
    setCausalNegacion('');
    setValorPagado('');
    setTipoIncapacidadEditada('');
    setFechaInicioEditada('');
    setDiasIncapacidadEditados('');
    setEsProrrogaEditada(false);
    setAbriendoDocumento(null);
    setDescargandoDocumento(null);
    setDescargandoTodosDocumentos(false);
  };


  const verDocumento = async (documento) => {
    const idIncapacidad =
      incapacidadSeleccionada?.idIncapacidad;

    const idDocumento = documento?.idDocumento;

    if (!idIncapacidad || !idDocumento) {
      setErrorCarga(
        'No se encontró la información del documento.',
      );
      return;
    }

    const nuevaVentana = window.open('', '_blank');

    setAbriendoDocumento(idDocumento);
    setErrorCarga('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_BASE_URL}/nomina-incapacidades/${idIncapacidad}/documentos/${idDocumento}`,
        {
          method: 'GET',
          headers: {
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
        },
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          data?.detail ||
          data?.message ||
          'No fue posible visualizar el documento.',
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (nuevaVentana) {
        nuevaVentana.location.href = url;
      } else {
        window.open(url, '_blank');
      }

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60000);
    } catch (error) {
      if (nuevaVentana && !nuevaVentana.closed) {
        nuevaVentana.close();
      }

      console.error(
        'Error visualizando documento de incapacidad:',
        error,
      );

      setErrorCarga(
        error?.message ||
        'No fue posible visualizar el documento.',
      );
    } finally {
      setAbriendoDocumento(null);
    }
  };


  const descargarDocumento = async (documento) => {
    const idIncapacidad =
      incapacidadSeleccionada?.idIncapacidad;

    const idDocumento = documento?.idDocumento;

    if (!idIncapacidad || !idDocumento) {
      setErrorCarga(
        'No se encontró la información del documento.',
      );
      return;
    }

    setDescargandoDocumento(idDocumento);
    setErrorCarga('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_BASE_URL}/nomina-incapacidades/${idIncapacidad}/documentos/${idDocumento}`,
        {
          method: 'GET',
          headers: {
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
        },
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          data?.detail ||
          data?.message ||
          'No fue posible descargar el documento.',
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');

      enlace.href = url;
      enlace.download =
        documento?.nombreArchivo ||
        `documento_incapacidad_${idDocumento}`;

      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 5000);
    } catch (error) {
      console.error(
        'Error descargando documento de incapacidad:',
        error,
      );

      setErrorCarga(
        error?.message ||
        'No fue posible descargar el documento.',
      );
    } finally {
      setDescargandoDocumento(null);
    }
  };


  const descargarTodosDocumentos = async () => {
    const idIncapacidad =
      incapacidadSeleccionada?.idIncapacidad;

    if (!idIncapacidad) {
      setErrorCarga(
        'No se encontró la información de la incapacidad.',
      );
      return;
    }

    if (
      !Array.isArray(incapacidadSeleccionada?.documentos) ||
      incapacidadSeleccionada.documentos.length === 0
    ) {
      setErrorCarga(
        'La incapacidad no tiene documentos disponibles para descargar.',
      );
      return;
    }

    setDescargandoTodosDocumentos(true);
    setErrorCarga('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_BASE_URL}/nomina-incapacidades/${idIncapacidad}/documentos-consolidados`,
        {
          method: 'GET',
          headers: {
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
        },
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          data?.detail ||
          data?.message ||
          'No fue posible generar el PDF con todos los documentos.',
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');

      let nombreArchivo =
        `incapacidad_${incapacidadSeleccionada.identificacion || idIncapacidad}_soportes.pdf`;

      const contentDisposition =
        response.headers.get('Content-Disposition');

      if (contentDisposition) {
        const coincidencia = contentDisposition.match(
          /filename="?([^"]+)"?/i,
        );

        if (coincidencia?.[1]) {
          nombreArchivo = coincidencia[1].trim();
        }
      }

      enlace.href = url;
      enlace.download = nombreArchivo;

      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 5000);
    } catch (error) {
      console.error(
        'Error descargando documentos consolidados:',
        error,
      );

      setErrorCarga(
        error?.message ||
        'No fue posible descargar todos los documentos en un solo PDF.',
      );
    } finally {
      setDescargandoTodosDocumentos(false);
    }
  };


  const refrescarDetalleGestionado = async (
    idIncapacidad,
    mensaje,
  ) => {
    const token = localStorage.getItem('token');

    const response = await fetch(
      `${API_BASE_URL}/nomina-incapacidades/${idIncapacidad}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(token
            ? { Authorization: `Bearer ${token}` }
            : {}),
        },
      },
    );

    const data = await response
      .json()
      .catch(() => ({}));

    if (!response.ok || !data?.success) {
      throw new Error(
        data?.detail ||
        data?.message ||
        'La gestión se realizó, pero no fue posible actualizar el detalle.',
      );
    }

    const detalle = mapIncapacidadApi(data?.data || {});

    detalle.documentos = Array.isArray(data?.data?.documentos)
      ? data.data.documentos.map(mapDocumentoApi)
      : [];

    setIncapacidadSeleccionada(detalle);
    setTipoIncapacidadEditada(detalle.tipoIncapacidad || '');
    setFechaInicioEditada(
      String(detalle.fechaInicio || '').slice(0, 10),
    );
    setDiasIncapacidadEditados(
      String(detalle.diasIncapacidad || ''),
    );
    setEsProrrogaEditada(Boolean(detalle.esProrroga));
    setMensajeGestion(mensaje);
    await cargarIncapacidades();
  };


  const actualizarDatosIncapacidad = async () => {
    const idIncapacidad =
      incapacidadSeleccionada?.idIncapacidad;

    if (!idIncapacidad) return;

    const fechaInicio = String(
      fechaInicioEditada || '',
    ).trim();

    const dias = Number(diasIncapacidadEditados);

    if (!fechaInicio) {
      setErrorCarga(
        'Debes registrar la fecha de inicio.',
      );
      return;
    }

    const tipoSeleccionado =
      String(tipoIncapacidadEditada || '')
        .trim()
        .toUpperCase();

    if (!tipoSeleccionado) {
      setErrorCarga(
        'Debes seleccionar un tipo de incapacidad.',
      );
      return;
    }

    const reglaDias = obtenerReglaDias(
      tipoSeleccionado,
    );

    if (
      !Number.isInteger(dias) ||
      dias < reglaDias.min ||
      (
        reglaDias.max !== null &&
        dias > reglaDias.max
      )
    ) {
      setErrorCarga(reglaDias.mensaje);
      return;
    }

    const confirmar = window.confirm(
      '¿Confirmas que deseas guardar todos los cambios realizados en esta incapacidad?',
    );

    if (!confirmar) return;

    setProcesandoGestion(true);
    setErrorCarga('');
    setMensajeGestion('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_BASE_URL}/nomina-incapacidades/${idIncapacidad}/datos`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
          body: JSON.stringify({
            tipo_incapacidad: tipoSeleccionado,
            fecha_inicio: fechaInicio,
            dias_incapacidad: dias,
            es_prorroga: Boolean(esProrrogaEditada),
          }),
        },
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.detail ||
          data?.message ||
          'No fue posible actualizar la información de la incapacidad.',
        );
      }

      await refrescarDetalleGestionado(
        idIncapacidad,
        data?.message ||
        'Información de la incapacidad actualizada correctamente.',
      );
    } catch (error) {
      console.error(
        'Error actualizando información de incapacidad:',
        error,
      );

      setErrorCarga(
        error?.message ||
        'No fue posible actualizar la información de la incapacidad.',
      );
    } finally {
      setProcesandoGestion(false);
    }
  };


  const aprobarIncapacidad = async () => {
    const idIncapacidad =
      incapacidadSeleccionada?.idIncapacidad;

    if (!idIncapacidad) return;

    const confirmar = window.confirm(
      '¿Confirmas que deseas aprobar esta incapacidad?',
    );

    if (!confirmar) return;

    setProcesandoGestion(true);
    setErrorCarga('');
    setMensajeGestion('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_BASE_URL}/nomina-incapacidades/${idIncapacidad}/aprobar`,
        {
          method: 'PUT',
          headers: {
            Accept: 'application/json',
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
        },
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.detail ||
          data?.message ||
          'No fue posible aprobar la incapacidad.',
        );
      }

      setMostrarRechazo(false);
      setMotivoRechazo('');

      await refrescarDetalleGestionado(
        idIncapacidad,
        data?.message ||
          'Incapacidad aprobada correctamente.',
      );
    } catch (error) {
      console.error(
        'Error aprobando incapacidad:',
        error,
      );

      setErrorCarga(
        error?.message ||
        'No fue posible aprobar la incapacidad.',
      );
    } finally {
      setProcesandoGestion(false);
    }
  };


  const rechazarIncapacidad = async () => {
    const idIncapacidad =
      incapacidadSeleccionada?.idIncapacidad;

    if (!idIncapacidad) return;

    const observacion = motivoRechazo.trim();

    if (observacion.length < 3) {
      setErrorCarga(
        'Debes registrar el motivo del rechazo.',
      );
      return;
    }

    const confirmar = window.confirm(
      '¿Confirmas que deseas rechazar esta incapacidad?',
    );

    if (!confirmar) return;

    setProcesandoGestion(true);
    setErrorCarga('');
    setMensajeGestion('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_BASE_URL}/nomina-incapacidades/${idIncapacidad}/rechazar`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
          body: JSON.stringify({
            observacion,
          }),
        },
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.detail ||
          data?.message ||
          'No fue posible rechazar la incapacidad.',
        );
      }

      setMostrarRechazo(false);
      setMotivoRechazo('');

      await refrescarDetalleGestionado(
        idIncapacidad,
        data?.message ||
          'Incapacidad rechazada correctamente.',
      );
    } catch (error) {
      console.error(
        'Error rechazando incapacidad:',
        error,
      );

      setErrorCarga(
        error?.message ||
        'No fue posible rechazar la incapacidad.',
      );
    } finally {
      setProcesandoGestion(false);
    }
  };


  const marcarPendienteRadicacion = async () => {
    const idIncapacidad =
      incapacidadSeleccionada?.idIncapacidad;

    if (!idIncapacidad) return;

    const confirmar = window.confirm(
      '¿Confirmas que deseas pasar esta incapacidad a pendiente de radicación?',
    );

    if (!confirmar) return;

    setProcesandoGestion(true);
    setErrorCarga('');
    setMensajeGestion('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_BASE_URL}/nomina-incapacidades/${idIncapacidad}/pendiente-radicacion`,
        {
          method: 'PUT',
          headers: {
            Accept: 'application/json',
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
        },
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.detail ||
          data?.message ||
          'No fue posible pasar la incapacidad a pendiente de radicación.',
        );
      }

      await refrescarDetalleGestionado(
        idIncapacidad,
        data?.message ||
          'Incapacidad marcada como pendiente de radicación correctamente.',
      );
    } catch (error) {
      console.error(
        'Error marcando incapacidad como pendiente de radicación:',
        error,
      );

      setErrorCarga(
        error?.message ||
        'No fue posible pasar la incapacidad a pendiente de radicación.',
      );
    } finally {
      setProcesandoGestion(false);
    }
  };


  const radicarIncapacidad = async () => {
    const idIncapacidad =
      incapacidadSeleccionada?.idIncapacidad;

    if (!idIncapacidad) return;

    const numero = numeroRadicado.trim();
    const fecha = fechaRadicacion.trim();

    if (!numero) {
      setErrorCarga('Debes registrar el número de radicado.');
      return;
    }

    if (!fecha) {
      setErrorCarga('Debes registrar la fecha de radicación.');
      return;
    }

    const confirmar = window.confirm(
      '¿Confirmas que deseas radicar esta incapacidad con la información registrada?',
    );

    if (!confirmar) return;

    setProcesandoGestion(true);
    setErrorCarga('');
    setMensajeGestion('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_BASE_URL}/nomina-incapacidades/${idIncapacidad}/radicar`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            numero_radicado: numero,
            fecha_radicacion: fecha,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.detail ||
            data?.message ||
            'No fue posible radicar la incapacidad.',
        );
      }

      setNumeroRadicado('');
      setFechaRadicacion('');

      await refrescarDetalleGestionado(
        idIncapacidad,
        data?.message || 'Incapacidad radicada correctamente.',
      );
    } catch (error) {
      console.error('Error radicando incapacidad:', error);
      setErrorCarga(
        error?.message || 'No fue posible radicar la incapacidad.',
      );
    } finally {
      setProcesandoGestion(false);
    }
  };


  const negarIncapacidad = async () => {
    const idIncapacidad =
      incapacidadSeleccionada?.idIncapacidad;

    if (!idIncapacidad) return;

    const causal = causalNegacion.trim();

    if (causal.length < 3) {
      setErrorCarga(
        'Debes registrar la causal de negación.',
      );
      return;
    }

    const confirmar = window.confirm(
      '¿Confirmas que deseas marcar esta incapacidad como negada?',
    );

    if (!confirmar) return;

    setProcesandoGestion(true);
    setErrorCarga('');
    setMensajeGestion('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_BASE_URL}/nomina-incapacidades/${idIncapacidad}/negar`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
          body: JSON.stringify({
            causal_negacion: causal,
          }),
        },
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.detail ||
            data?.message ||
            'No fue posible marcar la incapacidad como negada.',
        );
      }

      setMostrarNegacion(false);
      setCausalNegacion('');

      await refrescarDetalleGestionado(
        idIncapacidad,
        data?.message ||
          'Incapacidad marcada como negada correctamente.',
      );
    } catch (error) {
      console.error(
        'Error marcando incapacidad como negada:',
        error,
      );

      setErrorCarga(
        error?.message ||
          'No fue posible marcar la incapacidad como negada.',
      );
    } finally {
      setProcesandoGestion(false);
    }
  };


  const marcarEnProcesoPago = async () => {
    const idIncapacidad =
      incapacidadSeleccionada?.idIncapacidad;

    if (!idIncapacidad) return;

    const confirmar = window.confirm(
      '¿Confirmas que deseas pasar esta incapacidad a en proceso de pago?',
    );

    if (!confirmar) return;

    setProcesandoGestion(true);
    setErrorCarga('');
    setMensajeGestion('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_BASE_URL}/nomina-incapacidades/${idIncapacidad}/en-proceso-pago`,
        {
          method: 'PUT',
          headers: {
            Accept: 'application/json',
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
        },
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.detail ||
            data?.message ||
            'No fue posible pasar la incapacidad a en proceso de pago.',
        );
      }

      setMostrarNegacion(false);
      setCausalNegacion('');

      await refrescarDetalleGestionado(
        idIncapacidad,
        data?.message ||
          'Incapacidad marcada como en proceso de pago correctamente.',
      );
    } catch (error) {
      console.error(
        'Error pasando incapacidad a en proceso de pago:',
        error,
      );

      setErrorCarga(
        error?.message ||
          'No fue posible pasar la incapacidad a en proceso de pago.',
      );
    } finally {
      setProcesandoGestion(false);
    }
  };


  const registrarPago = async () => {
    const idIncapacidad =
      incapacidadSeleccionada?.idIncapacidad;

    if (!idIncapacidad) return;

    const valorNormalizado = String(valorPagado || '')
      .replace(/\./g, '')
      .replace(',', '.')
      .trim();

    const valorNumero = Number(valorNormalizado);

    if (!Number.isFinite(valorNumero) || valorNumero <= 0) {
      setErrorCarga(
        'Debes registrar un valor pagado mayor que cero.',
      );
      return;
    }

    const confirmar = window.confirm(
      `¿Confirmas que deseas registrar el pago por ${formatearMonedaColombia(valorNumero)}?`,
    );

    if (!confirmar) return;

    setProcesandoGestion(true);
    setErrorCarga('');
    setMensajeGestion('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_BASE_URL}/nomina-incapacidades/${idIncapacidad}/pagar`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
          body: JSON.stringify({
            valor_pagado: valorNumero,
          }),
        },
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.detail ||
            data?.message ||
            'No fue posible registrar el pago de la incapacidad.',
        );
      }

      setValorPagado('');

      await refrescarDetalleGestionado(
        idIncapacidad,
        data?.message ||
          'Pago de incapacidad registrado correctamente.',
      );
    } catch (error) {
      console.error(
        'Error registrando pago de incapacidad:',
        error,
      );

      setErrorCarga(
        error?.message ||
          'No fue posible registrar el pago de la incapacidad.',
      );
    } finally {
      setProcesandoGestion(false);
    }
  };


  const totales = useMemo(() => {
    return incapacidades.reduce(
      (acumulado, item) => {
        const estado = normalizarEstado(item.estado);

        acumulado.total += 1;

        if (estado === 'REGISTRADA') {
          acumulado.registradas += 1;
        }

        if (
          estado === 'RECHAZADA' ||
          estado === 'NEGADA' ||
          estado === 'NEGADO'
        ) {
          acumulado.rechazadas += 1;
        }

        if (
          estado === 'APROBADA' ||
          estado === 'PENDIENTE RADICACION'
        ) {
          acumulado.aprobadas += 1;
        }

        if (
          estado === 'RADICADO' ||
          estado === 'EN PROCESO DE PAGO' ||
          estado === 'PAGADO'
        ) {
          acumulado.radicadas += 1;
        }

        if (
          estado === 'SIN RECOBRO' ||
          estado === 'SIN_RECOBRO'
        ) {
          acumulado.sinRecobro += 1;
        }

        return acumulado;
      },
      {
        total: 0,
        registradas: 0,
        rechazadas: 0,
        aprobadas: 0,
        radicadas: 0,
        sinRecobro: 0,
      },
    );
  }, [incapacidades]);


  const incapacidadesFiltradas = useMemo(() => {
    const textoBusqueda =
      busqueda.trim().toLowerCase();

    return incapacidades.filter((item) => {
      const estado = normalizarEstado(item.estado);

      const coincideBusqueda =
        !textoBusqueda ||
        String(item.identificacion || '')
          .toLowerCase()
          .includes(textoBusqueda) ||
        String(item.nombre || '')
          .toLowerCase()
          .includes(textoBusqueda) ||
        String(item.eps || '')
          .toLowerCase()
          .includes(textoBusqueda) ||
        String(item.tipoIncapacidad || '')
          .toLowerCase()
          .includes(textoBusqueda) ||
        String(item.descripcionTipo || '')
          .toLowerCase()
          .includes(textoBusqueda);

      let coincidePestana = false;

      if (pestanaActiva === 'REGISTRADAS') {
        coincidePestana =
          estado === 'REGISTRADA';
      }

      if (pestanaActiva === 'RECHAZADAS') {
        coincidePestana =
          estado === 'RECHAZADA' ||
          estado === 'NEGADA' ||
          estado === 'NEGADO';
      }

      if (pestanaActiva === 'APROBADAS') {
        coincidePestana =
          estado === 'APROBADA' ||
          estado === 'PENDIENTE RADICACION';
      }

      if (pestanaActiva === 'RADICADAS') {
        coincidePestana =
          estado === 'RADICADO' ||
          estado === 'EN PROCESO DE PAGO' ||
          estado === 'PAGADO';
      }

      if (pestanaActiva === 'SIN_RECOBRO') {
        coincidePestana =
          estado === 'SIN RECOBRO' ||
          estado === 'SIN_RECOBRO';
      }

      return coincideBusqueda && coincidePestana;
    });
  }, [
    incapacidades,
    busqueda,
    pestanaActiva,
  ]);


  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, pestanaActiva]);


  const totalPaginas = Math.max(
    1,
    Math.ceil(
      incapacidadesFiltradas.length /
      REGISTROS_POR_PAGINA,
    ),
  );


  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas);
    }
  }, [paginaActual, totalPaginas]);


  const incapacidadesPaginadas = useMemo(() => {
    const inicio =
      (paginaActual - 1) * REGISTROS_POR_PAGINA;

    return incapacidadesFiltradas.slice(
      inicio,
      inicio + REGISTROS_POR_PAGINA,
    );
  }, [
    incapacidadesFiltradas,
    paginaActual,
  ]);


  const primerRegistro =
    incapacidadesFiltradas.length === 0
      ? 0
      : (paginaActual - 1) *
        REGISTROS_POR_PAGINA +
        1;

  const ultimoRegistro = Math.min(
    paginaActual * REGISTROS_POR_PAGINA,
    incapacidadesFiltradas.length,
  );


  const puedeGestionarIncapacidad =
    normalizarEstado(
      incapacidadSeleccionada?.estado,
    ) === 'REGISTRADA';

  const hayCambiosDatosIncapacidad =
    Boolean(incapacidadSeleccionada) &&
    (
      String(tipoIncapacidadEditada || '')
        .trim()
        .toUpperCase() !==
        String(incapacidadSeleccionada?.tipoIncapacidad || '')
          .trim()
          .toUpperCase() ||
      String(fechaInicioEditada || '').slice(0, 10) !==
        String(incapacidadSeleccionada?.fechaInicio || '').slice(0, 10) ||
      Number(diasIncapacidadEditados || 0) !==
        Number(incapacidadSeleccionada?.diasIncapacidad || 0) ||
      Boolean(esProrrogaEditada) !==
        Boolean(incapacidadSeleccionada?.esProrroga)
    );


  const reglaDiasEdicion = obtenerReglaDias(
    tipoIncapacidadEditada,
  );

  const diasEdicionNumero = Number(
    diasIncapacidadEditados,
  );

  const diasEdicionValidos =
    Number.isInteger(diasEdicionNumero) &&
    diasEdicionNumero >= reglaDiasEdicion.min &&
    (
      reglaDiasEdicion.max === null ||
      diasEdicionNumero <= reglaDiasEdicion.max
    );


  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="rounded-2xl border bg-white p-5 shadow-md sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
              <HeartPulse className="h-7 w-7" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Nómina Incapacidades
              </h1>

              <p className="text-sm text-gray-500">
                Gestión de incapacidades recibidas desde el Portal del Trabajador.
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={cargarIncapacidades}
            disabled={cargando}
            className="w-full sm:w-auto"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                cargando ? 'animate-spin' : ''
              }`}
            />
            Actualizar
          </Button>
        </div>
      </div>


      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500">
            Total recibidas
          </p>

          <p className="mt-1 text-3xl font-bold text-gray-800">
            {cargando ? '...' : totales.total}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500">
            Pendientes de revisión
          </p>

          <p className="mt-1 text-3xl font-bold text-yellow-700">
            {cargando ? '...' : totales.registradas}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500">
            Aprobadas
          </p>

          <p className="mt-1 text-3xl font-bold text-emerald-700">
            {cargando ? '...' : totales.aprobadas}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500">
            Rechazadas / negadas
          </p>

          <p className="mt-1 text-3xl font-bold text-red-700">
            {cargando ? '...' : totales.rechazadas}
          </p>
        </div>
      </div>


      <div className="rounded-2xl border bg-white p-5 shadow-md sm:p-6">
        <div>
          <label className="text-sm font-semibold text-gray-700">
            Buscar trabajador o incapacidad
          </label>

          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <Input
              value={busqueda}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
              placeholder="Identificación, nombre, EPS o tipo de incapacidad..."
              className="pl-10"
            />
          </div>
        </div>

        {errorCarga && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            {errorCarga}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-md">
        <div className="border-b p-4 sm:p-5">
          <h2 className="font-bold text-gray-800">
            Incapacidades recibidas
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Organiza y consulta las incapacidades según la etapa en la que se encuentran.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setPestanaActiva('REGISTRADAS')
              }
              className={`rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${
                pestanaActiva === 'REGISTRADAS'
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Registradas ({totales.registradas})
            </button>

            <button
              type="button"
              onClick={() =>
                setPestanaActiva('RECHAZADAS')
              }
              className={`rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${
                pestanaActiva === 'RECHAZADAS'
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Rechazadas / negadas ({totales.rechazadas})
            </button>

            <button
              type="button"
              onClick={() =>
                setPestanaActiva('APROBADAS')
              }
              className={`rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${
                pestanaActiva === 'APROBADAS'
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Aprobadas ({totales.aprobadas})
            </button>

            <button
              type="button"
              onClick={() =>
                setPestanaActiva('RADICADAS')
              }
              className={`rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${
                pestanaActiva === 'RADICADAS'
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Radicadas ({totales.radicadas})
            </button>

            <button
              type="button"
              onClick={() =>
                setPestanaActiva('SIN_RECOBRO')
              }
              className={`rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${
                pestanaActiva === 'SIN_RECOBRO'
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Sin recobro ({totales.sinRecobro})
            </button>
          </div>
        </div>


        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="min-w-[140px] p-4 text-left">
                  Identificación
                </th>

                <th className="min-w-[230px] p-4 text-left">
                  Trabajador
                </th>

                <th className="min-w-[220px] p-4 text-left">
                  Tipo
                </th>

                <th className="min-w-[120px] p-4 text-left">
                  Inicio
                </th>

                <th className="min-w-[90px] p-4 text-center">
                  Días
                </th>

                <th className="min-w-[130px] p-4 text-left">
                  Estado
                </th>

                <th className="min-w-[120px] p-4 text-center">
                  Documentos
                </th>

                <th className="min-w-[110px] p-4 text-center">
                  Acción
                </th>
              </tr>
            </thead>

            <tbody>
              {cargando && (
                <tr>
                  <td
                    colSpan="8"
                    className="p-10 text-center text-gray-500"
                  >
                    Consultando incapacidades...
                  </td>
                </tr>
              )}

              {!cargando &&
                incapacidadesPaginadas.map(
                  (item) => (
                    <tr
                      key={item.idIncapacidad}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="p-4 whitespace-nowrap">
                        {item.identificacion ||
                          'Sin información'}
                      </td>

                      <td className="p-4 font-medium text-gray-900">
                        {item.nombre ||
                          'SIN INFORMACIÓN'}
                      </td>

                      <td className="p-4">
                        <p className="font-medium text-gray-800">
                          {formatearTipoIncapacidad(
                            item.tipoIncapacidad,
                          )}
                        </p>

                        {item.descripcionTipo &&
                          item.descripcionTipo !==
                            item.tipoIncapacidad && (
                            <p className="mt-1 text-xs text-gray-500">
                              {
                                item.descripcionTipo
                              }
                            </p>
                          )}

                        {item.fueCorregida && (
                          <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                            <RefreshCw className="h-3 w-3" />
                            CORREGIDA
                          </span>
                        )}
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        {formatearFecha(
                          item.fechaInicio,
                        )}
                      </td>

                      <td className="p-4 text-center font-semibold">
                        {item.diasIncapacidad}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${getEstadoBadge(
                            item.estado,
                          )}`}
                        >
                          {item.estado}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        <span className="inline-flex min-w-[34px] justify-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">
                          {item.totalDocumentos}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            abrirDetalle(item)
                          }
                          disabled={
                            cargandoDetalle
                          }
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          Ver
                        </Button>
                      </td>
                    </tr>
                  ),
                )}

              {!cargando &&
                incapacidadesFiltradas.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan="8"
                      className="p-10 text-center text-gray-500"
                    >
                      <HeartPulse className="mx-auto mb-3 h-10 w-10 text-gray-400" />

                      No hay incapacidades en esta categoría con los filtros seleccionados.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>


        <div className="space-y-3 p-4 lg:hidden">
          {cargando && (
            <div className="py-10 text-center text-sm text-gray-500">
              Consultando incapacidades...
            </div>
          )}

          {!cargando &&
            incapacidadesPaginadas.map(
              (item) => (
                <div
                  key={item.idIncapacidad}
                  className="rounded-2xl border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-bold text-gray-900">
                        {item.nombre ||
                          'SIN INFORMACIÓN'}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {item.identificacion ||
                          'Sin identificación'}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getEstadoBadge(
                        item.estado,
                      )}`}
                    >
                      {item.estado}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-semibold text-gray-500">
                        Tipo
                      </p>

                      <p className="mt-1 font-medium text-gray-800">
                        {formatearTipoIncapacidad(
                          item.tipoIncapacidad,
                        )}
                      </p>

                      {item.fueCorregida && (
                        <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                          <RefreshCw className="h-3 w-3" />
                          CORREGIDA
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-500">
                        Días
                      </p>

                      <p className="mt-1 font-medium text-gray-800">
                        {item.diasIncapacidad}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-500">
                        Fecha inicio
                      </p>

                      <p className="mt-1 text-gray-800">
                        {formatearFecha(
                          item.fechaInicio,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-500">
                        Soportes
                      </p>

                      <p className="mt-1 text-gray-800">
                        {item.totalDocumentos}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={() =>
                      abrirDetalle(item)
                    }
                    disabled={cargandoDetalle}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver detalle
                  </Button>
                </div>
              ),
            )}

          {!cargando &&
            incapacidadesFiltradas.length === 0 && (
              <div className="py-10 text-center text-sm text-gray-500">
                <HeartPulse className="mx-auto mb-3 h-10 w-10 text-gray-400" />
                No hay incapacidades en esta categoría con los filtros seleccionados.
              </div>
            )}
        </div>


        {!cargando &&
          incapacidadesFiltradas.length > 0 && (
            <div className="flex flex-col gap-3 border-t bg-gray-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-medium text-gray-500">
                Mostrando {primerRegistro} -{' '}
                {ultimoRegistro} de{' '}
                {incapacidadesFiltradas.length}{' '}
                incapacidades
              </p>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={paginaActual <= 1}
                  onClick={() =>
                    setPaginaActual((actual) =>
                      Math.max(1, actual - 1),
                    )
                  }
                >
                  Anterior
                </Button>

                <span className="min-w-[105px] text-center text-sm font-semibold text-gray-700">
                  Página {paginaActual} de{' '}
                  {totalPaginas}
                </span>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    paginaActual >= totalPaginas
                  }
                  onClick={() =>
                    setPaginaActual((actual) =>
                      Math.min(
                        totalPaginas,
                        actual + 1,
                      ),
                    )
                  }
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
      </div>


      {incapacidadSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 rounded-t-3xl border-b bg-white px-5 py-5 sm:px-8">
              <div>
                <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">
                  Detalle de la incapacidad
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Información enviada por el trabajador y soportes adjuntos.
                </p>

                {incapacidadSeleccionada.fueCorregida && (
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                    <RefreshCw className="h-3.5 w-3.5" />
                    CORREGIDA POR EL TRABAJADOR
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={cerrarDetalle}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>


            <div className="space-y-6 p-5 sm:p-8">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border bg-gray-50 p-5">
                  <div className="mb-4 flex items-center gap-2 font-bold text-emerald-700">
                    <User className="h-5 w-5" />
                    Información del trabajador
                  </div>

                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="font-semibold text-gray-500">
                        Trabajador
                      </p>

                      <p className="mt-1 font-medium text-gray-900">
                        {incapacidadSeleccionada.nombre ||
                          'Sin información'}
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-gray-500">
                        Identificación
                      </p>

                      <p className="mt-1 text-gray-900">
                        {incapacidadSeleccionada.identificacion ||
                          'Sin información'}
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-gray-500">
                        EPS
                      </p>

                      <p className="mt-1 break-words leading-6 text-gray-900">
                        {incapacidadSeleccionada.eps ||
                          'No registrada'}
                      </p>
                    </div>
                  </div>
                </div>


                <div className="rounded-2xl border bg-gray-50 p-5">
                  <div className="mb-4 flex items-center gap-2 font-bold text-emerald-700">
                    <CalendarDays className="h-5 w-5" />
                    Información de la incapacidad
                  </div>

                  <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <p className="font-semibold text-gray-500">
                        Tipo de incapacidad
                      </p>

                      {normalizarEstado(
                        incapacidadSeleccionada.estado,
                      ) === 'REGISTRADA' ? (
                        <div className="mt-2 space-y-2">
                          <select
                            value={tipoIncapacidadEditada}
                            onChange={(e) =>
                              setTipoIncapacidadEditada(
                                e.target.value,
                              )
                            }
                            disabled={procesandoGestion}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                          >
                            {TIPOS_INCAPACIDAD_EDITABLES.map(
                              (tipo) => (
                                <option
                                  key={tipo.value}
                                  value={tipo.value}
                                >
                                  {tipo.label}
                                </option>
                              ),
                            )}
                          </select>

                          <p className="mt-2 text-xs text-gray-500">
                            Puedes ajustar el tipo, la fecha de inicio, los días y la prórroga antes de guardar.
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="mt-1 font-medium text-gray-900">
                            {formatearTipoIncapacidad(
                              incapacidadSeleccionada.tipoIncapacidad,
                            )}
                          </p>

                          {incapacidadSeleccionada.descripcionTipo &&
                            incapacidadSeleccionada.descripcionTipo !==
                              incapacidadSeleccionada.tipoIncapacidad && (
                              <p className="mt-1 text-xs text-gray-500">
                                {
                                  incapacidadSeleccionada.descripcionTipo
                                }
                              </p>
                            )}
                        </>
                      )}
                    </div>

                    {normalizarEstado(
                      incapacidadSeleccionada.estado,
                    ) === 'REGISTRADA' ? (
                      <>
                        <div>
                          <label className="font-semibold text-gray-500">
                            Fecha inicio
                          </label>

                          <Input
                            type="date"
                            value={fechaInicioEditada}
                            onChange={(e) =>
                              setFechaInicioEditada(e.target.value)
                            }
                            disabled={procesandoGestion}
                            className="mt-2 bg-white"
                          />
                        </div>

                        <div>
                          <p className="font-semibold text-gray-500">
                            Fecha final
                          </p>

                          <div className="mt-2 rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-900">
                            {formatearFecha(
                              calcularFechaFinal(
                                fechaInicioEditada,
                                diasIncapacidadEditados,
                              ) ||
                                incapacidadSeleccionada.fechaFinal,
                            )}
                          </div>

                          <p className="mt-1 text-xs text-gray-500">
                            Se calcula automáticamente según la fecha de inicio y los días.
                          </p>
                        </div>

                        <div>
                          <label className="font-semibold text-gray-500">
                            Días
                          </label>

                          <Input
                            type="number"
                            min={reglaDiasEdicion.min}
                            max={
                              reglaDiasEdicion.max ?? undefined
                            }
                            step="1"
                            value={diasIncapacidadEditados}
                            onChange={(e) => {
                              const valor = e.target.value;

                              if (valor === '') {
                                setDiasIncapacidadEditados('');
                                return;
                              }

                              if (!/^\d+$/.test(valor)) {
                                return;
                              }

                              const numero = Number(valor);

                              if (
                                reglaDiasEdicion.max !== null &&
                                numero > reglaDiasEdicion.max
                              ) {
                                setDiasIncapacidadEditados(
                                  String(reglaDiasEdicion.max),
                                );
                                return;
                              }

                              setDiasIncapacidadEditados(valor);
                            }}
                            disabled={procesandoGestion}
                            className="mt-2 bg-white"
                          />

                          {!diasEdicionValidos && diasIncapacidadEditados && (
                            <p className="mt-1 text-xs font-medium text-red-600">
                              {reglaDiasEdicion.mensaje}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="font-semibold text-gray-500">
                            Prórroga
                          </label>

                          <select
                            value={esProrrogaEditada ? 'SI' : 'NO'}
                            onChange={(e) =>
                              setEsProrrogaEditada(
                                e.target.value === 'SI',
                              )
                            }
                            disabled={procesandoGestion}
                            className="mt-2 w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value="NO">No</option>
                            <option value="SI">Sí</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={actualizarDatosIncapacidad}
                            disabled={
                              procesandoGestion ||
                              !tipoIncapacidadEditada ||
                              !fechaInicioEditada ||
                              !diasIncapacidadEditados ||
                              !diasEdicionValidos ||
                              !hayCambiosDatosIncapacidad
                            }
                          >
                            {procesandoGestion
                              ? 'Guardando...'
                              : 'Guardar cambios'}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="font-semibold text-gray-500">
                            Fecha inicio
                          </p>

                          <p className="mt-1 text-gray-900">
                            {formatearFecha(
                              incapacidadSeleccionada.fechaInicio,
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="font-semibold text-gray-500">
                            Fecha final
                          </p>

                          <p className="mt-1 text-gray-900">
                            {formatearFecha(
                              incapacidadSeleccionada.fechaFinal,
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="font-semibold text-gray-500">
                            Días
                          </p>

                          <p className="mt-1 text-gray-900">
                            {
                              incapacidadSeleccionada.diasIncapacidad
                            }
                          </p>
                        </div>

                        <div>
                          <p className="font-semibold text-gray-500">
                            Prórroga
                          </p>

                          <p className="mt-1 text-gray-900">
                            {incapacidadSeleccionada.esProrroga
                              ? 'Sí'
                              : 'No'}
                          </p>
                        </div>
                      </>
                    )}

                    <div>
                      <p className="font-semibold text-gray-500">
                        Estado
                      </p>

                      <span
                        className={`mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getEstadoBadge(
                          incapacidadSeleccionada.estado,
                        )}`}
                      >
                        {
                          incapacidadSeleccionada.estado
                        }
                      </span>
                    </div>

                    <div>
                      <p className="font-semibold text-gray-500">
                        Recibida
                      </p>

                      <p className="mt-1 text-gray-900">
                        {formatearFechaHoraColombia(
                          incapacidadSeleccionada.fechaCreacion,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>


              {incapacidadSeleccionada.fueCorregida && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                      <RefreshCw className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="font-bold text-blue-900">
                            Corrección recibida
                          </h3>

                          <p className="mt-1 text-sm text-blue-800/80">
                            Esta incapacidad fue rechazada previamente por Nómina y el trabajador corrigió y reenvió el mismo registro.
                          </p>
                        </div>

                        {incapacidadSeleccionada.totalCorrecciones > 0 && (
                          <span className="shrink-0 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-bold text-blue-700">
                            {incapacidadSeleccionada.totalCorrecciones}{' '}
                            {incapacidadSeleccionada.totalCorrecciones === 1
                              ? 'corrección'
                              : 'correcciones'}
                          </span>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                        <div className="md:col-span-2">
                          <p className="font-semibold text-gray-500">
                            Motivo solicitado por Nómina
                          </p>
                          <p className="mt-1 whitespace-pre-wrap break-words font-medium text-gray-900">
                            {incapacidadSeleccionada.motivoUltimaCorreccion ||
                              incapacidadSeleccionada.observacionNomina ||
                              'Sin información'}
                          </p>
                        </div>

                        <div>
                          <p className="font-semibold text-gray-500">
                            Fecha de solicitud de corrección
                          </p>
                          <p className="mt-1 text-gray-900">
                            {formatearFechaHoraColombia(
                              incapacidadSeleccionada.fechaSolicitudUltimaCorreccion,
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="font-semibold text-gray-500">
                            Corregida y reenviada por el trabajador
                          </p>
                          <p className="mt-1 font-medium text-blue-900">
                            {formatearFechaHoraColombia(
                              incapacidadSeleccionada.fechaReenvioUltimaCorreccion,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}


              <div className="rounded-2xl border bg-white p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 font-bold text-blue-700">
                    <FileText className="h-5 w-5" />
                    Documentos adjuntos
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
                      {
                        incapacidadSeleccionada.documentos
                          .length
                      }{' '}
                      soporte(s)
                    </span>

                    {incapacidadSeleccionada.documentos.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={descargarTodosDocumentos}
                        disabled={
                          descargandoTodosDocumentos ||
                          abriendoDocumento !== null ||
                          descargandoDocumento !== null
                        }
                        className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 sm:w-auto"
                      >
                        {descargandoTodosDocumentos ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}

                        {descargandoTodosDocumentos
                          ? 'Generando PDF...'
                          : 'Descargar todos en PDF'}
                      </Button>
                    )}
                  </div>
                </div>

                {incapacidadSeleccionada.documentos
                  .length === 0 ? (
                  <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">
                    No hay documentos disponibles para esta incapacidad.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incapacidadSeleccionada.documentos.map(
                      (documento) => (
                        <div
                          key={documento.idDocumento}
                          className="flex flex-col gap-4 rounded-2xl border bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900">
                              {
                                documento.tipoDocumento
                              }
                            </p>

                            <p className="mt-1 break-all text-sm text-gray-600">
                              {
                                documento.nombreArchivo
                              }
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {documento.formato ||
                                'Archivo'}{' '}
                              ·{' '}
                              {formatearTamano(
                                documento.tamanoBytes,
                              )}
                            </p>
                          </div>

                          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full shrink-0 sm:w-auto"
                              onClick={() =>
                                verDocumento(
                                  documento,
                                )
                              }
                              disabled={
                                descargandoTodosDocumentos ||
                                abriendoDocumento === documento.idDocumento ||
                                descargandoDocumento === documento.idDocumento
                              }
                            >
                              {abriendoDocumento ===
                              documento.idDocumento ? (
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Eye className="mr-2 h-4 w-4" />
                              )}

                              Ver documento
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              className="w-full shrink-0 sm:w-auto"
                              onClick={() =>
                                descargarDocumento(
                                  documento,
                                )
                              }
                              disabled={
                                descargandoTodosDocumentos ||
                                descargandoDocumento === documento.idDocumento ||
                                abriendoDocumento === documento.idDocumento
                              }
                            >
                              {descargandoDocumento ===
                              documento.idDocumento ? (
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="mr-2 h-4 w-4" />
                              )}

                              Descargar
                            </Button>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>


              {mensajeGestion && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                  {mensajeGestion}
                </div>
              )}

              {errorCarga && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                  {errorCarga}
                </div>
              )}

              {puedeGestionarIncapacidad ? (
                <div className="rounded-2xl border bg-white p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800">
                        Gestión de Nómina
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        Revisa la información y los soportes antes de aprobar o rechazar la incapacidad.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        onClick={aprobarIncapacidad}
                        disabled={procesandoGestion}
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        {procesandoGestion ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                        )}

                        Aprobar
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setMostrarRechazo(true);
                          setErrorCarga('');
                          setMensajeGestion('');
                        }}
                        disabled={procesandoGestion}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Rechazar
                      </Button>
                    </div>
                  </div>

                  {mostrarRechazo && (
                    <div
                      ref={rechazoRef}
                      className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4"
                    >
                      <label className="text-sm font-bold text-red-800">
                        Motivo del rechazo
                      </label>

                      <p className="mt-1 text-xs text-red-700">
                        Este comentario es obligatorio y quedará asociado a la gestión de Nómina.
                      </p>

                      <textarea
                        ref={motivoRechazoRef}
                        value={motivoRechazo}
                        onChange={(e) =>
                          setMotivoRechazo(e.target.value)
                        }
                        maxLength={1000}
                        rows={4}
                        placeholder="Describe claramente el motivo por el cual se rechaza la incapacidad..."
                        className="mt-3 w-full resize-none rounded-xl border border-red-200 bg-white px-3 py-3 text-sm text-gray-800 outline-none focus:border-red-400"
                      />

                      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setMostrarRechazo(false);
                            setMotivoRechazo('');
                            setErrorCarga('');
                          }}
                          disabled={procesandoGestion}
                        >
                          Cancelar
                        </Button>

                        <Button
                          type="button"
                          onClick={rechazarIncapacidad}
                          disabled={
                            procesandoGestion ||
                            motivoRechazo.trim().length < 3
                          }
                          className="bg-red-600 text-white hover:bg-red-700"
                        >
                          {procesandoGestion ? (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="mr-2 h-4 w-4" />
                          )}

                          Confirmar rechazo
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border bg-gray-50 p-5">
                    <div className="flex items-start gap-3">
                    {normalizarEstado(
                      incapacidadSeleccionada.estado,
                    ) === 'APROBADA' ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    ) : (
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                    )}

                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-800">
                        Gestión de Nómina realizada
                      </h3>

                      <p className="mt-1 text-sm text-gray-600">
                        Esta incapacidad ya fue gestionada y no permite una nueva aprobación o rechazo.
                      </p>

                      <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                        <div>
                          <p className="font-semibold text-gray-500">
                            Estado
                          </p>

                          <span
                            className={`mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getEstadoBadge(
                              incapacidadSeleccionada.estado,
                            )}`}
                          >
                            {incapacidadSeleccionada.estado}
                          </span>
                        </div>

                        <div>
                          <p className="font-semibold text-gray-500">
                            Fecha de gestión
                          </p>

                          <p className="mt-1 text-gray-900">
                            {formatearFechaHoraColombia(
                              incapacidadSeleccionada.fechaGestionNomina,
                            )}
                          </p>
                        </div>

                        <div className="sm:col-span-2">
                          <p className="font-semibold text-gray-500">
                            Usuario que gestionó
                          </p>

                          <p className="mt-1 text-gray-900">
                            {incapacidadSeleccionada.usuarioGestionNomina ||
                              'Sin información'}
                          </p>
                        </div>

                        {incapacidadSeleccionada.observacionNomina && (
                          <div className="sm:col-span-2">
                            <p className="font-semibold text-gray-500">
                              Motivo / observación de Nómina
                            </p>

                            <p className="mt-1 whitespace-pre-wrap text-gray-900">
                              {incapacidadSeleccionada.observacionNomina}
                            </p>
                          </div>
                        )}
                      </div>
                      </div>
                    </div>
                  </div>

                  {normalizarEstado(
                    incapacidadSeleccionada.estado,
                  ) === 'APROBADA' && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-800">
                            Seguimiento de la incapacidad
                          </h3>

                          <p className="mt-1 text-sm text-gray-600">
                            La incapacidad está aprobada y puede continuar al siguiente paso del flujo de Nómina.
                          </p>

                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Estado actual
                            </p>

                            <span
                              className={`mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getEstadoBadge(
                                incapacidadSeleccionada.estado,
                              )}`}
                            >
                              {incapacidadSeleccionada.estado}
                            </span>
                          </div>
                        </div>

                        <Button
                          type="button"
                          onClick={marcarPendienteRadicacion}
                          disabled={procesandoGestion}
                          className="w-full bg-amber-600 text-white hover:bg-amber-700 lg:w-auto"
                        >
                          {procesandoGestion ? (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          )}

                          Pasar a pendiente de radicación
                        </Button>
                      </div>
                    </div>
                  )}

                  {normalizarEstado(
                    incapacidadSeleccionada.estado,
                  ) === 'PENDIENTE RADICACION' && (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                      <h3 className="font-bold text-gray-800">
                        Radicación de la incapacidad
                      </h3>

                      <p className="mt-1 text-sm text-gray-600">
                        Registra la información de radicación para continuar con el flujo de Nómina.
                      </p>

                      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Número de radicado
                          <Input
                            value={numeroRadicado}
                            onChange={(e) =>
                              setNumeroRadicado(e.target.value)
                            }
                            maxLength={100}
                            placeholder="Ej. RAD-2026-001234"
                            disabled={procesandoGestion}
                            className="mt-2 bg-white"
                          />
                        </label>

                        <label className="text-sm font-semibold text-gray-700">
                          Fecha de radicación
                          <Input
                            type="date"
                            value={fechaRadicacion}
                            onChange={(e) =>
                              setFechaRadicacion(e.target.value)
                            }
                            disabled={procesandoGestion}
                            className="mt-2 bg-white"
                          />
                        </label>
                      </div>

                      <div className="mt-5 flex justify-end">
                        <Button
                          type="button"
                          onClick={radicarIncapacidad}
                          disabled={
                            procesandoGestion ||
                            !numeroRadicado.trim() ||
                            !fechaRadicacion
                          }
                          className="w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
                        >
                          {procesandoGestion ? (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          )}
                          Radicar incapacidad
                        </Button>
                      </div>
                    </div>
                  )}

                  {normalizarEstado(
                    incapacidadSeleccionada.estado,
                  ) === 'RADICADO' && (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                      <h3 className="font-bold text-gray-800">
                        Información de radicación
                      </h3>

                      <p className="mt-1 text-sm text-gray-600">
                        La incapacidad ya fue radicada. Registra el resultado informado por la entidad.
                      </p>

                      <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                        <div>
                          <p className="font-semibold text-gray-500">
                            Número de radicado
                          </p>
                          <p className="mt-1 font-medium text-gray-900">
                            {incapacidadSeleccionada.numeroRadicado ||
                              'Sin información'}
                          </p>
                        </div>

                        <div>
                          <p className="font-semibold text-gray-500">
                            Fecha de radicación
                          </p>
                          <p className="mt-1 font-medium text-gray-900">
                            {formatearFecha(
                              incapacidadSeleccionada.fechaRadicacion,
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setMostrarNegacion((actual) => !actual);
                            setErrorCarga('');
                            setMensajeGestion('');
                          }}
                          disabled={procesandoGestion}
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Negado
                        </Button>

                        <Button
                          type="button"
                          onClick={marcarEnProcesoPago}
                          disabled={procesandoGestion}
                          className="bg-violet-600 text-white hover:bg-violet-700"
                        >
                          {procesandoGestion ? (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          )}
                          En proceso de pago
                        </Button>
                      </div>

                      {mostrarNegacion && (
                        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                          <label className="text-sm font-bold text-red-800">
                            Causal de negación
                          </label>

                          <p className="mt-1 text-xs text-red-700">
                            La causal es obligatoria para marcar la incapacidad como negada.
                          </p>

                          <textarea
                            value={causalNegacion}
                            onChange={(e) =>
                              setCausalNegacion(e.target.value)
                            }
                            maxLength={1000}
                            rows={4}
                            placeholder="Registra la causal de negación informada por la entidad..."
                            className="mt-3 w-full resize-none rounded-xl border border-red-200 bg-white px-3 py-3 text-sm text-gray-800 outline-none focus:border-red-400"
                          />

                          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setMostrarNegacion(false);
                                setCausalNegacion('');
                                setErrorCarga('');
                              }}
                              disabled={procesandoGestion}
                            >
                              Cancelar
                            </Button>

                            <Button
                              type="button"
                              onClick={negarIncapacidad}
                              disabled={
                                procesandoGestion ||
                                causalNegacion.trim().length < 3
                              }
                              className="bg-red-600 text-white hover:bg-red-700"
                            >
                              {procesandoGestion ? (
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="mr-2 h-4 w-4" />
                              )}
                              Confirmar negación
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {normalizarEstado(
                    incapacidadSeleccionada.estado,
                  ) === 'NEGADO' && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                      <h3 className="font-bold text-red-800">
                        Incapacidad negada
                      </h3>

                      <p className="mt-3 text-sm font-semibold text-red-700">
                        Causal de negación
                      </p>

                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                        {incapacidadSeleccionada.causalNegacion ||
                          'Sin información'}
                      </p>
                    </div>
                  )}

                  {normalizarEstado(
                    incapacidadSeleccionada.estado,
                  ) === 'EN PROCESO DE PAGO' && (
                    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
                      <h3 className="font-bold text-violet-800">
                        En proceso de pago
                      </h3>

                      <p className="mt-1 text-sm text-gray-600">
                        La incapacidad se encuentra en proceso de pago. Registra el valor cuando el pago haya sido confirmado.
                      </p>

                      <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                        <div>
                          <p className="font-semibold text-gray-500">
                            Número de radicado
                          </p>
                          <p className="mt-1 font-medium text-gray-900">
                            {incapacidadSeleccionada.numeroRadicado ||
                              'Sin información'}
                          </p>
                        </div>

                        <div>
                          <p className="font-semibold text-gray-500">
                            Fecha de radicación
                          </p>
                          <p className="mt-1 font-medium text-gray-900">
                            {formatearFecha(
                              incapacidadSeleccionada.fechaRadicacion,
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl border border-violet-200 bg-white p-4">
                        <label className="text-sm font-bold text-violet-800">
                          Valor pagado
                        </label>

                        <p className="mt-1 text-xs text-gray-600">
                          Registra el valor total pagado por la incapacidad.
                        </p>

                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={valorPagado}
                          onChange={(e) =>
                            setValorPagado(e.target.value)
                          }
                          placeholder="Ej. 350000"
                          disabled={procesandoGestion}
                          className="mt-3 bg-white"
                        />

                        <div className="mt-4 flex justify-end">
                          <Button
                            type="button"
                            onClick={registrarPago}
                            disabled={
                              procesandoGestion ||
                              !valorPagado ||
                              Number(valorPagado) <= 0
                            }
                            className="w-full bg-teal-600 text-white hover:bg-teal-700 sm:w-auto"
                          >
                            {procesandoGestion ? (
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                            )}
                            Registrar pago
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {normalizarEstado(
                    incapacidadSeleccionada.estado,
                  ) === 'PAGADO' && (
                    <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5">
                      <h3 className="font-bold text-teal-800">
                        Incapacidad pagada
                      </h3>

                      <p className="mt-1 text-sm text-gray-600">
                        El pago de la incapacidad fue registrado correctamente.
                      </p>

                      <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                        <div>
                          <p className="font-semibold text-gray-500">
                            Número de radicado
                          </p>
                          <p className="mt-1 font-medium text-gray-900">
                            {incapacidadSeleccionada.numeroRadicado ||
                              'Sin información'}
                          </p>
                        </div>

                        <div>
                          <p className="font-semibold text-gray-500">
                            Fecha de radicación
                          </p>
                          <p className="mt-1 font-medium text-gray-900">
                            {formatearFecha(
                              incapacidadSeleccionada.fechaRadicacion,
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="font-semibold text-gray-500">
                            Valor pagado
                          </p>
                          <p className="mt-1 font-bold text-teal-800">
                            {formatearMonedaColombia(
                              incapacidadSeleccionada.valorPagado,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}


      {cargandoDetalle &&
        !incapacidadSeleccionada && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20">
            <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-xl">
              <RefreshCw className="h-5 w-5 animate-spin text-emerald-700" />

              <span className="text-sm font-semibold text-gray-700">
                Consultando detalle...
              </span>
            </div>
          </div>
        )}
    </div>
  );
};


export default NominaIncapacidadesView;
