import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { toast } from '@/components/ui/use-toast';

import {
  getAvailableRoles,
  getAreasTrabajoSNC,
  getPermissions,
  getUsers,
  resetUserPassword,
  updateUser,
} from '@/utils/userManagement';

import {
  CheckCircle,
  Edit2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Search,
  Users,
  XCircle,
} from 'lucide-react';


const UpdateUserView = () => {
  const [users, setUsers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [areasError, setAreasError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const USERS_PER_PAGE = 20;
  // Ocultamiento de presentación local; no modifica el estado ni los permisos en PostgreSQL.
  const [hiddenIds, setHiddenIds] = useState(() => {
    try {
      const ids = JSON.parse(localStorage.getItem('alp_superadmin_usuarios_ocultos_v1') || '[]');
      return Array.isArray(ids) ? ids.map(String) : [];
    } catch (_) { return []; }
  });
  const [visibilityFilter, setVisibilityFilter] = useState('visible');

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [isEditOpen, setIsEditOpen] =
    useState(false);

  const [isPasswordOpen, setIsPasswordOpen] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const [permissions, setPermissions] =
    useState([]);

  const [isSaving, setIsSaving] =
    useState(false);

  const [isResettingPassword, setIsResettingPassword] =
    useState(false);

  const [newPassword, setNewPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);


  const roles = useMemo(
    () => getAvailableRoles(),
    []
  );


  const loadUsers = async () => {
    setIsLoading(true);

    try {
      const data = await getUsers();

      setUsers(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      setUsers([]);

      toast({
        title: 'Error',
        description:
          error?.message ||
          'No fue posible consultar los usuarios.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };


  const loadPermissions = async () => {
    try {
      const data = await getPermissions();

      setPermissions(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      setPermissions([]);

      toast({
        title: 'Error',
        description:
          error?.message ||
          'No fue posible consultar los permisos disponibles.',
        variant: 'destructive',
      });
    }
  };


  useEffect(() => {
    loadUsers();
    loadPermissions();
    let active = true;
    getAreasTrabajoSNC().then((items) => { if (active) setAreas(items); })
      .catch((error) => { if (active) setAreasError(error.message || 'No fue posible cargar las áreas.'); });
    return () => { active = false; };
  }, []);


  const toggleUserVisibility = (user) => {
    const id = String(user.id);
    const currentlyHidden = hiddenIds.includes(id);
    if (!currentlyHidden && !window.confirm(`¿Ocultar a ${user.username} de esta lista en este navegador?\n\nEl usuario conservará su acceso y sus datos.`)) return;
    const next = currentlyHidden ? hiddenIds.filter(x => x !== id) : [...hiddenIds, id];
    try {
      localStorage.setItem('alp_superadmin_usuarios_ocultos_v1', JSON.stringify(next));
      setHiddenIds(next);
      toast({ title: currentlyHidden ? 'Usuario visible' : 'Usuario oculto', description: 'Preferencia guardada únicamente en este navegador. No se modificó PostgreSQL.' });
    } catch (_) {
      toast({ title: 'No se pudo guardar la preferencia', variant: 'destructive' });
    }
  };

  const areaNameFor = (user) => {
    const area = areas.find(a => String(a.id) === String(user?.areaId ?? ''));
    return area?.name || 'Sin asignar';
  };

  const handleSearch = (e) => {
    setSearchTerm(
      e.target.value
        .toLowerCase()
        .trimStart()
    );
  };


  const filteredUsers = useMemo(() => {
    const term =
      searchTerm
        .trim()
        .toLowerCase();

    return users.filter((user) => {
      const isHidden = hiddenIds.includes(String(user.id));
      if (visibilityFilter === 'visible' && isHidden) return false;
      if (visibilityFilter === 'hidden' && !isHidden) return false;
      if (!term) return true;
      const name =
        String(user?.name || '')
          .toLowerCase();

      const username =
        String(user?.username || '')
          .toLowerCase();

      const email =
        String(user?.email || '')
          .toLowerCase();

      const role =
        String(user?.role || '')
          .toLowerCase();

      const area = areaNameFor(user).toLowerCase();

      const status =
        String(user?.status || '')
          .toLowerCase();

      return (
        name.includes(term) ||
        username.includes(term) ||
        email.includes(term) ||
        role.includes(term) ||
        area.includes(term) ||
        status.includes(term)
      );
    });
  }, [
    users,
    searchTerm,
    hiddenIds,
    visibilityFilter,
    areas,
  ]);


  // Paginar después de aplicar búsqueda y filtro de visibilidad.
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedUsers = useMemo(
    () => filteredUsers.slice((safePage - 1) * USERS_PER_PAGE, safePage * USERS_PER_PAGE),
    [filteredUsers, safePage]
  );

  // Una nueva búsqueda o cambio de visibilidad siempre comienza en la primera página.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, visibilityFilter, hiddenIds]);

  // Si se reduce el total (p. ej. tras editar), conservar una página válida.
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleEditClick = (user) => {
    setSelectedUser({
      ...user,
      name:
        user?.name || '',
      username:
        user?.username || '',
      email:
        user?.email || '',
      role:
        user?.role || '',
      areaId: user?.areaId || '',
      status:
        String(
          user?.status || 'ACTIVO'
        )
          .trim()
          .toUpperCase(),
      permissions:
        Array.isArray(user?.permissions)
          ? [...user.permissions]
          : [],
    });

    setIsEditOpen(true);
  };


  const handleEditDialogChange = (open) => {
    if (isSaving) {
      return;
    }

    setIsEditOpen(open);

    if (!open) {
      setSelectedUser(null);
    }
  };


  const handleEditSave = async () => {
    if (!selectedUser?.id) {
      toast({
        title: 'Error',
        description:
          'No fue posible identificar el usuario.',
        variant: 'destructive',
      });

      return;
    }

    const name =
      String(
        selectedUser.name || ''
      )
        .trim()
        .toUpperCase();

    const username =
      String(
        selectedUser.username || ''
      )
        .trim()
        .toUpperCase();

    const email =
      String(
        selectedUser.email || ''
      )
        .trim()
        .toLowerCase();

    const role =
      String(
        selectedUser.role || ''
      ).trim();

    const status =
      String(
        selectedUser.status || ''
      )
        .trim()
        .toUpperCase();


    if (!name) {
      toast({
        title: 'Campo obligatorio',
        description:
          'Debes ingresar el nombre completo.',
        variant: 'destructive',
      });

      return;
    }


    if (!username) {
      toast({
        title: 'Campo obligatorio',
        description:
          'Debes ingresar el usuario de ingreso.',
        variant: 'destructive',
      });

      return;
    }


    if (!selectedUser.areaId) {
      toast({ title: 'Área obligatoria', description: 'Selecciona el área de trabajo antes de guardar.', variant: 'destructive' });
      return;
    }

    if (!role) {
      toast({
        title: 'Campo obligatorio',
        description:
          'Debes seleccionar un rol.',
        variant: 'destructive',
      });

      return;
    }


    if (
      status !== 'ACTIVO' &&
      status !== 'INACTIVO'
    ) {
      toast({
        title: 'Estado inválido',
        description:
          'Selecciona un estado válido.',
        variant: 'destructive',
      });

      return;
    }


    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      toast({
        title: 'Correo inválido',
        description:
          'Ingresa un correo corporativo válido.',
        variant: 'destructive',
      });

      return;
    }


    setIsSaving(true);

    try {
      await updateUser(
        selectedUser.id,
        {
          ...selectedUser,
          name,
          username,
          email,
          role,
          status,
          permissions:
            Array.isArray(selectedUser.permissions)
              ? selectedUser.permissions
              : [],
        }
      );

      toast({
        title: 'Usuario actualizado',
        description:
          'Los cambios fueron guardados correctamente.',
      });

      setIsEditOpen(false);
      setSelectedUser(null);

      await loadUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error?.message ||
          'No fue posible actualizar el usuario.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };


  const handlePasswordClick = (user) => {
    setSelectedUser(user);

    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);

    setIsPasswordOpen(true);
  };


  const handlePasswordDialogChange = (open) => {
    if (isResettingPassword) {
      return;
    }

    setIsPasswordOpen(open);

    if (!open) {
      setNewPassword('');
      setConfirmPassword('');
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setSelectedUser(null);
    }
  };


  const handlePasswordSave = async () => {
    if (!selectedUser?.id) {
      toast({
        title: 'Error',
        description:
          'No fue posible identificar el usuario.',
        variant: 'destructive',
      });

      return;
    }


    if (!newPassword) {
      toast({
        title: 'Campo obligatorio',
        description:
          'Debes ingresar la nueva contraseña.',
        variant: 'destructive',
      });

      return;
    }


    if (newPassword.length < 8) {
      toast({
        title: 'Contraseña inválida',
        description:
          'La contraseña debe tener mínimo 8 caracteres.',
        variant: 'destructive',
      });

      return;
    }


    if (
      newPassword !==
      confirmPassword
    ) {
      toast({
        title: 'Las contraseñas no coinciden',
        description:
          'Verifica la confirmación de la nueva contraseña.',
        variant: 'destructive',
      });

      return;
    }


    setIsResettingPassword(true);

    try {
      await resetUserPassword(
        selectedUser.id,
        newPassword
      );

      toast({
        title: 'Contraseña actualizada',
        description:
          `La contraseña de ${selectedUser.username} fue restablecida correctamente.`,
      });

      setIsPasswordOpen(false);

      setNewPassword('');
      setConfirmPassword('');
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setSelectedUser(null);
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error?.message ||
          'No fue posible restablecer la contraseña.',
        variant: 'destructive',
      });
    } finally {
      setIsResettingPassword(false);
    }
  };


  return (
    <div className="mx-auto w-full max-w-6xl xl:max-w-[1600px] 2xl:max-w-[1800px] space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">

        <div className="flex items-center gap-4">

          <div className="rounded-xl bg-purple-100 p-3 text-purple-600">
            <Users className="h-8 w-8" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Gestión de Usuarios
            </h2>

            <p className="text-gray-500">
              Consultar y actualizar usuarios registrados
            </p>
          </div>

        </div>


        <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
          <select
            aria-label="Filtrar usuarios por visibilidad"
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
            className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm"
          >
            <option value="visible">Usuarios visibles</option>
            <option value="hidden">Usuarios ocultos ({hiddenIds.length})</option>
            <option value="all">Todos los usuarios</option>
          </select>
        <div className="relative w-full md:w-80">

          <Input
            value={searchTerm}
            placeholder="Buscar usuarios..."
            className="pl-10"
            onChange={handleSearch}
          />

          <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />

        </div>
        </div>

      </div>


      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[980px] table-fixed text-left text-sm">

            <colgroup>
              <col style={{ width: '14%' }} />
              <col style={{ width: '17%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '12%' }} />
            </colgroup>
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-700">

              <tr>
                <th className="px-6 py-3">
                  Usuario
                </th>

                <th className="px-6 py-3">
                  Nombre completo
                </th>

                <th className="px-6 py-3">
                  Correo
                </th>

                <th className="px-6 py-3">
                  Rol
                </th>

                <th className="px-6 py-3">
                  Área de trabajo
                </th>

                <th className="px-6 py-3">
                  Estado
                </th>

                <th className="px-2 py-3 text-center">
                  Acciones
                </th>
              </tr>

            </thead>


            <tbody>

              {isLoading ? (

                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center"
                  >
                    <div className="flex items-center justify-center gap-3 text-gray-500">

                      <Loader2 className="h-5 w-5 animate-spin" />

                      <span>
                        Consultando usuarios...
                      </span>

                    </div>
                  </td>
                </tr>

              ) : filteredUsers.length > 0 ? (

                paginatedUsers.map((user) => {

                  const isActive =
                    String(user.status || '')
                      .trim()
                      .toUpperCase() === 'ACTIVO';

                  return (
                    <tr
                      key={user.id}
                      className="border-b bg-white transition-colors last:border-b-0 hover:bg-gray-50"
                    >

                      <td className="break-words px-3 py-4 font-medium text-gray-900">
                        {user.username || '—'}
                      </td>


                      <td className="break-words px-3 py-4 text-gray-600">
                        {user.name || '—'}
                      </td>


                      <td className="break-words px-3 py-4 text-gray-600">
                        {user.email || '—'}
                      </td>


                      <td className="px-3 py-4">

                        <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                          {user.role || 'Sin rol'}
                        </span>

                      </td>


                      <td className="break-words px-3 py-4 text-gray-600">
                        {areaNameFor(user)}
                      </td>

                      <td className="px-3 py-4">

                        <div
                          className={`flex items-center gap-2 ${
                            isActive
                              ? 'text-emerald-600'
                              : 'text-red-600'
                          }`}
                        >

                          {isActive ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}

                          <span className="text-sm font-medium">
                            {isActive
                              ? 'Activo'
                              : 'Inactivo'}
                          </span>

                        </div>

                      </td>


                      <td className="px-1 py-4">

                        <div className="flex items-center justify-center gap-1 whitespace-nowrap">

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            title="Editar usuario"
                            className="h-8 w-8 shrink-0 p-0 text-gray-500 hover:text-blue-600"
                            onClick={() =>
                              handleEditClick(user)
                            }
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>


                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            title="Restablecer contraseña"
                            className="h-8 w-8 shrink-0 p-0 text-gray-500 hover:text-purple-600"
                            onClick={() =>
                              handlePasswordClick(user)
                            }
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            title={hiddenIds.includes(String(user.id)) ? 'Mostrar usuario' : 'Ocultar usuario (solo este navegador)'}
                            aria-label={hiddenIds.includes(String(user.id)) ? `Mostrar ${user.username}` : `Ocultar ${user.username}`}
                            className="h-8 w-8 shrink-0 p-0 text-gray-500 hover:text-amber-600"
                            onClick={() => toggleUserVisibility(user)}
                          >
                            {hiddenIds.includes(String(user.id)) ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </Button>

                        </div>

                      </td>

                    </tr>
                  );
                })

              ) : (

                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No se encontraron usuarios en esta vista
                  </td>
                </tr>

              )}

            </tbody>

          </table>

        </div>

        {!isLoading && filteredUsers.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 text-sm">
            <span className="text-gray-600">
              Mostrando {(safePage - 1) * USERS_PER_PAGE + 1}–{Math.min(safePage * USERS_PER_PAGE, filteredUsers.length)} de {filteredUsers.length} usuarios
            </span>
            <nav className="flex flex-wrap items-center gap-2" aria-label="Paginación de usuarios">
              <Button type="button" variant="outline" size="sm" disabled={safePage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                Anterior
              </Button>
              <span className="px-2 text-gray-700">Página {safePage} de {totalPages}</span>
              <Button type="button" variant="outline" size="sm" disabled={safePage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                Siguiente
              </Button>
            </nav>
          </div>
        )}

      </div>


      {/* ================================================================
          EDITAR USUARIO
      ================================================================= */}

      <Dialog
        open={isEditOpen}
        onOpenChange={handleEditDialogChange}
      >

        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden bg-white sm:max-w-[560px]">

          <DialogHeader>
            <DialogTitle>
              Editar Usuario
            </DialogTitle>
          </DialogHeader>


          {selectedUser && (

            <div className="grid flex-1 gap-4 overflow-y-auto py-4 pr-2">


              <div className="grid gap-2">

                <Label htmlFor="edit-name">
                  Nombre completo
                </Label>

                <Input
                  id="edit-name"
                  value={selectedUser.name || ''}
                  disabled={isSaving}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      name: e.target.value.toUpperCase(),
                    })
                  }
                />

              </div>


              <div className="grid gap-2">

                <Label htmlFor="edit-username">
                  Usuario de ingreso
                </Label>

                <Input
                  id="edit-username"
                  value={selectedUser.username || ''}
                  disabled={isSaving}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      username: e.target.value
                        .replace(/\s/g, '')
                        .toUpperCase(),
                    })
                  }
                />

                <p className="text-xs text-gray-500">
                  El usuario se guardará automáticamente en MAYÚSCULA. Ejemplo: JUAN.PEREZ
                </p>

              </div>


              <div className="grid gap-2">

                <Label htmlFor="edit-email">
                  Correo corporativo
                </Label>

                <Input
                  id="edit-email"
                  type="email"
                  value={selectedUser.email || ''}
                  disabled={isSaving}
                  placeholder="usuario@empresa.com"
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      email: e.target.value.toLowerCase(),
                    })
                  }
                />

              </div>


              <div className="grid gap-2">

                <Label>
                  Rol
                </Label>

                <Select
                  value={selectedUser.role || ''}
                  disabled={isSaving}
                  onValueChange={(value) =>
                    setSelectedUser({
                      ...selectedUser,
                      role: value,
                    })
                  }
                >

                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>

                  <SelectContent>

                    {roles.map((role) => (
                      <SelectItem
                        key={role}
                        value={role}
                      >
                        {role}
                      </SelectItem>
                    ))}

                  </SelectContent>

                </Select>

              </div>


               <div className="grid gap-2">
                 <Label>Área de trabajo *</Label>
                 <Select value={selectedUser.areaId || ''} disabled={isSaving || !!areasError} onValueChange={(value) => setSelectedUser({ ...selectedUser, areaId: value })}>
                   <SelectTrigger><SelectValue placeholder="Seleccionar área de trabajo" /></SelectTrigger>
                   <SelectContent
                     position="popper"
                     side="bottom"
                     sideOffset={4}
                     className="max-h-[280px] overflow-y-auto overscroll-contain"
                   >
                     {areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                   </SelectContent>
                 </Select>
                 {areasError && <p className="text-sm text-red-600">{areasError}</p>}
                 {!selectedUser.areaId && <p className="text-xs text-amber-700">Este usuario aún no tiene área asignada.</p>}
               </div>

              <div className="grid gap-2">

                <Label>
                  Estado
                </Label>

                <Select
                  value={
                    String(
                      selectedUser.status ||
                      'ACTIVO'
                    )
                      .trim()
                      .toUpperCase()
                  }
                  disabled={isSaving}
                  onValueChange={(value) =>
                    setSelectedUser({
                      ...selectedUser,
                      status: value,
                    })
                  }
                >

                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>

                    <SelectItem value="ACTIVO">
                      Activo
                    </SelectItem>

                    <SelectItem value="INACTIVO">
                      Inactivo
                    </SelectItem>

                  </SelectContent>

                </Select>

              </div>


              <div className="grid gap-3">

                <div>
                  <Label>
                    Permisos adicionales
                  </Label>

                  <p className="mt-1 text-xs text-gray-500">
                    Estos permisos amplían el acceso sin cambiar el rol principal del usuario.
                  </p>
                </div>

                {permissions.length > 0 ? (

                  <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">

                    {permissions.map((permission) => {

                      const isChecked =
                        Array.isArray(selectedUser.permissions) &&
                        selectedUser.permissions.includes(
                          permission.code
                        );

                      return (
                        <label
                          key={permission.id || permission.code}
                          className="flex cursor-pointer items-start gap-3 rounded-md bg-white p-3 transition-colors hover:bg-gray-50"
                        >

                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border-gray-300"
                            checked={isChecked}
                            disabled={isSaving}
                            onChange={(e) => {

                              const currentPermissions =
                                Array.isArray(selectedUser.permissions)
                                  ? selectedUser.permissions
                                  : [];

                              const nextPermissions =
                                e.target.checked
                                  ? [
                                      ...new Set([
                                        ...currentPermissions,
                                        permission.code,
                                      ]),
                                    ]
                                  : currentPermissions.filter(
                                      (code) =>
                                        code !== permission.code
                                    );

                              setSelectedUser({
                                ...selectedUser,
                                permissions: nextPermissions,
                              });
                            }}
                          />

                          <div className="min-w-0">

                            <p className="text-sm font-medium text-gray-800">
                              {permission.name || permission.code}
                            </p>

                            {permission.description && (
                              <p className="mt-1 text-xs leading-5 text-gray-500">
                                {permission.description}
                              </p>
                            )}

                          </div>

                        </label>
                      );
                    })}

                  </div>

                ) : (

                  <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-xs text-gray-500">
                    No hay permisos adicionales disponibles.
                  </div>

                )}

              </div>

            </div>
          )}


          <DialogFooter className="shrink-0 gap-2 border-t border-gray-200 bg-white pt-4 sm:gap-0">

            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() =>
                handleEditDialogChange(false)
              }
            >
              Cancelar
            </Button>


            <Button
              type="button"
              disabled={isSaving || !!areasError || areas.length === 0}
              onClick={handleEditSave}
              className="bg-purple-600 hover:bg-purple-700"
            >

              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>


      {/* ================================================================
          RESTABLECER CONTRASEÑA
      ================================================================= */}

      <Dialog
        open={isPasswordOpen}
        onOpenChange={handlePasswordDialogChange}
      >

        <DialogContent className="bg-white sm:max-w-[500px]">

          <DialogHeader>

            <DialogTitle>
              Restablecer contraseña
            </DialogTitle>

          </DialogHeader>


          {selectedUser && (

              <div className="grid gap-4 py-4">

              <div className="rounded-lg border border-purple-100 bg-purple-50 p-3">

                <p className="text-sm font-medium text-gray-800">
                  {selectedUser.name}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Usuario: {selectedUser.username}
                </p>

              </div>


              <div className="grid gap-2">

                <Label htmlFor="admin-credential-value">
                  Nueva contraseña
                </Label>

                <div className="relative">

                  <Input
                    id="admin-credential-value"
                    type="text"
                    autoComplete="one-time-code"
                    name="admin-credential-value"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-form-type="other"
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="none"
                    value={newPassword}
                    disabled={isResettingPassword}
                    className="pr-10 no-uppercase"
                    style={{
                      WebkitTextSecurity:
                        showNewPassword
                          ? 'none'
                          : 'disc',
                    }}
                    onChange={(e) =>
                      setNewPassword(
                        e.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    disabled={isResettingPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={
                      showNewPassword
                        ? 'Ocultar nueva contraseña'
                        : 'Mostrar nueva contraseña'
                    }
                    title={
                      showNewPassword
                        ? 'Ocultar contraseña'
                        : 'Mostrar contraseña'
                    }
                    onClick={() =>
                      setShowNewPassword(
                        (current) => !current
                      )
                    }
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>

                </div>

                <p className="text-xs text-gray-500">
                  Mínimo 8 caracteres. La contraseña distingue mayúsculas y minúsculas.
                  Escríbela exactamente como será utilizada.
                </p>

              </div>


              <div className="grid gap-2">

                <Label htmlFor="admin-credential-confirmation">
                  Confirmar contraseña
                </Label>

                <div className="relative">

                  <Input
                    id="admin-credential-confirmation"
                    type="text"
                    autoComplete="one-time-code"
                    name="admin-credential-confirmation"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-form-type="other"
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="none"
                    value={confirmPassword}
                    disabled={isResettingPassword}
                    className="pr-10 no-uppercase"
                    style={{
                      WebkitTextSecurity:
                        showConfirmPassword
                          ? 'none'
                          : 'disc',
                    }}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    disabled={isResettingPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={
                      showConfirmPassword
                        ? 'Ocultar confirmación de contraseña'
                        : 'Mostrar confirmación de contraseña'
                    }
                    title={
                      showConfirmPassword
                        ? 'Ocultar contraseña'
                        : 'Mostrar contraseña'
                    }
                    onClick={() =>
                      setShowConfirmPassword(
                        (current) => !current
                      )
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>

                </div>

                <p className="text-xs text-gray-500">
                  Confirma la contraseña respetando exactamente mayúsculas y minúsculas.
                </p>

              </div>

            </div>
          )}


          <DialogFooter className="gap-2 sm:gap-0">

            <Button
              type="button"
              variant="outline"
              disabled={isResettingPassword}
              onClick={() =>
                handlePasswordDialogChange(false)
              }
            >
              Cancelar
            </Button>


            <Button
              type="button"
              disabled={isResettingPassword}
              onClick={handlePasswordSave}
              className="bg-purple-600 hover:bg-purple-700"
            >

              {isResettingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restableciendo...
                </>
              ) : (
                'Restablecer contraseña'
              )}

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

    </div>
  );
};


export default UpdateUserView;