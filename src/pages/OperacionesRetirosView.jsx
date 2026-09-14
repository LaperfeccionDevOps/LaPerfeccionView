import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Camera,
  CheckCircle2,
  Download,
  Eye,
  ClipboardCheck,
  FileText,
  Mail,
  Mic,
  Paperclip,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const API_URL = String(
  import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000/api"
).replace(/\/+$/, "");

const MOTIVOS_RETIRO = [
  { id: 1, nombre: "RETIRO VOLUNTARIO" },
  {
    id: 2,
    nombre:
      "TERMINACIÓN DE CONTRATO CON JUSTA CAUSA/ABANDONO DE CARGO",
  },
  {
    id: 3,
    nombre: "TERMINACIÓN DE CONTRATO SIN JUSTA CAUSA",
  },
  {
    id: 4,
    nombre: "TERMINACIÓN DE CONTRATO CON JUSTA CAUSA",
  },
  {
    id: 5,
    nombre: "TERMINACIÓN DE CONTRATO PERIODO DE PRUEBA",
  },
  {
    id: 6,
    nombre: "TERMINACIÓN DE CONTRATO OBRA LABOR",
  },
  {
    id: 7,
    nombre: "TERMINACIÓN DE CONTRATO DE APRENDIZAJE",
  },
  { id: 8, nombre: "MUERTE DEL COLABORADOR" },
  { id: 9, nombre: "MUTUO ACUERDO" },
  { id: 10, nombre: "NUNCA INGRESÓ" },
  { id: 11, nombre: "ACUERDO TRANSACCIONAL" },
];

const OPCIONES_ACEPTADO = [
  "NO APLICA",
  "ACEPTADO",
  "RECHAZADO",
];

const OPCIONES_CUMPLIMIENTO = [
  "NO APLICA",
  "CUMPLE",
  "NO CUMPLE",
];

const OPCIONES_SI_NO = ["SI", "NO"];

const FORMULARIO_INICIAL = {
  elaboradoPor: "",
  idCliente: "",
  clienteNombre: "",
  idMotivoRetiro: "",
  descripcionMotivoRetiro: "",

  locker: "",
  llaves: "",
  entregaHerramientas: "",
  tarjetaControlAcceso: "",
  entregaGuantes: "",
  entregaMonogafas: "",
  entregaPeto: "",

  observacionesEntrega: "",
  aplicaDescuento: "",
  valorDescuento: "",
  novedadesNomina: "",

  ultimoDiaLaborado: "",

  pendienteEntregaUniforme: "",
  uniformePatogeno: "",
  botas: "",
  zapatos: "",
  chaqueta: "",
  carnetAlpArl: "",
  pendientePagoVacunas: "",

  usuariosClavesDispositivos: "",
  correoSupervisora: "",
  estadoPazSalvo: "ABIERTO",
};

const ELEMENTOS_PAZ_SALVO = {
  LOCKER: {
    campo: "locker",
    label: "Locker",
    opciones: OPCIONES_ACEPTADO,
  },
  LLAVES: {
    campo: "llaves",
    label: "Llaves",
    opciones: OPCIONES_ACEPTADO,
  },
  HERRAMIENTAS: {
    campo: "entregaHerramientas",
    label: "Entrega de herramientas",
    opciones: OPCIONES_ACEPTADO,
  },
  TARJETA_CONTROL_ACCESO: {
    campo: "tarjetaControlAcceso",
    label: "Tarjeta de control de acceso",
    opciones: OPCIONES_ACEPTADO,
  },
  GUANTES: {
    campo: "entregaGuantes",
    label: "Entrega de guantes",
    opciones: OPCIONES_CUMPLIMIENTO,
  },
  MONOGAFAS: {
    campo: "entregaMonogafas",
    label: "Entrega de monogafas",
    opciones: OPCIONES_CUMPLIMIENTO,
  },
  PETO: {
    campo: "entregaPeto",
    label: "Entrega de peto",
    opciones: OPCIONES_ACEPTADO,
  },
};

const CAMPOS_ELEMENTOS_PAZ_SALVO = Object.values(
  ELEMENTOS_PAZ_SALVO
).map((configuracion) => configuracion.campo);

const normalizarCodigoElemento = (valor) =>
  String(valor || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

const ADJUNTOS_INICIALES = {
  novedadesNomina: [],
  formatoDescuentoVacunas: [],
  fotoCarnetAcceso: [],
  fotoListadoHerramientas: [],
  fotoPlanillaNomina: [],
};

const obtenerTokenAutenticacion = () => {
  const clavesDirectas = [
    "token",
    "access_token",
    "accessToken",
    "authToken",
    "jwt",
    "jwtToken",
  ];

  const almacenamientos = [
    window.localStorage,
    window.sessionStorage,
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
    "session",
    "userData",
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
          objeto?.jwtToken;

        if (token) {
          return String(token);
        }
      } catch (error) {
        // La clave no contiene un objeto JSON válido.
      }
    }
  }

  return null;
};

const obtenerNombreUsuarioActual = () => {
  const almacenamientos = [
    window.localStorage,
    window.sessionStorage,
  ];

  // El login corporativo guarda directamente el nombre completo
  // en la clave "usuario".
  const clavesDirectasNombre = [
    "nombre_completo",
    "nombreCompleto",
    "NombreCompleto",
    "usuario",
  ];

  for (const almacenamiento of almacenamientos) {
    for (const clave of clavesDirectasNombre) {
      const valor = almacenamiento.getItem(clave);

      if (
        valor &&
        valor !== "null" &&
        valor !== "undefined"
      ) {
        const nombre = String(valor)
          .replace(/^"|"$/g, "")
          .trim();

        if (nombre) {
          return nombre;
        }
      }
    }
  }

  // Compatibilidad por si otra versión del login guarda un objeto.
  const clavesObjetos = [
    "auth",
    "authData",
    "user",
    "session",
    "userData",
  ];

  for (const almacenamiento of almacenamientos) {
    for (const clave of clavesObjetos) {
      const valor = almacenamiento.getItem(clave);

      if (!valor) {
        continue;
      }

      try {
        const objeto = JSON.parse(valor);

        const nombre =
          objeto?.NombreCompleto ||
          objeto?.nombreCompleto ||
          objeto?.nombre_completo ||
          objeto?.nombre ||
          objeto?.Nombre ||
          objeto?.usuario ||
          objeto?.Usuario ||
          objeto?.user?.NombreCompleto ||
          objeto?.user?.nombreCompleto ||
          objeto?.user?.nombre_completo ||
          objeto?.user?.nombre ||
          objeto?.user?.usuario;

        if (nombre) {
          return String(nombre).trim();
        }
      } catch (error) {
        // La clave no contiene un objeto JSON válido.
      }
    }
  }

  return "";
};

