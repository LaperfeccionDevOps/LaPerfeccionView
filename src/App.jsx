import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import HomePage from '@/pages/HomePage';
import AspiranteView from '@/components/AspiranteView';
import ContratacionView from '@/components/ContratacionView';
import SeleccionView from '@/components/SeleccionView';
import SeguimientoView from '@/components/SeguimientoView'; // Import SeguimientoView
import RelacionesLaboralesView from '@/components/RelacionesLaboralesView';
import ArchivosView from '@/components/ArchivosView';
import CreateUserForm from '@/components/admin/CreateUserForm';
import UpdateUserView from '@/components/admin/UpdateUserView';
import EntrevistaRetiroPage from '@/pages/EntrevistaRetiroPage';

// Helper component to redirect based on role
const RoleBasedRedirect = () => {
  const { user } = useAuth();
  const SESSION_TIME = 30 * 60 * 1000; // 30 minutos

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'Aspirante':
      return <Navigate to="/aspirantes" replace />;
    case 'Selección':
      return <Navigate to="/seleccion" replace />;
    case 'Contratación':
      return <Navigate to="/contratacion" replace />;
    case 'Administrador':
      return <Navigate to="/aspirantes" replace />;
    default:
      return <Navigate to="/aspirantes" replace />;
    case 'Relaciones Laborales':
      return <Navigate to="/relaciones-laborales" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Helmet>
        <title>Portal de Recursos Humanos - Empresa de Aseo</title>
        <meta name="description" content="Sistema de gestión de recursos humanos para empresa de aseo." />
      </Helmet>
      
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/entrevista-retiro" element={<EntrevistaRetiroPage />} />
        
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>}>
          <Route index element={<RoleBasedRedirect />} />
          <Route path="aspirantes" element={<AspiranteView />} />
          <Route path="seleccion" element={<SeleccionView />} />
          <Route path="seguimiento" element={<SeguimientoView />} /> {/* Add SeguimientoView route */}
          <Route path="contratacion" element={<ContratacionView />} />
          <Route path="archivos" element={<ArchivosView />} />
          <Route path="relaciones-laborales" element={<RelacionesLaboralesView />} />
          
          {/* Rutas de Administrador */}
          <Route path="admin/crear-usuario" element={<CreateUserForm />} />
          <Route path="admin/actualizar-usuario" element={<UpdateUserView />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      <Toaster />
    </AuthProvider>
  );
}

export default App;