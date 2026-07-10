import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { obtenerExpedienteDisciplinario } from "@/services/procesosDisciplinariosService";

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const FILE_BASE_URL = API_URL.replace("/api", "");

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

  useEffect(() => {
    cargarExpediente();
  }, [proceso]);

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

          <h2 className="text-2xl font-bold text-gray-800">
            Expediente Disciplinario No.{" "}
            {procesoExp?.IdProcesoDisciplinario || "—"}
          </h2>

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
              variant="outline"
              onClick={() =>
                window.open(
                  `${API_URL}/procesos-disciplinarios/${procesoExp?.IdProcesoDisciplinario}/pdf`,
                  "_blank"
                )
              }
            >
              Descargar PDF
            </Button>

            <Button
              className="bg-emerald-700 hover:bg-emerald-800"
              onClick={() =>
                window.open(
                  `${API_URL}/procesos-disciplinarios/${procesoExp?.IdProcesoDisciplinario}/pdf`,
                  "_blank"
                )
              }
            >
              Generar expediente disciplinario
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}