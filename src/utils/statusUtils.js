import React from 'react';
import { Clock, Check, X, AlertCircle, FileSearch, UserCheck, ShieldCheck, UserX, Briefcase } from 'lucide-react';

export const ALL_STATUS_OPTIONS_SELECCION = [
  'Nuevo',
  'Entrevista',
  'Entrevista Jefe Inmediato',
  'Exámenes',
  'Seguridad',
  'Avanza a Contratación',
  'Referenciación',
  'Desiste del Proceso',
  'Rechazado'
];

export const ALL_STATUS_OPTIONS = [
  'Avanza a Contratación',
  'Contratado'
];

/**
 * Returns styling and label information for a given status string.
 * @param {string} estado - The status key.
 * @returns {object} - Object containing label, color classes, and icon component.
 */
export const getEstadoInfo = (estado) => {
  if (!estado) return { label: 'Desconocido', color: 'bg-gray-100 text-gray-700', icon: AlertCircle };
  
  // Normalize: lowercase and replace spaces with hyphens
  // "AVANZA REFERENCIACIÓN - EX MEDICOS" -> "avanza-referenciación---ex-medicos"
  const normalized = estado.toLowerCase().trim().replace(/\s+/g, '-');
  
  const map = {
    // Base states
    'nuevo': { 
      label: 'Nuevo', 
      color: 'bg-blue-100 text-blue-700', 
      icon: Clock 
    },
    
    // New specific states
    'avanza-referenciación---ex-medicos': { 
      label: 'Avanza Ref. - Ex Médicos', 
      color: 'bg-cyan-100 text-cyan-700', 
      icon: FileSearch 
    },
    'avanza-a-contratación': { 
      label: 'Avanza a Contratación', 
      color: 'bg-indigo-100 text-indigo-700', 
      icon: UserCheck 
    },
    'validación-reintegro': { 
      label: 'Validación Reintegro', 
      color: 'bg-amber-100 text-amber-700', 
      icon: Clock 
    },
    'validación-estudio-de-seguridad': { 
      label: 'Val. Estudio Seguridad', 
      color: 'bg-orange-100 text-orange-700', 
      icon: ShieldCheck 
    },
    'contratado': { 
      label: 'Contratado', 
      color: 'bg-green-100 text-green-700', 
      icon: Check 
    },
    'contratación-valida': { 
      label: 'Contratación Válida', 
      color: 'bg-emerald-100 text-emerald-800', 
      icon: Check 
    },
    'desiste-del-proceso': { 
      label: 'Desiste del Proceso', 
      color: 'bg-red-100 text-red-700', 
      icon: UserX 
    },
    'Exámenes': { 
      label: 'Exámenes', 
      color: 'bg-red-100 text-red-700', 
      icon: UserX 
    },

    // Mappings for potential legacy/other states to keep UI consistent
    'en-proceso': { label: 'En Proceso', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    'entrevista': { label: 'Entrevista', color: 'bg-purple-100 text-purple-700', icon: Briefcase },
    'seleccionado': { label: 'Seleccionado', color: 'bg-purple-100 text-purple-700', icon: Check },
    'rechazado': { label: 'Rechazado', color: 'bg-red-100 text-red-700', icon: X }
  };

  // Try to find exact match first, then fallback to normalized
  return map[normalized] || { label: estado, color: 'bg-gray-100 text-gray-700', icon: Clock };
};