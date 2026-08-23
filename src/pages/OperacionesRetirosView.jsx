import React, { useMemo, useState } from "react";
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
  identificacionColaborador: "",
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
          objeto?.nombre ||
          objeto?.Nombre ||
          objeto?.username ||
          objeto?.usuario ||
          objeto?.Usuario ||
          objeto?.email ||
          objeto?.Email ||
          objeto?.user?.NombreCompleto ||
          objeto?.user?.nombreCompleto ||
          objeto?.user?.nombre ||
          objeto?.user?.username ||
          objeto?.user?.usuario ||
          objeto?.user?.email;

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

  const obtenerSede = (trabajador) =>
    obtenerCliente(trabajador);

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

  const limpiarFormulario = () => {
    setFormularioAbierto(false);
    setFechaHoraApertura("");
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
      return;
    }

    const idRegistroPersonal =
      obtenerIdRegistroPersonal(trabajador);

    if (!idRegistroPersonal) {
      setMensaje(
        "No fue posible identificar el registro personal del trabajador."
      );
      setTipoMensaje("error");
      return;
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
      Sede: obtenerSede(trabajador),
    };

    setTrabajadorSeleccionado(trabajadorNormalizado);
    setMensaje("");
    limpiarFormulario();
  };

  const abrirFormularioPazSalvo = () => {
    if (!trabajadorSeleccionado) {
      return;
    }

    setFechaHoraApertura(new Date().toISOString());
    setFormulario({
      ...FORMULARIO_INICIAL,
      elaboradoPor: obtenerElaboradoPorInicial(),
      identificacionColaborador: String(
        trabajadorSeleccionado.NumeroDocumento || ""
      ).replace(/\D/g, ""),
    });
    setAdjuntos({
      ...ADJUNTOS_INICIALES,
    });
    setFormularioAbierto(true);
    setMensajeGestion("");
    setTipoMensajeGestion("info");

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
      [
        "identificacionColaborador",
        "Identificación del colaborador",
      ],
      ["idMotivoRetiro", "Motivo de retiro"],
      [
        "descripcionMotivoRetiro",
        "Descripción del motivo de retiro",
      ],
      ["locker", "Locker"],
      ["llaves", "Llaves"],
      [
        "entregaHerramientas",
        "Entrega de herramientas",
      ],
      [
        "tarjetaControlAcceso",
        "Tarjeta de control de acceso",
      ],
      ["entregaGuantes", "Entrega de guantes"],
      ["entregaMonogafas", "Entrega de monogafas"],
      ["entregaPeto", "Entrega de peto"],
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
        "El retiro y el paz y salvo fueron enviados correctamente a Relaciones Laborales. El motivo de retiro y el último día laborado quedaron registrados en el proceso."
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
                            seleccionarTrabajador(
                              trabajador
                            )
                          }
                          className="min-h-11 w-full rounded-xl bg-emerald-600 px-5 font-semibold text-white hover:bg-emerald-700 lg:w-auto"
                        >
                          {seleccionado
                            ? "Gestionando retiro"
                            : "Gestionar retiro"}
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

      {trabajadorSeleccionado && (
        <section className="w-full min-w-0 rounded-2xl border border-emerald-200 bg-white p-4 shadow-lg sm:p-6 lg:p-8">
          <div className="border-b border-gray-200 pb-5">
            <p className="text-sm font-semibold text-emerald-700">
              Gestión inicial del retiro
            </p>

            <h2 className="mt-1 break-words text-xl font-bold text-gray-900">
              {trabajadorSeleccionado.NombreCompleto}
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Documento:{" "}
              {trabajadorSeleccionado.NumeroDocumento}
            </p>

            <p className="mt-1 text-sm text-gray-600">
              Cargo: {trabajadorSeleccionado.Cargo}
            </p>
          </div>

          {!formularioAbierto ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                    <ClipboardCheck className="h-6 w-6" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-gray-900">
                      Paz y salvo del colaborador
                    </h3>

                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-600">
                      Diligencia la información del retiro, la
                      entrega de elementos y los soportes que
                      harán parte del documento oficial.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={abrirFormularioPazSalvo}
                  className="min-h-12 w-full rounded-xl bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-700 sm:w-auto"
                >
                  <ClipboardCheck className="mr-2 h-5 w-5" />
                  Diligenciar paz y salvo
                </Button>
              </div>
            </div>
          ) : (
            <div
              id="formulario-paz-salvo"
              className="mt-6 space-y-5"
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
                descripcion="Datos de elaboración, ubicación y colaborador."
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
                      onChange={(event) =>
                        actualizarCampo(
                          "elaboradoPor",
                          event.target.value
                        )
                      }
                      placeholder="Escribe el nombre de quien diligencia el paz y salvo"
                      className="min-h-12"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">
                      Cliente
                    </label>
                    <Input
                      value={
                        trabajadorSeleccionado.Cliente ||
                        "Cliente no disponible en la consulta actual"
                      }
                      disabled
                      className="min-h-12 bg-gray-100 text-gray-700"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">
                      Sede
                    </label>
                    <Input
                      value={
                        trabajadorSeleccionado.Sede ||
                        "Sede no disponible en la consulta actual"
                      }
                      disabled
                      className="min-h-12 bg-gray-100 text-gray-700"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="identificacionColaborador"
                      className="mb-2 block text-sm font-semibold text-gray-800"
                    >
                      Identificación del colaborador
                      <span className="text-red-500"> *</span>
                    </label>
                    <Input
                      id="identificacionColaborador"
                      inputMode="numeric"
                      value={
                        formulario.identificacionColaborador
                      }
                      disabled
                      className="min-h-12 bg-gray-100 text-gray-700"
                    />
                  </div>
                </div>
              </SeccionFormulario>

              <SeccionFormulario
                titulo="Motivo del retiro"
                descripcion="Esta información también alimentará el retiro que recibirá Relaciones Laborales."
              >
                <div className="grid grid-cols-1 gap-5">
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
                      htmlFor="descripcionMotivoRetiro"
                      className="mb-2 block text-sm font-semibold text-gray-800"
                    >
                      Descripción del motivo del retiro
                      <span className="text-red-500"> *</span>
                    </label>

                    <textarea
                      id="descripcionMotivoRetiro"
                      value={
                        formulario.descripcionMotivoRetiro
                      }
                      onChange={(event) =>
                        actualizarCampo(
                          "descripcionMotivoRetiro",
                          event.target.value
                        )
                      }
                      rows={4}
                      placeholder="Describe de manera clara el motivo del retiro..."
                      className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>
              </SeccionFormulario>

              <SeccionFormulario
                titulo="Entrega de elementos"
                descripcion="Registra el estado de los elementos entregados por el colaborador."
              >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <CampoSelect
                    id="locker"
                    label="Locker"
                    value={formulario.locker}
                    onChange={(valor) =>
                      actualizarCampo("locker", valor)
                    }
                    options={OPCIONES_ACEPTADO}
                    required
                  />

                  <CampoSelect
                    id="llaves"
                    label="Llaves"
                    value={formulario.llaves}
                    onChange={(valor) =>
                      actualizarCampo("llaves", valor)
                    }
                    options={OPCIONES_ACEPTADO}
                    required
                  />

                  <CampoSelect
                    id="entregaHerramientas"
                    label="Entrega de herramientas"
                    value={formulario.entregaHerramientas}
                    onChange={(valor) =>
                      actualizarCampo(
                        "entregaHerramientas",
                        valor
                      )
                    }
                    options={OPCIONES_ACEPTADO}
                    required
                  />

                  <CampoSelect
                    id="tarjetaControlAcceso"
                    label="Tarjeta de control de acceso"
                    value={formulario.tarjetaControlAcceso}
                    onChange={(valor) =>
                      actualizarCampo(
                        "tarjetaControlAcceso",
                        valor
                      )
                    }
                    options={OPCIONES_ACEPTADO}
                    required
                  />

                  <CampoSelect
                    id="entregaGuantes"
                    label="Entrega de guantes"
                    value={formulario.entregaGuantes}
                    onChange={(valor) =>
                      actualizarCampo(
                        "entregaGuantes",
                        valor
                      )
                    }
                    options={OPCIONES_CUMPLIMIENTO}
                    required
                  />

                  <CampoSelect
                    id="entregaMonogafas"
                    label="Entrega de monogafas"
                    value={formulario.entregaMonogafas}
                    onChange={(valor) =>
                      actualizarCampo(
                        "entregaMonogafas",
                        valor
                      )
                    }
                    options={OPCIONES_CUMPLIMIENTO}
                    required
                  />

                  <CampoSelect
                    id="entregaPeto"
                    label="Entrega de peto"
                    value={formulario.entregaPeto}
                    onChange={(valor) =>
                      actualizarCampo("entregaPeto", valor)
                    }
                    options={OPCIONES_ACEPTADO}
                    required
                  />

                  <div className="md:col-span-2">
                    <label
                      htmlFor="observacionesEntrega"
                      className="mb-2 block text-sm font-semibold text-gray-800"
                    >
                      Observaciones de la entrega
                      <span className="text-red-500"> *</span>
                    </label>
                    <textarea
                      id="observacionesEntrega"
                      value={formulario.observacionesEntrega}
                      onChange={(event) =>
                        actualizarCampo(
                          "observacionesEntrega",
                          event.target.value
                        )
                      }
                      rows={4}
                      placeholder="Registra observaciones, pendientes o aclaraciones..."
                      className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>
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
                    <label
                      htmlFor="novedadesNomina"
                      className="mb-2 block text-sm font-semibold text-gray-800"
                    >
                      Novedades de nómina
                    </label>
                    <textarea
                      id="novedadesNomina"
                      value={formulario.novedadesNomina}
                      onChange={(event) =>
                        actualizarCampo(
                          "novedadesNomina",
                          event.target.value
                        )
                      }
                      rows={4}
                      placeholder="Registra las novedades de nómina..."
                      className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
                titulo="Último día laborado"
                descripcion="Esta fecha también será enviada al campo actual del retiro en Relaciones Laborales."
              >
                <div className="max-w-xl">
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
          )}
        </section>
      )}
    </motion.div>
  );
};

export default OperacionesRetirosView;