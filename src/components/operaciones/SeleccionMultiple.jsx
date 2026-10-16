import React from "react";
import { Check } from "lucide-react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Lista de selección múltiple: cada opción es un botón que se marca o
 * desmarca. `seleccionados` es la lista de ids elegidos.
 * Las opciones elegidas que ya no están activas en el catálogo (inactivadas
 * por HSEQ) se muestran igual para no perder lo registrado.
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
}) => {
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
          "flex flex-wrap gap-2 rounded-xl border p-3",
          invalido ? "border-red-300 bg-red-50/40" : "border-gray-200"
        )}
      >
        {opciones.map((opcion) => {
          const activo = seleccionados.includes(opcion.id);

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
