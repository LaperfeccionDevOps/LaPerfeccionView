import React, { useEffect, useState } from "react";
import { History, Loader2, Lock, Unlock, Users } from "lucide-react";

import TablaAsignacion from "@/components/contabilidad/TablaAsignacion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  cambiarEstadoCentroCosto,
  obtenerAsignacionCentro,
  obtenerCentroCosto,
} from "@/services/contabilidadService";

const ACCIONES = {
  CREADO: { etiqueta: "Creado", clase: "bg-sky-100 text-sky-800" },
  CERRADO: { etiqueta: "Cerrado", clase: "bg-gray-200 text-gray-700" },
  REABIERTO: { etiqueta: "Reabierto", clase: "bg-emerald-100 text-emerald-800" },
  MODIFICADO: { etiqueta: "Modificado", clase: "bg-amber-100 text-amber-800" },
};

// Hoy en Colombia (YYYY-MM-DD), para la fecha por defecto y el máximo.
const hoyISO = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());

// "2026-10-30" -> "30/10/2026" (sin zona horaria, para no correr el día).
const formatearFecha = (valor) => {
  if (!valor) {
    return null;
  }

  const [anio, mes, dia] = valor.split("-");
  return `${dia}/${mes}/${anio}`;
};

const formatearFechaHora = (valor) =>
  new Date(valor).toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
    hourCycle: "h23",
    timeZone: "America/Bogota",
  });

const Dato = ({ etiqueta, children }) => (
  <div className="min-w-0">
    <p className="text-xs font-medium uppercase text-gray-400">{etiqueta}</p>
    <div className="mt-0.5 break-words text-sm text-gray-800">{children || "—"}</div>
  </div>
);

/**
 * Detalle de un centro de costo: datos e historial. Por defecto es solo de
 * consulta; con `permitirCambioEstado` muestra además cerrar o reabrir (con
 * fecha efectiva y motivo obligatorio), pensado para Modificar.
 */
