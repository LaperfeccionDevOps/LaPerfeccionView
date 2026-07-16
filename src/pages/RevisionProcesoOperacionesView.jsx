import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Download,
  Eye,
  FileText,
  Loader2,
  MapPin,
  Send,
  User,
  X,
} from 'lucide-react';
import {
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const API_URL = String(
  import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    'http://localhost:8000/api'
).replace(/\/+$/, '');

const obtenerTokenAutenticacion = () => {
  const almacenamientos = [
    window.localStorage,
    window.sessionStorage,
  ];

  const clavesDirectas = [
    'token',
    'access_token',
    'accessToken',
    'authToken',
    'jwt',
    'jwtToken',
  ];

  for (const almacenamiento of almacenamientos) {
    for (const clave of clavesDirectas) {
      const valor =
        almacenamiento.getItem(clave);

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
      const valor =
        almacenamiento.getItem(clave);

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
          objeto?.jwtToken ||
          objeto?.user?.token ||
          objeto?.user?.access_token;

        if (token) {
          return String(token);
        }
      } catch {
        // La clave no contiene JSON válido.
      }
    }
  }

  return null;
};

const obtenerUsuarioSesion = () => {
  const almacenamientos = [
    window.localStorage,
    window.sessionStorage,
  ];

  const clavesObjetos = [
    'user',
    'userData',
    'auth',
    'authData',
    'session',
  ];

  for (const almacenamiento of almacenamientos) {
    for (const clave of clavesObjetos) {
      const valor =
        almacenamiento.getItem(clave);

      if (!valor) {
        continue;
      }

      try {
        const objeto = JSON.parse(valor);

        return (
          objeto?.username ||
          objeto?.usuario ||
          objeto?.Usuario ||
          objeto?.NombreUsuario ||
          objeto?.user?.username ||
          objeto?.user?.usuario ||
          'operaciones'
        );
      } catch {
        // Continuar buscando.
      }
    }
  }

  return 'operaciones';
};

const construirHeaders = (
  incluirContenido = false
) => {
  const token =
    obtenerTokenAutenticacion();

  const headers = {
    Accept: 'application/json',
  };

  if (incluirContenido) {
    headers['Content-Type'] =
      'application/json';
  }

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  return headers;
};

const obtenerMensajeError = async (
  response,
  mensajePredeterminado
) => {
  try {
    const data = await response.json();

    if (
      typeof data?.detail === 'string'
    ) {
      return data.detail;
    }

    if (
      typeof data?.detail?.mensaje ===
      'string'
    ) {
      return data.detail.mensaje;
    }

    if (
      typeof data?.mensaje === 'string'
    ) {
      return data.mensaje;
    }
  } catch {
    // La respuesta no contenía JSON.
  }

  return (
    `${mensajePredeterminado} ` +
    `(HTTP ${response.status}).`
  );
};

const normalizarHora = (valor) => {
  if (!valor) {
    return '—';
  }

  return String(valor).slice(0, 5);
};

const formatearFecha = (valor) => {
  if (!valor) {
    return '—';
  }

  const partes =
    String(valor).split('-');

  if (partes.length !== 3) {
    return valor;
  }

  return (
    `${partes[2]}/` +
    `${partes[1]}/` +
    `${partes[0]}`
  );
};

const formatearTipoFalta = (valor) => {
  const textos = {
    INCUMPLIMIENTO_FUNCIONES:
      'Incumplimiento de funciones',
    AUSENCIA_INJUSTIFICADA:
      'Ausencia injustificada',
    RETARDO_INJUSTIFICADO:
      'Retardo injustificado',
    DESOBEDIENCIA:
      'Desobediencia de instrucciones',
    COMPORTAMIENTO_INADECUADO:
      'Comportamiento inadecuado',
    INCUMPLIMIENTO_REGLAMENTO:
      'Incumplimiento del reglamento',
    OTRO: 'Otro',
  };

  return (
    textos[String(valor || '').trim()] ||
    String(valor || '—')
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(
        /^./,
        (letra) => letra.toUpperCase()
      )
  );
};

