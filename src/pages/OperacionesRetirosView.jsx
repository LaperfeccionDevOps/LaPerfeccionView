import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Loader2,
  Search,
  Trash2,
  Upload,
  User,
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


const obtenerUsuarioActualizacion = () => {
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

        const usuario =
          objeto?.username ||
          objeto?.usuario ||
          objeto?.Usuario ||
          objeto?.email ||
          objeto?.Email ||
          objeto?.nombreUsuario ||
          objeto?.NombreUsuario ||
          objeto?.user?.username ||
          objeto?.user?.usuario ||
          objeto?.user?.email;

        if (usuario) {
          return String(usuario).trim();
        }
      } catch (error) {
        // La clave no contiene un objeto JSON válido.
      }
    }
  }

  return "operaciones";
};

const OperacionesRetirosView = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [trabajadores, setTrabajadores] = useState([]);
  const [trabajadorSeleccionado, setTrabajadorSeleccionado] =
    useState(null);

  const [loadingSearch, setLoadingSearch] = useState(false);
  const [busquedaRealizada, setBusquedaRealizada] =
    useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("info");

  const [mensajeGestion, setMensajeGestion] = useState("");
  const [tipoMensajeGestion, setTipoMensajeGestion] =
    useState("info");

  const [idMotivoRetiro, setIdMotivoRetiro] =
    useState("");
  const [ultimoDiaLaborado, setUltimoDiaLaborado] =
    useState("");
  const [archivoPazSalvo, setArchivoPazSalvo] =
    useState(null);
  const [enviandoRetiro, setEnviandoRetiro] =
    useState(false);
  const [retiroEnviado, setRetiroEnviado] =
    useState(false);

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
    "Sin identificación";

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

  const normalizarTexto = (valor) =>
    String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

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

  const limpiarGestionRetiro = () => {
    setTrabajadorSeleccionado(null);
    setIdMotivoRetiro("");
    setUltimoDiaLaborado("");
    setArchivoPazSalvo(null);
    setRetiroEnviado(false);
    setMensajeGestion("");
    setTipoMensajeGestion("info");
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

    setTrabajadorSeleccionado({
      ...trabajador,
      IdRegistroPersonal: idRegistroPersonal,
      NombreCompleto:
        obtenerNombreCompleto(trabajador),
      NumeroDocumento:
        obtenerIdentificacion(trabajador),
      Cargo: obtenerCargo(trabajador),
    });

    setIdMotivoRetiro("");
    setUltimoDiaLaborado("");
    setArchivoPazSalvo(null);
    setRetiroEnviado(false);
    setMensaje("");
    setMensajeGestion("");
    setTipoMensajeGestion("info");
  };

  const handleArchivoChange = (event) => {
    const archivo = event.target.files?.[0];

    event.target.value = "";

    if (!archivo) {
      return;
    }

    const extensionesPermitidas = ["pdf"];

    const extension = archivo.name
      .split(".")
      .pop()
      ?.toLowerCase();

    if (
      !extension ||
      !extensionesPermitidas.includes(extension)
    ) {
      setMensajeGestion(
        "El paz y salvo debe cargarse en formato PDF."
      );
      setTipoMensajeGestion("warning");
      return;
    }

    const limiteBytes = 10 * 1024 * 1024;

    if (archivo.size > limiteBytes) {
      setMensajeGestion(
        "El archivo supera el tamaño máximo permitido de 10 MB."
      );
      setTipoMensajeGestion("warning");
      return;
    }

    setArchivoPazSalvo(archivo);
    setMensajeGestion("");
    setTipoMensajeGestion("info");
  };

  const verArchivoPazSalvo = () => {
    if (!archivoPazSalvo) {
      return;
    }

    const urlTemporal =
      URL.createObjectURL(archivoPazSalvo);

    window.open(
      urlTemporal,
      "_blank",
      "noopener,noreferrer"
    );

    window.setTimeout(() => {
      URL.revokeObjectURL(urlTemporal);
    }, 60000);
  };

  const descargarArchivoPazSalvo = () => {
    if (!archivoPazSalvo) {
      return;
    }

    const urlTemporal =
      URL.createObjectURL(archivoPazSalvo);

    const enlace = document.createElement("a");

    enlace.href = urlTemporal;
    enlace.download = archivoPazSalvo.name;

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    URL.revokeObjectURL(urlTemporal);
  };

  const eliminarArchivoPazSalvo = () => {
    setArchivoPazSalvo(null);
    setMensajeGestion("");
    setTipoMensajeGestion("info");
  };

  const enviarRetiroRelacionesLaborales = async () => {
    if (!trabajadorSeleccionado) {
      setMensajeGestion(
        "Debes seleccionar un trabajador."
      );
      setTipoMensajeGestion("warning");
      return;
    }

    const requisitosFaltantes = [];

    if (!idMotivoRetiro) {
      requisitosFaltantes.push("el motivo de retiro");
    }

    if (!ultimoDiaLaborado) {
      requisitosFaltantes.push("el último día laborado");
    }

    if (!archivoPazSalvo) {
      requisitosFaltantes.push("el paz y salvo");
    }

    if (requisitosFaltantes.length > 0) {
      const ultimoRequisito =
        requisitosFaltantes.pop();

      const textoRequisitos =
        requisitosFaltantes.length > 0
          ? `${requisitosFaltantes.join(", ")} y ${ultimoRequisito}`
          : ultimoRequisito;

      setMensajeGestion(
        `Debes registrar ${textoRequisitos}.`
      );
      setTipoMensajeGestion("warning");
      return;
    }

    const token = obtenerTokenAutenticacion();

    if (!token) {
      setMensajeGestion(
        "No se encontró el token de autenticación. Cierra sesión e ingresa nuevamente."
      );
      setTipoMensajeGestion("error");
      return;
    }

    const formData = new FormData();

    formData.append(
      "IdRegistroPersonal",
      String(trabajadorSeleccionado.IdRegistroPersonal)
    );
    formData.append(
      "IdMotivoRetiro",
      String(idMotivoRetiro)
    );
    formData.append(
      "FechaUltimoDiaLaborado",
      ultimoDiaLaborado
    );
    formData.append(
      "UsuarioActualizacion",
      obtenerUsuarioActualizacion()
    );
    formData.append(
      "Observacion",
      "Retiro enviado desde el módulo de Operaciones."
    );
    formData.append("archivo", archivoPazSalvo);

    try {
      setEnviandoRetiro(true);
      setMensajeGestion("");
      setTipoMensajeGestion("info");

      const response = await fetch(
        `${API_URL}/operaciones/retiros/enviar`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
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
        throw new Error(
          data?.detail ||
            data?.message ||
            `No se pudo enviar el retiro. Código HTTP: ${response.status}.`
        );
      }

      setRetiroEnviado(true);
      setMensajeGestion(
        data?.message ||
          "El retiro fue enviado correctamente a Relaciones Laborales."
      );
      setTipoMensajeGestion("success");
    } catch (error) {
      console.error(
        "Error enviando retiro a Relaciones Laborales:",
        error
      );

      setMensajeGestion(
        error?.message ||
          "No fue posible enviar el retiro a Relaciones Laborales."
      );
      setTipoMensajeGestion("error");
    } finally {
      setEnviandoRetiro(false);
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
              Busca al trabajador para registrar el
              motivo de retiro, el último día laborado y
              adjuntar su paz y salvo.
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

            {loadingSearch
              ? "Buscando..."
              : "Buscar"}
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
                Ingresa el nombre o número de
                identificación del trabajador.
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
                            {obtenerIdentificacion(
                              trabajador
                            )}
                          </p>

                          <p className="mt-1 break-words text-sm text-gray-600">
                            Cargo:{" "}
                            {obtenerCargo(trabajador)}
                          </p>

                          <span
                            className={cn(
                              "mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide",
                              trabajadorContratado
                                ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                                : "border-gray-300 bg-gray-100 text-gray-700"
                            )}
                          >
                            {obtenerEstadoTexto(
                              trabajador
                            ) ||
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

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div>
              <label
                htmlFor="motivoRetiro"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Motivo de retiro
              </label>

              <select
                id="motivoRetiro"
                value={idMotivoRetiro}
                disabled={enviandoRetiro || retiroEnviado}
                onChange={(event) => {
                  setIdMotivoRetiro(event.target.value);
                  setMensajeGestion("");
                  setTipoMensajeGestion("info");
                }}
                className="min-h-12 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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

              <p className="mt-2 text-xs text-gray-500">
                RRLL podrá revisar y modificar este motivo
                antes de continuar el proceso.
              </p>
            </div>

            <div>
              <label
                htmlFor="ultimoDiaLaborado"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Último día laborado
              </label>

              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                <Input
                  id="ultimoDiaLaborado"
                  type="date"
                  value={ultimoDiaLaborado}
                  disabled={enviandoRetiro || retiroEnviado}
                  onChange={(event) => {
                    setUltimoDiaLaborado(
                      event.target.value
                    );
                    setMensajeGestion("");
                    setTipoMensajeGestion("info");
                  }}
                  className="min-h-12 pl-10"
                />
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Registra manualmente la fecha informada
                por el líder de Operaciones.
              </p>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-gray-800">
                Paz y salvo
              </p>

              <label
                className={cn(
                  "flex min-h-12 items-center justify-center rounded-xl border border-dashed border-emerald-400 bg-emerald-50 px-4 font-semibold text-emerald-700 transition-colors",
                  enviandoRetiro || retiroEnviado
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer hover:bg-emerald-100"
                )}
              >
                <Upload className="mr-2 h-5 w-5" />

                {archivoPazSalvo
                  ? "Reemplazar documento"
                  : "Adjuntar documento"}

                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleArchivoChange}
                  disabled={enviandoRetiro || retiroEnviado}
                  className="hidden"
                />
              </label>

              <p className="mt-2 text-xs text-gray-500">
                Formato permitido: PDF. Tamaño máximo:
                10 MB.
              </p>
            </div>
          </div>

          {mensajeGestion && (
            tipoMensajeGestion === "success" ? (
              <div className="mt-6 overflow-hidden rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50 shadow-sm">
                <div className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:px-6 sm:py-6">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center self-start rounded-full bg-emerald-600 text-white shadow-md shadow-emerald-200 sm:self-auto">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-emerald-900 sm:text-xl">
                      Retiro enviado correctamente
                    </h3>

                    <p className="mt-1 break-words text-sm leading-relaxed text-emerald-800 sm:text-base">
                      {mensajeGestion}
                    </p>

                    <p className="mt-2 text-xs leading-relaxed text-emerald-700 sm:text-sm">
                      El motivo, el último día laborado y el paz y salvo ya están disponibles en Relaciones Laborales.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "mt-6 rounded-xl border px-4 py-3 text-sm sm:px-5 sm:py-4 sm:text-base",
                  tipoMensajeGestion === "error" &&
                    "border-red-200 bg-red-50 text-red-700",
                  tipoMensajeGestion === "warning" &&
                    "border-amber-200 bg-amber-50 text-amber-800",
                  tipoMensajeGestion === "info" &&
                    "border-blue-200 bg-blue-50 text-blue-700"
                )}
              >
                {mensajeGestion}
              </div>
            )
          )}

          {archivoPazSalvo && (
            <div className="mt-6 flex min-w-0 flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                  <FileText className="h-6 w-6" />
                </div>

                <div className="min-w-0">
                  <p className="break-words font-semibold text-gray-900">
                    {archivoPazSalvo.name}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {(
                      archivoPazSalvo.size /
                      1024 /
                      1024
                    ).toFixed(2)}{" "}
                    MB
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={verArchivoPazSalvo}
                  className="rounded-xl"
                  title="Ver documento"
                >
                  <Eye className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">
                    Ver
                  </span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={
                    descargarArchivoPazSalvo
                  }
                  className="rounded-xl"
                  title="Descargar documento"
                >
                  <Download className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">
                    Descargar
                  </span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={eliminarArchivoPazSalvo}
                  disabled={enviandoRetiro || retiroEnviado}
                  className="rounded-xl border-red-200 text-red-700 hover:bg-red-50"
                  title="Eliminar documento"
                >
                  <Trash2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">
                    Eliminar
                  </span>
                </Button>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={limpiarGestionRetiro}
              className="min-h-11 rounded-xl"
            >
              {retiroEnviado ? "Finalizar" : "Cancelar"}
            </Button>

            <Button
              type="button"
              onClick={enviarRetiroRelacionesLaborales}
              disabled={enviandoRetiro || retiroEnviado}
              className="min-h-11 rounded-xl bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {enviandoRetiro ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : retiroEnviado ? (
                "Enviado a Relaciones Laborales"
              ) : (
                "Enviar a Relaciones Laborales"
              )}
            </Button>
          </div>
        </section>
      )}
    </motion.div>
  );
};

export default OperacionesRetirosView;