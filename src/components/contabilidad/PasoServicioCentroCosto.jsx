import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, List, Plus } from "lucide-react";

import CampoTexto from "@/components/contabilidad/CampoTexto";
import { validarNuevoCatalogo } from "@/components/contabilidad/catalogoNuevo";
import FiltroBuscable from "@/components/contabilidad/FiltroBuscable";
import { cn } from "@/lib/utils";

const SERVICIO_NUEVO_INICIAL = { codigo: "", nombre: "" };
// Formato habitual de Synergy: cuatro dígitos y letras (0601PISC).
const FORMATO_SERVICIO = { patron: /^[0-9]{4}[A-Z]+$/, ejemplo: "0109XXX" };

const MODOS = [
  { valor: "lista", titulo: "Servicio existente", icono: List },
  { valor: "nuevo", titulo: "Servicio nuevo", icono: Plus },
];

/**
 * Paso 5 de Crear: servicio asociado (CEN 5). Un servicio puede usarse en
 * varias líneas, así que no se filtra de forma estricta: primero se muestran
 * los que ya se usan con la línea elegida (CEN 4) y, con la casilla, todos los
 * demás. También se puede registrar un servicio nuevo (código y nombre).
 * `onChange({ codigo, nombre, nuevo } | null)` informa el servicio listo.
 *
 * El padre lo monta con una `key` por línea para reiniciarlo al cambiarla.
 */
const PasoServicioCentroCosto = ({ servicios, cen4, nombreLinea, onChange }) => {
  const [modo, setModo] = useState("lista");
  const [idServicio, setIdServicio] = useState("");
  const [verTodos, setVerTodos] = useState(false);
  const [servicioNuevo, setServicioNuevo] = useState(SERVICIO_NUEVO_INICIAL);

  const conLinea = useMemo(
    () =>
      servicios
        .filter((s) => s.lineas?.[cen4])
        .sort((a, b) => b.lineas[cen4] - a.lineas[cen4]),
    [servicios, cen4]
  );

  // Si la línea no tiene servicios usados (p. ej. es nueva), se muestran todos.
  const mostrarTodos = verTodos || conLinea.length === 0;

  const opciones = useMemo(() => {
    const otros = servicios.filter((s) => !s.lineas?.[cen4]);
    const lista = mostrarTodos ? [...conLinea, ...otros] : conLinea;

    return lista.map((s) => {
      const usadas = Object.keys(s.lineas || {});

      return {
        id: s.id,
        etiqueta: `${s.nombre} (${s.codigo})`,
        detalle: s.lineas?.[cen4]
          ? `Usado en ${s.lineas[cen4]} centro(s) con ${cen4}`
          : usadas.length > 0
            ? `Usado con ${usadas.join(", ")}`
            : "Todavía sin centros",
        busqueda: s.codigo,
      };
    });
  }, [servicios, cen4, conLinea, mostrarTodos]);

  const nuevo = validarNuevoCatalogo(servicios, servicioNuevo, FORMATO_SERVICIO);
  const existente = servicios.find((s) => String(s.id) === String(idServicio));

  const elegido =
    modo === "nuevo"
      ? nuevo.completo
        ? { codigo: nuevo.codigo, nombre: nuevo.nombre, nuevo: true }
        : null
      : existente
        ? { codigo: existente.codigo, nombre: existente.nombre, nuevo: false }
        : null;

  useEffect(() => {
    onChange(elegido);
    // onChange cambia en cada render del padre; solo importa el servicio elegido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elegido?.codigo, elegido?.nombre]);

  // Al cambiar entre existente y nuevo se borra lo diligenciado en ambos.
  const elegirModo = (valor) => {
    setModo(valor);
    setIdServicio("");
    setVerTodos(false);
    setServicioNuevo(SERVICIO_NUEVO_INICIAL);
  };

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap gap-2">
        {MODOS.map(({ valor, titulo, icono: Icono }) => (
          <button
            key={valor}
            type="button"
            onClick={() => elegirModo(valor)}
            aria-pressed={modo === valor}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              modo === valor
                ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100"
                : "border-gray-200 text-gray-600 hover:border-emerald-300"
            )}
          >
            <Icono className="h-4 w-4" />
            {titulo}
          </button>
        ))}
      </div>

      {modo === "lista" ? (
        <>
          <p className="text-sm text-gray-500">
            {conLinea.length > 0
              ? `${conLinea.length} servicio(s) se usan hoy con ${nombreLinea} (${cen4}), ordenados por cantidad de centros.`
              : `Ningún centro usa todavía la línea ${cen4}; se muestran todos los servicios.`}
          </p>

          {conLinea.length > 0 && (
            <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={verTodos}
                onChange={(e) => {
                  setVerTodos(e.target.checked);
                  setIdServicio("");
                }}
                className="h-4 w-4 accent-emerald-600"
              />
              Mostrar también los {servicios.length - conLinea.length} servicio(s) de otras líneas
            </label>
          )}

          <FiltroBuscable
            id="crearServicio"
            label="Buscar servicio"
            opciones={opciones}
            valor={idServicio}
            onChange={setIdServicio}
            placeholder="Sin seleccionar"
            listaEnLinea
          />
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CampoTexto
              id="nuevoServicioCodigo"
              label="Código del servicio (CEN 5)"
              valor={servicioNuevo.codigo}
              onChange={(v) =>
                setServicioNuevo((prev) => ({ ...prev, codigo: v.toUpperCase().replace(/\s/g, "") }))
              }
              placeholder="Escribe el código de Synergy"
              maxLength={20}
              error={nuevo.errores.codigo}
              ayuda="Debe coincidir con Synergy; los actuales son cuatro dígitos y letras."
            />
            <CampoTexto
              id="nuevoServicioNombre"
              label="Nombre del servicio"
              valor={servicioNuevo.nombre}
              onChange={(v) => setServicioNuevo((prev) => ({ ...prev, nombre: v }))}
              placeholder="P. ej. Fumigación"
              maxLength={200}
              error={nuevo.errores.nombre}
            />
          </div>

          {nuevo.aviso && !nuevo.errores.codigo && (
            <p className="flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {nuevo.aviso}
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default PasoServicioCentroCosto;
