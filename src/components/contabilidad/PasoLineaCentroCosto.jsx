import React, { useEffect, useState } from "react";
import { AlertTriangle, Briefcase, Plus } from "lucide-react";

import CampoTexto from "@/components/contabilidad/CampoTexto";
import { validarNuevoCatalogo } from "@/components/contabilidad/catalogoNuevo";
import { cn } from "@/lib/utils";

// Valor de la selección cuando se va a registrar una línea nueva.
const LINEA_NUEVA = "nueva";
const LINEA_NUEVA_INICIAL = { codigo: "", nombre: "" };
// Formato habitual de Synergy: dos dígitos y letras (01ASGE).
const FORMATO_LINEA = { patron: /^[0-9]{2}[A-Z]+$/, ejemplo: "12ASXX" };

/**
 * Paso 4 de Crear: línea de negocio (CEN 4). Se elige del catálogo de Synergy
 * o se registra una nueva (código y nombre). `lineasSede` ({ código: centros })
 * marca las líneas que ya tiene la sede elegida; es null para una sede nueva.
 * `onChange({ codigo, nombre, nueva } | null)` informa la línea lista.
 */
const PasoLineaCentroCosto = ({ lineas, codigoSede, lineasSede, onChange }) => {
  const [seleccion, setSeleccion] = useState("");
  const [lineaNueva, setLineaNueva] = useState(LINEA_NUEVA_INICIAL);

  const usadas = lineasSede ? Object.keys(lineasSede).length : 0;
  const nueva = validarNuevoCatalogo(lineas, lineaNueva, FORMATO_LINEA);
  const existente = lineas.find((l) => String(l.id) === String(seleccion));

  const elegida =
    seleccion === LINEA_NUEVA
      ? nueva.completo
        ? { codigo: nueva.codigo, nombre: nueva.nombre, nueva: true }
        : null
      : existente
        ? { codigo: existente.codigo, nombre: existente.nombre, nueva: false }
        : null;

  useEffect(() => {
    onChange(elegida);
    // onChange cambia en cada render del padre; solo importa la línea elegida.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elegida?.codigo, elegida?.nombre]);

  // Un segundo clic sobre la misma opción la deselecciona.
  const elegir = (valor) => {
    setSeleccion((actual) => (actual === valor ? "" : valor));
    setLineaNueva(LINEA_NUEVA_INICIAL);
  };

  return (
    <>
      <p className="mt-1 text-sm text-gray-500">
        {lineasSede
          ? usadas > 0
            ? `El número indica cuántos centros tiene ya la sede ${codigoSede} en esa línea.`
            : `La sede ${codigoSede} todavía no tiene centros en ninguna línea.`
          : "Es una sede nueva; todavía no tiene líneas de negocio."}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {lineas.map((linea) => {
          const activa = String(linea.id) === String(seleccion);
          const centros = lineasSede?.[linea.codigo];

          return (
            <button
              key={linea.id}
              type="button"
              onClick={() => elegir(String(linea.id))}
              aria-pressed={activa}
              className={cn(
                "flex items-center gap-2 rounded-2xl border px-3 py-2 text-left transition-colors",
                activa
                  ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100"
                  : "border-gray-200 hover:border-emerald-300"
              )}
            >
              <Briefcase
                className={cn("h-4 w-4 shrink-0", activa ? "text-emerald-700" : "text-gray-400")}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-gray-800">{linea.nombre}</span>
                <span className="block font-mono text-xs text-gray-500">{linea.codigo}</span>
              </span>
              {centros && (
                <span
                  title={`${centros} centro(s) de la sede ${codigoSede} en ${linea.nombre}`}
                  className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800"
                >
                  {centros}
                </span>
              )}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => elegir(LINEA_NUEVA)}
          aria-pressed={seleccion === LINEA_NUEVA}
          className={cn(
            "flex items-center gap-2 rounded-2xl border border-dashed px-3 py-2 text-left text-sm font-semibold transition-colors",
            seleccion === LINEA_NUEVA
              ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100"
              : "border-gray-300 text-gray-600 hover:border-emerald-300"
          )}
        >
          <Plus className="h-4 w-4 shrink-0" />
          Nueva línea de negocio
        </button>
      </div>

      {seleccion === LINEA_NUEVA && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CampoTexto
              id="nuevaLineaCodigo"
              label="Código de la línea (CEN 4)"
              valor={lineaNueva.codigo}
              onChange={(v) =>
                setLineaNueva((prev) => ({ ...prev, codigo: v.toUpperCase().replace(/\s/g, "") }))
              }
              placeholder="Escribe el código de Synergy"
              maxLength={20}
              error={nueva.errores.codigo}
              ayuda="Debe coincidir con Synergy; las actuales son dos dígitos y letras."
            />
            <CampoTexto
              id="nuevaLineaNombre"
              label="Nombre de la línea"
              valor={lineaNueva.nombre}
              onChange={(v) => setLineaNueva((prev) => ({ ...prev, nombre: v }))}
              placeholder="P. ej. Seguridad y vigilancia"
              maxLength={200}
              error={nueva.errores.nombre}
            />
          </div>

          {nueva.aviso && !nueva.errores.codigo && (
            <p className="flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {nueva.aviso}
            </p>
          )}
        </div>
      )}
    </>
  );
};

export default PasoLineaCentroCosto;
