import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CitacionProcesoDisciplinarioView from "@/pages/CitacionProcesoDisciplinarioView";
import ProcesoDisciplinarioDetalleView from "@/pages/ProcesoDisciplinarioDetalleView";
import {
  crearProcesoDisciplinario,
  obtenerHistorialDisciplinarioTrabajador,
} from "@/services/procesosDisciplinariosService";

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

export default function IniciarProcesoDisciplinarioView({ onBack }) {
  const [vista, setVista] = useState("inicio");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [trabajador, setTrabajador] = useState(null);
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loadingBuscar, setLoadingBuscar] = useState(false);
  const [loadingCrear, setLoadingCrear] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [procesoCreado, setProcesoCreado] = useState(null);
  const [procesoDetalle, setProcesoDetalle] = useState(null);

  if (vista === "citacion") {
    return (
      <CitacionProcesoDisciplinarioView
        onBack={() => setVista("inicio")}
        proceso={procesoCreado}
        trabajador={trabajador}
      />
    );
  }

  if (vista === "detalle") {
    return (
      <ProcesoDisciplinarioDetalleView
        onBack={() => setVista("inicio")}
        proceso={procesoDetalle}
        trabajador={trabajador}
      />
    );
  }

  const getTipoDocumentoById = (idTipo) => {
    const map = {
      1: "CC",
      2: "CE",
      3: "PPT",
      4: "TI",
    };

    return map[Number(idTipo)] || "CC";
  };

  const cargarDetalleTrabajador = async (item) => {
    try {
      setMensaje("");

      const tipoDocumento = getTipoDocumentoById(item?.IdTipoIdentificacion);
      const numero = item?.NumeroDocumento;

      const resDetalle = await fetch(
        `${API_URL}/rrll/trabajador/detalle?tipo_documento=${encodeURIComponent(
          tipoDocumento
        )}&numero_documento=${encodeURIComponent(numero)}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );

      if (!resDetalle.ok) {
        throw new Error("No se pudo consultar el detalle del trabajador.");
      }

      const dataDetalle = await resDetalle.json();

      const trabajadorFinal = {
        IdRegistroPersonal:
          dataDetalle?.IdRegistroPersonal || item?.IdRegistroPersonal,
        NombreCompleto:
          dataDetalle?.NombreCompleto ||
          item?.NombreCompleto ||
          `${dataDetalle?.Nombres || ""} ${dataDetalle?.Apellidos || ""}`.trim(),
        NumeroDocumento: dataDetalle?.NumeroDocumento || numero,
        TipoDocumento: tipoDocumento,
        Cargo: dataDetalle?.Cargo || "—",
        ClienteNombre: dataDetalle?.ClienteNombre || dataDetalle?.Cliente || "—",
        Sede: dataDetalle?.Sede || "—",
        Estado: dataDetalle?.Estado || dataDetalle?.EstadoProceso || "—",
        Supervisor: dataDetalle?.Supervisor || "—",
        FechaIngreso:
          dataDetalle?.FechaInicio || dataDetalle?.FechaIngreso || "—",
      };

      setTrabajador(trabajadorFinal);
      setResultadosBusqueda([]);

      if (trabajadorFinal.IdRegistroPersonal) {
        try {
          const historialData = await obtenerHistorialDisciplinarioTrabajador(
            trabajadorFinal.IdRegistroPersonal
          );

          setHistorial(Array.isArray(historialData) ? historialData : []);
        } catch {
          setHistorial([]);
        }
      }
    } catch (error) {
      setMensaje(error?.message || "No se pudo cargar el trabajador.");
    }
  };

  const buscarTrabajador = async () => {
    try {
      setMensaje("");
      setTrabajador(null);
      setHistorial([]);
      setResultadosBusqueda([]);

      const texto = String(numeroDocumento || "").trim();

      if (!texto) {
        setMensaje("Debe ingresar el número de documento o nombre del trabajador.");
        return;
      }

      setLoadingBuscar(true);

      const response = await fetch(
        `${API_URL}/rrll/trabajador/buscar?texto=${encodeURIComponent(
          texto
        )}&limite=20`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error("No se encontraron trabajadores con ese criterio.");
      }

      const data = await response.json();
      const resultados = Array.isArray(data) ? data : [];

      if (resultados.length === 0) {
        setMensaje("No se encontraron trabajadores con ese criterio.");
        return;
      }

      if (resultados.length === 1) {
        await cargarDetalleTrabajador(resultados[0]);
        return;
      }

      setResultadosBusqueda(resultados);
    } catch (error) {
      setMensaje(error?.message || "No se pudo buscar el trabajador.");
    } finally {
      setLoadingBuscar(false);
    }
  };

  const iniciarProceso = async () => {
    try {
      setMensaje("");

      if (!trabajador?.IdRegistroPersonal) {
        setMensaje("Debe seleccionar un trabajador antes de continuar.");
        return;
      }

      const procesoActivo = historial.find(
        (item) => item.EstadoProceso !== "CERRADO"
      );

      if (procesoActivo) {
        setProcesoCreado({
          IdProcesoDisciplinario: procesoActivo.IdProcesoDisciplinario,
          IdRegistroPersonal: procesoActivo.IdRegistroPersonal,
          EstadoProceso: procesoActivo.EstadoProceso,
          OrigenProceso: procesoActivo.OrigenProceso,
        });

        setVista("citacion");
        return;
      }

      setLoadingCrear(true);

      const nuevoProceso = await crearProcesoDisciplinario({
        IdRegistroPersonal: trabajador.IdRegistroPersonal,
        EstadoProceso: "INICIADO",
        OrigenProceso: "RRLL",
        UsuarioActualizacion: "rrll",
      });

      setProcesoCreado(nuevoProceso);
      setVista("citacion");
    } catch (error) {
      setMensaje(error?.message || "No se pudo iniciar el proceso disciplinario.");
    } finally {
      setLoadingCrear(false);
    }
  };

  const abrirProcesoExistente = (item) => {
    if (item.EstadoProceso === "CERRADO") {
      setProcesoDetalle(item);
      setVista("detalle");
      return;
    }

    setProcesoCreado({
      IdProcesoDisciplinario: item.IdProcesoDisciplinario,
      IdRegistroPersonal: item.IdRegistroPersonal,
      EstadoProceso: item.EstadoProceso,
      OrigenProceso: item.OrigenProceso,
    });

    setVista("citacion");
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-emerald-600">
        <div className="mb-6">
          <p className="text-sm text-emerald-700 font-semibold">
            Relaciones Laborales
          </p>

          <h2 className="text-2xl font-bold text-gray-800">
            Iniciar Proceso Disciplinario
          </h2>

          <p className="text-sm text-gray-500">
            Paso 1 de 4: selección del trabajador.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
          {["Iniciar", "Citación", "Descargos", "Cierre"].map((item, index) => (
            <div
              key={item}
              className={`rounded-xl border p-4 ${
                index === 0
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : "bg-gray-50 border-gray-200 text-gray-500"
              }`}
            >
              <p className="text-xs font-semibold">Paso {index + 1}</p>
              <p className="font-bold">{item}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-200 p-6 space-y-6">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <h3 className="font-bold text-blue-800">
              Inicio del proceso disciplinario
            </h3>

            <p className="text-sm text-gray-600 mt-2">
              Seleccione el trabajador para iniciar el expediente disciplinario.
              Una vez seleccionado podrá continuar con las etapas de citación,
              descargos, cierre e indicadores.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800">
              Buscar trabajador
            </h3>

            <p className="text-sm text-gray-500 mb-4">
              Busque por número de documento o nombre completo.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
              <Input
                placeholder="Digite documento, nombres o apellidos del trabajador"
                value={numeroDocumento}
                onChange={(e) => setNumeroDocumento(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    buscarTrabajador();
                  }
                }}
              />

              <Button
                type="button"
                className="bg-emerald-700 hover:bg-emerald-800"
                onClick={buscarTrabajador}
                disabled={loadingBuscar}
              >
                {loadingBuscar ? "Buscando..." : "Buscar"}
              </Button>
            </div>

            {mensaje && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {mensaje}
              </div>
            )}
          </div>

          {resultadosBusqueda.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="font-bold text-gray-800 mb-4">
                Coincidencias encontradas
              </h3>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Nombre
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Documento
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold">
                        Acción
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {resultadosBusqueda.map((item) => (
                      <tr key={item.IdRegistroPersonal} className="border-t">
                        <td className="px-4 py-3 text-sm font-semibold">
                          {item.NombreCompleto || "—"}
                        </td>

                        <td className="px-4 py-3 text-sm">
                          {getTipoDocumentoById(item.IdTipoIdentificacion)}{" "}
                          {item.NumeroDocumento}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => cargarDetalleTrabajador(item)}
                          >
                            Seleccionar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <h3 className="font-bold text-emerald-800 mb-4">
              Información del trabajador
            </h3>

            {!trabajador ? (
              <div className="rounded-xl border-2 border-dashed border-emerald-300 bg-white p-10">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-4xl mb-5">
                    👤
                  </div>

                  <h4 className="text-xl font-bold text-gray-800">
                    No hay un trabajador seleccionado
                  </h4>

                  <p className="text-gray-500 mt-2 max-w-xl">
                    Utilice el buscador ubicado en la parte superior para
                    localizar el trabajador con el que desea iniciar el proceso
                    disciplinario.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 rounded-xl bg-white p-5 border border-emerald-200">
                <div>
                  <p className="text-xs text-gray-500">Nombre</p>
                  <p className="font-semibold text-gray-800">
                    {trabajador.NombreCompleto || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Documento</p>
                  <p className="font-semibold text-gray-800">
                    {trabajador.TipoDocumento} {trabajador.NumeroDocumento}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Cargo</p>
                  <p className="font-semibold text-gray-800">
                    {trabajador.Cargo}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Cliente</p>
                  <p className="font-semibold text-gray-800">
                    {trabajador.ClienteNombre}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Sede</p>
                  <p className="font-semibold text-gray-800">
                    {trabajador.Sede}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Fecha ingreso</p>
                  <p className="font-semibold text-gray-800">
                    {trabajador.FechaIngreso}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Estado</p>
                  <p className="font-semibold text-gray-800">
                    {trabajador.Estado}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Supervisor</p>
                  <p className="font-semibold text-gray-800">
                    {trabajador.Supervisor}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="font-bold text-gray-800 mb-4">
              Historial disciplinario
            </h3>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Proceso
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">
                      Citación
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">
                      Descargos
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">
                      Cierre
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Medida
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {historial.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-gray-500 py-12">
                        No existen procesos disciplinarios para mostrar.
                      </td>
                    </tr>
                  ) : (
                    historial.map((item) => (
                      <tr
                        key={item.IdProcesoDisciplinario}
                        className="border-t"
                      >
                        <td className="px-4 py-3 text-sm font-semibold">
                          #{item.IdProcesoDisciplinario}
                        </td>

                        <td className="px-4 py-3 text-sm">
                          {item.FechaCreacion
                            ? String(item.FechaCreacion).slice(0, 10)
                            : "—"}
                        </td>

                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              item.EstadoProceso === "CERRADO"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {item.EstadoProceso || "—"}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center text-sm">
                          {item.TieneCitacion ? "Sí" : "No"}
                        </td>

                        <td className="px-4 py-3 text-center text-sm">
                          {item.TieneDescargo ? "Sí" : "No"}
                        </td>

                        <td className="px-4 py-3 text-center text-sm">
                          {item.TieneCierre ? "Sí" : "No"}
                        </td>

                        <td className="px-4 py-3 text-sm">
                          {item.MedidaDisciplinaria || "—"}
                        </td>

                        <td className="px-4 py-3 text-center text-sm">
                          <Button
                            variant="outline"
                            onClick={() => abrirProcesoExistente(item)}
                          >
                            {item.EstadoProceso === "CERRADO"
                              ? "Ver expediente"
                              : "Continuar"}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-3 mt-6">
          <Button type="button" variant="outline" onClick={onBack}>
            Cancelar
          </Button>

          <Button
            type="button"
            className="bg-emerald-700 hover:bg-emerald-800 text-white"
            onClick={iniciarProceso}
            disabled={!trabajador || loadingCrear}
          >
            {loadingCrear ? "Iniciando..." : "Continuar"}
          </Button>
        </div>
      </div>
    </div>
  );
}