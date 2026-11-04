import React, { useState } from "react";
import { Search, ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";

const BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/+$/, "").replace(/\/api$/i, "");
const API = `${BASE}/api/salidas-no-conformes`;
const getToken = () => {
  for (const key of ["token", "access_token", "accessToken", "authToken", "jwt", "jwtToken"]) {
    const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (!raw) continue;
    try {
      const value = JSON.parse(raw);
      if (typeof value === "string") return value;
      if (value && typeof value === "object") return value.access_token || value.token || value.accessToken || null;
    } catch { return raw; }
  }
  return null;
};
const apiRequest = async (path, options = {}) => {
  const token = getToken();
  const response = await fetch(`${API}${path}`, {
    credentials: "include", ...options,
    headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  if (!response.ok) {
    let message = `No se pudo completar la solicitud (HTTP ${response.status}).`;
    try { const body = await response.json(); if (typeof body.detail === "string") message = body.detail; } catch { /* sin detalle */ }
    throw new Error(message);
  }
  return response.json();
};

export default function AdministracionSNCView() {
  const [id, setId] = useState("");
  const [registro, setRegistro] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [accion, setAccion] = useState("");
  const [motivo, setMotivo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const consultar = async (numero = id) => {
    const limpio = String(numero).trim();
    if (!/^[1-9]\d*$/.test(limpio)) { setError("Escribe un número de radicado válido."); return; }
    setCargando(true); setError(""); setMensaje(""); setRegistro(null); setDetalle(null); setAccion(""); setMotivo("");
    try {
      const result = await apiRequest(`/general/${encodeURIComponent(limpio)}`);
      const item = result?.snc || result?.registro || result;
      if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("La API no devolvió el detalle del radicado.");
      setRegistro(item); setDetalle(result);
    } catch (e) { setError(e.message || "No se pudo consultar el radicado."); }
    finally { setCargando(false); }
  };
  const activo = registro?.activo ?? registro?.Activo;
  const ejecutar = async () => {
    if (!accion || !motivo.trim() || guardando) return;
    if (!window.confirm(`¿Confirmas ${accion === "inhabilitar" ? "inhabilitar" : "reactivar"} el radicado SNC N.º ${id.trim()}?`)) return;
    setGuardando(true); setError(""); setMensaje("");
    try {
      const result = await apiRequest(`/general/administracion/${encodeURIComponent(id.trim())}/${accion}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ motivo: motivo.trim() }),
      });
      setMensaje(result?.mensaje || "Operación realizada correctamente.");
      setRegistro(previous => previous ? { ...previous, activo: result?.activo } : previous);
      setAccion(""); setMotivo("");
      window.dispatchEvent(new Event("snc-pqrf-actualizadas"));
      // Refrescar el detalle sin perder la confirmación de la operación.
      try { const updated = await apiRequest(`/general/${encodeURIComponent(id.trim())}`); setRegistro(updated?.snc || updated?.registro || updated); setDetalle(updated); }
      catch { /* La API puede ocultar registros inhabilitados; se conserva el resultado confirmado del PATCH. */ }
    } catch (e) { setError(e.message || "No se pudo realizar la operación."); }
    finally { setGuardando(false); }
  };
  return <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6 sm:px-6">
    <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3"><ShieldCheck className="h-8 w-8 text-emerald-700"/><div><h1 className="text-2xl font-bold text-slate-900">Administración de Salidas No Conformes</h1><p className="text-sm text-slate-500">Inhabilitación y reactivación de registros · SuperAdmin</p></div></div>
    </header>
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <label htmlFor="radicado-admin" className="mb-2 block text-sm font-semibold text-slate-800">Número de radicado SNC</label>
      <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); consultar(); }}>
        <input id="radicado-admin" inputMode="numeric" value={id} onChange={e => { setId(e.target.value); setRegistro(null); setDetalle(null); setAccion(""); setMensaje(""); setError(""); }} placeholder="Escribe el número de radicado" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2"/>
        <button type="submit" disabled={cargando || !/^[1-9]\d*$/.test(id.trim())} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50"><Search size={17}/>{cargando ? "Buscando…" : "Buscar"}</button>
      </form>
      {error && <p role="alert" className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800"><AlertCircle size={17}/>{error}</p>}
      {mensaje && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{mensaje}</p>}
    </section>
    {registro && <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold">Detalle SNC N.º {id.trim()}</h2><span className={`rounded-full px-3 py-1 text-xs font-semibold ${activo === false ? "bg-red-100 text-red-800" : activo === true ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{activo === false ? "Inhabilitada" : activo === true ? "Activa" : "Estado de activación no disponible"}</span></div>
      <div className="grid gap-4 rounded-lg border border-slate-100 bg-slate-50/50 p-4 text-sm sm:grid-cols-2">
        <div><p className="text-xs font-semibold text-slate-500">Creado por</p><p className="mt-1 font-medium text-slate-900">{registro.creado_por || "No disponible"}</p></div>
        <div><p className="text-xs font-semibold text-slate-500">Fecha de creación</p><p className="mt-1 text-slate-900">{registro.fecha_creacion ? new Date(registro.fecha_creacion).toLocaleString("es-CO") : "—"}</p></div>
        <div><p className="text-xs font-semibold text-slate-500">Estado de gestión</p><p className="mt-1 font-medium text-slate-900">{registro.estado || "—"}</p></div>
        <div><p className="text-xs font-semibold text-slate-500">Responsable asignado</p><p className="mt-1 text-slate-900">{registro.responsable || "—"}</p></div>
        <div><p className="text-xs font-semibold text-slate-500">Proceso</p><p className="mt-1 text-slate-900">{registro.proceso || "No disponible"}</p></div>
        <div><p className="text-xs font-semibold text-slate-500">Área responsable</p><p className="mt-1 text-slate-900">{registro.area_responsable || "No disponible"}</p></div>
        <div><p className="text-xs font-semibold text-slate-500">Área de origen</p><p className="mt-1 text-slate-900">{registro.area_origen || "No disponible"}</p></div>
        <div><p className="text-xs font-semibold text-slate-500">Fecha de la novedad</p><p className="mt-1 text-slate-900">{registro.fecha_snc ? String(registro.fecha_snc).slice(0, 10) : "—"}</p></div>
      </div>
      <div className="rounded-lg bg-slate-50 p-4"><h3 className="mb-1 font-semibold">Descripción original de la SNC</h3><p className="whitespace-pre-wrap break-words text-sm">{registro.descripcion || "Sin descripción disponible."}</p></div>
      {registro.impacto && <div className="rounded-lg bg-slate-50 p-4"><h3 className="mb-1 font-semibold">Impacto registrado</h3><p className="whitespace-pre-wrap break-words text-sm">{registro.impacto}</p></div>}
      <div className="flex flex-wrap gap-2"><button type="button" disabled={activo !== true || guardando} onClick={() => { setAccion("inhabilitar"); setMotivo(""); }} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Inhabilitar</button><button type="button" disabled={activo !== false || guardando} onClick={() => { setAccion("reactivar"); setMotivo(""); }} className="rounded-lg border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-800 disabled:opacity-40">Reactivar</button><button type="button" onClick={() => consultar()} disabled={cargando || guardando} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><RefreshCw size={15}/> Actualizar detalle</button></div>
      {activo === undefined && <p className="text-sm text-amber-800">El detalle de la API no incluye el campo activo. Se necesita exponerlo en la consulta administrativa para habilitar las acciones con seguridad.</p>}
      {accion && <div className="space-y-3 rounded-lg border border-slate-200 p-4"><h3 className="font-bold">{accion === "inhabilitar" ? "Inhabilitar" : "Reactivar"} SNC N.º {id.trim()}</h3><label htmlFor="motivo-admin" className="block text-sm font-medium">Motivo obligatorio</label><textarea id="motivo-admin" value={motivo} onChange={e => setMotivo(e.target.value)} rows={4} maxLength={2000} className="w-full rounded-lg border border-slate-300 p-3" placeholder="Explica el motivo de esta acción"/><div className="flex justify-end gap-2"><button type="button" onClick={() => setAccion("")} className="rounded-lg border px-4 py-2">Cancelar</button><button type="button" onClick={ejecutar} disabled={!motivo.trim() || guardando} className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{guardando ? "Procesando…" : "Confirmar acción"}</button></div></div>}
      {Array.isArray(detalle?.historial) && <div className="border-t pt-4"><h3 className="mb-2 font-bold">Historial de movimientos</h3><div className="space-y-2">{detalle.historial.map((h, i) => <div key={i} className="rounded-lg bg-slate-50 p-3 text-sm"><strong>{h.tipo_movimiento || h.tipo_accion || "Movimiento"}</strong><p className="mt-1 whitespace-pre-wrap break-words">{h.observacion || "Sin observaciones"}</p>{(h.usuario || h.fecha_accion) && <p className="mt-1 text-xs text-slate-500">{[h.usuario, h.fecha_accion ? new Date(h.fecha_accion).toLocaleString("es-CO") : null].filter(Boolean).join(" · ")}</p>}</div>)}</div></div>}
    </section>}
  </div>;
}
