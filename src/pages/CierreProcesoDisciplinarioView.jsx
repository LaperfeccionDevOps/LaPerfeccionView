import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  crearCierreProcesoDisciplinario,
  obtenerCierrePorProceso,
  actualizarCierreProcesoDisciplinario,
} from "@/services/cierreProcesoDisciplinarioService";


const LIMITES = {
  tipoCierre: 150,
  medidaDisciplinaria: 500,
  conclusionRRLL: 4000,
  responsableCierre: 150,
};


const SUGERENCIAS_TIPO_CIERRE = [
  "Con medida disciplinaria",
  "Sin medida disciplinaria",
  "Archivo del proceso",
];


const SUGERENCIAS_MEDIDA = [
  "Llamado de atención verbal",
  "Llamado de atención escrito",
  "Suspensión",
  "Terminación del contrato",
  "Sin medida disciplinaria",
];


function obtenerMensajeError(error) {
  const detail =
    error?.response?.data?.detail ??
    error?.data?.detail ??
    error?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (detail?.mensaje) {
    return detail.mensaje;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const primerError = detail[0];

    if (primerError?.msg) {
      return String(primerError.msg).replace(
        /^Value error,\s*/i,
        ""
      );
    }
  }

  if (error?.message) {
    return error.message;
  }

  return "No se pudo cerrar el proceso disciplinario.";
}


function limpiarTexto(valor) {
  return String(valor || "").trim();
}


