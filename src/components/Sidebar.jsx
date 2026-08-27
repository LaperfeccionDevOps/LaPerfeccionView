import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldAlert,
  Users,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const Sidebar = ({
  isOpen,
  toggleSidebar,
  closeMobileSidebar,
}) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [openSubmenus, setOpenSubmenus] = useState({});

  const rolUsuario = user?.role || "";

  const isOperaciones =
    rolUsuario === "Operaciones";

  const esSuperAdministrador =
    rolUsuario === "Super Administrador";

  const esAdministrador =
    rolUsuario === "Administrador";

  const tieneAccesoAdministrativo =
    esAdministrador || esSuperAdministrador;

  const puedeVerPorRol = (rolesPermitidos) => {
    if (!rolUsuario) {
      return false;
    }

    if (esSuperAdministrador) {
      return true;
    }

    if (
      !Array.isArray(rolesPermitidos) ||
      rolesPermitidos.length === 0
    ) {
      return true;
    }

    return rolesPermitidos.includes(rolUsuario);
  };

  const allNavItems = [
    {
      label: "Administrador",
      icon: ShieldAlert,
      roles: ["Administrador", "Super Administrador"],
      children: [
        {
          to: "/admin/crear-usuario",
          label: "Crear Usuario",
        },
        {
          to: "/admin/actualizar-usuario",
          label: "Actualizar Usuario",
        },
      ],
    },
    {
      label: "Talento Humano",
      icon: Users,
      roles: [
        "Administrador",
        "Super Administrador",
        "Aspirante",
        "Selección",
        "Contratación",
        "Relaciones Laborales",
        "Talento Humano",
        "Operaciones",
        "Bienestar",
        "HSE",
      ],
      children: [
        {
          to: "/aspirantes",
          label: "Registro Aspirante",
          roles: ["Administrador", "Aspirante"],
        },
        {
          to: "/seleccion",
          label: "Selección",
          roles: ["Administrador", "Selección"],
        },
        {
          to: "/indicadores-seleccion",
          label: "Indicadores",
          roles: ["Administrador", "Selección"],
        },
        {
          to: "/contratacion",
          label: "Contratación",
          roles: ["Administrador", "Contratación"],
        },
        {
          to: "/archivos",
          label:
            rolUsuario === "Bienestar"
              ? "Bienestar"
              : rolUsuario === "HSE"
                ? "HSE"
                : "Carpeta Digital",
          roles: [
            "Administrador",
            "Super Administrador",
            "Contratación",
            "Operaciones",
            "Bienestar",
            "HSE",
          ],
        },
        {
          to: "/hse-consulta-documentacion",
          label: "Consulta documentación",
          roles: ["HSE"],
        },
        {
          to: "/operaciones/procesos-disciplinarios",
          label: "Procesos Disciplinarios",
          roles: ["Operaciones"],
        },
        {
          to: "/operaciones/retiros",
          label: "Retiros",
          roles: ["Operaciones"],
        },
        {
          to: "/indicadores-contratacion",
          label: "Indicadores",
          roles: ["Administrador", "Contratación"],
        },
        {
          label: "Relaciones Laborales",
          roles: [
            "Administrador",
            "Super Administrador",
            "Relaciones Laborales",
            "Talento Humano",
          ],
          children: [
            {
              to: "/relaciones-laborales",
              label: "Retiros",
              roles: [
                "Administrador",
                "Super Administrador",
                "Relaciones Laborales",
                "Talento Humano",
              ],
            },
            {
              to: "/relaciones-laborales/procesos-disciplinarios",
              label: "Procesos Disciplinarios",
              roles: [
                "Administrador",
                "Super Administrador",
                "Relaciones Laborales",
                "Talento Humano",
              ],
            },
            {
              to: "/panel-gerencial-rrll",
              label: "Panel Gerencial",
              roles: [
                "Administrador",
                "Super Administrador",
                "Relaciones Laborales",
                "Talento Humano",
              ],
            },
          ],
        },
      ],
    },
    {
      label: "Nómina",
      icon: WalletCards,
      roles: [
        "Administrador",
        "Super Administrador",
        "Nómina",
        "Nomina",
      ],
      children: [
        {
          to: "/nomina-retiros",
          label: "Retiros",
          roles: [
            "Administrador",
            "Super Administrador",
            "Nómina",
            "Nomina",
          ],
        },
        {
          to: "/indicadores-nomina",
          label: "Indicadores",
          roles: [
            "Administrador",
            "Super Administrador",
            "Nómina",
            "Nomina",
          ],
        },
        {
          to: "/nomina-carpeta-digital",
          label: "Carpeta Digital",
          roles: [
            "Administrador",
            "Super Administrador",
            "Nómina",
            "Nomina",
          ],
        },
      ],
    },
  ];

  const superAdminNavItems = [
    {
      label: "Administrador",
      icon: ShieldAlert,
      roles: ["Super Administrador"],
      children: [
        {
          to: "/admin/crear-usuario",
          label: "Crear Usuario",
        },
        {
          to: "/admin/actualizar-usuario",
          label: "Actualizar Usuario",
        },
      ],
    },
    {
      label: "Talento Humano",
      icon: Users,
      roles: ["Super Administrador"],
      children: [
        {
          to: "/aspirantes",
          label: "Registro Aspirante",
        },
        {
          to: "/seleccion",
          label: "Selección",
          children: [
            {
              to: "/indicadores-seleccion",
              label: "Indicadores",
            },
          ],
        },
        {
          to: "/contratacion",
          label: "Contratación",
          children: [
            {
              to: "/indicadores-contratacion",
              label: "Indicadores",
            },
            {
              to: "/archivos",
              label: "Carpeta Digital",
            },
          ],
        },
        {
          to: "/relaciones-laborales",
          label: "Relaciones Laborales",
          children: [
            {
              to: "/relaciones-laborales",
              label: "Retiros",
            },
            {
              to: "/relaciones-laborales/procesos-disciplinarios",
              label: "Procesos Disciplinarios",
            },
            {
              to: "/panel-gerencial-rrll",
              label: "Panel Gerencial",
            },
          ],
        },
        {
          to: "/nomina-retiros",
          label: "Nómina",
          children: [
            {
              to: "/nomina-retiros",
              label: "Retiros",
            },
            {
              to: "/indicadores-nomina",
              label: "Indicadores",
            },
            {
              to: "/nomina-carpeta-digital",
              label: "Carpeta Digital",
            },
          ],
        },
      ],
    },
    {
      to: "/archivos",
      label: "Operaciones",
      icon: Users,
      roles: ["Super Administrador"],
      children: [
        {
          to: "/archivos",
          label: "Consulta de Colaboradores",
        },
      ],
    },
  ];

  const filtrarItemPorRol = (item) => {
    if (!item || !puedeVerPorRol(item.roles)) {
      return null;
    }

    if (Array.isArray(item.children)) {
      const childrenFiltrados = item.children
        .map((child) => filtrarItemPorRol(child))
        .filter(Boolean);

      if (childrenFiltrados.length === 0) {
        return null;
      }

      return {
        ...item,
        children: childrenFiltrados,
      };
    }

    return item;
  };

  const navItems = esSuperAdministrador
    ? superAdminNavItems
    : allNavItems
        .map((item) => {
          if (!rolUsuario) {
            return null;
          }

          if (
            item.label === "Administrador" &&
            !tieneAccesoAdministrativo
          ) {
            return null;
          }

          return filtrarItemPorRol(item);
        })
        .filter(Boolean);

  const toggleSubmenu = (label) => {
    if (!isOpen) {
      toggleSidebar();
    }

    setOpenSubmenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const handleParentNavigation = (
    menuItem,
    claveMenu
  ) => {
    if (menuItem?.to) {
      navigate(menuItem.to);

      if (typeof closeMobileSidebar === "function") {
        closeMobileSidebar();
      }
    }

    toggleSubmenu(claveMenu);
  };


  const handleNavigation = () => {
    if (typeof closeMobileSidebar === "function") {
      closeMobileSidebar();
    }
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 flex h-full flex-col overflow-hidden border-r border-emerald-800 bg-emerald-900 font-sans shadow-2xl transition-all duration-300 ease-in-out",

        isOpen
          ? "w-[86vw] max-w-72 translate-x-0 md:w-72 md:max-w-none"
          : "-translate-x-full w-[86vw] max-w-72 md:w-20 md:max-w-none md:translate-x-0"
      )}
    >
      <div
        className={cn(
          "flex h-20 shrink-0 items-center border-b border-emerald-800 transition-all duration-300",
          isOpen
            ? "justify-between px-6"
            : "justify-center px-2"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3 overflow-hidden transition-all duration-300",
            isOpen
              ? "w-auto opacity-100"
              : "hidden w-0 opacity-0"
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>

          <div className="whitespace-nowrap">
            <h1 className="text-lg font-bold leading-none text-white">
              LA PERFECCIÓN
            </h1>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="rounded-lg text-emerald-300 transition-colors hover:bg-emerald-800 hover:text-white"
          title={
            isOpen
              ? "Cerrar menú"
              : "Expandir menú"
          }
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      <nav className="custom-scrollbar flex-1 space-y-2 overflow-y-auto overflow-x-hidden px-3 py-6">
        <div
          className={cn(
            "mb-2 whitespace-nowrap px-4 text-xs font-semibold uppercase tracking-wider text-emerald-400 transition-opacity duration-200",
            isOpen
              ? "opacity-100"
              : "mb-0 h-0 opacity-0"
          )}
        >
          Talento Humano
        </div>

        {navItems.map((item) => {
          const renderMenuItem = (
            menuItem,
            nivel = 0,
            clavePadre = ""
          ) => {
            const claveMenu = clavePadre
              ? `${clavePadre}__${menuItem.label}`
              : menuItem.label;

            if (Array.isArray(menuItem.children)) {
              const estaAbierto =
                Boolean(openSubmenus[claveMenu]);

              const existeHijoConMismaRuta =
                Boolean(
                  menuItem.to &&
                  menuItem.children.some(
                    (child) =>
                      child?.to === menuItem.to
                  )
                );

              const esRutaPrincipalActiva =
                Boolean(
                  menuItem.to &&
                  location.pathname === menuItem.to &&
                  !existeHijoConMismaRuta
                );

              return (
                <div
                  key={claveMenu}
                  className="space-y-1"
                >
                  <button
                    type="button"
                    onClick={() =>
                      handleParentNavigation(
                        menuItem,
                        claveMenu
                      )
                    }
                    className={cn(
                      "group relative flex w-full items-center justify-between overflow-hidden rounded-xl text-emerald-100 transition-all duration-300 hover:bg-emerald-800/50 hover:text-white",
                      nivel === 0
                        ? "px-3 py-3"
                        : "px-3 py-2 text-sm",
                      esRutaPrincipalActiva &&
                        "bg-emerald-800/60 text-white",
                      !isOpen && nivel === 0 && "justify-center"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {nivel === 0 && menuItem.icon ? (
                        <menuItem.icon
                          className="h-5 w-5 shrink-0 text-emerald-300 group-hover:text-emerald-200"
                          strokeWidth={2}
                        />
                      ) : (
                        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/50" />
                      )}

                      <span
                        className={cn(
                          "whitespace-nowrap transition-all duration-300",
                          nivel === 0
                            ? "font-medium"
                            : "font-semibold",
                          isOpen
                            ? "opacity-100"
                            : "hidden w-0 opacity-0"
                        )}
                      >
                        {menuItem.label}
                      </span>
                    </div>

                    {isOpen &&
                      (estaAbierto ? (
                        <ChevronDown className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-emerald-400" />
                      ))}
                  </button>

                  {isOpen && estaAbierto && (
                    <div
                      className={cn(
                        "animate-in slide-in-from-top-2 space-y-1 duration-200",
                        nivel === 0 ? "pl-4" : "pl-5"
                      )}
                    >
                      {menuItem.children.map(
                        (child) =>
                          renderMenuItem(
                            child,
                            nivel + 1,
                            claveMenu
                          )
                      )}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={`${clavePadre}__${menuItem.to}`}
                to={menuItem.to}
                end
                onClick={handleNavigation}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                    isActive
                      ? "bg-emerald-800/60 font-medium text-white"
                      : "text-emerald-300 hover:bg-emerald-800/30 hover:text-emerald-100"
                  )
                }
              >
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/50" />
                <span>{menuItem.label}</span>
              </NavLink>
            );
          };

          return renderMenuItem(item);
        })}
      </nav>

      {isOpen && user && (
        <div className="truncate px-6 py-2 text-xs text-emerald-400/70">
          {user.name} ({user.role})
        </div>
      )}

      <div className="shrink-0 border-t border-emerald-800 bg-emerald-900/50 p-4">
        <Button
          variant="ghost"
          className={cn(
            "h-12 w-full gap-3 overflow-hidden rounded-xl border border-transparent text-emerald-100 transition-all duration-300 hover:border-red-800/50 hover:bg-red-900/30 hover:text-red-200",
            isOpen
              ? "justify-start px-4"
              : "justify-center px-0"
          )}
          onClick={logout}
          title={!isOpen ? "Cerrar Sesión" : undefined}
        >
          <LogOut
            className="h-5 w-5 shrink-0"
            strokeWidth={2}
          />

          <span
            className={cn(
              "whitespace-nowrap font-medium transition-all duration-300",
              isOpen
                ? "opacity-100"
                : "hidden w-0 opacity-0"
            )}
          >
            Cerrar Sesión
          </span>
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;