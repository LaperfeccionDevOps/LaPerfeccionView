import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, MapPin } from "lucide-react";

import ListaSedes from "@/components/contabilidad/ListaSedes";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { listarSedesProyecto } from "@/services/contabilidadService";

const Dato = ({ etiqueta, valor, codigo }) => (
  <div className="min-w-0">
    <p className="text-xs font-bold uppercase text-gray-700">{etiqueta}</p>
    <p className="truncate text-gray-800" title={valor}>
      {valor} <span className="font-mono font-bold text-emerald-800">({codigo})</span>
    </p>
  </div>
);

/**
 * Crear desde una sede existente: se busca la sede (CEN 3) entre todas y de
 * ella salen el cliente / proyecto (CEN 1) y el departamento (CEN 2) donde ya
 * tiene centros. Si la sede tiene centros en varios departamentos (o en
 * ninguno) se elige cuál usar.
 * `onChange({ cen1, cen2, cen3, lineas } | null)` informa la codificación
 * lista y las líneas que ya tiene la sede ({ código: centros }).
 *
 * `duplicar` ({ cen2, cen3, ... } de duplicarCentroCosto.js): la sede queda
 * fija (CEN 1 y CEN 3), el CEN 2 del original viene elegido y se puede
 * cambiar por cualquier otro (casos con conflicto de departamento).
 */
const PasoDesdeSedeCentroCosto = ({ catalogos, onChange, duplicar = null }) => {
  const [idSede, setIdSede] = useState(() =>
    duplicar
      ? String((catalogos?.sedes || []).find((s) => s.codigo === duplicar.cen3)?.id || "")
      : ""
  );
  // Detalle de la sede elegida (departamentos y líneas); null mientras carga.
  const [detalle, setDetalle] = useState(null);
  const [codigoDepartamento, setCodigoDepartamento] = useState("");

  const proyectos = catalogos?.proyectos || [];
  const departamentos = catalogos?.departamentos || [];
  const proyectoDe = (sede) => proyectos.find((p) => String(p.id) === String(sede.id_proyecto));

  // Todas las sedes con su cliente y su estado (abierta = algún centro abierto).
  const tarjetasSede = useMemo(
    () =>
      (catalogos?.sedes || []).map((s) => {
        const proyecto = proyectoDe(s);
        return {
          id: s.id,
          codigo: s.codigo,
          descripcion: s.nombre,
          abiertos: s.abiertos || 0,
          detalle: `${proyecto ? `${proyecto.cliente} (${proyecto.codigo}) · ` : ""}${s.centros || 0} centro(s), ${s.abiertos || 0} abierto(s)`,
          busqueda: proyecto ? `${proyecto.codigo} ${proyecto.cliente} ${proyecto.nombre}` : "",
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [catalogos]
  );

  const sede = (catalogos?.sedes || []).find((s) => String(s.id) === String(idSede));
  const proyecto = sede ? proyectoDe(sede) : null;

  useEffect(() => {
    setDetalle(null);
    setCodigoDepartamento("");

    if (!sede) {
      return undefined;
    }

    let vigente = true;

    listarSedesProyecto(sede.id_proyecto)
      .then((lista) => {
        if (!vigente) {
          return;
        }
        const encontrada = lista.find((s) => String(s.id) === String(sede.id)) || {
          departamentos: [],
          lineas: {},
          centros: 0,
          abiertos: 0,
        };
        setDetalle(encontrada);
        // Al duplicar viene elegido el del original; si no, con un solo
        // departamento queda elegido de una vez.
        if (duplicar && departamentos.some((d) => d.codigo === duplicar.cen2)) {
          setCodigoDepartamento(duplicar.cen2);
        } else if (encontrada.departamentos.length === 1) {
          setCodigoDepartamento(encontrada.departamentos[0]);
        }
      })
      .catch((error) => {
        if (vigente) {
          setIdSede("");
          toast({
            title: "No se pudo cargar la sede",
            description: error.message,
            variant: "destructive",
          });
        }
      });

    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idSede]);

  // Departamentos para elegir: los de la sede; si no tiene centros, todos.
  // Al duplicar, todos: primero los que ya tiene la sede.
  const candidatos = detalle
    ? duplicar
      ? [
          ...departamentos.filter((d) => detalle.departamentos.includes(d.codigo)),
          ...departamentos.filter((d) => !detalle.departamentos.includes(d.codigo)),
        ]
      : detalle.departamentos.length > 0
        ? departamentos.filter((d) => detalle.departamentos.includes(d.codigo))
        : departamentos
    : [];
  const departamento = departamentos.find((d) => d.codigo === codigoDepartamento);
  // Al duplicar con un CEN 2 donde la sede no tiene centros (o con varios), la
  // API deja el nuevo centro pendiente de revisión.
  const quedaraEnRevision = Boolean(
    duplicar &&
      departamento &&
      detalle &&
      detalle.departamentos.some((codigoOtro) => codigoOtro !== departamento.codigo)
  );

  const listo = Boolean(sede && proyecto && detalle && departamento);

  useEffect(() => {
    onChange(
      listo
        ? { cen1: proyecto.codigo, cen2: departamento.codigo, cen3: sede.codigo, lineas: detalle.lineas || {} }
        : null
    );
    // onChange cambia en cada render del padre; solo importa la codificación.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo, sede?.codigo, codigoDepartamento, detalle]);

  return (
    <div className="mt-3 space-y-4">
      {duplicar ? (
        !sede && (
          <p className="flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            No se encontró la sede {duplicar.cen3} del centro que se quiere duplicar.
          </p>
        )
      ) : (
        <>
          <p className="text-sm text-gray-500">
            {tarjetasSede.length} sede(s) registradas:{" "}
            <span className="font-semibold text-emerald-700">
              {tarjetasSede.filter((s) => s.abiertos > 0).length} abierta(s)
            </span>{" "}
            y{" "}
            <span className="font-semibold text-gray-600">
              {tarjetasSede.filter((s) => s.abiertos === 0).length} cerrada(s)
            </span>
            .
          </p>

          <ListaSedes
            id="crearDesdeSede"
            sedes={tarjetasSede}
            valor={idSede}
            onChange={setIdSede}
            placeholder="Buscar por código, descripción, cliente o proyecto"
          />
        </>
      )}

      {sede && !detalle && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando la sede...
        </div>
      )}

      {sede && detalle && (
        <>
          <div className="grid grid-cols-1 gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-sm sm:grid-cols-3">
            {proyecto && <Dato etiqueta="Cliente / Proyecto (CEN 1)" valor={proyecto.cliente} codigo={proyecto.codigo} />}
            {departamento ? (
              <Dato etiqueta="Departamento (CEN 2)" valor={departamento.nombre} codigo={departamento.codigo} />
            ) : (
              <div>
                <p className="text-xs font-bold uppercase text-gray-700">Departamento (CEN 2)</p>
                <p className="text-amber-700">Elígelo abajo</p>
              </div>
            )}
            <Dato etiqueta="Sede (CEN 3)" valor={sede.nombre} codigo={sede.codigo} />
            <p className="text-xs text-gray-500 sm:col-span-3">
              Sede {detalle.abiertos > 0 ? "abierta" : "cerrada"}: tiene {detalle.centros} centro(s), {detalle.abiertos} abierto(s).
            </p>
          </div>

          {candidatos.length > 1 && (
            <div className="space-y-2">
              <p className="flex items-start gap-2 text-sm text-gray-600">
                {duplicar ? (
                  <>
                    El centro original es del departamento {duplicar.cen2}. Puedes dejarlo o cambiarlo
                    (por ejemplo, si el CEN 2 tiene conflicto); primero aparecen los que ya usa la sede.
                  </>
                ) : detalle.departamentos.length > 1 ? (
                  <>
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    La sede tiene centros en {detalle.departamentos.length} departamentos; elige en cuál
                    va el nuevo centro. Quedará pendiente de revisión, como las demás sedes en varios
                    departamentos.
                  </>
                ) : (
                  "La sede todavía no tiene centros; elige el departamento donde se presta el servicio."
                )}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {candidatos.map((d) => {
                  const elegido = d.codigo === codigoDepartamento;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setCodigoDepartamento(elegido ? "" : d.codigo)}
                      aria-pressed={elegido}
                      className={cn(
                        "flex items-center gap-2 rounded-2xl border px-3 py-2 text-left transition-colors",
                        elegido
                          ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100"
                          : "border-gray-200 hover:border-emerald-300"
                      )}
                    >
                      <MapPin className={cn("h-4 w-4 shrink-0", elegido ? "text-emerald-700" : "text-gray-400")} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-gray-800">{d.nombre}</span>
                        <span className="block font-mono text-xs text-gray-500">{d.codigo}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {quedaraEnRevision && (
                <p className="flex items-start gap-2 text-sm text-amber-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  La sede ya tiene centros en otro departamento; el nuevo centro quedará pendiente de
                  revisión para que Contabilidad confirme el CEN 2 correcto.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PasoDesdeSedeCentroCosto;
