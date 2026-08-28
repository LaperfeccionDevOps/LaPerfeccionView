import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import DescargosProcesoDisciplinarioView from "@/pages/DescargosProcesoDisciplinarioView";

import {
  obtenerCitacionPorProceso,
} from "@/services/citacionProcesoDisciplinarioService";
import { formatearExpedienteDisciplinario } from "@/utils/formatearExpedienteDisciplinario";


const API_URL = String(
  import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000/api"
).replace(/\/+$/, "");


function obtenerTokenAutenticacion() {
  const almacenamientos = [
    window.localStorage,
    window.sessionStorage,
  ];

  const clavesDirectas = [
    "token",
    "access_token",
    "accessToken",
    "authToken",
    "jwt",
    "jwtToken",
  ];

  for (const almacenamiento of almacenamientos) {
    for (const clave of clavesDirectas) {
      const valor = almacenamiento.getItem(clave);

      if (
        valor &&
        valor !== "null" &&
        valor !== "undefined"
      ) {
        return valor.replace(/^"|"$/g, "");
      }
    }
  }

  const clavesObjetos = [
    "auth",
    "authData",
    "user",
    "userData",
    "session",
  ];

  for (const almacenamiento of almacenamientos) {
    for (const clave of clavesObjetos) {
      const valor = almacenamiento.getItem(clave);

      if (!valor) {
        continue;
      }

      try {
        const objeto = JSON.parse(valor);

        const token =
          objeto?.token ||
          objeto?.access_token ||
          objeto?.accessToken ||
          objeto?.authToken ||
          objeto?.jwt ||
          objeto?.jwtToken ||
          objeto?.user?.token ||
          objeto?.user?.access_token;

        if (token) {
          return String(token);
        }
      } catch {
        // Continuar buscando.
      }
    }
  }

  return null;
}


function construirHeaders(incluirJson = false) {
  const token = obtenerTokenAutenticacion();

  const headers = {
    Accept: "application/json",
  };

  if (incluirJson) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}


function obtenerUsuarioAutenticado() {
  const almacenamientos = [
    window.localStorage,
    window.sessionStorage,
  ];

  const claves = [
    "user",
    "userData",
    "auth",
    "authData",
    "session",
  ];

  for (const almacenamiento of almacenamientos) {
    for (const clave of claves) {
      const valor = almacenamiento.getItem(clave);

      if (!valor) {
        continue;
      }

      try {
        const data = JSON.parse(valor);
        const usuario = data?.user || data;

        const nombre =
          usuario?.NombreCompleto ||
          usuario?.nombreCompleto ||
          usuario?.nombre ||
          usuario?.name ||
          usuario?.username ||
          usuario?.usuario ||
          usuario?.NombreUsuario;

        if (nombre) {
          return String(nombre);
        }
      } catch {
        // Continuar buscando.
      }
    }
  }

  return "Usuario de Relaciones Laborales";
}


function separarMotivoAnterior(textoCompleto) {
  const texto = String(textoCompleto || "").trim();

  if (!texto) {
    return {
      motivo: "",
      relato: "",
      observaciones: "",
    };
  }

  const partesRelato = texto.split(
    /Relato de los hechos:/i
  );

  const motivo = partesRelato[0]?.trim() || "";
  const resto = partesRelato[1] || "";

  const partesObservaciones = resto.split(
    /Observaciones:/i
  );

  return {
    motivo,
    relato:
      partesObservaciones[0]?.trim() || "",
    observaciones:
      partesObservaciones[1]?.trim() || "",
  };
}