const DetalleCentroCostoDialog = ({
  idCentro,
  onClose,
  onCambio = () => {},
  permitirCambioEstado = false,
}) => {
  const [centro, setCentro] = useState(null);
  // Asignación de operarios del centro (vigente y parámetros de recargo).
  const [asignacion, setAsignacion] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [fecha, setFecha] = useState(hoyISO);
  const [motivo, setMotivo] = useState("");
  const [intento, setIntento] = useState(false);

  useEffect(() => {
    if (!idCentro) {
      return;
    }

    setCentro(null);
    setAsignacion(null);
    setMotivo("");
    setFecha(hoyISO());
    setIntento(false);
    setCargando(true);

    obtenerCentroCosto(idCentro)
      .then(setCentro)
      .catch((error) =>
        toast({
          title: "No se pudo cargar el centro de costo",
          description: error.message,
          variant: "destructive",
        })
      )
      .finally(() => setCargando(false));

    // Complemento: si falla, el detalle se muestra igual sin esta sección.
    obtenerAsignacionCentro(idCentro)
      .then(setAsignacion)
      .catch(() => setAsignacion(null));
  }, [idCentro]);

  const abierto = centro?.estado === "ABIERTO";
  const accion = abierto ? "cerrar" : "reabrir";
  // No antes de la apertura (al cerrar) ni del último cierre (al reabrir).
  const fechaMinima = abierto ? centro?.fecha_apertura : centro?.fecha_cierre;

  const handleCambiar = async () => {
    setIntento(true);

    if (!fecha || !motivo.trim()) {
      toast({
        title: "Campos requeridos",
        description: `Indica la fecha y el motivo para ${accion} el centro de costo.`,
        variant: "destructive",
      });
      return;
    }

    setGuardando(true);

    try {
      const actualizado = await cambiarEstadoCentroCosto(idCentro, accion, {
        fecha,
        motivo: motivo.trim(),
      });

      setCentro(actualizado);
      setMotivo("");
      setIntento(false);
      onCambio(actualizado);

      toast({
        title: abierto ? "Centro de costo cerrado" : "Centro de costo reabierto",
        description: `${actualizado.codigo} quedó ${actualizado.estado.toLowerCase()}.`,
      });
    } catch (error) {
      toast({
        title: `No se pudo ${accion} el centro de costo`,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={Boolean(idCentro)} onOpenChange={(open) => !open && onClose()}>
      {/* Fondo explícito: el tema del proyecto no define "bg-background".
          Bordes redondeados también en pantallas grandes (el base usa sm:rounded-lg)
          y el desplazamiento va por dentro, para que el título quede fijo y la
          barra de desplazamiento no corte las esquinas. */}
      <DialogContent className="flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-3xl flex-col gap-0 overflow-hidden rounded-3xl border-t-4 border-emerald-600 bg-white p-0 sm:rounded-3xl">
        <DialogHeader className="border-b border-gray-100 px-6 pb-3 pt-6 pr-12 text-left">
          <DialogTitle className="text-lg font-bold text-gray-800">
            {permitirCambioEstado ? "Modificación de Centro de costos" : "Consulta de Centro de costos"}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-0.5">
              <p className="break-all font-mono text-sm font-bold text-emerald-800">
                {centro?.codigo || "Cargando..."}
              </p>
              {centro && (
                <p className="text-sm text-gray-500">
                  {centro.cliente} · NIT {centro.nit}
                </p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {cargando || !centro ? (
            <p className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando...
            </p>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
                <Dato etiqueta="Proyecto (CEN 1)">{centro.proyecto} ({centro.codigo_proyecto})</Dato>
                <Dato etiqueta="Departamento (CEN 2)">{centro.departamento}</Dato>
                <Dato etiqueta="Sede (CEN 3)">{centro.sede} ({centro.codigo_sede})</Dato>
                <Dato etiqueta="Línea de negocio (CEN 4)">{centro.linea}</Dato>
                <Dato etiqueta="Servicio asociado (CEN 5)">{centro.servicio}</Dato>
                <Dato etiqueta="Estado">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      abierto ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-700"
                    )}
                  >
                    {abierto ? "Abierto" : "Cerrado"}
                  </span>
                </Dato>
                <Dato etiqueta="Apertura vigente">{formatearFecha(centro.fecha_apertura)}</Dato>
                <Dato etiqueta="Cierre">
                  {formatearFecha(centro.fecha_cierre) ||
                    (abierto ? null : <span className="text-gray-500">Sin fecha registrada</span>)}
                </Dato>
              </div>

              {centro.pendiente_revision && (
                <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <span className="font-semibold">Pendiente de revisión:</span>{" "}
                  {centro.observacion_revision}
                </p>
              )}

              {/* Operarios asignados y recargos */}
              {asignacion && (
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 font-semibold text-gray-800">
                    <Users className="h-4 w-4" />
                    {asignacion.vigente
                      ? `Operarios asignados: ${asignacion.vigente.total_operarios}`
                      : "Operarios asignados"}
                  </h3>
                  {asignacion.vigente ? (
                    <>
                      <p className="text-sm text-gray-500">
                        Asignación vigente desde el{" "}
                        {asignacion.vigente.fecha_desde.split("-").reverse().join("/")} · registrada por{" "}
                        {asignacion.vigente.creado_por}
                      </p>
                      <TablaAsignacion lineas={asignacion.vigente.lineas} parametro={asignacion.parametro} />
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Este centro de costo no tiene una asignación vigente
                      {asignacion.anteriores.length > 0 && ` (${asignacion.anteriores.length} anterior(es) en Asignar)`}.
                    </p>
                  )}
                </div>
              )}

              {/* Cerrar o reabrir */}
              {permitirCambioEstado && (
                <div className="space-y-3 rounded-2xl border border-gray-100 p-4">
                  <h3 className="flex items-center gap-2 font-semibold text-gray-800">
                    {abierto ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                    {abierto ? "Cerrar centro de costo" : "Reabrir centro de costo"}
                  </h3>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
                    <div className="space-y-1">
                      <label htmlFor="fechaEstado" className="text-xs font-semibold uppercase text-gray-500">
                        {abierto ? "Fecha de cierre *" : "Fecha de reapertura *"}
                      </label>
                      <input
                        id="fechaEstado"
                        type="date"
                        value={fecha}
                        min={fechaMinima || undefined}
                        max={hoyISO()}
                        onChange={(e) => setFecha(e.target.value)}
                        disabled={guardando}
                        className="h-10 w-full rounded-full border border-gray-200 px-4 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="motivoEstado" className="text-xs font-semibold uppercase text-gray-500">
                        Motivo *
                      </label>
                      <input
                        id="motivoEstado"
                        type="text"
                        maxLength={500}
                        value={motivo}
                        placeholder={abierto ? "Ej.: fin de contrato" : "Ej.: renovación del contrato"}
                        onChange={(e) => setMotivo(e.target.value)}
                        disabled={guardando}
                        className={cn(
                          "h-10 w-full rounded-full border px-4 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100",
                          intento && !motivo.trim() ? "border-red-300" : "border-gray-200"
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={handleCambiar}
                      disabled={guardando}
                      className={cn(
                        "h-10 gap-2 rounded-full px-5 text-white",
                        abierto ? "bg-gray-700 hover:bg-gray-800" : "bg-emerald-600 hover:bg-emerald-700"
                      )}
                    >
                      {guardando ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : abierto ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <Unlock className="h-4 w-4" />
                      )}
                      {abierto ? "Cerrar" : "Reabrir"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Historial */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-800">
                  <History className="h-4 w-4" />
                  Historial ({centro.historial.length})
                </h3>

                <ol className="space-y-2">
                  {centro.historial.map((h) => (
                    <li key={h.id_historial_centro_costo} className="rounded-xl border border-gray-100 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", ACCIONES[h.accion]?.clase)}>
                          {ACCIONES[h.accion]?.etiqueta || h.accion}
                        </span>
                        <span className="text-sm text-gray-800">
                          {h.fecha_efectiva ? `Fecha efectiva: ${formatearFecha(h.fecha_efectiva)}` : "Sin fecha efectiva"}
                        </span>
                      </div>
                      {h.motivo && <p className="mt-1 text-sm text-gray-700">{h.motivo}</p>}
                      {h.detalle && <p className="text-xs text-gray-500">{h.detalle}</p>}
                      <p className="mt-1 text-xs text-gray-400">
                        Registrado por {h.usuario} el {formatearFechaHora(h.fecha_registro)}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetalleCentroCostoDialog;
