import React, { useEffect, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

/**
 * Campo de búsqueda con lista de resultados para elegir un elemento.
 * `buscar(texto)` puede consultar la API o filtrar una lista ya cargada;
 * puede devolver la lista directamente o una promesa.
 * `motivoNoSeleccionable(elemento)` (opcional) devuelve un texto si el
 * resultado no se puede elegir; se muestra deshabilitado con ese motivo.
 */
const BuscadorSeleccion = ({
  id,
  label,
  seleccionado,
  onSeleccionar,
  buscar,
  obtenerClave,
  textoPrincipal,
  textoSecundario = () => "",
  placeholder,
  mensajeSinResultados = "No se encontraron resultados.",
  minCaracteres = 3,
  esperaMs = 400,
  disabled = false,
  motivoNoSeleccionable = () => null,
}) => {
  const [criterio, setCriterio] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);

  // Se usa la versión más reciente de `buscar` sin reiniciar la búsqueda
  // cada vez que el componente padre se vuelve a pintar.
  const buscarRef = useRef(buscar);
  buscarRef.current = buscar;

  // Si el formulario padre limpia la selección, el buscador vuelve a vacío.
  useEffect(() => {
    if (!seleccionado) {
      setCriterio("");
      setResultados([]);
      setBuscado(false);
    }
  }, [seleccionado]);

  useEffect(() => {
    const texto = criterio.trim();

    setBuscado(false);

    if (texto.length < minCaracteres || seleccionado) {
      setResultados([]);
      return undefined;
    }

    let vigente = true;

    const temporizador = setTimeout(() => {
      setBuscando(true);

      Promise.resolve(buscarRef.current(texto))
        .then((lista) => {
          if (vigente) {
            setResultados(lista);
            setBuscado(true);
          }
        })
        .catch((error) =>
          toast({
            title: "No se pudo realizar la búsqueda",
            description: error.message,
            variant: "destructive",
          })
        )
        .finally(() => {
          if (vigente) {
            setBuscando(false);
          }
        });
    }, esperaMs);

    return () => {
      vigente = false;
      clearTimeout(temporizador);
    };
  }, [criterio, seleccionado, minCaracteres, esperaMs]);

  if (seleccionado) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>

        <div className="flex h-11 items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white px-4">
          <p className="min-w-0 truncate text-sm">
            <span className="font-semibold text-gray-800">
              {textoPrincipal(seleccionado)}
            </span>
            {textoSecundario(seleccionado) && (
              <span className="ml-2 text-gray-500">
                {textoSecundario(seleccionado)}
              </span>
            )}
          </p>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onSeleccionar(null)}
            disabled={disabled}
            title="Cambiar selección"
            className="h-8 w-8 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

        <Input
          id={id}
          value={criterio}
          onChange={(e) => setCriterio(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
          autoComplete="off"
          disabled={disabled}
        />

        {buscando && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-600" />
        )}
      </div>

      {/* La lista ocupa espacio dentro de la tarjeta (no flota): así el
          contenedor crece con los resultados y no queda recortada por los
          contenedores con overflow oculto del layout. */}
      {resultados.length > 0 && (
        <ul className="max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-md">
          {resultados.map((elemento) => {
            const motivo = motivoNoSeleccionable(elemento);

            return (
              <li key={obtenerClave(elemento)}>
                <button
                  type="button"
                  disabled={Boolean(motivo)}
                  title={motivo || undefined}
                  onClick={() => {
                    onSeleccionar(elemento);
                    setResultados([]);
                  }}
                  className={
                    motivo
                      ? "w-full cursor-not-allowed bg-gray-50 px-4 py-2 text-left text-sm opacity-70"
                      : "w-full px-4 py-2 text-left text-sm hover:bg-emerald-50"
                  }
                >
                  <span className="font-medium text-gray-800">
                    {textoPrincipal(elemento)}
                  </span>
                  {textoSecundario(elemento) && (
                    <span className="ml-2 text-gray-500">
                      {textoSecundario(elemento)}
                    </span>
                  )}
                  {motivo && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      {motivo}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {buscado && resultados.length === 0 && (
        <p className="text-xs text-gray-500">{mensajeSinResultados}</p>
      )}
    </div>
  );
};

export default BuscadorSeleccion;
