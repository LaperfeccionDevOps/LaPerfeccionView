import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CierreProcesoDisciplinarioView from "@/pages/CierreProcesoDisciplinarioView";
import {
  crearDescargoProcesoDisciplinario,
  obtenerDescargoPorProceso,
  actualizarDescargoProcesoDisciplinario,
  guardarBorradorDescargoProcesoDisciplinario,
} from "@/services/descargoProcesoDisciplinarioService";

import {
  obtenerAsistentesPorProceso,
  guardarBorradorAsistentes,
} from "@/services/asistenteDescargoProcesoDisciplinarioService";

import {
  obtenerCitacionPorProceso,
} from "@/services/citacionProcesoDisciplinarioService";

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const FILE_BASE_URL = API_URL.replace("/api", "");

export default function DescargosProcesoDisciplinarioView({
  onBack,
  proceso,
  trabajador,
}) {
  const [vista, setVista] = useState("descargos");
  const [fechaDescargo, setFechaDescargo] = useState("");
  const [horaDescargo, setHoraDescargo] = useState("");
  const [descargoTrabajador, setDescargoTrabajador] = useState("");
  const [manifestacionSupervisor, setManifestacionSupervisor] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [responsableDescargo, setResponsableDescargo] = useState("");
  const [loadingGuardar, setLoadingGuardar] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [descargoExistente, setDescargoExistente] = useState(null);
  const [citacionExistente, setCitacionExistente] = useState(null);

  const [documentos, setDocumentos] = useState([]);
  const [evidenciasOperaciones, setEvidenciasOperaciones] = useState([]);
  const [mostrarFormularioDocumento, setMostrarFormularioDocumento] = useState(false);
  const [tipoDocumento, setTipoDocumento] = useState("PROCESO_DISCIPLINARIO");
  const [observacionDocumento, setObservacionDocumento] = useState("");
  const [archivoDocumento, setArchivoDocumento] = useState(null);
  const [loadingDocumento, setLoadingDocumento] = useState(false);
  const [mensajeDocumento, setMensajeDocumento] = useState("");

  const [asistentes, setAsistentes] = useState([]);

  const [guardandoAsistentes, setGuardandoAsistentes] =
    useState(false);
  const [guardandoBorrador, setGuardandoBorrador] =
    useState(false);

  const cargarDocumentos = async () => {
    if (!proceso?.IdProcesoDisciplinario) return;

    try {
      const response = await fetch(
        `${API_URL}/documento-proceso-disciplinario/proceso/${proceso.IdProcesoDisciplinario}`
      );

      if (!response.ok) {
        throw new Error("No se pudieron consultar los documentos.");
      }

      const data = await response.json();
      const listaDocumentos = Array.isArray(data) ? data : [];

      const esEvidenciaOperaciones = (documento) => {
        const tipo = String(
          documento?.TipoDocumento || ""
        )
          .trim()
          .toUpperCase();

        return tipo === "EVIDENCIA_OPERACIONES";
      };

      setEvidenciasOperaciones(
        listaDocumentos.filter(esEvidenciaOperaciones)
      );

      setDocumentos(
        listaDocumentos.filter(
          (documento) =>
            !esEvidenciaOperaciones(documento)
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  const cargarAsistentes = async () => {
  if (!proceso?.IdProcesoDisciplinario) {
    return;
  }

  try {
    const respuesta =
      await obtenerAsistentesPorProceso(
        proceso.IdProcesoDisciplinario
      );

    setAsistentes(
      Array.isArray(respuesta)
        ? respuesta
        : []
    );
  } catch (error) {
    console.error(
      "Error cargando asistentes",
      error
    );
  }
};

const obtenerAsistente = (tipo) => {
  return (
    asistentes.find(
      (a) => a.TipoAsistente === tipo
    ) || {
      TipoAsistente: tipo,
      NombreAsistente: "",
      Asistio: false,
    }
  );
};

const actualizarAsistente = (
  tipo,
  campo,
  valor
) => {
  setAsistentes((actuales) => {
    const copia = [...actuales];

    const indice = copia.findIndex(
      (a) => a.TipoAsistente === tipo
    );

    if (indice >= 0) {
      copia[indice] = {
        ...copia[indice],
        [campo]: valor,
      };
    } else {
      copia.push({
        TipoAsistente: tipo,
        NombreAsistente: "",
        Asistio: false,
        [campo]: valor,
      });
    }

    return copia;
  });
};

  useEffect(() => {
    cargarDocumentos();
    cargarAsistentes();
  }, [proceso]);

  useEffect(() => {
    const responsableGuardado =
      asistentes.find(
        (asistente) =>
          asistente.TipoAsistente ===
          "RESPONSABLE_RRLL"
      );

    const nombreResponsable = String(
      responsableGuardado?.NombreAsistente || ""
    ).trim();

    if (nombreResponsable) {
      setResponsableDescargo(
        nombreResponsable
      );
    }
  }, [asistentes]);

  useEffect(() => {
  async function cargarCitacionExistente() {
    if (!proceso?.IdProcesoDisciplinario) {
      return;
    }

    try {
      const citacion =
        await obtenerCitacionPorProceso(
          proceso.IdProcesoDisciplinario
        );

      if (!citacion) {
        setCitacionExistente(null);
        return;
      }

      setCitacionExistente(citacion);

      setFechaDescargo((valorActual) =>
        valorActual ||
        citacion.FechaCitacion ||
        ""
      );

      setHoraDescargo((valorActual) =>
        valorActual ||
        (
          citacion.HoraCitacion
            ? String(
                citacion.HoraCitacion
              ).slice(0, 5)
            : ""
        )
      );

      setManifestacionSupervisor(
        (valorActual) =>
          valorActual ||
          citacion.ObservacionOperaciones ||
          citacion.ManifestacionSupervisor ||
          ""
      );

      setAsistentes((actuales) => {
        const supervisorReporta =
          String(
            citacion.SupervisorReporta || ""
          ).trim();

        if (!supervisorReporta) {
          return actuales;
        }

        const copia = [...actuales];

        const indice = copia.findIndex(
          (asistente) =>
            asistente.TipoAsistente ===
            "SUPERVISOR_REPORTA"
        );

        if (indice >= 0) {
          copia[indice] = {
            ...copia[indice],
            NombreAsistente:
              copia[indice].NombreAsistente ||
              supervisorReporta,
            Asistio: true,
          };

          return copia;
        }

        copia.push({
          TipoAsistente:
            "SUPERVISOR_REPORTA",
          NombreAsistente:
            supervisorReporta,
          Asistio: true,
        });

        return copia;
      });
    } catch (error) {
      console.error(
        "Error cargando la citación:",
        error
      );

      setCitacionExistente(null);
    }
  }

  cargarCitacionExistente();
}, [proceso]);

  useEffect(() => {
  async function cargarDescargoExistente() {
    if (!proceso?.IdProcesoDisciplinario) return;

    try {
      const data = await obtenerDescargoPorProceso(
        proceso.IdProcesoDisciplinario
      );

      if (!data) return;

      setDescargoExistente(data);
      setFechaDescargo(data.FechaDescargo || "");
      setHoraDescargo(
        data.HoraDescargo ? String(data.HoraDescargo).slice(0, 5) : ""
      );
      setDescargoTrabajador(data.DescargoTrabajador || "");

      const responsableGuardado = String(
        data.ResponsableDescargo || ""
      ).trim();

      setResponsableDescargo(
        responsableGuardado
      );

      const textoObservaciones = data.Observaciones || "";
      const partes = textoObservaciones.split(
        "Observaciones de Relaciones Laborales:"
      );

      const supervisor = partes[0]
        ?.replace("Observaciones líder:", "")
        ?.replace("Manifestación del supervisor:", "")
        ?.trim();

      const rrll = partes[1]?.trim();

      setManifestacionSupervisor(supervisor || "");
      setObservaciones(
        data.ObservacionesRRLL ||
        rrll ||
        ""
      );
    } catch (error) {
      setDescargoExistente(null);
    }
  }

  cargarDescargoExistente();
}, [proceso]);

  const obtenerUrlDocumento = (rutaArchivo) => {
    if (!rutaArchivo) return "";
    const rutaLimpia = String(rutaArchivo).replaceAll("\\", "/");
    return `${FILE_BASE_URL}/${rutaLimpia}`;
  };

  const abrirDocumento = (rutaArchivo) => {
    const url = obtenerUrlDocumento(rutaArchivo);
    if (!url) return;
    window.open(url, "_blank");
  };

  const descargarDocumento = (rutaArchivo, nombreArchivo) => {
    const url = obtenerUrlDocumento(rutaArchivo);
    if (!url) return;

    const link = document.createElement("a");
    link.href = url;
    link.download = nombreArchivo || "documento";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubirDocumento = async () => {
    if (!proceso?.IdProcesoDisciplinario) {
      setMensajeDocumento("No existe un proceso disciplinario asociado.");
      return;
    }

    if (!archivoDocumento) {
      setMensajeDocumento("Debe seleccionar un archivo.");
      return;
    }

    try {
      setLoadingDocumento(true);
      setMensajeDocumento("");

      const formData = new FormData();
      formData.append("IdProcesoDisciplinario", proceso.IdProcesoDisciplinario);
      formData.append("TipoDocumento", tipoDocumento);
      formData.append("Observacion", observacionDocumento);
      formData.append("archivo", archivoDocumento);

      const response = await fetch(
        `${API_URL}/documento-proceso-disciplinario/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("No se pudo cargar el documento.");
      }

      setArchivoDocumento(null);
      setObservacionDocumento("");
      setTipoDocumento("PROCESO_DISCIPLINARIO");
      setMostrarFormularioDocumento(false);
      setMensajeDocumento("Documento cargado correctamente en el expediente y la Carpeta Digital.");

      await cargarDocumentos();
    } catch (error) {
      console.error(error);
      setMensajeDocumento("No se pudo cargar el documento.");
    } finally {
      setLoadingDocumento(false);
    }
  };

  const construirPayloadDescargo = (
    estadoBorrador
  ) => ({
    IdProcesoDisciplinario:
      proceso.IdProcesoDisciplinario,
    FechaDescargo: fechaDescargo || null,
    HoraDescargo: horaDescargo || null,
    DescargoTrabajador:
      descargoTrabajador || null,
    Observaciones:
      `Observaciones líder:\n${manifestacionSupervisor}` +
      `\n\nObservaciones de Relaciones Laborales:\n${observaciones}`,
    ObservacionesRRLL:
      observaciones || null,
    ResponsableDescargo:
      responsableDescargo || null,
    EstadoBorrador: estadoBorrador,
    UsuarioActualizacion: "yeny",
  });

  const handleGuardarAsistentes = async (
    idDescargoOverride = null,
    mostrarMensaje = true
  ) => {
    if (!proceso?.IdProcesoDisciplinario) {
      setMensaje(
        "No existe un proceso disciplinario asociado."
      );
      return false;
    }

    try {
      setGuardandoAsistentes(true);

      if (mostrarMensaje) {
        setMensaje("");
      }

      const responsableRRLL =
        obtenerAsistente(
          "RESPONSABLE_RRLL"
        );

      if (
        responsableRRLL.Asistio === true &&
        !String(
          responsableRRLL.NombreAsistente || ""
        ).trim()
      ) {
        setMensaje(
          "Debe seleccionar o escribir el nombre del responsable de RRLL."
        );

        return false;
      }

      const asistentesParaGuardar =
        asistentes
          .filter(
            (asistente) =>
              asistente.Asistio === true
          )
          .map((asistente) => ({
            TipoAsistente:
              asistente.TipoAsistente,
            NombreAsistente:
              asistente.NombreAsistente || "",
            Asistio: true,
          }));

      const respuesta =
        await guardarBorradorAsistentes({
          IdProcesoDisciplinario:
            proceso.IdProcesoDisciplinario,
          IdDescargoProcesoDisciplinario:
            idDescargoOverride ||
            descargoExistente
              ?.IdDescargoProcesoDisciplinario ||
            null,
          UsuarioActualizacion: "yeny",
          Asistentes:
            asistentesParaGuardar,
        });

      setAsistentes(
        Array.isArray(respuesta)
          ? respuesta
          : []
      );

      if (mostrarMensaje) {
        setMensaje(
          "Borrador de asistentes guardado correctamente."
        );
      }

      return true;
    } catch (error) {
      console.error(
        "Error guardando asistentes:",
        error
      );

      setMensaje(
        error?.message ||
        "No se pudo guardar el borrador de asistentes."
      );

      return false;
    } finally {
      setGuardandoAsistentes(false);
    }
  };

  const handleGuardarBorradorCompleto = async () => {
    if (!proceso?.IdProcesoDisciplinario) {
      setMensaje(
        "No existe un proceso disciplinario asociado."
      );
      return;
    }

    try {
      setGuardandoBorrador(true);
      setMensaje("");

      const borrador =
        await guardarBorradorDescargoProcesoDisciplinario(
          construirPayloadDescargo(true)
        );

      setDescargoExistente(borrador);

      const asistentesGuardados =
        await handleGuardarAsistentes(
          borrador
            ?.IdDescargoProcesoDisciplinario ||
          null,
          false
        );

      if (!asistentesGuardados) {
        return;
      }

      setMensaje(
        "Borrador del descargo y asistentes guardado correctamente."
      );
    } catch (error) {
      console.error(
        "Error guardando borrador completo:",
        error
      );

      setMensaje(
        error?.message ||
        "No se pudo guardar el borrador del descargo."
      );
    } finally {
      setGuardandoBorrador(false);
    }
  };

  const handleContinuar = async () => {
    try {
      setLoadingGuardar(true);
      setMensaje("");

      if (!proceso?.IdProcesoDisciplinario) {
        setMensaje(
          "No existe un proceso disciplinario asociado."
        );
        return;
      }

      if (!descargoTrabajador.trim()) {
        setMensaje(
          "Debe registrar la manifestación del trabajador para continuar."
        );
        return;
      }

      const payload =
        construirPayloadDescargo(false);

      let descargoGuardado;

      if (
        descargoExistente
          ?.IdDescargoProcesoDisciplinario
      ) {
        descargoGuardado =
          await actualizarDescargoProcesoDisciplinario(
            descargoExistente
              .IdDescargoProcesoDisciplinario,
            payload
          );
      } else {
        descargoGuardado =
          await crearDescargoProcesoDisciplinario(
            payload
          );
      }

      setDescargoExistente(descargoGuardado);

      const asistentesGuardados =
        await handleGuardarAsistentes(
          descargoGuardado
            ?.IdDescargoProcesoDisciplinario ||
          null,
          false
        );

      if (!asistentesGuardados) {
        return;
      }

      setVista("cierre");
    } catch (error) {
      console.error(error);
      setMensaje(
        error?.message ||
        "No se pudo guardar el descargo del proceso disciplinario."
      );
    } finally {
      setLoadingGuardar(false);
    }
  };

  if (vista === "cierre") {
    return (
      <CierreProcesoDisciplinarioView
        onBack={() => setVista("descargos")}
        proceso={proceso}
        trabajador={trabajador}
      />
    );
  }

  const TIPOS_FALTA_LABEL = {
  INCUMPLIMIENTO_FUNCIONES: "Incumplimiento de funciones",
  AUSENCIA_INJUSTIFICADA: "Ausencia injustificada",
  RETARDO_INJUSTIFICADO: "Retardo injustificado",
  DESOBEDIENCIA: "Desobediencia de instrucciones",
  COMPORTAMIENTO_INADECUADO: "Comportamiento inadecuado",
  INCUMPLIMIENTO_REGLAMENTO: "Incumplimiento del reglamento",
  OTRO: "Otro",
};

function formatearTipoFalta(valor) {
  const codigo = String(valor || "")
    .trim()
    .toUpperCase();

  if (!codigo) {
    return "—";
  }

  return (
    TIPOS_FALTA_LABEL[codigo] ||
    codigo
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/^./, (letra) => letra.toUpperCase())
  );
}

function formatearModalidad(valor) {
  const codigo = String(valor || "")
    .trim()
    .toUpperCase();

  const modalidades = {
    PRESENCIAL: "Presencial",
    VIRTUAL: "Virtual",
  };

  return modalidades[codigo] || valor || "—";
}

function formatearFechaColombiana(valor) {
  if (!valor) {
    return "—";
  }

  const fecha = String(valor).slice(0, 10);
  const partes = fecha.split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatearTipoDocumento(valor) {
  const codigo = String(valor || "")
    .trim()
    .toLowerCase();

  const tiposDocumento = {
    proceso_disciplinario: "Procesos disciplinarios",
    procesos_disciplinarios: "Procesos disciplinarios",
    ausentismo: "Ausentismo",
    llamado_atencion: "Llamados de atención",
    llamados_atencion: "Llamados de atención",
    descargos: "Descargos",
    suspension: "Suspensión",
    evidencia_operaciones: "Evidencia de Operaciones",
  };

  return tiposDocumento[codigo] || valor || "—";
}

  const separarInformacionLegacy = () => {
    const textoCompleto = String(
      citacionExistente?.MotivoCitacion || ""
    ).trim();

    if (!textoCompleto) {
      return {
        motivo: "",
        relato: "",
        observacionesGestor: "",
      };
    }

    const marcadorRelato = /relato de los hechos\s*:/i;
    const marcadorObservaciones = /observaciones\s*:/i;

    const coincidenciaRelato =
      textoCompleto.match(marcadorRelato);

    const coincidenciaObservaciones =
      textoCompleto.match(marcadorObservaciones);

    const indiceRelato =
      coincidenciaRelato?.index ?? -1;

    const indiceObservaciones =
      coincidenciaObservaciones?.index ?? -1;

    let motivo = textoCompleto;
    let relato = "";
    let observacionesGestor = "";

    if (indiceRelato >= 0) {
      motivo = textoCompleto
        .slice(0, indiceRelato)
        .trim();

      const inicioRelato =
        indiceRelato +
        coincidenciaRelato[0].length;

      const finRelato =
        indiceObservaciones > indiceRelato
          ? indiceObservaciones
          : textoCompleto.length;

      relato = textoCompleto
        .slice(inicioRelato, finRelato)
        .trim();
    }

    if (indiceObservaciones >= 0) {
      const inicioObservaciones =
        indiceObservaciones +
        coincidenciaObservaciones[0].length;

      observacionesGestor = textoCompleto
        .slice(inicioObservaciones)
        .trim();

      if (
        indiceRelato < 0 &&
        indiceObservaciones >= 0
      ) {
        motivo = textoCompleto
          .slice(0, indiceObservaciones)
          .trim();
      }
    }

    return {
      motivo,
      relato,
      observacionesGestor,
    };
  };

  const informacionLegacy =
    separarInformacionLegacy();

  const clienteMostrar =
    citacionExistente?.Cliente ||
    trabajador?.Cliente ||
    trabajador?.ClienteNombre ||
    trabajador?.NombreCliente ||
    trabajador?.ClienteAsignado ||
    "—";

 const motivoCitacionMostrar = formatearTipoFalta(
  informacionLegacy.motivo
);

  const relatoHechosMostrar =
    citacionExistente?.RelatoHechos ||
    informacionLegacy.relato ||
    "—";

  const observacionesGestorMostrar =
    citacionExistente?.ObservacionOperaciones ||
    citacionExistente?.ManifestacionSupervisor ||
    informacionLegacy.observacionesGestor ||
    "—";

  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-emerald-600">
        <div className="mb-6">
          <p className="text-sm text-emerald-700 font-semibold">
            Relaciones Laborales
          </p>

          <h2 className="text-2xl font-bold text-gray-800">
            Diligencia de Descargos
          </h2>

          <p className="text-sm text-gray-500">
            Paso 3 de 4: registro de la diligencia disciplinaria.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4">
            <p className="text-xs font-semibold">Paso 1</p>
            <p className="font-bold">Iniciar</p>
          </div>

          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4">
            <p className="text-xs font-semibold">Paso 2</p>
            <p className="font-bold">Citación</p>
          </div>

          <div className="rounded-xl border border-blue-300 bg-blue-50 p-4">
            <p className="text-xs font-semibold">Paso 3</p>
            <p className="font-bold">Descargos</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold">Paso 4</p>
            <p className="font-bold">Cierre</p>
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 mb-6">
          <h3 className="font-bold text-blue-800">
            Registro de la diligencia
          </h3>

          <p className="text-sm text-gray-600 mt-2">
            En este paso Relaciones Laborales registra el desarrollo de la
            diligencia de descargos, las manifestaciones de las partes, los
            asistentes y los documentos aportados.
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 mb-6">
          <h3 className="font-bold text-emerald-800 mb-4">
            Información del trabajador
          </h3>

          {trabajador ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 rounded-xl bg-white p-5 border border-emerald-200">
              <div>
                <p className="text-xs text-gray-500">Nombre</p>
                <p className="font-semibold text-gray-800">
                  {trabajador.NombreCompleto || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Documento</p>
                <p className="font-semibold text-gray-800">
                  {trabajador.TipoDocumento} {trabajador.NumeroDocumento}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Cargo</p>
                <p className="font-semibold text-gray-800">
                  {trabajador.Cargo || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Proceso</p>
                <p className="font-semibold text-gray-800">
                  {proceso?.IdProcesoDisciplinario
                    ? `#${proceso.IdProcesoDisciplinario}`
                    : "—"}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-emerald-300 bg-white p-10 text-center">
              <div className="text-4xl mb-4">👤</div>

              <h4 className="text-xl font-bold text-gray-800">
                Información pendiente de cargar
              </h4>

              <p className="text-gray-500 mt-2">
                Los datos del trabajador serán cargados automáticamente desde el
                expediente disciplinario.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 mb-6">
        <div className="mb-5">
          <p className="text-sm font-semibold text-blue-700">
            Información recibida desde Operaciones
          </p>

          <h3 className="text-lg font-bold text-gray-800">
            Datos de la citación y novedad reportada
          </h3>

          <p className="mt-1 text-sm text-gray-600">
            Esta información fue registrada por Operaciones y se muestra
            únicamente para consulta de Relaciones Laborales.
          </p>
        </div>

        {citacionExistente ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-blue-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Cliente
                </p>

                <p className="mt-1 font-semibold text-gray-800">
                  {clienteMostrar}
                </p>
              </div>

              <div className="rounded-lg border border-blue-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Líder que reporta
                </p>

                <p className="mt-1 font-semibold text-gray-800">
                  {citacionExistente.SupervisorReporta || "—"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-blue-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Fecha
                </p>

                <p className="mt-1 font-semibold text-gray-800">
                  {formatearFechaColombiana(
                    citacionExistente.FechaCitacion
                  )}
                </p>
              </div>

              <div className="rounded-lg border border-blue-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Hora
                </p>

                <p className="mt-1 font-semibold text-gray-800">
                  {citacionExistente.HoraCitacion
                    ? String(citacionExistente.HoraCitacion).slice(0, 5)
                    : "—"}
                </p>
              </div>

              <div className="rounded-lg border border-blue-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Lugar
                </p>

                <p className="mt-1 font-semibold text-gray-800">
                  {citacionExistente.LugarCitacion || "—"}
                </p>
              </div>

              <div className="rounded-lg border border-blue-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Modalidad
                </p>

                <p className="mt-1 font-semibold text-gray-800">
                  {formatearModalidad(
                    citacionExistente.Modalidad
                  )}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase text-gray-500">
                Motivo de la citación
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                {motivoCitacionMostrar}
              </p>
            </div>

            <div className="rounded-lg border border-blue-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase text-gray-500">
                Relato de los hechos
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                {relatoHechosMostrar}
              </p>
            </div>

            <div className="rounded-lg border border-blue-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase text-gray-500">
                Observaciones líder
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                {observacionesGestorMostrar}
              </p>
            </div>

          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-blue-300 bg-white p-8 text-center">
            <p className="font-semibold text-gray-700">
              No existe información registrada desde Operaciones.
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Los datos aparecerán automáticamente cuando Operaciones
              programe y complete la citación.
            </p>
          </div>
        )}
      </div>

        <div className="rounded-xl border border-purple-200 bg-purple-50 p-6 mb-6">
          <div className="mb-5">
            <p className="text-sm font-semibold text-purple-700">
              Información recibida desde Operaciones
            </p>

            <h3 className="text-lg font-bold text-gray-800">
              Evidencias aportadas por Operaciones
            </h3>

            <p className="mt-1 text-sm text-gray-600">
              Estos documentos fueron adjuntados por el líder y se muestran
              únicamente para consulta de Relaciones Laborales.
            </p>
          </div>

          {evidenciasOperaciones.length === 0 ? (
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
                  {evidenciasOperaciones.map((doc) => (
                    <tr
                      key={doc.IdDocumentoProcesoDisciplinario}
                      className="border-t"
                    >
                      <td className="px-4 py-3 text-sm font-semibold">
                        {doc.NombreArchivo || "Evidencia"}
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
                            onClick={() => abrirDocumento(doc.RutaArchivo)}
                          >
                            Ver
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              descargarDocumento(
                                doc.RutaArchivo,
                                doc.NombreArchivo
                              )
                            }
                          >
                            Descargar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-5">
            Asistentes a la diligencia
          </h3>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              tipo: "TRABAJADOR_CITADO",
              etiqueta: "Trabajador citado",
              nombreInicial:
                trabajador?.NombreCompleto || "",
            },
            {
              tipo: "RESPONSABLE_RRLL",
              etiqueta: "Responsable de RRLL",
              nombreInicial: "YENY CUESTO",
            },
            {
              tipo: "SUPERVISOR_REPORTA",
              etiqueta: "Líder que reporta",
              nombreInicial:
                citacionExistente?.SupervisorReporta || "",
            },
            {
              tipo: "TESTIGO_1",
              etiqueta: "Testigo 1",
              nombreInicial: "",
            },
            {
              tipo: "TESTIGO_2",
              etiqueta: "Testigo 2",
              nombreInicial: "",
            },
            {
              tipo: "OTRO",
              etiqueta: "Otro asistente",
              nombreInicial: "",
            },
          ].map((item) => {
            const asistenteActual =
              obtenerAsistente(item.tipo);

            const nombreActual =
              item.tipo === "RESPONSABLE_RRLL"
                ? asistenteActual.NombreAsistente
                : asistenteActual.NombreAsistente ||
                  item.nombreInicial;

            return (
              <div
                key={item.tipo}
                className="rounded-lg border bg-gray-50 p-4"
              >
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={
                      asistenteActual.Asistio === true
                    }
                   onChange={(e) => {
                      const marcado = e.target.checked;

                      actualizarAsistente(
                        item.tipo,
                        "Asistio",
                        marcado
                      );

                      if (
                        marcado &&
                        !asistenteActual.NombreAsistente &&
                        item.nombreInicial
                      ) {
                        actualizarAsistente(
                          item.tipo,
                          "NombreAsistente",
                          item.nombreInicial
                        );

                        if (
                          item.tipo ===
                          "RESPONSABLE_RRLL"
                        ) {
                          setResponsableDescargo(
                            item.nombreInicial
                          );
                        }
                      }
                    }}
                    />

                  <span className="font-medium text-gray-700">
                    {item.etiqueta}
                  </span>
                </label>

                <Input
                  className="mt-3 bg-white"
                  value={nombreActual}
                  onChange={(e) => {
                    const nombre =
                      e.target.value;

                    actualizarAsistente(
                      item.tipo,
                      "NombreAsistente",
                      nombre
                    );

                    if (
                      item.tipo ===
                      "RESPONSABLE_RRLL"
                    ) {
                      setResponsableDescargo(
                        nombre
                      );
                    }
                  }}
                  placeholder={`Nombre de ${item.etiqueta.toLowerCase()}`}
                  disabled={
                    asistenteActual.Asistio !== true
                  }
                />
              </div>
            );
          })}
        </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-5">
            Desarrollo de los descargos
          </h3>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium">Fecha de descargos</label>
             <Input
                type="date"
                value={fechaDescargo}
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Hora de descargos</label>
              <Input
                type="time"
                value={horaDescargo}
                readOnly
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Responsable de descargos
              </label>
              <Input
                value={responsableDescargo}
                readOnly
                className="bg-gray-100 cursor-not-allowed"
                placeholder="Se completa con el responsable seleccionado arriba"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Manifestación del trabajador
              </label>
              <textarea
                className="w-full border rounded-lg p-3 min-h-[140px] resize-none"
                placeholder="Aquí se registrará lo manifestado por el trabajador durante la diligencia..."
                value={descargoTrabajador}
                onChange={(e) => setDescargoTrabajador(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Observaciones líder
              </label>
              <textarea
                className="w-full border rounded-lg p-3 min-h-[120px] resize-none bg-gray-100 cursor-not-allowed"
                placeholder="Las observaciones registradas por el líder en Operaciones aparecerán aquí."
                value={manifestacionSupervisor}
                readOnly
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Observaciones de Relaciones Laborales
              </label>
              <textarea
                className="w-full border rounded-lg p-3 min-h-[120px] resize-none"
                placeholder="Observaciones internas de RRLL..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Documentos aportados en descargos
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Documentos adjuntados manualmente por Relaciones Laborales durante la diligencia.
              </p>
            </div>

            <Button
              className="bg-emerald-700 hover:bg-emerald-800"
              type="button"
              onClick={() =>
                setMostrarFormularioDocumento(!mostrarFormularioDocumento)
              }
            >
              {mostrarFormularioDocumento
                ? "Cancelar carga"
                : "Adjuntar documento"}
            </Button>
          </div>

          {mostrarFormularioDocumento && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 mb-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold">
                    Tipo de documento
                  </label>
                  <select
                    className="w-full mt-1 border rounded-lg p-3 bg-white"
                    value={tipoDocumento}
                    onChange={(e) => setTipoDocumento(e.target.value)}
                  >
                    <option value="PROCESO_DISCIPLINARIO">
                      Procesos disciplinarios
                    </option>
                    <option value="AUSENTISMO">
                      Ausentismo
                    </option>
                    <option value="LLAMADO_ATENCION">
                      Llamados de atención
                    </option>
                    <option value="DESCARGOS">
                      Descargos
                    </option>
                    <option value="SUSPENSION">
                      Suspensión
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold">Observación</label>
                  <Input
                    value={observacionDocumento}
                    onChange={(e) => setObservacionDocumento(e.target.value)}
                    placeholder="Observación del documento"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Archivo</label>
                  <Input
                    type="file"
                    onChange={(e) =>
                      setArchivoDocumento(e.target.files?.[0] || null)
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button
                  type="button"
                  className="bg-emerald-700 hover:bg-emerald-800"
                  onClick={handleSubirDocumento}
                  disabled={loadingDocumento}
                >
                  {loadingDocumento ? "Cargando..." : "Guardar documento"}
                </Button>
              </div>
            </div>
          )}

          {mensajeDocumento && (
            <p className="text-sm font-semibold text-emerald-700 mb-4">
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
                    Tipo
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
                    <td colSpan={4} className="text-center text-gray-500 py-12">
                      No existen documentos aportados por Relaciones Laborales durante la diligencia.
                    </td>
                  </tr>
                ) : (
                  documentos.map((doc) => (
                    <tr key={doc.IdDocumentoProcesoDisciplinario} className="border-t">
                      <td className="px-4 py-3 text-sm font-semibold">
                        {doc.NombreArchivo || "Documento"}
                      </td>

                      <td className="px-4 py-3 text-sm">
                        {formatearTipoDocumento(
                          doc.TipoDocumento
                        )}
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
                            onClick={() => abrirDocumento(doc.RutaArchivo)}
                          >
                            Ver
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              descargarDocumento(doc.RutaArchivo, doc.NombreArchivo)
                            }
                          >
                            Descargar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 mb-6">
          <h3 className="font-bold text-yellow-800">
            Estado del acta de descargos
          </h3>

          <p className="text-sm text-gray-600 mt-2">
            El acta de descargos aún no ha sido generada ni firmada. Cuando la
            diligencia finalice, el sistema permitirá generar el documento para
            firma y archivo.
          </p>

        {mensaje && (
            <p
              className={`text-sm font-semibold mt-3 ${
                mensaje.toLowerCase().includes("correctamente")
                  ? "text-emerald-700"
                  : "text-red-600"
              }`}
            >
              {mensaje}
            </p>
          )}
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-3">
          <Button variant="outline" onClick={onBack}>
            ← Volver
          </Button>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleGuardarBorradorCompleto}
              disabled={
                guardandoBorrador ||
                guardandoAsistentes ||
                loadingGuardar
              }
            >
              {guardandoBorrador ||
              guardandoAsistentes
                ? "Guardando..."
                : "Guardar borrador"}
            </Button>

            <Button
              className="bg-emerald-700 hover:bg-emerald-800"
              onClick={handleContinuar}
              disabled={loadingGuardar}
            >
              {loadingGuardar ? "Guardando..." : "Continuar →"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}