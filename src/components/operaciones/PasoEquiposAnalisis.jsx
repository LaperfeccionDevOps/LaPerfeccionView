import React, { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";

import SeleccionMultiple from "@/components/operaciones/SeleccionMultiple";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { guardarEquiposAnalisis } from "@/services/analisisTrabajoSeguroService";
import { obtenerOpcionesTareaAlturas } from "@/services/permisosAlturasService";
import {
  CODIGO_PERMISO_OTRO,
  LISTAS_EQUIPOS_ANALISIS,
  TEXTOS_EQUIPOS_ANALISIS,
  esOpcionNoAplica,
} from "@/utils/analisisTrabajoSeguro";

const seleccionInicial = (analisis) =>
  Object.fromEntries(
    LISTAS_EQUIPOS_ANALISIS.map(({ campo }) => [
      campo,
      (analisis[campo] || []).map((o) => o.id_opcion_permiso_alturas),
    ])
  );

const textosIniciales = (analisis) =>
  Object.fromEntries(
    TEXTOS_EQUIPOS_ANALISIS.map(({ campo }) => [campo, analisis[campo] || ""])
  );

/**
 * Bloque 3 del análisis (Equipos): listas de selección múltiple del catálogo
 * compartido con el permiso de trabajo en alturas y los campos abiertos de la
 * tarea. Todos son obligatorios.
 */
const PasoEquiposAnalisis = ({ analisis, editable = true, onGuardado = () => {} }) => {
  // Opciones por campo: [{ id, nombre, codigo }].
  const [opciones, setOpciones] = useState({});
  const [seleccion, setSeleccion] = useState(() => seleccionInicial(analisis));
  const [textos, setTextos] = useState(() => textosIniciales(analisis));
  const [otroPermiso, setOtroPermiso] = useState(
    analisis.otro_permiso_requerido || ""
  );
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [intentoGuardar, setIntentoGuardar] = useState(false);

  useEffect(() => {
    obtenerOpcionesTareaAlturas()
      .then((lista) => {
        setOpciones(
          Object.fromEntries(
            LISTAS_EQUIPOS_ANALISIS.map(({ campo, tipo, ordenAlfabetico }) => {
              const activas = lista
                .filter((opcion) => opcion.tipo === tipo)
                .map((opcion) => ({
                  id: opcion.id_opcion_permiso_alturas,
                  nombre: opcion.nombre,
                  codigo: opcion.codigo,
                }));

              // Las ya elegidas que HSEQ haya inactivado se siguen mostrando.
              const inactivas = (analisis[campo] || [])
                .filter(
                  (elegida) =>
                    !activas.some(
                      (o) => o.id === elegida.id_opcion_permiso_alturas
                    )
                )
                .map((elegida) => ({
                  id: elegida.id_opcion_permiso_alturas,
                  nombre: elegida.nombre,
                }));

              const todas = [...activas, ...inactivas];

              if (ordenAlfabetico) {
                todas.sort(
                  (a, b) =>
                    esOpcionNoAplica(a.codigo) - esOpcionNoAplica(b.codigo) ||
                    a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
                );
              }

              return [campo, todas];
            })
          )
        );
      })
      .catch((error) =>
        toast({
          title: "No se pudieron cargar las opciones",
          description: error.message,
          variant: "destructive",
        })
      )
      .finally(() => setCargando(false));
  }, [analisis]);

  const idOtroPermiso = (opciones.permisos_requeridos || []).find(
    (opcion) => opcion.codigo === CODIGO_PERMISO_OTRO
  )?.id;
  const requiereOtroPermiso =
    idOtroPermiso != null && seleccion.permisos_requeridos.includes(idOtroPermiso);

  const cambiarSeleccion = (campo, nuevos) => {
    let valor = nuevos;
    const idNoAplica = (opciones[campo] || []).find((opcion) =>
      esOpcionNoAplica(opcion.codigo)
    )?.id;

    // "No aplica" excluye a las demás opciones de su lista.
    if (idNoAplica != null) {
      const anteriores = seleccion[campo];
      const marcoNoAplica =
        nuevos.includes(idNoAplica) && !anteriores.includes(idNoAplica);

      valor = marcoNoAplica
        ? [idNoAplica]
        : nuevos.filter((id) => id !== idNoAplica);
    }

    setSeleccion((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleGuardar = async () => {
    setIntentoGuardar(true);

    const incompleta = LISTAS_EQUIPOS_ANALISIS.find(
      ({ campo }) => seleccion[campo].length === 0
    );

    if (incompleta) {
      toast({
        title: "Campos requeridos",
        description: `Elige al menos una opción en «${incompleta.etiqueta}».`,
        variant: "destructive",
      });
      return;
    }

    if (requiereOtroPermiso && !otroPermiso.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Escribe cuál otro permiso se necesita.",
        variant: "destructive",
      });
      return;
    }

    const textoVacio = TEXTOS_EQUIPOS_ANALISIS.find(
      ({ campo }) => !textos[campo].trim()
    );

    if (textoVacio) {
      toast({
        title: "Campos requeridos",
        description: `Completa «${textoVacio.etiqueta}».`,
        variant: "destructive",
      });
      return;
    }

    setGuardando(true);

    try {
      const actualizado = await guardarEquiposAnalisis(
        analisis.id_analisis_trabajo_seguro,
        {
          ...seleccion,
          ...Object.fromEntries(
            TEXTOS_EQUIPOS_ANALISIS.map(({ campo }) => [
              campo,
              textos[campo].trim(),
            ])
          ),
          otro_permiso_requerido: requiereOtroPermiso ? otroPermiso.trim() : null,
        }
      );

      onGuardado(actualizado);

      toast({
        title: "Equipos guardados",
        description: "Se registró el bloque de equipos del análisis.",
      });
    } catch (error) {
      toast({
        title: "No se pudo guardar el bloque de equipos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <p className="text-sm text-gray-500">Cargando opciones...</p>;
  }

  const bloqueado = guardando || !editable;

  return (
    <div className="space-y-6">
      {LISTAS_EQUIPOS_ANALISIS.map(({ campo, etiqueta }) => (
        <SeleccionMultiple
          key={campo}
          id={`${campo}Analisis`}
          label={`${etiqueta} *`}
          opciones={opciones[campo] || []}
          seleccionados={seleccion[campo]}
          onChange={(nuevos) => cambiarSeleccion(campo, nuevos)}
          disabled={bloqueado}
          invalido={intentoGuardar && seleccion[campo].length === 0}
          mensajeError="Elige al menos una opción."
          variante="cuadricula"
        />
      ))}

      {requiereOtroPermiso && (
        <div className="space-y-2">
          <Label htmlFor="otroPermisoAnalisis">¿Cuál otro permiso? *</Label>
          <Input
            id="otroPermisoAnalisis"
            maxLength={300}
            value={otroPermiso}
            onChange={(e) => setOtroPermiso(e.target.value)}
            disabled={bloqueado}
            aria-invalid={intentoGuardar && !otroPermiso.trim()}
            className={intentoGuardar && !otroPermiso.trim() ? "border-red-300" : undefined}
          />
        </div>
      )}

      {TEXTOS_EQUIPOS_ANALISIS.map(({ campo, etiqueta }) => {
        const vacio = intentoGuardar && !textos[campo].trim();

        return (
          <div key={campo} className="space-y-2">
            <Label htmlFor={`${campo}Analisis`}>{etiqueta} *</Label>

            <Textarea
              id={`${campo}Analisis`}
              rows={4}
              maxLength={4000}
              value={textos[campo]}
              onChange={(e) =>
                setTextos((prev) => ({ ...prev, [campo]: e.target.value }))
              }
              disabled={bloqueado}
              aria-invalid={vacio}
              className={vacio ? "border-red-300" : undefined}
            />

            {vacio && (
              <p className="text-xs text-red-600">Este campo es obligatorio.</p>
            )}
          </div>
        );
      })}

      {editable && (
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleGuardar}
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
      </div>
      )}
    </div>
  );
};

export default PasoEquiposAnalisis;
