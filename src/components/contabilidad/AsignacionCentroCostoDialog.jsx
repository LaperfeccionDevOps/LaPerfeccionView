import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, History, Loader2, PencilLine, StopCircle, Users } from "lucide-react";

import FormularioAsignacion, { hoyISO } from "@/components/contabilidad/FormularioAsignacion";
import { HORARIO_VACIO } from "@/components/contabilidad/LineaAsignacion";
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
import {
  finalizarAsignacionCentro,
  obtenerAsignacionCentro,
  obtenerCatalogosAsignacion,
} from "@/services/contabilidadService";

// "2026-10-30" -> "30/10/2026" (sin zona horaria, para no correr el día).
const formatearFecha = (valor) => (valor ? valor.split("-").reverse().join("/") : "—");
// "06:00:00" -> "06:00"
const hora = (valor) => (valor || "").slice(0, 5);

// Línea guardada -> línea del formulario, para partir de la vigente.
const aFormulario = (l) => {
  const horario = (h) =>
    h
      ? {
          inicio: hora(h.hora_inicio),
          fin: hora(h.hora_fin),
          desayuno: h.minutos_desayuno,
          almuerzo: h.minutos_almuerzo,
          cena: h.minutos_cena,
          horaDesayuno: hora(h.hora_desayuno),
          horaAlmuerzo: hora(h.hora_almuerzo),
          horaCena: hora(h.hora_cena),
        }
      : { ...HORARIO_VACIO };

  return {
    clave: crypto.randomUUID(),
    idCargo: String(l.id_cargo),
    cantidad: l.cantidad_operarios,
    modalidad: l.codigo_modalidad,
    general: horario(l.horario_general),
    sabadoDistinto: Boolean(l.horario_sabado),
    sabado: horario(l.horario_sabado),
    descansaEntreSemana: l.descansa_dia_entre_semana,
    observacion: l.observacion || "",
  };
};

/**
 * Asignación de operarios de un centro de costo: la vigente con sus líneas,
 * las anteriores y el formulario para registrar una nueva (que reemplaza a la
 * vigente) o finalizarla. Un centro cerrado solo se consulta.
 */
