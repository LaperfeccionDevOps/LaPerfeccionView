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


function obtenerRolUsuario() {
  try {
    const raw =
      localStorage.getItem("user") ||
      localStorage.getItem("usuario");

    if (raw) {
      const parsed = JSON.parse(raw);

      return (
        parsed?.rol ||
        parsed?.role ||
        parsed?.nombreRol ||
        parsed?.Rol ||
        ""
      );
    }
  } catch (error) {
    console.warn(
      "No fue posible leer el rol desde localStorage:",
      error
    );
  }

  return (
    localStorage.getItem("rol") ||
    localStorage.getItem("role") ||
    ""
  );
}


export default function IndicadoresProcesosDisciplinariosView({
  onBack,
}) {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [datos, setDatos] = useState(null);
  const [periodoConsultado, setPeriodoConsultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const [gestionMensual, setGestionMensual] = useState(null);
  const [analisisMes, setAnalisisMes] = useState("");
  const [actividadesPlanAccion, setActividadesPlanAccion] = useState([
    {
      idActividad: null,
      actividad: "",
      fechaCompromiso: "",
    },
  ]);
  const [cargandoGestion, setCargandoGestion] = useState(false);
  const [guardandoGestion, setGuardandoGestion] = useState(false);
  const [guardandoCalificaciones, setGuardandoCalificaciones] = useState(false);
  const [errorGestion, setErrorGestion] = useState("");
  const [mensajeGestion, setMensajeGestion] = useState("");

  const rolUsuarioActual = obtenerRolUsuario();

  const rolNormalizado = String(rolUsuarioActual || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");

  const esSuperAdministradorLocal =
    rolNormalizado === "SUPER ADMINISTRADOR" ||
    rolNormalizado === "SUPERADMIN" ||
    rolNormalizado === "SUPER ADMIN";

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
    setActividadesPlanAccion([
      {
        idActividad: null,
        actividad: "",
        fechaCompromiso: "",
      },
    ]);
    setErrorGestion("");
    setMensajeGestion("");
  };


  const cargarActividadesDesdeRespuesta = (resultado) => {
    const actividades =
      resultado?.gestionMensual?.actividadesPlanAccion || [];

    setActividadesPlanAccion(
      actividades.length > 0
        ? actividades.map((item) => ({
            idActividad: item.idActividad ?? null,
            actividad: item.actividad || "",
            fechaCompromiso: item.fechaCompromiso || "",
            calificacion: item.calificacion ?? null,
            usuarioCalificacion:
              item.usuarioCalificacion || null,
            fechaCalificacion:
              item.fechaCalificacion || null,
            puedeCalificar:
              Boolean(item.puedeCalificar),
          }))
        : [
            {
              idActividad: null,
              actividad: "",
              fechaCompromiso: "",
            },
          ]
    );
  };


  const consultarGestionMensual = async (periodo) => {
    if (!periodo) {
      limpiarGestionMensual();
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      limpiarGestionMensual();

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

      setGestionMensual(resultado);
      setAnalisisMes(
        resultado?.gestionMensual?.analisisMes || ""
      );

      cargarActividadesDesdeRespuesta(resultado);
    } catch (err) {
      console.error(
        "Error consultando gestión mensual del indicador:",
        err
      );

      limpiarGestionMensual();

      setErrorGestion(
        err?.message ||
          "No fue posible consultar la gestión mensual del indicador."
      );
    } finally {
      setCargandoGestion(false);
    }
  };


  const guardarAnalisisAlSalir = async () => {
    if (!periodoMensualSeleccionado) {
      return;
    }

    const permisos = gestionMensual?.permisos || {};

    if (
      !permisos.puedeEditarAnalisis ||
      guardandoGestion
    ) {
      return;
    }

    const valorActual = analisisMes.trim();

    if (!valorActual) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setErrorGestion(
        "No fue posible guardar porque no se encontró la sesión autenticada."
      );
      return;
    }

    setGuardandoGestion(true);
    setErrorGestion("");

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
        body: JSON.stringify({
          analisisMes: valorActual,
        }),
      });

      const resultado = await respuesta
        .json()
        .catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          resultado?.detail ||
            "No fue posible guardar el análisis del mes."
        );
      }

      setGestionMensual(resultado);
      setAnalisisMes(
        resultado?.gestionMensual?.analisisMes || ""
      );
      cargarActividadesDesdeRespuesta(resultado);
    } catch (err) {
      console.error(
        "Error guardando análisis mensual disciplinario:",
        err
      );

      setErrorGestion(
        err?.message ||
          "No fue posible guardar el análisis del mes."
      );
    } finally {
      setGuardandoGestion(false);
    }
  };


  const actualizarActividadLocal = (
    index,
    campo,
    valor
  ) => {
    setActividadesPlanAccion((actuales) =>
      actuales.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [campo]: valor,
            }
          : item
      )
    );
  };


  const agregarActividad = () => {
    setErrorGestion("");

    if (actividadesPlanAccion.length >= 5) {
      setErrorGestion(
        "El plan de acción permite máximo 5 actividades."
      );
      return;
    }

    setActividadesPlanAccion((actuales) => [
      ...actuales,
      {
        idActividad: null,
        actividad: "",
        fechaCompromiso: "",
      },
    ]);
  };


  const eliminarActividad = (index) => {
    if (actividadesPlanAccion.length <= 1) {
      setErrorGestion(
        "El plan de acción debe conservar al menos una actividad."
      );
      return;
    }

    setActividadesPlanAccion((actuales) =>
      actuales.filter(
        (_, itemIndex) => itemIndex !== index
      )
    );
  };


  const validarActividades = () => {
    if (
      actividadesPlanAccion.length < 1 ||
      actividadesPlanAccion.length > 5
    ) {
      return "El plan de acción debe contener entre 1 y 5 actividades.";
    }

    const incompleta = actividadesPlanAccion.some(
      (item) =>
        !String(item.actividad || "").trim() ||
        !item.fechaCompromiso
    );

    if (incompleta) {
      return "Cada actividad debe tener actividad y fecha de compromiso.";
    }

    return "";
  };


  const guardarPlanAccion = async () => {
    if (!periodoMensualSeleccionado) {
      return;
    }

    const permisos = gestionMensual?.permisos || {};

    if (
      !permisos.puedeEditarPlanAccion ||
      esSuperAdministradorLocal
    ) {
      setErrorGestion(
        "El plan de acción está en solo lectura para este periodo o usuario."
      );
      return;
    }

    const errorValidacion = validarActividades();

    if (errorValidacion) {
      setErrorGestion(errorValidacion);
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setErrorGestion(
        "No fue posible guardar porque no se encontró la sesión autenticada."
      );
      return;
    }

    setGuardandoGestion(true);
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
        `/gestion`;

      const respuesta = await fetch(url, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          actividadesPlanAccion:
            actividadesPlanAccion.map((item) => ({
              idActividad:
                item.idActividad || undefined,
              actividad:
                String(item.actividad || "").trim(),
              fechaCompromiso:
                item.fechaCompromiso,
            })),
        }),
      });

      const resultado = await respuesta
        .json()
        .catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          resultado?.detail ||
            "No fue posible guardar el plan de acción."
        );
      }

      setGestionMensual(resultado);
      setAnalisisMes(
        resultado?.gestionMensual?.analisisMes || ""
      );
      cargarActividadesDesdeRespuesta(resultado);

      setMensajeGestion(
        "Plan de acción guardado correctamente."
      );
    } catch (err) {
      console.error(
        "Error guardando plan de acción disciplinario:",
        err
      );

      setErrorGestion(
        err?.message ||
          "No fue posible guardar el plan de acción."
      );
    } finally {
      setGuardandoGestion(false);
    }
  };


  const guardarGestionMensual = async () => {
    if (
      !periodoMensualSeleccionado ||
      !gestionMensual
    ) {
      return;
    }

    const permisos = gestionMensual?.permisos || {};
    const body = {};

    if (permisos.puedeEditarAnalisis) {
      const valorAnalisis = analisisMes.trim();

      if (valorAnalisis) {
        body.analisisMes = valorAnalisis;
      }
    }

    if (
      permisos.puedeEditarPlanAccion &&
      !esSuperAdministradorLocal
    ) {
      const errorValidacion =
        validarActividades();

      if (errorValidacion) {
        setErrorGestion(errorValidacion);
        return;
      }

      body.actividadesPlanAccion =
        actividadesPlanAccion.map((item) => ({
          idActividad:
            item.idActividad || undefined,
          actividad:
            String(item.actividad || "").trim(),
          fechaCompromiso:
            item.fechaCompromiso,
        }));
    }

    if (Object.keys(body).length === 0) {
      setErrorGestion("");
      setMensajeGestion(
        "Los cambios ya se encuentran guardados."
      );
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setErrorGestion(
        "No fue posible guardar porque no se encontró la sesión autenticada."
      );
      return;
    }

    setGuardandoGestion(true);
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
        `/gestion`;

      const respuesta = await fetch(url, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
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

      setGestionMensual(resultado);
      setAnalisisMes(
        resultado?.gestionMensual?.analisisMes || ""
      );
      cargarActividadesDesdeRespuesta(resultado);

      setMensajeGestion(
        "La gestión mensual fue guardada correctamente."
      );
    } catch (err) {
      console.error(
        "Error guardando gestión mensual disciplinaria:",
        err
      );

      setErrorGestion(
        err?.message ||
          "No fue posible guardar la gestión mensual."
      );
    } finally {
      setGuardandoGestion(false);
    }
  };


  const guardarCalificacionesActividades = async () => {
    if (!periodoMensualSeleccionado) {
      return;
    }

    const permisos = gestionMensual?.permisos || {};

    const actividadesGuardadas =
      actividadesPlanAccion.filter(
        (item) => Boolean(item.idActividad)
      );

    if (
      !esSuperAdministradorLocal ||
      !permisos.puedeCalificarActividades
    ) {
      setErrorGestion(
        "Las calificaciones solo pueden ser registradas por el Super Administrador."
      );
      return;
    }

    if (actividadesGuardadas.length === 0) {
      setErrorGestion(
        "El plan de acción todavía no tiene actividades guardadas para calificar."
      );
      return;
    }

    const actividadesPayload = [];
    let existeCalificacion = false;

    for (const item of actividadesGuardadas) {
      const valorEntrada =
        item.calificacion === null ||
        item.calificacion === undefined ||
        String(item.calificacion).trim() === ""
          ? null
          : Number(
              String(item.calificacion)
                .replace(",", ".")
            );

      if (
        valorEntrada !== null &&
        (
          Number.isNaN(valorEntrada) ||
          valorEntrada < 0 ||
          valorEntrada > 100
        )
      ) {
        setErrorGestion(
          `La calificación de "${item.actividad}" debe estar entre 0 y 100 %.`
        );
        return;
      }

      if (valorEntrada !== null) {
        existeCalificacion = true;
      }

      actividadesPayload.push({
        idActividad: item.idActividad,
        calificacion:
          valorEntrada === null
            ? null
            : Number(
                valorEntrada.toFixed(2)
              ),
      });
    }

    if (!existeCalificacion) {
      setErrorGestion(
        "Debe registrar al menos una calificación antes de guardar la evaluación."
      );
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setErrorGestion(
        "No fue posible guardar las calificaciones porque no se encontró la sesión autenticada."
      );
      return;
    }

    setGuardandoCalificaciones(true);
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
        `/actividades/calificaciones`;

      const respuesta = await fetch(url, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          actividades: actividadesPayload,
        }),
      });

      const resultado = await respuesta
        .json()
        .catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          resultado?.detail ||
            "No fue posible guardar las calificaciones de las actividades."
        );
      }

      setGestionMensual(resultado);
      setAnalisisMes(
        resultado?.gestionMensual?.analisisMes || ""
      );
      cargarActividadesDesdeRespuesta(resultado);

      setMensajeGestion(
        "Calificaciones guardadas correctamente. El plan de acción quedó cerrado para Procesos Disciplinarios."
      );
    } catch (err) {
      console.error(
        "Error guardando calificaciones disciplinarias:",
        err
      );

      setErrorGestion(
        err?.message ||
          "No fue posible guardar las calificaciones de las actividades."
      );
    } finally {
      setGuardandoCalificaciones(false);
    }
  };

  const consultarIndicadores = async (forzarGlobal = false) => {
    const inicioConsulta = forzarGlobal ? "" : fechaInicio;
    const finConsulta = forzarGlobal ? "" : fechaFin;

    if (!inicioConsulta || !finConsulta) {
      setError("Seleccione la fecha inicial y la fecha final para consultar.");
      return;
    }

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
      setPeriodoConsultado({ inicio: inicioConsulta, fin: finConsulta });
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
      setPeriodoConsultado(null);

      setError(
        err?.message ||
          "Ocurrió un error consultando los indicadores."
      );
    } finally {
      setCargando(false);
    }
  };


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
                Seleccione la fecha inicial y la fecha final, y pulse Consultar indicadores para visualizar los resultados y el detalle de procesos del periodo elegido.
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
                  onChange={(event) => {
                    setFechaInicio(event.target.value);
                    setDatos(null);
                    setPeriodoConsultado(null);
                    setError("");
                    limpiarGestionMensual();
                  }}
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
                  onChange={(event) => {
                    setFechaFin(event.target.value);
                    setDatos(null);
                    setPeriodoConsultado(null);
                    setError("");
                    limpiarGestionMensual();
                  }}
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
                    setDatos(null);
                    setPeriodoConsultado(null);
                    setPaginaDetalle(1);
                    setError("");
                    limpiarGestionMensual();
                  }}
                  disabled={
                    cargando ||
                    (!fechaInicio && !fechaFin && !datos)
                  }
                >
                  Limpiar filtros
                </Button>
              </div>

            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}


          {!datos && !cargando && (
            <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-blue-800">
              Seleccione las dos fechas y pulse Consultar indicadores para ver los resultados y el detalle de procesos.
            </div>
          )}

          {datos && (
            <>
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


          <VisualizacionGerencialDisciplinarios kpi={kpi} detalle={detalle} cargando={cargando} />

          <div className="rounded-2xl border border-gray-200 overflow-hidden">

            <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-bold text-gray-800">
                Detalle de procesos
              </h3>

              <p className="text-xs text-gray-500 mt-1">
                {`Procesos que componen los indicadores del ${formatearFecha(periodoConsultado?.inicio)} al ${formatearFecha(periodoConsultado?.fin)}.`}
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


          </>
          )}

          {datos && periodoConsultado?.inicio && periodoConsultado?.fin && periodoMensualSeleccionado && (
            <GestionMensualDisciplinarios
              periodo={periodoMensualSeleccionado}
              gestionMensual={gestionMensual}
              analisisMes={analisisMes}
              setAnalisisMes={setAnalisisMes}
              actividadesPlanAccion={actividadesPlanAccion}
              cargando={cargandoGestion}
              guardandoGestion={guardandoGestion}
              guardandoCalificaciones={guardandoCalificaciones}
              error={errorGestion}
              mensaje={mensajeGestion}
              onGuardarGestion={guardarGestionMensual}
              onGuardarAnalisisBlur={guardarAnalisisAlSalir}
              onActualizarActividad={actualizarActividadLocal}
              onAgregarActividad={agregarActividad}
              onEliminarActividad={eliminarActividad}
              onGuardarPlan={guardarPlanAccion}
              onGuardarCalificaciones={guardarCalificacionesActividades}
              esSuperAdministradorLocal={esSuperAdministradorLocal}
            />
          )}


          <div className="mt-8">
            <AgendaSemanalDisciplinaria apiBase={obtenerBaseApi()} />
          </div>

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


