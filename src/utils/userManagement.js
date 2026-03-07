
const DEFAULT_USERS = [
  { username: 'admin', pass: 'admin123', role: 'Administrador', name: 'Administrador Principal', status: 'Activo' },
  { username: 'aspirante', pass: 'asp123', role: 'Aspirante', name: 'Candidato Registrado', status: 'Activo' },
  { username: 'seleccion', pass: 'sel123', role: 'Selección', name: 'Analista de Selección', status: 'Activo' },
  { username: 'contratacion', pass: 'con123', role: 'Contratación', name: 'Analista de Contratación', status: 'Activo' }
];

export const initializeUsers = () => {
  const users = localStorage.getItem('app_users');
  if (!users) {
    localStorage.setItem('app_users', JSON.stringify(DEFAULT_USERS));
  }
};

export const getUsers = () => {
  initializeUsers();
  return JSON.parse(localStorage.getItem('app_users'));
};

export const createUser = (userData) => {
  const users = getUsers();
  if (users.find(u => u.username === userData.username)) {
    throw new Error('El nombre de usuario ya existe');
  }
  users.push({ ...userData, status: userData.status || 'Activo' });
  localStorage.setItem('app_users', JSON.stringify(users));
  return userData;
};

export const updateUser = (username, updates) => {
  let users = getUsers();
  const index = users.findIndex(u => u.username === username);
  if (index === -1) throw new Error('Usuario no encontrado');
  
  users[index] = { ...users[index], ...updates };
  localStorage.setItem('app_users', JSON.stringify(users));
  return users[index];
};

export const deleteUser = (username) => {
  let users = getUsers();
  users = users.filter(u => u.username !== username);
  localStorage.setItem('app_users', JSON.stringify(users));
};

export const authenticateUser = (username, password) => {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.pass === password);
  
  if (!user) return { success: false, message: 'Usuario o contraseña incorrectos.' };
  if (user.status !== 'Activo') return { success: false, message: 'El usuario se encuentra inactivo.' };
  
  return { success: true, user };
};
