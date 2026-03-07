
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { getUsers, updateUser } from '@/utils/userManagement';
import { Users, Edit2, CheckCircle, XCircle, Search } from 'lucide-react';

const UpdateUserView = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const loadUsers = () => {
    setUsers(getUsers());
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm) || 
    user.username.toLowerCase().includes(searchTerm) ||
    user.role.toLowerCase().includes(searchTerm)
  );

  const handleEditClick = (user) => {
    setSelectedUser({ ...user });
    setIsEditOpen(true);
  };

  const handleEditSave = () => {
    try {
      updateUser(selectedUser.username, selectedUser);
      toast({ title: "✅ Usuario actualizado", description: "Los cambios han sido guardados exitosamente." });
      setIsEditOpen(false);
      loadUsers();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo actualizar el usuario.", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="bg-purple-100 p-3 rounded-xl text-purple-600">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h2>
            <p className="text-gray-500">Consultar y actualizar información</p>
          </div>
        </div>
        <div className="relative w-full md:w-72">
          <Input 
            placeholder="Buscar usuarios..." 
            className="pl-10"
            onChange={handleSearch}
          />
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                <tr>
                <th className="px-6 py-3">Usuario</th>
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Rol</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                    <tr key={user.username} className="bg-white border-b hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{user.username}</td>
                    <td className="px-6 py-4 text-gray-600">{user.name}</td>
                    <td className="px-6 py-4">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium border border-blue-100">
                        {user.role}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                        <div className={`flex items-center gap-2 ${user.status === 'Activo' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {user.status === 'Activo' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        <span className="text-sm font-medium">{user.status}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(user)} className="text-gray-500 hover:text-blue-600">
                        <Edit2 className="w-4 h-4" />
                        </Button>
                    </td>
                    </tr>
                ))
                ) : (
                <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No se encontraron usuarios registrados
                    </td>
                </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nombre</Label>
                <Input 
                  id="edit-name" 
                  value={selectedUser.name} 
                  onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-pass">Contraseña</Label>
                <Input 
                  id="edit-pass" 
                  type="text"
                  value={selectedUser.pass} 
                  onChange={(e) => setSelectedUser({ ...selectedUser, pass: e.target.value })} 
                />
              </div>
              <div className="grid gap-2">
                <Label>Rol</Label>
                <Select value={selectedUser.role} onValueChange={(v) => setSelectedUser({ ...selectedUser, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aspirante">Aspirante</SelectItem>
                    <SelectItem value="Selección">Selección</SelectItem>
                    <SelectItem value="Contratación">Contratación</SelectItem>
                    <SelectItem value="Administrador">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Estado</Label>
                <Select value={selectedUser.status} onValueChange={(v) => setSelectedUser({ ...selectedUser, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditSave} className="bg-purple-600 hover:bg-purple-700">Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UpdateUserView;
