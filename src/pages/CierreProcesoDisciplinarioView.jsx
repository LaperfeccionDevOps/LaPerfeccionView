import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  actualizarCierreProcesoDisciplinario,
  crearCierreProcesoDisciplinario,
  finalizarCierreProcesoDisciplinario,
  obtenerCierrePorProceso,
} from "@/services/cierreProcesoDisciplinarioService";

import {
  obtenerAsistentesPorProceso,
} from "@/services/asistenteDescargoProcesoDisciplinarioService";


const TIPOS_CIERRE = [
  {
    value: "CON_MEDIDA_DISCIPLINARIA",
    label: "Con medida disciplinaria",
  },
  {
    value: "SIN_MEDIDA_DISCIPLINARIA",
    label: "Sin medida disciplinaria",
  },
  {
    value: "ARCHIVO_DEL_PROCESO",
    label: "Archivo del proceso",
  },
];


const MEDIDAS_SUGERIDAS = [
  "Llamado de atención verbal",
  "Llamado de atención escrito",
  "Suspensión",
  "Terminación del contrato",
];


function limpiarTexto(valor) {
  return String(
    valor || ""
  ).trim();
}


function fechaActualColombia() {
  const partes = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).formatToParts(
    new Date()
  );

  const valores = {};

  for (const parte of partes) {
    valores[parte.type] = parte.value;
  }

  return [
    valores.year,
    valores.month,
    valores.day,
  ].join("-");
}


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

  if (
    Array.isArray(detail) &&
    detail.length > 0
  ) {
    return (
      detail[0]?.msg ||
      "No se pudo procesar la solicitud."
    );
  }

  return (
    error?.message ||
    "No se pudo procesar la solicitud."
  );
}


