import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Building, Loader2, Plus } from "lucide-react";

import CampoTexto from "@/components/contabilidad/CampoTexto";
import FiltroBuscable from "@/components/contabilidad/FiltroBuscable";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { listarSedesProyecto, validarCodigoSede } from "@/services/contabilidadService";

const FORMATO_CODIGO = /^[A-Z0-9&]{2,20}$/;

const SEDE_NUEVA_INICIAL = { codigo: "", descripcion: "" };

const OPCIONES_SEDE = [
  {
    valor: "existente",
    titulo: "Sede existente",
    descripcion: "Elegir una sede ya registrada del proyecto.",
    icono: Building,
  },
  {
    valor: "nueva",
    titulo: "Sede nueva",
    descripcion: "Registrar una sede por primera vez.",
    icono: Plus,
  },
];

// Prefijo más usado en los códigos de las sedes del proyecto (COMPE01 -> COMPE).
// Sin sedes: el código del proyecto. Solo sirve para avisar si un código nuevo
// no se parece a los del proyecto; el código se escribe siempre a mano.
const prefijoSedes = (sedes, codigoProyecto) => {
  const conteo = {};

  sedes.forEach((s) => {
    const partes = /^([A-Z&]+)\d+$/.exec(s.codigo);
    if (partes) {
      conteo[partes[1]] = (conteo[partes[1]] || 0) + 1;
    }
  });

  return Object.keys(conteo).sort((a, b) => conteo[b] - conteo[a])[0] || codigoProyecto;
};

/**
 * Paso 3 de Crear: sede (CEN 3). Lista las sedes del proyecto que ya tienen
 * centros en el departamento elegido (CEN 2); las de otros departamentos se
 * pueden mostrar aparte. También permite diligenciar una sede nueva.
 * `onChange(codigo | null, lineas, sede)` informa el CEN 3 listo para la
 * codificación; si es una sede existente, sus líneas de negocio ({ código:
 * centros }); y los datos para guardarla ({ codigo, descripcion?, nuevo }).
 *
 * El padre lo monta con una `key` por proyecto para reiniciarlo al cambiarlo.
 */
