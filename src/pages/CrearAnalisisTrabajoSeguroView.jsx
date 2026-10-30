import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Info, Loader2, Save } from "lucide-react";

import BuscadorPersonaContratada from "@/components/operaciones/BuscadorPersonaContratada";
import BuscadorSeleccion from "@/components/operaciones/BuscadorSeleccion";
import EncabezadoPermisosAlturas from "@/components/operaciones/EncabezadoPermisosAlturas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { crearAnalisisTrabajoSeguro } from "@/services/analisisTrabajoSeguroService";
import { obtenerClientesAlturas } from "@/services/permisosAlturasService";
import {
  ENCABEZADO_ANALISIS_TRABAJO_SEGURO,
  RUTAS_ANALISIS_TRABAJO_SEGURO,
  formatearFechaSinHora,
  obtenerDomingoSemanaISO,
  obtenerHoyISO,
} from "@/utils/analisisTrabajoSeguro";
import {
  guardarResponsableSesion,
  leerResponsableSesion,
  normalizarTexto,
} from "@/utils/permisosAlturas";

// Máximo de clientes que se muestran en la lista de resultados.
const MAX_RESULTADOS_CLIENTE = 20;

// Según la Resolución 4272 de 2021, el trabajo en alturas es el que se
// realiza a 2,0 m o más. Por debajo solo se muestra un aviso.
const ALTURA_MINIMA_METROS = 2;

