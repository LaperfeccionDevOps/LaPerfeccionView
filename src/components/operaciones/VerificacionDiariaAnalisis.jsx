import React, { useEffect, useState } from "react";
import { AlertTriangle, Check, Clock, Loader2, Lock, Save } from "lucide-react";

import BuscadorPersonaContratada from "@/components/operaciones/BuscadorPersonaContratada";
import OpcionSiNoNa from "@/components/operaciones/OpcionSiNoNa";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  diligenciarDiaAnalisis,
  obtenerVerificacionDiaria,
} from "@/services/analisisTrabajoSeguroService";
import {
  formatearDiaCorto,
  formatearFechaSinHora,
} from "@/utils/analisisTrabajoSeguro";
import { formatearFecha, leerResponsableSesion } from "@/utils/permisosAlturas";

const ETIQUETA_RESPUESTA = { SI: "Sí", NO: "No", NA: "No aplica" };

const resumenDias = (dias) => ({
  dias_pendientes: dias.filter((d) => d.estado === "PENDIENTE").length,
  dias_diligenciados: dias.filter((d) => d.estado === "DILIGENCIADO").length,
});

// Día al que se abre la vista: hoy si está en el rango; si no, el primero
// pendiente o el último día.
const diaInicial = (verificacion) => {
  const { dias, hoy } = verificacion;

  return (
    dias.find((d) => d.fecha === hoy)?.fecha ??
    dias.find((d) => d.estado === "PENDIENTE")?.fecha ??
    dias[dias.length - 1]?.fecha ??
    null
  );
};

const EstiloDia = {
  DILIGENCIADO: "border-emerald-200 bg-emerald-50 text-emerald-800",
  PENDIENTE: "border-amber-200 bg-amber-50 text-amber-800",
  FUTURO: "border-gray-200 bg-gray-50 text-gray-400",
};

/**
 * Bloque 5 del análisis: verificación diaria. Cada día de la semana del
 * análisis se responden las preguntas una sola vez. Los días pasados sin
 * diligenciar se pueden llenar después y quedan marcados como tardíos; los
 * días futuros no se pueden diligenciar.
 */
