import React, { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Calculator, FilePlus2, PencilLine, Search, UserPlus } from "lucide-react";

import { cn } from "@/lib/utils";

export const RUTAS_CENTROS_COSTO = {
  consultar: "/contabilidad/centros-costo",
  crear: "/contabilidad/centros-costo/crear",
  modificar: "/contabilidad/centros-costo/modificar",
  asignar: "/contabilidad/centros-costo/asignar",
};

const PESTANAS = [
  { to: RUTAS_CENTROS_COSTO.consultar, label: "Consultar", icon: Search, end: true },
  { to: RUTAS_CENTROS_COSTO.crear, label: "Crear", icon: FilePlus2 },
  { to: RUTAS_CENTROS_COSTO.modificar, label: "Modificar", icon: PencilLine },
  { to: RUTAS_CENTROS_COSTO.asignar, label: "Asignar", icon: UserPlus },
];

/**
 * Encabezado del módulo Contabilidad > Centros de costo, con los botones
 * para pasar entre Consultar, Crear, Modificar y Asignar. `children` se muestra dentro
 * de la misma tarjeta (p. ej. los filtros de la consulta).
 * El título y los botones van en una sola fila del mismo tamaño en todas las
 * vistas, para que los botones no cambien de lugar al pasar de una a otra; la
 * descripción va debajo y `compacto` la oculta (formularios largos).
 */
const EncabezadoCentrosCosto = ({ descripcion, compacto = false, children }) => {
  // Reserva siempre el espacio de la barra de desplazamiento de la ventana:
  // así las vistas cortas (sin barra) y las largas tienen el mismo ancho y los
  // botones no se corren. Solo mientras se está en este módulo.
  useEffect(() => {
    const html = document.documentElement;
    const anterior = html.style.scrollbarGutter;
    html.style.scrollbarGutter = "stable";

    return () => {
      html.style.scrollbarGutter = anterior;
    };
  }, []);

  return (
    <section className="w-full min-w-0 rounded-2xl border-t-4 border-emerald-600 bg-white p-4 shadow-xl sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-200">
            <Calculator className="h-6 w-6 text-white" />
          </div>

          <h1 className="min-w-0 break-words text-xl font-bold text-gray-800 sm:text-2xl">
            Centros de Costo
          </h1>
        </div>

        {/* Botones de ancho fijo: su posición no depende del texto, de la fuente
            ni de cuál está activo. */}
        <nav className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-3 lg:shrink-0 lg:justify-end" aria-label="Opciones de centros de costo">
          {PESTANAS.map(({ to, label, icon: Icono, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors sm:w-36",
                  isActive
                    ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-100"
                    : "border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:text-emerald-700"
                )
              }
            >
              <Icono className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      {!compacto && descripcion && (
        // Alineada con el título (ícono de 48 px + 12 px de separación).
        <p className="mt-3 break-words text-sm leading-relaxed text-gray-500 sm:pl-[60px]">
          {descripcion}
        </p>
      )}

      {children}
    </section>
  );
};

export default EncabezadoCentrosCosto;
