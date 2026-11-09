import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

import FiltroBuscable from "@/components/contabilidad/FiltroBuscable";
import { cn } from "@/lib/utils";
import { calcularHorasAsignacion } from "@/services/contabilidadService";

const SABADO = 6;
const DOMINGO = 7;

// Cada descanso: minutos (0 = no tiene) y hora de inicio ("horaAlmuerzo", ...).
export const HORARIO_VACIO = {
  inicio: "",
  fin: "",
  desayuno: 0,
  almuerzo: 0,
  cena: 0,
  horaDesayuno: "",
  horaAlmuerzo: "",
  horaCena: "",
};

const DESCANSOS = [
  ["desayuno", "horaDesayuno", "Desayuno"],
  ["almuerzo", "horaAlmuerzo", "Almuerzo"],
  ["cena", "horaCena", "Cena"],
];

// Línea nueva del formulario; `clave` solo identifica la fila en pantalla.
export const lineaVacia = () => ({
  clave: crypto.randomUUID(),
  idCargo: "",
  cantidad: 1,
  modalidad: "LV",
  general: { ...HORARIO_VACIO },
  sabadoDistinto: false,
  sabado: { ...HORARIO_VACIO },
  // Domingo a domingo: cada operario descansa un día entre semana (trabaja 6 de 7).
  descansaEntreSemana: false,
  observacion: "",
});

// Horario del formulario -> formato de la API.
export const horarioApi = (h) => {
  const minutos = (campo) => Number(h[campo]) || 0;
  // La hora solo va si el descanso tiene minutos.
  const horaDe = (campo, campoHora) => (minutos(campo) && h[campoHora] ? h[campoHora] : null);

  return {
    hora_inicio: h.inicio,
    hora_fin: h.fin,
    minutos_desayuno: minutos("desayuno"),
    minutos_almuerzo: minutos("almuerzo"),
    minutos_cena: minutos("cena"),
    hora_desayuno: horaDe("desayuno", "horaDesayuno"),
    hora_almuerzo: horaDe("almuerzo", "horaAlmuerzo"),
    hora_cena: horaDe("cena", "horaCena"),
  };
};

const horarioCompleto = (h) => Boolean(h.inicio && h.fin);

const CLASE_CAMPO =
  "h-10 w-full rounded-full border border-gray-200 bg-white px-4 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

const Etiqueta = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="text-xs font-bold uppercase text-gray-700">
    {children}
  </label>
);

