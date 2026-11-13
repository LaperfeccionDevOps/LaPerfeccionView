import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { ClipboardList, Search, RotateCcw, Eye, ChevronLeft, ChevronRight, BarChart3, X, AlertCircle, CalendarDays, RefreshCw, Clock3 } from "lucide-react";

const PAGE_SIZE = 15;
const TABS = [{key:"ABIERTO",label:"Abiertas"},{key:"RESPONDIDO",label:"Respondidas"},{key:"DEVUELTO",label:"Devueltas"},{key:"CERRADO",label:"Cerradas"},{key:"INHABILITADAS",label:"Inhabilitadas"}];
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
// Fecha de novedad: PostgreSQL entrega DATE como YYYY-MM-DD; no convertirla a UTC.
const sncDateText = value => {
  if (!value) return "—";
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : (asDate(value)?.toLocaleDateString("es-CO", {timeZone:"America/Bogota"}) || "—");
};
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
const CHART_STATES = [
  { key: "PENDIENTE", label: "Pendientes de cierre", color: "#dc5252" },
  { key: "CERRADO", label: "Cerradas", color: "#15966b" }
];
const stateBucket = estado => estado === "CERRADO" ? "CERRADO" : "PENDIENTE";
const compactNumber = n => Number(n || 0).toLocaleString("es-CO");
const ChartHover = ({ active, payload, label, bucket }) => {
  if (!active || !payload?.length) return null;
  // Recharts puede enviar las dos series; solo mostrar la barra activa.
  const hovered = payload.find(p => p.dataKey === (bucket === "CERRADO" ? "cerradas" : "pendientes"));
  if (!hovered || !Number(hovered.value)) return null;
  const people = hovered.payload?.detalles?.[bucket] || [];
  return <div className="w-64 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xl">
    <p className="font-semibold text-slate-800">{label}</p>
    <p className="mt-1 font-bold" style={{color:hovered.color}}>{hovered.name}: {compactNumber(hovered.value)}</p>
    <p className="mt-2 text-slate-600">{people.length} responsable(s). Haz clic en esta barra para ver sus nombres y números de SNC debajo.</p>
  </div>;
};
export default function SalidasNoConformesGeneralView(){
  const [tab,setTab]=useState("ABIERTO"),[search,setSearch]=useState(""),[area,setArea]=useState(""),[tipo,setTipo]=useState("TODAS");
  const [from,setFrom]=useState(""),[to,setTo]=useState(""),[page,setPage]=useState(1),[refresh,setRefresh]=useState(0);
  const [data,setData]=useState({registros:[],total:0,paginas:1});
  const [indicators,setIndicators]=useState({grupos:[],totales:{},mensual:[],resumen:{},ranking:[],desglose:{}});
  const [loading,setLoading]=useState(true),[error,setError]=useState("");
  const [selected,setSelected]=useState(null),[detail,setDetail]=useState(null),[detailError,setDetailError]=useState(""),[detailLoading,setDetailLoading]=useState(false);
  const [catalogAreas,setCatalogAreas]=useState([]);
  const [rankingSelection,setRankingSelection]=useState(null);
  const [rankingPage,setRankingPage]=useState(1);
  const [rankingDetail,setRankingDetail]=useState({registros:[],total:0,paginas:1});
  const [rankingLoading,setRankingLoading]=useState(false);
  const [rankingError,setRankingError]=useState("");
  const [now,setNow]=useState(()=>new Date());
  const bogotaMonth = new Intl.DateTimeFormat("en-CA", {timeZone:"America/Bogota",year:"numeric",month:"2-digit"}).format(now).slice(0,7);
   const [chartYear,setChartYear]=useState("TODOS");
   const [chartMonth,setChartMonth]=useState("TODOS");
   const [hoverBucket,setHoverBucket]=useState(null);
   const [chartSelection,setChartSelection]=useState(null);
   const [chartPerson,setChartPerson]=useState(null);
  useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),60000);return ()=>clearInterval(timer);},[]);
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
  useEffect(()=>{
    if (!rankingSelection) {setRankingDetail({registros:[],total:0,paginas:1});setRankingError("");return;}
    const c=new AbortController();
    setRankingLoading(true);setRankingError("");
    request(`/general/ranking-detalle${paramsOf({area:rankingSelection.area,direccion:rankingSelection.direccion,busqueda:search.trim(),fecha_desde:from,fecha_hasta:to,pagina:rankingPage,limite:15})}`,c.signal)
      .then(result=>{if(!c.signal.aborted)setRankingDetail(result);})
      .catch(e=>{if(!c.signal.aborted)setRankingError(e.message||"No fue posible consultar el detalle del ranking.");})
      .finally(()=>{if(!c.signal.aborted)setRankingLoading(false);});
    return ()=>c.abort();
  },[rankingSelection,rankingPage,search,from,to,refresh]);
  useEffect(()=>{setRankingSelection(null);setRankingPage(1);},[search,from,to]);
  const areaOptions=useMemo(()=>catalogAreas.map(a=>({id:String(a.id_area_responsable_snc??a.IdAreaResponsableSNC??a.id??a.IdArea??a.id_area),name:String(a.nombre??a.Nombre??a.area??a.Area??a.nombre_area??a.NombreArea??"")})).filter(a=>a.id!=="undefined"&&a.name).sort((a,b)=>a.name.localeCompare(b.name,"es")),[catalogAreas]);
  const areaName=areaOptions.find(a=>a.id===area)?.name;
  const rows=Array.isArray(data.registros)?data.registros:[];
  const pages=Math.max(1,Number(data.paginas)||1),total=Number(data.total)||0,current=Math.min(page,pages);
  const currentRecord=detail?.snc||selected,answer=detail?.respuesta,history=Array.isArray(detail?.historial)?detail.historial:[];
  const counts=indicators.totales||{},summary=indicators.resumen||{},breakdown=indicators.desglose||{};
  const totalStats=Object.values(counts).reduce((s,v)=>s+(Number(v)||0),0);
  const ranking=(indicators.ranking||[]).map(r=>({...r,emitidas:Number(r.emitidas)||0,recibidas:Number(r.recibidas)||0}));
  const monthly=(indicators.mensual||[]).map(m=>({mes:m.mes,Emitidas:Number(m.emitidas)||0,Recibidas:Number(m.recibidas)||0,Internas:Number(m.internas)||0}));
   const chartRows=Array.isArray(indicators.detalle_graficas)?indicators.detalle_graficas:[];
   const chartYears=useMemo(()=>[...new Set(chartRows.map(r=>String(r.mes||"").slice(0,4)).filter(Boolean))].sort().reverse(),[chartRows]);
   // Al cargar los indicadores, mostrar por defecto el año más reciente disponible.
   useEffect(()=>{
     if(chartYear==="TODOS" && chartYears.length) setChartYear(chartYears[0]);
   },[chartYear,chartYears]);
   const visibleChartRows=chartRows.filter(r=>(chartYear==="TODOS"||String(r.mes).startsWith(chartYear+"-")) && (chartMonth==="TODOS"||String(r.mes).slice(5,7)===chartMonth));
   const chartMonths=(()=>{
     const byMonth=new Map();
     visibleChartRows.forEach(r=>{
       const mes=String(r.mes);
       if(!byMonth.has(mes))byMonth.set(mes,{mes,pendientes:0,cerradas:0,detalles:{PENDIENTE:[],CERRADO:[]}});
       const month=byMonth.get(mes), bucket=stateBucket(r.estado);
       const ids=Array.isArray(r.ids)?r.ids:[];
       const count=Number(r.total)||0;
       if(bucket==="CERRADO")month.cerradas+=count;else month.pendientes+=count;
       const existing=month.detalles[bucket].find(p=>p.nombre===r.responsable);
       if(existing)existing.ids.push(...ids);
       else month.detalles[bucket].push({nombre:r.responsable,ids:[...ids]});
     });
     // Mostrar únicamente los meses transcurridos desde la primera SNC histórica.
     // El día 1 de cada mes (hora Colombia) aparece automáticamente una categoría vacía.
     // No se dibujan meses futuros ni meses anteriores al inicio de los registros.
     const firstMonth = chartRows.map(r=>String(r.mes||"").slice(0,7))
       .filter(m=>/^\d{4}-\d{2}$/.test(m)).sort()[0];
     const years=chartYear==="TODOS" ? chartYears : [chartYear];
     years.forEach(year=>{
       for(let month=1;month<=12;month++){
         const key=`${year}-${String(month).padStart(2,"0")}`;
         if((firstMonth && key<firstMonth) || key>bogotaMonth)continue;
         if(chartMonth!=="TODOS" && key.slice(5,7)!==chartMonth)continue;
         if(!byMonth.has(key))byMonth.set(key,{mes:key,pendientes:0,cerradas:0,detalles:{PENDIENTE:[],CERRADO:[]}});
       }
     });
     return [...byMonth.values()].filter(m=>m.mes<=bogotaMonth && (!firstMonth || m.mes>=firstMonth))
       .sort((a,b)=>a.mes.localeCompare(b.mes));
   })();
   const chartTotal=visibleChartRows.reduce((sum,r)=>sum+(Number(r.total)||0),0);
   const chartClosed=visibleChartRows.filter(r=>r.estado==="CERRADO").reduce((sum,r)=>sum+(Number(r.total)||0),0);
   const chartStateData=[{name:"Pendientes de cierre",value:chartTotal-chartClosed,color:"#dc5252"},{name:"Cerradas",value:chartClosed,color:"#15966b"}];
   const chartPeople=Object.values(visibleChartRows.reduce((acc,r)=>{
     const name=r.responsable||"Sin responsable";
     if(!acc[name])acc[name]={name,value:0,ids:[]};
     acc[name].value+=Number(r.total)||0;
     acc[name].ids.push(...(Array.isArray(r.ids)?r.ids:[]));
     return acc;
   },{})).sort((a,b)=>b.value-a.value);
   const personColors=["#2563eb","#0891b2","#8b5cf6","#e59c32","#14b8a6","#e87979","#64748b","#a855f7"];
   const selectedChartMonth=chartMonths.find(m=>m.mes===chartSelection?.mes);
   const selectedChartPeople=selectedChartMonth?.detalles?.[chartSelection?.bucket]||[];
   const chartStages = currentRecord ? stageChart(currentRecord) : [];
  // La primera respuesta congela el contador, incluso si luego se devuelve o cierra.
  const responseDays = record => durationText(
    record.fecha_creacion,
    record.fecha_respuesta || now,
    record.fecha_respuesta ? record.dias_hasta_respuesta : null
  );
  const reset=()=>{setArea("");setTipo("TODAS");setSearch("");setFrom("");setTo("");setPage(1);};
  const changeArea=id=>{setArea(id);setTipo("TODAS");setPage(1);setSelected(null);};
  const changeTipo=t=>{setTipo(t);setPage(1);};
  const selectRanking = (entry, index, direccion) => {
    const item=entry?.payload?.area?entry.payload:entry;
    const target=item?.area?item:ranking[index];
    if (!target?.area || !direccion) return;
    setRankingSelection({area:target.area,direccion});
    setRankingPage(1);
  };
  const RankingTooltip = ({active,payload}) => {
    if(!active || !payload?.length) return null;
    const r=payload[0]?.payload;
    if(!r) return null;
    return <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <strong className="text-slate-900">{r.area}</strong>
      <p className="mt-1 text-emerald-700">Emitidas: {r.emitidas}</p>
      <p className="text-blue-700">Recibidas: {r.recibidas}</p>
      <p className="mt-1 text-slate-500">Haz clic en una barra para ver los casos.</p>
    </div>;
  };
  return <div className="w-full max-w-none space-y-5 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
    <header className={card}>
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><ClipboardList className="h-8 w-8 text-emerald-700"/><div><h1 className="text-2xl font-bold text-slate-900">Salidas No Conformes General</h1><p className="text-sm text-slate-500">Indicadores gerenciales · Superadministrador</p></div></div><button type="button" onClick={reload} className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm"><RefreshCw size={16}/> Actualizar</button></div>
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
      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        {[{name:"Total SNC",value:totalStats},{name:"Pendientes de cierre",value:Math.max(0,totalStats-(Number(counts.CERRADO)||0))},{name:"Cerradas",value:Number(counts.CERRADO)||0}].map((c,i)=><div key={c.name} className="rounded-xl border bg-slate-50 p-3 sm:p-4"><div className="text-xs text-slate-500">{c.name}</div><div className={`mt-1 text-2xl font-bold ${i===1?"text-red-600":i===2?"text-emerald-700":"text-slate-900"}`}>{compactNumber(c.value)}</div></div>)}
      </div>
      <p className="mt-2 text-xs text-slate-500">Totales de SNC activas según los filtros generales. Pendientes incluye abiertas, en gestión, respondidas y devueltas.</p>
      {(Number(summary.origen_inferido)>0||Number(summary.origen_sin_parametrizar)>0)&&<p className="mt-3 text-xs text-amber-800">Calidad de datos: {summary.origen_inferido||0} SNC con área de origen inferida del usuario actual; {summary.origen_sin_parametrizar||0} sin área de origen. No se consideran confirmaciones históricas.</p>}
      {area&&Number(breakdown.recibidas_sin_origen)>0&&<p className="mt-2 text-xs text-slate-600">Entre las recibidas hay {breakdown.recibidas_sin_origen} sin origen parametrizado.</p>}
    </section>
     <section className={card}>
       <div className="flex flex-wrap items-center justify-between gap-3">
         <div><h2 className="text-lg font-bold text-slate-900">Análisis interactivo por estado y responsable</h2><p className="text-xs text-slate-500">SNC únicas · Estado actual · Se aplican los filtros superiores · Las inhabilitadas no se incluyen</p></div>
         <div className="flex flex-wrap gap-3"><label className="flex items-center gap-2 text-sm">Año
           <select className="rounded-lg border bg-white px-3 py-2" value={chartYear} onChange={e=>{setChartYear(e.target.value);setChartMonth("TODOS");setChartSelection(null);setChartPerson(null);}}>
             <option value="TODOS">Todos los años</option>{chartYears.map(y=><option key={y} value={y}>{y}</option>)}
           </select>
         </label>
         <label className="flex items-center gap-2 text-sm">Mes
           <select className="rounded-lg border bg-white px-3 py-2" value={chartMonth} onChange={e=>{setChartMonth(e.target.value);setChartSelection(null);setChartPerson(null);}}>
             <option value="TODOS">Todos los meses</option>{["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"].map((name,i)=><option key={name} value={String(i+1).padStart(2,"0")}>{name}</option>)}
           </select>
         </label></div>
       </div>
       <p className="mt-4 text-sm font-semibold text-slate-700">Resumen del período seleccionado</p>
       <div className="mt-2 grid grid-cols-3 gap-2 sm:gap-3">
         {[{label:"Total SNC",value:chartTotal},{label:"Pendientes de cierre",value:chartTotal-chartClosed},{label:"Cerradas",value:chartClosed}].map((item,i)=><div key={item.label} className="rounded-xl border bg-slate-50 p-3 sm:p-4"><p className="text-xs text-slate-500">{item.label}</p><p className={`mt-1 text-xl font-bold sm:text-2xl ${i===1?"text-red-600":i===2?"text-emerald-700":"text-slate-900"}`}>{compactNumber(item.value)}</p></div>)}
       </div>
       <div className="mt-5 rounded-xl border p-3 sm:p-5">
         <h3 className="font-bold">Evolución mensual por estado</h3>
         <p className="mt-1 text-xs text-slate-500">Barras verticales. Pasa el mouse para ver responsables y números de SNC; haz clic para mantener el detalle.</p>
         {chartMonths.length?<div className="mt-4 h-80 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartMonths} barCategoryGap="38%" barGap={5} margin={{top:10,right:10,bottom:8,left:0}}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="mes" tick={{fontSize:11}} interval={0} tickFormatter={v=>new Date(Number(v.slice(0,4)),Number(v.slice(5,7))-1,1).toLocaleDateString("es-CO",{month:"short"})}/><YAxis allowDecimals={false}/><Tooltip cursor={{fill:"rgba(148,163,184,0.08)"}} content={<ChartHover bucket={hoverBucket}/>}/><Legend/><Bar maxBarSize={22} dataKey="pendientes" name="Pendientes de cierre" fill="#dc5252" radius={[5,5,0,0]} cursor="pointer" onMouseEnter={()=>setHoverBucket("PENDIENTE")} onClick={item=>setChartSelection({mes:item.mes,bucket:"PENDIENTE"})}/><Bar maxBarSize={22} dataKey="cerradas" name="Cerradas" fill="#15966b" radius={[5,5,0,0]} cursor="pointer" onMouseEnter={()=>setHoverBucket("CERRADO")} onClick={item=>setChartSelection({mes:item.mes,bucket:"CERRADO"})}/></BarChart></ResponsiveContainer></div>:<p className="py-14 text-center text-slate-500">Sin SNC para los filtros seleccionados.</p>}
         {selectedChartMonth&&<div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3"><div className="flex items-center justify-between gap-2"><h4 className="font-bold text-slate-800">{chartSelection.bucket==="CERRADO"?"Cerradas":"Pendientes de cierre"} · {selectedChartMonth.mes}</h4><button type="button" className="rounded border px-2 py-1 text-xs" onClick={()=>setChartSelection(null)}>Cerrar detalle</button></div><div className="mt-2 grid gap-2 sm:grid-cols-2">{selectedChartPeople.map(person=><div key={person.nombre} className="rounded-lg border bg-white p-3"><p className="font-semibold">{person.nombre} · {person.ids.length} caso(s)</p><p className="mt-1 break-words text-xs text-slate-600">SNC: {person.ids.join(", ")}</p></div>)}</div></div>}
       </div>
       <div className="mt-4 grid gap-4 xl:grid-cols-2">
         <div className="rounded-xl border p-3 sm:p-5"><h3 className="font-bold">Distribución por estado</h3><p className="text-xs text-slate-500">Situación actual de las SNC filtradas</p>{chartTotal?<><div className="relative mt-2 h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartStateData} dataKey="value" nameKey="name" innerRadius={67} outerRadius={100} paddingAngle={2}>{chartStateData.map(item=><Cell key={item.name} fill={item.color}/>)}</Pie><Tooltip formatter={(v,n)=>[`${compactNumber(v)} (${(v/chartTotal*100).toFixed(1)}%)`,n]}/></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="text-2xl text-slate-900">{compactNumber(chartTotal)}</strong><span className="text-xs text-slate-500">SNC</span></div></div><div className="flex flex-wrap justify-center gap-4 text-sm">{chartStateData.map(item=><span key={item.name}><span style={{color:item.color}}>●</span> {item.name}: <strong>{compactNumber(item.value)}</strong> ({(item.value/chartTotal*100).toFixed(1)}%)</span>)}</div></>:<p className="py-16 text-center text-slate-500">Sin datos.</p>}</div>
         <div className="rounded-xl border p-3 sm:p-5"><h3 className="font-bold">Participación por responsable</h3><p className="text-xs text-slate-500">Responsables actuales · Selecciona una porción o un nombre</p>{chartTotal?<><div className="relative mt-2 h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartPeople} dataKey="value" nameKey="name" innerRadius={67} outerRadius={100} paddingAngle={2} onClick={item=>setChartPerson(item.name)}>{chartPeople.map((item,i)=><Cell key={item.name} fill={personColors[i%personColors.length]}/>)}</Pie><Tooltip formatter={(v,n)=>[`${compactNumber(v)} (${(v/chartTotal*100).toFixed(1)}%)`,n]}/></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="text-2xl text-slate-900">{compactNumber(chartPerson?chartPeople.find(p=>p.name===chartPerson)?.value:chartTotal)}</strong><span className="max-w-28 text-center text-xs text-slate-500">{chartPerson||"Total SNC"}</span></div></div><div className="max-h-40 space-y-1 overflow-y-auto">{chartPeople.map((person,i)=><button type="button" key={person.name} onClick={()=>setChartPerson(chartPerson===person.name?null:person.name)} className={`flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs hover:bg-slate-50 ${chartPerson===person.name?"bg-blue-50 font-bold":""}`}><span><span style={{color:personColors[i%personColors.length]}}>●</span> {person.name}</span><span>{compactNumber(person.value)} · {(person.value/chartTotal*100).toFixed(1)}%</span></button>)}</div>{chartPerson&&<div className="mt-2 rounded-lg bg-slate-50 p-2 text-xs"><strong>{chartPerson}</strong><p className="mt-1 break-words">SNC: {chartPeople.find(p=>p.name===chartPerson)?.ids.join(", ")}</p></div>}</>:<p className="py-16 text-center text-slate-500">Sin datos.</p>}</div>
       </div>
       <p className="mt-3 text-xs text-slate-500">Pendientes de cierre incluye los estados ABIERTO, EN_GESTION, RESPONDIDO y DEVUELTO. Los detalles corresponden al estado actual, no a movimientos históricos.</p>
     </section>
    <details className={card} open={undefined}>
      <summary className="cursor-pointer font-semibold text-slate-800">Ver ranking de áreas (análisis complementario)</summary>
      <div className="mt-4">
        <h3 className="flex items-center gap-2 font-bold"><BarChart3 size={18} className="text-emerald-700"/> Ranking de áreas</h3>
        <p className="mb-4 text-xs text-slate-500">Pasa el mouse para ver cantidades. Haz clic en una barra verde o azul para consultar sus SNC.</p>
        {ranking.length?<div style={{height:Math.max(300,ranking.length*42+70)}}><ResponsiveContainer width="100%" height="100%"><BarChart layout="vertical" data={ranking} margin={{top:5,right:12,bottom:5,left:5}}><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="area" width={175} tick={{fontSize:11}}/><Tooltip content={<RankingTooltip/>}/><Legend/><Bar dataKey="emitidas" name="Emitidas" fill="#0f766e" radius={[0,3,3,0]} cursor="pointer" onClick={(entry,index)=>selectRanking(entry,index,"EMITIDAS")}/><Bar dataKey="recibidas" name="Recibidas" fill="#2563eb" radius={[0,3,3,0]} cursor="pointer" onClick={(entry,index)=>selectRanking(entry,index,"RECIBIDAS")}/></BarChart></ResponsiveContainer></div>:<p className="py-16 text-center text-slate-500">Sin información disponible.</p>}
        {rankingSelection&&<div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h4 className="font-bold text-slate-900">Detalle de SNC · {rankingSelection.area}</h4><p className="text-sm text-slate-600">{rankingSelection.direccion==="EMITIDAS"?"Emitidas":"Recibidas"} · {rankingDetail.total} caso(s) · Solo registros activos</p></div><button type="button" onClick={()=>setRankingSelection(null)} className="rounded-lg border bg-white px-3 py-2 text-sm">Cerrar detalle</button></div>
          {rankingError&&<p role="alert" className="mt-3 text-sm text-red-700">{rankingError}</p>}
          {rankingLoading?<p className="mt-4 text-sm text-slate-500">Consultando casos…</p>:<div className="mt-3 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-white text-xs uppercase text-slate-600"><tr>{["N.º SNC","Creada por","Área origen","Área destino","Responsable","Estado","Fecha","Acción"].map(h=><th key={h} className="border-b px-3 py-2">{h}</th>)}</tr></thead><tbody>{(rankingDetail.registros||[]).map(r=><tr key={r.id} className="border-b"><td className="px-3 py-2 font-bold">{r.id}</td><td className="px-3 py-2">{text(r.creado_por)}</td><td className="px-3 py-2">{text(r.area_origen)}</td><td className="px-3 py-2">{text(r.area_responsable)}</td><td className="px-3 py-2">{text(r.responsable)}</td><td className="px-3 py-2">{text(r.estado)}</td><td className="px-3 py-2">{dateText(r.fecha_creacion)}</td><td className="px-3 py-2"><button type="button" onClick={()=>setSelected(r)} className="inline-flex items-center gap-1 rounded border bg-white px-2 py-1"><Eye size={14}/> Ver</button></td></tr>)}{!rankingDetail.registros?.length&&<tr><td colSpan={8} className="py-5 text-center text-slate-500">Sin registros para esta barra.</td></tr>}</tbody></table></div>}
          <div className="mt-3 flex items-center justify-end gap-3 text-sm"><button type="button" disabled={rankingPage<=1||rankingLoading} onClick={()=>setRankingPage(v=>Math.max(1,v-1))} className="rounded border bg-white px-3 py-1 disabled:opacity-40">Anterior</button><span>Página {rankingPage} de {rankingDetail.paginas||1}</span><button type="button" disabled={rankingPage>=(rankingDetail.paginas||1)||rankingLoading} onClick={()=>setRankingPage(v=>v+1)} className="rounded border bg-white px-3 py-1 disabled:opacity-40">Siguiente</button></div>
        </div>}
      </div>
    </details>
    <section className={card}>
      <h2 className="text-lg font-bold">Bandeja detallada</h2><p className="text-sm text-slate-500">Máximo 15 SNC por página. Filtrada por área, dirección, estado, búsqueda y fechas.</p>
      <div className="mt-4 flex flex-wrap gap-2">{TABS.map(t=><button key={t.key} type="button" aria-pressed={tab===t.key} onClick={()=>{setTab(t.key);setPage(1);}} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${tab===t.key?"bg-emerald-700 text-white":"hover:bg-slate-50"}`}>{t.label} ({t.key==="INHABILITADAS"?(indicators.inhabilitadas||0):(counts[t.key]||0)})</button>)}</div>
             <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
         <label className="text-sm font-semibold text-slate-700" htmlFor="snc-general-area">Filtrar bandeja por área:</label>
         <select id="snc-general-area" className="min-w-[220px] flex-1 rounded-lg border bg-white px-3 py-2 text-sm" value={area} onChange={e=>changeArea(e.target.value)}>
           <option value="">Todas las áreas</option>{areaOptions.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
         </select>
         <label className="text-sm font-semibold text-slate-700" htmlFor="snc-general-relacion">Relación:</label>
         <select id="snc-general-relacion" className="rounded-lg border bg-white px-3 py-2 text-sm" value={tipo} onChange={e=>changeTipo(e.target.value)}>
           <option value="TODAS">Todas</option><option value="EMITIDAS">Emitidas</option><option value="RECIBIDAS">Recibidas</option><option value="INTERNAS">Internas</option>
         </select>
       </div>
       <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[1150px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-600"><tr>{["N.º SNC","Creada por","Área destino","Responsable","Situación","Fecha de registro de la SNC","Fecha de la Salida No Conforme","Días de respuesta","Acción"].map(h=><th key={h} className="border-b px-3 py-3">{h}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id} className="border-b hover:bg-slate-50"><td className="px-3 py-3 font-bold">{r.id}</td><td className="px-3 py-3">{text(r.creado_por)}</td><td className="px-3 py-3">{text(r.area_responsable)}</td><td className="px-3 py-3">{text(r.responsable)}</td><td className="px-3 py-3"><span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${r.activo===false?"bg-red-100 text-red-800":"bg-emerald-100 text-emerald-800"}`}>{r.activo===false?"Inhabilitada":"Activa"}</span></td><td className="px-3 py-3">{dateText(r.fecha_creacion)}</td><td className="px-3 py-3">{sncDateText(r.fecha_snc)}</td><td className="px-3 py-3 font-semibold">{responseDays(r)}</td><td className="px-3 py-3"><button type="button" className="flex items-center gap-1 rounded-lg border px-3 py-2 font-semibold" onClick={()=>setSelected(r)}><Eye size={15}/> Ver</button></td></tr>)}{!rows.length&&<tr><td colSpan={9} className="py-10 text-center text-slate-500">{loading?"Consultando...":error?"Error consultando registros":"Sin registros para los filtros seleccionados"}</td></tr>}</tbody></table></div><div className="mt-4 flex items-center justify-between gap-3 text-sm"><span>{total} registro(s) · Página {current} de {pages}</span><div className="flex items-center gap-2"><button aria-label="Página anterior" disabled={page<=1||loading} onClick={()=>setPage(p=>Math.max(1,p-1))} className="rounded border px-3 py-2 disabled:opacity-40"><ChevronLeft size={16}/></button>{current}/{pages}<button aria-label="Página siguiente" disabled={page>=pages||loading} onClick={()=>setPage(p=>Math.min(pages,p+1))} className="rounded border px-3 py-2 disabled:opacity-40"><ChevronRight size={16}/></button></div></div>
    </section>
    {selected && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onMouseDown={(e)=>{if(e.target===e.currentTarget)setSelected(null)}}><div role="dialog" aria-modal="true" aria-label={`Detalle SNC ${selected.id}`} className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl md:p-8"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">Detalle SNC N.º {selected.id}</h2><button aria-label="Cerrar detalle" onClick={()=>setSelected(null)}><X className="h-5 w-5"/></button></div>{detailLoading && <p className="mt-4 text-sm">Cargando detalle…</p>}{detailError && <p role="alert" className="mt-4 text-sm text-red-700">{detailError}</p>}{!detailLoading && <><div className="mt-5 grid gap-4 text-base sm:grid-cols-2"><p><strong>Creada por:</strong> {text(currentRecord.creado_por)}</p><p><strong>Asignada a:</strong> {text(currentRecord.responsable)}</p><p><strong>Estado:</strong> {text(currentRecord.estado)} <span className={currentRecord.activo===false?"font-semibold text-red-700":"font-semibold text-emerald-700"}>({currentRecord.activo===false?"Inhabilitada":"Activa"})</span></p><p><strong>Área origen:</strong> {text(currentRecord.area_origen || "Origen sin parametrizar")}{currentRecord.id_area_origen_snc && !currentRecord.origen_historico_confirmado ? " (inferida del área actual)" : ""}</p><p><strong>Área destino:</strong> {text(currentRecord.area_responsable)}</p><p><strong>Proceso:</strong> {text(currentRecord.proceso)}</p><p><strong>Fecha de registro de la SNC:</strong> {dateText(currentRecord.fecha_creacion)}</p><p><strong>Fecha de la Salida No Conforme:</strong> {sncDateText(currentRecord.fecha_snc)}</p><p><strong>Respuesta:</strong> {dateText(currentRecord.fecha_respuesta)}</p><p><strong>Cierre:</strong> {dateText(currentRecord.fecha_cierre)}</p></div><div className="mt-5 space-y-4 text-base"><section className="rounded-lg bg-gray-50 p-3"><h3 className="font-semibold">Descripción de la no conformidad</h3><p className="mt-1 whitespace-pre-wrap">{text(currentRecord.descripcion)}</p><h3 className="mt-3 font-semibold">Impacto</h3><p className="mt-1 whitespace-pre-wrap">{text(currentRecord.impacto)}</p></section>{answer && <section className="rounded-lg bg-gray-50 p-3"><h3 className="font-semibold">Análisis de causa</h3><p className="mt-1 whitespace-pre-wrap">{text(answer.analisis_causa)}</p><h3 className="mt-3 font-semibold">Plan de acción</h3><p className="mt-1 whitespace-pre-wrap">{text(answer.plan_accion)}</p><h3 className="mt-3 font-semibold">Observaciones de respuesta</h3><p className="mt-1 whitespace-pre-wrap">{text(answer.observaciones)}</p></section>}{currentRecord.estado === "DEVUELTO" && (() => { const devoluciones = history.filter(h => h.tipo_accion === "DEVOLUCION"); const ultima = devoluciones[devoluciones.length - 1]; return ultima ? <section className="rounded-lg border border-red-200 bg-red-50 p-3"><h3 className="font-semibold text-red-800">SNC devuelta para corrección</h3><p className="mt-2 text-sm text-red-800"><strong>Motivo de la devolución:</strong> {text(ultima.observacion)}</p><p className="mt-1 text-xs text-red-700">{dateText(ultima.fecha_accion)} · {devoluciones.length} devolución(es) registrada(s)</p></section> : null; })()}<section className="rounded-lg border border-emerald-100 bg-emerald-50 p-3"><h3 className="flex items-center gap-2 font-semibold"><Clock3 className="h-4 w-4"/> Días calendario de gestión</h3><p className="mt-2">{currentRecord.fecha_respuesta ? "Hasta respuesta" : "Días transcurridos sin respuesta"}: <strong>{currentRecord.fecha_respuesta ? durationText(currentRecord.fecha_creacion,currentRecord.fecha_respuesta,currentRecord.dias_hasta_respuesta) : durationText(currentRecord.fecha_creacion,now,null)}</strong></p><p>Respuesta a cierre: <strong>{currentRecord.fecha_cierre && currentRecord.fecha_respuesta ? durationText(currentRecord.fecha_respuesta,currentRecord.fecha_cierre,currentRecord.dias_hasta_cierre_desde_respuesta) : "Pendiente"}</strong></p><p>Tiempo total de cierre: <strong>{currentRecord.fecha_cierre ? durationText(currentRecord.fecha_creacion,currentRecord.fecha_cierre,currentRecord.dias_totales_cierre) : "Pendiente"}</strong></p></section><section className="rounded-lg border p-3"><h3 className="font-semibold">Gráfica de días de esta SNC</h3><p className="mt-1 text-xs text-gray-500">Días calendario de cada etapa completada (incluye fecha inicial y final, sábados, domingos y festivos). No se incluyen etapas pendientes.</p>{chartStages.length ? <div className="mt-3 h-56 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartStages} margin={{top:10,right:20,bottom:5,left:5}}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis type="number" domain={[0, dataMax => Math.max(1, Math.ceil(dataMax * 1.15))]} allowDecimals={false} label={{value:"Días",angle:-90,position:"insideLeft",style:{fontSize:11}}}/><Tooltip formatter={value=>[formatDays(value),"Duración"]}/><Bar dataKey="dias" name="Duración" fill="#059669" radius={[4,4,0,0]} minPointSize={3}/></BarChart></ResponsiveContainer></div> : <p className="mt-2 text-sm text-gray-500">No hay etapas completadas para graficar.</p>}</section><section className="rounded-lg border p-3"><h3 className="font-semibold">Historial de movimientos</h3>{history.length ? <ol className="mt-3 space-y-3">{history.map((h,i)=><li key={i} className="border-l-2 border-emerald-500 pl-3"><strong>{text(h.tipo_accion)}</strong> · {dateText(h.fecha_accion)}<div className="text-xs text-gray-500">{text(h.estado_anterior)} → {text(h.estado_nuevo)}</div><p className="mt-1 whitespace-pre-wrap">{text(h.observacion)}</p></li>)}</ol> : <p className="mt-2 text-gray-500">Sin historial disponible.</p>}</section></div></>}<button type="button" onClick={()=>setSelected(null)} className="mt-5 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Cerrar</button></div></div>}
  </div>;
}
