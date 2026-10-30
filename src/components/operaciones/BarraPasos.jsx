import React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Barra de pasos de un formulario por bloques (igual a la del permiso de
 * trabajo en alturas). `pasos` es [{ numero, titulo }] y `esCompleto(numero)`
 * indica si el paso ya está diligenciado (se marca con un chulo).
 */
const BarraPasos = ({ pasos, pasoActivo, esCompleto, onSeleccionar }) => (
  <nav className="-mx-1 overflow-x-auto px-1 pb-1">
    <ol className="flex min-w-max items-center gap-1">
      {pasos.map(({ numero, titulo }, indice) => {
        const completo = esCompleto(numero);
        const activo = numero === pasoActivo;

        return (
          <li key={numero} className="flex items-center gap-1">
            {indice > 0 && <span className="h-px w-4 bg-gray-200 sm:w-6" />}

            <button
              type="button"
              onClick={() => onSeleccionar(numero)}
              title={titulo}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors",
                activo
                  ? "bg-emerald-600 font-semibold text-white"
                  : "text-gray-700 hover:bg-emerald-50"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                  activo && "border-white bg-white text-emerald-700",
                  !activo && completo && "border-emerald-600 bg-emerald-600 text-white",
                  !activo && !completo && "border-gray-300"
                )}
              >
                {completo && !activo ? <Check className="h-3.5 w-3.5" /> : numero}
              </span>
              {titulo}
            </button>
          </li>
        );
      })}
    </ol>
  </nav>
);

export default BarraPasos;
