import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DescargosProcesoDisciplinarioView from "@/pages/DescargosProcesoDisciplinarioView";

export default function CitacionProcesoDisciplinarioView({ onBack }) {
  const [vista, setVista] = useState("citacion");

  if (vista === "descargos") {
    return (
      <DescargosProcesoDisciplinarioView
        onBack={() => setVista("citacion")}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-emerald-600">

        {/* ===========================
            ENCABEZADO
        ============================ */}

        <div className="mb-6">
          <p className="text-sm text-emerald-700 font-semibold">
            Relaciones Laborales
          </p>

          <h2 className="text-2xl font-bold text-gray-800">
            Citación a Descargos
          </h2>

          <p className="text-sm text-gray-500">
            Paso 2 de 4:  revisión de la citación disciplinaria.
          </p>
        </div>

        {/* ===========================
            WIZARD
        ============================ */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">

          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4">
            <p className="text-xs font-semibold">
              Paso 1
            </p>

            <p className="font-bold">
              Iniciar
            </p>
          </div>

          <div className="rounded-xl border border-blue-300 bg-blue-50 p-4">
            <p className="text-xs font-semibold">
              Paso 2
            </p>

            <p className="font-bold">
              Citación
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold">
              Paso 3
            </p>

            <p className="font-bold">
              Descargos
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold">
              Paso 4
            </p>

            <p className="font-bold">
              Cierre
            </p>
          </div>

        </div>

        {/* ===========================
            INFORMACIÓN
        ============================ */}

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 mb-6">

          <h3 className="font-bold text-blue-800">
            Revisión de la citación
          </h3>

          <p className="text-sm text-gray-600 mt-2">
            En este paso Relaciones Laborales revisa la información enviada desde Operaciones, valida la citación disciplinaria y continúa con el proceso.
          </p>

        </div>

        {/* ===========================
            INFORMACIÓN TRABAJADOR
        ============================ */}

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 mb-6">

          <h3 className="font-bold text-emerald-800 mb-4">
            Información del trabajador
          </h3>

          <div className="rounded-xl border-2 border-dashed border-emerald-300 bg-white p-10">

            <div className="flex flex-col items-center justify-center text-center">

              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-4xl mb-5">
                👤
              </div>

              <h4 className="text-xl font-bold text-gray-800">
                No hay un trabajador seleccionado
              </h4>

              <p className="text-gray-500 mt-2 max-w-xl">
                Esta información será cargada automáticamente cuando el
                trabajador sea seleccionado en el paso anterior.
              </p>

            </div>

          </div>

        </div>

        {/* ===========================
            INFORMACIÓN DE LA CITACIÓN
        ============================ */}

        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">

         <h3 className="text-lg font-bold text-gray-800">
           Información recibida desde Operaciones
        </h3>

        <p className="text-sm text-gray-500 mt-1 mb-5">
            Estos datos serán cargados automáticamente desde el calendario de Operaciones.
            Relaciones Laborales revisará la citación, validará la información y continuará
            con el proceso disciplinario.
        </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div>
              <label className="text-sm font-semibold text-gray-700">
                    📅 Fecha de la citación
               </label>

              <Input disabled />
            </div>

            <div>
              <label className="text-sm font-medium">
                🕒 Hora de la citación
              </label>

              <Input disabled />
            </div>

            <div>
              <label className="text-sm font-medium">
                💻 Modalidad
              </label>

              <Input placeholder="Presencial / Virtual" disabled />
            </div>

            <div>
              <label className="text-sm font-medium">
                📍 Lugar
              </label>

              <Input disabled />
            </div>

            <div>
              <label className="text-sm font-medium">
                👨‍💼 Responsable de RRLL
              </label>

              <Input disabled />
            </div>

            <div>
              <label className="text-sm font-medium">
                👷 Supervisor que reporta
              </label>

              <Input disabled />
            </div>

            <div>
              <label className="text-sm font-medium">
                🏢 Cliente
              </label>

              <Input disabled />
            </div>

            <div>
              <label className="text-sm font-medium">
                📌 Sede
              </label>

              <Input disabled />
            </div>

          </div>
        </div>

                {/* ===========================
            MOTIVO
        ============================ */}

        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">

          <h3 className="text-lg font-bold text-gray-800 mb-5">
            Hechos del caso
          </h3>

          <div className="space-y-5">

            <div>
              <label className="text-sm font-medium">
                Tipo de falta disciplinaria
              </label>

              <Input
                placeholder="Seleccione el motivo"
                disabled
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Relato de los hechos
              </label>

              <textarea
                className="w-full border rounded-lg p-3 min-h-[120px] bg-gray-100 resize-none"
                disabled
                placeholder="Descripción de los hechos que originan la citación..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Observaciones adicionales
              </label>

              <textarea
                className="w-full border rounded-lg p-3 min-h-[100px] bg-gray-100 resize-none"
                disabled
                placeholder="Observaciones adicionales..."
              />
            </div>

          </div>

        </div>

        {/* ===========================
            DOCUMENTOS SOPORTE
        ============================ */}

        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">

          <h3 className="text-lg font-bold text-gray-800 mb-5">
            Evidencias del proceso
          </h3>

          <div className="border-2 border-dashed rounded-xl p-10 text-center bg-gray-50">

            <div className="text-5xl mb-4">
              📄
            </div>

            <h4 className="font-bold text-gray-700">
              Todavía no existen evidencias asociadas.
            </h4>

            <p className="text-gray-500 mt-2">
              Aquí aparecerán fotografías, videos,
              actas, llamados de atención,
              documentos y cualquier evidencia
              relacionada con el proceso disciplinario.
            </p>

            <Button
              className="mt-5 bg-emerald-700 hover:bg-emerald-800"
              disabled
            >
              Adjuntar documentos
            </Button>

          </div>

        </div>

        {/* ===========================
            NOTIFICACIONES
        ============================ */}

        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">

          <h3 className="text-lg font-bold text-gray-800 mb-5">
            Notificaciones automáticas
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            <div className="rounded-lg border p-4">

              <h4 className="font-semibold">
                Trabajador
              </h4>

              <p className="text-sm text-gray-500 mt-2">
                Se enviará la citación al correo
                registrado del trabajador.
              </p>

            </div>

            <div className="rounded-lg border p-4">

              <h4 className="font-semibold">
                Supervisor
              </h4>

              <p className="text-sm text-gray-500 mt-2">
                Se notificará al supervisor
                responsable del proceso.
              </p>

            </div>

            <div className="rounded-lg border p-4">

              <h4 className="font-semibold">
                Relaciones Laborales
              </h4>

              <p className="text-sm text-gray-500 mt-2">
                El sistema dejará trazabilidad
                completa del envío.
              </p>

            </div>

            <div className="rounded-lg border p-4">

            <h4 className="font-semibold">
                📅 Calendario Corporativo
            </h4>

            <p className="text-sm text-gray-500 mt-2">
                Pendiente de integración con el módulo de Operaciones.
                Cuando la citación sea programada aparecerá automáticamente
                en el calendario de Relaciones Laborales.
            </p>

            </div>

          </div>

          
        </div>

        {/* ===========================
            ESTADO DEL PROCESO
        ============================ */}

        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 mb-6">

          <h3 className="font-bold text-yellow-800">
            Estado del proceso
          </h3>

          <p className="text-sm text-gray-600 mt-2">
            La citación aún no ha sido programada.
            Complete la información para continuar
            con el flujo disciplinario.
          </p>

        </div>

        {/* ===========================
            BOTONES
        ============================ */}

        <div className="flex flex-col md:flex-row justify-between gap-3">

          <Button
            variant="outline"
            onClick={onBack}
          >
            ← Volver
          </Button>

          <div className="flex gap-3">

            <Button
              variant="outline"
              disabled
            >
              Guardar borrador
            </Button>

            <Button
            className="bg-emerald-700 hover:bg-emerald-800"
            onClick={() => setVista("descargos")}
            >
            Continuar →
            </Button>

          </div>

        </div>

      </div>

    </div>
  );
}