import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import IniciarProcesoDisciplinarioView from "@/pages/IniciarProcesoDisciplinarioView";
import IndicadoresProcesosDisciplinariosView from "@/pages/IndicadoresProcesosDisciplinariosView";
import AgendaDisciplinariaView from "@/pages/AgendaDisciplinariaView";
import AgendaGeneralRRLLView from "@/components/AgendaGeneralRRLLView";


const HORARIOS_SOLICITUD_VIERNES = [
  { value: "07:10|07:50", label: "07:10 a. m. - 07:50 a. m." },
  { value: "07:50|08:30", label: "07:50 a. m. - 08:30 a. m." },
  { value: "08:30|09:10", label: "08:30 a. m. - 09:10 a. m." },
  { value: "09:10|09:50", label: "09:10 a. m. - 09:50 a. m." },
  { value: "09:50|10:30", label: "09:50 a. m. - 10:30 a. m." },
  { value: "10:30|11:10", label: "10:30 a. m. - 11:10 a. m." },
  { value: "11:10|11:50", label: "11:10 a. m. - 11:50 a. m." },
  { value: "11:50|12:30", label: "11:50 a. m. - 12:30 p. m." },
  { value: "14:00|14:40", label: "02:00 p. m. - 02:40 p. m." },
  { value: "14:40|15:20", label: "02:40 p. m. - 03:20 p. m." },
  { value: "15:20|16:00", label: "03:20 p. m. - 04:00 p. m." },
];


const formatearFechaSolicitud = (fecha) => {
  if (!fecha) return "Sin fecha";

  const partes = String(fecha).slice(0, 10).split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};


const obtenerMensajeErrorApi = (data, mensajeDefecto) => {
  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (data?.detail?.mensaje) {
    return data.detail.mensaje;
  }

  if (data?.message) {
    return data.message;
  }

  return mensajeDefecto;
};


