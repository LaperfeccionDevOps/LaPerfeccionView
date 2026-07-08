import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CierreProcesoDisciplinarioView({ onBack }) {
  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-emerald-600">
        <div className="mb-6">
          <p className="text-sm text-emerald-700 font-semibold">
            Relaciones Laborales
          </p>

          <h2 className="text-2xl font-bold text-gray-800">
            Cierre del Proceso Disciplinario
          </h2>

          <p className="text-sm text-gray-500">
            Paso 4 de 4: decisión final y generación del documento de cierre.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
          {["Iniciar", "Citación", "Descargos", "Cierre"].map((item, index) => (
            <div
              key={item}
              className={`rounded-xl border p-4 ${
                index < 3
                  ? "bg-emerald-50 border-emerald-300"
                  : "bg-blue-50 border-blue-300"
              }`}
            >
              <p className="text-xs font-semibold">Paso {index + 1}</p>
              <p className="font-bold">{item}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 mb-6">
          <h3 className="font-bold text-blue-800">
            Decisión final del proceso
          </h3>

          <p className="text-sm text-gray-600 mt-2">
            En este paso Relaciones Laborales revisa la diligencia de descargos,
            define la medida final y prepara el documento de cierre correspondiente.
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 mb-6">
          <h3 className="font-bold text-emerald-800 mb-4">
            Resumen del expediente
          </h3>

          <div className="rounded-xl border-2 border-dashed border-emerald-300 bg-white p-10 text-center">
            <div className="text-4xl mb-4">📁</div>

            <h4 className="text-xl font-bold text-gray-800">
              Expediente pendiente de cargar
            </h4>

            <p className="text-gray-500 mt-2">
              Aquí se mostrará el resumen del trabajador, citación, descargos,
              evidencias y estado actual del proceso.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-5">
            Resultado del proceso
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-medium">
                Tipo de cierre
              </label>
              <Input placeholder="Seleccione el tipo de cierre" disabled />
            </div>

            <div>
              <label className="text-sm font-medium">
                Fecha de cierre
              </label>
              <Input disabled />
            </div>

            <div>
              <label className="text-sm font-medium">
                Responsable de cierre
              </label>
              <Input disabled />
            </div>

            <div>
              <label className="text-sm font-medium">
                Medida disciplinaria
              </label>
              <Input placeholder="Llamado / Suspensión / Terminación / Sin sanción" disabled />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-5">
            Conclusión de Relaciones Laborales
          </h3>

          <textarea
            className="w-full border rounded-lg p-3 min-h-[150px] bg-gray-100 resize-none"
            disabled
            placeholder="Conclusión final del proceso disciplinario..."
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-5">
            Documento de cierre
          </h3>

          <div className="border-2 border-dashed rounded-xl p-10 text-center bg-gray-50">
            <div className="text-5xl mb-4">📄</div>

            <h4 className="font-bold text-gray-700">
              Documento de cierre pendiente
            </h4>

            <p className="text-gray-500 mt-2">
              El sistema generará el documento correspondiente según el tipo de cierre:
              llamado de atención, suspensión, terminación, ausencia justificada
              u otra decisión definida por Relaciones Laborales.
            </p>

            <Button className="mt-5 bg-emerald-700 hover:bg-emerald-800" disabled>
              Generar documento
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-5">
            Firma y archivo
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold">Firma trabajador</h4>
              <p className="text-sm text-gray-500 mt-2">
                Pendiente de firma del colaborador.
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-semibold">Firma empresa</h4>
              <p className="text-sm text-gray-500 mt-2">
                Pendiente de firma del responsable autorizado.
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-semibold">Archivo final</h4>
              <p className="text-sm text-gray-500 mt-2">
                Pendiente de cargar en la carpeta del trabajador.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 mb-6">
          <h3 className="font-bold text-yellow-800">
            Estado del cierre
          </h3>

          <p className="text-sm text-gray-600 mt-2">
            El proceso disciplinario aún no ha sido cerrado. Complete la revisión
            y genere el documento final para finalizar el expediente.
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-3">
          <Button variant="outline" onClick={onBack}>
            ← Volver
          </Button>

          <div className="flex gap-3">
            <Button variant="outline" disabled>
              Guardar borrador
            </Button>

            <Button className="bg-emerald-700 hover:bg-emerald-800" disabled>
              Finalizar proceso
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}