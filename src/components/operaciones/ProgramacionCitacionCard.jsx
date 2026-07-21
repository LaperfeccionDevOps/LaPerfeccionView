import React from 'react';
import {
  Calendar,
  Loader2,
  MapPin,
} from 'lucide-react';

import { Input } from '@/components/ui/input';

const formatearFechaColombia = (valor) => {
  if (!valor) {
    return '';
  }

  const partes = String(valor).split('-');

  if (partes.length !== 3) {
    return valor;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

const ProgramacionCitacionCard = ({
  formData,
  onChange,
  fechaMinimaPermitida,
  horariosDisponibles,
  cargandoConfiguracion,
  cargandoHorarios,
  errorProgramacion,
  programacionValida,
}) => {
  const esVirtual =
    formData.modalidad === 'VIRTUAL';

  const esPresencial =
    formData.modalidad === 'PRESENCIAL';

  const fechaMinimaTexto =
    formatearFechaColombia(
      fechaMinimaPermitida
    );

  const handleModalidadChange = (event) => {
    const nuevaModalidad = event.target.value;

    onChange(event);

    if (nuevaModalidad === 'PRESENCIAL') {
      onChange({
        target: {
          name: 'lugarCitacion',
          value:
            String(
              formData.lugarCitacion || ''
            ).trim() ||
            'Sede principal Galán',
        },
      });

      return;
    }

    if (nuevaModalidad === 'VIRTUAL') {
      onChange({
        target: {
          name: 'lugarCitacion',
          value: '',
        },
      });
    }
  };

  return (
    <section className="mt-6 min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex min-w-0 items-start gap-3 border-b border-gray-100 pb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <Calendar className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h2 className="break-words text-lg font-bold text-gray-800">
            Programación de la citación
          </h2>

          <p className="mt-1 break-words text-sm text-gray-500">
            Selecciona primero una fecha válida y después una hora disponible.
          </p>
        </div>
      </div>

      <div className="mt-5 grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="min-w-0">
          <label
            htmlFor="fechaCitacion"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Fecha de la citación *
          </label>

          <Input
            id="fechaCitacion"
            name="fechaCitacion"
            type="date"
            value={formData.fechaCitacion}
            min={fechaMinimaPermitida || undefined}
            onChange={onChange}
            disabled={cargandoConfiguracion}
            className="min-h-11 w-full"
          />

          {cargandoConfiguracion ? (
            <p className="mt-2 flex items-center gap-2 text-xs text-blue-700">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Consultando la fecha mínima permitida...
            </p>
          ) : fechaMinimaTexto ? (
            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              Primera fecha permitida: {fechaMinimaTexto}. El sistema excluye sábados, domingos y festivos de Colombia.
            </p>
          ) : null}
        </div>

        <div className="min-w-0">
          <label
            htmlFor="horaCitacion"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Hora de la citación *
          </label>

          <select
            id="horaCitacion"
            name="horaCitacion"
            value={formData.horaCitacion}
            onChange={onChange}
            disabled={
              !formData.fechaCitacion ||
              cargandoHorarios ||
              Boolean(errorProgramacion)
            }
            className="min-h-11 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition-colors disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">
              {!formData.fechaCitacion
                ? 'Selecciona primero una fecha'
                : cargandoHorarios
                  ? 'Consultando horarios...'
                  : horariosDisponibles.length > 0
                    ? 'Selecciona una hora disponible'
                    : 'No hay horarios disponibles'}
            </option>

            {horariosDisponibles.map(
              (horario) => (
                <option
                  key={`${horario.HoraInicio}-${horario.HoraFin}`}
                  value={horario.HoraInicio}
                >
                  {horario.Etiqueta ||
                    `${horario.HoraInicio} - ${horario.HoraFin}`}
                </option>
              )
            )}
          </select>

          {cargandoHorarios && (
            <p className="mt-2 flex items-center gap-2 text-xs text-blue-700">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Consultando las horas disponibles para esta fecha...
            </p>
          )}

          {!cargandoHorarios &&
            formData.fechaCitacion &&
            !errorProgramacion &&
            horariosDisponibles.length > 0 && (
              <p className="mt-2 text-xs text-gray-500">
                Se encontraron {horariosDisponibles.length} horario(s) disponible(s).
              </p>
            )}
        </div>
      </div>

      {errorProgramacion && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorProgramacion}
        </div>
      )}

      {!programacionValida &&
        !errorProgramacion && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Selecciona una fecha válida y una hora disponible para habilitar el resto del formulario.
          </div>
        )}

      {programacionValida && (
        <div className="mt-6 border-t border-gray-100 pt-6">
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            La fecha y la hora están disponibles. Ya puedes completar la información del caso.
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="min-w-0 lg:col-span-2">
              <p className="mb-3 text-sm font-semibold text-gray-700">
                Modalidad *
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label
                  className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                    esPresencial
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="modalidad"
                    value="PRESENCIAL"
                    checked={esPresencial}
                    onChange={handleModalidadChange}
                    className="h-4 w-4"
                  />

                  <span className="font-semibold text-gray-800">
                    Presencial
                  </span>
                </label>

                <label
                  className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                    esVirtual
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="modalidad"
                    value="VIRTUAL"
                    checked={esVirtual}
                    onChange={handleModalidadChange}
                    className="h-4 w-4"
                  />

                  <span className="font-semibold text-gray-800">
                    Virtual
                  </span>
                </label>
              </div>
            </div>

            <div className="min-w-0 lg:col-span-2">
              <label
                htmlFor="lugarCitacion"
                className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700"
              >
                <MapPin className="h-4 w-4 text-emerald-600" />

                {esVirtual
                  ? 'Enlace o información de conexión *'
                  : 'Lugar de la citación *'}
              </label>

              <Input
                id="lugarCitacion"
                name="lugarCitacion"
                type="text"
                value={formData.lugarCitacion}
                onChange={onChange}
                placeholder={
                  esVirtual
                    ? 'Ejemplo: enlace de Google Meet o Teams'
                    : 'Sede principal Galán'
                }
                className="min-h-11 w-full"
              />
            </div>

            <div className="min-w-0">
              <label
                htmlFor="supervisorReporta"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Supervisor que reporta *
              </label>

              <Input
                id="supervisorReporta"
                name="supervisorReporta"
                type="text"
                value={formData.supervisorReporta}
                onChange={onChange}
                placeholder="Nombre del supervisor"
                className="min-h-11 w-full"
              />
            </div>

            <div className="min-w-0">
              <label
                htmlFor="cliente"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Cliente *
              </label>

              <Input
                id="cliente"
                name="cliente"
                type="text"
                value={formData.cliente}
                onChange={onChange}
                placeholder="Cliente relacionado con el caso"
                className="min-h-11 w-full"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProgramacionCitacionCard;