import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatearExpedienteDisciplinario } from "@/utils/formatearExpedienteDisciplinario";

const ESTADOS = [
  { value: "", label: "Todos los estados" },
  { value: "PROGRAMADO", label: "Programado" },
  { value: "EN_CURSO", label: "En curso" },
  { value: "REPROGRAMADO", label: "Reprogramado" },
  { value: "ATENDIDO", label: "Atendido" },
  { value: "CANCELADO", label: "Cancelado" },
];

const NOMBRES_DIAS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const NOMBRES_MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || ""
).replace(/\/$/, "");

async function obtenerFestivosPorAnio(anio) {
  const response = await fetch(
    `${API_BASE}/agenda-disciplinaria/festivos/${anio}`
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.detail?.mensaje ||
        data?.detail ||
        "No fue posible consultar los días festivos."
    );
  }

  const posiblesListas = [
    data?.festivos,
    data?.fechas,
    data?.diasFestivos,
    data?.dias_festivos,
    data,
  ];

  const lista = posiblesListas.find(
    (item) => Array.isArray(item)
  );

  if (!Array.isArray(lista)) {
    return [];
  }

  return lista
    .map((item) => {
      if (typeof item === "string") {
        return item.slice(0, 10);
      }

      return String(
        item?.fecha ||
          item?.Fecha ||
          item?.fechaFestivo ||
          item?.FechaFestivo ||
          ""
      ).slice(0, 10);
    })
    .filter(Boolean);
}

async function obtenerAgendaGeneral({
  fechaDesde,
  fechaHasta,
  estado = "",
  buscar = "",
}) {
  if (!API_BASE) {
    throw new Error(
      "No está configurada la URL del backend en VITE_API_BASE_URL."
    );
  }

  if (!fechaDesde || !fechaHasta) {
    throw new Error(
      "Debe indicar la fecha inicial y la fecha final."
    );
  }

  const parametros = new URLSearchParams({
    fecha_desde: fechaDesde,
    fecha_hasta: fechaHasta,
  });

  const estadoNormalizado = String(
    estado || ""
  ).trim();

  const buscarNormalizado = String(
    buscar || ""
  ).trim();

  if (estadoNormalizado) {
    parametros.set(
      "estado",
      estadoNormalizado.toUpperCase()
    );
  }

  if (buscarNormalizado) {
    parametros.set(
      "buscar",
      buscarNormalizado
    );
  }

  const response = await fetch(
    `${API_BASE}/agenda-disciplinaria/general/rango?${parametros.toString()}`
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    const detalle = data?.detail;

    if (typeof detalle === "string") {
      throw new Error(detalle);
    }

    if (
      detalle &&
      typeof detalle === "object"
    ) {
      throw new Error(
        detalle.mensaje ||
          "No fue posible consultar la agenda general."
      );
    }

    throw new Error(
      "No fue posible consultar la agenda general."
    );
  }

  return data;
}

function formatearFechaInput(fecha) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function crearFechaLocal(valor) {
  if (!valor) {
    return null;
  }

  const [year, month, day] = String(valor)
    .slice(0, 10)
    .split("-")
    .map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day, 12, 0, 0);
}

function obtenerRangoSemana(fechaBase = new Date()) {
  const fecha = new Date(fechaBase);
  fecha.setHours(12, 0, 0, 0);

  const diaSemana = fecha.getDay();
  const diferenciaLunes = diaSemana === 0 ? -6 : 1 - diaSemana;

  const lunes = new Date(fecha);
  lunes.setDate(fecha.getDate() + diferenciaLunes);

  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);

  return {
    desde: formatearFechaInput(lunes),
    hasta: formatearFechaInput(domingo),
  };
}

function obtenerRangoMes(fechaBase = new Date()) {
  const fecha = new Date(fechaBase);
  fecha.setHours(12, 0, 0, 0);

  const primero = new Date(
    fecha.getFullYear(),
    fecha.getMonth(),
    1,
    12,
    0,
    0
  );

  const ultimo = new Date(
    fecha.getFullYear(),
    fecha.getMonth() + 1,
    0,
    12,
    0,
    0
  );

  return {
    desde: formatearFechaInput(primero),
    hasta: formatearFechaInput(ultimo),
  };
}

function sumarPeriodo(fechaBase, vista, cantidad) {
  const fecha = new Date(fechaBase);
  fecha.setHours(12, 0, 0, 0);

  if (vista === "MES") {
    fecha.setMonth(fecha.getMonth() + cantidad);
  } else {
    fecha.setDate(fecha.getDate() + cantidad * 7);
  }

  return fecha;
}

function formatearTituloDia(fechaTexto) {
  const fecha = crearFechaLocal(fechaTexto);

  if (!fecha) {
    return fechaTexto || "Fecha sin definir";
  }

  return `${NOMBRES_DIAS[fecha.getDay()]} ${fecha.getDate()} de ${
    NOMBRES_MESES[fecha.getMonth()]
  }`;
}

function formatearPeriodo(fechaDesde, fechaHasta, vista) {
  const desde = crearFechaLocal(fechaDesde);
  const hasta = crearFechaLocal(fechaHasta);

  if (!desde || !hasta) {
    return "Periodo sin definir";
  }

  if (vista === "MES") {
    return `${
      NOMBRES_MESES[desde.getMonth()]
    } de ${desde.getFullYear()}`;
  }

  return `${desde.getDate()} de ${
    NOMBRES_MESES[desde.getMonth()]
  } al ${hasta.getDate()} de ${
    NOMBRES_MESES[hasta.getMonth()]
  } de ${hasta.getFullYear()}`;
}

function formatearHora(valor) {
  if (!valor) {
    return "—";
  }

  const [hora, minuto] = String(valor)
    .slice(0, 5)
    .split(":")
    .map(Number);

  if (Number.isNaN(hora) || Number.isNaN(minuto)) {
    return String(valor);
  }

  const sufijo = hora >= 12 ? "p. m." : "a. m.";
  const hora12 = hora % 12 || 12;

  return `${hora12}:${String(minuto).padStart(2, "0")} ${sufijo}`;
}

function obtenerEstiloEstado(estadoValor) {
  const estado = String(estadoValor || "")
    .trim()
    .toUpperCase();

  if (estado === "PROGRAMADO") {
    return {
      borde: "border-blue-200",
      fondo: "bg-blue-50",
      badge: "bg-blue-100 text-blue-800 border-blue-300",
      punto: "bg-blue-500",
      etiqueta: "Programado",
    };
  }

  if (estado === "EN_CURSO") {
    return {
      borde: "border-amber-200",
      fondo: "bg-amber-50",
      badge: "bg-amber-100 text-amber-800 border-amber-300",
      punto: "bg-amber-500",
      etiqueta: "En curso",
    };
  }

  if (estado === "REPROGRAMADO") {
    return {
      borde: "border-slate-300",
      fondo: "bg-slate-50",
      badge: "bg-slate-100 text-slate-700 border-slate-300",
      punto: "bg-slate-500",
      etiqueta: "Reprogramado",
    };
  }

  if (estado === "ATENDIDO") {
    return {
      borde: "border-emerald-200",
      fondo: "bg-emerald-50",
      badge:
        "bg-emerald-100 text-emerald-800 border-emerald-300",
      punto: "bg-emerald-500",
      etiqueta: "Atendido",
    };
  }

  if (estado === "CANCELADO") {
    return {
      borde: "border-red-200",
      fondo: "bg-red-50",
      badge: "bg-red-100 text-red-800 border-red-300",
      punto: "bg-red-500",
      etiqueta: "Cancelado",
    };
  }

  return {
    borde: "border-gray-200",
    fondo: "bg-white",
    badge: "bg-gray-100 text-gray-700 border-gray-300",
    punto: "bg-gray-400",
    etiqueta: estado || "Sin estado",
  };
}

function procesoEstaCerrado(evento) {
  const estadoProceso = String(
    evento?.EstadoProceso || ""
  )
    .trim()
    .toUpperCase();

  return [
    "CERRADO",
    "FINALIZADO",
  ].includes(estadoProceso);
}

function generarFechasRango(fechaDesde, fechaHasta) {
  const inicio = crearFechaLocal(fechaDesde);
  const fin = crearFechaLocal(fechaHasta);

  if (!inicio || !fin) {
    return [];
  }

  const fechas = [];
  const actual = new Date(inicio);

  while (actual <= fin) {
    fechas.push(formatearFechaInput(actual));
    actual.setDate(actual.getDate() + 1);
  }

  return fechas;
}

function normalizarResumen(resumen = {}) {
  return {
    PROGRAMADO: Number(resumen.PROGRAMADO || 0),
    EN_CURSO: Number(resumen.EN_CURSO || 0),
    REPROGRAMADO: Number(resumen.REPROGRAMADO || 0),
    ATENDIDO: Number(resumen.ATENDIDO || 0),
    CANCELADO: Number(resumen.CANCELADO || 0),
  };
}

export default function AgendaGeneralRRLLView({
  onVolver,
  onAbrirProceso,
}) {
  const rangoInicial = useMemo(
    () => obtenerRangoSemana(new Date()),
    []
  );

  const [vista, setVista] = useState("SEMANA");
  const [fechaBase, setFechaBase] = useState(new Date());
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [estado, setEstado] = useState("");
  const [buscar, setBuscar] = useState("");
  const [buscarAplicado, setBuscarAplicado] = useState("");
  const [eventos, setEventos] = useState([]);
  const [resumenEstados, setResumenEstados] = useState(
    normalizarResumen()
  );
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [festivos, setFestivos] = useState([]);
  const [periodoAplicado, setPeriodoAplicado] = useState(null);
  const [modoBusquedaGeneral, setModoBusquedaGeneral] = useState(false);

  const periodo = useMemo(() => {
    if (!periodoAplicado) {
      return "";
    }

    if (periodoAplicado.tipo === "BUSQUEDA_GENERAL") {
      return `Resultados del año ${periodoAplicado.anio}`;
    }

    return formatearPeriodo(
      periodoAplicado.desde,
      periodoAplicado.hasta,
      periodoAplicado.vista
    );
  }, [periodoAplicado]);

  const fechasPeriodo = useMemo(() => {
    if (!periodoAplicado) {
      return [];
    }

    const festivosSet = new Set(
      festivos.map((fecha) =>
        String(fecha).slice(0, 10)
      )
    );

    const fechasBase =
      periodoAplicado.tipo === "BUSQUEDA_GENERAL"
        ? eventos.map((evento) =>
            String(evento?.FechaEvento || "").slice(0, 10)
          )
        : generarFechasRango(
            periodoAplicado.desde,
            periodoAplicado.hasta
          );

    return Array.from(
      new Set(fechasBase.filter(Boolean))
    )
      .filter((fechaTexto) => {
        const fecha = crearFechaLocal(fechaTexto);

        if (!fecha) {
          return false;
        }

        const diaSemana = fecha.getDay();

        if (diaSemana === 0 || diaSemana === 6) {
          return false;
        }

        return !festivosSet.has(fechaTexto);
      })
      .sort();
  }, [periodoAplicado, festivos, eventos]);

  const eventosPorFecha = useMemo(() => {
    const grupos = {};

    for (const fecha of fechasPeriodo) {
      grupos[fecha] = [];
    }

    for (const evento of eventos) {
      const fecha = String(evento?.FechaEvento || "").slice(0, 10);

      if (!grupos[fecha]) {
        grupos[fecha] = [];
      }

      grupos[fecha].push(evento);
    }

    Object.values(grupos).forEach((grupo) => {
      grupo.sort((a, b) =>
        String(a?.HoraInicio || "").localeCompare(
          String(b?.HoraInicio || "")
        )
      );
    });

    return grupos;
  }, [eventos, fechasPeriodo]);

  const consultarAgenda = async ({
    desde = fechaDesde,
    hasta = fechaHasta,
    estadoConsulta = estado,
    busquedaConsulta = buscar,
    periodoConsulta = null,
  } = {}) => {
    try {
      setLoading(true);
      setError("");

      const fechaInicio = crearFechaLocal(desde);
      const fechaFin = crearFechaLocal(hasta);

      const anios = [];

      if (fechaInicio && fechaFin) {
        for (
          let anio = fechaInicio.getFullYear();
          anio <= fechaFin.getFullYear();
          anio += 1
        ) {
          anios.push(anio);
        }
      }

      const respuestasFestivos = await Promise.all(
        anios.map((anio) =>
          obtenerFestivosPorAnio(anio)
        )
      );

      setFestivos(
        Array.from(
          new Set(
            respuestasFestivos.flat()
          )
        )
      );

      const data = await obtenerAgendaGeneral({
        fechaDesde: desde,
        fechaHasta: hasta,
        estado: estadoConsulta,
        buscar: busquedaConsulta,
      });

      setEventos(
        Array.isArray(data?.eventos)
          ? data.eventos
          : []
      );

      setTotal(Number(data?.total || 0));
      setResumenEstados(
        normalizarResumen(data?.resumenEstados)
      );

      setBuscarAplicado(
        String(busquedaConsulta || "").trim()
      );

      setPeriodoAplicado(
        periodoConsulta || {
          tipo: "RANGO",
          desde,
          hasta,
          vista,
        }
      );
    } catch (err) {
      setEventos([]);
      setTotal(0);
      setResumenEstados(normalizarResumen());
      setError(
        err?.message ||
          "No fue posible consultar la agenda general."
      );
    } finally {
      setLoading(false);
    }
  };

  const aplicarVista = async (nuevaVista, nuevaFechaBase) => {
    const fecha = nuevaFechaBase || new Date();
    const rango =
      nuevaVista === "MES"
        ? obtenerRangoMes(fecha)
        : obtenerRangoSemana(fecha);

    setVista(nuevaVista);
    setFechaBase(fecha);
    setFechaDesde(rango.desde);
    setFechaHasta(rango.hasta);

    setModoBusquedaGeneral(false);

    await consultarAgenda({
      desde: rango.desde,
      hasta: rango.hasta,
      busquedaConsulta: "",
      periodoConsulta: {
        tipo: "RANGO",
        desde: rango.desde,
        hasta: rango.hasta,
        vista: nuevaVista,
      },
    });
  };

  const moverPeriodo = async (cantidad) => {
    const nuevaFecha = sumarPeriodo(
      fechaBase,
      vista,
      cantidad
    );

    await aplicarVista(vista, nuevaFecha);
  };

  const irPeriodoActual = async () => {
    await aplicarVista(vista, new Date());
  };

  const handleConsultar = async () => {
    const busquedaNormalizada = String(
      buscar || ""
    ).trim();

    if (busquedaNormalizada) {
      const fechaReferencia =
        crearFechaLocal(fechaDesde) ||
        new Date();

      const anio = fechaReferencia.getFullYear();

      const desdeAnio = `${anio}-01-01`;
      const hastaAnio = `${anio}-12-31`;

      setModoBusquedaGeneral(true);

      await consultarAgenda({
        desde: desdeAnio,
        hasta: hastaAnio,
        busquedaConsulta: busquedaNormalizada,
        periodoConsulta: {
          tipo: "BUSQUEDA_GENERAL",
          anio,
        },
      });

      return;
    }

    if (!fechaDesde || !fechaHasta) {
      setError(
        "Debe seleccionar la fecha inicial y la fecha final."
      );
      return;
    }

    if (fechaDesde > fechaHasta) {
      setError(
        "La fecha inicial no puede ser mayor que la fecha final."
      );
      return;
    }

    setModoBusquedaGeneral(false);

    await consultarAgenda({
      periodoConsulta: {
        tipo: "RANGO",
        desde: fechaDesde,
        hasta: fechaHasta,
        vista,
      },
    });
  };

  const limpiarFiltros = () => {
    setEstado("");
    setBuscar("");
    setBuscarAplicado("");
    setEventos([]);
    setTotal(0);
    setResumenEstados(normalizarResumen());
    setError("");
    setPeriodoAplicado(null);
    setModoBusquedaGeneral(false);

    setFechaDesde("");
    setFechaHasta("");
  };

  const abrirProceso = (evento) => {
    if (
      !evento?.IdProcesoDisciplinario ||
      typeof onAbrirProceso !== "function"
    ) {
      return;
    }

    onAbrirProceso(
      evento.IdProcesoDisciplinario
    );
  };

  useEffect(() => {
    setPeriodoAplicado(null);
    setFechaDesde("");
    setFechaHasta("");
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-4">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 px-5 py-5 text-white md:px-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">
                  Relaciones Laborales
                </p>

                <h1 className="mt-1 text-2xl font-bold md:text-3xl">
                  Agenda General de Citaciones
                </h1>

                <p className="mt-1 max-w-3xl text-sm text-emerald-50">
                  Consulte la agenda semanal o mensual, encuentre trabajadores y abra cada expediente desde una sola vista.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={onVolver}
                className="w-full rounded-xl border-white/40 bg-white/10 px-4 text-white hover:bg-white hover:text-emerald-800 sm:w-auto"
              >
                Volver a agenda diaria
              </Button>
            </div>
          </div>

          <div className="space-y-4 p-4 md:p-6">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="inline-flex w-full rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:w-auto">
                <button
                  type="button"
                  onClick={() =>
                    aplicarVista("SEMANA", new Date())
                  }
                  className={`flex-1 rounded-lg px-5 py-2.5 text-sm font-bold transition sm:flex-none ${
                    vista === "SEMANA"
                      ? "bg-emerald-700 text-white shadow"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Semana
                </button>

                <button
                  type="button"
                  onClick={() =>
                    aplicarVista("MES", new Date())
                  }
                  className={`flex-1 rounded-lg px-5 py-2.5 text-sm font-bold transition sm:flex-none ${
                    vista === "MES"
                      ? "bg-emerald-700 text-white shadow"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Mes
                </button>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => moverPeriodo(-1)}
                  disabled={loading}
                >
                  Anterior
                </Button>

                <div className="min-w-[280px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-center shadow-sm">
                  {periodoAplicado ? (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {periodoAplicado.tipo === "BUSQUEDA_GENERAL"
                          ? "Búsqueda consultada"
                          : vista === "MES"
                            ? "Mes consultado"
                            : "Semana consultada"}
                      </p>

                      <p className="mt-1 font-bold capitalize text-slate-900">
                        {periodo}
                      </p>
                    </>
                  ) : (
                    <div className="h-[42px]" />
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => moverPeriodo(1)}
                  disabled={loading}
                >
                  Siguiente
                </Button>

                <Button
                  type="button"
                  onClick={irPeriodoActual}
                  disabled={loading}
                  className="bg-emerald-700 hover:bg-emerald-800"
                >
                  {vista === "MES"
                    ? "Este mes"
                    : "Esta semana"}
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1.6fr_0.8fr_0.8fr_0.8fr]">
                <div className="">
                  <label className="text-sm font-semibold text-slate-700">
                    Buscar trabajador o documento
                  </label>

                  <input
                    type="text"
                    value={buscar}
                    onChange={(event) =>
                      setBuscar(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleConsultar();
                      }
                    }}
                    placeholder="Buscar por nombre o número de documento"
                    className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Estado
                  </label>

                  <select
                    value={estado}
                    onChange={(event) =>
                      setEstado(event.target.value)
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    {ESTADOS.map((item) => (
                      <option
                        key={item.value || "TODOS"}
                        value={item.value}
                      >
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Fecha inicial
                  </label>

                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(event) =>
                      setFechaDesde(event.target.value)
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Fecha final
                  </label>

                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(event) =>
                      setFechaHasta(event.target.value)
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={limpiarFiltros}
                  disabled={loading}
                >
                  Limpiar filtros
                </Button>

                <Button
                  type="button"
                  onClick={handleConsultar}
                  disabled={loading}
                  className="bg-emerald-700 hover:bg-emerald-800"
                >
                  {loading
                    ? "Consultando..."
                    : "Consultar agenda"}
                </Button>
              </div>

              {buscarAplicado && !loading && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  <p>
                    Resultados para:{" "}
                    <b>{buscarAplicado}</b>
                  </p>

                  <p className="mt-1 text-xs text-emerald-700">
                    La búsqueda revisó todas las citaciones registradas durante el año consultado.
                  </p>
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <p className="mt-3 text-xs text-slate-500">
                La agenda muestra únicamente días de atención.
                No se visualizan sábados, domingos ni festivos.
                Los viernes se conservan porque pueden tener
                atenciones autorizadas de forma excepcional.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              <ResumenCard
                titulo="Total citas"
                valor={total}
                className="border-slate-200 bg-slate-50 text-slate-800"
                puntoClassName="bg-slate-500"
              />

              <ResumenCard
                titulo="Programadas"
                valor={resumenEstados.PROGRAMADO}
                className="border-blue-200 bg-blue-50 text-blue-800"
                puntoClassName="bg-blue-500"
              />

              <ResumenCard
                titulo="En curso"
                valor={resumenEstados.EN_CURSO}
                className="border-amber-200 bg-amber-50 text-amber-800"
                puntoClassName="bg-amber-500"
              />

              <ResumenCard
                titulo="Reprogramadas"
                valor={resumenEstados.REPROGRAMADO}
                className="border-slate-300 bg-white text-slate-700"
                puntoClassName="bg-slate-500"
              />

              <ResumenCard
                titulo="Atendidas"
                valor={resumenEstados.ATENDIDO}
                className="border-emerald-200 bg-emerald-50 text-emerald-800"
                puntoClassName="bg-emerald-500"
              />

              <ResumenCard
                titulo="Canceladas"
                valor={resumenEstados.CANCELADO}
                className="border-red-200 bg-red-50 text-red-800"
                puntoClassName="bg-red-500"
              />
            </div>
          </div>
        </section>

        <section>
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-lg">
              <p className="font-semibold text-slate-700">
                Cargando agenda general...
              </p>
            </div>
          ) : !periodoAplicado ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <span className="h-4 w-4 rounded-full bg-slate-400" />
              </div>

              <p className="mt-4 text-xl font-bold text-slate-800">
                Seleccione una consulta
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Elija Semana, Mes, seleccione un rango de fechas o busque un trabajador para visualizar la agenda.
              </p>
            </div>
          ) : total === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                <span className="h-4 w-4 rounded-full bg-emerald-500" />
              </div>

              <p className="mt-4 text-xl font-bold text-slate-800">
                {modoBusquedaGeneral
                  ? "No se encontraron citaciones"
                  : "Periodo disponible"}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {modoBusquedaGeneral
                  ? "No existen citaciones registradas para el trabajador o documento consultado durante el año seleccionado."
                  : "No existen citaciones para el periodo consultado. Cambie el periodo o limpie los filtros para realizar una nueva búsqueda."}
              </p>
            </div>
          ) : (
            <div
              className={
                vista === "SEMANA"
                  ? "grid grid-cols-1 gap-5 xl:grid-cols-2"
                  : "grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3"
              }
            >
              {fechasPeriodo.map((fecha) => {
                const citas = eventosPorFecha[fecha] || [];

                if (vista === "MES" && citas.length === 0) {
                  return (
                    <DiaAgenda
                      key={fecha}
                      fecha={fecha}
                      citas={[]}
                      vista={vista}
                      onAbrirProceso={abrirProceso}
                    />
                  );
                }

                if (vista === "SEMANA") {
                  return (
                    <DiaAgenda
                      key={fecha}
                      fecha={fecha}
                      citas={citas}
                      vista={vista}
                      onAbrirProceso={abrirProceso}
                    />
                  );
                }

                return (
                  <DiaAgenda
                    key={fecha}
                    fecha={fecha}
                    citas={citas}
                    vista={vista}
                    onAbrirProceso={abrirProceso}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ResumenCard({
  titulo,
  valor,
  className,
  puntoClassName,
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${puntoClassName}`}
        />

        <p className="text-xs font-bold uppercase tracking-wide opacity-75">
          {titulo}
        </p>
      </div>

      <p className="mt-2 text-3xl font-black">
        {valor}
      </p>
    </div>
  );
}

function DiaAgenda({
  fecha,
  citas,
  vista,
  onAbrirProceso,
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition hover:shadow-lg">
      <header className="border-b border-emerald-200 bg-emerald-50 px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p
              className="text-sm font-bold uppercase tracking-wide text-emerald-800"
            >
              {formatearTituloDia(fecha)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {fecha}
            </p>
          </div>

          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">
            {citas.length}{" "}
            {citas.length === 1 ? "cita" : "citas"}
          </span>
        </div>
      </header>

      <div className="space-y-3 p-4">
        {citas.length === 0 ? (
          <div
            className={`rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 px-4 text-center ${
              vista === "MES"
                ? "py-5"
                : "py-7"
            }`}
          >
            <p className="text-sm font-bold text-emerald-800">
              Día disponible
            </p>

            <p className="mt-1 text-xs text-emerald-700">
              No existen citaciones programadas.
            </p>
          </div>
        ) : (
          citas.map((evento) => (
            <CitaAgenda
              key={
                evento.IdAgendaProcesoDisciplinario
              }
              evento={evento}
              onAbrirProceso={onAbrirProceso}
            />
          ))
        )}
      </div>
    </article>
  );
}

function CitaAgenda({
  evento,
  onAbrirProceso,
}) {
  const estilo = obtenerEstiloEstado(
    evento?.EstadoAgenda
  );

  const cerrado = procesoEstaCerrado(
    evento
  );

  const handleAbrir = () => {
    if (!cerrado) {
      return;
    }

    if (
      typeof onAbrirProceso === "function"
    ) {
      onAbrirProceso(evento);
    }
  };

  return (
    <button
      type="button"
      onClick={handleAbrir}
      disabled={!cerrado}
      aria-disabled={!cerrado}
      title={
        cerrado
          ? "Consultar expediente cerrado"
          : "Los procesos abiertos se gestionan únicamente desde la Agenda Diaria"
      }
      className={`group w-full rounded-2xl border p-4 text-left shadow-sm transition ${estilo.borde} ${estilo.fondo} ${
        cerrado
          ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md"
          : "cursor-not-allowed opacity-90"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="min-w-[105px] rounded-xl border border-white/90 bg-white px-3 py-3 text-center shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Horario
            </p>

            <p className="mt-1 text-sm font-black text-slate-900">
              {formatearHora(evento?.HoraInicio)}
            </p>

            <div className="my-1 h-px bg-slate-200" />

            <p className="text-xs font-bold text-slate-700">
              {formatearHora(evento?.HoraFin)}
            </p>
          </div>

          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-slate-900">
              {evento?.NombreCompleto || "Trabajador sin nombre"}
            </p>

            <div className="mt-2 grid grid-cols-1 gap-1 text-sm text-slate-600 sm:grid-cols-2">
              <p>
                Documento:{" "}
                <b>{evento?.NumeroIdentificacion || "—"}</b>
              </p>

              <p>
                Modalidad:{" "}
                <b>{evento?.Modalidad || "—"}</b>
              </p>
            </div>

            <p className="mt-1 text-sm text-slate-600">
              Expediente:{" "}
              <b>
                {evento?.IdProcesoDisciplinario
                  ? formatearExpedienteDisciplinario(
                      evento.IdProcesoDisciplinario,
                      evento.FechaCreacion ||
                        evento.FechaEvento
                    )
                  : "—"}
              </b>
            </p>

            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                {evento?.TipoEvento || "Citación"}
              </span>

              <span
                className={`rounded-full border px-3 py-1 ${
                  cerrado
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-slate-100 text-slate-600"
                }`}
              >
                {cerrado
                  ? "Expediente cerrado"
                  : "Proceso abierto"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-row items-center justify-between gap-3 lg:flex-col lg:items-end">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${estilo.badge}`}
          >
            <span
              className={`h-2 w-2 rounded-full ${estilo.punto}`}
            />

            {estilo.etiqueta}
          </span>

          {cerrado ? (
            <span className="text-xs font-bold text-emerald-700 transition group-hover:text-emerald-900">
              Consultar expediente
            </span>
          ) : (
            <span className="max-w-[190px] text-right text-xs font-semibold leading-5 text-slate-500">
              Gestión disponible únicamente desde la Agenda Diaria
            </span>
          )}
        </div>
      </div>
    </button>
  );
}