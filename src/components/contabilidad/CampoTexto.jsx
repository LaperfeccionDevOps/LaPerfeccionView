import React from "react";

import { cn } from "@/lib/utils";

/**
 * Campo de texto redondeado de los formularios de centros de costo, con
 * mensaje de error (rojo) o de ayuda (gris) debajo.
 */
const CampoTexto = ({ id, label, valor, onChange, placeholder, error, ayuda, maxLength }) => (
  <div className="space-y-1">
    <label htmlFor={id} className="text-xs font-bold uppercase text-gray-700">
      {label}
    </label>
    <input
      id={id}
      type="text"
      autoComplete="off"
      value={valor}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-10 w-full rounded-full border bg-white px-4 text-sm outline-none focus:ring-2",
        error
          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
          : "border-gray-200 focus:border-emerald-400 focus:ring-emerald-100"
      )}
    />
    {error ? (
      <p className="px-4 text-xs text-red-600">{error}</p>
    ) : (
      ayuda && <p className="px-4 text-xs text-gray-500">{ayuda}</p>
    )}
  </div>
);

export default CampoTexto;
