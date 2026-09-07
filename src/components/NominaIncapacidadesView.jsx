import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Download,
  Eye,
  FileText,
  HeartPulse,
  RefreshCw,
  Search,
  User,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  '';

const REGISTROS_POR_PAGINA = 10;


const formatearFecha = (valor) => {
  if (!valor) return 'Sin fecha';

  const texto = String(valor).slice(0, 10);
  const partes = texto.split('-');

  if (partes.length !== 3) return valor;

  const [anio, mes, dia] = partes;

  return `${dia}/${mes}/${anio}`;
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

  if (estado === 'RECHAZADA' || estado === 'NEGADA') {
    return 'bg-red-100 text-red-700 border-red-200';
  }

  if (estado === 'RADICADA') {
    return 'bg-blue-100 text-blue-700 border-blue-200';
  }

  if (estado === 'PENDIENTE RADICACION') {
    return 'bg-amber-100 text-amber-700 border-amber-200';
  }

  if (estado === 'EN PROCESO DE PAGO') {
    return 'bg-violet-100 text-violet-700 border-violet-200';
  }

  if (estado === 'PAGADA') {
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


const NominaIncapacidadesView = () => {
  const [incapacidades, setIncapacidades] = useState([]);
  const [incapacidadSeleccionada, setIncapacidadSeleccionada] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODAS');

  const [cargando, setCargando] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [abriendoDocumento, setAbriendoDocumento] = useState(null);
  const [descargandoDocumento, setDescargandoDocumento] = useState(null);

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
    setAbriendoDocumento(null);
    setDescargandoDocumento(null);
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


  const estadosDisponibles = useMemo(() => {
    const estados = incapacidades
      .map((item) => normalizarEstado(item.estado))
      .filter(Boolean);

    return [...new Set(estados)].sort();
  }, [incapacidades]);


  const totales = useMemo(() => {
    return incapacidades.reduce(
      (acumulado, item) => {
        const estado = normalizarEstado(item.estado);

        acumulado.total += 1;

        if (estado === 'REGISTRADA') {
          acumulado.registradas += 1;
        }

        if (estado === 'APROBADA') {
          acumulado.aprobadas += 1;
        }

        if (
          estado === 'RECHAZADA' ||
          estado === 'NEGADA'
        ) {
          acumulado.rechazadas += 1;
        }

        return acumulado;
      },
      {
        total: 0,
        registradas: 0,
        aprobadas: 0,
        rechazadas: 0,
      },
    );
  }, [incapacidades]);


  const incapacidadesFiltradas = useMemo(() => {
    const textoBusqueda =
      busqueda.trim().toLowerCase();

    return incapacidades.filter((item) => {
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
          .includes(textoBusqueda);

      const coincideEstado =
        filtroEstado === 'TODAS' ||
        normalizarEstado(item.estado) === filtroEstado;

      return coincideBusqueda && coincideEstado;
    });
  }, [
    incapacidades,
    busqueda,
    filtroEstado,
  ]);


  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroEstado]);


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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_240px]">
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

          <label className="text-sm font-semibold text-gray-700">
            Estado

            <select
              value={filtroEstado}
              onChange={(e) =>
                setFiltroEstado(e.target.value)
              }
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="TODAS">
                Todas
              </option>

              {estadosDisponibles.map((estado) => (
                <option
                  key={estado}
                  value={estado}
                >
                  {estado}
                </option>
              ))}
            </select>
          </label>
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
            Los registros enviados por el trabajador quedan disponibles para consulta y revisión de Nómina.
          </p>
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

                      No hay incapacidades para los filtros seleccionados.
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
                No hay incapacidades para los filtros seleccionados.
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
                    </div>

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


              <div className="rounded-2xl border bg-white p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 font-bold text-blue-700">
                    <FileText className="h-5 w-5" />
                    Documentos adjuntos
                  </div>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
                    {
                      incapacidadSeleccionada.documentos
                        .length
                    }{' '}
                    soporte(s)
                  </span>
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


              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                En esta primera fase la bandeja es de consulta y revisión. Los cambios de estado de Nómina se agregarán después de validar que los registros y documentos estén llegando correctamente.
              </div>
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
