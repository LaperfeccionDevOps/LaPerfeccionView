import { API_BASE_URL } from "../configFiles/api";

const BASE_URL = `${API_BASE_URL}/agenda-disciplinaria`;

export async function obtenerAgendaHoy() {
  const response = await fetch(`${BASE_URL}/hoy/listado`);

  if (!response.ok) {
    throw new Error("Error consultando la agenda de hoy");
  }

  return response.json();
}

export async function obtenerAgendaPorFecha(fecha) {
  const response = await fetch(`${BASE_URL}/fecha/${fecha}`);

  if (!response.ok) {
    throw new Error("Error consultando la agenda por fecha");
  }

  return response.json();
}

export async function obtenerTiposEventoDisciplinario() {
  const response = await fetch(`${BASE_URL}/tipos-evento`);

  if (!response.ok) {
    throw new Error("Error consultando los tipos de evento disciplinario");
  }

  return response.json();
}