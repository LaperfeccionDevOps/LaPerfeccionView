import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import BuscadorPersonaContratada from "@/components/operaciones/BuscadorPersonaContratada";
import CampoFirma from "@/components/operaciones/CampoFirma";
import OpcionSiNo from "@/components/operaciones/OpcionSiNo";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import {
  autorizarPermisoAlturas,
  obtenerFirmaPermisoAlturas,
  obtenerPermisoAlturas,
  reenviarCorreoPermisoAlturas,
} from "@/services/permisosAlturasService";
import {
  ROLES_FIRMA_PERMISO,
  formatearFecha,
  pasosPendientesAutorizacion,
} from "@/utils/permisosAlturas";

const FORMULARIO_INICIAL = {
  autoriza: null,
  firmaAutoriza: null,
  firmaCoordinador: null,
  emergencias: null,
  firmaEmergencias: null,
  aplicaAyudante: "",
  ayudante: null,
  firmaAyudante: null,
  observaciones: "",
};

const Bloque = ({ titulo, children }) => (
  <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
    <h3 className="font-semibold text-gray-800">{titulo}</h3>
    {children}
  </section>
);

const FirmaRegistrada = ({ idPermiso, rol }) => {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let vigente = true;
    let urlCreada = null;

    obtenerFirmaPermisoAlturas(idPermiso, rol)
      .then((blob) => {
        if (vigente) {
          urlCreada = URL.createObjectURL(blob);
          setUrl(urlCreada);
        }
      })
      .catch(() => {});

    return () => {
      vigente = false;
      if (urlCreada) {
        URL.revokeObjectURL(urlCreada);
      }
    };
  }, [idPermiso, rol]);

  if (!url) {
    return <div className="h-20 w-48 animate-pulse rounded-lg bg-gray-100" />;
  }

  return (
    <img
      src={url}
      alt={`Firma: ${ROLES_FIRMA_PERMISO[rol]}`}
      className="h-20 w-48 rounded-lg border border-gray-200 bg-white object-contain"
    />
  );
};

