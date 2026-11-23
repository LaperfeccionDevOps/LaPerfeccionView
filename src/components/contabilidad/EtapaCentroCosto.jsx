import React from "react";

import { cn } from "@/lib/utils";

/**
 * Etapa de un centro de costo según las fechas del proyecto (la calcula la
 * API). "Por iniciar" y "Fin vencido" siguen ABIERTOS: se pueden usar para
 * asignar operarios, dotación, etc.
 */
export const ETAPAS = {
  POR_INICIAR: { etiqueta: "Por iniciar", clase: "bg-sky-100 text-sky-800" },
  EN_EJECUCION: { etiqueta: "Abierto", clase: "bg-emerald-100 text-emerald-800" },
  FIN_VENCIDO: { etiqueta: "Fin vencido", clase: "bg-amber-100 text-amber-800" },
  CERRADO: { etiqueta: "Cerrado", clase: "bg-gray-100 text-gray-700" },
};

// "2026-10-30" -> "30/10/2026" (sin zona horaria, para no correr el día).
export const formatearFecha = (valor) => (valor ? valor.split("-").reverse().join("/") : null);

// Texto de ayuda de la etapa, p. ej. "Abierto; inicia el 25/11/2026".
export const descripcionEtapa = (centro) => {
  switch (centro.etapa) {
    case "POR_INICIAR":
      return `Abierto; el proyecto inicia el ${formatearFecha(centro.fecha_inicio_proyecto)}.`;
    case "FIN_VENCIDO":
      return `Abierto; el proyecto terminaba el ${formatearFecha(centro.fecha_fin_proyecto)}. Revisar si se debe cerrar.`;
    case "CERRADO":
      return "Cerrado.";
    default:
      return "Abierto, en ejecución.";
  }
};

const EtapaCentroCosto = ({ centro, className }) => {
  const etapa = ETAPAS[centro.etapa] || ETAPAS[centro.estado === "CERRADO" ? "CERRADO" : "EN_EJECUCION"];

  return (
    <span
      title={descripcionEtapa(centro)}
      className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", etapa.clase, className)}
    >
      {etapa.etiqueta}
    </span>
  );
};

export default EtapaCentroCosto;
