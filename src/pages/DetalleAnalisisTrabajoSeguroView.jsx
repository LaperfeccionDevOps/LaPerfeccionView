import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, FileText, Loader2 } from "lucide-react";

import BarraPasos from "@/components/operaciones/BarraPasos";
import EncabezadoPermisosAlturas from "@/components/operaciones/EncabezadoPermisosAlturas";
import PasoEquiposAnalisis from "@/components/operaciones/PasoEquiposAnalisis";
import PasoVistoBuenoAnalisis from "@/components/operaciones/PasoVistoBuenoAnalisis";
import TareasAnalisisPanel from "@/components/operaciones/TareasAnalisisPanel";
import VerificacionDiariaAnalisis from "@/components/operaciones/VerificacionDiariaAnalisis";
import TrabajadoresAnalisisPanel from "@/components/operaciones/TrabajadoresAnalisisPanel";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  abrirPdfAnalisis,
  obtenerAnalisisTrabajoSeguroPorId,
} from "@/services/analisisTrabajoSeguroService";
import {
  ENCABEZADO_ANALISIS_TRABAJO_SEGURO,
  ESTADO_ANALISIS_APROBADO,
  ESTADOS_ANALISIS,
  PASOS_ANALISIS_TRABAJO_SEGURO,
  RUTAS_ANALISIS_TRABAJO_SEGURO,
  formatearFechaSinHora,
  pasoAnalisisCompleto,
  primerPasoPendienteAnalisis,
} from "@/utils/analisisTrabajoSeguro";
import { formatearFecha } from "@/utils/permisosAlturas";

const Dato = ({ etiqueta, valor }) => (
  <div className="min-w-0">
    <p className="text-xs font-medium uppercase text-gray-400">{etiqueta}</p>
    <p className="mt-1 break-words text-sm text-gray-800">{valor || "—"}</p>
  </div>
);

const BotonAnterior = ({ onClick }) => (
  <Button
    type="button"
    variant="outline"
    onClick={onClick}
    className="h-11 gap-2 rounded-xl"
  >
    <ArrowLeft className="h-4 w-4" />
    Anterior
  </Button>
);

const BotonSiguiente = ({ onClick, disabled = false }) => (
  <Button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="h-11 gap-2 rounded-xl bg-emerald-600 px-6 text-white hover:bg-emerald-700"
  >
    Siguiente
    <ArrowRight className="h-4 w-4" />
  </Button>
);

