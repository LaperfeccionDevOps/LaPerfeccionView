import React, { useEffect, useState } from "react";
import { ArrowLeft, Info, Loader2, Save } from "lucide-react";

import OpcionSiNo from "@/components/operaciones/OpcionSiNo";
import SeleccionMultiple from "@/components/operaciones/SeleccionMultiple";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import {
  guardarTareaPermisoAlturas,
  obtenerOpcionesTareaAlturas,
} from "@/services/permisosAlturasService";
import { LISTAS_TAREA } from "@/utils/permisosAlturas";

// Según la Resolución 4272 de 2021, el trabajo en alturas es el que se
// realiza a 2,0 m o más. Por debajo solo se advierte, no se bloquea.
const ALTURA_MINIMA_METROS = 2;

const aSiNo = (valor) => (valor == null ? "" : valor ? "SI" : "NO");

const desdePermiso = (permiso) => ({
  alturaAproximadaMetros:
    permiso?.altura_aproximada_metros != null
      ? String(permiso.altura_aproximada_metros)
      : "",
  descripcionProcedimiento: permiso?.descripcion_procedimiento || "",
  reEntrenamiento: aSiNo(permiso?.re_entrenamiento),
  aplicaMedidasColectivas: aSiNo(permiso?.aplica_medidas_colectivas),
  medidasColectivas: permiso?.medidas_colectivas || "",
  trabajoSuspension: aSiNo(permiso?.trabajo_suspension),
  // Ids elegidos en cada lista de selección múltiple.
  ...Object.fromEntries(
    LISTAS_TAREA.map(({ campo }) => [
      campo,
      (permiso?.selecciones?.[campo] || []).map(
        (opcion) => opcion.id_opcion_permiso_alturas
      ),
    ])
  ),
});

/**
 * Paso 3 del permiso: 2. Datos básicos de la tarea y 3. Medidas de prevención.
 * Mecanismos, herramientas, sistemas de acceso y sistemas de ingeniería se
 * eligen de listas (catálogo "OpcionPermisoAlturas").
 */
