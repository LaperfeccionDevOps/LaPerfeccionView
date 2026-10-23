import React, { useEffect, useRef, useState } from "react";
import { ClipboardList, PlusCircle, Send, Inbox, FileText, CheckCircle2, AlertCircle, X, RefreshCw, Eye, ChevronLeft, ChevronRight, Paperclip, Download, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Mantiene el mismo convenio de URL del módulo: VITE_API_BASE_URL incluye /api.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const SNC_BASE_URL = `${API_BASE_URL}/salidas-no-conformes`;

const formularioInicial = () => ({
  fecha: "",
  proceso: "",
  descripcion: "",
  areaResponsable: "",
  responsableGestion: "",
  correoRemitente: "",
  correoDestinatario: "",
  estado: "ABIERTO",
});

const Campo = ({ titulo, children }) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-gray-700">
      {titulo} <span className="text-red-500">*</span>
    </label>
    {children}
  </div>
);

const Selector = ({ opciones, value, onChange, placeholder, disabled = false }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-600 focus:outline-none disabled:bg-gray-100"
  >
    <option value="">{placeholder || "Seleccione una opción"}</option>
    {opciones.map((opcion) => (
      <option key={opcion.id} value={String(opcion.id)}>
        {opcion.nombre}
      </option>
    ))}
  </select>
);

