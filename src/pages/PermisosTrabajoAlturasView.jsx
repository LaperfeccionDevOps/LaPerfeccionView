import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Scale } from "lucide-react";

import EncabezadoPermisosAlturas, {
  SUBMODULOS_PERMISOS_ALTURAS,
} from "@/components/operaciones/EncabezadoPermisosAlturas";

const PermisosTrabajoAlturasView = () => (
  <motion.div
    initial={{
      opacity: 0,
      y: 20,
    }}
    animate={{
      opacity: 1,
      y: 0,
    }}
    className="w-full min-w-0 max-w-full space-y-4 overflow-x-hidden"
  >
    <EncabezadoPermisosAlturas
      titulo="Permisos de Trabajo en Alturas"
      descripcion="Gestión de permisos de trabajo para tareas con riesgo de caída."
    >
      <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 sm:p-8">
        <div className="flex items-center gap-2 text-emerald-700">
          <Scale className="h-5 w-5 shrink-0" />

          <h2 className="text-base font-bold sm:text-lg">
            Resolución 4272 de 2021
          </h2>
        </div>

        <p className="mt-4 text-justify text-sm leading-relaxed text-gray-700 sm:text-base">
          <span className="font-semibold text-gray-800">
            Artículo 15.
          </span>{" "}
          Todos los trabajos en alturas deben obedecer a una
          acción planificada, organizada y ejecutada por
          trabajadores autorizados que debe verse reflejada en
          los controles administrativos como el Permiso de
          trabajo o sus anexos. Siempre que un trabajador
          ingrese a una zona de peligro, debe contar con la
          debida autorización y si requiere exponerse al riesgo
          de caídas, debe contar con un aval a través de un
          permiso de trabajo en alturas acompañado de una lista
          de chequeo, más aún en caso de que no haya barandas,
          sistemas de control de acceso, demarcación o sistemas
          de barreras físicas que cumplan con las
          especificaciones descritas en la presente resolución.
        </p>
      </div>
    </EncabezadoPermisosAlturas>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {SUBMODULOS_PERMISOS_ALTURAS.map(
        ({ to, label, descripcion, icon: Icono }) => (
          <Link
            key={to}
            to={to}
            className="group flex items-start gap-4 rounded-2xl border border-transparent bg-white p-5 shadow-xl transition-all duration-200 hover:border-emerald-200 hover:shadow-emerald-100 sm:p-6"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
              <Icono className="h-6 w-6" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-gray-800">
                {label}
              </h2>

              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                {descripcion}
              </p>
            </div>

            <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-emerald-600" />
          </Link>
        )
      )}
    </div>
  </motion.div>
);

export default PermisosTrabajoAlturasView;
