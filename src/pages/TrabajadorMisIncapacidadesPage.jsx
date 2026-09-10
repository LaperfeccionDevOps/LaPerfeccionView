import React from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Clock3,
  Eye,
  FileText,
  Files,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api"
).replace(/\/+$/, "");

const TrabajadorMisIncapacidadesPage = () => {
  const navigate = useNavigate();

  const workerToken =
    localStorage.getItem("trabajador_token") || "";

  const workerName =
    localStorage.getItem("trabajador_nombre") || "";

  const workerDocument =
    localStorage.getItem("trabajador_documento") || "";

  const [incapacidades, setIncapacidades] =
    React.useState([]);

  const [isLoading, setIsLoading] =
    React.useState(true);

  const [error, setError] =
    React.useState("");

  const [openingDocumentId, setOpeningDocumentId] =
    React.useState(null);

  const [selectedIncapacidad, setSelectedIncapacidad] =
    React.useState(null);

  const clearWorkerSession = React.useCallback(() => {
    localStorage.removeItem("trabajador_token");
    localStorage.removeItem("trabajador_id_registro_personal");
    localStorage.removeItem("trabajador_documento");
    localStorage.removeItem("trabajador_nombre");
    localStorage.removeItem("trabajador_eps");
  }, []);

  const handleUnauthorized = React.useCallback(() => {
    clearWorkerSession();
    navigate("/login", { replace: true });
  }, [clearWorkerSession, navigate]);

  const loadIncapacidades = React.useCallback(async () => {
    if (!workerToken) {
      handleUnauthorized();
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/trabajador/incapacidades`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${workerToken}`,
          },
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "No fue posible consultar sus incapacidades."
        );
      }

      const nuevasIncapacidades =
        Array.isArray(data?.incapacidades)
          ? data.incapacidades
          : [];

      setIncapacidades(nuevasIncapacidades);

      setSelectedIncapacidad((actual) => {
        if (!actual?.id_incapacidad) {
          return actual;
        }

        return (
          nuevasIncapacidades.find(
            (item) =>
              item.id_incapacidad === actual.id_incapacidad
          ) || null
        );
      });
    } catch (requestError) {
      setError(
        requestError?.message ||
          "No fue posible consultar sus incapacidades."
      );
    } finally {
      setIsLoading(false);
    }
  }, [workerToken, handleUnauthorized]);

  React.useEffect(() => {
    loadIncapacidades();
  }, [loadIncapacidades]);

  React.useEffect(() => {
    if (!selectedIncapacidad) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSelectedIncapacidad(null);
      }
    };

    document.addEventListener("keydown", handleEscape);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedIncapacidad]);

  const handleLogout = () => {
    clearWorkerSession();
    navigate("/login", { replace: true });
  };

  const formatDate = (value) => {
    if (!value) {
      return "No disponible";
    }

    const dateParts = String(value).slice(0, 10).split("-");

    if (dateParts.length !== 3) {
      return String(value);
    }

    const [year, month, day] = dateParts;
    return `${day}/${month}/${year}`;
  };

  const formatDateIso = (value) => {
    if (!value) {
      return "No disponible";
    }

    return String(value).slice(0, 10);
  };

  const formatDateTime = (value) => {
    if (!value) {
      return "No disponible";
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return String(value);
    }

    return parsedDate.toLocaleString("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const handleViewDocument = async (
    incapacidad,
    documento
  ) => {
    if (
      !incapacidad?.id_incapacidad ||
      !documento?.id_documento
    ) {
      return;
    }

    setOpeningDocumentId(documento.id_documento);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/trabajador/incapacidades/${incapacidad.id_incapacidad}/documentos/${documento.id_documento}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${workerToken}`,
          },
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data?.detail ||
            "No fue posible abrir el documento."
        );
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = objectUrl;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 60000);
    } catch (requestError) {
      setError(
        requestError?.message ||
          "No fue posible abrir el documento."
      );
    } finally {
      setOpeningDocumentId(null);
    }
  };

  const renderDetailModal = () => {
    if (!selectedIncapacidad) {
      return null;
    }

    const incapacidad = selectedIncapacidad;
    const documentos = Array.isArray(incapacidad?.documentos)
      ? incapacidad.documentos
      : [];

    const estadoNormalizado = String(
      incapacidad?.estado || ""
    )
      .trim()
      .toUpperCase();

    const esRechazada =
      estadoNormalizado === "RECHAZADA";

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-5"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            setSelectedIncapacidad(null);
          }
        }}
      >
        <div className="w-full max-w-5xl max-h-[94vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-200">
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5 md:p-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-700">
                  Registro #{incapacidad.id_incapacidad}
                </span>
              </div>

              <h2 className="mt-3 text-xl md:text-2xl font-bold text-gray-800">
                {incapacidad.descripcion_tipo || "Incapacidad"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Detalle de la incapacidad registrada
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setSelectedIncapacidad(null)}
              className="shrink-0 rounded-full"
              aria-label="Cerrar detalle"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="max-h-[calc(94vh-110px)] overflow-y-auto">
            <div className="p-5 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                  <p className="text-xs font-semibold text-gray-500">
                    Número de identificación
                  </p>
                  <p className="mt-2 text-sm font-bold text-gray-800 break-words">
                    {workerDocument || "No disponible"}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                  <p className="text-xs font-semibold text-gray-500">
                    Nombre
                  </p>
                  <p className="mt-2 text-sm font-bold text-gray-800 break-words">
                    {workerName || "Trabajador"}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                  <p className="text-xs font-semibold text-gray-500">
                    Fecha de registro
                  </p>
                  <p className="mt-2 text-sm font-bold text-gray-800">
                    {formatDateTime(incapacidad.fecha_creacion)}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                  <p className="text-xs font-semibold text-gray-500">
                    Tipo
                  </p>
                  <p className="mt-2 text-sm font-bold text-gray-800">
                    {incapacidad.descripcion_tipo || "Incapacidad"}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                  <div className="flex items-center gap-2 text-gray-500">
                    <CalendarDays className="w-4 h-4" />
                    <span className="text-xs font-semibold">
                      Inicio
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-gray-800">
                    {formatDate(incapacidad.fecha_inicio)}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                  <div className="flex items-center gap-2 text-gray-500">
                    <CalendarDays className="w-4 h-4" />
                    <span className="text-xs font-semibold">
                      Final
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-gray-800">
                    {formatDate(incapacidad.fecha_final)}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock3 className="w-4 h-4" />
                    <span className="text-xs font-semibold">
                      Días
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-gray-800">
                    {incapacidad.dias_incapacidad ?? "No disponible"}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                  <div className="flex items-center gap-2 text-gray-500">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-xs font-semibold">
                      Prórroga
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-gray-800">
                    {incapacidad.es_prorroga ? "Sí" : "No"}
                  </p>
                </div>
              </div>
            </div>

            {esRechazada && (
              <div className="border-y border-red-100 bg-red-50/70 p-5 md:p-6">
                <div className="rounded-2xl border border-red-200 bg-white p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-red-800">
                        Nómina solicitó una corrección
                      </h3>
                      <p className="mt-2 text-sm text-gray-600">
                        Revise el correo enviado por Nómina y utilice el enlace de corrección para ajustar y reenviar esta misma incapacidad. No debe crear un registro nuevo.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-red-600">
                      Motivo informado por Nómina
                    </p>
                    <p className="mt-2 text-sm font-medium text-red-900 whitespace-pre-wrap break-words">
                      {incapacidad.observacion_nomina ||
                        "Nómina no registró una observación adicional."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50/70 p-5 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-800">
                  Documentos adjuntos
                </h3>
                <span className="text-xs font-semibold text-gray-400">
                  ({documentos.length})
                </span>
              </div>

              {documentos.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No hay documentos disponibles para esta incapacidad.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {documentos.map((documento) => (
                    <div
                      key={documento.id_documento}
                      className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800">
                          {documento.tipo_documento || "Documento"}
                        </p>
                        <p
                          className="text-xs text-gray-500 mt-1 truncate"
                          title={documento.nombre_archivo || ""}
                        >
                          {documento.nombre_archivo || "Archivo adjunto"}
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        disabled={
                          openingDocumentId === documento.id_documento
                        }
                        onClick={() =>
                          handleViewDocument(
                            incapacidad,
                            documento
                          )
                        }
                        className="w-full sm:w-auto shrink-0 border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        {openingDocumentId === documento.id_documento ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Eye className="w-4 h-4 mr-2" />
                        )}
                        Ver
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!workerToken) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-gray-50 to-emerald-50">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-10">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500" />

          <div className="p-5 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="min-w-0">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate("/trabajador/incapacidades")}
                  className="mb-3 -ml-2 text-gray-500 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver a incapacidades
                </Button>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                    <Files className="w-7 h-7 md:w-8 md:h-8 text-white" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">
                      Portal del Trabajador
                    </p>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                      Mis incapacidades
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                      Consulte su historial y abra el detalle de cada incapacidad cuando lo necesite.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleLogout}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 shrink-0"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar sesión
              </Button>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">
                  Trabajador
                </p>
                <p className="font-bold text-gray-800">
                  {workerName || "Trabajador"}
                </p>
                {workerDocument && (
                  <p className="mt-1 text-sm text-gray-500">
                    Identificación: {workerDocument}
                  </p>
                )}
              </div>

              <Button
                type="button"
                onClick={() => navigate("/trabajador/incapacidades/nueva")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Registrar nueva
              </Button>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-700">
                  {error}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={loadIncapacidades}
                  className="mt-3 border-red-200 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Intentar nuevamente
                </Button>
              </div>
            )}

            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-9 h-9 text-blue-600 animate-spin" />
                <p className="mt-4 text-sm font-semibold text-gray-600">
                  Consultando sus incapacidades...
                </p>
              </div>
            ) : incapacidades.length === 0 ? (
              <div className="mt-8 border-2 border-dashed border-gray-200 rounded-3xl px-5 py-12 text-center">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center">
                  <Files className="w-8 h-8 text-gray-400" />
                </div>

                <h2 className="mt-5 text-lg font-bold text-gray-800">
                  Aún no tiene incapacidades registradas
                </h2>

                <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                  Cuando registre una incapacidad podrá consultar aquí su historial y abrir el detalle cuando lo necesite.
                </p>

                <Button
                  type="button"
                  onClick={() => navigate("/trabajador/incapacidades/nueva")}
                  className="mt-5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar incapacidad
                </Button>
              </div>
            ) : (
              <div className="mt-8">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Historial
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {incapacidades.length === 1
                        ? "1 incapacidad registrada"
                        : `${incapacidades.length} incapacidades registradas`}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={loadIncapacidades}
                    className="shrink-0"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">
                      Actualizar
                    </span>
                  </Button>
                </div>

                <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] border-collapse">
                      <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                            Fecha envío a Nómina
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                            Identificación
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                            Nombre
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                            Tipo de incapacidad
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                            Acción
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100">
                        {incapacidades.map((incapacidad) => (
                          <tr
                            key={incapacidad.id_incapacidad}
                            className="bg-white hover:bg-gray-50/80 transition-colors"
                          >
                            <td className="px-4 py-4 text-sm font-semibold text-gray-700 whitespace-nowrap">
                              {formatDateIso(
                                incapacidad.fecha_creacion
                              )}
                            </td>

                            <td className="px-4 py-4 text-sm font-semibold text-gray-700 whitespace-nowrap">
                              {workerDocument || "No disponible"}
                            </td>

                            <td className="px-4 py-4 text-sm text-gray-700">
                              <span className="font-semibold">
                                {workerName || "Trabajador"}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-sm text-gray-700">
                              <div className="font-semibold text-gray-800">
                                {incapacidad.descripcion_tipo || "Incapacidad"}
                              </div>
                              <div className="mt-1 text-xs text-gray-400">
                                Registro #{incapacidad.id_incapacidad}
                              </div>
                            </td>

                            <td className="px-4 py-4 text-center">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  setSelectedIncapacidad(incapacidad)
                                }
                                className="border-gray-200 text-gray-800 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="md:hidden space-y-3">
                  {incapacidades.map((incapacidad) => (
                    <article
                      key={incapacidad.id_incapacidad}
                      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-400">
                          Registro #{incapacidad.id_incapacidad}
                        </p>
                        <h3 className="mt-1 text-base font-bold text-gray-800">
                          {incapacidad.descripcion_tipo || "Incapacidad"}
                        </h3>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-400">
                            Fecha envío a Nómina
                          </p>
                          <p className="mt-1 text-sm font-semibold text-gray-700">
                            {formatDateIso(
                              incapacidad.fecha_creacion
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-400">
                            Identificación
                          </p>
                          <p className="mt-1 text-sm font-semibold text-gray-700">
                            {workerDocument || "No disponible"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-400">
                            Nombre
                          </p>
                          <p className="mt-1 text-sm font-semibold text-gray-700">
                            {workerName || "Trabajador"}
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setSelectedIncapacidad(incapacidad)
                        }
                        className="mt-4 w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver incapacidad
                      </Button>
                    </article>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                Portal del Trabajador - Gestión de Incapacidades
              </p>
            </div>
          </div>
        </div>
      </div>

      {renderDetailModal()}
    </div>
  );
};

export default TrabajadorMisIncapacidadesPage;
