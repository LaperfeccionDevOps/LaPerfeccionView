import React, { useState } from "react";
import { Loader2, Plus, Save } from "lucide-react";

import LineaAsignacion, {
  equivalentesLinea,
  extrasApi,
  lineaVacia,
  turnoApi,
  useCargosSugeridos,
} from "@/components/contabilidad/LineaAsignacion";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { guardarAsignacionCentro } from "@/services/contabilidadService";

const numero = (valor) => Number(valor).toLocaleString("es-CO", { maximumFractionDigits: 2 });

// Fecha de hoy en Bogotá como "AAAA-MM-DD".
export const hoyISO = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());

/**
 * Formulario de una asignación: fecha desde, observación y líneas de
 * operarios. Al guardar reemplaza a la vigente (la API la finaliza).
 * `lineasIniciales` permite partir de la asignación vigente para cambiarla.
 * `fechaMaxima`: hoy, o el inicio del proyecto si el centro está por iniciar.
 * `cen4` y `cen5` (línea y servicio del centro) dan los cargos sugeridos.
 */
const FormularioAsignacion = ({
  idCentro,
  catalogos,
  cen4,
  cen5,
  lineasIniciales,
  fechaMinima,
  fechaMaxima,
  onGuardado,
  onCancelar,
}) => {
  const cargosSugeridos = useCargosSugeridos(cen4, cen5);
  const maxima = fechaMaxima && fechaMaxima > hoyISO() ? fechaMaxima : hoyISO();
  // Un centro por iniciar arranca desde la fecha de inicio del proyecto.
  const [fechaDesde, setFechaDesde] = useState(maxima);
  const [observacion, setObservacion] = useState("");
  const [lineas, setLineas] = useState(() =>
    lineasIniciales?.length ? lineasIniciales : [lineaVacia()]
  );
  // Resultado del cálculo de cada línea, por su clave.
  const [resultados, setResultados] = useState({});
  const [guardando, setGuardando] = useState(false);

  const todasValidas = lineas.every((l) => resultados[l.clave]?.valido);
  const fechaValida = fechaDesde && fechaDesde <= maxima && (!fechaMinima || fechaDesde >= fechaMinima);
  // Operarios equivalentes (personas × dedicación) y número de personas.
  const totalOperarios = Math.round(lineas.reduce((suma, l) => suma + equivalentesLinea(l), 0) * 100) / 100;
  const totalPersonas = lineas.reduce((suma, l) => suma + (Number(l.cantidad) || 0), 0);
  const textoTotal =
    totalOperarios === totalPersonas
      ? `${totalPersonas} operario(s)`
      : `${numero(totalOperarios)} operario(s) equivalente(s) (${totalPersonas} persona(s))`;

  // Por qué no se puede guardar (la fecha primero, luego la primera línea incompleta).
  const fechaTexto = (valor) => valor.split("-").reverse().join("/");
  const indiceIncompleta = lineas.findIndex((l) => !resultados[l.clave]?.valido);
  const motivoBloqueo = !fechaDesde
    ? "Indica desde qué fecha rige la asignación."
    : fechaDesde > maxima
      ? `"Rige desde" no puede ser posterior al ${fechaTexto(maxima)}.`
      : fechaMinima && fechaDesde < fechaMinima
        ? `"Rige desde" no puede ser anterior a la asignación vigente (${fechaTexto(fechaMinima)}).`
        : indiceIncompleta >= 0
          ? `Línea ${indiceIncompleta + 1}: ${resultados[lineas[indiceIncompleta].clave]?.falta || "complétala"}.`
          : null;

  const actualizarLinea = (clave, nueva) =>
    setLineas((actuales) => actuales.map((l) => (l.clave === clave ? nueva : l)));

  const quitarLinea = (clave) => {
    setLineas((actuales) => actuales.filter((l) => l.clave !== clave));
    setResultados(({ [clave]: _, ...resto }) => resto);
  };

  const guardar = async () => {
    setGuardando(true);

    try {
      const respuesta = await guardarAsignacionCentro(idCentro, {
        fecha_desde: fechaDesde,
        observacion: observacion.trim() || null,
        lineas: lineas.map((l) => ({
          id_cargo: Number(l.idCargo),
          cantidad_operarios: Number(l.cantidad),
          dedicacion: Number(l.dedicacion),
          ...turnoApi(l, catalogos.modalidades.find((m) => m.codigo === l.modalidad)),
          ...extrasApi(l),
          observacion: l.observacion?.trim() || null,
        })),
      });

      toast({ title: "Asignación guardada", description: `${textoTotal} desde ${fechaDesde.split("-").reverse().join("/")}.` });
      onGuardado(respuesta);
    } catch (error) {
      toast({ title: "No se pudo guardar la asignación", description: error.message, variant: "destructive" });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
        <div className="space-y-1">
          <label htmlFor="asignacionFecha" className="text-xs font-bold uppercase text-gray-700">
            Rige desde *
          </label>
          <input
            id="asignacionFecha"
            type="date"
            value={fechaDesde}
            min={fechaMinima || undefined}
            max={maxima}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="h-10 w-full rounded-full border border-gray-200 bg-white px-4 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="asignacionObservacion" className="text-xs font-bold uppercase text-gray-700">
            Observación (opcional)
          </label>
          <input
            id="asignacionObservacion"
            type="text"
            maxLength={500}
            value={observacion}
            placeholder="P. ej. Ajuste por nueva ficha técnica del cliente"
            onChange={(e) => setObservacion(e.target.value)}
            className="h-10 w-full rounded-full border border-gray-200 bg-white px-4 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </div>

      {lineas.map((linea, indice) => (
        <LineaAsignacion
          key={linea.clave}
          numero={indice + 1}
          linea={linea}
          catalogos={catalogos}
          cargosSugeridos={cargosSugeridos}
          onChange={(nueva) => actualizarLinea(linea.clave, nueva)}
          onQuitar={lineas.length > 1 ? () => quitarLinea(linea.clave) : null}
          onResultado={(clave, resultado) => setResultados((actuales) => ({ ...actuales, [clave]: resultado }))}
        />
      ))}

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

      <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className={todasValidas && fechaValida ? "text-sm text-gray-600" : "text-sm font-medium text-amber-700"}>
          {todasValidas && fechaValida
            ? `${textoTotal} en ${lineas.length} línea(s).`
            : motivoBloqueo || "Completa cargo, número de operarios, días y turno de cada línea."}
        </p>
        <div className="grid grid-cols-1 gap-2 sm:flex">
          {onCancelar && (
            <Button type="button" variant="outline" onClick={onCancelar} disabled={guardando} className="rounded-full">
              Cancelar
            </Button>
          )}
          <Button
            type="button"
            onClick={guardar}
            disabled={!todasValidas || !fechaValida || guardando}
            className="rounded-full bg-emerald-600 hover:bg-emerald-700"
          >
            {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {guardando ? "Guardando..." : "Guardar asignación"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FormularioAsignacion;