export default function ProcesosDisciplinariosView({
  onBack,
  idProcesoDesdeAgenda = null,
}) {
  const API_BASE = (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    ""
  ).replace(/\/$/, "");

  const [vista, setVista] = useState(
    idProcesoDesdeAgenda ? "proceso" : "inicio"
  );

  const [idProcesoAgenda, setIdProcesoAgenda] = useState(
    idProcesoDesdeAgenda
  );

  const [
    fechaInicioExcelDisciplinarios,
    setFechaInicioExcelDisciplinarios,
  ] = useState("");

  const [
    fechaFinExcelDisciplinarios,
    setFechaFinExcelDisciplinarios,
  ] = useState("");

  const [solicitudesViernes, setSolicitudesViernes] = useState([]);
  const [
    loadingSolicitudesViernes,
    setLoadingSolicitudesViernes,
  ] = useState(false);

  const [
    errorSolicitudesViernes,
    setErrorSolicitudesViernes,
  ] = useState("");

  const [
    solicitudSeleccionada,
    setSolicitudSeleccionada,
  ] = useState(null);

  const [accionSolicitud, setAccionSolicitud] = useState("");
  const [horarioSolicitud, setHorarioSolicitud] = useState("");
  const [
    observacionSolicitud,
    setObservacionSolicitud,
  ] = useState("");

  const [
    procesandoSolicitud,
    setProcesandoSolicitud,
  ] = useState(false);


  const abrirProcesoDesdeAgenda = (idProceso) => {
    setIdProcesoAgenda(idProceso);
    setVista("proceso");
  };


  const cargarSolicitudesViernes = async () => {
    try {
      setLoadingSolicitudesViernes(true);
      setErrorSolicitudesViernes("");

      const response = await fetch(
        `${API_BASE}/solicitudes-autorizacion-agenda-disciplinaria/pendientes`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(
          obtenerMensajeErrorApi(
            data,
            "No fue posible consultar las solicitudes pendientes."
          )
        );
      }

      const solicitudesBase = Array.isArray(data)
        ? data
        : [];

      const solicitudesEnriquecidas = await Promise.all(
        solicitudesBase.map(async (solicitud) => {
          const nombreBackend = String(
            solicitud?.NombreCompleto || ""
          ).trim();

          const numeroBackend = String(
            solicitud?.NumeroDocumento || ""
          ).trim();

          const tipoBackend = String(
            solicitud?.TipoDocumento || ""
          ).trim();

          if (nombreBackend || numeroBackend) {
            return {
              ...solicitud,
              NombreCompletoTrabajador:
                nombreBackend ||
                `Registro #${solicitud.IdRegistroPersonal}`,
              NumeroDocumentoTrabajador:
                numeroBackend,
              TipoDocumentoTrabajador:
                tipoBackend || "CC",
            };
          }

          try {
            const idProceso =
              solicitud?.IdProcesoDisciplinario;

            if (!idProceso) {
              return solicitud;
            }

            const respuestaExpediente = await fetch(
              `${API_BASE}/procesos-disciplinarios/${idProceso}/expediente`,
              {
                method: "GET",
                headers: {
                  Accept: "application/json",
                },
              }
            );

            if (!respuestaExpediente.ok) {
              return solicitud;
            }

            const expediente =
              await respuestaExpediente.json();

            const trabajador =
              expediente?.trabajador ||
              expediente?.Trabajador ||
              expediente?.datosTrabajador ||
              expediente?.RegistroPersonal ||
              expediente;

            const nombreCompleto = String(
              trabajador?.NombreCompleto ||
                expediente?.NombreCompleto ||
                `${trabajador?.Nombres || expediente?.Nombres || ""} ${
                  trabajador?.Apellidos ||
                  expediente?.Apellidos ||
                  ""
                }`
            ).trim();

            const numeroDocumento = String(
              trabajador?.NumeroDocumento ||
                trabajador?.NumeroIdentificacion ||
                trabajador?.Identificacion ||
                expediente?.NumeroDocumento ||
                expediente?.NumeroIdentificacion ||
                expediente?.Identificacion ||
                ""
            ).trim();

            const tiposDocumento = {
              1: "CC",
              2: "CE",
              3: "PPT",
              4: "TI",
            };

            const tipoDocumento = String(
              trabajador?.TipoDocumento ||
                trabajador?.NombreTipoIdentificacion ||
                expediente?.TipoDocumento ||
                expediente?.NombreTipoIdentificacion ||
                tiposDocumento[
                  Number(
                    trabajador?.IdTipoIdentificacion ||
                      expediente?.IdTipoIdentificacion
                  )
                ] ||
                "CC"
            ).trim();

            return {
              ...solicitud,
              NombreCompletoTrabajador:
                nombreCompleto ||
                `Registro #${solicitud.IdRegistroPersonal}`,
              NumeroDocumentoTrabajador:
                numeroDocumento,
              TipoDocumentoTrabajador:
                tipoDocumento || "CC",
            };
          } catch (error) {
            console.error(
              "No fue posible consultar el trabajador de la solicitud:",
              error
            );

            return solicitud;
          }
        })
      );

      setSolicitudesViernes(
        solicitudesEnriquecidas
      );
    } catch (error) {
      console.error(
        "Error consultando solicitudes de viernes:",
        error
      );

      setSolicitudesViernes([]);

      setErrorSolicitudesViernes(
        error?.message ||
          "No fue posible consultar las solicitudes pendientes."
      );
    } finally {
      setLoadingSolicitudesViernes(false);
    }
  };


  useEffect(() => {
    if (vista === "solicitudes_viernes") {
      cargarSolicitudesViernes();
    }
  }, [vista]);


  const abrirDecisionSolicitud = (
    solicitud,
    accion
  ) => {
    setSolicitudSeleccionada(solicitud);
    setAccionSolicitud(accion);
    setHorarioSolicitud("");
    setObservacionSolicitud("");
  };


  const cerrarDecisionSolicitud = () => {
    if (procesandoSolicitud) {
      return;
    }

    setSolicitudSeleccionada(null);
    setAccionSolicitud("");
    setHorarioSolicitud("");
    setObservacionSolicitud("");
  };


  const resolverSolicitudViernes = async () => {
    if (
      !solicitudSeleccionada?.IdSolicitudAutorizacion
    ) {
      return;
    }

    if (
      accionSolicitud === "aprobar" &&
      !horarioSolicitud
    ) {
      alert(
        "Debe seleccionar el horario que se habilitará."
      );
      return;
    }

    if (
      accionSolicitud === "rechazar" &&
      observacionSolicitud.trim().length < 5
    ) {
      alert(
        "Debe escribir el motivo del rechazo."
      );
      return;
    }

    try {
      setProcesandoSolicitud(true);

      const idSolicitud =
        solicitudSeleccionada.IdSolicitudAutorizacion;

      const endpoint =
        accionSolicitud === "aprobar"
          ? `${API_BASE}/solicitudes-autorizacion-agenda-disciplinaria/${idSolicitud}/aprobar`
          : `${API_BASE}/solicitudes-autorizacion-agenda-disciplinaria/${idSolicitud}/rechazar`;

      let body;

      if (accionSolicitud === "aprobar") {
        const [horaInicio, horaFin] =
          horarioSolicitud.split("|");

        body = {
          HoraInicio: horaInicio,
          HoraFin: horaFin,
          UsuarioResuelve: "rrll",
          ObservacionResolucion:
            observacionSolicitud.trim() || null,
        };
      } else {
        body = {
          UsuarioResuelve: "rrll",
          ObservacionResolucion:
            observacionSolicitud.trim(),
        };
      }

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          obtenerMensajeErrorApi(
            data,
            accionSolicitud === "aprobar"
              ? "No fue posible aprobar la solicitud."
              : "No fue posible rechazar la solicitud."
          )
        );
      }

      alert(
        accionSolicitud === "aprobar"
          ? "Solicitud aprobada correctamente. El viernes y horario quedaron habilitados."
          : "Solicitud rechazada correctamente."
      );

      cerrarDecisionSolicitud();

      await cargarSolicitudesViernes();
    } catch (error) {
      console.error(
        "Error resolviendo solicitud de viernes:",
        error
      );

      alert(
        error?.message ||
          "No fue posible resolver la solicitud."
      );
    } finally {
      setProcesandoSolicitud(false);
    }
  };


  const handleDescargarExcelDisciplinarios =
    async () => {
      try {
        if (
          !fechaInicioExcelDisciplinarios ||
          !fechaFinExcelDisciplinarios
        ) {
          alert(
            "Debes seleccionar ambas fechas."
          );
          return;
        }

        if (
          fechaInicioExcelDisciplinarios >
          fechaFinExcelDisciplinarios
        ) {
          alert(
            "La fecha de inicio no puede ser mayor que la fecha final."
          );
          return;
        }

        const url =
          `${API_BASE}/rrll-excel/exportar-procesos-disciplinarios` +
          `?fecha_inicio=${fechaInicioExcelDisciplinarios}` +
          `&fecha_fin=${fechaFinExcelDisciplinarios}`;

        const response = await fetch(url, {
          method: "GET",
        });

        if (!response.ok) {
          const errorText =
            await response.text();

          throw new Error(
            errorText ||
              "No se pudo descargar el Excel de procesos disciplinarios."
          );
        }

        const blob = await response.blob();

        const contentDisposition =
          response.headers.get(
            "Content-Disposition"
          ) || "";

        const matchNombre =
          contentDisposition.match(
            /filename="?([^"]+)"?/i
          );

        const nombreArchivo =
          matchNombre?.[1] ||
          `reporte_procesos_disciplinarios_${fechaInicioExcelDisciplinarios}_a_${fechaFinExcelDisciplinarios}.xlsx`;

        const objectUrl =
          window.URL.createObjectURL(blob);

        const link =
          document.createElement("a");

        link.href = objectUrl;
        link.download = nombreArchivo;

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(
          objectUrl
        );
      } catch (error) {
        console.error(
          "Error al descargar Excel de procesos disciplinarios:",
          error
        );

        alert(
          error?.message ||
            "No se pudo descargar el Excel de procesos disciplinarios."
        );
      }
    };


  if (vista === "proceso") {
    return (
      <IniciarProcesoDisciplinarioView
        onBack={() => {
          setIdProcesoAgenda(null);
          setVista("agenda_disciplinaria");
        }}
        idProcesoDesdeAgenda={idProcesoAgenda}
      />
    );
  }


  if (vista === "indicadores") {
    return (
      <IndicadoresProcesosDisciplinariosView
        onBack={() => setVista("inicio")}
      />
    );
  }


  if (vista === "agenda_disciplinaria") {
    return (
      <AgendaDisciplinariaView
        onVolver={() => {
          setIdProcesoAgenda(null);
          setVista("inicio");
        }}
        onAbrirAgendaGeneral={() => {
          setIdProcesoAgenda(null);
          setVista("agenda_general_rrll");
        }}
        onAbrirProceso={abrirProcesoDesdeAgenda}
      />
    );
  }


  if (vista === "agenda_general_rrll") {
    return (
      <AgendaGeneralRRLLView
        onVolver={() => {
          setIdProcesoAgenda(null);
          setVista("agenda_disciplinaria");
        }}
        onAbrirProceso={abrirProcesoDesdeAgenda}
      />
    );
  }


  if (vista === "solicitudes_viernes") {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-white rounded-2xl shadow-xl p-5 md:p-8 border-t-4 border-amber-500">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700">
                Procesos Disciplinarios
              </p>

              <h2 className="text-2xl font-bold text-gray-800">
                Solicitudes de autorización para viernes
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Revise los casos críticos enviados por Operaciones y apruebe o rechace cada solicitud.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setVista("inicio")}
              className="w-full md:w-auto"
            >
              Volver
            </Button>
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-amber-900">
                Solicitudes pendientes
              </p>

              <p className="text-sm text-amber-800">
                Al aprobar, seleccione uno de los bloques de 40 minutos disponibles.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={cargarSolicitudesViernes}
              disabled={loadingSolicitudesViernes}
              className="w-full border-amber-400 text-amber-800 hover:bg-amber-100 md:w-auto"
            >
              {loadingSolicitudesViernes
                ? "Actualizando..."
                : "Actualizar"}
            </Button>
          </div>

          {errorSolicitudesViernes ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errorSolicitudesViernes}
            </div>
          ) : null}

          {loadingSolicitudesViernes ? (
            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
              Consultando solicitudes pendientes...
            </div>
          ) : solicitudesViernes.length === 0 ? (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
              <p className="font-semibold text-emerald-800">
                No hay solicitudes pendientes.
              </p>

              <p className="mt-1 text-sm text-emerald-700">
                Las nuevas solicitudes enviadas por Operaciones aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
              {solicitudesViernes.map(
                (solicitud) => (
                  <article
                    key={
                      solicitud.IdSolicitudAutorizacion
                    }
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Solicitud #
                          {
                            solicitud.IdSolicitudAutorizacion
                          }
                        </p>

                        <h3 className="mt-1 text-lg font-bold text-gray-900">
                          Expediente disciplinario #
                          {
                            solicitud.IdProcesoDisciplinario
                          }
                        </h3>
                      </div>

                      <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                        {solicitud.EstadoSolicitud}
                      </span>
                    </div>

                    <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-gray-50 p-3">
                        <dt className="text-xs font-semibold text-gray-500">
                          Trabajador
                        </dt>

                        <dd className="mt-1 font-semibold text-gray-800">
                          <span className="block">
                            {solicitud.NombreCompletoTrabajador ||
                              `Registro #${solicitud.IdRegistroPersonal}`}
                          </span>

                          <span className="mt-1 block text-sm font-medium text-gray-600">
                            {solicitud.NumeroDocumentoTrabajador
                              ? `${
                                  solicitud.TipoDocumentoTrabajador ||
                                  "CC"
                                } ${
                                  solicitud.NumeroDocumentoTrabajador
                                }`
                              : `Registro #${solicitud.IdRegistroPersonal}`}
                          </span>
                        </dd>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-3">
                        <dt className="text-xs font-semibold text-gray-500">
                          Viernes solicitado
                        </dt>

                        <dd className="mt-1 font-semibold text-gray-800">
                          {formatearFechaSolicitud(
                            solicitud.FechaSolicitada
                          )}
                        </dd>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-3 sm:col-span-2">
                        <dt className="text-xs font-semibold text-gray-500">
                          Solicitado por
                        </dt>

                        <dd className="mt-1 font-semibold text-gray-800">
                          {solicitud.UsuarioSolicita ||
                            "Operaciones"}
                        </dd>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-3 sm:col-span-2">
                        <dt className="text-xs font-semibold text-gray-500">
                          Motivo
                        </dt>

                        <dd className="mt-1 text-sm leading-6 text-gray-700">
                          {solicitud.MotivoSolicitud}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          abrirDecisionSolicitud(
                            solicitud,
                            "rechazar"
                          )
                        }
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        Rechazar
                      </Button>

                      <Button
                        type="button"
                        onClick={() =>
                          abrirDecisionSolicitud(
                            solicitud,
                            "aprobar"
                          )
                        }
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        Aprobar
                      </Button>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </div>

        {solicitudSeleccionada ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {accionSolicitud === "aprobar"
                      ? "Aprobar solicitud"
                      : "Rechazar solicitud"}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Expediente #
                    {
                      solicitudSeleccionada.IdProcesoDisciplinario
                    }{" "}
                    · Viernes{" "}
                    {formatearFechaSolicitud(
                      solicitudSeleccionada.FechaSolicitada
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={cerrarDecisionSolicitud}
                  disabled={procesandoSolicitud}
                  className="rounded-lg px-3 py-1 text-xl text-gray-500 hover:bg-gray-100"
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </div>

              {accionSolicitud === "aprobar" ? (
                <div className="mt-5">
                  <Label htmlFor="horario-solicitud-viernes">
                    Horario que se habilitará
                  </Label>

                  <select
                    id="horario-solicitud-viernes"
                    value={horarioSolicitud}
                    onChange={(event) =>
                      setHorarioSolicitud(
                        event.target.value
                      )
                    }
                    className="mt-2 h-12 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                  >
                    <option value="">
                      Seleccione un horario
                    </option>

                    {HORARIOS_SOLICITUD_VIERNES.map(
                      (horario) => (
                        <option
                          key={horario.value}
                          value={horario.value}
                        >
                          {horario.label}
                        </option>
                      )
                    )}
                  </select>
                </div>
              ) : null}

              <div className="mt-5">
                <Label htmlFor="observacion-solicitud-viernes">
                  {accionSolicitud === "aprobar"
                    ? "Observación de RRLL (opcional)"
                    : "Motivo del rechazo"}
                </Label>

                <textarea
                  id="observacion-solicitud-viernes"
                  value={observacionSolicitud}
                  onChange={(event) =>
                    setObservacionSolicitud(
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder={
                    accionSolicitud === "aprobar"
                      ? "Escriba una observación si aplica."
                      : "Explique por qué no se autoriza la atención del viernes."
                  }
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white p-3 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={cerrarDecisionSolicitud}
                  disabled={procesandoSolicitud}
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  onClick={
                    resolverSolicitudViernes
                  }
                  disabled={procesandoSolicitud}
                  className={
                    accionSolicitud === "aprobar"
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }
                >
                  {procesandoSolicitud
                    ? "Guardando..."
                    : accionSolicitud ===
                        "aprobar"
                      ? "Confirmar aprobación"
                      : "Confirmar rechazo"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }


  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-blue-600">
        <div className="mb-6">
          <p className="text-sm text-blue-700 font-semibold">
            Relaciones Laborales
          </p>

          <h2 className="text-2xl font-bold text-gray-800">
            Procesos Disciplinarios
          </h2>

          <p className="text-sm text-gray-500">
            Agenda, indicadores, autorizaciones y reportes del proceso disciplinario.
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-6">
          <div className="mb-4">
            <p className="text-sm font-semibold text-blue-800">
              Gestión de Procesos Disciplinarios
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Seleccione la opción que desea gestionar.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                setVista("agenda_disciplinaria")
              }
              className="text-left bg-white rounded-xl border border-blue-200 p-5 hover:border-blue-400 hover:shadow-sm transition"
            >
              <p className="font-bold text-blue-700">
                Agenda Disciplinaria
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Consulta de citaciones, descargos y seguimientos programados.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                setVista("indicadores")
              }
              className="text-left bg-white rounded-xl border border-blue-200 p-5 hover:border-blue-400 hover:shadow-sm transition"
            >
              <p className="font-bold text-blue-700">
                Indicadores de Procesos Disciplinarios
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Seguimiento de procesos agendados, atendidos y cerrados.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                setVista("solicitudes_viernes")
              }
              className="text-left bg-white rounded-xl border border-amber-200 p-5 hover:border-amber-400 hover:shadow-sm transition md:col-span-2"
            >
              <p className="font-bold text-amber-700">
                Solicitudes de autorización para viernes
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Aprobar o rechazar casos críticos enviados por Operaciones.
              </p>
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-bold text-blue-700">
                Excel de Procesos Disciplinarios
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Descarga el reporte de procesos disciplinarios dentro del rango de fechas seleccionado.
              </p>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="w-full md:w-auto">
                <Label className="text-sm font-medium text-gray-700">
                  Fecha inicio:
                </Label>

                <Input
                  type="date"
                  value={
                    fechaInicioExcelDisciplinarios
                  }
                  onChange={(event) =>
                    setFechaInicioExcelDisciplinarios(
                      event.target.value
                    )
                  }
                  className="mt-2 h-12 w-full bg-white md:w-[190px]"
                />
              </div>

              <div className="w-full md:w-auto">
                <Label className="text-sm font-medium text-gray-700">
                  Fecha fin:
                </Label>

                <Input
                  type="date"
                  value={
                    fechaFinExcelDisciplinarios
                  }
                  onChange={(event) =>
                    setFechaFinExcelDisciplinarios(
                      event.target.value
                    )
                  }
                  className="mt-2 h-12 w-full bg-white md:w-[190px]"
                />
              </div>

              <div className="w-full md:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={
                    handleDescargarExcelDisciplinarios
                  }
                  className="h-12 w-full border-blue-500 text-blue-700 hover:bg-blue-50 md:w-[220px]"
                >
                  Descargar Excel
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
          >
            Volver a RRLL
          </Button>
        </div>
      </div>
    </div>
  );
}