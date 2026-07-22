import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Eye,
  FilePlus2,
  FileText,
  Search,
  User,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const API_URL = String(
  import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    'http://localhost:8000/api'
).replace(/\/+$/, '');

const obtenerTokenAutenticacion = () => {
  const clavesDirectas = [
    'token',
    'access_token',
    'accessToken',
    'authToken',
    'jwt',
    'jwtToken',
  ];

  const almacenamientos = [
    window.localStorage,
    window.sessionStorage,
  ];

  for (const almacenamiento of almacenamientos) {
    for (const clave of clavesDirectas) {
      const valor = almacenamiento.getItem(clave);

      if (
        valor &&
        valor !== 'null' &&
        valor !== 'undefined'
      ) {
        return valor.replace(/^"|"$/g, '');
      }
    }
  }

  const clavesObjetos = [
    'auth',
    'authData',
    'user',
    'session',
    'userData',
  ];

  for (const almacenamiento of almacenamientos) {
    for (const clave of clavesObjetos) {
      const valor = almacenamiento.getItem(clave);

      if (!valor) {
        continue;
      }

      try {
        const objeto = JSON.parse(valor);

        const token =
          objeto?.token ||
          objeto?.access_token ||
          objeto?.accessToken ||
          objeto?.authToken ||
          objeto?.jwt ||
          objeto?.jwtToken;

        if (token) {
          return String(token);
        }
      } catch (error) {
        // La clave no contiene un objeto JSON válido.
      }
    }
  }

  return null;
};

