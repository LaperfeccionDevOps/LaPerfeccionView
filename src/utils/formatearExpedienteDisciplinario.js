/**
 * Construye el código visual del expediente disciplinario.
 *
 * Ejemplo:
 * IdProcesoDisciplinario: 24
 * FechaCreacion: 2026-08-03
 * Resultado: PD-2026-000024
 */
export const formatearExpedienteDisciplinario = (
  procesoOId,
  fechaCreacion = null
) => {
  const esObjeto =
    procesoOId !== null &&
    typeof procesoOId === "object";

  const idProceso = esObjeto
    ? procesoOId?.IdProcesoDisciplinario
    : procesoOId;

  const fechaProceso = esObjeto
    ? procesoOId?.FechaCreacion ||
      procesoOId?.FechaProceso ||
      procesoOId?.FechaCitacion ||
      fechaCreacion
    : fechaCreacion;

  const idNumerico = Number(idProceso);

  if (
    !Number.isInteger(idNumerico) ||
    idNumerico <= 0
  ) {
    return "PD-SIN-ASIGNAR";
  }

  let anio = new Date().getFullYear();

  if (fechaProceso) {
    const textoFecha = String(fechaProceso);
    const coincidencia = textoFecha.match(/^(\d{4})/);

    if (coincidencia) {
      anio = Number(coincidencia[1]);
    } else {
      const fecha = new Date(fechaProceso);

      if (!Number.isNaN(fecha.getTime())) {
        anio = fecha.getFullYear();
      }
    }
  }

  const consecutivo = String(idNumerico).padStart(
    6,
    "0"
  );

  return `PD-${anio}-${consecutivo}`;
};