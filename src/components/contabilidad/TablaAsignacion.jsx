import React from "react";
import { Moon, Sun, SunMoon } from "lucide-react";

import { TIPOS_EXTRA, TURNOS } from "@/components/contabilidad/LineaAsignacion";
import { cn } from "@/lib/utils";

// "06:00:00" -> "06:00"
const hora = (valor) => (valor || "").slice(0, 5);

const descanso = (nombre, minutos, inicio) =>
  minutos ? `${nombre}${inicio ? ` ${hora(inicio)}` : ""} · ${minutos} min` : null;

const descansos = (h) =>
  [
    descanso("desayuno", h.minutos_desayuno, h.hora_desayuno),
    descanso("almuerzo", h.minutos_almuerzo, h.hora_almuerzo),
    descanso("cena", h.minutos_cena, h.hora_cena),
  ]
    .filter(Boolean)
    .join("; ");

export const textoHorario = (h) => {
  const extra = descansos(h);
  return `${hora(h.hora_inicio)} – ${hora(h.hora_fin)}${extra ? ` (${extra})` : ""}`;
};

// "3 operario(s)" o, con dedicación parcial, "0,3 operario(s) equivalente(s) (1 persona(s))".
export const textoOperarios = (a) =>
  a.total_personas === undefined || Number(a.total_operarios) === Number(a.total_personas)
    ? `${Number(a.total_operarios).toLocaleString("es-CO")} operario(s)`
    : `${Number(a.total_operarios).toLocaleString("es-CO")} operario(s) equivalente(s) (${a.total_personas} persona(s))`;

// Líneas con tipo de turno; las registradas antes se clasifican por sus horas
// (diurno sin nocturnas, nocturno cuando casi todo el turno lo es).
const tipoHorario = (l) => {
  if (TURNOS[l.tipo_turno]) {
    return TURNOS[l.tipo_turno];
  }
  if (!Number(l.horas_nocturnas_semana)) {
    return { nombre: "Diurno", icono: Sun, clase: "bg-sky-50 text-sky-700" };
  }
  if (Number(l.horas_nocturnas_semana) >= Number(l.horas_semana) * 0.9) {
    return { nombre: "Nocturno", icono: Moon, clase: "bg-indigo-50 text-indigo-700" };
  }
  return { nombre: "Mixto", icono: SunMoon, clase: "bg-violet-50 text-violet-700" };
};

const numero = (valor) => Number(valor).toLocaleString("es-CO", { maximumFractionDigits: 2 });

/**
 * Líneas de una asignación (cargo, operarios, días, horario, tipo de horario y
 * horas) y, si llega `parametro`, el total de horas con recargo nocturno y
 * dominical de todos los operarios con su porcentaje legal vigente.
 */
