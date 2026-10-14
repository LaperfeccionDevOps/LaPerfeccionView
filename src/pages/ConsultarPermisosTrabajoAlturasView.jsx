import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ClipboardList, Eye, FileText, Info } from "lucide-react";

import BuscadorPersonaContratada from "@/components/operaciones/BuscadorPersonaContratada";
import EncabezadoPermisosAlturas from "@/components/operaciones/EncabezadoPermisosAlturas";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  abrirPdfPermisoAlturas,
  obtenerPermisosAlturas,
} from "@/services/permisosAlturasService";
import {
  ESTADO_EN_DILIGENCIAMIENTO,
  ESTADOS_PERMISO,
  RUTAS_PERMISOS_ALTURAS,
  formatearFecha,
  formatearFechaDia,
  formatearHora,
  guardarResponsableSesion,
  leerResponsableSesion,
} from "@/utils/permisosAlturas";

const ConsultarPermisosTrabajoAlturasView = () => {
  const [responsable, setResponsable] = useState(leerResponsableSesion);
  const [permisos, setPermisos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const idResponsable = responsable?.id_registro_personal;

  useEffect(() => {
    if (!idResponsable) {
      setPermisos([]);
      return;
    }

    setCargando(true);

    obtenerPermisosAlturas({ idResponsable })
      .then(setPermisos)
      .catch((error) =>
        toast({
          title: "No se pudieron cargar los permisos",
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
        titulo="Consultar permisos de trabajo en alturas"
        descripcion="Revisa los permisos creados y los trabajadores registrados en cada uno."
        mostrarPestanas
      />

      <section className="w-full min-w-0 rounded-2xl bg-white p-4 shadow-xl sm:p-6 lg:p-8">
        {/* Temporal: con los roles, cada usuario verá directamente los
            permisos que creó y Gerencia HSEQ verá todos. */}
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Selecciona el responsable para ver los permisos que creó.
          </p>
        </div>

        <div className="md:max-w-xl">
          <BuscadorPersonaContratada
            id="responsableConsulta"
            label="Responsable del permiso"
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
              Permisos de {responsable.nombre_completo}
              {!cargando && ` (${permisos.length})`}
            </h2>
          </div>

          {cargando ? (
            <p className="mt-4 text-sm text-gray-500">
              Cargando permisos...
            </p>
          ) : permisos.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              Esta persona aún no ha creado permisos.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">ID permiso</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Horario</th>
                    <th className="px-4 py-3">Creado</th>
                    <th className="px-4 py-3">Trabajadores</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {permisos.map((permiso) => (
                    <tr
                      key={permiso.id_permiso_trabajo_alturas}
                      className="hover:bg-emerald-50/40"
                    >
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {permiso.id_permiso_trabajo_alturas}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {formatearFechaDia(permiso.fecha_hora_inicio_tarea)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {permiso.cliente}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {formatearHora(permiso.fecha_hora_inicio_tarea)}
                        {" – "}
                        {formatearHora(permiso.fecha_hora_fin_tarea)}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatearFecha(permiso.fecha_creacion)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {permiso.cantidad_trabajadores || 0}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
                            ESTADOS_PERMISO[permiso.estado]?.clase ||
                              "bg-gray-100 text-gray-700"
                          )}
                        >
                          {ESTADOS_PERMISO[permiso.estado]?.etiqueta ||
                            permiso.estado}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {permiso.estado !== ESTADO_EN_DILIGENCIAMIENTO && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="Ver PDF"
                            onClick={() =>
                              abrirPdfPermisoAlturas(
                                permiso.id_permiso_trabajo_alturas
                              ).catch((error) =>
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
                        )}

                        {/* Continuar abre el primer paso pendiente. */}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            navigate(
                              RUTAS_PERMISOS_ALTURAS.detalle(
                                permiso.id_permiso_trabajo_alturas
                              )
                            )
                          }
                          className="h-9 gap-2 rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                          {permiso.estado === ESTADO_EN_DILIGENCIAMIENTO ? (
                            <>
                              Continuar
                              <ArrowRight className="h-4 w-4" />
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4" />
                              Ver
                            </>
                          )}
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

export default ConsultarPermisosTrabajoAlturasView;