const GestionMensualDisciplinarios = ({
  periodo,
  gestionMensual,
  analisisMes,
  setAnalisisMes,
  actividadesPlanAccion,
  cargando,
  guardandoGestion,
  guardandoCalificaciones,
  error,
  mensaje,
  onGuardarGestion,
  onGuardarAnalisisBlur,
  onActualizarActividad,
  onAgregarActividad,
  onEliminarActividad,
  onGuardarPlan,
  onGuardarCalificaciones,
  esSuperAdministradorLocal,
}) => {
  const permisos = gestionMensual?.permisos || {};
  const detalle = gestionMensual?.gestionMensual || {};
  const estadoPeriodo = gestionMensual?.periodo || {};

  const nombresMeses = {
    1: "Enero",
    2: "Febrero",
    3: "Marzo",
    4: "Abril",
    5: "Mayo",
    6: "Junio",
    7: "Julio",
    8: "Agosto",
    9: "Septiembre",
    10: "Octubre",
    11: "Noviembre",
    12: "Diciembre",
  };

  const nombreMes =
    nombresMeses[Number(periodo?.mes)] ||
    `Mes ${periodo?.mes || ""}`;

  const textoPermiso = (puedeEditar) => {
    if (!puedeEditar) return 'Solo lectura';
    if (estadoPeriodo.esPeriodoAnterior) {
      return 'Pendiente · un solo guardado';
    }
    return 'Editable';
  };

  const actividadesGuardadas = Array.isArray(detalle.actividadesPlanAccion)
    ? detalle.actividadesPlanAccion
    : [];

  // El frontend no inventa reglas de fechas.
  // Usa exactamente los permisos calculados por el backend:
  // - periodo actual: editable
  // - periodo anterior vacío: un solo guardado
  // - periodo anterior ya diligenciado: solo lectura
  // - periodo futuro: solo lectura
  const puedeEditarPlanLocal =
    Boolean(permisos.puedeEditarPlanAccion)
    && !esSuperAdministradorLocal;

  const actividadesVisibles = puedeEditarPlanLocal
    ? actividadesPlanAccion
    : actividadesPlanAccion.filter(
        (item) =>
          item?.idActividad
          || String(item?.actividad || '').trim()
          || item?.fechaCompromiso,
      );

  const esPlanLegacy =
    Boolean(detalle.planAccionLegacy)
    && Boolean(String(detalle.planAccion || '').trim())
    && actividadesGuardadas.length === 0;

  const totalActividades = actividadesGuardadas.length;

  const actividadesCalificadas = actividadesGuardadas.filter(
    (item) =>
      item?.calificacion !== null
      && item?.calificacion !== undefined
      && !Number.isNaN(Number(item.calificacion)),
  ).length;

  const sumaCalificaciones = actividadesGuardadas.reduce(
    (acumulado, item) => {
      const valor = Number(item?.calificacion);
      return acumulado + (Number.isNaN(valor) ? 0 : valor);
    },
    0,
  );

  const resultadoMensualAutomatico =
    totalActividades > 0
      ? Number((sumaCalificaciones / totalActividades).toFixed(2))
      : null;

  const puedeCalificarActividades =
    Boolean(permisos.puedeCalificarActividades)
    && esSuperAdministradorLocal;

  if (cargando) {
    return (
      <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-xl">
        <div className="flex items-center gap-3 text-sm font-semibold text-emerald-700">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />
          Cargando gestión mensual del indicador...
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-xl">
      <div className="flex flex-col gap-4 border-b border-emerald-100 px-5 py-6 md:px-7 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold text-emerald-700">
            Gestión mensual del indicador
          </p>
          <h2 className="mt-1 text-xl font-black text-gray-900">
            Análisis, plan de acción y calificación mensual
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Información asociada exclusivamente al mes y año del periodo consultado.
          </p>
        </div>

        <div className="w-fit rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-800">
          {nombreMes.toLowerCase()} de {periodo.anio}
        </div>
      </div>

      <div className="bg-emerald-50/30 p-5 md:p-7">
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {mensaje}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-gray-900">
                Análisis del mes
              </h3>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  permisos.puedeEditarAnalisis
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {textoPermiso(permisos.puedeEditarAnalisis)}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Describa el comportamiento del indicador, causas relevantes y situaciones presentadas durante el mes.
            </p>

            <textarea
              value={analisisMes}
              onChange={(event) => setAnalisisMes(event.target.value)}
              onBlur={onGuardarAnalisisBlur}
              disabled={!permisos.puedeEditarAnalisis || guardandoGestion}
              placeholder="ESCRIBA EL ANÁLISIS DEL MES..."
              className="mt-4 min-h-[180px] w-full resize-y rounded-2xl border border-gray-300 bg-white p-4 text-sm text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-gray-50"
            />

            <p className="mt-3 text-xs text-gray-500">
              {detalle.usuarioAnalisis ? (
                <>
                  Registrado por{' '}
                  <span className="font-semibold text-gray-700">
                    {detalle.usuarioAnalisis}
                  </span>
                  {' · '}
                  {formatearFechaHora(detalle.fechaAnalisis)}
                </>
              ) : (
                'Pendiente de diligenciar.'
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Plan de acción
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Registre de 1 a 5 actividades con su fecha de compromiso. Se aplica la misma validación mensual ya existente del indicador.
                </p>
              </div>

              <span
                className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                  puedeEditarPlanLocal
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {esSuperAdministradorLocal
                  ? 'Solo lectura · califica actividades'
                  : detalle.planCerrado
                    ? 'Cerrado · calificado'
                    : textoPermiso(puedeEditarPlanLocal)}
              </span>
            </div>

            {esPlanLegacy && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-amber-800">
                  Plan de acción registrado con el formato anterior
                </p>
                <p className="mt-2 text-xs leading-5 text-amber-700">
                  Este periodo ya tiene un plan guardado. Se conserva en solo lectura
                  y no se reemplaza automáticamente por actividades.
                </p>
                <div className="mt-3 whitespace-pre-wrap rounded-xl border border-amber-200 bg-white p-4 text-sm leading-6 text-gray-800">
                  {detalle.planAccion}
                </div>
              </div>
            )}

            <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200">
              <div className="hidden grid-cols-[minmax(260px,1.55fr)_180px_160px] gap-3 bg-gray-900 px-4 py-3 text-xs font-bold uppercase tracking-wide text-white md:grid">
                <span>Actividad</span>
                <span>Fecha de compromiso</span>
                <span>Calificación</span>
              </div>

              <div className="divide-y divide-gray-100">
                {!puedeEditarPlanLocal
                  && actividadesVisibles.length === 0
                  && !esPlanLegacy && (
                    <div className="bg-white p-5 text-center text-sm font-semibold text-gray-500">
                      No hay actividades registradas en el plan de acción para este periodo.
                    </div>
                  )}

                {actividadesVisibles.map((item, index) => {
                  const guardada = Boolean(item.idActividad);
                  const puedeCalificar = Boolean(item.puedeCalificar);

                  return (
                    <div
                      key={item.idActividad || `actividad-nueva-${index}`}
                      className="grid grid-cols-1 gap-3 bg-white p-4 md:grid-cols-[minmax(260px,1.55fr)_180px_160px]"
                    >
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-500 md:hidden">
                          Actividad
                        </label>
                        {puedeEditarPlanLocal ? (
                          <div className="flex gap-2">
                            <textarea
                              value={item.actividad}
                              onChange={(event) =>
                                onActualizarActividad(index, 'actividad', event.target.value)
                              }
                              disabled={guardandoGestion}
                              maxLength={1000}
                              rows={2}
                              placeholder={`Actividad ${index + 1}`}
                              className="min-h-[70px] flex-1 resize-y rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-gray-50"
                            />

                            {actividadesPlanAccion.length > 1 && (
                              <button
                                type="button"
                                onClick={() => onEliminarActividad(index)}
                                disabled={guardandoGestion}
                                className="h-10 rounded-lg border border-red-200 px-3 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                title="Eliminar actividad"
                              >
                                Quitar
                              </button>
                            )}
                          </div>
                        ) : (
                          <p className="rounded-xl bg-gray-50 px-3 py-3 text-sm font-semibold text-gray-800">
                            {item.actividad || 'Sin actividad'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-500 md:hidden">
                          Fecha de compromiso
                        </label>
                        {puedeEditarPlanLocal ? (
                          <input
                            type="date"
                            value={item.fechaCompromiso || ''}
                            onChange={(event) =>
                              onActualizarActividad(
                                index,
                                'fechaCompromiso',
                                event.target.value,
                              )
                            }
                            disabled={guardandoGestion}
                            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm font-semibold text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-gray-50"
                          />
                        ) : (
                          <p className="rounded-xl bg-gray-50 px-3 py-3 text-sm font-semibold text-gray-800">
                            {item.fechaCompromiso || 'Sin fecha'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-500 md:hidden">
                          Calificación
                        </label>

                        {guardada && puedeCalificarActividades && puedeCalificar ? (
                          <div>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={
                                  item.calificacion === null
                                  || item.calificacion === undefined
                                    ? ''
                                    : item.calificacion
                                }
                                onChange={(event) =>
                                  onActualizarActividad(
                                    index,
                                    'calificacion',
                                    event.target.value,
                                  )
                                }
                                disabled={guardandoCalificaciones}
                                placeholder="0 - 100"
                                className="w-full rounded-xl border border-violet-300 bg-white px-3 py-3 pr-8 text-sm font-bold text-gray-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-gray-50"
                              />
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-black text-violet-700">
                                %
                              </span>
                            </div>

                            <p className="mt-1 text-[11px] leading-4 text-gray-500">
                              {item.calificacion === null
                              || item.calificacion === undefined
                              || String(item.calificacion).trim() === ''
                                ? 'Sin calificación: contará como 0 %'
                                : 'Calificación lista para guardar'}
                            </p>
                          </div>
                        ) : item.calificacion !== null &&
                          item.calificacion !== undefined ? (
                          <div>
                            <div className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-3 text-center text-lg font-black text-violet-800">
                              {Number(item.calificacion)
                                .toFixed(2)
                                .replace('.', ',')} %
                            </div>
                            {item.usuarioCalificacion && (
                              <p className="mt-1 text-[11px] leading-4 text-gray-500">
                                {item.usuarioCalificacion}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-center text-xs font-semibold text-gray-500">
                            {guardada
                              ? 'Pendiente de calificación'
                              : 'Guarde el plan primero'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {esSuperAdministradorLocal
              && puedeCalificarActividades
              && actividadesGuardadas.length > 0 && (
                <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-violet-200 bg-violet-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-violet-900">
                      Calificación del plan de acción
                    </p>
                    <p className="mt-1 text-xs leading-5 text-violet-700">
                      Ingrese las calificaciones que correspondan y guárdelas todas en un solo paso.
                      Las actividades sin nota cuentan como 0 % en el resultado mensual.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onGuardarCalificaciones}
                    disabled={guardandoCalificaciones}
                    className="shrink-0 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-violet-300"
                  >
                    {guardandoCalificaciones
                      ? 'Guardando calificaciones...'
                      : 'Guardar calificaciones'}
                  </button>
                </div>
              )}

            {puedeEditarPlanLocal && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onAgregarActividad}
                  disabled={guardandoGestion || actividadesPlanAccion.length >= 5}
                  className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Agregar actividad
                </button>

                <button
                  type="button"
                  onClick={onGuardarPlan}
                  disabled={guardandoGestion}
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  {guardandoGestion ? 'Guardando...' : 'Guardar plan de acción'}
                </button>
              </div>
            )}

            {!esSuperAdministradorLocal && detalle.planCerrado && (
              <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs font-semibold leading-5 text-violet-800">
                Este plan ya fue calificado por Super Administrador. El análisis,
                las actividades y las fechas quedaron cerrados en modo lectura.
              </div>
            )}

            <p className="mt-3 text-xs text-gray-500">
              {detalle.usuarioPlanAccion ? (
                <>
                  Registrado por{' '}
                  <span className="font-semibold text-gray-700">
                    {detalle.usuarioPlanAccion}
                  </span>
                  {' · '}
                  {formatearFechaHora(detalle.fechaPlanAccion)}
                </>
              ) : (
                'Pendiente de diligenciar.'
              )}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-base font-bold text-gray-900">
                  Calificación mensual
                </h3>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                  Resultado automático
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                El resultado mensual se calcula automáticamente sumando las
                calificaciones registradas y dividiendo siempre entre el total de
                actividades comprometidas. Una actividad sin calificación cuenta
                como 0 % para el resultado.
              </p>

              <p className="mt-2 text-xs font-semibold text-gray-600">
                {totalActividades > 0
                  ? `${actividadesCalificadas} de ${totalActividades} actividades calificadas.`
                  : 'El plan de acción aún no tiene actividades guardadas.'}
              </p>

              {detalle.usuarioCalificacion && actividadesCalificadas > 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  Última calificación registrada por{' '}
                  <span className="font-semibold text-gray-700">
                    {detalle.usuarioCalificacion}
                  </span>
                  {' · '}
                  {formatearFechaHora(detalle.fechaCalificacion)}
                </p>
              )}
            </div>

            <div className="min-w-[210px] rounded-2xl border border-violet-200 bg-violet-50 px-6 py-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                Resultado
              </p>
              <p className="mt-1 text-3xl font-bold text-violet-800">
                {resultadoMensualAutomatico !== null
                  ? `${resultadoMensualAutomatico
                      .toFixed(2)
                      .replace('.', ',')} %`
                  : 'Pendiente'}
              </p>

              {totalActividades > 0 && actividadesCalificadas < totalActividades && (
                <p className="mt-2 text-[11px] font-semibold text-violet-600">
                  Las actividades sin calificación se toman como 0 %
                </p>
              )}
            </div>
          </div>
        </div>

        {(permisos.puedeEditarAnalisis ||
          puedeEditarPlanLocal) && (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-gray-500">
              El plan de acción usa la misma validación mensual del análisis:
              cuando el periodo lo permite, el líder registra las actividades y fechas;
              las calificaciones individuales son registradas por el Super Administrador.
            </p>

            <button
              type="button"
              onClick={onGuardarGestion}
              disabled={guardandoGestion}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {guardandoGestion
                ? 'Guardando...'
                : 'Guardar gestión mensual'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};


// Visualización complementaria: consume exclusivamente las cifras del KPI 3
// entregadas por el backend. No modifica la gestión mensual ni sus permisos.
function VisualizacionGerencialDisciplinarios({ kpi, detalle = [], cargando }) {
  const [sectorActivo, setSectorActivo] = useState(null);
  const [tipoGrafica, setTipoGrafica] = useState("barras");
  const totalProcesos = Math.max(0, Number(kpi.agendados) || 0);
  const atendidos = Math.max(0, Number(kpi.atendidos) || 0);
  const pendientes = Math.max(0, Number(kpi.pendientesAtencion) || 0);
  const cerrados = Math.max(0, Number(kpi.cerrados) || 0);
  const pendientesCierre = Math.max(0, Number(kpi.atendidosPendientesCierre) || 0);
  const trabajadoresAgendados = Math.max(0, Number(kpi.trabajadoresAgendados) || 0);
  const trabajadoresAtendidos = Math.max(0, Number(kpi.trabajadoresAtendidos) || 0);
  const cobertura = Math.max(0, Number(kpi.coberturaAtencion) || 0);
  const porcentajeProceso = (cantidad) =>
    totalProcesos > 0 ? (cantidad / totalProcesos) * 100 : 0;
  const porcentaje = (valor) => `${valor.toFixed(1).replace(".", ",")} %`;
  const categorias = [
    { nombre: "Atendidos", valor: atendidos, color: "#059669" },
    { nombre: "Pendientes de atención", valor: pendientes, color: "#d97706" },
  ];
  const cierre = [
    { nombre: "Cerrados", valor: cerrados, color: "#475569" },
    { nombre: "Sin cierre", valor: Math.max(0, totalProcesos - cerrados), color: "#cbd5e1" },
  ];
  const mostrarDistribucion = (items, titulo) => {
    const total = items.reduce((acum, item) => acum + item.valor, 0);
    if (tipoGrafica === "torta") {
      let avance = 0;
      const tramos = items.map((item) => {
        const inicio = avance;
        avance += total > 0 ? (item.valor / total) * 100 : 0;
        return `${item.color} ${inicio}% ${avance}%`;
      });
      return (
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
          <div className="relative h-44 w-44 shrink-0" onMouseLeave={() => setSectorActivo(null)}>
            <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label={`${titulo}: distribución interactiva`}>
              {total > 0 ? items.map((item, index) => {
                const acumulado = items.slice(0, index).reduce((sum, dato) => sum + dato.valor, 0);
                const fraccion = item.valor / total;
                if (fraccion <= 0) return null;
                const punto = (angulo) => {
                  const rad = (angulo - 90) * Math.PI / 180;
                  return [100 + 88 * Math.cos(rad), 100 + 88 * Math.sin(rad)];
                };
                const inicio = (acumulado / total) * 360;
                const fin = ((acumulado + item.valor) / total) * 360;
                const p1 = punto(inicio);
                const p2 = punto(fin >= 360 ? 359.999 : fin);
                const ruta = fraccion >= 0.999999
                  ? "M 100 12 A 88 88 0 1 1 99.999 12 Z"
                  : `M 100 100 L ${p1[0]} ${p1[1]} A 88 88 0 ${fraccion > 0.5 ? 1 : 0} 1 ${p2[0]} ${p2[1]} Z`;
                return (
                  <path key={item.nombre} d={ruta} fill={item.color}
                    className="cursor-pointer transition-opacity duration-150"
                    opacity={sectorActivo && sectorActivo !== `${titulo}-${index}` ? 0.45 : 1}
                    onMouseEnter={() => setSectorActivo(`${titulo}-${index}`)}
                    onFocus={() => setSectorActivo(`${titulo}-${index}`)}
                    onBlur={() => setSectorActivo(null)}
                    tabIndex={0}
                    aria-label={`${item.nombre}: ${item.valor} procesos, ${porcentaje(fraccion * 100)}`}>
                    <title>{`${item.nombre}: ${item.valor} procesos (${porcentaje(fraccion * 100)})`}</title>
                  </path>
                );
              }) : <circle cx="100" cy="100" r="88" fill="#e5e7eb" />}
              <circle cx="100" cy="100" r="56" fill="white" pointerEvents="none" />
              <text x="100" y="100" textAnchor="middle" fontSize="26" fontWeight="800" fill="#1f2937" pointerEvents="none">{total}</text>
              <text x="100" y="120" textAnchor="middle" fontSize="12" fill="#6b7280" pointerEvents="none">procesos</text>
            </svg>
            {sectorActivo?.startsWith(`${titulo}-`) && (() => {
              const indice = Number(sectorActivo.split("-").at(-1));
              const item = items[indice];
              return item ? <div className="pointer-events-none absolute -bottom-9 left-1/2 z-10 w-max max-w-[250px] -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white shadow-lg" role="status">
                {item.nombre}: {item.valor} procesos · {porcentaje(total ? item.valor / total * 100 : 0)}
              </div> : null;
            })()}
          </div>
          <div className="w-full space-y-3">
            {items.map((item) => (
              <div key={item.nombre} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-gray-700">
                  <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: item.color }} />
                  {item.nombre}
                </span>
                <strong className="whitespace-nowrap text-gray-900">{item.valor} · {porcentaje(total ? (item.valor / total) * 100 : 0)}</strong>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-5">
        {items.map((item) => (
          <div key={item.nombre} title={`${item.nombre}: ${item.valor} procesos`}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-gray-700">{item.nombre}</span>
              <strong className="text-gray-900">{item.valor} · {porcentaje(total ? (item.valor / total) * 100 : 0)}</strong>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full transition-all duration-500" style={{ backgroundColor: item.color, width: `${total ? (item.valor / total) * 100 : 0}%` }} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="mb-8 space-y-5" aria-label="Análisis visual de procesos disciplinarios">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Análisis visual del KPI 3</h3>
          <p className="mt-1 text-sm text-gray-500">Distribución de procesos y cumplimiento de la meta de atención.</p>
        </div>
        <div className="inline-flex w-fit rounded-xl border border-gray-200 bg-gray-50 p-1" aria-label="Tipo de gráfica">
          {[
            { id: "barras", texto: "Barras" },
            { id: "torta", texto: "Torta" },
          ].map((opcion) => (
            <button key={opcion.id} type="button" onClick={() => setTipoGrafica(opcion.id)}
              aria-pressed={tipoGrafica === opcion.id}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${tipoGrafica === opcion.id ? "bg-blue-700 text-white shadow-sm" : "text-gray-600 hover:bg-white"}`}>
              {opcion.texto}
            </button>
          ))}
        </div>
      </div>

      {totalProcesos === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
          {cargando ? "Consultando información del periodo..." : "No hay procesos para graficar en el periodo consultado."}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h4 className="mb-1 font-bold text-gray-800">Atención de procesos</h4>
              <p className="mb-6 text-xs text-gray-500">Procesos con descargos registrados frente a los que aún no tienen atención.</p>
              {mostrarDistribucion(categorias, "Atención de procesos")}
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h4 className="mb-1 font-bold text-gray-800">Cierre de procesos</h4>
              <p className="mb-6 text-xs text-gray-500">Procesos con cierre registrado y procesos que aún no tienen cierre.</p>
              {mostrarDistribucion(cierre, "Cierre de procesos")}
            </div>
          </div>

          <EvolucionMensualDisciplinarios detalle={detalle} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <p className="text-sm font-semibold text-blue-800">Cumplimiento KPI 3</p>
              <p className="mt-2 text-3xl font-black text-blue-900">{formatearPorcentaje(cobertura)}</p>
              <p className="mt-2 text-sm text-blue-800">{trabajadoresAtendidos} de {trabajadoresAgendados} trabajadores únicos atendidos.</p>
              <p className="mt-2 text-xs text-blue-700">Meta: 100 %. {trabajadoresAgendados ? `Brecha: ${porcentaje(Math.max(0, 100 - cobertura))}.` : "Sin base de trabajadores para evaluar."}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-semibold text-amber-800">Procesos sin atención registrada</p>
              <p className="mt-2 text-3xl font-black text-amber-900">{pendientes}</p>
              <p className="mt-2 text-sm text-amber-800">{porcentaje(porcentajeProceso(pendientes))} del total de procesos.</p>
              <p className="mt-2 text-xs text-amber-700">No equivale necesariamente a inasistencia: puede haber citas futuras o pendientes de registro.</p>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
              <p className="text-sm font-semibold text-violet-800">Atendidos pendientes de cierre</p>
              <p className="mt-2 text-3xl font-black text-violet-900">{pendientesCierre}</p>
              <p className="mt-2 text-sm text-violet-800">{porcentaje(porcentajeProceso(pendientesCierre))} del total de procesos.</p>
              <p className="mt-2 text-xs text-violet-700">Ya tienen descargos, pero todavía no registran cierre.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <h4 className="font-bold text-gray-900">Resumen ejecutivo del periodo</h4>
            <p className="mt-3 text-sm leading-7 text-gray-700">
              Se registran <strong>{totalProcesos} procesos disciplinarios</strong> originados en Operaciones.
              De ellos, <strong>{atendidos} ({porcentaje(porcentajeProceso(atendidos))})</strong> tienen atención registrada,
              <strong> {pendientes} ({porcentaje(porcentajeProceso(pendientes))})</strong> están pendientes de atención y
              <strong> {cerrados} ({porcentaje(porcentajeProceso(cerrados))})</strong> cuentan con cierre.
              La cobertura oficial calculada por el sistema es de <strong>{formatearPorcentaje(cobertura)}</strong>,
              sobre <strong>{trabajadoresAgendados} trabajadores únicos</strong>.
              {cobertura >= 100 ? " La meta de atención se encuentra cumplida." : " La cobertura aún está por debajo de la meta del 100 %."}
            </p>
            <p className="mt-3 text-xs leading-5 text-gray-500">
              Criterio actual del backend: el periodo se define por la primera entrada a RRLL; una atención se reconoce por la existencia de descargos y un cierre por su registro respectivo. Los cierres y atenciones pueden haberse registrado después del periodo de entrada.
            </p>
          </div>
        </>
      )}
    </section>
  );
}


// Agrupa la misma población que utiliza el KPI 3 según su primera entrada a RRLL.
// La condición atendido es el estado actual del proceso, no una atención ocurrida en ese mes.
function EvolucionMensualDisciplinarios({ detalle = [] }) {
  const [mesActivo, setMesActivo] = useState(null);
  const meses = useMemo(() => {
    const grupos = new Map();
    detalle.forEach((proceso) => {
      const fecha = String(proceso.FechaEntradaRRLL || "").slice(0, 7);
      if (!/^\d{4}-\d{2}$/.test(fecha)) return;
      if (!grupos.has(fecha)) grupos.set(fecha, { mes: fecha, agendados: 0, atendidos: 0, pendientes: 0 });
      const grupo = grupos.get(fecha);
      grupo.agendados += 1;
      if (proceso.FueAtendido) grupo.atendidos += 1;
      else grupo.pendientes += 1;
    });
    return [...grupos.values()].sort((a, b) => a.mes.localeCompare(b.mes));
  }, [detalle]);
  const maximo = Math.max(1, ...meses.map((mes) => mes.agendados));
  const nombreMes = (mes) => {
    const [anio, numero] = mes.split("-");
    return `${["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][Number(numero) - 1]} ${anio}`;
  };
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" aria-label="Evolución mensual disciplinaria">
      <h4 className="font-bold text-gray-900">Evolución mensual de procesos disciplinarios</h4>
      <p className="mt-1 text-xs leading-5 text-gray-500">Procesos agrupados por el mes de su primera entrada a RRLL. Las atenciones y pendientes reflejan su situación registrada actualmente, incluso si se atendieron después.</p>
      {meses.length === 0 ? <p className="mt-5 text-sm text-gray-500">No hay fechas de entrada a RRLL disponibles para construir la evolución mensual.</p> : <>
        <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-gray-700">
          <span><span className="mr-2 inline-block h-3 w-3 rounded-sm bg-emerald-600" />Atendidos</span>
          <span><span className="mr-2 inline-block h-3 w-3 rounded-sm bg-amber-500" />Pendientes de atención</span>
        </div>
        <div className="mt-5 overflow-x-auto pb-2">
          <div className="flex min-w-max items-end gap-3 border-b border-gray-200 pb-2" style={{ minHeight: 230 }}>
            {meses.map((mes) => {
              const alto = Math.max(8, mes.agendados / maximo * 165);
              const activo = mesActivo === mes.mes;
              return <div key={mes.mes} className="relative flex w-20 shrink-0 flex-col items-center justify-end gap-2" style={{ height: 220 }}
                onMouseEnter={() => setMesActivo(mes.mes)} onMouseLeave={() => setMesActivo(null)}>
                {activo && <div className="absolute bottom-[205px] z-10 w-44 rounded-lg bg-gray-900 p-3 text-xs text-white shadow-lg">
                  <strong>{nombreMes(mes.mes)}</strong><div>Agendados: {mes.agendados}</div><div>Atendidos: {mes.atendidos}</div><div>Pendientes: {mes.pendientes}</div><div>Cobertura por procesos: {(mes.atendidos / mes.agendados * 100).toFixed(1).replace(".", ",")} %</div>
                </div>}
                <span className="text-xs font-bold text-gray-700">{mes.agendados}</span>
                <div className="flex w-11 flex-col overflow-hidden rounded-t-md" style={{ height: alto }} tabIndex={0} aria-label={`${nombreMes(mes.mes)}: ${mes.agendados} agendados, ${mes.atendidos} atendidos, ${mes.pendientes} pendientes`} onFocus={() => setMesActivo(mes.mes)} onBlur={() => setMesActivo(null)}>
                  <div className="bg-amber-500" style={{ height: `${mes.pendientes / mes.agendados * 100}%` }} />
                  <div className="bg-emerald-600" style={{ height: `${mes.atendidos / mes.agendados * 100}%` }} />
                </div>
                <span className="text-center text-[11px] font-semibold text-gray-600">{nombreMes(mes.mes)}</span>
              </div>;
            })}
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500">Cada barra representa el total de procesos que ingresaron en ese mes; pase el mouse sobre ella para ver el desglose. No corresponde al KPI de trabajadores únicos.</p>
      </>}
    </section>
  );
}


// Panel independiente: no altera el KPI3, los permisos ni la gestión mensual.
function AgendaSemanalDisciplinaria({ apiBase }) {
  // Panel de citas independiente del KPI 3 y de su gestión mensual.
  const fechaLocal = (fecha) => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
  const desplazar = (valor, dias) => {
    const fecha = new Date(`${valor}T12:00:00`);
    fecha.setDate(fecha.getDate() + dias);
    return fechaLocal(fecha);
  };
  const lunesDe = (valor) => {
    const fecha = new Date(`${valor}T12:00:00`);
    return desplazar(valor, -((fecha.getDay() + 6) % 7));
  };
  const hoy = fechaLocal(new Date());
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [periodo, setPeriodo] = useState(null);
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("TODAS");
  const [busqueda, setBusqueda] = useState("");
  const [diaSeleccionado, setDiaSeleccionado] = useState("");
  const [pagina, setPagina] = useState(1);
  const aplicar = (inicio, fin) => {
    setDesde(inicio);
    setHasta(fin);
    setPeriodo({ inicio, fin });
    setFiltro("TODAS");
    setDiaSeleccionado("");
    setBusqueda("");
    setPagina(1);
    setError("");
  };
  const limpiarConsulta = () => {
    setDesde("");
    setHasta("");
    setPeriodo(null);
    setCitas([]);
    setFiltro("TODAS");
    setDiaSeleccionado("");
    setBusqueda("");
    setPagina(1);
    setError("");
  };
  const consultar = () => {
    if (!desde || !hasta) return setError("Seleccione la fecha inicial y final.");
    if (hasta < desde) return setError("La fecha final no puede ser anterior a la inicial.");
    const dias = Math.round((new Date(`${hasta}T12:00:00`) - new Date(`${desde}T12:00:00`)) / 86400000) + 1;
    if (dias > 366) return setError("Para mantener la consulta ágil, seleccione un período de máximo 366 días.");
    aplicar(desde, hasta);
  };
  useEffect(() => {
    if (!periodo?.inicio || !periodo?.fin) return;
    let vigente = true;
    const cargar = async () => {
      setCargando(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const params = new URLSearchParams({ fecha_inicio: periodo.inicio, fecha_fin: periodo.fin });
        const respuesta = await fetch(`${apiBase}/indicadores-procesos-disciplinarios/agenda-semanal?${params}`, {
          headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        const cuerpo = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok) throw new Error(typeof cuerpo.detail === "string" ? cuerpo.detail : "No fue posible consultar las citas.");
        if (vigente) setCitas(Array.isArray(cuerpo.citas) ? cuerpo.citas : []);
      } catch (err) {
        if (vigente) { setCitas([]); setError(err.message || "Error consultando la agenda."); }
      } finally { if (vigente) setCargando(false); }
    };
    cargar();
    return () => { vigente = false; };
  }, [apiBase, periodo]);

  const estadoDe = (c) => String(c.estado || "SIN_ESTADO").trim().toUpperCase();
  const grupos = [
    { id: "TODAS", nombre: "Total de citas", color: "text-blue-700" },
    { id: "ATENDIDO", nombre: "Atendidas", color: "text-emerald-700" },
    { id: "EN_CURSO", nombre: "En curso", color: "text-amber-700" },
    { id: "PROGRAMADO", nombre: "Programadas", color: "text-sky-700" },
    { id: "REPROGRAMADO", nombre: "Reprogramadas", color: "text-violet-700" },
    { id: "CANCELADO", nombre: "Canceladas", color: "text-slate-700" },
  ];
  const requiereRevision = (c) =>
    ["PROGRAMADO", "EN_CURSO"].includes(estadoDe(c)) &&
    String(c.fecha || "").slice(0, 10) < hoy;
  const conteo = (id) => id === "TODAS" ? citas.length : id === "REVISION" ? citas.filter(requiereRevision).length : citas.filter(c => estadoDe(c) === id).length;
  const minutos = (items) => items.reduce((s, c) => s + Math.max(0, Number(c.minutosReservados) || 0), 0);
  const horas = (n) => `${Math.floor(n / 60)} h ${String(n % 60).padStart(2, "0")} min`;
  const tiempoEstado = (estado, registros = citas) => minutos(registros.filter(c => estadoDe(c) === estado));
  const totalDias = periodo ? Math.round((new Date(`${periodo.fin}T12:00:00`) - new Date(`${periodo.inicio}T12:00:00`)) / 86400000) + 1 : 0;
  const dias = Array.from({ length: Math.max(0, Math.min(totalDias, 366)) }, (_, i) => {
    const fecha = desplazar(periodo.inicio, i);
    const registros = citas.filter(c => String(c.fecha || "").slice(0, 10) === fecha);
    const nombre = new Intl.DateTimeFormat("es-CO", { weekday: "long" }).format(new Date(`${fecha}T12:00:00`));
    return { fecha, nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1), registros, atendidas: registros.filter(c => estadoDe(c) === "ATENDIDO").length, enCurso: registros.filter(c => estadoDe(c) === "EN_CURSO").length, programadas: registros.filter(c => estadoDe(c) === "PROGRAMADO").length, reprogramadas: registros.filter(c => estadoDe(c) === "REPROGRAMADO").length, canceladas: registros.filter(c => estadoDe(c) === "CANCELADO").length, minutosTotales: minutos(registros), minutosAtendidos: tiempoEstado("ATENDIDO", registros), minutosEnCurso: tiempoEstado("EN_CURSO", registros), minutosProgramados: tiempoEstado("PROGRAMADO", registros), minutosReprogramados: tiempoEstado("REPROGRAMADO", registros), minutosCancelados: tiempoEstado("CANCELADO", registros) };
  });
  const visibles = citas.filter(c =>
    (filtro === "TODAS" || (filtro === "REVISION" ? requiereRevision(c) : estadoDe(c) === filtro)) &&
    (!diaSeleccionado || String(c.fecha || "").slice(0, 10) === diaSeleccionado) &&
    `${c.trabajador || ""} ${c.identificacion || ""} ${c.idProceso || ""}`.toLowerCase().includes(busqueda.trim().toLowerCase())
  );
  const porPagina = 15;
  const paginas = Math.max(1, Math.ceil(visibles.length / porPagina));
  const visiblesPaginados = visibles.slice((Math.min(pagina, paginas) - 1) * porPagina, Math.min(pagina, paginas) * porPagina);
  const seleccionarEstado = (id) => { setFiltro(id); setDiaSeleccionado(""); setBusqueda(""); setPagina(1); };
  const seleccionarDia = (fecha) => { setDiaSeleccionado(diaSeleccionado === fecha ? "" : fecha); setPagina(1); };
  const limpiarFiltros = () => { setFiltro("TODAS"); setDiaSeleccionado(""); setBusqueda(""); setPagina(1); };
  const filtrosActivos = filtro !== "TODAS" || Boolean(diaSeleccionado) || Boolean(busqueda.trim());
  const atendidas = conteo("ATENDIDO");
  const porcentajeAtendidas = citas.length ? Math.round(atendidas * 100 / citas.length) : 0;
  const maxDia = Math.max(1, ...dias.map(d => d.registros.length));
  const enCursoPasadas = citas.filter(c => estadoDe(c) === "EN_CURSO" && String(c.fecha || "").slice(0, 10) < hoy);
  const nombreEstado = (id) => id === "REVISION" ? "Pendientes de revisión" : grupos.find(g => g.id === id)?.nombre || id.replaceAll("_", " ");
  const citasRevision = citas.filter(requiereRevision);
  const citasPendientes = citas.filter(c => ["PROGRAMADO", "EN_CURSO"].includes(estadoDe(c)));
  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
      <header className="border-b border-blue-100 bg-blue-50/60 px-5 py-5 md:px-7">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Agenda RRLL · Seguimiento operativo</p>
        <h3 className="mt-1 text-xl font-bold text-slate-900">Gestión de citas disciplinarias por fecha</h3>
        <p className="mt-1 text-sm text-slate-600">Consulte un día, una semana o un rango libre. Las cifras y el detalle corresponden a las fechas consultadas.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => aplicar(hoy, hoy)} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">Hoy</button>
          <button type="button" onClick={() => aplicar(lunesDe(hoy), desplazar(lunesDe(hoy), 4))} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">Esta semana (lunes a viernes)</button>
          <button type="button" onClick={() => aplicar(desplazar(lunesDe(periodo?.inicio || hoy), -7), desplazar(lunesDe(periodo?.inicio || hoy), -3))} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">Semana anterior</button>
          <button type="button" onClick={() => aplicar(hoy.slice(0, 7) + "-01", hoy)} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">Mes actual</button>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
          <label className="text-xs font-semibold text-slate-700">Fecha inicial
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold text-slate-700">Fecha final
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
          </label>
          <button type="button" onClick={consultar} disabled={cargando} className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50">{cargando ? "Consultando..." : "Consultar citas"}</button>
          <button type="button" onClick={limpiarConsulta} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100">Limpiar filtros</button>
        </div>
        {periodo && <p className="mt-3 text-xs font-semibold text-blue-800">Resultados del {formatearFecha(periodo.inicio)} al {formatearFecha(periodo.fin)} · {totalDias} día(s)</p>}
      </header>
      {!periodo ? (
        <div className="p-6 text-sm text-slate-600 md:p-7">
          {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          Seleccione una fecha inicial y una fecha final para consultar las citaciones disciplinarias.
        </div>
      ) : (
      <div className="space-y-5 p-5 md:p-7">
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {cargando && <p className="text-sm text-slate-500">Actualizando citas reales...</p>}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          {grupos.map(g => (
            <button key={g.id} type="button" onClick={() => seleccionarEstado(g.id)} aria-pressed={filtro === g.id}
              className={`rounded-xl border p-4 text-left transition hover:shadow-md ${filtro === g.id ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 bg-white"}`}>
              <p className="text-xs font-semibold text-slate-600">{g.nombre}</p>
              <p className={`mt-2 text-3xl font-extrabold ${g.color}`}>{conteo(g.id)}</p>
              <p className="mt-2 text-xs text-blue-700">Ver trabajadores y citas</p>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm text-slate-600">Tiempo reservado en agenda</p><p className="mt-2 text-2xl font-bold text-slate-900">{horas(minutos(citas))}</p><p className="mt-1 text-xs text-slate-500">Suma de horarios de las citas registradas.</p></div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm text-emerald-800">Tiempo reservado de citas atendidas</p><p className="mt-2 text-2xl font-bold text-emerald-900">{horas(minutos(citas.filter(c => estadoDe(c) === "ATENDIDO")))}</p><p className="mt-1 text-xs text-emerald-800">No equivale a tiempo real de atención.</p></div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-800">Inasistencias: sin clasificación</p><p className="mt-2 text-sm text-amber-900">No se infieren ausencias por falta de descargo o cierre.</p></div>
        </div>
        <div className="rounded-xl border border-blue-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-slate-800">Balance de citas y tiempo del período</h4>
              <p className="mt-1 text-xs text-slate-500">Cálculo con los minutos reservados de cada cita, normalmente 40 minutos. No mide la duración real de la atención.</p>
            </div>
            <span className="text-xs font-semibold text-blue-700">{citas.length} cita(s) registradas</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-600">Agenda total</p><p className="mt-1 text-xl font-bold text-slate-900">{horas(minutos(citas))}</p><p className="text-xs text-slate-500">{citas.length} citas</p></div>
            <div className="rounded-lg bg-emerald-50 p-3"><p className="text-xs text-emerald-800">Atenciones registradas</p><p className="mt-1 text-xl font-bold text-emerald-800">{horas(tiempoEstado("ATENDIDO"))}</p><p className="text-xs text-emerald-700">{atendidas} citas atendidas</p></div>
            <div className="rounded-lg bg-sky-50 p-3"><p className="text-xs text-sky-800">Programadas o en curso</p><p className="mt-1 text-xl font-bold text-sky-800">{horas(minutos(citasPendientes))}</p><p className="text-xs text-sky-700">{citasPendientes.length} citas sin estado ATENDIDO</p></div>
            <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-600">Reprogramadas o canceladas</p><p className="mt-1 text-xl font-bold text-slate-800">{horas(tiempoEstado("REPROGRAMADO") + tiempoEstado("CANCELADO"))}</p><p className="text-xs text-slate-500">{conteo("REPROGRAMADO") + conteo("CANCELADO")} citas</p></div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div><p className="text-sm font-bold text-amber-900">Pendientes de revisión: {citasRevision.length} cita(s) · {horas(minutos(citasRevision))}</p><p className="mt-1 text-xs text-amber-800">Son citas de fechas anteriores que aún aparecen PROGRAMADO o EN CURSO. No se consideran inasistencias confirmadas.</p></div>
            <button type="button" onClick={() => seleccionarEstado("REVISION")} className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100">Ver trabajadores por revisar</button>
          </div>
          <p className="mt-3 text-xs text-slate-500">Los estados no contemplados en estas categorías, si existen, permanecen incluidos en el total de agenda. El tiempo reservado de una cita atendida no es un cronómetro de trabajo efectivo.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="font-bold text-slate-800">Distribución del tiempo del período</h4>
          <p className="mt-1 text-xs text-slate-500">Cada cita aporta sus minutos reservados en agenda (normalmente 40). Los estados se muestran por separado para evitar descuentos incorrectos.</p>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              { etiqueta: "Atendidas", estado: "ATENDIDO", color: "text-emerald-700" },
              { etiqueta: "En curso", estado: "EN_CURSO", color: "text-amber-700" },
              { etiqueta: "Programadas", estado: "PROGRAMADO", color: "text-sky-700" },
              { etiqueta: "Reprogramadas", estado: "REPROGRAMADO", color: "text-violet-700" },
              { etiqueta: "Canceladas", estado: "CANCELADO", color: "text-slate-700" },
            ].map(item => (
              <div key={item.estado} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-600">{item.etiqueta} · {conteo(item.estado)} cita(s)</p>
                <p className={`mt-1 text-lg font-bold ${item.color}`}>{horas(tiempoEstado(item.estado))}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-600">Tiempo de citas atendidas = minutos reservados de las citas con estado ATENDIDO; no es duración real cronometrada. Las inasistencias no se descuentan porque la agenda aún no registra ese estado de forma confirmada.</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h4 className="font-bold text-slate-800">Resumen del período</h4><p className="mt-1 text-xs text-slate-500">Proporción de citas cuyo estado actual es ATENDIDO. No mide puntualidad.</p></div><strong className="text-2xl text-emerald-700">{citas.length ? `${porcentajeAtendidas} %` : "Sin datos"}</strong></div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${porcentajeAtendidas}%` }} /></div>
          <p className="mt-2 text-xs text-slate-600">{citas.length ? `${atendidas} de ${citas.length} citas registradas figuran como atendidas.` : "Sin citaciones registradas en este período. No se calcula porcentaje de atención."}</p>
        </div>
        {enCursoPasadas.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">
            <strong>{enCursoPasadas.length} cita(s) de fechas anteriores permanecen EN CURSO.</strong>
            <p className="mt-1 text-xs">Es una alerta para revisión del registro; no significa inasistencia ni modifica el estado automáticamente.</p>
            <button type="button" onClick={() => seleccionarEstado("EN_CURSO")} className="mt-2 text-xs font-bold text-amber-900 underline">Ver citas en curso</button>
          </div>
        )}
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="font-bold text-slate-800">Resumen diario de citaciones</h4>
              <p className="mt-1 text-xs text-slate-500">Cada fecha muestra el total y el desglose por estado actual. Seleccione un día para ver sus trabajadores.</p>
            </div>
            <button type="button" onClick={() => { setDiaSeleccionado(""); setPagina(1); }} className="text-xs font-semibold text-blue-700">Ver todos los días</button>
          </div>
          <div className="mt-4 max-h-[460px] space-y-2 overflow-y-auto pr-1">
            {dias.map(d => (
              <button type="button" key={d.fecha} onClick={() => seleccionarDia(d.fecha)} aria-pressed={diaSeleccionado === d.fecha}
                className={`w-full rounded-xl border p-3 text-left transition ${diaSeleccionado === d.fecha ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200" : "border-slate-200 hover:bg-slate-50"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3"><span className="text-sm font-bold text-slate-800">{d.nombre}</span><span className="text-xs text-slate-500">{formatearFecha(d.fecha)}</span></div>
                  <span className="text-sm font-extrabold text-blue-700">{d.registros.length} {d.registros.length === 1 ? "cita" : "citas"}</span>
                </div>
                {d.registros.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-400">Sin citaciones registradas</p>
                ) : (
                  <>
                    <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                      {[
                        { cantidad: d.atendidas, clase: "bg-emerald-500" },
                        { cantidad: d.enCurso, clase: "bg-amber-500" },
                        { cantidad: d.programadas, clase: "bg-sky-500" },
                        { cantidad: d.reprogramadas, clase: "bg-violet-500" },
                        { cantidad: d.canceladas, clase: "bg-slate-500" },
                      ].map((parte, indice) => parte.cantidad > 0 ? <div key={indice} className={parte.clase} style={{ width: `${parte.cantidad / d.registros.length * 100}%` }} /> : null)}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-xs sm:grid-cols-3">
                      <div><span className="text-slate-500">Tiempo programado del día</span><p className="font-bold text-slate-900">{horas(d.minutosTotales)}</p></div>
                      <div><span className="text-slate-500">Citas atendidas</span><p className="font-bold text-emerald-700">{horas(d.minutosAtendidos)}</p></div>
                      <div><span className="text-slate-500">En curso</span><p className="font-bold text-amber-700">{horas(d.minutosEnCurso)}</p></div>
                      <div><span className="text-slate-500">Programadas</span><p className="font-bold text-sky-700">{horas(d.minutosProgramados)}</p></div>
                      <div><span className="text-slate-500">Reprogramadas</span><p className="font-bold text-violet-700">{horas(d.minutosReprogramados)}</p></div>
                      <div><span className="text-slate-500">Canceladas</span><p className="font-bold text-slate-700">{horas(d.minutosCancelados)}</p></div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-700">
                      <span><span className="font-bold text-emerald-700">{d.atendidas}</span> atendidas</span>
                      <span><span className="font-bold text-amber-700">{d.enCurso}</span> en curso</span>
                      <span><span className="font-bold text-sky-700">{d.programadas}</span> programadas</span>
                      <span><span className="font-bold text-violet-700">{d.reprogramadas}</span> reprogramadas</span>
                      <span><span className="font-bold text-slate-700">{d.canceladas}</span> canceladas</span>
                    </div>
                  </>
                )}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">La barra de cada día representa la distribución de sus citas por estado; no representa horas trabajadas ni duración de atención. Los estados no contemplados en el desglose siguen incluidos en el total.</p>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4"><div><h4 className="font-bold text-slate-800">Trabajadores y citas del período</h4><p className="text-xs text-slate-500">{visibles.length} registro(s) · {nombreEstado(filtro)}{diaSeleccionado ? ` · ${formatearFecha(diaSeleccionado)}` : ""}</p></div><input aria-label="Buscar trabajador" type="search" value={busqueda} onChange={e => { setBusqueda(e.target.value); setPagina(1); }} placeholder="Buscar nombre, cédula o proceso" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm sm:w-72" /></div>
          {filtrosActivos && <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-blue-50/50 px-4 py-3 text-xs"><span className="font-semibold text-slate-700">Filtros:</span>{filtro !== "TODAS" && <span className="rounded-full bg-white px-3 py-1 text-blue-800 ring-1 ring-blue-200">{nombreEstado(filtro)}</span>}{diaSeleccionado && <span className="rounded-full bg-white px-3 py-1 text-blue-800 ring-1 ring-blue-200">{formatearFecha(diaSeleccionado)}</span>}{busqueda.trim() && <span className="rounded-full bg-white px-3 py-1 text-blue-800 ring-1 ring-blue-200">{busqueda}</span>}<button type="button" onClick={limpiarFiltros} className="ml-auto rounded-lg border border-blue-200 bg-white px-3 py-1.5 font-semibold text-blue-700">Limpiar filtros ×</button></div>}
          <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-100 text-sm"><thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600"><tr>{["Trabajador", "Identificación", "Proceso", "Fecha de cita", "Horario programado", "Minutos reservados", "Estado actual"].map(h => <th key={h} className="whitespace-nowrap px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{visiblesPaginados.map((c, i) => <tr key={`${c.idAgenda || c.idProceso}-${i}`} className="hover:bg-blue-50/40"><td className="px-4 py-3 font-medium text-slate-800">{c.trabajador || "-"}</td><td className="px-4 py-3">{c.identificacion || "-"}</td><td className="px-4 py-3">#{c.idProceso}</td><td className="whitespace-nowrap px-4 py-3">{formatearFecha(c.fecha)}</td><td className="whitespace-nowrap px-4 py-3">{String(c.horaInicio || "-").slice(0, 5)} - {String(c.horaFin || "-").slice(0, 5)}</td><td className="px-4 py-3">{c.minutosReservados}</td><td className="px-4 py-3 font-semibold">{estadoDe(c).replaceAll("_", " ")}</td></tr>)}{!visibles.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">{citas.length === 0 ? "No hay citas registradas en el período consultado." : "Existen citas, pero ninguna coincide con los filtros. Pulse «Limpiar filtros» para verlas."}</td></tr>}</tbody></table></div>
          {paginas > 1 && <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-600"><span>Página {Math.min(pagina, paginas)} de {paginas}</span><div className="flex gap-2"><button type="button" disabled={pagina <= 1} onClick={() => setPagina(p => Math.max(1, p - 1))} className="rounded border px-3 py-1 disabled:opacity-40">Anterior</button><button type="button" disabled={pagina >= paginas} onClick={() => setPagina(p => Math.min(paginas, p + 1))} className="rounded border px-3 py-1 disabled:opacity-40">Siguiente</button></div></div>}
        </div>
        <p className="text-xs leading-5 text-slate-500"><strong>Importante:</strong> se muestran citas activas según su fecha programada y estado actual. Las horas son tiempo reservado, no duración efectiva de atención. No se infieren inasistencias ni se reconstruyen reprogramaciones históricas inactivas.</p>
      </div>
      )}
    </section>
  );
}
