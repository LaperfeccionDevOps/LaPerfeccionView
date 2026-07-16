import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import DescargosProcesoDisciplinarioView from "@/pages/DescargosProcesoDisciplinarioView";

import {
  obtenerCitacionPorProceso,
} from "@/services/citacionProcesoDisciplinarioService";


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


function construirHeaders() {
  const token = obtenerTokenAutenticacion();

  const headers = {
    Accept: "application/json",
  };

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

const TIPOS_FALTA_LABEL = {
  INCUMPLIMIENTO_FUNCIONES:
    "Incumplimiento de funciones",

  AUSENCIA_INJUSTIFICADA:
    "Ausencia injustificada",

  RETARDO_INJUSTIFICADO:
    "Retardo injustificado",

  DESOBEDIENCIA:
    "Desobediencia de instrucciones",

  COMPORTAMIENTO_INADECUADO:
    "Comportamiento inadecuado",

  INCUMPLIMIENTO_REGLAMENTO:
    "Incumplimiento del reglamento",

  OTRO:
    "Otro",
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
      .toLocaleLowerCase()
      .replace(
        /^./,
        (letra) => letra.toLocaleUpperCase()
      )
  );
}


function formatearHora(hora) {
  if (!hora) {
    return "—";
  }

  const valor = String(hora).slice(0, 5);
  const [horaTexto, minutosTexto] = valor.split(":");

  const horaNumero = Number(horaTexto);
  const minutos = minutosTexto || "00";

  if (
    Number.isNaN(horaNumero) ||
    horaNumero < 0 ||
    horaNumero > 23
  ) {
    return valor;
  }

  const periodo =
    horaNumero >= 12
      ? "p. m."
      : "a. m.";

  const horaDoce =
    horaNumero % 12 || 12;

  return `${horaDoce}:${minutos} ${periodo}`;
}


function formatearModalidad(valor) {
  const codigo = String(valor || "")
    .trim()
    .toUpperCase();

  const modalidades = {
    PRESENCIAL: "Presencial",
    VIRTUAL: "Virtual",
  };

  if (!codigo) {
    return "—";
  }

  return (
    modalidades[codigo] ||
    codigo
      .replaceAll("_", " ")
      .toLocaleLowerCase()
      .replace(
        /^./,
        (letra) => letra.toLocaleUpperCase()
      )
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
    motivoCitacion,
    setMotivoCitacion,
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

  const responsableRRLL =
    obtenerUsuarioAutenticado();


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
          responseEvidencias,
        ] = await Promise.all([
          obtenerCitacionPorProceso(idProceso),

          fetch(
            `${API_URL}/documento-proceso-disciplinario/proceso/${idProceso}`,
            {
              method: "GET",
              headers: construirHeaders(),
            }
          ),
        ]);

        if (dataCitacion) {
          setCitacionExistente(dataCitacion);

          setFechaCitacion(
            dataCitacion.FechaCitacion || ""
          );

          setHoraCitacion(
            dataCitacion.HoraCitacion
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

          const datosAnteriores =
            separarMotivoAnterior(
              dataCitacion.MotivoCitacion
            );

          setMotivoCitacion(
            datosAnteriores.motivo ||
              dataCitacion.MotivoCitacion ||
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
        } else {
          setCitacionExistente(null);
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
  ]);


  const handleContinuar = () => {
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

    if (!lugarCitacion.trim()) {
      faltantes.push("lugar");
    }

    if (!motivoCitacion.trim()) {
      faltantes.push("motivo de la citación");
    }

    if (!relatoHechos.trim()) {
      faltantes.push("relato de los hechos");
    }

    if (faltantes.length > 0) {
      setMensaje(
        `Falta información registrada por Operaciones: ${faltantes.join(
          ", "
        )}.`
      );
      return;
    }

    setVista("descargos");
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
        trabajador={trabajador}
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
            por Operaciones. Estos datos se muestran únicamente
            para consulta.
          </p>
        </div>


        {/* INFORMACIÓN DEL TRABAJADOR */}

        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <h3 className="mb-4 font-bold text-emerald-800">
            Información del trabajador
          </h3>

          {trabajador ? (
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-emerald-200 bg-white p-5 md:grid-cols-4">
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
                  Estado
                </p>

                <p className="font-semibold text-gray-800">
                  {trabajador.Estado || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Proceso
                </p>

                <p className="font-semibold text-gray-800">
                  {proceso?.IdProcesoDisciplinario
                    ? `#${proceso.IdProcesoDisciplinario}`
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
              Esta información fue registrada por Operaciones y
              se muestra únicamente para consulta.
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
                    Gestor(a) que reporta
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
                    {formatearModalidad(
                      modalidad
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div className="rounded-lg border border-blue-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Motivo de la citación
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                    {formatearTipoFalta(motivoCitacion)}
                  </p>
                </div>

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
                    Observaciones gestor(a)
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                    {observacionesGestor || "—"}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>


        {/* RESPONSABLE RRLL */}

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-bold text-gray-800">
            Responsable de Relaciones Laborales
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Usuario que realizará la revisión y continuará con la diligencia.
          </p>

          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 font-semibold text-gray-800">
            {responsableRRLL}
          </div>
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
              !citacionExistente
            }
          >
            Continuar a Descargos
          </Button>
        </div>

      </div>
    </div>
  );
}