const CrearAnalisisTrabajoSeguroView = () => {
  const [clientes, setClientes] = useState([]);
  // El responsable se comparte con Permisos de trabajo (misma sesión).
  const [responsable, setResponsable] = useState(leerResponsableSesion);
  const [cliente, setCliente] = useState(null);
  const [lugarTrabajo, setLugarTrabajo] = useState("");
  const [fechaFinalizacion, setFechaFinalizacion] = useState("");
  const [alturaAproximada, setAlturaAproximada] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const navigate = useNavigate();

  const hoy = obtenerHoyISO();
  // Formato YYYY-MM-DD: la comparación de texto equivale a comparar fechas.
  // Semana real: a más tardar el domingo de esta semana.
  const domingo = obtenerDomingoSemanaISO();
  const fechaAnterior = Boolean(fechaFinalizacion && fechaFinalizacion < hoy);
  const fechaFueraSemana = Boolean(
    fechaFinalizacion && fechaFinalizacion > domingo
  );
  const fechaInvalida = fechaAnterior || fechaFueraSemana;
  const mensajeFecha = fechaAnterior
    ? "No puede ser anterior a hoy."
    : `El análisis cubre solo esta semana: máximo el domingo ${formatearFechaSinHora(
        domingo
      )}. Si la actividad continúa, crea uno nuevo la próxima semana.`;
  const altura = Number(alturaAproximada);
  const alturaBaja =
    alturaAproximada !== "" && altura > 0 && altura < ALTURA_MINIMA_METROS;

  useEffect(() => {
    obtenerClientesAlturas()
      .then(setClientes)
      .catch((error) =>
        toast({
          title: "No se pudieron cargar los clientes",
          description: error.message,
          variant: "destructive",
        })
      )
      .finally(() => setCargando(false));
  }, []);

  // Los clientes ya están cargados: se filtran en el navegador, sin tildes
  // ni mayúsculas.
  const buscarCliente = (texto) => {
    const buscado = normalizarTexto(texto);

    return clientes
      .filter((item) => normalizarTexto(item.nombre).includes(buscado))
      .slice(0, MAX_RESULTADOS_CLIENTE);
  };

  const seleccionarResponsable = (persona) => {
    setResponsable(persona);
    guardarResponsableSesion(persona);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !responsable ||
      !cliente ||
      !lugarTrabajo.trim() ||
      !fechaFinalizacion ||
      alturaAproximada === ""
    ) {
      toast({
        title: "Campos requeridos",
        description: "Completa el responsable, el cliente, el lugar de trabajo, la fecha de finalización de la actividad y la altura aproximada.",
        variant: "destructive",
      });
      return;
    }

    if (!(altura > 0)) {
      toast({
        title: "Altura no válida",
        description: "La altura aproximada debe ser mayor a 0 metros.",
        variant: "destructive",
      });
      return;
    }

    if (fechaInvalida) {
      toast({
        title: "Fecha no válida",
        description: mensajeFecha,
        variant: "destructive",
      });
      return;
    }

    setGuardando(true);

    try {
      const analisis = await crearAnalisisTrabajoSeguro({
        idResponsable: responsable.id_registro_personal,
        idCliente: cliente.id_cliente,
        lugarTrabajo: lugarTrabajo.trim(),
        fechaFinalizacionActividad: fechaFinalizacion,
        alturaAproximadaMetros: altura.toFixed(2),
      });

      toast({
        title: "Análisis creado",
        description: `Se registró el análisis N.° ${analisis.id_analisis_trabajo_seguro}. Agrega ahora sus trabajadores.`,
      });

      // Se continúa en la página del análisis, en el paso de trabajadores.
      navigate(
        `${RUTAS_ANALISIS_TRABAJO_SEGURO.detalle(
          analisis.id_analisis_trabajo_seguro
        )}?paso=2`
      );
    } catch (error) {
      toast({
        title: "No se pudo crear el análisis",
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
        titulo="Crear análisis de trabajo seguro"
        descripcion="Registra los datos del análisis y luego los trabajadores que harán la tarea."
        mostrarPestanas
        mostrarVolver
        {...ENCABEZADO_ANALISIS_TRABAJO_SEGURO}
      />

      <section className="w-full min-w-0 rounded-2xl bg-white p-4 shadow-xl sm:p-6 lg:p-8">
        <h2 className="text-lg font-bold text-gray-800">
          1. Datos del análisis
        </h2>

        <form
          onSubmit={handleSubmit}
          className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start"
        >
          <BuscadorPersonaContratada
            id="responsableAnalisis"
            label="Responsable *"
            seleccionado={responsable}
            onSeleccionar={seleccionarResponsable}
            disabled={guardando}
          />

          <BuscadorSeleccion
            id="clienteAnalisis"
            label="Cliente *"
            seleccionado={cliente}
            onSeleccionar={setCliente}
            buscar={buscarCliente}
            obtenerClave={(item) => item.id_cliente}
            textoPrincipal={(item) => item.nombre}
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

          <div className="space-y-2">
            <Label htmlFor="lugarTrabajoAnalisis">Lugar de trabajo *</Label>

            <Input
              id="lugarTrabajoAnalisis"
              value={lugarTrabajo}
              maxLength={300}
              placeholder="Lugar físico del cliente. Ej.: fachada norte, torre B"
              onChange={(e) => setLugarTrabajo(e.target.value)}
              disabled={guardando}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fechaFinalizacionAnalisis">
              Fecha de finalización de la actividad *
            </Label>

            <Input
              id="fechaFinalizacionAnalisis"
              type="date"
              min={hoy}
              max={domingo}
              value={fechaFinalizacion}
              onChange={(e) => setFechaFinalizacion(e.target.value)}
              disabled={guardando}
              aria-invalid={fechaInvalida}
              className={fechaInvalida ? "border-red-400" : undefined}
            />

            {fechaInvalida && (
              <p className="text-xs text-red-600">{mensajeFecha}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="alturaAproximadaAnalisis">
              Altura aproximada (metros) *
            </Label>

            <Input
              id="alturaAproximadaAnalisis"
              type="number"
              inputMode="decimal"
              min="0.01"
              max="9999.99"
              step="0.01"
              value={alturaAproximada}
              placeholder="Ej.: 4.5"
              onChange={(e) => setAlturaAproximada(e.target.value)}
              disabled={guardando}
            />

            {alturaBaja && (
              <p className="flex items-start gap-1 text-xs text-amber-700">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Según la Resolución 4272 de 2021, el trabajo en alturas es el
                que se realiza a 2,0 m o más.
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between md:col-span-2">
            <Link
              to={RUTAS_ANALISIS_TRABAJO_SEGURO.consultar}
              className="text-sm font-medium text-emerald-700 hover:underline"
            >
              Ver mis análisis creados
            </Link>

            <Button
              type="submit"
              disabled={cargando || guardando || fechaInvalida}
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

export default CrearAnalisisTrabajoSeguroView;
