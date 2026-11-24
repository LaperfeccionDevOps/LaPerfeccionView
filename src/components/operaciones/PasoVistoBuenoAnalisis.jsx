import React, { useEffect, useState } from "react";
import { CheckCircle2, FileText, Loader2, ShieldCheck } from "lucide-react";

import CampoFirma from "@/components/operaciones/CampoFirma";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  abrirPdfAnalisis,
  darVistoBuenoAnalisis,
  obtenerFirmaCoordinadorAnalisis,
} from "@/services/analisisTrabajoSeguroService";
import {
  ESTADO_ANALISIS_APROBADO,
  bloquesPendientesVistoBueno,
} from "@/utils/analisisTrabajoSeguro";
import { formatearFecha } from "@/utils/permisosAlturas";

const FirmaCoordinador = ({ idAnalisis }) => {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let vigente = true;
    let urlCreada = null;

    obtenerFirmaCoordinadorAnalisis(idAnalisis)
      .then((blob) => {
        if (vigente) {
          urlCreada = URL.createObjectURL(blob);
          setUrl(urlCreada);
        }
      })
      .catch(() => {});

    return () => {
      vigente = false;
      if (urlCreada) {
        URL.revokeObjectURL(urlCreada);
      }
    };
  }, [idAnalisis]);

  return url ? (
    <img
      src={url}
      alt="Firma del coordinador"
      className="h-20 w-56 rounded-lg border border-gray-200 bg-white object-contain"
    />
  ) : null;
};

/**
 * Bloque 6 del análisis: visto bueno del coordinador de alturas (Vo.Bo.
 * Planilla). Lo da quien diligencia el análisis (su responsable; luego será
 * el usuario autenticado), por lo que solo firma. Exige los bloques 2 a 4
 * completos. Al firmar, el análisis queda
 * aprobado: los bloques 1 a 4 ya no se modifican y el PDF deja de ser
 * borrador. La verificación diaria sigue abierta durante la semana.
 */
const PasoVistoBuenoAnalisis = ({ analisis, onAprobado = () => {} }) => {
  const [firmaPng, setFirmaPng] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const verPdf = () =>
    abrirPdfAnalisis(analisis.id_analisis_trabajo_seguro).catch((error) =>
      toast({
        title: "No se pudo abrir el PDF",
        description: error.message,
        variant: "destructive",
      })
    );

  if (analisis.estado === ESTADO_ANALISIS_APROBADO) {
    return (
      <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
        <p className="flex items-center gap-2 font-semibold text-emerald-800">
          <CheckCircle2 className="h-5 w-5" />
          Análisis aprobado
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">
              Coordinador de alturas
            </p>
            <p className="mt-1 text-sm text-gray-800">
              {analisis.coordinador} · C.C. {analisis.numero_identificacion_coordinador}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Visto bueno: {formatearFecha(analisis.fecha_visto_bueno)}
            </p>
          </div>

          <FirmaCoordinador idAnalisis={analisis.id_analisis_trabajo_seguro} />
        </div>

        <p className="text-xs text-gray-600">
          Los bloques 1 a 4 ya no se pueden modificar. La verificación diaria
          sigue abierta hasta el final de la semana.
        </p>

        <Button
          type="button"
          variant="outline"
          onClick={verPdf}
          className="h-10 gap-2 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50"
        >
          <FileText className="h-4 w-4" />
          Ver PDF
        </Button>
      </div>
    );
  }

  const pendientes = bloquesPendientesVistoBueno(analisis);

  const handleAprobar = async () => {
    if (!firmaPng) {
      toast({
        title: "Firma requerida",
        description: "Registra la firma del coordinador de alturas.",
        variant: "destructive",
      });
      return;
    }

    if (
      !window.confirm(
        "Al dar el visto bueno, los bloques 1 a 4 ya no se podrán modificar. ¿Continuar?"
      )
    ) {
      return;
    }

    setGuardando(true);

    try {
      const actualizado = await darVistoBuenoAnalisis(
        analisis.id_analisis_trabajo_seguro,
        firmaPng
      );

      onAprobado(actualizado);

      toast({
        title: "Visto bueno registrado",
        description: "El análisis quedó aprobado.",
      });
    } catch (error) {
      toast({
        title: "No se pudo registrar el visto bueno",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-5">
      {pendientes.length > 0 && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Para dar el visto bueno completa primero: {pendientes.join(", ")}.
        </p>
      )}

      <div>
        <p className="text-xs font-medium uppercase text-gray-400">
          Vo.Bo. Planilla – Coordinador de alturas
        </p>
        <p className="mt-1 text-sm text-gray-800">
          {analisis.responsable} · C.C. {analisis.numero_identificacion_responsable}
        </p>
      </div>

      <CampoFirma
        id="firmaCoordinador"
        label="Firma del coordinador de alturas *"
        onChange={setFirmaPng}
        disabled={guardando || pendientes.length > 0}
      />

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleAprobar}
          disabled={guardando || pendientes.length > 0}
          className="h-11 gap-2 rounded-xl bg-emerald-600 px-6 text-white hover:bg-emerald-700"
        >
          {guardando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          Dar visto bueno
        </Button>
      </div>
    </div>
  );
};

export default PasoVistoBuenoAnalisis;
