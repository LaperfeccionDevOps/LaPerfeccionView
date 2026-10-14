import React from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Pregunta de respuesta Sí / No con dos botones. `value` es "SI", "NO" o ""
 * (sin responder): empieza vacía para obligar a responder de forma explícita.
 */
const OpcionSiNo = ({ id, label, value, onChange, disabled }) => (
  <div className="space-y-2">
    <Label>{label}</Label>

    <div className="flex gap-2">
      {["SI", "NO"].map((opcion) => (
        <button
          key={opcion}
          type="button"
          id={`${id}-${opcion}`}
          disabled={disabled}
          onClick={() => onChange(opcion)}
          className={cn(
            "h-11 flex-1 rounded-xl border text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
            value === opcion
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-gray-200 bg-white text-gray-600 hover:border-emerald-300"
          )}
        >
          {opcion === "SI" ? "Sí" : "No"}
        </button>
      ))}
    </div>
  </div>
);

export default OpcionSiNo;
