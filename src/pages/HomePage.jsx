import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';

import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const HomePage = () => {
  const { user } = useAuth();
  const isOperaciones = user?.role === 'Operaciones';
  const isSuperAdmin = user?.role === 'Super Administrador';

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.innerWidth < 768;
  });

  useEffect(() => {
    const actualizarPantalla = () => {
      const mobile = window.innerWidth < 768;

      setIsMobile(mobile);

      // Conservar el comportamiento móvil existente de Operaciones.
      // Superadmin utiliza su propio encabezado móvil.
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };

    actualizarPantalla();

    window.addEventListener('resize', actualizarPantalla);

    return () => {
      window.removeEventListener('resize', actualizarPantalla);
    };
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((estadoActual) => !estadoActual);
  };

  const closeMobileSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-gray-50">
      {isMobile && isSidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menú lateral"
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-20 bg-black/45"
        />
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        closeMobileSidebar={closeMobileSidebar}
      />

      {isMobile && !isSidebarOpen && !isSuperAdmin && (
        <Button
          type="button"
          size="icon"
          onClick={toggleSidebar}
          aria-label="Abrir menú lateral"
          title="Abrir menú"
          className="fixed left-3 top-3 z-20 h-11 w-11 rounded-xl bg-emerald-900 text-white shadow-lg hover:bg-emerald-800"
        >
          <Menu className="h-6 w-6" />
        </Button>
      )}

      {/* En Superadmin móvil, el botón ocupa una barra propia y no tapa los títulos. */}
      {isMobile && isSuperAdmin && !isSidebarOpen && (
        <div className="fixed inset-x-0 top-0 z-20 flex h-14 items-center bg-gray-50/95 px-3 shadow-sm backdrop-blur-sm">
          <Button
            type="button"
            size="icon"
            onClick={toggleSidebar}
            aria-label="Abrir menú lateral"
            title="Abrir menú"
            className="h-11 w-11 rounded-xl bg-emerald-900 text-white shadow-lg hover:bg-emerald-800"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      )}

      <main
        className={cn(
          'min-w-0 flex-1 transition-all duration-300 ease-in-out',

          isMobile
            ? isSuperAdmin
              ? 'ml-0 w-full max-w-full overflow-x-hidden px-3 pb-4 pt-[4.25rem] sm:px-4'
              : 'ml-0 w-full max-w-full overflow-x-hidden px-3 pb-4 pt-16 sm:px-4'
            : isSidebarOpen
              ? 'ml-72 p-8'
              : 'ml-20 p-8'
        )}
      >
        <div
          className={cn(
            'mx-auto w-full min-w-0 max-w-7xl',
            isMobile && 'max-w-full overflow-x-hidden'
          )}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default HomePage;