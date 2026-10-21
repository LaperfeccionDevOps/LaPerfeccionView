import React from "react";

import BuscadorSeleccion from "@/components/operaciones/BuscadorSeleccion";
import { buscarTrabajadoresAlturas } from "@/services/permisosAlturasService";

/**
 * Buscador de personas en estado Contratado (RegistroPersonal) por cédula o
 * nombre. Se usa para el responsable del permiso y para sus trabajadores.
 */
const BuscadorPersonaContratada = ({
  id,
  label,
  seleccionado,
  onSeleccionar,
  disabled = false,
  // Ids de RegistroPersonal que ya no se pueden elegir (p. ej. trabajadores ya
  // registrados en el permiso) y el motivo que se muestra.
  idsNoSeleccionables = [],
  motivoNoSeleccionable = "Ya registrado",
}) => (
  <BuscadorSeleccion
    id={id}
    label={label}
    seleccionado={seleccionado}
    onSeleccionar={onSeleccionar}
    disabled={disabled}
    buscar={buscarTrabajadoresAlturas}
    obtenerClave={(persona) => persona.id_registro_personal}
    textoPrincipal={(persona) => persona.nombre_completo}
    textoSecundario={(persona) => `C.C. ${persona.numero_identificacion}`}
    placeholder="Cédula o nombre (mínimo 3 caracteres)"
    mensajeSinResultados="No se encontraron personas contratadas con ese criterio."
    motivoNoSeleccionable={(persona) =>
      idsNoSeleccionables.includes(persona.id_registro_personal)
        ? motivoNoSeleccionable
        : null
    }
  />
);

export default BuscadorPersonaContratada;
