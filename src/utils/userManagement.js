const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const CREATE_USER_URL = `${API_BASE_URL}/auth/registro-usuario`;

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
| CREAR USUARIO REAL
|--------------------------------------------------------------------------
| Esta función ya no crea usuarios en localStorage.
| Envía el registro al backend y PostgreSQL.
|--------------------------------------------------------------------------
*/

export const createUser = async (userData) => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error(
      'La sesión ha expirado. Inicia sesión nuevamente.'
    );
  }

  const idRol = ROLE_IDS[userData.role];

  if (!idRol) {
    throw new Error(
      'El rol seleccionado no es válido.'
    );
  }

  const payload = {
    nombre_completo: (userData.name || '').trim(),
    usuario: (userData.username || '').trim(),
    correo_corporativo:
      (userData.email || '').trim().toLowerCase() || null,
    contrasena: userData.pass,
    estado: (userData.status || 'ACTIVO')
      .trim()
      .toUpperCase(),
    id_rol: idRol,
  };

  const response = await fetch(CREATE_USER_URL, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },

    body: JSON.stringify(payload),
  });

  let data = null;

  try {
    data = await response.json();
  } catch (_) {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        'La sesión no es válida o ha expirado. Inicia sesión nuevamente.'
      );
    }

    if (response.status === 403) {
      throw new Error(
        data?.detail ||
          'No tienes permisos para crear usuarios.'
      );
    }

    throw new Error(
      data?.detail ||
        'No fue posible crear el usuario.'
    );
  }

  return data;
};


/*
|--------------------------------------------------------------------------
| FUNCIONES LEGACY
|--------------------------------------------------------------------------
| Se conservan temporalmente para no afectar la pantalla existente
| "Actualizar Usuario".
|
| Estas funciones serán migradas posteriormente para trabajar también
| contra la API y PostgreSQL.
|--------------------------------------------------------------------------
*/

const DEFAULT_USERS = [
  {
    username: 'admin',
    pass: 'admin123',
    role: 'Administrador',
    name: 'Administrador Principal',
    status: 'Activo',
  },

  {
    username: 'aspirante',
    pass: 'asp123',
    role: 'Aspirante',
    name: 'Candidato Registrado',
    status: 'Activo',
  },

  {
    username: 'seleccion',
    pass: 'sel123',
    role: 'Selección',
    name: 'Analista de Selección',
    status: 'Activo',
  },

  {
    username: 'contratacion',
    pass: 'con123',
    role: 'Contratación',
    name: 'Analista de Contratación',
    status: 'Activo',
  },
];


export const initializeUsers = () => {
  const users = localStorage.getItem('app_users');

  if (!users) {
    localStorage.setItem(
      'app_users',
      JSON.stringify(DEFAULT_USERS)
    );
  }
};


export const getUsers = () => {
  initializeUsers();

  return JSON.parse(
    localStorage.getItem('app_users') || '[]'
  );
};


export const updateUser = (username, updates) => {
  const users = getUsers();

  const index = users.findIndex(
    (u) => u.username === username
  );

  if (index === -1) {
    throw new Error('Usuario no encontrado');
  }

  users[index] = {
    ...users[index],
    ...updates,
  };

  localStorage.setItem(
    'app_users',
    JSON.stringify(users)
  );

  return users[index];
};


export const deleteUser = (username) => {
  let users = getUsers();

  users = users.filter(
    (u) => u.username !== username
  );

  localStorage.setItem(
    'app_users',
    JSON.stringify(users)
  );
};


export const authenticateUser = (
  username,
  password
) => {
  const users = getUsers();

  const user = users.find(
    (u) =>
      u.username === username &&
      u.pass === password
  );

  if (!user) {
    return {
      success: false,
      message:
        'Usuario o contraseña incorrectos.',
    };
  }

  if (
    String(user.status || '')
      .trim()
      .toUpperCase() !== 'ACTIVO'
  ) {
    return {
      success: false,
      message:
        'El usuario se encuentra inactivo.',
    };
  }

  return {
    success: true,
    user,
  };
};