import React, { useCallback, useEffect, useRef, useState } from "react";
import { ClipboardList, PlusCircle, Inbox, FileText, Eye, X, Send, RefreshCw, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// En este proyecto VITE_API_BASE_URL ya incluye /api.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const BASE = `${API_BASE_URL}/pqrf`;
const LIMITE = 20;
const initial = () => ({ tipo: "", correo: "", nombre: "", cliente: "", descripcion: "", proceso: "", destinatario: "", responsable: "" });
const inputClass = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-600 focus:outline-none disabled:bg-gray-100";
const fechaLocal = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const formatoFecha = (v) => v ? String(v).slice(0, 10).split("-").reverse().join("/") : "—";
const formatoMomento = (v) => v ? new Date(v).toLocaleString("es-CO") : "—";
const detalleError = (d, status) => Array.isArray(d?.detail) ? d.detail.map(x => x.msg).join("; ") : typeof d?.detail === "string" ? d.detail : `Error HTTP ${status}`;

const Campo = ({ label, children }) => <label className="block space-y-2"><span className="block text-sm font-semibold text-gray-700">{label}</span>{children}</label>;
const Selector = ({ nombre, campo, opciones, etiqueta = "nombre", value, onChange, disabled }) => <select className={inputClass} value={value} onChange={e => onChange(campo, e.target.value)} disabled={disabled} required><option value="">Seleccione {nombre}</option>{opciones.map(o => <option key={o.id} value={o.id}>{o[etiqueta]}</option>)}</select>;

export default function PQRFView() {
  const { user } = useAuth();
  const [tab, setTab] = useState("nueva");
  const [form, setForm] = useState(initial);
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
  const [usuarioDestino, setUsuarioDestino] = useState("");
  const [motivoReasignacion, setMotivoReasignacion] = useState("");
  const [cargandoResponsables, setCargandoResponsables] = useState(false);
  const [errorResponsables, setErrorResponsables] = useState("");
  const [bandejas, setBandejas] = useState({ registradas: [], asignadas: [], delegadas: [] });
  const [pagina, setPagina] = useState({ registradas: 0, asignadas: 0, delegadas: 0 });
  const [recarga, setRecarga] = useState(0);
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
  const [acciones, setAcciones] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [mensajeDetalle, setMensajeDetalle] = useState("");
  const [errorAccion, setErrorAccion] = useState("");

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

  const cambiar = (campo, valor) => setForm(v => ({ ...v, [campo]: valor }));
  const registrar = async (e) => {
    e.preventDefault();
    if (envioRef.current || cargandoCatalogos || errorCatalogos) return;
    if (!form.tipo || !form.correo.trim() || !form.nombre.trim() || !form.cliente || !form.descripcion.trim() || !form.proceso || !form.destinatario) {
      setAviso({ ok: false, texto: "Complete todos los campos obligatorios." }); return;
    }
    envioRef.current = true; setGuardando(true);
    try {
      const body = { id_tipo_pqrf: Number(form.tipo), correo_remitente: form.correo.trim(), nombre_remitente: form.nombre.trim(), id_cliente: Number(form.cliente), descripcion_pqrf: form.descripcion.trim(), id_proceso_pqrf: Number(form.proceso), id_correo_pqrf: Number(form.destinatario) };
      const { data, status } = await solicitar("", { method: "POST", body: JSON.stringify(body) });
      if (status !== 201 || !data?.id || data.estado !== "ABIERTA") throw new Error("El servidor no confirmó el registro. Verifique la bandeja antes de reintentar.");
      setForm(initial()); setBusquedaCliente(""); setClienteElegido(""); setListaClientesAbierta(false); setRecarga(v => v+1);
      setAviso({ ok: true, texto: `PQRF N.º ${data.id} registrada correctamente. Estado: ABIERTA.` });
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
    return () => ctrl.abort();
  }, [detalle?.id, consultarDetalle]);

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
      setUsuarioDestino(""); setMotivoReasignacion(""); setAnalisis(""); setRespuesta(""); setAcciones("");
      setMensajeDetalle(`PQRF N.º ${detalle.id} reasignada correctamente a ${nuevo}.`);
      setRecarga(v => v + 1);
      await consultarDetalle(detalle.id);
    } catch (e) {
      setErrorAccion(e instanceof TypeError ? "No se confirmó la operación. Revise el historial antes de reintentar." : e.message);
    } finally { reasignacionRef.current = false; setProcesando(false); }
  };

  const abrir = (item, tipo) => {
    setDetalle(item); setOrigen(tipo); setGestiones([]); setHistorial([]); setAnalisis(""); setRespuesta(""); setAcciones(""); setErrorAccion(""); setMensajeDetalle(""); setUsuarioDestino(""); setMotivoReasignacion(""); setErrorResponsables("");
  };
  const cerrarModal = () => { if (!procesando) setDetalle(null); };
  const ejecutarAccion = async (accion) => {
    if (!detalle?.id || procesando || respuestaRef.current || cierreRef.current) return;
    if (accion === "responder" && (origen !== "asignadas" || detalle.estado !== "ABIERTA" || !analisis.trim() || !respuesta.trim())) return;
    if (accion === "cerrar" && (origen !== "registradas" || detalle.estado !== "RESPONDIDA" || gestiones.length === 0 || errorDetalle)) return;
    const ref = accion === "responder" ? respuestaRef : cierreRef;
    ref.current = true; setProcesando(true); setErrorAccion(""); setMensajeDetalle("");
    try {
      const body = accion === "responder" ? JSON.stringify({ analisis_gestion: analisis.trim(), respuesta_pqrf: respuesta.trim(), acciones_realizadas: acciones.trim() || null }) : undefined;
      const { data } = await solicitar(`/${detalle.id}/${accion}`, { method: "POST", ...(body ? { body } : {}) });
      const esperado = accion === "responder" ? "RESPONDIDA" : "CERRADA";
      if (Number(data?.id) !== Number(detalle.id) || data?.estado !== esperado) throw new Error("No se confirmó el cambio de estado. Consulte el historial antes de reintentar.");
      setDetalle(v => ({ ...v, estado: esperado }));
      setBandejas(v => Object.fromEntries(Object.entries(v).map(([k, lista]) => [k, lista.map(x => x.id === detalle.id ? { ...x, estado: esperado } : x)])));
      setMensajeDetalle(`PQRF N.º ${detalle.id}: ${esperado}.`);
      setRecarga(v => v+1);
      await consultarDetalle(detalle.id);
    } catch (e) { setErrorAccion(e instanceof TypeError ? "No se confirmó la operación. Revise el historial antes de reintentar." : e.message); }
    finally { ref.current = false; setProcesando(false); }
  };

  const tarjeta = (nombre, valor) => <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs font-semibold text-gray-500">{nombre}</p><p className="mt-1 break-words text-sm text-gray-800">{valor || "—"}</p></div>;

  return <div className="min-h-screen bg-gray-50 p-4 md:p-6"><div className="mx-auto max-w-6xl space-y-6">
    <header className="rounded-xl border bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><ClipboardList className="text-emerald-700" size={36}/><div><h1 className="text-2xl font-bold text-gray-800">PQRF</h1><p className="text-sm text-gray-500">Peticiones, Quejas, Reclamos y Felicitaciones</p></div></div></header>
    <nav className="flex flex-wrap gap-2">{[["nueva", "Nueva PQRF", PlusCircle], ["registradas", "Mis PQRF registradas", FileText], ["asignadas", "PQRF asignadas", Inbox], ["delegadas", "PQRF delegadas", FileText]].map(([id, nombre, Icon]) => <button key={id} type="button" onClick={() => setTab(id)} className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold ${tab === id ? "bg-emerald-700 text-white" : "border bg-white text-gray-700 hover:bg-gray-100"}`}><Icon size={17}/>{nombre}</button>)}</nav>
    {tab === "nueva" && <form onSubmit={registrar} className="rounded-xl border bg-white p-5 shadow-sm md:p-7"><h2 className="mb-5 text-lg font-bold">Registro de PQRF</h2>{cargandoCatalogos && <p className="mb-4 text-sm">Cargando catálogos...</p>}{errorCatalogos && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{errorCatalogos}</p>}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Campo label="Fecha de PQRF"><input className={`${inputClass} bg-gray-100`} type="date" value={fechaLocal()} readOnly /></Campo>
        <Campo label="Usuario que registra"><input className={`${inputClass} bg-gray-100`} value={user?.name || user?.nombre || user?.usuario || "Usuario autenticado"} readOnly /></Campo>
        <Campo label="Tipo de PQRF *"><Selector nombre="un tipo" campo="tipo" opciones={catalogos.tipos} value={form.tipo} onChange={cambiar} disabled={guardando || cargandoCatalogos || !!errorCatalogos}/></Campo>
        <Campo label="Correo del remitente *"><input type="email" maxLength={180} className={inputClass} required disabled={guardando} value={form.correo} onChange={e => cambiar("correo", e.target.value)} placeholder="cliente@ejemplo.com"/></Campo>
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
        <div className="md:col-span-2"><Campo label="Descripción de la PQRF *"><textarea className={inputClass} rows={5} maxLength={20000} required disabled={guardando} value={form.descripcion} onChange={e => cambiar("descripcion", e.target.value)} placeholder="Describa la petición, queja, reclamo o felicitación..."/></Campo></div>
        <Campo label="Proceso que responde PQRF *"><Selector nombre="un proceso" campo="proceso" opciones={catalogos.procesos} value={form.proceso} onChange={cambiar} disabled={guardando || cargandoCatalogos || !!errorCatalogos}/></Campo>
        <Campo label="Correo donde va dirigida la PQRF *"><Selector nombre="un correo" campo="destinatario" opciones={catalogos.correos} etiqueta="correo" value={form.destinatario} onChange={cambiar} disabled={guardando || cargandoCatalogos || !!errorCatalogos}/></Campo>
        <Campo label="Estado inicial"><input className={`${inputClass} bg-gray-100`} value="ABIERTA" readOnly /></Campo>
      </div><div className="mt-7 flex justify-end border-t pt-5"><button disabled={guardando || cargandoCatalogos || !!errorCatalogos} className="flex items-center gap-2 rounded-lg bg-emerald-700 px-6 py-3 font-semibold text-white disabled:opacity-50"><Send size={17}/>{guardando ? "Registrando..." : "Registrar PQRF"}</button></div>
    </form>}
    {["registradas", "asignadas", "delegadas"].includes(tab) && <section className="rounded-xl border bg-white p-5 shadow-sm md:p-7"><div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-lg font-bold">{tab === "registradas" ? "Mis PQRF registradas" : tab === "delegadas" ? "Mis PQRF delegadas" : "Mis PQRF asignadas"}</h2><button type="button" onClick={() => setRecarga(v => v+1)} disabled={cargandoBandeja} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><RefreshCw size={16}/>Actualizar</button></div>{errorBandeja && <p role="alert" className="mb-4 text-red-700">{errorBandeja}</p>}{cargandoBandeja ? <p>Consultando...</p> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-gray-50"><tr>{["N.º", "Fecha", "Cliente", "Tipo", "Proceso", "Responsable", "Estado", "Detalle"].map(t => <th key={t} className="px-3 py-3">{t}</th>)}</tr></thead><tbody className="divide-y">{bandejas[tab].map(item => <tr key={item.id}><td className="px-3 py-3">{item.id}</td><td className="px-3 py-3">{formatoFecha(item.fecha_pqrf)}</td><td className="px-3 py-3">{item.cliente}</td><td className="px-3 py-3">{item.tipo_pqrf}</td><td className="px-3 py-3">{item.proceso}</td><td className="px-3 py-3">{item.usuario_responsable}</td><td className="px-3 py-3 font-semibold">{item.estado}</td><td className="px-3 py-3"><button type="button" onClick={() => abrir(item,tab)} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-emerald-700"><Eye size={16}/>Ver</button></td></tr>)}</tbody></table>{!errorBandeja && bandejas[tab].length === 0 && <p className="py-8 text-center text-gray-500">No hay PQRF para mostrar.</p>}</div>}<div className="mt-5 flex items-center justify-between border-t pt-4"><span className="text-xs text-gray-500">Página {pagina[tab]+1} · {bandejas[tab].length} registro(s)</span><div className="flex gap-2"><button type="button" disabled={cargandoBandeja || pagina[tab]===0} onClick={() => setPagina(v => ({...v,[tab]:v[tab]-1}))} className="flex items-center rounded-lg border px-3 py-2 disabled:opacity-40"><ChevronLeft size={16}/>Anterior</button><button type="button" disabled={cargandoBandeja || !!errorBandeja || bandejas[tab].length < LIMITE} onClick={() => setPagina(v => ({...v,[tab]:v[tab]+1}))} className="flex items-center rounded-lg border px-3 py-2 disabled:opacity-40">Siguiente<ChevronRight size={16}/></button></div></div></section>}
  </div>
  {detalle && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4" onMouseDown={e => { if(e.target===e.currentTarget) cerrarModal(); }}><section role="dialog" aria-modal="true" aria-labelledby="pqrf-titulo" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><h2 id="pqrf-titulo" className="text-xl font-bold">Detalle de PQRF N.º {detalle.id}</h2><button type="button" onClick={cerrarModal} disabled={procesando} aria-label="Cerrar"><X/></button></div><div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">{tarjeta("Fecha", formatoFecha(detalle.fecha_pqrf))}{tarjeta("Estado", detalle.estado)}{tarjeta("Cliente", detalle.cliente)}{tarjeta("Tipo", detalle.tipo_pqrf)}{tarjeta("Remitente", detalle.nombre_remitente)}{tarjeta("Correo remitente", detalle.correo_remitente)}{tarjeta("Proceso", detalle.proceso)}{tarjeta("Correo destinatario", detalle.correo_destinatario)}{tarjeta("Registrado por", detalle.usuario_registro)}{tarjeta("Responsable", detalle.usuario_responsable)}<div className="sm:col-span-2">{tarjeta("Descripción", detalle.descripcion_pqrf)}</div></div>
    <section className="mt-6 border-t pt-5"><h3 className="mb-3 font-bold text-emerald-800">Respuesta y gestión</h3>{cargandoDetalle && <p className="text-sm">Consultando gestión e historial...</p>}{errorDetalle && <p role="alert" className="text-sm text-red-700">{errorDetalle}</p>}{gestiones.map(g => <div key={g.id_gestion} className="mb-3 space-y-2 rounded-lg bg-gray-50 p-4 text-sm"><p><strong>Gestionó:</strong> {g.usuario_gestion} · {formatoMomento(g.fecha_gestion)}</p><p className="whitespace-pre-wrap"><strong>Análisis:</strong> {g.analisis_gestion}</p><p className="whitespace-pre-wrap"><strong>Respuesta:</strong> {g.respuesta_pqrf}</p><p className="whitespace-pre-wrap"><strong>Acciones realizadas:</strong> {g.acciones_realizadas || "—"}</p></div>)}{!cargandoDetalle && !errorDetalle && gestiones.length===0 && <p className="text-sm text-gray-500">Sin respuestas registradas.</p>}</section>
    {origen === "asignadas" && detalle.estado === "ABIERTA" && !mensajeDetalle.includes("reasignada correctamente") && <section className="mt-6 space-y-3 border-t pt-5"><h3 className="font-bold">Responder PQRF</h3><label className="block text-sm font-semibold">Análisis de gestión *<textarea className={`${inputClass} mt-2`} rows={3} maxLength={20000} value={analisis} onChange={e=>setAnalisis(e.target.value)} disabled={procesando}/></label><label className="block text-sm font-semibold">Respuesta PQRF *<textarea className={`${inputClass} mt-2`} rows={3} maxLength={20000} value={respuesta} onChange={e=>setRespuesta(e.target.value)} disabled={procesando}/></label><label className="block text-sm font-semibold">Acciones realizadas (opcional)<textarea className={`${inputClass} mt-2`} rows={3} maxLength={20000} value={acciones} onChange={e=>setAcciones(e.target.value)} disabled={procesando}/></label><button type="button" onClick={() => ejecutarAccion("responder")} disabled={procesando || !analisis.trim() || !respuesta.trim()} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50"><Send size={17}/>{procesando ? "Procesando..." : "Responder PQRF"}</button></section>}
    {detalle.es_gerente_proceso === true && detalle.estado === "ABIERTA" && !mensajeDetalle.includes("reasignada correctamente") && <section className="mt-6 space-y-3 border-t pt-5">
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
    {origen === "registradas" && detalle.estado === "RESPONDIDA" && <section className="mt-6 border-t pt-5"><p className="mb-3 text-sm">Revise la respuesta antes de realizar el cierre definitivo.</p><button type="button" onClick={() => ejecutarAccion("cerrar")} disabled={procesando || cargandoDetalle || !!errorDetalle || gestiones.length===0} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50"><CheckCircle2 size={17}/>{procesando ? "Cerrando..." : "Cerrar PQRF"}</button></section>}
    {mensajeDetalle && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-emerald-800">{mensajeDetalle}</p>}{errorAccion && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">{errorAccion}</p>}
    <section className="mt-6 border-t pt-5"><h3 className="mb-3 font-bold">Historial de movimientos</h3>{historial.map(h => <div key={h.id_historial} className="mb-2 rounded-lg border p-3 text-sm"><p className="font-semibold">{h.tipo_movimiento} · {h.estado_anterior || "Inicio"} → {h.estado_nuevo}</p><p>{h.usuario} · {formatoMomento(h.fecha_movimiento)}</p><p className="text-gray-600">{h.observacion}</p></div>)}</section><button type="button" onClick={cerrarModal} disabled={procesando} className="mt-5 w-full rounded-lg border px-4 py-3 font-semibold disabled:opacity-50">Cerrar detalle</button></section></div>}
  {aviso && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4"><div role="alertdialog" aria-modal="true" className="w-full max-w-md rounded-xl bg-white p-7 text-center shadow-2xl"><CheckCircle2 className={`mx-auto mb-3 ${aviso.ok ? "text-emerald-700" : "text-red-600"}`} size={40}/><h3 className="mb-3 text-lg font-bold">{aviso.ok ? "PQRF registrada" : "No se pudo registrar"}</h3><p className="text-sm">{aviso.texto}</p><button type="button" autoFocus onClick={() => setAviso(null)} className="mt-6 w-full rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white">Entendido</button></div></div>}
  </div>;
}
