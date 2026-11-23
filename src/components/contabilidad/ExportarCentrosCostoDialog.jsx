import React, { useMemo, useState } from "react";
import { saveAs } from "file-saver";
import { Check, ChevronDown, FileSpreadsheet, Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { exportarCentrosCosto } from "@/services/contabilidadService";

const ESTADOS = [
  { valor: "", etiqueta: "Todos" },
  { valor: "ABIERTO", etiqueta: "Abiertos" },
  { valor: "CERRADO", etiqueta: "Cerrados" },
];

const CLASE_CAMPO =
  "flex h-10 w-full items-center justify-between gap-2 rounded-full border border-gray-200 bg-white px-4 text-left text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

const Casilla = ({ marcada }) => (
  <span
    className={cn(
      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
      marcada ? "border-emerald-600 bg-emerald-600 text-white" : "border-gray-300 bg-white"
    )}
  >
    {marcada && <Check className="h-3 w-3" />}
  </span>
);

/**
 * Descarga en Excel de los centros de costo con su asignación vigente y el
 * total de horas de recargo. Pregunta el estado (todos, abiertos o cerrados) y
 * los clientes (todos o los que se marquen) con listas desplegables. Parte de
 * los filtros de la consulta.
 */
const ExportarCentrosCostoDialog = ({ abierto, onClose, proyectos, estadoInicial, idProyectoInicial }) => {
  const [estado, setEstado] = useState(["ABIERTO", "CERRADO"].includes(estadoInicial) ? estadoInicial : "");
  // Vacío = todos los clientes.
  const [elegidos, setElegidos] = useState(() => (idProyectoInicial ? [String(idProyectoInicial)] : []));
  const [listaAbierta, setListaAbierta] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [descargando, setDescargando] = useState(false);

  const texto = busqueda.trim().toLowerCase();
  const lista = useMemo(
    () =>
      (proyectos || []).filter(
        (p) => !texto || `${p.codigo} ${p.cliente} ${p.nombre} ${p.nit}`.toLowerCase().includes(texto)
      ),
    [proyectos, texto]
  );

  const alternar = (id) =>
    setElegidos((actuales) => (actuales.includes(id) ? actuales.filter((x) => x !== id) : [...actuales, id]));

  const nombreElegido = (id) => {
    const p = (proyectos || []).find((x) => String(x.id) === id);
    return p ? `${p.cliente} (${p.codigo})` : id;
  };

  const resumenClientes =
    elegidos.length === 0
      ? "Todos los clientes"
      : elegidos.length === 1
        ? nombreElegido(elegidos[0])
        : `${elegidos.length} clientes seleccionados`;

  const descargar = async () => {
    setDescargando(true);

    try {
      const { blob, nombre } = await exportarCentrosCosto({ estado: estado || null, idProyectos: elegidos });
      saveAs(blob, nombre);
      toast({ title: "Excel generado", description: nombre });
      onClose();
    } catch (error) {
      toast({ title: "No se pudo generar el Excel", description: error.message, variant: "destructive" });
    } finally {
      setDescargando(false);
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-xl flex-col gap-0 overflow-hidden rounded-3xl border-t-4 border-emerald-600 bg-white p-0 sm:rounded-3xl">
        <DialogHeader className="border-b border-gray-100 px-6 pb-3 pt-6 pr-12 text-left">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <FileSpreadsheet className="h-5 w-5 text-emerald-700" />
            Descargar Excel
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Centros de costo con su asignación vigente y el total de horas de recargo por semana. Los
            centros sin asignación también aparecen.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="space-y-1">
            <label htmlFor="exportarEstado" className="text-xs font-bold uppercase text-gray-700">
              Centros de costo
            </label>
            <div className="relative">
              <select
                id="exportarEstado"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className={cn(CLASE_CAMPO, "cursor-pointer appearance-none pr-10")}
              >
                {ESTADOS.map((e) => (
                  <option key={e.etiqueta} value={e.valor}>
                    {e.etiqueta}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold uppercase text-gray-700">Clientes</p>
            <button
              id="exportarClientesCampo"
              type="button"
              onClick={() => setListaAbierta((v) => !v)}
              aria-expanded={listaAbierta}
              className={cn(CLASE_CAMPO, listaAbierta && "border-emerald-400 ring-2 ring-emerald-100")}
            >
              <span className="truncate text-gray-800">{resumenClientes}</span>
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-gray-400 transition-transform", listaAbierta && "rotate-180")} />
            </button>

            {/* La lista se despliega dentro de la ventana para no quedar recortada. */}
            {listaAbierta && (
              <div className="space-y-2 rounded-2xl border border-gray-200 p-2 shadow-sm">
                <div className="flex h-9 items-center gap-2 rounded-full border border-gray-200 px-3 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100">
                  <Search className="h-4 w-4 shrink-0 text-gray-400" />
                  <input
                    id="exportarBuscarCliente"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar cliente, código o NIT"
                    className="h-full w-full bg-transparent text-sm outline-none"
                  />
                </div>
                <ul id="exportarClientes" className="max-h-60 divide-y divide-gray-100 overflow-y-auto">
                  {!texto && (
                    <li>
                      <button
                        type="button"
                        onClick={() => setElegidos([])}
                        aria-pressed={elegidos.length === 0}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-emerald-50/60",
                          elegidos.length === 0 && "bg-emerald-50"
                        )}
                      >
                        <Casilla marcada={elegidos.length === 0} />
                        Todos los clientes
                      </button>
                    </li>
                  )}
                  {lista.map((p) => {
                    const marcado = elegidos.includes(String(p.id));
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => alternar(String(p.id))}
                          aria-pressed={marcado}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-emerald-50/60",
                            marcado && "bg-emerald-50"
                          )}
                        >
                          <Casilla marcada={marcado} />
                          <span className="min-w-0">
                            <span className="block truncate text-gray-800">
                              {p.cliente} <span className="font-mono text-xs font-bold text-emerald-800">({p.codigo})</span>
                            </span>
                            <span className="block text-xs text-gray-500">NIT {p.nit}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                  {lista.length === 0 && <li className="px-3 py-3 text-sm text-gray-500">Ningún cliente coincide.</li>}
                </ul>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setListaAbierta(false)}
                    className="rounded-full px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                  >
                    Listo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-6 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={descargando} className="rounded-full">
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={descargar}
            disabled={descargando}
            className="rounded-full bg-emerald-600 hover:bg-emerald-700"
          >
            {descargando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
            {descargando ? "Generando..." : "Descargar Excel"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportarCentrosCostoDialog;
