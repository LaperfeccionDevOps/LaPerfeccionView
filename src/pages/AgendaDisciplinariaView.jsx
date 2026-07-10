import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function AgendaDisciplinariaView({
  onVolver,
  onAbrirProceso,
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
        badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
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

  const cargarAgendaHoy = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${API_BASE}/agenda-disciplinaria/hoy/listado`
      );

      if (!res.ok) {
        throw new Error(
          "No se pudo cargar la agenda de hoy."
        );
      }

      const data = await res.json();

      setAgenda(
        Array.isArray(data?.eventos)
          ? data.eventos
          : []
      );

      setTotal(
        Number(data?.total || 0)
      );

      setFechaConsulta(
        data?.fecha || ""
      );
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
        setError(
          "Seleccione una fecha."
        );
        return;
      }

      setLoading(true);
      setError("");

      const res = await fetch(
        `${API_BASE}/agenda-disciplinaria/fecha/${fechaFiltro}`
      );

      if (!res.ok) {
        throw new Error(
          "No se pudo consultar la agenda por fecha."
        );
      }

      const data = await res.json();

      setAgenda(
        Array.isArray(data?.eventos)
          ? data.eventos
          : []
      );

      setTotal(
        Number(data?.total || 0)
      );

      setFechaConsulta(
        data?.fecha || fechaFiltro
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

  const abrirProceso = (evento) => {
    if (!evento?.IdProcesoDisciplinario) {
      setError(
        "Este evento no tiene proceso disciplinario asociado."
      );
      return;
    }

    if (
      typeof onAbrirProceso === "function"
    ) {
      onAbrirProceso(
        evento.IdProcesoDisciplinario
      );
    }
  };

  useEffect(() => {
    cargarAgendaHoy();
  }, []);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-blue-600">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Agenda Disciplinaria
            </h2>

            <p className="text-sm text-gray-500">
              Relaciones Laborales - eventos programados
            </p>
          </div>

          <Button
            variant="outline"
            onClick={onVolver}
          >
            Volver
          </Button>
        </div>

        <div className="bg-gray-50 rounded-xl border p-5 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Fecha
              </label>

              <input
                type="date"
                value={fechaFiltro}
                onChange={(e) =>
                  setFechaFiltro(
                    e.target.value
                  )
                }
                className="w-full mt-1 border rounded-lg px-3 py-2 bg-white"
              />
            </div>

            <Button
              onClick={buscarPorFecha}
              disabled={loading}
            >
              Buscar
            </Button>

            <Button
              variant="outline"
              onClick={cargarAgendaHoy}
              disabled={loading}
            >
              Agenda de hoy
            </Button>

            <div className="text-sm text-gray-600">
              <p>
                Fecha:{" "}
                <b>
                  {fechaConsulta || "—"}
                </b>
              </p>

              <p>
                Total eventos:{" "}
                <b>{total}</b>
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
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
              RRLL ya inició la gestión
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
          Haz clic sobre una novedad reportada para abrir el expediente disciplinario.
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

                <th className="px-4 py-3 text-left">
                   Novedad reportada
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-gray-500 bg-white"
                  >
                    Cargando agenda...
                  </td>
                </tr>
              ) : agenda.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-gray-500 bg-white"
                  >
                    No hay eventos para la fecha consultada.
                  </td>
                </tr>
              ) : (
                agenda.map((evento) => {
                  const estilo =
                    obtenerEstiloEstado(
                      evento
                    );

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
                        {evento.FechaEvento ||
                          "—"}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {evento.HoraInicio ||
                          "—"}{" "}
                        -{" "}
                        {evento.HoraFin ||
                          "—"}
                      </td>

                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {evento.NombreCompleto ||
                          "—"}
                      </td>

                      <td className="px-4 py-3">
                        {evento.NumeroIdentificacion ||
                          "—"}
                      </td>

                      <td className="px-4 py-3">
                        {evento.TipoEvento ||
                          "—"}
                      </td>

                      <td className="px-4 py-3">
                        {evento.Modalidad ||
                          "—"}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold ${estilo.badge}`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${estilo.punto}`}
                          />

                          {evento.EstadoAgenda ||
                            "SIN ESTADO"}
                        </span>
                      </td>

                      <td className="px-4 py-3 max-w-xs">
                        <span className="line-clamp-2">
                          {evento.Observacion ||
                            "Sin observación"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}