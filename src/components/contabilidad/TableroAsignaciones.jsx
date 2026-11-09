import React from "react";
import { Building2, CalendarDays, Moon, MoonStar, Users } from "lucide-react";

const numero = (valor) => Number(valor || 0).toLocaleString("es-CO", { maximumFractionDigits: 1 });

// Indicador compacto: ícono pequeño, etiqueta en una línea y el valor con su
// detalle al lado. `titulo` explica el indicador al pasar el mouse. También lo
// usan los totales de la consulta (centros, abiertos, cerrados, pendientes).
export const Indicador = ({ icono: Icono, etiqueta, valor, detalle, clase, claseValor = "text-gray-800", titulo }) => (
  <div title={titulo} className="flex min-w-0 items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 shadow-md">
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${clase}`}>
      <Icono className="h-4 w-4" />
    </div>
    <div className="min-w-0">
      <p className="truncate text-[11px] font-bold uppercase text-gray-700">{etiqueta}</p>
      <p className="flex items-baseline gap-1.5">
        <span className={`text-xl font-bold leading-tight ${claseValor}`}>{valor ?? "—"}</span>
        {detalle && <span className="truncate text-xs text-gray-500">{detalle}</span>}
      </p>
    </div>
  </div>
);

/**
 * Tablero pequeño de Consultar con las asignaciones vigentes de los centros
 * del resultado filtrado: operarios, centros sin asignar y operarios con horas
 * nocturnas, dominicales o nocturnas dominicales (recargos).
 */
const TableroAsignaciones = ({ asignacion }) => {
  if (!asignacion) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        <Indicador
          icono={Users}
          etiqueta="Operarios"
          valor={numero(asignacion.operarios)}
          detalle={`en ${numero(asignacion.centros_con_asignacion)} centro(s)`}
          titulo="Operarios de las asignaciones vigentes de los centros filtrados"
          clase="bg-emerald-100 text-emerald-700"
        />
        <Indicador
          icono={Building2}
          etiqueta="Sin asignar"
          valor={numero(asignacion.abiertos_sin_asignacion)}
          detalle="centros abiertos"
          titulo="Centros abiertos sin operarios registrados"
          clase="bg-gray-100 text-gray-600"
        />
        <Indicador
          icono={Moon}
          etiqueta="Recargo nocturno"
          valor={numero(asignacion.operarios_con_nocturnas)}
          detalle={`op. · ${numero(asignacion.horas_nocturnas_semana)} h/sem`}
          titulo="Operarios con horas nocturnas y total de horas nocturnas por semana"
          clase="bg-indigo-100 text-indigo-700"
        />
        <Indicador
          icono={CalendarDays}
          etiqueta="Recargo dominical"
          valor={numero(asignacion.operarios_con_dominicales)}
          detalle={`op. · ${numero(asignacion.horas_dominicales_semana)} h/sem`}
          titulo="Operarios que trabajan el domingo y total de horas dominicales por semana"
          clase="bg-amber-100 text-amber-700"
        />
        <Indicador
          icono={MoonStar}
          etiqueta="Noct. dominical"
          valor={numero(asignacion.operarios_con_nocturnas_dominicales)}
          detalle={`op. · ${numero(asignacion.horas_nocturnas_dominicales_semana)} h/sem`}
          titulo="Operarios con horas el domingo en franja nocturna (los dos recargos) y total por semana"
          clase="bg-fuchsia-100 text-fuchsia-700"
        />
    </div>
  );
};

export default TableroAsignaciones;