export default function CierreProcesoDisciplinarioView({
  onBack,
  proceso,
  trabajador,
}) {
  const [
    cierreExistente,
    setCierreExistente,
  ] = useState(null);

  const [
    fechaCierre,
    setFechaCierre,
  ] = useState(
    fechaActualColombia()
  );

  const [
    tipoCierre,
    setTipoCierre,
  ] = useState("");

  const [
    medidaDisciplinaria,
    setMedidaDisciplinaria,
  ] = useState("");

  const [
    conclusionRRLL,
    setConclusionRRLL,
  ] = useState("");

  const [
    responsableCierre,
    setResponsableCierre,
  ] = useState("");

  const [
    loadingInicial,
    setLoadingInicial,
  ] = useState(true);

  const [
    loadingResponsable,
    setLoadingResponsable,
  ] = useState(true);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    finalizado,
    setFinalizado,
  ] = useState(
    String(
      proceso?.EstadoProceso || ""
    ).toUpperCase() === "CERRADO"
  );

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    tipoMensaje,
    setTipoMensaje,
  ] = useState("");


  const requiereMedida =
    tipoCierre ===
    "CON_MEDIDA_DISCIPLINARIA";


  useEffect(() => {
    async function cargar() {
      if (
        !proceso?.IdProcesoDisciplinario
      ) {
        setLoadingInicial(false);
        setLoadingResponsable(false);
        return;
      }

      try {
        setLoadingInicial(true);
        setLoadingResponsable(true);
        setMensaje("");
        setTipoMensaje("");

        const [
          dataCierre,
          dataAsistentes,
        ] = await Promise.all([
          obtenerCierrePorProceso(
            proceso.IdProcesoDisciplinario
          ),
          obtenerAsistentesPorProceso(
            proceso.IdProcesoDisciplinario
          ),
        ]);

        const listaAsistentes =
          Array.isArray(dataAsistentes)
            ? dataAsistentes
            : [];

        const responsableRRLL =
          listaAsistentes.find(
            (asistente) =>
              String(
                asistente?.TipoAsistente || ""
              )
                .trim()
                .toUpperCase() ===
                "RESPONSABLE_RRLL" &&
              asistente?.Asistio === true
          );

        const nombreResponsable =
          limpiarTexto(
            responsableRRLL?.NombreAsistente
          );

        if (dataCierre) {
          setCierreExistente(
            dataCierre
          );

          setFechaCierre(
            dataCierre.FechaCierre ||
            fechaActualColombia()
          );

          setTipoCierre(
            dataCierre.TipoCierre || ""
          );

          setMedidaDisciplinaria(
            dataCierre.MedidaDisciplinaria ||
            ""
          );

          setConclusionRRLL(
            dataCierre.ConclusionRRLL ||
            ""
          );

          setResponsableCierre(
            dataCierre.ResponsableCierre ||
            nombreResponsable
          );
        } else {
          setResponsableCierre(
            nombreResponsable
          );
        }
      } catch (error) {
        setTipoMensaje("error");
        setMensaje(
          obtenerMensajeError(error)
        );
      } finally {
        setLoadingInicial(false);
        setLoadingResponsable(false);
      }
    }

    cargar();
  }, [
    proceso?.IdProcesoDisciplinario,
  ]);


  const errores = useMemo(() => {
    const resultado = {};

    if (!tipoCierre) {
      resultado.tipoCierre =
        "Seleccione el tipo de cierre.";
    }

    if (!fechaCierre) {
      resultado.fechaCierre =
        "La fecha de cierre es obligatoria.";
    }

    if (
      !limpiarTexto(
        responsableCierre
      )
    ) {
      resultado.responsableCierre =
        "Debe existir un Responsable de RRLL marcado como asistente en el Paso 3.";
    }

    if (
      !limpiarTexto(
        conclusionRRLL
      )
    ) {
      resultado.conclusionRRLL =
        "La conclusión de Relaciones Laborales es obligatoria.";
    }

    if (
      requiereMedida &&
      !limpiarTexto(
        medidaDisciplinaria
      )
    ) {
      resultado.medidaDisciplinaria =
        "Debe registrar la medida disciplinaria.";
    }

    return resultado;
  }, [
    conclusionRRLL,
    fechaCierre,
    medidaDisciplinaria,
    requiereMedida,
    responsableCierre,
    tipoCierre,
  ]);


  const construirPayload = () => ({
    IdProcesoDisciplinario:
      proceso.IdProcesoDisciplinario,

    FechaCierre:
      fechaCierre || null,

    TipoCierre:
      tipoCierre || null,

    MedidaDisciplinaria:
      requiereMedida
        ? limpiarTexto(
            medidaDisciplinaria
          ) || null
        : "Sin medida disciplinaria",

    ConclusionRRLL:
      limpiarTexto(
        conclusionRRLL
      ) || null,

    ResponsableCierre:
      limpiarTexto(
        responsableCierre
      ) || null,
  });


  const guardarBorrador = async (
    mostrarMensaje = true
  ) => {
    if (
      !proceso?.IdProcesoDisciplinario
    ) {
      throw new Error(
        "No existe un proceso disciplinario asociado."
      );
    }

    const payload =
      construirPayload();

    let guardado;

    if (
      cierreExistente
        ?.IdCierreProcesoDisciplinario
    ) {
      guardado =
        await actualizarCierreProcesoDisciplinario(
          cierreExistente
            .IdCierreProcesoDisciplinario,
          payload
        );
    } else {
      guardado =
        await crearCierreProcesoDisciplinario(
          payload
        );
    }

    setCierreExistente(
      guardado
    );

    if (mostrarMensaje) {
      setTipoMensaje("exito");
      setMensaje(
        "Borrador del cierre guardado correctamente."
      );
    }

    return guardado;
  };


  const handleGuardarBorrador =
    async () => {
      if (
        guardando ||
        finalizado
      ) {
        return;
      }

      try {
        setGuardando(true);
        setMensaje("");
        setTipoMensaje("");

        await guardarBorrador(
          true
        );
      } catch (error) {
        setTipoMensaje("error");
        setMensaje(
          obtenerMensajeError(error)
        );
      } finally {
        setGuardando(false);
      }
    };


  const handleFinalizar =
    async () => {
      if (
        guardando ||
        finalizado
      ) {
        return;
      }

      if (
        Object.keys(
          errores
        ).length > 0
      ) {
        setTipoMensaje("error");
        setMensaje(
          Object.values(
            errores
          )[0]
        );
        return;
      }

      try {
        setGuardando(true);
        setMensaje("");
        setTipoMensaje("");

        const borrador =
          await guardarBorrador(
            false
          );

        const cierreFinal =
          await finalizarCierreProcesoDisciplinario(
            borrador
              .IdCierreProcesoDisciplinario
          );

        setCierreExistente(
          cierreFinal
        );

        setFinalizado(true);
        setTipoMensaje("exito");
        setMensaje(
          "El proceso disciplinario fue cerrado correctamente."
        );
      } catch (error) {
        setTipoMensaje("error");
        setMensaje(
          obtenerMensajeError(error)
        );
      } finally {
        setGuardando(false);
      }
    };


  if (
    loadingInicial ||
    loadingResponsable
  ) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border-t-4 border-emerald-600 bg-white p-8 shadow-xl">
          <p className="text-center text-gray-600">
            Consultando información del cierre.
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="p-6">
      <div className="rounded-2xl border-t-4 border-emerald-600 bg-white p-8 shadow-xl">
        <div className="mb-6">
          <p className="text-sm font-semibold text-emerald-700">
            Relaciones Laborales
          </p>

          <h2 className="text-2xl font-bold text-gray-800">
            Cierre del Proceso Disciplinario
          </h2>

          <p className="text-sm text-gray-500">
            Paso 4 de 4: decisión final del expediente disciplinario.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-4">
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
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-blue-300 bg-blue-50"
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

        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <h3 className="font-bold text-blue-800">
            Decisión final del proceso
          </h3>

          <p className="mt-2 text-sm text-gray-600">
            Relaciones Laborales registra el resultado, la medida aplicable y la conclusión final.
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <h3 className="mb-4 font-bold text-emerald-800">
            Resumen del expediente
          </h3>

          {trabajador ? (
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-emerald-200 bg-white p-5 md:grid-cols-4">
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
                  {proceso
                    ?.IdProcesoDisciplinario
                    ? `#${proceso.IdProcesoDisciplinario}`
                    : "—"}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-emerald-300 bg-white p-8 text-center">
              <p className="font-semibold text-gray-700">
                No fue posible cargar el resumen del expediente.
              </p>
            </div>
          )}
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="mb-5 text-lg font-bold text-gray-800">
            Resultado del proceso
          </h3>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-800">
                Tipo de cierre *
              </label>

              <div className="grid grid-cols-1 gap-2">
                {TIPOS_CIERRE.map(
                  (opcion) => (
                    <button
                      key={opcion.value}
                      type="button"
                      disabled={finalizado}
                      onClick={() => {
                        setTipoCierre(
                          opcion.value
                        );

                        if (
                          opcion.value !==
                          "CON_MEDIDA_DISCIPLINARIA"
                        ) {
                          setMedidaDisciplinaria(
                            ""
                          );
                        }

                        setMensaje("");
                        setTipoMensaje("");
                      }}
                      className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                        tipoCierre ===
                        opcion.value
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      } disabled:cursor-not-allowed disabled:opacity-70`}
                    >
                      {opcion.label}
                    </button>
                  )
                )}
              </div>

              {!finalizado &&
                errores.tipoCierre && (
                  <p className="mt-2 text-xs text-red-600">
                    {errores.tipoCierre}
                  </p>
                )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-800">
                Fecha de cierre *
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

              {!finalizado &&
                errores.fechaCierre && (
                  <p className="mt-2 text-xs text-red-600">
                    {errores.fechaCierre}
                  </p>
                )}

              <label className="mb-2 mt-5 block text-sm font-semibold text-gray-800">
                Responsable del cierre
              </label>

              <Input
                value={responsableCierre}
                disabled
                placeholder="Sin responsable de RRLL registrado"
                className="bg-gray-50"
              />

              <p className="mt-2 text-xs text-gray-500">
                Este nombre se toma automáticamente del asistente
                marcado como Responsable de RRLL en el Paso 3.
              </p>

              {!finalizado &&
                errores.responsableCierre && (
                  <p className="mt-2 text-xs text-red-600">
                    {errores.responsableCierre}
                  </p>
                )}
            </div>

            {requiereMedida && (
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Medida disciplinaria *
                </label>

                <textarea
                  value={
                    medidaDisciplinaria
                  }
                  maxLength={500}
                  disabled={finalizado}
                  onChange={(event) => {
                    setMedidaDisciplinaria(
                      event.target.value
                    );
                    setMensaje("");
                    setTipoMensaje("");
                  }}
                  placeholder="Describa la medida disciplinaria aplicada."
                  className="min-h-[120px] w-full resize-y rounded-xl border border-gray-200 bg-white p-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-gray-50"
                />

                {!finalizado &&
                  errores
                    .medidaDisciplinaria && (
                    <p className="mt-2 text-xs text-red-600">
                      {
                        errores
                          .medidaDisciplinaria
                      }
                    </p>
                  )}

                {!finalizado && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {MEDIDAS_SUGERIDAS.map(
                      (medida) => (
                        <button
                          key={medida}
                          type="button"
                          onClick={() =>
                            setMedidaDisciplinaria(
                              medida
                            )
                          }
                          className="rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800 hover:bg-blue-100"
                        >
                          {medida}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="mb-2 text-lg font-bold text-gray-800">
            Conclusión de Relaciones Laborales *
          </h3>

          <p className="mb-4 text-sm text-gray-500">
            Registre la decisión final, la valoración de los hechos y las consideraciones de Relaciones Laborales.
          </p>

          <textarea
            value={conclusionRRLL}
            maxLength={4000}
            disabled={finalizado}
            onChange={(event) => {
              setConclusionRRLL(
                event.target.value
              );
              setMensaje("");
              setTipoMensaje("");
            }}
            placeholder="Escriba la conclusión final del proceso disciplinario."
            className="min-h-[180px] w-full resize-y rounded-xl border border-gray-200 bg-white p-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-gray-50"
          />

          <div className="mt-1 flex justify-between gap-3">
            <p className="text-xs text-red-600">
              {!finalizado
                ? errores.conclusionRRLL ||
                  ""
                : ""}
            </p>

            <p className="whitespace-nowrap text-xs text-gray-500">
              {conclusionRRLL.length}/4000
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-bold text-gray-800">
            Documento de cierre
          </h3>

          <div className="rounded-xl border-2 border-dashed bg-gray-50 p-8 text-center">
            <h4 className="font-bold text-gray-700">
              Documento pendiente de integración
            </h4>

            <p className="mt-2 text-sm text-gray-500">
              La generación del documento final se habilitará cuando se integre el servicio PDF del cierre.
            </p>

            <Button
              className="mt-5 bg-emerald-700 hover:bg-emerald-800"
              disabled
            >
              Generar documento próximamente
            </Button>
          </div>
        </div>

        <div
          className={`mb-6 rounded-xl border p-5 ${
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

          <p className="mt-2 text-sm text-gray-600">
            {finalizado
              ? "El proceso se encuentra cerrado y disponible únicamente para consulta."
              : "Puede guardar un borrador o finalizar el proceso cuando la información esté completa."}
          </p>

          {mensaje && (
            <p
              className={`mt-3 text-sm font-semibold ${
                tipoMensaje === "exito"
                  ? "text-emerald-700"
                  : "text-red-600"
              }`}
            >
              {mensaje}
            </p>
          )}
        </div>

        <div className="flex flex-col justify-between gap-3 md:flex-row">
          <Button
            variant="outline"
            onClick={onBack}
          >
            Volver
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              disabled={
                guardando ||
                finalizado
              }
              onClick={
                handleGuardarBorrador
              }
            >
              {guardando
                ? "Guardando..."
                : "Guardar borrador"}
            </Button>

            <Button
              className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60"
              disabled={
                guardando ||
                finalizado ||
                Object.keys(
                  errores
                ).length > 0
              }
              onClick={
                handleFinalizar
              }
            >
              {guardando
                ? "Procesando..."
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