const AsignacionCentroCostoDialog = ({ idCentro, onClose }) => {
  const [datos, setDatos] = useState(null);
  const [catalogos, setCatalogos] = useState(null);
  const [editando, setEditando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  // Muestra la confirmación de guardado sobre la asignación vigente.
  const [recienGuardada, setRecienGuardada] = useState(false);
  const [fechaFin, setFechaFin] = useState(hoyISO);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setDatos(null);
    setEditando(false);
    setFinalizando(false);
    setRecienGuardada(false);

    if (!idCentro) {
      return;
    }

    Promise.all([obtenerAsignacionCentro(idCentro), catalogos || obtenerCatalogosAsignacion()])
      .then(([asignacion, listas]) => {
        setCatalogos(listas);
        setDatos(asignacion);
        // Sin asignación vigente en un centro abierto: directo al formulario.
        setEditando(!asignacion.vigente && asignacion.centro.estado === "ABIERTO");
      })
      .catch((error) => {
        toast({ title: "No se pudo cargar la asignación", description: error.message, variant: "destructive" });
        onClose();
      });
    // Los catálogos se cargan una vez; solo importa el centro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idCentro]);

  const vigente = datos?.vigente;
  const abierto = datos?.centro.estado === "ABIERTO";

  const finalizar = async () => {
    setGuardando(true);
    try {
      setDatos(await finalizarAsignacionCentro(idCentro, fechaFin));
      setFinalizando(false);
      setRecienGuardada(false);
      toast({ title: "Operarios retirados", description: "El centro de costo quedó sin asignación vigente." });
    } catch (error) {
      toast({ title: "No se pudieron retirar los operarios", description: error.message, variant: "destructive" });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={Boolean(idCentro)} onOpenChange={(open) => !open && onClose()}>
      {/* Igual que el detalle: fondo explícito, bordes redondeados y desplazamiento interno. */}
      <DialogContent className="flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-5xl flex-col gap-0 overflow-hidden rounded-3xl border-t-4 border-emerald-600 bg-white p-0 sm:rounded-3xl">
        <DialogHeader className="border-b border-gray-100 px-6 pb-3 pt-6 pr-12 text-left">
          <DialogTitle className="text-lg font-bold text-gray-800">Asignación de operarios</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-0.5">
              <p className="break-all font-mono text-sm font-bold text-emerald-800">
                {datos?.centro.codigo || "Cargando..."}
              </p>
              {datos && (
                <p className="text-sm text-gray-500">
                  {datos.centro.cliente} · {datos.centro.sede}
                </p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {!datos || !catalogos ? (
            <p className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando...
            </p>
          ) : (
            <div className="space-y-6">
              {!abierto && (
                <p className="flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  El centro de costo está cerrado. Para asignarle operarios primero debe reabrirse en Modificar.
                </p>
              )}

              {editando ? (
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 font-semibold text-gray-800">
                    <Users className="h-4 w-4" />
                    {vigente ? "Nueva asignación (reemplaza a la vigente)" : "Registrar asignación"}
                  </h3>
                  <FormularioAsignacion
                    idCentro={idCentro}
                    catalogos={catalogos}
                    lineasIniciales={vigente?.lineas.map(aFormulario)}
                    fechaMinima={vigente?.fecha_desde}
                    onGuardado={(respuesta) => {
                      setDatos(respuesta);
                      setEditando(false);
                      setRecienGuardada(true);
                    }}
                    onCancelar={vigente ? () => setEditando(false) : null}
                  />
                </div>
              ) : vigente ? (
                <div className="space-y-3">
                  {recienGuardada && (
                    <p className="flex items-start gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      Asignación guardada. Ya quedó registrada; puedes cerrar esta ventana.
                    </p>
                  )}

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 font-semibold text-gray-800">
                        <Users className="h-4 w-4" />
                        Asignación vigente: {vigente.total_operarios} operario(s)
                      </h3>
                      <p className="text-sm text-gray-500">
                        Desde el {formatearFecha(vigente.fecha_desde)} · registrada por {vigente.creado_por}
                        {vigente.observacion && ` · ${vigente.observacion}`}
                      </p>
                    </div>
                    {abierto && (
                      <div className="grid grid-cols-1 gap-2 sm:flex">
                        <Button type="button" onClick={() => setEditando(true)} className="rounded-full bg-emerald-600 hover:bg-emerald-700">
                          <PencilLine className="mr-2 h-4 w-4" />
                          Cambiar asignación
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setFinalizando((v) => !v)}
                          className="rounded-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                        >
                          <StopCircle className="mr-2 h-4 w-4" />
                          Retirar operarios
                        </Button>
                      </div>
                    )}
                  </div>

                  {finalizando && (
                    <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50/50 p-4">
                      <p className="flex items-start gap-2 text-sm text-red-800">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                          <span className="font-semibold">Retirar la asignación:</span> el centro de costo
                          quedará <span className="font-semibold">sin operarios asignados</span> y esta
                          asignación pasará a las anteriores. Si solo quieres cambiar cantidades u horarios,
                          usa <span className="font-semibold">Cambiar asignación</span>.
                        </span>
                      </p>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="space-y-1">
                          <label htmlFor="fechaFinAsignacion" className="text-xs font-bold uppercase text-gray-700">
                            Último día con operarios
                          </label>
                          <input
                            id="fechaFinAsignacion"
                            type="date"
                            value={fechaFin}
                            min={vigente.fecha_desde}
                            max={hoyISO()}
                            onChange={(e) => setFechaFin(e.target.value)}
                            className="h-10 w-full rounded-full border border-gray-200 px-4 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                          />
                        </div>
                        <p className="flex-1 text-sm text-gray-500">El centro de costo sigue abierto.</p>
                        <div className="grid grid-cols-1 gap-2 sm:flex">
                          <Button type="button" variant="outline" onClick={() => setFinalizando(false)} disabled={guardando} className="rounded-full">
                            No, volver
                          </Button>
                          <Button type="button" onClick={finalizar} disabled={!fechaFin || guardando} className="rounded-full bg-red-600 hover:bg-red-700">
                            {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sí, retirar operarios
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <TablaAsignacion lineas={vigente.lineas} parametro={datos.parametro} />
                </div>
              ) : (
                <p className="text-sm text-gray-500">Este centro de costo no tiene una asignación vigente.</p>
              )}

              {datos.anteriores.length > 0 && (
                <div className="space-y-2">
                  <h3 className="flex items-center gap-2 font-semibold text-gray-800">
                    <History className="h-4 w-4" />
                    Asignaciones anteriores ({datos.anteriores.length})
                  </h3>
                  <ol className="space-y-2">
                    {datos.anteriores.map((a) => (
                      <li key={a.id_asignacion} className="rounded-2xl border border-gray-100 px-4 py-3 text-sm">
                        <p className="text-gray-800">
                          Del {formatearFecha(a.fecha_desde)} al {formatearFecha(a.fecha_hasta)} ·{" "}
                          <span className="font-semibold">{a.total_operarios} operario(s)</span>
                        </p>
                        <p className="text-xs text-gray-500">
                          Registrada por {a.creado_por}
                          {a.actualizado_por && ` · finalizada por ${a.actualizado_por}`}
                          {a.observacion && ` · ${a.observacion}`}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AsignacionCentroCostoDialog;