/** Entrada, salida y descansos (minutos y hora de inicio) de un horario. */
const CamposHorario = ({ id, titulo, valor, onChange }) => {
  const cambiar = (campo, dato) => onChange({ ...valor, [campo]: dato });
  const cruzaMedianoche = valor.inicio && valor.fin && valor.fin <= valor.inicio;

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-800">{titulo}</p>
      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="space-y-1">
          <Etiqueta htmlFor={`${id}-inicio`}>Entrada</Etiqueta>
          <input id={`${id}-inicio`} type="time" value={valor.inicio} onChange={(e) => cambiar("inicio", e.target.value)} className={CLASE_CAMPO} />
        </div>
        <div className="space-y-1">
          <Etiqueta htmlFor={`${id}-fin`}>Salida</Etiqueta>
          <input id={`${id}-fin`} type="time" value={valor.fin} onChange={(e) => cambiar("fin", e.target.value)} className={CLASE_CAMPO} />
        </div>
      </div>

      {/* Cada descanso con su duración y hora de inicio: se descuenta de la franja donde cae. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {DESCANSOS.map(([campo, campoHora, etiqueta]) => {
          const tiene = Number(valor[campo]) > 0;

          return (
            <div key={campo} className="space-y-1 rounded-2xl bg-gray-50 p-3">
              <p className="text-xs font-bold uppercase text-gray-700">{etiqueta}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label htmlFor={`${id}-${campo}`} className="text-xs text-gray-500">Minutos</label>
                  <input
                    id={`${id}-${campo}`}
                    type="number"
                    min={0}
                    max={120}
                    step={5}
                    value={valor[campo]}
                    onChange={(e) => cambiar(campo, e.target.value)}
                    className={CLASE_CAMPO}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor={`${id}-${campoHora}`} className="text-xs text-gray-500">Desde</label>
                  <input
                    id={`${id}-${campoHora}`}
                    type="time"
                    value={valor[campoHora]}
                    disabled={!tiene}
                    onChange={(e) => cambiar(campoHora, e.target.value)}
                    className={cn(CLASE_CAMPO, "disabled:cursor-not-allowed disabled:bg-gray-100", tiene && !valor[campoHora] && "border-amber-300")}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {cruzaMedianoche && (
        <p className="px-1 text-xs text-gray-500">La salida es al día siguiente (turno que pasa la medianoche).</p>
      )}
    </div>
  );
};

/**
 * Una línea de la asignación: cargo, número de operarios, modalidad de días,
 * horario general y, si la modalidad incluye sábado, un horario de sábado
 * opcional. Calcula las horas semanales en la API mientras se diligencia y las
 * informa con `onResultado(clave, { valido, supera })`.
 */
const LineaAsignacion = ({ numero, linea, catalogos, onChange, onQuitar, onResultado }) => {
  const [calculo, setCalculo] = useState(null);
  const [error, setError] = useState(null);
  const [calculando, setCalculando] = useState(false);

  const modalidad = catalogos.modalidades.find((m) => m.codigo === linea.modalidad);
  const incluyeSabado = modalidad?.dias_semana.includes(SABADO);
  const incluyeDomingo = modalidad?.dias_semana.includes(DOMINGO);
  const usaSabado = incluyeSabado && linea.sabadoDistinto;

  const opcionesCargo = useMemo(
    () => catalogos.cargos.map((c) => ({ id: c.id, etiqueta: c.nombre })),
    [catalogos.cargos]
  );

  const cambiar = (campo, valor) => onChange({ ...linea, [campo]: valor });

  // Texto estable de lo que afecta el cálculo, para no recalcular sin cambios.
  const datosCalculo =
    horarioCompleto(linea.general) && (!usaSabado || horarioCompleto(linea.sabado))
      ? JSON.stringify({
          codigo_modalidad: linea.modalidad,
          horario_general: horarioApi(linea.general),
          horario_sabado: usaSabado ? horarioApi(linea.sabado) : null,
          descansa_dia_entre_semana: Boolean(incluyeDomingo && linea.descansaEntreSemana),
        })
      : null;

  useEffect(() => {
    setCalculo(null);
    setError(null);

    if (!datosCalculo) {
      return undefined;
    }

    let vigente = true;
    setCalculando(true);
    const espera = setTimeout(() => {
      calcularHorasAsignacion(JSON.parse(datosCalculo))
        .then((datos) => vigente && setCalculo(datos))
        .catch((e) => vigente && setError(e.message))
        .finally(() => vigente && setCalculando(false));
    }, 400);

    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [datosCalculo]);

  const valido = Boolean(linea.idCargo && Number(linea.cantidad) >= 1 && calculo && !calculo.supera_maximo);

  useEffect(() => {
    onResultado(linea.clave, { valido, supera: Boolean(calculo?.supera_maximo) });
    // onResultado cambia en cada render del padre; solo importa el resultado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linea.clave, valido, calculo?.supera_maximo]);

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-gray-800">Línea {numero}</p>
        {onQuitar && (
          <button
            type="button"
            onClick={onQuitar}
            title="Quitar línea"
            className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_9rem]">
        <FiltroBuscable
          id={`cargo-${linea.clave}`}
          label="Tipo de operario (cargo)"
          opciones={opcionesCargo}
          valor={linea.idCargo}
          onChange={(v) => cambiar("idCargo", v)}
          placeholder="Sin seleccionar"
          listaEnLinea
        />
        <div className="space-y-1">
          <Etiqueta htmlFor={`cantidad-${linea.clave}`}>N.º de operarios</Etiqueta>
          <input
            id={`cantidad-${linea.clave}`}
            type="number"
            min={1}
            max={9999}
            value={linea.cantidad}
            onChange={(e) => cambiar("cantidad", e.target.value)}
            className={CLASE_CAMPO}
          />
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-bold uppercase text-gray-700">Días que labora</p>
        <div className="flex flex-wrap gap-2">
          {catalogos.modalidades.map((m) => (
            <button
              key={m.codigo}
              type="button"
              onClick={() =>
                onChange({
                  ...linea,
                  modalidad: m.codigo,
                  sabadoDistinto: m.dias_semana.includes(SABADO) && linea.sabadoDistinto,
                  // Por lo general quien trabaja de domingo a domingo descansa un día entre semana.
                  descansaEntreSemana: m.dias_semana.includes(DOMINGO),
                })
              }
              aria-pressed={linea.modalidad === m.codigo}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                linea.modalidad === m.codigo
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100"
                  : "border-gray-200 text-gray-600 hover:border-emerald-300"
              )}
            >
              {m.nombre}
            </button>
          ))}
        </div>
      </div>

      {incluyeDomingo && (
        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={linea.descansaEntreSemana}
            onChange={(e) => cambiar("descansaEntreSemana", e.target.checked)}
            className="h-4 w-4 accent-emerald-600"
          />
          Cada operario descansa un día entre semana (trabaja 6 de 7 días)
        </label>
      )}

      <CamposHorario
        id={`general-${linea.clave}`}
        titulo={usaSabado ? "Horario de lunes a viernes" + (linea.modalidad === "DD" ? " y domingo" : "") : "Horario"}
        valor={linea.general}
        onChange={(v) => cambiar("general", v)}
      />

      {incluyeSabado && (
        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={linea.sabadoDistinto}
            onChange={(e) => onChange({ ...linea, sabadoDistinto: e.target.checked, sabado: { ...HORARIO_VACIO } })}
            className="h-4 w-4 accent-emerald-600"
          />
          El sábado tiene otro horario (p. ej. medio día)
        </label>
      )}

      {usaSabado && (
        <CamposHorario
          id={`sabado-${linea.clave}`}
          titulo="Horario del sábado"
          valor={linea.sabado}
          onChange={(v) => cambiar("sabado", v)}
        />
      )}

      <div className="flex min-h-[2rem] flex-wrap items-center gap-2 text-sm">
        {calculando ? (
          <span className="flex items-center gap-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Calculando horas...
          </span>
        ) : error ? (
          <span className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </span>
        ) : calculo ? (
          <>
            <span
              className={cn(
                "rounded-full px-3 py-1 font-semibold",
                calculo.supera_maximo ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"
              )}
            >
              {calculo.horas_semana} h/semana por operario
            </span>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">
              {calculo.horas_nocturnas_semana} h nocturnas
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
              {calculo.horas_dominicales_semana} h dominicales
            </span>
            <span
              title="Domingo en franja nocturna: lleva el recargo nocturno y el dominical (ya incluidas en las anteriores)."
              className="rounded-full bg-fuchsia-50 px-3 py-1 text-fuchsia-700"
            >
              {calculo.horas_nocturnas_dominicales_semana} h nocturnas dominicales
            </span>
            {calculo.supera_maximo && (
              <span className="text-red-600">
                Supera el máximo de {calculo.horas_maximas_semana} h semanales.
              </span>
            )}
          </>
        ) : (
          <span className="text-gray-500">Indica la entrada y la salida para calcular las horas.</span>
        )}
      </div>
    </div>
  );
};

export default LineaAsignacion;
