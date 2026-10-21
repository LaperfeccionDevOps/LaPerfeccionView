import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from "recharts";
import { ClipboardList, Search, RotateCcw, Eye, ChevronLeft, ChevronRight, BarChart3, X, AlertCircle, CalendarDays, RefreshCw, Clock3 } from "lucide-react";

const PAGE_SIZE = 15;
const TABS = [{key:"ABIERTO",label:"Abiertas"},{key:"RESPONDIDO",label:"Respondidas"},{key:"CERRADO",label:"Cerradas"}];
const BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
const ENDPOINT = `${BASE.replace(/\/api$/i, "")}/api/salidas-no-conformes`;
const getToken = () => {
  for (const key of ["token", "access_token", "accessToken", "authToken", "jwt", "jwtToken"]) {
    const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (!raw) continue;
    try { const v=JSON.parse(raw); if(typeof v === "string")return v; if(v && typeof v === "object")return v.access_token||v.token||v.accessToken||null; }
    catch {return raw;}
  }
  return null;
};
const request = async(path,signal) => {
  const token=getToken();
  const response=await fetch(`${ENDPOINT}${path}`,{credentials:"include",signal,headers:{Accept:"application/json",...(token?{Authorization:`Bearer ${token}`}:{})}});
  if(!response.ok)throw new Error(response.status===401||response.status===403?`Acceso no autorizado (${response.status}). Verifica la sesión SUPERADMIN.`:`Error al consultar SNC (HTTP ${response.status}).`);
  return response.json();
};
const asDate=v=>{const d=v?new Date(v):null;return d&&!Number.isNaN(d.getTime())?d:null;};
const dateText=v=>{const d=asDate(v);return d?d.toLocaleString("es-CO",{dateStyle:"short",timeStyle:"short"}):"—";};
const text=v=>v===null||v===undefined||v===""?"—":String(v);
// Días calendario inclusivos en la zona horaria de Colombia (sin excluir festivos).
// Se comparan fechas civiles, no bloques de 24 horas.
const calendarDay = value => {
  const date = asDate(value);
  if (!date) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(date);
  const part = type => Number(parts.find(item => item.type === type)?.value);
  return Date.UTC(part("year"), part("month") - 1, part("day"));
};
const calendarDaysBetween = (from, to) => {
  const start = calendarDay(from), end = calendarDay(to);
  return start !== null && end !== null && end >= start
    ? Math.round((end - start) / 86400000) + 1 : null;
};
// Si el API entrega únicamente una duración en días, se conserva como respaldo.
const daysValue = value => value === null || value === undefined || value === "" ||
  !Number.isFinite(Number(value)) || Number(value) < 0 ? null : Math.max(1, Math.ceil(Number(value)));