const VerificacionDiariaAnalisis = ({ idAnalisis, onResumenCambia = () => {} }) => {
  const [verificacion, setVerificacion] = useState(null);
  const [fechaActiva, setFechaActiva] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [intentoGuardar, setIntentoGuardar] = useState(false);

  const [persona, setPersona] = useState(leerResponsableSesion);
  const [respuestas, setRespuestas] = useState({});
  const [observaciones, setObservaciones] = useState("");

  useEffect(() => {
    setCargando(true);

    obtenerVerificacionDiaria(idAnalisis)
      .then((datos) => {
        setVerificacion(datos);
        setFechaActiva(diaInicial(datos));
      })
      .catch((error) =>
        toast({
          title: "No se pudo cargar la verificación diaria",
          description: error.message,
          variant: "destructive",
        })
      )
      .finally(() => setCargando(false));
  }, [idAnalisis]);

  const seleccionarDia = (fecha) => {
    setFechaActiva(fecha);
    setRespuestas({});
    setObservaciones("");
    setIntentoGuardar(false);
  };

  if (cargando) {
    return <p className="text-sm text-gray-500">Cargando verificación diaria...</p>;
  }

  if (!verificacion) {
    return null;
  }

  const { preguntas, dias, hoy } = verificacion;
  const dia = dias.find((d) => d.fecha === fechaActiva);
  const sinResponder = preguntas.filter(
    (p) => !respuestas[p.id_item_permiso_alturas]
  ).length;

  const handleGuardar = async () => {
    setIntentoGuardar(true);

    if (!persona || sinResponder > 0) {
      toast({
        title: "Campos requeridos",
        description: !persona
          ? "Indica quién diligencia la verificación de este día."
          : "Responde todas las preguntas.",
        variant: "destructive",
      });
      return;
    }

    setGuardando(true);

    try {
      const datos = await diligenciarDiaAnalisis(idAnalisis, {
        fecha: dia.fecha,
        idRegistroPersonal: persona.id_registro_personal,
        respuestas,
        observaciones: observaciones.trim(),
      });

      setVerificacion(datos);
      onResumenCambia(resumenDias(datos.dias));
      setRespuestas({});
      setObservaciones("");
      setIntentoGuardar(false);

      toast({
        title: "Día guardado",
        description: `Se registró la verificación del ${formatearFechaSinHora(dia.fecha)}.`,
      });
    } catch (error) {
      toast({
        title: "No se pudo guardar el día",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Días de la semana del análisis */}
      <div className="flex flex-wrap gap-2">
        {dias.map((d) => (
          <button
            key={d.fecha}
            type="button"
            disabled={d.estado === "FUTURO"}
            onClick={() => seleccionarDia(d.fecha)}
            title={
              d.estado === "FUTURO"
                ? "Este día aún no llega"
                : d.estado === "DILIGENCIADO"
                  ? "Diligenciado"
                  : "Pendiente por diligenciar"
            }
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-all disabled:cursor-not-allowed",
              EstiloDia[d.estado],
              d.fecha === fechaActiva && "ring-2 ring-emerald-500 ring-offset-1"
            )}
          >
            {d.estado === "DILIGENCIADO" && <Check className="h-3.5 w-3.5" />}
            {d.estado === "PENDIENTE" && <Clock className="h-3.5 w-3.5" />}
            {d.estado === "FUTURO" && <Lock className="h-3.5 w-3.5" />}
            {formatearDiaCorto(d.fecha)}
            {d.fecha === hoy && " · hoy"}
            {d.registro?.diligenciado_tarde && " · tarde"}
          </button>
        ))}
      </div>

      {dia && dia.estado === "DILIGENCIADO" && (
        <div className="space-y-4 rounded-2xl border border-gray-100 p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span>
              Diligenciado por{" "}
              <span className="font-semibold text-gray-800">
                {dia.registro.diligenciado_por}
              </span>{" "}
              (C.C. {dia.registro.numero_identificacion}) el{" "}
              {formatearFecha(dia.registro.fecha_registro)}
            </span>
            {dia.registro.diligenciado_tarde && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                Diligenciado tarde
              </span>
            )}
          </div>

          <ol className="divide-y divide-gray-100">
            {preguntas.map((pregunta, indice) => {
              const respuesta = dia.registro.respuestas[pregunta.id_item_permiso_alturas];
              const alerta = respuesta && respuesta === pregunta.respuesta_alerta;

              return (
                <li
                  key={pregunta.id_item_permiso_alturas}
                  className="flex items-start justify-between gap-3 py-2"
                >
                  <span className="text-sm text-gray-700">
                    {indice + 1}. {pregunta.texto}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      alerta
                        ? "bg-red-100 text-red-700"
                        : respuesta === "NA"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-emerald-100 text-emerald-700"
                    )}
                  >
                    {ETIQUETA_RESPUESTA[respuesta] || "—"}
                  </span>
                </li>
              );
            })}
          </ol>

          {dia.registro.observaciones && (
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Observaciones:</span>{" "}
              {dia.registro.observaciones}
            </p>
          )}
        </div>
      )}

      {dia && dia.estado === "PENDIENTE" && (
        <div className="space-y-5 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
          <h3 className="font-semibold capitalize text-gray-800">
            {formatearDiaCorto(dia.fecha)} · {formatearFechaSinHora(dia.fecha)}
          </h3>

          {dia.fecha < hoy && (
            <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Este día ya pasó: al guardarlo quedará registrado como
              diligenciado tarde.
            </p>
          )}

          <div className="md:max-w-xl">
            <BuscadorPersonaContratada
              id="diligenciaDia"
              label="Diligenciado por *"
              seleccionado={persona}
              onSeleccionar={setPersona}
              disabled={guardando}
            />
          </div>

          <ol className="space-y-3">
            {preguntas.map((pregunta, indice) => {
              const respuesta = respuestas[pregunta.id_item_permiso_alturas] || "";
              const alerta = respuesta && respuesta === pregunta.respuesta_alerta;
              const falta = intentoGuardar && !respuesta;

              return (
                <li
                  key={pregunta.id_item_permiso_alturas}
                  className={cn(
                    "flex flex-col gap-2 rounded-xl border bg-white p-3 sm:flex-row sm:items-center sm:justify-between",
                    alerta
                      ? "border-red-200"
                      : falta
                        ? "border-red-300"
                        : "border-gray-100"
                  )}
                >
                  <span className="text-sm text-gray-700">
                    {indice + 1}. {pregunta.texto} *
                  </span>

                  <OpcionSiNoNa
                    id={`diaria-${pregunta.id_item_permiso_alturas}`}
                    etiqueta={pregunta.texto}
                    value={respuesta}
                    onChange={(valor) =>
                      setRespuestas((prev) => ({
                        ...prev,
                        [pregunta.id_item_permiso_alturas]: valor,
                      }))
                    }
                    disabled={guardando}
                  />
                </li>
              );
            })}
          </ol>

          <div className="space-y-2">
            <Label htmlFor="observacionesDia">Observaciones</Label>
            <Textarea
              id="observacionesDia"
              rows={3}
              maxLength={1000}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              disabled={guardando}
            />
          </div>

          <div className="flex flex-col items-stretch gap-1 sm:items-end">
            <Button
              type="button"
              onClick={handleGuardar}
              disabled={guardando}
              className="h-11 gap-2 rounded-xl bg-emerald-600 px-6 text-white hover:bg-emerald-700"
            >
              {guardando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar día
            </Button>
            <p className="text-xs text-gray-500">
              Una vez guardado, el día no se puede modificar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificacionDiariaAnalisis;
