const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const BASE_URL = `${API_URL}/procesos-disciplinarios`;

const obtenerTokenAutenticacion = () => {
  const almacenamientos = [
    window.localStorage,
    window.sessionStorage,
  ];

  const clavesDirectas = [
    "token",
    "access_token",
    "accessToken",
    "authToken",
    "jwt",
    "jwtToken",
  ];

  for (const almacenamiento of almacenamientos) {
    for (const clave of clavesDirectas) {
      const valor = almacenamiento.getItem(clave);

      if (
        valor &&
        valor !== "null" &&
        valor !== "undefined"
      ) {
        return valor.replace(/^"|"$/g, "");
      }
    }
  }

  const clavesObjetos = [
    "auth",
    "authData",
    "user",
    "session",
    "userData",
  ];

  for (const almacenamiento of almacenamientos) {
    for (const clave of clavesObjetos) {
      const valor = almacenamiento.getItem(clave);

      if (!valor) {
        continue;
      }

      try {
        const objeto = JSON.parse(valor);

        const token =
          objeto?.token ||
          objeto?.access_token ||
          objeto?.accessToken ||
          objeto?.authToken ||
          objeto?.jwt ||
          objeto?.jwtToken ||
          objeto?.user?.token ||
          objeto?.user?.access_token;

        if (token) {
          return String(token);
        }
      } catch {
        // La clave no contiene un objeto JSON válido.
      }
    }
  }

  return null;
};

const construirHeaders = (
  incluirContenido = false
) => {
  const token =
    obtenerTokenAutenticacion();

  const headers = {
    Accept: "application/json",
  };

  if (incluirContenido) {
    headers["Content-Type"] =
      "application/json";
  }

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  return headers;
};

export async function crearProcesoDisciplinario(data) {
  const response = await fetch(
    `${BASE_URL}/`,
    {
      method: "POST",
      headers: construirHeaders(true),
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(
      "No se pudo crear el proceso disciplinario"
    );
  }

  return response.json();
}

export async function obtenerProcesoDisciplinario(
  idProceso
) {
  const response = await fetch(
    `${BASE_URL}/${idProceso}`,
    {
      method: "GET",
      headers: construirHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      "No se pudo obtener el proceso disciplinario"
    );
  }

  return response.json();
}

export async function listarProcesosPorTrabajador(
  idRegistroPersonal
) {
  const response = await fetch(
    `${BASE_URL}/trabajador/${idRegistroPersonal}`,
    {
      method: "GET",
      headers: construirHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      "No se pudieron listar los procesos del trabajador"
    );
  }

  return response.json();
}

export async function obtenerHistorialDisciplinarioTrabajador(
  idRegistroPersonal
) {
  const response = await fetch(
    `${BASE_URL}/trabajador/${idRegistroPersonal}/historial`,
    {
      method: "GET",
      headers: construirHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      "No se pudo obtener el historial disciplinario del trabajador"
    );
  }

  return response.json();
}

export async function obtenerExpedienteDisciplinario(
  idProceso
) {
  const response = await fetch(
    `${BASE_URL}/${idProceso}/expediente`,
    {
      method: "GET",
      headers: construirHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      "No se pudo obtener el expediente disciplinario"
    );
  }

  return response.json();
}

export async function actualizarProcesoDisciplinario(
  idProceso,
  data
) {
  const response = await fetch(
    `${BASE_URL}/${idProceso}`,
    {
      method: "PUT",
      headers: construirHeaders(true),
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(
      "No se pudo actualizar el proceso disciplinario"
    );
  }

  return response.json();
}