const PasoSedeCentroCosto = ({ idProyecto, codigoProyecto, cen2, nombreDepartamento, onChange }) => {
  const [sedes, setSedes] = useState(idProyecto ? null : []);
  const [tipoSede, setTipoSede] = useState(idProyecto ? "existente" : "nueva");
  const [idSede, setIdSede] = useState("");
  const [verOtrosDepartamentos, setVerOtrosDepartamentos] = useState(false);
  const [sedeNueva, setSedeNueva] = useState(SEDE_NUEVA_INICIAL);
  // Resultado de validar el código en el servidor: { codigo, disponible, ... }.
  const [validacion, setValidacion] = useState(null);

  useEffect(() => {
    if (!idProyecto) {
      return;
    }

    listarSedesProyecto(idProyecto)
      .then((lista) => {
        setSedes(lista);
        if (lista.length === 0) {
          setTipoSede("nueva");
        }
      })
      .catch((error) => {
        setSedes([]);
        toast({
          title: "No se pudieron cargar las sedes",
          description: error.message,
          variant: "destructive",
        });
      });
    // El padre reinicia el paso (key) si cambia el proyecto o su código.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idProyecto]);

  const prefijo = useMemo(
    () => (sedes ? prefijoSedes(sedes, codigoProyecto) : null),
    [sedes, codigoProyecto]
  );

  const enDepartamento = (sedes || []).filter((s) => s.departamentos.includes(cen2));
  const deOtros = (sedes || []).filter((s) => !s.departamentos.includes(cen2));

  const opcionesSede = useMemo(
    () =>
      (verOtrosDepartamentos ? [...enDepartamento, ...deOtros] : enDepartamento).map((s) => ({
        id: s.id,
        etiqueta: `${s.codigo} · ${s.descripcion}`,
        detalle: `${s.departamentos.join(", ") || "Sin centros"} · ${s.centros} centro(s), ${s.abiertos} abierto(s)`,
        busqueda: s.codigo,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sedes, cen2, verOtrosDepartamentos]
  );

  const sedeElegida = (sedes || []).find((s) => String(s.id) === String(idSede));
  const sedeDeOtroDepartamento = sedeElegida && !sedeElegida.departamentos.includes(cen2);

  // Validación del código nuevo en el servidor, unos instantes después de escribir.
  const codigo = sedeNueva.codigo.trim();

  useEffect(() => {
    setValidacion(null);

    if (tipoSede !== "nueva" || !FORMATO_CODIGO.test(codigo)) {
      return undefined;
    }

    let vigente = true;
    const espera = setTimeout(() => {
      validarCodigoSede(codigo)
        .then((datos) => vigente && setValidacion(datos))
        .catch(() => {
          // Sin respuesta no se marca como disponible; el campo queda pendiente.
        });
    }, 400);

    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [codigo, tipoSede]);

  const validado = validacion?.codigo === codigo ? validacion : null;

  const errorCodigo =
    codigo && !FORMATO_CODIGO.test(codigo)
      ? "Solo letras mayúsculas y números, entre 2 y 20 caracteres."
      : validado && !validado.disponible
        ? `El código ${codigo} ya existe: ${validado.descripcion} (proyecto ${validado.codigo_proyecto}).`
        : null;

  // No impide continuar: es la misma regla que marcó sedes "pendientes de revisión".
  const prefijoDistinto =
    prefijo && FORMATO_CODIGO.test(codigo) && !codigo.startsWith(prefijo);

  const cen3 =
    tipoSede === "existente"
      ? sedeElegida?.codigo || null
      : validado?.disponible && sedeNueva.descripcion.trim()
        ? codigo
        : null;

  // Una sede nueva todavía no tiene líneas.
  const lineasSede = tipoSede === "existente" ? sedeElegida?.lineas || null : null;

  useEffect(() => {
    const datos = !cen3
      ? null
      : tipoSede === "existente"
        ? { codigo: cen3, nuevo: false }
        : { codigo: cen3, descripcion: sedeNueva.descripcion.trim(), nuevo: true };

    onChange(cen3, lineasSede, datos);
    // onChange cambia en cada render del padre; solo importan los datos de la sede.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cen3, lineasSede, tipoSede, sedeNueva.descripcion]);

  // Al cambiar entre sede existente y nueva se borra lo diligenciado en ambas.
  const elegirTipo = (valor) => {
    setTipoSede(valor);
    setIdSede("");
    setVerOtrosDepartamentos(false);
    setSedeNueva(SEDE_NUEVA_INICIAL);
  };

  if (sedes === null) {
    return (
      <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando sedes del proyecto...
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-4">
      {sedes.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {OPCIONES_SEDE.map(({ valor, titulo, descripcion, icono: Icono }) => (
            <button
              key={valor}
              type="button"
              onClick={() => elegirTipo(valor)}
              aria-pressed={tipoSede === valor}
              className={cn(
                "flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
                tipoSede === valor
                  ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100"
                  : "border-gray-200 hover:border-emerald-300"
              )}
            >
              <Icono
                className={cn(
                  "mt-0.5 h-5 w-5 shrink-0",
                  tipoSede === valor ? "text-emerald-700" : "text-gray-400"
                )}
              />
              <span>
                <span className="block text-sm font-bold text-gray-800">{titulo}</span>
                <span className="block text-xs text-gray-500">{descripcion}</span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          {idProyecto
            ? "Este proyecto todavía no tiene sedes; registra la primera."
            : "Es un cliente nuevo; registra su primera sede."}
        </p>
      )}

      {tipoSede === "existente" ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            {enDepartamento.length > 0
              ? `${enDepartamento.length} sede(s) de ${codigoProyecto} con centros en ${nombreDepartamento} (${cen2}).`
              : `${codigoProyecto} no tiene sedes con centros en ${nombreDepartamento} (${cen2}).`}
          </p>

          {deOtros.length > 0 && (
            <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={verOtrosDepartamentos}
                onChange={(e) => {
                  setVerOtrosDepartamentos(e.target.checked);
                  setIdSede("");
                }}
                className="h-4 w-4 accent-emerald-600"
              />
              Mostrar también las {deOtros.length} sede(s) de otros departamentos
            </label>
          )}

          <FiltroBuscable
            id="crearSede"
            label="Buscar sede"
            opciones={opcionesSede}
            valor={idSede}
            onChange={setIdSede}
            placeholder="Sin seleccionar"
            disabled={opcionesSede.length === 0}
            listaEnLinea
          />

          {sedeDeOtroDepartamento && (
            <p className="flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {sedeElegida.codigo} tiene sus centros en {sedeElegida.departamentos.join(", ")}. Con{" "}
              {cen2} quedaría en varios departamentos, como las sedes que hoy están pendientes de
              revisión. Confírmalo con Contabilidad.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CampoTexto
              id="nuevaSedeCodigo"
              label="Código de la sede (CEN 3)"
              valor={sedeNueva.codigo}
              onChange={(v) =>
                setSedeNueva((prev) => ({ ...prev, codigo: v.toUpperCase().replace(/\s/g, "") }))
              }
              placeholder="Escribe el código de Synergy"
              maxLength={20}
              error={errorCodigo}
              ayuda={
                validado?.disponible ? `${codigo} está disponible.` : "Debe coincidir con Synergy."
              }
            />
            <CampoTexto
              id="nuevaSedeDescripcion"
              label="Descripción de la sede"
              valor={sedeNueva.descripcion}
              onChange={(v) => setSedeNueva((prev) => ({ ...prev, descripcion: v }))}
              placeholder="P. ej. Sede Girardot - Piscinas"
              maxLength={300}
            />
          </div>

          {prefijoDistinto && !errorCodigo && (
            <p className="flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              El código no empieza como las sedes del proyecto ({prefijo}). Revisa que
              sea el de Synergy.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PasoSedeCentroCosto;
