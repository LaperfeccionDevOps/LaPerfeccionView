import { useNavigate } from "react-router-dom";

import { RUTAS_CENTROS_COSTO } from "@/components/contabilidad/EncabezadoCentrosCosto";
import { toast } from "@/components/ui/use-toast";

/**
 * Duplicar un centro de costo: se abre Crear "desde sede" con su codificación
 * precargada (CEN 1 y CEN 3 fijos; CEN 2, CEN 4 y CEN 5 editables). No se
 * copian fechas, observación ni asignación, y no se guarda referencia al
 * original. Se puede duplicar un centro abierto o cerrado.
 *
 * La codificación sale del código "CEN1-CEN2-CEN3-CEN4-CEN5" (los códigos de
 * Synergy no llevan guion), que está en la consulta, el detalle y la asignación.
 */
export const codificacionDe = (codigo) => {
  const partes = String(codigo || "").split("-");

  return partes.length === 5 && partes.every(Boolean)
    ? { codigo, cen1: partes[0], cen2: partes[1], cen3: partes[2], cen4: partes[3], cen5: partes[4] }
    : null;
};

export const useDuplicarCentro = () => {
  const navigate = useNavigate();

  return (codigo) => {
    const duplicar = codificacionDe(codigo);

    if (!duplicar) {
      toast({
        title: "No se pudo duplicar el centro de costo",
        description: `El código ${codigo || ""} no tiene las cinco partes de la codificación.`,
        variant: "destructive",
      });
      return;
    }

    navigate(RUTAS_CENTROS_COSTO.crear, { state: { duplicar } });
  };
};
