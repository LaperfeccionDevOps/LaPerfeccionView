import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { obtenerExpedienteDisciplinario } from "@/services/procesosDisciplinariosService";
import { formatearExpedienteDisciplinario } from "@/utils/formatearExpedienteDisciplinario";

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const FILE_BASE_URL = API_URL.replace("/api", "");

const obtenerUsuarioSesion = () => {
  const almacenamientos = [
    window.localStorage,
    window.sessionStorage,
  ];

  const claves = [
    "user",
    "userData",
    "auth",
    "authData",
    "session",
  ];

  for (const almacenamiento of almacenamientos) {
    for (const clave of claves) {
      const valor = almacenamiento.getItem(clave);

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
          "rrll"
        );
      } catch {
        // Continuar buscando en las demás claves.
      }
    }
  }

  return "rrll";
};

const obtenerMensajeBackend = async (
  response,
  mensajePredeterminado
) => {
  try {
    const data = await response.json();

    if (typeof data?.detail === "string") {
      return data.detail;
    }

    if (typeof data?.detail?.mensaje === "string") {
      return data.detail.mensaje;
    }

    if (typeof data?.mensaje === "string") {
      return data.mensaje;
    }
  } catch {
    // La respuesta no contenía JSON.
  }

  return `${mensajePredeterminado} (HTTP ${response.status}).`;
};

