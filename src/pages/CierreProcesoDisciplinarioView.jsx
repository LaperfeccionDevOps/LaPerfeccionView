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
import {
  obtenerCitacionPorProceso,
} from "@/services/citacionProcesoDisciplinarioService";
import { formatearExpedienteDisciplinario } from "@/utils/formatearExpedienteDisciplinario";


const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api";

const FILE_BASE_URL = API_URL.replace(
  "/api",
  ""
);


const VERSION_BORRADOR_LOCAL = 1;


function obtenerClaveBorrador(idProcesoDisciplinario) {
  return `rrll_cierre_disciplinario_${idProcesoDisciplinario}`;
}


function leerBorradorLocal(idProcesoDisciplinario) {
  if (!idProcesoDisciplinario) {
    return null;
  }

  try {
    const valor = window.localStorage.getItem(
      obtenerClaveBorrador(idProcesoDisciplinario)
    );

    if (!valor) {
      return null;
    }

    const borrador = JSON.parse(valor);

    if (
      Number(borrador?.version) !==
      VERSION_BORRADOR_LOCAL
    ) {
      return null;
    }

    return borrador;
  } catch (error) {
    console.error(
      "No se pudo leer el borrador local del cierre:",
      error
    );

    return null;
  }
}


function eliminarBorradorLocal(idProcesoDisciplinario) {
  if (!idProcesoDisciplinario) {
    return;
  }

  window.localStorage.removeItem(
    obtenerClaveBorrador(idProcesoDisciplinario)
  );
}


function limpiarTexto(valor) {
  return String(
    valor || ""
  ).trim();
}


function formatearFechaColombiana(valor) {
  if (!valor) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat(
      "es-CO",
      {
        timeZone: "America/Bogota",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    ).format(new Date(valor));
  } catch {
    return String(valor);
  }
}


function formatearTipoDocumento(valor) {
  const tipo = String(
    valor || ""
  )
    .trim()
    .toUpperCase();

  const etiquetas = {
    PROCESO_DISCIPLINARIO:
      "Procesos disciplinarios",
    AUSENTISMO:
      "Ausentismo",
    LLAMADO_ATENCION:
      "Llamados de atención",
    DESCARGOS:
      "Descargos",
    SUSPENSION:
      "Suspensión",
  };

  return etiquetas[tipo] || valor || "—";
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
    citacionExistente,
    setCitacionExistente,
  ] = useState(null);

  const [
    fechaCierre,
    setFechaCierre,
  ] = useState(
    fechaActualColombia()
  );
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


  const [
    documentos,
    setDocumentos,
  ] = useState([]);

  const [
    mostrarFormularioDocumento,
    setMostrarFormularioDocumento,
  ] = useState(false);

  const tipoDocumento =
    "DOCUMENTO_CIERRE_DISCIPLINARIO";

  const [
    observacionDocumento,
    setObservacionDocumento,
  ] = useState("");

  const [
    archivoDocumento,
    setArchivoDocumento,
  ] = useState(null);

  const [
    loadingDocumento,
    setLoadingDocumento,
  ] = useState(false);

  const [
    mensajeDocumento,
    setMensajeDocumento,
  ] = useState("");

  const [
    tipoMensajeDocumento,
    setTipoMensajeDocumento,
  ] = useState("");


  const [
    borradorLocalRecuperado,
    setBorradorLocalRecuperado,
  ] = useState(false);

  const [
    fechaUltimoRespaldoLocal,
    setFechaUltimoRespaldoLocal,
  ] = useState(null);
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
          dataCitacion,
        ] = await Promise.all([
          obtenerCierrePorProceso(
            proceso.IdProcesoDisciplinario
          ),
          obtenerAsistentesPorProceso(
            proceso.IdProcesoDisciplinario
          ),
          obtenerCitacionPorProceso(
            proceso.IdProcesoDisciplinario
          ),
        ]);

        setCitacionExistente(
          dataCitacion || null
        );

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
            String(
              proceso?.EstadoProceso || ""
            ).toUpperCase() === "CERRADO"
              ? (
                  dataCierre.FechaCierre ||
                  fechaActualColombia()
                )
              : fechaActualColombia()
          );
