import React, { useEffect, useState } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTOS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

const separarHora = (valor) => {
  const [hora = "", minuto = ""] = String(valor || "").split(":");
  return { hora, minuto };
};

/**
 * Campo de hora siempre en formato 24 horas (00:00 a 23:59), con una lista
 * para la hora y otra para los minutos. El <input type="time"> del navegador
 * muestra a. m./p. m. según la configuración regional del equipo.
 *
 * `value` y `onChange` usan el formato "HH:MM"; mientras falte la hora o los
 * minutos, el valor es "".
 */
const CampoHora24 = ({
  id,
  label,
  value,
  onChange,
  disabled = false,
  invalido = false,
  mensajeError,
}) => {
  const [partes, setPartes] = useState(() => separarHora(value));

  // Si el formulario padre cambia o limpia el valor, se refleja aquí.
  useEffect(() => {
    if (value) {
      setPartes(separarHora(value));
    } else {
      setPartes((prev) =>
        prev.hora && prev.minuto ? { hora: "", minuto: "" } : prev
      );
    }
  }, [value]);

  const actualizar = (campo, valor) => {
    const nuevas = { ...partes, [campo]: valor };
    setPartes(nuevas);
    onChange(nuevas.hora && nuevas.minuto ? `${nuevas.hora}:${nuevas.minuto}` : "");
  };

  const claseSelect = cn(
    "h-11 w-full rounded-xl border bg-white px-3 text-center text-sm shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
    invalido
      ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
      : "border-gray-200 hover:border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/20"
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={`${id}-hora`}>
        {label}{" "}
        <span className="font-normal text-gray-400">(24 horas)</span>
      </Label>

      <div className="flex items-center gap-2">
        <select
          id={`${id}-hora`}
          aria-label={`${label}: hora`}
          value={partes.hora}
          onChange={(e) => actualizar("hora", e.target.value)}
          disabled={disabled}
          className={claseSelect}
        >
          <option value="">HH</option>
          {HORAS.map((hora) => (
            <option key={hora} value={hora}>
              {hora}
            </option>
          ))}
        </select>

        <span className="text-lg font-bold text-gray-400">:</span>

        <select
          id={`${id}-minuto`}
          aria-label={`${label}: minutos`}
          value={partes.minuto}
          onChange={(e) => actualizar("minuto", e.target.value)}
          disabled={disabled}
          className={claseSelect}
        >
          <option value="">MM</option>
          {MINUTOS.map((minuto) => (
            <option key={minuto} value={minuto}>
              {minuto}
            </option>
          ))}
        </select>
      </div>

      {invalido && mensajeError && (
        <p className="text-xs text-red-600">{mensajeError}</p>
      )}
    </div>
  );
};

export default CampoHora24;
