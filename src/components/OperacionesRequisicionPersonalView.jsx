import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  ClipboardList,
  Loader2,
  RefreshCw,
  Search,
  Send,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_URL = String(
  import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000/api"
).replace(/\/+$/, "");

const FORMULARIO_INICIAL = {
  idCliente: "",
  idCargo: "",
  idPerfilRQ: "",
  cargoAprobadoPlanta: "",
  idCiudad: "",
  ciudadOtro: "",
  idTipoContrato: "",
  turno: "",
  idMotivoVacanteRQ: "",
  cantidadSolicitada: "1",
  observacionCliente: "",
};

const TURNOS = [
  { value: "DIURNO", label: "Diurno" },
  {
    value: "DIURNO - MAÑANA Y TARDE",
    label: "Diurno - Mañana y Tarde",
  },
  { value: "NOCTURNO", label: "Nocturno" },
  { value: "ROTATIVO", label: "Rotativos" },
];

const CIUDADES_RQ_PERMITIDAS = [
  { id: "10", label: "Bogotá" },
  { id: "14", label: "Cajicá" },
  { id: "29", label: "Facatativá" },
  { id: "33", label: "Funza" },
  { id: "62", label: "Mosquera" },
  { id: "103", label: "Tocancipá" },
];

const CIUDAD_OTRO = "OTRO";

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

      if (!valor) continue;

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

const normalizarLista = (data, posiblesClaves = []) => {
  if (Array.isArray(data)) return data;

  for (const clave of posiblesClaves) {
    if (Array.isArray(data?.[clave])) {
      return data[clave];
    }

    if (Array.isArray(data?.data?.[clave])) {
      return data.data[clave];
    }
  }

  return [];
};

const obtenerValor = (objeto, claves = []) => {
  for (const clave of claves) {
    const valor = objeto?.[clave];

    if (
      valor !== undefined &&
      valor !== null &&
      String(valor).trim() !== ""
    ) {
      return valor;
    }
  }

  return "";
};


