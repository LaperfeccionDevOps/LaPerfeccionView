import React, { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Menú pequeño que aparece con el clic derecho sobre una fila de centros de
 * costo. `posicion` = { x, y } en la ventana (null = cerrado) y `opciones` =
 * [{ etiqueta, icono, onClick }]. Se cierra al elegir, con Escape, al hacer
 * clic fuera, al desplazarse o al cambiar el tamaño de la ventana.
 */
const MenuContextualCentro = ({ posicion, titulo, opciones, onClose }) => {
  const menu = useRef(null);

  useEffect(() => {
    if (!posicion) {
      return undefined;
    }

    const cerrarFuera = (e) => {
      // Un clic derecho sobre otra fila ya movió el menú (la fila llama a
      // preventDefault); solo se cierra con un clic fuera de las filas.
      if (!menu.current?.contains(e.target) && !(e.type === "contextmenu" && e.defaultPrevented)) {
        onClose();
      }
    };
    const cerrarEscape = (e) => e.key === "Escape" && onClose();

    document.addEventListener("mousedown", cerrarFuera);
    document.addEventListener("contextmenu", cerrarFuera);
    document.addEventListener("keydown", cerrarEscape);
    window.addEventListener("scroll", onClose, true);
    window.addEventListener("resize", onClose);
    // El primer elemento recibe el foco para poder usarlo con el teclado.
    menu.current?.querySelector("button")?.focus();

    return () => {
      document.removeEventListener("mousedown", cerrarFuera);
      document.removeEventListener("contextmenu", cerrarFuera);
      document.removeEventListener("keydown", cerrarEscape);
      window.removeEventListener("scroll", onClose, true);
      window.removeEventListener("resize", onClose);
    };
  }, [posicion, onClose]);

  if (!posicion) {
    return null;
  }

  // Que no se salga de la ventana cerca de los bordes.
  const ancho = 224;
  const alto = 48 + opciones.length * 40;
  const left = Math.max(8, Math.min(posicion.x, window.innerWidth - ancho - 8));
  const top = Math.max(8, Math.min(posicion.y, window.innerHeight - alto - 8));

  // Flechas arriba/abajo para moverse entre las opciones.
  const mover = (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") {
      return;
    }
    e.preventDefault();
    const botones = [...(menu.current?.querySelectorAll("button") || [])];
    const actual = botones.indexOf(document.activeElement);
    const siguiente = (actual + (e.key === "ArrowDown" ? 1 : -1) + botones.length) % botones.length;
    botones[siguiente]?.focus();
  };

  return (
    <div
      ref={menu}
      role="menu"
      aria-label={titulo}
      onKeyDown={mover}
      style={{ left, top, width: ancho }}
      className="fixed z-50 overflow-hidden rounded-2xl border border-gray-100 bg-white py-1 shadow-xl"
    >
      <p className="truncate border-b border-gray-100 px-3 pb-1.5 pt-1 font-mono text-xs font-bold text-emerald-800" title={titulo}>
        {titulo}
      </p>
      {opciones.map(({ etiqueta, icono: Icono, onClick }) => (
        <button
          key={etiqueta}
          type="button"
          role="menuitem"
          onClick={() => {
            onClose();
            onClick();
          }}
          className={cn(
            "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 outline-none",
            "hover:bg-emerald-50 hover:text-emerald-800 focus-visible:bg-emerald-50 focus-visible:text-emerald-800"
          )}
        >
          {Icono && <Icono className="h-4 w-4 shrink-0" />}
          {etiqueta}
        </button>
      ))}
    </div>
  );
};

export default MenuContextualCentro;
