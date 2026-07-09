import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CierreProcesoDisciplinarioView from "@/pages/CierreProcesoDisciplinarioView";
import { crearDescargoProcesoDisciplinario } from "@/services/descargoProcesoDisciplinarioService";

export default function DescargosProcesoDisciplinarioView({
  onBack,
  proceso,
  trabajador,
}) {
  const [vista, setVista] = useState("descargos");
  const [fechaDescargo, setFechaDescargo] = useState("");
  const [horaDescargo, setHoraDescargo] = useState("");
  const [descargoTrabajador, setDescargoTrabajador] = useState("");
  const [manifestacionSupervisor, setManifestacionSupervisor] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [responsableDescargo, setResponsableDescargo] = useState("");
  const [loadingGuardar, setLoadingGuardar] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const handleContinuar = async () => {
    try {
      setLoadingGuardar(true);
      setMensaje("");

      if (!proceso?.IdProcesoDisciplinario) {
        setMensaje("No existe un proceso disciplinario asociado.");
        return;
      }

      if (!descargoTrabajador) {
        setMensaje("Debe registrar la manifestación del trabajador para continuar.");
        return;
      }

      const payload = {
        IdProcesoDisciplinario: proceso.IdProcesoDisciplinario,
        FechaDescargo: fechaDescargo || null,
        HoraDescargo: horaDescargo || null,
        DescargoTrabajador: descargoTrabajador,
        Observaciones: `Manifestación del supervisor:\n${manifestacionSupervisor}\n\nObservaciones de Relaciones Laborales:\n${observaciones}`,
        ResponsableDescargo: responsableDescargo || "rrll",
      };

      await crearDescargoProcesoDisciplinario(payload);

      setVista("cierre");
    } catch (error) {
      console.error(error);
      setMensaje("No se pudo guardar el descargo del proceso disciplinario.");
    } finally {
      setLoadingGuardar(false);
    }
  };

  if (vista === "cierre") {
    return (
      <CierreProcesoDisciplinarioView
        onBack={() => setVista("descargos")}
        proceso={proceso}
        trabajador={trabajador}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-emerald-600">
        <div className="mb-6">
          <p className="text-sm text-emerald-700 font-semibold">
            Relaciones Laborales
          </p>

          <h2 className="text-2xl font-bold text-gray-800">
            Diligencia de Descargos
          </h2>

          <p className="text-sm text-gray-500">
            Paso 3 de 4: registro de la diligencia disciplinaria.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4">
            <p className="text-xs font-semibold">Paso 1</p>
            <p className="font-bold">Iniciar</p>
          </div>

          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4">
            <p className="text-xs font-semibold">Paso 2</p>
            <p className="font-bold">Citación</p>
          </div>

          <div className="rounded-xl border border-blue-300 bg-blue-50 p-4">
            <p className="text-xs font-semibold">Paso 3</p>
            <p className="font-bold">Descargos</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold">Paso 4</p>
            <p className="font-bold">Cierre</p>
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 mb-6">
          <h3 className="font-bold text-blue-800">
            Registro de la diligencia
          </h3>

          <p className="text-sm text-gray-600 mt-2">
            En este paso Relaciones Laborales registra el desarrollo de la
            diligencia de descargos, las manifestaciones de las partes, los
            asistentes y los documentos aportados.
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 mb-6">
          <h3 className="font-bold text-emerald-800 mb-4">
            Información del trabajador
          </h3>

          {trabajador ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 rounded-xl bg-white p-5 border border-emerald-200">
              <div>
                <p className="text-xs text-gray-500">Nombre</p>
                <p className="font-semibold text-gray-800">
                  {trabajador.NombreCompleto || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Documento</p>
                <p className="font-semibold text-gray-800">
                  {trabajador.TipoDocumento} {trabajador.NumeroDocumento}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Cargo</p>
                <p className="font-semibold text-gray-800">
                  {trabajador.Cargo || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Proceso</p>
                <p className="font-semibold text-gray-800">
                  {proceso?.IdProcesoDisciplinario
                    ? `#${proceso.IdProcesoDisciplinario}`
                    : "—"}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-emerald-300 bg-white p-10 text-center">
              <div className="text-4xl mb-4">👤</div>

              <h4 className="text-xl font-bold text-gray-800">
                Información pendiente de cargar
              </h4>

              <p className="text-gray-500 mt-2">
                Los datos del trabajador serán cargados automáticamente desde el
                expediente disciplinario.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-5">
            Asistentes a la diligencia
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "Trabajador citado",
              "Responsable de RRLL",
              "Supervisor que reporta",
              "Testigo 1",
              "Testigo 2",
              "Otro asistente",
            ].map((item) => (
              <label
                key={item}
                className="flex items-center gap-3 rounded-lg border p-4 bg-gray-50"
              >
                <input type="checkbox" />
                <span className="font-medium text-gray-700">{item}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-5">
            Desarrollo de los descargos
          </h3>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium">
                Fecha de descargos
              </label>

              <Input
                type="date"
                value={fechaDescargo}
                onChange={(e) => setFechaDescargo(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Hora de descargos
              </label>

              <Input
                type="time"
                value={horaDescargo}
                onChange={(e) => setHoraDescargo(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Responsable de descargos
              </label>

              <Input
                value={responsableDescargo}
                onChange={(e) => setResponsableDescargo(e.target.value)}
                placeholder="Nombre del responsable de RRLL"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Manifestación del trabajador
              </label>

              <textarea
                className="w-full border rounded-lg p-3 min-h-[140px] resize-none"
                placeholder="Aquí se registrará lo manifestado por el trabajador durante la diligencia..."
                value={descargoTrabajador}
                onChange={(e) => setDescargoTrabajador(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Manifestación del supervisor
              </label>

              <textarea
                className="w-full border rounded-lg p-3 min-h-[120px] resize-none"
                placeholder="Aquí se registrará la intervención del supervisor o responsable que reporta..."
                value={manifestacionSupervisor}
                onChange={(e) => setManifestacionSupervisor(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Observaciones de Relaciones Laborales
              </label>

              <textarea
                className="w-full border rounded-lg p-3 min-h-[120px] resize-none"
                placeholder="Observaciones internas de RRLL..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-5">
            Documentos aportados en descargos
          </h3>

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
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td colSpan={4} className="text-center text-gray-500 py-12">
                    No existen documentos aportados durante la diligencia.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <Button
            className="mt-5 bg-emerald-700 hover:bg-emerald-800"
            disabled
          >
            Adjuntar documento
          </Button>
        </div>

        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 mb-6">
          <h3 className="font-bold text-yellow-800">
            Estado del acta de descargos
          </h3>

          <p className="text-sm text-gray-600 mt-2">
            El acta de descargos aún no ha sido generada ni firmada. Cuando la
            diligencia finalice, el sistema permitirá generar el documento para
            firma y archivo.
          </p>

          {mensaje && (
            <p className="text-sm font-semibold text-red-600 mt-3">
              {mensaje}
            </p>
          )}
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-3">
          <Button variant="outline" onClick={onBack}>
            ← Volver
          </Button>

          <div className="flex gap-3">
            <Button variant="outline" disabled>
              Guardar borrador
            </Button>

           <Button
            className="bg-emerald-700 hover:bg-emerald-800"
            onClick={handleContinuar}
            disabled={loadingGuardar}
            >
            {loadingGuardar ? "Guardando..." : "Continuar →"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}