import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Eye, Loader2 } from "lucide-react";

import DetalleCentroCostoDialog from "@/components/contabilidad/DetalleCentroCostoDialog";
import { Button } from "@/components/ui/button";
import { validarCombinacionCentroCosto } from "@/services/contabilidadService";

/**
 * Con la codificación completa (CEN 1 a CEN 5) revisa en la API si ya existe un
 * centro con esa sede, departamento, línea y servicio. Si existe, permite
 * ver su detalle (solo consulta).
 * `onResultado(resultado | null)` informa la respuesta (null mientras valida).
 */
const ValidacionCombinacion = ({ cen1, cen2, cen3, cen4, cen5, onResultado = () => {} }) => {
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [verDetalle, setVerDetalle] = useState(false);

  useEffect(() => {
    let vigente = true;
    setResultado(null);
    setError(null);

    validarCombinacionCentroCosto({ cen2, cen3, cen4, cen5 })
      .then((datos) => vigente && setResultado(datos))
      .catch((e) => vigente && setError(e.message));

    return () => {
      vigente = false;
    };
  }, [cen2, cen3, cen4, cen5]);

  useEffect(() => {
    onResultado(resultado);
    // onResultado cambia en cada render del padre; solo importa el resultado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultado]);

  const codigo = [cen1, cen2, cen3, cen4, cen5].join("-");

  if (error) {
    return (
      <p className="flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        No se pudo validar la combinación: {error}
      </p>
    );
  }

  if (!resultado) {
    return (
      <p className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Validando si el centro ya existe...
      </p>
    );
  }

  if (!resultado.existe) {
    return (
      <div className="flex items-start gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Codificación completa:{" "}
          <span className="break-all font-mono font-bold">{codigo}</span>. No existe un centro con
          esta combinación, así que se puede crear.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between">
      <span className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Ya existe el centro{" "}
          <span className="break-all font-mono font-bold">{resultado.codigo}</span> en estado{" "}
          <span className="font-bold">{resultado.estado}</span>
          {resultado.pendiente_revision && " (pendiente de revisión)"}.{" "}
          {resultado.estado === "CERRADO"
            ? "En lugar de crear uno nuevo, habría que reabrir el existente."
            : "No se puede crear otro con la misma combinación."}
        </span>
      </span>

      <Button
        type="button"
        variant="outline"
        onClick={() => setVerDetalle(true)}
        className="shrink-0 rounded-full border-amber-300 bg-white text-amber-800 hover:bg-amber-100"
      >
        <Eye className="mr-2 h-4 w-4" />
        Ver centro
      </Button>

      <DetalleCentroCostoDialog
        idCentro={verDetalle ? resultado.id_centro_costo_contable : null}
        onClose={() => setVerDetalle(false)}
      />
    </div>
  );
};

export default ValidacionCombinacion;
