import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";


function formatearFecha(fecha) {
  if (!fecha) {
    return "-";
  }

  const soloFecha = String(fecha).substring(0, 10);

  const partes = soloFecha.split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


function formatearPorcentaje(valor) {
  const numero = Number(valor || 0);

  return `${numero.toFixed(2).replace(".", ",")} %`;
}


function formatearFechaHora(fecha) {
  if (!fecha) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Bogota",
    }).format(new Date(fecha));
  } catch {
    return String(fecha);
  }
}


export default function IndicadoresProcesosDisciplinariosView({
  onBack,
}) {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const [gestionMensual, setGestionMensual] = useState(null);
  const [analisisMes, setAnalisisMes] = useState("");
  const [planAccion, setPlanAccion] = useState("");
  const [analisisGuardado, setAnalisisGuardado] = useState("");
  const [planAccionGuardado, setPlanAccionGuardado] = useState("");
  const [calificacionMensual, setCalificacionMensual] = useState("");
  const [calificacionGuardada, setCalificacionGuardada] = useState("");
  const [cargandoGestion, setCargandoGestion] = useState(false);
  const [guardandoGestion, setGuardandoGestion] = useState(false);
  const [guardandoCalificacion, setGuardandoCalificacion] = useState(false);
  const [errorGestion, setErrorGestion] = useState("");
  const [mensajeGestion, setMensajeGestion] = useState("");

  const [paginaDetalle, setPaginaDetalle] = useState(1);
  const registrosPorPagina = 10;


  const apiBaseUrl = useMemo(() => {
    const url =
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_API_URL ||
      "";

    return String(url).replace(/\/$/, "");
  }, []);


  const periodoMensualSeleccionado = useMemo(() => {
    if (!fechaInicio || !fechaFin) {
      return null;
    }

    const periodoInicio = String(fechaInicio).substring(0, 7);
    const periodoFin = String(fechaFin).substring(0, 7);

    if (
      periodoInicio.length !== 7 ||
      periodoFin.length !== 7 ||
      periodoInicio !== periodoFin
    ) {
      return null;
    }

    const [anioTexto, mesTexto] = periodoInicio.split("-");

    const anio = Number(anioTexto);
    const mes = Number(mesTexto);

    if (!anio || !mes || mes < 1 || mes > 12) {
      return null;
    }

    return {
      anio,
      mes,
    };
  }, [fechaInicio, fechaFin]);


  const obtenerBaseApi = () => (
    apiBaseUrl.endsWith("/api")
      ? apiBaseUrl
      : `${apiBaseUrl}/api`
  );


  const limpiarGestionMensual = () => {
    setGestionMensual(null);
    setAnalisisMes("");
    setPlanAccion("");
    setAnalisisGuardado("");
    setPlanAccionGuardado("");
    setCalificacionMensual("");
    setCalificacionGuardada("");
    setErrorGestion("");
    setMensajeGestion("");
  };


  const consultarGestionMensual = async (periodo) => {
    if (!periodo) {
      limpiarGestionMensual();
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setGestionMensual(null);
      setAnalisisMes("");
      setPlanAccion("");
      setErrorGestion(
        "No fue posible consultar la gestión mensual porque no se encontró la sesión autenticada."
      );
      return;
    }

    setCargandoGestion(true);
    setErrorGestion("");
    setMensajeGestion("");

    try {
      const url =
        `${obtenerBaseApi()}` +
        `/gestion-mensual-indicadores` +
        `/RRLL_PROCESOS_DISCIPLINARIOS` +
        `/KPI3` +
        `/${periodo.anio}` +
        `/${periodo.mes}`;

      const respuesta = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const resultado = await respuesta
        .json()
        .catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          resultado?.detail ||
            "No fue posible consultar la gestión mensual del indicador."
        );
      }

      const analisisCargado =
        resultado?.gestionMensual?.analisisMes || "";

      const planCargado =
        resultado?.gestionMensual?.planAccion || "";

      const calificacionCargada =
        resultado?.gestionMensual?.calificacionMensual;

      const calificacionTexto =
        calificacionCargada !== null &&
        calificacionCargada !== undefined
          ? String(calificacionCargada)
          : "";

      setGestionMensual(resultado);

      setAnalisisMes(analisisCargado);
      setPlanAccion(planCargado);
      setCalificacionMensual(calificacionTexto);

      setAnalisisGuardado(analisisCargado);
      setPlanAccionGuardado(planCargado);
      setCalificacionGuardada(calificacionTexto);
    } catch (err) {
      console.error(
        "Error consultando gestión mensual del indicador:",
        err
      );

      setGestionMensual(null);
      setAnalisisMes("");
      setPlanAccion("");
      setAnalisisGuardado("");
      setPlanAccionGuardado("");
      setCalificacionMensual("");
      setCalificacionGuardada("");

      setErrorGestion(
        err?.message ||
          "No fue posible consultar la gestión mensual del indicador."
      );
    } finally {
      setCargandoGestion(false);
    }
  };


  const guardarCamposGestionMensual = async (
    campos,
    {
      mostrarConfirmacion = true,
    } = {}
  ) => {
    if (!periodoMensualSeleccionado || !gestionMensual) {
      return false;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setErrorGestion(
        "No fue posible guardar porque no se encontró la sesión autenticada."
      );
      setMensajeGestion("");
      return false;
    }

    setGuardandoGestion(true);
    setErrorGestion("");

    if (mostrarConfirmacion) {
      setMensajeGestion("");
    }

    try {
      const url =
        `${obtenerBaseApi()}` +
        `/gestion-mensual-indicadores` +
        `/RRLL_PROCESOS_DISCIPLINARIOS` +
        `/KPI3` +
        `/${periodoMensualSeleccionado.anio}` +
        `/${periodoMensualSeleccionado.mes}` +
        `/gestion`;

      const respuesta = await fetch(url, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(campos),
      });

      const resultado = await respuesta
        .json()
        .catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          resultado?.detail ||
            "No fue posible guardar la gestión mensual."
        );
      }

      const analisisCargado =
        resultado?.gestionMensual?.analisisMes || "";

      const planCargado =
        resultado?.gestionMensual?.planAccion || "";

      const calificacionCargada =
        resultado?.gestionMensual?.calificacionMensual;

      const calificacionTexto =
        calificacionCargada !== null &&
        calificacionCargada !== undefined
          ? String(calificacionCargada)
          : "";

      setGestionMensual(resultado);

      setAnalisisMes(analisisCargado);
      setPlanAccion(planCargado);
      setCalificacionMensual(calificacionTexto);

      setAnalisisGuardado(analisisCargado);
      setPlanAccionGuardado(planCargado);
      setCalificacionGuardada(calificacionTexto);

      if (mostrarConfirmacion) {
        setMensajeGestion(
          "La gestión mensual fue guardada correctamente."
        );
      }

      return true;
    } catch (err) {
      console.error(
        "Error guardando gestión mensual del indicador:",
        err
      );

      setErrorGestion(
        err?.message ||
          "No fue posible guardar la gestión mensual."
      );

      return false;
    } finally {
      setGuardandoGestion(false);
    }
  };


  const guardarGestionMensual = async () => {
    if (!periodoMensualSeleccionado || !gestionMensual) {
      return;
    }

    const permisos = gestionMensual?.permisos || {};

    const body = {};

    const analisisActual = analisisMes.trim();
    const planActual = planAccion.trim();

    if (
      permisos.puedeEditarAnalisis &&
      analisisActual &&
      analisisActual !== analisisGuardado.trim()
    ) {
      body.analisisMes = analisisActual;
    }

    if (
      permisos.puedeEditarPlanAccion &&
      planActual &&
      planActual !== planAccionGuardado.trim()
    ) {
      body.planAccion = planActual;
    }

    if (Object.keys(body).length === 0) {
      setErrorGestion(
        "No hay cambios pendientes por guardar."
      );
      setMensajeGestion("");
      return;
    }

    await guardarCamposGestionMensual(body);
  };


  const guardarAnalisisAlSalir = async () => {
    if (
      !gestionMensual?.periodo?.esPeriodoActual ||
      !gestionMensual?.permisos?.puedeEditarAnalisis ||
      guardandoGestion
    ) {
      return;
    }

    const valorActual = analisisMes.trim();

    if (
      !valorActual ||
      valorActual === analisisGuardado.trim()
    ) {
      return;
    }

    await guardarCamposGestionMensual(
      {
        analisisMes: valorActual,
      },
      {
        mostrarConfirmacion: false,
      }
    );
  };


  const guardarPlanAccionAlSalir = async () => {
    if (
      !gestionMensual?.periodo?.esPeriodoActual ||
      !gestionMensual?.permisos?.puedeEditarPlanAccion ||
      guardandoGestion
    ) {
      return;
    }

    const valorActual = planAccion.trim();

    if (
      !valorActual ||
      valorActual === planAccionGuardado.trim()
    ) {
      return;
    }

    await guardarCamposGestionMensual(
      {
        planAccion: valorActual,
      },
      {
        mostrarConfirmacion: false,
      }
    );
  };


  const guardarCalificacionMensual = async () => {
    if (
      !periodoMensualSeleccionado ||
      !gestionMensual?.permisos?.puedeEditarCalificacion
    ) {
      return;
    }

    const valorTexto = String(calificacionMensual).trim();

    if (!valorTexto) {
      setErrorGestion(
        "Debe ingresar una calificación mensual entre 0 y 100."
      );
      setMensajeGestion("");
      return;
    }

    const valorNumerico = Number(
      valorTexto.replace(",", ".")
    );

    if (
      Number.isNaN(valorNumerico) ||
      valorNumerico < 0 ||
      valorNumerico > 100
    ) {
      setErrorGestion(
        "La calificación mensual debe estar entre 0 y 100."
      );
      setMensajeGestion("");
      return;
    }

    if (
      String(valorNumerico) ===
      String(calificacionGuardada).replace(",", ".")
    ) {
      setErrorGestion(
        "No hay cambios pendientes en la calificación."
      );
      setMensajeGestion("");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setErrorGestion(
        "No fue posible guardar la calificación porque no se encontró la sesión autenticada."
      );
      setMensajeGestion("");
      return;
    }

    setGuardandoCalificacion(true);
    setErrorGestion("");
    setMensajeGestion("");

    try {
      const url =
        `${obtenerBaseApi()}` +
        `/gestion-mensual-indicadores` +
        `/RRLL_PROCESOS_DISCIPLINARIOS` +
        `/KPI3` +
        `/${periodoMensualSeleccionado.anio}` +
        `/${periodoMensualSeleccionado.mes}` +
        `/calificacion`;

      const respuesta = await fetch(url, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          calificacionMensual: valorNumerico,
        }),
      });

      const resultado = await respuesta
        .json()
        .catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          resultado?.detail ||
            "No fue posible guardar la calificación mensual."
        );
      }

      const calificacionCargada =
        resultado?.gestionMensual?.calificacionMensual;

      const calificacionTexto =
        calificacionCargada !== null &&
        calificacionCargada !== undefined
          ? String(calificacionCargada)
          : "";

      setGestionMensual(resultado);
      setCalificacionMensual(calificacionTexto);
      setCalificacionGuardada(calificacionTexto);

      setMensajeGestion(
        "La calificación mensual fue guardada correctamente."
      );
    } catch (err) {
      console.error(
        "Error guardando calificación mensual:",
        err
      );

      setErrorGestion(
        err?.message ||
          "No fue posible guardar la calificación mensual."
      );
    } finally {
      setGuardandoCalificacion(false);
    }
  };


  const consultarIndicadores = async (forzarGlobal = false) => {
    const inicioConsulta = forzarGlobal ? "" : fechaInicio;
    const finConsulta = forzarGlobal ? "" : fechaFin;

    const tieneFechaInicio = Boolean(inicioConsulta);
    const tieneFechaFin = Boolean(finConsulta);

    if (tieneFechaInicio !== tieneFechaFin) {
      setError(
        "Para filtrar por periodo debe seleccionar la fecha inicial y la fecha final."
      );
      return;
    }

    if (
      tieneFechaInicio &&
      tieneFechaFin &&
      finConsulta < inicioConsulta
    ) {
      setError(
        "La fecha final no puede ser menor que la fecha inicial."
      );
      return;
    }

    setCargando(true);
    setError("");

    try {
      const parametros = new URLSearchParams();

      if (tieneFechaInicio && tieneFechaFin) {
        parametros.set("fecha_inicio", inicioConsulta);
        parametros.set("fecha_fin", finConsulta);
      }

      const query = parametros.toString();

      const url =
        `${obtenerBaseApi()}` +
        `/indicadores-procesos-disciplinarios/kpi3` +
        (query ? `?${query}` : "");

      const respuesta = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!respuesta.ok) {
        let mensaje =
          "No fue posible consultar los indicadores.";

        try {
          const errorApi = await respuesta.json();

          mensaje =
            errorApi?.detail?.mensaje ||
            errorApi?.detail ||
            mensaje;
        } catch {
          // Se conserva el mensaje general.
        }

        throw new Error(mensaje);
      }

      const resultado = await respuesta.json();

      setDatos(resultado);
      setPaginaDetalle(1);

      if (!forzarGlobal && periodoMensualSeleccionado) {
        await consultarGestionMensual(
          periodoMensualSeleccionado
        );
      } else {
        limpiarGestionMensual();
      }
    } catch (err) {
      console.error(
        "Error consultando indicadores disciplinarios:",
        err
      );

      setDatos(null);

      setError(
        err?.message ||
          "Ocurrió un error consultando los indicadores."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    consultarIndicadores(true);
  }, []);


  const kpi = datos?.kpi3 || {
    agendados: 0,
    atendidos: 0,
    pendientesAtencion: 0,
    cerrados: 0,
    atendidosPendientesCierre: 0,
    coberturaAtencion: 0,
    coberturaCierre: 0,
  };


  const detalle = Array.isArray(datos?.detalle)
    ? datos.detalle
    : [];

  const totalPaginasDetalle = Math.max(
    1,
    Math.ceil(detalle.length / registrosPorPagina)
  );

  const paginaDetalleSegura = Math.min(
    paginaDetalle,
    totalPaginasDetalle
  );

  const indiceInicioDetalle =
    (paginaDetalleSegura - 1) * registrosPorPagina;

  const indiceFinDetalle = Math.min(
    indiceInicioDetalle + registrosPorPagina,
    detalle.length
  );

  const detallePaginado = detalle.slice(
    indiceInicioDetalle,
    indiceFinDetalle
  );

  const paginasVisiblesDetalle = useMemo(() => {
    if (totalPaginasDetalle <= 5) {
      return Array.from(
        { length: totalPaginasDetalle },
        (_, index) => index + 1
      );
    }

    let inicio = Math.max(
      1,
      paginaDetalleSegura - 2
    );

    let fin = Math.min(
      totalPaginasDetalle,
      inicio + 4
    );

    if (fin - inicio < 4) {
      inicio = Math.max(
        1,
        fin - 4
      );
    }

    return Array.from(
      { length: fin - inicio + 1 },
      (_, index) => inicio + index
    );
  }, [
    paginaDetalleSegura,
    totalPaginasDetalle,
  ]);


  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl shadow-xl border-t-4 border-blue-600 overflow-hidden">

        <div className="p-8 border-b border-gray-100">
          <p className="text-sm text-blue-700 font-semibold">
            Relaciones Laborales
          </p>

          <h2 className="text-2xl font-bold text-gray-800">
            Indicadores de Procesos Disciplinarios
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Seguimiento de procesos enviados por Operaciones,
            atención de RRLL y cierre disciplinario.
          </p>
        </div>


        <div className="p-8">

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 mb-6">
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700">
                Consulta de indicadores
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Sin fechas seleccionadas se muestra la información global del módulo.
                Para consultar un periodo específico, seleccione fecha inicial y fecha final.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">

              <div>
                <label
                  htmlFor="fechaInicio"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Fecha inicial
                </label>

                <input
                  id="fechaInicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(event) =>
                    setFechaInicio(event.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>


              <div>
                <label
                  htmlFor="fechaFin"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Fecha final
                </label>

                <input
                  id="fechaFin"
                  type="date"
                  value={fechaFin}
                  onChange={(event) =>
                    setFechaFin(event.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>


              <div>
                <Button
                  type="button"
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white"
                  onClick={() => consultarIndicadores(false)}
                  disabled={cargando}
                >
                  {cargando
                    ? "Consultando..."
                    : "Consultar indicadores"}
                </Button>
              </div>


              <div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    setFechaInicio("");
                    setFechaFin("");
                    limpiarGestionMensual();
                    await consultarIndicadores(true);
                  }}
                  disabled={
                    cargando ||
                    (!fechaInicio && !fechaFin)
                  }
                >
                  Ver información global
                </Button>
              </div>

            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}


          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-blue-700">
                Procesos agendados
              </p>

              <p className="text-3xl font-bold text-blue-800 mt-2">
                {kpi.agendados}
              </p>

              <p className="text-xs text-blue-700 mt-2">
                Enviados por Operaciones a RRLL
              </p>
            </div>


            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-emerald-700">
                Procesos atendidos
              </p>

              <p className="text-3xl font-bold text-emerald-800 mt-2">
                {kpi.atendidos}
              </p>

              <p className="text-xs text-emerald-700 mt-2">
                Procesos con atención registrada
              </p>
            </div>


            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-amber-700">
                Pendientes de atención
              </p>

              <p className="text-3xl font-bold text-amber-800 mt-2">
                {kpi.pendientesAtencion}
              </p>

              <p className="text-xs text-amber-700 mt-2">
                Procesos todavía pendientes por atender
              </p>
            </div>


            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-600">
                Procesos cerrados
              </p>

              <p className="text-3xl font-bold text-gray-800 mt-2">
                {kpi.cerrados}
              </p>

              <p className="text-xs text-gray-500 mt-2">
                Procesos finalizados por RRLL
              </p>
            </div>

            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 shadow-sm sm:col-span-2 xl:col-span-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-violet-700">
                    Atendidos pendientes de cierre
                  </p>

                  <p className="text-xs text-violet-700 mt-1">
                    Procesos ya atendidos por RRLL que aún no cuentan con cierre registrado.
                  </p>
                </div>

                <p className="text-3xl font-bold text-violet-800">
                  {kpi.atendidosPendientesCierre}
                </p>
              </div>
            </div>

          </div>


          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">

            <div className="rounded-2xl border border-blue-200 p-6 bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    Cobertura de atención
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    Trabajadores atendidos frente a los trabajadores agendados.
                  </p>
                </div>

                <p className="text-3xl font-bold text-blue-700">
                  {formatearPorcentaje(
                    kpi.coberturaAtencion
                  )}
                </p>
              </div>


              <div className="w-full bg-gray-200 rounded-full h-3 mt-5 overflow-hidden">
                <div
                  className="bg-blue-600 h-3 rounded-full"
                  style={{
                    width: `${Math.min(
                      Number(kpi.coberturaAtencion || 0),
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>


            <div className="rounded-2xl border border-gray-200 p-6 bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    Cobertura de cierre
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    Procesos cerrados frente a los procesos agendados.
                  </p>
                </div>

                <p className="text-3xl font-bold text-gray-800">
                  {formatearPorcentaje(
                    kpi.coberturaCierre
                  )}
                </p>
              </div>


              <div className="w-full bg-gray-200 rounded-full h-3 mt-5 overflow-hidden">
                <div
                  className="bg-gray-700 h-3 rounded-full"
                  style={{
                    width: `${Math.min(
                      Number(kpi.coberturaCierre || 0),
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

          </div>


          <div className="rounded-2xl border border-gray-200 overflow-hidden">

            <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-bold text-gray-800">
                Detalle de procesos
              </h3>

              <p className="text-xs text-gray-500 mt-1">
                {fechaInicio && fechaFin
                  ? "Procesos que componen los indicadores del periodo seleccionado."
                  : "Todos los procesos que componen la información global del módulo."}
              </p>
            </div>


            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">

                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      Proceso
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      Identificación
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      Trabajador
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      Entrada RRLL
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      Fecha cita
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                      Atendido
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                      Cerrado
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      Fecha cierre
                    </th>
                  </tr>
                </thead>


                <tbody className="divide-y divide-gray-100 bg-white">

                  {!cargando && detalle.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-sm text-gray-500"
                      >
                        {fechaInicio && fechaFin
                          ? "No existen procesos disciplinarios para el periodo seleccionado."
                          : "No existen procesos disciplinarios registrados en el módulo."}
                      </td>
                    </tr>
                  )}


                  {detallePaginado.map((registro) => (
                    <tr
                      key={registro.IdProcesoDisciplinario}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-gray-700 whitespace-nowrap">
                        #{registro.IdProcesoDisciplinario}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {registro.NumeroIdentificacion || "-"}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700 min-w-[240px]">
                        {registro.Trabajador || "-"}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatearFecha(
                          registro.FechaEntradaRRLL
                        )}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatearFecha(
                          registro.FechaCita
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span
                          className={
                            registro.FueAtendido
                              ? "inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                              : "inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700"
                          }
                        >
                          {registro.FueAtendido
                            ? "Sí"
                            : "Pendiente"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span
                          className={
                            registro.FueCerrado
                              ? "inline-flex rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700"
                              : "inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500"
                          }
                        >
                          {registro.FueCerrado
                            ? "Sí"
                            : "No"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatearFecha(
                          registro.FechaCierre
                        )}
                      </td>
                    </tr>
                  ))}

                </tbody>
              </table>
            </div>

            {detalle.length > 0 && (
              <div className="flex flex-col gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-gray-600">
                  {indiceInicioDetalle + 1}-{indiceFinDetalle} de {detalle.length}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPaginaDetalle((paginaActual) =>
                        Math.max(1, paginaActual - 1)
                      )
                    }
                    disabled={paginaDetalleSegura === 1}
                    className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 text-sm font-bold text-gray-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Página anterior"
                  >
                    ‹
                  </button>

                  {paginasVisiblesDetalle.map((numeroPagina) => (
                    <button
                      key={numeroPagina}
                      type="button"
                      onClick={() =>
                        setPaginaDetalle(numeroPagina)
                      }
                      className={
                        numeroPagina === paginaDetalleSegura
                          ? "flex h-9 min-w-9 items-center justify-center rounded-lg border border-blue-700 bg-blue-700 px-3 text-sm font-bold text-white shadow-sm"
                          : "flex h-9 min-w-9 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 text-sm font-bold text-gray-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                      }
                      aria-current={
                        numeroPagina === paginaDetalleSegura
                          ? "page"
                          : undefined
                      }
                    >
                      {numeroPagina}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      setPaginaDetalle((paginaActual) =>
                        Math.min(
                          totalPaginasDetalle,
                          paginaActual + 1
                        )
                      )
                    }
                    disabled={
                      paginaDetalleSegura === totalPaginasDetalle
                    }
                    className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 text-sm font-bold text-gray-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Página siguiente"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </div>


          {periodoMensualSeleccionado && (
            <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50/40 overflow-hidden">
              <div className="border-b border-blue-100 bg-white px-6 py-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-700">
                      Gestión mensual del indicador
                    </p>

                    <h3 className="mt-1 text-lg font-bold text-gray-800">
                      Análisis, plan de acción y calificación mensual
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      Información asociada exclusivamente al mes y año del periodo consultado.
                    </p>
                  </div>

                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800">
                    {new Intl.DateTimeFormat("es-CO", {
                      month: "long",
                      year: "numeric",
                      timeZone: "America/Bogota",
                    }).format(
                      new Date(
                        periodoMensualSeleccionado.anio,
                        periodoMensualSeleccionado.mes - 1,
                        1
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6">
                {cargandoGestion ? (
                  <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
                    Consultando gestión mensual...
                  </div>
                ) : (
                  <>
                    {errorGestion && (
                      <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errorGestion}
                      </div>
                    )}

                    {mensajeGestion && (
                      <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {mensajeGestion}
                      </div>
                    )}

                    {gestionMensual && (
                      <>
                        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="mb-3">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <label
                                  htmlFor="analisisMes"
                                  className="text-sm font-bold text-gray-800"
                                >
                                  Análisis del mes
                                </label>

                                <span
                                  className={
                                    gestionMensual?.permisos?.puedeEditarAnalisis
                                      ? "w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700"
                                      : "w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600"
                                  }
                                >
                                  {gestionMensual?.permisos?.puedeEditarAnalisis
                                    ? gestionMensual?.periodo?.esPeriodoAnterior
                                      ? "Pendiente · un solo guardado"
                                      : "Editable"
                                    : "Solo lectura"}
                                </span>
                              </div>

                              <p className="mt-2 text-xs leading-5 text-gray-500">
                                Describa el comportamiento del indicador, causas relevantes y situaciones presentadas durante el mes.
                              </p>
                            </div>

                            <textarea
                              id="analisisMes"
                              value={analisisMes}
                              onChange={(event) =>
                                setAnalisisMes(event.target.value)
                              }
                              onBlur={guardarAnalisisAlSalir}
                              disabled={
                                !gestionMensual?.permisos?.puedeEditarAnalisis ||
                                guardandoGestion
                              }
                              rows={6}
                              placeholder="Escriba el análisis del mes..."
                              className="w-full resize-y rounded-xl border border-gray-300 bg-white p-4 text-sm leading-6 text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-600"
                            />

                            <div className="mt-3 text-xs text-gray-500">
                              {gestionMensual?.gestionMensual?.usuarioAnalisis ? (
                                <>
                                  Registrado por{" "}
                                  <span className="font-semibold text-gray-700">
                                    {gestionMensual.gestionMensual.usuarioAnalisis}
                                  </span>
                                  {" · "}
                                  {formatearFechaHora(
                                    gestionMensual.gestionMensual.fechaAnalisis
                                  )}
                                </>
                              ) : (
                                "Pendiente de diligenciar."
                              )}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="mb-3">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <label
                                  htmlFor="planAccion"
                                  className="text-sm font-bold text-gray-800"
                                >
                                  Plan de acción
                                </label>

                                <span
                                  className={
                                    gestionMensual?.permisos?.puedeEditarPlanAccion
                                      ? "w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700"
                                      : "w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600"
                                  }
                                >
                                  {gestionMensual?.permisos?.puedeEditarPlanAccion
                                    ? gestionMensual?.periodo?.esPeriodoAnterior
                                      ? "Pendiente · un solo guardado"
                                      : "Editable"
                                    : "Solo lectura"}
                                </span>
                              </div>

                              <p className="mt-2 text-xs leading-5 text-gray-500">
                                Registre las acciones definidas para mejorar, corregir o mantener el resultado del indicador.
                              </p>
                            </div>

                            <textarea
                              id="planAccion"
                              value={planAccion}
                              onChange={(event) =>
                                setPlanAccion(event.target.value)
                              }
                              onBlur={guardarPlanAccionAlSalir}
                              disabled={
                                !gestionMensual?.permisos?.puedeEditarPlanAccion ||
                                guardandoGestion
                              }
                              rows={6}
                              placeholder="Escriba el plan de acción..."
                              className="w-full resize-y rounded-xl border border-gray-300 bg-white p-4 text-sm leading-6 text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-600"
                            />

                            <div className="mt-3 text-xs text-gray-500">
                              {gestionMensual?.gestionMensual?.usuarioPlanAccion ? (
                                <>
                                  Registrado por{" "}
                                  <span className="font-semibold text-gray-700">
                                    {gestionMensual.gestionMensual.usuarioPlanAccion}
                                  </span>
                                  {" · "}
                                  {formatearFechaHora(
                                    gestionMensual.gestionMensual.fechaPlanAccion
                                  )}
                                </>
                              ) : (
                                "Pendiente de diligenciar."
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
                          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex-1">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between lg:justify-start lg:gap-3">
                                <p className="text-sm font-bold text-gray-800">
                                  Calificación mensual
                                </p>

                                <span
                                  className={
                                    gestionMensual?.permisos?.puedeEditarCalificacion
                                      ? "w-fit rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700"
                                      : "w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600"
                                  }
                                >
                                  {gestionMensual?.permisos?.puedeEditarCalificacion
                                    ? gestionMensual?.periodo?.esPeriodoAnterior
                                      ? "Pendiente · un solo guardado"
                                      : "Editable por Super Administrador"
                                    : "Solo lectura"}
                                </span>
                              </div>

                              <p className="mt-2 text-xs leading-5 text-gray-500">
                                Calificación mensual del indicador. Solo el Super Administrador puede registrarla o modificarla cuando el periodo lo permita.
                              </p>

                              <p className="mt-2 text-xs text-gray-500">
                                {gestionMensual?.gestionMensual?.usuarioCalificacion ? (
                                  <>
                                    Calificado por{" "}
                                    <span className="font-semibold text-gray-700">
                                      {gestionMensual.gestionMensual.usuarioCalificacion}
                                    </span>
                                    {" · "}
                                    {formatearFechaHora(
                                      gestionMensual.gestionMensual.fechaCalificacion
                                    )}
                                  </>
                                ) : (
                                  "Pendiente de calificación."
                                )}
                              </p>

                              {gestionMensual?.permisos?.puedeEditarCalificacion && (
                                <div className="mt-5 max-w-md">
                                  <label
                                    htmlFor="calificacionMensual"
                                    className="mb-2 block text-xs font-semibold text-gray-700"
                                  >
                                    Calificación del indicador
                                  </label>

                                  <div className="flex flex-col gap-3 sm:flex-row">
                                    <div className="relative flex-1">
                                      <input
                                        id="calificacionMensual"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={calificacionMensual}
                                        onChange={(event) =>
                                          setCalificacionMensual(
                                            event.target.value
                                          )
                                        }
                                        disabled={guardandoCalificacion}
                                        placeholder="0 - 100"
                                        className="w-full rounded-xl border border-violet-300 bg-white px-4 py-3 pr-10 text-sm font-semibold text-gray-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-gray-50"
                                      />

                                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-violet-700">
                                        %
                                      </span>
                                    </div>

                                    <Button
                                      type="button"
                                      onClick={guardarCalificacionMensual}
                                      disabled={guardandoCalificacion}
                                      className="bg-violet-700 text-white hover:bg-violet-800 sm:min-w-[190px]"
                                    >
                                      {guardandoCalificacion
                                        ? "Guardando..."
                                        : "Guardar calificación"}
                                    </Button>
                                  </div>

                                  <p className="mt-2 text-xs leading-5 text-gray-500">
                                    Ingrese un valor entre 0 y 100. En un periodo cerrado, una calificación pendiente solo podrá registrarse una vez.
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="min-w-[190px] rounded-2xl border border-violet-200 bg-violet-50 px-6 py-5 text-center">
                              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                                Resultado
                              </p>

                              <p className="mt-1 text-3xl font-bold text-violet-800">
                                {gestionMensual?.gestionMensual?.calificacionMensual !== null &&
                                gestionMensual?.gestionMensual?.calificacionMensual !== undefined
                                  ? `${Number(
                                      gestionMensual.gestionMensual.calificacionMensual
                                    )
                                      .toFixed(2)
                                      .replace(".", ",")} %`
                                  : "Pendiente"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {(gestionMensual?.permisos?.puedeEditarAnalisis ||
                          gestionMensual?.permisos?.puedeEditarPlanAccion) && (
                          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs leading-5 text-gray-500">
                              {gestionMensual?.periodo?.esPeriodoAnterior
                                ? "Este periodo ya finalizó. Los campos pendientes pueden diligenciarse una sola vez y quedarán bloqueados después de guardar."
                                : "Mientras el mes se encuentre vigente, los cambios se guardan al salir de cada campo y también puede usar el botón Guardar gestión mensual."}
                            </p>

                            <Button
                              type="button"
                              onClick={guardarGestionMensual}
                              disabled={guardandoGestion}
                              className="bg-blue-700 text-white hover:bg-blue-800 sm:min-w-[220px]"
                            >
                              {guardandoGestion
                                ? "Guardando..."
                                : "Guardar gestión mensual"}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          )}



          <div className="mt-6 flex flex-col sm:flex-row gap-3">

            <Button
              type="button"
              variant="outline"
              onClick={onBack}
            >
              Volver a Procesos Disciplinarios
            </Button>

          </div>

        </div>
      </div>
    </div>
  );
}