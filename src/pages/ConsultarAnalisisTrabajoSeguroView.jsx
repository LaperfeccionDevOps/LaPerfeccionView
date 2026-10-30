import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ClipboardList, FileText, Info } from "lucide-react";

import BuscadorPersonaContratada from "@/components/operaciones/BuscadorPersonaContratada";
import EncabezadoPermisosAlturas from "@/components/operaciones/EncabezadoPermisosAlturas";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  abrirPdfAnalisis,
  obtenerAnalisisTrabajoSeguro,
} from "@/services/analisisTrabajoSeguroService";
import {
  ENCABEZADO_ANALISIS_TRABAJO_SEGURO,
  ESTADOS_ANALISIS,
  RUTAS_ANALISIS_TRABAJO_SEGURO,
  formatearFechaSinHora,
} from "@/utils/analisisTrabajoSeguro";
import {
  formatearFecha,
  guardarResponsableSesion,
  leerResponsableSesion,
} from "@/utils/permisosAlturas";

const ConsultarAnalisisTrabajoSeguroView = () => {
  const [responsable, setResponsable] = useState(leerResponsableSesion);
  const [analisis, setAnalisis] = useState([]);
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const idResponsable = responsable?.id_registro_personal;

  useEffect(() => {
    if (!idResponsable) {
      setAnalisis([]);
      return;
    }

    setCargando(true);

    obtenerAnalisisTrabajoSeguro({ idResponsable })
      .then(setAnalisis)
      .catch((error) =>
        toast({
          title: "No se pudieron cargar los análisis",
          description: error.message,
          variant: "destructive",
        })
      )
      .finally(() => setCargando(false));
  }, [idResponsable]);

  const seleccionarResponsable = (persona) => {
    setResponsable(persona);
    guardarResponsableSesion(persona);
  };

  return (
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
        titulo="Consultar análisis de trabajo seguro"
        descripcion="Revisa los análisis de trabajo seguro creados."
        mostrarPestanas
        mostrarVolver
        {...ENCABEZADO_ANALISIS_TRABAJO_SEGURO}
      />

      <section className="w-full min-w-0 rounded-2xl bg-white p-4 shadow-xl sm:p-6 lg:p-8">
        {/* Temporal: con los roles, cada usuario verá directamente los
            análisis que creó. */}
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Selecciona el responsable para ver los análisis que creó.</p>
        </div>

        <div className="md:max-w-xl">
          <BuscadorPersonaContratada
            id="responsableConsultaAnalisis"
            label="Responsable"
            seleccionado={responsable}
            onSeleccionar={seleccionarResponsable}
          />
        </div>
      </section>

      {responsable && (
        <section className="w-full min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow-xl sm:p-6 lg:p-8">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-emerald-600" />

            <h2 className="text-lg font-bold text-gray-800">
              Análisis de {responsable.nombre_completo}
              {!cargando && ` (${analisis.length})`}
            </h2>
          </div>

          {cargando ? (
            <p className="mt-4 text-sm text-gray-500">Cargando análisis...</p>
          ) : analisis.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              Esta persona aún no ha creado análisis.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full min-w-[1040px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">ID análisis</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Lugar de trabajo</th>
                    <th className="px-4 py-3">Finaliza</th>
                    <th className="px-4 py-3">Altura</th>
                    <th className="px-4 py-3">Creado</th>
                    <th className="px-4 py-3">Trabajadores</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {analisis.map((item) => (
                    <tr
                      key={item.id_analisis_trabajo_seguro}
                      className="hover:bg-emerald-50/40"
                    >
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {item.id_analisis_trabajo_seguro}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {item.cliente}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {item.lugar_trabajo}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {formatearFechaSinHora(item.fecha_finalizacion_actividad)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {Number(item.altura_aproximada_metros).toLocaleString("es-CO")} m
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatearFecha(item.fecha_creacion)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {item.cantidad_trabajadores}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
                            ESTADOS_ANALISIS[item.estado]?.clase
                          )}
                        >
                          {ESTADOS_ANALISIS[item.estado]?.etiqueta || item.estado}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Ver PDF"
                          onClick={() =>
                            abrirPdfAnalisis(item.id_analisis_trabajo_seguro).catch(
                              (error) =>
                                toast({
                                  title: "No se pudo abrir el PDF",
                                  description: error.message,
                                  variant: "destructive",
                                })
                            )
                          }
                          className="mr-1 h-9 w-9 text-emerald-700 hover:bg-emerald-50"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            navigate(
                              RUTAS_ANALISIS_TRABAJO_SEGURO.detalle(
                                item.id_analisis_trabajo_seguro
                              )
                            )
                          }
                          className="h-9 gap-2 rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                          Continuar
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </motion.div>
  );
};

export default ConsultarAnalisisTrabajoSeguroView;