const formatearFechaColombia = (valor) => {
  if (!valor) {
    return "—";
  }

  const fecha = String(valor).slice(0, 10);
  const partes = fecha.split("-");

  if (partes.length !== 3) {
    return valor;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

const formatearHora = (valor) => {
  if (!valor) {
    return "—";
  }

  return String(valor).slice(0, 5);
};

const esFechaViernes = (valor) => {
  if (!valor) {
    return false;
  }

  const partes = String(valor)
    .split("-")
    .map(Number);

  if (
    partes.length !== 3 ||
    partes.some((parte) => Number.isNaN(parte))
  ) {
    return false;
  }

  const [anio, mes, dia] = partes;

  return new Date(anio, mes - 1, dia).getDay() === 5;
};

export default function ProcesoDisciplinarioDetalleView({
  onBack,
  proceso,
  trabajador,
}) {
  const [expediente, setExpediente] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tipoDocumento, setTipoDocumento] = useState("citacion");
  const [observacion, setObservacion] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [cargandoDocumento, setCargandoDocumento] = useState(false);
  const [mensajeDocumento, setMensajeDocumento] = useState("");

  const [autorizaciones, setAutorizaciones] = useState([]);
  const [cargandoAutorizaciones, setCargandoAutorizaciones] =
    useState(false);
  const [mensajeAutorizacion, setMensajeAutorizacion] =
    useState("");
  const [modalAutorizacionAbierto, setModalAutorizacionAbierto] =
    useState(false);
  const [modalAnulacionAbierto, setModalAnulacionAbierto] =
    useState(false);
  const [autorizacionSeleccionada, setAutorizacionSeleccionada] =
    useState(null);
  const [horariosAutorizables, setHorariosAutorizables] =
    useState([]);
  const [fechaAutorizada, setFechaAutorizada] = useState("");
  const [horaAutorizada, setHoraAutorizada] = useState("");
  const [motivoAutorizacion, setMotivoAutorizacion] =
    useState("");
  const [observacionAutorizacion, setObservacionAutorizacion] =
    useState("");
  const [motivoAnulacion, setMotivoAnulacion] =
    useState("");
  const [guardandoAutorizacion, setGuardandoAutorizacion] =
    useState(false);

  async function cargarExpediente() {
    if (!proceso?.IdProcesoDisciplinario) return;

    try {
      const data = await obtenerExpedienteDisciplinario(
        proceso.IdProcesoDisciplinario
      );

      setExpediente(data);
    } catch (error) {
      console.error(
        "Error cargando expediente disciplinario:",
        error
      );
    }
  }


  const idProcesoActual = Number(
    expediente?.Proceso?.IdProcesoDisciplinario ||
      proceso?.IdProcesoDisciplinario ||
      0
  );

  const idRegistroPersonalActual = Number(
    expediente?.Proceso?.IdRegistroPersonal ||
      proceso?.IdRegistroPersonal ||
      trabajador?.IdRegistroPersonal ||
      0
  );

  async function cargarAutorizaciones(
    idProceso = idProcesoActual
  ) {
    if (!idProceso) {
      setAutorizaciones([]);
      return;
    }

    try {
      setCargandoAutorizaciones(true);
      setMensajeAutorizacion("");

      const response = await fetch(
        `${API_URL}/autorizaciones-agenda-disciplinaria/proceso/${idProceso}`
      );

      if (!response.ok) {
        throw new Error(
          await obtenerMensajeBackend(
            response,
            "No se pudieron consultar las autorizaciones"
          )
        );
      }

      const data = await response.json();

      setAutorizaciones(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Error consultando autorizaciones:",
        error
      );
      setAutorizaciones([]);
      setMensajeAutorizacion(
        error?.message ||
          "No fue posible consultar las autorizaciones."
      );
    } finally {
      setCargandoAutorizaciones(false);
    }
  }

  async function cargarConfiguracionAutorizacion() {
    const response = await fetch(
      `${API_URL}/autorizaciones-agenda-disciplinaria/configuracion`
    );

    if (!response.ok) {
      throw new Error(
        await obtenerMensajeBackend(
          response,
          "No se pudo consultar la configuración"
        )
      );
    }

    const data = await response.json();

    setHorariosAutorizables(
      Array.isArray(data?.horariosPermitidos)
        ? data.horariosPermitidos
        : []
    );
  }

  const abrirModalAutorizacion = async () => {
    if (
      !idProcesoActual ||
      !idRegistroPersonalActual
    ) {
      setMensajeAutorizacion(
        "No fue posible identificar el expediente o el trabajador."
      );
      return;
    }

    setFechaAutorizada("");
    setHoraAutorizada("");
    setMotivoAutorizacion("");
    setObservacionAutorizacion("");
    setMensajeAutorizacion("");
    setModalAutorizacionAbierto(true);

    try {
      await cargarConfiguracionAutorizacion();
    } catch (error) {
      setMensajeAutorizacion(
        error?.message ||
          "No fue posible cargar los horarios."
      );
    }
  };

  const cerrarModalAutorizacion = () => {
    if (guardandoAutorizacion) {
      return;
    }

    setModalAutorizacionAbierto(false);
    setFechaAutorizada("");
    setHoraAutorizada("");
    setMotivoAutorizacion("");
    setObservacionAutorizacion("");
    setMensajeAutorizacion("");
  };

  const crearAutorizacionViernes = async () => {
    if (!esFechaViernes(fechaAutorizada)) {
      setMensajeAutorizacion(
        "La fecha seleccionada debe corresponder a un viernes."
      );
      return;
    }

    if (!horaAutorizada) {
      setMensajeAutorizacion(
        "Seleccione el bloque horario que desea autorizar."
      );
      return;
    }

    if (motivoAutorizacion.trim().length < 5) {
      setMensajeAutorizacion(
        "Ingrese un motivo de autorización válido."
      );
      return;
    }

    const bloque = horariosAutorizables.find(
      (item) =>
        String(item?.HoraInicio || "").slice(0, 5) ===
        horaAutorizada
    );

    if (!bloque) {
      setMensajeAutorizacion(
        "No fue posible identificar el horario seleccionado."
      );
      return;
    }

    try {
      setGuardandoAutorizacion(true);
      setMensajeAutorizacion("");

      const response = await fetch(
        `${API_URL}/autorizaciones-agenda-disciplinaria/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            IdRegistroPersonal: idRegistroPersonalActual,
            IdProcesoDisciplinario: idProcesoActual,
            IdAgendaProcesoDisciplinario: null,
            FechaAutorizada: fechaAutorizada,
            HoraInicio: `${String(
              bloque.HoraInicio
            ).slice(0, 5)}:00`,
            HoraFin: `${String(
              bloque.HoraFin
            ).slice(0, 5)}:00`,
            TipoAutorizacion: "VIERNES",
            MotivoAutorizacion:
              motivoAutorizacion.trim(),
            UsuarioSolicita: "operaciones",
            UsuarioAutoriza: obtenerUsuarioSesion(),
            Observacion:
              observacionAutorizacion.trim() || null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          await obtenerMensajeBackend(
            response,
            "No se pudo crear la autorización"
          )
        );
      }

      setModalAutorizacionAbierto(false);
      setFechaAutorizada("");
      setHoraAutorizada("");
      setMotivoAutorizacion("");
      setObservacionAutorizacion("");
      setMensajeAutorizacion(
        "El viernes y el horario fueron autorizados correctamente."
      );

      await cargarAutorizaciones(idProcesoActual);
    } catch (error) {
      console.error(
        "Error creando autorización:",
        error
      );
      setMensajeAutorizacion(
        error?.message ||
          "No fue posible crear la autorización."
      );
    } finally {
      setGuardandoAutorizacion(false);
    }
  };

  const abrirModalAnulacion = (autorizacion) => {
    setAutorizacionSeleccionada(autorizacion);
    setMotivoAnulacion("");
    setMensajeAutorizacion("");
    setModalAnulacionAbierto(true);
  };

  const cerrarModalAnulacion = () => {
    if (guardandoAutorizacion) {
      return;
    }

    setModalAnulacionAbierto(false);
    setAutorizacionSeleccionada(null);
    setMotivoAnulacion("");
    setMensajeAutorizacion("");
  };

  const anularAutorizacion = async () => {
    const idAutorizacion =
      autorizacionSeleccionada
        ?.IdAutorizacionAgendaDisciplinaria;

    if (!idAutorizacion) {
      setMensajeAutorizacion(
        "No fue posible identificar la autorización."
      );
      return;
    }

    if (motivoAnulacion.trim().length < 5) {
      setMensajeAutorizacion(
        "Ingrese un motivo de anulación válido."
      );
      return;
    }

    try {
      setGuardandoAutorizacion(true);
      setMensajeAutorizacion("");

      const response = await fetch(
        `${API_URL}/autorizaciones-agenda-disciplinaria/${idAutorizacion}/anular`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            MotivoAnulacion: motivoAnulacion.trim(),
            UsuarioAnula: obtenerUsuarioSesion(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          await obtenerMensajeBackend(
            response,
            "No se pudo anular la autorización"
          )
        );
      }

      setModalAnulacionAbierto(false);
      setAutorizacionSeleccionada(null);
      setMotivoAnulacion("");
      setMensajeAutorizacion(
        "La autorización fue anulada correctamente."
      );

      await cargarAutorizaciones(idProcesoActual);
    } catch (error) {
      console.error(
        "Error anulando autorización:",
        error
      );
      setMensajeAutorizacion(
        error?.message ||
          "No fue posible anular la autorización."
      );
    } finally {
      setGuardandoAutorizacion(false);
    }
  };

  useEffect(() => {
    cargarExpediente();
  }, [proceso]);


  useEffect(() => {
    cargarAutorizaciones(idProcesoActual);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idProcesoActual]);

  const procesoExp = expediente?.Proceso || proceso;
  const citacion = expediente?.Citacion;
  const descargo = expediente?.Descargo;
  const cierre = expediente?.Cierre;
  const documentos = expediente?.Documentos || [];

  const estado = procesoExp?.EstadoProceso || "—";
  const cerrado = estado === "CERRADO";

  const fechaCreacion = procesoExp?.FechaCreacion
    ? String(procesoExp.FechaCreacion).slice(0, 10)
    : "—";

  const obtenerUrlDocumento = (rutaArchivo) => {
    if (!rutaArchivo) return "";

    const rutaLimpia = String(rutaArchivo).replaceAll("\\", "/");

    return `${FILE_BASE_URL}/${rutaLimpia}`;
  };

  const abrirDocumento = (rutaArchivo) => {
    const url = obtenerUrlDocumento(rutaArchivo);

    if (!url) return;

    window.open(url, "_blank");
  };

  const descargarDocumento = (
    rutaArchivo,
    nombreArchivo
  ) => {
    const url = obtenerUrlDocumento(rutaArchivo);

    if (!url) return;

    const link = document.createElement("a");

    link.href = url;
    link.download = nombreArchivo || "documento";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const verExpedientePDF = () => {
    const idProceso =
      procesoExp?.IdProcesoDisciplinario;

    if (!idProceso) return;

    window.open(
      `${API_URL}/procesos-disciplinarios/${idProceso}/pdf`,
      "_blank"
    );
  };

  const subirDocumento = async () => {
    if (cerrado) {
      setMensajeDocumento(
        "Este expediente está cerrado y no permite cargar nuevos documentos."
      );
      return;
    }

    if (!archivo) {
      setMensajeDocumento(
        "Debe seleccionar un archivo."
      );
      return;
    }

    if (!procesoExp?.IdProcesoDisciplinario) {
      setMensajeDocumento(
        "No se encontró el proceso disciplinario asociado."
      );
      return;
    }

    try {
      setCargandoDocumento(true);
      setMensajeDocumento("");

      const formData = new FormData();

      formData.append(
        "IdProcesoDisciplinario",
        procesoExp.IdProcesoDisciplinario
      );

      formData.append(
        "TipoDocumento",
        tipoDocumento
      );

      formData.append(
        "Observacion",
        observacion
      );

      formData.append(
        "archivo",
        archivo
      );

      const response = await fetch(
        `${API_URL}/documento-proceso-disciplinario/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(
          "No se pudo cargar el documento."
        );
      }

      setArchivo(null);
      setObservacion("");
      setTipoDocumento("citacion");
      setMostrarFormulario(false);

      setMensajeDocumento(
        "Documento cargado correctamente."
      );

      await cargarExpediente();
    } catch (error) {
      console.error(
        "Error cargando documento disciplinario:",
        error
      );

      setMensajeDocumento(
        error?.message ||
          "No se pudo cargar el documento."
      );
    } finally {
      setCargandoDocumento(false);
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-emerald-600">
        <div className="mb-6">
          <p className="text-sm text-emerald-700 font-semibold">
            Relaciones Laborales
          </p>

          <div>
            <p className="text-sm text-emerald-700 font-semibold">
              Expediente disciplinario
            </p>
            <h2 className="text-2xl font-bold text-gray-800">
              {procesoExp?.IdProcesoDisciplinario
                ? formatearExpedienteDisciplinario(
                    procesoExp,
                    procesoExp?.FechaCreacion
                  )
                : "—"}
            </h2>
          </div>

          <p className="text-sm text-gray-500">
            Consulta completa del proceso disciplinario seleccionado.
          </p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-center">
            <div>
              <p className="text-xs text-gray-500">
                Estado
              </p>

              <span
                className={`inline-block mt-1 px-4 py-2 rounded-full text-sm font-bold ${
                  cerrado
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {estado}
              </span>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Fecha inicio
              </p>

              <p className="font-semibold text-gray-800">
                {fechaCreacion}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Fecha cierre
              </p>

              <p className="font-semibold text-gray-800">
                {cierre?.FechaCierre ||
                  proceso?.FechaCierre ||
                  "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Origen
              </p>

              <p className="font-semibold text-gray-800">
                {procesoExp?.OrigenProceso || "RRLL"}
              </p>
            </div>
          </div>
        </div>

        {cerrado && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 mb-6">
            <p className="font-bold text-emerald-800">
              Expediente cerrado
            </p>

            <p className="text-sm text-emerald-700 mt-1">
              Este proceso se encuentra finalizado y está disponible
              únicamente para consulta y descarga de documentos.
            </p>
          </div>
        )}

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 mb-6">
          <h3 className="font-bold text-emerald-800 mb-4">
            Información del trabajador
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 rounded-xl bg-white p-5 border border-emerald-200">
            <div>
              <p className="text-xs text-gray-500">
                Nombre
              </p>

              <p className="font-semibold text-gray-800">
                {trabajador?.NombreCompleto || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Documento
              </p>

              <p className="font-semibold text-gray-800">
                {trabajador?.TipoDocumento || "—"}{" "}
                {trabajador?.NumeroDocumento || ""}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Cargo
              </p>

              <p className="font-semibold text-gray-800">
                {trabajador?.Cargo || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Cliente
              </p>

              <p className="font-semibold text-gray-800">
                {trabajador?.ClienteNombre || "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 mb-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-700">
                Relaciones Laborales
              </p>

              <h3 className="text-lg font-bold text-gray-800">
                Autorización excepcional de viernes
              </h3>

              <p className="mt-1 text-sm text-gray-600">
                {cerrado
                  ? "Consulta la autorización excepcional asignada a este expediente disciplinario."
                  : "Autoriza un único viernes y bloque horario para este trabajador y expediente disciplinario."}
              </p>
            </div>

            {!cerrado && (
              <Button
                type="button"
                className="bg-amber-600 hover:bg-amber-700"
                onClick={abrirModalAutorizacion}
                disabled={cargandoAutorizaciones}
              >
                Autorizar viernes
              </Button>
            )}
          </div>

          {mensajeAutorizacion &&
            !modalAutorizacionAbierto &&
            !modalAnulacionAbierto && (
              <div className="mt-4 rounded-lg border border-amber-300 bg-white px-4 py-3 text-sm font-medium text-amber-900">
                {mensajeAutorizacion}
              </div>
            )}

          <div className="mt-5">
            {cargandoAutorizaciones ? (
              <div className="rounded-xl border border-amber-200 bg-white px-4 py-6 text-center text-sm text-gray-500">
                Consultando autorizaciones...
              </div>
            ) : autorizaciones.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-white px-4 py-6 text-center">
                <p className="font-semibold text-gray-800">
                  Sin autorizaciones registradas
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Este expediente todavía no tiene un viernes
                  excepcional autorizado.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {autorizaciones.map((autorizacion) => {
                  const estadoAutorizacion =
                    autorizacion.EstadoAutorizacion ||
                    "—";

                  const autorizacionConsumida =
                    cerrado &&
                    estadoAutorizacion === "ACTIVA" &&
                    autorizacion.Activo;

                  const estadoAutorizacionVisual =
                    autorizacionConsumida
                      ? "FINALIZADA"
                      : estadoAutorizacion;

                  const activa =
                    !cerrado &&
                    estadoAutorizacion === "ACTIVA" &&
                    autorizacion.Activo;

                  return (
                    <div
                      key={
                        autorizacion
                          .IdAutorizacionAgendaDisciplinaria
                      }
                      className="rounded-xl border border-amber-200 bg-white p-4"
                    >
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                        <div>
                          <p className="text-xs text-gray-500">
                            Estado
                          </p>

                          <span
                            className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                              estadoAutorizacionVisual === "FINALIZADA"
                                ? "bg-slate-100 text-slate-700"
                                : estadoAutorizacionVisual === "ACTIVA"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : estadoAutorizacionVisual === "UTILIZADA"
                                    ? "bg-blue-100 text-blue-700"
                                    : estadoAutorizacionVisual === "ANULADA"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {estadoAutorizacionVisual}
                          </span>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">
                            Viernes autorizado
                          </p>
                          <p className="mt-1 font-semibold text-gray-800">
                            {formatearFechaColombia(
                              autorizacion.FechaAutorizada
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">
                            Horario
                          </p>
                          <p className="mt-1 font-semibold text-gray-800">
                            {formatearHora(
                              autorizacion.HoraInicio
                            )}{" "}
                            -{" "}
                            {formatearHora(
                              autorizacion.HoraFin
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">
                            Autorizó
                          </p>
                          <p className="mt-1 font-semibold text-gray-800">
                            {autorizacion.UsuarioAutoriza ||
                              "—"}
                          </p>
                        </div>

                        <div className="md:text-right">
                          {activa ? (
                            <Button
                              type="button"
                              variant="outline"
                              className="border-red-300 text-red-700 hover:bg-red-50"
                              onClick={() =>
                                abrirModalAnulacion(
                                  autorizacion
                                )
                              }
                            >
                              Anular autorización
                            </Button>
                          ) : cerrado ? (
                            <div className="inline-flex flex-col items-end">
                              <span className="text-sm font-semibold text-slate-700">
                                Proceso finalizado
                              </span>
                              <span className="mt-1 text-xs text-slate-500">
                                Autorización solo para consulta
                              </span>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">
                              Sin acciones
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 border-t border-amber-100 pt-4 md:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold text-gray-500">
                            Motivo
                          </p>
                          <p className="mt-1 whitespace-pre-line text-sm text-gray-700">
                            {autorizacion.MotivoAutorizacion ||
                              "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-500">
                            Observación
                          </p>
                          <p className="mt-1 whitespace-pre-line text-sm text-gray-700">
                            {autorizacion.Observacion ||
                              "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="font-bold text-gray-800 mb-4">
              Citación
            </h3>

            <p className="text-sm">
              <b>Estado:</b>{" "}
              {citacion ? "Registrada" : "Pendiente"}
            </p>

            <p className="text-sm mt-2">
              <b>Fecha:</b>{" "}
              {citacion?.FechaCitacion || "—"}
            </p>

            <p className="text-sm mt-2">
              <b>Hora:</b>{" "}
              {citacion?.HoraCitacion || "—"}
            </p>

            <p className="text-sm mt-2">
              <b>Lugar:</b>{" "}
              {citacion?.LugarCitacion || "—"}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="font-bold text-gray-800 mb-4">
              Descargos
            </h3>

            <p className="text-sm">
              <b>Estado:</b>{" "}
              {descargo ? "Registrado" : "Pendiente"}
            </p>

            <p className="text-sm mt-2">
              <b>Fecha:</b>{" "}
              {descargo?.FechaDescargo || "—"}
            </p>

            <p className="text-sm mt-2">
              <b>Hora:</b>{" "}
              {descargo?.HoraDescargo || "—"}
            </p>

            <p className="text-sm mt-2">
              <b>Responsable:</b>{" "}
              {descargo?.ResponsableDescargo || "—"}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="font-bold text-gray-800 mb-4">
              Cierre
            </h3>

            <p className="text-sm">
              <b>Estado:</b>{" "}
              {cierre ? "Cerrado" : "Pendiente"}
            </p>

            <p className="text-sm mt-2">
              <b>Tipo:</b>{" "}
              {cierre?.TipoCierre || "—"}
            </p>

            <p className="text-sm mt-2">
              <b>Medida:</b>{" "}
              {cierre?.MedidaDisciplinaria || "—"}
            </p>

            <p className="text-sm mt-2">
              <b>Responsable:</b>{" "}
              {cierre?.ResponsableCierre || "—"}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-5">
            Motivo / hechos registrados
          </h3>

          <div className="rounded-xl bg-gray-50 border border-gray-200 p-5">
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {citacion?.MotivoCitacion ||
                "No hay motivo registrado para este proceso."}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-5">
            Manifestación y observaciones
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-5">
              <p className="text-sm font-semibold mb-2">
                Descargo del trabajador
              </p>

              <p className="text-sm text-gray-700 whitespace-pre-line">
                {descargo?.DescargoTrabajador || "—"}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 border border-gray-200 p-5">
              <p className="text-sm font-semibold mb-2">
                Observaciones
              </p>

              <p className="text-sm text-gray-700 whitespace-pre-line">
                {descargo?.Observaciones || "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-5">
            Conclusión de cierre
          </h3>

          <div className="rounded-xl bg-gray-50 border border-gray-200 p-5">
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {cierre?.ConclusionRRLL || "—"}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
            <h3 className="text-lg font-bold text-gray-800">
              Documentos del expediente
            </h3>

            {!cerrado && (
              <Button
                type="button"
                className="bg-emerald-700 hover:bg-emerald-800"
                onClick={() =>
                  setMostrarFormulario(
                    !mostrarFormulario
                  )
                }
              >
                {mostrarFormulario
                  ? "Cancelar carga"
                  : "Adjuntar evidencia o soporte"}
              </Button>
            )}
          </div>

          {mostrarFormulario && !cerrado && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 mb-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold">
                    Tipo de documento
                  </label>

                  <select
                    className="w-full mt-1 border rounded-lg p-3 bg-white"
                    value={tipoDocumento}
                    onChange={(e) =>
                      setTipoDocumento(e.target.value)
                    }
                  >
                    <option value="citacion">
                      Citación
                    </option>

                    <option value="acta_descargos">
                      Acta de descargos
                    </option>

                    <option value="cierre">
                      Documento de cierre
                    </option>

                    <option value="evidencia">
                      Evidencia
                    </option>

                    <option value="otro">
                      Otro
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold">
                    Observación
                  </label>

                  <input
                    className="w-full mt-1 border rounded-lg p-3"
                    value={observacion}
                    onChange={(e) =>
                      setObservacion(e.target.value)
                    }
                    placeholder="Observación del documento"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">
                    Archivo
                  </label>

                  <input
                    type="file"
                    className="w-full mt-1 border rounded-lg p-2 bg-white"
                    onChange={(e) =>
                      setArchivo(
                        e.target.files?.[0] || null
                      )
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button
                  type="button"
                  className="bg-emerald-700 hover:bg-emerald-800"
                  onClick={subirDocumento}
                  disabled={cargandoDocumento}
                >
                  {cargandoDocumento
                    ? "Cargando..."
                    : "Guardar documento"}
                </Button>
              </div>
            </div>
          )}

          {mensajeDocumento && (
            <p className="text-sm text-emerald-700 font-semibold mb-4">
              {mensajeDocumento}
            </p>
          )}

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Documento
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Tipo
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Estado
                  </th>

                  <th className="px-4 py-3 text-center text-sm font-semibold">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody>
                {documentos.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center text-gray-500 py-10"
                    >
                      No existen documentos asociados a este proceso.
                    </td>
                  </tr>
                ) : (
                  documentos.map((doc) => (
                    <tr
                      key={
                        doc.IdDocumentoProcesoDisciplinario
                      }
                      className="border-t"
                    >
                      <td className="px-4 py-3 text-sm font-semibold">
                        {doc.NombreArchivo ||
                          "Documento"}
                      </td>

                      <td className="px-4 py-3 text-sm">
                        {doc.TipoDocumento || "PDF"}
                      </td>

                      <td className="px-4 py-3 text-sm text-emerald-700 font-semibold">
                        Disponible
                      </td>

                      <td className="px-4 py-3 text-center text-sm">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            onClick={() =>
                              abrirDocumento(
                                doc.RutaArchivo
                              )
                            }
                          >
                            Ver
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() =>
                              descargarDocumento(
                                doc.RutaArchivo,
                                doc.NombreArchivo
                              )
                            }
                          >
                            Descargar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-5">
            Línea de tiempo del proceso
          </h3>

          <div className="space-y-4 text-sm">
            <p>
              ● Proceso iniciado — {fechaCreacion}
            </p>

            <p>
              ● Citación —{" "}
              {citacion
                ? "Registrada"
                : "Pendiente"}
            </p>

            <p>
              ● Descargos —{" "}
              {descargo
                ? "Registrados"
                : "Pendiente"}
            </p>

            <p>
              ● Cierre —{" "}
              {cierre
                ? "Finalizado"
                : "Pendiente"}
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-3">
          <Button
            variant="outline"
            onClick={onBack}
          >
            ← Volver al historial
          </Button>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="bg-emerald-700 hover:bg-emerald-800"
              onClick={verExpedientePDF}
              disabled={
                !procesoExp?.IdProcesoDisciplinario
              }
            >
              Ver expediente disciplinario
            </Button>
          </div>
        </div>

        {modalAutorizacionAbierto && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="border-b border-gray-200 px-6 py-5">
                <p className="text-sm font-semibold text-amber-700">
                  Relaciones Laborales
                </p>
                <h2 className="text-xl font-bold text-gray-900">
                  Autorizar atención excepcional de viernes
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  La autorización será válida únicamente para este
                  trabajador, expediente, fecha y horario.
                </p>
              </div>

              <div className="space-y-5 px-6 py-5">
                <div className="grid grid-cols-1 gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase text-amber-700">
                      Trabajador
                    </p>
                    <p className="mt-1 font-bold text-gray-800">
                      {trabajador?.NombreCompleto || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-amber-700">
                      Expediente disciplinario
                    </p>
                    <p className="mt-1 font-bold text-gray-800">
                      {formatearExpedienteDisciplinario(
                        procesoExp,
                        procesoExp?.FechaCreacion
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">
                      Viernes autorizado *
                    </label>
                    <input
                      type="date"
                      value={fechaAutorizada}
                      onChange={(event) => {
                        setFechaAutorizada(
                          event.target.value
                        );
                        setHoraAutorizada("");
                        setMensajeAutorizacion("");
                      }}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">
                      Bloque horario *
                    </label>
                    <select
                      value={horaAutorizada}
                      onChange={(event) =>
                        setHoraAutorizada(
                          event.target.value
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
                    >
                      <option value="">
                        Seleccione un horario
                      </option>

                      {horariosAutorizables.map((horario) => (
                        <option
                          key={`${horario.HoraInicio}-${horario.HoraFin}`}
                          value={String(
                            horario.HoraInicio
                          ).slice(0, 5)}
                        >
                          {horario.Etiqueta ||
                            `${horario.HoraInicio} - ${horario.HoraFin}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Motivo de la autorización *
                  </label>
                  <textarea
                    value={motivoAutorizacion}
                    onChange={(event) =>
                      setMotivoAutorizacion(
                        event.target.value
                      )
                    }
                    maxLength={2000}
                    placeholder="Explique por qué el caso requiere atención excepcional un viernes."
                    className="mt-1 min-h-[110px] w-full resize-none rounded-lg border border-gray-300 p-3"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Observación adicional
                  </label>
                  <textarea
                    value={observacionAutorizacion}
                    onChange={(event) =>
                      setObservacionAutorizacion(
                        event.target.value
                      )
                    }
                    maxLength={2000}
                    placeholder="Información adicional para la trazabilidad."
                    className="mt-1 min-h-[90px] w-full resize-none rounded-lg border border-gray-300 p-3"
                  />
                </div>

                {mensajeAutorizacion && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {mensajeAutorizacion}
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={cerrarModalAutorizacion}
                  disabled={guardandoAutorizacion}
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  className="bg-amber-600 hover:bg-amber-700"
                  onClick={crearAutorizacionViernes}
                  disabled={guardandoAutorizacion}
                >
                  {guardandoAutorizacion
                    ? "Autorizando..."
                    : "Autorizar viernes"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {modalAnulacionAbierto &&
          autorizacionSeleccionada && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                <div className="border-b border-gray-200 px-6 py-5">
                  <h2 className="text-xl font-bold text-gray-900">
                    Anular autorización
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Registre el motivo por el cual esta autorización
                    ya no debe utilizarse.
                  </p>
                </div>

                <div className="space-y-4 px-6 py-5">
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    Viernes{" "}
                    {formatearFechaColombia(
                      autorizacionSeleccionada
                        .FechaAutorizada
                    )}{" "}
                    de{" "}
                    {formatearHora(
                      autorizacionSeleccionada.HoraInicio
                    )}{" "}
                    a{" "}
                    {formatearHora(
                      autorizacionSeleccionada.HoraFin
                    )}.
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">
                      Motivo de anulación *
                    </label>
                    <textarea
                      value={motivoAnulacion}
                      onChange={(event) =>
                        setMotivoAnulacion(
                          event.target.value
                        )
                      }
                      maxLength={2000}
                      placeholder="Explique por qué se anula la autorización."
                      className="mt-1 min-h-[100px] w-full resize-none rounded-lg border border-gray-300 p-3"
                    />
                  </div>

                  {mensajeAutorizacion && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {mensajeAutorizacion}
                    </div>
                  )}
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cerrarModalAnulacion}
                    disabled={guardandoAutorizacion}
                  >
                    Cancelar
                  </Button>

                  <Button
                    type="button"
                    className="bg-red-600 hover:bg-red-700"
                    onClick={anularAutorizacion}
                    disabled={guardandoAutorizacion}
                  >
                    {guardandoAutorizacion
                      ? "Anulando..."
                      : "Anular autorización"}
                  </Button>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}