import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, FileText, Loader2 } from "lucide-react";

import EncabezadoPermisosAlturas from "@/components/operaciones/EncabezadoPermisosAlturas";
import PasoAutorizacionPermisoAlturas from "@/components/operaciones/PasoAutorizacionPermisoAlturas";
import PasoListaPreguntasPermiso from "@/components/operaciones/PasoListaPreguntasPermiso";
import PasoTareaPermisoAlturas from "@/components/operaciones/PasoTareaPermisoAlturas";
import TrabajadoresPermisoAlturasPanel from "@/components/operaciones/TrabajadoresPermisoAlturasPanel";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  abrirPdfPermisoAlturas,
  guardarPeligrosPermisoAlturas,
  guardarProteccionPermisoAlturas,
  guardarVerificacionPermisoAlturas,
  obtenerPeligrosPermisoAlturas,
  obtenerPermisoAlturas,
  obtenerProteccionPermisoAlturas,
  obtenerVerificacionPermisoAlturas,
} from "@/services/permisosAlturasService";
import {
  ESTADO_EN_DILIGENCIAMIENTO,
  ESTADOS_PERMISO,
  PASOS_PERMISO_ALTURAS,
  RUTAS_PERMISOS_ALTURAS,
  formatearFecha,
  formatearFechaDia,
  formatearHora,
  primerPasoPendiente,
  tareaCompleta,
} from "@/utils/permisosAlturas";

const pasoCompleto = (numero, permiso) => {
  if (numero === 1) {
    return true;
  }

  if (numero === 2) {
    return permiso.cantidad_trabajadores > 0;
  }

  if (numero === 3) {
    return tareaCompleta(permiso);
  }

  if (numero === 4) {
    return Boolean(permiso.proteccion_completa);
  }

  if (numero === 5) {
    return Boolean(permiso.verificacion_completa);
  }

  if (numero === 6) {
    return Boolean(permiso.peligros_completa);
  }

  if (numero === 7) {
    return permiso.estado !== ESTADO_EN_DILIGENCIAMIENTO;
  }

  return false;
};

const BarraPasos = ({ permiso, pasoActivo, onSeleccionar }) => (
  <nav className="-mx-1 overflow-x-auto px-1 pb-1">
    <ol className="flex min-w-max items-center gap-1">
      {PASOS_PERMISO_ALTURAS.map(({ numero, titulo, pendiente }, indice) => {
        const completo = !pendiente && pasoCompleto(numero, permiso);
        const activo = numero === pasoActivo;

        return (
          <li key={numero} className="flex items-center gap-1">
            {indice > 0 && <span className="h-px w-4 bg-gray-200 sm:w-6" />}

            <button
              type="button"
              disabled={pendiente}
              onClick={() => onSeleccionar(numero)}
              title={pendiente ? "Próximamente" : titulo}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors",
                activo && "bg-emerald-600 font-semibold text-white",
                !activo && !pendiente && "text-gray-700 hover:bg-emerald-50",
                pendiente && "cursor-not-allowed text-gray-400"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                  activo && "border-white bg-white text-emerald-700",
                  !activo && completo && "border-emerald-600 bg-emerald-600 text-white",
                  !activo && !completo && "border-gray-300"
                )}
              >
                {completo && !activo ? <Check className="h-3.5 w-3.5" /> : numero}
              </span>
              {titulo}
            </button>
          </li>
        );
      })}
    </ol>
  </nav>
);

const Dato = ({ etiqueta, children }) => (
  <div>
    <p className="text-xs font-medium uppercase text-gray-400">{etiqueta}</p>
    <p className="mt-1 text-sm text-gray-800">{children || "—"}</p>
  </div>
);