function formatearFecha(fecha) {
  if (!fecha) {
    return "—";
  }

  const valor = String(fecha).slice(0, 10);
  const partes = valor.split("-");

  if (partes.length !== 3) {
    return valor;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


function formatearHora(hora) {
  if (!hora) {
    return "—";
  }

  return String(hora).slice(0, 5);
}


function calcularDiasAusencia(
  fechaInicio,
  fechaFin
) {
  if (!fechaInicio || !fechaFin) {
    return "";
  }

  const inicio = new Date(
    `${fechaInicio}T00:00:00`
  );

  const fin = new Date(
    `${fechaFin}T00:00:00`
  );

  if (
    Number.isNaN(inicio.getTime()) ||
    Number.isNaN(fin.getTime()) ||
    fin < inicio
  ) {
    return "";
  }

  const diferenciaMilisegundos =
    fin.getTime() - inicio.getTime();

  const diferenciaDias = Math.floor(
    diferenciaMilisegundos /
      (1000 * 60 * 60 * 24)
  );

  return diferenciaDias + 1;
}


function formatearTipoGestion(valor) {
  const textos = {
    NO_ATENCION: "No atención",
    PERIODO_PRUEBA: "Período de prueba",
    PROCESO_DISCIPLINARIO: "Proceso disciplinario",
    RENUNCIAS: "Renuncias",
    REUNIONES_CAPACITACIONES: "Reuniones y capacitaciones",
  };

  const clave = String(valor || "").trim();

  if (!clave) {
    return "—";
  }

  return (
    textos[clave] ||
    clave
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/^./, (letra) => letra.toUpperCase())
  );
}


function formatearMotivoCitacion(valor) {
  const textos = {
    ACCIDENTE_LABORAL_SST: "Accidente laboral (SST)",
    ACTOS_INSEGUROS_SST: "Actos inseguros (SST)",
    ATENCION_LINEA_VERDE: "Atención línea verde",
    AUSENCIA_INJUSTIFICADA: "Ausencia injustificada",
    CLIMA_LABORAL: "Clima laboral",
    DANOS_BIEN_AJENO_AFECTACION_CLIENTE:
      "Daños en bien ajeno - afectación al cliente",
    INCUMPLIMIENTO_FUNCIONES: "Incumplimiento de funciones",
    INCUMPLIMIENTO_NORMAS: "Incumplimiento de normas",
    NO_USAR_EPP_LABOR: "No usar EPP para la labor",
    OMISION_REPORTE_CONFLICTO_INTERES:
      "Omisión reporte conflicto de interés",
    PERDIDA_OBJETOS_CLIENTE_COMPANEROS:
      "Pérdida de objetos cliente / compañeros",
    PERIODO_PRUEBA: "Período de prueba",
    RETARDOS_INJUSTIFICADOS: "Retardos injustificados",

    // Compatibilidad con registros anteriores.
    RETARDO_INJUSTIFICADO: "Retardo injustificado",
    DESOBEDIENCIA: "Desobediencia de instrucciones",
    COMPORTAMIENTO_INADECUADO: "Comportamiento inadecuado",
    INCUMPLIMIENTO_REGLAMENTO: "Incumplimiento del reglamento",
    OTRO: "Otro",
  };

  const clave = String(valor || "").trim();

  if (!clave) {
    return "—";
  }

  return (
    textos[clave] ||
    clave
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/^./, (letra) => letra.toUpperCase())
  );
}


function formatearNivelDesempeno(valor) {
  const textos = {
    EXCELENTE: "Excelente",
    BUENO: "Bueno",
    REGULAR: "Regular",
    DEFICIENTE: "Deficiente",

    // Compatibilidad con registros históricos.
    SI: "Sí",
    NO: "No",
  };

  const clave = String(valor || "")
    .trim()
    .toUpperCase();

  if (!clave) {
    return "—";
  }

  return (
    textos[clave] ||
    String(valor || "—")
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/^./, (letra) => letra.toUpperCase())
  );
}


