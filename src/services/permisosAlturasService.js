import { getApiUrl } from "../configFiles/api";

const construirHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const procesarRespuesta = async (response) => {
  if (response.status === 401) {
    throw new Error(
      "La sesión no está autorizada o venció. Cierra sesión e ingresa nuevamente."
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detalle =
      typeof data?.detail === "string"
        ? data.detail
        : `Código HTTP: ${response.status}.`;

    throw new Error(detalle);
  }

  return data;
};

export const obtenerClientesAlturas = async () => {
  const response = await fetch(
    getApiUrl("/operaciones/alturas/clientes"),
    { headers: construirHeaders() }
  );

  return procesarRespuesta(response);
};

export const obtenerPermisosAlturas = async () => {
  const response = await fetch(
    getApiUrl("/operaciones/alturas/permisos"),
    { headers: construirHeaders() }
  );

  return procesarRespuesta(response);
};

export const crearPermisoAlturas = async ({
  idCliente,
  horaInicioTarea,
  horaFinTarea,
}) => {
  const response = await fetch(
    getApiUrl("/operaciones/alturas/permisos"),
    {
      method: "POST",
      headers: construirHeaders(),
      body: JSON.stringify({
        id_cliente: Number(idCliente),
        hora_inicio_tarea: horaInicioTarea,
        hora_fin_tarea: horaFinTarea,
      }),
    }
  );

  return procesarRespuesta(response);
};
