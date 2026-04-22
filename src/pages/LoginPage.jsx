// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  LogIn,
  Building2,
  Eye,
  EyeOff,
  UserPlus,
  KeyRound,
  User,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

// 👉 Base de la API tomada del .env
// Ejemplo: VITE_API_BASE_URL=https://apiqa.laperfeccion.app/api
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://apiqa.laperfeccion.app/api';

// 👉 Token endpoint - los campos obligatorios son: grant_type, username, password
const TOKEN_URL = import.meta.env.VITE_TOKEN_URL || `${API_BASE_URL}/auth/token`;
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID || '';
const CLIENT_SECRET = import.meta.env.VITE_CLIENT_SECRET || '';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState('selection'); // 'selection' | 'login'
  const [loading, setLoading] = useState(false);

  // 🔐 LOGIN CORPORATIVO contra la API
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: '⚠️ Campos incompletos', description: 'Por favor ingrese usuario y contraseña.', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'password'); // obligatorio
      params.append('username', username);
      params.append('password', password);
      if (CLIENT_ID) params.append('client_id', CLIENT_ID);
      if (CLIENT_SECRET) params.append('client_secret', CLIENT_SECRET);

      const tokenRes = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      console.log(tokenRes, 'tokenRes');
      const tokenData = await (async () => { try { return await tokenRes.json(); } catch (e) { return null; } })();
      console.log(tokenData, 'tokenData');
      if (!tokenRes.ok) {
        const detail = tokenData?.error_description || tokenData?.error || 'No fue posible obtener el token.';
        console.error('Token error:', tokenRes.status, tokenData);
        toast({ title: '⛔ Error al obtener token', description: detail, variant: 'destructive' });
        return;
      }

      const token = tokenData?.access_token;
      console.log('Obtained token:', token);
      localStorage.setItem('token', token);
      if (!token) {
        console.error('Token response no contiene access_token:', tokenData);
        toast({ title: '⛔ Token inválido', description: 'La respuesta del servidor no contiene access_token.', variant: 'destructive' });
        return;
      }

      // 2) Llamar al endpoint de login enviando Authorization: Bearer <token>
      const resp = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre_usuario: username, contrasena: password }),
      });

      if (!resp.ok) {
        let detail = 'Error al iniciar sesión. Verifique sus credenciales.';
        try {
          const errorData = await resp.json();
          if (errorData?.detail) detail = errorData.detail;
        } catch (_) {
          // ignore parse error
        }

        toast({
          title: '⛔ Error de acceso',
          description: detail,
          variant: 'destructive',
        });
        return;
      }

      const data = await resp.json();

      // ✅ Guardamos lo que devuelve tu API (si la API devuelve un token usamos ese, sino usamos el token obtenido antes)
      // data: { access_token, token_type, usuario, id_usuario, roles, roles_ids, message }
      const finalToken = data?.access_token || token;
      if (finalToken) localStorage.setItem('token', finalToken);
      localStorage.setItem('usuario', data.usuario);
      localStorage.setItem('id_usuario', data.id_usuario);
      localStorage.setItem('roles', JSON.stringify(data.roles || []));
      localStorage.setItem('roles_ids', JSON.stringify(data.roles_ids || []));

      // Rol principal para el contexto (tomamos el primero si existe)
      const mainRole = Array.isArray(data.roles) && data.roles.length > 0
        ? data.roles[0]
        : 'Usuario';

      // 👉 Actualizamos AuthContext
      login({
        username: data.usuario,
        role: mainRole,
        name: data.usuario,
        token: finalToken,
      });

      toast({
        title: `👋 Bienvenid@, ${data.usuario}`,
        description: data.message || `Has ingresado con perfil de ${mainRole}.`,
        className: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      });

      // Redirige donde quieras después del login
      navigate('/');
    } catch (err) {
      console.error('Error en login:', err);
      toast({
        title: '⛔ Error al conectar',
        description: 'No fue posible comunicarse con el servidor de autenticación.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 🔓 Acceso rápido de aspirante (por ahora sigue siendo “local”)
  const handleAspiranteQuickAccess = () => {
    login({
      username: 'nuevo_aspirante',
      role: 'Aspirante',
      name: 'Nuevo Aspirante',
    });

    toast({
      title: '📝 Registro de Hoja de Vida',
      description: 'Bienvenido al portal de aspirantes.',
    });

    navigate('/aspirantes');
  };

  const renderSelectionView = () => (
    <motion.div
      key="selection"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Portal Corporativo</h1>
        <p className="text-gray-500">Seleccione una opción para continuar</p>
      </div>

      <div className="grid gap-4">
        <button
          onClick={handleAspiranteQuickAccess}
          className="group relative flex items-center p-4 bg-white border-2 border-emerald-100 rounded-2xl hover:border-emerald-500 hover:shadow-lg transition-all duration-200 text-left w-full"
        >
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <UserPlus className="w-6 h-6" />
          </div>
          <div className="ml-4">
            <h3 className="font-bold text-gray-800 group-hover:text-emerald-700">
              Soy Aspirante
            </h3>
            <p className="text-sm text-gray-500">Registrar mi hoja de vida</p>
          </div>
        </button>

        <button
          onClick={() => setView('login')}
          className="group relative flex items-center p-4 bg-white border-2 border-blue-100 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all duration-200 text-left w-full"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="ml-4">
            <h3 className="font-bold text-gray-800 group-hover:text-blue-700">
              Ingreso Corporativo
            </h3>
            <p className="text-sm text-gray-500">Administrativos y Empleados</p>
          </div>
        </button>
      </div>

      <div className="text-center pt-4">
        <p className="text-xs text-gray-400">Portal de Recursos Humanos v1.0</p>
      </div>
    </motion.div>
  );

  const renderLoginView = () => (
    <motion.div
      key="login"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
    >
      <Button
        variant="ghost"
        onClick={() => setView('selection')}
        className="mb-4 -ml-2 text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Volver
      </Button>

      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Acceso Seguro</h1>
        <p className="text-gray-500">Credenciales corporativas</p>
      </div>

      <form onSubmit={handleLoginSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="username">Usuario</Label>
          <div className="relative">
            <Input
              id="username"
              type="text"
              placeholder="Usuario de red"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border-blue-200 focus:border-blue-500 pl-10"
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-blue-200 focus:border-blue-500 pl-10 pr-10"
            />
            <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-blue-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-6 text-lg shadow-lg shadow-blue-600/20"
        >
          <LogIn className="w-5 h-5 mr-2" />
          {loading ? 'Ingresando...' : 'Iniciar Sesión'}
        </Button>
      </form>
    </motion.div>
  );

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-emerald-50 via-gray-50 to-blue-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 relative overflow-hidden">
        {/* Barra superior decorativa */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500" />

        <AnimatePresence mode="wait">
          {view === 'selection' && renderSelectionView()}
          {view === 'login' && renderLoginView()}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LoginPage;