export default function CierreProcesoDisciplinarioView({
  onBack,
  proceso,
  trabajador,
}) {
  const [fechaCierre, setFechaCierre] = useState("");
  const [tipoCierre, setTipoCierre] = useState("");
  const [
    medidaDisciplinaria,
    setMedidaDisciplinaria,
  ] = useState("");
  const [conclusionRRLL, setConclusionRRLL] =
    useState("");
  const [
    responsableCierre,
    setResponsableCierre,
  ] = useState("");

  const [loadingGuardar, setLoadingGuardar] =
    useState(false);
  const [loadingCierre, setLoadingCierre] =
    useState(true);

  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] =
    useState("");

  const [finalizado, setFinalizado] =
    useState(false);
  const [
    cierreExistente,
    setCierreExistente,
  ] = useState(null);


  useEffect(() => {
    async function cargarCierreExistente() {
      if (!proceso?.IdProcesoDisciplinario) {
        setLoadingCierre(false);
        return;
      }

      try {
        setLoadingCierre(true);

        const data = await obtenerCierrePorProceso(
          proceso.IdProcesoDisciplinario
        );

        if (!data) {
          setCierreExistente(null);
          setFinalizado(false);
          return;
        }

        setCierreExistente(data);
        setFechaCierre(data.FechaCierre || "");
        setTipoCierre(data.TipoCierre || "");
        setMedidaDisciplinaria(
          data.MedidaDisciplinaria || ""
        );
        setConclusionRRLL(
          data.ConclusionRRLL || ""
        );
        setResponsableCierre(
          data.ResponsableCierre || ""
        );
        setFinalizado(true);
      } catch (error) {
        /*
         * Cuando el proceso todavía no tiene cierre,
         * el servicio puede responder 404.
         * En ese caso se deja el formulario disponible.
         */
        setCierreExistente(null);
        setFinalizado(false);
      } finally {
        setLoadingCierre(false);
      }
    }

    cargarCierreExistente();
  }, [proceso?.IdProcesoDisciplinario]);


  const erroresFormulario = useMemo(() => {
    const errores = {};

    const tipoCierreLimpio =
      limpiarTexto(tipoCierre);

    const medidaLimpia =
      limpiarTexto(medidaDisciplinaria);

    const conclusionLimpia =
      limpiarTexto(conclusionRRLL);

    const responsableLimpio =
      limpiarTexto(responsableCierre);

    if (!tipoCierreLimpio) {
      errores.tipoCierre =
        "El tipo de cierre es obligatorio.";
    } else if (tipoCierreLimpio.length < 3) {
      errores.tipoCierre =
        "El tipo de cierre debe tener mínimo 3 caracteres.";
    }

    if (!medidaLimpia) {
      errores.medidaDisciplinaria =
        "La medida disciplinaria es obligatoria.";
    } else if (medidaLimpia.length < 3) {
      errores.medidaDisciplinaria =
        "La medida disciplinaria debe tener mínimo 3 caracteres.";
    }

    if (!conclusionLimpia) {
      errores.conclusionRRLL =
        "La conclusión de Relaciones Laborales es obligatoria.";
    } else if (conclusionLimpia.length < 3) {
      errores.conclusionRRLL =
        "La conclusión debe tener mínimo 3 caracteres.";
    }

    if (!responsableLimpio) {
      errores.responsableCierre =
        "El responsable del cierre es obligatorio.";
    } else if (responsableLimpio.length < 3) {
      errores.responsableCierre =
        "El responsable debe tener mínimo 3 caracteres.";
    }

    return errores;
  }, [
    tipoCierre,
    medidaDisciplinaria,
    conclusionRRLL,
    responsableCierre,
  ]);


  const formularioValido =
    Object.keys(erroresFormulario).length === 0;


  const seleccionarTipoCierre = (valor) => {
    if (finalizado) return;

    setTipoCierre(valor);
    setMensaje("");
    setTipoMensaje("");
  };


  const seleccionarMedida = (valor) => {
    if (finalizado) return;

    setMedidaDisciplinaria(valor);
    setMensaje("");
    setTipoMensaje("");
  };


  const handleFinalizar = async () => {
    if (loadingGuardar || finalizado) {
      return;
    }

    setMensaje("");
    setTipoMensaje("");

    if (!proceso?.IdProcesoDisciplinario) {
      setMensaje(
        "No existe un proceso disciplinario asociado."
      );
      setTipoMensaje("error");
      return;
    }

    if (!formularioValido) {
      const primerError =
        Object.values(erroresFormulario)[0];

      setMensaje(
        primerError ||
          "Complete todos los campos obligatorios."
      );
      setTipoMensaje("error");
      return;
    }

    const payload = {
      IdProcesoDisciplinario:
        proceso.IdProcesoDisciplinario,

      FechaCierre:
        fechaCierre || null,

      TipoCierre:
        limpiarTexto(tipoCierre),

      MedidaDisciplinaria:
        limpiarTexto(medidaDisciplinaria),

      ConclusionRRLL:
        limpiarTexto(conclusionRRLL),

      ResponsableCierre:
        limpiarTexto(responsableCierre),
    };

    try {
      setLoadingGuardar(true);

      if (
        cierreExistente
          ?.IdCierreProcesoDisciplinario
      ) {
        /*
         * Se conserva esta alternativa por compatibilidad.
         * El backend bloqueará la actualización cuando
         * el proceso ya se encuentre cerrado.
         */
        const cierreActualizado =
          await actualizarCierreProcesoDisciplinario(
            cierreExistente
              .IdCierreProcesoDisciplinario,
            payload
          );

        setCierreExistente(
          cierreActualizado || cierreExistente
        );
      } else {
        const nuevoCierre =
          await crearCierreProcesoDisciplinario(
            payload
          );

        setCierreExistente(nuevoCierre);
      }

      setTipoCierre(payload.TipoCierre);
      setMedidaDisciplinaria(
        payload.MedidaDisciplinaria
      );
      setConclusionRRLL(
        payload.ConclusionRRLL
      );
      setResponsableCierre(
        payload.ResponsableCierre
      );

      setFinalizado(true);
      setTipoMensaje("exito");
      setMensaje(
        "El proceso disciplinario fue cerrado correctamente."
      );
    } catch (error) {
      console.error(
        "Error al cerrar el proceso disciplinario:",
        error
      );

      setTipoMensaje("error");
      setMensaje(obtenerMensajeError(error));
    } finally {
      setLoadingGuardar(false);
    }
  };


  if (loadingCierre) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-emerald-600">
          <p className="text-center text-gray-600">
            Consultando información del cierre...
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-emerald-600">
        <div className="mb-6">
          <p className="text-sm text-emerald-700 font-semibold">
            Relaciones Laborales
          </p>

          <h2 className="text-2xl font-bold text-gray-800">
            Cierre del Proceso Disciplinario
          </h2>

          <p className="text-sm text-gray-500">
            Paso 4 de 4: decisión final y generación
            del documento de cierre.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
          {[
            "Iniciar",
            "Citación",
            "Descargos",
            "Cierre",
          ].map((item, index) => (
            <div
              key={item}
              className={`rounded-xl border p-4 ${
                index < 3
                  ? "bg-emerald-50 border-emerald-300"
                  : "bg-blue-50 border-blue-300"
              }`}
            >
              <p className="text-xs font-semibold">
                Paso {index + 1}
              </p>

              <p className="font-bold">
                {item}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 mb-6">
          <h3 className="font-bold text-blue-800">
            Decisión final del proceso
          </h3>

          <p className="text-sm text-gray-600 mt-2">
            Relaciones Laborales revisa la diligencia
            de descargos, define la medida final y
            registra la conclusión del expediente.
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 mb-6">
          <h3 className="font-bold text-emerald-800 mb-4">
            Resumen del expediente
          </h3>

          {trabajador ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 rounded-xl bg-white p-5 border border-emerald-200">
              <div>
                <p className="text-xs text-gray-500">
                  Nombre
                </p>

                <p className="font-semibold text-gray-800">
                  {trabajador.NombreCompleto ||
                    "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Documento
                </p>

                <p className="font-semibold text-gray-800">
                  {trabajador.TipoDocumento || ""}
                  {trabajador.TipoDocumento
                    ? " "
                    : ""}
                  {trabajador.NumeroDocumento ||
                    "—"}
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
            <div className="rounded-xl border-2 border-dashed border-emerald-300 bg-white p-10 text-center">
              <h4 className="text-xl font-bold text-gray-800">
                Expediente pendiente de cargar
              </h4>

              <p className="text-gray-500 mt-2">
                Aquí se mostrará el resumen del
                trabajador y del proceso disciplinario.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            Resultado del proceso
          </h3>

          <p className="text-sm text-gray-500 mb-5">
            Los campos continúan siendo de escritura
            libre. Las opciones rápidas son solamente
            sugerencias.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-medium text-gray-800">
                Tipo de cierre
                <span className="text-red-600">
                  {" "}
                  *
                </span>
              </label>

              <Input
                placeholder="Escriba el tipo de cierre"
                value={tipoCierre}
                maxLength={LIMITES.tipoCierre}
                onChange={(event) => {
                  setTipoCierre(event.target.value);
                  setMensaje("");
                  setTipoMensaje("");
                }}
                disabled={finalizado}
                className={
                  !finalizado &&
                  erroresFormulario.tipoCierre
                    ? "border-red-400"
                    : ""
                }
              />

              <div className="flex justify-between gap-3 mt-1">
                <p className="text-xs text-red-600">
                  {!finalizado
                    ? erroresFormulario.tipoCierre ||
                      ""
                    : ""}
                </p>

                <p className="text-xs text-gray-500 whitespace-nowrap">
                  {tipoCierre.length}/
                  {LIMITES.tipoCierre}
                </p>
              </div>

              {!finalizado && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {SUGERENCIAS_TIPO_CIERRE.map(
                    (sugerencia) => (
                      <button
                        key={sugerencia}
                        type="button"
                        onClick={() =>
                          seleccionarTipoCierre(
                            sugerencia
                          )
                        }
                        className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                      >
                        {sugerencia}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-800">
                Fecha de cierre
              </label>

              <Input
                type="date"
                value={fechaCierre}
                onChange={(event) =>
                  setFechaCierre(
                    event.target.value
                  )
                }
                disabled={finalizado}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-800">
                Responsable de cierre
                <span className="text-red-600">
                  {" "}
                  *
                </span>
              </label>

              <Input
                value={responsableCierre}
                maxLength={
                  LIMITES.responsableCierre
                }
                onChange={(event) => {
                  setResponsableCierre(
                    event.target.value
                  );
                  setMensaje("");
                  setTipoMensaje("");
                }}
                placeholder="Nombre del responsable de RRLL"
                disabled={finalizado}
                className={
                  !finalizado &&
                  erroresFormulario
                    .responsableCierre
                    ? "border-red-400"
                    : ""
                }
              />

              <div className="flex justify-between gap-3 mt-1">
                <p className="text-xs text-red-600">
                  {!finalizado
                    ? erroresFormulario
                        .responsableCierre || ""
                    : ""}
                </p>

                <p className="text-xs text-gray-500 whitespace-nowrap">
                  {responsableCierre.length}/
                  {LIMITES.responsableCierre}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-800">
                Medida disciplinaria
                <span className="text-red-600">
                  {" "}
                  *
                </span>
              </label>

              <textarea
                className={`w-full border rounded-lg p-3 min-h-[105px] resize-y ${
                  !finalizado &&
                  erroresFormulario
                    .medidaDisciplinaria
                    ? "border-red-400"
                    : ""
                }`}
                placeholder="Describa libremente la medida disciplinaria"
                value={medidaDisciplinaria}
                maxLength={
                  LIMITES.medidaDisciplinaria
                }
                onChange={(event) => {
                  setMedidaDisciplinaria(
                    event.target.value
                  );
                  setMensaje("");
                  setTipoMensaje("");
                }}
                disabled={finalizado}
              />

              <div className="flex justify-between gap-3 mt-1">
                <p className="text-xs text-red-600">
                  {!finalizado
                    ? erroresFormulario
                        .medidaDisciplinaria || ""
                    : ""}
                </p>

                <p className="text-xs text-gray-500 whitespace-nowrap">
                  {medidaDisciplinaria.length}/
                  {LIMITES.medidaDisciplinaria}
                </p>
              </div>

              {!finalizado && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {SUGERENCIAS_MEDIDA.map(
                    (sugerencia) => (
                      <button
                        key={sugerencia}
                        type="button"
                        onClick={() =>
                          seleccionarMedida(
                            sugerencia
                          )
                        }
                        className="rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800 hover:bg-blue-100"
                      >
                        {sugerencia}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            Conclusión de Relaciones Laborales
            <span className="text-red-600">
              {" "}
              *
            </span>
          </h3>

          <p className="text-sm text-gray-500 mb-4">
            Registre la decisión final, la valoración
            de los hechos y las consideraciones de
            Relaciones Laborales.
          </p>

          <textarea
            className={`w-full border rounded-lg p-3 min-h-[180px] resize-y ${
              !finalizado &&
              erroresFormulario.conclusionRRLL
                ? "border-red-400"
                : ""
            }`}
            placeholder="Escriba la conclusión final del proceso disciplinario"
            value={conclusionRRLL}
            maxLength={LIMITES.conclusionRRLL}
            onChange={(event) => {
              setConclusionRRLL(
                event.target.value
              );
              setMensaje("");
              setTipoMensaje("");
            }}
            disabled={finalizado}
          />

          <div className="flex justify-between gap-3 mt-1">
            <p className="text-xs text-red-600">
              {!finalizado
                ? erroresFormulario.conclusionRRLL ||
                  ""
                : ""}
            </p>

            <p className="text-xs text-gray-500 whitespace-nowrap">
              {conclusionRRLL.length}/
              {LIMITES.conclusionRRLL}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-5">
            Documento de cierre
          </h3>

          <div className="border-2 border-dashed rounded-xl p-10 text-center bg-gray-50">
            <h4 className="font-bold text-gray-700">
              Documento de cierre pendiente
            </h4>

            <p className="text-gray-500 mt-2">
              El documento final será generado según
              la decisión registrada por Relaciones
              Laborales.
            </p>

            <Button
              className="mt-5 bg-emerald-700 hover:bg-emerald-800"
              disabled
            >
              Generar documento
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-5">
            Firma y archivo
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold">
                Firma del trabajador
              </h4>

              <p className="text-sm text-gray-500 mt-2">
                Pendiente de firma del colaborador.
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-semibold">
                Firma de la empresa
              </h4>

              <p className="text-sm text-gray-500 mt-2">
                Pendiente de firma del responsable
                autorizado.
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-semibold">
                Archivo final
              </h4>

              <p className="text-sm text-gray-500 mt-2">
                Pendiente de guardar en la carpeta del
                trabajador.
              </p>
            </div>
          </div>
        </div>

        <div
          className={`rounded-xl border p-5 mb-6 ${
            finalizado
              ? "border-emerald-200 bg-emerald-50"
              : "border-yellow-200 bg-yellow-50"
          }`}
        >
          <h3
            className={`font-bold ${
              finalizado
                ? "text-emerald-800"
                : "text-yellow-800"
            }`}
          >
            Estado del cierre
          </h3>

          <p className="text-sm text-gray-600 mt-2">
            {finalizado
              ? "El proceso se encuentra cerrado y disponible únicamente para consulta."
              : "Complete los campos obligatorios para finalizar el expediente."}
          </p>

          {mensaje && (
            <p
              className={`text-sm font-semibold mt-3 ${
                tipoMensaje === "exito"
                  ? "text-emerald-700"
                  : "text-red-600"
              }`}
            >
              {mensaje}
            </p>
          )}
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-3">
          <Button
            variant="outline"
            onClick={onBack}
          >
            Volver
          </Button>

          <div className="flex gap-3">
            <Button variant="outline" disabled>
              Guardar borrador
            </Button>

            <Button
              className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60"
              onClick={handleFinalizar}
              disabled={
                loadingGuardar ||
                finalizado ||
                !formularioValido
              }
            >
              {loadingGuardar
                ? "Finalizando..."
                : finalizado
                  ? "Proceso finalizado"
                  : "Finalizar proceso"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}