const TablaAsignacion = ({ lineas, parametro }) => {
  // Operarios equivalentes (personas × dedicación) × horas por operario.
  const equivalentes = (l) => Number(l.operarios_equivalentes ?? l.cantidad_operarios);
  const total = (campo) => lineas.reduce((suma, l) => suma + equivalentes(l) * Number(l[campo]), 0);
  const hayParcial = lineas.some((l) => Number(l.dedicacion ?? 1) < 1);
  // Las horas de cada línea son las de un operario en este centro (turno × dedicación).
  const dedicacionDe = (l) => Number(l.dedicacion ?? 1);
  const nocturnas = total("horas_nocturnas_semana");
  const dominicales = total("horas_dominicales_semana");
  const nocturnasDominicales = total("horas_nocturnas_dominicales_semana");
  // Horas extras (por operario a tiempo completo; se muestran × dedicación).
  const extrasDe = (l) => TIPOS_EXTRA.filter(({ campo }) => Number(l[campo]) > 0);
  const hayExtras = lineas.some((l) => extrasDe(l).length > 0);
  const totalesExtra = TIPOS_EXTRA.map((t) => ({ ...t, horas: total(t.campo) })).filter((t) => t.horas > 0);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-700">
            <tr>
              <th className="px-3 py-3">Cargo</th>
              <th className="px-3 py-3 text-right">Operarios</th>
              {hayParcial && (
                <th className="px-3 py-3 text-right" title="Parte del tiempo de cada operario (base 24 días hábiles al mes)">
                  Dedicación
                </th>
              )}
              <th className="px-3 py-3">Días</th>
              <th className="px-3 py-3">Turno</th>
              <th className="px-3 py-3 text-right">H/semana</th>
              <th className="px-3 py-3 text-right">Nocturnas</th>
              <th className="px-3 py-3 text-right">Dominicales</th>
              <th className="px-3 py-3 text-right" title="Domingo en franja nocturna">Noct. dominicales</th>
              {hayExtras && (
                <th className="px-3 py-3" title="Horas extras por operario y semana (HED diurnas, HEN nocturnas, HEDF / HENF dominicales o festivas)">
                  Horas extras
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lineas.map((l) => {
              const tipo = tipoHorario(l);
              const Icono = tipo.icono;

              return (
                <tr key={l.id_detalle} className="align-top">
                  <td className="px-3 py-3 text-gray-800">{l.cargo}</td>
                  <td className="px-3 py-3 text-right font-semibold text-gray-800">{l.cantidad_operarios}</td>
                  {hayParcial && (
                    <td className="px-3 py-3 text-right text-gray-700">
                      <p>{Number(l.dedicacion ?? 1).toLocaleString("es-CO", { maximumFractionDigits: 4 })}</p>
                      {Number(l.dedicacion ?? 1) < 1 && (
                        <p className="whitespace-nowrap text-xs text-gray-500">= {numero(equivalentes(l))} equiv.</p>
                      )}
                    </td>
                  )}
                  <td className="px-3 py-3 text-gray-700">
                    <p>{l.modalidad}</p>
                    {l.descansa_dia_entre_semana && (
                      <p className="text-xs text-gray-500">Descansa 1 día entre semana</p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-gray-700">
                    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", tipo.clase)}>
                      <Icono className="h-3.5 w-3.5" />
                      {tipo.nombre}
                    </span>
                    {l.tipo_turno ? (
                      <p className="mt-1 text-xs text-gray-500">
                        {numero(l.horas_dia)} h por día
                        {l.resumen_salidas
                          ? ` · ${l.resumen_salidas}`
                          : l.hora_inicio_turno && ` · ${l.hora_inicio_turno} a ${l.hora_fin_turno}`}
                      </p>
                    ) : null}
                    {l.tipo_turno && l.hora_inicio_domingo ? (
                      <p className="text-xs text-gray-500">
                        Domingo: {l.hora_inicio_domingo} a {l.hora_fin_domingo}
                      </p>
                    ) : (
                      l.horario_general && (
                        <p className="mt-1 text-xs text-gray-500">
                          Horario anterior: {textoHorario(l.horario_general)}
                          {l.horario_sabado && `; sábado ${textoHorario(l.horario_sabado)}`}
                        </p>
                      )
                    )}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-700">{numero(l.horas_semana * dedicacionDe(l))}</td>
                  <td className="px-3 py-3 text-right text-gray-700">{numero(l.horas_nocturnas_semana * dedicacionDe(l))}</td>
                  <td className="px-3 py-3 text-right text-gray-700">{numero(l.horas_dominicales_semana * dedicacionDe(l))}</td>
                  <td className="px-3 py-3 text-right text-gray-700">
                    {numero(l.horas_nocturnas_dominicales_semana * dedicacionDe(l))}
                  </td>
                  {hayExtras && (
                    <td className="px-3 py-3 text-gray-700">
                      {extrasDe(l).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {extrasDe(l).map(({ campo, abreviatura, nombre }) => (
                            <span
                              key={campo}
                              title={nombre}
                              className="whitespace-nowrap rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700"
                            >
                              {numero(Number(l[campo]) * dedicacionDe(l))} h {abreviatura}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500">
        Horas por operario y por semana, repartidas por igual entre los días trabajados. Las nocturnas
        dominicales ya están incluidas en las nocturnas y en las dominicales.
        {hayParcial &&
          " Con dedicación parcial, las horas de la línea son las del turno por la dedicación (0,4 → 40 %), y los totales de recargo usan los operarios equivalentes (operarios × dedicación)."}
        {hayExtras &&
          " Horas extras: HED diurnas, HEN nocturnas, HEDF diurnas dominicales o festivas y HENF nocturnas dominicales o festivas."}
      </p>

      {parametro && totalesExtra.length > 0 && (
        <div className="rounded-2xl bg-orange-50 px-4 py-3">
          <p className="text-xs font-bold uppercase text-orange-800">Horas extras</p>
          <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1">
            {totalesExtra.map(({ campo, abreviatura, nombre, horas }) => (
              <p key={campo} className="text-sm text-orange-900" title={nombre}>
                <span className="text-lg font-bold">{numero(horas)} h/semana</span>{" "}
                <span className="text-xs text-orange-700">
                  {abreviatura} · {nombre.toLowerCase()}
                </span>
              </p>
            ))}
          </div>
          <p className="text-xs text-orange-700">Todos los operarios{hayParcial && " (equivalentes)"}</p>
        </div>
      )}

      {parametro && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-indigo-50 px-4 py-3">
            <p className="text-xs font-bold uppercase text-indigo-800">Recargo nocturno</p>
            <p className="text-lg font-bold text-indigo-900">{numero(nocturnas)} h/semana</p>
            <p className="text-xs text-indigo-700">
              Todos los operarios{hayParcial && " (equivalentes)"} · {numero(parametro.porcentaje_recargo_nocturno)} % entre las{" "}
              {hora(parametro.hora_inicio_nocturna)} y las {hora(parametro.hora_fin_nocturna)}
            </p>
          </div>
          <div className="rounded-2xl bg-amber-50 px-4 py-3">
            <p className="text-xs font-bold uppercase text-amber-800">Recargo dominical</p>
            <p className="text-lg font-bold text-amber-900">{numero(dominicales)} h/semana</p>
            <p className="text-xs text-amber-700">
              Todos los operarios{hayParcial && " (equivalentes)"} · {numero(parametro.porcentaje_recargo_dominical)} % (festivos aparte)
            </p>
          </div>
          <div className="rounded-2xl bg-fuchsia-50 px-4 py-3">
            <p className="text-xs font-bold uppercase text-fuchsia-800">Recargo nocturno dominical</p>
            <p className="text-lg font-bold text-fuchsia-900">{numero(nocturnasDominicales)} h/semana</p>
            <p className="text-xs text-fuchsia-700">
              Domingo entre las {hora(parametro.hora_inicio_nocturna)} y las {hora(parametro.hora_fin_nocturna)} ·{" "}
              {numero(parametro.porcentaje_recargo_nocturno)} % +{" "}
              {numero(parametro.porcentaje_recargo_dominical)} %
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablaAsignacion;
