import React, { useState } from "react";

export default function RetirosModal({ open, onClose }) {
  const [search, setSearch] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute left-1/2 top-1/2 w-[95%] max-w-4xl -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl border border-emerald-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Retiros</h3>
            <p className="text-sm text-slate-500">
              Punto de inicio del módulo RRLL. Aquí vamos a buscar trabajador y crear el retiro.
            </p>
          </div>

          <button
            onClick={onClose}
            className="h-10 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold"
          >
            Cerrar
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Sección de búsqueda (placeholder) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Buscar trabajador</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre, apellido o cédula..."
                className="mt-2 w-full h-11 rounded-xl border border-slate-200 px-4 outline-none focus:border-emerald-400"
              />
            </div>

            <div className="flex items-end">
              <button
                className="w-full h-11 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
                onClick={() => alert("Luego conectamos el endpoint de búsqueda")}
              >
                Buscar
              </button>
            </div>
          </div>

          {/* Zona donde luego irá: tabla de resultados + botón crear retiro */}
          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">
              Aquí pondremos:
              <br />• resultados de búsqueda (tabla)
              <br />• botón “Crear retiro”
              <br />• y después el detalle del retiro con requisitos.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-11 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold"
          >
            Cancelar
          </button>

          <button
            onClick={() => alert("Luego: abrir formulario Crear Retiro")}
            className="h-11 px-5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
          >
            Crear retiro (próximo paso)
          </button>
        </div>
      </div>
    </div>
  );
}