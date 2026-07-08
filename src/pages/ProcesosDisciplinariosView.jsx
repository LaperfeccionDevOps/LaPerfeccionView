import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import IniciarProcesoDisciplinarioView from "@/pages/IniciarProcesoDisciplinarioView";

export default function ProcesosDisciplinariosView({ onBack }) {
    const [vista, setVista] = useState("inicio");

if (vista === "iniciar") {
  return (
    <IniciarProcesoDisciplinarioView
      onBack={() => setVista("inicio")}
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
            Procesos Disciplinarios
          </h2>
          <p className="text-sm text-gray-500">
            Gestión de citaciones, descargos, documentos, cierre e indicadores.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3">
            Bienvenido al módulo de Procesos Disciplinarios
          </h3>

          <p className="text-sm text-gray-600 mb-4">
            Desde este módulo se gestionará el flujo disciplinario completo del
            trabajador, desde la citación a descargos hasta el cierre del proceso.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
            <div className="bg-white rounded-xl p-4 border border-emerald-100">
              Citación a descargos
            </div>
            <div className="bg-white rounded-xl p-4 border border-emerald-100">
              Diligencia de descargos
            </div>
            <div className="bg-white rounded-xl p-4 border border-emerald-100">
              Documentos disciplinarios
            </div>
            <div className="bg-white rounded-xl p-4 border border-emerald-100">
              Cierre del proceso
            </div>
            <div className="bg-white rounded-xl p-4 border border-emerald-100">
              Historial del proceso
            </div>
            <div className="bg-white rounded-xl p-4 border border-emerald-100">
              Indicadores y Excel
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mt-6">
         <Button
            type="button"
            className="bg-emerald-700 hover:bg-emerald-800 text-white"
            onClick={() => setVista("iniciar")}
            >
            Iniciar Proceso Disciplinario
            </Button>

          <Button type="button" variant="outline" onClick={onBack}>
            Volver a RRLL
          </Button>
        </div>
      </div>
    </div>
  );
}