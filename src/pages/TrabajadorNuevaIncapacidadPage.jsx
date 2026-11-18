import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  CalendarDays,
  FilePlus2,
  FileText,
  LogOut,
  Upload,
  AlertCircle,
  CheckCircle2,
  Eye,
  Trash2,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";


const MAX_FILE_SIZE_MB = 10;

const MAX_FILE_SIZE_BYTES =
  MAX_FILE_SIZE_MB * 1024 * 1024;

const EXTENSIONES_PERMITIDAS = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
];


const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api"
).replace(/\/+$/, "");


const TIPOS_INCAPACIDAD = [
  {
    value: "INCAPACIDAD_1_2_DIAS",
    label: "Incapacidad de 1 y 2 días",
    documentos: [
      "Incapacidad",
    ],
  },
  {
    value: "ACCIDENTE_TRANSITO",
    label: "Accidente de tránsito",
    documentos: [
      "Incapacidad",
      "Epicrisis",
      "FURIPS",
      "Cédula",
      "SOAT",
    ],
  },
  {
    value: "ACCIDENTE_TRABAJO",
    label: "Accidente de trabajo (ARL)",
    documentos: [
      "Incapacidad",
      "Epicrisis",
    ],
  },
  {
    value: "INCAPACIDAD_3_MAS_DIAS",
    label: "Incapacidad de 3 o más días",
    documentos: [
      "Incapacidad",
      "Epicrisis",
    ],
  },
  {
    value: "LICENCIA_MATERNA",
    label: "Licencia materna",
    documentos: [
      "Incapacidad",
      "Epicrisis",
      "Registro civil o nacido vivo",
    ],
  },
  {
    value: "LICENCIA_PATERNA",
    label: "Licencia paterna",
    documentos: [
      "Registro civil o nacido vivo",
    ],
  },
];


