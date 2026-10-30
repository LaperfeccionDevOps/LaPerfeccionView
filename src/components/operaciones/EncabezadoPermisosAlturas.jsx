import React from "react";
import { Link, NavLink } from "react-router-dom";
import { ArrowLeft, ClipboardList, FilePlus2, HardHat } from "lucide-react";

import { cn } from "@/lib/utils";
import { RUTAS_PERMISOS_ALTURAS } from "@/utils/permisosAlturas";

export const SUBMODULOS_PERMISOS_ALTURAS = [
  {
    to: RUTAS_PERMISOS_ALTURAS.crear,
    label: "Crear permiso",
    descripcion:
      "Registra un nuevo permiso de trabajo en alturas y sus trabajadores.",
    icon: FilePlus2,
  },
  {
    to: RUTAS_PERMISOS_ALTURAS.consultar,
    label: "Consultar permisos",
    descripcion:
      "Revisa los permisos creados y los trabajadores registrados en cada uno.",
    icon: ClipboardList,
  },
];

/**
 * Encabezado de las vistas de Operaciones > Alturas.
 * Con mostrarPestanas, permite pasar entre Crear y Consultar.
 * Con mostrarVolver, muestra un botón para regresar al menú principal del
 * módulo (en celular no hay otra forma de salir sin abrir la barra lateral).
 * Por defecto apunta a Permisos de trabajo; otros módulos (p. ej. Análisis de
 * Trabajo Seguro) envían sus propias pestañas y ruta de regreso.
 */
const EncabezadoPermisosAlturas = ({
  titulo,
  descripcion,
  mostrarPestanas = false,
  mostrarVolver = false,
  pestanas = SUBMODULOS_PERMISOS_ALTURAS,
  rutaVolver = RUTAS_PERMISOS_ALTURAS.inicio,
  etiquetaVolver = "Permisos de trabajo",
  children,
}) => (
  <section className="w-full min-w-0 overflow-hidden rounded-2xl border-t-4 border-emerald-600 bg-white p-4 shadow-xl sm:p-6 lg:p-8">
    {mostrarVolver && (
      <Link
        to={rutaVolver}
        className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 px-3 py-1.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50"
      >
        <ArrowLeft className="h-4 w-4" />
        {etiquetaVolver}
      </Link>
    )}

    <div className="flex min-w-0 items-start gap-3 sm:items-center">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-200">
        <HardHat className="h-6 w-6 text-white" />
      </div>

      <div className="min-w-0">
        <h1 className="break-words text-xl font-bold text-gray-800 sm:text-2xl">
          {titulo}
        </h1>

        <p className="mt-1 break-words text-sm leading-relaxed text-gray-500">
          {descripcion}
        </p>
      </div>
    </div>

    {mostrarPestanas && (
      <nav className="mt-6 flex gap-2 overflow-x-auto border-b border-gray-100">
        {pestanas.map(({ to, label, icon: Icono }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-2 text-sm font-semibold transition-colors",
                isActive
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-gray-500 hover:text-emerald-700"
              )
            }
          >
            <Icono className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    )}

    {children}
  </section>
);

export default EncabezadoPermisosAlturas;
