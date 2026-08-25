import React, { useEffect, useRef, useState } from "react";
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
import { formatearExpedienteDisciplinario } from "@/utils/formatearExpedienteDisciplinario";

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const FILE_BASE_URL = API_URL.replace("/api", "");

const construirClaveBorradorDescargos = (idProceso) =>
  `rrll_descargos_borrador_${idProceso}`;

const construirClavePasoProceso = (idProceso) =>
  `rrll_proceso_ultimo_paso_${idProceso}`;

const leerBorradorLocalDescargos = (idProceso) => {
  if (!idProceso) {
    return null;
  }

  try {
    const valor = window.localStorage.getItem(
      construirClaveBorradorDescargos(idProceso)
    );

    if (!valor) {
      return null;
    }

    const borrador = JSON.parse(valor);

    if (
      Number(borrador?.IdProcesoDisciplinario) !==
      Number(idProceso)
    ) {
      return null;
    }

    return borrador;
  } catch (error) {
    console.error(
      "No se pudo leer el borrador local de descargos:",
      error
    );

    return null;
  }
};

const eliminarBorradorLocalDescargos = (idProceso) => {
  if (!idProceso) {
    return;
  }

  window.localStorage.removeItem(
    construirClaveBorradorDescargos(idProceso)
  );
};