const normalizarTexto = (valor) =>
  String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const formatearFechaHoraColombia = (fechaIso) => {
  if (!fechaIso) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat("es-CO", {
      timeZone: "America/Bogota",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(new Date(fechaIso));
  } catch (error) {
    return "";
  }
};

const obtenerElaboradoPorInicial = () => {
  const nombreActual = obtenerNombreUsuarioActual();
  const valorNormalizado = normalizarTexto(nombreActual);

  const valoresGenericos = [
    "operaciones",
    "rrll",
    "relaciones laborales",
    "administrador",
    "admin",
  ];

  return valoresGenericos.includes(valorNormalizado)
    ? ""
    : nombreActual;
};

const SeccionFormulario = ({
  titulo,
  descripcion,
  children,
}) => (
  <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    <div className="border-b border-gray-200 bg-gray-50 px-4 py-4 sm:px-5">
      <h3 className="text-base font-bold text-gray-900 sm:text-lg">
        {titulo}
      </h3>

      {descripcion && (
        <p className="mt-1 text-sm leading-relaxed text-gray-500">
          {descripcion}
        </p>
      )}
    </div>

    <div className="p-4 sm:p-5">{children}</div>
  </section>
);

const CampoSelect = ({
  id,
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  helper = "",
}) => (
  <div className="min-w-0">
    <label
      htmlFor={id}
      className="mb-2 block text-sm font-semibold text-gray-800"
    >
      {label}
      {required && <span className="text-red-500"> *</span>}
    </label>

    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className="min-h-12 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
    >
      <option value="">Selecciona una opción</option>

      {options.map((opcion) => (
        <option key={opcion} value={opcion}>
          {opcion}
        </option>
      ))}
    </select>

    {helper && (
      <p className="mt-2 text-xs leading-relaxed text-gray-500">
        {helper}
      </p>
    )}
  </div>
);

const CampoTextoDictado = ({
  id,
  label,
  value,
  onChange,
  rows = 4,
  placeholder = "",
  required = false,
}) => {
  const [escuchando, setEscuchando] = useState(false);
  const [mensajeVoz, setMensajeVoz] = useState("");
  const reconocimientoRef = useRef(null);
  const valorBaseRef = useRef("");

  useEffect(() => {
    return () => {
      if (reconocimientoRef.current) {
        try {
          reconocimientoRef.current.stop();
        } catch (error) {
          // El reconocimiento ya estaba detenido.
        }
      }
    };
  }, []);

  const alternarDictado = () => {
    if (escuchando && reconocimientoRef.current) {
      reconocimientoRef.current.stop();
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMensajeVoz(
        "El dictado por voz no está disponible en este navegador. Puedes escribir normalmente."
      );
      return;
    }

    setMensajeVoz("");
    valorBaseRef.current = String(value || "").trim();

    const reconocimiento = new SpeechRecognition();

    reconocimiento.lang = "es-CO";
    reconocimiento.continuous = false;
    reconocimiento.interimResults = true;
    reconocimiento.maxAlternatives = 1;

    reconocimiento.onstart = () => {
      setEscuchando(true);
      setMensajeVoz("Escuchando... habla con claridad.");
    };

    reconocimiento.onresult = (event) => {
      let transcripcion = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcripcion += event.results[i][0]?.transcript || "";
      }

      const textoDictado = transcripcion.trim();
      const textoBase = valorBaseRef.current;

      if (!textoDictado) {
        return;
      }

      onChange(
        textoBase
          ? `${textoBase} ${textoDictado}`
          : textoDictado
      );
    };

    reconocimiento.onerror = (event) => {
      setEscuchando(false);

      const mensajes = {
        "not-allowed":
          "El navegador no tiene permiso para usar el micrófono.",
        "service-not-allowed":
          "El servicio de reconocimiento de voz no está permitido.",
        "no-speech":
          "No se detectó voz. Intenta nuevamente.",
        "audio-capture":
          "No fue posible acceder al micrófono del dispositivo.",
        network:
          "No fue posible usar el reconocimiento de voz en este momento.",
      };

      setMensajeVoz(
        mensajes[event?.error] ||
          "No fue posible completar el dictado. Puedes escribir normalmente."
      );
    };

    reconocimiento.onend = () => {
      setEscuchando(false);

      setMensajeVoz((actual) =>
        actual === "Escuchando... habla con claridad."
          ? ""
          : actual
      );
    };

    reconocimientoRef.current = reconocimiento;

    try {
      reconocimiento.start();
    } catch (error) {
      setEscuchando(false);
      setMensajeVoz(
        "No fue posible iniciar el micrófono. Intenta nuevamente."
      );
    }
  };

  return (
    <div className="min-w-0">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="block text-sm font-semibold text-gray-800"
        >
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>

        <button
          type="button"
          onClick={alternarDictado}
          className={cn(
            "inline-flex min-h-9 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition-colors",
            escuchando
              ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
              : "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
          )}
          title={
            escuchando
              ? "Detener dictado"
              : "Dictar texto con el micrófono"
          }
        >
          <Mic className="mr-1.5 h-4 w-4" />
          {escuchando ? "Detener" : "Dictar"}
        </button>
      </div>

      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />

      {mensajeVoz && (
        <p
          className={cn(
            "mt-2 text-xs leading-relaxed",
            escuchando ? "text-blue-700" : "text-gray-500"
          )}
        >
          {mensajeVoz}
        </p>
      )}
    </div>
  );
};