const obtenerNombreTrabajador = (
  trabajador
) =>
  [
    trabajador?.PrimerNombre,
    trabajador?.SegundoNombre,
    trabajador?.PrimerApellido,
    trabajador?.SegundoApellido,
  ]
    .filter(Boolean)
    .join(' ')
    .trim() ||
  trabajador?.NombreCompleto ||
  trabajador?.nombreCompleto ||
  trabajador?.Nombre ||
  trabajador?.nombre ||
  'Trabajador sin nombre';

const obtenerDocumentoTrabajador = (
  trabajador
) =>
  trabajador?.NumeroIdentificacion ||
  trabajador?.numeroIdentificacion ||
  trabajador?.Identificacion ||
  trabajador?.identificacion ||
  trabajador?.Documento ||
  trabajador?.documento ||
  '—';

const obtenerCargoTrabajador = (
  trabajador
) =>
  trabajador?.CargoNombre ||
  trabajador?.Cargo ||
  trabajador?.cargo ||
  trabajador?.NombreCargo ||
  trabajador?.nombreCargo ||
  '—';

const TarjetaDato = ({
  titulo,
  valor,
  icono: Icono,
}) => (
  <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-4">
    <div className="flex items-start gap-3">
      {Icono && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <Icono className="h-4 w-4" />
        </div>
      )}

      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {titulo}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-gray-800">
          {valor || '—'}
        </p>
      </div>
    </div>
  </div>
);