const TrabajadorNuevaIncapacidadPage = () => {
  const navigate = useNavigate();
  const { token: correctionToken = "" } = useParams();
  const isCorrectionMode = Boolean(correctionToken);

  const [
    correctionData,
    setCorrectionData,
  ] = useState(null);

  const [
    isLoadingCorrection,
    setIsLoadingCorrection,
  ] = useState(false);

  const [
    correctionLoadError,
    setCorrectionLoadError,
  ] = useState("");

  const workerToken =
    localStorage.getItem("trabajador_token") || "";

  const workerName =
    localStorage.getItem("trabajador_nombre") || "";

  const workerDocument =
    localStorage.getItem("trabajador_documento") || "";

  const workerEps =
    localStorage.getItem("trabajador_eps") || "";

  const [
    tipoIncapacidad,
    setTipoIncapacidad,
  ] = useState("");

  const [
    fechaInicio,
    setFechaInicio,
  ] = useState("");

  const [
    diasIncapacidad,
    setDiasIncapacidad,
  ] = useState("");

  const [
    prorrogada,
    setProrrogada,
  ] = useState("");

  const [
    documentos,
    setDocumentos,
  ] = useState({});

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    isLoadingDraft,
    setIsLoadingDraft,
  ] = useState(true);

  const [
    draftFound,
    setDraftFound,
  ] = useState(false);

  const [
    draftData,
    setDraftData,
  ] = useState(null);

  const [
    showDraftNotice,
    setShowDraftNotice,
  ] = useState(false);

  const [
    persistedDocuments,
    setPersistedDocuments,
  ] = useState({});

  const [
    isSavingDraft,
    setIsSavingDraft,
  ] = useState(false);


  useEffect(() => {
    if (!isCorrectionMode && !workerToken) {
      navigate("/login", {
        replace: true,
      });
    }
  }, [
    isCorrectionMode,
    workerToken,
    navigate,
  ]);


  const limpiarSesionTrabajador = () => {
    localStorage.removeItem(
      "trabajador_token"
    );

    localStorage.removeItem(
      "trabajador_id_registro_personal"
    );

    localStorage.removeItem(
      "trabajador_documento"
    );

    localStorage.removeItem(
      "trabajador_nombre"
    );

    localStorage.removeItem(
      "trabajador_eps"
    );
  };


  const extraerMensajeError = (
    responseData,
    mensajeDefault
  ) => {
    const detail =
      responseData?.detail;

    if (
      typeof detail ===
      "string"
    ) {
      return detail;
    }

    if (
      Array.isArray(detail)
    ) {
      return detail
        .map((item) =>
          item?.msg ||
          "Dato inválido"
        )
        .join(". ");
    }

    return mensajeDefault;
  };


  useEffect(() => {
    if (isCorrectionMode || !workerToken) {
      setIsLoadingDraft(false);
      return;
    }

    let active = true;

    const cargarBorrador = async () => {
      try {
        setIsLoadingDraft(true);

        const response = await fetch(
          `${API_BASE_URL}/trabajador/incapacidades/borrador`,
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${workerToken}`,
            },
          }
        );

        let responseData = {};

        try {
          responseData =
            await response.json();
        } catch {
          responseData = {};
        }

        if (!active) {
          return;
        }

        if (!response.ok) {
          if (
            response.status === 401
          ) {
            limpiarSesionTrabajador();

            navigate(
              "/login",
              {
                replace: true,
              }
            );

            return;
          }

          throw new Error(
            extraerMensajeError(
              responseData,
              "No fue posible consultar el borrador."
            )
          );
        }

        if (
          responseData?.tiene_borrador &&
          responseData?.borrador
        ) {
          setDraftFound(true);
          setDraftData(
            responseData.borrador
          );
          setShowDraftNotice(true);
        }

      } catch (errorDraft) {
        console.error(
          "Error consultando borrador:",
          errorDraft
        );

        if (active) {
          setError(
            errorDraft?.message ||
            "No fue posible consultar el borrador."
          );
        }

      } finally {
        if (active) {
          setIsLoadingDraft(false);
        }
      }
    };

    cargarBorrador();

    return () => {
      active = false;
    };
  }, [
    isCorrectionMode,
    workerToken,
    navigate,
  ]);


  useEffect(() => {
    if (!isCorrectionMode || !correctionToken) {
      return;
    }

    let active = true;

    const cargarCorreccion = async () => {
      try {
        setIsLoadingCorrection(true);
        setCorrectionLoadError("");
        setError("");
        setSuccess("");

        const response = await fetch(
          `${API_BASE_URL}/trabajador/incapacidades/corregir/${encodeURIComponent(correctionToken)}`,
          {
            method: "GET",
          }
        );

        let responseData = {};

        try {
          responseData = await response.json();
        } catch {
          responseData = {};
        }

        if (!active) {
          return;
        }

        if (!response.ok) {
          throw new Error(
            extraerMensajeError(
              responseData,
              "No fue posible cargar la incapacidad que requiere corrección."
            )
          );
        }

        const data = responseData?.data;

        if (!data) {
          throw new Error(
            "No fue posible obtener la información de la incapacidad."
          );
        }

        setCorrectionData(data);
        setTipoIncapacidad(data.tipo_incapacidad || "");
        setFechaInicio(data.fecha_inicio || "");
        setDiasIncapacidad(
          data.dias_incapacidad
            ? String(data.dias_incapacidad)
            : ""
        );
        setProrrogada(
          data.es_prorroga ? "SI" : "NO"
        );

        const documentosServidor = {};

        (data.documentos || []).forEach((documento) => {
          if (documento?.tipo_documento) {
            documentosServidor[
              documento.tipo_documento
            ] = documento;
          }
        });

        setPersistedDocuments(documentosServidor);
        setDocumentos({});
        setDraftFound(false);
        setDraftData(null);
        setShowDraftNotice(false);

      } catch (errorCorreccion) {
        console.error(
          "Error cargando corrección de incapacidad:",
          errorCorreccion
        );

        if (active) {
          setCorrectionLoadError(
            errorCorreccion?.message ||
            "No fue posible cargar la incapacidad que requiere corrección."
          );
        }
      } finally {
        if (active) {
          setIsLoadingCorrection(false);
        }
      }
    };

    cargarCorreccion();

    return () => {
      active = false;
    };
  }, [
    isCorrectionMode,
    correctionToken,
  ]);


  const tipoSeleccionado = useMemo(() => {
    return TIPOS_INCAPACIDAD.find(
      (item) =>
        item.value === tipoIncapacidad
    );
  }, [
    tipoIncapacidad,
  ]);


  const documentosRequeridos =
    tipoSeleccionado?.documentos || [];


  const reglasDias = useMemo(() => {
    if (
      tipoIncapacidad ===
      "INCAPACIDAD_1_2_DIAS"
    ) {
      return {
        min: 1,
        max: 2,
      };
    }

    if (
      tipoIncapacidad ===
      "INCAPACIDAD_3_MAS_DIAS"
    ) {
      return {
        min: 3,
        max: null,
      };
    }

    return {
      min: 1,
      max: null,
    };
  }, [
    tipoIncapacidad,
  ]);


  const validacionDiasActual = useMemo(() => {
    if (!diasIncapacidad) {
      return {
        valido: false,
        mensaje: "",
      };
    }

    const dias =
      Number(diasIncapacidad);

    if (
      Number.isNaN(dias) ||
      !Number.isInteger(dias) ||
      dias <= 0
    ) {
      return {
        valido: false,
        mensaje:
          "Debe ingresar una cantidad válida de días de incapacidad.",
      };
    }

    if (
      tipoIncapacidad ===
        "INCAPACIDAD_1_2_DIAS" &&
      (
        dias < 1 ||
        dias > 2
      )
    ) {
      return {
        valido: false,
        mensaje:
          "Para este tipo de incapacidad debe registrar 1 o 2 días.",
      };
    }

    if (
      tipoIncapacidad ===
        "INCAPACIDAD_3_MAS_DIAS" &&
      dias < 3
    ) {
      return {
        valido: false,
        mensaje:
          "Para este tipo de incapacidad debe registrar mínimo 3 días.",
      };
    }

    return {
      valido: true,
      mensaje: "",
    };
  }, [
    tipoIncapacidad,
    diasIncapacidad,
  ]);


  const fechaFinal = useMemo(() => {
    if (
      !fechaInicio ||
      !diasIncapacidad ||
      !validacionDiasActual.valido
    ) {
      return "";
    }

    const dias =
      Number(diasIncapacidad);

    const fecha =
      new Date(
        `${fechaInicio}T00:00:00`
      );

    fecha.setDate(
      fecha.getDate() +
        dias -
        1
    );

    const year =
      fecha.getFullYear();

    const month =
      String(
        fecha.getMonth() + 1
      ).padStart(
        2,
        "0"
      );

    const day =
      String(
        fecha.getDate()
      ).padStart(
        2,
        "0"
      );

    return `${year}-${month}-${day}`;
  }, [
    fechaInicio,
    diasIncapacidad,
    validacionDiasActual,
  ]);


  const formatDate = (value) => {
    if (!value) {
      return "";
    }

    const [
      year,
      month,
      day,
    ] = value.split("-");

    return `${day}/${month}/${year}`;
  };


  const handleLogout = () => {
    limpiarSesionTrabajador();

    navigate(
      "/login",
      {
        replace: true,
      }
    );
  };


  const handleTipoChange = (
    event
  ) => {
    const value =
      event.target.value;

    setTipoIncapacidad(
      value
    );

    setDocumentos({});
    setPersistedDocuments({});

    setDiasIncapacidad("");

    setError("");

    setSuccess("");
  };


  const handleDiasChange = (
    event
  ) => {
    const value =
      event.target.value;

    if (value === "") {
      setDiasIncapacidad("");

      setError("");

      setSuccess("");

      return;
    }

    if (!/^\d+$/.test(value)) {
      return;
    }

    setDiasIncapacidad(
      value
    );

    setError("");

    setSuccess("");
  };


  const obtenerExtensionArchivo = (
    fileName
  ) => {
    const partes =
      String(
        fileName || ""
      )
        .toLowerCase()
        .split(".");

    if (partes.length < 2) {
      return "";
    }

    return partes.pop();
  };


  const validarArchivo = (
    file
  ) => {
    if (!file) {
      return "";
    }

    const extension =
      obtenerExtensionArchivo(
        file.name
      );

    if (
      !EXTENSIONES_PERMITIDAS.includes(
        extension
      )
    ) {
      return "Solo se permiten archivos PDF, JPG, JPEG o PNG.";
    }

    if (
      file.size >
      MAX_FILE_SIZE_BYTES
    ) {
      return `El archivo supera el tamaño máximo permitido de ${MAX_FILE_SIZE_MB} MB.`;
    }

    return "";
  };


  const handleDocumentoChange = (
    documento,
    file
  ) => {
    setError("");

    setSuccess("");

    if (!file) {
      setDocumentos(
        (prev) => ({
          ...prev,
          [documento]: null,
        })
      );

      return;
    }

    const errorArchivo =
      validarArchivo(file);

    if (errorArchivo) {
      setError(
        `${documento}: ${errorArchivo}`
      );

      return;
    }

    setDocumentos(
      (prev) => ({
        ...prev,
        [documento]: file,
      })
    );
  };


  const handleVerDocumento = (
    documento
  ) => {
    const archivo =
      documentos[
        documento
      ];

    if (!archivo) {
      setError(
        `No hay un archivo adjunto para ${documento}.`
      );

      return;
    }

    setError("");

    setSuccess("");

    const urlTemporal =
      URL.createObjectURL(
        archivo
      );

    const enlace =
      document.createElement("a");

    enlace.href =
      urlTemporal;

    enlace.target =
      "_blank";

    enlace.rel =
      "noopener noreferrer";

    document.body.appendChild(
      enlace
    );

    enlace.click();

    document.body.removeChild(
      enlace
    );

    window.setTimeout(
      () => {
        URL.revokeObjectURL(
          urlTemporal
        );
      },
      60000
    );
  };


  const handleEliminarDocumento = (
    documento
  ) => {
    setDocumentos(
      (prev) => ({
        ...prev,
        [documento]: null,
      })
    );

    setError("");

    setSuccess("");
  };


  const validarDatosTrabajador = () => {
    const documentoActual = isCorrectionMode
      ? correctionData?.numero_identificacion
      : workerDocument;

    const nombreActual = isCorrectionMode
      ? correctionData?.nombre_completo
      : workerName;

    const epsActual = isCorrectionMode
      ? correctionData?.eps
      : workerEps;

    if (
      !String(
        documentoActual || ""
      ).trim()
    ) {
      return "No fue posible identificar el documento del trabajador.";
    }

    if (
      !String(
        nombreActual || ""
      ).trim()
    ) {
      return "No fue posible identificar el nombre del trabajador.";
    }

    if (
      !String(
        epsActual || ""
      ).trim()
    ) {
      return "El trabajador no tiene una EPS registrada. Debe actualizarse esta información antes de registrar la incapacidad.";
    }

    return "";
  };


  const validarDiasPorTipo = () => {
    if (!diasIncapacidad) {
      return "Debe ingresar una cantidad válida de días de incapacidad.";
    }

    if (
      !validacionDiasActual.valido
    ) {
      return (
        validacionDiasActual.mensaje ||
        "Debe ingresar una cantidad válida de días de incapacidad."
      );
    }

    return "";
  };


  const validarFormulario = () => {
    const errorTrabajador =
      validarDatosTrabajador();

    if (errorTrabajador) {
      return errorTrabajador;
    }

    if (!tipoIncapacidad) {
      return "Debe seleccionar el tipo de incapacidad.";
    }

    if (!fechaInicio) {
      return "Debe seleccionar la fecha de inicio.";
    }

    const errorDias =
      validarDiasPorTipo();

    if (errorDias) {
      return errorDias;
    }

    if (!fechaFinal) {
      return "No fue posible calcular la fecha final de la incapacidad.";
    }

    if (!prorrogada) {
      return "Debe indicar si la incapacidad es prórroga.";
    }

    for (
      const documento
      of documentosRequeridos
    ) {
      const archivo =
        documentos[
          documento
        ];

      const archivoGuardado =
        persistedDocuments[
          documento
        ];

      if (
        !archivo &&
        !archivoGuardado
      ) {
        return `Debe adjuntar el documento: ${documento}.`;
      }

      if (archivo) {
        const errorArchivo =
          validarArchivo(
            archivo
          );

        if (errorArchivo) {
          return `${documento}: ${errorArchivo}`;
        }
      }
    }

    return "";
  };


  const aplicarBorrador = () => {
    if (!draftData) {
      return;
    }

    setTipoIncapacidad(
      draftData.tipo_incapacidad || ""
    );

    setFechaInicio(
      draftData.fecha_inicio || ""
    );

    setDiasIncapacidad(
      draftData.dias_incapacidad
        ? String(
            draftData.dias_incapacidad
          )
        : ""
    );

    setProrrogada(
      draftData.es_prorroga
        ? "SI"
        : "NO"
    );

    const documentosServidor = {};

    (
      draftData.documentos || []
    ).forEach((documento) => {
      if (
        documento?.tipo_documento
      ) {
        documentosServidor[
          documento.tipo_documento
        ] = documento;
      }
    });

    setPersistedDocuments(
      documentosServidor
    );

    setDocumentos({});
    setShowDraftNotice(false);
    setError("");
    setSuccess("");
  };


  const descartarBorrador = async () => {
    if (!workerToken) {
      return;
    }

    try {
      setIsSavingDraft(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/trabajador/incapacidades/borrador`,
        {
          method: "DELETE",
          headers: {
            Authorization:
              `Bearer ${workerToken}`,
          },
        }
      );

      let responseData = {};

      try {
        responseData =
          await response.json();
      } catch {
        responseData = {};
      }

      if (!response.ok) {
        if (
          response.status === 401
        ) {
          limpiarSesionTrabajador();

          navigate(
            "/login",
            {
              replace: true,
            }
          );

          return;
        }

        throw new Error(
          extraerMensajeError(
            responseData,
            "No fue posible descartar el borrador."
          )
        );
      }

      setDraftFound(false);
      setDraftData(null);
      setShowDraftNotice(false);
      setPersistedDocuments({});
      setDocumentos({});
      setTipoIncapacidad("");
      setFechaInicio("");
      setDiasIncapacidad("");
      setProrrogada("");

    } catch (errorDraft) {
      console.error(
        "Error descartando borrador:",
        errorDraft
      );

      setError(
        errorDraft?.message ||
        "No fue posible descartar el borrador."
      );

    } finally {
      setIsSavingDraft(false);
    }
  };


  const puedeGuardarBorrador = () => {
    return Boolean(
      tipoIncapacidad &&
      fechaInicio &&
      diasIncapacidad &&
      validacionDiasActual.valido &&
      prorrogada
    );
  };


  const guardarBorrador = async () => {
    if (!workerToken) {
      setError(
        "La sesión del trabajador no está disponible. Ingrese nuevamente."
      );
      return false;
    }

    if (!puedeGuardarBorrador()) {
      return false;
    }

    const formData =
      new FormData();

    formData.append(
      "tipo_incapacidad",
      tipoIncapacidad
    );

    formData.append(
      "fecha_inicio",
      fechaInicio
    );

    formData.append(
      "dias_incapacidad",
      String(
        Number(
          diasIncapacidad
        )
      )
    );

    formData.append(
      "es_prorroga",
      prorrogada
    );

    documentosRequeridos.forEach(
      (documento) => {
        const archivoNuevo =
          documentos[
            documento
          ];

        if (archivoNuevo) {
          formData.append(
            "tipos_documento",
            documento
          );

          formData.append(
            "archivos",
            archivoNuevo
          );
        }
      }
    );

    try {
      setIsSavingDraft(true);

      const response = await fetch(
        `${API_BASE_URL}/trabajador/incapacidades/borrador`,
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${workerToken}`,
          },
          body: formData,
        }
      );

      let responseData = {};

      try {
        responseData =
          await response.json();
      } catch {
        responseData = {};
      }

      if (!response.ok) {
        if (
          response.status === 401
        ) {
          limpiarSesionTrabajador();

          navigate(
            "/login",
            {
              replace: true,
            }
          );

          return false;
        }

        throw new Error(
          extraerMensajeError(
            responseData,
            "No fue posible guardar el borrador."
          )
        );
      }

      const borrador =
        responseData?.borrador;

      if (borrador) {
        setDraftFound(true);
        setDraftData(
          borrador
        );

        const documentosServidor = {};

        (
          borrador.documentos || []
        ).forEach((documento) => {
          if (
            documento?.tipo_documento
          ) {
            documentosServidor[
              documento.tipo_documento
            ] = documento;
          }
        });

        setPersistedDocuments(
          documentosServidor
        );

        setDocumentos({});
      }

      return true;

    } catch (errorDraft) {
      console.error(
        "Error guardando borrador:",
        errorDraft
      );

      setError(
        errorDraft?.message ||
        "No fue posible guardar el borrador."
      );

      return false;

    } finally {
      setIsSavingDraft(false);
    }
  };


  const handleSalirGuardando = async () => {
    if (
      puedeGuardarBorrador()
    ) {
      const guardado =
        await guardarBorrador();

      if (!guardado) {
        return;
      }
    }

    navigate(
      "/trabajador/incapacidades"
    );
  };


  const handleVerDocumentoPersistido = async (
    documento
  ) => {
    const archivoServidor =
      persistedDocuments[
        documento
      ];

    if (
      !archivoServidor?.id_documento
    ) {
      setError(
        `No hay un archivo guardado para ${documento}.`
      );
      return;
    }

    try {
      setError("");

      const urlDocumento = isCorrectionMode
        ? `${API_BASE_URL}/trabajador/incapacidades/corregir/${encodeURIComponent(correctionToken)}/documentos/${archivoServidor.id_documento}`
        : `${API_BASE_URL}/trabajador/incapacidades/borrador/documentos/${archivoServidor.id_documento}`;

      const opcionesDocumento = {
        method: "GET",
      };

      if (!isCorrectionMode) {
        opcionesDocumento.headers = {
          Authorization:
            `Bearer ${workerToken}`,
        };
      }

      const response = await fetch(
        urlDocumento,
        opcionesDocumento
      );

      if (!response.ok) {
        let responseData = {};

        try {
          responseData =
            await response.json();
        } catch {
          responseData = {};
        }

        throw new Error(
          extraerMensajeError(
            responseData,
            "No fue posible visualizar el documento."
          )
        );
      }

      const blob =
        await response.blob();

      const urlTemporal =
        URL.createObjectURL(
          blob
        );

      const enlace =
        document.createElement("a");

      enlace.href =
        urlTemporal;

      enlace.target =
        "_blank";

      enlace.rel =
        "noopener noreferrer";

      document.body.appendChild(
        enlace
      );

      enlace.click();

      document.body.removeChild(
        enlace
      );

      window.setTimeout(
        () => {
          URL.revokeObjectURL(
            urlTemporal
          );
        },
        60000
      );

    } catch (errorDocumento) {
      console.error(
        "Error visualizando documento:",
        errorDocumento
      );

      setError(
        errorDocumento?.message ||
        "No fue posible visualizar el documento."
      );
    }
  };


  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError("");
    setSuccess("");

    const validationError =
      validarFormulario();

    if (validationError) {
      setError(
        validationError
      );

      return;
    }

    if (!isCorrectionMode && !workerToken) {
      setError(
        "La sesión del trabajador no está disponible. Ingrese nuevamente."
      );

      return;
    }

    if (isCorrectionMode && !correctionToken) {
      setError(
        "El enlace de corrección no está disponible."
      );

      return;
    }

    const formData =
      new FormData();

    formData.append(
      "tipo_incapacidad",
      tipoIncapacidad
    );

    formData.append(
      "fecha_inicio",
      fechaInicio
    );

    formData.append(
      "dias_incapacidad",
      String(
        Number(
          diasIncapacidad
        )
      )
    );

    formData.append(
      "es_prorroga",
      prorrogada
    );

    documentosRequeridos.forEach(
      (documento) => {
        const archivo =
          documentos[
            documento
          ];

        if (archivo) {
          formData.append(
            "tipos_documento",
            documento
          );

          formData.append(
            "archivos",
            archivo
          );
        }
      }
    );

    try {
      setIsSubmitting(true);

      const urlRegistro = isCorrectionMode
        ? `${API_BASE_URL}/trabajador/incapacidades/corregir/${encodeURIComponent(correctionToken)}`
        : `${API_BASE_URL}/trabajador/incapacidades`;

      const opcionesRegistro = {
        method: "POST",
        body: formData,
      };

      if (!isCorrectionMode) {
        opcionesRegistro.headers = {
          Authorization:
            `Bearer ${workerToken}`,
        };
      }

      const response = await fetch(
        urlRegistro,
        opcionesRegistro
      );

      let responseData = {};

      try {
        responseData =
          await response.json();
      } catch {
        responseData = {};
      }

      if (!response.ok) {
        const detail =
          responseData?.detail;

        let mensajeError =
          "No fue posible registrar la incapacidad.";

        if (
          typeof detail ===
          "string"
        ) {
          mensajeError = detail;
        } else if (
          Array.isArray(detail)
        ) {
          mensajeError = detail
            .map((item) =>
              item?.msg ||
              "Dato inválido"
            )
            .join(". ");
        }

        if (
          response.status === 401
        ) {
          localStorage.removeItem(
            "trabajador_token"
          );
          localStorage.removeItem(
            "trabajador_id_registro_personal"
          );
          localStorage.removeItem(
            "trabajador_documento"
          );
          localStorage.removeItem(
            "trabajador_nombre"
          );
          localStorage.removeItem(
            "trabajador_eps"
          );

          navigate(
            "/login",
            {
              replace: true,
            }
          );

          return;
        }

        throw new Error(
          mensajeError
        );
      }

      const idIncapacidad =
        responseData
          ?.id_incapacidad ||
        responseData
          ?.id_incapacidad_trabajador ||
        responseData
          ?.IdIncapacidadTrabajador ||
        responseData
          ?.id ||
        "";

      setSuccess(
        isCorrectionMode
          ? "La incapacidad fue corregida y enviada nuevamente a Nómina."
          : idIncapacidad
          ? `Número de registro: ${idIncapacidad}.`
          : "Incapacidad registrada correctamente."
      );

      if (!isCorrectionMode) {
        setTipoIncapacidad("");
        setFechaInicio("");
        setDiasIncapacidad("");
        setProrrogada("");
        setDocumentos({});
        setPersistedDocuments({});
        setDraftFound(false);
        setDraftData(null);
        setShowDraftNotice(false);
      }

    } catch (errorRegistro) {
      console.error(
        "Error registrando incapacidad:",
        errorRegistro
      );

      setError(
        errorRegistro?.message ||
        "No fue posible registrar la incapacidad. Intente nuevamente."
      );

    } finally {
      setIsSubmitting(false);
    }
  };

  const diasIngresadosInvalidos =
    Boolean(
      diasIncapacidad
    ) &&
    !validacionDiasActual.valido;


  if (!isCorrectionMode && !workerToken) {
    return null;
  }


  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-50 via-gray-50 to-blue-50">

      <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-10">

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

          <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500" />

          <div className="p-4 sm:p-5 md:p-8">

            {isCorrectionMode && isLoadingCorrection && (
              <div className="mb-5 flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-semibold">
                  Cargando incapacidad para corrección...
                </span>
              </div>
            )}

            {isCorrectionMode && correctionLoadError && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-red-700">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">No fue posible abrir la corrección</p>
                  <p className="mt-1 text-sm">{correctionLoadError}</p>
                </div>
              </div>
            )}

            {!isCorrectionMode && isLoadingDraft && (
              <div className="mb-5 flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-semibold">
                  Verificando información pendiente...
                </span>
              </div>
            )}

            {!isCorrectionMode && showDraftNotice && draftFound && (
              <div className="mb-6 rounded-3xl border-2 border-amber-300 bg-amber-50 p-5 sm:p-7 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                    <FileText className="w-7 h-7 text-amber-700" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-amber-900">
                      Tiene una incapacidad pendiente
                    </h2>

                    <p className="mt-2 text-sm sm:text-base text-amber-800 leading-relaxed">
                      Encontramos información que había diligenciado anteriormente. Puede continuar desde donde quedó o descartar ese borrador y comenzar de nuevo.
                    </p>

                    <div className="mt-5 flex flex-col sm:flex-row gap-3">
                      <Button
                        type="button"
                        onClick={
                          aplicarBorrador
                        }
                        disabled={
                          isSavingDraft
                        }
                        className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        Continuar incapacidad
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={
                          descartarBorrador
                        }
                        disabled={
                          isSavingDraft
                        }
                        className="w-full sm:w-auto border-amber-300 text-amber-800 hover:bg-amber-100"
                      >
                        {isSavingDraft
                          ? "Descartando..."
                          : "Descartar y comenzar de nuevo"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

              <div className="min-w-0">

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    isCorrectionMode
                      ? navigate("/login")
                      : navigate(
                          "/trabajador/incapacidades"
                        )
                  }
                  className="mb-3 -ml-2 text-gray-500 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />

                  {isCorrectionMode
                    ? "Volver al inicio"
                    : "Volver a incapacidades"}
                </Button>


                <div className="flex items-start sm:items-center gap-3 sm:gap-4">

                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0">

                    <FilePlus2 className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />

                  </div>


                  <div className="min-w-0">

                    <p className="text-xs sm:text-sm text-gray-500">
                      Portal del Trabajador
                    </p>

                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 break-words">
                      {isCorrectionMode
                        ? "Corregir incapacidad"
                        : "Registrar incapacidad"}
                    </h1>

                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      {isCorrectionMode
                        ? "Revise la observación de Nómina, realice la corrección solicitada y envíe nuevamente la misma incapacidad."
                        : "Diligencie la información y adjunte los documentos requeridos."}
                    </p>

                  </div>

                </div>

              </div>


              {!isCorrectionMode && (
              <Button
                type="button"
                variant="outline"
                onClick={
                  handleLogout
                }
                className="w-full md:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />

                Cerrar sesión
              </Button>
              )}

            </div>


            <div className="mt-6 sm:mt-8 bg-gray-50 border border-gray-100 rounded-2xl p-4 sm:p-5">

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">

                <div className="min-w-0">

                  <p className="text-xs text-gray-500">
                    Trabajador
                  </p>

                  <p className="font-bold text-gray-800 mt-1 break-words">
                    {(isCorrectionMode
                      ? correctionData?.nombre_completo
                      : workerName) ||
                      "Trabajador"}
                  </p>

                </div>


                <div className="min-w-0">

                  <p className="text-xs text-gray-500">
                    Identificación
                  </p>

                  <p className="font-bold text-gray-800 mt-1 break-words">
                    {(isCorrectionMode
                      ? correctionData?.numero_identificacion
                      : workerDocument) ||
                      "No disponible"}
                  </p>

                </div>


                <div className="min-w-0 sm:col-span-2 md:col-span-1">

                  <p className="text-xs text-gray-500">
                    EPS
                  </p>

                  <p className="font-bold text-gray-800 mt-1 break-words">
                    {(isCorrectionMode
                      ? correctionData?.eps
                      : workerEps) ||
                      "No registrada"}
                  </p>

                </div>

              </div>

            </div>


            {isCorrectionMode && correctionData && (
              <div className="mt-6 sm:mt-8 rounded-2xl border-2 border-red-200 bg-red-50 p-4 sm:p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-red-800">
                      Esta incapacidad requiere una corrección
                    </h2>
                    <p className="mt-2 text-sm text-red-700">
                      Nómina indicó el siguiente motivo:
                    </p>
                    <p className="mt-2 text-sm sm:text-base font-semibold text-red-900 break-words">
                      {correctionData.motivo_correccion}
                    </p>
                    <p className="mt-3 text-xs sm:text-sm text-red-700">
                      Realice los cambios necesarios y envíe nuevamente la misma incapacidad para revisión.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form
              onSubmit={
                handleSubmit
              }
              className="mt-6 sm:mt-8"
            >

              <div className="mb-6">

                <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                  Información de la incapacidad
                </h2>

                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Los campos marcados con * son obligatorios.
                </p>

              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">

                <div className="md:col-span-2">

                  <label
                    htmlFor="tipoIncapacidad"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Tipo de incapacidad *
                  </label>


                  <select
                    id="tipoIncapacidad"
                    value={
                      tipoIncapacidad
                    }
                    onChange={
                      handleTipoChange
                    }
                    className="w-full h-12 px-3 sm:px-4 border border-gray-300 rounded-xl bg-white text-sm sm:text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >

                    <option value="">
                      Seleccione una opción
                    </option>


                    {TIPOS_INCAPACIDAD.map(
                      (
                        item
                      ) => (
                        <option
                          key={
                            item.value
                          }
                          value={
                            item.value
                          }
                        >
                          {
                            item.label
                          }
                        </option>
                      )
                    )}

                  </select>

                </div>


                <div>

                  <label
                    htmlFor="fechaInicio"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Fecha de inicio *
                  </label>


                  <div className="relative">

                    <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />


                    <input
                      id="fechaInicio"
                      type="date"
                      value={
                        fechaInicio
                      }
                      onChange={(
                        event
                      ) => {
                        setFechaInicio(
                          event
                            .target
                            .value
                        );

                        setError("");

                        setSuccess("");
                      }}
                      className="w-full h-12 pl-12 pr-3 sm:pr-4 border border-gray-300 rounded-xl bg-white text-sm sm:text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />

                  </div>

                </div>


                <div>

                  <label
                    htmlFor="diasIncapacidad"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Días de incapacidad *
                  </label>


                  <input
                    id="diasIncapacidad"
                    type="number"
                    min={
                      reglasDias.min
                    }
                    max={
                      reglasDias.max ||
                      undefined
                    }
                    step="1"
                    value={
                      diasIncapacidad
                    }
                    onChange={
                      handleDiasChange
                    }
                    placeholder={
                      tipoIncapacidad ===
                      "INCAPACIDAD_1_2_DIAS"
                        ? "1 o 2"
                        : "Ej. 3"
                    }
                    className={`w-full h-12 px-3 sm:px-4 rounded-xl bg-white text-sm sm:text-base text-gray-800 focus:outline-none focus:ring-2 ${
                      diasIngresadosInvalidos
                        ? "border border-red-400 focus:ring-red-200 focus:border-red-500"
                        : "border border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                    }`}
                  />


                  {diasIngresadosInvalidos && (
                    <div className="flex items-start gap-2 mt-2 text-red-600">

                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

                      <p className="text-xs font-medium">
                        {
                          validacionDiasActual.mensaje
                        }
                      </p>

                    </div>
                  )}

                </div>


                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fecha final
                  </label>


                  <div
                    className={`w-full min-h-12 px-3 sm:px-4 py-3 border rounded-xl text-sm sm:text-base font-semibold ${
                      diasIngresadosInvalidos
                        ? "bg-red-50 border-red-200 text-red-500"
                        : "bg-gray-100 border-gray-200 text-gray-700"
                    }`}
                  >

                    {fechaFinal
                      ? formatDate(
                          fechaFinal
                        )
                      : diasIngresadosInvalidos
                      ? "Corrija los días de incapacidad"
                      : "Se calcula automáticamente"}

                  </div>

                </div>


                <div>

                  <label
                    htmlFor="prorrogada"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    ¿Es prórroga? *
                  </label>


                  <select
                    id="prorrogada"
                    value={
                      prorrogada
                    }
                    onChange={(
                      event
                    ) => {
                      setProrrogada(
                        event
                          .target
                          .value
                      );

                      setError("");

                      setSuccess("");
                    }}
                    className="w-full h-12 px-3 sm:px-4 border border-gray-300 rounded-xl bg-white text-sm sm:text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >

                    <option value="">
                      Seleccione
                    </option>

                    <option value="NO">
                      No
                    </option>

                    <option value="SI">
                      Sí
                    </option>

                  </select>

                </div>

              </div>


              {tipoSeleccionado && (

                <div className="mt-8 sm:mt-9">

                  <div className="flex items-start gap-3 mb-5">

                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">

                      <FileText className="w-5 h-5 text-blue-600" />

                    </div>


                    <div className="min-w-0">

                      <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                        Documentos requeridos
                      </h2>

                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        Adjunte todos los documentos solicitados para este tipo de incapacidad.
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        Formatos permitidos: PDF, JPG, JPEG y PNG. Máximo {MAX_FILE_SIZE_MB} MB por archivo.
                      </p>

                    </div>

                  </div>


                  <div className="space-y-4">

                    {documentosRequeridos.map(
                      (
                        documento
                      ) => {
                        const archivo =
                          documentos[
                            documento
                          ];

                        const archivoGuardado =
                          persistedDocuments[
                            documento
                          ];

                        const tieneDocumento =
                          Boolean(
                            archivo ||
                            archivoGuardado
                          );

                        return (
                          <div
                            key={
                              documento
                            }
                            className="border border-gray-200 rounded-2xl p-4 sm:p-5"
                          >

                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                              <div className="min-w-0 flex-1">

                                <p className="font-bold text-gray-800">
                                  {
                                    documento
                                  } *
                                </p>


                                {tieneDocumento ? (

                                  <div className="flex items-start gap-2 mt-2 text-sm text-emerald-600 min-w-0">

                                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />

                                    <span className="break-all min-w-0">
                                      {
                                        archivo
                                          ? archivo.name
                                          : archivoGuardado?.nombre_archivo
                                      }
                                    </span>

                                  </div>

                                ) : (

                                  <p className="text-sm text-gray-500 mt-1">
                                    Documento pendiente por adjuntar.
                                  </p>

                                )}

                              </div>


                              {!tieneDocumento ? (

                                <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2 border border-emerald-200 rounded-xl text-sm font-semibold text-emerald-700 cursor-pointer hover:bg-emerald-50 transition-colors">

                                  <Upload className="w-4 h-4 shrink-0" />

                                  Adjuntar archivo


                                  <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="hidden"
                                    onChange={(
                                      event
                                    ) => {
                                      const file =
                                        event
                                          .target
                                          .files?.[0] ||
                                        null;

                                      handleDocumentoChange(
                                        documento,
                                        file
                                      );

                                      event.target.value =
                                        "";
                                    }}
                                  />

                                </label>

                              ) : (

                                <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:flex-row gap-2 w-full lg:w-auto">

                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                      archivo
                                        ? handleVerDocumento(
                                            documento
                                          )
                                        : handleVerDocumentoPersistido(
                                            documento
                                          )
                                    }
                                    className="w-full lg:w-auto min-h-11 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                  >
                                    <Eye className="w-4 h-4 mr-2" />

                                    Ver
                                  </Button>


                                  <label className="w-full lg:w-auto inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2 border border-emerald-200 rounded-xl text-sm font-semibold text-emerald-700 cursor-pointer hover:bg-emerald-50 transition-colors">

                                    <Upload className="w-4 h-4 shrink-0" />

                                    Cambiar


                                    <input
                                      type="file"
                                      accept=".pdf,.jpg,.jpeg,.png"
                                      className="hidden"
                                      onChange={(
                                        event
                                      ) => {
                                        const file =
                                          event
                                            .target
                                            .files?.[0] ||
                                          null;

                                        handleDocumentoChange(
                                          documento,
                                          file
                                        );

                                        event.target.value =
                                          "";
                                      }}
                                    />

                                  </label>


                                  {archivo && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() =>
                                        handleEliminarDocumento(
                                          documento
                                        )
                                      }
                                      className="w-full lg:w-auto min-h-11 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />

                                      Eliminar
                                    </Button>
                                  )}

                                </div>

                              )}

                            </div>

                          </div>
                        );
                      }
                    )}

                  </div>

                </div>

              )}


              {error && (

                <div className="mt-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">

                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />

                  <p className="text-sm font-medium break-words">
                    {error}
                  </p>

                </div>

              )}


              {success && (

                <div className="mt-8 border-2 border-emerald-300 bg-emerald-50 rounded-3xl px-5 py-8 sm:px-8 sm:py-10 text-center shadow-sm">

                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-9 h-9 sm:w-11 sm:h-11 text-emerald-600" />
                  </div>

                  <h2 className="mt-5 text-2xl sm:text-3xl font-bold text-emerald-800">
                    {isCorrectionMode
                      ? "Incapacidad reenviada correctamente"
                      : "Incapacidad registrada correctamente"}
                  </h2>

                  <p className="mt-3 text-sm sm:text-base text-emerald-700 max-w-2xl mx-auto leading-relaxed">
                    {isCorrectionMode
                      ? "La corrección fue recibida correctamente y la misma incapacidad quedó nuevamente disponible para revisión de Nómina."
                      : "La incapacidad enviada pasa a proceso de verificación. Si la información no está completa, será rechazada y se notificará por correo electrónico especificando la causal."}
                  </p>

                  {success !== "Incapacidad registrada correctamente." && (
                    <p className="mt-2 text-sm sm:text-base font-semibold text-emerald-800 break-words">
                      {success}
                    </p>
                  )}

                  <p className="mt-4 text-xs sm:text-sm text-gray-600 max-w-xl mx-auto">
                    {isCorrectionMode
                      ? "Este enlace de corrección ya no podrá utilizarse nuevamente."
                      : "Puede volver al módulo de incapacidades o iniciar un nuevo registro."}
                  </p>

                  <div className="mt-7 flex flex-col sm:flex-row sm:justify-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        navigate(
                          "/trabajador/incapacidades"
                        )
                      }
                      className="w-full sm:w-auto min-h-11 border-emerald-300 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                    >
                      Volver a incapacidades
                    </Button>

                    {!isCorrectionMode && (
                    <Button
                      type="button"
                      onClick={() => {
                        setSuccess("");
                        setError("");
                        window.scrollTo({
                          top: 0,
                          behavior: "smooth",
                        });
                      }}
                      className="w-full sm:w-auto min-h-11 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <FilePlus2 className="w-4 h-4 mr-2" />
                      Registrar otra incapacidad
                    </Button>
                    )}
                  </div>

                </div>

              )}


              {!success && (

                <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">

                  <Button
                    type="button"
                    variant="outline"
                    onClick={
                      handleSalirGuardando
                    }
                    className="w-full sm:w-auto min-h-11"
                  >
                    Cancelar
                  </Button>


                  <Button
                    type="submit"
                    disabled={
                      diasIngresadosInvalidos ||
                      isSubmitting ||
                      isSavingDraft ||
                      isLoadingDraft
                    }
                    className="w-full sm:w-auto min-h-11 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >

                    <FilePlus2 className="w-4 h-4 mr-2" />

                    {isSubmitting
                      ? "Registrando..."
                      : "Registrar incapacidad"}

                  </Button>

                </div>

              )}

            </form>

          </div>

        </div>

      </div>

    </div>
  );
};


export default TrabajadorNuevaIncapacidadPage;