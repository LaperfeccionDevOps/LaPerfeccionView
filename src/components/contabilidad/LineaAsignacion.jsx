import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, Moon, Sun, SunMoon, Trash2 } from "lucide-react";

import FiltroBuscable from "@/components/contabilidad/FiltroBuscable";
import { cn } from "@/lib/utils";
import { calcularHorasAsignacion, obtenerCargosSugeridos } from "@/services/contabilidadService";

const DOMINGO = 7;

// Los tres turnos validados con Contabilidad. Cada uno completa las horas
// máximas de la semana (hoy 42), repartidas por igual entre los días.
export const TURNOS = {
  DIURNO: {
    nombre: "Diurno",
    icono: Sun,
    clase: "bg-sky-50 text-sky-700",
    descripcion: "Sin horas nocturnas.",
  },
  TARDE: {
    nombre: "Tarde",
    icono: SunMoon,
    clase: "bg-violet-50 text-violet-700",
    descripcion: "Termina entre las 19:00 y las 24:00; desde las 19:00 son horas nocturnas.",
  },
  NOCHE: {
    nombre: "Noche",
    icono: Moon,
    clase: "bg-indigo-50 text-indigo-700",
    descripcion: "Todas sus horas son nocturnas.",
  },
};

const textoHora = (minutos) =>
  `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;

// Las salidas se eligen cada 10 minutos.
const INTERVALO = 10;

// Salida general de la tarde: de 19:00 a 24:00.
const SALIDAS_TARDE = Array.from({ length: 31 }, (_, i) => textoHora(19 * 60 + i * INTERVALO));

// Salida del domingo cuando termina a otra hora: hasta las 24:00, sin empezar el sábado.
const salidasDia = (minutosDia) =>
  Array.from({ length: 144 }, (_, i) => (i + 1) * INTERVALO)
    .filter((m) => m >= minutosDia)
    .map(textoHora);

export const NOMBRES_DIA = { 1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb", 7: "Dom" };

// Tarde con salida distinta según el día.
const usaSalidaPorDia = (linea) => linea.tipoTurno === "TARDE" && Boolean(linea.salidaPorDia);

// Salida de cada día que labora: la que se cambió o, si no, la general.
const salidasPorDia = (linea, modalidad) =>
  Object.fromEntries((modalidad?.dias_semana || []).map((d) => [String(d), linea.salidasDia?.[d] || linea.horaFin]));

// La tarde y la noche de domingo a domingo pueden terminar el domingo a otra hora
// (con salida por día, el domingo va en la misma lista).
const usaDomingoDistinto = (linea, modalidad) =>
  Boolean(
    modalidad?.dias_semana.includes(DOMINGO) &&
      ["TARDE", "NOCHE"].includes(linea.tipoTurno) &&
      !usaSalidaPorDia(linea) &&
      linea.domingoDistinto
  );

// Línea nueva del formulario; `clave` solo identifica la fila en pantalla.
export const lineaVacia = () => ({
  clave: crypto.randomUUID(),
  idCargo: "",
  cantidad: 1,
  // Parte del tiempo que cada operario dedica al centro, en decimal (1 = tiempo completo).
  dedicacion: 1,
  modalidad: "LV",
  tipoTurno: "",
  horaFin: "",
  // Domingo a domingo: cada operario descansa un día entre semana (trabaja 6 de 7).
  descansaEntreSemana: false,
  // Tarde o noche: el domingo termina a otra hora.
  domingoDistinto: false,
  horaFinDomingo: "",
  // Tarde: la salida cambia según el día ({ "1": "20:20", ... }; los que no
  // estén usan la salida general).
  salidaPorDia: false,
  salidasDia: {},
  observacion: "",
});

// Datos del turno de la línea en el formato de la API.
export const turnoApi = (linea, modalidad) => ({
  codigo_modalidad: linea.modalidad,
  tipo_turno: linea.tipoTurno,
  hora_fin_turno: linea.tipoTurno === "TARDE" ? linea.horaFin : null,
  descansa_dia_entre_semana: Boolean(modalidad?.dias_semana.includes(DOMINGO) && linea.descansaEntreSemana),
  hora_fin_domingo: usaDomingoDistinto(linea, modalidad) ? linea.horaFinDomingo : null,
  salidas_por_dia: usaSalidaPorDia(linea) ? salidasPorDia(linea, modalidad) : null,
});

// Base de la dedicación acordada con Contabilidad: 24 días hábiles al mes.
export const DIAS_HABILES_MES = 24;

// Dedicación en decimal: mayor que 0 y hasta 1 (0,3 = 30 %), con hasta cuatro decimales.
export const dedicacionValida = (valor) => {
  const n = Number(valor);
  return valor !== "" && Number.isFinite(n) && n > 0 && n <= 1 && Math.abs(Math.round(n * 10000) - n * 10000) < 1e-6;
};

// Operarios equivalentes de la línea: personas × dedicación (dos decimales).
export const equivalentesLinea = (linea) =>
  Math.round((Number(linea.cantidad) || 0) * (Number(linea.dedicacion) || 0) * 100) / 100;

// Cargos sugeridos (ids) de la combinación CEN4 + CEN5; [] mientras carga, si
// falla o si la combinación no tiene (entonces se muestran todos los cargos).
export const useCargosSugeridos = (cen4, cen5) => {
  const [ids, setIds] = useState([]);

  useEffect(() => {
    setIds([]);
    if (!cen4 || !cen5) {
      return undefined;
    }
    let vigente = true;
    obtenerCargosSugeridos(cen4, cen5)
      .then((respuesta) => vigente && setIds(respuesta.ids || []))
      .catch(() => vigente && setIds([]));
    return () => {
      vigente = false;
    };
  }, [cen4, cen5]);

  return ids;
};

const CLASE_CAMPO =
  "h-10 w-full rounded-full border border-gray-200 bg-white px-4 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

const numero = (valor) => Number(valor).toLocaleString("es-CO", { maximumFractionDigits: 2 });
const numero4 = (valor) => Number(valor).toLocaleString("es-CO", { maximumFractionDigits: 4 });

/**
 * Una línea de la asignación: cargo, número de operarios, días que labora y
 * tipo de turno (en la tarde, la hora de salida). Calcula las horas semanales
 * en la API mientras se diligencia y las informa con
 * `onResultado(clave, { valido, supera, falta })`. La dedicación (decimal, 0,3 = 30 %) indica qué
 * parte de su tiempo va cada operario al centro (base 24 días hábiles al mes).
 * `cargosSugeridos`: ids de los cargos de la línea y servicio del centro, que
 * el selector muestra primero (se puede elegir cualquier otro).
 */
const LineaAsignacion = ({ numero: numeroLinea, linea, catalogos, cargosSugeridos, onChange, onQuitar, onResultado }) => {
  const [calculo, setCalculo] = useState(null);
  const [error, setError] = useState(null);
  const [calculando, setCalculando] = useState(false);

  const modalidad = catalogos.modalidades.find((m) => m.codigo === linea.modalidad);
  const incluyeDomingo = modalidad?.dias_semana.includes(DOMINGO);
  const preguntaDomingo = incluyeDomingo && ["TARDE", "NOCHE"].includes(linea.tipoTurno);
  const domingoDistinto = usaDomingoDistinto(linea, modalidad);
  const porDia = usaSalidaPorDia(linea);
  // Minutos por día (horas de la semana repartidas por igual), para las salidas posibles del domingo.
  const diasTrabajados = (modalidad?.dias_semana.length || 1) - (incluyeDomingo && linea.descansaEntreSemana ? 1 : 0);
  const minutosDia = Math.round((Number(catalogos.parametro?.horas_maximas_semana) || 42) * 60 / diasTrabajados);
  const opcionesDomingo = useMemo(() => salidasDia(minutosDia), [minutosDia]);
  const salidas = porDia ? salidasPorDia(linea, modalidad) : {};
  const diaSinSalida = Object.entries(salidas).find(([, h]) => !SALIDAS_TARDE.includes(h));
  // Detalle por día que devuelve el cálculo ({ dia: { hora_inicio, horas_nocturnas } }).
  const detalleDia = Object.fromEntries((calculo?.salidas_por_dia || []).map((d) => [String(d.dia), d]));

  const opcionesCargo = useMemo(
    () => catalogos.cargos.map((c) => ({ id: c.id, etiqueta: c.nombre })),
    [catalogos.cargos]
  );

  const cambiar = (campo, valor) => onChange({ ...linea, [campo]: valor });

  // Texto estable de lo que afecta el cálculo, para no recalcular sin cambios.
  const turnoCompleto =
    linea.tipoTurno &&
    (linea.tipoTurno !== "TARDE" || linea.horaFin) &&
    (!domingoDistinto || opcionesDomingo.includes(linea.horaFinDomingo)) &&
    !diaSinSalida;
  const datosCalculo = turnoCompleto ? JSON.stringify(turnoApi(linea, modalidad)) : null;

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
    }, 300);

    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [datosCalculo]);

  const dedicacionOk = dedicacionValida(linea.dedicacion);
  const dedicacion = Number(linea.dedicacion);
  const parcial = dedicacionOk && dedicacion < 1;
  const valido = Boolean(linea.idCargo && Number(linea.cantidad) >= 1 && dedicacionOk && calculo && !calculo.supera_maximo);

  // Qué le falta a la línea, para decirlo junto al botón de guardar.
  const falta = !linea.idCargo
    ? "elige el tipo de operario (cargo)"
    : !(Number(linea.cantidad) >= 1)
      ? "indica el número de operarios (mínimo 1)"
      : !dedicacionOk
        ? "la dedicación va en decimal: mayor que 0 y hasta 1 (p. ej. 0,3), con hasta cuatro decimales"
        : !linea.tipoTurno
        ? "elige el turno (Diurno, Tarde o Noche)"
        : linea.tipoTurno === "TARDE" && !linea.horaFin
          ? "indica la hora en que termina el turno"
          : domingoDistinto && !opcionesDomingo.includes(linea.horaFinDomingo)
            ? "indica la hora en que termina el domingo"
            : diaSinSalida
              ? `indica la salida del ${NOMBRES_DIA[diaSinSalida[0]]} (entre las 19:00 y las 24:00)`
            : error
              ? error
              : calculo?.supera_maximo
                ? "supera las horas máximas de la semana"
                : !calculo
                  ? "calculando las horas..."
                  : null;

  useEffect(() => {
    onResultado(linea.clave, { valido, supera: Boolean(calculo?.supera_maximo), falta });
    // onResultado cambia en cada render del padre; solo importa el resultado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linea.clave, valido, calculo?.supera_maximo, falta]);

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-gray-800">Línea {numeroLinea}</p>
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

      {/* Cargo, número de operarios y dedicación con ancho fijo (no ocupan toda la fila). */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,22rem)_9rem_10rem]">
        <FiltroBuscable
          id={`cargo-${linea.clave}`}
          label="Tipo de operario (cargo)"
          opciones={opcionesCargo}
          valor={linea.idCargo}
          onChange={(v) => cambiar("idCargo", v)}
          placeholder="Sin seleccionar"
          listaEnLinea
          sugeridas={cargosSugeridos}
          tituloSugeridas="Sugeridos para esta línea y servicio"
          textoVerTodas="Ver todos los cargos"
        />
        <div className="space-y-1">
          <label htmlFor={`cantidad-${linea.clave}`} className="text-xs font-bold uppercase text-gray-700">
            N.º de operarios
          </label>
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
        <div className="space-y-1">
          <label htmlFor={`dedicacion-${linea.clave}`} className="text-xs font-bold uppercase text-gray-700">
            Dedicación
          </label>
          <input
            id={`dedicacion-${linea.clave}`}
            type="number"
            min={0.0001}
            max={1}
            step="any"
            value={linea.dedicacion}
            title="Parte del tiempo que cada operario dedica a este centro, en decimal: 0,3 = 30 %; 1 = tiempo completo."
            onChange={(e) => cambiar("dedicacion", e.target.value)}
            className={cn(CLASE_CAMPO, !dedicacionOk && "border-red-300 focus:border-red-400 focus:ring-red-100")}
          />
        </div>
      </div>

      {parcial && (
        <p className="-mt-2 rounded-2xl bg-sky-50 px-3 py-2 text-xs text-sky-800">
          Dedicación parcial ({numero4(dedicacion)}): cada operario va unos{" "}
          {numero(DIAS_HABILES_MES * dedicacion)} de {DIAS_HABILES_MES} días hábiles al mes. Al centro se le
          cargan {numero(equivalentesLinea(linea))} operario(s) equivalente(s).
        </p>
      )}

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

      <div className="space-y-1">
        <p className="text-xs font-bold uppercase text-gray-700">Turno</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {Object.entries(TURNOS).map(([codigo, turno]) => {
            const Icono = turno.icono;
            const activo = linea.tipoTurno === codigo;

            return (
              <button
                key={codigo}
                type="button"
                onClick={() => onChange({ ...linea, tipoTurno: codigo, horaFin: codigo === "TARDE" ? linea.horaFin : "" })}
                aria-pressed={activo}
                className={cn(
                  "flex items-start gap-2 rounded-2xl border px-3 py-2 text-left transition-colors",
                  activo
                    ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100"
                    : "border-gray-200 hover:border-emerald-300"
                )}
              >
                <span className={cn("mt-0.5 rounded-lg p-1", turno.clase)}>
                  <Icono className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-gray-800">{turno.nombre}</span>
                  <span className="block text-xs text-gray-500">{turno.descripcion}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {linea.tipoTurno === "TARDE" && (
        <div className="space-y-1 sm:max-w-xs">
          <label htmlFor={`fin-${linea.clave}`} className="text-xs font-bold uppercase text-gray-700">
            {porDia ? "Salida general *" : "Hora en que termina el turno *"}
          </label>
          <select
            id={`fin-${linea.clave}`}
            value={linea.horaFin}
            onChange={(e) => cambiar("horaFin", e.target.value)}
            className={cn(CLASE_CAMPO, "cursor-pointer", !linea.horaFin && "text-gray-400")}
          >
            <option value="">Sin seleccionar</option>
            {SALIDAS_TARDE.map((h) => (
              <option key={h} value={h} className="text-gray-800">
                {h === "24:00" ? "24:00 (medianoche)" : h}
              </option>
            ))}
          </select>
          <label className="flex w-fit cursor-pointer items-center gap-2 pt-1 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={Boolean(linea.salidaPorDia)}
              onChange={(e) =>
                onChange({ ...linea, salidaPorDia: e.target.checked, salidasDia: {}, domingoDistinto: false, horaFinDomingo: "" })
              }
              className="h-4 w-4 accent-emerald-600"
            />
            La salida cambia según el día
          </label>
        </div>
      )}

      {porDia && (
        <div className="space-y-2 rounded-2xl bg-violet-50/60 p-3">
          <p className="text-xs font-bold uppercase text-gray-700">Salida de cada día</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {Object.entries(salidas).map(([dia, hora]) => (
              <div key={dia} className="space-y-1">
                <label htmlFor={`salida-${dia}-${linea.clave}`} className="text-xs font-semibold text-gray-600">
                  {NOMBRES_DIA[dia]}
                </label>
                <select
                  id={`salida-${dia}-${linea.clave}`}
                  value={SALIDAS_TARDE.includes(hora) ? hora : ""}
                  onChange={(e) => cambiar("salidasDia", { ...linea.salidasDia, [dia]: e.target.value })}
                  className={cn(
                    "h-9 w-full cursor-pointer rounded-full border border-gray-200 bg-white px-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100",
                    !SALIDAS_TARDE.includes(hora) && "border-red-300 text-gray-400"
                  )}
                >
                  <option value="">{linea.horaFin ? `General (${linea.horaFin})` : "—"}</option>
                  {SALIDAS_TARDE.map((h) => (
                    <option key={h} value={h} className="text-gray-800">
                      {h}
                    </option>
                  ))}
                </select>
                {detalleDia[dia] && (
                  <p className="px-1 text-[11px] leading-tight text-gray-500">
                    entra {detalleDia[dia].hora_inicio}
                    <br />
                    {Number(detalleDia[dia].horas_nocturnas)
                      ? `${numero(detalleDia[dia].horas_nocturnas)} h noct.`
                      : "sin nocturnas"}
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="px-1 text-xs text-gray-500">
            Cada día trabaja {numero(minutosDia / 60)} h; las nocturnas van desde las 19:00 hasta la salida (si un día
            termina antes, elige 19:00: no suma nocturnas).
            {incluyeDomingo &&
              linea.descansaEntreSemana &&
              " El día de descanso rota de lunes a viernes: las nocturnas de esos días se promedian."}
          </p>
        </div>
      )}

      {preguntaDomingo && !porDia && (
        <div className="space-y-2 rounded-2xl bg-amber-50/60 p-3">
          <p className="text-xs font-bold uppercase text-gray-700">¿El domingo termina a la misma hora que los demás días?</p>
          <div className="flex flex-wrap gap-2">
            {[
              [false, "Igual que los demás días"],
              [true, "El domingo termina a otra hora"],
            ].map(([valor, texto]) => (
              <button
                key={texto}
                type="button"
                onClick={() => onChange({ ...linea, domingoDistinto: valor, horaFinDomingo: "" })}
                aria-pressed={Boolean(linea.domingoDistinto) === valor}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                  Boolean(linea.domingoDistinto) === valor
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100"
                    : "border-gray-200 bg-white text-gray-600 hover:border-emerald-300"
                )}
              >
                {texto}
              </button>
            ))}
          </div>

          {domingoDistinto && (
            <div className="space-y-1 sm:max-w-xs">
              <label htmlFor={`domingo-${linea.clave}`} className="text-xs font-bold uppercase text-gray-700">
                Hora en que termina el domingo *
              </label>
              <select
                id={`domingo-${linea.clave}`}
                value={linea.horaFinDomingo}
                onChange={(e) => cambiar("horaFinDomingo", e.target.value)}
                className={cn(CLASE_CAMPO, "cursor-pointer", !linea.horaFinDomingo && "text-gray-400")}
              >
                <option value="">Sin seleccionar</option>
                {opcionesDomingo.map((h) => (
                  <option key={h} value={h} className="text-gray-800">
                    {h === "24:00" ? "24:00 (medianoche)" : h}
                  </option>
                ))}
              </select>
              <p className="px-1 text-xs text-gray-500">
                Trabaja las mismas {numero(minutosDia / 60)} h; cambia cuántas son dominicales diurnas y cuántas nocturnas.
              </p>
            </div>
          )}
        </div>
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
              {numero(calculo.horas_semana)} h/semana por operario
            </span>
            {parcial && (
              <span
                title="Horas del turno × dedicación: lo que se le carga a este centro por cada operario."
                className="rounded-full bg-sky-50 px-3 py-1 font-semibold text-sky-800"
              >
                {numero(calculo.horas_semana * dedicacion)} h/semana en este centro (dedicación {numero4(dedicacion)})
              </span>
            )}
            <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
              {numero(calculo.horas_dia)} h por día
              {calculo.hora_inicio_turno && !porDia && ` · de ${calculo.hora_inicio_turno} a ${calculo.hora_fin_turno}`}
              {porDia && " · salida según el día"}
            </span>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">
              {numero(calculo.horas_nocturnas_semana)} h nocturnas
            </span>
            {calculo.hora_inicio_domingo && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                Domingo de {calculo.hora_inicio_domingo} a {calculo.hora_fin_domingo}
              </span>
            )}
            <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
              {numero(calculo.horas_dominicales_semana - calculo.horas_nocturnas_dominicales_semana)} h dominicales diurnas
            </span>
            <span
              title="Domingo en franja nocturna: lleva el recargo nocturno y el dominical (ya incluidas en las nocturnas)."
              className="rounded-full bg-fuchsia-50 px-3 py-1 text-fuchsia-700"
            >
              {numero(calculo.horas_nocturnas_dominicales_semana)} h nocturnas dominicales
            </span>
          </>
        ) : (
          <span className="text-gray-500">
            {linea.tipoTurno === "TARDE"
              ? "Indica la hora en que termina el turno para calcular las horas."
              : "Elige el turno para calcular las horas."}
          </span>
        )}
      </div>
    </div>
  );
};

export default LineaAsignacion;
