import React, {
  useEffect,
  useRef,
  useState,
} from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Loader2,
  Save,
} from 'lucide-react';
import {
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { formatearExpedienteDisciplinario } from '@/utils/formatearExpedienteDisciplinario';

import TrabajadorSeleccionadoCard from '@/components/operaciones/TrabajadorSeleccionadoCard';
import ProgramacionCitacionCard from '@/components/operaciones/ProgramacionCitacionCard';
import HechosCasoCard from '@/components/operaciones/HechosCasoCard';
import EvidenciasProcesoCard from '@/components/operaciones/EvidenciasProcesoCard';

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

const construirHeadersArchivo = () => {
  const token =
    obtenerTokenAutenticacion();

  const headers = {
    Accept: 'application/json',
  };

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


const normalizarTextoDuplicado = (valor) => {
  const texto = String(valor || '').trim();

  if (!texto) {
    return '';
  }

  const longitud = texto.length;

  if (longitud % 2 === 0) {
    const mitad = longitud / 2;
    const primeraParte = texto.slice(0, mitad);
    const segundaParte = texto.slice(mitad);

    if (
      primeraParte.toLocaleLowerCase() ===
      segundaParte.toLocaleLowerCase()
    ) {
      return primeraParte.trim();
    }
  }

  return texto;
};

const normalizarHoraBackend = (
  valor
) => {
  if (!valor) {
    return '';
  }

  return String(valor).slice(0, 5);
};

const IniciarProcesoOperacionesView =
  () => {
    const navigate = useNavigate();
    const location = useLocation();
    const eliminacionEnCursoRef =
      useRef(false);

    const trabajador =
      location.state?.trabajador;

      console.log('===== TRABAJADOR PASO 2 =====');
      console.log(trabajador);
      console.log('FechaIngreso =>', trabajador?.FechaIngreso);
      console.log('=============================');

    const idRegistroPersonal =
      Number(
        location.state
          ?.idRegistroPersonal ||
          trabajador?.IdRegistroPersonal ||
          0
      );

    const obtenerClienteInicial = () =>
      trabajador?.ClienteNombre ||
      trabajador?.Cliente ||
      trabajador?.clienteNombre ||
      trabajador?.nombreCliente ||
      trabajador?.NombreCliente ||
      '';

    const obtenerSedeInicial = () =>
      trabajador?.Sede ||
      trabajador?.sede ||
      trabajador?.NombreSede ||
      trabajador?.nombreSede ||
      '';

    const obtenerSupervisorInicial =
      () =>
        trabajador?.Supervisor ||
        trabajador?.supervisor ||
        trabajador?.NombreSupervisor ||
        trabajador?.nombreSupervisor ||
        '';

    const obtenerTelefonoInicial = () =>
      String(
        trabajador?.Celular ||
        trabajador?.celular ||
        trabajador?.NumeroWhatsapp ||
        trabajador?.numeroWhatsapp ||
        trabajador?.Telefono ||
        trabajador?.telefono ||
        ''
      ).trim();

    const [
      formData,
      setFormData,
    ] = useState({
      fechaCitacion: '',
      horaCitacion: '',
      esExtraordinaria: false,
      fechaCitacionExtraordinaria: '',
      horaCitacionExtraordinaria: '',
      motivoExtraordinario: '',
      justificacionExtraordinaria: '',
      modalidad: '',
      lugarCitacion: '',
      supervisorReporta:
        obtenerSupervisorInicial(),
      correoSupervisorReporta: '',
      telefonoTrabajador:
        obtenerTelefonoInicial(),
      cliente:
        obtenerClienteInicial(),
      sede: obtenerSedeInicial(),
      tipoGestion: '',
      tipoFalta: '',
      fechaUltimoDiaLaborado: '',
      fechaInicioAusencia: '',
      fechaFinAusencia: '',
      relatoHechos: '',
      observacionesAdicionales: '',
      desempenoContinua: '',
      justificacionDesempeno: '',
    });

    const [
      evidencias,
      setEvidencias,
    ] = useState([]);

    const [
      idProcesoDisciplinario,
      setIdProcesoDisciplinario,
    ] = useState(null);

    const [
      idCitacionProcesoDisciplinario,
      setIdCitacionProcesoDisciplinario,
    ] = useState(null);

    const [
      cargandoBorrador,
      setCargandoBorrador,
    ] = useState(false);

    const [
      guardando,
      setGuardando,
    ] = useState(false);

    const [
      modalMaximoProcesosAbierto,
      setModalMaximoProcesosAbierto,
    ] = useState(false);

    const [
      mensajeMaximoProcesos,
      setMensajeMaximoProcesos,
    ] = useState('');

    const [
      borradorConsultado,
      setBorradorConsultado,
    ] = useState(false);


    const [
      evidenciaSeleccionada,
      setEvidenciaSeleccionada,
    ] = useState(null);

    const [
      eliminandoEvidencia,
      setEliminandoEvidencia,
    ] = useState(false);

    const [
      configuracionCitacion,
      setConfiguracionCitacion,
    ] = useState(null);

    const [
      horariosDisponibles,
      setHorariosDisponibles,
    ] = useState([]);

    const [
      cargandoConfiguracion,
      setCargandoConfiguracion,
    ] = useState(true);

    const [
      cargandoHorarios,
      setCargandoHorarios,
    ] = useState(false);

    const [
      errorProgramacion,
      setErrorProgramacion,
    ] = useState('');

    const [
      configuracionExtraordinaria,
      setConfiguracionExtraordinaria,
    ] = useState(null);

    const [
      horariosExtraordinarios,
      setHorariosExtraordinarios,
    ] = useState([]);

    const [
      cargandoConfiguracionExtraordinaria,
      setCargandoConfiguracionExtraordinaria,
    ] = useState(false);

    const [
      cargandoHorariosExtraordinarios,
      setCargandoHorariosExtraordinarios,
    ] = useState(false);

    const [
      errorProgramacionExtraordinaria,
      setErrorProgramacionExtraordinaria,
    ] = useState('');

    const handleChange = (event) => {
      const {
        name,
        value,
      } = event.target;

      if (name === 'fechaCitacion') {
        setFormData((prev) => ({
          ...prev,
          fechaCitacion: value,
          horaCitacion: '',
        }));

        setHorariosDisponibles([]);
        setErrorProgramacion('');
        return;
      }

      if (name === 'esExtraordinaria') {
        const activar = Boolean(value);
        setFormData((prev) => ({
          ...prev,
          esExtraordinaria: activar,
          fechaCitacion: activar ? '' : prev.fechaCitacion,
          horaCitacion: activar ? '' : prev.horaCitacion,
          fechaCitacionExtraordinaria: activar
            ? prev.fechaCitacionExtraordinaria
            : '',
          horaCitacionExtraordinaria: activar
            ? prev.horaCitacionExtraordinaria
            : '',
          motivoExtraordinario: activar ? prev.motivoExtraordinario : '',
          justificacionExtraordinaria: activar
            ? prev.justificacionExtraordinaria
            : '',
        }));
        setHorariosDisponibles([]);
        setHorariosExtraordinarios([]);
        setErrorProgramacion('');
        setErrorProgramacionExtraordinaria('');
        return;
      }

      if (name === 'fechaCitacionExtraordinaria') {
        setFormData((prev) => ({
          ...prev,
          fechaCitacionExtraordinaria: value,
          horaCitacionExtraordinaria: '',
        }));
        setHorariosExtraordinarios([]);
        setErrorProgramacionExtraordinaria('');
        return;
      }

      setFormData((prev) => ({
        ...prev,
        [name]: value,
        ...(name === 'modalidad'
          ? {
              lugarCitacion: '',
            }
          : {}),
        ...(name === 'tipoFalta' &&
        value !== 'AUSENCIA_INJUSTIFICADA'
          ? {
              fechaUltimoDiaLaborado: '',
              fechaInicioAusencia: '',
              fechaFinAusencia: '',
            }
          : {}),
      }));
    };

    const consultarConfiguracionCitacion =
      async () => {
        try {
          setCargandoConfiguracion(true);

          const response = await fetch(
            `${API_URL}/agenda-disciplinaria/configuracion-citacion`,
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
                'No se pudo consultar la configuración de la citación'
              );

            throw new Error(mensaje);
          }

          const configuracion =
            await response.json();

          setConfiguracionCitacion(
            configuracion
          );
        } catch (error) {
          console.error(
            'Error consultando configuración de citación:',
            error
          );

          setErrorProgramacion(
            error?.message ||
              'No fue posible consultar la fecha mínima permitida.'
          );

          toast({
            title:
              'No se pudo cargar la programación',
            description:
              error?.message ||
              'No fue posible consultar la configuración de la agenda.',
            variant: 'destructive',
          });
        } finally {
          setCargandoConfiguracion(false);
        }
      };

    const consultarHorariosDisponibles =
      async (fechaCitacion) => {
        if (!fechaCitacion) {
          setHorariosDisponibles([]);
          setErrorProgramacion('');
          return;
        }

        try {
          setCargandoHorarios(true);
          setErrorProgramacion('');

          const partesFecha = String(
            fechaCitacion
          )
            .split('-')
            .map(Number);

          const esViernes =
            partesFecha.length === 3 &&
            !partesFecha.some((parte) =>
              Number.isNaN(parte)
            ) &&
            new Date(
              partesFecha[0],
              partesFecha[1] - 1,
              partesFecha[2]
            ).getDay() === 5;

          let horarios = [];

          if (esViernes) {
            const responseHistorial =
              await fetch(
                `${API_URL}/procesos-disciplinarios/trabajador/${idRegistroPersonal}/historial`,
                {
                  method: 'GET',
                  headers:
                    construirHeaders(),
                }
              );

            if (!responseHistorial.ok) {
              const mensaje =
                await obtenerMensajeError(
                  responseHistorial,
                  'No se pudo validar la autorización del viernes'
                );

              throw new Error(mensaje);
            }

            const historial =
              await responseHistorial.json();

            const procesos = Array.isArray(
              historial
            )
              ? historial
              : [];

            const autorizacion =
              procesos.find((proceso) => {
                const fechaAutorizada =
                  String(
                    proceso
                      ?.FechaAutorizadaViernes ||
                    proceso
                      ?.FechaSolicitadaViernes ||
                    ''
                  ).slice(0, 10);

                const estadoSolicitud =
                  String(
                    proceso
                      ?.EstadoSolicitudViernes ||
                    ''
                  )
                    .trim()
                    .toUpperCase();

                const estadoAutorizacion =
                  String(
                    proceso
                      ?.EstadoAutorizacionViernes ||
                    ''
                  )
                    .trim()
                    .toUpperCase();

                return (
                  fechaAutorizada ===
                    fechaCitacion &&
                  proceso
                    ?.AutorizacionViernesDisponible ===
                    true &&
                  estadoSolicitud ===
                    'APROBADA' &&
                  estadoAutorizacion ===
                    'ACTIVA' &&
                  proceso
                    ?.HoraInicioAutorizadaViernes &&
                  proceso
                    ?.HoraFinAutorizadaViernes
                );
              });

            if (autorizacion) {
              const horaInicio =
                normalizarHoraBackend(
                  autorizacion
                    .HoraInicioAutorizadaViernes
                );

              const horaFin =
                normalizarHoraBackend(
                  autorizacion
                    .HoraFinAutorizadaViernes
                );

              horarios = [
                {
                  HoraInicio: horaInicio,
                  HoraFin: horaFin,
                  Etiqueta:
                    `${horaInicio} - ${horaFin}`,
                  EsAutorizacionViernes: true,
                  IdAutorizacionAgendaDisciplinaria:
                    autorizacion
                      .IdAutorizacionAgendaDisciplinaria ||
                    null,
                  IdProcesoAutorizado:
                    autorizacion
                      .IdProcesoDisciplinario ||
                    null,
                },
              ];
            } else {
              setHorariosDisponibles([]);
              setFormData((prev) => ({
                ...prev,
                horaCitacion: '',
              }));

              let procesoId =
                idProcesoDisciplinario;

              if (!procesoId) {
                const proceso =
                  await crearProcesoBorrador(
                    'BORRADOR_OPERACIONES'
                  );

                procesoId =
                  proceso
                    ?.IdProcesoDisciplinario ||
                  null;
              }

              if (!procesoId) {
                throw new Error(
                  'No fue posible crear o recuperar el expediente disciplinario para solicitar la autorización.'
                );
              }

              const parametrosPendiente =
                new URLSearchParams({
                  id_proceso_disciplinario:
                    String(procesoId),
                  fecha_solicitada:
                    fechaCitacion,
                });

              const responsePendiente =
                await fetch(
                  `${API_URL}/solicitudes-autorizacion-agenda-disciplinaria/trabajador/${idRegistroPersonal}/pendiente?${parametrosPendiente.toString()}`,
                  {
                    method: 'GET',
                    headers:
                      construirHeaders(),
                  }
                );

              if (!responsePendiente.ok) {
                const mensaje =
                  await obtenerMensajeError(
                    responsePendiente,
                    'No fue posible validar si ya existe una solicitud pendiente'
                  );

                throw new Error(mensaje);
              }

              const solicitudPendiente =
                await responsePendiente.json();

              if (
                solicitudPendiente
                  ?.IdSolicitudAutorizacion
              ) {
                setErrorProgramacion(
                  'La solicitud para este viernes ya fue enviada a Relaciones Laborales y está pendiente de aprobación.'
                );
                return;
              }

              const usuario =
                obtenerUsuarioSesion();

              const responseSolicitud =
                await fetch(
                  `${API_URL}/solicitudes-autorizacion-agenda-disciplinaria/`,
                  {
                    method: 'POST',
                    headers:
                      construirHeaders(true),
                    body: JSON.stringify({
                      IdRegistroPersonal:
                        idRegistroPersonal,
                      IdProcesoDisciplinario:
                        procesoId,
                      FechaSolicitada:
                        fechaCitacion,
                      MotivoSolicitud:
                        'Solicitud automática enviada desde Operaciones para programar una citación disciplinaria en viernes.',
                      UsuarioSolicita:
                        usuario,
                    }),
                  }
                );

              if (!responseSolicitud.ok) {
                const mensaje =
                  await obtenerMensajeError(
                    responseSolicitud,
                    'No fue posible enviar la solicitud de autorización a Relaciones Laborales'
                  );

                throw new Error(mensaje);
              }

              await responseSolicitud.json();

              setErrorProgramacion(
                'Solicitud enviada a Relaciones Laborales. Está pendiente de aprobación.'
              );

              toast({
                title:
                  'Solicitud enviada',
                description:
                  'Relaciones Laborales recibió la solicitud para autorizar la citación del viernes.',
              });

              return;
            }
          } else {
            const response = await fetch(
              `${API_URL}/agenda-disciplinaria/horarios-disponibles/${fechaCitacion}`,
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
                  'La fecha seleccionada no está disponible'
                );

              throw new Error(mensaje);
            }

            const resultado =
              await response.json();

            horarios = Array.isArray(
              resultado?.horarios
            )
              ? resultado.horarios
              : [];
          }

          setHorariosDisponibles(
            horarios
          );

          if (horarios.length === 0) {
            setFormData((prev) => ({
              ...prev,
              horaCitacion: '',
            }));
            setErrorProgramacion(
              'La fecha seleccionada ya no tiene horarios disponibles.'
            );
            return;
          }

          setFormData((prev) => {
            if (!prev.horaCitacion) {
              return prev;
            }

            const horaSigueDisponible =
              horarios.some(
                (horario) =>
                  horario.HoraInicio ===
                  prev.horaCitacion
              );

            if (horaSigueDisponible) {
              return prev;
            }

            return {
              ...prev,
              horaCitacion: '',
            };
          });
        } catch (error) {
          console.error(
            'Error consultando horarios disponibles:',
            error
          );

          setHorariosDisponibles([]);
          setFormData((prev) => ({
            ...prev,
            horaCitacion: '',
          }));
          setErrorProgramacion(
            error?.message ||
              'No fue posible consultar los horarios disponibles.'
          );
        } finally {
          setCargandoHorarios(false);
        }
      };

    const consultarConfiguracionExtraordinaria = async () => {
      try {
        setCargandoConfiguracionExtraordinaria(true);
        setErrorProgramacionExtraordinaria('');
        const response = await fetch(
          `${API_URL}/agenda-disciplinaria/configuracion-citacion-extraordinaria`,
          { method: 'GET', headers: construirHeaders() }
        );
        if (!response.ok) {
          throw new Error(
            await obtenerMensajeError(
              response,
              'No se pudo consultar la configuración extraordinaria'
            )
          );
        }
        setConfiguracionExtraordinaria(await response.json());
      } catch (error) {
        setConfiguracionExtraordinaria(null);
        setErrorProgramacionExtraordinaria(
          error?.message || 'No fue posible consultar las fechas extraordinarias.'
        );
      } finally {
        setCargandoConfiguracionExtraordinaria(false);
      }
    };

    const consultarHorariosExtraordinarios = async (fechaCitacion) => {
      if (!fechaCitacion) {
        setHorariosExtraordinarios([]);
        setErrorProgramacionExtraordinaria('');
        return;
      }
      try {
        setCargandoHorariosExtraordinarios(true);
        setErrorProgramacionExtraordinaria('');
        const parametros = new URLSearchParams();
        if (idProcesoDisciplinario) {
          parametros.set('id_proceso_disciplinario', String(idProcesoDisciplinario));
        }
        const query = parametros.toString() ? `?${parametros.toString()}` : '';
        const response = await fetch(
          `${API_URL}/agenda-disciplinaria/horarios-extraordinarios/${fechaCitacion}${query}`,
          { method: 'GET', headers: construirHeaders() }
        );
        if (!response.ok) {
          throw new Error(
            await obtenerMensajeError(
              response,
              'La fecha extraordinaria seleccionada no está disponible'
            )
          );
        }
        const resultado = await response.json();
        const horarios = Array.isArray(resultado?.horarios)
          ? resultado.horarios
          : [];
        setHorariosExtraordinarios(horarios);
        setFormData((prev) => ({
          ...prev,
          horaCitacionExtraordinaria: horarios.some(
            (item) => item.HoraInicio === prev.horaCitacionExtraordinaria
          )
            ? prev.horaCitacionExtraordinaria
            : '',
        }));
        if (!horarios.length) {
          setErrorProgramacionExtraordinaria(
            'La fecha seleccionada no tiene horarios extraordinarios disponibles.'
          );
        }
      } catch (error) {
        setHorariosExtraordinarios([]);
        setFormData((prev) => ({ ...prev, horaCitacionExtraordinaria: '' }));
        setErrorProgramacionExtraordinaria(
          error?.message || 'No fue posible consultar los horarios extraordinarios.'
        );
      } finally {
        setCargandoHorariosExtraordinarios(false);
      }
    };

    const horaSeleccionadaDisponible =
      horariosDisponibles.some(
        (horario) =>
          horario.HoraInicio ===
          formData.horaCitacion
      );

    const horaExtraordinariaDisponible = horariosExtraordinarios.some(
      (horario) => horario.HoraInicio === formData.horaCitacionExtraordinaria
    );

    const programacionValida =
      formData.esExtraordinaria
        ? Boolean(
            formData.fechaCitacionExtraordinaria &&
              formData.horaCitacionExtraordinaria &&
              formData.justificacionExtraordinaria?.trim() &&
              horaExtraordinariaDisponible &&
              !errorProgramacionExtraordinaria
          )
        : Boolean(
            formData.fechaCitacion &&
              formData.horaCitacion &&
              horaSeleccionadaDisponible &&
              !errorProgramacion
          );

    const agregarEvidencias = (
      archivos
    ) => {
      const nuevasEvidencias =
        archivos.map((archivo) => ({
          id:
            `pendiente-${Date.now()}-` +
            `${archivo.name}-` +
            `${Math.random()}`,
          nombre: archivo.name,
          archivo,
          esPersistida: false,
          urlArchivo: null,
          archivoDisponible: true,
        }));

      setEvidencias((prev) => [
        ...prev,
        ...nuevasEvidencias,
      ]);
    };

    const eliminarEvidencia = (
      evidencia
    ) => {
      if (
        !evidencia ||
        eliminacionEnCursoRef.current
      ) {
        return;
      }

      setEvidenciaSeleccionada(
        evidencia
      );
    };

    const cancelarEliminacion =
      () => {
        if (eliminandoEvidencia) {
          return;
        }

        setEvidenciaSeleccionada(
          null
        );
      };

    const confirmarEliminacion =
      async () => {
        const evidencia =
          evidenciaSeleccionada;

        if (
          !evidencia ||
          eliminacionEnCursoRef.current
        ) {
          return;
        }

        if (!evidencia.esPersistida) {
          setEvidencias((prev) =>
            prev.filter(
              (item) =>
                item.id !==
                evidencia.id
            )
          );

          setEvidenciaSeleccionada(
            null
          );

          toast({
            title:
              'Evidencia retirada',
            description:
              'El archivo pendiente fue retirado de la lista.',
          });

          return;
        }

        const idDocumento = Number(
          evidencia.idDocumento ||
          evidencia.id ||
          0
        );

        if (!idDocumento) {
          toast({
            title:
              'No se pudo eliminar la evidencia',
            description:
              'El documento guardado no tiene un identificador válido.',
            variant: 'destructive',
          });

          setEvidenciaSeleccionada(
            null
          );

          return;
        }

        try {
          eliminacionEnCursoRef.current =
            true;

          setEliminandoEvidencia(
            true
          );

          const response = await fetch(
            `${API_URL}/documento-proceso-disciplinario/${idDocumento}`,
            {
              method: 'DELETE',
              headers:
                construirHeaders(),
            }
          );

          if (!response.ok) {
            const mensaje =
              await obtenerMensajeError(
                response,
                'No se pudo eliminar la evidencia'
              );

            throw new Error(mensaje);
          }

          const resultado =
            await response.json();

          setEvidencias((prev) =>
            prev.filter(
              (item) =>
                Number(
                  item.idDocumento ||
                  item.id ||
                  0
                ) !== idDocumento
            )
          );

          setEvidenciaSeleccionada(
            null
          );

          toast({
            title:
              'Evidencia eliminada',
            description:
              resultado?.Advertencia ||
              'El documento y su registro fueron eliminados correctamente.',
          });
        } catch (error) {
          console.error(
            'Error eliminando evidencia:',
            error
          );

          toast({
            title:
              'No se pudo eliminar la evidencia',
            description:
              error?.message ||
              'Ocurrió un error eliminando el documento.',
            variant: 'destructive',
          });
        } finally {
          eliminacionEnCursoRef.current =
            false;

          setEliminandoEvidencia(
            false
          );
        }
      };

    const manejarErrorMaximoProcesos = (
      error
    ) => {
      const mensaje = String(
        error?.message || ''
      ).trim();

      const esMaximoProcesos =
        mensaje
          .toLowerCase()
          .includes(
            '2 procesos disciplinarios abiertos'
          ) ||
        mensaje
          .toLowerCase()
          .includes(
            'máximo permitido de 2 procesos disciplinarios'
          );

      if (!esMaximoProcesos) {
        return false;
      }

      setMensajeMaximoProcesos(
        mensaje ||
          'Este trabajador ya cuenta con 2 procesos disciplinarios abiertos.'
      );

      setModalMaximoProcesosAbierto(true);

      return true;
    };

    const cerrarModalMaximoProcesos = () => {
      setModalMaximoProcesosAbierto(false);
      setMensajeMaximoProcesos('');
    };

    const validarPasoDos = () => {
      const camposObligatorios = [
        {
          value: formData.esExtraordinaria
            ? formData.fechaCitacionExtraordinaria
            : formData.fechaCitacion,
          label:
            'Fecha de la citación',
        },
        {
          value: formData.esExtraordinaria
            ? formData.horaCitacionExtraordinaria
            : formData.horaCitacion,
          label:
            'Hora de la citación',
        },
        ...(formData.esExtraordinaria
          ? [
              {
                value: formData.justificacionExtraordinaria,
                label: 'Justificación de la cita extraordinaria',
              },
            ]
          : []),
        {
          value:
            formData.modalidad,
          label: 'Modalidad',
        },
        ...(formData.modalidad === 'PRESENCIAL'
          ? [
              {
                value:
                  formData.lugarCitacion,
                label:
                  'Lugar de la citación',
              },
            ]
          : []),
        {
          value:
            formData
              .supervisorReporta,
          label:
            'Supervisor que reporta',
        },
        {
          value:
            formData
              .correoSupervisorReporta,
          label:
            'Correo del supervisor que reporta',
        },
        {
          value:
            formData
              .telefonoTrabajador,
          label:
            'Teléfono del trabajador',
        },
        {
          value:
            formData.cliente,
          label: 'Cliente',
        },
        {
          value:
            formData.tipoGestion,
          label:
            'Tipo de gestión',
        },
        {
          value:
            formData.tipoFalta,
          label:
            'Motivo de citación / presunta falta',
        },
        ...(formData.tipoFalta ===
        'AUSENCIA_INJUSTIFICADA'
          ? [
              {
                value:
                  formData.fechaUltimoDiaLaborado,
                label:
                  'Último día laborado',
              },
              {
                value:
                  formData.fechaInicioAusencia,
                label:
                  'Inicio de ausencia',
              },
              {
                value:
                  formData.fechaFinAusencia,
                label:
                  'Fin de ausencia',
              },
            ]
          : []),
        {
          value:
            formData.relatoHechos,
          label:
            'Relato de los hechos',
        },
        {
          value:
            formData.desempenoContinua,
          label:
            '¿Desempeño continúa?',
        },
        {
          value:
            formData.justificacionDesempeno,
          label:
            '¿Por qué continúa o no continúa el desempeño?',
        },
      ];

      const campoFaltante =
        camposObligatorios.find(
          (campo) =>
            !String(
              campo.value || ''
            ).trim()
        );

      if (campoFaltante) {
        toast({
          title:
            'Información incompleta',
          description:
            `Debes diligenciar: ` +
            `${campoFaltante.label}.`,
          variant: 'destructive',
        });

        return false;
      }

      if (
        formData.tipoFalta ===
        'AUSENCIA_INJUSTIFICADA'
      ) {
        const ultimoDiaLaborado =
          formData.fechaUltimoDiaLaborado;
        const inicioAusencia =
          formData.fechaInicioAusencia;
        const finAusencia =
          formData.fechaFinAusencia;

        if (ultimoDiaLaborado >= inicioAusencia) {
          toast({
            title:
              'Fechas de ausencia inválidas',
            description:
              'El último día laborado debe ser anterior al inicio de la ausencia.',
            variant: 'destructive',
          });

          return false;
        }

        if (finAusencia < inicioAusencia) {
          toast({
            title:
              'Fechas de ausencia inválidas',
            description:
              'La fecha fin de ausencia no puede ser anterior a la fecha inicio.',
            variant: 'destructive',
          });

          return false;
        }
      }

      const correoSupervisor = String(
        formData.correoSupervisorReporta || ''
      ).trim();

      const correoValido =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          correoSupervisor
        );

      if (!correoValido) {
        toast({
          title:
            'Correo inválido',
          description:
            'Debes registrar un correo válido para el supervisor que reporta.',
          variant: 'destructive',
        });

        return false;
      }

      return true;
    };

    const consultarCitacion = async (
      idProceso
    ) => {
      const response = await fetch(
        `${API_URL}/citacion-proceso-disciplinario/proceso/${idProceso}`,
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

    const consultarEvidencias = async (
      idProceso
    ) => {
      const response = await fetch(
        `${API_URL}/documento-proceso-disciplinario/proceso/${idProceso}`,
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

      const documentos =
        await response.json();

      const lista = Array.isArray(
        documentos
      )
        ? documentos
        : [];

      const evidenciasPersistidas =
        lista.map((documento) => ({
          id:
            documento
              .IdDocumentoProcesoDisciplinario,
          idDocumento:
            documento
              .IdDocumentoProcesoDisciplinario,
          idProceso:
            documento
              .IdProcesoDisciplinario,
          nombre:
            documento.NombreArchivo ||
            'Documento sin nombre',
          tipoDocumento:
            documento.TipoDocumento ||
            'EVIDENCIA_OPERACIONES',
          observacion:
            documento.Observacion ||
            '',
          fechaCreacion:
            documento.FechaCreacion ||
            null,
          esPersistida: true,
          archivo: null,
          archivoDisponible:
            Boolean(
              documento
                .ArchivoDisponible
            ),
          urlArchivo:
            documento.UrlArchivo ||
            (
              documento
                .IdDocumentoProcesoDisciplinario
                ? `${API_URL}/documento-proceso-disciplinario/${documento.IdDocumentoProcesoDisciplinario}/archivo`
                : null
            ),
        }));

      setEvidencias(
        evidenciasPersistidas
      );

      return evidenciasPersistidas;
    };

    const consultarBorradorExistente =
      async () => {
        if (
          !idRegistroPersonal ||
          !trabajador
        ) {
          return;
        }

        try {
          setCargandoBorrador(true);

          const response =
            await fetch(
              `${API_URL}/procesos-disciplinarios/trabajador/${idRegistroPersonal}/borrador-operaciones`,
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
                'No se pudo consultar el borrador'
              );

            throw new Error(mensaje);
          }

          const proceso =
            await response.json();

          if (
            !proceso ||
            !proceso
              .IdProcesoDisciplinario
          ) {
            return;
          }

          const idProceso =
            proceso
              .IdProcesoDisciplinario;

          setIdProcesoDisciplinario(
            idProceso
          );

          const [
            citacion,
          ] = await Promise.all([
            consultarCitacion(
              idProceso
            ),
            consultarEvidencias(
              idProceso
            ),
          ]);

          if (citacion) {
            setIdCitacionProcesoDisciplinario(
              citacion
                .IdCitacionProcesoDisciplinario
            );

            setFormData((prev) => ({
              ...prev,

              esExtraordinaria: Boolean(citacion.EsExtraordinaria),
              fechaCitacion: citacion.EsExtraordinaria
                ? ''
                : citacion.FechaCitacion || '',
              horaCitacion: citacion.EsExtraordinaria
                ? ''
                : normalizarHoraBackend(citacion.HoraCitacion),
              fechaCitacionExtraordinaria: citacion.EsExtraordinaria
                ? citacion.FechaCitacion || ''
                : '',
              horaCitacionExtraordinaria: citacion.EsExtraordinaria
                ? normalizarHoraBackend(citacion.HoraCitacion)
                : '',
              motivoExtraordinario: citacion.MotivoExtraordinario || '',
              justificacionExtraordinaria:
                citacion.JustificacionExtraordinaria || '',

              modalidad:
                citacion.Modalidad ||
                '',

              lugarCitacion:
                String(
                  citacion.Modalidad || ''
                )
                  .trim()
                  .toUpperCase() ===
                'PRESENCIAL'
                  ? citacion.LugarCitacion ||
                    ''
                  : '',

              supervisorReporta:
                citacion
                  .SupervisorReporta ||
                prev.supervisorReporta ||
                '',

              correoSupervisorReporta:
                citacion
                  .CorreoSupervisorReporta ||
                prev.correoSupervisorReporta ||
                '',

              telefonoTrabajador:
                citacion
                  .TelefonoTrabajador ||
                prev.telefonoTrabajador ||
                obtenerTelefonoInicial() ||
                '',

              cliente:
                citacion.Cliente ||
                prev.cliente ||
                '',

              sede:
                citacion.Sede ||
                prev.sede ||
                '',

              tipoGestion:
                citacion
                  .TipoGestionDisciplinaria ||
                '',

              tipoFalta:
                citacion
                  .MotivoCitacion ||
                '',

              fechaUltimoDiaLaborado:
                citacion
                  .FechaUltimoDiaLaborado ||
                '',

              fechaInicioAusencia:
                citacion
                  .FechaInicioAusencia ||
                '',

              fechaFinAusencia:
                citacion
                  .FechaFinAusencia ||
                '',

              relatoHechos:
                normalizarTextoDuplicado(
                  citacion.RelatoHechos
                ),

              observacionesAdicionales:
                citacion
                  .ObservacionOperaciones ||
                '',

              desempenoContinua:
                citacion
                  .DesempenoContinua ||
                '',

              justificacionDesempeno:
                citacion
                  .JustificacionDesempeno ||
                '',
            }));
          }

          toast({
            title:
              'Borrador recuperado',
            description:
              'Se cargaron los datos y las evidencias guardadas anteriormente.',
          });
        } catch (error) {
          console.error(
            'Error consultando borrador:',
            error
          );

          toast({
            title:
              'No se pudo recuperar el borrador',
            description:
              error?.message ||
              'Ocurrió un error consultando la información.',
            variant: 'destructive',
          });
        } finally {
          setCargandoBorrador(
            false
          );

          setBorradorConsultado(
            true
          );
        }
      };

    useEffect(() => {
      consultarConfiguracionCitacion();
      consultarConfiguracionExtraordinaria();

      // La configuración se consulta una sola vez al abrir la vista.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (!formData.fechaCitacion) {
        setHorariosDisponibles([]);
        setErrorProgramacion('');
        return;
      }

      consultarHorariosDisponibles(
        formData.fechaCitacion
      );

      // Se consulta cada vez que cambia la fecha seleccionada.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.fechaCitacion]);

    useEffect(() => {
      if (!formData.esExtraordinaria || !formData.fechaCitacionExtraordinaria) {
        setHorariosExtraordinarios([]);
        setErrorProgramacionExtraordinaria('');
        return;
      }
      consultarHorariosExtraordinarios(formData.fechaCitacionExtraordinaria);

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.esExtraordinaria, formData.fechaCitacionExtraordinaria]);

    useEffect(() => {
      consultarBorradorExistente();

      // Se ejecuta al abrir el trabajador.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idRegistroPersonal]);


    useEffect(() => {
      if (!evidenciaSeleccionada) {
        return undefined;
      }

      const manejarTecla = (
        event
      ) => {
        if (
          event.key === 'Escape' &&
          !eliminandoEvidencia
        ) {
          setEvidenciaSeleccionada(
            null
          );
        }
      };

      window.addEventListener(
        'keydown',
        manejarTecla
      );

      return () => {
        window.removeEventListener(
          'keydown',
          manejarTecla
        );
      };
    }, [
      evidenciaSeleccionada,
      eliminandoEvidencia,
    ]);

    const crearProcesoBorrador =
      async (
        estadoProceso
      ) => {
        const usuario =
          obtenerUsuarioSesion();

        const response =
          await fetch(
            `${API_URL}/procesos-disciplinarios/`,
            {
              method: 'POST',
              headers:
                construirHeaders(true),
              body: JSON.stringify({
                IdRegistroPersonal:
                  idRegistroPersonal,
                EstadoProceso:
                  estadoProceso,
                OrigenProceso:
                  'OPERACIONES',
                UsuarioActualizacion:
                  usuario,
              }),
            }
          );

        if (response.status === 409) {
          const consulta =
            await fetch(
              `${API_URL}/procesos-disciplinarios/trabajador/${idRegistroPersonal}/borrador-operaciones`,
              {
                method: 'GET',
                headers:
                  construirHeaders(),
              }
            );

          if (!consulta.ok) {
            const mensaje =
              await obtenerMensajeError(
                consulta,
                'No se pudo recuperar el borrador existente'
              );

            throw new Error(mensaje);
          }

          const existente =
            await consulta.json();

          if (
            existente
              ?.IdProcesoDisciplinario
          ) {
            setIdProcesoDisciplinario(
              existente
                .IdProcesoDisciplinario
            );

            return existente;
          }
        }

        if (!response.ok) {
          const mensaje =
            await obtenerMensajeError(
              response,
              'No se pudo crear el borrador'
            );

          throw new Error(mensaje);
        }

        const proceso =
          await response.json();

        setIdProcesoDisciplinario(
          proceso
            .IdProcesoDisciplinario
        );

        return proceso;
      };

    const actualizarEstadoProceso =
      async (
        idProceso,
        estadoProceso
      ) => {
        const usuario =
          obtenerUsuarioSesion();

        const response =
          await fetch(
            `${API_URL}/procesos-disciplinarios/${idProceso}`,
            {
              method: 'PUT',
              headers:
                construirHeaders(true),
              body: JSON.stringify({
                EstadoProceso:
                  estadoProceso,
                OrigenProceso:
                  'OPERACIONES',
                UsuarioActualizacion:
                  usuario,
              }),
            }
          );

        if (!response.ok) {
          const mensaje =
            await obtenerMensajeError(
              response,
              'No se pudo actualizar el proceso'
            );

          throw new Error(mensaje);
        }

        return response.json();
      };

    const guardarCitacion = async (
      idProceso
    ) => {
      const usuario =
        obtenerUsuarioSesion();

      const payload = {
        IdProcesoDisciplinario:
          idProceso,

        FechaCitacion:
          (formData.esExtraordinaria
            ? formData.fechaCitacionExtraordinaria
            : formData.fechaCitacion) ||
          null,

        HoraCitacion:
          (formData.esExtraordinaria
            ? formData.horaCitacionExtraordinaria
            : formData.horaCitacion) ||
          null,

        EsExtraordinaria: Boolean(formData.esExtraordinaria),
        MotivoExtraordinario: null,
        JustificacionExtraordinaria: formData.esExtraordinaria
          ? String(formData.justificacionExtraordinaria || '').trim() || null
          : null,

        LugarCitacion:
          formData.modalidad ===
          'PRESENCIAL'
            ? formData.lugarCitacion ||
              null
            : null,

        TipoGestionDisciplinaria:
          formData.tipoGestion ||
          null,

        MotivoCitacion:
          formData.tipoFalta ||
          null,

        FechaUltimoDiaLaborado:
          formData.tipoFalta ===
          'AUSENCIA_INJUSTIFICADA'
            ? formData
                .fechaUltimoDiaLaborado ||
              null
            : null,

        FechaInicioAusencia:
          formData.tipoFalta ===
          'AUSENCIA_INJUSTIFICADA'
            ? formData
                .fechaInicioAusencia ||
              null
            : null,

        FechaFinAusencia:
          formData.tipoFalta ===
          'AUSENCIA_INJUSTIFICADA'
            ? formData
                .fechaFinAusencia ||
              null
            : null,

        ResponsableCitacion:
          null,

        Modalidad:
          formData.modalidad ||
          null,

        RelatoHechos:
          normalizarTextoDuplicado(
            formData.relatoHechos
          ) || null,

        ObservacionOperaciones:
          formData
            .observacionesAdicionales ||
          null,

        DesempenoContinua:
          formData.desempenoContinua ||
          null,

        JustificacionDesempeno:
          formData.justificacionDesempeno ||
          null,

        SupervisorReporta:
          formData
            .supervisorReporta ||
          null,

        CorreoSupervisorReporta:
          String(
            formData.correoSupervisorReporta ||
            ''
          ).trim() || null,

        TelefonoTrabajador:
          String(
            formData.telefonoTrabajador ||
            ''
          ).trim() || null,

        ManifestacionSupervisor:
          null,

        Cliente:
          formData.cliente ||
          null,

        Sede:
          formData.sede ||
          null,

        UsuarioCreacion:
          usuario,

        UsuarioActualizacion:
          usuario,
      };

      let idCitacion =
        idCitacionProcesoDisciplinario;

      if (!idCitacion) {
        const existente =
          await consultarCitacion(
            idProceso
          );

        idCitacion =
          existente
            ?.IdCitacionProcesoDisciplinario ||
          null;

        if (idCitacion) {
          setIdCitacionProcesoDisciplinario(
            idCitacion
          );
        }
      }

      if (idCitacion) {
        const {
          IdProcesoDisciplinario,
          UsuarioCreacion,
          ...payloadActualizacion
        } = payload;

        const response =
          await fetch(
            `${API_URL}/citacion-proceso-disciplinario/${idCitacion}`,
            {
              method: 'PUT',
              headers:
                construirHeaders(true),
              body: JSON.stringify(
                payloadActualizacion
              ),
            }
          );

        if (!response.ok) {
          const mensaje =
            await obtenerMensajeError(
              response,
              'No se pudo actualizar la citación'
            );

          throw new Error(mensaje);
        }

        const citacion =
          await response.json();

        setIdCitacionProcesoDisciplinario(
          citacion
            .IdCitacionProcesoDisciplinario
        );

        return citacion;
      }

      const response = await fetch(
        `${API_URL}/citacion-proceso-disciplinario/`,
        {
          method: 'POST',
          headers:
            construirHeaders(true),
          body:
            JSON.stringify(payload),
        }
      );

      if (response.status === 409) {
        const existente =
          await consultarCitacion(
            idProceso
          );

        if (
          existente
            ?.IdCitacionProcesoDisciplinario
        ) {
          setIdCitacionProcesoDisciplinario(
            existente
              .IdCitacionProcesoDisciplinario
          );

          return existente;
        }
      }

      if (!response.ok) {
        const mensaje =
          await obtenerMensajeError(
            response,
            'No se pudo guardar la citación'
          );

        throw new Error(mensaje);
      }

      const citacion =
        await response.json();

      setIdCitacionProcesoDisciplinario(
        citacion
          .IdCitacionProcesoDisciplinario
      );

      return citacion;
    };

    const subirEvidencia = async (
      idProceso,
      evidencia
    ) => {
      if (
        evidencia.esPersistida ||
        !evidencia.archivo
      ) {
        return evidencia;
      }

      const formulario =
        new FormData();

      formulario.append(
        'IdProcesoDisciplinario',
        String(idProceso)
      );

      formulario.append(
        'TipoDocumento',
        'EVIDENCIA_OPERACIONES'
      );

      formulario.append(
        'Observacion',
        'Evidencia adjunta desde Operaciones - Paso 2'
      );

      formulario.append(
        'archivo',
        evidencia.archivo,
        evidencia.archivo.name
      );

      const response = await fetch(
        `${API_URL}/documento-proceso-disciplinario/upload`,
        {
          method: 'POST',
          headers:
            construirHeadersArchivo(),
          body: formulario,
        }
      );

      if (!response.ok) {
        const mensaje =
          await obtenerMensajeError(
            response,
            `No se pudo subir ${evidencia.nombre}`
          );

        throw new Error(mensaje);
      }

      return response.json();
    };

    const guardarEvidencias = async (
      idProceso
    ) => {
      const evidenciasPendientes =
        evidencias.filter(
          (evidencia) =>
            !evidencia.esPersistida &&
            evidencia.archivo
        );

      if (
        evidenciasPendientes.length ===
        0
      ) {
        return;
      }

      for (
        const evidencia
        of evidenciasPendientes
      ) {
        await subirEvidencia(
          idProceso,
          evidencia
        );
      }

      await consultarEvidencias(
        idProceso
      );
    };

    const guardarPasoDos = async (
      estadoProceso
    ) => {
      if (!idRegistroPersonal) {
        throw new Error(
          'No fue posible identificar al trabajador seleccionado.'
        );
      }

      let procesoId =
        idProcesoDisciplinario;

      if (!procesoId) {
        const proceso =
          await crearProcesoBorrador(
            estadoProceso
          );

        procesoId =
          proceso
            .IdProcesoDisciplinario;
      }

      await guardarCitacion(
        procesoId
      );

      await guardarEvidencias(
        procesoId
      );

      await actualizarEstadoProceso(
        procesoId,
        estadoProceso
      );

      setIdProcesoDisciplinario(
        procesoId
      );

      return procesoId;
    };

    const handleGuardarBorrador =
      async () => {
        try {
          setGuardando(true);

          await guardarPasoDos(
            'BORRADOR_OPERACIONES'
          );

          toast({
            title:
              'Borrador guardado',
            description:
              'Los datos y las evidencias del Paso 2 quedaron guardados correctamente.',
          });
        } catch (error) {
          console.error(
            'Error guardando borrador:',
            error
          );

          if (
            !manejarErrorMaximoProcesos(
              error
            )
          ) {
            toast({
              title:
                'No se pudo guardar el borrador',
              description:
                error?.message ||
                'Ocurrió un error guardando la información.',
              variant: 'destructive',
            });
          }
        } finally {
          setGuardando(false);
        }
      };

    const handleContinuarPasoTres =
      async () => {
        if (!validarPasoDos()) {
          return;
        }

        try {
          setGuardando(true);

          const procesoId =
            await guardarPasoDos(
              'PASO_2_COMPLETADO'
            );

          toast({
            title:
              'Paso 2 guardado',
            description:
              'La citación, los hechos y las evidencias quedaron guardados.',
          });
          navigate(
            '/operaciones/procesos-disciplinarios/revision',
            {
              state: {
                trabajador,
                idRegistroPersonal,
                idProcesoDisciplinario:
                  procesoId,
              },
            }
          );
        } catch (error) {
          console.error(
            'Error completando Paso 2:',
            error
          );

          if (
            !manejarErrorMaximoProcesos(
              error
            )
          ) {
            toast({
              title:
                'No se pudo completar el Paso 2',
              description:
                error?.message ||
                'Ocurrió un error guardando la información.',
              variant: 'destructive',
            });
          }
        } finally {
          setGuardando(false);
        }
      };

    if (
      !trabajador ||
      !idRegistroPersonal
    ) {
      return (
        <section className="w-full rounded-2xl border-t-4 border-emerald-600 bg-white p-4 shadow-xl sm:p-6 lg:p-8">
          <div className="py-12 text-center">
            <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />

            <h1 className="mt-4 text-xl font-bold text-gray-800">
              No hay trabajador seleccionado
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Regresa al buscador y selecciona al trabajador que presenta la novedad.
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
            onClick={() =>
              navigate(
                '/operaciones/procesos-disciplinarios'
              )
            }
            className="mb-5 min-h-11 rounded-xl px-3 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Volver
          </Button>

          <div className="flex min-w-0 items-start gap-3 sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-200">
              <ClipboardList className="h-6 w-6 text-white" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-700">
                Paso 2 de 3
              </p>

              <h1 className="break-words text-xl font-bold text-gray-800 sm:text-2xl">
                Citación y hechos del caso
              </h1>

              <p className="mt-1 break-words text-sm leading-relaxed text-gray-500">
                Registra la programación, los hechos reportados y las evidencias del proceso.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {[
              'Trabajador',
              'Citación',
              'Revisión y envío',
            ].map(
              (paso, index) => (
                <div
                  key={paso}
                  className={`rounded-xl border p-3 text-center ${
                    index <= 1
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-gray-200 bg-gray-50 text-gray-500'
                  }`}
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

          {cargandoBorrador && (
            <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Consultando borrador guardado...
            </div>
          )}

          {!cargandoBorrador &&
            borradorConsultado &&
            idProcesoDisciplinario && (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Borrador de Operaciones recuperado. Expediente disciplinario{" "}
                {formatearExpedienteDisciplinario(
                  idProcesoDisciplinario,
                  formData.esExtraordinaria
                    ? formData.fechaCitacionExtraordinaria
                    : formData.fechaCitacion
                )}.
              </div>
            )}

          <TrabajadorSeleccionadoCard
            trabajador={trabajador}
            idRegistroPersonal={
              idRegistroPersonal
            }
            telefonoTrabajador={
              formData.telefonoTrabajador
            }
            onTelefonoChange={
              handleChange
            }
          />

          <ProgramacionCitacionCard
            formData={formData}
            onChange={handleChange}
            fechaMinimaPermitida={
              configuracionCitacion
                ?.fechaMinimaPermitida || ''
            }
            horariosDisponibles={
              horariosDisponibles
            }
            cargandoConfiguracion={
              cargandoConfiguracion
            }
            cargandoHorarios={
              cargandoHorarios
            }
            errorProgramacion={
              errorProgramacion
            }
            programacionValida={
              programacionValida
            }
            configuracionExtraordinaria={configuracionExtraordinaria}
            horariosExtraordinarios={horariosExtraordinarios}
            cargandoConfiguracionExtraordinaria={
              cargandoConfiguracionExtraordinaria
            }
            cargandoHorariosExtraordinarios={cargandoHorariosExtraordinarios}
            errorProgramacionExtraordinaria={errorProgramacionExtraordinaria}
          />

          {programacionValida && (
            <>
              <HechosCasoCard
                formData={formData}
                onChange={handleChange}
              />

              <EvidenciasProcesoCard
                evidencias={evidencias}
                onAgregarEvidencias={
                  agregarEvidencias
                }
                onEliminarEvidencia={
                  eliminarEvidencia
                }
              />
            </>
          )}

          <div className="mt-6 flex flex-col gap-3 border-t border-gray-200 pt-6 lg:flex-row lg:items-center lg:justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={
                guardando ||
                eliminandoEvidencia
              }
              onClick={() =>
                navigate(
                  '/operaciones/procesos-disciplinarios'
                )
              }
              className="min-h-11 w-full rounded-xl border-gray-300 font-semibold text-gray-700 lg:w-auto"
            >
              Cancelar
            </Button>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={
                  handleGuardarBorrador
                }
                disabled={
                  guardando ||
                  cargandoBorrador ||
                  eliminandoEvidencia ||
                  (
                    formData.esExtraordinaria &&
                    (
                      cargandoConfiguracionExtraordinaria ||
                      cargandoHorariosExtraordinarios
                    )
                  )
                }
                className="min-h-11 w-full rounded-xl border-emerald-300 px-5 font-semibold text-emerald-700 hover:bg-emerald-50 sm:w-auto"
              >
                {guardando ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-5 w-5" />
                )}

                {guardando
                  ? 'Guardando...'
                  : 'Guardar borrador'}
              </Button>

              <Button
                type="button"
                onClick={
                  handleContinuarPasoTres
                }
                disabled={
                  guardando ||
                  cargandoBorrador ||
                  eliminandoEvidencia ||
                  cargandoConfiguracion ||
                  cargandoHorarios ||
                  cargandoConfiguracionExtraordinaria ||
                  cargandoHorariosExtraordinarios ||
                  !programacionValida
                }
                className="min-h-11 w-full rounded-xl bg-emerald-600 px-5 font-semibold text-white shadow-md hover:bg-emerald-700 sm:w-auto"
              >
                {guardando ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    Continuar al Paso 3
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>

        {modalMaximoProcesosAbierto && (
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-maximo-procesos"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                cerrarModalMaximoProcesos();
              }
            }}
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
              className="w-full max-w-lg overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-2xl"
            >
              <div className="bg-amber-50 px-6 py-6 sm:px-7">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                    <AlertTriangle className="h-6 w-6" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
                      No es posible iniciar otro proceso
                    </p>

                    <h2
                      id="titulo-maximo-procesos"
                      className="mt-1 text-xl font-bold text-gray-900"
                    >
                      El trabajador ya cuenta con 2 procesos disciplinarios abiertos
                    </h2>
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-6 py-6 sm:px-7">
                <p className="text-sm leading-relaxed text-gray-700">
                  {mensajeMaximoProcesos ||
                    'No es posible iniciar un nuevo proceso hasta que uno de los procesos actuales sea finalizado o cerrado.'}
                </p>

                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                  <p className="text-sm leading-relaxed text-blue-800">
                    Puedes continuar con este trabajador cuando uno de sus procesos disciplinarios actuales haya sido finalizado o cerrado.
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 sm:px-7">
                <Button
                  type="button"
                  onClick={
                    cerrarModalMaximoProcesos
                  }
                  className="min-h-11 w-full rounded-xl bg-emerald-600 px-5 font-semibold text-white hover:bg-emerald-700"
                >
                  Entendido
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {evidenciaSeleccionada && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-eliminar-evidencia"
            onMouseDown={(event) => {
              if (
                event.target ===
                  event.currentTarget &&
                !eliminandoEvidencia
              ) {
                cancelarEliminacion();
              }
            }}
          >
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
                <h2
                  id="titulo-eliminar-evidencia"
                  className="text-xl font-bold text-gray-900"
                >
                  Eliminar evidencia
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Revisa el archivo antes de confirmar esta acción.
                </p>
              </div>

              <div className="space-y-4 px-5 py-5 sm:px-6">
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-800">
                    ¿Deseas eliminar esta evidencia?
                  </p>

                  <p className="mt-2 break-all rounded-lg border border-red-100 bg-white px-3 py-2 text-sm font-semibold text-gray-800">
                    {evidenciaSeleccionada
                      ?.nombre ||
                      'Documento sin nombre'}
                  </p>
                </div>

                <p className="text-sm leading-relaxed text-gray-600">
                  {evidenciaSeleccionada
                    ?.esPersistida
                    ? (
                      'Esta acción eliminará definitivamente el archivo guardado y su registro del proceso disciplinario. No será posible recuperarlo.'
                    )
                    : (
                      'El archivo pendiente será retirado de la lista y no se guardará en el proceso disciplinario.'
                    )}
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={
                    cancelarEliminacion
                  }
                  disabled={
                    eliminandoEvidencia
                  }
                  className="min-h-11 w-full rounded-xl border-gray-300 px-5 font-semibold text-gray-700 sm:w-auto"
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  onClick={
                    confirmarEliminacion
                  }
                  disabled={
                    eliminandoEvidencia
                  }
                  className="min-h-11 w-full rounded-xl bg-red-600 px-5 font-semibold text-white hover:bg-red-700 sm:w-auto"
                >
                  {eliminandoEvidencia ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    'Eliminar evidencia'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

export default IniciarProcesoOperacionesView;
