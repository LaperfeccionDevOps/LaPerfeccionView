import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";

import { cn } from "@/lib/utils";

// Minúsculas y sin tildes, para buscar "compensacion" = "Compensación".
const normalizar = (valor) =>
  String(valor || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/**
 * Filtro de una opción con búsqueda, para listas largas (p. ej. proyectos).
 * `opciones`: [{ id, etiqueta, corta?, detalle?, busqueda? }]. `valor`: id elegido o "".
 * `corta` (p. ej. el código) es lo que muestra el campo compacto con la opción elegida.
 * `compacto`: campo más bajo y lista más ancha que el campo (filtros en fila);
 *   con una opción elegida se resalta en verde (filtro aplicado).
 * `listaEnLinea`: la lista se abre dentro de la página (empuja el contenido) y
 * más alta, en lugar de flotar encima; útil en formularios con listas largas.
 * Al abrirse, la página se desplaza lo necesario para que la lista se vea.
 * `sugeridas`: ids que se muestran primero bajo `tituloSugeridas`; las demás
 *   quedan detrás de "Ver todas" (al escribir se busca en todas). Sin
 *   sugeridas, la lista es la de siempre.
 */
const FiltroBuscable = ({
  id,
  label,
  opciones,
  valor,
  onChange,
  placeholder = "Todos",
  disabled = false,
  listaEnLinea = false,
  compacto = false,
  sugeridas = null,
  tituloSugeridas = "Sugeridas",
  textoVerTodas = "Ver todas las opciones",
}) => {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [verTodas, setVerTodas] = useState(false);
  const contenedorRef = useRef(null);
  const listaRef = useRef(null);

  const seleccionada = opciones.find((o) => String(o.id) === String(valor));
  const textoElegido = (compacto && seleccionada?.corta) || seleccionada?.etiqueta || "";

  useEffect(() => {
    const cerrar = (evento) => {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target)) {
        setAbierto(false);
      }
    };

    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, []);

  useEffect(() => {
    if (abierto && listaEnLinea) {
      listaRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [abierto, listaEnLinea]);

  const filtradas = useMemo(() => {
    const buscado = normalizar(texto);

    // Se muestran todas las opciones; la lista se desplaza dentro de su recuadro.
    return opciones.filter(
      (o) =>
        !buscado ||
        normalizar(`${o.etiqueta} ${o.detalle || ""} ${o.busqueda || ""}`).includes(buscado)
    );
  }, [opciones, texto]);

  // Sugeridas primero (solo las que están entre las opciones) y luego las demás.
  const idsSugeridas = useMemo(() => new Set((sugeridas || []).map(String)), [sugeridas]);
  const listaSugeridas = filtradas.filter((o) => idsSugeridas.has(String(o.id)));
  const conSugeridas = opciones.some((o) => idsSugeridas.has(String(o.id)));
  const otras = conSugeridas ? filtradas.filter((o) => !idsSugeridas.has(String(o.id))) : filtradas;
  // Sin escribir, las demás se ven al pedirlo; al buscar se busca en todas.
  const mostrarOtras = !conSugeridas || verTodas || Boolean(normalizar(texto));

  useEffect(() => {
    if (!abierto) {
      setVerTodas(false);
    }
  }, [abierto]);

  const elegir = (opcion) => {
    onChange(opcion ? String(opcion.id) : "");
    setTexto("");
    setAbierto(false);
  };

  const renglon = (opcion) => (
    <li key={opcion.id}>
      <button
        type="button"
        onClick={() => elegir(opcion)}
        className={cn(
          "w-full px-3 py-2 text-left hover:bg-emerald-50",
          String(opcion.id) === String(valor) && "bg-emerald-50"
        )}
      >
        <span className="block text-sm text-gray-800">{opcion.etiqueta}</span>
        {opcion.detalle && <span className="block text-xs text-gray-500">{opcion.detalle}</span>}
      </button>
    </li>
  );

  const titulo = (contenido) => (
    <li className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-emerald-700">{contenido}</li>
  );

  return (
    <div ref={contenedorRef} className="relative space-y-1">
      <label htmlFor={id} title={label} className="block truncate text-xs font-bold uppercase text-gray-700">
        {label}
      </label>

      <div
        className={cn(
          "flex items-center rounded-full border bg-white text-sm",
          compacto ? "h-9 px-3" : "h-10 px-4",
          abierto
            ? "border-emerald-400 ring-2 ring-emerald-100"
            : compacto && seleccionada
              ? "border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-200"
              : "border-gray-200",
          disabled && "opacity-60"
        )}
      >
        <input
          id={id}
          type="text"
          autoComplete="off"
          disabled={disabled}
          value={abierto ? texto : textoElegido}
          placeholder={seleccionada ? textoElegido : placeholder}
          title={seleccionada?.etiqueta}
          onFocus={() => setAbierto(true)}
          // Con el campo ya enfocado (p. ej. después de elegir), un clic vuelve a abrir la lista.
          onClick={() => setAbierto(true)}
          onChange={(e) => {
            setTexto(e.target.value);
            setAbierto(true);
          }}
          className="min-w-0 flex-1 truncate bg-transparent outline-none placeholder:text-gray-400"
        />

        {seleccionada && !disabled && (
          <button
            type="button"
            title="Quitar filtro"
            onClick={() => elegir(null)}
            className="ml-1 shrink-0 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* En el campo compacto con una opción elegida solo cabe la ✕; la lista se abre con un clic. */}
        {!(compacto && seleccionada) && (
          <button
            type="button"
            title={abierto ? "Cerrar lista" : "Ver todas las opciones"}
            aria-expanded={abierto}
            aria-controls={`${id}-lista`}
            disabled={disabled}
            onClick={() => {
              setTexto("");
              setAbierto((valorActual) => !valorActual);
            }}
            className={cn(
              "shrink-0 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed",
              compacto ? "ml-0.5" : "ml-1"
            )}
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", abierto && "rotate-180")}
            />
          </button>
        )}
      </div>

      {abierto && !disabled && (
        <ul
          id={`${id}-lista`}
          ref={listaRef}
          className={cn(
            "mt-1 w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white py-1",
            listaEnLinea ? "max-h-[min(28rem,55vh)]" : "absolute z-20 max-h-72 shadow-lg",
            compacto && !listaEnLinea && "min-w-[18rem]"
          )}
        >
          <li className="px-3 pb-1 pt-1.5 text-xs text-gray-400">
            {filtradas.length} de {opciones.length} opciones
          </li>
          <li>
            <button
              type="button"
              onClick={() => elegir(null)}
              className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-emerald-50"
            >
              {placeholder}
            </button>
          </li>

          {filtradas.length === 0 && (
            <li className="px-3 py-2 text-sm text-gray-400">Sin coincidencias.</li>
          )}

          {conSugeridas && listaSugeridas.length > 0 && (
            <>
              {titulo(tituloSugeridas)}
              {listaSugeridas.map(renglon)}
            </>
          )}

          {conSugeridas && !mostrarOtras && otras.length > 0 && (
            <li className="border-t border-gray-100">
              <button
                type="button"
                onClick={() => setVerTodas(true)}
                className="w-full px-3 py-2 text-left text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                {textoVerTodas} ({opciones.length}) ▾
              </button>
            </li>
          )}

          {mostrarOtras && otras.length > 0 && (
            <>
              {conSugeridas && (
                <li className="border-t border-gray-100" aria-hidden="true" />
              )}
              {conSugeridas && titulo("Otras opciones")}
              {otras.map(renglon)}
            </>
          )}
        </ul>
      )}
    </div>
  );
};

export default FiltroBuscable;
