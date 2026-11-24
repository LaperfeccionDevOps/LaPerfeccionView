import React, { useEffect, useState } from "react";
import { Loader2, Plus, Users } from "lucide-react";

import LineaAsignacion, {
  equivalentesLinea,
  extrasApi,
  lineaVacia,
  turnoApi,
  useCargosSugeridos,
} from "@/components/contabilidad/LineaAsignacion";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { obtenerCatalogosAsignacion } from "@/services/contabilidadService";

/**
 * Crear > asignación de operarios opcional: las mismas líneas de Asignar
 * (cargo, operarios, días y turno), para registrar la asignación junto con el
 * centro. No es obligatoria: se puede crear el centro con urgencia y asignar
 * después. `onChange({ activa, valida, lineas, operarios })` informa al padre
 * (las líneas ya en el formato de la API). `cen4` y `cen5` (línea y servicio
 * elegidos) dan los cargos sugeridos; una combinación nueva no tiene.
 */
const AsignacionInicialCentroCosto = ({ habilitado, cen4, cen5, onChange }) => {
  const cargosSugeridos = useCargosSugeridos(cen4, cen5);
  const [activa, setActiva] = useState(false);
  const [catalogos, setCatalogos] = useState(null);
  const [lineas, setLineas] = useState(() => [lineaVacia()]);
  const [resultados, setResultados] = useState({});

  useEffect(() => {
    if (!activa || catalogos) {
      return;
    }
    obtenerCatalogosAsignacion()
      .then(setCatalogos)
      .catch((error) => {
        setActiva(false);
        toast({ title: "No se pudieron cargar los cargos", description: error.message, variant: "destructive" });
      });
  }, [activa, catalogos]);

  const valida = Boolean(catalogos) && lineas.every((l) => resultados[l.clave]?.valido);
  // Operarios equivalentes (personas × dedicación) y número de personas.
  const operarios = Math.round(lineas.reduce((suma, l) => suma + equivalentesLinea(l), 0) * 100) / 100;
  const personas = lineas.reduce((suma, l) => suma + (Number(l.cantidad) || 0), 0);
  const textoTotal =
    operarios === personas
      ? `${personas} operario(s)`
      : `${operarios.toLocaleString("es-CO")} operario(s) equivalente(s) (${personas} persona(s))`;
  const indiceIncompleta = lineas.findIndex((l) => !resultados[l.clave]?.valido);
  const motivo =
    indiceIncompleta >= 0
      ? `Línea ${indiceIncompleta + 1}: ${resultados[lineas[indiceIncompleta].clave]?.falta || "complétala"}, o desmarca la asignación.`
      : null;

  useEffect(() => {
    onChange({
      activa,
      valida,
      operarios,
      lineas:
        activa && catalogos
          ? lineas.map((l) => ({
              id_cargo: Number(l.idCargo),
              cantidad_operarios: Number(l.cantidad),
              dedicacion: Number(l.dedicacion),
              ...turnoApi(l, catalogos.modalidades.find((m) => m.codigo === l.modalidad)),
              ...extrasApi(l),
            }))
          : [],
    });
    // onChange cambia en cada render del padre; solo importan los datos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activa, valida, operarios, lineas, catalogos]);

  const quitarLinea = (clave) => {
    setLineas((actuales) => actuales.filter((l) => l.clave !== clave));
    setResultados(({ [clave]: _, ...resto }) => resto);
  };

  return (
    <div className={cn("mt-4 space-y-3 rounded-2xl border border-gray-200 p-4", !habilitado && "opacity-60")}>
      <label className="flex w-fit cursor-pointer items-start gap-2">
        <input
          id="crearAsignarAhora"
          type="checkbox"
          checked={activa}
          disabled={!habilitado}
          onChange={(e) => setActiva(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-emerald-600"
        />
        <span>
          <span className="flex items-center gap-2 text-sm font-bold text-gray-800">
            <Users className="h-4 w-4" />
            Asignar operarios ahora (opcional)
          </span>
          <span className="block text-xs text-gray-500">
            Si es urgente, crea el centro sin asignación y complétala después en Asignar.
          </span>
        </span>
      </label>

      {activa &&
        (!catalogos ? (
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando cargos...
          </p>
        ) : (
          <div className="space-y-3">
            {lineas.map((linea, indice) => (
              <LineaAsignacion
                key={linea.clave}
                numero={indice + 1}
                linea={linea}
                catalogos={catalogos}
                cargosSugeridos={cargosSugeridos}
                onChange={(nueva) => setLineas((actuales) => actuales.map((l) => (l.clave === linea.clave ? nueva : l)))}
                onQuitar={lineas.length > 1 ? () => quitarLinea(linea.clave) : null}
                onResultado={(clave, resultado) => setResultados((actuales) => ({ ...actuales, [clave]: resultado }))}
              />
            ))}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLineas((actuales) => [...actuales, lineaVacia()])}
                disabled={lineas.length >= 50}
                className="w-full rounded-full border-dashed sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar tipo de operario o turno
              </Button>
              <p className={valida ? "text-sm text-gray-600" : "text-sm font-medium text-amber-700"}>
                {valida
                  ? `${textoTotal} en ${lineas.length} línea(s).`
                  : motivo || "Completa cargo, número de operarios, días y turno de cada línea, o desmarca la asignación."}
              </p>
            </div>
          </div>
        ))}
    </div>
  );
};

export default AsignacionInicialCentroCosto;
