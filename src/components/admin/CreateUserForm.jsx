import React, { useState } from 'react';

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

import { toast } from '@/components/ui/use-toast';

import { createUser } from '@/utils/userManagement';

import {
  UserPlus,
  Save,
  Shield,
  Key,
  Activity,
  User,
  Eye,
  EyeOff,
} from 'lucide-react';

const INITIAL_FORM = {
  name: '',
  username: '',
  pass: '',
  confirmPass: '',
  role: '',
  status: 'ACTIVO',
};

const CreateUserForm = () => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordsDoNotMatch =
    formData.confirmPass.length > 0 && formData.pass !== formData.confirmPass;

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (
      !formData.name.trim() ||
      !formData.username.trim() ||
      !formData.pass ||
      !formData.confirmPass ||
      !formData.role
    ) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor completa todos los campos obligatorios.',
        variant: 'destructive',
      });

      return false;
    }

    if (formData.pass.length < 8) {
      toast({
        title: 'Contraseña no válida',
        description: 'La contraseña debe tener mínimo 8 caracteres.',
        variant: 'destructive',
      });

      return false;
    }

    if (formData.pass !== formData.confirmPass) {
      toast({
        title: 'Las contraseñas no coinciden',
        description: 'La contraseña y su confirmación deben ser exactamente iguales.',
        variant: 'destructive',
      });

      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: formData.name.trim(),
        username: formData.username.trim(),
        email: '',
        pass: formData.pass,
        role: formData.role,
        status: formData.status,
      };

      await createUser(payload);

      toast({
        title: 'Usuario creado',
        description: `El usuario ${payload.username} fue registrado correctamente.`,
      });

      setFormData(INITIAL_FORM);
      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        'No fue posible crear el usuario.';

      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
        <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
          <UserPlus className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Crear Nuevo Usuario
          </h2>

          <p className="text-gray-500">
            Registrar un nuevo acceso al sistema
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nombre Completo <span className="text-red-500">*</span>
            </Label>

            <div className="relative">
              <Input
                id="name"
                type="text"
                placeholder="Ej. Alejandra Guiza Parra"
                value={formData.name}
                onChange={(e) =>
                  handleChange('name', e.target.value.toUpperCase())
                }
                className="pl-10"
                autoComplete="off"
              />

              <User className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">
              Nombre de Usuario <span className="text-red-500">*</span>
            </Label>

            <div className="relative">
              <Input
                id="username"
                type="text"
                placeholder="Ej. alejandra.guiza"
                value={formData.username}
                onChange={(e) =>
                  handleChange(
                    'username',
                    e.target.value.replace(/\s/g, '').toUpperCase()
                  )
                }
                className="pl-10"
                autoComplete="off"
              />

              <User className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
            </div>

            <p className="text-xs text-gray-500">
              El usuario se guardará automáticamente en MAYÚSCULA. Ejemplo: JUAN.PEREZ
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pass">
              Contraseña <span className="text-red-500">*</span>
            </Label>

            <div className="relative">
              <Input
                id="pass"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={formData.pass}
                onChange={(e) => handleChange('pass', e.target.value)}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                onDrop={(e) => e.preventDefault()}
                className="pl-10 pr-10 no-uppercase"
                autoComplete="new-password"
              />

              <Key className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={
                  showPassword
                    ? 'Ocultar contraseña'
                    : 'Mostrar contraseña'
                }
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500">
              La contraseña distingue mayúsculas y minúsculas. Escríbela exactamente como será utilizada.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPass">
              Confirmar Contraseña <span className="text-red-500">*</span>
            </Label>

            <div className="relative">
              <Input
                id="confirmPass"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repita la contraseña"
                value={formData.confirmPass}
                onChange={(e) => handleChange('confirmPass', e.target.value)}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                onDrop={(e) => e.preventDefault()}
                className={`pl-10 pr-10 no-uppercase ${
                  passwordsDoNotMatch
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : ''
                }`}
                aria-invalid={passwordsDoNotMatch}
                autoComplete="new-password"
              />

              <Key className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={
                  showConfirmPassword
                    ? 'Ocultar confirmación de contraseña'
                    : 'Mostrar confirmación de contraseña'
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {passwordsDoNotMatch ? (
              <p className="text-xs font-medium text-red-600" role="alert">
                Las contraseñas no coinciden. Verifique e inténtelo nuevamente.
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Debe coincidir exactamente con la contraseña escrita arriba.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Estado <span className="text-red-500">*</span>
            </Label>

            <Select
              value={formData.status}
              onValueChange={(value) =>
                handleChange('status', value)
              }
            >
              <SelectTrigger className="pl-10 relative">
                <Activity className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />

                <SelectValue placeholder="Seleccione estado" />
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

          <div className="space-y-2 md:col-span-2">
            <Label>
              Rol del Sistema <span className="text-red-500">*</span>
            </Label>

            <Select
              value={formData.role}
              onValueChange={(value) =>
                handleChange('role', value)
              }
            >
              <SelectTrigger className="pl-10 relative">
                <Shield className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />

                <SelectValue placeholder="Seleccione un rol" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="Administrador">
                  Administrador
                </SelectItem>

                <SelectItem value="Selección">
                  Selección
                </SelectItem>

                <SelectItem value="Contratación">
                  Contratación
                </SelectItem>

                <SelectItem value="Aspirante">
                  Aspirante
                </SelectItem>

                <SelectItem value="Super Administrador">
                  Super Administrador
                </SelectItem>

                <SelectItem value="Operaciones">
                  Operaciones
                </SelectItem>

                <SelectItem value="HSE">
                  HSE
                </SelectItem>

                <SelectItem value="Relaciones Laborales">
                  Relaciones Laborales
                </SelectItem>

                <SelectItem value="Talento Humano">
                  Talento Humano
                </SelectItem>

                <SelectItem value="Desarrollador">
                  Desarrollador
                </SelectItem>

                <SelectItem value="Bienestar">
                  Bienestar
                </SelectItem>

                <SelectItem value="Nómina">
                  Nómina
                </SelectItem>

                <SelectItem value="Administrativo">
                  Administrativo
                </SelectItem>

                <SelectItem value="Recepción">
                  Recepción
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-6">
          <Button
            type="submit"
            disabled={saving || passwordsDoNotMatch}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base disabled:opacity-60"
          >
            <Save className="w-5 h-5 mr-2" />

            {saving
              ? 'Guardando...'
              : 'Guardar Usuario'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateUserForm;