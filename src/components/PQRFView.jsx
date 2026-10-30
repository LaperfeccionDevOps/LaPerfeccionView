import React, { useCallback, useEffect, useRef, useState } from "react";
import { ClipboardList, PlusCircle, Inbox, FileText, Eye, X, Send, RefreshCw, CheckCircle2, ChevronLeft, ChevronRight, AlertCircle, Info, Paperclip, Undo2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// En este proyecto VITE_API_BASE_URL ya incluye /api.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const BASE = `${API_BASE_URL}/pqrf`;
const LIMITE = 20;
const CORREO_SISTEMA_PQRF = "no.reply.sig.alp@gmail.com";
const initial = () => ({ fecha: "", tipo: "", nombre: "", cliente: "", correoCorporativo: "", descripcion: "", proceso: "", destinatario: "", responsable: "" });
const inputClass = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-600 focus:outline-none disabled:bg-gray-100";
const fechaLocal = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const formatoFecha = (v) => v ? String(v).slice(0, 10).split("-").reverse().join("/") : "—";
const formatoMomento = (v) => v ? new Date(v).toLocaleString("es-CO") : "—";
const detalleError = (d, status) => Array.isArray(d?.detail) ? d.detail.map(x => x.msg).join("; ") : typeof d?.detail === "string" ? d.detail : `Error HTTP ${status}`;

const Campo = ({ label, children }) => <label className="block space-y-2"><span className="block text-sm font-semibold text-gray-700">{label}</span>{children}</label>;
const Selector = ({ nombre, campo, opciones, etiqueta = "nombre", value, onChange, disabled }) => <select className={inputClass} value={value} onChange={e => onChange(campo, e.target.value)} disabled={disabled} required><option value="">Seleccione {nombre}</option>{opciones.map(o => <option key={o.id} value={o.id}>{o[etiqueta]}</option>)}</select>;

export default function PQRFView() {
  const { user } = useAuth();
  const [tab, setTab] = useState("registradas");
  const [puedeCrear, setPuedeCrear] = useState(false);
  const [tieneRegistradas, setTieneRegistradas] = useState(true);
  const [cargandoPermisos, setCargandoPermisos] = useState(true);
  const [form, setForm] = useState(initial);
  const [adjuntosNuevos, setAdjuntosNuevos] = useState([]);
  const [adjuntosDetalle, setAdjuntosDetalle] = useState([]);
  const [cargandoAdjuntos, setCargandoAdjuntos] = useState(false);
  const [errorAdjuntos, setErrorAdjuntos] = useState("");
  const [subiendoAdjuntos, setSubiendoAdjuntos] = useState(false);
  const [catalogos, setCatalogos] = useState({ tipos: [], procesos: [], correos: [], responsables: [] });
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [errorCatalogos, setErrorCatalogos] = useState("");
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [clientes, setClientes] = useState([]);
  const [cargandoClientes, setCargandoClientes] = useState(false);
  const [clienteElegido, setClienteElegido] = useState("");
  const [listaClientesAbierta, setListaClientesAbierta] = useState(false);
  const clienteContenedorRef = useRef(null);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const envioRef = useRef(false);
  const respuestaRef = useRef(false);
  const cierreRef = useRef(false);
  const reasignacionRef = useRef(false);
  const rechazoRef = useRef(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [usuarioDestino, setUsuarioDestino] = useState("");
  const [motivoReasignacion, setMotivoReasignacion] = useState("");
  const [cargandoResponsables, setCargandoResponsables] = useState(false);
  const [errorResponsables, setErrorResponsables] = useState("");
  const [bandejas, setBandejas] = useState({ registradas: [], asignadas: [], delegadas: [] });
  const [pagina, setPagina] = useState({ registradas: 0, asignadas: 0, delegadas: 0 });
  const [recarga, setRecarga] = useState(0);
  const [pendientesPQRF, setPendientesPQRF] = useState(0);
  const [cargandoBandeja, setCargandoBandeja] = useState(false);
  const [errorBandeja, setErrorBandeja] = useState("");
  const [detalle, setDetalle] = useState(null);
  const [origen, setOrigen] = useState("");
  const [gestiones, setGestiones] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState("");
  const [analisis, setAnalisis] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [costoReclamo, setCostoReclamo] = useState("");
  const [evidencia, setEvidencia] = useState(null);
  const evidenciaRespuestaInputRef = useRef(null);
  const [procesando, setProcesando] = useState(false);
  const [mensajeDetalle, setMensajeDetalle] = useState("");
  const [errorAccion, setErrorAccion] = useState("");
  const [vistaPreviaRespuesta, setVistaPreviaRespuesta] = useState(false);
  const [vistaEvidencia, setVistaEvidencia] = useState(null);
  const [cargandoVistaEvidencia, setCargandoVistaEvidencia] = useState(false);
  const vistaEvidenciaUrlRef = useRef(null);

  const tipoActual = String(detalle?.tipo_pqrf || "").trim().toUpperCase();
  const esReclamo = tipoActual === "RECLAMO";
  const esFelicitacion = tipoActual === "FELICITACIÓN" || tipoActual === "FELICITACION";
  const evidenciaObligatoria = esReclamo || esFelicitacion;
  const respuestaValida = esFelicitacion ? !!evidencia : !!analisis.trim() && !!respuesta.trim() && (!esReclamo || (costoReclamo !== "" && Number(costoReclamo) >= 0 && !!evidencia));
  const tokenActual = useCallback(() => localStorage.getItem("token") || user?.token, [user?.token]);
  const solicitar = useCallback(async (ruta, options = {}) => {
    const token = tokenActual();
    if (!token) throw new Error("No hay sesión válida. Inicie sesión nuevamente.");
    const r = await fetch(`${BASE}${ruta}`, { ...options, headers: { Authorization: `Bearer ${token}`, ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers } });
    const d = await r.json().catch(() => null);
    if (!r.ok) throw new Error(detalleError(d, r.status));
    return { data: d, status: r.status };
  }, [tokenActual]);

  useEffect(() => {
    const ctrl = new AbortController();
    setCargandoPermisos(true);
    (async () => {
      try {
        const { data } = await solicitar("/permisos", { signal: ctrl.signal });
        if (ctrl.signal.aborted) return;
        const autorizado = data?.puede_crear === true;
        setPuedeCrear(autorizado);
        if (autorizado) {
          setTieneRegistradas(true);
          return;
        }
        // Conserva acceso a PQRF históricas para consultar y cerrar las respondidas.
        try {
          const historicas = await solicitar("/mis-registradas?limite=1&desplazamiento=0", { signal: ctrl.signal });
          if (ctrl.signal.aborted) return;
          const tiene = Array.isArray(historicas.data) ? historicas.data.length > 0 : true;
          setTieneRegistradas(tiene);
          setTab(actual => (actual === "nueva" || (!tiene && actual === "registradas")) ? "asignadas" : actual);
        } catch (error) {
          // Ante errores de consulta, conservar la bandeja para no bloquear cierres.
          if (!ctrl.signal.aborted) setTieneRegistradas(true);
        }
      } catch (error) {
        if (!ctrl.signal.aborted) {
          setPuedeCrear(false);
          setTieneRegistradas(true);
          setTab(actual => actual === "nueva" ? "registradas" : actual);
        }
      } finally {
        if (!ctrl.signal.aborted) setCargandoPermisos(false);
      }
    })();
    return () => ctrl.abort();
  }, [solicitar]);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setCargandoCatalogos(true); setErrorCatalogos("");
      try {
        const nombres = ["tipos", "procesos", "correos"];
        const resultados = await Promise.all(nombres.map(n => solicitar(`/catalogos/${n}`, { signal: ctrl.signal })));
        if (resultados.some(x => !Array.isArray(x.data))) throw new Error("Formato inesperado de catálogos.");
        if (!ctrl.signal.aborted) setCatalogos(v => ({ ...v, ...Object.fromEntries(nombres.map((n,i) => [n, resultados[i].data])) }));
      } catch (e) { if (!ctrl.signal.aborted) setErrorCatalogos(e.message); }
      finally { if (!ctrl.signal.aborted) setCargandoCatalogos(false); }
    })();
    return () => ctrl.abort();
  }, [solicitar]);

  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setCargandoClientes(true);
      try {
        const { data } = await solicitar(`/catalogos/clientes?buscar=${encodeURIComponent(busquedaCliente.trim())}`, { signal: ctrl.signal });
        if (!Array.isArray(data)) throw new Error("Formato inesperado de clientes.");
        if (!ctrl.signal.aborted) setClientes(data);
      } catch (e) { if (!ctrl.signal.aborted) setClientes([]); }
      finally { if (!ctrl.signal.aborted) setCargandoClientes(false); }
    }, 300);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [busquedaCliente, solicitar]);

  useEffect(() => {
    const cerrarAlSalir = (evento) => {
      if (!clienteContenedorRef.current?.contains(evento.target)) setListaClientesAbierta(false);
    };
    document.addEventListener("pointerdown", cerrarAlSalir);
    return () => document.removeEventListener("pointerdown", cerrarAlSalir);
  }, []);

  useEffect(() => {
    if (!["registradas", "asignadas", "delegadas"].includes(tab)) return;
    const ctrl = new AbortController();
    (async () => {
      setCargandoBandeja(true); setErrorBandeja("");
      try {
        const { data } = await solicitar(`/mis-${tab}?limite=${LIMITE}&desplazamiento=${pagina[tab] * LIMITE}`, { signal: ctrl.signal });
        if (!Array.isArray(data)) throw new Error("Formato inesperado de la bandeja.");
        if (!ctrl.signal.aborted) setBandejas(v => ({ ...v, [tab]: data }));
      } catch (e) { if (!ctrl.signal.aborted) { setErrorBandeja(e.message); setBandejas(v => ({ ...v, [tab]: [] })); } }
      finally { if (!ctrl.signal.aborted) setCargandoBandeja(false); }
    })();
    return () => ctrl.abort();
  }, [tab, pagina, recarga, solicitar]);

  // El mismo endpoint alimenta la pestaña y el menú lateral.
  useEffect(() => {
    const ctrl = new AbortController();
    const actualizarContador = async () => {
      try {
        const { data } = await solicitar("/pendientes/contador", { signal: ctrl.signal });
        if (!ctrl.signal.aborted) setPendientesPQRF(Math.max(0, Number(data?.pendientes) || 0));
      } catch (error) {
        // Conserva el último dato conocido ante un fallo temporal de red.
      }
    };
    actualizarContador();
    const alVolver = () => { if (document.visibilityState === "visible") actualizarContador(); };
    window.addEventListener("focus", alVolver);
    window.addEventListener("snc-pqrf-actualizadas", actualizarContador);
    const intervalo = window.setInterval(alVolver, 45000);
    return () => {
      ctrl.abort();
      window.removeEventListener("focus", alVolver);
      window.removeEventListener("snc-pqrf-actualizadas", actualizarContador);
      window.clearInterval(intervalo);
    };
  }, [solicitar, recarga]);

  const notificarCambioPQRF = () => {
    setRecarga(v => v + 1);
    window.dispatchEvent(new Event("snc-pqrf-actualizadas"));
  };

  const cambiar = (campo, valor) => setForm(v => {
    if (campo === "proceso") {
      const proceso = catalogos.procesos.find(p => String(p.id) === String(valor));
      const correoId = proceso?.id_correo_pqrf;
      const disponible = catalogos.correos.some(c => String(c.id) === String(correoId));
      return { ...v, proceso: valor, destinatario: correoId != null && disponible ? String(correoId) : "" };
    }
    return { ...v, [campo]: valor };
  });
  const agregarArchivos = (archivos) => {
    const permitidas = new Set(["pdf","png","jpg","jpeg","gif","webp","bmp","doc","docx","xls","xlsx","csv","txt","ppt","pptx","mp3","wav","ogg","m4a","mp4","mov","avi","webm","zip"]);
    const nuevos = Array.from(archivos || []);
    if (nuevos.some(f => !permitidas.has(f.name.split(".").pop()?.toLowerCase()) || !f.size || f.size > 50 * 1024 * 1024)) {
      setAviso({ ok: false, texto: "Archivo no permitido, vacío o mayor de 50 MB. Revise los formatos admitidos." }); return;
    }
    setAdjuntosNuevos(actual => {
      const unidos = [...actual, ...nuevos.filter(f => !actual.some(a => a.name === f.name && a.size === f.size && a.lastModified === f.lastModified))];
      if (unidos.length > 10 || unidos.reduce((n, f) => n + f.size, 0) > 100 * 1024 * 1024) {
        setAviso({ ok: false, texto: "Máximo 10 archivos y 100 MB por carga." }); return actual;
      }
      return unidos;
    });
  };

  const subirAdjuntos = async (id, archivos) => {
    if (!archivos.length) return;
    const fd = new FormData();
    archivos.forEach(f => fd.append("archivos", f));
    const r = await fetch(`${BASE}/${id}/adjuntos`, { method: "POST", headers: { Authorization: `Bearer ${tokenActual()}` }, body: fd });
    const d = await r.json().catch(() => null);
    if (!r.ok) throw new Error(detalleError(d, r.status));
  };

  const cargarAdjuntosDetalle = useCallback(async (id, signal) => {
    setCargandoAdjuntos(true); setErrorAdjuntos("");
    try {
      const { data } = await solicitar(`/${id}/adjuntos`, { signal });
      if (!Array.isArray(data)) throw new Error("Formato inesperado de adjuntos.");
      if (!signal?.aborted) setAdjuntosDetalle(data);
    } catch (e) { if (!signal?.aborted) setErrorAdjuntos(e.message); }
    finally { if (!signal?.aborted) setCargandoAdjuntos(false); }
  }, [solicitar]);

  const descargarAdjunto = async (archivo) => {
    try {
      const r = await fetch(`${BASE}/${detalle.id}/adjuntos/${archivo.id}/archivo`, { headers: { Authorization: `Bearer ${tokenActual()}` } });
      if (!r.ok) throw new Error(`No se pudo obtener el archivo (HTTP ${r.status}).`);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = archivo.nombre; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setErrorAdjuntos(e.message); }
  };

  const eliminarAdjunto = async (archivo) => {
    if (!window.confirm(`¿Quitar la evidencia ${archivo.nombre}?`)) return;
    try {
      await solicitar(`/${detalle.id}/adjuntos/${archivo.id}`, { method: "DELETE" });
      await cargarAdjuntosDetalle(detalle.id);
    } catch (e) { setErrorAdjuntos(e.message); }
  };

  const registrar = async (e) => {
    e.preventDefault();
    if (envioRef.current || cargandoCatalogos || errorCatalogos || cargandoPermisos || !puedeCrear) return;
    if (!form.fecha || !form.tipo || !form.nombre.trim() || !form.cliente || !form.correoCorporativo.trim() || !form.descripcion.trim() || !form.proceso || !form.destinatario) {
      setAviso({ ok: false, texto: "Complete todos los campos obligatorios." }); return;
    }
    envioRef.current = true; setGuardando(true);
    try {
      const body = { fecha_pqrf: form.fecha, id_tipo_pqrf: Number(form.tipo), correo_remitente: CORREO_SISTEMA_PQRF, correo_respuesta_cliente: form.correoCorporativo.trim(), nombre_remitente: form.nombre.trim(), id_cliente: Number(form.cliente), descripcion_pqrf: form.descripcion.trim(), id_proceso_pqrf: Number(form.proceso), id_correo_pqrf: Number(form.destinatario) };
      const { data, status } = await solicitar("", { method: "POST", body: JSON.stringify(body) });
      if (status !== 201 || !data?.id || data.estado !== "ABIERTA") throw new Error("El servidor no confirmó el registro. Verifique la bandeja antes de reintentar.");
      let mensajeAdjuntos = "";
      if (adjuntosNuevos.length) {
        try { await subirAdjuntos(data.id, adjuntosNuevos); }
        catch (error) { mensajeAdjuntos = ` ATENCIÓN: la PQRF se registró, pero las evidencias NO se cargaron (${error.message}). Abra la PQRF en Mis registradas para adjuntarlas. No vuelva a registrar la PQRF.`; }
      }
      setAdjuntosNuevos(mensajeAdjuntos ? adjuntosNuevos : []);
      setForm(initial()); setBusquedaCliente(""); setClienteElegido(""); setListaClientesAbierta(false); notificarCambioPQRF();
      setAviso({ ok: true, texto: `PQRF N.º ${data.id} registrada correctamente. Estado: ABIERTA.${mensajeAdjuntos}` });
    } catch (e) { setAviso({ ok: false, texto: e instanceof TypeError ? "No se confirmó la operación. Consulte la bandeja antes de reintentar para evitar duplicados." : e.message }); }
    finally { envioRef.current = false; setGuardando(false); }
  };

  const consultarDetalle = useCallback(async (id, signal) => {
    setCargandoDetalle(true); setErrorDetalle("");
    try {
      const [r, h] = await Promise.all([solicitar(`/${id}/respuesta`, { signal }), solicitar(`/${id}/historial`, { signal })]);
      if (!Array.isArray(r.data) || !Array.isArray(h.data)) throw new Error("Formato inesperado de respuesta o historial.");
      if (!signal?.aborted) { setGestiones(r.data); setHistorial(h.data); }
    } catch (e) { if (!signal?.aborted) setErrorDetalle(e.message); }
    finally { if (!signal?.aborted) setCargandoDetalle(false); }
  }, [solicitar]);

  useEffect(() => {
    if (!detalle?.id) return;
    const ctrl = new AbortController();
    consultarDetalle(detalle.id, ctrl.signal);
    cargarAdjuntosDetalle(detalle.id, ctrl.signal);
    return () => ctrl.abort();
  }, [detalle?.id, consultarDetalle, cargarAdjuntosDetalle]);

  // El backend comprueba que la sesión pertenece al gerente configurado.
  // La interfaz ofrece el control en la bandeja de asignadas; si el usuario
  // no tiene permisos, la API responde 403 y no modifica la PQRF.
  useEffect(() => {
    if (!detalle?.id || !detalle.es_gerente_proceso || detalle.estado !== "ABIERTA") return;
    const ctrl = new AbortController();
    (async () => {
      setCargandoResponsables(true); setErrorResponsables("");
      try {
        const { data } = await solicitar("/catalogos/responsables", { signal: ctrl.signal });
        if (!Array.isArray(data)) throw new Error("Formato inesperado de usuarios activos.");
        if (!ctrl.signal.aborted) setCatalogos(v => ({ ...v, responsables: data }));
      } catch (e) { if (!ctrl.signal.aborted) setErrorResponsables(e.message); }
      finally { if (!ctrl.signal.aborted) setCargandoResponsables(false); }
    })();
    return () => ctrl.abort();
  }, [detalle?.id, detalle?.estado, origen, solicitar]);

  const ejecutarReasignacion = async () => {
    if (!detalle?.id || !detalle.es_gerente_proceso || detalle.estado !== "ABIERTA" || procesando || reasignacionRef.current) return;
    const motivo = motivoReasignacion.trim();
    if (!usuarioDestino || motivo.length < 5) {
      setErrorAccion("Seleccione un usuario y escriba un motivo de al menos 5 caracteres."); return;
    }
    if (String(usuarioDestino) === String(detalle.id_usuario_responsable)) {
      setErrorAccion("Seleccione un responsable diferente al actual."); return;
    }
    if (!window.confirm(`¿Confirma la reasignación de la PQRF N.º ${detalle.id}?`)) return;
    reasignacionRef.current = true; setProcesando(true); setErrorAccion(""); setMensajeDetalle("");
    try {
      const { data } = await solicitar(`/${detalle.id}/reasignar`, {
        method: "POST",
        body: JSON.stringify({ id_usuario_destino: usuarioDestino, motivo }),
      });
      if (Number(data?.id) !== Number(detalle.id) || data?.estado !== "ABIERTA" ||
          String(data?.id_usuario_responsable) !== String(usuarioDestino)) {
        throw new Error("No se confirmó la reasignación. Verifique la bandeja y el historial antes de reintentar.");
      }
      const nuevo = data.usuario_responsable || catalogos.responsables.find(u => String(u.id) === String(usuarioDestino))?.nombre || "Nuevo responsable";
      setDetalle(v => ({ ...v, id_usuario_responsable: data.id_usuario_responsable, usuario_responsable: nuevo }));
      setBandejas(v => Object.fromEntries(Object.entries(v).map(([k, lista]) => [k, lista.map(x =>
        x.id === detalle.id ? { ...x, id_usuario_responsable: data.id_usuario_responsable, usuario_responsable: nuevo } : x)])));
      setUsuarioDestino(""); setMotivoReasignacion(""); setAnalisis(""); setRespuesta(""); setCostoReclamo(""); setEvidencia(null);
      setMensajeDetalle(`PQRF N.º ${detalle.id} reasignada correctamente a ${nuevo}.`);
      notificarCambioPQRF();
      await consultarDetalle(detalle.id);
    } catch (e) {
      setErrorAccion(e instanceof TypeError ? "No se confirmó la operación. Revise el historial antes de reintentar." : e.message);
    } finally { reasignacionRef.current = false; setProcesando(false); }
  };

  const ejecutarRechazo = async () => {
    if (!detalle?.id || origen !== "asignadas" || detalle.estado !== "ABIERTA" || !detalle.puede_rechazar_asignacion || procesando || rechazoRef.current) return;
    const motivo = motivoRechazo.trim();
    if (motivo.length < 5) { setErrorAccion("Indique un motivo de al menos cinco caracteres."); return; }
    if (!window.confirm(`¿Confirma que desea devolver la PQRF N.º ${detalle.id} al gerente?`)) return;
    rechazoRef.current = true; setProcesando(true); setErrorAccion(""); setMensajeDetalle("");
    try {
      const { data } = await solicitar(`/${detalle.id}/rechazar-asignacion`, { method: "POST", body: JSON.stringify({ motivo }) });
      if (Number(data?.id) !== Number(detalle.id) || data?.estado !== "ABIERTA" || !data?.id_usuario_responsable) throw new Error("No se confirmó la devolución. Revise el historial antes de reintentar.");
      setDetalle(v => ({ ...v, id_usuario_responsable: data.id_usuario_responsable, usuario_responsable: data.usuario_responsable, puede_rechazar_asignacion: false }));
      setMotivoRechazo(""); setAnalisis(""); setRespuesta(""); setCostoReclamo(""); setEvidencia(null);
      setMensajeDetalle(`PQRF N.º ${detalle.id}: asignación rechazada y devuelta a ${data.usuario_responsable}.`);
      notificarCambioPQRF();
      await consultarDetalle(detalle.id);
    } catch (e) { setErrorAccion(e instanceof TypeError ? "No se confirmó la operación. Revise el historial antes de reintentar." : e.message); }
    finally { rechazoRef.current = false; setProcesando(false); }
  };

  const abrir = (item, tipo) => {
    setVistaPreviaRespuesta(false); setDetalle(item); setOrigen(tipo); setGestiones([]); setHistorial([]); setAdjuntosDetalle([]); setErrorAdjuntos(""); setAnalisis(""); setRespuesta(""); setCostoReclamo(""); setEvidencia(null); if (evidenciaRespuestaInputRef.current) evidenciaRespuestaInputRef.current.value = ""; setErrorAccion(""); setMensajeDetalle(""); setUsuarioDestino(""); setMotivoReasignacion(""); setMotivoRechazo(""); setErrorResponsables("");
  };
  const cerrarModal = () => { if (!procesando) { setVistaPreviaRespuesta(false); setDetalle(null); } };
  const ejecutarAccion = async (accion) => {
    if (!detalle?.id || procesando || respuestaRef.current || cierreRef.current) return;
    if (accion === "responder" && (origen !== "asignadas" || detalle.estado !== "ABIERTA" || !respuestaValida)) return;
    if (accion === "cerrar" && (origen !== "registradas" || detalle.estado !== "RESPONDIDA" || gestiones.length === 0 || errorDetalle)) return;
    const ref = accion === "responder" ? respuestaRef : cierreRef;
    ref.current = true; setProcesando(true); setErrorAccion(""); setMensajeDetalle("");
    try {
      let opciones = { method: "POST" };
      if (accion === "responder") {
        const formulario = new FormData();
        formulario.append("analisis_gestion", esFelicitacion ? "" : analisis.trim());
        formulario.append("respuesta_pqrf", esFelicitacion ? "" : respuesta.trim());
        if (esReclamo) formulario.append("costo_reclamo", costoReclamo);
        if (evidencia) formulario.append("evidencia", evidencia);
        const token = tokenActual();
        const r = await fetch(`${BASE}/${detalle.id}/responder`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formulario });
        const d = await r.json().catch(() => null);
        if (!r.ok) throw new Error(detalleError(d, r.status));
        opciones = null;
        var data = d;
      } else {
        var { data } = await solicitar(`/${detalle.id}/${accion}`, opciones);
      }
      const esperado = accion === "responder" ? "RESPONDIDA" : "CERRADA";
      if (Number(data?.id) !== Number(detalle.id) || data?.estado !== esperado) throw new Error("No se confirmó el cambio de estado. Consulte el historial antes de reintentar.");
      setVistaPreviaRespuesta(false);
      setDetalle(v => ({ ...v, estado: esperado }));
      setBandejas(v => Object.fromEntries(Object.entries(v).map(([k, lista]) => [k, lista.map(x => x.id === detalle.id ? { ...x, estado: esperado } : x)])));
      setMensajeDetalle(`PQRF N.º ${detalle.id}: ${esperado}.`);
      notificarCambioPQRF();
      await consultarDetalle(detalle.id);
    } catch (e) { setErrorAccion(e instanceof TypeError ? "No se confirmó la operación. Revise el historial antes de reintentar." : e.message); }
    finally { ref.current = false; setProcesando(false); }
  };

  const cerrarVistaEvidencia = () => {
    setVistaEvidencia(null);
    if (vistaEvidenciaUrlRef.current) {
      URL.revokeObjectURL(vistaEvidenciaUrlRef.current);
      vistaEvidenciaUrlRef.current = null;
    }
  };

  useEffect(() => () => {
    if (vistaEvidenciaUrlRef.current) URL.revokeObjectURL(vistaEvidenciaUrlRef.current);
  }, []);

  const verEvidencia = async (gestion) => {
    if (!detalle?.id || cargandoVistaEvidencia) return;
    const nombre = gestion.nombre_evidencia || "Evidencia";
    const extension = nombre.split(".").pop()?.toLowerCase();
    const tipo = extension === "pdf" ? "pdf" : ["jpg", "jpeg", "png"].includes(extension) ? "imagen" : null;
    if (!tipo) {
      setErrorAccion("Este tipo de documento no tiene vista previa en el navegador. Utilice Descargar evidencia.");
      return;
    }
    setCargandoVistaEvidencia(true);
    setErrorAccion("");
    try {
      const r = await fetch(`${BASE}/${detalle.id}/gestiones/${gestion.id_gestion}/evidencia`, {
        headers: { Authorization: `Bearer ${tokenActual()}` },
      });
      if (!r.ok) throw new Error(`No se pudo visualizar la evidencia (HTTP ${r.status}).`);
      const blob = await r.blob();
      const mime = tipo === "pdf" ? "application/pdf" : extension === "png" ? "image/png" : "image/jpeg";
      const url = URL.createObjectURL(new Blob([blob], { type: mime }));
      cerrarVistaEvidencia();
      vistaEvidenciaUrlRef.current = url;
      setVistaEvidencia({ url, nombre, tipo });
    } catch (e) {
      setErrorAccion(e.message);
    } finally {
      setCargandoVistaEvidencia(false);
    }
  };

  const descargarEvidencia = async (gestion) => {
    try {
      const r = await fetch(`${BASE}/${detalle.id}/gestiones/${gestion.id_gestion}/evidencia`, { headers: { Authorization: `Bearer ${tokenActual()}` } });
      if (!r.ok) throw new Error(`No se pudo descargar la evidencia (HTTP ${r.status}).`);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = gestion.nombre_evidencia || "evidencia"; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setErrorAccion(e.message); }
  };
  // Vista local del archivo aún no enviado: no modifica adjuntos guardados ni llama al backend.
  const verEvidenciaSeleccionada = () => {
    if (!evidencia) return;
    const extension = evidencia.name.split(".").pop()?.toLowerCase();
    const tipo = extension === "pdf" ? "pdf" : ["jpg", "jpeg", "png"].includes(extension) ? "imagen" : null;
    if (!tipo) {
      // Word no dispone de una vista previa nativa confiable: abrir descarga local.
      const url = URL.createObjectURL(evidencia);
      const enlace = document.createElement("a");
      enlace.href = url; enlace.download = evidencia.name;
      document.body.appendChild(enlace); enlace.click(); enlace.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      return;
    }
    const url = URL.createObjectURL(evidencia);
    cerrarVistaEvidencia();
    vistaEvidenciaUrlRef.current = url;
    setVistaEvidencia({ url, nombre: evidencia.name, tipo });
  };

  const quitarEvidenciaSeleccionada = () => {
    setEvidencia(null);
    if (evidenciaRespuestaInputRef.current) evidenciaRespuestaInputRef.current.value = "";
  };

  const tarjeta = (nombre, valor) => <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs font-semibold text-gray-500">{nombre}</p><p className="mt-1 break-words text-sm text-gray-800">{valor || "—"}</p></div>;

  return <div className="min-h-screen bg-gray-50 p-4 md:p-6"><div className="mx-auto max-w-6xl space-y-6">
    <header className="rounded-xl border bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><ClipboardList className="text-emerald-700" size={36}/><div><h1 className="text-2xl font-bold text-gray-800">PQRF</h1><p className="text-sm text-gray-500">Peticiones, Quejas, Reclamos y Felicitaciones</p></div></div></header>
    <nav className="flex flex-wrap gap-2">{[...(puedeCrear && !cargandoPermisos ? [["nueva", "Nueva PQRF", PlusCircle]] : []), ...(tieneRegistradas ? [["registradas", "Mis PQRF registradas", FileText]] : []), ["asignadas", "PQRF asignadas", Inbox], ["delegadas", "PQRF delegadas", FileText]].map(([id, nombre, Icon]) => <button key={id} type="button" onClick={() => setTab(id)} className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold ${tab === id ? "bg-emerald-700 text-white" : "border bg-white text-gray-700 hover:bg-gray-100"}`}><Icon size={17}/>{nombre}{id === "asignadas" && pendientesPQRF > 0 && <span className={`ml-1 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold ${tab === id ? "bg-emerald-100 text-emerald-900" : "bg-emerald-100 text-emerald-700"}`}>{pendientesPQRF}</span>}</button>)}</nav>
    {tab === "nueva" && puedeCrear && !cargandoPermisos && <form onSubmit={registrar} className="rounded-xl border bg-white p-5 shadow-sm md:p-7"><h2 className="mb-5 text-lg font-bold">Registro de PQRF</h2>{cargandoCatalogos && <p className="mb-4 text-sm">Cargando catálogos...</p>}{errorCatalogos && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{errorCatalogos}</p>}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="pqrf-fecha" className="block text-sm font-semibold text-gray-700">Fecha de PQRF *</label>
          <input id="pqrf-fecha" className={inputClass} type="date" lang="es-CO" value={form.fecha} onChange={e => cambiar("fecha", e.target.value)} max={fechaLocal()} required disabled={guardando} aria-describedby="pqrf-fecha-aviso" />
          <div id="pqrf-fecha-aviso" role="note" className="flex items-start gap-2 border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <div><strong>¡Atención! Verifique la fecha de la novedad.</strong><p className="mt-1 text-xs">Seleccione la fecha exacta en que ocurrió la PQRF, no la fecha en que está diligenciando el formulario.</p></div>
          </div>
        </div>
        <Campo label="Tipo de PQRF *"><Selector nombre="un tipo" campo="tipo" opciones={catalogos.tipos} value={form.tipo} onChange={cambiar} disabled={guardando || cargandoCatalogos || !!errorCatalogos}/></Campo>
        <div className="md:col-span-2 space-y-2 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/40 p-4">
          <label className="block text-sm font-semibold text-gray-700"><Paperclip size={17} className="mr-2 inline"/>Evidencias de la PQRF (opcional)</label>
          <input type="file" multiple disabled={guardando} className={inputClass} onChange={e => { agregarArchivos(e.target.files); e.target.value = ""; }}/>
          <p className="text-xs text-gray-600">Puede seleccionar varios archivos: documentos, imágenes, audios, videos y ZIP. Máximo 10 archivos, 50 MB cada uno y 100 MB por carga.</p>
          {adjuntosNuevos.map((f, i) => <div key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 rounded border bg-white px-3 py-2 text-sm"><span className="min-w-0 truncate">{f.name} · {(f.size/1024/1024).toFixed(2)} MB</span><div className="flex shrink-0 gap-3"><button type="button" className="text-emerald-700 underline" onClick={() => { const u = URL.createObjectURL(f); window.open(u, "_blank", "noopener,noreferrer"); setTimeout(() => URL.revokeObjectURL(u), 60000); }}>Ver</button><button type="button" className="text-red-700 underline" onClick={() => setAdjuntosNuevos(v => v.filter((_, n) => n !== i))}>Eliminar</button></div></div>)}
        </div>
        <Campo label="Nombre de la persona que emite la PQR (Cliente) *"><input className={inputClass} maxLength={200} required disabled={guardando} value={form.nombre} onChange={e => cambiar("nombre", e.target.value)} placeholder="Nombre del remitente"/></Campo>
        <div ref={clienteContenedorRef} className="relative space-y-2">
          <label htmlFor="pqrf-buscar-cliente" className="block text-sm font-semibold text-gray-700">Cliente relacionado *</label>
          <div className="relative">
            <input
              id="pqrf-buscar-cliente"
              className={`${inputClass} pr-10`}
              value={busquedaCliente}
              onFocus={() => setListaClientesAbierta(true)}
              onChange={e => {
                setBusquedaCliente(e.target.value.slice(0, 100));
                cambiar("cliente", "");
                setClienteElegido("");
                setListaClientesAbierta(true);
              }}
              onKeyDown={e => { if (e.key === "Escape") setListaClientesAbierta(false); }}
              placeholder="Escriba para buscar y seleccionar un cliente"
              disabled={guardando}
              autoComplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={listaClientesAbierta}
              aria-controls="pqrf-lista-clientes"
              required
            />
            <button type="button" tabIndex={-1} aria-label="Mostrar clientes" disabled={guardando}
              onClick={() => setListaClientesAbierta(v => !v)}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-500 disabled:opacity-50">⌄</button>
          </div>
          {listaClientesAbierta && !guardando && (
            <div id="pqrf-lista-clientes" role="listbox" aria-label="Clientes encontrados"
              className="absolute left-0 right-0 top-full z-30 max-h-56 overflow-y-auto rounded-lg border border-gray-300 bg-white py-1 shadow-lg">
              {cargandoClientes ? <p className="px-3 py-2 text-sm text-gray-500">Buscando clientes...</p>
                : clientes.length === 0 ? <p className="px-3 py-2 text-sm text-gray-500">No hay clientes coincidentes.</p>
                : clientes.map(c => (
                  <button key={c.id} type="button" role="option" aria-selected={String(c.id) === form.cliente}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none"
                    onClick={() => {
                      cambiar("cliente", String(c.id));
                      setClienteElegido(c.nombre);
                      setBusquedaCliente(c.nombre);
                      setListaClientesAbierta(false);
                    }}>{c.nombre}</button>
                ))}
            </div>
          )}
          <p className="text-xs text-gray-500">{form.cliente ? `Cliente seleccionado: ${clienteElegido}` : "Escriba y seleccione una coincidencia. Se consultan hasta 100 resultados por búsqueda."}</p>
        </div>
        <div className="space-y-2">
          <label htmlFor="pqrf-correo-cliente" className="block text-sm font-semibold text-gray-700">Correo corporativo *</label>
          <input id="pqrf-correo-cliente" className={inputClass} type="email" inputMode="email" autoComplete="email" maxLength={180} required disabled={guardando} value={form.correoCorporativo} onChange={e => cambiar("correoCorporativo", e.target.value)} placeholder="correo@empresa.com" aria-describedby="pqrf-correo-cliente-aviso" />
          <div id="pqrf-correo-cliente-aviso" role="note" className="flex items-start gap-2 border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm text-sky-950">
            <Info size={17} className="mt-0.5 shrink-0 text-sky-600" />
            <span>Por favor, ingrese el correo donde le enviaremos la respuesta a su PQRF.</span>
          </div>
        </div>
        <div className="md:col-span-2 space-y-2">
          <label htmlFor="pqrf-descripcion" className="block text-sm font-semibold text-gray-700">Descripción de la PQRF *</label>
          <div id="pqrf-descripcion-nota" role="note" className="flex items-start gap-3 border border-sky-200 bg-sky-50 px-3 py-3 text-sm text-sky-950">
            <Info size={18} className="mt-0.5 shrink-0 text-sky-600" />
            <div><strong>Nota importante</strong><p className="mt-1 leading-6">Detalle claramente la petición, queja, reclamo o felicitación recibida, indicando qué ocurrió, quién está involucrado y los datos relevantes para su gestión. Use información concreta, clara y objetiva que facilite su análisis y respuesta.</p></div>
          </div>
          <textarea id="pqrf-descripcion" aria-describedby="pqrf-descripcion-nota" className={inputClass} rows={5} maxLength={20000} required disabled={guardando} value={form.descripcion} onChange={e => cambiar("descripcion", e.target.value)} placeholder="Describa la petición, queja, reclamo o felicitación..." />
        </div>
        <Campo label="Proceso que responde PQRF *"><Selector nombre="un proceso" campo="proceso" opciones={catalogos.procesos} value={form.proceso} onChange={cambiar} disabled={guardando || cargandoCatalogos || !!errorCatalogos}/></Campo>
        <Campo label="Correo donde va dirigida la PQRF *"><Selector nombre="un correo" campo="destinatario" opciones={catalogos.correos} etiqueta="correo" value={form.destinatario} onChange={cambiar} disabled={true}/></Campo>
        {form.proceso && !form.destinatario && !cargandoCatalogos && <p role="alert" className="text-sm text-red-700">El proceso seleccionado no tiene un correo activo configurado. Contacte al administrador.</p>}
        <Campo label="Estado inicial"><input className={`${inputClass} bg-gray-100`} value="ABIERTA" readOnly /></Campo>
      </div><div className="mt-7 flex justify-end border-t pt-5"><button disabled={guardando || cargandoCatalogos || !!errorCatalogos} className="flex items-center gap-2 rounded-lg bg-emerald-700 px-6 py-3 font-semibold text-white disabled:opacity-50"><Send size={17}/>{guardando ? "Registrando..." : "Registrar PQRF"}</button></div>
    </form>}
    {["registradas", "asignadas", "delegadas"].includes(tab) && <section className="rounded-xl border bg-white p-5 shadow-sm md:p-7"><div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-lg font-bold">{tab === "registradas" ? "Mis PQRF registradas" : tab === "delegadas" ? "Mis PQRF delegadas" : "Mis PQRF asignadas"}</h2><button type="button" onClick={notificarCambioPQRF} disabled={cargandoBandeja} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><RefreshCw size={16}/>Actualizar</button></div>{errorBandeja && <p role="alert" className="mb-4 text-red-700">{errorBandeja}</p>}{cargandoBandeja ? <p>Consultando...</p> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-gray-50"><tr>{["N.º", "Fecha", "Cliente", "Tipo", "Proceso", "Responsable", "Estado", "Detalle"].map(t => <th key={t} className="px-3 py-3">{t}</th>)}</tr></thead><tbody className="divide-y">{bandejas[tab].map(item => <tr key={item.id}><td className="px-3 py-3">{item.id}</td><td className="px-3 py-3">{formatoFecha(item.fecha_pqrf)}</td><td className="px-3 py-3">{item.cliente}</td><td className="px-3 py-3">{item.tipo_pqrf}</td><td className="px-3 py-3">{item.proceso}</td><td className="px-3 py-3">{item.usuario_responsable}</td><td className="px-3 py-3 font-semibold">{item.estado}</td><td className="px-3 py-3"><button type="button" onClick={() => abrir(item,tab)} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-emerald-700"><Eye size={16}/>Ver</button></td></tr>)}</tbody></table>{!errorBandeja && bandejas[tab].length === 0 && <p className="py-8 text-center text-gray-500">No hay PQRF para mostrar.</p>}</div>}<div className="mt-5 flex items-center justify-between border-t pt-4"><span className="text-xs text-gray-500">Página {pagina[tab]+1} · {bandejas[tab].length} registro(s)</span><div className="flex gap-2"><button type="button" disabled={cargandoBandeja || pagina[tab]===0} onClick={() => setPagina(v => ({...v,[tab]:v[tab]-1}))} className="flex items-center rounded-lg border px-3 py-2 disabled:opacity-40"><ChevronLeft size={16}/>Anterior</button><button type="button" disabled={cargandoBandeja || !!errorBandeja || bandejas[tab].length < LIMITE} onClick={() => setPagina(v => ({...v,[tab]:v[tab]+1}))} className="flex items-center rounded-lg border px-3 py-2 disabled:opacity-40">Siguiente<ChevronRight size={16}/></button></div></div></section>}
  </div>
  {detalle && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4" onMouseDown={e => { if(e.target===e.currentTarget) cerrarModal(); }}><section role="dialog" aria-modal="true" aria-labelledby="pqrf-titulo" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><h2 id="pqrf-titulo" className="text-xl font-bold">Detalle de PQRF N.º {detalle.id}</h2><button type="button" onClick={cerrarModal} disabled={procesando} aria-label="Cerrar"><X/></button></div><div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">{tarjeta("Fecha", formatoFecha(detalle.fecha_pqrf))}{tarjeta("Estado", detalle.estado)}{tarjeta("Cliente", detalle.cliente)}{tarjeta("Tipo", detalle.tipo_pqrf)}<div className="sm:col-span-2">{tarjeta("Descripción", detalle.descripcion_pqrf)}</div></div>
         <section className="mt-6 space-y-3 border-t pt-5"><h3 className="font-bold text-emerald-800">Evidencias adjuntas al registro</h3>
       {cargandoAdjuntos && <p className="text-sm">Consultando evidencias...</p>}
       {errorAdjuntos && <p role="alert" className="text-sm text-red-700">{errorAdjuntos}</p>}
       {!cargandoAdjuntos && !errorAdjuntos && adjuntosDetalle.length === 0 && <p className="text-sm text-gray-500">Sin evidencias iniciales.</p>}
       {adjuntosDetalle.map(a => <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"><span className="break-all">{a.nombre} · {(a.tamano/1024/1024).toFixed(2)} MB</span><div className="flex gap-3"><button type="button" className="text-emerald-700 underline" onClick={() => descargarAdjunto(a)}>Ver / descargar</button>{origen === "registradas" && detalle.estado === "ABIERTA" && <button type="button" className="text-red-700 underline" onClick={() => eliminarAdjunto(a)}>Eliminar</button>}</div></div>)}
       {origen === "registradas" && detalle.estado === "ABIERTA" && <label className="block rounded-lg bg-gray-50 p-3 text-sm font-semibold">Agregar más evidencias (opcional)
         <input type="file" multiple disabled={subiendoAdjuntos || adjuntosDetalle.length >= 10} className={`${inputClass} mt-2`} onChange={async e => { const archivos = Array.from(e.target.files || []); e.target.value = ""; if (!archivos.length) return; setSubiendoAdjuntos(true); setErrorAdjuntos(""); try { await subirAdjuntos(detalle.id, archivos); await cargarAdjuntosDetalle(detalle.id); } catch (error) { setErrorAdjuntos(error.message); } finally { setSubiendoAdjuntos(false); } }}/>
       </label>}
     </section>
<section className="mt-6 border-t pt-5"><h3 className="mb-3 font-bold text-emerald-800">Respuesta y gestión</h3>{cargandoDetalle && <p className="text-sm">Consultando gestión e historial...</p>}{errorDetalle && <p role="alert" className="text-sm text-red-700">{errorDetalle}</p>}{gestiones.map(g => <div key={g.id_gestion} className="mb-3 space-y-2 rounded-lg bg-gray-50 p-4 text-sm"><p><strong>Gestionó:</strong> {g.usuario_gestion} · {formatoMomento(g.fecha_gestion)}</p><p className="whitespace-pre-wrap"><strong>Análisis de causas:</strong> {g.analisis_gestion}</p><p className="whitespace-pre-wrap"><strong>Respuesta:</strong> {g.respuesta_pqrf}</p>{g.costo_reclamo !== null && g.costo_reclamo !== undefined && <p><strong>Costo del reclamo:</strong> {Number(g.costo_reclamo).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}</p>}{g.tiene_evidencia && <div className="flex flex-wrap items-center gap-3"><button type="button" className="inline-flex items-center gap-1 font-semibold text-emerald-700 underline disabled:opacity-50" disabled={cargandoVistaEvidencia} onClick={() => verEvidencia(g)}><Eye size={16}/>{cargandoVistaEvidencia ? "Abriendo evidencia..." : "Ver evidencia"}</button><button type="button" className="inline-flex items-center gap-1 font-semibold text-emerald-700 underline" onClick={() => descargarEvidencia(g)}><FileText size={16}/>Descargar evidencia: {g.nombre_evidencia || "Archivo"}</button></div>}</div>)}{!cargandoDetalle && !errorDetalle && gestiones.length===0 && <p className="text-sm text-gray-500">Sin respuestas registradas.</p>}</section>
    {origen === "asignadas" && detalle.estado === "ABIERTA" && !mensajeDetalle.includes("reasignada correctamente") && !mensajeDetalle.includes("asignación rechazada") && <section className="mt-6 space-y-3 border-t pt-5"><h3 className="font-bold">Responder PQRF</h3>{!esFelicitacion && <><label className="block text-sm font-semibold">Análisis de causas *<textarea className={`${inputClass} mt-2`} rows={3} maxLength={20000} value={analisis} onChange={e=>setAnalisis(e.target.value)} disabled={procesando}/></label><label className="block text-sm font-semibold">Plan de acción *<textarea className={`${inputClass} mt-2`} rows={3} maxLength={20000} value={respuesta} onChange={e=>setRespuesta(e.target.value)} disabled={procesando}/></label></>}{esReclamo && <label className="block text-sm font-semibold">Costo del reclamo (COP) *<input type="number" min="0" step="1" className={`${inputClass} mt-2`} value={costoReclamo} onChange={e=>setCostoReclamo(e.target.value)} placeholder="Valor en pesos colombianos" disabled={procesando} required/></label>}{evidenciaObligatoria && <label className="block text-sm font-semibold"><span className="flex items-center gap-2"><Paperclip size={17}/>Adjuntar evidencia *</span><input ref={evidenciaRespuestaInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" className={`${inputClass} mt-2`} onChange={e=>setEvidencia(e.target.files?.[0] || null)} disabled={procesando} required={!evidencia}/><span className="block mt-1 text-xs text-gray-500">PDF, imagen o Word. Máximo 10 MB.</span>{evidencia && <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-gray-50 px-3 py-2"><span className="min-w-0 break-all text-sm font-normal text-gray-700">{evidencia.name} · {(evidencia.size / 1024 / 1024).toFixed(2)} MB</span><div className="flex shrink-0 gap-3"><button type="button" disabled={procesando} onClick={verEvidenciaSeleccionada} className="text-sm font-semibold text-emerald-700 underline disabled:opacity-50"><Eye size={15} className="mr-1 inline"/>Ver</button><button type="button" disabled={procesando} onClick={quitarEvidenciaSeleccionada} className="text-sm font-semibold text-red-700 underline disabled:opacity-50"><X size={15} className="mr-1 inline"/>Eliminar</button></div></div>}</label>}<button type="button" onClick={() => { setErrorAccion(""); setVistaPreviaRespuesta(true); }} disabled={procesando || !respuestaValida} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50"><Send size={17}/>{procesando ? "Procesando..." : "Vista previa de respuesta"}</button></section>}
    {detalle.es_gerente_proceso === true && detalle.estado === "ABIERTA" && !mensajeDetalle.includes("reasignada correctamente") && !mensajeDetalle.includes("asignación rechazada") && <section className="mt-6 space-y-3 border-t pt-5">
      <h3 className="flex items-center gap-2 font-bold text-emerald-800"><RefreshCw size={18}/>Reasignar PQRF</h3>
      <p className="text-sm text-gray-600">Solo el gerente configurado para este proceso puede delegar la PQRF a otro usuario activo. El historial conservará el motivo.</p>
      {errorResponsables && <p role="alert" className="text-sm text-red-700">{errorResponsables}</p>}
      <label className="block text-sm font-semibold">Nuevo responsable *
        <select className={`${inputClass} mt-2`} value={usuarioDestino} onChange={e => setUsuarioDestino(e.target.value)} disabled={procesando || cargandoResponsables || !!errorResponsables}>
          <option value="">{cargandoResponsables ? "Cargando usuarios..." : "Seleccione un usuario activo"}</option>
          {(Array.isArray(catalogos.responsables) ? catalogos.responsables : []).filter(u => String(u.id) !== String(detalle.id_usuario_responsable)).map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
        </select>
      </label>
      <label className="block text-sm font-semibold">Motivo de reasignación *
        <textarea className={`${inputClass} mt-2`} rows={3} minLength={5} maxLength={1000} value={motivoReasignacion} onChange={e => setMotivoReasignacion(e.target.value)} disabled={procesando} placeholder="Explique por qué se reasigna esta PQRF"/>
      </label>
      <button type="button" onClick={ejecutarReasignacion} disabled={procesando || cargandoResponsables || !!errorResponsables || !usuarioDestino || motivoReasignacion.trim().length < 5} className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-700 bg-emerald-50 px-4 py-3 font-semibold text-emerald-800 disabled:opacity-50"><RefreshCw size={17}/>{procesando ? "Reasignando..." : "Confirmar reasignación"}</button>
    </section>}
    {origen === "asignadas" && detalle.estado === "ABIERTA" && detalle.puede_rechazar_asignacion === true && !mensajeDetalle.includes("asignación rechazada") && <section className="mt-6 space-y-3 border-t pt-5">
      <h3 className="flex items-center gap-2 font-bold text-red-700"><Undo2 size={18}/>Rechazar asignación</h3>
      <p className="text-sm text-gray-600">Si esta PQRF no corresponde a sus funciones, indique el motivo. Regresará automáticamente al gerente del proceso y continuará ABIERTA.</p>
      <label className="block text-sm font-semibold">Motivo del rechazo *
        <textarea className={`${inputClass} mt-2`} rows={3} minLength={5} maxLength={1000} value={motivoRechazo} onChange={e => setMotivoRechazo(e.target.value)} disabled={procesando} placeholder="Explique por qué no le corresponde esta PQRF"/>
      </label>
      <button type="button" onClick={ejecutarRechazo} disabled={procesando || motivoRechazo.trim().length < 5} className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-700 bg-red-50 px-4 py-3 font-semibold text-red-800 disabled:opacity-50"><Undo2 size={17}/>{procesando ? "Devolviendo..." : "Rechazar y devolver al gerente"}</button>
    </section>}
    {origen === "registradas" && detalle.estado === "RESPONDIDA" && <section className="mt-6 border-t pt-5"><p className="mb-3 text-sm">Revise la respuesta antes de realizar el cierre definitivo.</p><button type="button" onClick={() => ejecutarAccion("cerrar")} disabled={procesando || cargandoDetalle || !!errorDetalle || gestiones.length===0} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50"><CheckCircle2 size={17}/>{procesando ? "Cerrando..." : "Cerrar PQRF"}</button></section>}
    {mensajeDetalle && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-emerald-800">{mensajeDetalle}</p>}{errorAccion && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">{errorAccion}</p>}
    <section className="mt-6 border-t pt-5"><h3 className="mb-3 font-bold">Historial de movimientos</h3>{historial.map(h => <div key={h.id_historial} className="mb-2 rounded-lg border p-3 text-sm"><p className="font-semibold">{h.tipo_movimiento} · {h.estado_anterior || "Inicio"} → {h.estado_nuevo}</p><p>{h.usuario} · {formatoMomento(h.fecha_movimiento)}</p><p className="text-gray-600">{h.observacion}</p></div>)}</section><button type="button" onClick={cerrarModal} disabled={procesando} className="mt-5 w-full rounded-lg border px-4 py-3 font-semibold disabled:opacity-50">Cerrar detalle</button></section></div>}
   {vistaPreviaRespuesta && detalle && detalle.estado === "ABIERTA" && origen === "asignadas" && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="pqrf-previa-titulo" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between gap-3"><h2 id="pqrf-previa-titulo" className="text-xl font-bold text-gray-800">Vista previa de respuesta · PQRF N.º {detalle.id}</h2><button type="button" aria-label="Volver a editar" disabled={procesando} onClick={() => setVistaPreviaRespuesta(false)}><X size={22}/></button></div><p className="mt-2 text-sm text-gray-600">Revise la información antes de confirmar. Esta vista no registra ni envía la respuesta.</p><div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">{tarjeta("Cliente", detalle.cliente)}{tarjeta("Tipo", detalle.tipo_pqrf)}{tarjeta("Proceso", detalle.proceso)}{tarjeta("Estado actual", detalle.estado)}</div><div className="mt-4 space-y-3">{!esFelicitacion && <>{tarjeta("Análisis de causas", analisis)}{tarjeta("Plan de acción", respuesta)}</>}{esReclamo && tarjeta("Costo del reclamo (COP)", Number(costoReclamo).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }))}{evidencia && tarjeta("Evidencia adjunta", evidencia.name)}{!evidencia && tarjeta("Evidencia adjunta", "Sin archivo")}</div>{errorAccion && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorAccion}</p>}<div className="mt-6 flex flex-col gap-3 sm:flex-row"><button type="button" disabled={procesando} onClick={() => setVistaPreviaRespuesta(false)} className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 disabled:opacity-50">Volver a editar</button><button type="button" disabled={procesando || !respuestaValida} onClick={() => ejecutarAccion("responder")} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50"><Send size={17}/>{procesando ? "Enviando respuesta..." : "Confirmar y responder PQRF"}</button></div></section></div>}
  {vistaEvidencia && <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 p-4" onMouseDown={e => { if (e.target === e.currentTarget) cerrarVistaEvidencia(); }}><section role="dialog" aria-modal="true" aria-label="Vista previa de evidencia" className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"><div className="flex items-center justify-between gap-3 border-b px-5 py-4"><div className="min-w-0"><h3 className="font-bold text-gray-800">Vista previa de evidencia</h3><p className="truncate text-sm text-gray-500">{vistaEvidencia.nombre}</p></div><button type="button" onClick={cerrarVistaEvidencia} aria-label="Cerrar vista previa" className="rounded-lg p-2 hover:bg-gray-100"><X size={22}/></button></div><div className="min-h-0 flex-1 overflow-auto bg-gray-100 p-3">{vistaEvidencia.tipo === "pdf" ? <iframe title={`Evidencia: ${vistaEvidencia.nombre}`} src={vistaEvidencia.url} className="h-[72vh] w-full rounded-lg bg-white"/> : <img src={vistaEvidencia.url} alt={`Evidencia: ${vistaEvidencia.nombre}`} className="mx-auto max-h-[72vh] max-w-full object-contain"/>}</div><div className="border-t px-5 py-3 text-right"><button type="button" onClick={cerrarVistaEvidencia} className="rounded-lg border px-5 py-2 font-semibold">Cerrar vista</button></div></section></div>}
  {aviso && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4"><div role="alertdialog" aria-modal="true" className="w-full max-w-md rounded-xl bg-white p-7 text-center shadow-2xl"><CheckCircle2 className={`mx-auto mb-3 ${aviso.ok ? "text-emerald-700" : "text-red-600"}`} size={40}/><h3 className="mb-3 text-lg font-bold">{aviso.ok ? "PQRF registrada" : "No se pudo registrar"}</h3><p className="text-sm">{aviso.texto}</p><button type="button" autoFocus onClick={() => setAviso(null)} className="mt-6 w-full rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white">Entendido</button></div></div>}
  </div>;
}
