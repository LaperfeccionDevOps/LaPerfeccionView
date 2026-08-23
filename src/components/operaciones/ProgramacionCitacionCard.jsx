import React from 'react';
import {
  Calendar,
  Loader2,
  Mail,
  Video,
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

  const esHorarioViernesAutorizado =
    horariosDisponibles.some(
      (horario) =>
        horario?.EsAutorizacionViernes === true
    );

  const esViernesSeleccionado = (() => {
    const fecha = String(
      formData.fechaCitacion || ''
    ).trim();

    if (!fecha) {
      return false;
    }

    const partes = fecha
      .split('-')
      .map(Number);

    if (
      partes.length !== 3 ||
      partes.some((parte) =>
        Number.isNaN(parte)
      )
    ) {
      return false;
    }

    const [
      anio,
      mes,
      dia,
    ] = partes;

    return new Date(
      anio,
      mes - 1,
      dia
    ).getDay() === 5;
  })();

  const mensajeViernes =
    'Los viernes solo se atienden casos previamente autorizados por Relaciones Laborales. Si considera que este caso es crítico, comuníquese con RRLL para solicitar la autorización correspondiente.';

  const solicitudViernesPendiente =
    esViernesSeleccionado &&
    (
      String(errorProgramacion || '')
        .toLowerCase()
        .includes('pendiente de aprobación') ||
      String(errorProgramacion || '')
        .toLowerCase()
        .includes('solicitud enviada')
    );

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
                    : solicitudViernesPendiente
                        ? 'Pendiente de autorización'
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
                {esHorarioViernesAutorizado
                  ? 'Se habilitó el horario autorizado por Relaciones Laborales.'
                  : `Se encontraron ${horariosDisponibles.length} horario(s) disponible(s).`}
              </p>
            )}
        </div>
      </div>

      {errorProgramacion &&
        esViernesSeleccionado && (
          <div
            className="mt-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-900"
            role="alert"
          >
            <p className="font-semibold">
              {solicitudViernesPendiente
                ? 'Solicitud enviada correctamente'
                : 'Atención para agendamiento en viernes'}
            </p>

            <p className="mt-1 leading-relaxed">
              {solicitudViernesPendiente
                ? (
                    'La citación del viernes fue enviada a Relaciones Laborales. Cuando RRLL la apruebe, el horario aparecerá automáticamente para continuar el proceso.'
                  )
                : mensajeViernes}
            </p>
          </div>
        )}

      {errorProgramacion &&
        !esViernesSeleccionado && (
          <div
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
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

            {esPresencial && (
              <div className="min-w-0 lg:col-span-2">
                <label
                  htmlFor="lugarCitacion"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Lugar de la citación *
                </label>

                <Input
                  id="lugarCitacion"
                  name="lugarCitacion"
                  type="text"
                  value={formData.lugarCitacion}
                  onChange={onChange}
                  placeholder="Sede principal Galán"
                  className="min-h-11 w-full"
                />
              </div>
            )}

            {esVirtual && (
              <div className="min-w-0 lg:col-span-2">
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
                      <Video className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-bold text-blue-900">
                        Citación virtual
                      </p>

                      <p className="mt-1 text-sm leading-relaxed text-blue-800">
                        El enlace de la reunión será asignado por Relaciones Laborales después de recibir el caso.
                      </p>

                      <p className="mt-2 text-xs leading-relaxed text-blue-700">
                        Operaciones puede continuar con el registro y envío del proceso sin diligenciar un enlace de conexión.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                value={formData.supervisorReporta || ''}
                onChange={onChange}
                placeholder="Nombre del supervisor"
                className="min-h-11 w-full"
              />
            </div>

            <div className="min-w-0">
              <label
                htmlFor="correoSupervisorReporta"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Correo del supervisor que reporta *
              </label>

              <Input
                id="correoSupervisorReporta"
                name="correoSupervisorReporta"
                type="email"
                value={formData.correoSupervisorReporta || ''}
                onChange={onChange}
                placeholder="correo@empresa.com"
                autoComplete="email"
                required
                className="min-h-11 w-full"
              />
            </div>

            <div className="min-w-0 lg:col-span-2">
              <div
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
                role="alert"
              >
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-amber-900">
                      Verifique el correo del supervisor
                    </p>

                    <p className="mt-1 text-sm leading-relaxed text-amber-800">
                      Verifique que este correo corresponda al supervisor que
                      reporta. Si está desactualizado o no corresponde,
                      modifíquelo antes de continuar.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="min-w-0 lg:col-span-2">
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