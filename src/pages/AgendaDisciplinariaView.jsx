import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatearExpedienteDisciplinario } from "@/utils/formatearExpedienteDisciplinario";

const DIAS_HABILES_REPROGRAMACION = 5;

function formatearFechaInput(fecha) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatearFechaVisual(fecha) {
  if (!fecha) {
    return "—";
  }

  const [year, month, day] = String(fecha).slice(0, 10).split("-");

  if (!year || !month || !day) {
    return fecha;
  }

  return `${day}/${month}/${year}`;
}

function sumarDiasHabiles(fechaInicial, cantidadDias) {
  const resultado = new Date(fechaInicial);
  let diasSumados = 0;

  while (diasSumados < cantidadDias) {
    resultado.setDate(resultado.getDate() + 1);

    const diaSemana = resultado.getDay();

    if (diaSemana !== 0 && diaSemana !== 6) {
      diasSumados += 1;
    }
  }

  return resultado;
}

function obtenerMensajeBackend(data, mensajePorDefecto) {
  const detalle = data?.detail;

  if (typeof detalle === "string") {
    return detalle;
  }

  if (detalle && typeof detalle === "object") {
    return detalle.mensaje || mensajePorDefecto;
  }

  return mensajePorDefecto;
}

function obtenerUsuarioMovimiento() {
  try {
    const usuarioGuardado =
      localStorage.getItem("usuario") ||
      localStorage.getItem("user");

    if (usuarioGuardado) {
      const usuario = JSON.parse(usuarioGuardado);

      return (
        usuario?.NombreUsuario ||
        usuario?.nombreUsuario ||
        usuario?.Username ||
        usuario?.username ||
        usuario?.Usuario ||
        usuario?.usuario ||
        "rrll"
      );
    }
  } catch (error) {
    console.warn(
      "No fue posible obtener el usuario autenticado desde localStorage:",
      error
    );
  }

  return "rrll";
}