export default function CitacionProcesoDisciplinarioView({
  onBack,
  proceso,
  trabajador,
}) {
  const [vista, setVista] = useState("citacion");

  const [
    citacionExistente,
    setCitacionExistente,
  ] = useState(null);

  const [
    fechaCitacion,
    setFechaCitacion,
  ] = useState("");

  const [
    horaCitacion,
    setHoraCitacion,
  ] = useState("");

  const [
    modalidad,
    setModalidad,
  ] = useState("");

  const [
    lugarCitacion,
    setLugarCitacion,
  ] = useState("");

  const [
    gestorReporta,
    setGestorReporta,
  ] = useState("");

  const [
    cliente,
    setCliente,
  ] = useState("");

  const [
    telefonoTrabajador,
    setTelefonoTrabajador,
  ] = useState("");

  const [
    tipoGestion,
    setTipoGestion,
  ] = useState("");

  const [
    motivoCitacion,
    setMotivoCitacion,
  ] = useState("");

  const [
    fechaUltimoDiaLaborado,
    setFechaUltimoDiaLaborado,
  ] = useState("");

  const [
    fechaInicioAusencia,
    setFechaInicioAusencia,
  ] = useState("");

  const [
    fechaFinAusencia,
    setFechaFinAusencia,
  ] = useState("");

  const [
    relatoHechos,
    setRelatoHechos,
  ] = useState("");

  const [
    observacionesGestor,
    setObservacionesGestor,
  ] = useState("");

  const [
    desempenoContinua,
    setDesempenoContinua,
  ] = useState("");

  const [
    justificacionDesempeno,
    setJustificacionDesempeno,
  ] = useState("");

  const [
    evidenciasOperaciones,
    setEvidenciasOperaciones,
  ] = useState([]);

  const [
    loadingCitacion,
    setLoadingCitacion,
  ] = useState(false);

  const [
    loadingEvidencias,
    setLoadingEvidencias,
  ] = useState(false);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    tipoMensaje,
    setTipoMensaje,
  ] = useState("error");

  const [
    guardandoAusencia,
    setGuardandoAusencia,
  ] = useState(false);

  const responsableRRLL =
    obtenerUsuarioAutenticado();

  const esAusenciaInjustificada =
    String(motivoCitacion || "")
      .trim()
      .toUpperCase() ===
    "AUSENCIA_INJUSTIFICADA";

  const esCitacionExtraordinaria =
    Boolean(citacionExistente?.EsExtraordinaria);

  const justificacionExtraordinaria =
    String(
      citacionExistente?.JustificacionExtraordinaria ||
        ""
    ).trim();

  const diasAusencia =
    calcularDiasAusencia(
      fechaInicioAusencia,
      fechaFinAusencia
    );


  useEffect(() => {
    async function cargarInformacion() {
      if (!proceso?.IdProcesoDisciplinario) {
        return;
      }

      try {
        setLoadingCitacion(true);
        setLoadingEvidencias(true);
        setMensaje("");

        const idProceso =
          proceso.IdProcesoDisciplinario;

        const [
          dataCitacion,
          responseAgenda,
          responseEvidencias,
        ] = await Promise.all([
          obtenerCitacionPorProceso(idProceso),

          fetch(
            `${API_URL}/agenda-disciplinaria/proceso/${idProceso}`,
            {
              method: "GET",
              headers: construirHeaders(),
            }
          ),

          fetch(
            `${API_URL}/documento-proceso-disciplinario/proceso/${idProceso}`,
            {
              method: "GET",
              headers: construirHeaders(),
            }
          ),
        ]);

        let eventoCitacionVigente = null;

        if (responseAgenda.ok) {
          const agendaProceso =
            await responseAgenda.json().catch(() => []);

          const eventosAgenda = Array.isArray(
            agendaProceso
          )
            ? agendaProceso
            : [];

          const eventosCitacion =
            eventosAgenda.filter((evento) => {
              return (
                Number(
                  evento?.IdTipoEventoDisciplinario
                ) === 1
              );
            });

          if (eventosCitacion.length > 0) {
            eventoCitacionVigente =
              eventosCitacion.reduce(
                (eventoVigente, eventoActual) => {
                  if (!eventoVigente) {
                    return eventoActual;
                  }

                  const fechaVigente = String(
                    eventoVigente?.FechaActualizacion ||
                      eventoVigente?.FechaCreacion ||
                      ""
                  );

                  const fechaActual = String(
                    eventoActual?.FechaActualizacion ||
                      eventoActual?.FechaCreacion ||
                      ""
                  );

                  return fechaActual > fechaVigente
                    ? eventoActual
                    : eventoVigente;
                },
                null
              );
          }
        } else {
          console.warn(
            `No fue posible consultar la agenda vigente del proceso. HTTP ${responseAgenda.status}. Se utilizará la fecha original de la citación.`
          );
        }

        if (dataCitacion) {
          setCitacionExistente(dataCitacion);

          setFechaCitacion(
            eventoCitacionVigente?.FechaEvento ||
              dataCitacion.FechaCitacion ||
              ""
          );

          setHoraCitacion(
            eventoCitacionVigente?.HoraInicio
              ? String(
                  eventoCitacionVigente.HoraInicio
                ).slice(0, 5)
              : dataCitacion.HoraCitacion
                ? String(
                    dataCitacion.HoraCitacion
                  ).slice(0, 5)
                : ""
          );

          setModalidad(
            dataCitacion.Modalidad || ""
          );

          setLugarCitacion(
            dataCitacion.LugarCitacion || ""
          );

          setGestorReporta(
            dataCitacion.SupervisorReporta || ""
          );

          setCliente(
            dataCitacion.Cliente ||
              trabajador?.ClienteNombre ||
              ""
          );

          setTelefonoTrabajador(
            dataCitacion.TelefonoTrabajador ||
              trabajador?.TelefonoTrabajador ||
              trabajador?.Celular ||
              trabajador?.NumeroWhatsapp ||
              ""
          );

          setTipoGestion(
            dataCitacion.TipoGestionDisciplinaria || ""
          );

          const datosAnteriores =
            separarMotivoAnterior(
              dataCitacion.MotivoCitacion
            );

          setMotivoCitacion(
            datosAnteriores.motivo ||
              dataCitacion.MotivoCitacion ||
              ""
          );

          setFechaUltimoDiaLaborado(
            dataCitacion.FechaUltimoDiaLaborado ||
              ""
          );

          setFechaInicioAusencia(
            dataCitacion.FechaInicioAusencia ||
              ""
          );

          setFechaFinAusencia(
            dataCitacion.FechaFinAusencia ||
              ""
          );

          setRelatoHechos(
            dataCitacion.RelatoHechos ||
              datosAnteriores.relato ||
              ""
          );

          setObservacionesGestor(
            dataCitacion.ObservacionOperaciones ||
              datosAnteriores.observaciones ||
              dataCitacion.ManifestacionSupervisor ||
              ""
          );

          setDesempenoContinua(
            dataCitacion.DesempenoContinua || ""
          );

          setJustificacionDesempeno(
            dataCitacion.JustificacionDesempeno || ""
          );
        } else {
          setCitacionExistente(null);
          setTelefonoTrabajador(
            trabajador?.TelefonoTrabajador ||
              trabajador?.Celular ||
              trabajador?.NumeroWhatsapp ||
              ""
          );
          setTipoGestion("");
          setFechaUltimoDiaLaborado("");
          setFechaInicioAusencia("");
          setFechaFinAusencia("");
          setDesempenoContinua("");
          setJustificacionDesempeno("");
        }

        if (!responseEvidencias.ok) {
          throw new Error(
            `No se pudieron consultar las evidencias. HTTP ${responseEvidencias.status}.`
          );
        }

        const documentos =
          await responseEvidencias.json();

        const lista = Array.isArray(documentos)
          ? documentos
          : [];

        setEvidenciasOperaciones(
          lista.filter((documento) => {
            const tipo = String(
              documento?.TipoDocumento || ""
            )
              .trim()
              .toUpperCase();

            return (
              tipo === "EVIDENCIA_OPERACIONES" ||
              tipo === "EVIDENCIA"
            );
          })
        );
      } catch (error) {
        console.error(
          "No fue posible cargar la citación y sus evidencias:",
          error
        );

        setTipoMensaje("error");
        setMensaje(
          error?.message ||
            "No se pudo cargar la información registrada por Operaciones."
        );
      } finally {
        setLoadingCitacion(false);
        setLoadingEvidencias(false);
      }
    }

    cargarInformacion();
  }, [
    proceso?.IdProcesoDisciplinario,
    trabajador?.ClienteNombre,
    trabajador?.TelefonoTrabajador,
  ]);


  const guardarDatosAusenciaRRLL = async () => {
    if (
      !esAusenciaInjustificada ||
      !citacionExistente
        ?.IdCitacionProcesoDisciplinario
    ) {
      return citacionExistente;
    }

    const response = await fetch(
      `${API_URL}/citacion-proceso-disciplinario/${citacionExistente.IdCitacionProcesoDisciplinario}`,
      {
        method: "PUT",
        headers: construirHeaders(true),
        body: JSON.stringify({
          FechaUltimoDiaLaborado:
            fechaUltimoDiaLaborado || null,
          FechaInicioAusencia:
            fechaInicioAusencia || null,
          FechaFinAusencia:
            fechaFinAusencia || null,
          UsuarioActualizacion:
            responsableRRLL,
        }),
      }
    );

    if (!response.ok) {
      const detalle = await response
        .json()
        .catch(() => null);

      const mensajeError =
        detalle?.detail?.mensaje ||
        detalle?.detail ||
        "No se pudieron actualizar los datos de ausencia.";

      throw new Error(
        String(mensajeError)
      );
    }

    const citacionActualizada =
      await response.json();

    setCitacionExistente(
      citacionActualizada
    );

    return citacionActualizada;
  };


  const handleContinuar = async () => {
    setMensaje("");
    setTipoMensaje("error");

    if (!proceso?.IdProcesoDisciplinario) {
      setMensaje(
        "No existe un proceso disciplinario asociado."
      );
      return;
    }

    const faltantes = [];

    if (!fechaCitacion) {
      faltantes.push("fecha");
    }

    if (!horaCitacion) {
      faltantes.push("hora");
    }

    const modalidadNormalizada = String(
      modalidad || ""
    )
      .trim()
      .toUpperCase();

    if (
      modalidadNormalizada !== "VIRTUAL" &&
      !lugarCitacion.trim()
    ) {
      faltantes.push("lugar");
    }

    if (!motivoCitacion.trim()) {
      faltantes.push("motivo de la citación");
    }

    if (!relatoHechos.trim()) {
      faltantes.push("relato de los hechos");
    }

    if (esAusenciaInjustificada) {
      if (!fechaUltimoDiaLaborado) {
        faltantes.push(
          "último día laborado"
        );
      }

      if (!fechaInicioAusencia) {
        faltantes.push(
          "inicio de ausencia"
        );
      }

      if (!fechaFinAusencia) {
        faltantes.push(
          "fin de ausencia"
        );
      }
    }

    if (faltantes.length > 0) {
      setMensaje(
        `Falta información registrada por Operaciones o pendiente de validar por RRLL: ${faltantes.join(
          ", "
        )}.`
      );
      return;
    }

    if (esAusenciaInjustificada) {
      if (
        fechaUltimoDiaLaborado >=
        fechaInicioAusencia
      ) {
        setMensaje(
          "El último día laborado debe ser anterior al inicio de la ausencia."
        );
        return;
      }

      if (
        fechaFinAusencia <
        fechaInicioAusencia
      ) {
        setMensaje(
          "La fecha fin de ausencia no puede ser anterior a la fecha inicio."
        );
        return;
      }
    }

    try {
      setGuardandoAusencia(true);

      await guardarDatosAusenciaRRLL();

      setVista("descargos");
    } catch (error) {
      console.error(
        "No fue posible actualizar los datos de ausencia:",
        error
      );

      setTipoMensaje("error");
      setMensaje(
        error?.message ||
          "No se pudieron guardar los cambios realizados por Relaciones Laborales."
      );
    } finally {
      setGuardandoAusencia(false);
    }
  };


  const obtenerUrlDocumento = (documento) => {
    if (documento?.UrlArchivo) {
      const url = String(documento.UrlArchivo);

      if (/^https?:\/\//i.test(url)) {
        return url;
      }

      return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
    }

    if (
      documento?.IdDocumentoProcesoDisciplinario
    ) {
      return (
        `${API_URL}/documento-proceso-disciplinario/` +
        `${documento.IdDocumentoProcesoDisciplinario}/archivo`
      );
    }

    return "";
  };


  const obtenerBlobDocumento = async (
    documento
  ) => {
    const url = obtenerUrlDocumento(documento);

    if (!url) {
      throw new Error(
        "El documento no tiene una ruta disponible."
      );
    }

    const response = await fetch(url, {
      method: "GET",
      headers: construirHeaders(),
    });

    if (!response.ok) {
      throw new Error(
        `No se pudo abrir el documento. HTTP ${response.status}.`
      );
    }

    return response.blob();
  };


  const verDocumento = async (
    documento
  ) => {
    try {
      const blob =
        await obtenerBlobDocumento(documento);

      const urlTemporal =
        URL.createObjectURL(blob);

      window.open(
        urlTemporal,
        "_blank",
        "noopener,noreferrer"
      );

      window.setTimeout(() => {
        URL.revokeObjectURL(urlTemporal);
      }, 30000);
    } catch (error) {
      setTipoMensaje("error");
      setMensaje(
        error?.message ||
          "No se pudo visualizar el documento."
      );
    }
  };


  const descargarDocumento = async (
    documento
  ) => {
    try {
      const blob =
        await obtenerBlobDocumento(documento);

      const urlTemporal =
        URL.createObjectURL(blob);

      const enlace =
        document.createElement("a");

      enlace.href = urlTemporal;
      enlace.download =
        documento?.NombreArchivo ||
        "evidencia";

      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();

      URL.revokeObjectURL(urlTemporal);
    } catch (error) {
      setTipoMensaje("error");
      setMensaje(
        error?.message ||
          "No se pudo descargar el documento."
      );
    }
  };


  if (vista === "descargos") {
    return (
      <DescargosProcesoDisciplinarioView
        onBack={() => setVista("citacion")}
        proceso={proceso}
        trabajador={{
          ...trabajador,
          TelefonoTrabajador:
            telefonoTrabajador ||
            trabajador?.TelefonoTrabajador ||
            "—",
        }}
      />
    );
  }


  return (
    <div className="p-6">
      <div className="rounded-2xl border-t-4 border-emerald-600 bg-white p-8 shadow-xl">

        {/* ENCABEZADO */}

        <div className="mb-6">
          <p className="text-sm font-semibold text-emerald-700">
            Relaciones Laborales
          </p>

          <h2 className="text-2xl font-bold text-gray-800">
            Citación a Descargos
          </h2>

          <p className="text-sm text-gray-500">
            Paso 2 de 4: revisión de la citación disciplinaria.
          </p>
        </div>


        {/* PASOS DEL PROCESO */}

        <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-4">
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

        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <h3 className="font-bold text-blue-800">
            Revisión de la citación
          </h3>

          <p className="mt-2 text-sm text-gray-600">
            Relaciones Laborales revisa la información registrada
            por Operaciones. Cuando el motivo es ausencia injustificada,
            las fechas de ausencia pueden ser validadas y corregidas.
          </p>
        </div>


        {/* INFORMACIÓN DEL TRABAJADOR */}

        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <h3 className="mb-4 font-bold text-emerald-800">
            Información del trabajador
          </h3>

          {trabajador ? (
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-emerald-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
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
                  Teléfono
                </p>

                <p className="font-semibold text-gray-800">
                  {telefonoTrabajador || "—"}
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
                  {cliente ||
                    trabajador.ClienteNombre ||
                    "—"}
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
                  Expediente disciplinario
                </p>

                <p className="font-semibold text-gray-800">
                  {proceso?.IdProcesoDisciplinario
                    ? formatearExpedienteDisciplinario(
                        proceso,
                        proceso?.FechaCreacion ||
                          citacionExistente?.FechaCitacion
                      )
                    : "—"}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-emerald-300 bg-white p-10 text-center">
              <h4 className="text-xl font-bold text-gray-800">
                No hay un trabajador seleccionado
              </h4>
            </div>
          )}
        </div>


        {/* INFORMACIÓN RECIBIDA DESDE OPERACIONES */}

        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-6">
          <div className="mb-5">
            <p className="text-sm font-semibold text-blue-700">
              Información recibida desde Operaciones
            </p>

            <h3 className="text-lg font-bold text-gray-800">
              Datos de la citación y novedad reportada
            </h3>

            <p className="mt-1 text-sm text-gray-600">
              Esta información fue registrada por Operaciones. Los datos
              de ausencia injustificada pueden ser ajustados por RRLL si la
              validación del caso lo requiere.
            </p>
          </div>

          {loadingCitacion ? (
            <p className="font-semibold text-blue-700">
              Cargando información...
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-blue-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Cliente
                  </p>

                  <p className="mt-1 font-semibold text-gray-800">
                    {cliente || "—"}
                  </p>
                </div>

                <div className="rounded-lg border border-blue-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Líder que reporta
                  </p>

                  <p className="mt-1 font-semibold text-gray-800">
                    {gestorReporta || "—"}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-blue-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Fecha
                  </p>

                  <p className="mt-1 font-semibold text-gray-800">
                    {formatearFecha(fechaCitacion)}
                  </p>
                </div>

                <div className="rounded-lg border border-blue-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Hora
                  </p>

                  <p className="mt-1 font-semibold text-gray-800">
                    {formatearHora(horaCitacion)}
                  </p>
                </div>

                <div className="rounded-lg border border-blue-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Lugar
                  </p>

                  <p className="mt-1 font-semibold text-gray-800">
                    {lugarCitacion || "—"}
                  </p>
                </div>

                <div className="rounded-lg border border-blue-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Modalidad
                  </p>

                  <p className="mt-1 font-semibold text-gray-800">
                    {modalidad || "—"}
                  </p>
                </div>
              </div>

              {esCitacionExtraordinaria && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-5">
                  <p className="text-sm font-bold uppercase tracking-wide text-red-700">
                    Cita extraordinaria
                  </p>

                  <div className="mt-3 rounded-lg border border-red-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Justificación de la cita extraordinaria
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-gray-800">
                      {justificacionExtraordinaria || "—"}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-blue-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Tipo de gestión
                    </p>

                    <p className="mt-2 font-semibold text-gray-800">
                      {formatearTipoGestion(tipoGestion)}
                    </p>
                  </div>

                  <div className="rounded-lg border border-blue-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Motivo de citación / presunta falta
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-gray-800">
                      {formatearMotivoCitacion(motivoCitacion)}
                    </p>
                  </div>
                </div>

                {esAusenciaInjustificada && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-5">
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-amber-700">
                        Datos de ausencia reportados por Operaciones
                      </p>

                      <h4 className="mt-1 font-bold text-gray-800">
                        Validación de fechas por Relaciones Laborales
                      </h4>

                      <p className="mt-1 text-sm text-gray-600">
                        Puedes corregir estas fechas si la validación de RRLL lo requiere.
                        Los cambios quedarán guardados sobre la misma citación.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <label
                          htmlFor="fechaUltimoDiaLaboradoRRLL"
                          className="mb-2 block text-sm font-semibold text-gray-700"
                        >
                          Último día laborado *
                        </label>

                        <input
                          id="fechaUltimoDiaLaboradoRRLL"
                          type="date"
                          value={fechaUltimoDiaLaborado}
                          onChange={(event) =>
                            setFechaUltimoDiaLaborado(
                              event.target.value
                            )
                          }
                          className="min-h-11 w-full rounded-lg border border-amber-200 bg-white px-3 text-sm text-gray-800 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="fechaInicioAusenciaRRLL"
                          className="mb-2 block text-sm font-semibold text-gray-700"
                        >
                          Inicio de ausencia *
                        </label>

                        <input
                          id="fechaInicioAusenciaRRLL"
                          type="date"
                          value={fechaInicioAusencia}
                          onChange={(event) =>
                            setFechaInicioAusencia(
                              event.target.value
                            )
                          }
                          className="min-h-11 w-full rounded-lg border border-amber-200 bg-white px-3 text-sm text-gray-800 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="fechaFinAusenciaRRLL"
                          className="mb-2 block text-sm font-semibold text-gray-700"
                        >
                          Fin de ausencia *
                        </label>

                        <input
                          id="fechaFinAusenciaRRLL"
                          type="date"
                          value={fechaFinAusencia}
                          onChange={(event) =>
                            setFechaFinAusencia(
                              event.target.value
                            )
                          }
                          className="min-h-11 w-full rounded-lg border border-amber-200 bg-white px-3 text-sm text-gray-800 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg border border-amber-200 bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase text-gray-500">
                        Días de ausencia
                      </p>

                      <p className="mt-1 text-lg font-bold text-gray-800">
                        {diasAusencia !== ""
                          ? `${diasAusencia} ${
                              diasAusencia === 1
                                ? "día"
                                : "días"
                            }`
                          : "Pendiente por calcular"}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Se calcula automáticamente con la fecha de inicio y la fecha de fin.
                      </p>
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-blue-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Relato de los hechos
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                    {relatoHechos || "—"}
                  </p>
                </div>

                <div className="rounded-lg border border-blue-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Observaciones Líder
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                    {observacionesGestor || "—"}
                  </p>
                </div>

                <div className="rounded-lg border border-blue-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Nivel de desempeño del colaborador
                  </p>

                  <p className="mt-2 font-semibold text-gray-800">
                    {formatearNivelDesempeno(
                      desempenoContinua
                    )}
                  </p>
                </div>

                <div className="rounded-lg border border-blue-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Justificación del nivel de desempeño
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                    {justificacionDesempeno || "—"}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>


        {/* EVIDENCIAS DE OPERACIONES */}

        <div className="mb-6 rounded-xl border border-purple-200 bg-purple-50 p-6">
          <div className="mb-5">
            <p className="text-sm font-semibold text-purple-700">
              Información recibida desde Operaciones
            </p>

            <h3 className="text-lg font-bold text-gray-800">
              Evidencias aportadas por Operaciones
            </h3>

            <p className="mt-1 text-sm text-gray-600">
              Estos documentos son únicamente de consulta para Relaciones Laborales.
            </p>
          </div>

          {loadingEvidencias ? (
            <p className="font-semibold text-purple-700">
              Consultando evidencias...
            </p>
          ) : evidenciasOperaciones.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-purple-200 bg-white p-8 text-center">
              <p className="font-semibold text-gray-700">
                No existen evidencias aportadas por Operaciones.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-purple-200 bg-white">
              <table className="min-w-full">
                <thead className="bg-purple-100">
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
                  {evidenciasOperaciones.map(
                    (documento) => (
                      <tr
                        key={
                          documento.IdDocumentoProcesoDisciplinario
                        }
                        className="border-t"
                      >
                        <td className="px-4 py-3 text-sm font-semibold">
                          {documento.NombreArchivo ||
                            "Evidencia"}
                        </td>

                        <td className="px-4 py-3 text-sm">
                          {formatearFecha(
                            documento.FechaCreacion
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                verDocumento(documento)
                              }
                            >
                              Ver
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                descargarDocumento(
                                  documento
                                )
                              }
                            >
                              Descargar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>


        {/* ESTADO Y MENSAJES */}

        <div
          className={
            mensaje
              ? tipoMensaje === "exito"
                ? "mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5"
                : "mb-6 rounded-xl border border-red-200 bg-red-50 p-5"
              : citacionExistente
                ? "mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5"
                : "mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5"
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
            <p className="mt-2 text-sm text-gray-700">
              La citación fue registrada por Operaciones. Puede
              revisar la información y continuar con los descargos.
            </p>
          )}

          {!mensaje && !citacionExistente && (
            <p className="mt-2 text-sm text-gray-700">
              No se encontró una citación registrada para este proceso.
            </p>
          )}

          {mensaje && (
            <p
              className={
                tipoMensaje === "exito"
                  ? "mt-2 text-sm font-semibold text-emerald-700"
                  : "mt-2 text-sm font-semibold text-red-700"
              }
            >
              {mensaje}
            </p>
          )}
        </div>


        {/* BOTONES */}

        <div className="flex flex-col justify-between gap-3 md:flex-row">
          <Button
            variant="outline"
            onClick={onBack}
          >
            Volver
          </Button>

          <Button
            className="bg-emerald-700 hover:bg-emerald-800"
            onClick={handleContinuar}
            disabled={
              loadingCitacion ||
              loadingEvidencias ||
              guardandoAusencia ||
              !citacionExistente
            }
          >
            {guardandoAusencia
              ? "Guardando cambios..."
              : "Continuar a Descargos"}
          </Button>
        </div>

      </div>
    </div>
  );
}