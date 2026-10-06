import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, HardHat, Loader2, Save, Scale } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import {
  crearPermisoAlturas,
  obtenerClientesAlturas,
  obtenerPermisosAlturas,
} from "@/services/permisosAlturasService";

const FORMULARIO_INICIAL = {
  idCliente: "",
  horaInicioTarea: "",
  horaFinTarea: "",
};

// Las fechas se muestran siempre en hora de Colombia, igual que las guarda el backend.
const ZONA_HORARIA = "America/Bogota";

const formatearFecha = (valor) => {
  if (!valor) {
    return "";
  }

  return new Date(valor).toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: ZONA_HORARIA,
  });
};

const formatearHora = (valor) => {
  if (!valor) {
    return "—";
  }

  return new Date(valor).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ZONA_HORARIA,
  });
};

const obtenerFechaHoyTexto = () =>
  new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: ZONA_HORARIA,
  });

const PermisosTrabajoAlturasView = () => {
  const [clientes, setClientes] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargarDatos = async () => {
    setCargando(true);

    try {
      const [listaClientes, listaPermisos] = await Promise.all([
        obtenerClientesAlturas(),
        obtenerPermisosAlturas(),
      ]);

      setClientes(listaClientes);
      setPermisos(listaPermisos);
    } catch (error) {
      toast({
        title: "No se pudo cargar la información",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const horarioInvalido = Boolean(
    formulario.horaInicioTarea &&
      formulario.horaFinTarea &&
      formulario.horaFinTarea <= formulario.horaInicioTarea
  );

  const actualizarCampo = (campo, valor) => {
    setFormulario((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const {
      idCliente,
      horaInicioTarea,
      horaFinTarea,
    } = formulario;

    if (!idCliente || !horaInicioTarea || !horaFinTarea) {
      toast({
        title: "Campos requeridos",
        description:
          "Selecciona el cliente, la hora de inicio y la hora de finalización.",
        variant: "destructive",
      });
      return;
    }

    // Formato "HH:MM": la comparación de texto equivale a comparar horas.
    if (horaFinTarea <= horaInicioTarea) {
      toast({
        title: "Horario no válido",
        description:
          "La hora de finalización debe ser mayor a la hora de inicio.",
        variant: "destructive",
      });
      return;
    }

    setGuardando(true);

    try {
      const permiso = await crearPermisoAlturas({
        idCliente,
        horaInicioTarea,
        horaFinTarea,
      });

      setPermisos((prev) => [permiso, ...prev]);
      setFormulario(FORMULARIO_INICIAL);

      toast({
        title: "Permiso creado",
        description: `Se registró el permiso N.° ${permiso.id_permiso_trabajo_alturas}.`,
      });
    } catch (error) {
      toast({
        title: "No se pudo crear el permiso",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="w-full min-w-0 max-w-full space-y-4 overflow-x-hidden"
    >
      <section className="w-full min-w-0 overflow-hidden rounded-2xl border-t-4 border-emerald-600 bg-white p-4 shadow-xl sm:p-6 lg:p-8">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-200">
            <HardHat className="h-6 w-6 text-white" />
          </div>

          <div className="min-w-0">
            <h1 className="break-words text-xl font-bold text-gray-800 sm:text-2xl">
              Permisos de Trabajo en Alturas
            </h1>

            <p className="mt-1 break-words text-sm leading-relaxed text-gray-500">
              Gestión de permisos de trabajo para tareas con
              riesgo de caída.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 sm:p-8">
          <div className="flex items-center gap-2 text-emerald-700">
            <Scale className="h-5 w-5 shrink-0" />

            <h2 className="text-base font-bold sm:text-lg">
              Resolución 4272 de 2021
            </h2>
          </div>

          <p className="mt-4 text-justify text-sm leading-relaxed text-gray-700 sm:text-base">
            <span className="font-semibold text-gray-800">
              Artículo 15.
            </span>{" "}
            Todos los trabajos en alturas deben obedecer a una
            acción planificada, organizada y ejecutada por
            trabajadores autorizados que debe verse reflejada en
            los controles administrativos como el Permiso de
            trabajo o sus anexos. Siempre que un trabajador
            ingrese a una zona de peligro, debe contar con la
            debida autorización y si requiere exponerse al riesgo
            de caídas, debe contar con un aval a través de un
            permiso de trabajo en alturas acompañado de una lista
            de chequeo, más aún en caso de que no haya barandas,
            sistemas de control de acceso, demarcación o sistemas
            de barreras físicas que cumplan con las
            especificaciones descritas en la presente resolución.
          </p>
        </div>
      </section>

      <section className="w-full min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow-xl sm:p-6 lg:p-8">
        <h2 className="text-lg font-bold text-gray-800">
          1. Datos del permiso
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          El trabajo debe realizarse hoy,{" "}
          <span className="font-semibold capitalize text-emerald-700">
            {obtenerFechaHoyTexto()}
          </span>
          .
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-start"
        >
          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente *</Label>

            <select
              id="cliente"
              value={formulario.idCliente}
              onChange={(e) =>
                actualizarCampo("idCliente", e.target.value)
              }
              disabled={cargando || guardando}
              className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm transition-all duration-200 hover:border-gray-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">
                {cargando
                  ? "Cargando clientes..."
                  : "Selecciona un cliente"}
              </option>

              {clientes.map((cliente) => (
                <option
                  key={cliente.id_cliente}
                  value={cliente.id_cliente}
                >
                  {cliente.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="horaInicioTarea">
              Hora de inicio *
            </Label>

            <Input
              id="horaInicioTarea"
              type="time"
              value={formulario.horaInicioTarea}
              onChange={(e) =>
                actualizarCampo("horaInicioTarea", e.target.value)
              }
              disabled={guardando}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="horaFinTarea">
              Hora de finalización *
            </Label>

            <Input
              id="horaFinTarea"
              type="time"
              value={formulario.horaFinTarea}
              onChange={(e) =>
                actualizarCampo("horaFinTarea", e.target.value)
              }
              disabled={guardando}
              className={
                horarioInvalido
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                  : undefined
              }
            />

            {horarioInvalido && (
              <p className="text-xs text-red-600">
                Debe ser mayor a la hora de inicio.
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={cargando || guardando || horarioInvalido}
            className="h-11 gap-2 rounded-xl bg-emerald-600 px-6 text-white hover:bg-emerald-700 lg:mt-7"
          >
            {guardando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar
          </Button>
        </form>
      </section>

      <section className="w-full min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow-xl sm:p-6 lg:p-8">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-emerald-600" />

          <h2 className="text-lg font-bold text-gray-800">
            Permisos registrados
          </h2>
        </div>

        {cargando ? (
          <p className="mt-4 text-sm text-gray-500">
            Cargando permisos...
          </p>
        ) : permisos.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            Aún no hay permisos registrados.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">ID permiso</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Hora inicio</th>
                  <th className="px-4 py-3">Hora fin</th>
                  <th className="px-4 py-3">Fecha creación</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {permisos.map((permiso) => (
                  <tr
                    key={permiso.id_permiso_trabajo_alturas}
                    className="hover:bg-emerald-50/40"
                  >
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {permiso.id_permiso_trabajo_alturas}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {permiso.cliente}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatearHora(permiso.fecha_hora_inicio_tarea)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatearHora(permiso.fecha_hora_fin_tarea)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatearFecha(permiso.fecha_creacion)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </motion.div>
  );
};

export default PermisosTrabajoAlturasView;
