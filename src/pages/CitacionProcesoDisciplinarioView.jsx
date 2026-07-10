import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import DescargosProcesoDisciplinarioView from "@/pages/DescargosProcesoDisciplinarioView";

import {
  crearCitacionProcesoDisciplinario,
  obtenerCitacionPorProceso,
  actualizarCitacionProcesoDisciplinario,
} from "@/services/citacionProcesoDisciplinarioService";


function obtenerMensajeErrorBackend(error) {
  const detalle = error?.response?.data?.detail;

  if (!detalle) {
    return "No se pudo guardar la citación del proceso disciplinario.";
  }

  if (typeof detalle === "string") {
    return detalle;
  }

  if (typeof detalle === "object") {
    return (
      detalle.mensaje ||
      "No se pudo guardar la citación del proceso disciplinario."
    );
  }

  return "No se pudo guardar la citación del proceso disciplinario.";
}


export default function CitacionProcesoDisciplinarioView({
  onBack,
  proceso,
  trabajador,
}) {
  const [vista, setVista] = useState("citacion");

  const [citacionExistente, setCitacionExistente] = useState(null);

  const [fechaCitacion, setFechaCitacion] = useState("");
  const [horaCitacion, setHoraCitacion] = useState("");
  const [lugarCitacion, setLugarCitacion] = useState("");
  const [motivoCitacion, setMotivoCitacion] = useState("");
  const [relatoHechos, setRelatoHechos] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [loadingGuardar, setLoadingGuardar] = useState(false);
  const [loadingCitacion, setLoadingCitacion] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("error");


  useEffect(() => {
    async function cargarCitacionExistente() {
      if (!proceso?.IdProcesoDisciplinario) {
        return;
      }

      try {
        setLoadingCitacion(true);
        setMensaje("");

        const data = await obtenerCitacionPorProceso(
          proceso.IdProcesoDisciplinario
        );

        if (!data) {
          setCitacionExistente(null);
          return;
        }

        setCitacionExistente(data);
        setFechaCitacion(data.FechaCitacion || "");

        setHoraCitacion(
          data.HoraCitacion
            ? String(data.HoraCitacion).slice(0, 5)
            : ""
        );

        setLugarCitacion(data.LugarCitacion || "");

        const textoMotivo = data.MotivoCitacion || "";
        const partesRelato = textoMotivo.split(
          "Relato de los hechos:"
        );

        const motivo = partesRelato[0]?.trim() || "";
        const resto = partesRelato[1] || "";

        const partesObservaciones = resto.split(
          "Observaciones:"
        );

        const relato =
          partesObservaciones[0]?.trim() || "";

        const obs =
          partesObservaciones[1]?.trim() || "";

        setMotivoCitacion(motivo);
        setRelatoHechos(relato);
        setObservaciones(obs);
      } catch (error) {
        console.error(
          "No fue posible cargar la citación existente:",
          error
        );

        setCitacionExistente(null);
      } finally {
        setLoadingCitacion(false);
      }
    }

    cargarCitacionExistente();
  }, [proceso?.IdProcesoDisciplinario]);


  const limpiarMensaje = () => {
    setMensaje("");
    setTipoMensaje("error");
  };


  const handleContinuar = async () => {
    try {
      setLoadingGuardar(true);
      setMensaje("");
      setTipoMensaje("error");

      if (!proceso?.IdProcesoDisciplinario) {
        setMensaje(
          "No existe un proceso disciplinario asociado."
        );
        return;
      }

      if (
        !fechaCitacion ||
        !horaCitacion ||
        !lugarCitacion.trim() ||
        !motivoCitacion.trim() ||
        !relatoHechos.trim()
      ) {
        setMensaje(
          "Complete la fecha, hora, lugar, tipo de falta y relato de los hechos para continuar."
        );
        return;
      }

      const motivoCompleto =
        `${motivoCitacion.trim()}\n\n` +
        `Relato de los hechos:\n${relatoHechos.trim()}\n\n` +
        `Observaciones:\n${observaciones.trim()}`;

      const datosCitacion = {
        FechaCitacion: fechaCitacion,
        HoraCitacion: horaCitacion,
        LugarCitacion: lugarCitacion.trim(),
        MotivoCitacion: motivoCompleto,
      };

      if (
        citacionExistente?.IdCitacionProcesoDisciplinario
      ) {
        const citacionActualizada =
          await actualizarCitacionProcesoDisciplinario(
            citacionExistente.IdCitacionProcesoDisciplinario,
            datosCitacion
          );

        setCitacionExistente(
          citacionActualizada || citacionExistente
        );
      } else {
        const nuevaCitacion =
          await crearCitacionProcesoDisciplinario({
            IdProcesoDisciplinario:
              proceso.IdProcesoDisciplinario,
            ...datosCitacion,
          });

        setCitacionExistente(nuevaCitacion);
      }

      setTipoMensaje("exito");
      setMensaje(
        "La citación fue guardada correctamente."
      );

      setVista("descargos");
    } catch (error) {
      console.error(
        "Error al guardar la citación disciplinaria:",
        error
      );

      setTipoMensaje("error");
      setMensaje(
        obtenerMensajeErrorBackend(error)
      );
    } finally {
      setLoadingGuardar(false);
    }
  };


  if (vista === "descargos") {
    return (
      <DescargosProcesoDisciplinarioView
        onBack={() => setVista("citacion")}
        proceso={proceso}
        trabajador={trabajador}
      />
    );
  }


  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-emerald-600">

        {/* ENCABEZADO */}

        <div className="mb-6">
          <p className="text-sm text-emerald-700 font-semibold">
            Relaciones Laborales
          </p>

          <h2 className="text-2xl font-bold text-gray-800">
            Citación a Descargos
          </h2>

          <p className="text-sm text-gray-500">
            Paso 2 de 4: revisión de la citación
            disciplinaria.
          </p>
        </div>


        {/* PASOS DEL PROCESO */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4">
            <p className="text-xs font-semibold text-emerald-700">
              Paso 1
            </p>

            <p className="font-bold text-gray-800">
              Iniciar
            </p>
          </div>

          <div className="rounded-xl border border-blue-300 bg-blue-50 p-4">
            <p className="text-xs font-semibold text-blue-700">
              Paso 2
            </p>

            <p className="font-bold text-gray-800">
              Citación
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold text-gray-500">
              Paso 3
            </p>

            <p className="font-bold text-gray-700">
              Descargos
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold text-gray-500">
              Paso 4
            </p>

            <p className="font-bold text-gray-700">
              Cierre
            </p>
          </div>
        </div>


        {/* INFORMACIÓN GENERAL */}

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 mb-6">
          <h3 className="font-bold text-blue-800">
            Revisión de la citación
          </h3>

          <p className="text-sm text-gray-600 mt-2">
            Relaciones Laborales revisa la información programada
            para el trabajador y continúa con el expediente
            disciplinario.
          </p>
        </div>


        {/* INFORMACIÓN DEL TRABAJADOR */}

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 mb-6">
          <h3 className="font-bold text-emerald-800 mb-4">
            Información del trabajador
          </h3>

          {trabajador ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 rounded-xl bg-white p-5 border border-emerald-200">
              <div>
                <p className="text-xs text-gray-500">
                  Nombre
                </p>

                <p className="font-semibold text-gray-800">
                  {trabajador.NombreCompleto || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Documento
                </p>

                <p className="font-semibold text-gray-800">
                  {trabajador.TipoDocumento || ""}{" "}
                  {trabajador.NumeroDocumento || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Cargo
                </p>

                <p className="font-semibold text-gray-800">
                  {trabajador.Cargo || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Cliente
                </p>

                <p className="font-semibold text-gray-800">
                  {trabajador.ClienteNombre || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Sede
                </p>

                <p className="font-semibold text-gray-800">
                  {trabajador.Sede || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Fecha de ingreso
                </p>

                <p className="font-semibold text-gray-800">
                  {trabajador.FechaIngreso || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Estado
                </p>

                <p className="font-semibold text-gray-800">
                  {trabajador.Estado || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Proceso
                </p>

                <p className="font-semibold text-gray-800">
                  {proceso?.IdProcesoDisciplinario
                    ? `#${proceso.IdProcesoDisciplinario}`
                    : "—"}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-emerald-300 bg-white p-10">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-5">
                  <span className="text-2xl font-bold text-emerald-700">
                    RRLL
                  </span>
                </div>

                <h4 className="text-xl font-bold text-gray-800">
                  No hay un trabajador seleccionado
                </h4>

                <p className="text-gray-500 mt-2 max-w-xl">
                  La información será cargada automáticamente
                  cuando el trabajador sea seleccionado en el paso
                  anterior.
                </p>
              </div>
            </div>
          )}
        </div>


        {/* INFORMACIÓN DE LA CITACIÓN */}

        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Información de la citación
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Verifique la fecha, hora y lugar registrados antes
                de continuar con los descargos.
              </p>
            </div>

            {loadingCitacion && (
              <p className="text-sm font-semibold text-blue-700">
                Cargando citación...
              </p>
            )}

            {!loadingCitacion && citacionExistente && (
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                Citación registrada
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Fecha de la citación
              </label>

              <Input
                type="date"
                value={fechaCitacion}
                onChange={(event) => {
                  setFechaCitacion(event.target.value);
                  limpiarMensaje();
                }}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Hora de la citación
              </label>

              <Input
                type="time"
                value={horaCitacion}
                onChange={(event) => {
                  setHoraCitacion(event.target.value);
                  limpiarMensaje();
                }}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Modalidad
              </label>

              <Input
                placeholder="Pendiente de integración"
                disabled
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Lugar
              </label>

              <Input
                value={lugarCitacion}
                onChange={(event) => {
                  setLugarCitacion(event.target.value);
                  limpiarMensaje();
                }}
                placeholder="Lugar de la citación"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Responsable de RRLL
              </label>

              <Input
                placeholder="Pendiente de usuario autenticado"
                disabled
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Supervisor que reporta
              </label>

              <Input
                placeholder="Pendiente de integración"
                disabled
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Cliente
              </label>

              <Input
                value={trabajador?.ClienteNombre || ""}
                disabled
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Sede
              </label>

              <Input
                value={trabajador?.Sede || ""}
                disabled
              />
            </div>
          </div>
        </div>


        {/* HECHOS DEL CASO */}

        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-5">
            Hechos del caso
          </h3>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Tipo de falta disciplinaria
              </label>

              <Input
                placeholder="Ingrese el tipo de falta"
                value={motivoCitacion}
                onChange={(event) => {
                  setMotivoCitacion(event.target.value);
                  limpiarMensaje();
                }}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Relato de los hechos
              </label>

              <textarea
                className="w-full min-h-[120px] resize-none rounded-lg border border-gray-300 p-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Describa los hechos que originan la citación..."
                value={relatoHechos}
                onChange={(event) => {
                  setRelatoHechos(event.target.value);
                  limpiarMensaje();
                }}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Observaciones adicionales
              </label>

              <textarea
                className="w-full min-h-[100px] resize-none rounded-lg border border-gray-300 p-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Registre observaciones adicionales..."
                value={observaciones}
                onChange={(event) => {
                  setObservaciones(event.target.value);
                  limpiarMensaje();
                }}
              />
            </div>
          </div>
        </div>


        {/* EVIDENCIAS */}

        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-5">
            Evidencias del proceso
          </h3>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center bg-gray-50">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <span className="text-xl font-bold text-emerald-700">
                DOC
              </span>
            </div>

            <h4 className="font-bold text-gray-700 mt-4">
              Todavía no existen evidencias asociadas
            </h4>

            <p className="text-gray-500 mt-2">
              Aquí aparecerán fotografías, actas, llamados de
              atención y demás documentos relacionados con el
              proceso disciplinario.
            </p>

            <Button
              className="mt-5 bg-emerald-700 hover:bg-emerald-800"
              disabled
            >
              Adjuntar documentos
            </Button>
          </div>
        </div>


        {/* NOTIFICACIONES */}

        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-5">
            Notificaciones automáticas
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            <div className="rounded-xl border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-800">
                Trabajador
              </h4>

              <p className="text-sm text-gray-500 mt-2">
                Se enviará la citación al correo registrado del
                trabajador.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-800">
                Supervisor
              </h4>

              <p className="text-sm text-gray-500 mt-2">
                Se notificará al supervisor responsable del proceso.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-800">
                Relaciones Laborales
              </h4>

              <p className="text-sm text-gray-500 mt-2">
                El sistema dejará trazabilidad completa del envío.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-800">
                Calendario corporativo
              </h4>

              <p className="text-sm text-gray-500 mt-2">
                La citación programada será visible en la agenda
                disciplinaria.
              </p>
            </div>
          </div>
        </div>


        {/* ESTADO Y MENSAJES */}

        <div
          className={
            mensaje
              ? tipoMensaje === "exito"
                ? "rounded-xl border border-emerald-200 bg-emerald-50 p-5 mb-6"
                : "rounded-xl border border-red-200 bg-red-50 p-5 mb-6"
              : citacionExistente
                ? "rounded-xl border border-emerald-200 bg-emerald-50 p-5 mb-6"
                : "rounded-xl border border-amber-200 bg-amber-50 p-5 mb-6"
          }
        >
          <h3
            className={
              mensaje
                ? tipoMensaje === "exito"
                  ? "font-bold text-emerald-800"
                  : "font-bold text-red-800"
                : citacionExistente
                  ? "font-bold text-emerald-800"
                  : "font-bold text-amber-800"
            }
          >
            Estado de la citación
          </h3>

          {!mensaje && citacionExistente && (
            <p className="text-sm text-gray-700 mt-2">
              La citación ya se encuentra registrada. Puede revisar
              la información y continuar con los descargos.
            </p>
          )}

          {!mensaje && !citacionExistente && (
            <p className="text-sm text-gray-700 mt-2">
              La citación todavía no ha sido registrada. Complete la
              información obligatoria para continuar con el proceso.
            </p>
          )}

          {mensaje && (
            <p
              className={
                tipoMensaje === "exito"
                  ? "text-sm font-semibold text-emerald-700 mt-2"
                  : "text-sm font-semibold text-red-700 mt-2"
              }
            >
              {mensaje}
            </p>
          )}
        </div>


        {/* BOTONES */}

        <div className="flex flex-col md:flex-row justify-between gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={loadingGuardar}
          >
            Volver
          </Button>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              disabled
            >
              Guardar borrador
            </Button>

            <Button
              className="bg-emerald-700 hover:bg-emerald-800"
              onClick={handleContinuar}
              disabled={
                loadingGuardar ||
                loadingCitacion
              }
            >
              {loadingGuardar
                ? "Guardando..."
                : citacionExistente
                  ? "Actualizar y continuar"
                  : "Guardar y continuar"}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}