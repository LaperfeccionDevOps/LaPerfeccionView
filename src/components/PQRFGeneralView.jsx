import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from "recharts";
import { ClipboardList, Search, RotateCcw, Eye, ChevronLeft, ChevronRight, BarChart3, X, AlertCircle, CalendarDays, RefreshCw } from "lucide-react";
const PAGE_SIZE = 15;
const STATES = [{ key: "", label: "Todas" }, { key: "ABIERTA", label: "Abiertas" }, { key: "RESPONDIDA", label: "Respondidas" }, { key: "CERRADA", label: "Cerradas" }];
const BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/+$/, "");
const ENDPOINT = `${BASE.replace(/\/api$/i, "")}/api/pqrf`;
const card = "rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5";
const text = v => v === null || v === undefined || v === "" ? "—" : String(v).replace(/[\r\n]+/g, " ").trim();
const dateText = v => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
};
const paramsOf = data => {
  const p = new URLSearchParams();
  Object.entries(data).forEach(([k, v]) => { if (v !== "" && v !== null && v !== undefined) p.set(k, String(v)); });
  return `?${p.toString()}`;
};
const getToken = () => {
  for (const key of ["token", "access_token", "accessToken", "authToken", "jwt", "jwtToken"]) {
    const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (!raw) continue;
    try {
      const v = JSON.parse(raw);
      if (typeof v === "string") return v;
      if (v && typeof v === "object") return v.access_token || v.token || v.accessToken || null;
    } catch { return raw; }
  }
  return null;
};
const request = async (path, signal) => {
  const token = getToken();
  const response = await fetch(`${ENDPOINT}${path}`, {
    credentials: "include", signal,
    headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403
    ? `Acceso no autorizado (${response.status}). Verifica la sesión SUPERADMIN.`
    : `Error consultando PQRF (HTTP ${response.status}).`);
  return response.json();
};
// Días calendario inclusivos en la zona horaria de Colombia; no excluye domingos ni festivos.
const fechaColombia = value => {
  if (!value) return null;
  const raw = String(value);
  // Fechas sin zona horaria: el backend PostgreSQL devuelve hora local de Colombia.
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T12:00:00-05:00`
    : /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw) ? raw : `${raw.replace(" ", "T")}-05:00`;
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
};
const diasCalendarioRespuesta = (inicio, fin) => {
  const a = fechaColombia(inicio);
  const b = fechaColombia(fin);
  if (!a || !b) return null;
  const [ya, ma, da] = a.split("-").map(Number);
  const [yb, mb, db] = b.split("-").map(Number);
  const dias = Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86400000) + 1;
  return dias > 0 ? dias : null;
};
const fechaRespuesta = r => r?.fecha_primera_respuesta || r?.fecha_respuesta || r?.fecha_gestion_respuesta || null;
const diasRespuesta = r => {
  if (r?.dias_calendario_respuesta != null) return Number(r.dias_calendario_respuesta);
  return diasCalendarioRespuesta(r?.fecha_creacion || r?.fecha_pqrf, fechaRespuesta(r));
};
const statusClass = state => ({ ABIERTA: "bg-amber-100 text-amber-800", RESPONDIDA: "bg-blue-100 text-blue-800", CERRADA: "bg-emerald-100 text-emerald-800" }[state] || "bg-slate-100 text-slate-700");
export default function PQRFGeneralView() {
  const [search, setSearch] = useState("");
  const [process, setProcess] = useState("");
  const [type, setType] = useState("");
  const [client, setClient] = useState("");
  const [clientQuery, setClientQuery] = useState("");
  const [clientOptions, setClientOptions] = useState([]);
  const [clientCatalog, setClientCatalog] = useState([]);
  const [clientOpen, setClientOpen] = useState(false);
  const [clientLoading, setClientLoading] = useState(false);
  const [clientError, setClientError] = useState("");
  const clientRef = useRef(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [state, setState] = useState("");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [catalogs, setCatalogs] = useState({ processes: [], types: [], clients: [] });
  const [data, setData] = useState({ registros: [], total: 0, paginas: 1 });
  const [indicators, setIndicators] = useState({ total: 0, totales: {}, tipos: [], procesos: [], clientes: [], mensual: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const reload = useCallback(() => setRefresh(n => n + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      request("/catalogos/procesos", controller.signal),
      request("/catalogos/tipos", controller.signal),
    ]).then(([processes, types]) => {
      if (!controller.signal.aborted) setCatalogs({ processes, types, clients: [] });
    }).catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    const common = { busqueda: search.trim(), id_proceso: process, id_tipo: type, id_cliente: client, fecha_desde: from, fecha_hasta: to };
    Promise.all([
      request(`/general${paramsOf({ ...common, estado: state, pagina: page, limite: PAGE_SIZE })}`, controller.signal),
      request(`/general/indicadores${paramsOf(common)}`, controller.signal),
    ]).then(([listing, stats]) => {
      if (!controller.signal.aborted) { setData(listing); setIndicators(stats); }
    }).catch(e => { if (!controller.signal.aborted) setError(e.message || "No fue posible consultar las PQRF."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [search, process, type, client, from, to, state, page, refresh]);
  useEffect(() => {
    if (!selected) { setDetail(null); setDetailError(""); return; }
    const controller = new AbortController();
    setDetail(null); setDetailError(""); setDetailLoading(true);
    request(`/general/${encodeURIComponent(selected.id)}`, controller.signal)
      .then(result => { if (!controller.signal.aborted) setDetail(result); })
      .catch(e => { if (!controller.signal.aborted) setDetailError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setDetailLoading(false); });
    return () => controller.abort();
  }, [selected]);
  // El endpoint devuelve el catálogo completo de clientes activos.
  // Filtrar localmente permite buscar cualquiera, incluso si todavía no tiene PQRF.
  useEffect(() => {
    const controller = new AbortController();
    setClientLoading(true);
    setClientError("");
    request("/general/catalogos/clientes", controller.signal)
      .then(result => {
        if (!Array.isArray(result)) throw new Error("Formato inesperado del catálogo de clientes.");
        if (!controller.signal.aborted) setClientCatalog(result);
      })
      .catch(e => { if (!controller.signal.aborted) setClientError(e.message || "No fue posible cargar los clientes."); })
      .finally(() => { if (!controller.signal.aborted) setClientLoading(false); });
    return () => controller.abort();
  }, [refresh]);
  useEffect(() => {
    const normalize = value => String(value ?? "").normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-CO").trim();
    const query = normalize(clientQuery);
    setClientOptions(clientCatalog.filter(c => normalize(c.nombre).includes(query)).slice(0, 80));
  }, [clientCatalog, clientQuery]);
  useEffect(() => {
    const close = e => {
      if (!clientRef.current?.contains(e.target)) setClientOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  const counts = indicators.totales || {};
  const responseDays = r => {
    const dias = diasRespuesta(r);
    if (dias != null && Number.isFinite(dias)) return `${dias} día(s)`;
    return r?.estado === "ABIERTA" ? "Pendiente" : "Por calcular en API";
  };
  const rows = Array.isArray(data.registros) ? data.registros : [];
  const pages = Math.max(1, Number(data.paginas) || 1);
  const monthly = useMemo(() => (indicators.mensual || []).map(m => ({ mes: m.mes, Abiertas: Number(m.abiertas) || 0, Respondidas: Number(m.respondidas) || 0, Cerradas: Number(m.cerradas) || 0 })), [indicators.mensual]);
  const processes = useMemo(() => (indicators.procesos || []).map(r => ({ nombre: text(r.nombre), total: Number(r.total) || 0 })), [indicators.procesos]);
  const types = useMemo(() => (indicators.tipos || []).map(r => ({ nombre: text(r.nombre), total: Number(r.total) || 0 })), [indicators.tipos]);
  const clients = useMemo(() => (indicators.clientes || []).map(r => ({ nombre: text(r.nombre), total: Number(r.total) || 0 })), [indicators.clientes]);
  const record = detail?.pqrf;
  const managements = Array.isArray(detail?.gestiones) ? detail.gestiones : [];
  const history = Array.isArray(detail?.historial) ? detail.historial : [];
  const primeraGestion = [...managements].filter(g => g.fecha_gestion && String(g.respuesta_pqrf || "").trim())
    .sort((a, b) => new Date(a.fecha_gestion) - new Date(b.fecha_gestion))[0];
  const diasDetalle = record ? (diasRespuesta(record) ?? diasCalendarioRespuesta(record.fecha_creacion || record.fecha_pqrf, primeraGestion?.fecha_gestion)) : null;
  const promedioCalendario = indicators.promedio_dias_calendario_respuesta;
  const reset = () => { setSearch(""); setProcess(""); setType(""); setClient(""); setClientQuery(""); setClientOpen(false); setFrom(""); setTo(""); setState(""); setPage(1); };
  const chart = (items, label) => items.length ? <div style={{ height: Math.max(260, items.length * 38 + 55) }}>
    <ResponsiveContainer width="100%" height="100%"><BarChart data={items} layout="vertical" margin={{ top: 8, right: 22, left: 5, bottom: 8 }}>
      <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" allowDecimals={false} /><YAxis dataKey="nombre" type="category" width={165} tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="total" name={label} fill="#0f766e" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
  </div> : <p className="py-12 text-center text-slate-500">Sin información para graficar.</p>;
  return <div className="w-full max-w-none space-y-5 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
    <header className={card}>
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><ClipboardList className="h-8 w-8 text-emerald-700" /><div><h1 className="text-2xl font-bold text-slate-900">PQRF General</h1><p className="text-sm text-slate-500">Panel gerencial · Superadministrador · QA · Solo lectura</p></div></div><button type="button" onClick={reload} className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm"><RefreshCw size={16} /> Actualizar</button></div>
      {error && <p role="alert" className="mt-3 flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800"><AlertCircle size={18} />{error}</p>}
    </header>
    <section className={card}>
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">Filtros de análisis</h2><button type="button" onClick={reset} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><RotateCcw size={16} /> Limpiar filtros</button></div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <label className="relative"><Search size={17} className="absolute left-3 top-3 text-slate-400" /><input className="w-full rounded-lg border py-2.5 pl-10 pr-3" placeholder="Buscar por N.º PQRF, remitente o usuario" aria-label="Buscar PQRF" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></label>
        <select className="w-full rounded-lg border bg-white px-3 py-2.5" aria-label="Proceso" value={process} onChange={e => { setProcess(e.target.value); setPage(1); }}><option value="">Todos los procesos</option>{catalogs.processes.map(x => <option key={x.id} value={x.id}>{text(x.nombre)}</option>)}</select>
        <select className="w-full rounded-lg border bg-white px-3 py-2.5" aria-label="Tipo PQRF" value={type} onChange={e => { setType(e.target.value); setPage(1); }}><option value="">Todos los tipos</option>{catalogs.types.map(x => <option key={x.id} value={x.id}>{text(x.nombre)}</option>)}</select>
        <div ref={clientRef} className="relative">
          <div className="relative">
            <Search size={17} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              className="w-full rounded-lg border bg-white py-2.5 pl-10 pr-10"
              aria-label="Buscar cliente"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={clientOpen}
              aria-controls="pqrf-general-client-options"
              autoComplete="off"
              placeholder="Buscar y seleccionar cliente de la base de datos"
              value={clientQuery}
              onFocus={() => setClientOpen(true)}
              onChange={e => {
                setClientQuery(e.target.value);
                setClient("");
                setPage(1);
                setClientOpen(true);
              }}
              onKeyDown={e => { if (e.key === "Escape") setClientOpen(false); }}
            />
            {(client || clientQuery) && <button type="button" aria-label="Quitar filtro de cliente" className="absolute right-2 top-2 rounded p-1 text-slate-500 hover:bg-slate-100" onClick={() => { setClient(""); setClientQuery(""); setClientOpen(false); setPage(1); }}><X size={18} /></button>}
          </div>
          {clientOpen && <div id="pqrf-general-client-options" role="listbox" className="absolute left-0 right-0 z-30 mt-1 max-h-60 overflow-y-auto rounded-lg border bg-white py-1 shadow-xl">
            <button type="button" role="option" aria-selected={!client} className="w-full px-3 py-2 text-left text-sm hover:bg-emerald-50" onClick={() => { setClient(""); setClientQuery(""); setClientOpen(false); setPage(1); }}>Todos los clientes</button>
            {clientLoading ? <p className="px-3 py-2 text-sm text-slate-500">Buscando clientes...</p>
              : clientError ? <p role="alert" className="px-3 py-2 text-sm text-red-700">{clientError}</p>
              : clientOptions.length === 0 ? <p className="px-3 py-2 text-sm text-slate-500">No hay coincidencias en el catálogo.</p>
              : clientOptions.map(c => <button type="button" role="option" aria-selected={String(client) === String(c.id)} key={c.id} className="w-full px-3 py-2 text-left text-sm hover:bg-emerald-50" onClick={() => { setClient(String(c.id)); setClientQuery(c.nombre); setClientOpen(false); setPage(1); }}>{text(c.nombre)}</button>)}
          </div>}
        </div>
        <label className="flex items-center gap-2 rounded-lg border px-2"><CalendarDays size={17} className="text-slate-400" /><input type="date" className="min-w-0 w-full py-2.5" aria-label="Fecha desde" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} /></label>
        <label className="flex items-center gap-2 rounded-lg border px-2"><CalendarDays size={17} className="text-slate-400" /><input type="date" className="min-w-0 w-full py-2.5" aria-label="Fecha hasta" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} /></label>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">{[{ label: "Total PQRF", value: indicators.total || 0 }, { label: "Abiertas", value: counts.ABIERTA || 0 }, { label: "Respondidas", value: counts.RESPONDIDA || 0 }, { label: "Cerradas", value: counts.CERRADA || 0 }].map(x => <div key={x.label} className="rounded-xl border bg-slate-50 p-4"><p className="text-xs text-slate-500">{x.label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{x.value}</p></div>)}</div>
      <p className="mt-3 text-sm text-slate-600">Tiempo promedio de respuesta: <strong>{promedioCalendario == null ? "Pendiente de actualización en la API" : `${promedioCalendario} día(s) calendario`}</strong> <span className="text-slate-500">(lunes a domingo, incluidos festivos; día de registro = 1, hora de Colombia).</span></p>
    </section>
    <section className="grid gap-4 xl:grid-cols-2">
      <div className={card}><h3 className="mb-3 flex items-center gap-2 font-bold"><BarChart3 size={18} className="text-emerald-700" /> PQRF por tipo</h3>{chart(types, "PQRF")}</div>
      <div className={card}><h3 className="mb-3 font-bold">PQRF por proceso</h3>{chart(processes, "PQRF")}</div>
      <div className={card}><h3 className="mb-3 font-bold">Clientes con más PQRF</h3>{chart(clients, "PQRF")}</div>
      <div className={card}><h3 className="mb-3 font-bold">Evolución mensual</h3>{monthly.length ? <div className="h-80"><ResponsiveContainer width="100%" height="100%"><LineChart data={monthly}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="mes" /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Line type="monotone" dataKey="Abiertas" stroke="#d97706" strokeWidth={2} /><Line type="monotone" dataKey="Respondidas" stroke="#2563eb" strokeWidth={2} /><Line type="monotone" dataKey="Cerradas" stroke="#059669" strokeWidth={2} /></LineChart></ResponsiveContainer></div> : <p className="py-12 text-center text-slate-500">Sin registros para graficar.</p>}</div>
    </section>
    <section className={card}>
      <h2 className="text-lg font-bold">Bandeja general de PQRF</h2><p className="text-sm text-slate-500">Consulta de todas las PQRF · 15 registros por página · Solo lectura</p>
      <div className="mt-4 flex flex-wrap gap-2">{STATES.map(x => <button key={x.key} type="button" aria-pressed={state === x.key} onClick={() => { setState(x.key); setPage(1); }} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${state === x.key ? "bg-emerald-700 text-white" : "hover:bg-slate-50"}`}>{x.label} ({x.key ? counts[x.key] || 0 : indicators.total || 0})</button>)}</div>
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[1200px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr>{["N.º PQRF", "Tipo", "Cliente", "Proceso", "Registrada por", "Responsable", "Estado", "Fecha", "Días respuesta", "Acción"].map(h => <th key={h} className="border-b px-3 py-3">{h}</th>)}</tr></thead><tbody>{rows.map(r => <tr key={r.id} className="border-b hover:bg-slate-50"><td className="px-3 py-3 font-bold">{r.id}</td><td className="px-3 py-3">{text(r.tipo_pqrf)}</td><td className="px-3 py-3">{text(r.cliente)}</td><td className="px-3 py-3">{text(r.proceso)}</td><td className="px-3 py-3">{text(r.usuario_registro)}</td><td className="px-3 py-3">{text(r.usuario_responsable)}</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(r.estado)}`}>{r.estado}</span></td><td className="px-3 py-3">{dateText(r.fecha_creacion)}</td><td className="px-3 py-3">{responseDays(r)}</td><td className="px-3 py-3"><button type="button" className="flex items-center gap-1 rounded-lg border px-3 py-2 font-semibold" onClick={() => setSelected(r)}><Eye size={15} /> Ver</button></td></tr>)}{!rows.length && <tr><td colSpan={10} className="py-10 text-center text-slate-500">{loading ? "Consultando..." : error ? "Error consultando registros" : "Sin registros para los filtros seleccionados"}</td></tr>}</tbody></table></div>
      <div className="mt-4 flex items-center justify-between gap-3 text-sm"><span>{data.total || 0} registro(s) · Página {Math.min(page, pages)} de {pages}</span><div className="flex items-center gap-2"><button aria-label="Página anterior" disabled={page <= 1 || loading} onClick={() => setPage(p => Math.max(1, p - 1))} className="rounded border px-3 py-2 disabled:opacity-40"><ChevronLeft size={16} /></button>{page}/{pages}<button aria-label="Página siguiente" disabled={page >= pages || loading} onClick={() => setPage(p => Math.min(pages, p + 1))} className="rounded border px-3 py-2 disabled:opacity-40"><ChevronRight size={16} /></button></div></div>
    </section>
    {selected && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onMouseDown={e => { if (e.target === e.currentTarget) setSelected(null); }}><div role="dialog" aria-modal="true" aria-label={`Detalle PQRF ${selected.id}`} className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl md:p-8"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Detalle PQRF N.º {selected.id}</h2><button type="button" aria-label="Cerrar detalle" onClick={() => setSelected(null)}><X size={20} /></button></div>
      {detailLoading && <p className="mt-4 text-sm">Cargando detalle…</p>}{detailError && <p role="alert" className="mt-4 text-sm text-red-700">{detailError}</p>}
      {!detailLoading && !detailError && record && <div className="mt-5 space-y-5 text-sm"><div className="grid gap-3 sm:grid-cols-2"><p><strong>Estado:</strong> {text(record.estado)}</p><p><strong>Tipo:</strong> {text(record.tipo_pqrf)}</p><p><strong>Cliente:</strong> {text(record.cliente)}</p><p><strong>Proceso:</strong> {text(record.proceso)}</p><p><strong>Remitente:</strong> {text(record.nombre_remitente)}</p><p><strong>Correo remitente:</strong> {text(record.correo_remitente)}</p><p><strong>Correo destinatario:</strong> {text(record.correo_destinatario)}</p><p><strong>Registrada por:</strong> {text(record.usuario_registro)}</p><p><strong>Responsable actual:</strong> {text(record.usuario_responsable)}</p><p><strong>Fecha:</strong> {dateText(record.fecha_creacion)}</p><p><strong>Tiempo de respuesta:</strong> {diasDetalle == null ? (record.estado === "ABIERTA" ? "Pendiente" : "Por calcular en API") : `${diasDetalle} día(s) calendario (incluidos domingos y festivos)`}</p></div><section className="rounded-lg bg-slate-50 p-4"><h3 className="font-bold">Descripción de la PQRF</h3><p className="mt-2 whitespace-pre-wrap">{text(record.descripcion_pqrf)}</p></section><section className="rounded-lg border p-4"><h3 className="font-bold">Gestiones y respuestas ({managements.length})</h3>{managements.length ? managements.map((g, i) => <div key={g.id_gestion || i} className="mt-3 rounded-lg bg-slate-50 p-3"><p className="font-semibold">{text(g.usuario_gestion)} · {dateText(g.fecha_gestion)}</p><p className="mt-2"><strong>Análisis:</strong> {text(g.analisis_gestion)}</p><p className="mt-2 whitespace-pre-wrap"><strong>Respuesta:</strong> {text(g.respuesta_pqrf)}</p><p className="mt-2 whitespace-pre-wrap"><strong>Acciones:</strong> {text(g.acciones_realizadas)}</p></div>) : <p className="mt-2 text-slate-500">Sin respuesta registrada.</p>}</section><section className="rounded-lg border p-4"><h3 className="font-bold">Historial de movimientos ({history.length})</h3>{history.length ? <ol className="mt-3 space-y-3">{history.map((h, i) => <li key={h.id_historial || i} className="border-l-2 border-emerald-500 pl-3"><strong>{text(h.tipo_movimiento)}</strong> · {dateText(h.fecha_movimiento)}<p className="text-xs text-slate-600">{text(h.usuario)} · {text(h.estado_anterior)} → {text(h.estado_nuevo)}</p><p className="mt-1 whitespace-pre-wrap">{text(h.observacion)}</p></li>)}</ol> : <p className="mt-2 text-slate-500">Sin historial disponible.</p>}</section></div>}
      <button type="button" onClick={() => setSelected(null)} className="mt-5 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Cerrar</button></div></div>}
  </div>;
}
