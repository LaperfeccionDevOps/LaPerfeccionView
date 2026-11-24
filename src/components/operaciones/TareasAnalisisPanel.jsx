import React, { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";

import OpcionSiNo from "@/components/operaciones/OpcionSiNo";
import SelectorPeligroMatriz from "@/components/operaciones/SelectorPeligroMatriz";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import {
  agregarPeligroTarea,
  agregarTareaAnalisis,
  editarTareaAnalisis,
  obtenerMatrizPeligros,
  obtenerTareasAnalisis,
  quitarPeligroTarea,
  quitarTareaAnalisis,
} from "@/services/analisisTrabajoSeguroService";

const MAX_CARACTERES = 4000;

const avisoError = (title, error) =>
  toast({ title, description: error.message, variant: "destructive" });

const PeligroRegistrado = ({ peligro, numero, puedeQuitar, onQuitar, disabled }) => (
  <li className="rounded-xl bg-gray-50 px-3 py-2">
    <div className="flex items-start justify-between gap-2">
      <p className="text-sm text-gray-800">
        <span className="font-semibold">
          Peligro {numero}: {peligro.riesgo}
        </span>{" "}
        · {peligro.peligro}
        {peligro.peligro_adicional && ` · ${peligro.peligro_adicional}`}
      </p>

      {puedeQuitar && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Quitar peligro"
          onClick={onQuitar}
          disabled={disabled}
          className="h-7 w-7 shrink-0 text-red-500 hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
    <p className="mt-1 text-xs text-gray-600">
      <span className="font-medium">Riesgo asociado:</span>{" "}
      {peligro.riesgo_asociado}
    </p>
    <p className="text-xs text-gray-600">
      <span className="font-medium">Consecuencia:</span>{" "}
      {peligro.consecuencia_asociada}
    </p>
  </li>
);

/**
 * Una tarea del bloque 4: paso detallado (editable) y sus peligros. Después
 * de cada peligro se pregunta si desea agregar otro.
 */
const TarjetaTarea = ({
  idAnalisis,
  tarea,
  numero,
  matriz,
  editable,
  onCambio,
  onQuitar,
}) => {
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [textoEdicion, setTextoEdicion] = useState(tarea.paso_detallado);
  const [agregarOtroPeligro, setAgregarOtroPeligro] = useState("");
  const [peligroNuevo, setPeligroNuevo] = useState(null);

  const guardarEdicion = async () => {
    if (!textoEdicion.trim()) {
      toast({
        title: "Campo requerido",
        description: "El paso detallado de la tarea no puede quedar vacío.",
        variant: "destructive",
      });
      return;
    }

    setGuardando(true);

    try {
      onCambio(
        await editarTareaAnalisis(
          idAnalisis,
          tarea.id_analisis_trabajo_seguro_tarea,
          textoEdicion.trim()
        )
      );
      setEditando(false);
    } catch (error) {
      avisoError("No se pudo guardar la tarea", error);
    } finally {
      setGuardando(false);
    }
  };

  const agregarPeligro = async () => {
    if (!peligroNuevo) {
      toast({
        title: "Campo requerido",
        description: "Elige el riesgo y el peligro que vas a agregar.",
        variant: "destructive",
      });
      return;
    }

    setGuardando(true);

    try {
      const peligro = await agregarPeligroTarea(
        idAnalisis,
        tarea.id_analisis_trabajo_seguro_tarea,
        peligroNuevo
      );

      onCambio({ ...tarea, peligros: [...tarea.peligros, peligro] });
      setPeligroNuevo(null);
      // Se vuelve a preguntar si desea agregar otro.
      setAgregarOtroPeligro("");
    } catch (error) {
      avisoError("No se pudo agregar el peligro", error);
    } finally {
      setGuardando(false);
    }
  };

  const quitarPeligro = async (peligro, numeroPeligro) => {
    if (!window.confirm(`¿Quitar el peligro ${numeroPeligro} de la tarea ${numero}?`)) {
      return;
    }

    setGuardando(true);

    try {
      await quitarPeligroTarea(
        idAnalisis,
        tarea.id_analisis_trabajo_seguro_tarea,
        peligro.id_analisis_trabajo_seguro_tarea_peligro
      );

      onCambio({
        ...tarea,
        peligros: tarea.peligros.filter(
          (p) =>
            p.id_analisis_trabajo_seguro_tarea_peligro !==
            peligro.id_analisis_trabajo_seguro_tarea_peligro
        ),
      });
    } catch (error) {
      avisoError("No se pudo quitar el peligro", error);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <li className="space-y-4 rounded-2xl border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-emerald-700">Tarea {numero}</h3>

        {editable && !editando && (
          <div className="flex shrink-0 gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Editar paso detallado"
              onClick={() => {
                setTextoEdicion(tarea.paso_detallado);
                setEditando(true);
              }}
              disabled={guardando}
              className="h-8 w-8 text-gray-500 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Quitar tarea"
              onClick={() => onQuitar(tarea, numero)}
              disabled={guardando}
              className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-medium uppercase text-gray-400">
          Paso detallado de la tarea
        </p>

        {editando ? (
          <div className="mt-2 space-y-2">
            <Textarea
              rows={4}
              maxLength={MAX_CARACTERES}
              value={textoEdicion}
              onChange={(e) => setTextoEdicion(e.target.value)}
              disabled={guardando}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditando(false)}
                disabled={guardando}
                className="h-9 gap-1 rounded-lg"
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={guardarEdicion}
                disabled={guardando}
                className="h-9 gap-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {guardando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-800">
            {tarea.paso_detallado}
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase text-gray-400">
          Peligros identificados ({tarea.peligros.length})
        </p>

        {tarea.peligros.length === 0 ? (
          <p className="text-xs text-red-600">
            Esta tarea no tiene peligros. Agrega al menos uno.
          </p>
        ) : (
          <ol className="space-y-2">
            {tarea.peligros.map((peligro, indice) => (
              <PeligroRegistrado
                key={peligro.id_analisis_trabajo_seguro_tarea_peligro}
                peligro={peligro}
                numero={indice + 1}
                // La tarea debe conservar al menos un peligro.
                puedeQuitar={editable && tarea.peligros.length > 1}
                onQuitar={() => quitarPeligro(peligro, indice + 1)}
                disabled={guardando}
              />
            ))}
          </ol>
        )}
      </div>

      {editable && (
      <div className="max-w-md">
        <OpcionSiNo
          id={`agregarPeligro-${tarea.id_analisis_trabajo_seguro_tarea}`}
          label={
            tarea.peligros.length === 0
              ? "¿Agregar un peligro a esta tarea?"
              : "¿Desea agregar otro peligro a esta tarea?"
          }
          value={agregarOtroPeligro}
          onChange={setAgregarOtroPeligro}
          disabled={guardando}
        />
      </div>
      )}

      {editable && agregarOtroPeligro === "SI" && (
        <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
          <SelectorPeligroMatriz
            id={`peligroNuevo-${tarea.id_analisis_trabajo_seguro_tarea}`}
            label={`Peligro ${tarea.peligros.length + 1} *`}
            matriz={matriz}
            seleccionado={peligroNuevo}
            onSeleccionar={setPeligroNuevo}
            idsNoSeleccionables={tarea.peligros.map((p) => p.id_matriz_peligro)}
            disabled={guardando}
          />

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={agregarPeligro}
              disabled={guardando || !peligroNuevo}
              className="h-10 gap-2 rounded-xl bg-emerald-600 px-5 text-white hover:bg-emerald-700"
            >
              {guardando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Agregar peligro
            </Button>
          </div>
        </div>
      )}
    </li>
  );
};

/**
 * Bloque 4 del análisis: tareas (pasos) que se agregan una por una, cada una
 * con al menos un peligro de la matriz. Después de cada tarea se pregunta si
 * va a agregar otra.
 */
const TareasAnalisisPanel = ({
  idAnalisis,
  editable = true,
  onResumenCambia = () => {},
}) => {
  const [tareas, setTareas] = useState([]);
  const [matriz, setMatriz] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Formulario de la tarea nueva (paso detallado + primer peligro).
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [pasoDetallado, setPasoDetallado] = useState("");
  const [primerPeligro, setPrimerPeligro] = useState(null);
  const [versionSelector, setVersionSelector] = useState(0);
  // Respuesta a "¿Va a agregar otra tarea?".
  const [agregarOtra, setAgregarOtra] = useState("");

  useEffect(() => {
    setCargando(true);

    Promise.all([obtenerTareasAnalisis(idAnalisis), obtenerMatrizPeligros()])
      .then(([lista, filasMatriz]) => {
        setTareas(lista);
        setMatriz(filasMatriz);
        // Sin tareas, se abre directamente el formulario de la primera.
        setMostrarFormulario(lista.length === 0);
      })
      .catch((error) => avisoError("No se pudieron cargar las tareas", error))
      .finally(() => setCargando(false));
  }, [idAnalisis]);

  const actualizarLista = (lista) => {
    setTareas(lista);
    onResumenCambia({
      cantidad_tareas: lista.length,
      tareas_sin_peligro: lista.filter((t) => t.peligros.length === 0).length,
    });
  };

  const limpiarFormulario = () => {
    setPasoDetallado("");
    setPrimerPeligro(null);
    setVersionSelector((v) => v + 1);
  };

  // Guarda la tarea del formulario con su primer peligro. Devuelve la lista
  // actualizada o null si no se pudo guardar.
  const guardarTareaNueva = async () => {
    if (!pasoDetallado.trim() || !primerPeligro) {
      toast({
        title: "Campos requeridos",
        description:
          "Escribe el paso detallado de la tarea y elige al menos un peligro.",
        variant: "destructive",
      });
      return null;
    }

    setGuardando(true);

    try {
      const nueva = await agregarTareaAnalisis(
        idAnalisis,
        pasoDetallado.trim(),
        primerPeligro
      );
      const lista = [...tareas, nueva];

      actualizarLista(lista);
      limpiarFormulario();
      setMostrarFormulario(false);
      setAgregarOtra("");

      toast({
        title: "Tarea agregada",
        description: `Se registró la tarea ${lista.length} con su primer peligro.`,
      });

      return lista;
    } catch (error) {
      avisoError("No se pudo agregar la tarea", error);
      return null;
    } finally {
      setGuardando(false);
    }
  };

  const handleAgregar = async (e) => {
    e.preventDefault();
    await guardarTareaNueva();
  };

  // Cierre del bloque: guarda la tarea pendiente del formulario (si la hay) y
  // verifica que todas las tareas tengan al menos un peligro.
  const handleGuardarBloque = async () => {
    let lista = tareas;
    const formularioConDatos =
      mostrarFormulario && (pasoDetallado.trim() || primerPeligro);

    if (formularioConDatos) {
      lista = await guardarTareaNueva();

      if (!lista) {
        return;
      }
    }

    if (lista.length === 0) {
      toast({
        title: "Faltan tareas",
        description: "Registra al menos una tarea con su peligro.",
        variant: "destructive",
      });
      return;
    }

    const sinPeligro = lista.findIndex((t) => t.peligros.length === 0);

    if (sinPeligro >= 0) {
      toast({
        title: "Faltan peligros",
        description: `La tarea ${sinPeligro + 1} no tiene peligros. Agrega al menos uno.`,
        variant: "destructive",
      });
      return;
    }

    const totalPeligros = lista.reduce((suma, t) => suma + t.peligros.length, 0);

    toast({
      title: "Tareas y peligros guardados",
      description: `Quedaron registradas ${lista.length} ${
        lista.length === 1 ? "tarea" : "tareas"
      } con ${totalPeligros} ${totalPeligros === 1 ? "peligro" : "peligros"}.`,
    });
  };

  const reemplazarTarea = (actualizada) =>
    actualizarLista(
      tareas.map((t) =>
        t.id_analisis_trabajo_seguro_tarea ===
        actualizada.id_analisis_trabajo_seguro_tarea
          ? actualizada
          : t
      )
    );

  const handleQuitarTarea = async (tarea, numero) => {
    if (!window.confirm(`¿Quitar la tarea ${numero} y sus peligros?`)) {
      return;
    }

    try {
      await quitarTareaAnalisis(idAnalisis, tarea.id_analisis_trabajo_seguro_tarea);

      const lista = tareas.filter(
        (t) =>
          t.id_analisis_trabajo_seguro_tarea !==
          tarea.id_analisis_trabajo_seguro_tarea
      );

      actualizarLista(lista);

      if (lista.length === 0) {
        setMostrarFormulario(true);
        setAgregarOtra("");
      }
    } catch (error) {
      avisoError("No se pudo quitar la tarea", error);
    }
  };

  if (cargando) {
    return <p className="text-sm text-gray-500">Cargando tareas...</p>;
  }

  return (
    <div className="space-y-6">
      {tareas.length > 0 && (
        <ol className="space-y-4">
          {tareas.map((tarea, indice) => (
            <TarjetaTarea
              key={tarea.id_analisis_trabajo_seguro_tarea}
              idAnalisis={idAnalisis}
              tarea={tarea}
              numero={indice + 1}
              matriz={matriz}
              onCambio={reemplazarTarea}
              editable={editable}
              onQuitar={handleQuitarTarea}
            />
          ))}
        </ol>
      )}

      {editable && tareas.length > 0 && !mostrarFormulario && (
        <div className="max-w-md">
          <OpcionSiNo
            id="agregarOtraTarea"
            label="¿Va a agregar otra tarea?"
            value={agregarOtra}
            onChange={(respuesta) => {
              setAgregarOtra(respuesta);
              setMostrarFormulario(respuesta === "SI");
            }}
            disabled={guardando}
          />

          {agregarOtra === "NO" && (
            <p className="mt-2 text-xs text-gray-500">
              Quedan registradas {tareas.length}{" "}
              {tareas.length === 1 ? "tarea" : "tareas"}. Puedes agregar otra
              en cualquier momento respondiendo «Sí».
            </p>
          )}
        </div>
      )}

      {editable && mostrarFormulario && (
        <form
          onSubmit={handleAgregar}
          className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4"
        >
          <h3 className="font-semibold text-gray-800">
            Tarea {tareas.length + 1}
          </h3>

          <div className="space-y-2">
            <Label htmlFor="pasoDetalladoTarea">
              Paso detallado de la tarea *
            </Label>

            <Textarea
              id="pasoDetalladoTarea"
              rows={4}
              maxLength={MAX_CARACTERES}
              value={pasoDetallado}
              onChange={(e) => setPasoDetallado(e.target.value)}
              disabled={guardando}
            />
          </div>

          <SelectorPeligroMatriz
            key={versionSelector}
            id="primerPeligroTarea"
            label="Peligro 1 *"
            matriz={matriz}
            seleccionado={primerPeligro}
            onSeleccionar={setPrimerPeligro}
            disabled={guardando}
          />

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {tareas.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setMostrarFormulario(false);
                  setAgregarOtra("");
                  limpiarFormulario();
                }}
                disabled={guardando}
                className="h-11 rounded-xl"
              >
                Cancelar
              </Button>
            )}

            <Button
              type="submit"
              disabled={guardando}
              className="h-11 gap-2 rounded-xl bg-emerald-600 px-6 text-white hover:bg-emerald-700"
            >
              {guardando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Guardar tarea
            </Button>
          </div>
        </form>
      )}

      {editable && (
      <div className="flex justify-end border-t border-gray-100 pt-4">
        <Button
          type="button"
          onClick={handleGuardarBloque}
          disabled={guardando}
          className="h-11 gap-2 rounded-xl bg-emerald-600 px-6 text-white hover:bg-emerald-700"
        >
          {guardando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Guardar tareas y peligros
        </Button>
      </div>
      )}
    </div>
  );
};

export default TareasAnalisisPanel;