const normalizarTextoBusqueda = (valor = "") =>
  String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const CampoAutocompletar = ({
  id,
  label,
  value,
  onChange,
  opciones = [],
  obtenerId,
  obtenerTexto,
  obtenerTextoBusqueda,
  placeholder = "Escribe para buscar...",
  required = false,
  disabled = false,
}) => {
  const opcionSeleccionada =
    opciones.find(
      (opcion) => String(obtenerId(opcion)) === String(value)
    ) || null;

  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [usuarioEscribiendo, setUsuarioEscribiendo] = useState(false);

  // Sincroniza el texto visible ÚNICAMENTE con el ID real guardado
  // en el formulario. Al cambiar de campo NO se borra la selección.
  useEffect(() => {
    if (usuarioEscribiendo) return;

    if (value && opcionSeleccionada) {
      setTexto(String(obtenerTexto(opcionSeleccionada) || ""));
    } else if (!value) {
      setTexto("");
    }
  }, [value, opcionSeleccionada, usuarioEscribiendo]);

  const termino = normalizarTextoBusqueda(texto);

  const coincidencias = useMemo(() => {
    // Al entrar al campo mostramos opciones. Si el usuario empieza a escribir,
    // filtramos por las similitudes del texto.
    if (!usuarioEscribiendo || !termino) {
      return opciones.slice(0, 30);
    }

    return opciones
      .filter((opcion) => {
        const textoBusqueda = obtenerTextoBusqueda
          ? obtenerTextoBusqueda(opcion)
          : obtenerTexto(opcion);

        return normalizarTextoBusqueda(textoBusqueda).includes(termino);
      })
      .slice(0, 30);
  }, [
    opciones,
    termino,
    usuarioEscribiendo,
    obtenerTexto,
    obtenerTextoBusqueda,
  ]);

  const seleccionar = (opcion) => {
    const idSeleccionado = obtenerId(opcion);
    const textoSeleccionado = obtenerTexto(opcion);

    if (
      idSeleccionado === undefined ||
      idSeleccionado === null ||
      String(idSeleccionado).trim() === ""
    ) {
      return;
    }

    // IMPORTANTE:
    // guardamos el ID real en el formulario y dejamos el nombre visible.
    onChange(String(idSeleccionado));
    setTexto(String(textoSeleccionado || ""));
    setUsuarioEscribiendo(false);
    setAbierto(false);
  };

  const manejarCambioTexto = (event) => {
    const nuevoTexto = event.target.value;

    setTexto(nuevoTexto);
    setUsuarioEscribiendo(true);
    setAbierto(true);

    // Si ya había una selección y el usuario modifica manualmente el texto,
    // recién ahí se invalida el ID anterior para obligar a escoger de la lista.
    if (value) {
      onChange("");
    }
  };

  const manejarFocus = () => {
    // Entrar al campo NO modifica ni borra el ID seleccionado.
    setAbierto(true);
  };

  const manejarBlur = () => {
    // Si el usuario escribió un valor válido pero pasó al siguiente campo
    // sin hacer clic en la opción, intentamos consolidar automáticamente
    // la selección antes de cerrar el buscador.
    if (!value && String(texto || "").trim()) {
      const textoNormalizado = normalizarTextoBusqueda(texto);

      const coincidenciaExacta = opciones.find((opcion) => {
        const textoOpcion = obtenerTexto(opcion);
        return normalizarTextoBusqueda(textoOpcion) === textoNormalizado;
      });

      const opcionesFiltradas = opciones.filter((opcion) => {
        const textoBusqueda = obtenerTextoBusqueda
          ? obtenerTextoBusqueda(opcion)
          : obtenerTexto(opcion);

        return normalizarTextoBusqueda(textoBusqueda).includes(textoNormalizado);
      });

      const opcionASeleccionar =
        coincidenciaExacta ||
        (opcionesFiltradas.length === 1 ? opcionesFiltradas[0] : null);

      if (opcionASeleccionar) {
        seleccionar(opcionASeleccionar);
        return;
      }
    }

    // Si ya existe un ID válido, restauramos siempre su nombre visible.
    if (value && opcionSeleccionada) {
      setTexto(String(obtenerTexto(opcionSeleccionada) || ""));
      setUsuarioEscribiendo(false);
    }

    window.setTimeout(() => {
      setAbierto(false);
    }, 120);
  };

  return (
    <div className="relative min-w-0">
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-gray-800"
      >
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

        <input
          id={id}
          type="text"
          autoComplete="off"
          value={texto}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={manejarFocus}
          onChange={manejarCambioTexto}
          onBlur={manejarBlur}
          className="min-h-12 w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
        />
      </div>

      {abierto && !disabled && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
          {coincidencias.length > 0 ? (
            coincidencias.map((opcion) => {
              const opcionId = obtenerId(opcion);
              const opcionTexto = obtenerTexto(opcion);

              return (
                <button
                  key={String(opcionId)}
                  type="button"
                  onMouseDown={(event) => {
                    // Guardamos la selección antes de que el input pierda foco.
                    event.preventDefault();
                    seleccionar(opcion);
                  }}
                  className="block w-full px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800"
                >
                  {opcionTexto}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-3 text-sm text-gray-500">
              No se encontraron coincidencias.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CampoSelect = ({
  id,
  label,
  value,
  onChange,
  children,
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
      {children}
    </select>

    {helper && (
      <p className="mt-2 text-xs leading-relaxed text-gray-500">
        {helper}
      </p>
    )}
  </div>
);

const OperacionesRequisicionPersonalView = () => {
  const [formulario, setFormulario] = useState({
    ...FORMULARIO_INICIAL,
  });

  // Mantiene inmediatamente los valores elegidos en los autocompletados.
  // Evita que el texto visible del cliente quede seleccionado mientras el
  // IdCliente todavía no está disponible al momento de enviar el formulario.
  const formularioRef = useRef({
    ...FORMULARIO_INICIAL,
  });

  const [catalogos, setCatalogos] = useState({
    clientes: [],
    cargos: [],
    perfiles: [],
    ciudades: [],
    tiposContrato: [],
    motivosVacante: [],
  });

  const [loadingCatalogos, setLoadingCatalogos] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("info");
  const [modalExito, setModalExito] = useState(null);

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

  const cargarCatalogos = async () => {
    try {
      setLoadingCatalogos(true);
      setMensaje("");
      setTipoMensaje("info");

      const response = await fetch(
        `${API_URL}/operaciones/retiros/rq/personal-nuevo/catalogos`,
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
          `No fue posible cargar los catálogos. Código HTTP: ${response.status}.`
        );
      }

      const data = await response.json();

      const fuente = data?.data || data || {};

      setCatalogos({
        clientes: normalizarLista(fuente, [
          "Clientes",
          "clientes",
        ]),
        cargos: normalizarLista(fuente, [
          "Cargos",
          "cargos",
        ]),
        perfiles: normalizarLista(fuente, [
          "PerfilesRQ",
          "Perfiles",
          "perfilesRQ",
          "perfiles",
        ]),
        ciudades: normalizarLista(fuente, [
          "Ciudades",
          "ciudades",
        ]),
        tiposContrato: normalizarLista(fuente, [
          "TiposContrato",
          "tiposContrato",
          "TiposContratos",
        ]),
        motivosVacante: normalizarLista(fuente, [
          "MotivosVacante",
          "motivosVacante",
          "MotivosVacanteRQ",
        ]),
      });
    } catch (error) {
      console.error("Error cargando catálogos RQ:", error);

      setCatalogos({
        clientes: [],
        cargos: [],
        perfiles: [],
        ciudades: [],
        tiposContrato: [],
        motivosVacante: [],
      });

      setMensaje(
        error?.message ||
          "No fue posible cargar la información necesaria para crear la requisición."
      );
      setTipoMensaje("error");
    } finally {
      setLoadingCatalogos(false);
    }
  };

  useEffect(() => {
    cargarCatalogos();
  }, []);

  const actualizarCampo = (campo, valor) => {
    formularioRef.current = {
      ...formularioRef.current,
      [campo]: valor,
    };

    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));

    setMensaje("");
    setTipoMensaje("info");
  };

  const perfilSeleccionado = useMemo(
    () =>
      catalogos.perfiles.find(
        (perfil) =>
          String(
            obtenerValor(perfil, ["IdPerfilRQ", "idPerfilRQ", "IDPERFILRQ", "id", "value"])
          ) === String(formulario.idPerfilRQ)
      ) || null,
    [catalogos.perfiles, formulario.idPerfilRQ]
  );

  const validarFormulario = (datos = formularioRef.current) => {
    const clienteValido = catalogos.clientes.some(
      (cliente) =>
        String(
          obtenerValor(cliente, [
            "IdCliente",
            "idCliente",
            "IDCLIENTE",
            "id",
            "value",
          ])
        ) === String(datos.idCliente || "")
    );

    if (!String(datos.idCliente || "").trim() || !clienteValido) {
      return "Debes seleccionar el cliente de la lista.";
    }

    const cargoValido = catalogos.cargos.some(
      (cargo) =>
        String(
          obtenerValor(cargo, [
            "IdCargo",
            "idCargo",
            "IDCARGO",
            "id",
            "value",
          ])
        ) === String(datos.idCargo || "")
    );

    if (!String(datos.idCargo || "").trim() || !cargoValido) {
      return "Debes seleccionar el cargo solicitado de la lista.";
    }

    const perfilValido = catalogos.perfiles.some(
      (perfil) =>
        String(
          obtenerValor(perfil, [
            "IdPerfilRQ",
            "idPerfilRQ",
            "IDPERFILRQ",
            "id",
            "value",
          ])
        ) === String(datos.idPerfilRQ || "")
    );

    if (!String(datos.idPerfilRQ || "").trim() || !perfilValido) {
      return "Debes seleccionar el perfil de la lista.";
    }

    if (!String(datos.cargoAprobadoPlanta || "").trim()) {
      return "Debes indicar si el cargo está aprobado en planta.";
    }

    if (!datos.idCiudad) {
      return "Debes seleccionar la ciudad.";
    }

    if (
      datos.idCiudad === CIUDAD_OTRO &&
      !String(datos.ciudadOtro || "").trim()
    ) {
      return "Debes especificar la ciudad.";
    }

    if (!datos.idTipoContrato) {
      return "Debes seleccionar el tipo de contrato.";
    }

    if (!datos.turno) {
      return "Debes seleccionar el horario.";
    }

    if (!datos.idMotivoVacanteRQ) {
      return "Debes seleccionar el motivo de la vacante.";
    }

    const cantidad = Number(datos.cantidadSolicitada);

    if (
      !Number.isInteger(cantidad) ||
      cantidad <= 0
    ) {
      return "La cantidad solicitada debe ser un número entero mayor que cero.";
    }

    return "";
  };

  const enviarRequisicion = async (event) => {
    event.preventDefault();

    const datosFormulario = {
      ...formularioRef.current,
    };

    if (import.meta.env.DEV) {
      console.log("[RQ PERSONAL NUEVO] datos antes de enviar:", datosFormulario);
    }

    const errorValidacion = validarFormulario(datosFormulario);

    if (errorValidacion) {
      setMensaje(errorValidacion);
      setTipoMensaje("warning");
      return;
    }

    try {
      setEnviando(true);
      setMensaje("");
      setTipoMensaje("info");

      const body = new URLSearchParams();

      body.append("IdCliente", datosFormulario.idCliente);
      body.append("IdCargo", datosFormulario.idCargo);
      body.append("IdPerfilRQ", datosFormulario.idPerfilRQ);
      body.append(
        "CargoAprobadoPlanta",
        datosFormulario.cargoAprobadoPlanta
      );
      if (datosFormulario.idCiudad === CIUDAD_OTRO) {
        body.append("CiudadOtra", datosFormulario.ciudadOtro.trim());
      } else {
        body.append("IdCiudad", datosFormulario.idCiudad);
      }

      body.append(
        "IdTipoContrato",
        datosFormulario.idTipoContrato
      );
      body.append("Turno", datosFormulario.turno);
      body.append(
        "IdMotivoVacanteRQ",
        datosFormulario.idMotivoVacanteRQ
      );
      body.append(
        "CantidadSolicitada",
        datosFormulario.cantidadSolicitada
      );

      if (datosFormulario.observacionCliente.trim()) {
        body.append(
          "ObservacionCliente",
          datosFormulario.observacionCliente.trim()
        );
      }

      const response = await fetch(
        `${API_URL}/operaciones/retiros/rq/personal-nuevo`,
        {
          method: "POST",
          headers: {
            ...construirHeaders(),
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        }
      );

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        throw new Error(
          "La sesión no está autorizada o venció. Cierra sesión e ingresa nuevamente."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            `No fue posible enviar la requisición. Código HTTP: ${response.status}.`
        );
      }

      const idRQ =
        data?.data?.IdRQOperaciones ||
        data?.IdRQOperaciones ||
        "";

      // El éxito se muestra en un modal grande y centrado.
      // Las advertencias y errores continúan usando la franja informativa superior.
      setMensaje("");
      setTipoMensaje("info");
      setModalExito({
        idRQ: idRQ || "",
        mensaje:
          data?.message ||
          "La requisición de personal fue enviada correctamente a Selección.",
      });

      formularioRef.current = {
        ...FORMULARIO_INICIAL,
      };

      setFormulario({
        ...FORMULARIO_INICIAL,
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(
        "Error enviando requisición de personal:",
        error
      );

      setMensaje(
        error?.message ||
          "No fue posible enviar la requisición de personal."
      );
      setTipoMensaje("error");
    } finally {
      setEnviando(false);
    }
  };

  const limpiarFormulario = () => {
    formularioRef.current = {
      ...FORMULARIO_INICIAL,
    };

    setFormulario({
      ...FORMULARIO_INICIAL,
    });
    setMensaje("");
    setTipoMensaje("info");
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white px-5 py-6 sm:px-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100">
                  <Users className="h-6 w-6 text-emerald-700" />
                </div>

                <div className="min-w-0">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Requisición de personal
                  </h1>

                  <p className="mt-1 max-w-3xl text-sm leading-relaxed text-gray-600">
                    Registra una solicitud de personal nuevo para
                    que sea gestionada por el área de Selección.
                  </p>
                </div>
              </div>

              <div className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                <ClipboardList className="mr-1.5 h-4 w-4" />
                PERSONAL NUEVO
              </div>
            </div>
          </div>

          {mensaje && tipoMensaje !== "success" && (
            <div className="px-5 pt-5 sm:px-7">
              <div
                className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                  tipoMensaje === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : tipoMensaje === "error"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : tipoMensaje === "warning"
                        ? "border-amber-200 bg-amber-50 text-amber-800"
                        : "border-blue-200 bg-blue-50 text-blue-700"
                }`}
              >
                <div className="flex items-start gap-2">
                  {tipoMensaje === "success" && (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  )}

                  <span>{mensaje}</span>
                </div>
              </div>
            </div>
          )}

          <form
            onSubmit={enviarRequisicion}
            className="space-y-6 p-5 sm:p-7"
          >
            <section className="rounded-2xl border border-gray-200 bg-white">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-4 sm:px-5">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-emerald-700" />
                  <h2 className="text-base font-bold text-gray-900 sm:text-lg">
                    Información de la solicitud
                  </h2>
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  Los campos marcados con * son obligatorios.
                </p>
              </div>

              <div className="p-4 sm:p-5">
                {loadingCatalogos ? (
                  <div className="flex min-h-48 flex-col items-center justify-center text-gray-500">
                    <Loader2 className="mb-3 h-7 w-7 animate-spin text-emerald-600" />
                    <p className="text-sm font-medium">
                      Cargando información...
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <CampoAutocompletar
                      id="rq-cliente"
                      label="Cliente"
                      value={formulario.idCliente}
                      onChange={(valor) => {
                        actualizarCampo("idCliente", String(valor || ""));
                      }}
                      opciones={catalogos.clientes}
                      obtenerId={(cliente) =>
                        obtenerValor(cliente, ["IdCliente", "idCliente", "IDCLIENTE", "id", "value"])
                      }
                      obtenerTexto={(cliente) =>
                        obtenerValor(cliente, [
                          "NombreCliente",
                          "Nombre",
                          "nombreCliente",
                          "nombre",
                        ])
                      }
                      placeholder="Escribe el nombre del cliente..."
                      required
                    />

                    <CampoAutocompletar
                      id="rq-cargo"
                      label="Cargo solicitado"
                      value={formulario.idCargo}
                      onChange={(valor) => {
                        actualizarCampo("idCargo", String(valor || ""));
                      }}
                      opciones={catalogos.cargos}
                      obtenerId={(cargo) =>
                        obtenerValor(cargo, ["IdCargo", "idCargo", "IDCARGO", "id", "value"])
                      }
                      obtenerTexto={(cargo) =>
                        obtenerValor(cargo, [
                          "NombreCargo",
                          "Nombre",
                          "nombreCargo",
                          "nombre",
                        ])
                      }
                      placeholder="Escribe el nombre del cargo..."
                      required
                    />

                    <CampoAutocompletar
                      id="rq-perfil"
                      label="Perfil"
                      value={formulario.idPerfilRQ}
                      onChange={(valor) => {
                        actualizarCampo("idPerfilRQ", String(valor || ""));
                      }}
                      opciones={catalogos.perfiles}
                      obtenerId={(perfil) =>
                        obtenerValor(perfil, ["IdPerfilRQ", "idPerfilRQ", "IDPERFILRQ", "id", "value"])
                      }
                      obtenerTexto={(perfil) => {
                        const codigo = obtenerValor(perfil, [
                          "CodigoPerfil",
                          "codigoPerfil",
                          "Codigo",
                        ]);
                        const descripcion = obtenerValor(perfil, [
                          "DescripcionPerfil",
                          "descripcionPerfil",
                        ]);
                        const genero = obtenerValor(perfil, [
                          "Genero",
                          "genero",
                        ]);
                        const escolaridad = obtenerValor(perfil, [
                          "NivelEscolaridad",
                          "nivelEscolaridad",
                        ]);
                        const observaciones = obtenerValor(perfil, [
                          "Observaciones",
                          "observaciones",
                        ]);

                        const partes = [
                          descripcion
                            ? `${codigo} - ${descripcion}`
                            : String(codigo),
                          genero ? `Género: ${genero}` : "",
                          escolaridad
                            ? `Escolaridad: ${escolaridad}`
                            : "",
                          observaciones
                            ? `Observaciones: ${observaciones}`
                            : "",
                        ].filter(Boolean);

                        return partes.join(" | ");
                      }}
                      obtenerTextoBusqueda={(perfil) =>
                        [
                          obtenerValor(perfil, [
                            "CodigoPerfil",
                            "codigoPerfil",
                            "Codigo",
                          ]),
                          obtenerValor(perfil, [
                            "DescripcionPerfil",
                            "descripcionPerfil",
                          ]),
                          obtenerValor(perfil, ["Genero", "genero"]),
                          obtenerValor(perfil, [
                            "NivelEscolaridad",
                            "nivelEscolaridad",
                          ]),
                          obtenerValor(perfil, [
                            "Observaciones",
                            "observaciones",
                          ]),
                        ]
                          .filter(Boolean)
                          .join(" ")
                      }
                      placeholder="Escribe código o descripción del perfil..."
                      required
                    />

                    <CampoSelect
                      id="rq-aprobado-planta"
                      label="¿Cargo aprobado en planta?"
                      value={formulario.cargoAprobadoPlanta}
                      onChange={(valor) =>
                        actualizarCampo(
                          "cargoAprobadoPlanta",
                          valor
                        )
                      }
                      required
                    >
                      <option value="">
                        Selecciona una opción
                      </option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </CampoSelect>

                    <div className="min-w-0">
                      <CampoSelect
                        id="rq-ciudad"
                        label="Ciudad"
                        value={formulario.idCiudad}
                        onChange={(valor) => {
                          actualizarCampo("idCiudad", valor);
                          if (valor !== CIUDAD_OTRO) {
                            actualizarCampo("ciudadOtro", "");
                          }
                        }}
                        required
                      >
                        <option value="">
                          Selecciona una ciudad
                        </option>

                        {CIUDADES_RQ_PERMITIDAS.map((ciudadPermitida) => {
                          const existeEnCatalogo = catalogos.ciudades.some(
                            (ciudad) =>
                              String(
                                obtenerValor(ciudad, [
                                  "IdCiudad",
                                  "idCiudad",
                                ])
                              ) === ciudadPermitida.id
                          );

                          if (!existeEnCatalogo) return null;

                          return (
                            <option
                              key={ciudadPermitida.id}
                              value={ciudadPermitida.id}
                            >
                              {ciudadPermitida.label}
                            </option>
                          );
                        })}

                        <option value={CIUDAD_OTRO}>Otro</option>
                      </CampoSelect>

                      {formulario.idCiudad === CIUDAD_OTRO && (
                        <div className="mt-3">
                          <label
                            htmlFor="rq-ciudad-otro"
                            className="mb-2 block text-sm font-semibold text-gray-800"
                          >
                            Especifique la ciudad
                            <span className="text-red-500"> *</span>
                          </label>

                          <Input
                            id="rq-ciudad-otro"
                            type="text"
                            value={formulario.ciudadOtro}
                            onChange={(event) =>
                              actualizarCampo(
                                "ciudadOtro",
                                event.target.value
                              )
                            }
                            placeholder="Escribe la ciudad..."
                            className="min-h-12 rounded-xl"
                          />

                        </div>
                      )}
                    </div>

                    <CampoSelect
                      id="rq-tipo-contrato"
                      label="Tipo de contrato"
                      value={formulario.idTipoContrato}
                      onChange={(valor) =>
                        actualizarCampo(
                          "idTipoContrato",
                          valor
                        )
                      }
                      required
                    >
                      <option value="">
                        Selecciona un tipo de contrato
                      </option>

                      {catalogos.tiposContrato.map((tipo) => {
                        const id = obtenerValor(tipo, [
                          "IdTipoContrato",
                          "idTipoContrato",
                        ]);

                        const nombre = obtenerValor(tipo, [
                          "TipoContrato",
                          "Descripcion",
                          "descripcion",
                        ]);

                        return (
                          <option key={id} value={id}>
                            {nombre}
                          </option>
                        );
                      })}
                    </CampoSelect>

                    <CampoSelect
                      id="rq-turno"
                      label="Horario"
                      value={formulario.turno}
                      onChange={(valor) =>
                        actualizarCampo("turno", valor)
                      }
                      required
                    >
                      <option value="">
                        Selecciona un horario
                      </option>

                      {TURNOS.map((turno) => (
                        <option
                          key={turno.value}
                          value={turno.value}
                        >
                          {turno.label}
                        </option>
                      ))}
                    </CampoSelect>

                    <CampoSelect
                      id="rq-motivo"
                      label="Motivo de la vacante"
                      value={formulario.idMotivoVacanteRQ}
                      onChange={(valor) =>
                        actualizarCampo(
                          "idMotivoVacanteRQ",
                          valor
                        )
                      }
                      required
                    >
                      <option value="">
                        Selecciona el motivo
                      </option>

                      {catalogos.motivosVacante.map(
                        (motivo) => {
                          const id = obtenerValor(motivo, [
                            "IdMotivoVacanteRQ",
                            "idMotivoVacanteRQ",
                          ]);

                          const nombre = obtenerValor(motivo, [
                            "NombreMotivoVacante",
                            "Nombre",
                            "nombre",
                          ]);

                          return (
                            <option key={id} value={id}>
                              {nombre}
                            </option>
                          );
                        }
                      )}
                    </CampoSelect>

                    <div className="min-w-0">
                      <label
                        htmlFor="rq-cantidad"
                        className="mb-2 block text-sm font-semibold text-gray-800"
                      >
                        Cantidad solicitada
                        <span className="text-red-500"> *</span>
                      </label>

                      <Input
                        id="rq-cantidad"
                        type="number"
                        min="1"
                        step="1"
                        value={formulario.cantidadSolicitada}
                        onChange={(event) =>
                          actualizarCampo(
                            "cantidadSolicitada",
                            event.target.value
                          )
                        }
                        className="min-h-12 rounded-xl"
                      />

                      <p className="mt-2 text-xs leading-relaxed text-gray-500">
                        Indica cuántas personas necesita cubrir
                        esta requisición.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {perfilSeleccionado && (
              <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
                    <ClipboardList className="h-5 w-5 text-emerald-700" />
                  </div>

                  <div className="min-w-0">
                    <p className="font-bold text-emerald-900">
                      Detalle del perfil seleccionado
                    </p>

                    <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <span className="font-semibold text-gray-700">
                          Perfil:
                        </span>{" "}
                        {obtenerValor(perfilSeleccionado, [
                          "CodigoPerfil",
                          "codigoPerfil",
                        ])}
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">
                          Género:
                        </span>{" "}
                        {obtenerValor(perfilSeleccionado, [
                          "Genero",
                          "genero",
                        ]) || "No especificado"}
                      </div>

                      <div>
                        <span className="font-semibold text-gray-700">
                          Escolaridad:
                        </span>{" "}
                        {obtenerValor(perfilSeleccionado, [
                          "NivelEscolaridad",
                          "nivelEscolaridad",
                        ]) || "No especificada"}
                      </div>

                      <div className="sm:col-span-2">
                        <span className="font-semibold text-gray-700">
                          Descripción:
                        </span>{" "}
                        {obtenerValor(perfilSeleccionado, [
                          "DescripcionPerfil",
                          "descripcionPerfil",
                        ]) || "Sin descripción"}
                      </div>

                      {obtenerValor(perfilSeleccionado, [
                        "Observaciones",
                        "observaciones",
                      ]) && (
                        <div className="sm:col-span-2">
                          <span className="font-semibold text-gray-700">
                            Observaciones:
                          </span>{" "}
                          {obtenerValor(perfilSeleccionado, [
                            "Observaciones",
                            "observaciones",
                          ])}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
              <label
                htmlFor="rq-observaciones"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Observaciones / justificación
              </label>

              <textarea
                id="rq-observaciones"
                value={formulario.observacionCliente}
                onChange={(event) =>
                  actualizarCampo(
                    "observacionCliente",
                    event.target.value
                  )
                }
                rows={5}
                placeholder="Registra información adicional que deba conocer el área de Selección..."
                className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </section>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={limpiarFormulario}
                disabled={enviando}
                className="min-h-11"
              >
                Limpiar formulario
              </Button>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={cargarCatalogos}
                  disabled={loadingCatalogos || enviando}
                  className="min-h-11"
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${
                      loadingCatalogos
                        ? "animate-spin"
                        : ""
                    }`}
                  />
                  Actualizar catálogos
                </Button>

                <Button
                  type="submit"
                  disabled={loadingCatalogos || enviando}
                  className="min-h-11 bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-700"
                >
                  {enviando ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar a Selección
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {modalExito && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rq-exito-titulo"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-2xl">
            <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50 px-6 py-8 text-center sm:px-10 sm:py-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 ring-8 ring-emerald-50">
                <CheckCircle2 className="h-11 w-11 text-emerald-600" />
              </div>

              <h2
                id="rq-exito-titulo"
                className="mt-6 text-2xl font-extrabold text-gray-900 sm:text-3xl"
              >
                ¡Requisición enviada!
              </h2>

              {modalExito.idRQ && (
                <div className="mx-auto mt-4 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-4 py-2 text-base font-extrabold text-emerald-800">
                  RQ #{modalExito.idRQ}
                </div>
              )}

              <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-gray-600 sm:text-lg">
                La requisición de personal fue enviada correctamente al área de
                <span className="font-bold text-gray-800"> Selección</span>.
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Ya puede ser consultada y gestionada desde el módulo correspondiente.
              </p>
            </div>

            <div className="border-t border-gray-100 bg-white px-5 py-5 sm:px-8">
              <Button
                type="button"
                onClick={() => setModalExito(null)}
                className="min-h-12 w-full rounded-xl bg-emerald-600 text-base font-bold text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700"
              >
                Entendido
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperacionesRequisicionPersonalView;