import React from 'react';
import { User } from 'lucide-react';


const obtenerValor = (
  valor,
  valorAlterno = '—'
) => {
  if (
    valor === null ||
    valor === undefined ||
    String(valor).trim() === ''
  ) {
    return valorAlterno;
  }

  return valor;
};


const formatearFechaColombiana = (valor) => {
  if (!valor) {
    return '—';
  }

  const fechaTexto = String(valor).slice(0, 10);
  const partes = fechaTexto.split('-');

  if (partes.length !== 3) {
    return fechaTexto;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};


const TrabajadorSeleccionadoCard = ({
  trabajador,
  idRegistroPersonal,
  telefonoTrabajador = '',
  onTelefonoChange,
}) => {
  const nombreCompleto =
    trabajador?.NombreCompleto ||
    `${trabajador?.nombres || ''} ${
      trabajador?.apellidos || ''
    }`.trim();


  const identificacion =
    trabajador?.NumeroDocumento ||
    trabajador?.cedula ||
    trabajador?.NumeroIdentificacion ||
    trabajador?.numeroIdentificacion ||
    trabajador?.identificacion ||
    trabajador?.documento;


  const cargo =
    trabajador?.Cargo ||
    trabajador?.nombreCargo ||
    trabajador?.NombreCargo ||
    trabajador?.descripcionCargo ||
    trabajador?.DescripcionCargo ||
    trabajador?.cargoNombre ||
    trabajador?.CargoNombre ||
    trabajador?.NombreTipoCargo ||
    trabajador?.DescripcionTipoCargo ||
    trabajador?.cargo;


  const cliente =
    trabajador?.ClienteNombre ||
    trabajador?.Cliente ||
    trabajador?.clienteNombre ||
    trabajador?.nombreCliente ||
    trabajador?.NombreCliente;


  const estado =
    trabajador?.Estado ||
    trabajador?.estado ||
    trabajador?.EstadoProceso ||
    trabajador?.NombreEstado;


  const fechaIngreso =
    trabajador?.FechaIngreso ||
    trabajador?.fechaIngreso ||
    trabajador?.FechaIngresoContrato ||
    trabajador?.fechaIngresoContrato;


  const campos = [
    {
      label: 'Identificación',
      value: obtenerValor(identificacion),
    },
    {
      label: 'Cargo',
      value: obtenerValor(cargo),
    },
    {
      label: 'Cliente',
      value: obtenerValor(cliente),
    },
    {
      label: 'Fecha de ingreso',
      value: formatearFechaColombiana(
        fechaIngreso
      ),
    },
    {
      label: 'Estado',
      value: obtenerValor(estado),
    },
    {
      label: 'Registro personal',
      value: obtenerValor(
        idRegistroPersonal
      ),
    },
  ];


  return (
    <section className="mt-6 min-w-0 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
          <User className="h-6 w-6" />
        </div>


        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Trabajador seleccionado
          </p>


          <h2 className="mt-1 break-words text-lg font-bold text-gray-900">
            {obtenerValor(
              nombreCompleto
            ).toUpperCase()}
          </h2>


          <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-gray-500">
                Identificación
              </p>

              <p className="mt-1 break-words font-medium text-gray-800">
                {obtenerValor(identificacion)}
              </p>
            </div>


            <div className="min-w-0">
              <label
                htmlFor="telefonoTrabajador"
                className="text-xs font-semibold uppercase text-gray-500"
              >
                Teléfono del trabajador *
              </label>

              <input
                id="telefonoTrabajador"
                name="telefonoTrabajador"
                type="tel"
                inputMode="tel"
                value={telefonoTrabajador || ''}
                onChange={onTelefonoChange}
                maxLength={30}
                placeholder="Ej. 3001234567"
                className="mt-1 min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />

              <p className="mt-1 text-xs text-gray-500">
                Se precarga desde la información del trabajador cuando está disponible.
              </p>
            </div>


            {campos
              .filter(
                (campo) =>
                  campo.label !== 'Identificación'
              )
              .map((campo) => (
                <div
                  key={campo.label}
                  className="min-w-0"
                >
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    {campo.label}
                  </p>

                  <p className="mt-1 break-words font-medium text-gray-800">
                    {campo.value}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
};


export default TrabajadorSeleccionadoCard;