import React from "react";

import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

import { Helmet } from "react-helmet";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import LoginPage from "@/pages/LoginPage";
import HomePage from "@/pages/HomePage";
import EntrevistaRetiroPage from "@/pages/EntrevistaRetiroPage";
import PortalTrabajadorPage from "@/pages/PortalTrabajadorPage";
import TrabajadorIncapacidadesPage from "@/pages/TrabajadorIncapacidadesPage";
import TrabajadorNuevaIncapacidadPage from "@/pages/TrabajadorNuevaIncapacidadPage";
import TrabajadorMisIncapacidadesPage from "@/pages/TrabajadorMisIncapacidadesPage";

import OperacionesProcesosDisciplinariosView from "@/pages/OperacionesProcesosDisciplinariosView";
import AgendaDisciplinariaOperacionesView from "@/pages/AgendaDisciplinariaOperacionesView";
import OperacionesRetirosView from "@/pages/OperacionesRetirosView";
import OperacionesRequisicionPersonalView from "@/components/OperacionesRequisicionPersonalView";
import ProcesosAbiertosOperacionesView from "@/pages/ProcesosAbiertosOperacionesView";
import IniciarProcesoOperacionesView from "@/pages/IniciarProcesoOperacionesView";
import RevisionProcesoOperacionesView from "@/pages/RevisionProcesoOperacionesView";

import ProcesosDisciplinariosView from "@/pages/ProcesosDisciplinariosView";
import IndicadoresProcesosDisciplinariosView from "@/pages/IndicadoresProcesosDisciplinariosView";

import AspiranteView from "@/components/AspiranteView";
import ContratacionView from "@/components/ContratacionView";
import SeleccionView from "@/components/SeleccionView";
import SeleccionRQView from "@/pages/SeleccionRQView";
import SeguimientoView from "@/components/SeguimientoView";
import RelacionesLaboralesView from "@/components/RelacionesLaboralesView";
import ArchivosView from "@/components/ArchivosView";

import CreateUserForm from "@/components/admin/CreateUserForm";
import UpdateUserView from "@/components/admin/UpdateUserView";

import IndicadoresContratacionView from "./components/IndicadoresContratacionView";
import IndicadoresSeleccionView from "./components/IndicadoresSeleccionView";
import IndicadoresRRLLView from "./components/IndicadoresRRLLView";

import NominaRetirosView from "@/components/NominaRetirosView";
import NominaActualizacionDatosView from "@/components/NominaActualizacionDatosView";
import NominaIncapacidadesView from "@/components/NominaIncapacidadesView";
import IndicadoresNominaView from "@/components/IndicadoresNominaView";
import PanelGerencialRRLLView from "@/components/PanelGerencialRRLLView";
import SalidasNoConformesView from "@/components/SalidasNoConformesView";
import SalidasNoConformesGeneralView from "@/components/SalidasNoConformesGeneralView";
import PQRFView from "@/components/PQRFView";
import PQRFGeneralView from "@/components/PQRFGeneralView";
import PQRFPublicaPage from "@/pages/PQRFPublicaPage";
import AdministracionSNCView from "@/components/AdministracionSNCView";
import AdministracionPQRFView from "@/components/AdministracionPQRFView";


// Los administrativos sin permisos operativos pueden navegar a Gestión SNC y PQRF.
// Los permisos para crear PQRF se validan en el backend.
const AccesoAdministrativoSNC = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const permisos = Array.isArray(user?.permisos) ? user.permisos : [];
  const soloSNC = user?.role === "Administrativo" &&
    !permisos.includes("OPERACIONES_PROCESOS_DISCIPLINARIOS") &&
    !permisos.includes("OPERACIONES_RETIROS") &&
    !permisos.includes("RECEPCION_AGENDA_DISCIPLINARIA");

  const rutasPermitidas = [
    "/", "/salidas-no-conformes", "/pqrf",
    ...(permisos.includes("SNC_GENERAL_VER") ? ["/salidas-no-conformes/general"] : []),
    ...(permisos.includes("PQRF_GENERAL_VER") ? ["/pqrf/general"] : []),
  ];

  if (soloSNC && !rutasPermitidas.includes(location.pathname)) {
    return <Navigate to="/salidas-no-conformes" replace />;
  }
  return children;
};

const RoleBasedRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const permissions =
    Array.isArray(user?.permisos)
      ? user.permisos
      : [];

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

    case "Recepción":
      if (
        permissions.includes(
          "RECEPCION_AGENDA_DISCIPLINARIA"
        )
      ) {
        return (
          <Navigate
            to="/operaciones/agenda-disciplinaria"
            replace
          />
        );
      }

      return <Navigate to="/login" replace />;

    // Compras y Contabilidad: inicio sin contenido. El usuario elige
    // un modulo autorizado desde el menu lateral.
    case "Compras":
    case "Contabilidad":
      return null;

    case "Administrativo":
      if (
        permissions.includes(
          "OPERACIONES_PROCESOS_DISCIPLINARIOS"
        )
      ) {
        return (
          <Navigate
            to="/operaciones/procesos-disciplinarios"
            replace
          />
        );
      }

      if (
        permissions.includes(
          "OPERACIONES_RETIROS"
        )
      ) {
        return (
          <Navigate
            to="/operaciones/retiros"
            replace
          />
        );
      }

      return <Navigate to="/salidas-no-conformes" replace />;

    default:
      return <Navigate to="/seleccion" replace />;
  }
};


// Restriccion visual puntual: los roles Compras y Contabilidad
// no pueden abrir la vista general de Seleccion por URL directa.
// La autorizacion de datos debe verificarse tambien en FastAPI.
const SeleccionRestrictedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const role = String(user?.role || "").trim().toLowerCase();
  if (role === "compras" || role === "contabilidad") {
    return <Navigate to="/" replace />;
  }

  return children;
};


const OperationsPermissionRoute = ({
  children,
  permission,
  permissions: allowedPermissions,
  roles: allowedRoles = [],
}) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role =
    String(user?.role || "").trim();

  const permissions =
    Array.isArray(user?.permisos)
      ? user.permisos
      : [];

  const globalRoles = [
    "Administrador",
    "Super Administrador",
    "Desarrollador",
  ];

  const hasPermission =
    (
      permission &&
      permissions.includes(permission)
    ) ||
    (
      Array.isArray(allowedPermissions) &&
      allowedPermissions.some((allowedPermission) =>
        permissions.includes(allowedPermission)
      )
    );

  const hasAccess =
    role === "Operaciones" ||
    globalRoles.includes(role) ||
    allowedRoles.includes(role) ||
    hasPermission;

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return children;
};


const BienestarPermissionRoute = ({
  children,
}) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role =
    String(user?.role || "").trim();

  const permissions =
    Array.isArray(user?.permisos)
      ? user.permisos
      : [];

  const hasAccess =
    role === "Bienestar" ||
    permissions.includes(
      "BIENESTAR_DOCUMENTACION"
    );

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return children;
};


// Protección visual de las vistas generales; FastAPI también valida los permisos.
const GeneralPermissionRoute = ({ children, permission }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const role = String(user?.role || "").trim();
  const permisos = Array.isArray(user?.permisos) ? user.permisos : [];
  const autorizado = role === "Super Administrador" || permisos.includes(permission);

  if (!autorizado) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Las acciones administrativas se restringen al rol Super Administrador.
const SoloSuperAdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== "Super Administrador") return <Navigate to="/" replace />;
  return children;
};

