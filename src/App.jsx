import React from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { Helmet } from "react-helmet";

import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import LoginPage from "@/pages/LoginPage";
import HomePage from "@/pages/HomePage";
import EntrevistaRetiroPage from "@/pages/EntrevistaRetiroPage";
import OperacionesProcesosDisciplinariosView from "@/pages/OperacionesProcesosDisciplinariosView";
import OperacionesRetirosView from "@/pages/OperacionesRetirosView";
import IniciarProcesoOperacionesView from "@/pages/IniciarProcesoOperacionesView";
import RevisionProcesoOperacionesView from "@/pages/RevisionProcesoOperacionesView";

import ProcesosDisciplinariosView from "@/pages/ProcesosDisciplinariosView";
import IndicadoresProcesosDisciplinariosView from "@/pages/IndicadoresProcesosDisciplinariosView";

import AspiranteView from "@/components/AspiranteView";
import ContratacionView from "@/components/ContratacionView";
import SeleccionView from "@/components/SeleccionView";
import SeguimientoView from "@/components/SeguimientoView";
import RelacionesLaboralesView from "@/components/RelacionesLaboralesView";
import ArchivosView from "@/components/ArchivosView";
import CreateUserForm from "@/components/admin/CreateUserForm";
import UpdateUserView from "@/components/admin/UpdateUserView";

import IndicadoresContratacionView from "./components/IndicadoresContratacionView";
import IndicadoresSeleccionView from "./components/IndicadoresSeleccionView";
import IndicadoresRRLLView from "./components/IndicadoresRRLLView";
import NominaRetirosView from "@/components/NominaRetirosView";
import IndicadoresNominaView from "@/components/IndicadoresNominaView";
import PanelGerencialRRLLView from "@/components/PanelGerencialRRLLView";


const RoleBasedRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case "Aspirante":
      return <Navigate to="/aspirantes" replace />;

    case "Selección":
      return <Navigate to="/seleccion" replace />;

    case "Contratación":
      return <Navigate to="/contratacion" replace />;

    case "Administrador":
    case "Super Administrador":
      return <Navigate to="/seleccion" replace />;

    case "Relaciones Laborales":
    case "Talento Humano":
      return <Navigate to="/relaciones-laborales" replace />;

    case "Operaciones":
    case "Bienestar":
    case "HSE":
      return <Navigate to="/archivos" replace />;

    case "Nómina":
    case "Nomina":
      return <Navigate to="/nomina-retiros" replace />;

    default:
      return <Navigate to="/seleccion" replace />;
  }
};


const ProcesosDisciplinariosRRLLRoute = () => {
  const navigate = useNavigate();

  return (
    <ProcesosDisciplinariosView
      onBack={() => navigate("/relaciones-laborales")}
    />
  );
};


const IndicadoresProcesosDisciplinariosRoute = () => {
  const navigate = useNavigate();

  return (
    <IndicadoresProcesosDisciplinariosView
      onBack={() =>
        navigate(
          "/relaciones-laborales/procesos-disciplinarios"
        )
      }
    />
  );
};


function App() {
  return (
    <AuthProvider>
      <Helmet>
        <title>
          Portal de Recursos Humanos - Empresa de Aseo
        </title>

        <meta
          name="description"
          content="Sistema de gestión de recursos humanos para empresa de aseo."
        />
      </Helmet>

      <Routes>
        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/entrevista-retiro"
          element={<EntrevistaRetiroPage />}
        />

        <Route
          path="/entrevista-retiro-publica"
          element={<EntrevistaRetiroPage />}
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={<RoleBasedRedirect />}
          />

          <Route
            path="aspirantes"
            element={<AspiranteView />}
          />

          <Route
            path="seleccion"
            element={<SeleccionView />}
          />

          <Route
            path="indicadores-seleccion"
            element={<IndicadoresSeleccionView />}
          />

          <Route
            path="seguimiento"
            element={<SeguimientoView />}
          />

          <Route
            path="contratacion"
            element={<ContratacionView />}
          />

          <Route
            path="archivos"
            element={<ArchivosView />}
          />

          <Route
            path="operaciones/procesos-disciplinarios"
            element={
              <OperacionesProcesosDisciplinariosView />
            }
          />

          <Route
            path="operaciones/retiros"
            element={<OperacionesRetirosView />}
          />

          <Route
            path="operaciones/procesos-disciplinarios/iniciar"
            element={<IniciarProcesoOperacionesView />}
          />

          <Route
            path="operaciones/procesos-disciplinarios/revision"
            element={<RevisionProcesoOperacionesView />}
          />

          <Route
            path="indicadores-contratacion"
            element={<IndicadoresContratacionView />}
          />

          <Route
            path="relaciones-laborales"
            element={<RelacionesLaboralesView />}
          />

          <Route
            path="relaciones-laborales/procesos-disciplinarios"
            element={<ProcesosDisciplinariosRRLLRoute />}
          />

          <Route
            path="relaciones-laborales/procesos-disciplinarios/indicadores"
            element={
              <IndicadoresProcesosDisciplinariosRoute />
            }
          />

          <Route
            path="indicadores-rrll"
            element={<IndicadoresRRLLView />}
          />

          <Route
            path="panel-gerencial-rrll"
            element={<PanelGerencialRRLLView />}
          />

          <Route
            path="nomina-retiros"
            element={<NominaRetirosView />}
          />

          <Route
            path="indicadores-nomina"
            element={<IndicadoresNominaView />}
          />

          <Route
            path="admin/crear-usuario"
            element={<CreateUserForm />}
          />

          <Route
            path="admin/actualizar-usuario"
            element={<UpdateUserView />}
          />
        </Route>

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>

      <Toaster />
    </AuthProvider>
  );
}


export default App;