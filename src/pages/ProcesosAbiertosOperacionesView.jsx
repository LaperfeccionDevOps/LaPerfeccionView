import React, { useEffect, useMemo, useState } from "react";
import { ChevronRight, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

const API_URL = String(
  import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000/api"
).replace(/\/+$/, "");

const obtenerTokenAutenticacion = () => {
  const clavesDirectas = [
    "token",
    "access_token",
    "accessToken",
    "authToken",
    "jwt",
    "jwtToken",
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
        valor !== "null" &&
        valor !== "undefined"
      ) {
        return valor.replace(/^"|"$/g, "");
      }
    }
  }

  const clavesObjetos = [
    "auth",
    "authData",
    "user",
    "session",
    "userData",
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
        // No contiene un objeto JSON válido.
      }
    }
  }

  return null;
};

const construirHeaders = () => {
  const token = obtenerTokenAutenticacion();

  if (!token) {
    throw new Error(
      "No se encontró el token de autenticación. Cierra sesión e ingresa nuevamente."
    );
  }

  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const normalizarTexto = (valor) =>
  String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const formatearFecha = (valor) => {
  if (!valor) {
    return "Sin fecha";
  }

  const texto = String(valor).trim();
  const soloFecha = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (soloFecha) {
    const [, anio, mes, dia] = soloFecha;
    return `${dia}/${mes}/${anio}`;
  }

  const fecha = new Date(texto);

  if (Number.isNaN(fecha.getTime())) {
    return texto;
  }

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(fecha);
};

const ProcesosAbiertosOperacionesView = () => {
  const navigate = useNavigate();

  const [procesos, setProcesos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const cargarProcesos = async () => {
    setCargando(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/operaciones/retiros/procesos-abiertos`,
        {
          method: "GET",
          headers: construirHeaders(),
        }
      );

      if (response.status === 401) {
        throw new Error(
          "La sesión no está autorizada o venció. Cierra sesión e ingresa nuevamente."
        );
      }

      if (response.status === 403) {
        throw new Error(
          "No tienes permiso para consultar los procesos abiertos de Operaciones."
        );
      }

      if (!response.ok) {
        let detalle = "";

        try {
          const respuestaError = await response.json();

          if (typeof respuestaError?.detail === "string") {
            detalle = respuestaError.detail;
          } else if (respuestaError?.detail?.mensaje) {
            detalle = respuestaError.detail.mensaje;
          }
        } catch (errorLectura) {
          detalle = "";
        }

        throw new Error(
          detalle ||
            `No se pudieron consultar los procesos abiertos. Código HTTP: ${response.status}.`
        );
      }

      const respuesta = await response.json();

      setProcesos(
        Array.isArray(respuesta?.data)
          ? respuesta.data
          : []
      );
    } catch (errorConsulta) {
      setProcesos([]);
      setError(
        errorConsulta?.message ||
          "No fue posible consultar los procesos abiertos."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProcesos();
  }, []);

  const procesosFiltrados = useMemo(() => {
    const criterio = normalizarTexto(busqueda);

    if (!criterio) {
      return procesos;
    }

    return procesos.filter((proceso) => {
      const texto = normalizarTexto(
        [
          proceso?.NumeroIdentificacion,
          proceso?.NombreCompleto,
          proceso?.NombreCliente,
          proceso?.TipoNotificacion,
          proceso?.EstadoPazYSalvo,
          proceso?.EstadoRQ,
          proceso?.IdRetiroLaboral,
        ].join(" ")
      );

      return texto.includes(criterio);
    });
  }, [procesos, busqueda]);

  const continuarProceso = async (proceso) => {
    setError("");

    if (!proceso?.IdRetiroLaboral) {
      setError("No fue posible identificar el retiro seleccionado.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/operaciones/retiros/proceso/${proceso.IdRetiroLaboral}/continuar`,
        {
          method: "GET",
          headers: construirHeaders(),
        }
      );

      if (response.status === 401) {
        throw new Error(
          "La sesión no está autorizada o venció. Cierra sesión e ingresa nuevamente."
        );
      }

      if (response.status === 403) {
        throw new Error(
          "No tienes permiso para continuar este proceso de retiro."
        );
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const detalle =
          data?.detail ||
          data?.message ||
          `No fue posible cargar el proceso. Código HTTP: ${response.status}.`;

        throw new Error(
          typeof detalle === "string"
            ? detalle
            : JSON.stringify(detalle)
        );
      }

      const procesoCompleto = data?.data || null;

      if (!procesoCompleto?.Retiro?.IdRetiroLaboral) {
        throw new Error(
          "El backend respondió, pero no devolvió la información completa del retiro."
        );
      }

      console.log(
        "Proceso pendiente cargado correctamente:",
        procesoCompleto
      );

      navigate("/operaciones/retiros", {
        state: {
          modo: "CONTINUAR_PROCESO",
          IdRetiroLaboral: procesoCompleto.Retiro.IdRetiroLaboral,
          IdRegistroPersonal:
            procesoCompleto.Trabajador?.IdRegistroPersonal ||
            proceso.IdRegistroPersonal,
          procesoContinuar: procesoCompleto,
        },
      });
    } catch (errorContinuacion) {
      console.error(
        "Error cargando proceso pendiente para continuar:",
        errorContinuacion
      );

      setError(
        errorContinuacion?.message ||
          "No fue posible cargar el proceso pendiente."
      );
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                <ClipboardList className="h-6 w-6 text-emerald-700" />
              </div>

              <div>
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  Procesos abiertos
                </h1>

                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-gray-500">
                  Retiros pendientes en Operaciones antes de ser enviados a
                  Relaciones Laborales.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={cargarProcesos}
              disabled={cargando}
              className="min-h-10 rounded-xl"
            >
              {cargando ? "Consultando..." : "Actualizar"}
            </Button>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="text"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar por nombre, identificación o cliente"
              className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:max-w-md"
            />

            {!cargando && !error && (
              <div className="text-sm font-medium text-gray-500">
                {procesosFiltrados.length} proceso
                {procesosFiltrados.length === 1 ? "" : "s"}
              </div>
            )}
          </div>

          {cargando && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-10 text-center">
              <p className="font-semibold text-gray-800">
                Consultando procesos abiertos...
              </p>
            </div>
          )}

          {!cargando && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-5">
              <p className="font-semibold text-red-900">
                No fue posible cargar los procesos abiertos
              </p>

              <p className="mt-1 text-sm leading-relaxed text-red-800">
                {error}
              </p>

              <Button
                type="button"
                variant="outline"
                onClick={cargarProcesos}
                className="mt-4 rounded-xl"
              >
                Intentar nuevamente
              </Button>
            </div>
          )}

          {!cargando &&
            !error &&
            procesos.length === 0 && (
              <div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 px-5 py-10 text-center">
                <p className="text-base font-semibold text-emerald-900">
                  No hay procesos pendientes en Operaciones
                </p>

                <p className="mt-1 text-sm text-emerald-800">
                  En este momento no existen retiros con estado
                  PENDIENTE_OPERACIONES.
                </p>
              </div>
            )}

          {!cargando &&
            !error &&
            procesos.length > 0 &&
            procesosFiltrados.length === 0 && (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-8 text-center">
                <p className="font-semibold text-gray-800">
                  No encontramos coincidencias
                </p>
              </div>
            )}

          {!cargando &&
            !error &&
            procesosFiltrados.length > 0 && (
              <div className="space-y-4">
                {procesosFiltrados.map((proceso) => (
                  <article
                    key={proceso.IdRetiroLaboral}
                    className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <h2 className="break-words text-base font-bold text-gray-900 sm:text-lg">
                          {proceso.NombreCompleto || "Sin nombre"}
                        </h2>

                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                          <span>
                            Identificación:{" "}
                            <strong className="font-semibold text-gray-700">
                              {proceso.NumeroIdentificacion || "Sin dato"}
                            </strong>
                          </span>

                          <span>
                            Retiro:{" "}
                            <strong className="font-semibold text-gray-700">
                              #{proceso.IdRetiroLaboral}
                            </strong>
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-xl bg-gray-50 p-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                              Cliente
                            </p>
                            <p className="mt-1 font-semibold text-gray-800">
                              {proceso.NombreCliente || "Sin cliente"}
                            </p>
                          </div>

                          <div className="rounded-xl bg-gray-50 p-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                              Apertura
                            </p>
                            <p className="mt-1 font-semibold text-gray-800">
                              {formatearFecha(
                                proceso.FechaApertura ||
                                  proceso.FechaProceso
                              )}
                            </p>
                          </div>

                          <div className="rounded-xl bg-gray-50 p-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                              Notificación
                            </p>
                            <p className="mt-1 font-semibold text-gray-800">
                              {proceso.TipoNotificacion || "RQ sin registrar"}
                            </p>
                          </div>

                          <div className="rounded-xl bg-gray-50 p-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                              Requiere reemplazo
                            </p>
                            <p className="mt-1 font-semibold text-gray-800">
                              {proceso.RequiereReemplazo === true
                                ? "Sí"
                                : proceso.RequiereReemplazo === false
                                  ? "No"
                                  : "Sin definir"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                            Paz y Salvo:{" "}
                            {proceso.EstadoPazYSalvo || "SIN REGISTRO"}
                          </span>

                          <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                            RQ: {proceso.EstadoRQ || "SIN REGISTRO"}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 lg:w-48">
                        <Button
                          type="button"
                          onClick={() => continuarProceso(proceso)}
                          className="min-h-11 w-full gap-2 rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
                        >
                          Continuar proceso
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProcesosAbiertosOperacionesView;
