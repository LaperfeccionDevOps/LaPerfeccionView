import { API_BASE_URL } from "../configFiles/api";

const BASE_URL = `${API_BASE_URL}/agenda-disciplinaria`;

async function procesarRespuesta(response, mensajePorDefecto) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detalle = data?.detail;

    if (typeof detalle === "string") {
      throw new Error(detalle);
    }

    if (detalle && typeof detalle === "object") {
      throw new Error(
        detalle.mensaje || mensajePorDefecto
      );
    }

    throw new Error(mensajePorDefecto);
  }

  return data;
}

export async function obtenerAgendaHoy() {
  const response = await fetch(
    `${BASE_URL}/hoy/listado`
  );

  return procesarRespuesta(
    response,
    "Error consultando la agenda de hoy"
  );
}

export async function obtenerAgendaPorFecha(fecha) {
  const response = await fetch(
    `${BASE_URL}/fecha/${fecha}`
  );

  return procesarRespuesta(
    response,
    "Error consultando la agenda por fecha"
  );
}

export async function obtenerAgendaGeneral({
  fechaDesde,
  fechaHasta,
  estado = "",
  buscar = "",
}) {
  if (!fechaDesde || !fechaHasta) {
    throw new Error(
      "Debe indicar la fecha inicial y la fecha final."
    );
  }

  const parametros = new URLSearchParams({
    fecha_desde: fechaDesde,
    fecha_hasta: fechaHasta,
  });

  if (estado.trim()) {
    parametros.set(
      "estado",
      estado.trim().toUpperCase()
    );
  }

  if (buscar.trim()) {
    parametros.set(
      "buscar",
      buscar.trim()
    );
  }

  const response = await fetch(
    `${BASE_URL}/general/rango?${parametros.toString()}`
  );

  return procesarRespuesta(
    response,
    "Error consultando la agenda general de Relaciones Laborales"
  );
}

export async function obtenerTiposEventoDisciplinario() {
  const response = await fetch(
    `${BASE_URL}/tipos-evento`
  );

  return procesarRespuesta(
    response,
    "Error consultando los tipos de evento disciplinario"
  );
}