const ResumenAutorizacion = ({ permiso, onActualizado }) => {
  const [reenviando, setReenviando] = useState(false);
  const idPermiso = permiso.id_permiso_trabajo_alturas;
  const orden = Object.keys(ROLES_FIRMA_PERMISO);
  const firmas = [...permiso.firmas].sort(
    (a, b) => orden.indexOf(a.rol) - orden.indexOf(b.rol)
  );

  const reenviar = async () => {
    setReenviando(true);

    try {
      await reenviarCorreoPermisoAlturas(idPermiso);
      toast({
        title: "Envío en proceso",
        description: "En unos segundos se actualizará el estado del correo.",
      });

      // El envío se hace en segundo plano: se consulta de nuevo el resultado.
      setTimeout(async () => {
        try {
          onActualizado(await obtenerPermisoAlturas(idPermiso));
        } finally {
          setReenviando(false);
        }
      }, 3000);
    } catch (error) {
      setReenviando(false);
      toast({
        title: "No se pudo reenviar el permiso",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-800">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold">Permiso autorizado</p>
          <p>
            {formatearFecha(permiso.fecha_autorizacion)}. Ya no se puede
            modificar.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {firmas.map((firma) => (
          <div
            key={firma.rol}
            className="space-y-2 rounded-xl border border-gray-200 p-4"
          >
            <p className="text-xs font-medium uppercase text-gray-400">
              {ROLES_FIRMA_PERMISO[firma.rol]}
            </p>
            <p className="text-sm font-semibold text-gray-800">
              {firma.nombre_completo}
              <span className="ml-2 font-normal text-gray-500">
                C.C. {firma.numero_identificacion}
              </span>
            </p>
            <FirmaRegistrada idPermiso={idPermiso} rol={firma.rol} />
          </div>
        ))}
      </div>

      {!permiso.aplica_ayudante_seguridad && (
        <p className="text-sm text-gray-500">No aplicó ayudante de seguridad.</p>
      )}

      {permiso.observaciones && (
        <div>
          <p className="text-xs font-medium uppercase text-gray-400">
            Observaciones
          </p>
          <p className="mt-1 whitespace-pre-line text-sm text-gray-800">
            {permiso.observaciones}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 text-sm">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
          {permiso.correo_enviado_a ? (
            <p className="text-gray-700">
              Enviado a <b>{permiso.correo_enviado_a}</b> el{" "}
              {formatearFecha(permiso.fecha_envio_correo)}.
            </p>
          ) : permiso.error_envio_correo ? (
            <p className="text-red-700">
              No se pudo enviar el permiso por correo.
              <span className="block text-xs text-red-500">
                {permiso.error_envio_correo}
              </span>
            </p>
          ) : (
            <p className="text-gray-500">Envío por correo en proceso.</p>
          )}
        </div>

        {!permiso.correo_enviado_a && (
          <Button
            type="button"
            variant="outline"
            onClick={reenviar}
            disabled={reenviando}
            className="h-9 shrink-0 gap-2 rounded-lg"
          >
            {reenviando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Reenviar
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * Paso 7: firmas de quien autoriza, el coordinador (responsable del permiso),
 * el responsable del plan de emergencias y el ayudante de seguridad (si
 * aplica). Al autorizar, el permiso queda bloqueado y se envía por correo.
 */
const PasoAutorizacionPermisoAlturas = ({
  permiso,
  editable,
  onAutorizado,
  onAnterior,
}) => {
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [autorizando, setAutorizando] = useState(false);
  const consultasCorreo = useRef(0);

  const pendientes = pasosPendientesAutorizacion(permiso);
  const deshabilitado = autorizando;

  const actualizarCampo = (campo, valor) => {
    setFormulario((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  // El correo se envía en segundo plano después de autorizar: se consulta el
  // resultado unas pocas veces (máximo 5) hasta que quede registrado.
  useEffect(() => {
    if (
      editable ||
      permiso.correo_enviado_a ||
      permiso.error_envio_correo ||
      consultasCorreo.current >= 5
    ) {
      return undefined;
    }

    consultasCorreo.current += 1;

    const temporizador = setTimeout(async () => {
      try {
        onAutorizado(await obtenerPermisoAlturas(permiso.id_permiso_trabajo_alturas));
      } catch {
        // Se mostrará al volver a cargar la página.
      }
    }, 3000);

    return () => clearTimeout(temporizador);
  }, [editable, permiso, onAutorizado]);

  if (!editable) {
    return (
      <div className="space-y-6">
        <ResumenAutorizacion permiso={permiso} onActualizado={onAutorizado} />

        <div className="border-t border-gray-100 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onAnterior}
            className="h-11 gap-2 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const faltantes = [
      [!formulario.autoriza, "la persona que autoriza el trabajo"],
      [!formulario.firmaAutoriza, "la firma de quien autoriza"],
      [!formulario.firmaCoordinador, "la firma del coordinador"],
      [!formulario.emergencias, "el responsable del plan de emergencias"],
      [!formulario.firmaEmergencias, "la firma del responsable del plan de emergencias"],
      [!formulario.aplicaAyudante, "si aplica ayudante de seguridad"],
      [formulario.aplicaAyudante === "SI" && !formulario.ayudante, "el ayudante de seguridad"],
      [formulario.aplicaAyudante === "SI" && !formulario.firmaAyudante, "la firma del ayudante de seguridad"],
    ]
      .filter(([falta]) => falta)
      .map(([, texto]) => texto);

    if (faltantes.length > 0) {
      toast({
        title: "Campos requeridos",
        description: `Falta: ${faltantes.join(", ")}.`,
        variant: "destructive",
      });
      return;
    }

    const confirmado = window.confirm(
      "Al autorizar, el permiso quedará bloqueado y no se podrá modificar. " +
        "Se enviará por correo a los destinatarios configurados. ¿Deseas continuar?"
    );

    if (!confirmado) {
      return;
    }

    setAutorizando(true);

    try {
      const actualizado = await autorizarPermisoAlturas(
        permiso.id_permiso_trabajo_alturas,
        {
          ...formulario,
          observaciones: formulario.observaciones.trim(),
        }
      );

      toast({
        title: "Permiso autorizado",
        description: "El permiso quedó autorizado y se está enviando por correo.",
      });

      onAutorizado(actualizado);
    } catch (error) {
      toast({
        title: "No se pudo autorizar el permiso",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAutorizando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {pendientes.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Para autorizar, completa antes los pasos:{" "}
            <b>{pendientes.join(", ")}</b>.
          </p>
        </div>
      )}

      <Bloque titulo="Persona que autoriza el trabajo">
        <BuscadorPersonaContratada
          id="personaAutoriza"
          label="Nombre de la persona que autoriza el trabajo *"
          seleccionado={formulario.autoriza}
          onSeleccionar={(persona) => actualizarCampo("autoriza", persona)}
          disabled={deshabilitado}
        />

        <CampoFirma
          id="firmaAutoriza"
          label="Firma de quien autoriza el trabajo *"
          onChange={(valor) => actualizarCampo("firmaAutoriza", valor)}
          disabled={deshabilitado}
        />
      </Bloque>

      <Bloque titulo="Coordinador">
        <div>
          <p className="text-xs font-medium uppercase text-gray-400">
            Responsable del permiso
          </p>
          <p className="mt-1 text-sm text-gray-800">
            {permiso.responsable
              ? `${permiso.responsable} · C.C. ${permiso.numero_identificacion_responsable}`
              : "Este permiso no tiene responsable registrado."}
          </p>
        </div>

        <CampoFirma
          id="firmaCoordinador"
          label="Firma del coordinador *"
          onChange={(valor) => actualizarCampo("firmaCoordinador", valor)}
          disabled={deshabilitado || !permiso.responsable}
        />
      </Bloque>

      <Bloque titulo="Plan de emergencias">
        <BuscadorPersonaContratada
          id="personaEmergencias"
          label="Nombre de la persona responsable de activar el plan de emergencias *"
          seleccionado={formulario.emergencias}
          onSeleccionar={(persona) => actualizarCampo("emergencias", persona)}
          disabled={deshabilitado}
        />

        <CampoFirma
          id="firmaEmergencias"
          label="Firma de la persona responsable de activar el plan de emergencias *"
          onChange={(valor) => actualizarCampo("firmaEmergencias", valor)}
          disabled={deshabilitado}
        />
      </Bloque>

      <Bloque titulo="Ayudante de seguridad">
        <OpcionSiNo
          id="aplicaAyudante"
          label="¿Aplica ayudante de seguridad? *"
          value={formulario.aplicaAyudante}
          onChange={(valor) =>
            setFormulario((prev) => ({
              ...prev,
              aplicaAyudante: valor,
              ...(valor === "NO" ? { ayudante: null, firmaAyudante: null } : {}),
            }))
          }
          disabled={deshabilitado}
        />

        {formulario.aplicaAyudante === "SI" && (
          <>
            <BuscadorPersonaContratada
              id="personaAyudante"
              label="Nombre del ayudante de seguridad *"
              seleccionado={formulario.ayudante}
              onSeleccionar={(persona) => actualizarCampo("ayudante", persona)}
              disabled={deshabilitado}
            />

            <CampoFirma
              id="firmaAyudante"
              label="Firma del ayudante de seguridad *"
              onChange={(valor) => actualizarCampo("firmaAyudante", valor)}
              disabled={deshabilitado}
            />
          </>
        )}
      </Bloque>

      <div className="space-y-2">
        <Label htmlFor="observacionesPermiso">Observaciones</Label>

        <Textarea
          id="observacionesPermiso"
          rows={3}
          maxLength={4000}
          value={formulario.observaciones}
          placeholder="Opcional"
          onChange={(e) => actualizarCampo("observaciones", e.target.value)}
          disabled={deshabilitado}
        />
      </div>

      <div className="flex items-start gap-2 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-800">
        <Mail className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Al autorizar, el permiso se enviará a:{" "}
          <b>{permiso.correos_notificacion.join(", ")}</b>
        </p>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onAnterior}
          disabled={autorizando}
          className="h-11 gap-2 rounded-xl"
        >
          <ArrowLeft className="h-4 w-4" />
          Anterior
        </Button>

        <Button
          type="submit"
          disabled={autorizando || pendientes.length > 0 || !permiso.responsable}
          className="h-11 gap-2 rounded-xl bg-emerald-600 px-6 text-white hover:bg-emerald-700"
        >
          {autorizando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          Autorizar permiso
        </Button>
      </div>
    </form>
  );
};

export default PasoAutorizacionPermisoAlturas;