export default function DescargosProcesoDisciplinarioView({
  onBack,
  proceso,
  trabajador,
}) {
  const idProceso = proceso?.IdProcesoDisciplinario || null;
  const borradorInicialRef = useRef(
    leerBorradorLocalDescargos(idProceso)
  );
  const borradorInicial = borradorInicialRef.current;

  const [vista, setVista] = useState("descargos");
  const [fechaDescargo, setFechaDescargo] = useState(
    borradorInicial?.FechaDescargo || ""
  );
  const [horaDescargo, setHoraDescargo] = useState(
    borradorInicial?.HoraDescargo || ""
  );
  const [descargoTrabajador, setDescargoTrabajador] = useState(
    borradorInicial?.DescargoTrabajador || ""
  );
  const [manifestacionSupervisor, setManifestacionSupervisor] = useState(
    borradorInicial?.ManifestacionSupervisor || ""
  );
  const [observaciones, setObservaciones] = useState(
    borradorInicial?.ObservacionesRRLL || ""
  );
  const [responsableDescargo, setResponsableDescargo] = useState(
    borradorInicial?.ResponsableDescargo || ""
  );
  const [loadingGuardar, setLoadingGuardar] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [descargoExistente, setDescargoExistente] = useState(null);
  const [citacionExistente, setCitacionExistente] = useState(null);
  const [eventoCitacionVigente, setEventoCitacionVigente] = useState(null);

  const [documentos, setDocumentos] = useState([]);
  const [evidenciasOperaciones, setEvidenciasOperaciones] = useState([]);
  const [mostrarFormularioDocumento, setMostrarFormularioDocumento] = useState(
    borradorInicial?.MostrarFormularioDocumento === true
  );
  const [tipoDocumento, setTipoDocumento] = useState(
    borradorInicial?.TipoDocumento || "PROCESO_DISCIPLINARIO"
  );
  const [observacionDocumento, setObservacionDocumento] = useState(
    borradorInicial?.ObservacionDocumento || ""
  );
  const [archivoDocumento, setArchivoDocumento] = useState(null);
  const [loadingDocumento, setLoadingDocumento] = useState(false);
  const [mensajeDocumento, setMensajeDocumento] = useState("");

  const [cartaDescargosGenerada, setCartaDescargosGenerada] = useState(null);
  const [cartaDescargosFirmada, setCartaDescargosFirmada] = useState(null);
  const [evidenciasTrabajador, setEvidenciasTrabajador] = useState([]);
  const [loadingGenerarCartaDescargos, setLoadingGenerarCartaDescargos] =
    useState(false);
  const [loadingCartaFirmada, setLoadingCartaFirmada] = useState(false);
  const [loadingEvidenciasTrabajador, setLoadingEvidenciasTrabajador] =
    useState(false);
  const [idEvidenciaEliminando, setIdEvidenciaEliminando] = useState(null);
  const [mensajeCartaDescargos, setMensajeCartaDescargos] = useState("");
  const inputCartaFirmadaRef = useRef(null);
  const inputEvidenciasTrabajadorRef = useRef(null);

  const [asistentes, setAsistentes] = useState(
    Array.isArray(borradorInicial?.Asistentes)
      ? borradorInicial.Asistentes
      : []
  );

  const [guardandoAsistentes, setGuardandoAsistentes] =
    useState(false);
  const [guardandoBorrador, setGuardandoBorrador] =
    useState(false);
  const [borradorLocalDisponible, setBorradorLocalDisponible] =
    useState(Boolean(borradorInicial));
  const [borradorLocalRecuperado, setBorradorLocalRecuperado] =
    useState(Boolean(borradorInicial));
  const [fechaUltimoGuardadoLocal, setFechaUltimoGuardadoLocal] =
    useState(borradorInicial?.FechaGuardadoLocal || null);
  const [hayCambiosLocales, setHayCambiosLocales] =
    useState(false);
  const guardandoLocalRef = useRef(false);

  const construirBorradorLocal = () => ({
    IdProcesoDisciplinario: idProceso,
    PasoActual: "DESCARGOS",
    FechaDescargo: fechaDescargo,
    HoraDescargo: horaDescargo,
    DescargoTrabajador: descargoTrabajador,
    ManifestacionSupervisor: manifestacionSupervisor,
    ObservacionesRRLL: observaciones,
    ResponsableDescargo: responsableDescargo,
    Asistentes: asistentes,
    MostrarFormularioDocumento: mostrarFormularioDocumento,
    TipoDocumento: tipoDocumento,
    ObservacionDocumento: observacionDocumento,
    FechaGuardadoLocal: new Date().toISOString(),
  });

  const guardarBorradorLocal = () => {
    if (!idProceso || !hayCambiosLocales) {
      return;
    }

    try {
      guardandoLocalRef.current = true;

      const borrador = construirBorradorLocal();

      window.localStorage.setItem(
        construirClaveBorradorDescargos(idProceso),
        JSON.stringify(borrador)
      );

      window.localStorage.setItem(
        construirClavePasoProceso(idProceso),
        JSON.stringify({
          IdProcesoDisciplinario: idProceso,
          PasoActual: "DESCARGOS",
          FechaGuardadoLocal: borrador.FechaGuardadoLocal,
        })
      );

      setFechaUltimoGuardadoLocal(
        borrador.FechaGuardadoLocal
      );
      setBorradorLocalDisponible(true);
      setBorradorLocalRecuperado(true);
    } catch (error) {
      console.error(
        "No se pudo guardar el borrador local de descargos:",
        error
      );
    } finally {
      guardandoLocalRef.current = false;
    }
  };

  const marcarCambioLocal = () => {
    setHayCambiosLocales(true);
  };

  const descartarBorradorLocal = () => {
    eliminarBorradorLocalDescargos(idProceso);

    if (idProceso) {
      window.localStorage.removeItem(
        construirClavePasoProceso(idProceso)
      );
    }

    setBorradorLocalDisponible(false);
    setBorradorLocalRecuperado(false);
    setFechaUltimoGuardadoLocal(null);
    setHayCambiosLocales(false);
  };

  useEffect(() => {
    if (!idProceso || !hayCambiosLocales) {
      return undefined;
    }

    const temporizador = window.setTimeout(
      guardarBorradorLocal,
      500
    );

    return () => {
      window.clearTimeout(temporizador);
    };
  }, [
    idProceso,
    hayCambiosLocales,
    fechaDescargo,
    horaDescargo,
    descargoTrabajador,
    manifestacionSupervisor,
    observaciones,
    responsableDescargo,
    asistentes,
    mostrarFormularioDocumento,
    tipoDocumento,
    observacionDocumento,
  ]);

  useEffect(() => {
    if (!idProceso) {
      return undefined;
    }

    const intervalo = window.setInterval(() => {
      if (hayCambiosLocales) {
        guardarBorradorLocal();
      }
    }, 15000);

    return () => {
      window.clearInterval(intervalo);
    };
  }, [
    idProceso,
    hayCambiosLocales,
    fechaDescargo,
    horaDescargo,
    descargoTrabajador,
    manifestacionSupervisor,
    observaciones,
    responsableDescargo,
    asistentes,
    mostrarFormularioDocumento,
    tipoDocumento,
    observacionDocumento,
  ]);

  useEffect(() => {
    const manejarAntesDeSalir = (event) => {
      if (!hayCambiosLocales) {
        return;
      }

      guardarBorradorLocal();
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener(
      "beforeunload",
      manejarAntesDeSalir
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        manejarAntesDeSalir
      );
    };
  }, [
    hayCambiosLocales,
    fechaDescargo,
    horaDescargo,
    descargoTrabajador,
    manifestacionSupervisor,
    observaciones,
    responsableDescargo,
    asistentes,
    mostrarFormularioDocumento,
    tipoDocumento,
    observacionDocumento,
  ]);

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

      const obtenerTipoDocumentoNormalizado = (documento) =>
        String(documento?.TipoDocumento || "")
          .trim()
          .toUpperCase();

      const cartasGeneradas = listaDocumentos.filter(
        (documento) =>
          obtenerTipoDocumentoNormalizado(documento) ===
          "CARTA_DESCARGOS_GENERADA"
      );

      const cartasFirmadas = listaDocumentos.filter(
        (documento) =>
          obtenerTipoDocumentoNormalizado(documento) ===
          "CARTA_DESCARGOS_FIRMADA"
      );

      const evidenciasDelTrabajador = listaDocumentos.filter(
        (documento) =>
          obtenerTipoDocumentoNormalizado(documento) ===
          "EVIDENCIA_TRABAJADOR"
      );

      setEvidenciasOperaciones(
        listaDocumentos.filter(esEvidenciaOperaciones)
      );

      setCartaDescargosGenerada(
        cartasGeneradas.length > 0
          ? cartasGeneradas[cartasGeneradas.length - 1]
          : null
      );

      setCartaDescargosFirmada(
        cartasFirmadas.length > 0
          ? cartasFirmadas[cartasFirmadas.length - 1]
          : null
      );

      setEvidenciasTrabajador(evidenciasDelTrabajador);

      setDocumentos(
        listaDocumentos.filter((documento) => {
          const tipo = obtenerTipoDocumentoNormalizado(documento);

          return ![
            "EVIDENCIA_OPERACIONES",
            "CARTA_DESCARGOS_GENERADA",
            "CARTA_DESCARGOS_FIRMADA",
            "EVIDENCIA_TRABAJADOR",
          ].includes(tipo);
        })
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

    setAsistentes((actuales) => {
      if (actuales.length > 0) {
        return actuales;
      }

      return Array.isArray(respuesta)
        ? respuesta
        : [];
    });
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
        const idProcesoActual =
          proceso.IdProcesoDisciplinario;

        const [
          citacion,
          responseAgenda,
        ] = await Promise.all([
          obtenerCitacionPorProceso(
            idProcesoActual
          ),
          fetch(
            `${API_URL}/agenda-disciplinaria/proceso/${idProcesoActual}`
          ),
        ]);

        if (!citacion) {
          setCitacionExistente(null);
          setEventoCitacionVigente(null);
          return;
        }

        setCitacionExistente(citacion);

        let eventoVigente = null;

        if (responseAgenda.ok) {
          const agendaProceso =
            await responseAgenda
              .json()
              .catch(() => []);

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
            eventoVigente =
              eventosCitacion.reduce(
                (eventoMasReciente, eventoActual) => {
                  if (!eventoMasReciente) {
                    return eventoActual;
                  }

                  const fechaReciente = String(
                    eventoMasReciente?.FechaActualizacion ||
                      eventoMasReciente?.FechaCreacion ||
                      ""
                  );

                  const fechaActual = String(
                    eventoActual?.FechaActualizacion ||
                      eventoActual?.FechaCreacion ||
                      ""
                  );

                  return fechaActual > fechaReciente
                    ? eventoActual
                    : eventoMasReciente;
                },
                null
              );
          }
        } else {
          console.warn(
            `No fue posible consultar la agenda vigente del proceso. HTTP ${responseAgenda.status}. Se utilizará la fecha original de la citación.`
          );
        }

        setEventoCitacionVigente(eventoVigente);

        const fechaVigente =
          eventoVigente?.FechaEvento ||
          citacion.FechaCitacion ||
          "";

        const horaVigente =
          eventoVigente?.HoraInicio
            ? String(
                eventoVigente.HoraInicio
              ).slice(0, 5)
            : citacion.HoraCitacion
              ? String(
                  citacion.HoraCitacion
                ).slice(0, 5)
              : "";

        // La fecha y hora de la diligencia deben reflejar siempre
        // la última programación vigente de la citación.
        setFechaDescargo(fechaVigente);
        setHoraDescargo(horaVigente);

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
        setEventoCitacionVigente(null);
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
      setFechaDescargo(
        (valorActual) =>
          valorActual || data.FechaDescargo || ""
      );
      setHoraDescargo(
        (valorActual) =>
          valorActual ||
          (
            data.HoraDescargo
              ? String(data.HoraDescargo).slice(0, 5)
              : ""
          )
      );
      setDescargoTrabajador(
        (valorActual) =>
          valorActual || data.DescargoTrabajador || ""
      );

      const responsableGuardado = String(
        data.ResponsableDescargo || ""
      ).trim();

      setResponsableDescargo(
        (valorActual) =>
          valorActual || responsableGuardado
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

      setManifestacionSupervisor(
        (valorActual) =>
          valorActual || supervisor || ""
      );
      setObservaciones(
        (valorActual) =>
          valorActual ||
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

  const obtenerUrlArchivoDocumento = (documento) => {
    const idDocumento =
      documento?.IdDocumentoProcesoDisciplinario || null;

    if (idDocumento) {
      return `${API_URL}/documento-proceso-disciplinario/${idDocumento}/archivo`;
    }

    return obtenerUrlDocumento(documento?.RutaArchivo);
  };


  const esImagenDocumento = (documento) => {
    const nombre = String(documento?.NombreArchivo || "").toLowerCase();
    const formato = String(documento?.Formato || "").toLowerCase();

    return (
      formato.startsWith("image/") ||
      [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"].some(
        (extension) => nombre.endsWith(extension)
      )
    );
  };

  const abrirDocumento = (documento) => {
    const url = obtenerUrlArchivoDocumento(documento);

    if (!url) {
      setMensajeCartaDescargos(
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
        ? `${API_URL}/documento-proceso-disciplinario/${idDocumento}/descargar`
        : obtenerUrlDocumento(rutaArchivo);

      if (!url) {
        throw new Error(
          "No se encontró la ruta del documento para descargar."
        );
      }

      const response = await fetch(url, {
        method: "GET",
      });

      if (!response.ok) {
        let detalle = "";

        try {
          const data = await response.json();

          detalle =
            typeof data?.detail === "string"
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

      const blob = await response.blob();
      const urlTemporal = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = urlTemporal;
      link.download = nombreArchivo || "documento";
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.setTimeout(() => {
        window.URL.revokeObjectURL(urlTemporal);
      }, 1000);
    } catch (error) {
      console.error(
        "Error descargando documento:",
        error
      );

      setMensajeCartaDescargos(
        error?.message ||
          "No fue posible descargar el documento."
      );
    }
  };


  const subirDocumentoEspecializado = async ({
    archivo,
    tipoDocumentoEspecial,
    observacion,
  }) => {
    if (!proceso?.IdProcesoDisciplinario) {
      throw new Error("No existe un proceso disciplinario asociado.");
    }

    if (!archivo) {
      throw new Error("Debe seleccionar un archivo.");
    }

    const formData = new FormData();
    formData.append(
      "IdProcesoDisciplinario",
      proceso.IdProcesoDisciplinario
    );
    formData.append("TipoDocumento", tipoDocumentoEspecial);
    formData.append("Observacion", observacion || "");
    formData.append("archivo", archivo);

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
        const data = await response.json();
        detalle = data?.detail || data?.message || "";
      } catch {
        detalle = "";
      }

      throw new Error(
        detalle || "No se pudo cargar el documento."
      );
    }

    return response.json();
  };

  const handleGenerarCartaDescargos = async () => {
    if (!proceso?.IdProcesoDisciplinario) {
      setMensajeCartaDescargos(
        "No existe un proceso disciplinario asociado."
      );
      return;
    }

    if (!String(descargoTrabajador || "").trim()) {
      setMensajeCartaDescargos(
        "Debe registrar la manifestación del trabajador antes de generar el acta de descargos."
      );
      return;
    }

    try {
      setLoadingGenerarCartaDescargos(true);
      setMensajeCartaDescargos("");

      const borrador =
        await guardarBorradorDescargoProcesoDisciplinario(
          construirPayloadDescargo(true)
        );

      setDescargoExistente(borrador);

      const asistentesGuardados =
        await handleGuardarAsistentes(
          borrador?.IdDescargoProcesoDisciplinario || null,
          false
        );

      if (!asistentesGuardados) {
        setMensajeCartaDescargos(
          "No fue posible guardar los asistentes antes de generar la carta."
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/documento-proceso-disciplinario/descargos/generar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            IdProcesoDisciplinario:
              proceso.IdProcesoDisciplinario,
            IdDescargoProcesoDisciplinario:
              borrador?.IdDescargoProcesoDisciplinario || null,
            Cargo:
              trabajador?.Cargo || null,
          }),
        }
      );

      if (!response.ok) {
        let detalle = "";

        try {
          const data = await response.json();
          detalle = data?.detail || data?.message || "";
        } catch {
          detalle = "";
        }

        throw new Error(
          detalle ||
            "No fue posible generar el acta de descargos."
        );
      }

      await cargarDocumentos();

      setMensajeCartaDescargos(
        "Acta de descargos generada correctamente. Ya puede verla o descargarla para firma."
      );
      descartarBorradorLocal();
    } catch (error) {
      console.error(
        "Error generando acta de descargos:",
        error
      );
      setMensajeCartaDescargos(
        error?.message ||
          "No fue posible generar el acta de descargos."
      );
    } finally {
      setLoadingGenerarCartaDescargos(false);
    }
  };

  const handleSeleccionarCartaFirmada = async (event) => {
    const archivo = event.target.files?.[0] || null;
    event.target.value = "";

    if (!archivo) {
      return;
    }

    try {
      setLoadingCartaFirmada(true);
      setMensajeCartaDescargos("");

      await subirDocumentoEspecializado({
        archivo,
        tipoDocumentoEspecial: "CARTA_DESCARGOS_FIRMADA",
        observacion:
          "Acta de descargos firmada por el trabajador y Relaciones Laborales.",
      });

      await cargarDocumentos();

      setMensajeCartaDescargos(
        "Acta de descargos firmada adjuntada correctamente. El documento quedó asociado al proceso disciplinario."
      );
    } catch (error) {
      console.error(
        "Error adjuntando acta de descargos firmada:",
        error
      );
      setMensajeCartaDescargos(
        error?.message ||
          "No fue posible adjuntar el acta de descargos firmada."
      );
    } finally {
      setLoadingCartaFirmada(false);
    }
  };

  const handleEliminarEvidenciaTrabajador = async (documento) => {
    const idDocumento = documento?.IdDocumentoProcesoDisciplinario;

    if (!idDocumento) {
      setMensajeCartaDescargos(
        "No fue posible identificar la evidencia que se desea eliminar."
      );
      return;
    }

    const nombreArchivo =
      documento?.NombreArchivo || "esta evidencia";

    const confirmar = window.confirm(
      `¿Está seguro de eliminar "${nombreArchivo}"? Esta acción elimina únicamente la evidencia aportada por el trabajador.`
    );

    if (!confirmar) {
      return;
    }

    try {
      setIdEvidenciaEliminando(idDocumento);
      setMensajeCartaDescargos("");

      const response = await fetch(
        `${API_URL}/documento-proceso-disciplinario/rrll/evidencia-trabajador/${idDocumento}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        let detalle = "";

        try {
          const data = await response.json();

          detalle =
            typeof data?.detail === "string"
              ? data.detail
              : data?.detail?.mensaje ||
                data?.message ||
                "";
        } catch {
          detalle = "";
        }

        throw new Error(
          detalle ||
            "No fue posible eliminar la evidencia del trabajador."
        );
      }

      await cargarDocumentos();

      setMensajeCartaDescargos(
        "Evidencia del trabajador eliminada correctamente. Si el Acta de Descargos ya había sido generada, debe generarla nuevamente para actualizar sus anexos."
      );
    } catch (error) {
      console.error(
        "Error eliminando evidencia del trabajador:",
        error
      );

      setMensajeCartaDescargos(
        error?.message ||
          "No fue posible eliminar la evidencia del trabajador."
      );
    } finally {
      setIdEvidenciaEliminando(null);
    }
  };

  const handleSeleccionarEvidenciasTrabajador = async (event) => {
    const archivos = Array.from(event.target.files || []);
    event.target.value = "";

    if (archivos.length === 0) {
      return;
    }

    try {
      setLoadingEvidenciasTrabajador(true);
      setMensajeCartaDescargos("");

      for (const archivo of archivos) {
        await subirDocumentoEspecializado({
          archivo,
          tipoDocumentoEspecial: "EVIDENCIA_TRABAJADOR",
          observacion:
            "Evidencia aportada por el trabajador durante la diligencia de descargos.",
        });
      }

      await cargarDocumentos();

      setMensajeCartaDescargos(
        archivos.length === 1
          ? "Evidencia del trabajador adjuntada correctamente."
          : `${archivos.length} evidencias del trabajador fueron adjuntadas correctamente.`
      );
    } catch (error) {
      console.error(
        "Error adjuntando evidencias del trabajador:",
        error
      );
      setMensajeCartaDescargos(
        error?.message ||
          "No fue posible adjuntar las evidencias del trabajador."
      );
    } finally {
      setLoadingEvidenciasTrabajador(false);
    }
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

      descartarBorradorLocal();

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

      descartarBorradorLocal();
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
    carta_descargos_generada: "Acta de descargos generada",
    carta_descargos_firmada: "Acta de descargos firmada",
    evidencia_trabajador: "Evidencia del trabajador",
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


        {borradorLocalRecuperado && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 mb-6">
            <p className="font-bold text-emerald-800">
              Borrador local recuperado
            </p>

            <p className="mt-1 text-sm text-emerald-700">
              Se recuperó la información que había quedado sin guardar en este equipo.
              Los archivos seleccionados deben elegirse nuevamente por seguridad del navegador.
            </p>

            {fechaUltimoGuardadoLocal && (
              <p className="mt-2 text-xs font-semibold text-emerald-700">
                Último respaldo local:{" "}
                {new Date(
                  fechaUltimoGuardadoLocal
                ).toLocaleString("es-CO")}
              </p>
            )}
          </div>
        )}

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 mb-6">
          <h3 className="font-bold text-emerald-800 mb-4">
            Información del trabajador
          </h3>

          {trabajador ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 rounded-xl bg-white p-5 border border-emerald-200">
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
                <p className="text-xs text-gray-500">Teléfono</p>
                <p className="font-semibold text-gray-800">
                  {citacionExistente?.TelefonoTrabajador ||
                    trabajador?.TelefonoTrabajador ||
                    "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Cargo</p>
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
                          citacionExistente?.FechaCitacion
                      )
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
                    eventoCitacionVigente?.FechaEvento ||
                      citacionExistente.FechaCitacion
                  )}
                </p>
              </div>

              <div className="rounded-lg border border-blue-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Hora
                </p>

                <p className="mt-1 font-semibold text-gray-800">
                  {eventoCitacionVigente?.HoraInicio
                    ? String(
                        eventoCitacionVigente.HoraInicio
                      ).slice(0, 5)
                    : citacionExistente.HoraCitacion
                      ? String(
                          citacionExistente.HoraCitacion
                        ).slice(0, 5)
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
                            onClick={() => abrirDocumento(doc)}
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

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5">
              <div className="mb-4">
                <label className="text-sm font-semibold text-gray-800">
                  Manifestación del trabajador
                </label>

                <p className="mt-1 text-sm text-gray-500">
                  Registre aquí la manifestación del trabajador durante la diligencia.
                  Esta información será utilizada para generar el Acta de Descargos.
                </p>
              </div>

              <textarea
                className="w-full border rounded-lg p-3 min-h-[190px] resize-y bg-white"
                placeholder="Registre la manifestación del trabajador durante la diligencia..."
                value={descargoTrabajador}
                onChange={(e) => {
                  setDescargoTrabajador(e.target.value);
                  marcarCambioLocal();
                }}
              />

              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="font-bold text-blue-900">
                      Evidencias aportadas por el trabajador
                    </h4>

                    <p className="mt-1 text-sm text-blue-700">
                      Adjunte aquí las imágenes o documentos que entregue el trabajador
                      durante la diligencia. Estas evidencias se incluirán como anexos
                      cuando se genere el Acta de Descargos.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="bg-white"
                    onClick={() =>
                      inputEvidenciasTrabajadorRef.current?.click()
                    }
                    disabled={
                      loadingEvidenciasTrabajador ||
                      loadingGenerarCartaDescargos
                    }
                  >
                    {loadingEvidenciasTrabajador
                      ? "Adjuntando..."
                      : "Adjuntar evidencias"}
                  </Button>
                </div>

                <input
                  ref={inputEvidenciasTrabajadorRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                  onChange={handleSeleccionarEvidenciasTrabajador}
                />

                <div className="mt-4 space-y-2">
                  {evidenciasTrabajador.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-blue-200 bg-white p-4 text-center text-sm text-gray-500">
                      No se han adjuntado evidencias del trabajador.
                    </div>
                  ) : (
                    evidenciasTrabajador.map((doc) => {
                      const esImagen = esImagenDocumento(doc);
                      const urlDocumento = obtenerUrlArchivoDocumento(doc);

                      return (
                        <div
                          key={doc.IdDocumentoProcesoDisciplinario}
                          className="rounded-lg border border-blue-200 bg-white p-3"
                        >
                          {esImagen && urlDocumento && (
                            <button
                              type="button"
                              className="mb-3 block w-full overflow-hidden rounded-lg border border-blue-100 bg-gray-50"
                              onClick={() =>
                                abrirDocumento(doc)
                              }
                              title="Abrir imagen"
                            >
                              <img
                                src={urlDocumento}
                                alt={
                                  doc.NombreArchivo ||
                                  "Evidencia aportada por el trabajador"
                                }
                                className="mx-auto max-h-[320px] w-auto max-w-full object-contain"
                                loading="lazy"
                              />
                            </button>
                          )}

                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                              <p className="break-all text-sm font-semibold text-gray-800">
                                {doc.NombreArchivo || "Evidencia del trabajador"}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                {formatearFechaColombiana(doc.FechaCreacion)}
                              </p>

                              {esImagen && (
                                <p className="mt-1 text-xs font-medium text-blue-700">
                                  Vista previa de la imagen adjunta
                                </p>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  abrirDocumento(doc)
                                }
                              >
                                Ver
                              </Button>

                              <Button
                                type="button"
                                size="sm"
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

                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                                onClick={() =>
                                  handleEliminarEvidenciaTrabajador(doc)
                                }
                                disabled={
                                  idEvidenciaEliminando ===
                                  doc.IdDocumentoProcesoDisciplinario
                                }
                              >
                                {idEvidenciaEliminando ===
                                doc.IdDocumentoProcesoDisciplinario
                                  ? "Eliminando..."
                                  : "Eliminar"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h4 className="font-bold text-gray-800">
                      Acta de Descargos
                    </h4>

                    <p className="mt-1 text-sm text-gray-500">
                      Cuando la manifestación y las evidencias estén completas,
                      genere el documento para revisarlo, descargarlo y llevarlo a firma.
                    </p>

                    {cartaDescargosGenerada?.NombreArchivo && (
                      <p className="mt-2 break-all text-xs font-semibold text-emerald-700">
                        Documento generado: {cartaDescargosGenerada.NombreArchivo}
                      </p>
                    )}

                    {cartaDescargosFirmada?.NombreArchivo && (
                      <p className="mt-1 break-all text-xs font-semibold text-blue-700">
                        Documento firmado: {cartaDescargosFirmada.NombreArchivo}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="bg-emerald-700 hover:bg-emerald-800"
                      onClick={handleGenerarCartaDescargos}
                      disabled={
                        loadingGenerarCartaDescargos ||
                        loadingCartaFirmada ||
                        loadingEvidenciasTrabajador
                      }
                    >
                      {loadingGenerarCartaDescargos
                        ? "Generando..."
                        : cartaDescargosGenerada
                        ? "Generar nuevamente"
                        : "Generar"}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        abrirDocumento(
                          cartaDescargosGenerada
                        )
                      }
                      disabled={!cartaDescargosGenerada?.RutaArchivo}
                    >
                      Ver
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        descargarDocumento(
                          cartaDescargosGenerada?.RutaArchivo,
                          cartaDescargosGenerada?.NombreArchivo,
                          cartaDescargosGenerada
                            ?.IdDocumentoProcesoDisciplinario
                        )
                      }
                      disabled={
                        !cartaDescargosGenerada
                          ?.IdDocumentoProcesoDisciplinario
                      }
                    >
                      Descargar
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        inputCartaFirmadaRef.current?.click()
                      }
                      disabled={
                        loadingCartaFirmada ||
                        !cartaDescargosGenerada
                      }
                    >
                      {loadingCartaFirmada
                        ? "Adjuntando..."
                        : "Adjuntar firmado"}
                    </Button>
                  </div>
                </div>

                <input
                  ref={inputCartaFirmadaRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={handleSeleccionarCartaFirmada}
                />
              </div>

              {mensajeCartaDescargos && (
                <div
                  className={`mt-4 rounded-lg border p-3 text-sm font-semibold ${
                    mensajeCartaDescargos
                      .toLowerCase()
                      .includes("correctamente")
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {mensajeCartaDescargos}
                </div>
              )}
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
                onChange={(e) => {
                  setObservaciones(e.target.value);
                  marcarCambioLocal();
                }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 mb-6">
          <h3 className="font-bold text-yellow-800">
            Estado del acta de descargos
          </h3>

          <p className="text-sm text-gray-600 mt-2">
            El Acta de Descargos se genera desde el bloque de Manifestación del
            trabajador. Después de la firma, Relaciones Laborales debe adjuntar
            la versión firmada para conservarla dentro del expediente.
          </p>


          {(hayCambiosLocales || borradorLocalDisponible) && (
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm font-semibold text-blue-800">
                {hayCambiosLocales
                  ? "Cambios protegidos automáticamente en este equipo."
                  : "Borrador local disponible."}
              </p>

              {fechaUltimoGuardadoLocal && (
                <p className="mt-1 text-xs text-blue-700">
                  Último respaldo local:{" "}
                  {new Date(
                    fechaUltimoGuardadoLocal
                  ).toLocaleString("es-CO")}
                </p>
              )}
            </div>
          )}

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
          <Button
            variant="outline"
            onClick={() => {
              guardarBorradorLocal();
              onBack();
            }}
          >
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