const DetallePermisoTrabajoAlturasView = () => {
  const { idPermiso } = useParams();
  const [parametros, setParametros] = useSearchParams();

  const [permiso, setPermiso] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCargando(true);
    setError(null);

    obtenerPermisoAlturas(idPermiso)
      .then((datos) => {
        setPermiso(datos);

        // Sin paso en la dirección, se abre el primero que falta diligenciar.
        if (!parametros.get("paso")) {
          setParametros(
            { paso: String(primerPasoPendiente(datos)) },
            { replace: true }
          );
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idPermiso]);

  const pasoSolicitado = Number(parametros.get("paso"));
  const pasoValido = PASOS_PERMISO_ALTURAS.find(
    ({ numero, pendiente }) => numero === pasoSolicitado && !pendiente
  );
  const pasoActivo = pasoValido ? pasoSolicitado : 1;

  const irAPaso = (numero) => setParametros({ paso: String(numero) });

  const verPdf = () =>
    abrirPdfPermisoAlturas(idPermiso).catch((err) =>
      toast({
        title: "No se pudo abrir el PDF",
        description: err.message,
        variant: "destructive",
      })
    );

  if (cargando) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Cargando permiso...
      </div>
    );
  }

  if (error || !permiso) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-xl">
        <p className="text-gray-700">
          {error || "No se encontró el permiso."}
        </p>
        <Link
          to={RUTAS_PERMISOS_ALTURAS.consultar}
          className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:underline"
        >
          Volver a Consultar permisos
        </Link>
      </div>
    );
  }

  const editable = permiso.estado === ESTADO_EN_DILIGENCIAMIENTO;
  const estado = ESTADOS_PERMISO[permiso.estado] || {
    etiqueta: permiso.estado,
    clase: "bg-gray-100 text-gray-700",
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
        mostrarVolver
        titulo={`Permiso de trabajo en alturas N.° ${permiso.id_permiso_trabajo_alturas}`}
        descripcion={`${permiso.cliente} · ${formatearFechaDia(
          permiso.fecha_hora_inicio_tarea
        )} · ${formatearHora(permiso.fecha_hora_inicio_tarea)} – ${formatearHora(
          permiso.fecha_hora_fin_tarea
        )}`}
      >
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              estado.clase
            )}
          >
            {estado.etiqueta}
          </span>

          <div className="flex flex-wrap items-center gap-3">
            {/* Si no está autorizado, el PDF sale con la marca "BORRADOR". */}
            <Button
              type="button"
              variant="outline"
              onClick={verPdf}
              className="h-9 gap-2 rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              <FileText className="h-4 w-4" />
              {editable ? "Ver borrador PDF" : "Ver PDF"}
            </Button>

            <Link
              to={RUTAS_PERMISOS_ALTURAS.consultar}
              className="flex items-center gap-1 text-sm font-medium text-emerald-700 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a Consultar permisos
            </Link>
          </div>
        </div>

        <div className="mt-6 border-t border-gray-100 pt-4">
          <BarraPasos
            permiso={permiso}
            pasoActivo={pasoActivo}
            onSeleccionar={irAPaso}
          />
        </div>
      </EncabezadoPermisosAlturas>

      <section className="w-full min-w-0 rounded-2xl bg-white p-4 shadow-xl sm:p-6 lg:p-8">
        {pasoActivo === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-800">
              1. Datos del permiso
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Dato etiqueta="Responsable del permiso">
                {permiso.responsable &&
                  `${permiso.responsable} · C.C. ${permiso.numero_identificacion_responsable}`}
              </Dato>
              <Dato etiqueta="Cliente">{permiso.cliente}</Dato>
              <Dato etiqueta="Ciudad">{permiso.ciudad}</Dato>
              <Dato etiqueta="Lugar de trabajo">{permiso.lugar_trabajo}</Dato>
              <Dato etiqueta="Fecha del trabajo">
                {formatearFechaDia(permiso.fecha_hora_inicio_tarea)}
              </Dato>
              <Dato etiqueta="Hora de inicio">
                {formatearHora(permiso.fecha_hora_inicio_tarea)}
              </Dato>
              <Dato etiqueta="Hora de finalización">
                {formatearHora(permiso.fecha_hora_fin_tarea)}
              </Dato>
              <Dato etiqueta="Creado">
                {formatearFecha(permiso.fecha_creacion)}
              </Dato>
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-4">
              <Button
                type="button"
                onClick={() => irAPaso(2)}
                className="h-11 gap-2 rounded-xl bg-emerald-600 px-6 text-white hover:bg-emerald-700"
              >
                Siguiente
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {pasoActivo === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-800">
              2. Trabajadores
            </h2>

            <TrabajadoresPermisoAlturasPanel
              idPermiso={permiso.id_permiso_trabajo_alturas}
              editable={editable}
              onCantidadCambia={(_, cantidad) =>
                setPermiso((prev) => ({
                  ...prev,
                  cantidad_trabajadores: cantidad,
                }))
              }
            />

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => irAPaso(1)}
                className="h-11 gap-2 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4" />
                Anterior
              </Button>

              <div className="flex flex-col items-stretch gap-1 sm:items-end">
                <Button
                  type="button"
                  onClick={() => irAPaso(3)}
                  disabled={!permiso.cantidad_trabajadores}
                  className="h-11 gap-2 rounded-xl bg-emerald-600 px-6 text-white hover:bg-emerald-700"
                >
                  Siguiente
                  <ArrowRight className="h-4 w-4" />
                </Button>

                {!permiso.cantidad_trabajadores && (
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
            <h2 className="text-lg font-bold text-gray-800">
              3. Tarea y medidas de prevención
            </h2>

            <PasoTareaPermisoAlturas
              key={permiso.id_permiso_trabajo_alturas}
              permiso={permiso}
              editable={editable}
              onGuardado={(actualizado) => {
                setPermiso(actualizado);
                irAPaso(4);
              }}
              onAnterior={() => irAPaso(2)}
            />
          </div>
        )}

        {pasoActivo === 4 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-800">
              4. Elementos de protección personal y elementos de protección
              contra caídas
            </h2>

            <PasoListaPreguntasPermiso
              key={`proteccion-${permiso.id_permiso_trabajo_alturas}`}
              permiso={permiso}
              editable={editable}
              cargar={obtenerProteccionPermisoAlturas}
              guardar={guardarProteccionPermisoAlturas}
              campoOtro={{
                label: "Otro, ¿cuál?",
                placeholder: "Otro elemento de protección (opcional)",
              }}
              mensajeGuardado="Elementos de protección guardados"
              onGuardado={(actualizado) => {
                setPermiso(actualizado);
                irAPaso(5);
              }}
              onAnterior={() => irAPaso(3)}
            />
          </div>
        )}

        {pasoActivo === 5 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-800">
              5. Lista de verificación
            </h2>

            <PasoListaPreguntasPermiso
              key={`verificacion-${permiso.id_permiso_trabajo_alturas}`}
              permiso={permiso}
              editable={editable}
              cargar={obtenerVerificacionPermisoAlturas}
              guardar={guardarVerificacionPermisoAlturas}
              mensajeGuardado="Lista de verificación guardada"
              onGuardado={(actualizado) => {
                setPermiso(actualizado);
                irAPaso(6);
              }}
              onAnterior={() => irAPaso(4)}
            />
          </div>
        )}

        {pasoActivo === 6 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-800">
              6. Identificación de peligros del trabajo a realizar
            </h2>

            <PasoListaPreguntasPermiso
              key={`peligros-${permiso.id_permiso_trabajo_alturas}`}
              permiso={permiso}
              editable={editable}
              cargar={obtenerPeligrosPermisoAlturas}
              guardar={guardarPeligrosPermisoAlturas}
              mensajeGuardado="Identificación de peligros guardada"
              onGuardado={(actualizado) => {
                setPermiso(actualizado);
                irAPaso(7);
              }}
              onAnterior={() => irAPaso(5)}
            />
          </div>
        )}

        {pasoActivo === 7 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-800">
              7. Autorización
            </h2>

            <PasoAutorizacionPermisoAlturas
              permiso={permiso}
              editable={editable}
              onAutorizado={setPermiso}
              onAnterior={() => irAPaso(6)}
            />
          </div>
        )}
      </section>
    </motion.div>
  );
};

export default DetallePermisoTrabajoAlturasView;
