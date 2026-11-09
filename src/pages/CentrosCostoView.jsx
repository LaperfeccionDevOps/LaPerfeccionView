import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Calculator,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Lock,
  PencilLine,
  RotateCcw,
  Search,
  Unlock,
  UserPlus,
  X,
} from "lucide-react";

import AsignacionCentroCostoDialog from "@/components/contabilidad/AsignacionCentroCostoDialog";
import DetalleCentroCostoDialog from "@/components/contabilidad/DetalleCentroCostoDialog";
import EncabezadoCentrosCosto from "@/components/contabilidad/EncabezadoCentrosCosto";
import FiltroBuscable from "@/components/contabilidad/FiltroBuscable";
import TableroAsignaciones, { Indicador } from "@/components/contabilidad/TableroAsignaciones";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  consultarCentrosCosto,
  obtenerFiltrosCentrosCosto,
} from "@/services/contabilidadService";

const TAMANO_PAGINA = 50;

const FILTROS_INICIALES = {
  idProyecto: "",
  idDepartamento: "",
  idSede: "",
  idLinea: "",
  idServicio: "",
  estado: "",
  pendienteRevision: "",
  texto: "",
};

const ESTADOS = {
  ABIERTO: "bg-emerald-100 text-emerald-800",
  CERRADO: "bg-gray-100 text-gray-700",
};