const SalidasNoConformesView = () => {
  const { user } = useAuth();
  const [pestana, setPestana] = useState("nueva");
  const [catalogos, setCatalogos] = useState({
    procesos: [], areas: [], correos: [], responsables: [],
  });
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [errorCatalogos, setErrorCatalogos] = useState("");
  const [formulario, setFormulario] = useState(formularioInicial);
  const [guardando, setGuardando] = useState(false);
  const [errorRegistro, setErrorRegistro] = useState("");
  const [exitoRegistro, setExitoRegistro] = useState("");
  const envioEnCurso = useRef(false);
  const [bandejas, setBandejas] = useState({ registradas: [], asignadas: [] });
  const [cargandoBandeja, setCargandoBandeja] = useState(false);
  const [errorBandeja, setErrorBandeja] = useState("");
  const [pagina, setPagina] = useState({ registradas: 0, asignadas: 0 });
  const [recargarBandeja, setRecargarBandeja] = useState(0);
  const [contadores, setContadores] = useState({ registradas: null, asignadas: null });
  const [detalleSNC, setDetalleSNC] = useState(null);
  const [origenDetalle, setOrigenDetalle] = useState(null);
  const [analisisCausa, setAnalisisCausa] = useState("");
  const [planAccion, setPlanAccion] = useState("");
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);
  const respuestaEnCurso = useRef(false);
  const [archivosRespuesta, setArchivosRespuesta] = useState([]);
  const [evidencias, setEvidencias] = useState([]);
  const [cargandoEvidencias, setCargandoEvidencias] = useState(false);
  const [errorEvidencias, setErrorEvidencias] = useState("");
  const [descargandoAdjunto, setDescargandoAdjunto] = useState(null);
  const [visualizandoAdjunto, setVisualizandoAdjunto] = useState(null);
  const [vistaEvidencia, setVistaEvidencia] = useState(null);
  const vistaUrlRef = useRef(null);
  const inputArchivosRef = useRef(null);
  const [errorRespuesta, setErrorRespuesta] = useState("");
  const [exitoRespuesta, setExitoRespuesta] = useState("");
  const [respuestaRegistrada, setRespuestaRegistrada] = useState(null);
  const [cerrandoSNC, setCerrandoSNC] = useState(false);
  const cierreEnCurso = useRef(false);
  const [errorCierre, setErrorCierre] = useState("");
  const [exitoCierre, setExitoCierre] = useState("");
  const [consultandoRespuesta, setConsultandoRespuesta] = useState(false);
  const [errorConsultaRespuesta, setErrorConsultaRespuesta] = useState("");
  const LIMITE_BANDEJA = 20;


  useEffect(() => {
    const controlador = new AbortController();
    const cargarCatalogos = async () => {
      setCargandoCatalogos(true);
      setErrorCatalogos("");
      const token = localStorage.getItem("token") || user?.token;
      if (!token) {
        setErrorCatalogos("No se encontró una sesión válida. Inicie sesión nuevamente.");
        setCargandoCatalogos(false);
        return;
      }
      try {
        const nombres = ["procesos", "areas", "correos", "responsables"];
        const respuestas = await Promise.all(nombres.map((nombre) =>
          fetch(`${SNC_BASE_URL}/catalogos/${nombre}`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controlador.signal,
          })
        ));
        for (const respuesta of respuestas) {
          if (!respuesta.ok) {
            throw new Error(
              respuesta.status === 401 ? "La sesión venció. Inicie sesión nuevamente." :
              respuesta.status === 403 ? "Su usuario no tiene permisos para consultar los catálogos SNC." :
              `No fue posible consultar los catálogos SNC (HTTP ${respuesta.status}).`
            );
          }
        }
        const datos = await Promise.all(respuestas.map((r) => r.json()));
        if (datos.some((dato) => !Array.isArray(dato))) {
          throw new Error("El servidor devolvió un formato inesperado de catálogos SNC.");
        }
        if (!controlador.signal.aborted) {
          setCatalogos({
            procesos: datos[0].map(({ id, nombre }) => ({ id, nombre })),
            areas: datos[1].map(({ id, nombre }) => ({ id, nombre })),
            correos: datos[2].map(({ id, correo }) => ({ id, nombre: correo })),
            // Conservamos los datos del responsable; algunos endpoints devuelven
            // el vínculo con el correo en PascalCase o camelCase.
            responsables: datos[3]
              .map((item) => ({
                ...item,
                id: item.id ?? item.IdResponsableSNC,
                nombre: item.nombre ?? item.NombreResponsable,
                id_correo_snc: item.id_correo_snc ?? item.idCorreoSNC ?? item.IdCorreoSNC ?? null,
                correo_asociado: item.correo_asociado ?? item.correo ?? item.Correo ?? null,
              }))
              .sort((a, b) => String(a.nombre || "").localeCompare(
                String(b.nombre || ""), "es", { sensitivity: "base" }
              )),
          });
        }
      } catch (error) {
        if (!controlador.signal.aborted) {
          setErrorCatalogos(error.message || "No se pudieron cargar los catálogos SNC.");
        }
      } finally {
        if (!controlador.signal.aborted) setCargandoCatalogos(false);
      }
    };
    cargarCatalogos();
    return () => controlador.abort();
  }, [user?.token]);

  // Las consultas personales se filtran por el usuario autenticado en el backend.
  // No enviamos UUID ni nombres como filtros desde React.
  useEffect(() => {
    if (pestana !== "registradas" && pestana !== "asignadas") return;
    const controlador = new AbortController();
    const cargar = async () => {
      setCargandoBandeja(true);
      setErrorBandeja("");
      const token = localStorage.getItem("token") || user?.token;
      if (!token) {
        setErrorBandeja("No se encontró una sesión válida. Inicie sesión nuevamente.");
        setCargandoBandeja(false);
        return;
      }
      const ruta = pestana === "registradas" ? "mis-registradas" : "mis-asignadas";
      const desplazamiento = pagina[pestana] * LIMITE_BANDEJA;
      try {
        const respuesta = await fetch(
          `${SNC_BASE_URL}/${ruta}?limite=${LIMITE_BANDEJA}&desplazamiento=${desplazamiento}`,
          { headers: { Authorization: `Bearer ${token}` }, signal: controlador.signal }
        );
        if (!respuesta.ok) {
          let mensaje = `No se pudo consultar la bandeja (HTTP ${respuesta.status}).`;
          if (respuesta.status === 401) mensaje = "La sesión venció. Inicie sesión nuevamente.";
          if (respuesta.status === 403) mensaje = "No tiene permisos para consultar esta bandeja.";
          throw new Error(mensaje);
        }
        const datos = await respuesta.json();
        if (!Array.isArray(datos)) throw new Error("El servidor devolvió un formato inesperado.");
        if (!controlador.signal.aborted) {
          setBandejas((anterior) => ({ ...anterior, [pestana]: datos }));
        }
      } catch (error) {
        if (!controlador.signal.aborted) {
          setErrorBandeja(error.message || "No fue posible cargar la información.");
          setBandejas((anterior) => ({ ...anterior, [pestana]: [] }));
        }
      } finally {
        if (!controlador.signal.aborted) setCargandoBandeja(false);
      }
    };
    cargar();
    return () => controlador.abort();
  }, [pestana, pagina.registradas, pagina.asignadas, recargarBandeja, user?.token]);

  // Contadores personales: se consultan todas las páginas, no solo la página visible.
  // El backend determina qué SNC pertenecen al usuario autenticado.
  useEffect(() => {
    const controlador = new AbortController();
    const consultarContadores = async () => {
      const token = localStorage.getItem("token") || user?.token;
      if (!token) {
        setContadores({ registradas: null, asignadas: null });
        return;
      }
      const consultarTipo = async (tipo) => {
        const ruta = tipo === "registradas" ? "mis-registradas" : "mis-asignadas";
        let desplazamiento = 0;
        let pendientes = 0;
        const idsVistos = new Set();
        while (!controlador.signal.aborted) {
          const respuesta = await fetch(
            `${SNC_BASE_URL}/${ruta}?limite=${LIMITE_BANDEJA}&desplazamiento=${desplazamiento}`,
            { headers: { Authorization: `Bearer ${token}` }, signal: controlador.signal }
          );
          if (!respuesta.ok) throw new Error(`Error al consultar contador ${tipo}: HTTP ${respuesta.status}`);
          const datos = await respuesta.json();
          if (!Array.isArray(datos)) throw new Error(`Formato inesperado de contador ${tipo}`);
          const cantidadAnterior = idsVistos.size;
          for (const snc of datos) {
            if (snc.id == null || idsVistos.has(String(snc.id))) continue;
            idsVistos.add(String(snc.id));
            const estado = String(snc.estado || "").trim().toUpperCase();
            if (tipo === "registradas" ? ["ABIERTO", "RESPONDIDO"].includes(estado) : estado === "ABIERTO") {
              pendientes += 1;
            }
          }
          if (datos.length === LIMITE_BANDEJA && idsVistos.size === cantidadAnterior) {
            throw new Error(`El servidor no avanzó la paginación de ${tipo}`);
          }
          if (datos.length < LIMITE_BANDEJA) break;
          desplazamiento += LIMITE_BANDEJA;
        }
        return pendientes;
      };
      const resultados = await Promise.allSettled([consultarTipo("registradas"), consultarTipo("asignadas")]);
      if (!controlador.signal.aborted) {
        setContadores({
          registradas: resultados[0].status === "fulfilled" ? resultados[0].value : null,
          asignadas: resultados[1].status === "fulfilled" ? resultados[1].value : null,
        });
      }
    };
    consultarContadores();
    return () => controlador.abort();
  }, [recargarBandeja, user?.token]);

  // El nombre del creador debe provenir del backend, nunca del usuario conectado.
  const nombreCreadorSNC = (snc) => {
    const posibles = [
      snc.creado_por_nombre, snc.nombre_creador, snc.creador_nombre,
      snc.usuario_creador_nombre, snc.nombre_usuario_creador,
      snc.creado_por, snc.creador, snc.usuario_creador,
      snc.nombre_registrador, snc.registrado_por, snc.responsable_diligenciar,
      snc.nombre_responsable_diligenciar,
    ];
    const valor = posibles.find((v) => typeof v === "string" && v.trim() && !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(v.trim()));
    return valor?.trim() || "—";
  };

  // El backend valida la identidad y la asignación real del usuario autenticado.
  // Nunca enviamos UUID de usuario desde el navegador.
  const abrirDetalle = (snc, tipo) => {
    setOrigenDetalle(tipo);
    setDetalleSNC(snc);
    setAnalisisCausa("");
    setPlanAccion("");
    setArchivosRespuesta([]);
    setEvidencias([]);
    setErrorEvidencias("");
    if (inputArchivosRef.current) inputArchivosRef.current.value = "";
    setErrorRespuesta("");
    setExitoRespuesta("");
    setRespuestaRegistrada(null);
    setErrorConsultaRespuesta("");
    setErrorCierre("");
    setExitoCierre("");
  };

  const cerrarDetalle = () => {
    if (respuestaEnCurso.current || cierreEnCurso.current) return;
    cerrarVistaEvidencia();
    setDetalleSNC(null);
    setOrigenDetalle(null);
  };

  // Consulta de evidencias: el backend verifica los permisos del usuario autenticado.
  useEffect(() => {
    if (!detalleSNC?.id || !["RESPONDIDO", "CERRADO"].includes(String(detalleSNC.estado).toUpperCase())) return;
    const controlador = new AbortController();
    const consultarEvidencias = async () => {
      setCargandoEvidencias(true);
      setErrorEvidencias("");
      const token = localStorage.getItem("token") || user?.token;
      if (!token) {
        setErrorEvidencias("No se encontró una sesión válida.");
        setCargandoEvidencias(false);
        return;
      }
      try {
        const respuesta = await fetch(`${SNC_BASE_URL}/${detalleSNC.id}/evidencias`, {
          headers: { Authorization: `Bearer ${token}` }, signal: controlador.signal,
        });
        const datos = await respuesta.json().catch(() => null);
        if (!respuesta.ok) throw new Error(typeof datos?.detail === "string" ? datos.detail : `No se pudieron consultar las evidencias (HTTP ${respuesta.status}).`);
        if (!Array.isArray(datos)) throw new Error("Formato inesperado de evidencias.");
        if (!controlador.signal.aborted) setEvidencias(datos);
      } catch (error) {
        if (!controlador.signal.aborted) setErrorEvidencias(error.message || "Error al consultar evidencias.");
      } finally {
        if (!controlador.signal.aborted) setCargandoEvidencias(false);
      }
    };
    consultarEvidencias();
    return () => controlador.abort();
  }, [detalleSNC?.id, detalleSNC?.estado, user?.token]);

  const descargarEvidencia = async (adjunto) => {
    if (descargandoAdjunto != null) return;
    const token = localStorage.getItem("token") || user?.token;
    if (!token) { setErrorEvidencias("No se encontró una sesión válida."); return; }
    setDescargandoAdjunto(adjunto.id);
    setErrorEvidencias("");
    try {
      const respuesta = await fetch(`${SNC_BASE_URL}/evidencias/${adjunto.id}/descargar`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(typeof datos?.detail === "string" ? datos.detail : `No se pudo descargar el archivo (HTTP ${respuesta.status}).`);
      }
      const archivo = await respuesta.blob();
      const url = URL.createObjectURL(archivo);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = String(adjunto.nombre || "evidencia").replace(/[\\/]/g, "_");
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      setErrorEvidencias(error.message || "No fue posible descargar la evidencia.");
    } finally {
      setDescargandoAdjunto(null);
    }
  };

  // La vista previa usa el mismo endpoint autenticado que la descarga.
  // Nunca se publica una URL directa del servidor ni se envía el token en la URL.
  const extensionEvidencia = (nombre) => String(nombre || "").split(".").pop()?.toLowerCase() || "";
  const tipoVistaEvidencia = (nombre) => {
    const extension = extensionEvidencia(nombre);
    if (extension === "pdf") return "pdf";
    if (["png", "jpg", "jpeg", "webp"].includes(extension)) return "imagen";
    if (["txt", "csv"].includes(extension)) return "texto";
    return null;
  };

  const cerrarVistaEvidencia = () => {
    setVistaEvidencia(null);
    if (vistaUrlRef.current) {
      URL.revokeObjectURL(vistaUrlRef.current);
      vistaUrlRef.current = null;
    }
  };

  useEffect(() => () => {
    if (vistaUrlRef.current) URL.revokeObjectURL(vistaUrlRef.current);
  }, []);

  const verEvidencia = async (adjunto) => {
    const tipo = tipoVistaEvidencia(adjunto.nombre);
    if (!tipo || visualizandoAdjunto != null) return;
    const token = localStorage.getItem("token") || user?.token;
    if (!token) { setErrorEvidencias("No se encontró una sesión válida."); return; }
    setVisualizandoAdjunto(adjunto.id);
    setErrorEvidencias("");
    try {
      const respuesta = await fetch(`${SNC_BASE_URL}/evidencias/${adjunto.id}/descargar`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(typeof datos?.detail === "string" ? datos.detail : `No se pudo abrir la evidencia (HTTP ${respuesta.status}).`);
      }
      const contenido = await respuesta.blob();
      // Usamos el tipo esperado, no el Content-Type de descarga (que puede ser octet-stream).
      const mime = tipo === "pdf" ? "application/pdf" : tipo === "texto" ? "text/plain;charset=utf-8" :
        ({ png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" })[extensionEvidencia(adjunto.nombre)];
      if (vistaUrlRef.current) URL.revokeObjectURL(vistaUrlRef.current);
      const url = URL.createObjectURL(new Blob([contenido], { type: mime }));
      vistaUrlRef.current = url;
      setVistaEvidencia({ nombre: adjunto.nombre, tipo, url });
    } catch (error) {
      setErrorEvidencias(error.message || "No fue posible visualizar la evidencia.");
    } finally {
      setVisualizandoAdjunto(null);
    }
  };

  // Vista previa local: no sube el archivo ni consulta al backend.
  const verArchivoAntesDeEnviar = (archivo) => {
    const tipo = tipoVistaEvidencia(archivo.name);
    if (!tipo) return;
    cerrarVistaEvidencia();
    const extension = extensionEvidencia(archivo.name);
    const mime = tipo === "pdf" ? "application/pdf" : tipo === "texto" ? "text/plain;charset=utf-8" :
      ({ png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" })[extension];
    const url = URL.createObjectURL(new Blob([archivo], { type: mime }));
    vistaUrlRef.current = url;
    setVistaEvidencia({ nombre: archivo.name, tipo, url });
  };

  const seleccionarArchivosRespuesta = (evento) => {
    const nuevos = Array.from(evento.target.files || []);
    evento.target.value = "";
    if (!nuevos.length) return;
    const permitidos = new Set(["pdf", "png", "jpg", "jpeg", "webp", "doc", "docx", "xls", "xlsx", "csv", "mp3", "wav", "m4a", "ogg", "mp4", "mov", "webm"]);
    const seleccion = [...archivosRespuesta, ...nuevos];
    if (seleccion.length > 5) { setErrorRespuesta("Puede adjuntar máximo 5 evidencias por respuesta."); return; }
    let total = 0;
    for (const archivo of seleccion) {
      const extension = archivo.name.split(".").pop()?.toLowerCase();
      if (!permitidos.has(extension)) { setErrorRespuesta(`Formato no permitido: ${archivo.name}`); return; }
      const maximo = ["mp4", "mov", "webm"].includes(extension) ? 100 * 1024 * 1024 : 20 * 1024 * 1024;
      if (archivo.size <= 0 || archivo.size > maximo) { setErrorRespuesta(`Tamaño no permitido: ${archivo.name}`); return; }
      total += archivo.size;
    }
    if (total > 150 * 1024 * 1024) { setErrorRespuesta("Las evidencias no pueden superar 150 MB en total."); return; }
    setArchivosRespuesta(seleccion);
    setErrorRespuesta("");
  };

  // Una SNC respondida se consulta en el backend, sin depender de datos de la bandeja.
  useEffect(() => {
    if (!detalleSNC?.id || !["RESPONDIDO", "CERRADO"].includes(String(detalleSNC.estado).toUpperCase())) return;
    const controlador = new AbortController();
    const consultar = async () => {
      setConsultandoRespuesta(true);
      setErrorConsultaRespuesta("");
      const token = localStorage.getItem("token") || user?.token;
      if (!token) {
        setErrorConsultaRespuesta("No se encontró una sesión válida.");
        setConsultandoRespuesta(false);
        return;
      }
      try {
        const res = await fetch(`${SNC_BASE_URL}/${detalleSNC.id}/respuesta`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controlador.signal,
        });
        const datos = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(typeof datos?.detail === "string" ? datos.detail : `No se pudo consultar la respuesta (HTTP ${res.status}).`);
        }
        if (!controlador.signal.aborted) setRespuestaRegistrada(datos?.respuesta || datos);
      } catch (error) {
        if (!controlador.signal.aborted) setErrorConsultaRespuesta(error.message || "No se pudo consultar la respuesta.");
      } finally {
        if (!controlador.signal.aborted) setConsultandoRespuesta(false);
      }
    };
    consultar();
    return () => controlador.abort();
  }, [detalleSNC?.id, detalleSNC?.estado, user?.token]);

  const responderSNC = async () => {
    if (!detalleSNC?.id || origenDetalle !== "asignadas" ||
        String(detalleSNC.estado).toUpperCase() !== "ABIERTO" ||
        detalleSNC.asignacion_pendiente || respuestaEnCurso.current) return;
    setErrorRespuesta("");
    setExitoRespuesta("");
    const analisis = analisisCausa.trim();
    const plan = planAccion.trim();
    if (!analisis || !plan) {
      setErrorRespuesta("Complete el análisis de causa y el plan de acción antes de responder.");
      return;
    }
    const token = localStorage.getItem("token") || user?.token;
    if (!token) {
      setErrorRespuesta("No se encontró una sesión válida. Inicie sesión nuevamente.");
      return;
    }
    respuestaEnCurso.current = true;
    setEnviandoRespuesta(true);
    try {
      const cuerpo = new FormData();
      cuerpo.append("analisis_causa", analisis);
      cuerpo.append("plan_accion", plan);
      archivosRespuesta.forEach((archivo) => cuerpo.append("archivos", archivo));
      const res = await fetch(`${SNC_BASE_URL}/${detalleSNC.id}/responder-con-evidencias`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: cuerpo,
      });
      const datos = await res.json().catch(() => null);
      if (!res.ok) {
        let mensaje = datos?.detail;
        if (Array.isArray(mensaje)) mensaje = mensaje.map((x) => x.msg || "Dato inválido").join("; ");
        if (typeof mensaje !== "string") mensaje = `No fue posible responder la SNC (HTTP ${res.status}).`;
        if (res.status === 403) mensaje = "Solo el responsable asignado puede responder esta SNC.";
        if (res.status === 401) mensaje = "La sesión venció. Inicie sesión nuevamente.";
        throw new Error(mensaje);
      }
      if (datos?.estado !== "RESPONDIDO" || Number(datos?.id) !== Number(detalleSNC.id)) {
        throw new Error("El servidor no confirmó la respuesta. Verifique el estado antes de reintentar.");
      }
      setRespuestaRegistrada({ analisis_causa: analisis, plan_accion: plan });
      setArchivosRespuesta([]);
      setDetalleSNC((anterior) => anterior?.id === detalleSNC.id ? { ...anterior, estado: "RESPONDIDO" } : anterior);
      setBandejas((anterior) => ({
        registradas: anterior.registradas.map((snc) => snc.id === detalleSNC.id ? { ...snc, estado: "RESPONDIDO" } : snc),
        asignadas: anterior.asignadas.map((snc) => snc.id === detalleSNC.id ? { ...snc, estado: "RESPONDIDO" } : snc),
      }));
      setExitoRespuesta(`SNC N.º ${detalleSNC.id} respondida correctamente. El estado cambió a RESPONDIDO. Evidencias registradas: ${Number(datos.evidencias ?? 0)}.`);
      setRecargarBandeja((v) => v + 1);
    } catch (error) {
      setErrorRespuesta(error instanceof TypeError
        ? "No se pudo confirmar la respuesta del servidor. Consulte el estado antes de intentar nuevamente para evitar duplicados."
        : (error.message || "No se pudo enviar la respuesta."));
    } finally {
      respuestaEnCurso.current = false;
      setEnviandoRespuesta(false);
    }
  };

  // El cierre definitivo corresponde exclusivamente al creador autenticado.
  // El servidor vuelve a verificar la identidad y el estado de la SNC.
  const cerrarSNC = async () => {
    if (!detalleSNC?.id || origenDetalle !== "registradas" ||
        String(detalleSNC.estado).toUpperCase() !== "RESPONDIDO" ||
        cierreEnCurso.current || respuestaEnCurso.current) return;

    setErrorCierre("");
    setExitoCierre("");
    const token = localStorage.getItem("token") || user?.token;
    if (!token) {
      setErrorCierre("No se encontró una sesión válida. Inicie sesión nuevamente.");
      return;
    }

    cierreEnCurso.current = true;
    setCerrandoSNC(true);
    try {
      const res = await fetch(`${SNC_BASE_URL}/${detalleSNC.id}/cerrar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const datos = await res.json().catch(() => null);
      if (!res.ok) {
        let mensaje = datos?.detail;
        if (Array.isArray(mensaje)) mensaje = mensaje.map((x) => x.msg || "Dato inválido").join("; ");
        if (typeof mensaje !== "string") mensaje = `No fue posible cerrar la SNC (HTTP ${res.status}).`;
        if (res.status === 403) mensaje = "Solo el usuario que creó la SNC puede realizar el cierre final.";
        if (res.status === 401) mensaje = "La sesión venció. Inicie sesión nuevamente.";
        throw new Error(mensaje);
      }
      if (String(datos?.estado).toUpperCase() !== "CERRADO" || Number(datos?.id) !== Number(detalleSNC.id)) {
        throw new Error("El servidor no confirmó el cierre. Consulte el estado antes de volver a intentarlo.");
      }
      setDetalleSNC((anterior) => anterior?.id === detalleSNC.id ? { ...anterior, estado: "CERRADO" } : anterior);
      setBandejas((anterior) => ({
        registradas: anterior.registradas.map((snc) => snc.id === detalleSNC.id ? { ...snc, estado: "CERRADO" } : snc),
        asignadas: anterior.asignadas.map((snc) => snc.id === detalleSNC.id ? { ...snc, estado: "CERRADO" } : snc),
      }));
      setExitoCierre(`SNC N.º ${detalleSNC.id} cerrada correctamente.`);
      setRecargarBandeja((v) => v + 1);
    } catch (error) {
      setErrorCierre(error instanceof TypeError
        ? "No se pudo confirmar el cierre. Consulte el estado antes de reintentar para evitar operaciones duplicadas."
        : (error.message || "No fue posible cerrar la SNC."));
    } finally {
      cierreEnCurso.current = false;
      setCerrandoSNC(false);
    }
  };

  const cambiarPagina = (direccion) => {
    setPagina((anterior) => ({
      ...anterior, [pestana]: Math.max(0, anterior[pestana] + direccion),
    }));
  };

  const formatoFecha = (valor) => {
    if (!valor) return "—";
    const fecha = String(valor).slice(0, 10);
    const partes = fecha.split("-");
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : fecha;
  };

  const BandejaSNC = ({ tipo }) => {
    const esRegistradas = tipo === "registradas";
    const registros = bandejas[tipo];
    return (
      <div className="rounded-xl border bg-white p-5 shadow-sm md:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {esRegistradas ? "Mis SNC registradas" : "SNC asignadas"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {esRegistradas
                ? "Consulte las salidas no conformes que usted registró, desde cualquier módulo."
                : "Consulte las salidas no conformes vinculadas a su cuenta como responsable."}
            </p>
          </div>
          <button type="button" onClick={() => setRecargarBandeja((v) => v + 1)}
            disabled={cargandoBandeja}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw size={16} className={cargandoBandeja ? "animate-spin" : ""} /> Actualizar
          </button>
        </div>
        {errorBandeja && (
          <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorBandeja}
          </p>
        )}
        {cargandoBandeja ? (
          <p role="status" className="py-10 text-center text-sm text-gray-500">Consultando SNC...</p>
        ) : !errorBandeja && registros.length === 0 ? (
          <div className="py-10 text-center">
            {esRegistradas ? <FileText className="mx-auto mb-3 text-gray-400" size={38} />
              : <Inbox className="mx-auto mb-3 text-gray-400" size={38} />}
            <p className="font-semibold text-gray-700">No hay SNC para mostrar en esta página.</p>
            <p className="mt-2 text-sm text-gray-500">
              {esRegistradas ? "Las SNC que registre aparecerán aquí."
                : "Solo aparecerán las SNC cuando el responsable esté vinculado a su usuario."}
            </p>
          </div>
        ) : !errorBandeja ? (
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-4 py-3">N.º</th>
                  <th className="px-4 py-3">Fecha SNC</th>
                  <th className="px-4 py-3">{esRegistradas ? "Proceso" : "Enviada por"}</th>
                  <th className="px-4 py-3">Responsable</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registros.map((snc) => (
                  <tr key={snc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-800">{snc.id}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatoFecha(snc.fecha_snc)}</td>
                    <td className="px-4 py-3">{esRegistradas ? (snc.proceso || "—") : nombreCreadorSNC(snc)}</td>
                    <td className="px-4 py-3">
                      {snc.responsable || "—"}
                      {snc.asignacion_pendiente && (
                        <span className="mt-1 block text-xs text-amber-700">Vinculación pendiente</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                        {String(snc.estado || "—").replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => abrirDetalle(snc, tipo)}
                        className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-3 py-1.5 font-semibold text-emerald-800 hover:bg-emerald-50">
                        <Eye size={15} /> Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <span className="text-xs text-gray-500">Página {pagina[tipo] + 1} · {registros.length} registro(s) mostrado(s)</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => cambiarPagina(-1)}
              disabled={cargandoBandeja || pagina[tipo] === 0}
              className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm disabled:opacity-40">
              <ChevronLeft size={16} /> Anterior
            </button>
            <button type="button" onClick={() => cambiarPagina(1)}
              disabled={cargandoBandeja || Boolean(errorBandeja) || registros.length < LIMITE_BANDEJA}
              className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm disabled:opacity-40">
              Siguiente <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const actualizar = (campo, valor) => {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
    setErrorRegistro("");
    setExitoRegistro("");
  };

  // El correo remitente corresponde al responsable elegido en el catálogo del sistema.
  // No se infiere por el nombre ni por el usuario que inició sesión.
  const seleccionarResponsable = (idResponsable) => {
    const responsable = catalogos.responsables.find(
      (item) => String(item.id) === String(idResponsable)
    );
    // Primero se usa el ID real de la relación en la BD. Si el endpoint
    // devuelve el correo textual, se localiza su ID en el catálogo activo.
    const correoPorId = catalogos.correos.find(
      (item) => responsable?.id_correo_snc != null &&
        String(item.id) === String(responsable.id_correo_snc)
    );
    const correoPorDireccion = !correoPorId && responsable?.correo_asociado
      ? catalogos.correos.find((item) =>
          String(item.nombre || "").trim().toLowerCase() ===
          String(responsable.correo_asociado).trim().toLowerCase()
        )
      : null;
    const idCorreo = correoPorId?.id ?? correoPorDireccion?.id ?? null;
    setFormulario((anterior) => ({
      ...anterior,
      responsableGestion: idResponsable,
      correoRemitente: idCorreo != null ? String(idCorreo) : "",
    }));
    setErrorRegistro("");
    setExitoRegistro("");
  };

  const registrarSNC = async () => {
    if (envioEnCurso.current || guardando || cargandoCatalogos || errorCatalogos) return;
    setErrorRegistro("");
    setExitoRegistro("");

    const camposRequeridos = [
      formulario.fecha, formulario.proceso, formulario.descripcion.trim(),
      formulario.areaResponsable,
      formulario.responsableGestion, formulario.correoRemitente,
      formulario.correoDestinatario,
    ];
    if (camposRequeridos.some((valor) => !valor)) {
      setErrorRegistro("Complete todos los campos obligatorios antes de registrar la SNC.");
      return;
    }

    // Evita registrar un remitente distinto al asociado al responsable.
    const responsableSeleccionado = catalogos.responsables.find(
      (item) => String(item.id) === String(formulario.responsableGestion)
    );
    const correoRemitenteSeleccionado = catalogos.correos.find(
      (item) => String(item.id) === String(formulario.correoRemitente)
    );
    const correoVinculado = correoRemitenteSeleccionado && (
      (responsableSeleccionado?.id_correo_snc != null &&
        String(responsableSeleccionado.id_correo_snc) === String(correoRemitenteSeleccionado.id)) ||
      (responsableSeleccionado?.correo_asociado &&
        String(responsableSeleccionado.correo_asociado).trim().toLowerCase() ===
        String(correoRemitenteSeleccionado.nombre).trim().toLowerCase())
    );
    if (!correoVinculado) {
      setErrorRegistro("El responsable no tiene un correo remitente activo asociado. Verifique el catálogo SNC.");
      return;
    }

    const token = localStorage.getItem("token") || user?.token;
    if (!token) {
      setErrorRegistro("No se encontró una sesión válida. Inicie sesión nuevamente.");
      return;
    }

    const cuerpo = {
      fecha_snc: formulario.fecha,
      id_proceso_snc: Number(formulario.proceso),
      descripcion: formulario.descripcion.trim(),
      // Compatibilidad temporal: el backend existente puede requerir esta propiedad.
      // No se solicita ni se inventa un impacto al usuario.
      impacto: "",
      id_area_responsable_snc: Number(formulario.areaResponsable),
      id_responsable_snc: Number(formulario.responsableGestion),
      id_correo_remitente: Number(formulario.correoRemitente),
      id_correo_destinatario: Number(formulario.correoDestinatario),
    };

    envioEnCurso.current = true;
    setGuardando(true);
    try {
      const respuesta = await fetch(SNC_BASE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cuerpo),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        let detalle = datos?.detail;
        if (Array.isArray(detalle)) {
          detalle = detalle.map((item) => item.msg || "Dato inválido").join("; ");
        }
        if (typeof detalle !== "string") detalle = "No fue posible registrar la SNC.";
        if (respuesta.status === 401) detalle = "La sesión venció. Inicie sesión nuevamente.";
        if (respuesta.status === 403) detalle = "Su usuario no tiene permisos para registrar SNC.";
        throw new Error(`${detalle} (HTTP ${respuesta.status})`);
      }
      if (respuesta.status !== 201 || !datos || datos.id == null) {
        throw new Error("El servidor respondió, pero no confirmó el identificador de la SNC. Verifique antes de intentar nuevamente.");
      }
      setExitoRegistro(
        `SNC N.º ${datos.id} registrada correctamente. Estado: ${datos.estado || "ABIERTO"}.` +
        (datos.asignacion_pendiente ? " La vinculación del responsable con su usuario está pendiente." : "")
      );
      setFormulario(formularioInicial());
      setRecargarBandeja((v) => v + 1);
    } catch (error) {
      setErrorRegistro(
        error instanceof TypeError
          ? "No se pudo confirmar la respuesta del servidor. Antes de reintentar, compruebe si la SNC fue creada para evitar duplicados."
          : (error.message || "Ocurrió un error al registrar la SNC.")
      );
    } finally {
      envioEnCurso.current = false;
      setGuardando(false);
    }
  };

  const clasesInput =
    "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-600 focus:outline-none";
  const controlesDeshabilitados = cargandoCatalogos || Boolean(errorCatalogos) || guardando;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-9 w-9 text-emerald-700" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Salidas No Conformes</h1>
              <p className="text-sm text-gray-500">Registro y gestión de SNC - La Perfección</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: "nueva", nombre: "Nueva SNC", icono: PlusCircle },
            { id: "registradas", nombre: "Mis SNC registradas", icono: FileText },
            { id: "asignadas", nombre: "SNC asignadas", icono: Inbox },
          ].map(({ id, nombre, icono: Icono }) => (
            <button
              key={id}
              type="button"
              onClick={() => setPestana(id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                pestana === id
                  ? "bg-emerald-700 text-white"
                  : "border bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icono size={17} />
              {nombre}
              {id !== "nueva" && contadores[id] !== null && (
                <span className={`ml-1 inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
                  pestana === id ? "bg-white text-emerald-800" : "bg-emerald-100 text-emerald-800"
                }`} aria-label={`${contadores[id]} SNC pendientes`}>
                  {contadores[id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {pestana === "nueva" && (
          <div className="rounded-xl border bg-white p-5 shadow-sm md:p-7">
            <h2 className="mb-6 text-lg font-bold text-gray-800">Registro de Salida No Conforme</h2>
            {cargandoCatalogos && (
              <p role="status" className="mb-4 text-sm text-gray-600">Cargando opciones del formulario SNC...</p>
            )}
            {errorCatalogos && (
              <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorCatalogos}</p>
            )}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Campo titulo="Fecha de la Salida No Conforme">
                  <input type="date" value={formulario.fecha} disabled={guardando} required
                    aria-describedby="snc-aviso-fecha"
                    onChange={(e) => actualizar("fecha", e.target.value)}
                    className={`${clasesInput} ${!formulario.fecha ? "border-amber-300" : ""}`} />
                </Campo>
                <div id="snc-aviso-fecha" className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-red-800">
                  <AlertCircle size={19} className="mt-0.5 shrink-0 text-red-600" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold">¡Atención! Verifique la fecha de la novedad</p>
                    <p className="mt-1 text-xs leading-relaxed sm:text-sm">
                      Seleccione la <strong>fecha exacta en que ocurrió la Salida No Conforme</strong>,
                      no la fecha en que está diligenciando el formulario.
                    </p>
                  </div>
                </div>
              </div>
              <Campo titulo="Responsable de diligenciar la SNC">
                <input value={user?.name || "Usuario autenticado"} readOnly
                  className={`${clasesInput} bg-gray-100`} />
              </Campo>
              <div className="md:col-span-2">
                <Campo titulo="Proceso que diligencia la SNC">
                  <Selector disabled={controlesDeshabilitados} opciones={catalogos.procesos}
                    value={formulario.proceso} onChange={(valor) => actualizar("proceso", valor)} />
                </Campo>
              </div>
              <div className="md:col-span-2">
                <Campo titulo="Descripción salida no conforme">
                  <textarea rows={4} value={formulario.descripcion} disabled={guardando}
                    onChange={(e) => actualizar("descripcion", e.target.value)}
                    placeholder="Describa la salida no conforme..." className={clasesInput} />
                </Campo>
              </div>
              <Campo titulo="Área responsable de gestionar la SNC">
                <Selector disabled={controlesDeshabilitados} opciones={catalogos.areas}
                  value={formulario.areaResponsable} onChange={(valor) => actualizar("areaResponsable", valor)} />
              </Campo>
              <Campo titulo="Responsable de gestionar la SNC">
                <Selector disabled={controlesDeshabilitados} opciones={catalogos.responsables}
                  value={formulario.responsableGestion} onChange={seleccionarResponsable} />
              </Campo>
              <Campo titulo="Correo remitente">
                <Selector disabled opciones={catalogos.correos}
                  value={formulario.correoRemitente} onChange={() => {}}
                  placeholder={formulario.responsableGestion
                    ? "Responsable sin correo vinculado en el catálogo API"
                    : "Seleccione primero un responsable"} />
              </Campo>
              <Campo titulo="Correo destinatario">
                <Selector disabled={controlesDeshabilitados} opciones={catalogos.correos}
                  value={formulario.correoDestinatario} onChange={(valor) => actualizar("correoDestinatario", valor)} />
              </Campo>
              <Campo titulo="Estado">
                <input value={formulario.estado} readOnly
                  className={`${clasesInput} bg-gray-100 font-semibold`} />
              </Campo>
            </div>
            <div className="mt-8 flex justify-end border-t pt-5">
              <button type="button" onClick={registrarSNC} disabled={controlesDeshabilitados}
                className="flex items-center gap-2 rounded-lg bg-emerald-700 px-6 py-3 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={18} />
                {guardando ? "Registrando..." : "Registrar SNC"}
              </button>
            </div>
          </div>
        )}

        {pestana === "registradas" && <BandejaSNC tipo="registradas" />}
        {pestana === "asignadas" && <BandejaSNC tipo="asignadas" />}
      </div>

      {detalleSNC && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 px-4 py-6"
          role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) cerrarDetalle(); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="snc-detalle-titulo"
            className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl md:p-8">
            <button type="button" aria-label="Cerrar detalle" onClick={cerrarDetalle}
              className="absolute right-4 top-4 rounded-full p-1.5 text-gray-500 hover:bg-gray-100">
              <X size={20} />
            </button>
            <h3 id="snc-detalle-titulo" className="pr-8 text-xl font-bold text-gray-800">
              Detalle de SNC N.º {detalleSNC.id}
            </h3>
            <p className="mt-1 text-sm text-gray-500">Consulta de la información registrada y su gestión</p>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                ["Fecha SNC", formatoFecha(detalleSNC.fecha_snc)],
                ["Estado", detalleSNC.estado],
                ["Proceso", detalleSNC.proceso],
                ["Área responsable", detalleSNC.area_responsable],
                ["Responsable de gestionar", detalleSNC.responsable],
                ["Asignación", detalleSNC.asignacion_pendiente ? "Vinculación de usuario pendiente" : "Usuario vinculado"],
                ["Correo remitente", detalleSNC.correo_remitente],
                ["Correo destinatario", detalleSNC.correo_destinatario],
              ].map(([etiqueta, valor]) => (
                <div key={etiqueta} className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-semibold text-gray-500">{etiqueta}</p>
                  <p className="mt-1 break-words text-sm font-medium text-gray-800">{valor || "—"}</p>
                </div>
              ))}
              <div className="sm:col-span-2">
                <p className="text-sm font-semibold text-gray-700">Descripción</p>
                <p className="mt-1 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-800">{detalleSNC.descripcion}</p>
              </div>
            </div>
            {["RESPONDIDO", "CERRADO"].includes(String(detalleSNC.estado).toUpperCase()) && (
              <section className="mt-6 space-y-4 border-t pt-5" aria-label="Respuesta de la salida no conforme">
                <h4 className="text-base font-bold text-emerald-800">Respuesta de la salida no conforme</h4>
                {consultandoRespuesta && !respuestaRegistrada && <p role="status" className="text-sm text-gray-500">Consultando respuesta...</p>}
                {errorConsultaRespuesta && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorConsultaRespuesta}</p>}
                {respuestaRegistrada && (
                  <>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Análisis de causa</p>
                      <p className="mt-1 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-800">{respuestaRegistrada.analisis_causa || respuestaRegistrada.AnalisisCausa || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Plan de acción</p>
                      <p className="mt-1 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-800">{respuestaRegistrada.plan_accion || respuestaRegistrada.PlanAccion || "—"}</p>
                    </div>
                  </>
                )}
              </section>
            )}
            {["RESPONDIDO", "CERRADO"].includes(String(detalleSNC.estado).toUpperCase()) && (
              <section className="mt-6 space-y-3 border-t pt-5" aria-label="Evidencias de la SNC">
                <h4 className="text-base font-bold text-emerald-800">Evidencias adjuntas</h4>
                {cargandoEvidencias && <p className="text-sm text-gray-500">Consultando evidencias...</p>}
                {errorEvidencias && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorEvidencias}</p>}
                {!cargandoEvidencias && !errorEvidencias && evidencias.length === 0 && <p className="text-sm text-gray-500">Esta SNC no tiene evidencias adjuntas.</p>}
                {evidencias.map((adjunto) => (
                  <div key={adjunto.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                    <span className="min-w-0 break-all text-sm"><Paperclip size={15} className="mr-1 inline" />{adjunto.nombre}</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {tipoVistaEvidencia(adjunto.nombre) && (
                        <button type="button" disabled={visualizandoAdjunto != null}
                          onClick={() => verEvidencia(adjunto)}
                          className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50">
                          <Eye size={15} />{visualizandoAdjunto === adjunto.id ? "Abriendo..." : "Ver"}
                        </button>
                      )}
                      <button type="button" disabled={descargandoAdjunto != null} onClick={() => descargarEvidencia(adjunto)}
                        className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50">
                        <Download size={15} />{descargandoAdjunto === adjunto.id ? "Descargando..." : "Descargar"}
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            )}
            {origenDetalle === "asignadas" && String(detalleSNC.estado).toUpperCase() === "ABIERTO" && !detalleSNC.asignacion_pendiente && (
              <section className="mt-6 space-y-4 border-t pt-5" aria-label="Responder salida no conforme">
                <h4 className="text-base font-bold text-gray-800">Responder salida no conforme</h4>
                <div>
                  <label htmlFor="snc-analisis-causa" className="mb-2 block text-sm font-semibold text-gray-700">Análisis de causa <span className="text-red-600">*</span></label>
                  <textarea id="snc-analisis-causa" rows={4} maxLength={10000} required disabled={enviandoRespuesta}
                    value={analisisCausa} onChange={(e) => { setAnalisisCausa(e.target.value); setErrorRespuesta(""); }}
                    placeholder="Explique por qué no se realizó la actividad o tarea..." className={clasesInput} />
                </div>
                <div>
                  <label htmlFor="snc-plan-accion" className="mb-2 block text-sm font-semibold text-gray-700">Plan de acción <span className="text-red-600">*</span></label>
                  <textarea id="snc-plan-accion" rows={4} maxLength={10000} required disabled={enviandoRespuesta}
                    value={planAccion} onChange={(e) => { setPlanAccion(e.target.value); setErrorRespuesta(""); }}
                    placeholder="Indique a qué se compromete y cómo dará cumplimiento..." className={clasesInput} />
                </div>
                <div>
                  <label htmlFor="snc-archivos" className="mb-2 block text-sm font-semibold text-gray-700">Evidencias (opcional, máximo 5 archivos)</label>
                  <input id="snc-archivos" ref={inputArchivosRef} type="file" multiple
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.csv,.mp3,.wav,.m4a,.ogg,.mp4,.mov,.webm"
                    disabled={enviandoRespuesta || archivosRespuesta.length >= 5}
                    onChange={seleccionarArchivosRespuesta}
                    className="block w-full rounded-lg border border-gray-300 p-2 text-sm" />
                  <p className="mt-1 text-xs text-gray-500">Documentos, imágenes, audios y videos. Hasta 20 MB por archivo, o 100 MB por video; máximo 150 MB en total.</p>
                  {archivosRespuesta.map((archivo, indice) => (
                    <div key={`${archivo.name}-${indice}`} className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-gray-50 p-2 text-sm">
                      <span className="min-w-0 break-all"><Paperclip size={14} className="mr-1 inline" />{archivo.name} ({(archivo.size / 1024 / 1024).toFixed(2)} MB)</span>
                      <div className="flex shrink-0 items-center gap-2">
                        {tipoVistaEvidencia(archivo.name) && (
                          <button type="button" onClick={() => verArchivoAntesDeEnviar(archivo)}
                            disabled={enviandoRespuesta}
                            aria-label={`Ver ${archivo.name} antes de enviar`}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50">
                            <Eye size={15} /> Ver
                          </button>
                        )}
                      <button type="button" aria-label={`Quitar ${archivo.name}`} disabled={enviandoRespuesta}
                        onClick={() => setArchivosRespuesta((anterior) => anterior.filter((_, i) => i !== indice))}
                        className="shrink-0 rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={responderSNC} disabled={enviandoRespuesta || !analisisCausa.trim() || !planAccion.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
                  <Send size={17} /> {enviandoRespuesta ? "Enviando respuesta..." : "Responder Salida No Conforme"}
                </button>
              </section>
            )}
            {origenDetalle === "registradas" && String(detalleSNC.estado).toUpperCase() === "RESPONDIDO" && (
              <section className="mt-6 space-y-3 border-t pt-5" aria-label="Cierre definitivo de la SNC">
                <p className="text-sm text-gray-600">Después de revisar el análisis de causa y el plan de acción, puede realizar el cierre definitivo de esta salida no conforme.</p>
                <button type="button" onClick={cerrarSNC} disabled={cerrandoSNC || consultandoRespuesta || !respuestaRegistrada || Boolean(errorConsultaRespuesta)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
                  <CheckCircle2 size={17} /> {cerrandoSNC ? "Cerrando SNC..." : "Cerrar salida no conforme"}
                </button>
              </section>
            )}
            {errorCierre && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorCierre}</p>}
            {exitoCierre && <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{exitoCierre}</p>}
            {errorRespuesta && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorRespuesta}</p>}
            {exitoRespuesta && <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{exitoRespuesta}</p>}
            <button type="button" onClick={cerrarDetalle} disabled={enviandoRespuesta || cerrandoSNC}
              className="mt-6 w-full rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              Cerrar
            </button>
          </div>
        </div>
      )}

      {vistaEvidencia && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 p-3 md:p-6"
          role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) cerrarVistaEvidencia(); }}>
          <div role="dialog" aria-modal="true" aria-label={`Vista previa de ${vistaEvidencia.nombre}`}
            className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <p className="min-w-0 truncate text-sm font-semibold text-gray-800" title={vistaEvidencia.nombre}>{vistaEvidencia.nombre}</p>
              <button type="button" onClick={cerrarVistaEvidencia} aria-label="Cerrar vista previa"
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"><X size={20} /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-gray-100 p-2">
              {vistaEvidencia.tipo === "imagen" ? (
                <div className="flex min-h-full items-center justify-center">
                  <img src={vistaEvidencia.url} alt={vistaEvidencia.nombre} className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <iframe src={vistaEvidencia.url} title={`Vista previa: ${vistaEvidencia.nombre}`}
                  className="h-full min-h-[50vh] w-full rounded bg-white" />
              )}
            </div>
          </div>
        </div>
      )}

      {(exitoRegistro || errorRegistro) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6"
          role="presentation">
          <div role="alertdialog" aria-modal="true" aria-labelledby="snc-aviso-titulo"
            aria-describedby="snc-aviso-descripcion"
            className="relative w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-2xl">
            <button type="button" aria-label="Cerrar mensaje"
              onClick={() => { setExitoRegistro(""); setErrorRegistro(""); }}
              className="absolute right-4 top-4 rounded-full p-1.5 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-600">
              <X size={20} />
            </button>
            <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${exitoRegistro ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
              {exitoRegistro ? <CheckCircle2 size={36} /> : <AlertCircle size={36} />}
            </div>
            <h3 id="snc-aviso-titulo" className="mb-3 text-xl font-bold text-gray-800">
              {exitoRegistro ? "¡SNC registrada exitosamente!" : "No se pudo registrar la SNC"}
            </h3>
            <p id="snc-aviso-descripcion" className="text-sm leading-relaxed text-gray-600">
              {exitoRegistro || errorRegistro}
            </p>
            <button type="button" autoFocus
              onClick={() => { setExitoRegistro(""); setErrorRegistro(""); }}
              className={`mt-6 w-full rounded-lg px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${exitoRegistro ? "bg-emerald-700 hover:bg-emerald-800 focus:ring-emerald-600" : "bg-red-600 hover:bg-red-700 focus:ring-red-500"}`}>
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalidasNoConformesView;
