import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import EncabezadoPermisosAlturas from "@/components/operaciones/EncabezadoPermisosAlturas";
import { SUBMODULOS_ANALISIS_TRABAJO_SEGURO } from "@/utils/analisisTrabajoSeguro";

const AnalisisTrabajoSeguroView = () => (
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
      titulo="Análisis de Trabajo Seguro"
      descripcion="Gestión de los análisis de trabajo seguro de las tareas en alturas."
    />

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {SUBMODULOS_ANALISIS_TRABAJO_SEGURO.map(
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

export default AnalisisTrabajoSeguroView;