// La flecha del navegador se oculta (appearance-none) y se dibuja la misma de
// los filtros con búsqueda, en la misma posición, para que todos queden alineados.
// Con un valor elegido se resalta en verde (filtro aplicado) y la flecha se
// cambia por una ✕ para quitarlo.
const SelectFiltro = ({ id, label, valor, onChange, children }) => (
  <div className="min-w-0 space-y-1">
    <label htmlFor={id} title={label} className="block truncate text-xs font-bold uppercase text-gray-700">
      {label}
    </label>
    <div className="relative">
      <select
        id={id}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 w-full cursor-pointer appearance-none truncate rounded-full border pl-3 pr-9 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100",
          // Sin valor, en gris como el texto de ayuda de los demás filtros; las opciones de la lista en oscuro.
          valor
            ? "border-emerald-500 bg-emerald-50/60 text-gray-800 ring-1 ring-emerald-200"
            : "border-gray-200 bg-white text-gray-400",
          "[&>option]:text-gray-800"
        )}
      >
        {children}
      </select>
      {valor ? (
        <button
          type="button"
          title="Quitar filtro"
          aria-label={`Quitar filtro ${label}`}
          onClick={() => onChange("")}
          className="absolute right-[10px] top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      ) : (
        <ChevronDown className="pointer-events-none absolute right-[14px] top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      )}
    </div>
  </div>
);

// Lo que cambia entre las pestañas Consultar (solo ver), Modificar (cerrar o
// reabrir) y Asignar (operarios): textos, botón de cada fila, ventana que abre
// y el estado con el que inicia el filtro.
const MODOS = {
  consultar: {
    descripcion:
      "Consulta de los centros de costo por cliente, servicio y línea de negocio. Las fechas de apertura y cierre se ven en el detalle.",
    boton: "Ver",
    icono: Eye,
    permitirCambioEstado: false,
    // Tablero de operarios asignados sobre la tabla.
    tablero: true,
  },
  modificar: {
    descripcion:
      "Busca con los filtros el centro de costo y usa Modificar para cerrarlo o reabrirlo.",
    boton: "Modificar",
    icono: PencilLine,
    permitirCambioEstado: true,
  },
  asignar: {
    descripcion:
      "Busca con los filtros el centro de costo y usa Asignar para registrar sus operarios, días y horarios.",
    boton: "Asignar",
    icono: UserPlus,
    permitirCambioEstado: false,
    // Solo los abiertos admiten asignación; el filtro se puede cambiar.
    estadoInicial: "ABIERTO",
    asignacion: true,
  },
};

/**
 * Contabilidad > Centros de costo: búsqueda con filtros por proyecto
 * (cliente), servicio asociado, línea de negocio, departamento y estado.
 * La usan las pestañas Consultar, Modificar y Asignar (`modo`).
 */
const CentrosCostoView = ({ modo = "consultar" }) => {
  const configuracion = MODOS[modo];
  const IconoBoton = configuracion.icono;
  const filtrosIniciales = { ...FILTROS_INICIALES, estado: configuracion.estadoInicial || "" };
  const [catalogos, setCatalogos] = useState(null);
  const [filtros, setFiltros] = useState(filtrosIniciales);
  // La búsqueda libre se aplica unos instantes después de dejar de escribir.
  const [textoAplicado, setTextoAplicado] = useState("");
  const [pagina, setPagina] = useState(1);
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(true);
  // Centro abierto en el detalle y contador para recargar tras cerrar/reabrir.
  const [idDetalle, setIdDetalle] = useState(null);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    obtenerFiltrosCentrosCosto()
      .then(setCatalogos)
      .catch((error) =>
        toast({
          title: "No se pudieron cargar los filtros",
          description: error.message,
          variant: "destructive",
        })
      );
  }, []);

  useEffect(() => {
    const espera = setTimeout(() => setTextoAplicado(filtros.texto), 400);
    return () => clearTimeout(espera);
  }, [filtros.texto]);

  useEffect(() => {
    let vigente = true;
    setCargando(true);

    consultarCentrosCosto({
      ...filtros,
      texto: textoAplicado,
      pagina,
      tamanoPagina: TAMANO_PAGINA,
    })
      .then((datos) => vigente && setResultado(datos))
      .catch(
        (error) =>
          vigente &&
          toast({
            title: "No se pudieron consultar los centros de costo",
            description: error.message,
            variant: "destructive",
          })
      )
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
    // El texto se consulta con su versión aplicada (textoAplicado).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filtros.idProyecto,
    filtros.idServicio,
    filtros.idLinea,
    filtros.idDepartamento,
    filtros.idSede,
    filtros.estado,
    filtros.pendienteRevision,
    textoAplicado,
    pagina,
    recarga,
  ]);

  const cambiarFiltro = (campo, valor) => {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor,
      // La sede depende del proyecto: al cambiar el proyecto se quita.
      ...(campo === "idProyecto" ? { idSede: "" } : {}),
    }));
    setPagina(1);
  };

  // Hay filtros cuando difieren de los iniciales del modo (en Asignar, "Abierto").
  const hayFiltros = Object.keys(filtros).some((campo) => filtros[campo] !== filtrosIniciales[campo]);

  // Filtros dinámicos: cada filtro muestra solo las opciones con centros según
  // los demás filtros (la API no limita un filtro por sí mismo) y cuántos hay.
  // Se conserva la opción elegida aunque quede sin centros, para poder quitarla.
  const disponibles = resultado?.disponibles;
  const conCentros = (faceta, lista, elegido) =>
    disponibles
      ? lista.filter((o) => disponibles[faceta][String(o.id)] || String(o.id) === String(elegido))
      : lista;
  const cantidad = (faceta, id) => disponibles?.[faceta][String(id)] || 0;
  const textoCantidad = (faceta, id) => (disponibles ? ` · ${cantidad(faceta, id)}` : "");

  const opcionesProyecto = useMemo(
    () =>
      conCentros("proyectos", catalogos?.proyectos || [], filtros.idProyecto).map((p) => ({
        id: p.id,
        etiqueta: `${p.nombre} (${p.codigo})`,
        corta: p.codigo,
        detalle: `${p.cliente} · NIT ${p.nit}${disponibles ? ` · ${cantidad("proyectos", p.id)} centro(s)` : ""}`,
        busqueda: `${p.codigo} ${p.nit}`,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [catalogos, disponibles, filtros.idProyecto]
  );

  const opcionesSede = useMemo(
    () =>
      conCentros("sedes", catalogos?.sedes || [], filtros.idSede).map((s) => ({
        id: s.id,
        etiqueta: `${s.codigo} · ${s.nombre}`,
        corta: s.codigo,
        detalle: disponibles ? `${cantidad("sedes", s.id)} centro(s)` : undefined,
        busqueda: s.codigo,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [catalogos, disponibles, filtros.idSede]
  );

  const opcionesServicio = useMemo(
    () =>
      conCentros("servicios", catalogos?.servicios || [], filtros.idServicio).map((s) => ({
        id: s.id,
        etiqueta: s.nombre,
        corta: s.codigo,
        detalle: `${s.codigo}${disponibles ? ` · ${cantidad("servicios", s.id)} centro(s)` : ""}`,
        busqueda: s.codigo,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [catalogos, disponibles, filtros.idServicio]
  );

  const totalPaginas = resultado
    ? Math.max(1, Math.ceil(resultado.total / TAMANO_PAGINA))
    : 1;

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 overflow-x-hidden"
    >
      <EncabezadoCentrosCosto descripcion={configuracion.descripcion}>

        {/* Filtros en el orden de la codificación (CEN 1 a CEN 5), luego estado y revisión. */}
        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
          <FiltroBuscable
            id="filtroProyecto"
            label="Cliente · CEN 1"
            opciones={opcionesProyecto}
            valor={filtros.idProyecto}
            onChange={(v) => cambiarFiltro("idProyecto", v)}
            placeholder="Ninguno"
            disabled={!catalogos}
            compacto
          />

          <SelectFiltro
            id="filtroDepartamento"
            label="Depto. · CEN 2"
            valor={filtros.idDepartamento}
            onChange={(v) => cambiarFiltro("idDepartamento", v)}
          >
            <option value="">Ninguno</option>
            {conCentros("departamentos", catalogos?.departamentos || [], filtros.idDepartamento).map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre} ({d.codigo}){textoCantidad("departamentos", d.id)}
              </option>
            ))}
          </SelectFiltro>

          <FiltroBuscable
            id="filtroSede"
            label="Sede · CEN 3"
            opciones={opcionesSede}
            valor={filtros.idSede}
            onChange={(v) => cambiarFiltro("idSede", v)}
            placeholder="Ninguno"
            disabled={!catalogos}
            compacto
          />

          <SelectFiltro
            id="filtroLinea"
            label="Línea · CEN 4"
            valor={filtros.idLinea}
            onChange={(v) => cambiarFiltro("idLinea", v)}
          >
            <option value="">Ninguno</option>
            {conCentros("lineas", catalogos?.lineas || [], filtros.idLinea).map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre} ({l.codigo}){textoCantidad("lineas", l.id)}
              </option>
            ))}
          </SelectFiltro>

          <FiltroBuscable
            id="filtroServicio"
            label="Servicio · CEN 5"
            opciones={opcionesServicio}
            valor={filtros.idServicio}
            onChange={(v) => cambiarFiltro("idServicio", v)}
            placeholder="Ninguno"
            disabled={!catalogos}
            compacto
          />

          <SelectFiltro
            id="filtroEstado"
            label="Estado"
            valor={filtros.estado}
            onChange={(v) => cambiarFiltro("estado", v)}
          >
            <option value="">Ninguno</option>
            <option value="ABIERTO">Abiertos{textoCantidad("estados", "ABIERTO")}</option>
            <option value="CERRADO">Cerrados{textoCantidad("estados", "CERRADO")}</option>
          </SelectFiltro>

          {/* Se quitará cuando Contabilidad resuelva todos los pendientes de revisión. */}
          <SelectFiltro
            id="filtroRevision"
            label="Revisión"
            valor={filtros.pendienteRevision}
            onChange={(v) => cambiarFiltro("pendienteRevision", v)}
          >
            <option value="">Ninguno</option>
            <option value="true">Pendientes{textoCantidad("revision", "true")}</option>
            <option value="false">Sin pendientes{textoCantidad("revision", "false")}</option>
          </SelectFiltro>
        </div>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label htmlFor="busquedaCentros" className="text-xs font-bold uppercase text-gray-700">
              Buscar
            </label>
            <div
              className={cn(
                "flex h-9 items-center gap-2 rounded-full border px-3 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100",
                filtros.texto.trim() ? "border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-200" : "border-gray-200"
              )}
            >
              <Search className="h-4 w-4 shrink-0 text-gray-400" />
              <input
                id="busquedaCentros"
                type="text"
                value={filtros.texto}
                onChange={(e) => cambiarFiltro("texto", e.target.value)}
                placeholder="NIT, cliente, código o nombre de proyecto o sede"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={!hayFiltros}
            onClick={() => {
              setFiltros(filtrosIniciales);
              setPagina(1);
            }}
            className="h-9 gap-2 rounded-full"
          >
            <RotateCcw className="h-4 w-4" />
            Limpiar filtros
          </Button>
        </div>
      </EncabezadoCentrosCosto>

      {/* Resumen del resultado filtrado y, en Consultar, el tablero de operarios. */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Indicador etiqueta="Centros de costo" valor={resultado?.resumen.total} icono={Calculator} clase="bg-emerald-50 text-emerald-700" />
          <Indicador etiqueta="Abiertos" valor={resultado?.resumen.abiertos} claseValor="text-emerald-700" icono={Unlock} clase="bg-emerald-100 text-emerald-700" />
          <Indicador etiqueta="Cerrados" valor={resultado?.resumen.cerrados} claseValor="text-gray-600" icono={Lock} clase="bg-gray-100 text-gray-600" />
          <Indicador etiqueta="Pendientes de revisión" valor={resultado?.resumen.pendientes_revision} claseValor="text-amber-600" icono={AlertTriangle} clase="bg-amber-100 text-amber-600" />
        </div>

        {configuracion.tablero && <TableroAsignaciones asignacion={resultado?.resumen.asignacion} />}
      </div>

      <section className="w-full min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow-xl sm:p-6">
        {cargando && !resultado ? (
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando centros de costo...
          </p>
        ) : resultado?.centros.length === 0 ? (
          <p className="text-sm text-gray-500">
            No hay centros de costo con esos filtros.
          </p>
        ) : (
          <>
            <div className={cn("overflow-x-auto rounded-xl border border-gray-100", cargando && "opacity-60")}>
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-700">
                  <tr>
                    <th className="px-3 py-3">Código centro de costo</th>
                    <th className="px-3 py-3">Cliente / Proyecto</th>
                    <th className="px-3 py-3">Sede</th>
                    <th className="px-3 py-3">Departamento</th>
                    <th className="px-3 py-3">Línea de negocio</th>
                    <th className="px-3 py-3">Servicio asociado</th>
                    <th className="px-3 py-3">Estado</th>
                    <th className="px-3 py-3 text-right">Operarios</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {resultado?.centros.map((c) => (
                    <tr key={c.id_centro_costo_contable} className="align-top hover:bg-emerald-50/40">
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-gray-700">
                        <span className="flex items-center gap-1">
                          {c.codigo}
                          {c.pendiente_revision && (
                            <span
                              title={`Pendiente de revisión: ${c.observacion_revision}`}
                              aria-label={`Pendiente de revisión: ${c.observacion_revision}`}
                              className="cursor-help"
                            >
                              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-gray-800">{c.cliente}</p>
                        {/* Solo cuando el proyecto tiene un nombre distinto al del
                            cliente (p. ej. Fundación Challenger en el NIT de Challenger). */}
                        {c.proyecto !== c.cliente && (
                          <p className="text-xs text-gray-600">{c.proyecto}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          NIT {c.nit} · {c.codigo_proyecto}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-gray-800">{c.sede}</p>
                        <p className="text-xs text-gray-500">{c.codigo_sede}</p>
                      </td>
                      <td className="px-3 py-3 text-gray-700">{c.departamento}</td>
                      <td className="px-3 py-3 text-gray-700">{c.linea}</td>
                      <td className="px-3 py-3 text-gray-700">{c.servicio}</td>
                      <td className="px-3 py-3">
                        <span className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", ESTADOS[c.estado])}>
                          {c.estado === "ABIERTO" ? "Abierto" : "Cerrado"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-gray-800">
                        {c.operarios || <span className="font-normal text-gray-400">—</span>}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIdDetalle(c.id_centro_costo_contable)}
                          className="h-8 gap-1 rounded-lg border-emerald-200 px-3 text-emerald-700 hover:bg-emerald-50"
                        >
                          <IconoBoton className="h-4 w-4" />
                          {configuracion.boton}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm text-gray-600 sm:flex-row">
              <span>
                {resultado.total} centros de costo · página {pagina} de {totalPaginas}
              </span>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pagina <= 1 || cargando}
                  onClick={() => setPagina((p) => p - 1)}
                  className="h-9 gap-1 rounded-lg"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pagina >= totalPaginas || cargando}
                  onClick={() => setPagina((p) => p + 1)}
                  className="h-9 gap-1 rounded-lg"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </section>

      {configuracion.asignacion ? (
        <AsignacionCentroCostoDialog idCentro={idDetalle} onClose={() => setIdDetalle(null)} />
      ) : (
        <DetalleCentroCostoDialog
          idCentro={idDetalle}
          onClose={() => setIdDetalle(null)}
          onCambio={() => setRecarga((n) => n + 1)}
          permitirCambioEstado={configuracion.permitirCambioEstado}
        />
      )}
    </div>
  );
};

export default CentrosCostoView;
