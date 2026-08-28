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
