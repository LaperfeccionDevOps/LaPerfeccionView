import React, { useState } from "react";
import { ArrowLeft, Info, Loader2, Save } from "lucide-react";

import OpcionSiNo from "@/components/operaciones/OpcionSiNo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { guardarTareaPermisoAlturas } from "@/services/permisosAlturasService";

// Según la Resolución 4272 de 2021, el trabajo en alturas es el que se
// realiza a 2,0 m o más. Por debajo solo se advierte, no se bloquea.
const ALTURA_MINIMA_METROS = 2;

const aSiNo = (valor) => (valor == null ? "" : valor ? "SI" : "NO");

const desdePermiso = (permiso) => ({
  tipoTrabajoAlturas: permiso?.tipo_trabajo_alturas || "",
  alturaAproximadaMetros:
    permiso?.altura_aproximada_metros != null
      ? String(permiso.altura_aproximada_metros)
      : "",
  descripcionProcedimiento: permiso?.descripcion_procedimiento || "",
  herramientasUtensilios: permiso?.herramientas_utensilios || "",
  reEntrenamiento: aSiNo(permiso?.re_entrenamiento),
  sistemasAcceso: permiso?.sistemas_acceso || "",
  sistemasIngenieria: permiso?.sistemas_ingenieria || "",
  medidasColectivas: permiso?.medidas_colectivas || "",
  trabajoSuspension: aSiNo(permiso?.trabajo_suspension),
});

/**
 * Paso 3 del permiso: 2. Datos básicos de la tarea y 3. Medidas de prevención.
 */
const PasoTareaPermisoAlturas = ({
  permiso,
  editable,
  onGuardado,
  onAnterior,
}) => {
  const [formulario, setFormulario] = useState(() => desdePermiso(permiso));
  const [guardando, setGuardando] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const obligatorios = [
      formulario.tipoTrabajoAlturas,
      formulario.alturaAproximadaMetros,
      formulario.descripcionProcedimiento,
      formulario.herramientasUtensilios,
      formulario.reEntrenamiento,
      formulario.sistemasAcceso,
      formulario.trabajoSuspension,
    ];

    if (obligatorios.some((valor) => !String(valor).trim())) {
      toast({
        title: "Campos requeridos",
        description: "Completa todos los campos marcados con *.",
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
          tipoTrabajoAlturas: formulario.tipoTrabajoAlturas.trim(),
          descripcionProcedimiento: formulario.descripcionProcedimiento.trim(),
          herramientasUtensilios: formulario.herramientasUtensilios.trim(),
          sistemasAcceso: formulario.sistemasAcceso.trim(),
          sistemasIngenieria: formulario.sistemasIngenieria.trim(),
          medidasColectivas: formulario.medidasColectivas.trim(),
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4">
        <h3 className="font-semibold text-gray-800">
          2. Datos básicos del permiso de trabajo en alturas
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
          <div className="space-y-2">
            <Label htmlFor="tipoTrabajoAlturas">
              Tipo de trabajo en alturas *
            </Label>

            <Input
              id="tipoTrabajoAlturas"
              value={formulario.tipoTrabajoAlturas}
              maxLength={150}
              placeholder="Ej.: limpieza de fachada, mantenimiento de techos"
              onChange={(e) =>
                actualizarCampo("tipoTrabajoAlturas", e.target.value)
              }
              disabled={deshabilitado}
            />
          </div>

          <div className="space-y-2">
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

        <div className="space-y-2">
          <Label htmlFor="herramientasUtensilios">
            Herramientas y utensilios a utilizar *
          </Label>

          <Textarea
            id="herramientasUtensilios"
            rows={3}
            maxLength={4000}
            value={formulario.herramientasUtensilios}
            placeholder="Lista las herramientas y utensilios"
            onChange={(e) =>
              actualizarCampo("herramientasUtensilios", e.target.value)
            }
            disabled={deshabilitado}
          />
        </div>
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

        <div className="space-y-2">
          <Label htmlFor="sistemasAcceso">
            Sistemas de acceso a utilizar *
          </Label>

          <Input
            id="sistemasAcceso"
            value={formulario.sistemasAcceso}
            maxLength={300}
            placeholder="Ej.: escalera, andamio, plataforma elevadora"
            onChange={(e) => actualizarCampo("sistemasAcceso", e.target.value)}
            disabled={deshabilitado}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sistemasIngenieria">
              Sistemas de ingeniería, ¿cuál?
            </Label>

            <Input
              id="sistemasIngenieria"
              value={formulario.sistemasIngenieria}
              maxLength={300}
              placeholder="Si aplica"
              onChange={(e) =>
                actualizarCampo("sistemasIngenieria", e.target.value)
              }
              disabled={deshabilitado}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medidasColectivas">
              Medidas colectivas de prevención, ¿cuáles?
            </Label>

            <Input
              id="medidasColectivas"
              value={formulario.medidasColectivas}
              maxLength={300}
              placeholder="Si aplica"
              onChange={(e) =>
                actualizarCampo("medidasColectivas", e.target.value)
              }
              disabled={deshabilitado}
            />
          </div>
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
