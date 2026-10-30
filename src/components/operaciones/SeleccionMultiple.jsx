import React from "react";
import { Check } from "lucide-react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Lista de selección múltiple: cada opción es un botón que se marca o
 * desmarca. `seleccionados` es la lista de ids elegidos.
 * Las opciones elegidas que ya no están activas en el catálogo (inactivadas
 * por HSEQ) se muestran igual para no perder lo registrado.
 *
 * `variante`: "pildoras" (botones que se acomodan según su largo) o
 * "cuadricula" (casillas alineadas en columnas, que se leen de arriba abajo).
 */
const SeleccionMultiple = ({
  id,
  label,
  opciones,
  seleccionados,
  onChange,
  disabled = false,
  invalido = false,
  mensajeError,
  variante = "pildoras",
}) => {
  const cuadricula = variante === "cuadricula";

  const alternar = (idOpcion) => {
    onChange(
      seleccionados.includes(idOpcion)
        ? seleccionados.filter((valor) => valor !== idOpcion)
        : [...seleccionados, idOpcion]
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label id={`${id}-etiqueta`}>{label}</Label>
        <span className="shrink-0 text-xs text-gray-500">
          {seleccionados.length === 1
            ? "1 seleccionada"
            : `${seleccionados.length} seleccionadas`}
        </span>
      </div>

      <div
        role="group"
        aria-labelledby={`${id}-etiqueta`}
        className={cn(
          "rounded-xl border p-3",
          cuadricula
            ? "columns-1 gap-x-3 sm:columns-2 lg:columns-3"
            : "flex flex-wrap gap-2",
          invalido ? "border-red-300 bg-red-50/40" : "border-gray-200"
        )}
      >
        {opciones.map((opcion) => {
          const activo = seleccionados.includes(opcion.id);

          if (cuadricula) {
            return (
              <button
                key={opcion.id}
                type="button"
                aria-pressed={activo}
                disabled={disabled}
                onClick={() => alternar(opcion.id)}
                className={cn(
                  "mb-2 flex w-full break-inside-avoid items-center gap-2 rounded-full border px-4 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                  activo
                    ? "border-emerald-300 bg-emerald-50 font-medium text-emerald-800"
                    : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300"
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                    activo
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-gray-300 bg-white"
                  )}
                >
                  {activo && <Check className="h-3 w-3" />}
                </span>
                <span className="min-w-0 break-words">{opcion.nombre}</span>
              </button>
            );
          }

          return (
            <button
              key={opcion.id}
              type="button"
              aria-pressed={activo}
              disabled={disabled}
              onClick={() => alternar(opcion.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60",
                activo
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300"
              )}
            >
              {activo && <Check className="h-3.5 w-3.5" />}
              {opcion.nombre}
            </button>
          );
        })}
      </div>

      {invalido && mensajeError && (
        <p className="text-xs text-red-600">{mensajeError}</p>
      )}
    </div>
  );
};

export default SeleccionMultiple;
