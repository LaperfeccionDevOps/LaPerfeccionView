
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { createUser } from '@/utils/userManagement';
import { UserPlus, Save, Shield, Key, Activity } from 'lucide-react';

const CreateUserForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    pass: '',
    name: '',
    role: '',
    status: 'Activo'
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.pass || !formData.role || !formData.name) {
      toast({ title: 'Error', description: 'Por favor completa todos los campos requeridos.', variant: 'destructive' });
      return;
    }

    try {
      createUser(formData);
      toast({ title: '✅ Usuario creado', description: `El usuario ${formData.username} ha sido registrado correctamente.` });
      setFormData({ username: '', pass: '', name: '', role: '', status: 'Activo' });
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
        <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
          <UserPlus className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Crear Nuevo Usuario</h2>
          <p className="text-gray-500">Registrar un nuevo acceso al sistema</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo</Label>
            <Input 
              id="name" 
              placeholder="Ej. Juan Pérez" 
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="username">Nombre de Usuario</Label>
            <Input 
              id="username" 
              placeholder="Ej. jperez" 
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pass">Contraseña</Label>
            <div className="relative">
                <Input 
                  id="pass" 
                  type="password"
                  placeholder="••••••••" 
                  value={formData.pass}
                  onChange={(e) => handleChange('pass', e.target.value)}
                  className="pl-10"
                />
                <Key className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
              <SelectTrigger className="pl-10 relative">
                <Activity className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                <SelectValue placeholder="Seleccione estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Rol del Sistema</Label>
            <Select value={formData.role} onValueChange={(v) => handleChange('role', v)}>
              <SelectTrigger className="pl-10 relative">
                <Shield className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                <SelectValue placeholder="Seleccione un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Aspirante">Aspirante</SelectItem>
                <SelectItem value="Selección">Selección</SelectItem>
                <SelectItem value="Contratación">Contratación</SelectItem>
                <SelectItem value="Administrador">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-6">
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base">
            <Save className="w-5 h-5 mr-2" /> Guardar Usuario
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateUserForm;
