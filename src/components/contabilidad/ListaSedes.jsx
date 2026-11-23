import React, { useMemo, useState } from "react";
import { Building, Search } from "lucide-react";

import { cn } from "@/lib/utils";

// Una sede está abierta si tiene al menos un centro de costo abierto.
export const sedeAbierta = (s) => s.abiertos > 0;

const FILTROS_ESTADO = [
  { valor: "todas", etiqueta: "Todas" },
  { valor: "abiertas", etiqueta: "Abiertas" },
  { valor: "cerradas", etiqueta: "Cerradas" },
];

/**
 * Sedes (CEN 3) en tarjetas con su estado (abierta / cerrada), buscador y
 * filtro por estado; primero las abiertas. Un clic elige la sede y otro la quita.
 * `sedes`: [{ id, codigo, descripcion, detalle, abiertos, busqueda? }].
 */
const ListaSedes = ({ id, sedes, valor, onChange, placeholder = "Buscar por código o descripción" }) => {
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const texto = busqueda.trim().toLowerCase();

  const lista = useMemo(
    () =>
      sedes
        .filter((s) => filtroEstado === "todas" || (filtroEstado === "abiertas") === sedeAbierta(s))
        .filter(
          (s) =>
            !texto ||
            `${s.codigo} ${s.descripcion || ""} ${s.busqueda || ""}`.toLowerCase().includes(texto)
        )
        .sort((a, b) => sedeAbierta(b) - sedeAbierta(a) || a.codigo.localeCompare(b.codigo)),
    [sedes, filtroEstado, texto]
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex h-9 flex-1 items-center gap-2 rounded-full border border-gray-200 px-3 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            id={id}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={placeholder}
            className="h-full w-full bg-transparent text-sm outline-none"
          />
        </div>
        <div className="flex gap-1">
          {FILTROS_ESTADO.map(({ valor: estado, etiqueta }) => (
            <button
              key={estado}
              type="button"
              onClick={() => setFiltroEstado(estado)}
              aria-pressed={filtroEstado === estado}
              className={cn(
                "h-9 rounded-full border px-3 text-sm transition-colors",
                filtroEstado === estado
                  ? "border-emerald-500 bg-emerald-50 font-semibold text-emerald-800"
                  : "border-gray-200 text-gray-600 hover:border-emerald-300"
              )}
            >
              {etiqueta}
            </button>
          ))}
        </div>
      </div>

      {lista.length === 0 ? (
        <p className="text-sm text-gray-500">Ninguna sede coincide con la búsqueda.</p>
      ) : (
        <div
          id={`${id}-lista`}
          className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3"
        >
          {lista.map((s) => {
            const elegida = String(s.id) === String(valor);
            const abierta = sedeAbierta(s);

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onChange(elegida ? "" : String(s.id))}
                aria-pressed={elegida}
                className={cn(
                  "flex items-start gap-2 rounded-2xl border px-3 py-2 text-left transition-colors",
                  elegida
                    ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100"
                    : "border-gray-200 hover:border-emerald-300"
                )}
              >
                <Building
                  className={cn("mt-0.5 h-4 w-4 shrink-0", elegida ? "text-emerald-700" : "text-gray-400")}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold text-gray-800">{s.codigo}</span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-xs font-bold",
                        abierta ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {abierta ? "Abierta" : "Cerrada"}
                    </span>
                  </span>
                  <span className="block truncate text-sm text-gray-700" title={s.descripcion}>
                    {s.descripcion}
                  </span>
                  {s.detalle && (
                    <span className="block truncate text-xs text-gray-500" title={s.detalle}>
                      {s.detalle}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ListaSedes;
