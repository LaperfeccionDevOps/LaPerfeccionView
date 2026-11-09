import React, { useState } from "react";
import { Loader2, Plus, Save } from "lucide-react";

import LineaAsignacion, { horarioApi, lineaVacia } from "@/components/contabilidad/LineaAsignacion";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { guardarAsignacionCentro } from "@/services/contabilidadService";

// Fecha de hoy en Bogotá como "AAAA-MM-DD".
export const hoyISO = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());

/**
 * Formulario de una asignación: fecha desde, observación y líneas de
 * operarios. Al guardar reemplaza a la vigente (la API la finaliza).
 * `lineasIniciales` permite partir de la asignación vigente para cambiarla.
 */
const FormularioAsignacion = ({ idCentro, catalogos, lineasIniciales, fechaMinima, onGuardado, onCancelar }) => {
  const [fechaDesde, setFechaDesde] = useState(hoyISO);
  const [observacion, setObservacion] = useState("");
  const [lineas, setLineas] = useState(() =>
    lineasIniciales?.length ? lineasIniciales : [lineaVacia()]
  );
  // Resultado del cálculo de cada línea, por su clave.
  const [resultados, setResultados] = useState({});
  const [guardando, setGuardando] = useState(false);

  const todasValidas = lineas.every((l) => resultados[l.clave]?.valido);
  const fechaValida = fechaDesde && fechaDesde <= hoyISO() && (!fechaMinima || fechaDesde >= fechaMinima);
  const totalOperarios = lineas.reduce((suma, l) => suma + (Number(l.cantidad) || 0), 0);

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
        lineas: lineas.map((l) => {
          const modalidad = catalogos.modalidades.find((m) => m.codigo === l.modalidad);
          const usaSabado = l.sabadoDistinto && modalidad?.dias_semana.includes(6);
          const incluyeDomingo = modalidad?.dias_semana.includes(7);

          return {
            id_cargo: Number(l.idCargo),
            cantidad_operarios: Number(l.cantidad),
            codigo_modalidad: l.modalidad,
            horario_general: horarioApi(l.general),
            horario_sabado: usaSabado ? horarioApi(l.sabado) : null,
            descansa_dia_entre_semana: Boolean(incluyeDomingo && l.descansaEntreSemana),
            observacion: l.observacion?.trim() || null,
          };
        }),
      });

      toast({ title: "Asignación guardada", description: `${totalOperarios} operario(s) desde ${fechaDesde.split("-").reverse().join("/")}.` });
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
            max={hoyISO()}
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
        Agregar tipo de operario u horario
      </Button>

      <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600">
          {todasValidas && fechaValida
            ? `${totalOperarios} operario(s) en ${lineas.length} línea(s).`
            : "Completa cargo, número de operarios y horario de cada línea (máximo legal de horas por semana)."}
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
