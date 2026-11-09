import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';

import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Por debajo de este ancho el menú lateral funciona como en celular: inicia
// cerrado, se abre con el botón ☰ encima del contenido y se cierra al elegir
// una opción o al tocar fuera.
const ANCHO_MOVIL = 768;

const esPantallaMovil = () =>
  typeof window !== 'undefined' && window.innerWidth < ANCHO_MOVIL;

const HomePage = () => {
  const location = useLocation();
  const esVistaGeneralAncha = ['/salidas-no-conformes/general', '/pqrf/general'].includes(location.pathname);

  const [isMobile, setIsMobile] = useState(esPantallaMovil);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => !esPantallaMovil());
  const eraMovilRef = useRef(isMobile);

  useEffect(() => {
    const actualizarPantalla = () => {
      const mobile = esPantallaMovil();

      setIsMobile(mobile);

      // Solo al pasar de pantalla grande a celular se cierra el menú. En el
      // celular, desplazarse cambia el alto de la ventana (barra de
      // direcciones) y no debe cerrarlo.
      if (mobile && !eraMovilRef.current) {
        setIsSidebarOpen(false);
      }

      eraMovilRef.current = mobile;
    };

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
          aria-label="Cerrar menú"
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-20 bg-black/45"
        />
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        closeMobileSidebar={closeMobileSidebar}
      />

      {isMobile && !isSidebarOpen && (
        <Button
          type="button"
          size="icon"
          onClick={toggleSidebar}
          aria-label="Abrir menú"
          title="Abrir menú"
          className="fixed left-3 top-3 z-20 h-11 w-11 rounded-xl bg-emerald-900 text-white shadow-lg hover:bg-emerald-800"
        >
          <Menu className="h-6 w-6" />
        </Button>
      )}

      <main
        className={cn(
          'min-w-0 flex-1 transition-all duration-300 ease-in-out',
          isMobile
            ? 'ml-0 w-full max-w-full overflow-x-hidden px-3 pb-4 pt-16 sm:px-4'
            : isSidebarOpen
              ? 'ml-72 p-8'
              : 'ml-20 p-8'
        )}
      >
        <div
          className={cn(
            'mx-auto w-full min-w-0',
            esVistaGeneralAncha ? 'max-w-none' : 'max-w-7xl',
            isMobile && 'overflow-x-hidden'
          )}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default HomePage;
