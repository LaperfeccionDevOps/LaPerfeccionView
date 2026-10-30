import React, { useMemo, useState } from "react";
import { Check } from "lucide-react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Selector de un peligro de la matriz: primero la categoría de riesgo y luego
 * el peligro de esa categoría. Cada peligro muestra su riesgo asociado y su
 * consecuencia. `idsNoSeleccionables` son los peligros que ya tiene la tarea.
 */
const SelectorPeligroMatriz = ({
  id,
  label = "Peligro *",
  matriz,
  seleccionado,
  onSeleccionar,
  idsNoSeleccionables = [],
  disabled = false,
}) => {
  const riesgos = useMemo(() => {
    const lista = [];

    matriz.forEach((fila) => {
      if (!lista.some((r) => r.id === fila.id_riesgo_matriz_peligro)) {
        lista.push({ id: fila.id_riesgo_matriz_peligro, nombre: fila.riesgo });
      }
    });

    return lista;
  }, [matriz]);

  const [idRiesgo, setIdRiesgo] = useState(
    () =>
      matriz.find((fila) => fila.id_matriz_peligro === seleccionado)
        ?.id_riesgo_matriz_peligro ?? null
  );

  const peligros = matriz.filter(
    (fila) => fila.id_riesgo_matriz_peligro === idRiesgo
  );

  return (
    <div className="space-y-3">
      <Label id={`${id}-etiqueta`}>{label}</Label>

      <div>
        <p className="mb-2 text-xs font-medium uppercase text-gray-400">
          1. Riesgo
        </p>

        <div
          role="group"
          aria-labelledby={`${id}-etiqueta`}
          className="flex flex-wrap gap-2"
        >
          {riesgos.map((riesgo) => (
            <button
              key={riesgo.id}
              type="button"
              disabled={disabled}
              aria-pressed={idRiesgo === riesgo.id}
              onClick={() => setIdRiesgo(riesgo.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                idRiesgo === riesgo.id
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300"
              )}
            >
              {riesgo.nombre}
            </button>
          ))}
        </div>
      </div>

      {idRiesgo != null && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase text-gray-400">
            2. Peligro
          </p>

          <div className="space-y-2">
            {peligros.map((fila) => {
              const yaRegistrado = idsNoSeleccionables.includes(
                fila.id_matriz_peligro
              );
              const activo = seleccionado === fila.id_matriz_peligro;

              return (
                <button
                  key={fila.id_matriz_peligro}
                  type="button"
                  disabled={disabled || yaRegistrado}
                  aria-pressed={activo}
                  onClick={() => onSeleccionar(fila.id_matriz_peligro)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed",
                    activo
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-gray-200 bg-white hover:border-emerald-300",
                    yaRegistrado && "opacity-50"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                      activo
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-gray-300 bg-white"
                    )}
                  >
                    {activo && <Check className="h-3 w-3" />}
                  </span>

                  <span className="min-w-0 space-y-1">
                    <span className="block text-sm font-semibold text-gray-800">
                      {fila.peligro}
                      {fila.peligro_adicional && ` · ${fila.peligro_adicional}`}
                      {yaRegistrado && (
                        <span className="ml-2 text-xs font-normal text-gray-500">
                          (Ya registrado en la tarea)
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-gray-600">
                      <span className="font-medium">Riesgo asociado:</span>{" "}
                      {fila.riesgo_asociado}
                    </span>
                    <span className="block text-xs text-gray-600">
                      <span className="font-medium">Consecuencia:</span>{" "}
                      {fila.consecuencia_asociada}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectorPeligroMatriz;
