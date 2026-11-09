import React from "react";
import { Moon, Sun, SunMoon } from "lucide-react";

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

// Diurno sin horas nocturnas; nocturno cuando casi todo el turno lo es
// (las nocturnas no descuentan descansos, por eso se compara con margen).
const tipoHorario = (l) => {
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
  const total = (campo) => lineas.reduce((suma, l) => suma + l.cantidad_operarios * Number(l[campo]), 0);
  const nocturnas = total("horas_nocturnas_semana");
  const dominicales = total("horas_dominicales_semana");
  const nocturnasDominicales = total("horas_nocturnas_dominicales_semana");

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-700">
            <tr>
              <th className="px-3 py-3">Cargo</th>
              <th className="px-3 py-3 text-right">Operarios</th>
              <th className="px-3 py-3">Días</th>
              <th className="px-3 py-3">Horario</th>
              <th className="px-3 py-3">Tipo</th>
              <th className="px-3 py-3 text-right">H/semana</th>
              <th className="px-3 py-3 text-right">Nocturnas</th>
              <th className="px-3 py-3 text-right">Dominicales</th>
              <th className="px-3 py-3 text-right" title="Domingo en franja nocturna">Noct. dominicales</th>
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
                  <td className="px-3 py-3 text-gray-700">
                    <p>{l.modalidad}</p>
                    {l.descansa_dia_entre_semana && (
                      <p className="text-xs text-gray-500">Descansa 1 día entre semana</p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-gray-700">
                    <p>{textoHorario(l.horario_general)}</p>
                    {l.horario_sabado && (
                      <p className="text-xs text-gray-500">Sábado: {textoHorario(l.horario_sabado)}</p>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", tipo.clase)}>
                      <Icono className="h-3.5 w-3.5" />
                      {tipo.nombre}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right text-gray-700">{numero(l.horas_semana)}</td>
                  <td className="px-3 py-3 text-right text-gray-700">{numero(l.horas_nocturnas_semana)}</td>
                  <td className="px-3 py-3 text-right text-gray-700">{numero(l.horas_dominicales_semana)}</td>
                  <td className="px-3 py-3 text-right text-gray-700">{numero(l.horas_nocturnas_dominicales_semana)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500">
        Horas por operario y por semana. Los descansos se descuentan de la franja donde caen (diurna,
        nocturna o dominical). Las nocturnas dominicales ya están incluidas en las nocturnas y en las dominicales.
      </p>

      {parametro && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-indigo-50 px-4 py-3">
            <p className="text-xs font-bold uppercase text-indigo-800">Recargo nocturno</p>
            <p className="text-lg font-bold text-indigo-900">{numero(nocturnas)} h/semana</p>
            <p className="text-xs text-indigo-700">
              Todos los operarios · {numero(parametro.porcentaje_recargo_nocturno)} % entre las{" "}
              {hora(parametro.hora_inicio_nocturna)} y las {hora(parametro.hora_fin_nocturna)}
            </p>
          </div>
          <div className="rounded-2xl bg-amber-50 px-4 py-3">
            <p className="text-xs font-bold uppercase text-amber-800">Recargo dominical</p>
            <p className="text-lg font-bold text-amber-900">{numero(dominicales)} h/semana</p>
            <p className="text-xs text-amber-700">
              Todos los operarios · {numero(parametro.porcentaje_recargo_dominical)} % (festivos aparte)
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
