import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldAlert,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { logout, user } = useAuth();
  const [openSubmenus, setOpenSubmenus] = useState({});

  const rolUsuario = user?.role || "";

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
          to: "/indicadores-contratacion",
          label: "Indicadores",
          roles: ["Administrador", "Contratación"],
        },
        {
          to: "/relaciones-laborales",
          label: "Relaciones Laborales",
          roles: [
            "Administrador",
            "Relaciones Laborales",
            "Talento Humano",
          ],
        },
        {
          to: "/indicadores-rrll",
          label: "Indicadores",
          roles: [
            "Administrador",
            "Relaciones Laborales",
            "Talento Humano",
          ],
        },
      ],
    },
  ];

  const navItems = allNavItems
    .map((item) => {
      if (!rolUsuario) {
        return null;
      }

      if (esSuperAdministrador) {
        return item;
      }

      if (
        item.label === "Administrador" &&
        !tieneAccesoAdministrativo
      ) {
        return null;
      }

      if (!puedeVerPorRol(item.roles)) {
        return null;
      }

      if (Array.isArray(item.children)) {
        const filteredChildren = item.children.filter((child) =>
          puedeVerPorRol(child.roles)
        );

        if (filteredChildren.length === 0) {
          return null;
        }

        return {
          ...item,
          children: filteredChildren,
        };
      }

      return item;
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

  return (
    <aside
      className={cn(
        "fixed z-30 flex h-full flex-col overflow-hidden border-r border-emerald-800 bg-emerald-900 font-sans shadow-2xl transition-all duration-300 ease-in-out",
        isOpen ? "w-72" : "w-20"
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
              ? "Colapsar menú"
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

        {navItems.map((item) => (
          <div key={item.label}>
            {item.children ? (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleSubmenu(item.label)}
                  className={cn(
                    "group relative flex w-full items-center justify-between overflow-hidden rounded-xl px-3 py-3 text-emerald-100 transition-all duration-300 hover:bg-emerald-800/50 hover:text-white",
                    !isOpen && "justify-center"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      className="h-5 w-5 shrink-0 text-emerald-300 group-hover:text-emerald-200"
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
                      {item.label}
                    </span>
                  </div>

                  {isOpen &&
                    (openSubmenus[item.label] ? (
                      <ChevronDown className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-emerald-400" />
                    ))}
                </button>

                {isOpen && openSubmenus[item.label] && (
                  <div className="animate-in slide-in-from-top-2 space-y-1 pl-4 duration-200">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                            isActive
                              ? "bg-emerald-800/60 font-medium text-white"
                              : "text-emerald-300 hover:bg-emerald-800/30 hover:text-emerald-100"
                          )
                        }
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/50" />
                        <span>{child.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-3 transition-all duration-300",
                    isActive
                      ? "bg-emerald-800 font-semibold text-white shadow-md shadow-emerald-900/20"
                      : "text-emerald-100 hover:bg-emerald-800/50 hover:text-white",
                    !isOpen && "justify-center"
                  )
                }
                title={!isOpen ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-emerald-400" />
                    )}

                    <item.icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-colors",
                        isActive
                          ? "text-emerald-400"
                          : "text-emerald-300 group-hover:text-emerald-200"
                      )}
                      strokeWidth={2}
                    />

                    <span
                      className={cn(
                        "relative z-10 origin-left whitespace-nowrap transition-all duration-300",
                        isOpen
                          ? "opacity-100"
                          : "hidden w-0 opacity-0"
                      )}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            )}
          </div>
        ))}
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