const DetalleAnalisisTrabajoSeguroView = () => {
  const { idAnalisis } = useParams();
  const [parametros, setParametros] = useSearchParams();

  const [analisis, setAnalisis] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCargando(true);
    setError(null);

    obtenerAnalisisTrabajoSeguroPorId(idAnalisis)
      .then((datos) => {
        setAnalisis(datos);

        // Sin paso en la dirección, se abre el primero que falta diligenciar.
        if (!parametros.get("paso")) {
          setParametros(
            { paso: String(primerPasoPendienteAnalisis(datos)) },
            { replace: true }
          );
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idAnalisis]);

  const pasoSolicitado = Number(parametros.get("paso"));
  const pasoActivo = PASOS_ANALISIS_TRABAJO_SEGURO.some(
    ({ numero }) => numero === pasoSolicitado
  )
    ? pasoSolicitado
    : 1;

  const irAPaso = (numero) => setParametros({ paso: String(numero) });

  if (cargando) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Cargando análisis...
      </div>
    );
  }

  if (error || !analisis) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-xl">
        <p className="text-gray-700">{error || "No se encontró el análisis."}</p>
        <Link
          to={RUTAS_ANALISIS_TRABAJO_SEGURO.consultar}
          className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:underline"
        >
          Volver a Consultar análisis
        </Link>
      </div>
    );
  }

  const editable = analisis.estado !== ESTADO_ANALISIS_APROBADO;

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
        titulo={`Análisis de trabajo seguro N.° ${analisis.id_analisis_trabajo_seguro}`}
        descripcion={`${analisis.cliente} · ${analisis.lugar_trabajo}`}
        mostrarVolver
        {...ENCABEZADO_ANALISIS_TRABAJO_SEGURO}
      >
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              ESTADOS_ANALISIS[analisis.estado]?.clase
            )}
          >
            {ESTADOS_ANALISIS[analisis.estado]?.etiqueta || analisis.estado}
          </span>

          <div className="flex flex-wrap items-center gap-3">
            {/* Sin visto bueno, el PDF sale con la marca "BORRADOR". */}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                abrirPdfAnalisis(analisis.id_analisis_trabajo_seguro).catch((err) =>
                  toast({
                    title: "No se pudo abrir el PDF",
                    description: err.message,
                    variant: "destructive",
                  })
                )
              }
              className="h-9 gap-2 rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              <FileText className="h-4 w-4" />
              {editable ? "Ver borrador PDF" : "Ver PDF"}
            </Button>

            <Link
              to={RUTAS_ANALISIS_TRABAJO_SEGURO.consultar}
              className="flex items-center gap-1 text-sm font-medium text-emerald-700 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a Consultar análisis
            </Link>
          </div>
        </div>

        <div className="mt-4 border-t border-gray-100 pt-4">
          <BarraPasos
            pasos={PASOS_ANALISIS_TRABAJO_SEGURO}
            pasoActivo={pasoActivo}
            esCompleto={(numero) => pasoAnalisisCompleto(numero, analisis)}
            onSeleccionar={irAPaso}
          />
        </div>
      </EncabezadoPermisosAlturas>

      <section className="w-full min-w-0 rounded-2xl bg-white p-4 shadow-xl sm:p-6 lg:p-8">
        {pasoActivo === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-800">
              1. Datos del análisis
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Dato
                etiqueta="Responsable"
                valor={`${analisis.responsable} · C.C. ${analisis.numero_identificacion_responsable}`}
              />
              <Dato etiqueta="Cliente" valor={analisis.cliente} />
              <Dato etiqueta="Lugar de trabajo" valor={analisis.lugar_trabajo} />
              <Dato
                etiqueta="Finaliza la actividad"
                valor={formatearFechaSinHora(analisis.fecha_finalizacion_actividad)}
              />
              <Dato
                etiqueta="Altura aproximada"
                valor={`${Number(analisis.altura_aproximada_metros).toLocaleString("es-CO")} m`}
              />
              <Dato etiqueta="Creado" valor={formatearFecha(analisis.fecha_creacion)} />
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-4">
              <BotonSiguiente onClick={() => irAPaso(2)} />
            </div>
          </div>
        )}

        {pasoActivo === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-800">
              2. Trabajadores que realizan la tarea
            </h2>

            <TrabajadoresAnalisisPanel
              idAnalisis={analisis.id_analisis_trabajo_seguro}
              editable={editable}
              onCantidadCambia={(cantidad) =>
                setAnalisis((prev) => ({
                  ...prev,
                  cantidad_trabajadores: cantidad,
                }))
              }
            />

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <BotonAnterior onClick={() => irAPaso(1)} />

              <div className="flex flex-col items-stretch gap-1 sm:items-end">
                <BotonSiguiente
                  onClick={() => irAPaso(3)}
                  disabled={!analisis.cantidad_trabajadores}
                />

                {!analisis.cantidad_trabajadores && (
                  <p className="text-xs text-gray-500">
                    Agrega al menos un trabajador para continuar.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {pasoActivo === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-800">3. Equipos</h2>

            <PasoEquiposAnalisis
              analisis={analisis}
              editable={editable}
              onGuardado={setAnalisis}
            />

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <BotonAnterior onClick={() => irAPaso(2)} />

              <div className="flex flex-col items-stretch gap-1 sm:items-end">
                <BotonSiguiente
                  onClick={() => irAPaso(4)}
                  disabled={!pasoAnalisisCompleto(3, analisis)}
                />

                {!pasoAnalisisCompleto(3, analisis) && (
                  <p className="text-xs text-gray-500">
                    Guarda el bloque de equipos para continuar.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {pasoActivo === 4 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-800">
              4. Asignación de tareas e identificación de peligros
            </h2>

            <TareasAnalisisPanel
              idAnalisis={analisis.id_analisis_trabajo_seguro}
              editable={editable}
              onResumenCambia={(resumen) =>
                setAnalisis((prev) => ({ ...prev, ...resumen }))
              }
            />

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <BotonAnterior onClick={() => irAPaso(3)} />

              <div className="flex flex-col items-stretch gap-1 sm:items-end">
                <BotonSiguiente
                  onClick={() => irAPaso(5)}
                  disabled={!pasoAnalisisCompleto(4, analisis)}
                />

                {!pasoAnalisisCompleto(4, analisis) && (
                  <p className="text-xs text-gray-500">
                    Registra al menos una tarea con su peligro para continuar.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {pasoActivo === 5 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-800">
              5. Verificación diaria
            </h2>

            <VerificacionDiariaAnalisis
              idAnalisis={analisis.id_analisis_trabajo_seguro}
              onResumenCambia={(resumen) =>
                setAnalisis((prev) => ({ ...prev, ...resumen }))
              }
            />

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <BotonAnterior onClick={() => irAPaso(4)} />
              <BotonSiguiente onClick={() => irAPaso(6)} />
            </div>
          </div>
        )}

        {pasoActivo === 6 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-800">
              6. Visto bueno del coordinador de alturas
            </h2>

            <PasoVistoBuenoAnalisis analisis={analisis} onAprobado={setAnalisis} />

            <div className="flex border-t border-gray-100 pt-4">
              <BotonAnterior onClick={() => irAPaso(5)} />
            </div>
          </div>
        )}
      </section>
    </motion.div>
  );
};

export default DetalleAnalisisTrabajoSeguroView;
