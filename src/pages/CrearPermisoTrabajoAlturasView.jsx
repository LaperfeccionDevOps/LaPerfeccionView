import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Save } from "lucide-react";

import BuscadorPersonaContratada from "@/components/operaciones/BuscadorPersonaContratada";
import BuscadorSeleccion from "@/components/operaciones/BuscadorSeleccion";
import CampoHora24 from "@/components/operaciones/CampoHora24";
import EncabezadoPermisosAlturas from "@/components/operaciones/EncabezadoPermisosAlturas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import {
  crearPermisoAlturas,
  obtenerCiudadesAlturas,
  obtenerClientesAlturas,
} from "@/services/permisosAlturasService";
import {
  RUTAS_PERMISOS_ALTURAS,
  guardarResponsableSesion,
  leerResponsableSesion,
  normalizarTexto,
  obtenerFechaHoyTexto,
} from "@/utils/permisosAlturas";

const FORMULARIO_INICIAL = {
  responsable: null,
  cliente: null,
  ciudad: null,
  lugarTrabajo: "",
  horaInicioTarea: "",
  horaFinTarea: "",
};

// Máximo de clientes que se muestran en la lista de resultados.
const MAX_RESULTADOS_CLIENTE = 20;

const CrearPermisoTrabajoAlturasView = () => {
  const [clientes, setClientes] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [formulario, setFormulario] = useState(() => ({
    ...FORMULARIO_INICIAL,
    responsable: leerResponsableSesion(),
  }));
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([obtenerClientesAlturas(), obtenerCiudadesAlturas()])
      .then(([listaClientes, listaCiudades]) => {
        setClientes(listaClientes);
        setCiudades(listaCiudades);
      })
      .catch((error) =>
        toast({
          title: "No se pudieron cargar los clientes y ciudades",
          description: error.message,
          variant: "destructive",
        })
      )
      .finally(() => setCargando(false));
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

  // Los clientes ya están cargados: se filtran en el navegador, sin tildes
  // ni mayúsculas, sin consultar la API en cada tecla.
  const buscarCliente = (texto) => {
    const buscado = normalizarTexto(texto);

    return clientes
      .filter((cliente) =>
        normalizarTexto(cliente.nombre).includes(buscado)
      )
      .slice(0, MAX_RESULTADOS_CLIENTE);
  };

  const buscarCiudad = (texto) => {
    const buscado = normalizarTexto(texto);

    return ciudades
      .filter((ciudad) => normalizarTexto(ciudad.nombre).includes(buscado))
      .slice(0, MAX_RESULTADOS_CLIENTE);
  };

  const seleccionarResponsable = (persona) => {
    actualizarCampo("responsable", persona);
    guardarResponsableSesion(persona);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const {
      responsable,
      cliente,
      ciudad,
      lugarTrabajo,
      horaInicioTarea,
      horaFinTarea,
    } = formulario;

    if (
      !responsable ||
      !cliente ||
      !ciudad ||
      !lugarTrabajo.trim() ||
      !horaInicioTarea ||
      !horaFinTarea
    ) {
      toast({
        title: "Campos requeridos",
        description:
          "Completa el responsable, el cliente, la ciudad, el lugar de trabajo, la hora de inicio y la hora de finalización.",
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
        idResponsable: responsable.id_registro_personal,
        idCliente: cliente.id_cliente,
        idCiudad: ciudad.id_ciudad,
        lugarTrabajo: lugarTrabajo.trim(),
        horaInicioTarea,
        horaFinTarea,
      });

      toast({
        title: "Permiso creado",
        description: `Se registró el permiso N.° ${permiso.id_permiso_trabajo_alturas}. Agrega ahora sus trabajadores.`,
      });

      // Se continúa en la página del permiso, en el paso de trabajadores.
      navigate(`${RUTAS_PERMISOS_ALTURAS.detalle(permiso.id_permiso_trabajo_alturas)}?paso=2`);
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
      <EncabezadoPermisosAlturas
        titulo="Crear permiso de trabajo en alturas"
        descripcion="Registra los datos del permiso y luego los trabajadores que ejecutarán la tarea."
        mostrarPestanas
      />

      <section className="w-full min-w-0 rounded-2xl bg-white p-4 shadow-xl sm:p-6 lg:p-8">
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
          className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start"
        >
          <BuscadorPersonaContratada
            id="responsable"
            label="Responsable del permiso *"
            seleccionado={formulario.responsable}
            onSeleccionar={seleccionarResponsable}
            disabled={guardando}
          />

          <BuscadorSeleccion
            id="cliente"
            label="Cliente *"
            seleccionado={formulario.cliente}
            onSeleccionar={(cliente) =>
              actualizarCampo("cliente", cliente)
            }
            buscar={buscarCliente}
            obtenerClave={(cliente) => cliente.id_cliente}
            textoPrincipal={(cliente) => cliente.nombre}
            placeholder={
              cargando
                ? "Cargando clientes..."
                : "Nombre del cliente (mínimo 2 caracteres)"
            }
            mensajeSinResultados="No se encontraron clientes con ese nombre."
            minCaracteres={2}
            esperaMs={150}
            disabled={cargando || guardando}
          />

          <BuscadorSeleccion
            id="ciudad"
            label="Ciudad *"
            seleccionado={formulario.ciudad}
            onSeleccionar={(ciudad) => actualizarCampo("ciudad", ciudad)}
            buscar={buscarCiudad}
            obtenerClave={(ciudad) => ciudad.id_ciudad}
            textoPrincipal={(ciudad) => ciudad.nombre}
            placeholder={
              cargando
                ? "Cargando ciudades..."
                : "Nombre de la ciudad (mínimo 2 caracteres)"
            }
            mensajeSinResultados="No se encontraron ciudades con ese nombre."
            minCaracteres={2}
            esperaMs={150}
            disabled={cargando || guardando}
          />

          <div className="space-y-2">
            <Label htmlFor="lugarTrabajo">Lugar de trabajo *</Label>

            <Input
              id="lugarTrabajo"
              value={formulario.lugarTrabajo}
              maxLength={300}
              placeholder="Ej.: azotea torre B"
              onChange={(e) => actualizarCampo("lugarTrabajo", e.target.value)}
              disabled={guardando}
            />
          </div>

          <CampoHora24
            id="horaInicioTarea"
            label="Hora de inicio *"
            value={formulario.horaInicioTarea}
            onChange={(valor) =>
              actualizarCampo("horaInicioTarea", valor)
            }
            disabled={guardando}
          />

          <CampoHora24
            id="horaFinTarea"
            label="Hora de finalización *"
            value={formulario.horaFinTarea}
            onChange={(valor) =>
              actualizarCampo("horaFinTarea", valor)
            }
            disabled={guardando}
            invalido={horarioInvalido}
            mensajeError="Debe ser mayor a la hora de inicio."
          />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between md:col-span-2">
            <Link
              to={RUTAS_PERMISOS_ALTURAS.consultar}
              className="text-sm font-medium text-emerald-700 hover:underline"
            >
              Ver mis permisos creados
            </Link>

            <Button
              type="submit"
              disabled={cargando || guardando || horarioInvalido}
              className="h-11 gap-2 rounded-xl bg-emerald-600 px-6 text-white hover:bg-emerald-700"
            >
              {guardando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar
            </Button>
          </div>
        </form>
      </section>
    </motion.div>
  );
};

export default CrearPermisoTrabajoAlturasView;