setConclusionRRLL(
            dataCierre.ConclusionRRLL ||
            ""
          );

          setResponsableCierre(
            nombreResponsable
          );
        } else {
          setResponsableCierre(
            nombreResponsable
          );
        }

        const borradorLocal =
          leerBorradorLocal(
            proceso.IdProcesoDisciplinario
          );

        if (
          borradorLocal &&
          String(
            proceso?.EstadoProceso || ""
          ).toUpperCase() !== "CERRADO"
        ) {
          setFechaCierre(
            fechaActualColombia()
          );
setConclusionRRLL(
            borradorLocal.conclusionRRLL || ""
          );

          setResponsableCierre(
            nombreResponsable
          );

          setBorradorLocalRecuperado(true);
          setFechaUltimoRespaldoLocal(
            borradorLocal.fechaGuardado || null
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


  useEffect(() => {
    if (
      loadingInicial ||
      loadingResponsable ||
      finalizado ||
      !proceso?.IdProcesoDisciplinario
    ) {
      return undefined;
    }

    const guardarLocalmente = () => {
      const ahora = new Date().toISOString();

      const borrador = {
        version: VERSION_BORRADOR_LOCAL,
        idProcesoDisciplinario:
          proceso.IdProcesoDisciplinario,
        pasoActual: 4,
        fechaCierre,

        conclusionRRLL,
        responsableCierre,
        fechaGuardado: ahora,
      };

      try {
        window.localStorage.setItem(
          obtenerClaveBorrador(
            proceso.IdProcesoDisciplinario
          ),
          JSON.stringify(borrador)
        );

        setFechaUltimoRespaldoLocal(ahora);
      } catch (error) {
        console.error(
          "No se pudo guardar el borrador local del cierre:",
          error
        );
      }
    };

    const temporizador = window.setTimeout(
      guardarLocalmente,
      500
    );

    return () => {
      window.clearTimeout(temporizador);
    };
  }, [
    conclusionRRLL,
    fechaCierre,
    finalizado,
    loadingInicial,
    loadingResponsable,

    proceso?.IdProcesoDisciplinario,
    responsableCierre,

  ]);


  useEffect(() => {
    if (
      loadingInicial ||
      loadingResponsable ||
      finalizado ||
      !proceso?.IdProcesoDisciplinario
    ) {
      return undefined;
    }

    const intervalo = window.setInterval(() => {
      const ahora = new Date().toISOString();

      const borrador = {
        version: VERSION_BORRADOR_LOCAL,
        idProcesoDisciplinario:
          proceso.IdProcesoDisciplinario,
        pasoActual: 4,
        fechaCierre,

        conclusionRRLL,
        responsableCierre,
        fechaGuardado: ahora,
      };

      try {
        window.localStorage.setItem(
          obtenerClaveBorrador(
            proceso.IdProcesoDisciplinario
          ),
          JSON.stringify(borrador)
        );

        setFechaUltimoRespaldoLocal(ahora);
      } catch (error) {
        console.error(
          "No se pudo actualizar el borrador local del cierre:",
          error
        );
      }
    }, 15000);

    return () => {
      window.clearInterval(intervalo);
    };
  }, [
    conclusionRRLL,
    fechaCierre,
    finalizado,
    loadingInicial,
    loadingResponsable,

    proceso?.IdProcesoDisciplinario,
    responsableCierre,

  ]);


  const obtenerUrlDocumento = (
    rutaArchivo
  ) => {
    if (!rutaArchivo) {
      return "";
    }

    const rutaLimpia = String(
      rutaArchivo
    ).replaceAll("\\", "/");

    return `${FILE_BASE_URL}/${rutaLimpia}`;
  };


  const obtenerUrlArchivoDocumento = (
    documento
  ) => {
    const idDocumento =
      documento
        ?.IdDocumentoProcesoDisciplinario ||
      null;

    if (idDocumento) {
      return (
        `${API_URL}/documento-proceso-disciplinario/` +
        `${idDocumento}/archivo`
      );
    }

    return obtenerUrlDocumento(
      documento?.RutaArchivo
    );
  };


  const abrirDocumento = (
    documento
  ) => {
    const url =
      obtenerUrlArchivoDocumento(
        documento
      );

    if (!url) {
      setMensajeDocumento(
        "No se encontró el archivo del documento para visualizar."
      );
      return;
    }

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };


  const descargarDocumento = async (
    rutaArchivo,
    nombreArchivo,
    idDocumento = null
  ) => {
    try {
      const url = idDocumento
        ? (
            `${API_URL}/documento-proceso-disciplinario/` +
            `${idDocumento}/descargar`
          )
        : obtenerUrlDocumento(
            rutaArchivo
          );

      if (!url) {
        throw new Error(
          "No se encontró la ruta del documento para descargar."
        );
      }

      const response = await fetch(
        url,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        let detalle = "";

        try {
          const data =
            await response.json();

          detalle =
            typeof data?.detail ===
            "string"
              ? data.detail
              : data?.detail?.mensaje ||
                data?.message ||
                "";
        } catch {
          detalle = "";
        }

        throw new Error(
          detalle ||
            "No fue posible descargar el documento."
        );
      }

      const blob =
        await response.blob();

      const urlTemporal =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement("a");

      link.href = urlTemporal;
      link.download =
        nombreArchivo ||
        "documento";
      link.style.display = "none";

      document.body.appendChild(
        link
      );
      link.click();
      document.body.removeChild(
        link
      );

      window.setTimeout(() => {
        window.URL.revokeObjectURL(
          urlTemporal
        );
      }, 1000);
    } catch (error) {
      console.error(
        "Error descargando documento:",
        error
      );

      setMensajeDocumento(
        error?.message ||
          "No fue posible descargar el documento."
      );
    }
  };


  const cargarDocumentosRRLL =
    async () => {
      if (
        !proceso
          ?.IdProcesoDisciplinario
      ) {
        setDocumentos([]);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/documento-proceso-disciplinario/proceso/` +
          `${proceso.IdProcesoDisciplinario}`
        );

        if (!response.ok) {
          throw new Error(
            "No se pudieron consultar los documentos."
          );
        }

        const data =
          await response.json();

        const listaDocumentos =
          Array.isArray(data)
            ? data
            : [];

        setDocumentos(
          listaDocumentos.filter(
            (documento) =>
              String(
                documento
                  ?.TipoDocumento ||
                  ""
              )
                .trim()
                .toUpperCase() ===
              "DOCUMENTO_CIERRE_DISCIPLINARIO"
          )
        );
      } catch (error) {
        console.error(
          "Error cargando documentos aportados por RRLL:",
          error
        );

        setDocumentos([]);
        setTipoMensajeDocumento("error");
        setMensajeDocumento(
          "No fue posible consultar los documentos aportados por Relaciones Laborales."
        );
      }
    };


  useEffect(() => {
    cargarDocumentosRRLL();
  }, [
    proceso?.IdProcesoDisciplinario,
  ]);


  const handleSubirDocumento =
    async () => {
      if (
        !proceso
          ?.IdProcesoDisciplinario
      ) {
        setTipoMensajeDocumento("error");
        setMensajeDocumento(
          "No existe un proceso disciplinario asociado."
        );
        return;
      }

      if (!archivoDocumento) {
        setTipoMensajeDocumento("error");
        setMensajeDocumento(
          "Debe seleccionar un archivo."
        );
        return;
      }

      try {
        setLoadingDocumento(true);
        setMensajeDocumento("");
        setTipoMensajeDocumento("");

        const formData =
          new FormData();

        formData.append(
          "IdProcesoDisciplinario",
          proceso
            .IdProcesoDisciplinario
        );

        formData.append(
          "TipoDocumento",
          tipoDocumento
        );

        formData.append(
          "Observacion",
          observacionDocumento
        );

        formData.append(
          "archivo",
          archivoDocumento
        );

        const response = await fetch(
          `${API_URL}/documento-proceso-disciplinario/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          let detalle = "";

          try {
            const data =
              await response.json();

            detalle =
              typeof data?.detail ===
              "string"
                ? data.detail
                : data?.detail?.mensaje ||
                  data?.message ||
                  "";
          } catch {
            detalle = "";
          }

          throw new Error(
            detalle ||
              "No se pudo cargar el documento."
          );
        }

        setArchivoDocumento(null);
        setObservacionDocumento("");
        setMostrarFormularioDocumento(
          false
        );

        setTipoMensajeDocumento("exito");
        setMensajeDocumento(
          "Documento cargado correctamente en el expediente y la Carpeta Digital."
        );

        await cargarDocumentosRRLL();
      } catch (error) {
        console.error(
          "Error cargando documento de RRLL:",
          error
        );

        setTipoMensajeDocumento("error");
        setMensajeDocumento(
          error?.message ||
            "No se pudo cargar el documento."
        );
      } finally {
        setLoadingDocumento(false);
      }
    };


  const handleEliminarDocumentoCierre =
    async (documento) => {
      const idDocumento =
        documento
          ?.IdDocumentoProcesoDisciplinario;

      if (!idDocumento) {
        setTipoMensajeDocumento("error");
        setMensajeDocumento(
          "No se encontró el identificador del documento de cierre."
        );
        return;
      }

      const confirmado = window.confirm(
        `¿Desea eliminar "${documento?.NombreArchivo || "este documento"}" del expediente y de la Carpeta Digital?`
      );

      if (!confirmado) {
        return;
      }

      try {
        setLoadingDocumento(true);
        setMensajeDocumento("");
        setTipoMensajeDocumento("");

        const response = await fetch(
          `${API_URL}/documento-proceso-disciplinario/rrll/documento-cierre/${idDocumento}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          let detalle = "";

          try {
            const data =
              await response.json();

            detalle =
              typeof data?.detail ===
              "string"
                ? data.detail
                : data?.detail?.mensaje ||
                  data?.message ||
                  "";
          } catch {
            detalle = "";
          }

          throw new Error(
            detalle ||
              "No fue posible eliminar el documento de cierre."
          );
        }

        setTipoMensajeDocumento("exito");
        setMensajeDocumento(
          "Documento de cierre eliminado correctamente del expediente y la Carpeta Digital."
        );

        await cargarDocumentosRRLL();
      } catch (error) {
        console.error(
          "Error eliminando documento de cierre:",
          error
        );

        setTipoMensajeDocumento("error");
        setMensajeDocumento(
          error?.message ||
            "No fue posible eliminar el documento de cierre."
        );
      } finally {
        setLoadingDocumento(false);
      }
    };


  const errores = useMemo(() => {
    const resultado = {};
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
return resultado;
  }, [
    conclusionRRLL,
    fechaCierre,

    responsableCierre,

  ]);


  const construirPayload = () => ({
    IdProcesoDisciplinario:
      proceso.IdProcesoDisciplinario,

    FechaCierre:
      fechaCierre || null,
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

    eliminarBorradorLocal(
      proceso.IdProcesoDisciplinario
    );
    setBorradorLocalRecuperado(false);
    setFechaUltimoRespaldoLocal(null);

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

      if (documentos.length === 0) {
        setTipoMensaje("error");
        setMensaje(
          "Debe adjuntar al menos un Documento de cierre disciplinario antes de finalizar el proceso."
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

        eliminarBorradorLocal(
          proceso.IdProcesoDisciplinario
        );
        setBorradorLocalRecuperado(false);
        setFechaUltimoRespaldoLocal(null);
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


  const handleVolver = () => {
    if (
      !finalizado &&
      proceso?.IdProcesoDisciplinario
    ) {
      const ahora = new Date().toISOString();

      const borrador = {
        version: VERSION_BORRADOR_LOCAL,
        idProcesoDisciplinario:
          proceso.IdProcesoDisciplinario,
        pasoActual: 4,
        fechaCierre,

        conclusionRRLL,
        responsableCierre,
        fechaGuardado: ahora,
      };

      try {
        window.localStorage.setItem(
          obtenerClaveBorrador(
            proceso.IdProcesoDisciplinario
          ),
          JSON.stringify(borrador)
        );
      } catch (error) {
        console.error(
          "No se pudo conservar el borrador antes de volver:",
          error
        );
      }
    }

    onBack();
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

        {borradorLocalRecuperado && !finalizado && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
            <h3 className="font-bold text-blue-800">
              Borrador local recuperado
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Se recuperó la información que estaba diligenciando en este cierre. Puede continuar desde donde quedó.
            </p>
          </div>
        )}

        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <h3 className="mb-4 font-bold text-emerald-800">
            Resumen del expediente
          </h3>

          {trabajador ? (
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-emerald-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-5">
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
                  Teléfono
                </p>

                <p className="font-semibold text-gray-800">
                  {citacionExistente?.TelefonoTrabajador ||
                    trabajador?.TelefonoTrabajador ||
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
                  Expediente disciplinario
                </p>

                <p className="font-semibold text-gray-800">
                  {proceso?.IdProcesoDisciplinario
                    ? formatearExpedienteDisciplinario(
                        proceso,
                        proceso?.FechaCreacion ||
                          cierreExistente?.FechaCierre ||
                          fechaCierre
                      )
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
                Fecha de cierre *
              </label>

              <Input
                type="date"
                value={fechaCierre}
                readOnly
                disabled
                className="bg-gray-50"
              />

              {!finalizado &&
                errores.fechaCierre && (
                  <p className="mt-2 text-xs text-red-600">
                    {errores.fechaCierre}
                  </p>
                )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-800">
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
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Documento de cierre disciplinario
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Adjunte aquí el documento de cierre elaborado por Relaciones Laborales para conservarlo en el expediente disciplinario.
              </p>
            </div>

            {!finalizado && (
              <Button
                className="bg-emerald-700 hover:bg-emerald-800"
                type="button"
                onClick={() => {
                  setMostrarFormularioDocumento(
                    !mostrarFormularioDocumento
                  );
                  setMensajeDocumento("");
                  setTipoMensajeDocumento("");
                }}
              >
                {mostrarFormularioDocumento
                  ? "Cancelar carga"
                  : "Adjuntar documento de cierre"}
              </Button>
            )}
          </div>

          {mostrarFormularioDocumento &&
            !finalizado && (
              <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold">
                      Observación
                    </label>

                    <Input
                      value={observacionDocumento}
                      onChange={(event) =>
                        setObservacionDocumento(
                          event.target.value
                        )
                      }
                      placeholder="Observación del documento de cierre"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold">
                      Archivo
                    </label>

                    <Input
                      type="file"
                      onChange={(event) =>
                        setArchivoDocumento(
                          event.target.files?.[0] ||
                            null
                        )
                      }
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    type="button"
                    className="bg-emerald-700 hover:bg-emerald-800"
                    onClick={
                      handleSubirDocumento
                    }
                    disabled={
                      loadingDocumento
                    }
                  >
                    {loadingDocumento
                      ? "Cargando..."
                      : "Guardar documento"}
                  </Button>
                </div>
              </div>
            )}

          {mensajeDocumento && (
            <p
              className={`mb-4 text-sm font-semibold ${
                tipoMensajeDocumento === "error"
                  ? "text-red-600"
                  : "text-emerald-700"
              }`}
            >
              {mensajeDocumento}
            </p>
          )}

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Documento
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {documentos.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="py-12 text-center text-gray-500"
                    >
                      No se ha adjuntado el documento de cierre disciplinario.
                    </td>
                  </tr>
                ) : (
                  documentos.map(
                    (doc) => (
                      <tr
                        key={
                          doc.IdDocumentoProcesoDisciplinario
                        }
                        className="border-t"
                      >
                        <td className="px-4 py-3 text-sm font-semibold">
                          {doc.NombreArchivo ||
                            "Documento"}
                        </td>

                        <td className="px-4 py-3 text-sm">
                          {formatearFechaColombiana(
                            doc.FechaCreacion
                          )}
                        </td>

                        <td className="px-4 py-3 text-center text-sm">
                          <div className="flex justify-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                abrirDocumento(
                                  doc
                                )
                              }
                            >
                              Ver
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                descargarDocumento(
                                  doc.RutaArchivo,
                                  doc.NombreArchivo,
                                  doc.IdDocumentoProcesoDisciplinario
                                )
                              }
                            >
                              Descargar
                            </Button>

                            {!finalizado && (
                              <Button
                                type="button"
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                                disabled={loadingDocumento}
                                onClick={() =>
                                  handleEliminarDocumentoCierre(
                                    doc
                                  )
                                }
                              >
                                Eliminar
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
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
              : documentos.length === 0
                ? "Debe adjuntar al menos un Documento de cierre disciplinario antes de finalizar el proceso."
                : "Puede guardar un borrador o finalizar el proceso cuando la información esté completa."}
          </p>

          {!finalizado &&
            fechaUltimoRespaldoLocal && (
              <p className="mt-3 text-xs text-gray-500">
                Último respaldo local: {new Date(
                  fechaUltimoRespaldoLocal
                ).toLocaleString("es-CO", {
                  timeZone: "America/Bogota",
                  hour12: true,
                })}
              </p>
            )}

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
            onClick={handleVolver}
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
                documentos.length === 0 ||
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