const ProcesosDisciplinariosRRLLRoute = () => {
  const navigate = useNavigate();

  return (
    <ProcesosDisciplinariosView
      onBack={() =>
        navigate("/relaciones-laborales")
      }
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
        {/* Ruta pública: no requiere JWT ni ProtectedRoute. Solo QA hasta habilitar seguridad perimetral. */}
        <Route path="/pqrf-publica" element={<PQRFPublicaPage />} />
        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/trabajador"
          element={<PortalTrabajadorPage />}
        />

        <Route
          path="/trabajador/incapacidades"
          element={<TrabajadorIncapacidadesPage />}
        />

        <Route
          path="/trabajador/incapacidades/nueva"
          element={<TrabajadorNuevaIncapacidadPage />}
        />

        <Route
          path="/trabajador/incapacidades/corregir/:token"
          element={<TrabajadorNuevaIncapacidadPage />}
        />

        <Route
          path="/trabajador/incapacidades/mis"
          element={<TrabajadorMisIncapacidadesPage />}
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
              <AccesoAdministrativoSNC>
                <HomePage />
              </AccesoAdministrativoSNC>
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
            element={
              <SeleccionRestrictedRoute>
                <SeleccionView />
              </SeleccionRestrictedRoute>
            }
          />

          <Route
            path="seleccion/rq"
            element={<SeleccionRQView />}
          />

          <Route
            path="indicadores-seleccion"
            element={
              <SeleccionRestrictedRoute>
                <IndicadoresSeleccionView />
              </SeleccionRestrictedRoute>
            }
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
            path="bienestar"
            element={
              <BienestarPermissionRoute>
                <ArchivosView />
              </BienestarPermissionRoute>
            }
          />

          <Route
            path="hse-consulta-documentacion"
            element={<ArchivosView />}
          />

          <Route
            path="operaciones/procesos-disciplinarios"
            element={
              <OperationsPermissionRoute
                permission="OPERACIONES_PROCESOS_DISCIPLINARIOS"
              >
                <OperacionesProcesosDisciplinariosView />
              </OperationsPermissionRoute>
            }
          />

          <Route
            path="operaciones/agenda-disciplinaria"
            element={
              <OperationsPermissionRoute
                permissions={[
                  "OPERACIONES_PROCESOS_DISCIPLINARIOS",
                  "RECEPCION_AGENDA_DISCIPLINARIA",
                ]}
              >
                <AgendaDisciplinariaOperacionesView />
              </OperationsPermissionRoute>
            }
          />

          <Route
            path="operaciones/requisicion-personal"
            element={
              <OperationsPermissionRoute
                permission="OPERACIONES_RETIROS"
              >
                <OperacionesRequisicionPersonalView />
              </OperationsPermissionRoute>
            }
          />

          <Route
            path="operaciones/retiros"
            element={
              <OperationsPermissionRoute
                permission="OPERACIONES_RETIROS"
              >
                <OperacionesRetirosView />
              </OperationsPermissionRoute>
            }
          />

          <Route
            path="operaciones/retiros/procesos-abiertos"
            element={
              <OperationsPermissionRoute
                permission="OPERACIONES_RETIROS"
              >
                <ProcesosAbiertosOperacionesView />
              </OperationsPermissionRoute>
            }
          />

          <Route
            path="operaciones/procesos-disciplinarios/iniciar"
            element={
              <OperationsPermissionRoute
                permission="OPERACIONES_PROCESOS_DISCIPLINARIOS"
              >
                <IniciarProcesoOperacionesView />
              </OperationsPermissionRoute>
            }
          />

          <Route
            path="operaciones/procesos-disciplinarios/revision"
            element={
              <OperationsPermissionRoute
                permission="OPERACIONES_PROCESOS_DISCIPLINARIOS"
              >
                <RevisionProcesoOperacionesView />
              </OperationsPermissionRoute>
            }
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
            element={<IndicadoresProcesosDisciplinariosRoute />}
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
            path="nomina-actualizacion-datos"
            element={<NominaActualizacionDatosView />}
          />

          <Route
            path="nomina-incapacidades"
            element={<NominaIncapacidadesView />}
          />

          <Route
            path="indicadores-nomina"
            element={<IndicadoresNominaView />}
          />

          <Route
            path="nomina-carpeta-digital"
            element={<ArchivosView />}
          />

          {/* PQRF */}
          <Route
            path="pqrf"
            element={<PQRFView />}
          />

          {/* PQRF GENERAL: SUPERADMIN o permiso PQRF_GENERAL_VER */}
          <Route
            path="pqrf/general"
            element={
              <GeneralPermissionRoute permission="PQRF_GENERAL_VER">
                <PQRFGeneralView />
              </GeneralPermissionRoute>
            }
          />

          <Route path="pqrf/administracion" element={<SoloSuperAdminRoute><AdministracionPQRFView /></SoloSuperAdminRoute>} />

          {/* SALIDAS NO CONFORMES */}
          <Route
            path="salidas-no-conformes"
            element={<SalidasNoConformesView />}
          />

          <Route
            path="salidas-no-conformes/general"
            element={
              <GeneralPermissionRoute permission="SNC_GENERAL_VER">
                <SalidasNoConformesGeneralView />
              </GeneralPermissionRoute>
            }
          />

          <Route path="salidas-no-conformes/administracion" element={<SoloSuperAdminRoute><AdministracionSNCView /></SoloSuperAdminRoute>} />

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
