import React from "react";
import { Copy } from "lucide-react";

/** Botón "Duplicar" del encabezado del detalle y de la asignación. */
const BotonDuplicar = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title="Crear un centro de costo nuevo con esta codificación (CEN 1 a CEN 5) para ajustar CEN 2, CEN 4 o CEN 5"
    className="inline-flex items-center gap-1 rounded-full border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
  >
    <Copy className="h-3.5 w-3.5" />
    Duplicar
  </button>
);

export default BotonDuplicar;