const durationValue = (from, to, days) => calendarDaysBetween(from, to) ?? daysValue(days);
const formatDays = value => value === null || value === undefined ? "—" : `${value} día(s)`;
const durationText = (from, to, days) => formatDays(durationValue(from, to, days));
const stageChart = record => [
  { name: "Hasta respuesta", dias: record.fecha_respuesta ? durationValue(record.fecha_creacion, record.fecha_respuesta, record.dias_hasta_respuesta) : null },
  { name: "Respuesta a cierre", dias: record.fecha_cierre && record.fecha_respuesta ? durationValue(record.fecha_respuesta, record.fecha_cierre, record.dias_hasta_cierre_desde_respuesta) : null }
].filter(stage => stage.dias !== null);
const paramsOf=data=>{const p=new URLSearchParams();Object.entries(data).forEach(([k,v])=>{if(v!==""&&v!==null&&v!==undefined)p.set(k,String(v));});return `?${p}`;};
const card="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5";
export default function SalidasNoConformesGeneralView(){
  const [tab,setTab]=useState("ABIERTO"),[search,setSearch]=useState(""),[area,setArea]=useState(""),[tipo,setTipo]=useState("TODAS");
  const [from,setFrom]=useState(""),[to,setTo]=useState(""),[page,setPage]=useState(1),[refresh,setRefresh]=useState(0);
  const [data,setData]=useState({registros:[],total:0,paginas:1});
  const [indicators,setIndicators]=useState({grupos:[],totales:{},mensual:[],resumen:{},ranking:[],desglose:{}});
  const [loading,setLoading]=useState(true),[error,setError]=useState("");
  const [selected,setSelected]=useState(null),[detail,setDetail]=useState(null),[detailError,setDetailError]=useState(""),[detailLoading,setDetailLoading]=useState(false);
  const [catalogAreas,setCatalogAreas]=useState([]);
  const reload=useCallback(()=>setRefresh(v=>v+1),[]);
  useEffect(()=>{const c=new AbortController();request("/catalogos/areas",c.signal).then(x=>setCatalogAreas(Array.isArray(x)?x:x.areas||x.registros||x.data||[])).catch(()=>{});return ()=>c.abort();},[]);
  useEffect(()=>{
    const c=new AbortController();setLoading(true);setError("");
    const common={busqueda:search.trim(),id_area:area,tipo,fecha_desde:from,fecha_hasta:to};
    Promise.all([request(`/general${paramsOf({...common,estado:tab,pagina:page,limite:PAGE_SIZE})}`,c.signal),request(`/general/indicadores${paramsOf(common)}`,c.signal)])
      .then(([listing,stats])=>{if(!c.signal.aborted){setData(listing);setIndicators(stats);}})
      .catch(e=>{if(!c.signal.aborted)setError(e.message||"Error consultando SNC.");})
      .finally(()=>{if(!c.signal.aborted)setLoading(false);});
    return ()=>c.abort();
  },[tab,search,area,tipo,from,to,page,refresh]);
  useEffect(()=>{
    if(!selected){setDetail(null);setDetailError("");return;}
    const c=new AbortController();setDetail(null);setDetailError("");setDetailLoading(true);
    request(`/general/${encodeURIComponent(selected.id)}`,c.signal).then(x=>{if(!c.signal.aborted)setDetail(x);}).catch(e=>{if(!c.signal.aborted)setDetailError(e.message);}).finally(()=>{if(!c.signal.aborted)setDetailLoading(false);});
    return ()=>c.abort();
  },[selected]);
  const areaOptions=useMemo(()=>catalogAreas.map(a=>({id:String(a.id_area_responsable_snc??a.IdAreaResponsableSNC??a.id??a.IdArea??a.id_area),name:String(a.nombre??a.Nombre??a.area??a.Area??a.nombre_area??a.NombreArea??"")})).filter(a=>a.id!=="undefined"&&a.name).sort((a,b)=>a.name.localeCompare(b.name,"es")),[catalogAreas]);
  const areaName=areaOptions.find(a=>a.id===area)?.name;
  const rows=Array.isArray(data.registros)?data.registros:[];
  const pages=Math.max(1,Number(data.paginas)||1),total=Number(data.total)||0,current=Math.min(page,pages);
  const currentRecord=detail?.snc||selected,answer=detail?.respuesta,history=Array.isArray(detail?.historial)?detail.historial:[];
  const counts=indicators.totales||{},summary=indicators.resumen||{},breakdown=indicators.desglose||{};
  const totalStats=Object.values(counts).reduce((s,v)=>s+(Number(v)||0),0);
  const ranking=(indicators.ranking||[]).map(r=>({...r,emitidas:Number(r.emitidas)||0,recibidas:Number(r.recibidas)||0}));
  const monthly=(indicators.mensual||[]).map(m=>({mes:m.mes,Emitidas:Number(m.emitidas)||0,Recibidas:Number(m.recibidas)||0,Internas:Number(m.internas)||0}));
  const chartStages = currentRecord ? stageChart(currentRecord) : [];
  const reset=()=>{setArea("");setTipo("TODAS");setSearch("");setFrom("");setTo("");setPage(1);};
  const changeArea=id=>{setArea(id);setTipo("TODAS");setPage(1);setSelected(null);};
  const changeTipo=t=>{setTipo(t);setPage(1);};
  const selectRanking = (entry, index) => {
    // Recharts entrega el dato directamente al hacer clic en una barra.
    // En algunas versiones lo anida en `payload`.
    const item = entry?.payload?.area ? entry.payload : entry;
    const target = item?.area ? item : ranking[index];
    if (!target?.area) return;
    const normalize = value => String(value ?? "").trim().toLocaleLowerCase("es");
    const selectedArea = areaOptions.find(option => normalize(option.name) === normalize(target.area));
    if (selectedArea) {
      setError("");
      changeArea(selectedArea.id);
    } else {
      setError(`El área ${target.area} no está disponible en el catálogo para filtrar.`);
    }
  };
  return <div className="w-full max-w-none space-y-5 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
    <header className={card}>
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><ClipboardList className="h-8 w-8 text-emerald-700"/><div><h1 className="text-2xl font-bold text-slate-900">Salidas No Conformes General</h1><p className="text-sm text-slate-500">Indicadores gerenciales · Superadministrador · QA</p></div></div><button type="button" onClick={reload} className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm"><RefreshCw size={16}/> Actualizar</button></div>
      {error&&<p role="alert" className="mt-3 flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800"><AlertCircle size={18}/>{error}</p>}
    </header>
    <section className={card}>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Análisis por área</h2><p className="text-sm text-slate-500">{areaName||"Toda la empresa"} · Emitidas hacia otras áreas / recibidas de otras áreas</p></div><button type="button" onClick={reset} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><RotateCcw size={16}/> Limpiar filtros</button></div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <label className="relative xl:col-span-2"><Search size={17} className="absolute left-3 top-3 text-slate-400"/><input className="w-full rounded-lg border py-2.5 pl-10 pr-3" placeholder="N.º SNC, creador o responsable" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></label>
        <select className="w-full rounded-lg border bg-white px-3 py-2.5" aria-label="Área de trabajo" value={area} onChange={e=>changeArea(e.target.value)}><option value="">Todas las áreas</option>{areaOptions.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <label className="flex items-center gap-2 rounded-lg border px-2"><CalendarDays size={17} className="text-slate-400"/><input type="date" className="min-w-0 w-full py-2.5" aria-label="Fecha desde" value={from} onChange={e=>{setFrom(e.target.value);setPage(1);}}/></label>
        <label className="flex items-center gap-2 rounded-lg border px-2"><CalendarDays size={17} className="text-slate-400"/><input type="date" className="min-w-0 w-full py-2.5" aria-label="Fecha hasta" value={to} onChange={e=>{setTo(e.target.value);setPage(1);}}/></label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Relación entre áreas">{[{id:"TODAS",label:"Todas"},{id:"EMITIDAS",label:"Emitidas"},{id:"RECIBIDAS",label:"Recibidas"},{id:"INTERNAS",label:"Internas"}].map(t=><button key={t.id} type="button" aria-pressed={tipo===t.id} onClick={()=>changeTipo(t.id)} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${tipo===t.id?"border-emerald-700 bg-emerald-700 text-white":"hover:bg-slate-50"}`}>{t.label}</button>)}</div>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">{[{name:"SNC en el filtro",value:totalStats},{name:"Emitidas del área",value:area?breakdown.emitidas:"—"},{name:"Recibidas del área",value:area?breakdown.recibidas:"—"},{name:"Internas del área",value:area?breakdown.internas:"—"}].map(c=><div key={c.name} className="rounded-xl border bg-slate-50 p-4"><div className="text-xs text-slate-500">{c.name}</div><div className="mt-1 text-2xl font-bold text-slate-900">{c.value??0}</div></div>)}</div>
      <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">{TABS.map(t=><span key={t.key}>{t.label}: <strong>{counts[t.key]||0}</strong></span>)}</div>
      {(Number(summary.origen_inferido)>0||Number(summary.origen_sin_parametrizar)>0)&&<p className="mt-3 text-xs text-amber-800">Calidad de datos: {summary.origen_inferido||0} SNC con área de origen inferida del usuario actual; {summary.origen_sin_parametrizar||0} sin área de origen. No se consideran confirmaciones históricas.</p>}
      {area&&Number(breakdown.recibidas_sin_origen)>0&&<p className="mt-2 text-xs text-slate-600">Entre las recibidas hay {breakdown.recibidas_sin_origen} sin origen parametrizado.</p>}
    </section>
    <section className="grid gap-4 xl:grid-cols-2">
      <div className={card}><h3 className="flex items-center gap-2 font-bold"><BarChart3 size={18} className="text-emerald-700"/> Ranking de áreas</h3><p className="mb-4 text-xs text-slate-500">Emitidas y recibidas entre áreas · Ordenado por actividad · Haz clic en una barra para seleccionar su área. El ranking conserva las áreas relacionadas.</p>{ranking.length?<div style={{height:Math.max(300,ranking.length*42+70)}}><ResponsiveContainer width="100%" height="100%"><BarChart layout="vertical" data={ranking} margin={{top:5,right:12,bottom:5,left:5}}><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="area" width={150} tick={{fontSize:10}}/><Tooltip/><Legend/><Bar dataKey="emitidas" name="Emitidas" fill="#0f766e" radius={[0,3,3,0]} cursor="pointer" onClick={selectRanking}/><Bar dataKey="recibidas" name="Recibidas" fill="#2563eb" radius={[0,3,3,0]} cursor="pointer" onClick={selectRanking}/></BarChart></ResponsiveContainer></div>:<p className="py-16 text-center text-slate-500">Sin información disponible.</p>}</div>
      <div className={card}><h3 className="font-bold">Evolución mensual</h3><p className="mb-4 text-xs text-slate-500">Actividad del filtro actual. Emitidas/recibidas son relaciones entre áreas, no SNC únicas.</p>{monthly.length?<div className="h-80"><ResponsiveContainer width="100%" height="100%"><LineChart data={monthly} margin={{top:5,right:20,left:0,bottom:5}}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="mes"/><YAxis allowDecimals={false}/><Tooltip/><Legend/><Line dataKey="Emitidas" type="monotone" stroke="#0f766e" strokeWidth={3}/><Line dataKey="Recibidas" type="monotone" stroke="#2563eb" strokeWidth={3}/><Line dataKey="Internas" type="monotone" stroke="#d97706" strokeWidth={2}/></LineChart></ResponsiveContainer></div>:<p className="py-16 text-center text-slate-500">Sin registros para graficar.</p>}</div>
    </section>
    <section className={card}>
      <h2 className="text-lg font-bold">Bandeja detallada</h2><p className="text-sm text-slate-500">Máximo 15 SNC por página. Filtrada por área, dirección, estado, búsqueda y fechas.</p>
      <div className="mt-4 flex flex-wrap gap-2">{TABS.map(t=><button key={t.key} type="button" aria-pressed={tab===t.key} onClick={()=>{setTab(t.key);setPage(1);}} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${tab===t.key?"bg-emerald-700 text-white":"hover:bg-slate-50"}`}>{t.label} ({counts[t.key]||0})</button>)}</div>
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr>{["N.º SNC","Creada por","Área origen","Área destino","Responsable","Estado","Registro","Días de respuesta","Acción"].map(h=><th key={h} className="border-b px-3 py-3">{h}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id} className="border-b hover:bg-slate-50"><td className="px-3 py-3 font-bold">{r.id}</td><td className="px-3 py-3">{text(r.creado_por)}</td><td className="px-3 py-3">{r.area_origen||"Sin parametrizar"}{r.id_area_origen_snc&&!r.origen_historico_confirmado&&<span className="block text-xs text-amber-700">Inferida</span>}</td><td className="px-3 py-3">{text(r.area_responsable)}</td><td className="px-3 py-3">{text(r.responsable)}</td><td className="px-3 py-3">{text(r.estado)}</td><td className="px-3 py-3">{dateText(r.fecha_creacion)}</td><td className="px-3 py-3">{r.estado === "CERRADO" ? durationText(r.fecha_creacion, r.fecha_cierre, r.dias_totales_cierre) : r.estado === "RESPONDIDO" ? durationText(r.fecha_creacion, r.fecha_respuesta, r.dias_hasta_respuesta) : <span className="text-slate-500">En gestión</span>}</td><td className="px-3 py-3"><button type="button" className="flex items-center gap-1 rounded-lg border px-3 py-2 font-semibold" onClick={()=>setSelected(r)}><Eye size={15}/> Ver</button></td></tr>)}{!rows.length&&<tr><td colSpan={9} className="py-10 text-center text-slate-500">{loading?"Consultando...":error?"Error consultando registros":"Sin registros para los filtros seleccionados"}</td></tr>}</tbody></table></div>
      <div className="mt-4 flex items-center justify-between gap-3 text-sm"><span>{total} registro(s) · Página {current} de {pages}</span><div className="flex items-center gap-2"><button aria-label="Página anterior" disabled={page<=1||loading} onClick={()=>setPage(p=>Math.max(1,p-1))} className="rounded border px-3 py-2 disabled:opacity-40"><ChevronLeft size={16}/></button>{current}/{pages}<button aria-label="Página siguiente" disabled={page>=pages||loading} onClick={()=>setPage(p=>Math.min(pages,p+1))} className="rounded border px-3 py-2 disabled:opacity-40"><ChevronRight size={16}/></button></div></div>
    </section>
    {selected && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onMouseDown={(e)=>{if(e.target===e.currentTarget)setSelected(null)}}><div role="dialog" aria-modal="true" aria-label={`Detalle SNC ${selected.id}`} className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl md:p-8"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">Detalle SNC N.º {selected.id}</h2><button aria-label="Cerrar detalle" onClick={()=>setSelected(null)}><X className="h-5 w-5"/></button></div>{detailLoading && <p className="mt-4 text-sm">Cargando detalle…</p>}{detailError && <p role="alert" className="mt-4 text-sm text-red-700">{detailError}</p>}{!detailLoading && <><div className="mt-5 grid gap-4 text-base sm:grid-cols-2"><p><strong>Creada por:</strong> {text(currentRecord.creado_por)}</p><p><strong>Asignada a:</strong> {text(currentRecord.responsable)}</p><p><strong>Estado:</strong> {text(currentRecord.estado)}</p><p><strong>Área origen:</strong> {text(currentRecord.area_origen || "Origen sin parametrizar")}{currentRecord.id_area_origen_snc && !currentRecord.origen_historico_confirmado ? " (inferida del área actual)" : ""}</p><p><strong>Área destino:</strong> {text(currentRecord.area_responsable)}</p><p><strong>Proceso:</strong> {text(currentRecord.proceso)}</p><p><strong>Registro:</strong> {dateText(currentRecord.fecha_creacion)}</p><p><strong>Respuesta:</strong> {dateText(currentRecord.fecha_respuesta)}</p><p><strong>Cierre:</strong> {dateText(currentRecord.fecha_cierre)}</p></div><div className="mt-5 space-y-4 text-base"><section className="rounded-lg bg-gray-50 p-3"><h3 className="font-semibold">Descripción de la no conformidad</h3><p className="mt-1 whitespace-pre-wrap">{text(currentRecord.descripcion)}</p><h3 className="mt-3 font-semibold">Impacto</h3><p className="mt-1 whitespace-pre-wrap">{text(currentRecord.impacto)}</p></section>{answer && <section className="rounded-lg bg-gray-50 p-3"><h3 className="font-semibold">Análisis de causa</h3><p className="mt-1 whitespace-pre-wrap">{text(answer.analisis_causa)}</p><h3 className="mt-3 font-semibold">Plan de acción</h3><p className="mt-1 whitespace-pre-wrap">{text(answer.plan_accion)}</p><h3 className="mt-3 font-semibold">Observaciones de respuesta</h3><p className="mt-1 whitespace-pre-wrap">{text(answer.observaciones)}</p></section>}<section className="rounded-lg border border-emerald-100 bg-emerald-50 p-3"><h3 className="flex items-center gap-2 font-semibold"><Clock3 className="h-4 w-4"/> Días calendario de gestión</h3><p className="mt-2">{currentRecord.fecha_respuesta ? "Hasta respuesta" : "Días transcurridos sin respuesta"}: <strong>{currentRecord.fecha_respuesta ? durationText(currentRecord.fecha_creacion,currentRecord.fecha_respuesta,currentRecord.dias_hasta_respuesta) : durationText(currentRecord.fecha_creacion,new Date().toISOString(),currentRecord.dias_hasta_respuesta)}</strong></p><p>Respuesta a cierre: <strong>{currentRecord.fecha_cierre && currentRecord.fecha_respuesta ? durationText(currentRecord.fecha_respuesta,currentRecord.fecha_cierre,currentRecord.dias_hasta_cierre_desde_respuesta) : "Pendiente"}</strong></p><p>Tiempo total de cierre: <strong>{currentRecord.fecha_cierre ? durationText(currentRecord.fecha_creacion,currentRecord.fecha_cierre,currentRecord.dias_totales_cierre) : "Pendiente"}</strong></p></section><section className="rounded-lg border p-3"><h3 className="font-semibold">Gráfica de días de esta SNC</h3><p className="mt-1 text-xs text-gray-500">Días calendario de cada etapa completada (incluye fecha inicial y final, sábados, domingos y festivos). No se incluyen etapas pendientes.</p>{chartStages.length ? <div className="mt-3 h-56 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartStages} margin={{top:10,right:20,bottom:5,left:5}}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis type="number" domain={[0, dataMax => Math.max(1, Math.ceil(dataMax * 1.15))]} allowDecimals={false} label={{value:"Días",angle:-90,position:"insideLeft",style:{fontSize:11}}}/><Tooltip formatter={value=>[formatDays(value),"Duración"]}/><Bar dataKey="dias" name="Duración" fill="#059669" radius={[4,4,0,0]} minPointSize={3}/></BarChart></ResponsiveContainer></div> : <p className="mt-2 text-sm text-gray-500">No hay etapas completadas para graficar.</p>}</section><section className="rounded-lg border p-3"><h3 className="font-semibold">Historial de movimientos</h3>{history.length ? <ol className="mt-3 space-y-3">{history.map((h,i)=><li key={i} className="border-l-2 border-emerald-500 pl-3"><strong>{text(h.tipo_accion)}</strong> · {dateText(h.fecha_accion)}<div className="text-xs text-gray-500">{text(h.estado_anterior)} → {text(h.estado_nuevo)}</div><p className="mt-1 whitespace-pre-wrap">{text(h.observacion)}</p></li>)}</ol> : <p className="mt-2 text-gray-500">Sin historial disponible.</p>}</section></div></>}<button type="button" onClick={()=>setSelected(null)} className="mt-5 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Cerrar</button></div></div>}
  </div>;
}
