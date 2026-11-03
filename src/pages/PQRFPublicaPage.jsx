import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, ClipboardList, Info, Loader2, Send } from "lucide-react";

// VITE_API_BASE_URL incluye /api en este proyecto.
const API = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const URL_PUBLICA = `${API}/pqrf-publico`;
const hoyLocal = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const inicial = () => ({ fecha_pqrf: "", id_tipo_pqrf: "", nombre_remitente: "", nombre_cliente_externo: "", correo_respuesta_cliente: "", descripcion_pqrf: "", sitio_web: "" });
const estilo = "w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60";
const etiqueta = "mb-2 block text-sm font-semibold text-slate-700";
const errorTexto = (obj, status) => Array.isArray(obj?.detail) ? obj.detail.map(x => x.msg).join(" · ") : typeof obj?.detail === "string" ? obj.detail : `No fue posible completar la solicitud (HTTP ${status}).`;

export default function PQRFPublicaPage() {
  const [form, setForm] = useState(inicial);
  const [tipos, setTipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [confirmacion, setConfirmacion] = useState(null);
  const enviandoRef = useRef(false);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        if (!API) throw new Error("Falta configurar VITE_API_BASE_URL para el entorno QA.");
        const r = await fetch(`${URL_PUBLICA}/tipos`, { signal: ctrl.signal });
        const datos = await r.json().catch(() => null);
        if (!r.ok) throw new Error(errorTexto(datos, r.status));
        if (!Array.isArray(datos)) throw new Error("El servidor no devolvió los tipos de PQR esperados.");
        if (!ctrl.signal.aborted) setTipos(datos);
      } catch (e) { if (!ctrl.signal.aborted) setError(e.message || "No fue posible cargar los tipos de PQR."); }
      finally { if (!ctrl.signal.aborted) setCargando(false); }
    })();
    return () => ctrl.abort();
  }, []);

  const cambiar = (campo, valor) => setForm(prev => ({ ...prev, [campo]: valor }));
  const registrar = async (e) => {
    e.preventDefault();
    if (enviandoRef.current || cargando || !tipos.length) return;
    setError("");
    if (!form.fecha_pqrf || !form.id_tipo_pqrf || form.nombre_remitente.trim().length < 2 || form.nombre_cliente_externo.trim().length < 2 || !form.correo_respuesta_cliente.trim() || form.descripcion_pqrf.trim().length < 10) {
      setError("Complete todos los campos obligatorios. La descripción debe tener al menos 10 caracteres.");
      return;
    }
    if (form.fecha_pqrf > hoyLocal()) { setError("La fecha de la PQR no puede ser futura."); return; }
    enviandoRef.current = true; setEnviando(true);
    try {
      const body = {
        fecha_pqrf: form.fecha_pqrf,
        id_tipo_pqrf: Number(form.id_tipo_pqrf),
        nombre_remitente: form.nombre_remitente.trim(),
        nombre_cliente_externo: form.nombre_cliente_externo.trim(),
        correo_respuesta_cliente: form.correo_respuesta_cliente.trim(),
        descripcion_pqrf: form.descripcion_pqrf.trim(),
        sitio_web: form.sitio_web,
      };
      const r = await fetch(`${URL_PUBLICA}/registrar`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const datos = await r.json().catch(() => null);
      if (!r.ok) throw new Error(errorTexto(datos, r.status));
      const id = datos?.id ?? datos?.id_pqrf;
      if (r.status !== 201 || !id || datos?.estado !== "ABIERTA") throw new Error("El servidor no confirmó el radicado. Consulte con Calidad antes de volver a enviarlo.");
      setConfirmacion({ id, correo: body.correo_respuesta_cliente });
      setForm(inicial());
    } catch (e) {
      setError(e instanceof TypeError ? "No se pudo confirmar el registro. Antes de reintentar, comuníquese con Calidad para evitar duplicados." : (e.message || "Error inesperado."));
    } finally { enviandoRef.current = false; setEnviando(false); }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:py-12">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="bg-[#173a56] px-6 py-7 text-white md:px-9">
          <div className="flex items-center gap-3"><ClipboardList size={32} /><div><p className="text-xs font-semibold uppercase tracking-widest text-slate-200">Aseos La Perfección</p><h1 className="text-2xl font-bold">Radicación de PQR</h1><p className="mt-1 text-sm text-slate-200">Peticiones, Quejas, Reclamos y Felicitaciones</p></div></div>
        </header>
        <div className="px-6 py-7 md:px-9 md:py-9">
          {confirmacion ? (
            <section role="status" className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto text-emerald-700" size={52} />
              <h2 className="text-2xl font-bold text-slate-800">¡Su PQR fue registrada!</h2>
              <p className="text-slate-600">Conserve este número para cualquier consulta relacionada con su solicitud.</p>
              <div className="rounded-xl border-l-4 border-emerald-700 bg-slate-50 p-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Número de radicado</p><p className="mt-1 text-3xl font-bold text-[#173a56]">PQR N.º {confirmacion.id}</p><p className="mt-2 text-sm text-slate-600">Estado: ABIERTA</p></div>
              <p className="text-sm text-slate-600">La respuesta final se enviará al correo <strong className="break-all">{confirmacion.correo}</strong> una vez finalice la gestión.</p>
              <button type="button" className="rounded-lg bg-emerald-700 px-6 py-3 font-semibold text-white" onClick={() => { setConfirmacion(null); setError(""); }}>Registrar otra PQR</button>
            </section>
          ) : (
            <form onSubmit={registrar} className="space-y-6">
              <div><h2 className="text-xl font-bold text-slate-800">Formulario de solicitud</h2><p className="mt-1 text-sm text-slate-500">Los campos marcados con * son obligatorios.</p></div>
              {error && <div role="alert" className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="shrink-0" size={19}/><span>{error}</span></div>}
              <div><label htmlFor="publica-fecha" className={etiqueta}>Fecha en que ocurrió la PQR *</label><input id="publica-fecha" type="date" lang="es-CO" max={hoyLocal()} className={estilo} value={form.fecha_pqrf} onChange={e => cambiar("fecha_pqrf", e.target.value)} disabled={enviando} required/><p className="mt-2 flex gap-2 text-xs text-slate-600"><Info size={15} className="shrink-0"/>Seleccione la fecha real de la novedad; puede ser anterior al día de registro.</p></div>
              <div><label htmlFor="publica-tipo" className={etiqueta}>Tipo de PQR *</label><select id="publica-tipo" className={estilo} value={form.id_tipo_pqrf} onChange={e => cambiar("id_tipo_pqrf", e.target.value)} disabled={enviando || cargando} required><option value="">{cargando ? "Cargando tipos..." : "Seleccione el tipo de solicitud"}</option>{tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}</select></div>
              <div><label htmlFor="publica-remitente" className={etiqueta}>Nombre de la persona que presenta la PQR *</label><input id="publica-remitente" className={estilo} type="text" maxLength={200} minLength={2} placeholder="Nombre y apellido" value={form.nombre_remitente} onChange={e => cambiar("nombre_remitente", e.target.value)} disabled={enviando} required/></div>
              <div><label htmlFor="publica-cliente" className={etiqueta}>Nombre de la empresa, cliente o sede relacionada *</label><input id="publica-cliente" className={estilo} type="text" maxLength={250} minLength={2} placeholder="Escriba el nombre completo de la empresa o conjunto" value={form.nombre_cliente_externo} onChange={e => cambiar("nombre_cliente_externo", e.target.value)} disabled={enviando} required/><div className="mt-2 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle size={18} className="shrink-0"/><span><strong>¡Atención! Identifique correctamente su empresa.</strong> Escriba el nombre completo de la empresa, conjunto residencial, sede o cliente para facilitar la identificación y gestión de su solicitud.</span></div></div>
              <div><label htmlFor="publica-correo" className={etiqueta}>Correo electrónico para recibir la respuesta *</label><input id="publica-correo" className={estilo} type="email" inputMode="email" autoComplete="email" maxLength={180} placeholder="correo@empresa.com" value={form.correo_respuesta_cliente} onChange={e => cambiar("correo_respuesta_cliente", e.target.value)} disabled={enviando} required/><p className="mt-2 text-xs text-slate-600">A este correo se enviará únicamente la respuesta final cuando Calidad cierre la solicitud.</p></div>
              <div><label htmlFor="publica-descripcion" className={etiqueta}>Descripción de la PQR *</label><textarea id="publica-descripcion" className={estilo} rows={6} minLength={10} maxLength={20000} placeholder="Describa claramente lo ocurrido y la solicitud que desea presentar..." value={form.descripcion_pqrf} onChange={e => cambiar("descripcion_pqrf", e.target.value)} disabled={enviando} required/><p className="mt-2 text-xs text-slate-500">Incluya la información necesaria para comprender y atender su solicitud.</p></div>
              <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true"><label htmlFor="publica-web">Sitio web</label><input id="publica-web" tabIndex={-1} autoComplete="off" value={form.sitio_web} onChange={e => cambiar("sitio_web", e.target.value)} /></div>
              <div className="border-t border-slate-200 pt-5"><button type="submit" disabled={enviando || cargando || !tipos.length} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-3.5 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">{enviando ? <Loader2 size={19} className="animate-spin"/> : <Send size={19}/>}{enviando ? "Enviando solicitud..." : "Enviar y registrar PQR"}</button></div>
            </form>
          )}
        </div>
        <footer className="border-t bg-slate-50 px-6 py-4 text-center text-xs text-slate-500">Aseos La Perfección · Sistema de Gestión PQR</footer>
      </div>
    </main>
  );
}
