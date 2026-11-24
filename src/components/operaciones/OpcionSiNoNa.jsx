import React from "react";

import { cn } from "@/lib/utils";

const OPCIONES = [
  { valor: "SI", etiqueta: "Sí" },
  { valor: "NO", etiqueta: "No" },
  { valor: "NA", etiqueta: "No aplica" },
];

/**
 * Respuesta Sí / No / No aplica con tres botones. `value` es "SI", "NO",
 * "NA" o "" (sin responder).
 */
const OpcionSiNoNa = ({ id, value, onChange, disabled, etiqueta }) => (
  <div
    role="radiogroup"
    aria-label={etiqueta}
    className="flex w-full gap-1.5 sm:w-auto"
  >
    {OPCIONES.map(({ valor, etiqueta: texto }) => (
      <button
        key={valor}
        type="button"
        role="radio"
        aria-checked={value === valor}
        id={`${id}-${valor}`}
        disabled={disabled}
        onClick={() => onChange(valor)}
        className={cn(
          "h-9 flex-1 whitespace-nowrap rounded-full border px-4 text-xs font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none",
          value === valor
            ? valor === "NA"
              ? "border-gray-500 bg-gray-500 text-white"
              : "border-emerald-600 bg-emerald-600 text-white"
            : "border-gray-200 bg-white text-gray-600 hover:border-emerald-300"
        )}
      >
        {texto}
      </button>
    ))}
  </div>
);

export default OpcionSiNoNa;