const RevisionProcesoOperacionesView =
  () => {
    const navigate = useNavigate();
    const location = useLocation();

    const trabajador =
      location.state?.trabajador;

    const idProcesoDisciplinario =
      Number(
        location.state
          ?.idProcesoDisciplinario ||
          0
      );

    const idRegistroPersonal =
      Number(
        location.state
          ?.idRegistroPersonal ||
          trabajador?.IdRegistroPersonal ||
          0
      );

    const [
      citacion,
      setCitacion,
    ] = useState(null);

    const [
      evidencias,
      setEvidencias,
    ] = useState([]);

    const [
      cargando,
      setCargando,
    ] = useState(true);

    const [
      guardando,
      setGuardando,
    ] = useState(false);

    const [
      modalEnvioAbierto,
      setModalEnvioAbierto,
    ] = useState(false);

    const [
      modalExitoAbierto,
      setModalExitoAbierto,
    ] = useState(false);

    const [
      resultadoEnvio,
      setResultadoEnvio,
    ] = useState(null);

    const nombreTrabajador =
      useMemo(
        () =>
          obtenerNombreTrabajador(
            trabajador
          ),
        [trabajador]
      );

    const consultarCitacion =
      async () => {
        const response = await fetch(
          `${API_URL}/citacion-proceso-disciplinario/proceso/${idProcesoDisciplinario}`,
          {
            method: 'GET',
            headers:
              construirHeaders(),
          }
        );

        if (!response.ok) {
          const mensaje =
            await obtenerMensajeError(
              response,
              'No se pudo consultar la citación'
            );

          throw new Error(mensaje);
        }

        return response.json();
      };

    const consultarEvidencias =
      async () => {
        const response = await fetch(
          `${API_URL}/documento-proceso-disciplinario/proceso/${idProcesoDisciplinario}`,
          {
            method: 'GET',
            headers:
              construirHeaders(),
          }
        );

        if (!response.ok) {
          const mensaje =
            await obtenerMensajeError(
              response,
              'No se pudieron consultar las evidencias'
            );

          throw new Error(mensaje);
        }

        const data = await response.json();

        return Array.isArray(data)
          ? data
          : [];
      };

    useEffect(() => {
      const cargarInformacion =
        async () => {
          if (
            !idProcesoDisciplinario
          ) {
            setCargando(false);
            return;
          }

          try {
            setCargando(true);

            const [
              dataCitacion,
              dataEvidencias,
            ] = await Promise.all([
              consultarCitacion(),
              consultarEvidencias(),
            ]);

            setCitacion(
              dataCitacion
            );

            setEvidencias(
              dataEvidencias
            );
          } catch (error) {
            console.error(
              'Error cargando Paso 3:',
              error
            );

            toast({
              title:
                'No se pudo cargar la revisión',
              description:
                error?.message ||
                'Ocurrió un error consultando la información del proceso.',
              variant: 'destructive',
            });
          } finally {
            setCargando(false);
          }
        };

      cargarInformacion();

      // La consulta depende del proceso recibido.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idProcesoDisciplinario]);

    const handleVolver = () => {
      navigate(
        '/operaciones/procesos-disciplinarios/iniciar',
        {
          state: {
            trabajador,
            idRegistroPersonal,
          },
        }
      );
    };

    const abrirModalEnvio = () => {
      if (guardando) {
        return;
      }

      setModalEnvioAbierto(true);
    };

    const cerrarModalEnvio = () => {
      if (guardando) {
        return;
      }

      setModalEnvioAbierto(false);
    };

    const cerrarModalExito = () => {
      setModalExitoAbierto(false);

      navigate(
        '/operaciones/procesos-disciplinarios',
        {
          replace: true,
          state: {
            procesoEnviado: true,
            idProcesoDisciplinario,
          },
        }
      );
    };

    useEffect(() => {
      if (!modalExitoAbierto) {
        return undefined;
      }

      const temporizador = window.setTimeout(
        () => {
          cerrarModalExito();
        },
        40000
      );

      return () => {
        window.clearTimeout(temporizador);
      };
      // El cierre automático depende únicamente del modal.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modalExitoAbierto]);

    const enviarProcesoARRLL =
      async () => {
        try {
          setGuardando(true);

          const usuario =
            obtenerUsuarioSesion();

          const response = await fetch(
            `${API_URL}/procesos-disciplinarios/${idProcesoDisciplinario}/enviar-rrll`,
            {
              method: 'POST',
              headers:
                construirHeaders(true),
              body: JSON.stringify({
                UsuarioActualizacion:
                  usuario,
              }),
            }
          );

          if (!response.ok) {
            const mensaje =
              await obtenerMensajeError(
                response,
                'No se pudo enviar el proceso a Relaciones Laborales'
              );

            throw new Error(mensaje);
          }

          const resultado =
            await response.json();

          setModalEnvioAbierto(false);

          setResultadoEnvio({
            mensaje:
              resultado?.mensaje ||
              'El proceso disciplinario fue enviado a Relaciones Laborales.',
            fecha:
              resultado?.FechaEvento ||
              citacion?.FechaCitacion ||
              null,
            horaInicio:
              resultado?.HoraInicio ||
              citacion?.HoraCitacion ||
              null,
            horaFin:
              resultado?.HoraFin ||
              null,
          });

          setModalExitoAbierto(true);
        } catch (error) {
          console.error(
            'Error enviando proceso a RRLL:',
            error
          );

          toast({
            title:
              'No se pudo enviar el proceso',
            description:
              error?.message ||
              'Ocurrió un error enviando el proceso a Relaciones Laborales.',
            variant: 'destructive',
          });
        } finally {
          setGuardando(false);
        }
      };

    const obtenerIdDocumento = (
        documento
        ) => {
        const idDocumento =
            documento
            ?.IdDocumentoProcesoDisciplinario;

        if (!idDocumento) {
            throw new Error(
            'El documento no tiene un identificador válido.'
            );
        }

        return idDocumento;
        };

        const obtenerUrlVisualizar = (
        documento
        ) => {
        const idDocumento =
            obtenerIdDocumento(
            documento
            );

        return (
            documento?.UrlVisualizar ||
            documento?.UrlArchivo ||
            `${API_URL}/documento-proceso-disciplinario/${idDocumento}/archivo`
        );
        };

        const obtenerUrlDescargar = (
        documento
        ) => {
        const idDocumento =
            obtenerIdDocumento(
            documento
            );

        return (
            documento?.UrlDescargar ||
            `${API_URL}/documento-proceso-disciplinario/${idDocumento}/descargar`
        );
        };

        const abrirDocumento = (
    documento
    ) => {
    try {
        const url =
        obtenerUrlVisualizar(
            documento
        );

        const nuevaVentana =
        window.open(
            url,
            '_blank'
        );

        if (nuevaVentana) {
        nuevaVentana.opener = null;
        }
    } catch (error) {
        console.error(
        'Error visualizando documento:',
        error
        );

        toast({
        title:
            'No se pudo visualizar el documento',
        description:
            error?.message ||
            'Ocurrió un error abriendo el archivo.',
        variant: 'destructive',
        });
    }
    };

    const descargarDocumento = (
      documento
    ) => {
      try {
        const url =
          obtenerUrlDescargar(
            documento
          );

        const enlace =
          document.createElement('a');

        enlace.href = url;
        enlace.target = '_self';
        enlace.rel = 'noopener';

        document.body.appendChild(
          enlace
        );

        enlace.click();
        enlace.remove();
      } catch (error) {
        console.error(
          'Error descargando documento:',
          error
        );

        toast({
          title:
            'No se pudo descargar el documento',
          description:
            error?.message ||
            'Ocurrió un error descargando el archivo.',
          variant: 'destructive',
        });
      }
    };

    if (
      !trabajador ||
      !idRegistroPersonal ||
      !idProcesoDisciplinario
    ) {
      return (
        <section className="w-full rounded-2xl border-t-4 border-emerald-600 bg-white p-6 shadow-xl">
          <div className="py-12 text-center">
            <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />

            <h1 className="mt-4 text-xl font-bold text-gray-800">
              No fue posible abrir la revisión
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Regresa al Paso 2 y continúa nuevamente para conservar el trabajador y el proceso seleccionados.
            </p>

            <Button
              type="button"
              onClick={() =>
                navigate(
                  '/operaciones/procesos-disciplinarios'
                )
              }
              className="mt-6 min-h-11 rounded-xl bg-emerald-600 px-5 font-semibold hover:bg-emerald-700"
            >
              Volver al buscador
            </Button>
          </div>
        </section>
      );
    }

    if (cargando) {
      return (
        <section className="w-full rounded-2xl border-t-4 border-emerald-600 bg-white p-6 shadow-xl">
          <div className="flex min-h-[320px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-9 w-9 animate-spin text-emerald-600" />

              <p className="mt-4 text-sm font-medium text-gray-600">
                Cargando la revisión del proceso...
              </p>
            </div>
          </div>
        </section>
      );
    }

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
          <Button
            type="button"
            variant="ghost"
            onClick={handleVolver}
            disabled={guardando}
            className="mb-5 min-h-11 rounded-xl px-3 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Volver al Paso 2
          </Button>

          <div className="flex min-w-0 items-start gap-3 sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-200">
              <ClipboardList className="h-6 w-6 text-white" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-blue-700">
                Paso 3 de 3
              </p>

              <h1 className="break-words text-xl font-bold text-gray-800 sm:text-2xl">
                Revisión y envío a Relaciones Laborales
              </h1>

              <p className="mt-1 break-words text-sm leading-relaxed text-gray-500">
                Verifica la información registrada y confirma el envío definitivo a Relaciones Laborales.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[
              'Trabajador',
              'Citación',
              'Revisión y envío',
            ].map(
              (paso, index) => (
                <div
                  key={paso}
                  className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-center text-emerald-800"
                >
                  <p className="text-xs font-semibold">
                    Paso {index + 1}
                  </p>

                  <p className="break-words text-sm font-bold">
                    {paso}
                  </p>
                </div>
              )
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

              <div>
                <h2 className="font-bold text-blue-900">
                  Revisión previa al envío
                </h2>

                <p className="mt-1 text-sm leading-relaxed text-blue-800">
                  Revise cuidadosamente la citación, los hechos y las evidencias. Al confirmar, el proceso será enviado a Relaciones Laborales y se creará automáticamente el evento en la Agenda Disciplinaria.
                </p>
              </div>
            </div>
          </div>

          <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-6">
            <h2 className="text-lg font-bold text-emerald-900">
              Trabajador seleccionado
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <TarjetaDato
                titulo="Nombre"
                valor={nombreTrabajador}
                icono={User}
              />

              <TarjetaDato
                titulo="Documento"
                valor={obtenerDocumentoTrabajador(
                  trabajador
                )}
                icono={FileText}
              />

              <TarjetaDato
                titulo="Cargo"
                valor={obtenerCargoTrabajador(
                  trabajador
                )}
                icono={ClipboardList}
              />

              <TarjetaDato
                titulo="Proceso"
                valor={`#${idProcesoDisciplinario}`}
                icono={ClipboardList}
              />
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-gray-800">
              Programación de la citación
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <TarjetaDato
                titulo="Fecha"
                valor={formatearFecha(
                  citacion?.FechaCitacion
                )}
                icono={CalendarDays}
              />

              <TarjetaDato
                titulo="Hora"
                valor={normalizarHora(
                  citacion?.HoraCitacion
                )}
                icono={Clock3}
              />

              <TarjetaDato
                titulo="Modalidad"
                valor={
                  citacion?.Modalidad ||
                  '—'
                }
                icono={ClipboardList}
              />

              <TarjetaDato
                titulo="Lugar o enlace"
                valor={
                  citacion?.LugarCitacion ||
                  '—'
                }
                icono={MapPin}
              />

              <TarjetaDato
                titulo="Gestor(a) que reporta"
                valor={
                  citacion?.SupervisorReporta ||
                  '—'
                }
                icono={User}
              />

              <TarjetaDato
                titulo="Cliente"
                valor={
                  citacion?.Cliente ||
                  '—'
                }
                icono={ClipboardList}
              />

            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-gray-800">
              Hechos del caso
            </h2>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Tipo de falta disciplinaria
                </p>

                <p className="mt-2 break-words text-sm font-semibold text-gray-800">
                  {formatearTipoFalta(
                    citacion?.MotivoCitacion
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Relato de los hechos
                </p>

                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-800">
                  {citacion?.RelatoHechos ||
                    '—'}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Observaciones gestor(a)
                </p>

                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-800">
                  {citacion
                    ?.ObservacionOperaciones ||
                    'Sin observaciones adicionales.'}
                </p>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-purple-200 bg-purple-50 p-4 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-purple-900">
                  Evidencias aportadas
                </h2>

                <p className="mt-1 text-sm text-purple-800">
                  Se encontraron {evidencias.length} archivo(s) asociados al proceso.
                </p>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-purple-200 bg-white">
              {evidencias.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-gray-500">
                  No existen evidencias guardadas para este proceso.
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {evidencias.map(
                    (documento) => (
                      <div
                        key={
                          documento
                            .IdDocumentoProcesoDisciplinario
                        }
                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="break-words text-sm font-semibold text-gray-800">
                            {documento
                              .NombreArchivo ||
                              'Documento sin nombre'}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            Evidencia de Operaciones
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              abrirDocumento(
                                documento
                              )
                            }
                            className="min-h-10 rounded-lg border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              descargarDocumento(
                                documento
                              )
                            }
                            className="min-h-10 rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Descargar
                          </Button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </section>

          <div className="mt-6 flex flex-col gap-3 border-t border-gray-200 pt-6 lg:flex-row lg:items-center lg:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleVolver}
              disabled={guardando}
              className="min-h-11 w-full rounded-xl border-gray-300 font-semibold text-gray-700 lg:w-auto"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Volver al Paso 2
            </Button>

            <Button
              type="button"
              onClick={abrirModalEnvio}
              disabled={guardando}
              className="min-h-11 w-full rounded-xl bg-emerald-600 px-5 font-semibold text-white shadow-md hover:bg-emerald-700 lg:w-auto"
            >
              {guardando ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Enviar a Relaciones Laborales
                </>
              )}
            </Button>
          </div>
        </section>

        {modalEnvioAbierto && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-envio-rrll"
            onMouseDown={(event) => {
              if (
                event.target ===
                  event.currentTarget &&
                !guardando
              ) {
                cerrarModalEnvio();
              }
            }}
          >
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
                <h2
                  id="titulo-envio-rrll"
                  className="text-xl font-bold text-gray-900"
                >
                  Enviar proceso a Relaciones Laborales
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Confirma el envío definitivo del proceso disciplinario.
                </p>
              </div>

              <div className="space-y-4 px-5 py-5 sm:px-6">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-900">
                    ¿Deseas enviar este proceso a Relaciones Laborales?
                  </p>

                  <p className="mt-2 text-sm leading-relaxed text-emerald-800">
                    Se validará nuevamente la fecha y la disponibilidad del horario. Si todo está correcto, el sistema creará el evento en la Agenda Disciplinaria.
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-800">
                    Después del envío:
                  </p>

                  <div className="mt-3 space-y-2 text-sm leading-relaxed text-gray-600">
                    <p>El proceso dejará de estar disponible para edición desde Operaciones.</p>
                    <p>El caso quedará visible para Relaciones Laborales.</p>
                    <p>La citación quedará reservada en la fecha y hora seleccionadas.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={cerrarModalEnvio}
                  disabled={guardando}
                  className="min-h-11 w-full rounded-xl border-gray-300 px-5 font-semibold text-gray-700 sm:w-auto"
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  onClick={enviarProcesoARRLL}
                  disabled={guardando}
                  className="min-h-11 w-full rounded-xl bg-emerald-600 px-5 font-semibold text-white hover:bg-emerald-700 sm:w-auto"
                >
                  {guardando ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Enviar a RRLL
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {modalExitoAbierto && (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-envio-exitoso"
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.96,
                y: 16,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              className="w-full max-w-xl overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-2xl"
            >
              <div className="relative bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-6 text-white sm:px-8">
                <button
                  type="button"
                  onClick={cerrarModalExito}
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                  aria-label="Cerrar mensaje de envío exitoso"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="flex items-start gap-4 pr-10">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-emerald-50">
                      Envío exitoso
                    </p>

                    <h2
                      id="titulo-envio-exitoso"
                      className="mt-1 text-2xl font-bold"
                    >
                      Proceso enviado correctamente
                    </h2>
                  </div>
                </div>
              </div>

              <div className="space-y-5 px-6 py-6 sm:px-8">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-base font-semibold text-emerald-900">
                    El proceso disciplinario fue enviado a Relaciones Laborales.
                  </p>

                  <p className="mt-2 text-sm leading-relaxed text-emerald-800">
                    La citación quedó reservada y el caso ya se encuentra disponible en la Agenda Disciplinaria.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <TarjetaDato
                    titulo="Trabajador"
                    valor={nombreTrabajador}
                    icono={User}
                  />

                  <TarjetaDato
                    titulo="Proceso"
                    valor={`#${idProcesoDisciplinario}`}
                    icono={ClipboardList}
                  />

                  <TarjetaDato
                    titulo="Fecha"
                    valor={formatearFecha(
                      resultadoEnvio?.fecha
                    )}
                    icono={CalendarDays}
                  />

                  <TarjetaDato
                    titulo="Hora"
                    valor={
                      resultadoEnvio?.horaFin
                        ? `${normalizarHora(
                            resultadoEnvio?.horaInicio
                          )} - ${normalizarHora(
                            resultadoEnvio?.horaFin
                          )}`
                        : normalizarHora(
                            resultadoEnvio?.horaInicio
                          )
                    }
                    icono={Clock3}
                  />
                </div>

                <p className="text-center text-sm leading-relaxed text-gray-600">
                  Ahora el caso continuará su gestión desde Relaciones Laborales.
                </p>

                <div className="rounded-xl bg-gray-50 px-4 py-3 text-center text-xs text-gray-500">
                  Este mensaje se cerrará automáticamente en 40 segundos.
                </div>
              </div>

              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 sm:px-8">
                <Button
                  type="button"
                  onClick={cerrarModalExito}
                  className="min-h-12 w-full rounded-xl bg-emerald-600 px-6 font-semibold text-white shadow-md hover:bg-emerald-700"
                >
                  Aceptar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    );
  };

export default RevisionProcesoOperacionesView;