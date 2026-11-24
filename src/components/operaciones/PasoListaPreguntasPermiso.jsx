import React, { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";

import OpcionSiNoNa from "@/components/operaciones/OpcionSiNoNa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

/**
 * Paso del permiso basado en una lista de preguntas Sí / No / No aplica
 * (catálogo "ItemPermisoAlturas"). Se usa para el paso 4 (protección) y
 * servirá para los pasos 5 (verificación) y 6 (peligros).
 *
 * - `cargar(idPermiso)` -> { items, otro }
 * - `guardar(idPermiso, respuestas, otro)` -> permiso actualizado
 * - `campoOtro` (opcional) -> { label, placeholder }: campo abierto opcional.
 */
const PasoListaPreguntasPermiso = ({
  permiso,
  editable,
  cargar,
  guardar,
  campoOtro,
  mensajeGuardado,
  onGuardado,
  onAnterior,
}) => {
  const idPermiso = permiso.id_permiso_trabajo_alturas;

  const [items, setItems] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [otro, setOtro] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [intentoGuardar, setIntentoGuardar] = useState(false);

  useEffect(() => {
    setCargando(true);

    cargar(idPermiso)
      .then(({ items: lista, otro: textoOtro }) => {
        setItems(lista);
        setRespuestas(
          Object.fromEntries(
            lista.map((item) => [item.id_item_permiso_alturas, item.respuesta || ""])
          )
        );
        setOtro(textoOtro || "");
      })
      .catch((error) =>
        toast({
          title: "No se pudieron cargar las preguntas",
          description: error.message,
          variant: "destructive",
        })
      )
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idPermiso]);

  const respondidas = items.filter(
    (item) => respuestas[item.id_item_permiso_alturas]
  ).length;
  const deshabilitado = !editable || guardando;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIntentoGuardar(true);

    if (respondidas < items.length) {
      toast({
        title: "Preguntas sin responder",
        description: `Faltan ${items.length - respondidas} por responder.`,
        variant: "destructive",
      });
      return;
    }

    setGuardando(true);

    try {
      const actualizado = await guardar(
        idPermiso,
        items.map((item) => ({
          id_item_permiso_alturas: item.id_item_permiso_alturas,
          respuesta: respuestas[item.id_item_permiso_alturas],
        })),
        otro.trim()
      );

      toast({ title: mensajeGuardado });
      onGuardado(actualizado);
    } catch (error) {
      toast({
        title: "No se pudieron guardar las respuestas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando preguntas...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          Responde cada ítem con Sí, No o No aplica.
        </p>

        <span
          className={cn(
            "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
            respondidas === items.length
              ? "bg-emerald-100 text-emerald-800"
              : "bg-gray-100 text-gray-600"
          )}
        >
          {respondidas} de {items.length} respondidas
        </span>
      </div>

      <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
        {items.map((item, indice) => {
          const sinResponder =
            intentoGuardar && !respuestas[item.id_item_permiso_alturas];

          return (
            <li
              key={item.id_item_permiso_alturas}
              className={cn(
                "flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
                sinResponder && "bg-red-50"
              )}
            >
              <p className="text-sm text-gray-800">
                <span className="mr-2 text-xs font-semibold text-gray-400">
                  {indice + 1}.
                </span>
                {item.texto}
                {sinResponder && (
                  <span className="ml-2 text-xs text-red-600">Sin responder</span>
                )}
              </p>

              <OpcionSiNoNa
                id={`item-${item.id_item_permiso_alturas}`}
                etiqueta={item.texto}
                value={respuestas[item.id_item_permiso_alturas]}
                onChange={(valor) =>
                  setRespuestas((prev) => ({
                    ...prev,
                    [item.id_item_permiso_alturas]: valor,
                  }))
                }
                disabled={deshabilitado}
              />
            </li>
          );
        })}
      </ul>

      {campoOtro && (
        <div className="space-y-2">
          <Label htmlFor="otroItemPermiso">{campoOtro.label}</Label>

          <Input
            id="otroItemPermiso"
            value={otro}
            maxLength={300}
            placeholder={campoOtro.placeholder}
            onChange={(e) => setOtro(e.target.value)}
            disabled={deshabilitado}
          />
        </div>
      )}

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

export default PasoListaPreguntasPermiso;
