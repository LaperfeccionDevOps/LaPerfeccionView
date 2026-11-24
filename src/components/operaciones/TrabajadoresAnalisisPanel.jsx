import React, { useEffect, useState } from "react";
import { Loader2, Trash2, UserPlus } from "lucide-react";

import BuscadorPersonaContratada from "@/components/operaciones/BuscadorPersonaContratada";
import CampoFirma from "@/components/operaciones/CampoFirma";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  agregarTrabajadorAnalisis,
  obtenerFirmaTrabajadorAnalisis,
  obtenerTrabajadoresAnalisis,
  quitarTrabajadorAnalisis,
} from "@/services/analisisTrabajoSeguroService";
import { formatearFecha } from "@/utils/permisosAlturas";

const FirmaMiniatura = ({ idAnalisis, idTrabajador }) => {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vigente = true;
    let urlCreada = null;

    obtenerFirmaTrabajadorAnalisis(idAnalisis, idTrabajador)
      .then((blob) => {
        if (vigente) {
          urlCreada = URL.createObjectURL(blob);
          setUrl(urlCreada);
        }
      })
      .catch(() => vigente && setError(true));

    return () => {
      vigente = false;
      if (urlCreada) {
        URL.revokeObjectURL(urlCreada);
      }
    };
  }, [idAnalisis, idTrabajador]);

  if (error) {
    return <span className="text-xs text-red-500">No disponible</span>;
  }

  if (!url) {
    return <span className="text-xs text-gray-400">Cargando...</span>;
  }

  return (
    <a href={url} target="_blank" rel="noreferrer" title="Ver firma completa">
      <img
        src={url}
        alt="Firma del trabajador"
        className="h-10 w-28 rounded border border-gray-200 bg-white object-contain"
      />
    </a>
  );
};

/**
 * Trabajadores que realizan la tarea del análisis de trabajo seguro. Se
 * agregan uno por uno y cada uno solo firma.
 */
const TrabajadoresAnalisisPanel = ({
  idAnalisis,
  editable = true,
  onCantidadCambia = () => {},
}) => {
  const [trabajadores, setTrabajadores] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
  const [firmaPng, setFirmaPng] = useState(null);
  const [versionFirma, setVersionFirma] = useState(0);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!idAnalisis) {
      return;
    }

    setCargando(true);

    obtenerTrabajadoresAnalisis(idAnalisis)
      .then(setTrabajadores)
      .catch((error) =>
        toast({
          title: "No se pudieron cargar los trabajadores",
          description: error.message,
          variant: "destructive",
        })
      )
      .finally(() => setCargando(false));
  }, [idAnalisis]);

  const limpiarSeleccion = () => {
    setSeleccionado(null);
    setFirmaPng(null);
    setVersionFirma((version) => version + 1);
  };

  const handleAgregar = async (e) => {
    e.preventDefault();

    if (!seleccionado) {
      toast({
        title: "Campos requeridos",
        description: "Selecciona el trabajador.",
        variant: "destructive",
      });
      return;
    }

    if (!firmaPng) {
      toast({
        title: "Firma requerida",
        description: "El trabajador debe firmar antes de agregarlo al análisis.",
        variant: "destructive",
      });
      return;
    }

    setGuardando(true);

    try {
      const nuevo = await agregarTrabajadorAnalisis(idAnalisis, {
        idRegistroPersonal: seleccionado.id_registro_personal,
        firmaPng,
      });

      const lista = [...trabajadores, nuevo];
      setTrabajadores(lista);
      onCantidadCambia(lista.length);
      limpiarSeleccion();

      toast({
        title: "Trabajador agregado",
        description: `${nuevo.nombre_completo} quedó registrado en el análisis.`,
      });
    } catch (error) {
      toast({
        title: "No se pudo agregar el trabajador",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleQuitar = async (trabajador) => {
    const confirmado = window.confirm(
      `¿Quitar a ${trabajador.nombre_completo} de este análisis?`
    );

    if (!confirmado) {
      return;
    }

    try {
      await quitarTrabajadorAnalisis(
        idAnalisis,
        trabajador.id_analisis_trabajo_seguro_trabajador
      );

      const lista = trabajadores.filter(
        (t) =>
          t.id_analisis_trabajo_seguro_trabajador !==
          trabajador.id_analisis_trabajo_seguro_trabajador
      );

      setTrabajadores(lista);
      onCantidadCambia(lista.length);
    } catch (error) {
      toast({
        title: "No se pudo quitar el trabajador",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {editable && (
      <form
        onSubmit={handleAgregar}
        className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4"
      >
        <h3 className="font-semibold text-gray-800">Agregar trabajador</h3>

        <BuscadorPersonaContratada
          id="buscarTrabajadorAnalisis"
          label="Trabajador *"
          seleccionado={seleccionado}
          onSeleccionar={(persona) =>
            persona ? setSeleccionado(persona) : limpiarSeleccion()
          }
          disabled={guardando}
          // Una persona solo puede estar una vez en el mismo análisis.
          idsNoSeleccionables={trabajadores.map((t) => t.id_registro_personal)}
          motivoNoSeleccionable="Ya registrado en este análisis"
        />

        <CampoFirma
          key={versionFirma}
          id="firmaTrabajadorAnalisis"
          label="Firma del trabajador *"
          onChange={setFirmaPng}
          disabled={guardando}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={guardando || !seleccionado}
            className="h-11 gap-2 rounded-xl bg-emerald-600 px-6 text-white hover:bg-emerald-700"
          >
            {guardando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Agregar trabajador
          </Button>
        </div>
      </form>
      )}

      <div>
        <h3 className="mb-3 font-semibold text-gray-800">
          Trabajadores registrados ({trabajadores.length})
        </h3>

        {cargando ? (
          <p className="text-sm text-gray-500">Cargando trabajadores...</p>
        ) : trabajadores.length === 0 ? (
          <p className="text-sm text-gray-500">
            Este análisis aún no tiene trabajadores.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100">
            {trabajadores.map((trabajador) => (
              <li
                key={trabajador.id_analisis_trabajo_seguro_trabajador}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="break-words font-medium text-gray-800">
                    {trabajador.nombre_completo}
                  </p>
                  <p className="text-xs text-gray-500">
                    C.C. {trabajador.numero_identificacion} · Firmó{" "}
                    {formatearFecha(trabajador.fecha_firma)}
                  </p>
                </div>

                <FirmaMiniatura
                  idAnalisis={idAnalisis}
                  idTrabajador={trabajador.id_analisis_trabajo_seguro_trabajador}
                />

                {editable && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuitar(trabajador)}
                    title="Quitar del análisis"
                    className="text-red-500 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TrabajadoresAnalisisPanel;
