import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatearExpedienteDisciplinario } from "@/utils/formatearExpedienteDisciplinario";

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

function sumarMes(fechaBase, cantidad) {
  const fecha = new Date(fechaBase);

  fecha.setHours(12, 0, 0, 0);
  fecha.setDate(1);
  fecha.setMonth(fecha.getMonth() + cantidad);

  return fecha;
}

function formatearTituloMes(fecha) {
  if (!fecha) {
    return "";
  }

  return `${NOMBRES_MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`;
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

function normalizarResumen(resumen = {}) {
  return {
    PROGRAMADO: Number(resumen.PROGRAMADO || 0),
    EN_CURSO: Number(resumen.EN_CURSO || 0),
    REPROGRAMADO: Number(resumen.REPROGRAMADO || 0),
    ATENDIDO: Number(resumen.ATENDIDO || 0),
    CANCELADO: Number(resumen.CANCELADO || 0),
  };
}

async function obtenerAgendaGeneral({
  fechaDesde,
  fechaHasta,
  buscar = "",
}) {
  if (!API_BASE) {
    throw new Error(
      "No está configurada la URL del backend en VITE_API_BASE_URL."
    );
  }

  const parametros = new URLSearchParams({
    fecha_desde: fechaDesde,
    fecha_hasta: fechaHasta,
  });

  const buscarNormalizado = String(buscar || "").trim();

  if (buscarNormalizado) {
    parametros.set("buscar", buscarNormalizado);
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

    if (detalle && typeof detalle === "object") {
      throw new Error(
        detalle.mensaje ||
          "No fue posible consultar la agenda disciplinaria."
      );
    }

    throw new Error(
      "No fue posible consultar la agenda disciplinaria."
    );
  }

  return data;
}

export default function AgendaDisciplinariaOperacionesView() {
  const [fechaBase, setFechaBase] = useState(new Date());
  const [buscar, setBuscar] = useState("");
  const [buscarAplicado, setBuscarAplicado] = useState("");

  const [eventos, setEventos] = useState([]);
  const [resumenEstados, setResumenEstados] = useState(
    normalizarResumen()
  );

  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const rangoMes = useMemo(
    () => obtenerRangoMes(fechaBase),
    [fechaBase]
  );

  const tituloMes = useMemo(
    () => formatearTituloMes(fechaBase),
    [fechaBase]
  );

  const eventosPorFecha = useMemo(() => {
    const grupos = {};

    eventos.forEach((evento) => {
      const fecha = String(
        evento?.FechaEvento || ""
      ).slice(0, 10);

      if (!fecha) {
        return;
      }

      if (!grupos[fecha]) {
        grupos[fecha] = [];
      }

      grupos[fecha].push(evento);
    });

    Object.values(grupos).forEach((grupo) => {
      grupo.sort((a, b) =>
        String(a?.HoraInicio || "").localeCompare(
          String(b?.HoraInicio || "")
        )
      );
    });

    return grupos;
  }, [eventos]);

  const fechasConEventos = useMemo(() => {
    return Object.keys(eventosPorFecha).sort();
  }, [eventosPorFecha]);

  const consultarAgenda = async ({
    fechaConsulta = fechaBase,
    busquedaConsulta = buscar,
  } = {}) => {
    try {
      setLoading(true);
      setError("");

      const rango = obtenerRangoMes(fechaConsulta);

      const data = await obtenerAgendaGeneral({
        fechaDesde: rango.desde,
        fechaHasta: rango.hasta,
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
    } catch (err) {
      setEventos([]);
      setTotal(0);
      setResumenEstados(normalizarResumen());

      setError(
        err?.message ||
          "No fue posible consultar la agenda disciplinaria."
      );
    } finally {
      setLoading(false);
    }
  };

  const moverMes = async (cantidad) => {
    const nuevaFecha = sumarMes(
      fechaBase,
      cantidad
    );

    setFechaBase(nuevaFecha);

    await consultarAgenda({
      fechaConsulta: nuevaFecha,
      busquedaConsulta: buscar,
    });
  };

  const irMesActual = async () => {
    const hoy = new Date();

    setFechaBase(hoy);

    await consultarAgenda({
      fechaConsulta: hoy,
      busquedaConsulta: buscar,
    });
  };

  const handleConsultar = async () => {
    await consultarAgenda({
      fechaConsulta: fechaBase,
      busquedaConsulta: buscar,
    });
  };

  const limpiarBusqueda = async () => {
    setBuscar("");
    setBuscarAplicado("");

    await consultarAgenda({
      fechaConsulta: fechaBase,
      busquedaConsulta: "",
    });
  };

  useEffect(() => {
    consultarAgenda({
      fechaConsulta: new Date(),
      busquedaConsulta: "",
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-4">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 px-5 py-5 text-white md:px-7">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">
                Operaciones
              </p>

              <h1 className="mt-1 text-2xl font-bold md:text-3xl">
                Agenda Disciplinaria
              </h1>

             <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <p className="max-w-3xl text-sm text-emerald-50">
                    Consulte las citaciones disciplinarias programadas y realice
                    búsquedas por trabajador o número de documento.
                </p>

                <span className="inline-flex w-fit items-center rounded-full border border-white/40 bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                    Solo consulta
                </span>
                </div>
            </div>
          </div>

          <div className="space-y-4 p-4 md:p-6">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 xl:flex-row xl:items-center xl:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => moverMes(-1)}
                disabled={loading}
              >
                Anterior
              </Button>

              <div className="min-w-[280px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-center shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Mes consultado
                </p>

                <p className="mt-1 font-bold capitalize text-slate-900">
                  {tituloMes}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => moverMes(1)}
                  disabled={loading}
                >
                  Siguiente
                </Button>

                <Button
                  type="button"
                  onClick={irMesActual}
                  disabled={loading}
                  className="bg-emerald-700 hover:bg-emerald-800"
                >
                  Este mes
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                <div className="flex-1">
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
                    placeholder="Nombre del trabajador o número de identificación"
                    className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={limpiarBusqueda}
                    disabled={loading}
                  >
                    Limpiar
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
              </div>

              {buscarAplicado && !loading && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Resultados para:{" "}
                  <b>{buscarAplicado}</b>
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <p className="mt-3 text-xs text-slate-500">
                Esta agenda es únicamente informativa. Operaciones
                no puede modificar, cancelar ni reprogramar
                citaciones desde esta vista.
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
                Cargando agenda disciplinaria...
              </p>
            </div>
          ) : total === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                <span className="h-4 w-4 rounded-full bg-emerald-500" />
              </div>

              <p className="mt-4 text-xl font-bold text-slate-800">
                No se encontraron citaciones
              </p>

              <p className="mt-1 text-sm text-slate-500">
                No existen citaciones para el mes o trabajador
                consultado.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {fechasConEventos.map((fecha) => (
                <DiaAgenda
                  key={fecha}
                  fecha={fecha}
                  citas={eventosPorFecha[fecha] || []}
                />
              ))}
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

function DiaAgenda({ fecha, citas }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
      <header className="border-b border-emerald-200 bg-emerald-50 px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-800">
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
        {citas.map((evento) => (
          <CitaAgenda
            key={evento.IdAgendaProcesoDisciplinario}
            evento={evento}
          />
        ))}
      </div>
    </article>
  );
}

function CitaAgenda({ evento }) {
  const estilo = obtenerEstiloEstado(
    evento?.EstadoAgenda
  );

  return (
    <div
      className={`w-full rounded-2xl border p-4 text-left shadow-sm ${estilo.borde} ${estilo.fondo}`}
    >
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[86px_minmax(0,1fr)]">
        <div className="rounded-xl border border-white/90 bg-white px-2 py-3 text-center shadow-sm sm:self-stretch">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Horario
          </p>

          <p className="mt-1 whitespace-nowrap text-[13px] font-black text-slate-900">
            {formatearHora(evento?.HoraInicio)}
          </p>

          <div className="my-1 h-px bg-slate-200" />

          <p className="whitespace-nowrap text-[11px] font-bold text-slate-700">
            {formatearHora(evento?.HoraFin)}
          </p>
        </div>

        <div className="min-w-0">
          <div className="grid min-w-0 grid-cols-1 gap-2 2xl:grid-cols-[minmax(0,1fr)_auto] 2xl:items-start">
            <p className="min-w-0 text-base font-bold leading-5 text-slate-900">
              {evento?.NombreCompleto ||
                "Trabajador sin nombre"}
            </p>

            <span
              className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${estilo.badge}`}
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${estilo.punto}`}
              />

              {estilo.etiqueta}
            </span>
          </div>

          <div className="mt-3 grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(96px,0.8fr)] gap-x-3 gap-y-2 text-sm text-slate-600">
            <div className="min-w-0">
              <span className="block text-xs font-semibold text-slate-500">
                Documento
              </span>

              <b className="block whitespace-nowrap text-slate-800">
                {evento?.NumeroIdentificacion || "—"}
              </b>
            </div>

            <div className="min-w-0">
              <span className="block text-xs font-semibold text-slate-500">
                Modalidad
              </span>

              <b className="block whitespace-nowrap text-slate-800">
                {evento?.Modalidad || "—"}
              </b>
            </div>

            <div className="col-span-2 min-w-0">
              <span className="block text-xs font-semibold text-slate-500">
                Expediente
              </span>

              <b className="block break-words text-slate-800">
                {evento?.IdProcesoDisciplinario
                  ? formatearExpedienteDisciplinario(
                      evento.IdProcesoDisciplinario,
                      evento.FechaCreacion ||
                        evento.FechaEvento
                    )
                  : "—"}
              </b>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">
              {evento?.TipoEvento || "Citación"}
            </span>

            <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-emerald-700">
              Solo consulta
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}