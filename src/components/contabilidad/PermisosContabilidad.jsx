import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { obtenerPermisosContabilidad } from "@/services/contabilidadService";

const inicial = { cargando: true, error: false, puedeConsultar: false, puedeGestionar: false };
const Contexto = createContext(inicial);

export const usePermisosContabilidad = () => useContext(Contexto);

export const PermisosContabilidadProvider = ({ children }) => {
  const [permisos, setPermisos] = useState(inicial);
  const solicitud = useRef(0);
  const { pathname } = useLocation();
  const actualizar = useCallback(async () => {
    const id = ++solicitud.current;
    const token = localStorage.getItem("token");
    try {
      const datos = await obtenerPermisosContabilidad();
      if (id !== solicitud.current || token !== localStorage.getItem("token")) return;
      const puedeConsultar = datos?.puede_consultar === true;
      setPermisos({ cargando: false, error: false, puedeConsultar,
        puedeGestionar: puedeConsultar && datos?.puede_gestionar === true });
    } catch {
      if (id === solicitud.current) setPermisos({ ...inicial, cargando: false, error: true });
    }
  }, []);
  useEffect(() => {
    actualizar();
    const visible = () => { if (document.visibilityState === "visible") actualizar(); };
    window.addEventListener("focus", actualizar);
    document.addEventListener("visibilitychange", visible);
    return () => {
      solicitud.current++;
      window.removeEventListener("focus", actualizar);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [actualizar, pathname]);
  return <Contexto.Provider value={{ ...permisos, actualizar }}>{children}</Contexto.Provider>;
};
