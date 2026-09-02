const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || '';

const CREATE_USER_URL =
  `${API_BASE_URL}/auth/registro-usuario`;

const USERS_URL =
  `${API_BASE_URL}/auth/usuarios`;

const PERMISSIONS_URL =
  `${API_BASE_URL}/auth/permisos`;


const ROLE_IDS = {
  Administrador: 1,
  Selección: 2,
  Contratación: 3,
  Aspirante: 4,
  'Super Administrador': 5,
  Operaciones: 6,
  Contabilidad: 7,
  Compras: 8,
  Mantenimiento: 9,
  HSE: 10,
  'Relaciones Laborales': 12,
  'Talento Humano': 13,
  Desarrollador: 15,
  Bienestar: 16,
  Nómina: 17,
};


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const getToken = () => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error(
      'La sesión ha expirado. Inicia sesión nuevamente.'
    );
  }

  return token;
};


const parseResponse = async (response) => {
  try {
    return await response.json();
  } catch (_) {
    return null;
  }
};


const handleApiError = (
  response,
  data,
  defaultMessage
) => {
  if (response.status === 401) {
    throw new Error(
      'La sesión no es válida o ha expirado. Inicia sesión nuevamente.'
    );
  }

  if (response.status === 403) {
    throw new Error(
      data?.detail ||
        'No tienes permisos para realizar esta acción.'
    );
  }

  if (response.status === 404) {
    throw new Error(
      data?.detail ||
        'El usuario solicitado no existe.'
    );
  }

  throw new Error(
    data?.detail ||
      defaultMessage
  );
};


/*
|--------------------------------------------------------------------------
| CREAR USUARIO REAL
|--------------------------------------------------------------------------
| Conserva el funcionamiento que ya está probado.
| Envía el registro al backend y PostgreSQL.
|--------------------------------------------------------------------------
*/

export const createUser = async (userData) => {
  const token = getToken();

  const idRol = ROLE_IDS[userData.role];

  if (!idRol) {
    throw new Error(
      'El rol seleccionado no es válido.'
    );
  }

  const payload = {
    nombre_completo:
      (userData.name || '').trim(),

    usuario:
      (userData.username || '').trim(),

    correo_corporativo:
      (userData.email || '')
        .trim()
        .toLowerCase() || null,

    contrasena:
      userData.pass,

    estado:
      (userData.status || 'ACTIVO')
        .trim()
        .toUpperCase(),

    id_rol:
      idRol,
  };

  const response = await fetch(
    CREATE_USER_URL,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(payload),
    }
  );

  const data = await parseResponse(response);

  if (!response.ok) {
    handleApiError(
      response,
      data,
      'No fue posible crear el usuario.'
    );
  }

  return data;
};


/*
|--------------------------------------------------------------------------
| CONSULTAR USUARIOS REALES
|--------------------------------------------------------------------------
| Consulta los usuarios directamente desde PostgreSQL a través del backend.
| Ya no utiliza app_users ni usuarios ficticios en localStorage.
|--------------------------------------------------------------------------
*/

