import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api";

const ESTADOS = [
  { id: "ABIERTO", label: "Abiertos" },
  { id: "EN_PROCESO", label: "En proceso" },
  { id: "CERRADO", label: "Cerrados" },
];

const textoSeguro = (valor, fallback = "No registrado") => {
  if (valor === null || valor === undefined) return fallback;
  const texto = String(valor).trim();
  return texto || fallback;
};

const formatearFecha = (valor) => {
  if (!valor) return "No registrada";
  const texto = String(valor);
  const fechaBase = texto.includes("T") ? texto.split("T")[0] : texto.slice(0, 10);
  const partes = fechaBase.split("-");
  if (partes.length !== 3) return textoSeguro(valor);
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

const formatearFechaHora = (valor) => {
  if (!valor) return "No registrada";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return textoSeguro(valor);
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(fecha);
};

const normalizarBusqueda = (valor) =>
  String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const etiquetaTipoRQ = (tipoRQ) =>
  String(tipoRQ || "").toUpperCase() === "PERSONAL_NUEVO"
    ? "Personal nuevo"
    : "Reemplazo";

const claseTipoRQ = (tipoRQ) =>
  String(tipoRQ || "").toUpperCase() === "REEMPLAZO"
    ? "border-amber-200 bg-amber-50 text-amber-800"
    : "border-emerald-200 bg-emerald-50 text-emerald-800";

const claseKpi = (kpi) => {
  const valor = String(kpi || "").toUpperCase();
  if (valor === "CUMPLE" || valor === "EN TIEMPO") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (valor === "CANCELADA") {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }
  if (valor === "NO CUMPLE") {
    return "border-red-200 bg-red-50 text-red-800";
  }
  return "border-slate-200 bg-white text-slate-600";
};

const mensajeErrorApi = async (response, fallback) => {
  let data = null;
  try {
    data = await response.json();
  } catch (_) {
    data = null;
  }
  if (response.status === 401) {
    return "La sesión no está autenticada o el token expiró. Inicia sesión nuevamente.";
  }
  if (response.status === 403) {
    return "Tu usuario no tiene permisos para gestionar las RQ de Selección.";
  }
  return data?.detail || data?.message || fallback;
};

const SeleccionRQView = () => {
  const [rqs, setRqs] = useState([]);
  const [tipificaciones, setTipificaciones] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [pestanaActiva, setPestanaActiva] = useState("ABIERTO");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [rqExpandida, setRqExpandida] = useState(null);
  const [guardando, setGuardando] = useState(null);
  const [busquedaCandidatoPorRq, setBusquedaCandidatoPorRq] = useState({});
  const [candidatoSeleccionadoPorRq, setCandidatoSeleccionadoPorRq] = useState({});
  const [salarioPorRq, setSalarioPorRq] = useState({});
  const [resultadosAspirantesPorRq, setResultadosAspirantesPorRq] = useState({});
  const [buscandoAspirantePorRq, setBuscandoAspirantePorRq] = useState({});
  const [modalCandidatoVinculado, setModalCandidatoVinculado] = useState(null);

  const token = () => localStorage.getItem("token");

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError("");
    setMensaje("");

    try {
      const authToken = token();
      if (!authToken) {
        throw new Error("No se encontró una sesión válida. Inicia sesión nuevamente.");
      }

      const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${authToken}`,
      };

      const [responseRq, responseTipificaciones] = await Promise.all([
        fetch(`${API_BASE_URL}/seleccion/rq`, { method: "GET", headers }),
        fetch(`${API_BASE_URL}/seleccion/rq/catalogos/tipificaciones`, {
          method: "GET",
          headers,
        }),
      ]);

      if (!responseRq.ok) {
        throw new Error(
          await mensajeErrorApi(
            responseRq,
            "No fue posible consultar las RQ de Selección."
          )
        );
      }

      if (!responseTipificaciones.ok) {
        throw new Error(
          await mensajeErrorApi(
            responseTipificaciones,
            "No fue posible consultar las tipificaciones de Selección."
          )
        );
      }

      const dataRq = await responseRq.json();
      const dataTipificaciones = await responseTipificaciones.json();

      if (!dataRq?.success) {
        throw new Error(dataRq?.message || "La consulta de RQ no respondió correctamente.");
      }

      setRqs(Array.isArray(dataRq.data) ? dataRq.data : []);
      setTipificaciones(
        Array.isArray(dataTipificaciones?.data) ? dataTipificaciones.data : []
      );
    } catch (err) {
      console.error("Error cargando RQ de Selección:", err);
      setRqs([]);
      setTipificaciones([]);
      setError(err?.message || "Ocurrió un error consultando las RQ de Selección.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const resumen = useMemo(
    () => ({
      ABIERTO: rqs.filter((rq) => rq.EstadoBandeja === "ABIERTO").length,
      EN_PROCESO: rqs.filter((rq) => rq.EstadoBandeja === "EN_PROCESO").length,
      CERRADO: rqs.filter((rq) => rq.EstadoBandeja === "CERRADO").length,
    }),
    [rqs]
  );

  const rqsFiltradas = useMemo(() => {
    const termino = normalizarBusqueda(busqueda);

    return rqs.filter((rq) => {
      if (String(rq.EstadoBandeja || "").toUpperCase() !== pestanaActiva) {
        return false;
      }

      if (!termino) return true;

      const candidatos = Array.isArray(rq.Candidatos) ? rq.Candidatos : [];
      const contenido = normalizarBusqueda(
        [
          rq.CodigoRQ,
          rq.IdRQOperaciones,
          rq.TipoRQ,
          rq.NumeroIdentificacion,
          rq.NombreCompleto,
          rq.NombreCliente,
          rq.NombreCargo,
          rq.NombreLider,
          rq.CodigoPerfil,
          rq.DescripcionPerfil,
          rq.Ciudad,
          rq.Turno,
          rq.MotivoVacante,
          rq.TipificacionSeleccion,
          rq.Observacion,
          rq.ObservacionCliente,
          ...candidatos.flatMap((c) => [
            c.NumeroIdentificacion,
            c.NombreCompleto,
            c.EstadoProceso,
            c.KPI,
          ]),
        ].join(" ")
      );

      return contenido.includes(termino);
    });
  }, [rqs, busqueda, pestanaActiva]);

  const actualizarRqLocal = (rqActualizada) => {
    if (!rqActualizada?.IdRQOperaciones) return;
    setRqs((actuales) =>
      actuales.map((rq) =>
        rq.IdRQOperaciones === rqActualizada.IdRQOperaciones ? rqActualizada : rq
      )
    );
  };

  const ejecutarAccion = async (idRq, accion, mensajeExito) => {
    setGuardando(idRq);
    setError("");
    setMensaje("");

    try {
      const response = await accion();
      if (!response.ok) {
        throw new Error(
          await mensajeErrorApi(response, "No fue posible completar la operación.")
        );
      }

      const data = await response.json();
      if (!data?.success) {
        throw new Error(data?.message || "La operación no respondió correctamente.");
      }

      actualizarRqLocal(data.data);
      setMensaje(mensajeExito || data.message || "Operación realizada correctamente.");
      return true;
    } catch (err) {
      console.error("Error gestionando RQ de Selección:", err);
      setError(err?.message || "No fue posible completar la operación.");
      return false;
    } finally {
      setGuardando(null);
    }
  };

  const actualizarTipificacion = async (idRq, idTipificacion) => {
    if (!idTipificacion) return;

    const formData = new FormData();
    formData.append("id_tipificacion_rq_seleccion", idTipificacion);

    await ejecutarAccion(
      idRq,
      () =>
        fetch(`${API_BASE_URL}/seleccion/rq/${idRq}/tipificacion`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token()}` },
          body: formData,
        }),
      "Tipificación actualizada correctamente."
    );
  };

  const vincularCandidato = async (idRq) => {
    const candidato = candidatoSeleccionadoPorRq[idRq];
    const idRegistroPersonal = obtenerIdRegistroPersonal(candidato);

    if (!idRegistroPersonal) {
      setError("Busca y selecciona un candidato antes de vincularlo a la RQ.");
      return;
    }

    const salarioTexto = String(salarioPorRq[idRq] ?? "").trim();
    const salarioNormalizado = salarioTexto.replace(/[^0-9.,]/g, "").replace(/\./g, "").replace(",", ".");
    const salario = Number(salarioNormalizado);

    if (
      !salarioTexto ||
      !/^\d{1,7}$/.test(salarioTexto) ||
      !Number.isFinite(salario) ||
      salario <= 0
    ) {
      setError("Ingresa un salario válido de máximo 7 dígitos y solo números.");
      return;
    }

    const formData = new FormData();
    formData.append("id_registro_personal", String(idRegistroPersonal));
    formData.append("salario", salario.toFixed(2));

    const ok = await ejecutarAccion(
      idRq,
      () =>
        fetch(`${API_BASE_URL}/seleccion/rq/${idRq}/candidatos`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token()}` },
          body: formData,
        }),
      "Candidato vinculado a la RQ correctamente."
    );

    if (ok) {
      setModalCandidatoVinculado({
        idRq,
        codigoRq:
          rqs.find((rq) => rq.IdRQOperaciones === idRq)?.CodigoRQ || `RQ #${idRq}`,
        nombre: obtenerNombreCompletoAspirante(candidato),
        documento: obtenerDocumentoAspirante(candidato),
        salario,
      });
      setBusquedaCandidatoPorRq((actual) => ({ ...actual, [idRq]: "" }));
      setCandidatoSeleccionadoPorRq((actual) => {
        const copia = { ...actual };
        delete copia[idRq];
        return copia;
      });
      setSalarioPorRq((actual) => {
        const copia = { ...actual };
        delete copia[idRq];
        return copia;
      });
    }
  };

  const sincronizarRq = async (idRq) => {
    await ejecutarAccion(
      idRq,
      () =>
        fetch(`${API_BASE_URL}/seleccion/rq/${idRq}/sincronizar`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token()}`,
          },
        }),
      "RQ sincronizada con la cobertura real."
    );
  };

  const inactivarCandidato = async (idRq, idRegistroPersonal) => {
    await ejecutarAccion(
      idRq,
      () =>
        fetch(
          `${API_BASE_URL}/seleccion/rq/${idRq}/candidatos/${idRegistroPersonal}/inactivar`,
          {
            method: "PUT",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token()}`,
            },
          }
        ),
      "Candidato inactivado sin perder la trazabilidad."
    );
  };

  const toggleDetalle = (idRq) => {
    setRqExpandida((actual) => (actual === idRq ? null : idRq));
  };

  const obtenerIdRegistroPersonal = (aspirante) =>
    aspirante?.IdRegistroPersonal ??
    aspirante?.idRegistroPersonal ??
    aspirante?.id_registro_personal ??
    aspirante?.id ??
    null;

  const obtenerNombresAspirante = (aspirante) =>
    textoSeguro(aspirante?.Nombres ?? aspirante?.nombres ?? aspirante?.Nombre ?? aspirante?.nombre, "");

  const obtenerApellidosAspirante = (aspirante) =>
    textoSeguro(aspirante?.Apellidos ?? aspirante?.apellidos ?? aspirante?.Apellido ?? aspirante?.apellido, "");

  const obtenerNombreCompletoAspirante = (aspirante) =>
    `${obtenerNombresAspirante(aspirante)} ${obtenerApellidosAspirante(aspirante)}`.trim() || "Sin nombre";

  const obtenerDocumentoAspirante = (aspirante) =>
    textoSeguro(aspirante?.NumeroIdentificacion ?? aspirante?.numeroIdentificacion ?? aspirante?.cedula ?? aspirante?.Cedula, "Sin identificación");

  const obtenerCargoAspirante = (aspirante) =>
    textoSeguro(aspirante?.NombreCargo ?? aspirante?.nombreCargo ?? aspirante?.cargo ?? aspirante?.Cargo, "Cargo no registrado");

  const obtenerEstadoAspirante = (aspirante) =>
    textoSeguro(aspirante?.EstadoProceso ?? aspirante?.estadoProceso ?? aspirante?.estado ?? aspirante?.Estado, "Estado no registrado");

  const ESTADOS_GESTIONABLES_SELECCION = new Set([18, 19, 20, 21, 22, 24, 26, 34]);

  const candidatosDisponibles = (idRq) =>
    Array.isArray(resultadosAspirantesPorRq[idRq])
      ? resultadosAspirantesPorRq[idRq]
      : [];

  useEffect(() => {
    const idRq = rqExpandida;
    if (!idRq || pestanaActiva === "CERRADO") return undefined;

    const termino = String(busquedaCandidatoPorRq[idRq] || "").trim();
    if (termino.length < 2 || candidatoSeleccionadoPorRq[idRq]) {
      setResultadosAspirantesPorRq((actual) => ({ ...actual, [idRq]: [] }));
      setBuscandoAspirantePorRq((actual) => ({ ...actual, [idRq]: false }));
      return undefined;
    }

    const controlador = new AbortController();
    const temporizador = window.setTimeout(async () => {
      setBuscandoAspirantePorRq((actual) => ({ ...actual, [idRq]: true }));

      try {
        const authToken = token();
        if (!authToken) throw new Error("No se encontró una sesión válida.");

        const response = await fetch(
          `${API_BASE_URL}/aspirantes?search=${encodeURIComponent(termino)}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            signal: controlador.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            await mensajeErrorApi(
              response,
              "No fue posible buscar aspirantes para la RQ."
            )
          );
        }

        const data = await response.json();
        const lista = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.aspirantes)
          ? data.aspirantes
          : [];

        const filtrados = lista
          .filter((aspirante) => {
            const idRegistro = obtenerIdRegistroPersonal(aspirante);
            if (!idRegistro) return false;

            const idEstadoProceso = Number(
              aspirante.IdEstadoProceso ??
                aspirante.idEstadoProceso ??
                aspirante.id_estado_proceso ??
                aspirante.estadoId ??
                aspirante.idEstado ??
                0
            );

            return ESTADOS_GESTIONABLES_SELECCION.has(idEstadoProceso);
          })
          .slice(0, 8);

        setResultadosAspirantesPorRq((actual) => ({
          ...actual,
          [idRq]: filtrados,
        }));
      } catch (err) {
        if (err?.name !== "AbortError") {
          console.error("Error buscando aspirantes para RQ:", err);
          setResultadosAspirantesPorRq((actual) => ({ ...actual, [idRq]: [] }));
          setError(err?.message || "No fue posible buscar aspirantes.");
        }
      } finally {
        if (!controlador.signal.aborted) {
          setBuscandoAspirantePorRq((actual) => ({ ...actual, [idRq]: false }));
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(temporizador);
      controlador.abort();
    };
  }, [
    rqExpandida,
    pestanaActiva,
    busquedaCandidatoPorRq,
    candidatoSeleccionadoPorRq,
  ]);

  const seleccionarCandidato = (idRq, aspirante) => {
    const idRegistro = obtenerIdRegistroPersonal(aspirante);
    if (!idRegistro) {
      setError(
        "El aspirante seleccionado no tiene IdRegistroPersonal disponible y no puede vincularse."
      );
      return;
    }

    setError("");
    setCandidatoSeleccionadoPorRq((actual) => ({
      ...actual,
      [idRq]: { ...aspirante, IdRegistroPersonal: idRegistro },
    }));
    setBusquedaCandidatoPorRq((actual) => ({
      ...actual,
      [idRq]: obtenerNombreCompletoAspirante(aspirante),
    }));
    setResultadosAspirantesPorRq((actual) => ({ ...actual, [idRq]: [] }));
  };

  return (
    <div className="min-h-full bg-slate-50 p-3 sm:p-4 md:p-6">
      <div className="mx-auto w-full max-w-[1500px] space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Selección
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                Gestión de requisiciones - RQ
              </h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-600">
                Consulta las requisiciones recibidas desde Operaciones, tipifica la necesidad,
                asigna la persona seleccionada y realiza seguimiento hasta su cierre.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={cargarDatos}
              disabled={cargando}
            >
              {cargando ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4 md:p-5">
            <div className="flex flex-wrap gap-2">
              {ESTADOS.map((estado) => (
                <button
                  key={estado.id}
                  type="button"
                  onClick={() => setPestanaActiva(estado.id)}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                    pestanaActiva === estado.id
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {estado.label} ({resumen[estado.id] || 0})
                </button>
              ))}
            </div>

            <div className="mt-4">
              <input
                type="text"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar por RQ, candidato, identificación, cliente, cargo, perfil, ciudad, tipificación o KPI..."
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>
        </section>

        {mensaje && (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            {mensaje}
          </section>
        )}

        {error && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            <p className="font-semibold">No fue posible completar la operación</p>
            <p className="mt-1 text-sm">{error}</p>
          </section>
        )}

        {cargando ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-600">Consultando requisiciones...</p>
          </section>
        ) : rqsFiltradas.length === 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="font-semibold text-slate-700">No hay RQ para mostrar</p>
            <p className="mt-1 text-sm text-slate-500">
              No existen requisiciones que coincidan con los filtros actuales.
            </p>
          </section>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="hidden grid-cols-[135px_130px_1.15fr_1.3fr_125px_150px_120px_100px] gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600 xl:grid">
              <div>RQ</div>
              <div>Tipo</div>
              <div>Cargo</div>
              <div>Sede</div>
              <div>Cobertura</div>
              <div>Tipificación</div>
              <div>Recibida</div>
              <div className="text-center">Acción</div>
            </div>

            {rqsFiltradas.map((rq) => {
              const abierta = rqExpandida === rq.IdRQOperaciones;
              const candidatos = Array.isArray(rq.Candidatos) ? rq.Candidatos : [];
              const cantidadSolicitada = Number(rq.CantidadSolicitada || 0);
              const cantidadVinculosActivos = candidatos.filter(
                (candidato) => candidato.ActivoVinculacion
              ).length;
              const cuposActivosDisponibles = Math.max(
                cantidadSolicitada - cantidadVinculosActivos,
                0
              );
              const todosLosCuposActivosOcupados =
                cantidadSolicitada > 0 && cuposActivosDisponibles === 0;

              return (
                <article
                  key={rq.IdRQOperaciones}
                  className="border-b border-slate-200 last:border-b-0"
                >
                  <div className="grid gap-3 px-4 py-4 xl:grid-cols-[135px_130px_1.15fr_1.3fr_125px_150px_120px_100px] xl:items-center xl:gap-3 xl:px-5">
                    <CeldaMovil titulo="RQ">
                      <p className="font-bold text-slate-900">
                        {rq.CodigoRQ || `RQ #${rq.IdRQOperaciones}`}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {rq.DiasGestionRQ ?? 0} día(s) de gestión
                      </p>
                    </CeldaMovil>

                    <CeldaMovil titulo="Tipo">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${claseTipoRQ(
                          rq.TipoRQ
                        )}`}
                      >
                        {etiquetaTipoRQ(rq.TipoRQ)}
                      </span>
                    </CeldaMovil>

                    <CeldaMovil titulo="Cargo">
                      <p className="text-sm font-medium text-slate-800">
                        {textoSeguro(rq.NombreCargo)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Perfil:{" "}
                        {rq.CodigoPerfil
                          ? `${rq.CodigoPerfil} - ${textoSeguro(
                              rq.DescripcionPerfil,
                              ""
                            )}`
                          : textoSeguro(rq.DescripcionPerfil, "No aplica")}
                      </p>
                    </CeldaMovil>

                    <CeldaMovil titulo="Sede">
                      <p className="text-sm text-slate-700">
                        {textoSeguro(rq.NombreCliente)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {textoSeguro(rq.Ciudad, "Ciudad no registrada")}
                      </p>
                    </CeldaMovil>

                    <CeldaMovil titulo="Cobertura">
                      <p className="text-sm font-semibold text-slate-800">
                        {rq.CantidadContratados || 0}/{rq.CantidadSolicitada || 0}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Pendientes: {rq.CantidadPendientes ?? 0}
                      </p>
                    </CeldaMovil>

                    <CeldaMovil titulo="Tipificación">
                      <p className="text-sm text-slate-700">
                        {textoSeguro(rq.TipificacionSeleccion, "Sin tipificar")}
                      </p>
                      {rq.DiasMaximosGestion != null && (
                        <p className="mt-1 text-xs text-slate-500">
                          SLA: {rq.DiasMaximosGestion} días
                        </p>
                      )}
                    </CeldaMovil>

                    <CeldaMovil titulo="Recibida">
                      <p className="text-sm text-slate-700">
                        {formatearFecha(rq.FechaRecibidoSeleccion)}
                      </p>
                    </CeldaMovil>

                    <div className="xl:text-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => toggleDetalle(rq.IdRQOperaciones)}
                        className="w-full xl:w-auto"
                      >
                        {abierta ? "Cerrar" : "Gestionar"}
                      </Button>
                    </div>
                  </div>

                  {abierta && (
                    <div className="border-t border-slate-200 bg-slate-50/70 p-4 md:p-5">
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <Dato titulo="Solicitante" valor={rq.NombreLider} />
                        <Dato titulo="Turno" valor={rq.Turno} />
                        <Dato titulo="Tipo de contrato" valor={rq.TipoContrato} />
                        <Dato
                          titulo="Cargo aprobado planta"
                          valor={
                            rq.CargoAprobadoPlanta === true
                              ? "Sí"
                              : rq.CargoAprobadoPlanta === false
                              ? "No"
                              : "No registrado"
                          }
                        />
                        <Dato titulo="Motivo de vacante" valor={rq.MotivoVacante} />
                        <Dato
                          titulo="Fecha envío Operaciones"
                          valor={formatearFechaHora(rq.FechaEnvioSeleccion)}
                        />
                        <Dato
                          titulo="Fecha efectiva Selección"
                          valor={formatearFecha(rq.FechaRecibidoSeleccion)}
                        />
                        <Dato
                          titulo="Estado"
                          valor={textoSeguro(rq.EstadoBandeja)}
                        />
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <BloqueTexto
                          titulo="Observación general"
                          valor={rq.Observacion}
                        />
                        <BloqueTexto
                          titulo="Observaciones del cliente"
                          valor={rq.ObservacionCliente}
                        />
                      </div>

                      {pestanaActiva !== "CERRADO" && (
                        <>
                          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                              Gestión de Selección
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">
                              1. Tipifica la RQ · 2. Identifica la persona seleccionada · 3. Vincula el candidato a la RQ · 4. Continúa el proceso de Selección
                            </p>
                            <p className="mt-1 text-xs text-slate-600">
                              La RQ conservará la trazabilidad de cada persona gestionada. La cobertura solo se completa cuando Contratación registra al candidato como Contratado.
                            </p>
                          </div>
                          <div className="mt-4 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-2">
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Tipificación de Selección
                            </label>
                            <select
                              value={rq.IdTipificacionRQSeleccion || ""}
                              onChange={(event) =>
                                actualizarTipificacion(
                                  rq.IdRQOperaciones,
                                  event.target.value
                                )
                              }
                              disabled={guardando === rq.IdRQOperaciones}
                              className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500"
                            >
                              <option value="">Seleccionar tipificación</option>
                              {tipificaciones.map((item) => (
                                <option
                                  key={item.IdTipificacionRQSeleccion}
                                  value={item.IdTipificacionRQSeleccion}
                                >
                                  {item.Nombre} - {item.DiasMaximosGestion} días
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            {todosLosCuposActivosOcupados ? (
                              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                  Cupos activos asignados
                                </p>
                                <p className="mt-1 font-semibold text-slate-900">
                                  Esta RQ tiene {cantidadVinculosActivos} de {cantidadSolicitada} cupo(s) activo(s) asignado(s).
                                </p>
                                <p className="mt-2 text-xs leading-5 text-slate-600">
                                  No es necesario vincular otra persona mientras todos los cupos activos estén ocupados.
                                  Si un candidato es inactivado, rechazado o desiste del proceso, el cupo se libera y aquí volverá a habilitarse la búsqueda.
                                </p>
                              </div>
                            ) : (
                              <>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Candidato para la RQ
                            </label>

                            <div className="relative mt-2">
                              <input
                                type="text"
                                autoComplete="off"
                                value={busquedaCandidatoPorRq[rq.IdRQOperaciones] || ""}
                                onChange={(event) => {
                                  const valor = event.target.value;
                                  setBusquedaCandidatoPorRq((actual) => ({
                                    ...actual,
                                    [rq.IdRQOperaciones]: valor,
                                  }));
                                  setCandidatoSeleccionadoPorRq((actual) => {
                                    const copia = { ...actual };
                                    delete copia[rq.IdRQOperaciones];
                                    return copia;
                                  });
                                }}
                                placeholder="Busca por documento, nombre o apellido..."
                                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500"
                              />

                              {!candidatoSeleccionadoPorRq[rq.IdRQOperaciones] &&
                                (busquedaCandidatoPorRq[rq.IdRQOperaciones] || "").trim()
                                  .length >= 2 && (
                                  <div className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                                    {buscandoAspirantePorRq[rq.IdRQOperaciones] ? (
                                      <div className="p-4 text-sm text-slate-500">
                                        Buscando aspirantes...
                                      </div>
                                    ) : candidatosDisponibles(rq.IdRQOperaciones).length === 0 ? (
                                      <div className="p-4 text-sm text-slate-500">
                                        No se encontraron aspirantes gestionables con esa búsqueda.
                                      </div>
                                    ) : (
                                      candidatosDisponibles(rq.IdRQOperaciones).map(
                                        (aspirante, indice) => {
                                          const idRegistro =
                                            obtenerIdRegistroPersonal(aspirante);
                                          return (
                                            <button
                                              key={`${idRegistro || "asp"}-${indice}`}
                                              type="button"
                                              onClick={() =>
                                                seleccionarCandidato(
                                                  rq.IdRQOperaciones,
                                                  aspirante
                                                )
                                              }
                                              className="block w-full border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-emerald-50"
                                            >
                                              <p className="font-semibold text-slate-900">
                                                {obtenerNombreCompletoAspirante(aspirante)}
                                              </p>
                                              <p className="mt-1 text-xs text-slate-500">
                                                CC {obtenerDocumentoAspirante(aspirante)}
                                                {" · "}
                                                {obtenerCargoAspirante(aspirante)}
                                                {" · "}
                                                {obtenerEstadoAspirante(aspirante)}
                                              </p>
                                            </button>
                                          );
                                        }
                                      )
                                    )}
                                  </div>
                                )}
                            </div>

                            {candidatoSeleccionadoPorRq[rq.IdRQOperaciones] && (
                              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                  Persona seleccionada para cubrir la RQ
                                </p>
                                <p className="mt-1 font-semibold text-slate-900">
                                  {obtenerNombreCompletoAspirante(
                                    candidatoSeleccionadoPorRq[rq.IdRQOperaciones]
                                  )}
                                </p>
                                <p className="mt-1 text-xs text-slate-600">
                                  CC{" "}
                                  {obtenerDocumentoAspirante(
                                    candidatoSeleccionadoPorRq[rq.IdRQOperaciones]
                                  )}
                                  {" · "}
                                  {obtenerCargoAspirante(
                                    candidatoSeleccionadoPorRq[rq.IdRQOperaciones]
                                  )}
                                  {" · "}
                                  {obtenerEstadoAspirante(
                                    candidatoSeleccionadoPorRq[rq.IdRQOperaciones]
                                  )}
                                </p>
                                <div className="mt-3">
                                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    Salario
                                  </label>
                                  <div className="relative mt-1">
                                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-semibold text-slate-500">
                                      $
                                    </span>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      autoComplete="off"
                                      maxLength={7}
                                      value={salarioPorRq[rq.IdRQOperaciones] || ""}
                                      onChange={(event) => {
                                        const valor = event.target.value
                                          .replace(/\D/g, "")
                                          .slice(0, 7);
                                        setSalarioPorRq((actual) => ({
                                          ...actual,
                                          [rq.IdRQOperaciones]: valor,
                                        }));
                                      }}
                                      placeholder="Ej. 1800000"
                                      className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-7 pr-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                    />
                                  </div>
                                  <p className="mt-1 text-xs text-slate-500">
                                    Valor manual informado por Selección para esta persona y esta RQ.
                                  </p>
                                </div>

                                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                  <Button
                                    type="button"
                                    onClick={() =>
                                      vincularCandidato(rq.IdRQOperaciones)
                                    }
                                    disabled={
                                      guardando === rq.IdRQOperaciones ||
                                      !String(salarioPorRq[rq.IdRQOperaciones] || "").trim()
                                    }
                                  >
                                    {guardando === rq.IdRQOperaciones
                                      ? "Guardando..."
                                      : "Vincular candidato a la RQ"}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      setBusquedaCandidatoPorRq((actual) => ({
                                        ...actual,
                                        [rq.IdRQOperaciones]: "",
                                      }));
                                      setCandidatoSeleccionadoPorRq((actual) => {
                                        const copia = { ...actual };
                                        delete copia[rq.IdRQOperaciones];
                                        return copia;
                                      });
                                      setSalarioPorRq((actual) => {
                                        const copia = { ...actual };
                                        delete copia[rq.IdRQOperaciones];
                                        return copia;
                                      });
                                    }}
                                    disabled={guardando === rq.IdRQOperaciones}
                                  >
                                    Cambiar candidato
                                  </Button>
                                </div>
                              </div>
                            )}

                            <p className="mt-2 text-xs text-slate-500">
                              Busca al aspirante por documento, nombre o apellido. Sus datos se cargan automáticamente.
                              Al guardar queda asociado a esta RQ para conservar la trazabilidad del proceso.
                              Solo se muestran personas que continúan en estados gestionables de Selección; se excluyen contratados, desistidos, rechazados y estados de RRLL/retiros.
                            </p>

                              </>
                            )}
                          </div>
                          </div>
                        </>
                      )}

                      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="font-bold text-slate-900">Trazabilidad de candidatos</h3>
                            <p className="text-xs text-slate-500">
                              Historial de las personas que han sido gestionadas para cubrir esta RQ.
                            </p>
                          </div>

                          {pestanaActiva !== "CERRADO" && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => sincronizarRq(rq.IdRQOperaciones)}
                              disabled={guardando === rq.IdRQOperaciones}
                            >
                              Sincronizar
                            </Button>
                          )}
                        </div>

                        {candidatos.length === 0 ? (
                          <div className="p-5 text-sm text-slate-500">
                            Todavía no hay candidatos vinculados.
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-200">
                            {candidatos.map((candidato) => (
                              <div
                                key={candidato.IdRQCandidato}
                                className="grid gap-3 p-4 lg:grid-cols-[1.5fr_1fr_120px_120px_110px]"
                              >
                                <div>
                                  <p className="font-semibold text-slate-900">
                                    {textoSeguro(candidato.NombreCompleto)}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    CC {textoSeguro(candidato.NumeroIdentificacion)} · RP{" "}
                                    {candidato.IdRegistroPersonal}
                                  </p>
                                  {candidato.Salario != null && (
                                    <p className="mt-1 text-xs font-medium text-slate-600">
                                      Salario:{" "}
                                      {new Intl.NumberFormat("es-CO", {
                                        style: "currency",
                                        currency: "COP",
                                        maximumFractionDigits: 0,
                                      }).format(Number(candidato.Salario))}
                                    </p>
                                  )}
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-slate-700">
                                    {textoSeguro(candidato.EstadoProceso)}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {candidato.ActivoVinculacion
                                      ? "Vínculo activo"
                                      : "Histórico / inactivo"}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs font-semibold uppercase text-slate-400">
                                    Días
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-slate-800">
                                    {candidato.DiasGestion ?? "—"}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs font-semibold uppercase text-slate-400">
                                    KPI
                                  </p>
                                  <span
                                    className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${claseKpi(
                                      candidato.KPI
                                    )}`}
                                  >
                                    {textoSeguro(candidato.KPI, "Sin KPI")}
                                  </span>
                                </div>

                                <div className="lg:text-right">
                                  {candidato.ActivoVinculacion &&
                                    !candidato.CuentaComoCubierto &&
                                    pestanaActiva !== "CERRADO" && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                          inactivarCandidato(
                                            rq.IdRQOperaciones,
                                            candidato.IdRegistroPersonal
                                          )
                                        }
                                        disabled={guardando === rq.IdRQOperaciones}
                                      >
                                        Inactivar
                                      </Button>
                                    )}
                                  {candidato.CuentaComoCubierto && (
                                    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                                      Cubre vacante
                                    </span>
                                  )}
                                </div>

                                {((candidato.CuentaComoCubierto &&
                                    candidato.FechaContratado) ||
                                  (!candidato.ActivoVinculacion &&
                                    (candidato.FechaCancelacion ||
                                      candidato.ObservacionContratacion))) && (
                                  <div className="lg:col-span-5 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                                    {candidato.CuentaComoCubierto &&
                                      candidato.FechaContratado && (
                                      <span className="mr-4">
                                        Contratado:{" "}
                                        <strong>
                                          {formatearFecha(candidato.FechaContratado)}
                                        </strong>
                                      </span>
                                    )}
                                    {!candidato.ActivoVinculacion &&
                                      candidato.FechaCancelacion && (
                                        <span className="mr-4">
                                          Cancelación:{" "}
                                          <strong>
                                            {formatearFecha(candidato.FechaCancelacion)}
                                          </strong>
                                        </span>
                                      )}
                                    {!candidato.ActivoVinculacion &&
                                      candidato.ObservacionContratacion && (
                                        <span>
                                          Observación:{" "}
                                          <strong>
                                            {candidato.ObservacionContratacion}
                                          </strong>
                                        </span>
                                      )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
                        {rq.CodigoRQ || `RQ #${rq.IdRQOperaciones}`} · Estado técnico:{" "}
                        {textoSeguro(rq.EstadoRQ)} · Solicitados:{" "}
                        {rq.CantidadSolicitada || 0} · Cubiertos:{" "}
                        {rq.CantidadContratados || 0} · Pendientes:{" "}
                        {rq.CantidadPendientes ?? 0}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}

        {modalCandidatoVinculado && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-modal-candidato-vinculado"
              className="w-full max-w-lg rounded-3xl border border-emerald-200 bg-white p-6 shadow-2xl sm:p-7"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700">
                ✓
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Gestión de Selección
                </p>
                <h2
                  id="titulo-modal-candidato-vinculado"
                  className="mt-1 text-2xl font-bold text-slate-900"
                >
                  ¡Candidato vinculado correctamente!
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  La persona quedó asociada a la requisición y la RQ continuará
                  en seguimiento hasta completar la cobertura.
                </p>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Requisición
                    </p>
                    <p className="mt-1 font-bold text-slate-900">
                      {modalCandidatoVinculado.codigoRq}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Documento
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {modalCandidatoVinculado.documento}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Candidato
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {modalCandidatoVinculado.nombre}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Salario registrado
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency: "COP",
                        maximumFractionDigits: 0,
                      }).format(Number(modalCandidatoVinculado.salario))}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => setModalCandidatoVinculado(null)}
                className="mt-6 w-full"
              >
                Entendido
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CeldaMovil = ({ titulo, children }) => (
  <div className="min-w-0">
    <span className="mb-1 block text-xs font-semibold uppercase text-slate-400 xl:hidden">
      {titulo}
    </span>
    {children}
  </div>
);

const Dato = ({ titulo, valor }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      {titulo}
    </p>
    <p className="mt-1 break-words text-sm font-medium text-slate-800">
      {textoSeguro(valor)}
    </p>
  </div>
);

const BloqueTexto = ({ titulo, valor }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      {titulo}
    </p>
    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700">
      {textoSeguro(valor)}
    </p>
  </div>
);

export default SeleccionRQView;