const PasoTareaPermisoAlturas = ({
  permiso,
  editable,
  onGuardado,
  onAnterior,
}) => {
  const [formulario, setFormulario] = useState(() => desdePermiso(permiso));
  const [opciones, setOpciones] = useState({});
  const [cargandoOpciones, setCargandoOpciones] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [intentoGuardar, setIntentoGuardar] = useState(false);

  useEffect(() => {
    obtenerOpcionesTareaAlturas()
      .then((lista) => {
        // Se agrupan por lista; se agregan las opciones ya elegidas que hoy
        // estén inactivas para que sigan visibles.
        const porLista = Object.fromEntries(
          LISTAS_TAREA.map(({ campo, tipo }) => {
            const activas = lista
              .filter((opcion) => opcion.tipo === tipo)
              .map((opcion) => ({
                id: opcion.id_opcion_permiso_alturas,
                nombre: opcion.nombre,
              }));
            const elegidasInactivas = (permiso?.selecciones?.[campo] || [])
              .filter(
                (elegida) =>
                  !activas.some((o) => o.id === elegida.id_opcion_permiso_alturas)
              )
              .map((elegida) => ({
                id: elegida.id_opcion_permiso_alturas,
                nombre: elegida.nombre,
              }));

            return [campo, [...activas, ...elegidasInactivas]];
          })
        );

        setOpciones(porLista);
      })
      .catch((error) =>
        toast({
          title: "No se pudieron cargar las listas de la tarea",
          description: error.message,
          variant: "destructive",
        })
      )
      .finally(() => setCargandoOpciones(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deshabilitado = !editable || guardando;
  const altura = Number(formulario.alturaAproximadaMetros);
  const alturaBaja =
    formulario.alturaAproximadaMetros !== "" &&
    altura > 0 &&
    altura < ALTURA_MINIMA_METROS;

  const actualizarCampo = (campo, valor) => {
    setFormulario((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const listaIncompleta = (campo) =>
    LISTAS_TAREA.find((lista) => lista.campo === campo)?.obligatoria &&
    formulario[campo].length === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIntentoGuardar(true);

    const obligatorios = [
      formulario.alturaAproximadaMetros,
      formulario.descripcionProcedimiento,
      formulario.reEntrenamiento,
      formulario.aplicaMedidasColectivas,
      formulario.trabajoSuspension,
    ];

    // Si aplican medidas colectivas, se debe describir cuál se utilizará.
    if (formulario.aplicaMedidasColectivas === "SI") {
      obligatorios.push(formulario.medidasColectivas);
    }

    if (
      obligatorios.some((valor) => !String(valor).trim()) ||
      LISTAS_TAREA.some(({ campo }) => listaIncompleta(campo))
    ) {
      toast({
        title: "Campos requeridos",
        description:
          "Completa todos los campos marcados con * y elige al menos una opción en cada lista obligatoria.",
        variant: "destructive",
      });
      return;
    }

    if (!(altura > 0)) {
      toast({
        title: "Altura no válida",
        description: "La altura aproximada debe ser mayor a 0 metros.",
        variant: "destructive",
      });
      return;
    }

    setGuardando(true);

    try {
      const actualizado = await guardarTareaPermisoAlturas(
        permiso.id_permiso_trabajo_alturas,
        {
          ...formulario,
          descripcionProcedimiento: formulario.descripcionProcedimiento.trim(),
          medidasColectivas:
            formulario.aplicaMedidasColectivas === "SI"
              ? formulario.medidasColectivas.trim()
              : "",
          alturaAproximadaMetros: altura.toFixed(2),
        }
      );

      toast({
        title: "Datos de la tarea guardados",
        description: "Se guardaron los datos básicos y las medidas de prevención.",
      });

      onGuardado(actualizado);
    } catch (error) {
      toast({
        title: "No se pudieron guardar los datos de la tarea",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGuardando(false);
    }
  };

  const lista = (campo) => {
    const { etiqueta, obligatoria } = LISTAS_TAREA.find(
      (item) => item.campo === campo
    );

    return (
      <SeleccionMultiple
        id={campo}
        label={`${etiqueta}${obligatoria ? " *" : ""}`}
        opciones={opciones[campo] || []}
        seleccionados={formulario[campo]}
        onChange={(valor) => actualizarCampo(campo, valor)}
        disabled={deshabilitado}
        invalido={intentoGuardar && listaIncompleta(campo)}
        mensajeError="Elige al menos una opción."
      />
    );
  };

  if (cargandoOpciones) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando listas de la tarea...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4">
        <h3 className="font-semibold text-gray-800">
          2. Datos básicos del permiso de trabajo en alturas
        </h3>

        {lista("mecanismos")}

        <div className="space-y-2 md:max-w-xs">
          <Label htmlFor="alturaAproximadaMetros">
            Altura aproximada (metros) *
          </Label>

          <Input
            id="alturaAproximadaMetros"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            value={formulario.alturaAproximadaMetros}
            placeholder="Ej.: 4.5"
            onChange={(e) =>
              actualizarCampo("alturaAproximadaMetros", e.target.value)
            }
            disabled={deshabilitado}
          />

          {alturaBaja && (
            <p className="flex items-start gap-1 text-xs text-amber-700">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Según la Resolución 4272 de 2021, el trabajo en alturas es el
              que se realiza a 2,0 m o más.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="descripcionProcedimiento">
            Descripción y procedimiento de la tarea *
          </Label>

          <Textarea
            id="descripcionProcedimiento"
            rows={4}
            maxLength={4000}
            value={formulario.descripcionProcedimiento}
            placeholder="Describe la tarea y los pasos para realizarla"
            onChange={(e) =>
              actualizarCampo("descripcionProcedimiento", e.target.value)
            }
            disabled={deshabilitado}
          />
        </div>

        {lista("herramientas")}
      </section>

      <section className="space-y-4 border-t border-gray-100 pt-6">
        <h3 className="font-semibold text-gray-800">
          3. Medidas de prevención
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <OpcionSiNo
            id="reEntrenamiento"
            label="Re-entrenamiento *"
            value={formulario.reEntrenamiento}
            onChange={(valor) => actualizarCampo("reEntrenamiento", valor)}
            disabled={deshabilitado}
          />

          <OpcionSiNo
            id="trabajoSuspension"
            label="Trabajo en suspensión *"
            value={formulario.trabajoSuspension}
            onChange={(valor) => actualizarCampo("trabajoSuspension", valor)}
            disabled={deshabilitado}
          />
        </div>

        {lista("sistemas_acceso")}

        {lista("sistemas_ingenieria")}

        <div className="space-y-4 rounded-xl border border-gray-200 p-4">
          <OpcionSiNo
            id="aplicaMedidasColectivas"
            label="Medidas colectivas de prevención *"
            value={formulario.aplicaMedidasColectivas}
            etiquetas={{ SI: "Aplica", NO: "No aplica" }}
            onChange={(valor) =>
              setFormulario((prev) => ({
                ...prev,
                aplicaMedidasColectivas: valor,
                ...(valor === "NO" ? { medidasColectivas: "" } : {}),
              }))
            }
            disabled={deshabilitado}
          />

          {formulario.aplicaMedidasColectivas === "SI" && (
            <div className="space-y-2">
              <Label htmlFor="medidasColectivas">
                ¿Qué medida colectiva de prevención se utilizará? *
              </Label>

              <Input
                id="medidasColectivas"
                value={formulario.medidasColectivas}
                maxLength={300}
                placeholder="Ej.: control de acceso, línea de advertencia"
                onChange={(e) =>
                  actualizarCampo("medidasColectivas", e.target.value)
                }
                disabled={deshabilitado}
              />
            </div>
          )}
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onAnterior}
          disabled={guardando}
          className="h-11 gap-2 rounded-xl"
        >
          <ArrowLeft className="h-4 w-4" />
          Anterior
        </Button>

        {editable && (
          <Button
            type="submit"
            disabled={guardando}
            className="h-11 gap-2 rounded-xl bg-emerald-600 px-6 text-white hover:bg-emerald-700"
          >
            {guardando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar
          </Button>
        )}
      </div>
    </form>
  );
};

export default PasoTareaPermisoAlturas;