export const getUsers = async () => {
  const token = getToken();

  const response = await fetch(
    USERS_URL,
    {
      method: 'GET',

      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await parseResponse(response);

  if (!response.ok) {
    handleApiError(
      response,
      data,
      'No fue posible consultar los usuarios.'
    );
  }

  if (!Array.isArray(data)) {
    return [];
  }

  /*
  |--------------------------------------------------------------------------
  | Normalización para el frontend
  |--------------------------------------------------------------------------
  | El backend devuelve:
  |
  | id_usuario
  | nombre_completo
  | usuario
  | correo_corporativo
  | estado
  | id_rol
  | nombre_rol
  | permisos
  |
  | Aquí se transforma al formato que utilizará UpdateUserView.
  |--------------------------------------------------------------------------
  */

  return data.map((user) => ({
    id: user.id_usuario,

    username:
      user.usuario || '',

    name:
      user.nombre_completo || '',

    email:
      user.correo_corporativo || '',

    role:
      user.nombre_rol || '',

    roleId:
      user.id_rol ?? null,

    status:
      (user.estado || '')
        .trim()
        .toUpperCase(),

    permissions:
      Array.isArray(user.permisos)
        ? user.permisos
        : [],
  }));
};


/*
|--------------------------------------------------------------------------
| CONSULTAR CATÁLOGO DE PERMISOS
|--------------------------------------------------------------------------
| Consulta los permisos activos administrables desde Superadmin.
|--------------------------------------------------------------------------
*/

export const getPermissions = async () => {
  const token = getToken();

  const response = await fetch(
    PERMISSIONS_URL,
    {
      method: 'GET',

      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await parseResponse(response);

  if (!response.ok) {
    handleApiError(
      response,
      data,
      'No fue posible consultar los permisos.'
    );
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((permission) => ({
    id:
      permission.id_permiso,

    code:
      permission.codigo || '',

    name:
      permission.nombre || '',

    description:
      permission.descripcion || '',
  }));
};


/*
|--------------------------------------------------------------------------
| ACTUALIZAR USUARIO REAL
|--------------------------------------------------------------------------
| Actualiza:
|
| - Nombre completo
| - Usuario de ingreso
| - Correo corporativo
| - Estado
| - Rol
| - Permisos adicionales
|--------------------------------------------------------------------------
*/

export const updateUser = async (
  idUsuario,
  updates
) => {
  const token = getToken();

  if (!idUsuario) {
    throw new Error(
      'No fue posible identificar el usuario a actualizar.'
    );
  }

  const idRol = ROLE_IDS[updates.role];

  if (!idRol) {
    throw new Error(
      'El rol seleccionado no es válido.'
    );
  }

  const nombreCompleto =
    (updates.name || '').trim();

  const username =
    (updates.username || '').trim();

  const email =
    (updates.email || '')
      .trim()
      .toLowerCase();

  const estado =
    (updates.status || '')
      .trim()
      .toUpperCase();

  const permisos =
    Array.isArray(updates.permissions)
      ? updates.permissions
          .map((permission) =>
            String(permission || '').trim()
          )
          .filter(Boolean)
      : [];

  if (!nombreCompleto) {
    throw new Error(
      'El nombre completo es obligatorio.'
    );
  }

  if (!username) {
    throw new Error(
      'El usuario de ingreso es obligatorio.'
    );
  }

  if (
    estado !== 'ACTIVO' &&
    estado !== 'INACTIVO'
  ) {
    throw new Error(
      'El estado seleccionado no es válido.'
    );
  }

  const payload = {
    nombre_completo:
      nombreCompleto,

    usuario:
      username,

    correo_corporativo:
      email || null,

    estado,

    id_rol:
      idRol,

    permisos,
  };

  const response = await fetch(
    `${API_BASE_URL}/auth/usuario/${idUsuario}`,
    {
      method: 'PUT',

      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(payload),
    }
  );

  const data = await parseResponse(response);

  if (!response.ok) {
    handleApiError(
      response,
      data,
      'No fue posible actualizar el usuario.'
    );
  }

  return data;
};


/*
|--------------------------------------------------------------------------
| RESTABLECER CONTRASEÑA
|--------------------------------------------------------------------------
| No consulta ni muestra la contraseña actual.
| Únicamente permite establecer una nueva contraseña.
|--------------------------------------------------------------------------
*/

export const resetUserPassword = async (
  idUsuario,
  newPassword
) => {
  const token = getToken();

  if (!idUsuario) {
    throw new Error(
      'No fue posible identificar el usuario.'
    );
  }

  const password =
    String(newPassword || '');

  if (!password) {
    throw new Error(
      'La nueva contraseña es obligatoria.'
    );
  }

  if (password.length < 8) {
    throw new Error(
      'La contraseña debe tener mínimo 8 caracteres.'
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/auth/usuario/${idUsuario}/password`,
    {
      method: 'PUT',

      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        nueva_contrasena: password,
      }),
    }
  );

  const data = await parseResponse(response);

  if (!response.ok) {
    handleApiError(
      response,
      data,
      'No fue posible restablecer la contraseña.'
    );
  }

  return data;
};


/*
|--------------------------------------------------------------------------
| UTILIDADES DE ROLES
|--------------------------------------------------------------------------
*/

export const getRoleId = (roleName) => {
  return ROLE_IDS[roleName] || null;
};


export const getAvailableRoles = () => {
  return Object.keys(ROLE_IDS);
};
