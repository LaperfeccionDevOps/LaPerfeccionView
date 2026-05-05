import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { UserPlus, Users, UserCheck, Calendar, Briefcase, LogOut, LayoutDashboard, Menu, Shield, ChevronDown, ChevronRight, ShieldAlert, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [openSubmenus, setOpenSubmenus] = useState({});

  const allNavItems = [
    { 
      label: 'Administrador', 
      icon: ShieldAlert, 
      roles: ['Administrador'],
      children: [
        { to: '/admin/crear-usuario', label: 'Crear Usuario' },
        { to: '/admin/actualizar-usuario', label: 'Actualizar Usuario' }
      ]
    },
    {
      label: 'Talento Humano',
      icon: Users,
      roles: ['Administrador', 'Aspirante', 'Selección', 'Contratación', 'Relaciones Laborales'],
      children: [
        { to: '/aspirantes', label: 'Registro Aspirante', roles: ['Administrador', 'Aspirante'] },
        { to: '/seleccion', label: 'Selección', roles: ['Administrador', 'Selección'] },
        { to: '/indicadores-seleccion', label: 'Indicadores', roles: ['Administrador', 'Selección'] },
        { to: '/contratacion', label: 'Contratación', roles: ['Administrador', 'Contratación'] },
        { to: '/archivos', label: 'Carpeta Digital', roles: ['Administrador', 'Contratación'] },
        { to: '/indicadores-contratacion', label: 'Indicadores', roles: ['Administrador', 'Contratación'] },
        { to: '/relaciones-laborales', label: 'Relaciones Laborales', roles: ['Administrador', 'Relaciones Laborales'] },
      ]
    },
  ];

  // Filter items based on user role
  const navItems = allNavItems
    .map(item => {
      // Ocultar siempre el bloque de Administrador
      if (item.label === 'Administrador') {
        return null;
      }
      if (item.children) {
        // Filtrar los hijos por rol
        const filteredChildren = item.children.filter(child => {
          if (!user || !user.role) return false;
          // Si el hijo tiene roles, filtrar por ellos
          return !child.roles || child.roles.includes(user.role);
        });
        return filteredChildren.length > 0 ? { ...item, children: filteredChildren } : null;
      } else {
        if (!user || !user.role) return null;
        return item.roles.includes(user.role) ? item : null;
      }
    })
    .filter(Boolean);

  const toggleSubmenu = (label) => {
    if (!isOpen) toggleSidebar(); // Auto expand sidebar if collapsed
    setOpenSubmenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  return (
    <aside 
      className={cn(
        "bg-emerald-900 border-r border-emerald-800 fixed h-full flex flex-col shadow-2xl z-30 font-sans transition-all duration-300 ease-in-out overflow-hidden",
        isOpen ? "w-72" : "w-20"
      )}
    >
      {/* Header Section */}
      <div className={cn("flex items-center border-b border-emerald-800 transition-all duration-300 h-20 shrink-0", isOpen ? "px-6 justify-between" : "justify-center px-2")}>
          {/* Logo - Hidden when collapsed */}
          <div className={cn("flex items-center gap-3 overflow-hidden transition-all duration-300", isOpen ? "w-auto opacity-100" : "w-0 opacity-0 hidden")}>
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shrink-0">
                <LayoutDashboard className="text-white w-5 h-5" />
            </div>
            <div className="whitespace-nowrap">
                <h1 className="text-lg font-bold text-white leading-none">LA PERFECCIÓN</h1>
            </div>
          </div>
          
          {/* Hamburger Toggle Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="text-emerald-300 hover:text-white hover:bg-emerald-800 rounded-lg transition-colors"
            title={isOpen ? "Colapsar menú" : "Expandir menú"}
          >
             <Menu className="w-6 h-6" />
          </Button>
      </div>
      
      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
        <div className={cn("px-4 mb-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider whitespace-nowrap transition-opacity duration-200", isOpen ? "opacity-100" : "opacity-0 h-0 mb-0")}>
          Talento Humano
        </div>

        {navItems.map((item, index) => (
          <div key={index}>
            {item.children ? (
              // Parent Menu Item (Accordion)
              <div className="space-y-1">
                <button
                  onClick={() => toggleSubmenu(item.label)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden text-emerald-100 hover:bg-emerald-800/50 hover:text-white",
                    !isOpen && "justify-center"
                  )}
                >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-emerald-300 group-hover:text-emerald-200 shrink-0" strokeWidth={2} />
                      <span className={cn("whitespace-nowrap transition-all duration-300 font-medium", isOpen ? "opacity-100" : "opacity-0 w-0 hidden")}>
                        {item.label}
                      </span>
                    </div>
                    {isOpen && (
                       openSubmenus[item.label] ? <ChevronDown className="w-4 h-4 text-emerald-400"/> : <ChevronRight className="w-4 h-4 text-emerald-400"/>
                    )}
                </button>
                
                {/* Submenus */}
                {isOpen && openSubmenus[item.label] && (
                  <div className="pl-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                    {item.children.map((child) => (
                       <NavLink
                       key={child.to}
                       to={child.to}
                       className={({ isActive }) =>
                         cn(
                           "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                           isActive 
                             ? "bg-emerald-800/60 text-white font-medium" 
                             : "text-emerald-300 hover:bg-emerald-800/30 hover:text-emerald-100"
                         )
                       }
                     >
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/50" />
                       <span>{child.label}</span>
                     </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Standard Menu Item
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                    isActive 
                      ? "bg-emerald-800 text-white font-semibold shadow-md shadow-emerald-900/20" 
                      : "text-emerald-100 hover:bg-emerald-800/50 hover:text-white",
                    !isOpen && "justify-center"
                  )
                }
                title={!isOpen ? item.label : undefined}
              >
                {({ isActive }) => (
                    <>
                        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-400 rounded-r-full" />}
                        <item.icon className={cn("w-5 h-5 transition-colors shrink-0", isActive ? "text-emerald-400" : "text-emerald-300 group-hover:text-emerald-200")} strokeWidth={2} />
                        <span className={cn("relative z-10 whitespace-nowrap transition-all duration-300 origin-left", isOpen ? "opacity-100" : "opacity-0 w-0 hidden")}>
                          {item.label}
                        </span>
                    </>
                )}
              </NavLink>
            )}
          </div>
        ))}
      </nav>

      {/* User Info (Short) */}
      {isOpen && user && (
         <div className="px-6 py-2 text-xs text-emerald-400/70 truncate">
            {user.name} ({user.role})
         </div>
      )}

      {/* Footer / Logout */}
      <div className="p-4 border-t border-emerald-800 bg-emerald-900/50 shrink-0">
        <Button 
            variant="ghost" 
            className={cn(
                "w-full text-emerald-100 hover:text-red-200 hover:bg-red-900/30 hover:border-red-800/50 border border-transparent transition-all duration-300 gap-3 h-12 rounded-xl overflow-hidden",
                isOpen ? "justify-start px-4" : "justify-center px-0"
            )}
            onClick={logout}
            title={!isOpen ? "Cerrar Sesión" : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" strokeWidth={2} />
          <span className={cn("font-medium whitespace-nowrap transition-all duration-300", isOpen ? "opacity-100" : "opacity-0 w-0 hidden")}>
            Cerrar Sesión
          </span>
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;