const OperacionesProcesosDisciplinariosView = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchApplied, setSearchApplied] = useState('');
  const [trabajadores, setTrabajadores] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [busquedaRealizada, setBusquedaRealizada] =
    useState(false);
  const [historiales, setHistoriales] = useState({});
  const [loadingHistorial, setLoadingHistorial] =
    useState({});
  const [respuestaAbierta, setRespuestaAbierta] =
    useState(null);
  const [loadingRespuesta, setLoadingRespuesta] =
    useState(false);
  const [mensajeRespuesta, setMensajeRespuesta] =
    useState("");

  const obtenerIdRegistroPersonal = (trabajador) =>
    trabajador?.IdRegistroPersonal ||
    trabajador?.idRegistroPersonal ||
    trabajador?.id_registro_personal ||
    trabajador?.id ||
    null;

  const obtenerNombreCompleto = (trabajador) => {
    const nombreCompleto =
      trabajador?.NombreCompleto ||
      trabajador?.nombreCompleto;

    if (nombreCompleto) {
      return String(nombreCompleto).trim();
    }

    const nombres =
      trabajador?.Nombres ||
      trabajador?.nombres ||
      '';

    const apellidos =
      trabajador?.Apellidos ||
      trabajador?.apellidos ||
      '';

    return `${nombres} ${apellidos}`.trim();
  };

  const obtenerIdentificacion = (trabajador) =>
    trabajador?.NumeroDocumento ||
    trabajador?.NumeroIdentificacion ||
    trabajador?.numeroIdentificacion ||
    trabajador?.cedula ||
    trabajador?.identificacion ||
    trabajador?.documento ||
    'Sin identificación';

  const obtenerCargo = (trabajador) =>
    trabajador?.Cargo ||
    trabajador?.cargo ||
    trabajador?.NombreCargo ||
    trabajador?.nombreCargo ||
    trabajador?.DescripcionCargo ||
    trabajador?.descripcionCargo ||
    trabajador?.cargoNombre ||
    trabajador?.CargoNombre ||
    trabajador?.NombreTipoCargo ||
    trabajador?.DescripcionTipoCargo ||
    'Cargo no asignado';

  const obtenerIdEstadoProceso = (trabajador) =>
    Number(
      trabajador?.IdEstadoProceso ||
        trabajador?.idEstadoProceso ||
        trabajador?.id_estado_proceso ||
        0
    );

  const obtenerEstadoTexto = (trabajador) =>
    String(
      trabajador?.Estado ||
        trabajador?.estado ||
        trabajador?.EstadoProceso ||
        trabajador?.NombreEstado ||
        trabajador?.nombreEstado ||
        ''
    )
      .trim()
      .toUpperCase();

  const esTrabajadorContratado = (trabajador) => {
    const idEstadoProceso =
      obtenerIdEstadoProceso(trabajador);

    const estadoTexto =
      obtenerEstadoTexto(trabajador);

    return (
      idEstadoProceso === 25 ||
      estadoTexto === 'CONTRATADO'
    );
  };

  const normalizarTexto = (valor) =>
    String(valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();

  const resultados = useMemo(() => {
    const criterio = normalizarTexto(searchApplied);

    if (!criterio) {
      return [];
    }

    return trabajadores.filter((trabajador) => {
      const nombreCompleto = normalizarTexto(
        obtenerNombreCompleto(trabajador)
      );

      const identificacion = normalizarTexto(
        obtenerIdentificacion(trabajador)
      );

      return (
        esTrabajadorContratado(trabajador) &&
        (
          nombreCompleto.includes(criterio) ||
          identificacion.includes(criterio)
        )
      );
    });
  }, [trabajadores, searchApplied]);

  const cargarTrabajadoresQA = async () => {
    const token = obtenerTokenAutenticacion();

    if (!token) {
      throw new Error(
        'No se encontró el token de autenticación. Cierra sesión e ingresa nuevamente.'
      );
    }

    const response = await fetch(
      `${API_URL}/aspirantes`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 401) {
      throw new Error(
        'La sesión no está autorizada o venció. Cierra sesión e ingresa nuevamente.'
      );
    }

    if (!response.ok) {
      throw new Error(
        `No se pudo consultar el personal. Código HTTP: ${response.status}.`
      );
    }

    const data = await response.json();

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.aspirantes)) {
      return data.aspirantes;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    if (Array.isArray(data?.items)) {
      return data.items;
    }

    return [];
  };

  const construirHeaders = () => {
    const token = obtenerTokenAutenticacion();

    return {
      Accept: "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  };

  const formatearFecha = (valor) => {
    if (!valor) {
      return "—";
    }

    const fecha = String(valor).slice(0, 10);
    const partes = fecha.split("-");

    if (partes.length !== 3) {
      return fecha;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  const formatearTexto = (valor) => {
    const texto = String(valor || "").trim();

    if (!texto) {
      return "—";
    }

    return texto
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/(^|\s)\S/g, (letra) =>
        letra.toUpperCase()
      );
  };

  const cargarHistorialTrabajador = async (
    idRegistroPersonal
  ) => {
    if (!idRegistroPersonal) {
      return [];
    }

    setLoadingHistorial((actual) => ({
      ...actual,
      [idRegistroPersonal]: true,
    }));

    try {
      const response = await fetch(
        `${API_URL}/procesos-disciplinarios/trabajador/${idRegistroPersonal}/historial`,
        {
          method: "GET",
          headers: construirHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(
          "No se pudo consultar el historial disciplinario."
        );
      }

      const data = await response.json();
      const historial = Array.isArray(data)
        ? data
        : [];

      setHistoriales((actual) => ({
        ...actual,
        [idRegistroPersonal]: historial,
      }));

      return historial;
    } catch (error) {
      console.error(
        "Error consultando historial disciplinario:",
        error
      );

      setHistoriales((actual) => ({
        ...actual,
        [idRegistroPersonal]: [],
      }));

      return [];
    } finally {
      setLoadingHistorial((actual) => ({
        ...actual,
        [idRegistroPersonal]: false,
      }));
    }
  };

  const abrirRespuestaRRLL = async (proceso) => {
    const idProceso =
      proceso?.IdProcesoDisciplinario;

    if (!idProceso) {
      return;
    }

    try {
      setLoadingRespuesta(true);
      setMensajeRespuesta("");
      setRespuestaAbierta(null);

      const response = await fetch(
        `${API_URL}/procesos-disciplinarios/${idProceso}/expediente`,
        {
          method: "GET",
          headers: construirHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(
          "No se pudo consultar la respuesta de Relaciones Laborales."
        );
      }

      const expediente = await response.json();

      const documentosRRLL = (
        Array.isArray(expediente?.Documentos)
          ? expediente.Documentos
          : []
      ).filter((documento) => {
        const tipo = String(
          documento?.TipoDocumento || ""
        )
          .trim()
          .toUpperCase();

        return tipo !== "EVIDENCIA_OPERACIONES";
      });

      setRespuestaAbierta({
        proceso,
        expediente,
        documentosRRLL,
      });
    } catch (error) {
      console.error(
        "Error consultando respuesta RRLL:",
        error
      );

      setMensajeRespuesta(
        error?.message ||
          "No se pudo consultar la respuesta de Relaciones Laborales."
      );
    } finally {
      setLoadingRespuesta(false);
    }
  };

  const verDocumentoRRLL = (documento) => {
    const idDocumento =
      documento?.IdDocumentoProcesoDisciplinario;

    if (!idDocumento) {
      return;
    }

    window.open(
      `${API_URL}/documento-proceso-disciplinario/${idDocumento}/archivo`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleBuscar = async () => {
    const criterio = searchTerm.trim();

    setMensaje('');
    setBusquedaRealizada(false);
    setSearchApplied('');
    setTrabajadores([]);
    setHistoriales({});
    setLoadingHistorial({});
    setRespuestaAbierta(null);
    setMensajeRespuesta("");

    if (!criterio) {
      setMensaje(
        'Debes ingresar el nombre o número de identificación del trabajador.'
      );
      return;
    }

    try {
      setLoadingSearch(true);

      const listaQA = await cargarTrabajadoresQA();

      const contratadosQA = listaQA.filter(
        esTrabajadorContratado
      );

      setTrabajadores(contratadosQA);
      setSearchApplied(criterio);
      setBusquedaRealizada(true);

      const criterioNormalizado =
        normalizarTexto(criterio);

      const encontrados = contratadosQA.filter(
        (trabajador) => {
          const nombre = normalizarTexto(
            obtenerNombreCompleto(trabajador)
          );

          const documento = normalizarTexto(
            obtenerIdentificacion(trabajador)
          );

          return (
            nombre.includes(criterioNormalizado) ||
            documento.includes(criterioNormalizado)
          );
        }
      );

      if (encontrados.length === 0) {
        setMensaje(
          'No se encontró un trabajador contratado con ese criterio en QA.'
        );
      } else {
        await Promise.all(
          encontrados.map((trabajador) =>
            cargarHistorialTrabajador(
              obtenerIdRegistroPersonal(trabajador)
            )
          )
        );
      }
    } catch (error) {
      console.error(
        'Error consultando trabajadores de QA:',
        error
      );

      setTrabajadores([]);
      setSearchApplied(criterio);
      setBusquedaRealizada(true);

      setMensaje(
        error?.message ||
          'No se pudo realizar la búsqueda del trabajador.'
      );
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleBuscar();
    }
  };

  const handleIniciarProceso = (trabajador) => {
    if (!esTrabajadorContratado(trabajador)) {
      setMensaje(
        'El trabajador seleccionado no se encuentra contratado y no puede iniciar un proceso disciplinario.'
      );
      return;
    }

    const idRegistroPersonal =
      obtenerIdRegistroPersonal(trabajador);

    if (!idRegistroPersonal) {
      setMensaje(
        'No fue posible identificar el registro personal del trabajador seleccionado.'
      );
      return;
    }

    const trabajadorFinal = {
      ...trabajador,
      IdRegistroPersonal: idRegistroPersonal,
      NombreCompleto:
        obtenerNombreCompleto(trabajador),
      NumeroDocumento:
        obtenerIdentificacion(trabajador),
      Cargo: obtenerCargo(trabajador),
      FechaIngreso:
        trabajador?.FechaIngreso ||
        trabajador?.fechaIngreso ||
        trabajador?.FechaInicio ||
        trabajador?.fechaInicio ||
        trabajador?.FechaIngresoContrato ||
        trabajador?.fechaIngresoContrato ||
        null,
      Estado: 'CONTRATADO',
      IdEstadoProceso: 25,
    };

    navigate(
      '/operaciones/procesos-disciplinarios/iniciar',
      {
        state: {
          trabajador: trabajadorFinal,
          idRegistroPersonal,
        },
      }
    );
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="w-full min-w-0 max-w-full space-y-4 overflow-x-hidden"
    >
      <section className="w-full min-w-0 overflow-hidden rounded-2xl border-t-4 border-emerald-600 bg-white p-4 shadow-xl sm:p-6 lg:p-8">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-200">
            <ClipboardList className="h-6 w-6 text-white" />
          </div>

          <div className="min-w-0">
            <h1 className="break-words text-xl font-bold text-gray-800 sm:text-2xl">
              Procesos Disciplinarios
            </h1>

            <p className="mt-1 break-words text-sm leading-relaxed text-gray-500">
              Busca al trabajador contratado que presenta la novedad e inicia el proceso disciplinario.
            </p>
          </div>
        </div>

        <div className="mt-6 grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <Input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Buscar por nombre o número de identificación..."
              className="min-h-11 w-full min-w-0 bg-gray-50 pl-9"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleBuscar}
            disabled={loadingSearch}
            className="min-h-11 w-full rounded-xl border-emerald-300 font-semibold text-emerald-700 hover:bg-emerald-50 lg:w-auto"
          >
            <Search className="mr-2 h-4 w-4" />

            {loadingSearch
              ? 'Buscando...'
              : 'Buscar'}
          </Button>
        </div>

        {mensaje && (
          <div
            className={cn(
              'mt-4 rounded-xl border px-4 py-3 text-sm',
              resultados.length === 0
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            )}
          >
            {mensaje}
          </div>
        )}

        <div className="mt-6">
          {!busquedaRealizada ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-12 text-center sm:px-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                <User className="h-8 w-8 text-gray-400" />
              </div>

              <h2 className="mt-4 text-lg font-semibold text-gray-700">
                Busca un trabajador contratado
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-gray-500">
                Ingresa el nombre o número de identificación del trabajador.
              </p>
            </div>
          ) : resultados.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-12 text-center sm:px-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                <Search className="h-8 w-8 text-gray-400" />
              </div>

              <h2 className="mt-4 text-lg font-semibold text-gray-700">
                No se encontró un trabajador contratado
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-gray-500">
                Verifica el nombre o la identificación e inténtalo nuevamente.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-600">
                {resultados.length === 1
                  ? 'Trabajador contratado encontrado'
                  : `${resultados.length} trabajadores contratados encontrados`}
              </p>

              {resultados.map((trabajador) => {
                const idRegistroPersonal =
                  obtenerIdRegistroPersonal(trabajador);

                const nombreCompleto =
                  obtenerNombreCompleto(trabajador);

                return (
                  <article
                    key={
                      idRegistroPersonal ||
                      obtenerIdentificacion(trabajador)
                    }
                    className="min-w-0 overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                          <User className="h-6 w-6" />
                        </div>

                        <div className="min-w-0">
                          <h3 className="break-words text-base font-bold text-gray-900 sm:text-lg">
                            {nombreCompleto.toUpperCase()}
                          </h3>

                          <p className="mt-1 break-words text-sm text-gray-600">
                            Documento:{' '}
                            {obtenerIdentificacion(trabajador)}
                          </p>

                          <p className="mt-1 break-words text-sm text-gray-600">
                            Cargo:{' '}
                            {obtenerCargo(trabajador)}
                          </p>

                          <span className="mt-3 inline-flex rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                            CONTRATADO
                          </span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={() =>
                          handleIniciarProceso(trabajador)
                        }
                        className="min-h-11 w-full rounded-xl bg-emerald-600 px-5 font-semibold text-white shadow-md hover:bg-emerald-700 lg:w-auto"
                      >
                        <FilePlus2 className="mr-2 h-5 w-5" />
                        Iniciar nuevo proceso disciplinario
                      </Button>
                    </div>

                    <div className="border-t border-gray-200 bg-gray-50/70 p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                          <FileText className="h-5 w-5" />
                        </div>

                        <div>
                          <h4 className="font-bold text-gray-900">
                            Procesos disciplinarios anteriores
                          </h4>

                          <p className="mt-1 text-sm text-gray-500">
                            Consulta el estado y la respuesta emitida por Relaciones Laborales.
                          </p>
                        </div>
                      </div>

                      {loadingHistorial[idRegistroPersonal] ? (
                        <div className="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-5 text-center text-sm text-gray-500">
                          Consultando procesos anteriores...
                        </div>
                      ) : (
                        <>
                          {(historiales[idRegistroPersonal] || [])
                            .length === 0 ? (
                            <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center">
                              <p className="font-semibold text-gray-700">
                                No existen procesos anteriores visibles.
                              </p>

                              <p className="mt-1 text-sm text-gray-500">
                                Cuando el proceso sea enviado a Relaciones Laborales aparecerá en esta sección.
                              </p>
                            </div>
                          ) : (
                            <div className="mt-4 space-y-3">
                              {(historiales[idRegistroPersonal] || [])
                                .map((proceso) => {
                                  const respuestaDisponible =
                                    proceso
                                      ?.RespuestaRRLLDisponible ===
                                    true;

                                  return (
                                    <div
                                      key={
                                        proceso
                                          .IdProcesoDisciplinario
                                      }
                                      className="rounded-xl border border-gray-200 bg-white p-4"
                                    >
                                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                        <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                          <div>
                                            <p className="text-xs font-semibold uppercase text-gray-500">
                                              Proceso
                                            </p>
                                            <p className="mt-1 font-bold text-gray-900">
                                              #
                                              {
                                                proceso
                                                  .IdProcesoDisciplinario
                                              }
                                            </p>
                                          </div>

                                          <div>
                                            <p className="text-xs font-semibold uppercase text-gray-500">
                                              Citación
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-gray-800">
                                              {formatearFecha(
                                                proceso
                                                  .FechaCitacion ||
                                                  proceso
                                                    .FechaCreacion
                                              )}
                                            </p>
                                          </div>

                                          <div>
                                            <p className="text-xs font-semibold uppercase text-gray-500">
                                              Estado
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-gray-800">
                                              {formatearTexto(
                                                proceso
                                                  .EstadoProceso
                                              )}
                                            </p>
                                          </div>

                                          <div>
                                            <p className="text-xs font-semibold uppercase text-gray-500">
                                              Respuesta RRLL
                                            </p>
                                            <span
                                              className={cn(
                                                "mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-bold",
                                                respuestaDisponible
                                                  ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                                                  : "border-amber-200 bg-amber-100 text-amber-800"
                                              )}
                                            >
                                              {respuestaDisponible
                                                ? "Disponible"
                                                : "Pendiente"}
                                            </span>
                                          </div>
                                        </div>

                                        {respuestaDisponible && (
                                          <Button
                                            type="button"
                                            variant="outline"
                                            disabled={
                                              loadingRespuesta
                                            }
                                            onClick={() =>
                                              abrirRespuestaRRLL(
                                                proceso
                                              )
                                            }
                                            className="min-h-10 w-full rounded-xl border-blue-300 font-semibold text-blue-700 hover:bg-blue-50 lg:w-auto"
                                          >
                                            <Eye className="mr-2 h-4 w-4" />
                                            Ver respuesta
                                          </Button>
                                        )}
                                      </div>

                                      {proceso
                                        ?.MotivoCitacion && (
                                        <div className="mt-3 border-t border-gray-100 pt-3">
                                          <p className="text-xs font-semibold uppercase text-gray-500">
                                            Motivo
                                          </p>
                                          <p className="mt-1 break-words text-sm text-gray-700">
                                            {formatearTexto(
                                              proceso
                                                .MotivoCitacion
                                            )}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {(respuestaAbierta ||
        loadingRespuesta ||
        mensajeRespuesta) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
              <div>
                <p className="text-sm font-semibold text-blue-700">
                  Relaciones Laborales
                </p>

                <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                  Respuesta del proceso disciplinario
                </h2>
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setRespuestaAbierta(null);
                  setMensajeRespuesta("");
                }}
                className="h-10 w-10 rounded-full p-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-4 sm:p-6">
              {loadingRespuesta ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-12 text-center text-gray-600">
                  Consultando respuesta de Relaciones Laborales...
                </div>
              ) : mensajeRespuesta ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-700">
                  {mensajeRespuesta}
                </div>
              ) : respuestaAbierta ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs font-semibold uppercase text-gray-500">
                        Proceso
                      </p>
                      <p className="mt-1 font-bold text-gray-900">
                        #
                        {
                          respuestaAbierta.proceso
                            .IdProcesoDisciplinario
                        }
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs font-semibold uppercase text-gray-500">
                        Tipo de cierre
                      </p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {formatearTexto(
                          respuestaAbierta.expediente
                            ?.Cierre?.TipoCierre
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs font-semibold uppercase text-gray-500">
                        Medida disciplinaria
                      </p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {formatearTexto(
                          respuestaAbierta.expediente
                            ?.Cierre
                            ?.MedidaDisciplinaria
                        )}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900">
                      Documentos emitidos por Relaciones Laborales
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Esta información es únicamente de consulta para Operaciones.
                    </p>
                  </div>

                  {respuestaAbierta.documentosRRLL
                    .length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
                      <p className="font-semibold text-gray-700">
                        No hay documentos disponibles.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {respuestaAbierta.documentosRRLL.map(
                        (documento) => (
                          <div
                            key={
                              documento
                                .IdDocumentoProcesoDisciplinario
                            }
                            className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="break-words font-semibold text-gray-900">
                                {documento.NombreArchivo ||
                                  "Documento de Relaciones Laborales"}
                              </p>

                              <p className="mt-1 text-sm text-gray-500">
                                {formatearTexto(
                                  documento.TipoDocumento
                                )}
                                {" · "}
                                {formatearFecha(
                                  documento.FechaCreacion
                                )}
                              </p>
                            </div>

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                verDocumentoRRLL(
                                  documento
                                )
                              }
                              className="w-full rounded-xl border-blue-300 font-semibold text-blue-700 hover:bg-blue-50 sm:w-auto"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver documento
                            </Button>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default OperacionesProcesosDisciplinariosView;