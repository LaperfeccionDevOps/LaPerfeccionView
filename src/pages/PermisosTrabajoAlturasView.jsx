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
  sede: "",
};

const formatearFecha = (valor) => {
  if (!valor) {
    return "";
  }

  return new Date(valor).toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

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

  const actualizarCampo = (campo, valor) => {
    setFormulario((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const sede = formulario.sede.trim();

    if (!formulario.idCliente || !sede) {
      toast({
        title: "Campos requeridos",
        description: "Selecciona el cliente y escribe la sede.",
        variant: "destructive",
      });
      return;
    }

    setGuardando(true);

    try {
      const permiso = await crearPermisoAlturas({
        idCliente: formulario.idCliente,
        sede,
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

        <form
          onSubmit={handleSubmit}
          className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
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
            <Label htmlFor="sede">Sede *</Label>

            <Input
              id="sede"
              value={formulario.sede}
              maxLength={150}
              placeholder="Escribe la sede"
              onChange={(e) =>
                actualizarCampo("sede", e.target.value)
              }
              disabled={guardando}
            />
          </div>

          <Button
            type="submit"
            disabled={cargando || guardando}
            className="h-11 gap-2 rounded-xl bg-emerald-600 px-6 text-white hover:bg-emerald-700"
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
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">ID permiso</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Sede</th>
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
                      {permiso.sede}
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