const VistaPreviaAdjunto = ({ archivo }) => {
  const [urlVistaPrevia, setUrlVistaPrevia] = useState("");

  const esImagen = String(archivo?.type || "")
    .toLowerCase()
    .startsWith("image/");

  useEffect(() => {
    if (!archivo || !esImagen) {
      setUrlVistaPrevia("");
      return undefined;
    }

    const url = URL.createObjectURL(archivo);
    setUrlVistaPrevia(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [archivo, esImagen]);

  if (!esImagen || !urlVistaPrevia) {
    return (
      <div className="flex min-h-28 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-center">
        <div>
          <FileText className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-xs font-medium text-gray-500">
            Vista previa no disponible para este tipo de archivo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <img
        src={urlVistaPrevia}
        alt={`Vista previa de ${archivo?.name || "evidencia"}`}
        className="h-48 w-full object-contain bg-gray-50 sm:h-56"
      />
      <div className="border-t border-gray-100 px-3 py-2">
        <p className="text-xs font-semibold text-emerald-700">
          Foto lista para enviar
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Verifica que la imagen se vea clara y completa. Si no quedó bien,
          puedes repetirla antes de enviar el retiro.
        </p>
      </div>
    </div>
  );
};


const CampoArchivo = ({
  id,
  label,
  files,
  onAdd,
  onRemove,
  multiple = false,
  required = false,
  helper = "",
}) => {
  const abrirArchivo = (archivo) => {
    if (!archivo) {
      return;
    }

    const url = URL.createObjectURL(archivo);
    const nuevaVentana = window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );

    if (!nuevaVentana) {
      URL.revokeObjectURL(url);
      return;
    }

    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60_000);
  };

  const descargarArchivo = (archivo) => {
    if (!archivo) {
      return;
    }

    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = archivo.name || "archivo";
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1_000);
  };

  return (
    <div className="min-w-0">
      <p className="mb-2 text-sm font-semibold text-gray-800">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label
          htmlFor={id}
          className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-dashed border-emerald-400 bg-emerald-50 px-4 text-center font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
        >
          <Paperclip className="mr-2 h-5 w-5 shrink-0" />

          {files.length > 0
            ? multiple
              ? "Adjuntar más archivos"
              : "Reemplazar archivo"
            : "Adjuntar archivo"}

          <input
            id={id}
            type="file"
            multiple={multiple}
            onChange={(event) => {
              onAdd(Array.from(event.target.files || []));
              event.target.value = "";
            }}
            className="hidden"
          />
        </label>

        <label
          htmlFor={`${id}-camara`}
          className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-dashed border-blue-400 bg-blue-50 px-4 text-center font-semibold text-blue-700 transition-colors hover:bg-blue-100"
          title="Abrir la cámara del dispositivo"
        >
          <Camera className="mr-2 h-5 w-5 shrink-0" />

          {files.length > 0
            ? multiple
              ? "Tomar otra foto"
              : "Reemplazar con foto"
            : "Tomar foto"}

          <input
            id={`${id}-camara`}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => {
              const foto = event.target.files?.[0];

              if (foto) {
                onAdd([foto]);
              }

              event.target.value = "";
            }}
            className="hidden"
          />
        </label>
      </div>

      {helper && (
        <p className="mt-2 text-xs leading-relaxed text-gray-500">
          {helper}
        </p>
      )}

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((archivo, index) => (
            <div
              key={`${archivo.name}-${archivo.size}-${index}`}
              className="rounded-xl border border-gray-200 bg-gray-50 p-3"
            >
              <div className="space-y-3">
                <VistaPreviaAdjunto archivo={archivo} />

                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {archivo.name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {(archivo.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                  <button
                    type="button"
                    onClick={() => abrirArchivo(archivo)}
                    className="inline-flex min-h-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                    title="Ver archivo"
                  >
                    <Eye className="mr-1.5 h-4 w-4" />
                    Ver
                  </button>

                  <button
                    type="button"
                    onClick={() => descargarArchivo(archivo)}
                    className="inline-flex min-h-9 items-center justify-center rounded-lg border border-emerald-200 bg-white px-3 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
                    title="Descargar archivo"
                  >
                    <Download className="mr-1.5 h-4 w-4" />
                    Descargar
                  </button>

                  <label
                    htmlFor={`${id}-reemplazar-${index}`}
                    className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-blue-200 bg-white px-3 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50"
                    title="Reemplazar archivo"
                  >
                    <Paperclip className="mr-1.5 h-4 w-4" />
                    Reemplazar
                    <input
                      id={`${id}-reemplazar-${index}`}
                      type="file"
                      onChange={(event) => {
                        const nuevosArchivos = Array.from(
                          event.target.files || []
                        );

                        if (nuevosArchivos.length > 0) {
                          onRemove(index);
                          onAdd(nuevosArchivos);
                        }

                        event.target.value = "";
                      }}
                      className="hidden"
                    />
                  </label>

                  {String(archivo?.type || "")
                    .toLowerCase()
                    .startsWith("image/") && (
                    <label
                      htmlFor={`${id}-repetir-foto-${index}`}
                      className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-blue-300 bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                      title="Tomar nuevamente la foto"
                    >
                      <Camera className="mr-1.5 h-4 w-4" />
                      Repetir foto
                      <input
                        id={`${id}-repetir-foto-${index}`}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(event) => {
                          const nuevaFoto = event.target.files?.[0];

                          if (nuevaFoto) {
                            onRemove(index);
                            onAdd([nuevaFoto]);
                          }

                          event.target.value = "";
                        }}
                        className="hidden"
                      />
                    </label>
                  )}

                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="inline-flex min-h-9 items-center justify-center rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                    title="Eliminar archivo"
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Eliminar
                  </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const OperacionesRetirosView = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [trabajadores, setTrabajadores] = useState([]);
  const [trabajadorSeleccionado, setTrabajadorSeleccionado] =
    useState(null);

  const [loadingSearch, setLoadingSearch] = useState(false);
  const [enviandoPazSalvo, setEnviandoPazSalvo] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [elementosPazSalvo, setElementosPazSalvo] = useState([]);
  const [loadingElementosPazSalvo, setLoadingElementosPazSalvo] =
    useState(false);
  const [origenConfiguracionElementos, setOrigenConfiguracionElementos] =
    useState("");
  const [tipoClasificacionElementos, setTipoClasificacionElementos] =
    useState("");

  const [clienteListaAbierta, setClienteListaAbierta] =
    useState(false);
  const [busquedaRealizada, setBusquedaRealizada] =
    useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("info");

  const [formularioAbierto, setFormularioAbierto] =
    useState(false);
  const [fechaHoraApertura, setFechaHoraApertura] =
    useState("");
  const [formulario, setFormulario] = useState({
    ...FORMULARIO_INICIAL,
  });
  const [adjuntos, setAdjuntos] = useState({
    ...ADJUNTOS_INICIALES,
  });

  const [mensajeGestion, setMensajeGestion] = useState("");
  const [tipoMensajeGestion, setTipoMensajeGestion] =
    useState("info");

  const obtenerIdRegistroPersonal = (trabajador) =>
    trabajador?.IdRegistroPersonal ||
    trabajador?.idRegistroPersonal ||
    trabajador?.id_registro_personal ||
    trabajador?.id ||
    null;

  const obtenerNombreCompleto = (trabajador) => {
    const nombreCompleto =
      trabajador?.NombreCompleto ||
      trabajador?.nombreCompleto;

    if (nombreCompleto) {
      return String(nombreCompleto).trim();
    }

    const nombres =
      trabajador?.Nombres ||
      trabajador?.nombres ||
      "";

    const apellidos =
      trabajador?.Apellidos ||
      trabajador?.apellidos ||
      "";

    return `${nombres} ${apellidos}`.trim();
  };

  const obtenerIdentificacion = (trabajador) =>
    trabajador?.NumeroDocumento ||
    trabajador?.NumeroIdentificacion ||
    trabajador?.numeroIdentificacion ||
    trabajador?.cedula ||
    trabajador?.identificacion ||
    trabajador?.documento ||
    "";

  const obtenerCargo = (trabajador) =>
    trabajador?.Cargo ||
    trabajador?.cargo ||
    trabajador?.NombreCargo ||
    trabajador?.nombreCargo ||
    trabajador?.DescripcionCargo ||
    trabajador?.descripcionCargo ||
    trabajador?.cargoNombre ||
    trabajador?.CargoNombre ||
    trabajador?.NombreTipoCargo ||
    trabajador?.DescripcionTipoCargo ||
    "Cargo no asignado";

  const obtenerCliente = (trabajador) =>
    trabajador?.Cliente ||
    trabajador?.cliente ||
    trabajador?.NombreCliente ||
    trabajador?.nombreCliente ||
    trabajador?.ClienteNombre ||
    trabajador?.clienteNombre ||
    trabajador?.DescripcionCliente ||
    trabajador?.descripcionCliente ||
    trabajador?.Proyecto ||
    trabajador?.proyecto ||
    "";

  const obtenerIdEstadoProceso = (trabajador) =>
    Number(
      trabajador?.IdEstadoProceso ||
        trabajador?.idEstadoProceso ||
        trabajador?.id_estado_proceso ||
        0
    );

  const obtenerEstadoTexto = (trabajador) =>
    String(
      trabajador?.Estado ||
        trabajador?.estado ||
        trabajador?.EstadoProceso ||
        trabajador?.NombreEstado ||
        trabajador?.nombreEstado ||
        ""
    )
      .trim()
      .toUpperCase();

  const esTrabajadorContratado = (trabajador) => {
    const idEstadoProceso =
      obtenerIdEstadoProceso(trabajador);

    const estadoTexto =
      obtenerEstadoTexto(trabajador);

    return (
      idEstadoProceso === 25 ||
      estadoTexto === "CONTRATADO"
    );
  };

  const resultados = useMemo(() => {
    const criterio = normalizarTexto(searchApplied);

    if (!criterio) {
      return [];
    }

    return trabajadores.filter((trabajador) => {
      const nombreCompleto = normalizarTexto(
        obtenerNombreCompleto(trabajador)
      );

      const identificacion = normalizarTexto(
        obtenerIdentificacion(trabajador)
      );

      return (
        nombreCompleto.includes(criterio) ||
        identificacion.includes(criterio)
      );
    });
  }, [trabajadores, searchApplied]);

  const resultadosVisibles = useMemo(() => {
    if (trabajadorSeleccionado) {
      return [trabajadorSeleccionado];
    }

    return resultados;
  }, [resultados, trabajadorSeleccionado]);

  const clientesFiltrados = useMemo(() => {
    const criterio = normalizarTexto(formulario.clienteNombre);

    // No mostramos el catálogo completo.
    // Las coincidencias solo aparecen cuando el usuario empieza
    // a escribir para buscar un cliente diferente.
    if (!criterio || formulario.idCliente) {
      return [];
    }

    return clientes.filter((cliente) =>
      normalizarTexto(cliente?.NombreCliente).includes(criterio)
    );
  }, [
    clientes,
    formulario.clienteNombre,
    formulario.idCliente,
  ]);

  const construirHeaders = () => {
    const token = obtenerTokenAutenticacion();

    if (!token) {
      throw new Error(
        "No se encontró el token de autenticación. Cierra sesión e ingresa nuevamente."
      );
    }

    return {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const consultarTrabajadores = async (criterio) => {
    const parametros = new URLSearchParams({
      search: criterio,
    });

    const response = await fetch(
      `${API_URL}/aspirantes?${parametros.toString()}`,
      {
        method: "GET",
        headers: construirHeaders(),
      }
    );

    if (response.status === 401) {
      throw new Error(
        "La sesión no está autorizada o venció. Cierra sesión e ingresa nuevamente."
      );
    }

    if (!response.ok) {
      throw new Error(
        `No se pudo consultar el personal. Código HTTP: ${response.status}.`
      );
    }

    const data = await response.json();

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.aspirantes)) {
      return data.aspirantes;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    if (Array.isArray(data?.items)) {
      return data.items;
    }

    return [];
  };

  const consultarUsuarioActual = async () => {
    try {
      const response = await fetch(
        `${API_URL}/operaciones/retiros/usuario-actual`,
        {
          method: "GET",
          headers: construirHeaders(),
        }
      );

      if (!response.ok) {
        return obtenerNombreUsuarioActual() || "";
      }

      const data = await response.json();

      return (
        data?.data?.NombreCompleto ||
        obtenerNombreUsuarioActual() ||
        ""
      );
    } catch (error) {
      return obtenerNombreUsuarioActual() || "";
    }
  };

  const consultarClientes = async () => {
    const response = await fetch(
      `${API_URL}/operaciones/retiros/clientes`,
      {
        method: "GET",
        headers: construirHeaders(),
      }
    );

    if (response.status === 401) {
      throw new Error(
        "La sesión no está autorizada o venció. Cierra sesión e ingresa nuevamente."
      );
    }

    if (!response.ok) {
      throw new Error(
        `No se pudo consultar el catálogo de clientes. Código HTTP: ${response.status}.`
      );
    }

    const data = await response.json();

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    return [];
  };

  const consultarClienteActualTrabajador = async (
    idRegistroPersonal
  ) => {
    const response = await fetch(
      `${API_URL}/operaciones/retiros/clientes/trabajador/${idRegistroPersonal}`,
      {
        method: "GET",
        headers: construirHeaders(),
      }
    );

    if (response.status === 401) {
      throw new Error(
        "La sesión no está autorizada o venció. Cierra sesión e ingresa nuevamente."
      );
    }

    if (!response.ok) {
      throw new Error(
        `No se pudo consultar el cliente actual del trabajador. Código HTTP: ${response.status}.`
      );
    }

    const data = await response.json();

    return data?.data || null;
  };

  const consultarElementosPazSalvoTrabajador = async (
    idRegistroPersonal
  ) => {
    const response = await fetch(
      `${API_URL}/operaciones/retiros/elementos/trabajador/${idRegistroPersonal}`,
      {
        method: "GET",
        headers: construirHeaders(),
      }
    );

    if (response.status === 401) {
      throw new Error(
        "La sesión no está autorizada o venció. Cierra sesión e ingresa nuevamente."
      );
    }

    if (!response.ok) {
      throw new Error(
        `No se pudo consultar la configuración de elementos del trabajador. Código HTTP: ${response.status}.`
      );
    }

    const data = await response.json();

    return data?.data || null;
  };

  const buscarClientePorNombre = (lista, nombre) => {
    const nombreNormalizado = normalizarTexto(nombre);

    if (!nombreNormalizado) {
      return null;
    }

    return (
      lista.find(
        (cliente) =>
          normalizarTexto(cliente?.NombreCliente) ===
          nombreNormalizado
      ) || null
    );
  };

  const actualizarClienteFormulario = (nombreCliente) => {
    const clienteEncontrado = buscarClientePorNombre(
      clientes,
      nombreCliente
    );

    setFormulario((actual) => ({
      ...actual,
      clienteNombre: nombreCliente,
      idCliente: clienteEncontrado
        ? String(clienteEncontrado.IdCliente)
        : "",
    }));

    setClienteListaAbierta(true);
    setMensajeGestion("");
    setTipoMensajeGestion("info");
  };

  const seleccionarClienteFormulario = (cliente) => {
    if (!cliente?.IdCliente) {
      return;
    }

    setFormulario((actual) => ({
      ...actual,
      idCliente: String(cliente.IdCliente),
      clienteNombre: String(
        cliente.NombreCliente || ""
      ).trim(),
    }));

    setClienteListaAbierta(false);
    setMensajeGestion("");
    setTipoMensajeGestion("info");
  };

  const limpiarFormulario = () => {
    setFormularioAbierto(false);
    setFechaHoraApertura("");
    setClienteListaAbierta(false);
    setElementosPazSalvo([]);
    setOrigenConfiguracionElementos("");
    setTipoClasificacionElementos("");
    setFormulario({
      ...FORMULARIO_INICIAL,
    });
    setAdjuntos({
      ...ADJUNTOS_INICIALES,
    });
    setMensajeGestion("");
    setTipoMensajeGestion("info");
  };

  const limpiarGestionRetiro = () => {
    setTrabajadorSeleccionado(null);
    limpiarFormulario();
  };

  const handleBuscar = async () => {
    const criterio = searchTerm.trim();

    setMensaje("");
    setTipoMensaje("info");
    setMensajeGestion("");
    setTipoMensajeGestion("info");
    setBusquedaRealizada(false);
    setSearchApplied("");
    setTrabajadores([]);
    limpiarGestionRetiro();

    if (!criterio) {
      setMensaje(
        "Debes ingresar el nombre o número de identificación del trabajador."
      );
      setTipoMensaje("warning");
      return;
    }

    try {
      setLoadingSearch(true);

      const lista = await consultarTrabajadores(criterio);

      setTrabajadores(lista);
      setSearchApplied(criterio);
      setBusquedaRealizada(true);

      const criterioNormalizado =
        normalizarTexto(criterio);

      const encontrados = lista.filter((trabajador) => {
        const nombre = normalizarTexto(
          obtenerNombreCompleto(trabajador)
        );

        const documento = normalizarTexto(
          obtenerIdentificacion(trabajador)
        );

        return (
          nombre.includes(criterioNormalizado) ||
          documento.includes(criterioNormalizado)
        );
      });

      if (encontrados.length === 0) {
        setMensaje(
          "No se encontró un trabajador con ese criterio."
        );
        setTipoMensaje("warning");
        return;
      }

      const coincidenciaExactaDocumento = encontrados.find(
        (trabajador) =>
          normalizarTexto(obtenerIdentificacion(trabajador)) ===
          criterioNormalizado
      );

      if (coincidenciaExactaDocumento) {
        seleccionarTrabajador(coincidenciaExactaDocumento);
      } else if (encontrados.length === 1) {
        seleccionarTrabajador(encontrados[0]);
      }
    } catch (error) {
      console.error(
        "Error consultando trabajadores:",
        error
      );

      setTrabajadores([]);
      setSearchApplied(criterio);
      setBusquedaRealizada(true);
      setMensaje(
        error?.message ||
          "No se pudo realizar la búsqueda del trabajador."
      );
      setTipoMensaje("error");
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleBuscar();
    }
  };

  const seleccionarTrabajador = (trabajador) => {
    if (!esTrabajadorContratado(trabajador)) {
      setMensaje(
        "El trabajador seleccionado no se encuentra contratado y no puede iniciar un retiro desde Operaciones."
      );
      setTipoMensaje("warning");
      return null;
    }

    const idRegistroPersonal =
      obtenerIdRegistroPersonal(trabajador);

    if (!idRegistroPersonal) {
      setMensaje(
        "No fue posible identificar el registro personal del trabajador."
      );
      setTipoMensaje("error");
      return null;
    }

    const trabajadorNormalizado = {
      ...trabajador,
      IdRegistroPersonal: idRegistroPersonal,
      NombreCompleto:
        obtenerNombreCompleto(trabajador),
      NumeroDocumento:
        obtenerIdentificacion(trabajador),
      Cargo: obtenerCargo(trabajador),
      Cliente: obtenerCliente(trabajador),
    };

    setTrabajadorSeleccionado(trabajadorNormalizado);
    setMensaje("");
    limpiarFormulario();

    return trabajadorNormalizado;
  };

  const abrirFormularioPazSalvo = async (trabajador = null) => {
    const trabajadorParaFormulario = trabajador
      ? seleccionarTrabajador(trabajador)
      : trabajadorSeleccionado;

    if (!trabajadorParaFormulario) {
      return;
    }

    setFechaHoraApertura(new Date().toISOString());
    setFormulario({
      ...FORMULARIO_INICIAL,
      elaboradoPor: obtenerElaboradoPorInicial(),
      clienteNombre: trabajadorParaFormulario.Cliente || "",
    });
    setAdjuntos({
      ...ADJUNTOS_INICIALES,
    });
    setFormularioAbierto(true);
    setMensajeGestion("");
    setTipoMensajeGestion("info");

    try {
      setLoadingClientes(true);
      setLoadingElementosPazSalvo(true);

      const [
        listaClientes,
        clienteActual,
        nombreUsuarioActual,
        configuracionElementos,
      ] = await Promise.all([
        consultarClientes(),
        consultarClienteActualTrabajador(
          trabajadorParaFormulario.IdRegistroPersonal
        ),
        consultarUsuarioActual(),
        consultarElementosPazSalvoTrabajador(
          trabajadorParaFormulario.IdRegistroPersonal
        ),
      ]);

      setClientes(listaClientes);

      const elementosConfigurados = Array.isArray(
        configuracionElementos?.Elementos
      )
        ? configuracionElementos.Elementos
        : [];

      const elementosReconocidos = elementosConfigurados
        .map((elemento) => {
          const codigo = normalizarCodigoElemento(
            elemento?.CodigoElemento
          );
          const configuracion = ELEMENTOS_PAZ_SALVO[codigo];

          if (!configuracion) {
            return null;
          }

          return {
            ...elemento,
            CodigoElemento: codigo,
            campo: configuracion.campo,
            label:
              String(elemento?.NombreElemento || "").trim() ||
              configuracion.label,
            opciones: configuracion.opciones,
          };
        })
        .filter(Boolean);

      setElementosPazSalvo(elementosReconocidos);
      setOrigenConfiguracionElementos(
        String(configuracionElementos?.OrigenConfiguracion || "")
      );
      setTipoClasificacionElementos(
        String(configuracionElementos?.TipoClasificacion || "")
      );

      setFormulario((actual) => {
        const siguiente = {
          ...actual,
        };

        CAMPOS_ELEMENTOS_PAZ_SALVO.forEach((campo) => {
          siguiente[campo] = "NO APLICA";
        });

        elementosReconocidos.forEach((elemento) => {
          siguiente[elemento.campo] = "";
        });

        return siguiente;
      });

      setFormulario((actual) => ({
        ...actual,
        elaboradoPor:
          nombreUsuarioActual ||
          obtenerNombreUsuarioActual() ||
          "",
      }));

      const clientePrecargado =
        clienteActual ||
        buscarClientePorNombre(
          listaClientes,
          trabajadorParaFormulario.Cliente
        );

      setFormulario((actual) => ({
        ...actual,
        idCliente: clientePrecargado?.IdCliente
          ? String(clientePrecargado.IdCliente)
          : "",
        clienteNombre:
          clientePrecargado?.NombreCliente ||
          trabajadorParaFormulario.Cliente ||
          "",
      }));
      setClienteListaAbierta(false);

      if (!clientePrecargado) {
        setMensajeGestion(
          "No fue posible identificar automáticamente un cliente válido. Búscalo y selecciónalo en la lista antes de continuar."
        );
        setTipoMensajeGestion("warning");
      }
    } catch (error) {
      console.error(
        "Error cargando información de clientes:",
        error
      );

      setClientes([]);
      setMensajeGestion(
        error?.message ||
          "No fue posible cargar el catálogo de clientes."
      );
      setTipoMensajeGestion("error");
    } finally {
      setLoadingClientes(false);
      setLoadingElementosPazSalvo(false);
    }

    window.setTimeout(() => {
      document
        .getElementById("formulario-paz-salvo")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  const actualizarCampo = (campo, valor) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));

    setMensajeGestion("");
    setTipoMensajeGestion("info");
  };

  const agregarAdjuntos = (
    campo,
    archivos,
    multiple = false
  ) => {
    if (!archivos.length) {
      return;
    }

    const limiteBytes = 10 * 1024 * 1024;

    const archivosValidos = archivos.filter(
      (archivo) => archivo.size <= limiteBytes
    );

    if (archivosValidos.length !== archivos.length) {
      setMensajeGestion(
        "Uno o más archivos superan el tamaño máximo permitido de 10 MB por archivo."
      );
      setTipoMensajeGestion("warning");
    }

    setAdjuntos((actual) => ({
      ...actual,
      [campo]: multiple
        ? [...actual[campo], ...archivosValidos]
        : archivosValidos.slice(0, 1),
    }));
  };

  const eliminarAdjunto = (campo, index) => {
    setAdjuntos((actual) => ({
      ...actual,
      [campo]: actual[campo].filter(
        (_, posicion) => posicion !== index
      ),
    }));
  };

  const validarFormulario = () => {
    const requeridos = [
      ["elaboradoPor", "Elaborado por"],
      ["idCliente", "Cliente"],
      ["idMotivoRetiro", "Motivo de retiro"],
      [
        "descripcionMotivoRetiro",
        "Descripción del motivo de retiro",
      ],
      ...elementosPazSalvo.map((elemento) => [
        elemento.campo,
        elemento.label,
      ]),
      [
        "observacionesEntrega",
        "Observaciones de la entrega",
      ],
      ["aplicaDescuento", "Aplica descuento"],
      ["ultimoDiaLaborado", "Último día laborado"],
      [
        "pendienteEntregaUniforme",
        "Pendiente entrega de uniforme",
      ],
      ["uniformePatogeno", "Uniforme patógeno"],
      ["botas", "Botas"],
      ["zapatos", "Zapatos"],
      ["chaqueta", "Chaqueta"],
      ["carnetAlpArl", "Carnet ALP-ARL"],
      [
        "pendientePagoVacunas",
        "Pendiente pago de vacunas",
      ],
      ["correoSupervisora", "Correo de la supervisora"],
    ];

    const faltantes = requeridos
      .filter(([campo]) => !String(formulario[campo] || "").trim())
      .map(([, etiqueta]) => etiqueta);

    if (
      formulario.clienteNombre &&
      !formulario.idCliente
    ) {
      faltantes.push(
        "Seleccionar un cliente válido de la lista"
      );
    }

    if (formulario.estadoPazSalvo !== "CERRADO") {
      faltantes.push(
        "Cerrar el paz y salvo antes de enviarlo"
      );
    }

    return faltantes;
  };

  const enviarPazSalvo = async () => {
    const faltantes = validarFormulario();

    if (faltantes.length > 0) {
      setMensajeGestion(
        `Falta completar: ${faltantes.join(", ")}.`
      );
      setTipoMensajeGestion("warning");
      return;
    }

    if (!trabajadorSeleccionado?.IdRegistroPersonal) {
      setMensajeGestion(
        "No fue posible identificar el trabajador seleccionado."
      );
      setTipoMensajeGestion("error");
      return;
    }

    if (!fechaHoraApertura) {
      setMensajeGestion(
        "No fue posible determinar la fecha y hora de apertura del paz y salvo."
      );
      setTipoMensajeGestion("error");
      return;
    }

    try {
      setEnviandoPazSalvo(true);
      setMensajeGestion("");
      setTipoMensajeGestion("info");

      const formData = new FormData();

      formData.append(
        "IdRegistroPersonal",
        String(trabajadorSeleccionado.IdRegistroPersonal)
      );
      formData.append(
        "IdCliente",
        String(formulario.idCliente)
      );
      formData.append(
        "IdMotivoRetiro",
        String(formulario.idMotivoRetiro)
      );
      formData.append(
        "FechaUltimoDiaLaborado",
        formulario.ultimoDiaLaborado
      );
      formData.append(
        "UsuarioActualizacion",
        obtenerNombreUsuarioActual() || "operaciones"
      );
      formData.append(
        "Observacion",
        "Retiro enviado desde el módulo de Operaciones."
      );

      formData.append(
        "FechaHoraInicioDiligenciamiento",
        fechaHoraApertura
      );
      formData.append(
        "ElaboradoPor",
        formulario.elaboradoPor.trim()
      );
      formData.append(
        "DescripcionMotivoRetiro",
        formulario.descripcionMotivoRetiro.trim()
      );

      formData.append("Locker", formulario.locker);
      formData.append("Llaves", formulario.llaves);
      formData.append(
        "EntregaHerramientas",
        formulario.entregaHerramientas
      );
      formData.append(
        "TarjetaControlAcceso",
        formulario.tarjetaControlAcceso
      );

      formData.append(
        "EntregaGuantes",
        formulario.entregaGuantes
      );
      formData.append(
        "EntregaMonogafas",
        formulario.entregaMonogafas
      );
      formData.append("EntregaPeto", formulario.entregaPeto);
      formData.append(
        "ObservacionesEntrega",
        formulario.observacionesEntrega.trim()
      );

      formData.append(
        "AplicaDescuento",
        formulario.aplicaDescuento
      );

      if (String(formulario.valorDescuento || "").trim()) {
        formData.append(
          "ValorDescuento",
          String(formulario.valorDescuento).trim()
        );
      }

      if (String(formulario.novedadesNomina || "").trim()) {
        formData.append(
          "NovedadesNomina",
          formulario.novedadesNomina.trim()
        );
      }

      formData.append(
        "PendienteEntregaUniforme",
        formulario.pendienteEntregaUniforme
      );
      formData.append(
        "UniformePatogeno",
        formulario.uniformePatogeno
      );
      formData.append("Botas", formulario.botas);
      formData.append("Zapatos", formulario.zapatos);
      formData.append("Chaqueta", formulario.chaqueta);
      formData.append(
        "CarnetAlpArl",
        formulario.carnetAlpArl
      );
      formData.append(
        "PendientePagoVacunas",
        formulario.pendientePagoVacunas
      );

      if (
        String(
          formulario.usuariosClavesDispositivos || ""
        ).trim()
      ) {
        formData.append(
          "UsuariosClavesDispositivos",
          formulario.usuariosClavesDispositivos.trim()
        );
      }

      formData.append(
        "CorreoSupervisora",
        formulario.correoSupervisora.trim()
      );
      formData.append(
        "EstadoPazYSalvo",
        formulario.estadoPazSalvo
      );

      // ============================================================
      // EVIDENCIAS DE OPERACIONES
      // Los nombres deben coincidir exactamente con los parámetros
      // UploadFile definidos en POST /api/operaciones/retiros/enviar.
      // ============================================================

      adjuntos.novedadesNomina.forEach((archivo) => {
        formData.append("novedadesNominaArchivo", archivo);
      });

      if (adjuntos.formatoDescuentoVacunas.length > 0) {
        formData.append(
          "formatoDescuentoVacunasArchivo",
          adjuntos.formatoDescuentoVacunas[0]
        );
      }

      if (adjuntos.fotoCarnetAcceso.length > 0) {
        formData.append(
          "fotoCarnetAccesoArchivo",
          adjuntos.fotoCarnetAcceso[0]
        );
      }

      if (adjuntos.fotoListadoHerramientas.length > 0) {
        formData.append(
          "fotoListadoHerramientasArchivo",
          adjuntos.fotoListadoHerramientas[0]
        );
      }

      if (adjuntos.fotoPlanillaNomina.length > 0) {
        formData.append(
          "fotoPlanillaNominaArchivo",
          adjuntos.fotoPlanillaNomina[0]
        );
      }

      const response = await fetch(
        `${API_URL}/operaciones/retiros/enviar`,
        {
          method: "POST",
          headers: construirHeaders(),
          body: formData,
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch (error) {
        data = null;
      }

      if (response.status === 401) {
        throw new Error(
          "La sesión no está autorizada o venció. Cierra sesión e ingresa nuevamente."
        );
      }

      if (!response.ok) {
        const detalle =
          data?.detail ||
          data?.message ||
          `No fue posible enviar el retiro. Código HTTP: ${response.status}.`;

        throw new Error(
          typeof detalle === "string"
            ? detalle
            : JSON.stringify(detalle)
        );
      }

      setMensajeGestion(
        "El retiro, el paz y salvo y las evidencias de Operaciones fueron enviados correctamente a Relaciones Laborales."
      );
      setTipoMensajeGestion("success");
    } catch (error) {
      console.error(
        "Error enviando paz y salvo a Relaciones Laborales:",
        error
      );

      setMensajeGestion(
        error?.message ||
          "No fue posible enviar el retiro a Relaciones Laborales."
      );
      setTipoMensajeGestion("error");
    } finally {
      setEnviandoPazSalvo(false);
    }
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="w-full min-w-0 max-w-full space-y-4 overflow-x-hidden"
    >
      <section className="w-full min-w-0 overflow-hidden rounded-2xl border-t-4 border-emerald-600 bg-white p-4 shadow-xl sm:p-6 lg:p-8">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-200">
            <FileText className="h-6 w-6 text-white" />
          </div>

          <div className="min-w-0">
            <h1 className="break-words text-xl font-bold text-gray-800 sm:text-2xl">
              Retiros
            </h1>

            <p className="mt-1 break-words text-sm leading-relaxed text-gray-500">
              Busca al trabajador y diligencia su paz y salvo
              para iniciar el proceso de retiro hacia Relaciones
              Laborales.
            </p>
          </div>
        </div>

        <div className="mt-6 grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <Input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Buscar por nombre o número de identificación..."
              className="min-h-11 w-full min-w-0 bg-gray-50 pl-9"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleBuscar}
            disabled={loadingSearch}
            className="min-h-11 w-full rounded-xl border-emerald-300 font-semibold text-emerald-700 hover:bg-emerald-50 lg:w-auto"
          >
            <Search className="mr-2 h-4 w-4" />

            {loadingSearch ? "Buscando..." : "Buscar"}
          </Button>
        </div>

        {mensaje && (
          <div
            className={cn(
              "mt-4 rounded-xl border px-4 py-3 text-sm",
              tipoMensaje === "success" &&
                "border-emerald-200 bg-emerald-50 text-emerald-800",
              tipoMensaje === "error" &&
                "border-red-200 bg-red-50 text-red-700",
              tipoMensaje === "warning" &&
                "border-amber-200 bg-amber-50 text-amber-800",
              tipoMensaje === "info" &&
                "border-blue-200 bg-blue-50 text-blue-700"
            )}
          >
            {mensaje}
          </div>
        )}

        <div className="mt-6">
          {!busquedaRealizada ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-12 text-center sm:px-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                <User className="h-8 w-8 text-gray-400" />
              </div>

              <h2 className="mt-4 text-lg font-semibold text-gray-700">
                Busca un trabajador
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-gray-500">
                Ingresa el nombre o número de identificación
                del trabajador.
              </p>
            </div>
          ) : resultadosVisibles.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-12 text-center sm:px-6">
              <Search className="mx-auto h-10 w-10 text-gray-400" />

              <h2 className="mt-4 text-lg font-semibold text-gray-700">
                No se encontró un trabajador
              </h2>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-600">
                {trabajadorSeleccionado
                  ? "Trabajador seleccionado"
                  : resultadosVisibles.length === 1
                    ? "Trabajador encontrado"
                    : `${resultadosVisibles.length} trabajadores encontrados`}
              </p>

              {resultadosVisibles.map((trabajador) => {
                const idRegistroPersonal =
                  obtenerIdRegistroPersonal(trabajador);

                const trabajadorContratado =
                  esTrabajadorContratado(trabajador);

                const seleccionado =
                  trabajadorSeleccionado
                    ?.IdRegistroPersonal ===
                  idRegistroPersonal;

                return (
                  <article
                    key={
                      idRegistroPersonal ||
                      obtenerIdentificacion(trabajador)
                    }
                    className={cn(
                      "min-w-0 overflow-hidden rounded-2xl border bg-white shadow-sm transition-all",
                      seleccionado
                        ? "border-emerald-500 ring-2 ring-emerald-100"
                        : "border-emerald-200 hover:shadow-md"
                    )}
                  >
                    <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                          <User className="h-6 w-6" />
                        </div>

                        <div className="min-w-0">
                          <h3 className="break-words text-base font-bold text-gray-900 sm:text-lg">
                            {obtenerNombreCompleto(
                              trabajador
                            ).toUpperCase()}
                          </h3>

                          <p className="mt-1 break-words text-sm text-gray-600">
                            Documento:{" "}
                            {obtenerIdentificacion(trabajador)}
                          </p>

                          <p className="mt-1 break-words text-sm text-gray-600">
                            Cargo: {obtenerCargo(trabajador)}
                          </p>

                          <span
                            className={cn(
                              "mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide",
                              trabajadorContratado
                                ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                                : "border-gray-300 bg-gray-100 text-gray-700"
                            )}
                          >
                            {obtenerEstadoTexto(trabajador) ||
                              `ESTADO ${
                                obtenerIdEstadoProceso(
                                  trabajador
                                ) || "NO DEFINIDO"
                              }`}
                          </span>
                        </div>
                      </div>

                      {trabajadorContratado ? (
                        <Button
                          type="button"
                          onClick={() =>
                            abrirFormularioPazSalvo(trabajador)
                          }
                          className="min-h-11 w-full rounded-xl bg-emerald-600 px-5 font-semibold text-white hover:bg-emerald-700 lg:w-auto"
                        >
                          <ClipboardCheck className="mr-2 h-5 w-5" />
                          Diligenciar paz y salvo
                        </Button>
                      ) : (
                        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                          El trabajador no se encuentra
                          contratado.
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {trabajadorSeleccionado && formularioAbierto && (
        <section className="w-full min-w-0 rounded-2xl border border-emerald-200 bg-white p-4 shadow-lg sm:p-6 lg:p-8">
          <div
            id="formulario-paz-salvo"
            className="space-y-5"
          >
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 sm:px-5">
                <div className="flex items-start gap-3">
                  <ClipboardCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" />

                  <div>
                    <h3 className="font-bold text-emerald-900">
                      Diligenciar paz y salvo
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-emerald-800">
                      La fecha y hora se registraron
                      automáticamente al abrir el formulario. El
                      motivo de retiro y el último día laborado
                      alimentarán los mismos campos que utiliza
                      Relaciones Laborales.
                    </p>
                  </div>
                </div>
              </div>

              <SeccionFormulario
                titulo="Información general"
                descripcion="Datos de elaboración y validación del cliente."
              >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">
                      Fecha y hora
                    </label>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <Input
                        value={formatearFechaHoraColombia(
                          fechaHoraApertura
                        )}
                        disabled
                        className="min-h-12 bg-gray-100 pl-10 text-gray-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="elaboradoPor"
                      className="mb-2 block text-sm font-semibold text-gray-800"
                    >
                      Elaborado por
                      <span className="text-red-500"> *</span>
                    </label>
                    <Input
                      id="elaboradoPor"
                      value={formulario.elaboradoPor}
                      disabled
                      placeholder="Nombre del usuario que inició sesión"
                      className="min-h-12 bg-gray-100 text-gray-700"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="clientePazSalvo"
                      className="mb-2 block text-sm font-semibold text-gray-800"
                    >
                      Cliente
                      <span className="text-red-500"> *</span>
                    </label>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />

                      <Input
                        id="clientePazSalvo"
                        autoComplete="off"
                        value={formulario.clienteNombre}
                        onFocus={() =>
                          setClienteListaAbierta(true)
                        }
                        onChange={(event) =>
                          actualizarClienteFormulario(
                            event.target.value
                          )
                        }
                        placeholder={
                          loadingClientes
                            ? "Cargando clientes..."
                            : "Escribe para buscar y seleccionar un cliente..."
                        }
                        disabled={loadingClientes}
                        className="min-h-12 bg-white pl-9 pr-10 text-gray-900"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setClienteListaAbierta(
                            (actual) => !actual
                          )
                        }
                        disabled={loadingClientes}
                        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed"
                        title="Ver lista de clientes"
                      >
                        <span className="text-sm">
                          {clienteListaAbierta ? "▲" : "▼"}
                        </span>
                      </button>

                      {clienteListaAbierta &&
                        !loadingClientes &&
                        !formulario.idCliente &&
                        String(formulario.clienteNombre || "").trim() && (
                        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
                          {clientesFiltrados.length > 0 ? (
                            clientesFiltrados.map((cliente) => {
                              const seleccionado =
                                String(formulario.idCliente) ===
                                String(cliente.IdCliente);

                              return (
                                <button
                                  key={cliente.IdCliente}
                                  type="button"
                                  onMouseDown={(event) => {
                                    event.preventDefault();
                                    seleccionarClienteFormulario(
                                      cliente
                                    );
                                  }}
                                  className={cn(
                                    "block w-full px-4 py-3 text-left text-sm transition-colors",
                                    seleccionado
                                      ? "bg-emerald-50 font-semibold text-emerald-800"
                                      : "text-gray-700 hover:bg-gray-50"
                                  )}
                                >
                                  {cliente.NombreCliente}
                                </button>
                              );
                            })
                          ) : (
                            <div className="px-4 py-3 text-sm text-gray-500">
                              No se encontraron clientes con ese nombre.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
                      <span className="font-semibold">
                        Valida el cliente:
                      </span>{" "}
                      el sistema carga automáticamente el cliente registrado
                      actualmente en la base de datos. Si no corresponde,
                      escribe el nombre y selecciona el cliente correcto de la
                      lista antes de continuar.
                    </div>
                  </div>
                </div>
              </SeccionFormulario>

              <SeccionFormulario
                titulo="Retiro"
                descripcion="Información del retiro."
              >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="motivoRetiro"
                      className="mb-2 block text-sm font-semibold text-gray-800"
                    >
                      Motivo de retiro
                      <span className="text-red-500"> *</span>
                    </label>

                    <select
                      id="motivoRetiro"
                      value={formulario.idMotivoRetiro}
                      onChange={(event) =>
                        actualizarCampo(
                          "idMotivoRetiro",
                          event.target.value
                        )
                      }
                      className="min-h-12 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="">
                        Selecciona el motivo de retiro
                      </option>

                      {MOTIVOS_RETIRO.map((motivo) => (
                        <option
                          key={motivo.id}
                          value={motivo.id}
                        >
                          {motivo.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="ultimoDiaLaborado"
                      className="mb-2 block text-sm font-semibold text-gray-800"
                    >
                      Último día laborado
                      <span className="text-red-500"> *</span>
                    </label>

                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="ultimoDiaLaborado"
                        type="date"
                        value={formulario.ultimoDiaLaborado}
                        onChange={(event) =>
                          actualizarCampo(
                            "ultimoDiaLaborado",
                            event.target.value
                          )
                        }
                        className="min-h-12 pl-10"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <CampoTextoDictado
                      id="descripcionMotivoRetiro"
                      label="Descripción del motivo del retiro"
                      value={formulario.descripcionMotivoRetiro}
                      onChange={(valor) =>
                        actualizarCampo(
                          "descripcionMotivoRetiro",
                          valor
                        )
                      }
                      rows={4}
                      placeholder="Describe de manera clara el motivo del retiro..."
                      required
                    />
                  </div>
                </div>
              </SeccionFormulario>

              <SeccionFormulario
                titulo="Entrega de elementos"
                descripcion="Registra el estado de los elementos que aplican al trabajador según su cargo o clasificación."
              >
                {loadingElementosPazSalvo ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-600">
                    Cargando elementos aplicables al trabajador...
                  </div>
                ) : elementosPazSalvo.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-relaxed text-amber-900">
                    No hay elementos configurados para este cargo o clasificación.
                    Valida la parametrización antes de continuar.
                  </div>
                ) : (
                  <>
                    <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-emerald-900">
                      <span className="font-semibold">
                        Elementos aplicables:
                      </span>{" "}
                      el sistema muestra únicamente los elementos configurados
                      para este trabajador.
                      {origenConfiguracionElementos === "CARGO" && (
                        <> Configuración específica por cargo.</>
                      )}
                      {origenConfiguracionElementos === "CLASIFICACION" &&
                        tipoClasificacionElementos && (
                          <>
                            {" "}
                            Configuración general:{" "}
                            <span className="font-semibold">
                              {tipoClasificacionElementos}
                            </span>
                            .
                          </>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      {elementosPazSalvo.map((elemento) => (
                        <CampoSelect
                          key={`${elemento.CodigoElemento}-${elemento.campo}`}
                          id={`elemento-${elemento.CodigoElemento}`}
                          label={elemento.label}
                          value={formulario[elemento.campo]}
                          onChange={(valor) =>
                            actualizarCampo(elemento.campo, valor)
                          }
                          options={elemento.opciones}
                          required
                        />
                      ))}
                    </div>

                    <div className="mt-5">
                      <CampoTextoDictado
                        id="observacionesEntrega"
                        label="Observaciones de la entrega"
                        value={formulario.observacionesEntrega}
                        onChange={(valor) =>
                          actualizarCampo(
                            "observacionesEntrega",
                            valor
                          )
                        }
                        rows={4}
                        placeholder="Registra observaciones, pendientes o aclaraciones..."
                        required
                      />
                    </div>
                  </>
                )}
              </SeccionFormulario>

              <SeccionFormulario
                titulo="Descuentos y novedades de nómina"
                descripcion="Registra si aplica descuento y adjunta los soportes relacionados cuando corresponda."
              >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <CampoSelect
                    id="aplicaDescuento"
                    label="¿Aplica descuento?"
                    value={formulario.aplicaDescuento}
                    onChange={(valor) =>
                      actualizarCampo(
                        "aplicaDescuento",
                        valor
                      )
                    }
                    options={OPCIONES_SI_NO}
                    required
                  />

                  {formulario.aplicaDescuento === "SI" && (
                    <div>
                      <label
                        htmlFor="valorDescuento"
                        className="mb-2 block text-sm font-semibold text-gray-800"
                      >
                        Valor del descuento
                        <span className="ml-2 text-xs font-normal text-gray-500">
                          (opcional)
                        </span>
                      </label>
                      <Input
                        id="valorDescuento"
                        inputMode="numeric"
                        value={formulario.valorDescuento}
                        onChange={(event) =>
                          actualizarCampo(
                            "valorDescuento",
                            event.target.value.replace(
                              /\D/g,
                              ""
                            )
                          )
                        }
                        placeholder="Valor en pesos"
                        className="min-h-12"
                      />
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <CampoTextoDictado
                      id="novedadesNomina"
                      label="Observaciones para nómina"
                      value={formulario.novedadesNomina}
                      onChange={(valor) =>
                        actualizarCampo(
                          "novedadesNomina",
                          valor
                        )
                      }
                      rows={4}
                      placeholder="Registra las novedades de nómina..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <CampoArchivo
                      id="adjuntosNovedadesNomina"
                      label="Documentos de novedades de nómina"
                      files={adjuntos.novedadesNomina}
                      onAdd={(archivos) =>
                        agregarAdjuntos(
                          "novedadesNomina",
                          archivos,
                          true
                        )
                      }
                      onRemove={(index) =>
                        eliminarAdjunto(
                          "novedadesNomina",
                          index
                        )
                      }
                      multiple
                      helper="Puedes adjuntar uno o varios soportes en cualquier formato. Máximo 10 MB por archivo."
                    />
                  </div>
                </div>
              </SeccionFormulario>

              <SeccionFormulario
                titulo="Uniformes, elementos ALP y vacunas"
                descripcion="Indica Sí o No en cada uno de los campos según corresponda."
              >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <CampoSelect
                    id="pendienteEntregaUniforme"
                    label="Pendiente entrega de uniforme"
                    value={
                      formulario.pendienteEntregaUniforme
                    }
                    onChange={(valor) =>
                      actualizarCampo(
                        "pendienteEntregaUniforme",
                        valor
                      )
                    }
                    options={OPCIONES_SI_NO}
                    required
                  />

                  <CampoSelect
                    id="uniformePatogeno"
                    label="Uniforme patógeno"
                    value={formulario.uniformePatogeno}
                    onChange={(valor) =>
                      actualizarCampo(
                        "uniformePatogeno",
                        valor
                      )
                    }
                    options={OPCIONES_SI_NO}
                    required
                  />

                  <CampoSelect
                    id="botas"
                    label="Botas"
                    value={formulario.botas}
                    onChange={(valor) =>
                      actualizarCampo("botas", valor)
                    }
                    options={OPCIONES_SI_NO}
                    required
                  />

                  <CampoSelect
                    id="zapatos"
                    label="Zapatos"
                    value={formulario.zapatos}
                    onChange={(valor) =>
                      actualizarCampo("zapatos", valor)
                    }
                    options={OPCIONES_SI_NO}
                    required
                  />

                  <CampoSelect
                    id="chaqueta"
                    label="Chaqueta"
                    value={formulario.chaqueta}
                    onChange={(valor) =>
                      actualizarCampo("chaqueta", valor)
                    }
                    options={OPCIONES_SI_NO}
                    required
                  />

                  <CampoSelect
                    id="carnetAlpArl"
                    label="Carnet ALP-ARL"
                    value={formulario.carnetAlpArl}
                    onChange={(valor) =>
                      actualizarCampo(
                        "carnetAlpArl",
                        valor
                      )
                    }
                    options={OPCIONES_SI_NO}
                    required
                  />

                  <CampoSelect
                    id="pendientePagoVacunas"
                    label="Pendiente pago de vacunas"
                    value={formulario.pendientePagoVacunas}
                    onChange={(valor) =>
                      actualizarCampo(
                        "pendientePagoVacunas",
                        valor
                      )
                    }
                    options={OPCIONES_SI_NO}
                    required
                  />

                  <div className="md:col-span-2">
                    <label
                      htmlFor="usuariosClavesDispositivos"
                      className="mb-2 block text-sm font-semibold text-gray-800"
                    >
                      Registre todos los usuarios y claves que
                      manejaba
                    </label>
                    <textarea
                      id="usuariosClavesDispositivos"
                      value={
                        formulario.usuariosClavesDispositivos
                      }
                      onChange={(event) =>
                        actualizarCampo(
                          "usuariosClavesDispositivos",
                          event.target.value
                        )
                      }
                      rows={4}
                      placeholder="Registra usuarios, claves y dispositivos usados por el colaborador..."
                      className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>
              </SeccionFormulario>

              <SeccionFormulario
                titulo="Evidencias del paz y salvo"
                descripcion="Estas evidencias quedarán anexadas al mismo PDF oficial y en el mismo retiro."
              >
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <CampoArchivo
                    id="formatoDescuentoVacunas"
                    label="Formato descuento de vacunas"
                    files={adjuntos.formatoDescuentoVacunas}
                    onAdd={(archivos) =>
                      agregarAdjuntos(
                        "formatoDescuentoVacunas",
                        archivos
                      )
                    }
                    onRemove={(index) =>
                      eliminarAdjunto(
                        "formatoDescuentoVacunas",
                        index
                      )
                    }
                    helper="Adjunta el soporte correspondiente en cualquier formato cuando aplique."
                  />

                  <CampoArchivo
                    id="fotoCarnetAcceso"
                    label="Foto / documento del carnet de acceso"
                    files={adjuntos.fotoCarnetAcceso}
                    onAdd={(archivos) =>
                      agregarAdjuntos(
                        "fotoCarnetAcceso",
                        archivos
                      )
                    }
                    onRemove={(index) =>
                      eliminarAdjunto(
                        "fotoCarnetAcceso",
                        index
                      )
                    }
                    helper="Puedes adjuntar el soporte en cualquier formato."
                  />

                  <CampoArchivo
                    id="fotoListadoHerramientas"
                    label="Foto listado de herramientas"
                    files={
                      adjuntos.fotoListadoHerramientas
                    }
                    onAdd={(archivos) =>
                      agregarAdjuntos(
                        "fotoListadoHerramientas",
                        archivos
                      )
                    }
                    onRemove={(index) =>
                      eliminarAdjunto(
                        "fotoListadoHerramientas",
                        index
                      )
                    }
                    helper="Puedes adjuntar el soporte en cualquier formato. Esta evidencia quedará asociada al paz y salvo."
                  />

                  <CampoArchivo
                    id="fotoPlanillaNomina"
                    label="Foto planilla de nómina"
                    files={adjuntos.fotoPlanillaNomina}
                    onAdd={(archivos) =>
                      agregarAdjuntos(
                        "fotoPlanillaNomina",
                        archivos
                      )
                    }
                    onRemove={(index) =>
                      eliminarAdjunto(
                        "fotoPlanillaNomina",
                        index
                      )
                    }
                    helper="Puedes adjuntar el soporte en cualquier formato. Esta evidencia quedará asociada al paz y salvo."
                  />
                </div>
              </SeccionFormulario>

              <SeccionFormulario
                titulo="Cierre del paz y salvo"
                descripcion="Registra el correo de la supervisora y cierra el documento cuando esté listo para enviar."
              >
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label
                      htmlFor="correoSupervisora"
                      className="mb-2 block text-sm font-semibold text-gray-800"
                    >
                      Correo de la supervisora
                      <span className="text-red-500"> *</span>
                    </label>

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="correoSupervisora"
                        type="email"
                        value={formulario.correoSupervisora}
                        onChange={(event) =>
                          actualizarCampo(
                            "correoSupervisora",
                            event.target.value
                          )
                        }
                        placeholder="correo@empresa.com"
                        className="min-h-12 pl-10"
                      />
                    </div>

                    <p className="mt-2 text-xs text-gray-500">
                      Por ahora es editable. Más adelante este
                      campo se reemplazará por una lista de
                      supervisoras.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
                    <p className="text-sm font-bold uppercase tracking-wide text-amber-900">
                      Estado del paz y salvo
                    </p>

                    <p className="mt-2 text-sm leading-relaxed text-amber-800">
                      Una vez cierres el paz y salvo, la
                      información será enviada a Relaciones
                      Laborales junto con el documento oficial y
                      sus evidencias.
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {["ABIERTO", "CERRADO"].map(
                        (estado) => (
                          <button
                            key={estado}
                            type="button"
                            onClick={() =>
                              actualizarCampo(
                                "estadoPazSalvo",
                                estado
                              )
                            }
                            className={cn(
                              "min-h-12 rounded-xl border px-4 font-bold transition-colors",
                              formulario.estadoPazSalvo ===
                                estado
                                ? estado === "CERRADO"
                                  ? "border-emerald-600 bg-emerald-600 text-white"
                                  : "border-amber-500 bg-amber-500 text-white"
                                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                            )}
                          >
                            {estado}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </SeccionFormulario>

              {mensajeGestion && (
                <div
                  className={cn(
                    "rounded-2xl border px-4 py-4 text-sm leading-relaxed sm:px-5",
                    tipoMensajeGestion === "success" &&
                      "border-emerald-300 bg-emerald-50 text-emerald-800",
                    tipoMensajeGestion === "warning" &&
                      "border-amber-300 bg-amber-50 text-amber-800",
                    tipoMensajeGestion === "error" &&
                      "border-red-300 bg-red-50 text-red-700",
                    tipoMensajeGestion === "info" &&
                      "border-blue-300 bg-blue-50 text-blue-700"
                  )}
                >
                  {tipoMensajeGestion === "success" && (
                    <div className="mb-2 flex items-center gap-2 font-bold">
                      <CheckCircle2 className="h-5 w-5" />
                      Formulario validado
                    </div>
                  )}
                  {mensajeGestion}
                </div>
              )}

              <div className="sticky bottom-0 z-10 -mx-4 border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={limpiarGestionRetiro}
                    className="min-h-12 rounded-xl px-6"
                  >
                    Cancelar
                  </Button>

                  <Button
                    type="button"
                    onClick={enviarPazSalvo}
                    disabled={
                      formulario.estadoPazSalvo !== "CERRADO" ||
                      enviandoPazSalvo
                    }
                    className="min-h-12 rounded-xl bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
                  >
                    {enviandoPazSalvo
                      ? "Enviando..."
                      : "Enviar a Relaciones Laborales"}
                  </Button>
                </div>
              </div>
            </div>
        </section>
      )}
    </motion.div>
  );
};

export default OperacionesRetirosView;