export default function AgendaDisciplinariaView({
  onVolver,
  onAbrirProceso,
  onAbrirAgendaGeneral,
}) {
  const API_BASE = (
    import.meta.env.VITE_API_BASE_URL || ""
  ).replace(/\/$/, "");

  const [fechaFiltro, setFechaFiltro] = useState("");
  const [agenda, setAgenda] = useState([]);
  const [total, setTotal] = useState(0);
  const [fechaConsulta, setFechaConsulta] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  const [solicitudesPendientes, setSolicitudesPendientes] = useState([]);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(false);
  const [errorSolicitudes, setErrorSolicitudes] = useState("");
  const [mostrarSolicitudesPendientes, setMostrarSolicitudesPendientes] =
    useState(true);

  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);

  const [modalReprogramarAbierto, setModalReprogramarAbierto] =
    useState(false);
  const [fechaNueva, setFechaNueva] = useState("");
  const [horaInicioNueva, setHoraInicioNueva] = useState("");
  const [motivoReprogramacion, setMotivoReprogramacion] =
    useState("");
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [guardandoReprogramacion, setGuardandoReprogramacion] =
    useState(false);
  const [errorReprogramacion, setErrorReprogramacion] = useState("");

  const [modalCancelarAbierto, setModalCancelarAbierto] =
    useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [guardandoCancelacion, setGuardandoCancelacion] =
    useState(false);
  const [errorCancelacion, setErrorCancelacion] = useState("");

  const [modalEnlaceVirtualAbierto, setModalEnlaceVirtualAbierto] =
    useState(false);
  const [eventoEnlaceVirtual, setEventoEnlaceVirtual] = useState(null);
  const [enlaceVirtual, setEnlaceVirtual] = useState("");
  const [guardandoEnlaceVirtual, setGuardandoEnlaceVirtual] =
    useState(false);
  const [errorEnlaceVirtual, setErrorEnlaceVirtual] = useState("");

  const [modalAutorizacionAbierto, setModalAutorizacionAbierto] =
    useState(false);
  const [eventoAutorizacion, setEventoAutorizacion] = useState(null);
  const [fechaAutorizada, setFechaAutorizada] = useState("");
  const [observacionAutorizacion, setObservacionAutorizacion] =
    useState("");
  const [guardandoAutorizacion, setGuardandoAutorizacion] =
    useState(false);
  const [errorAutorizacion, setErrorAutorizacion] = useState("");
  const [notificacionRechazo, setNotificacionRechazo] = useState(null);

  const usuarioMovimiento = useMemo(
    () => obtenerUsuarioMovimiento(),
    []
  );

  const fechaMinimaReprogramacion = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return formatearFechaInput(
      sumarDiasHabiles(
        hoy,
        DIAS_HABILES_REPROGRAMACION
      )
    );
  }, []);

  const obtenerEstiloEstado = (evento) => {
    const estado = String(evento?.EstadoAgenda || "")
      .trim()
      .toUpperCase();

    const color = String(evento?.ColorAgenda || "")
      .trim()
      .toUpperCase();

    if (estado === "ATENDIDO" || color === "VERDE") {
      return {
        fila: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200",
        badge:
          "bg-emerald-100 text-emerald-800 border-emerald-300",
        punto: "bg-emerald-500",
      };
    }

    if (estado === "EN_CURSO" || color === "AMARILLO") {
      return {
        fila: "bg-amber-50 hover:bg-amber-100 border-amber-200",
        badge: "bg-amber-100 text-amber-800 border-amber-300",
        punto: "bg-amber-500",
      };
    }

    if (estado === "PROGRAMADO" || color === "AZUL") {
      return {
        fila: "bg-blue-50 hover:bg-blue-100 border-blue-200",
        badge: "bg-blue-100 text-blue-800 border-blue-300",
        punto: "bg-blue-500",
      };
    }

    if (estado === "CANCELADO" || color === "ROJO") {
      return {
        fila: "bg-red-50 hover:bg-red-100 border-red-200",
        badge: "bg-red-100 text-red-800 border-red-300",
        punto: "bg-red-500",
      };
    }

    if (estado === "REPROGRAMADO" || color === "GRIS") {
      return {
        fila: "bg-gray-50 hover:bg-gray-100 border-gray-200",
        badge: "bg-gray-100 text-gray-700 border-gray-300",
        punto: "bg-gray-500",
      };
    }

    return {
      fila: "bg-white hover:bg-slate-50 border-slate-200",
      badge: "bg-slate-100 text-slate-700 border-slate-300",
      punto: "bg-slate-400",
    };
  };

  const eventoEsVirtual = (evento) =>
    String(evento?.Modalidad || "")
      .trim()
      .toUpperCase() === "VIRTUAL";

  const eventoTieneEnlaceVirtual = (evento) =>
    Boolean(
      String(
        evento?.LugarCitacion ||
          evento?.EnlaceVirtual ||
          ""
      ).trim()
    );

  const estadoPermiteAcciones = (evento) => {
    const estado = String(evento?.EstadoAgenda || "")
      .trim()
      .toUpperCase();

    return [
      "PROGRAMADO",
      "EN_CURSO",
      "REPROGRAMADO",
    ].includes(estado);
  };

  const procesarRespuestaAgenda = (data, fechaAlterna = "") => {
    setAgenda(
      Array.isArray(data?.eventos)
        ? data.eventos
        : []
    );

    setTotal(Number(data?.total || 0));

    setFechaConsulta(
      data?.fecha || fechaAlterna || ""
    );
  };

  const cargarSolicitudesPendientes = async () => {
    try {
      setLoadingSolicitudes(true);
      setErrorSolicitudes("");

      const res = await fetch(
        `${API_BASE}/solicitudes-autorizacion-agenda-disciplinaria/pendientes`
      );

      const data = await res.json().catch(() => []);

      if (!res.ok) {
        throw new Error(
          obtenerMensajeBackend(
            data,
            "No se pudieron cargar las solicitudes excepcionales pendientes."
          )
        );
      }

      setSolicitudesPendientes(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      setSolicitudesPendientes([]);
      setErrorSolicitudes(
        err?.message ||
          "Error cargando las solicitudes excepcionales pendientes."
      );
    } finally {
      setLoadingSolicitudes(false);
    }
  };

  const cargarAgendaHoy = async () => {
    try {
      setLoading(true);
      setError("");
      setMensajeExito("");

      const res = await fetch(
        `${API_BASE}/agenda-disciplinaria/hoy/listado`
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          obtenerMensajeBackend(
            data,
            "No se pudo cargar la agenda de hoy."
          )
        );
      }

      procesarRespuestaAgenda(data);
    } catch (err) {
      setError(
        err?.message ||
          "Error cargando agenda."
      );
    } finally {
      setLoading(false);
    }
  };

  const buscarPorFecha = async () => {
    try {
      if (!fechaFiltro) {
        setError("Seleccione una fecha.");
        return;
      }

      setLoading(true);
      setError("");
      setMensajeExito("");

      const res = await fetch(
        `${API_BASE}/agenda-disciplinaria/fecha/${fechaFiltro}`
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          obtenerMensajeBackend(
            data,
            "No se pudo consultar la agenda por fecha."
          )
        );
      }

      procesarRespuestaAgenda(
        data,
        fechaFiltro
      );
    } catch (err) {
      setError(
        err?.message ||
          "Error consultando agenda."
      );
    } finally {
      setLoading(false);
    }
  };

  const recargarAgendaActual = async () => {
    if (fechaFiltro) {
      await buscarPorFecha();
      return;
    }

    await cargarAgendaHoy();
  };

  const abrirProceso = (evento) => {
    if (!evento?.IdProcesoDisciplinario) {
      setError(
        "Este evento no tiene proceso disciplinario asociado."
      );
      return;
    }

    if (typeof onAbrirProceso === "function") {
      onAbrirProceso(
        evento.IdProcesoDisciplinario
      );
    }
  };

  const cerrarModalEnlaceVirtual = () => {
    if (guardandoEnlaceVirtual) {
      return;
    }

    setModalEnlaceVirtualAbierto(false);
    setEventoEnlaceVirtual(null);
    setEnlaceVirtual("");
    setErrorEnlaceVirtual("");
  };

  const abrirModalEnlaceVirtual = (evento) => {
    setEventoEnlaceVirtual(evento);
    setEnlaceVirtual(
      String(
        evento?.LugarCitacion ||
          evento?.EnlaceVirtual ||
          ""
      ).trim()
    );
    setErrorEnlaceVirtual("");
    setModalEnlaceVirtualAbierto(true);
  };

  const guardarEnlaceVirtual = async () => {
    if (
      !eventoEnlaceVirtual
        ?.IdAgendaProcesoDisciplinario
    ) {
      setErrorEnlaceVirtual(
        "No se encontró la citación virtual que desea actualizar."
      );
      return;
    }

    const enlaceNormalizado =
      enlaceVirtual.trim();

    if (!enlaceNormalizado) {
      setErrorEnlaceVirtual(
        "Ingrese el enlace de la reunión virtual."
      );
      return;
    }

    if (
      !/^https?:\/\//i.test(
        enlaceNormalizado
      )
    ) {
      setErrorEnlaceVirtual(
        "El enlace debe comenzar por http:// o https://."
      );
      return;
    }

    try {
      setGuardandoEnlaceVirtual(true);
      setErrorEnlaceVirtual("");

      const res = await fetch(
        `${API_BASE}/agenda-disciplinaria/${eventoEnlaceVirtual.IdAgendaProcesoDisciplinario}/enlace-virtual`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            EnlaceVirtual: enlaceNormalizado,
            UsuarioMovimiento:
              usuarioMovimiento,
          }),
        }
      );

      const data =
        await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          obtenerMensajeBackend(
            data,
            "No se pudo guardar el enlace de la reunión."
          )
        );
      }

      setMensajeExito(
        data?.mensaje ||
          "El enlace virtual fue registrado y se gestionó la notificación al trabajador."
      );

      cerrarModalEnlaceVirtual();
      await recargarAgendaActual();
    } catch (err) {
      setErrorEnlaceVirtual(
        err?.message ||
          "Error guardando el enlace de la reunión."
      );
    } finally {
      setGuardandoEnlaceVirtual(false);
    }
  };

  const cerrarModalReprogramar = () => {
  setModalReprogramarAbierto(false);
  setEventoSeleccionado(null);
  setFechaNueva("");
  setHoraInicioNueva("");
  setMotivoReprogramacion("");
  setHorariosDisponibles([]);
  setErrorReprogramacion("");
};

  const abrirModalReprogramar = (evento) => {
    setEventoSeleccionado(evento);
    setFechaNueva("");
    setHoraInicioNueva("");
    setMotivoReprogramacion("");
    setHorariosDisponibles([]);
    setErrorReprogramacion("");
    setModalReprogramarAbierto(true);
  };

 const cerrarModalCancelar = () => {
  setModalCancelarAbierto(false);
  setEventoSeleccionado(null);
  setMotivoCancelacion("");
  setErrorCancelacion("");
};

  const abrirModalCancelar = (evento) => {
    setEventoSeleccionado(evento);
    setMotivoCancelacion("");
    setErrorCancelacion("");
    setModalCancelarAbierto(true);
  };

  const cargarHorariosDisponibles = async (fecha) => {
    if (!fecha) {
      setHorariosDisponibles([]);
      setHoraInicioNueva("");
      return;
    }

    try {
      setLoadingHorarios(true);
      setErrorReprogramacion("");
      setHoraInicioNueva("");

      const parametrosViernes = new URLSearchParams();

      if (eventoSeleccionado?.IdRegistroPersonal) {
        parametrosViernes.set(
          "id_registro_personal",
          eventoSeleccionado.IdRegistroPersonal
        );
      }

      if (eventoSeleccionado?.IdProcesoDisciplinario) {
        parametrosViernes.set(
          "id_proceso_disciplinario",
          eventoSeleccionado.IdProcesoDisciplinario
        );
      }

      const query = parametrosViernes.toString();

      const res = await fetch(
        `${API_BASE}/agenda-disciplinaria/horarios-disponibles/${fecha}${
          query ? `?${query}` : ""
        }`
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          obtenerMensajeBackend(
            data,
            "No se pudieron consultar los horarios disponibles."
          )
        );
      }

      let horarios = Array.isArray(data?.horarios)
        ? data.horarios
        : [];

      const mismoDiaActual =
        eventoSeleccionado?.FechaEvento === fecha;

      if (
        mismoDiaActual &&
        eventoSeleccionado?.HoraInicio &&
        eventoSeleccionado?.HoraFin
      ) {
        const horaInicioActual = String(
          eventoSeleccionado.HoraInicio
        ).slice(0, 5);

        const yaExiste = horarios.some(
          (horario) =>
            String(horario?.HoraInicio || "").slice(0, 5) ===
            horaInicioActual
        );

        if (!yaExiste) {
          horarios = [
            ...horarios,
            {
              HoraInicio: horaInicioActual,
              HoraFin: String(
                eventoSeleccionado.HoraFin
              ).slice(0, 5),
              Etiqueta: `${horaInicioActual} - ${String(
                eventoSeleccionado.HoraFin
              ).slice(0, 5)} (horario actual)`,
            },
          ].sort((a, b) =>
            String(a.HoraInicio).localeCompare(
              String(b.HoraInicio)
            )
          );
        }
      }

      setHorariosDisponibles(horarios);

      if (horarios.length === 0) {
        setErrorReprogramacion(
          data?.mensaje ||
            "No existen horarios disponibles para la fecha seleccionada."
        );
      }
    } catch (err) {
      setHorariosDisponibles([]);
      setErrorReprogramacion(
        err?.message ||
          "Error consultando horarios disponibles."
      );
    } finally {
      setLoadingHorarios(false);
    }
  };

  const handleCambioFechaNueva = async (event) => {
    const nuevaFecha = event.target.value;

    setFechaNueva(nuevaFecha);
    await cargarHorariosDisponibles(nuevaFecha);
  };

  const reprogramarEvento = async () => {
    if (!eventoSeleccionado?.IdAgendaProcesoDisciplinario) {
      setErrorReprogramacion(
        "No se encontró el evento que desea reprogramar."
      );
      return;
    }

      if (!fechaNueva) {
        setErrorReprogramacion(
          "Seleccione la nueva fecha de la citación."
        );
        return;
      }

      if (fechaNueva < fechaMinimaReprogramacion) {
    setErrorReprogramacion(
      `La nueva fecha debe ser igual o posterior al ${fechaMinimaReprogramacion}.`
    );
    return;
  }

    if (!horaInicioNueva) {
      setErrorReprogramacion(
        "Seleccione un horario disponible."
      );
      return;
    }

    if (motivoReprogramacion.trim().length < 3) {
      setErrorReprogramacion(
        "Ingrese un motivo de reprogramación válido."
      );
      return;
    }

    try {
      setGuardandoReprogramacion(true);
      setErrorReprogramacion("");

      const res = await fetch(
        `${API_BASE}/agenda-disciplinaria/${eventoSeleccionado.IdAgendaProcesoDisciplinario}/reprogramar`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            FechaEventoNueva: fechaNueva,
            HoraInicioNueva: `${horaInicioNueva}:00`,
            Motivo: motivoReprogramacion.trim(),
            UsuarioMovimiento: usuarioMovimiento,
          }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          obtenerMensajeBackend(
            data,
            "No se pudo reprogramar la citación."
          )
        );
      }

    const fechaReprogramada = fechaNueva;

    cerrarModalReprogramar();

    setFechaFiltro(fechaReprogramada);

    setMensajeExito(
      "La citación fue reprogramada correctamente."
    );

    try {
      setLoading(true);

      const resAgenda = await fetch(
        `${API_BASE}/agenda-disciplinaria/fecha/${fechaReprogramada}`
      );

      const dataAgenda = await resAgenda.json().catch(() => ({}));

      if (!resAgenda.ok) {
        throw new Error(
          obtenerMensajeBackend(
            dataAgenda,
            "La citación fue reprogramada, pero no se pudo cargar la nueva fecha."
          )
        );
      }

      procesarRespuestaAgenda(
        dataAgenda,
        fechaReprogramada
      );
    } catch (errorAgenda) {
      setError(
        errorAgenda?.message ||
          "La citación fue reprogramada, pero no se pudo actualizar la agenda."
      );
    } finally {
      setLoading(false);
    }
    } catch (err) {
      setErrorReprogramacion(
        err?.message ||
          "Error reprogramando la citación."
      );
    } finally {
      setGuardandoReprogramacion(false);
    }
  };

  const cancelarEvento = async () => {
    if (!eventoSeleccionado?.IdAgendaProcesoDisciplinario) {
      setErrorCancelacion(
        "No se encontró el evento que desea cancelar."
      );
      return;
    }

    if (motivoCancelacion.trim().length < 3) {
      setErrorCancelacion(
        "Ingrese un motivo de cancelación válido."
      );
      return;
    }

    try {
      setGuardandoCancelacion(true);
      setErrorCancelacion("");

      const res = await fetch(
        `${API_BASE}/agenda-disciplinaria/${eventoSeleccionado.IdAgendaProcesoDisciplinario}/cancelar`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            Motivo: motivoCancelacion.trim(),
            UsuarioMovimiento: usuarioMovimiento,
          }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          obtenerMensajeBackend(
            data,
            "No se pudo cancelar la citación."
          )
        );
      }

      cerrarModalCancelar();
      setMensajeExito(
        "La citación fue cancelada correctamente."
      );

      await recargarAgendaActual();
    } catch (err) {
      setErrorCancelacion(
        err?.message ||
          "Error cancelando la citación."
      );
    } finally {
      setGuardandoCancelacion(false);
    }
  };

  const cerrarModalAutorizacion = () => {
    setModalAutorizacionAbierto(false);
    setEventoAutorizacion(null);
    setFechaAutorizada("");
    setObservacionAutorizacion("");
    setErrorAutorizacion("");
  };

  const abrirModalAutorizacion = (solicitud) => {
    setEventoAutorizacion({
      ...solicitud,
      NumeroIdentificacion:
        solicitud?.NumeroDocumento ||
        solicitud?.NumeroIdentificacion ||
        "",
      FechaEvento:
        solicitud?.FechaSolicitada ||
        solicitud?.FechaEvento ||
        "",
    });
    setFechaAutorizada(
      solicitud?.FechaSolicitada ||
      ""
    );
    setObservacionAutorizacion("");
    setErrorAutorizacion("");
    setModalAutorizacionAbierto(true);
  };

  const crearAutorizacionViernes = async () => {
    if (
      !eventoAutorizacion?.IdSolicitudAutorizacion ||
      !eventoAutorizacion?.IdProcesoDisciplinario ||
      !eventoAutorizacion?.IdRegistroPersonal
    ) {
      setErrorAutorizacion(
        "No se encontró la solicitud, el trabajador o el expediente que se desea autorizar."
      );
      return;
    }

    if (!fechaAutorizada) {
      setErrorAutorizacion(
        "La solicitud no tiene un viernes registrado."
      );
      return;
    }

    const fechaSeleccionada = new Date(
      `${fechaAutorizada}T12:00:00`
    );

    if (fechaSeleccionada.getDay() !== 5) {
      setErrorAutorizacion(
        "La fecha solicitada debe corresponder a un viernes."
      );
      return;
    }

    try {
      setGuardandoAutorizacion(true);
      setErrorAutorizacion("");

      const res = await fetch(
        `${API_BASE}/solicitudes-autorizacion-agenda-disciplinaria/${eventoAutorizacion.IdSolicitudAutorizacion}/aprobar`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            UsuarioResuelve: usuarioMovimiento,
            ObservacionResolucion:
              observacionAutorizacion.trim() || null,
          }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          obtenerMensajeBackend(
            data,
            "No se pudo aprobar la solicitud excepcional de viernes."
          )
        );
      }

      const expediente =
        formatearExpedienteDisciplinario(
          eventoAutorizacion.IdProcesoDisciplinario,
          eventoAutorizacion.FechaCreacion ||
            eventoAutorizacion.FechaSolicitud ||
            eventoAutorizacion.FechaSolicitada
        );

      const fechaAprobada = fechaAutorizada;

      cerrarModalAutorizacion();

      setMensajeExito(
        `Solicitud aprobada. Viernes ${formatearFechaVisual(
          fechaAprobada
        )} autorizado para el expediente ${expediente}. Operaciones podrá seleccionar un horario disponible.`
      );

      await cargarSolicitudesPendientes();
    } catch (err) {
      setErrorAutorizacion(
        err?.message ||
          "Error aprobando la solicitud excepcional."
      );
    } finally {
      setGuardandoAutorizacion(false);
    }
  };

  const rechazarSolicitudViernes = async () => {
    if (!eventoAutorizacion?.IdSolicitudAutorizacion) {
      setErrorAutorizacion(
        "No se encontró la solicitud excepcional que desea rechazar."
      );
      return;
    }

    const observacion = observacionAutorizacion.trim();

    if (observacion.length < 3) {
      setErrorAutorizacion(
        "Para rechazar la solicitud, registre en Observación de RRLL el motivo del rechazo."
      );
      return;
    }

    try {
      setGuardandoAutorizacion(true);
      setErrorAutorizacion("");

      const res = await fetch(
        `${API_BASE}/solicitudes-autorizacion-agenda-disciplinaria/${eventoAutorizacion.IdSolicitudAutorizacion}/rechazar`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            UsuarioResuelve: usuarioMovimiento,
            ObservacionResolucion: observacion,
          }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          obtenerMensajeBackend(
            data,
            "No se pudo rechazar la solicitud excepcional de viernes."
          )
        );
      }

      const expediente =
        eventoAutorizacion?.IdProcesoDisciplinario
          ? formatearExpedienteDisciplinario(
              eventoAutorizacion.IdProcesoDisciplinario,
              eventoAutorizacion.FechaCreacion ||
                eventoAutorizacion.FechaSolicitud ||
                eventoAutorizacion.FechaSolicitada
            )
          : "";

      cerrarModalAutorizacion();

      setMensajeExito(
        expediente
          ? `Solicitud de viernes rechazada para el expediente ${expediente}.`
          : "Solicitud de viernes rechazada correctamente."
      );

      setNotificacionRechazo({
        titulo: "Solicitud rechazada",
        mensaje: expediente
          ? `La solicitud excepcional de viernes del expediente ${expediente} fue rechazada correctamente.`
          : "La solicitud excepcional de viernes fue rechazada correctamente.",
      });

      await cargarSolicitudesPendientes();
    } catch (err) {
      setErrorAutorizacion(
        err?.message ||
          "Error rechazando la solicitud excepcional."
      );
    } finally {
      setGuardandoAutorizacion(false);
    }
  };

  useEffect(() => {
    cargarAgendaHoy();
    cargarSolicitudesPendientes();
  }, []);

  useEffect(() => {
    if (!notificacionRechazo) {
      return undefined;
    }

    const temporizador = window.setTimeout(() => {
      setNotificacionRechazo(null);
    }, 5000);

    return () => window.clearTimeout(temporizador);
  }, [notificacionRechazo]);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-blue-600">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
              Relaciones Laborales
            </p>

            <h2 className="mt-1 text-3xl font-bold text-gray-800">
              Agenda Disciplinaria
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Gestión diaria de citaciones y acceso a la agenda general.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onVolver}
            className="rounded-xl border-slate-300 bg-white font-semibold text-slate-700 hover:bg-slate-100"
          >
            Volver
          </Button>
        </div>

        <div className="mb-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.8fr_0.9fr_1fr_0.75fr] xl:items-end">
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Fecha
              </label>

              <input
                type="date"
                value={fechaFiltro}
                onChange={(event) =>
                  setFechaFiltro(
                    event.target.value
                  )
                }
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <Button
              type="button"
              onClick={buscarPorFecha}
              disabled={loading}
              className="h-[42px] rounded-xl bg-emerald-700 font-semibold hover:bg-emerald-800"
            >
              Buscar por fecha
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={cargarAgendaHoy}
              disabled={loading}
              className="h-[42px] rounded-xl border-slate-300 bg-white font-semibold text-slate-700 hover:bg-slate-100"
            >
              Agenda de hoy
            </Button>

            <Button
              type="button"
              onClick={() => {
                if (
                  typeof onAbrirAgendaGeneral ===
                  "function"
                ) {
                  onAbrirAgendaGeneral();
                }
              }}
              className="h-[42px] rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 font-semibold text-white shadow-md transition hover:from-emerald-800 hover:to-teal-800 hover:shadow-lg"
            >
              Ver agenda general
            </Button>

           <div className="flex min-h-[42px] items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm text-gray-600 shadow-sm">
            <p>
              Eventos de la fecha:{" "}
              <b className="text-lg text-slate-900">
                {total}
              </b>
            </p>
          </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {mensajeExito && (
            <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm font-semibold">
              {mensajeExito}
            </div>
          )}
        </div>

        <div className="mb-5 overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-amber-200 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
                Relaciones Laborales
              </p>
              <h3 className="mt-1 text-lg font-bold text-gray-800">
                Solicitudes excepcionales de viernes
              </h3>
              <p className="mt-1 text-sm text-amber-800">
                Operaciones envía estas solicitudes para que RRLL apruebe o rechace el viernes solicitado. El horario será seleccionado posteriormente por Operaciones.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="inline-flex min-h-10 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800">
                Pendientes:{" "}
                <span className="ml-2 text-lg font-bold">
                  {solicitudesPendientes.length}
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setMostrarSolicitudesPendientes(
                    (valorActual) => !valorActual
                  )
                }
                className="min-h-10 rounded-xl border-amber-300 bg-white font-semibold text-amber-800 hover:bg-amber-100"
              >
                {mostrarSolicitudesPendientes
                  ? "Ocultar solicitudes"
                  : "Mostrar solicitudes"}
              </Button>
            </div>
          </div>

          {mostrarSolicitudesPendientes && (
            <>
              {errorSolicitudes && (
                <div className="m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorSolicitudes}
                </div>
              )}

              {loadingSolicitudes ? (
                <div className="px-5 py-6 text-center text-sm text-gray-500">
                  Cargando solicitudes pendientes...
                </div>
              ) : solicitudesPendientes.length === 0 ? (
                <div className="px-5 py-6 text-center">
                  <p className="font-semibold text-gray-700">
                    No hay solicitudes excepcionales pendientes.
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Cuando Operaciones solicite atención para un viernes, aparecerá aquí para revisión de RRLL.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {solicitudesPendientes.map((solicitud) => (
                    <div
                      key={solicitud.IdSolicitudAutorizacion}
                      className="grid grid-cols-1 gap-3 px-5 py-3 transition hover:bg-amber-50/40 xl:grid-cols-[1.4fr_0.8fr_1fr_0.8fr_auto] xl:items-center"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase text-gray-500">
                          Trabajador
                        </p>
                        <p className="mt-0.5 break-words font-bold text-gray-900">
                          {solicitud.NombreCompleto || "—"}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-600">
                          {solicitud.TipoDocumento || "CC"}{" "}
                          {solicitud.NumeroDocumento || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase text-gray-500">
                          Expediente
                        </p>
                        <p className="mt-0.5 font-bold text-gray-800">
                          {solicitud?.IdProcesoDisciplinario
                            ? formatearExpedienteDisciplinario(
                                solicitud.IdProcesoDisciplinario,
                                solicitud.FechaCreacion ||
                                  solicitud.FechaSolicitud ||
                                  solicitud.FechaSolicitada
                              )
                            : "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase text-gray-500">
                          Viernes solicitado
                        </p>
                        <p className="mt-0.5 font-bold text-gray-800">
                          {formatearFechaVisual(
                            solicitud.FechaSolicitada
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase text-gray-500">
                          Estado
                        </p>
                        <span className="mt-0.5 inline-flex rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                          {solicitud.EstadoSolicitud || "PENDIENTE"}
                        </span>
                      </div>

                      <Button
                        type="button"
                        onClick={() =>
                          abrirModalAutorizacion(
                            solicitud
                          )
                        }
                        className="w-full rounded-xl bg-emerald-700 font-semibold text-white hover:bg-emerald-800 xl:w-auto"
                      >
                        Revisar solicitud
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-5">
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm font-semibold text-blue-800">
                Programado
              </span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Pendiente por iniciar
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm font-semibold text-amber-800">
                En curso
              </span>
            </div>
            <p className="text-xs text-amber-700 mt-1">
              RRLL inició la gestión
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-500" />
              <span className="text-sm font-semibold text-gray-700">
                Reprogramado
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Fecha u hora modificada
            </p>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm font-semibold text-red-800">
                Cancelado
              </span>
            </div>
            <p className="text-xs text-red-700 mt-1">
              Citación sin atención
            </p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm font-semibold text-emerald-800">
                Atendido
              </span>
            </div>
            <p className="text-xs text-emerald-700 mt-1">
              Expediente finalizado
            </p>
          </div>
        </div>

        <div className="mb-3 text-xs text-gray-500">
          Haz clic sobre una fila para abrir el expediente. Las acciones permiten reprogramar o cancelar una citación pendiente.
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 text-left">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left">
                  Hora
                </th>
                <th className="px-4 py-3 text-left">
                  Trabajador
                </th>
                <th className="px-4 py-3 text-left">
                  Expediente disciplinario
                </th>
                <th className="px-4 py-3 text-left">
                  Documento
                </th>
                <th className="px-4 py-3 text-left">
                  Evento
                </th>
                <th className="px-4 py-3 text-left">
                  Modalidad
                </th>
                <th className="px-4 py-3 text-left">
                  Estado
                </th>
                <th className="px-4 py-3 text-center">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-gray-500 bg-white"
                  >
                    Cargando agenda...
                  </td>
                </tr>
              ) : agenda.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-gray-500 bg-white"
                  >
                    No hay eventos para la fecha consultada.
                  </td>
                </tr>
              ) : (
                agenda.map((evento) => {
                  const estilo =
                    obtenerEstiloEstado(evento);

                  const permiteAcciones =
                    estadoPermiteAcciones(evento);

                  return (
                    <tr
                      key={
                        evento.IdAgendaProcesoDisciplinario
                      }
                      onClick={() =>
                        abrirProceso(evento)
                      }
                      className={`border-t cursor-pointer transition-colors ${estilo.fila}`}
                    >
                      <td className="px-4 py-3">
                        {evento.FechaEvento || "—"}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {evento.HoraInicio || "—"} -{" "}
                        {evento.HoraFin || "—"}
                      </td>

                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {evento.NombreCompleto || "—"}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-800">
                        {evento?.IdProcesoDisciplinario
                          ? formatearExpedienteDisciplinario(
                              evento.IdProcesoDisciplinario,
                              evento.FechaCreacion ||
                                evento.FechaEvento
                            )
                          : "—"}
                      </td>

                      <td className="px-4 py-3">
                        {evento.NumeroIdentificacion || "—"}
                      </td>

                      <td className="px-4 py-3">
                        {evento.TipoEvento || "—"}
                      </td>

                      <td className="px-4 py-3">
                        {eventoEsVirtual(evento) ? (
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-blue-800">
                              Virtual
                            </span>

                            <span
                              className={`inline-flex w-fit rounded-full border px-2 py-0.5 text-[11px] font-bold ${
                                eventoTieneEnlaceVirtual(
                                  evento
                                )
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-amber-200 bg-amber-50 text-amber-700"
                              }`}
                            >
                              {eventoTieneEnlaceVirtual(
                                evento
                              )
                                ? "Enlace asignado"
                                : "Pendiente enlace RRLL"}
                            </span>
                          </div>
                        ) : (
                          evento.Modalidad || "—"
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold ${estilo.badge}`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${estilo.punto}`}
                          />
                          {evento.EstadoAgenda || "SIN ESTADO"}
                        </span>
                      </td>

                      <td
                        className="px-4 py-3"
                        onClick={(event) =>
                          event.stopPropagation()
                        }
                      >
                        {permiteAcciones ? (
                          <div className="flex flex-col 2xl:flex-row justify-center gap-2 min-w-[340px]">
                            {eventoEsVirtual(
                              evento
                            ) &&
                              !eventoTieneEnlaceVirtual(
                                evento
                              ) && (
                                <Button
                                  type="button"
                                  className="bg-blue-700 text-white hover:bg-blue-800"
                                  onClick={() =>
                                    abrirModalEnlaceVirtual(
                                      evento
                                    )
                                  }
                                >
                                  Agregar enlace
                                </Button>
                              )}

                            <Button
                              type="button"
                              variant="outline"
                              className="border-gray-300 text-gray-700 hover:bg-gray-100"
                              onClick={() =>
                                abrirModalReprogramar(
                                  evento
                                )
                              }
                            >
                              Reprogramar
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              className="border-red-300 text-red-700 hover:bg-red-50"
                              onClick={() =>
                                abrirModalCancelar(
                                  evento
                                )
                              }
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <p className="text-center text-xs text-gray-500">
                            Sin acciones
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalEnlaceVirtualAbierto &&
        eventoEnlaceVirtual && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="border-b border-gray-200 px-6 py-5">
                <p className="text-sm font-semibold text-blue-700">
                  Relaciones Laborales
                </p>

                <h3 className="text-xl font-bold text-gray-800">
                  Agregar enlace de reunión virtual
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Registra el enlace definitivo para completar la citación y notificar al trabajador.
                </p>
              </div>

              <div className="space-y-5 px-6 py-5">
                <div className="grid grid-cols-1 gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase text-blue-700">
                      Trabajador
                    </p>

                    <p className="mt-1 font-bold text-gray-800">
                      {eventoEnlaceVirtual
                        .NombreCompleto ||
                        "—"}
                    </p>

                    <p className="text-sm text-gray-600">
                      Documento:{" "}
                      {eventoEnlaceVirtual
                        .NumeroIdentificacion ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-blue-700">
                      Citación
                    </p>

                    <p className="mt-1 font-bold text-gray-800">
                      {eventoEnlaceVirtual
                        .FechaEvento ||
                        "—"}{" "}
                      ·{" "}
                      {eventoEnlaceVirtual
                        .HoraInicio ||
                        "—"}
                    </p>

                    <p className="text-sm text-gray-600">
                      Modalidad: Virtual
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="font-semibold text-amber-800">
                    Notificación pendiente
                  </p>

                  <p className="mt-1 text-sm leading-relaxed text-amber-700">
                    El trabajador todavía no debe recibir la citación virtual. Al guardar este enlace, el sistema gestionará el envío del correo con la fecha, hora y enlace de conexión.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="enlaceVirtualRRLL"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Enlace de la reunión *
                  </label>

                  <input
                    id="enlaceVirtualRRLL"
                    type="url"
                    value={enlaceVirtual}
                    onChange={(event) => {
                      setEnlaceVirtual(
                        event.target.value
                      );
                      setErrorEnlaceVirtual("");
                    }}
                    placeholder="https://meet.google.com/... o https://teams.microsoft.com/..."
                    className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <p className="mt-2 text-xs text-gray-500">
                    Usa el enlace completo generado en la plataforma de reunión.
                  </p>
                </div>

                {errorEnlaceVirtual && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorEnlaceVirtual}
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={
                    cerrarModalEnlaceVirtual
                  }
                  disabled={
                    guardandoEnlaceVirtual
                  }
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  className="bg-blue-700 text-white hover:bg-blue-800"
                  onClick={
                    guardarEnlaceVirtual
                  }
                  disabled={
                    guardandoEnlaceVirtual
                  }
                >
                  {guardandoEnlaceVirtual
                    ? "Guardando y notificando..."
                    : "Guardar enlace y notificar"}
                </Button>
              </div>
            </div>
          </div>
        )}

      {modalAutorizacionAbierto && eventoAutorizacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 px-6 py-5">
              <p className="text-sm font-semibold text-emerald-700">
                Relaciones Laborales
              </p>

              <h3 className="text-xl font-bold text-gray-800">
                Revisar solicitud excepcional de viernes
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Operaciones solicitó atención para este viernes. RRLL debe aprobar o rechazar la fecha; el horario será seleccionado posteriormente por Operaciones.
              </p>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-emerald-700">
                    Trabajador
                  </p>

                  <p className="mt-1 font-bold text-gray-800">
                    {eventoAutorizacion.NombreCompleto || "—"}
                  </p>

                  <p className="text-sm text-gray-600">
                    Documento:{" "}
                    {eventoAutorizacion.NumeroDocumento ||
                      eventoAutorizacion.NumeroIdentificacion ||
                      "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-emerald-700">
                    Expediente disciplinario
                  </p>

                  <p className="mt-1 font-bold text-gray-800">
                    {formatearExpedienteDisciplinario(
                      eventoAutorizacion.IdProcesoDisciplinario,
                      eventoAutorizacion.FechaCreacion ||
                        eventoAutorizacion.FechaSolicitud ||
                        eventoAutorizacion.FechaSolicitada
                    )}
                  </p>

                  <p className="text-sm text-gray-600">
                    Solicitud #{eventoAutorizacion.IdSolicitudAutorizacion}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-semibold text-amber-800">
                  Viernes solicitado por Operaciones
                </p>

                <p className="mt-1 text-lg font-bold text-gray-900">
                  {formatearFechaVisual(fechaAutorizada)}
                </p>

                <div className="mt-3 rounded-lg border border-amber-200 bg-white/70 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                    Motivo informado por Operaciones
                  </p>

                  <p className="mt-1 text-sm leading-relaxed text-gray-800">
                    {eventoAutorizacion.MotivoSolicitud ||
                      "Solicitud excepcional enviada por Operaciones."}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="font-semibold text-blue-800">
                  Aprobación de fecha
                </p>

                <p className="mt-1 text-sm leading-relaxed text-blue-700">
                  Al aprobar, RRLL autoriza únicamente el viernes solicitado. Operaciones seleccionará después uno de los horarios que se encuentre disponible para esa fecha.
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Observación de RRLL
                </label>

                <p className="mt-1 text-xs text-gray-500">
                  Opcional para aprobar. Obligatoria si la solicitud será rechazada.
                </p>

                <textarea
                  value={observacionAutorizacion}
                  onChange={(event) =>
                    setObservacionAutorizacion(
                      event.target.value
                    )
                  }
                  placeholder="Registra una observación. Si vas a rechazar la solicitud, explica aquí el motivo del rechazo."
                  className="mt-1 min-h-[100px] w-full resize-none rounded-lg border border-gray-300 p-3"
                  maxLength={2000}
                />

                <p className="mt-1 text-right text-xs text-gray-500">
                  {observacionAutorizacion.length}/2000
                </p>
              </div>

              {errorAutorizacion && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorAutorizacion}
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
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
                onClick={rechazarSolicitudViernes}
                disabled={guardandoAutorizacion}
              >
                {guardandoAutorizacion
                  ? "Procesando..."
                  : "Rechazar solicitud"}
              </Button>

              <Button
                type="button"
                className="bg-emerald-700 hover:bg-emerald-800"
                onClick={crearAutorizacionViernes}
                disabled={guardandoAutorizacion}
              >
                {guardandoAutorizacion
                  ? "Procesando..."
                  : "Aprobar viernes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {notificacionRechazo && (
        <div className="fixed bottom-5 right-5 z-[70] w-[calc(100%-2.5rem)] max-w-sm rounded-2xl border border-red-200 bg-white p-5 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-xl font-bold text-red-700">
              !
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-bold text-gray-900">
                {notificacionRechazo.titulo}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                {notificacionRechazo.mensaje}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setNotificacionRechazo(null)}
              className="shrink-0 rounded-md px-2 py-1 text-lg leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Cerrar notificación"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {modalReprogramarAbierto && eventoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 px-6 py-5">
              <h3 className="text-xl font-bold text-gray-800">
                Reprogramar citación
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {eventoSeleccionado.NombreCompleto || "Trabajador"} ·{" "}
                {eventoSeleccionado?.IdProcesoDisciplinario
                  ? formatearExpedienteDisciplinario(
                      eventoSeleccionado.IdProcesoDisciplinario,
                      eventoSeleccionado.FechaCreacion ||
                        eventoSeleccionado.FechaEvento
                    )
                  : "Sin expediente"} ·{" "}
                {eventoSeleccionado.FechaEvento || "—"} ·{" "}
                {eventoSeleccionado.HoraInicio || "—"} -{" "}
                {eventoSeleccionado.HoraFin || "—"}
              </p>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="font-semibold text-blue-800">
                  Regla de reprogramación
                </p>
                <p className="mt-1 text-sm text-blue-700">
                  La nueva cita debe programarse como mínimo cinco días hábiles después de hoy. Cada atención dura 40 minutos.
                </p>
                <p className="mt-2 text-sm text-blue-800">
                  Fecha mínima permitida:{" "}
                  <b>{fechaMinimaReprogramacion}</b>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Nueva fecha
                  </label>
                  <input
                    type="date"
                    min={fechaMinimaReprogramacion}
                    value={fechaNueva}
                    onChange={handleCambioFechaNueva}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Horario disponible
                  </label>
                  <select
                    value={horaInicioNueva}
                    onChange={(event) =>
                      setHoraInicioNueva(
                        event.target.value
                      )
                    }
                    disabled={
                      !fechaNueva ||
                      loadingHorarios
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 disabled:bg-gray-100"
                  >
                    <option value="">
                      {loadingHorarios
                        ? "Consultando horarios..."
                        : "Seleccione un horario"}
                    </option>

                    {horariosDisponibles.map(
                      (horario) => (
                        <option
                          key={`${horario.HoraInicio}-${horario.HoraFin}`}
                          value={String(
                            horario.HoraInicio
                          ).slice(0, 5)}
                        >
                          {horario.Etiqueta}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Motivo de reprogramación
                </label>
                <textarea
                  value={motivoReprogramacion}
                  onChange={(event) =>
                    setMotivoReprogramacion(
                      event.target.value
                    )
                  }
                  placeholder="Explique por qué debe cambiarse la fecha u hora de la citación."
                  className="mt-1 min-h-[110px] w-full resize-none rounded-lg border border-gray-300 p-3"
                  maxLength={1000}
                />
                <p className="mt-1 text-right text-xs text-gray-500">
                  {motivoReprogramacion.length}/1000
                </p>
              </div>

              {errorReprogramacion && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorReprogramacion}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={cerrarModalReprogramar}
                disabled={guardandoReprogramacion}
              >
                Cerrar
              </Button>

              <Button
                type="button"
                className="bg-gray-700 hover:bg-gray-800"
                onClick={reprogramarEvento}
                disabled={
                  guardandoReprogramacion ||
                  loadingHorarios
                }
              >
                {guardandoReprogramacion
                  ? "Reprogramando..."
                  : "Confirmar reprogramación"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {modalCancelarAbierto && eventoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 px-6 py-5">
              <h3 className="text-xl font-bold text-red-800">
                Cancelar citación
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {eventoSeleccionado.NombreCompleto || "Trabajador"} ·{" "}
                {eventoSeleccionado?.IdProcesoDisciplinario
                  ? formatearExpedienteDisciplinario(
                      eventoSeleccionado.IdProcesoDisciplinario,
                      eventoSeleccionado.FechaCreacion ||
                        eventoSeleccionado.FechaEvento
                    )
                  : "Sin expediente"} ·{" "}
                {eventoSeleccionado.FechaEvento || "—"} ·{" "}
                {eventoSeleccionado.HoraInicio || "—"} -{" "}
                {eventoSeleccionado.HoraFin || "—"}
              </p>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="font-semibold text-red-800">
                  Confirme la cancelación
                </p>
                <p className="mt-1 text-sm text-red-700">
                  La cita quedará visible en estado CANCELADO y el horario volverá a quedar disponible para otra persona.
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Motivo de cancelación
                </label>
                <textarea
                  value={motivoCancelacion}
                  onChange={(event) =>
                    setMotivoCancelacion(
                      event.target.value
                    )
                  }
                  placeholder="Explique por qué debe cancelarse la citación."
                  className="mt-1 min-h-[120px] w-full resize-none rounded-lg border border-gray-300 p-3"
                  maxLength={1000}
                />
                <p className="mt-1 text-right text-xs text-gray-500">
                  {motivoCancelacion.length}/1000
                </p>
              </div>

              {errorCancelacion && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorCancelacion}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={cerrarModalCancelar}
                disabled={guardandoCancelacion}
              >
                Volver
              </Button>

              <Button
                type="button"
                className="bg-red-700 hover:bg-red-800"
                onClick={cancelarEvento}
                disabled={guardandoCancelacion}
              >
                {guardandoCancelacion
                  ? "Cancelando..."
                  : "Confirmar cancelación"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}