import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CitacionProcesoDisciplinarioView from "@/pages/CitacionProcesoDisciplinarioView";

export default function IniciarProcesoDisciplinarioView({ onBack }) {
      const [vista, setVista] = useState("inicio");

  if (vista === "citacion") {
    return (
      <CitacionProcesoDisciplinarioView
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
            Iniciar Proceso Disciplinario
          </h2>
          <p className="text-sm text-gray-500">
            Paso 1 de 4: selección del trabajador.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
          {["Iniciar", "Citación", "Descargos", "Cierre"].map((item, index) => (
            <div
              key={item}
              className={`rounded-xl border p-4 ${
                index === 0
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : "bg-gray-50 border-gray-200 text-gray-500"
              }`}
            >
              <p className="text-xs font-semibold">Paso {index + 1}</p>
              <p className="font-bold">{item}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-200 p-6 space-y-6">

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <h3 className="font-bold text-blue-800">
            Inicio del proceso disciplinario
            </h3>

            <p className="text-sm text-gray-600 mt-2">
            Seleccione el trabajador para iniciar el expediente disciplinario.
            Una vez seleccionado podrá continuar con las etapas de citación,
            descargos, cierre e indicadores.
            </p>
        </div>

        <div>

            <h3 className="text-lg font-bold text-gray-800">
            Buscar trabajador
            </h3>

            <p className="text-sm text-gray-500 mb-4">
            Busque por documento o nombre completo.
            </p>

            <div className="flex gap-6 mb-4">

            <label className="flex items-center gap-2">
                <input
                type="radio"
                checked
                readOnly
                />
                Documento
            </label>

            <label className="flex items-center gap-2">
                <input
                type="radio"
                readOnly
                />
                Nombre
            </label>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">

            <Input
                placeholder="Digite el documento o nombre del trabajador"
                disabled
            />

            <Button
                disabled
                className="bg-emerald-700 hover:bg-emerald-800"
            >
                Buscar
            </Button>

            </div>

        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">

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
                    Utilice el buscador ubicado en la parte superior para localizar
                    el trabajador con el que desea iniciar el proceso disciplinario.
                </p>

            </div>

        </div>

        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">

            <h3 className="font-bold text-gray-800 mb-4">
            Historial disciplinario
            </h3>

            <div className="overflow-x-auto rounded-xl border border-gray-200">

            <table className="min-w-full">

                <thead className="bg-gray-100">

                    <tr>

                        <th className="px-4 py-3 text-left text-sm font-semibold">
                            Fecha
                        </th>

                        <th className="px-4 py-3 text-left text-sm font-semibold">
                            Tipo
                        </th>

                        <th className="px-4 py-3 text-left text-sm font-semibold">
                            Estado
                        </th>

                        <th className="px-4 py-3 text-left text-sm font-semibold">
                            Responsable
                        </th>

                        <th className="px-4 py-3 text-center text-sm font-semibold">
                            Acciones
                        </th>

                    </tr>

                </thead>

                <tbody>

                    <tr>

                        <td
                            colSpan={5}
                            className="text-center text-gray-500 py-12"
                        >
                            No existen procesos disciplinarios para mostrar.
                        </td>

                    </tr>

                </tbody>

            </table>

            </div>

        </div>

        </div>

        <div className="flex flex-col md:flex-row justify-between gap-3 mt-6">
          <Button type="button" variant="outline" onClick={onBack}>
            Cancelar
          </Button>

         <Button
        type="button"
        className="bg-emerald-700 hover:bg-emerald-800 text-white"
        onClick={() => setVista("citacion")}
        >
        Continuar
        </Button>
        </div>
      </div>
    </div>
  );
}