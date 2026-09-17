import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api";

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

const badgeClase = (tipoRQ) =>
  String(tipoRQ || "").toUpperCase() === "REEMPLAZO"
    ? "border-amber-200 bg-amber-50 text-amber-800"
    : "border-emerald-200 bg-emerald-50 text-emerald-800";

const etiquetaTipoRQ = (tipoRQ) =>
  String(tipoRQ || "").toUpperCase() === "PERSONAL_NUEVO"
    ? "Personal nuevo"
    : "Reemplazo";

const SeleccionRQView = () => {
  const [rqs, setRqs] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [rqExpandida, setRqExpandida] = useState(null);

  const cargarRqs = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "No se encontró una sesión válida. Inicia sesión nuevamente."
        );
      }

      const response = await fetch(`${API_BASE_URL}/seleccion/rq`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      let data = null;

      try {
        data = await response.json();
      } catch (_) {
        data = null;
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "La sesión no está autenticada o el token expiró. Inicia sesión nuevamente."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "Tu usuario no tiene permisos para consultar las RQ de Selección."
          );
        }

        throw new Error(
          data?.detail ||
            data?.message ||
            "No fue posible consultar las RQ de Selección."
        );
      }

      if (!data?.success) {
        throw new Error(
          data?.message || "La consulta de RQ no respondió correctamente."
        );
      }

      setRqs(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error("Error consultando RQ de Selección:", err);
      setRqs([]);
      setError(
        err?.message || "Ocurrió un error consultando las RQ de Selección."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarRqs();
  }, [cargarRqs]);

  const [pestanaActiva, setPestanaActiva] = useState("REEMPLAZO");

  const rqsFiltradas = useMemo(() => {
    const termino = normalizarBusqueda(busqueda);

    return rqs.filter((rq) => {
      const tipoRQ = String(rq.TipoRQ || "").toUpperCase();

      if (tipoRQ !== pestanaActiva) return false;
      if (!termino) return true;

      const contenido = normalizarBusqueda(
        [
          rq.IdRQOperaciones,
          rq.NumeroIdentificacion,
          rq.NombreCompleto,
          rq.NombreCliente,
          rq.NombreCargo,
          rq.NombreLider,
          rq.CodigoPerfil,
          rq.DescripcionPerfil,
          rq.TipoNotificacion,
          rq.Ciudad,
          rq.Turno,
          rq.MotivoVacante,
          rq.Observacion,
          rq.ObservacionCliente,
          rq.TipoRQ,
        ].join(" ")
      );

      return contenido.includes(termino);
    });
  }, [rqs, busqueda, pestanaActiva]);

  const totalReemplazos = useMemo(
    () =>
      rqs.filter(
        (rq) => String(rq.TipoRQ || "").toUpperCase() === "REEMPLAZO"
      ).length,
    [rqs]
  );

  const totalPersonalNuevo = useMemo(
    () =>
      rqs.filter(
        (rq) => String(rq.TipoRQ || "").toUpperCase() === "PERSONAL_NUEVO"
      ).length,
    [rqs]
  );

  const toggleDetalle = (idRq) => {
    setRqExpandida((actual) => (actual === idRq ? null : idRq));
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 md:p-6">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-emerald-700">
                
                <span className="text-sm font-semibold uppercase tracking-wide">
                  Selección
                </span>
              </div>

              <h1 className="text-2xl font-bold text-slate-900">
                Requisiciones de vacante - RQ
              </h1>

              <p className="mt-1 max-w-3xl text-sm text-slate-600">
                Consulta de las RQ que Operaciones ya finalizó y envió.
                Esta vista es únicamente de consulta.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={cargarRqs}
              disabled={cargando}
              className="gap-2"
            >
              Actualizar
            </Button>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-900">
              RQ recibidas
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Las requisiciones enviadas por Operaciones se consultan desde Selección.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPestanaActiva("REEMPLAZO")}
                className={`border px-4 py-2 text-sm font-semibold transition ${
                  pestanaActiva === "REEMPLAZO"
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                }`}
              >
                Reemplazos ({totalReemplazos})
              </button>

              <button
                type="button"
                onClick={() => setPestanaActiva("PERSONAL_NUEVO")}
                className={`border px-4 py-2 text-sm font-semibold transition ${
                  pestanaActiva === "PERSONAL_NUEVO"
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                }`}
              >
                Personal nuevo ({totalPersonalNuevo})
              </button>
            </div>
          </div>

          <div className="border-b border-slate-200 p-4">
            <input
              type="text"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder={
                pestanaActiva === "REEMPLAZO"
                  ? "Buscar por RQ, identificación, trabajador, cliente, cargo o perfil..."
                  : "Buscar por RQ, cliente, cargo, perfil, ciudad o solicitante..."
              }
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </section>

        {error && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            <div className="flex items-start gap-3">
              
              <div>
                <p className="font-semibold">No fue posible cargar las RQ</p>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            </div>
          </section>
        )}

        {cargando ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            
            <p className="mt-3 text-sm text-slate-600">
              Consultando requisiciones...
            </p>
          </section>
        ) : !error && rqsFiltradas.length === 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            
            <p className="mt-3 font-semibold text-slate-700">
              No hay RQ para mostrar
            </p>
            <p className="mt-1 text-sm text-slate-500">
              No existen requisiciones que coincidan con los filtros actuales.
            </p>
          </section>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="hidden grid-cols-[110px_1.35fr_1.1fr_1.5fr_150px_100px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-700 lg:grid">
              <div>RQ</div>
              <div>{pestanaActiva === "REEMPLAZO" ? "Trabajador" : "Solicitud"}</div>
              <div>Cargo</div>
              <div>Cliente</div>
              <div>Fecha recibida</div>
              <div className="text-center">Acción</div>
            </div>

            {rqsFiltradas.map((rq) => {
              const abierta = rqExpandida === rq.IdRQOperaciones;

              return (
                <article
                  key={rq.IdRQOperaciones}
                  className="border-b border-slate-200 last:border-b-0"
                >
                  <div className="grid gap-3 px-4 py-4 lg:grid-cols-[110px_1.35fr_1.1fr_1.5fr_150px_100px] lg:items-center lg:gap-4 lg:px-5">
                    <div>
                      <span className="text-xs font-semibold uppercase text-slate-400 lg:hidden">
                        RQ
                      </span>
                      <p className="font-semibold text-slate-900">
                        #{rq.IdRQOperaciones}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <span className="text-xs font-semibold uppercase text-slate-400 lg:hidden">
                        {pestanaActiva === "REEMPLAZO" ? "Trabajador" : "Solicitud"}
                      </span>
                      <p className="truncate font-medium text-slate-900">
                        {pestanaActiva === "REEMPLAZO"
                          ? textoSeguro(rq.NombreCompleto)
                          : etiquetaTipoRQ(rq.TipoRQ)}
                      </p>
                      {pestanaActiva === "REEMPLAZO" && (
                        <p className="mt-1 text-xs text-slate-500">
                          CC {textoSeguro(rq.NumeroIdentificacion)}
                        </p>
                      )}
                    </div>

                    <div className="min-w-0">
                      <span className="text-xs font-semibold uppercase text-slate-400 lg:hidden">
                        Cargo
                      </span>
                      <p className="truncate text-sm text-slate-700">
                        {textoSeguro(rq.NombreCargo)}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <span className="text-xs font-semibold uppercase text-slate-400 lg:hidden">
                        Cliente
                      </span>
                      <p className="truncate text-sm text-slate-700">
                        {textoSeguro(rq.NombreCliente)}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs font-semibold uppercase text-slate-400 lg:hidden">
                        Fecha recibida
                      </span>
                      <p className="text-sm text-slate-700">
                        {formatearFecha(rq.FechaEnvioSeleccion || rq.FechaRegistro)}
                      </p>
                    </div>

                    <div className="lg:text-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => toggleDetalle(rq.IdRQOperaciones)}
                        className="min-w-[76px]"
                      >
                        {abierta ? "Cerrar" : "Ver"}
                      </Button>
                    </div>
                  </div>

                  {abierta && (
                    <div className="border-t border-slate-200 bg-slate-50/70 p-4 md:p-5">
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <Dato
                          titulo="Tipo de notificación"
                          valor={rq.TipoNotificacion}
                        />
                        <Dato
                          titulo="Fecha de retiro"
                          valor={formatearFecha(rq.FechaRetiro)}
                        />
                        <Dato
                          titulo="Último día laborado"
                          valor={formatearFecha(rq.FechaUltimoDiaLaborado)}
                        />
                        <Dato
                          titulo="Líder"
                          valor={rq.NombreLider}
                        />
                        <Dato
                          titulo="Perfil"
                          valor={
                            rq.CodigoPerfil || rq.DescripcionPerfil
                              ? `${textoSeguro(rq.CodigoPerfil, "")}${
                                  rq.CodigoPerfil && rq.DescripcionPerfil
                                    ? " - "
                                    : ""
                                }${textoSeguro(rq.DescripcionPerfil, "")}`
                              : "No aplica"
                          }
                        />
                        <Dato
                          titulo="Ciudad"
                          valor={
                            rq.RequiereReemplazo
                              ? textoSeguro(rq.Ciudad)
                              : "No aplica"
                          }
                        />
                        <Dato
                          titulo="Turno"
                          valor={
                            rq.RequiereReemplazo
                              ? textoSeguro(rq.Turno)
                              : "No aplica"
                          }
                        />
                        <Dato
                          titulo="Motivo de vacante"
                          valor={
                            rq.RequiereReemplazo
                              ? textoSeguro(rq.MotivoVacante)
                              : "No aplica"
                          }
                        />
                        <Dato
                          titulo="Fecha de envío"
                          valor={formatearFechaHora(rq.FechaEnvioSeleccion || rq.FechaEnvioRRLL)}
                        />
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <BloqueTexto
                          titulo="Observación general"
                          valor={rq.Observacion}
                        />
                        <BloqueTexto
                          titulo="Observaciones del cliente"
                          valor={
                            rq.RequiereReemplazo
                              ? rq.ObservacionCliente
                              : "No aplica"
                          }
                        />
                      </div>

                      <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
                        RQ #{rq.IdRQOperaciones} · Consulta de Selección ·
                        Estado técnico: {textoSeguro(rq.EstadoRQ)}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
};

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
