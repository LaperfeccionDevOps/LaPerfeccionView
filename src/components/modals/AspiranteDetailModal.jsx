// Utilidades para Estado formación
const ESTADOS_FORMACION = [
   { key: 1, value: 'En curso' },
   { key: 2, value: 'Finalizado' },
   { key: 3, value: 'Incompleto' },
];

const getEstadoFormacionLabel = (raw) => {
   if (raw == null) return '';
   const s = String(raw).trim();
   if (/^\d+$/.test(s)) {
      const found = ESTADOS_FORMACION.find(n => String(n.key) === s);
      return found ? found.value : '';
   }
   const exact = ESTADOS_FORMACION.find(n => n.value === s);
   if (exact) return exact.value;
   const approx = ESTADOS_FORMACION.find(n => n.value.toUpperCase() === s.toUpperCase());
   return approx ? approx.value : s;
};

const getEstadoFormacionIdFromLabel = (label) => {
   const found = ESTADOS_FORMACION.find(n => n.value === label);
   return found ? found.key : '';
};

import { getAspirante, getDocumentacionIngreso, getDocumentosSeguridad, getListaCargo } from '../../services/detalle_aspirante';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { upsertObservacionNF } from "@/services/observacionesNucleoFamiliarService";
import { upsertAsignacionCargoCliente } from "../../services/asignacionCargoClienteServiceApi";
import { toast } from '@/components/ui/use-toast';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, Users, GraduationCap, Briefcase, Phone, FileText, CheckSquare, Plus, Trash2, Save, X, Image as ImageIcon, UploadCloud, Eye, Download } from 'lucide-react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

import { ALL_STATUS_OPTIONS } from '@/utils/statusUtils';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import EntrevistaModal from '@/components/modals/EntrevistaModal';
import entrevistaCandidatoService from "../../services/entrevistaCandidatoService";
import { RegistrarDocumentosSeguridad, EliminarDocumentoSeguridadPorTipo } from '../../services/documentosSeguridad';
import { ValidarExperienciaLaboral, ObservacionesExperienciaLaboral, EliminarExperienciaLaboral, GenerarPdfConsolidadoReferencias } from '../../services/experiencia_laboral';
import { ValidarReferenciaPersonal } from '../../services/referenciaPersonal'
import { upsertMotivoCierre, getMotivoCierre } from "../../services/motivoCierreService";
import { ActualizarEstadoProcesoService } from '../../services/aspirante';
import { ActualizarFormacionEducacion } from '../../services/formacion';
import { DatosSeleccion, ActualizarDatosSeleccion, getListaLugarNacimiento } from '../../services/aspirante';
import { cn, generarReferenciaLaboralHTML, generarEntrevistaHTML, descargarDocumentoPDF, generarTratamientoDatosHTML } from '@/lib/utils';
import { DescargarDocumentoPdf } from '../../services/descargarDocumento';
import { getAsignacionCargoCliente } from '../../services/asignacionCargoClienteServiceApi';
import { GetObservacionesExperienciaLaboral } from "../../services/experiencia_laboral";


// Requisitos obligatorios para adjuntar documentos
const requisitosObligatorios = [
  { id: 3, label: 'Hoja de vida' },
  { id: 4, label: 'Cedula' },
  { id: 10, label: 'Certificado laboral' },
  { id: 11, label: 'Certificado de estudio' },
  { id: 12, label: 'Tarjeta profesional' },
  { id: 1, label: 'Recibo público' },
  { id: 2, label: 'Foto' },
  { id: 39, label: 'Certificado de cursos especiales' },
  { id: 40, label: 'Certificado fondo de pensiones' },
  { id: 41, label: 'Fotocopia de carné de vacunas covid' },
  { id: 42, label: 'Firma digital' },
  { id: 30, label: 'Certificado de afiliación EPS' }
];

const documentosSeguridad = [
  { id: 6, label: 'Antecedentes de policía' },
  { id: 7, label: 'Antecedentes disciplinarios procuraduría' },
  { id: 8, label: 'Antecedentes disciplinarios contraloría' },
  { id: 9, label: 'Antecedentes disciplinarios rama judicial' },
  { id: 17, label: 'Examen médico ingreso' },
  { id: 15, label: 'Estudio de seguridad administrativa' },
  { id: 21, label: 'Pruebas de conocimiento' },
  { id: 58, label: 'Antecedentes delitos sexuales' },
  { id: 61, label: 'Historial de pensión (Personal Administrativo)' },
  { id: 67, label: 'Entrevista selección' },
  { id: 68, label: 'Confirmación de referencias laborales' },
  { id: 60, label: 'Certificado de competencias específicas' },
  { id: 73, label: 'Tratamiento de datos' }
];

export const estadoProceso = [
  { id: 18, label: 'Nuevo' },
  { id: 19, label: 'Entrevista' },
  { id: 20, label: 'Entrevista Jefe Inmediato' },
  { id: 21, label: 'Exámenes' },
  { id: 22, label: 'Seguridad' },
  { id: 24, label: 'Avanza a Contratación' },
  { id: 25, label: 'Contratado' },
  { id: 26, label: 'Referenciación' },
  { id: 27, label: 'Desiste del Proceso' },
  { id: 28, label: 'Rechazado' },
];

// ✅ Lista de clientes (Aseo) - cargada desde el Excel
const clientesALP = [
   { id: 1, name: "alp s cl 4 bis 53c-50 calidad y riesgos" },
   { id: 2, name: "ALP S Cl 4 Bis 53c-50 Compensación y Beneficios" },
   { id: 3, name: "ALP S Cl 4 Bis 53c-50 Compras - Abastecimiento Operaciones" },
   { id: 4, name: "ALP S Cl 4 Bis 53c-50 Compras y Abastecimiento" },
   { id: 5, name: "ALP S Cl 4 Bis 53c-50 Dir. Admon - Finan" },
   { id: 6, name: "ALP S Cl 4 Bis 53c-50 Dirección Comercial" },
   { id: 7, name: "ALP S Cl 4 Bis 53c-50 Dirección Operaciones" },
   { id: 8, name: "ALP S Cl 4 Bis 53c-50 Gerencia" },
   { id: 9, name: "ALP S Cl 4 Bis 53c-50 HSEQ" },
   { id: 10, name: "ALP S Cl 4 Bis 53c-50 Incapacidades Permanentes" },
   { id: 11, name: "ALP S Cl 4 Bis 53c-50 Licencias De Maternidad" },
   { id: 12, name: "ALP S Cl 4 Bis 53c-50 M/miento - Infraestructura" },
   { id: 13, name: "ALP S Cl 4 Bis 53c-50 M/miento de Fachadas" },
   { id: 14, name: "ALP S Cl 4 Bis 53c-50 Operaciones  Campo" },
   { id: 15, name: "ALP S Cl 4 Bis 53c-50 Operaciones HSEQ" },
   { id: 16, name: "ALP S Cl 4 Bis 53c-50 Socios" },
   { id: 17, name: "ALP S Cl 4 Bis 53c-50 Supernumerarios" },
   { id: 18, name: "ALP S Cl 4 Bis 53c-50 Talento Humano" },
   { id: 19, name: "Asistir Salud S Alamos - Asistrir Salud" },
   { id: 20, name: "Asistir Salud S Candelaria Salud" },
   { id: 21, name: "Asistir Salud S Cl 64g 90a-40 Salud" },
   { id: 22, name: "Asistir Salud S Mosquera Cra 5 E 10 25 Salud" },
   { id: 23, name: "Asistir Salud S Quiroga Salud" },
   { id: 24, name: "Asistir Salud S Soacha Salud" },
   { id: 25, name: "Asociación Aconiño S Cl 127 B 45 28 Salud" },
   { id: 26, name: "Caja De Compensación Familiar Cafam S Ak 68 64 45 Piscinas" },
   { id: 27, name: "Centro aud. y quirúrgico del country S Cl 97 23 37 PISO 10 Mantenimiento General" },
   { id: 28, name: "Centro aud. y quirúrgico del country S Cl 97 23-37 PISO 10 Salud" },
   { id: 29, name: "Centro Enfermedades Digestivas Cl 97 23-37 Cons 315 Supernumerarios" },
   { id: 30, name: "Centro Medico Dalí S Cl 97 23-37 Mantenimiento General" },
   { id: 31, name: "Centro Medico Dalí S Cl 97 23-37 Salud" },
   { id: 32, name: "Challenger S Dg 25g  #94-55* Aseo" },
   { id: 33, name: "Challenger S Dg 25g 94-55 - Ambiental Aseo" },
   { id: 34, name: "Challenger S Dg 25g 94-55 Aseo" },
   { id: 35, name: "Challenger S Dg 25g 94-55 Supernumerarios" },
   { id: 36, name: "Challenger S Local Cr 30 Cl 63b  28a-62 Aseo" },
   { id: 37, name: "Challenger S Venecia Supernumerarios" },
   { id: 38, name: "Comité De Bogotá De La Sociedad Dante Alighieri Cr 21 127 23 Aseo" },
   { id: 39, name: "Compensar Administrativa Aseo" },
   { id: 40, name: "Compensar Administrativa Valores Agregados" },
   { id: 41, name: "Compensar Alturas Trabajos Especiales Limpieza de vidrios" },
   { id: 42, name: "Compensar Auto sur Aseo" },
   { id: 43, name: "Compensar Auto sur Lavanderia" },
   { id: 44, name: "Compensar Auto sur Recreacion" },
   { id: 45, name: "Compensar Auto sur Salud" },
   { id: 46, name: "Compensar AV1 DE MAYO Salud" },
   { id: 47, name: "Compensar AV1 DE MAYO Valores Agregados" },
   { id: 48, name: "Compensar Bodega Medicamentos Salud" },
   { id: 49, name: "Compensar Cajica Piscinas" },
   { id: 50, name: "Compensar Cajica Recreacion" },
   { id: 51, name: "Compensar CEF Recreacion" },
   { id: 52, name: "Compensar CEF Valores Agregados" },
   { id: 53, name: "Compensar Cl 94 Lavanderia" },
   { id: 54, name: "Compensar Cl 94 Licencias De Maternidad" },
   { id: 55, name: "Compensar Cl 94 Piscinas" },
   { id: 56, name: "Compensar Cl 94 Recreacion" },
   { id: 57, name: "Compensar Cl 94 Salud" },
   { id: 58, name: "Compensar Cl 94 Supernumerarios" },
   { id: 59, name: "Compensar Clinica Palermo Salud" },
   { id: 60, name: "Compensar Club 220 Limpieza de vidrios" },
   { id: 61, name: "Compensar Club 220 Piscinas" },
   { id: 62, name: "Compensar Club 220 Recreacion" },
   { id: 63, name: "Compensar Com Fund Niño Jesus Recreacion" },
   { id: 64, name: "Compensar Consorcio Aseo" },
   { id: 65, name: "Compensar Consorcio Recreacion" },
   { id: 66, name: "Compensar CUR I Aseo" },
   { id: 67, name: "Compensar CUR I Piscinas" },
   { id: 68, name: "Compensar CUR I Recreacion" },
   { id: 69, name: "Compensar Facat Cr 2 4 82 Salud" },
   { id: 70, name: "Compensar Fuentes Piscinas" },
   { id: 71, name: "Compensar Girardot Lago Piscinas" },
   { id: 72, name: "Compensar Jardin Alameda Centro Aseo" },
   { id: 73, name: "Compensar Jardin Alameda Centro Recreacion" },
   { id: 74, name: "Compensar Jardin Cda de Dios la Gloria Aseo" },
   { id: 75, name: "Compensar Jardin Chiquitines Mosquera Aseo" },
   { id: 76, name: "Compensar Jardin Cipres Uval Aseo" },
   { id: 77, name: "Compensar Jardin Gualy Mosquera Aseo" },
   { id: 78, name: "Compensar Jardin Mosqueteritos Mosquera Aseo" },
   { id: 79, name: "Compensar Jardin Yuste Aseo" },
   { id: 80, name: "Compensar Mantenimiento Administrativos Operación" },
   { id: 81, name: "Compensar Mantenimiento Licencias De Maternidad" },
   { id: 82, name: "Compensar Mofly Piscinas" },
   { id: 83, name: "Compensar Pinar F Recreacion" },
   { id: 84, name: "Compensar Pinar G Aseo" },
   { id: 85, name: "Compensar Pinar G Recreacion" },
   { id: 86, name: "Compensar S Centro Mayor Piscinas" },
   { id: 87, name: "Compensar S Cr 69 47 34 TO A Salud" },
   { id: 88, name: "Compensar S Cra 60 Piscinas" },
   { id: 89, name: "Compensar S Eventos Ak 68 49A 47 Aseo" },
   { id: 90, name: "Compensar S Eventos Ak 68 49A 47 Recreacion" },
   { id: 91, name: "Compensar S Eventos Ak 68 49A 47 Supernumerarios" },
   { id: 92, name: "Compensar Sala de ventas Proyecto Maui Cra. 60F #45ª -08 Sur Aseo" },
   { id: 93, name: "Compensar Suba integral Lavanderia" },
   { id: 94, name: "Compensar Suba integral Piscinas" },
   { id: 95, name: "Compensar Suba integral Recreacion" },
   { id: 96, name: "Compensar Suba integral Salud" },
   { id: 97, name: "Compensar Suba integral Supernumerarios" },
   { id: 98, name: "Concrearmado S Av 15 122-35 - Concrearmado Aseo" },
   { id: 99, name: "Conj Res Parque Floresta II S Cr 68b 96-16 Aseo" },
   { id: 100, name: "Conj Res Parque Floresta II S Cr 68b 96-16 Mantenimiento General" },
   { id: 101, name: "Conj Res Parque Floresta III S Cr 68b 96-70 Aseo" },
   { id: 102, name: "Conj Res Parque Floresta III S Cr 68b 96-70 Obra Civil Menor" },
   { id: 103, name: "ConJ Res Portal De Techo III - PH S Cr 71 2a 66 Aseo" },
   { id: 104, name: "ConJ Res Portal De Techo III - PH S Cr 71 2a 66 Mantenimiento General" },
   { id: 105, name: "Conj Res Quintas S Cl 127BIS 88-07 Aseo" },
   { id: 106, name: "Conj Res Quintas S Cl 127BIS 88-07 Mantenimiento General" },
   { id: 107, name: "Conj Res Surala II S Cr 57 138-66 Aseo" },
   { id: 108, name: "Conj Res Surala II S Cr 57 138-66 Mantenimiento General" },
   { id: 109, name: "Conjunto Residencial Austro P H S Cr 68 D 19 A 37 Aseo" },
   { id: 110, name: "Conjunto Residencial Austro P H S Cr 68 D 19 A 37 Mantenimiento General" },
   { id: 111, name: "Conjunto Residencial Torres de la 100 Propiedad Horizontal S Cr 65 100 15 Aseo" },
   { id: 112, name: "Conjunto Residencial Torres de la 100 Propiedad Horizontal S Cr 65 100 15 Obra Civil Menor" },
   { id: 113, name: "Consorcio Express SAS S 20 de Julio Cl 32 Sur 3c 08 Aseo" },
   { id: 114, name: "Consorcio Express SAS S AV CL 57 R SUR 72F 50 Aseo" },
   { id: 115, name: "Consorcio Express SAS S AV CL 57 R SUR 72F 50 Supernumerarios" },
   { id: 116, name: "Consorcio Express SAS S Bosa Cr 95a 74 Sur 99 Aseo" },
   { id: 117, name: "Consorcio Express SAS S Cl 191 Ak 45 191 11 Aseo" },
   { id: 118, name: "Consorcio Express SAS S Conejera Cr 101a 161 30 Aseo" },
   { id: 119, name: "Consorcio Express SAS S Cruces Cr 6 0 69 Sur Aseo" },
   { id: 120, name: "Consorcio Express SAS S Engativá Tv 113 64c 48/66 19 Aseo" },
   { id: 121, name: "Consorcio Express SAS S Gaviotas Cr 15 Este 47b 50 Sur Aseo" },
   { id: 122, name: "Consorcio Express SAS S Juan Rey Cr 15 Este 72a Sur 43 Aseo" },
   { id: 123, name: "Consorcio Express SAS S San Francisco Cr 19d 64b 36 Aseo" },
   { id: 124, name: "Consorcio Express SAS S Suba Cl 132 144a 25 Aseo" },
   { id: 125, name: "Consorcio Salud S Cl  73 10-83 Administrativos Operación" },
   { id: 126, name: "Corporacion Club Los Lagartos S Cl 116 72 A 80 Recreacion" },
   { id: 127, name: "Corporacion Tecnologica De Bogotá - CTB S CR 21  53 D 35 Aseo" },
   { id: 128, name: "Corriente Alterna S Cr 71d  51-42 Aseo" },
   { id: 129, name: "Cruz Roja Colombiana S Albergue Casa Volver Cl 63 Supernumerarios" },
   { id: 130, name: "Cruz Roja Colombiana S ED. Admon Cr 23 73 19 Aseo" },
   { id: 131, name: "Cruz Roja Colombiana S ED. Admon Cr 23 73 19 Aseo" },
   { id: 132, name: "Cruz Roja Colombiana S ED. Admon Cr 23 73 19 Supernumerarios" },
   { id: 133, name: "Cruz Roja Colombiana S Salvamento Av 68 68b 31 Piscinas" },
   { id: 134, name: "Cruz Roja Colombiana S Salvamento Av 68 68b 31 Recreacion" },
   { id: 135, name: "Edif Ahorramas S Cr 15a 121-12 Aseo" },
   { id: 136, name: "Edif Banco Ganadero S Av 15 122-35 Aseo" },
   { id: 137, name: "Edif Banco Ganadero S Av 15 122-35 Mantenimiento General" },
   { id: 138, name: "Edif Buganvilla S Cr 11 BIS 124a-66 Aseo" },
   { id: 139, name: "Edif Buganvilla S Cr 11 BIS 124a-66 Obra Civil Menor" },
   { id: 140, name: "Edif Cipres S CL 71 3-51 Aseo" },
   { id: 141, name: "Edif Davivienda S Cl 72 11-23 Aseo" },
   { id: 142, name: "Edif Davivienda S Cl 72 11-23 Obra Civil Menor" },
   { id: 143, name: "Edif El Coral S Cl 81 7-36 Aseo" },
   { id: 144, name: "Edif Era S Cr 10 120-30 Aseo" },
   { id: 145, name: "Edif Era S Cr 10 120-30 Obra Civil Menor" },
   { id: 146, name: "Edif Fiduciaria la previsora S Cl 72 10-03 Aseo" },
   { id: 147, name: "Edif Fiduciaria la previsora S Cl 72 10-03 Obra Civil Menor" },
   { id: 148, name: "Edif Figueras II S Cr 19a 102-70 Aseo" },
   { id: 149, name: "Edif Masters S AUT Norte  118-86 Mantenimiento General" },
   { id: 150, name: "Edif Masters S AUT Norte  118-86 Salud" },
   { id: 151, name: "Edif Monserrat 74 S Cr 11 73-44 Aseo" },
   { id: 152, name: "Edif Monserrat 74 S Cr 11 73-44 Obra Civil Menor" },
   { id: 153, name: "Edif Nueva Avenida S AV 19 114-65  Aseo" },
   { id: 154, name: "Edif Nueva Avenida S AV 19 114-65  Mantenimiento General" },
   { id: 155, name: "Edif Torre Ejecutiva S Cl 67 6-60 Aseo" },
   { id: 156, name: "Edificio Cortezza Calle 93 S Cr 14 93 68 Aseo" },
   { id: 157, name: "Edificio Cortezza Calle 93 S Cr 14 93 68 Mantenimiento General" },
   { id: 158, name: "Educa Edtech Colombia SAS S Cl 104 #18A 52 Santa Bibiana Aseo" },
   { id: 159, name: "Empresa Colombiana De Cables Sas KM 5 5 VIA CAJICA ZIPAQUIRA Aseo" },
   { id: 160, name: "Empresa Colombiana De Cables Sas KM 5 5 VIA CAJICA ZIPAQUIRA Mantenimiento General" },
   { id: 161, name: "Exicarton S Cl 65 Bis 88 57 Aseo" },
   { id: 162, name: "Exicarton S Dg 25g 94-55 Aseo" },
   { id: 163, name: "Fund Niño Jesus S FD Apensar Aseo" },
   { id: 164, name: "Fund Niño Jesus S FD Engativa Aseo" },
   { id: 165, name: "Fund Niño Jesus S FD Principal Aseo" },
   { id: 166, name: "Fund Univ Compensar S Av Cl #32 17-30* Aseo" },
   { id: 167, name: "Fund Univ Compensar S Av Cl #32 17-30* M/miento de Fachadas" },
   { id: 168, name: "Fund Univ Compensar S Av Cl #32 17-30* Obra Civil Menor" },
   { id: 169, name: "Fund Univ Compensar S Campus Ak 68 No. 68 B - 45 Aseo" },
   { id: 170, name: "Fund Univ Compensar S Campus Ak 68 No. 68 B - 45 Obra Civil Menor" },
   { id: 171, name: "Fund Univ Compensar S Campus Ak 68 No. 68 B - 45 Recreacion" },
   { id: 172, name: "Guala S Cl 17 42-75 Aseo" },
   { id: 173, name: "Infinity Brows Studio SAS S CL 24 B 75 18 Cafeteria" },
   { id: 174, name: "Laboratorio Medico Echavarria SAS S Cr 44 20 a 05 Mantenimiento General" },
   { id: 175, name: "Laboratorios Smart S A S S Cl 19 # 69 - 05 Recreacion" },
   { id: 176, name: "Laboratorios Smart S A S S Cl 19 # 69 - 05 Salud" },
   { id: 177, name: "Lemco Hotel Salvio Aseo" },
   { id: 178, name: "Licencias Online S Cl 98 22-64 Aseo" },
   { id: 179, name: "Loscobos Medical Center S.A.S AK 9 131 A 40 Limpieza de vidrios" },
   { id: 180, name: "Madiautos SAS S Morato Av Cr 70 96  05 Aseo" },
   { id: 181, name: "Madiautos SAS S Niza 1 Cl 127 70g 75 Aseo" },
   { id: 182, name: "Madiautos SAS S Taller Hyundai Cr 69c  99 19 /12 Aseo" },
   { id: 183, name: "Mantener Ingenieria S Cl 25 32-22 Mantener Dirección Comercial" },
   { id: 184, name: "Mantener Ingenieria S Cl 25 32-22 Mantener Gerencia" },
   { id: 185, name: "Mantener Ingenieria S Cl 25 32-22 Mantener M/miento - Infraestructura" },
   { id: 186, name: "Mariano Moreno S Av Cl 127 7a-47 Aseo" },
   { id: 187, name: "Mariano Moreno S Cl 71 Aseo" },
   { id: 188, name: "Mariano Moreno S Cl 71 Supernumerarios" },
   { id: 189, name: "Mariano Moreno S Modelia Aseo" },
   { id: 190, name: "Medicina Nuclear S Cr 20 62-09  Salud" },
   { id: 191, name: "MEDIPORT SAS S Cr 45 100 34 P6 Salud" },
   { id: 192, name: "Nabesade SAS S Cl 127a 7 19 CS 601* Salud" },
   { id: 193, name: "Nacobena S Cl 93b 12-18 Aseo" },
   { id: 194, name: "Parko Services S Av Cr 15 106-65 Aseo" },
   { id: 195, name: "Parque Central Pontevedra Primera Etapa - PH S Cl 95 71 45* Aseo" },
   { id: 196, name: "Parque Central Pontevedra Primera Etapa - PH S Cl 95 71 45* Mantenimiento General" },
   { id: 197, name: "Parr. San Francisco S Cr 3 57-61 Supernumerarios" },
   { id: 198, name: "Parr. Santos Ángeles S Cl 28 32a-07 Supernumerarios" },
   { id: 199, name: "Parroquia Madre Laura S CR 2 A ESTE 89 SUR 01 P 1 Supernumerarios" },
   { id: 200, name: "Parroquia Maria Madre De Dios S CR 41 BIS 1G 63 Supernumerarios" },
   { id: 201, name: "Quasfar M&F SA S CL 46A 82 54 BG 10 Par Emp San Cayetano2 Salud" },
   { id: 202, name: "Selika 94 SAS S CR 13 94 A 26 Salud" },
   { id: 203, name: "Servicios Médicos Especializados Neurosalud SAS S Ak 45 # 100 - 48 Salud" },
   { id: 204, name: "Servicios Medicos Integrales Medicol SAS S Edificio Aequi Movistar Salud" },
   { id: 205, name: "Sky Industrial SAS S Cr 106 15-25 Aseo" },
   { id: 206, name: "Sky Logistica Integral SAS S San Carlos II Etapa 4 via Bogota - Faca Aseo" },
   { id: 207, name: "Teleférico Monserrate S Cr 2 Este 21-48 Aseo" },
   { id: 208, name: "Textiles Asitex S.A.S S Cr 63 18 A 43 Aseo" },
   { id: 209, name: "Thomas Gred Seguridad Integral LTDA S CALLE 77 28B 25 Aseo" },
   { id: 210, name: "FUNDACIÓN UNIVERSITARIA KONRAD LORENZ CRA 9 BIS 62-43 Aseo" },
];

const EPS = [
  { key: 1, value: 'ASOCIACION INDIGENA DEL CAUCA' },
  { key: 2, value: 'ASOCIACION MUTUAL LA ESPERANZA ASMET SALUD' },
  { key: 3, value: 'ASOCIACION MUTUAL SER EMPRESA SOLIDARIA DE SALUS ESS' },
  { key: 4, value: 'ASOCIACIÓN MUTUAL BARRIOS UNIDOS DE QUIBDÓ E.S.S' },
  { key: 5, value: 'CAPITAL SALUD' },
  { key: 6, value: 'CAPITAL SALUD S.A.S.' },
  { key: 7, value: 'CAPRESOCA E.P.S' },
  { key: 8, value: 'COMPARTA' },
  { key: 9, value: 'COOSALUD MOVILIDAD' },
  { key: 10, value: 'ECOOPSOS' },
  { key: 11, value: 'E. P. S. ALIANSALUD' },
  { key: 12, value: 'E. P. S. CAFESALUD' },
  { key: 13, value: 'E. P. S. CAJANAL' },
  { key: 14, value: 'E. P. S. CAPRECOM' },
  { key: 15, value: 'E. P. S. COMFENALCO ANTIOQUIA' },
  { key: 16, value: 'E. P. S. COMFENALCO VALLE' },
  { key: 17, value: 'E. P. S. COMPENSAR' },
  { key: 18, value: 'E. P. S. COOMEVA S. A.' },
  { key: 19, value: 'E. P. S. CRUZ BLANCA S. A.' },
  { key: 20, value: 'E. P. S. FAMISANAR L. T. D. A.' },
  { key: 21, value: 'E. P. S. FOSYGA' },
  { key: 22, value: 'E. P. S. GOLDEN GROUP S. A.' },
  { key: 23, value: 'E. P. S. HUMANA VIVIR' },
  { key: 24, value: 'E. P. S. INSTITUTO DE SEGUROS SOCIALES' },
  { key: 25, value: 'E. P. S. NUEVA E. P. S. S. A.' },
  { key: 26, value: 'E. P. S. RED SALUD' },
  { key: 27, value: 'E. P. S. SALUD COLPATRIA' },
  { key: 28, value: 'E. P. S. SALUD TOTAL' },
  { key: 29, value: 'E. P. S. SALUD VIDA' },
  { key: 30, value: 'E. P. S. SALUDCOOP' },
  { key: 31, value: 'E. P. S. SANITAS S. A.' },
  { key: 32, value: 'E. P. S. SERVICIO OCCIDENTAL DE SALUD S. O. S.' },
  { key: 33, value: 'E. P. S. SOL SALUD' },
  { key: 34, value: 'E. P. S. SURA' },
  { key: 35, value: 'EMSSANAR EPS' },
  { key: 36, value: 'EPS COMPARTA' },
  { key: 37, value: 'EPS MEDIMAS' },
  { key: 38, value: 'EPS MUTUAL SER' },
  { key: 39, value: 'EPS-S CONVIDA' },
  { key: 40, value: 'FUNDACIÓN SALUD MIA EPS' },
  { key: 41, value: 'NUEVA EPS S.A. MOVILIDAD' },
  { key: 42, value: 'SAVIA SALUD EPS' },
];

const FONDOS_PENSIONES = [
  { key: "1", value: "Colfondos" },
  { key: "2", value: "Colpensiones" },
  { key: "3", value: "Horizontes" },
  { key: "4", value: "Porvenir" },
  { key: "5", value: "Protección + I.N.G" },
  { key: "7", value: "Skandia Pensiones y Cesantías S.A" },
  { key: "Otro", value: "Otro" },
];

const NIVELES_EDUCATIVOS = [
  { key: 1, value: 'SIN DEFINIR' },
  { key: 2, value: 'PRIMARIA' },
  { key: 3, value: 'SECUNDARIA' },
  { key: 4, value: 'BACHILLERATO' },
  { key: 5, value: 'TÉCNICO' },
  { key: 6, value: 'TECNOLÓGICO' },
  { key: 7, value: 'UNIVERSITARIO' },
  { key: 8, value: 'ESPECIALIZACIÓN' },
  { key: 9, value: 'DOCTORADO' },
];

const GRUPOS_SANGUINEOS = [
  { key: 1, value: 'Sin definir' },
  { key: 2, value: 'A+' },
  { key: 3, value: 'A-' },
  { key: 4, value: 'B+' },
  { key: 5, value: 'B-' },
  { key: 6, value: 'O+' },
  { key: 7, value: 'O-' },
  { key: 8, value: 'AB+' },
  { key: 9, value: 'AB-' },
];


const AspiranteDetailModal = ({ isOpen, onClose, aspirante, onSave }) => {
  // Estado para loader al abrir modal
  const [loadingAspiranteDetalle, setLoadingAspiranteDetalle] = useState(false);
  const [listaCargo, setListaCargo] = useState([]);
  const [concepto, setconcepto] = useState(null);
  const [desempeñoReportado, setDesempeñoReportado] = useState(null);
  const [motivoRetiro, setMotivoRetiro] = useState(null);
  const [personaQReferencia, setpersonaQReferencia] = useState(null);
  const [telefonoExperiencia, settelefonoExperiencia] = useState(null);
  const [referenciadoPor, setreferenciadoPor] = useState(null);
  const [reEps, setreEps] = useState(null);
  const [tiempoDuracion, setTiempoDuracion] = useState(null);
  const [fechaExpedicion, setFechaExpedicion] = useState(null);
  const [comentariosReferenciador, setComentariosReferenciador] = useState(null);
  const [indexValidacionExperiencia, setIndexValidacionExperiencia] = useState(null);
  const [nombreContacto, setNombreContacto] = useState(null);
  const [cargoExperiencia, setCargoExperiencia] = useState('');
  const [funcionesExperiencia, setFuncionesExperiencia] = useState('');

  // ✅ Estado inicial seguro para evitar uncontrolled inputs
  const initialFormData = {
    IdRegistroPersonal: '',
    IdNivelEducativo: '',
    IdTipoIdentificacion: '',
    DescripcionTipoIdentificacion: '',
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    tieneWhatsapp: false,
    numeroWhatsapp: '',
    fechaNacimiento: '',
    direccion: '',
    estatura: '',
    peso: '',
   grupoSanguineo: '',
   IdGrupoSanguineo: '',
    eps: { idEps: '2' },
    arl: '',
    fondoPensiones: '',
    estadoCivil: '',
    genero: '',
    antecedentesMedicos: '',
    medicamentos: '',
    estudiaActualmente: '',
    comoSeEnteroVacante: '',
    tieneLimitacionesFisicas: '',
    descripcionFormacionAcademica: '',
    DescripcionLugarNacimiento: '',
    datosAdicionales: [],
    estadoFormacion: [],
    estadoProceso: 0,
    experienciaLaboral: [],
    fondoPensiones: [],
    nivelEducativo: [],
    nucleoFamiliar: [],
    referencias: [],
    tipoCargo: [],
    tipoEps: [],
    tipoEstadoCivil: [],
    tipoGenero: [],
    tipoIdentificacion: [],
    nivelAcademico: '',
    nombreEstadoFormacion: '',
    lugarExpedicion: '',
    fechaExpedicion: '',
    descripcionNivelEducativo: '',
    contactoEmergencia: '',
    telefonoContactoEmergencia: '',
    documentos: [],
    seleccion: {},
    formacion: {},
    entrevista: [],        // ✅ (CAMBIO) siempre array para poder usar entrevista[0]
    entrevistas: [],       // ✅ (CAMBIO) array
    referenciasLaborales: [],
    referenciasPersonales: [],
    documentosSeguridad: [],
    asignacionCargo: {},
    estado: '',
    IdTipoEps:2,
    IdFondoPensiones: 1,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [observacionNucleoOriginal, setObservacionNucleoOriginal] = useState('');
  const [activeTab, setActiveTab] = useState('personal');
  const [lugarNacimiento, setLugarNacimiento] = useState([]);

  useEffect(() => {
    const fetchDropDownList = async () => {
      try {
        const response = await getListaCargo();
        setListaCargo(response.data || []);
        const responseNacimiento = await getListaLugarNacimiento();
        setLugarNacimiento(
          (responseNacimiento.data || [])
            .slice()
            .sort((a, b) =>
              (a?.Nombre || "").localeCompare((b?.Nombre || ""), "es", { sensitivity: "base" })
            )
        );
      } catch (error) {
        console.error('Error cargando lista drop:', error);
      }
    };
    fetchDropDownList();
  }, []);

  // ✅ (CAMBIO) NO borres aspiranteDetalle (te rompe recarga / observaciones)
  // Solo resetea payloads temporales cuando abres o cambias aspirante
  useEffect(() => {
    if (!isOpen) return;
    console.log("IdNivelEducativo:", formData?.IdNivelEducativo);
  console.log("nivelAcademico:", formData?.nivelAcademico);
    localStorage.removeItem('estadoValidacionExperienciaLaboral_payload_1');
    localStorage.removeItem('estadoValidacionExperienciaLaboral_payload_2');
    localStorage.removeItem('IndexValidacionExperienciaLaboral');
  }, [isOpen, aspirante?.id]);

  // ✅ (CAMBIO) fetch de detalle: accesos seguros + entrevista como array + observaciones correctas
  useEffect(() => {
    if (!aspirante?.id || !isOpen) return;

    setLoadingAspiranteDetalle(true);

    const fetchAspiranteDetalle = async () => {
      try {
        const response = await getAspirante(aspirante.id);
         const documentos = await getDocumentacionIngreso(aspirante.id);
         const documentosSeguridadResp = await getDocumentosSeguridad(aspirante.id);
         const responseEntrevista = await entrevistaCandidatoService.listarPorRegistro(aspirante.id);

         let responseMotivoCierre = null;
         try {
         responseMotivoCierre = await getMotivoCierre(aspirante.id);
         } catch (error) {
         responseMotivoCierre = null;
         }

        // ✅ entrevista SIEMPRE array
        const entrevistaArr = Array.isArray(responseEntrevista?.data)
          ? responseEntrevista.data
          : (responseEntrevista?.data ? [responseEntrevista.data] : []);

         const motivoCierreGuardado =
         responseMotivoCierre?.data?.MotivoCierre ||
         responseMotivoCierre?.data?.motivoCierre ||
         '';

        let asignacionCargoCliente = {};
        try {
          asignacionCargoCliente = await getAsignacionCargoCliente(aspirante.id);
        } catch (error) {
          console.error('Error al obtener detalle de aspirante:', error);
        }

        if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
          const fila = response.data[0];

          const da0 = fila?.datos_adicionales?.[0] || {};
          const gs = da0?.grupo_sanguineo?.Descripcion || '';
          const ds0 = fila?.datos_seleccion?.[0] || {};

          const exp0Val0 = fila?.experiencia_laboral?.[0]?.validaciones?.[0] || {};
          const refPers0 = fila?.referencias_personales_validacion?.[0] || {};

          const obsNF =
            fila?.nucleo_familiar?.[0]?.observaciones?.Observaciones ||
            '';

            setFormData(prev => ({
            ...prev,
            IdRegistroPersonal: fila?.IdRegistroPersonal || '',
            IdTipoIdentificacion: fila?.IdTipoIdentificacion ? String(fila.IdTipoIdentificacion) : '',
            DescripcionTipoIdentificacion: fila?.tipo_identificacion?.Descripcion || '',

            nombres: fila?.Nombres || '',
            apellidos: fila?.Apellidos || '',
            email: fila?.Email || '',
            telefono: fila?.Celular || '',

            tieneWhatsapp: fila?.TieneWhatsapp || false,
            numeroWhatsapp: fila?.NumeroWhatsapp || '',

            fechaNacimiento: fila?.FechaNacimiento || '',
            direccion: da0?.Direccion || '',

            estatura: fila?.AlturaMetros ?? '',
            peso: fila?.PesoKilogramos ?? '',

            grupoSanguineo: gs,
            IdGrupoSanguineo: fila?.datos_adicionales[0]?.IdGrupoSanguineo || '',
            eps: { idEps: fila?.IdTipoEps ? String(fila.IdTipoEps) : '2' },

            arl: ds0?.Arl || (prev?.arl || ''),
            AntecedentesMedicos: ds0?.AntecedentesMedicos || (prev?.AntecedentesMedicos || ''),
            medicamentos: ds0?.Medicamentos || (prev?.medicamentos || ''),

            fechaProceso: ds0?.FechaProceso || (prev?.fechaProceso || ''),
            tipoCargo: ds0?.TipoCargo || (prev?.tipoCargo || ''),
            haTrabajadoAntesEmpresa: (ds0?.HaTrabajadoAntesEnLaEmpresa ?? (prev?.haTrabajadoAntesEmpresa || '')),

            fondoPensiones: fila?.fondo_pensiones?.Nombre || '',
            IdFondoPensiones: fila?.fondo_pensiones?.IdFondoPensiones ? String(fila.fondo_pensiones.IdFondoPensiones) : prev?.IdFondoPensiones || '1',
            estadoCivil: fila?.tipo_estado_civil?.Descripcion || '',
            genero: fila?.tipo_genero?.Descripcion || '',

            estudiaActualmente: fila?.EstudiaActualmente || '',
            comoSeEnteroVacante: fila?.ComoSeEnteroVacante || '',
            tieneLimitacionesFisicas: fila?.TieneLimitacionesFisicas || '',
            descripcionFormacionAcademica: fila?.DescripcionFormacionAcademica || '',
            DescripcionLugarNacimiento: fila?.DescripcionLugarNacimiento || '',

            datosAdicionales: fila?.datos_adicionales || [],
            estadoFormacion: fila?.estado_formacion || [],

            estadoProceso: fila?.IdEstadoProceso,
            idEstadoProcesoActual: fila?.IdEstadoProceso,
            estado: fila?.IdEstadoProceso?.toString() || '',

            experienciaLaboral: fila?.experiencia_laboral || [],
            nucleoFamiliar: fila?.nucleo_familiar || [],
            referencias: fila?.referencias || [],

            fondoPensionesObj: fila?.fondo_pensiones || [],
            nivelEducativo: fila?.nivel_educativo || [],

            tipoCargoObj: fila?.tipo_cargo || [],
            tipoEpsObj: fila?.tipo_eps || [],
            tipoEstadoCivilObj: fila?.tipo_estado_civil || [],
            tipoGeneroObj: fila?.tipo_genero || [],
            tipoIdentificacionObj: fila?.tipo_identificacion || [],

            IdNivelEducativo: fila?.IdNivelEducativo || fila?.IdNivelEducativoFormacion || fila?.IdNivelEducativoSeleccion || '',
            nivelAcademico: fila?.DescripcionNivelEducativo || '',
            nombreEstadoFormacion: fila?.estado_formacion?.Nombre || '',
            lugarExpedicion: fila?.LugarExpedicion || '',
            fechaExpedicion: fila?.FechaExpedicion || '',
            descripcionNivelEducativo: fila?.nivel_educativo?.Descripcion || '',

            contactoEmergencia: fila?.ContactoEmergencia || [],
            telefonoContactoEmergencia: fila?.TelefonoContactoEmergencia || [],

            documentos: documentos?.data || [],
            documentosSeguridad: documentosSeguridadResp?.data || [],

            lugarNacimiento: fila?.lugar_nacimiento?.Nombre || '',

            entrevista: {
               ...(Array.isArray(entrevistaArr) ? (entrevistaArr[0] || {}) : {}),
               motivo: motivoCierreGuardado,
            },
            entrevistas: entrevistaArr,

            asignacionCargo: asignacionCargoCliente || {},

            seleccion: {
               ...(prev.seleccion || {}),
               fechaExpedicion: fila?.FechaExpedicion || '',
            },

            referenciaPersonalValidacion: refPers0,
            experienciaLaboralValidacion: exp0Val0,
            datosSeleccion: ds0,

            descripcionEps: fila?.tipo_eps?.Descripcion || '',
            CuantosHijos: fila?.CuantosHijos || '',
            IdLugarNacimiento: fila?.IdLugarNacimiento || '',
            IdTipoEps: fila?.IdTipoEps || '',
            IdTipoEstadoFormacion: fila?.IdTipoEstadoFormacion || '',

            observacionesNucleFamiliarEntrevista: obsNF,
            }));

            setObservacionNucleoOriginal(obsNF || '');
        }
         } catch (error) {
         console.error('Error al obtener detalle de aspirante:', error);
         } finally {
         setIsAddingRefLab(false);
         setIndexValidacionExperiencia(null);
         setNombreContacto('');
         setLoadingAspiranteDetalle(false);
         }
      };

    fetchAspiranteDetalle();
  }, [aspirante?.id, isOpen]);

  // ✅ (CAMBIO) Guarda aspiranteDetalle cuando formData ya está actualizado (no al abrir)
  useEffect(() => {
    // guarda el último estado real para que al re-entrar veas observaciones/validaciones
    try {
      if (!isOpen) return;
      if (!aspirante?.id) return;
      if (!formData) return;
      localStorage.setItem('aspiranteDetalle', JSON.stringify(formData));
      } catch (e) {
      console.error('Error al guardar aspiranteDetalle en localStorage:', e);
      }
  }, [isOpen, aspirante?.id, formData]);

  // =========================
  // ✅ VALIDACIÓN OBLIGATORIA: Certificado laboral si hay experiencia
  // =========================
  const tieneDocumentoAdjunto = (docId) => {
    if (!Array.isArray(formData?.documentos)) return false;
    return formData.documentos.some((d) => {
      if (!d) return false;
      const sameId = String(d.IdTipoDocumentacion) === String(docId);
      const hasContent = !!(d.DocumentoBase64 || d.DocumentoCargado);
      return sameId && hasContent;
    });
  };

  const tieneExperienciaLaboral = () => {
    if (Array.isArray(formData?.experienciaLaboral) && formData.experienciaLaboral.length > 0) return true;

    if (Array.isArray(formData?.experiencias) && formData.experiencias.length > 0) {
      return formData.experiencias.some((e) => {
        if (!e) return false;
        return (
          String(e.compañia || e.compania || '').trim() ||
          String(e.cargo || '').trim() ||
          String(e.funciones || '').trim() ||
          String(e.tiempoDuracion || '').trim() ||
          String(e.jefeInmediato || '').trim() ||
          String(e.telefonoJefe || '').trim() ||
          String(e.inicio || '').trim() ||
          String(e.fin || '').trim()
        );
      });
    }
    return false;
  };

  const validarAntesDeGuardar = () => {
    if (tieneExperienciaLaboral() && !tieneDocumentoAdjunto(10)) {
      toast({
        title: "Falta Certificado laboral",
        description:
          "Registraste experiencia laboral, pero no adjuntaste el documento obligatorio: Certificado laboral (id 10).",
        variant: "destructive",
      });

      try { setActiveTab("documentos"); } catch (e) {}
      return false;
    }
    return true;
  };

  // Descarga masiva de documentos de ingreso en .zip
  const handleDescargaMasivaDocumentosIngreso = async () => {
    if (!Array.isArray(formData.documentos) || formData.documentos.length === 0) {
      toast({ title: 'No hay documentos de ingreso para descargar', variant: 'destructive' });
      return;
    }
    const zip = new JSZip();
    const docsIngreso = formData.documentos.filter(doc =>
      requisitosObligatorios.some(req => String(req.id) === String(doc.IdTipoDocumentacion))
    );
    if (docsIngreso.length === 0) {
      toast({ title: 'No hay documentos de ingreso para descargar', variant: 'destructive' });
      return;
    }
    for (const doc of docsIngreso) {
      if (!doc.DocumentoBase64) continue;
      let ext = 'pdf';
      if (doc.Formato === 'image/png') ext = 'png';
      else if (doc.Formato === 'image/jpeg') ext = 'jpg';

      let base64 = doc.DocumentoBase64;
      if (base64.startsWith('data:')) {
        const match = base64.match(/^data:(.*?);base64,/);
        if (match) {
          const mime = match[1];
          if (mime.includes('pdf')) ext = 'pdf';
          else if (mime.includes('png')) ext = 'png';
          else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
          else if (mime.includes('image')) ext = 'img';
          base64 = base64.split(',')[1];
        }
      }
      const nombre = (doc.Descripcion || 'documento') + '.' + ext;
      try {
        zip.file(nombre.replace(/\s+/g, '_'), base64, { base64: true });
      } catch (e) {}
    }
    try {
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'documentos_de_ingreso.zip');
      toast({ title: 'Descarga iniciada', description: 'Se está descargando el archivo .zip con los documentos de ingreso.' });
    } catch (e) {
      toast({ title: 'Error al generar el zip', description: e.message, variant: 'destructive' });
    }
  };

  const getLogoBase64 = async (LOGO) => {
    let res = null;
    switch (LOGO) {
      case 'LOGO1':
        res = await fetch('/LOGO/LOGOPRINCIPAL.png');
        break;
      case 'LOGO2':
        res = await fetch('/LOGO/LOGO_MANTENER_INGENIERIA.png?v=2');
        break;
      default:
        res = await fetch('/LOGO/LOGOPRINCIPAL.png');
        break;
    }

    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  };

const handleDescargarReferencia = async (ref) => {
  try {
    const validacion = Array.isArray(ref?.validaciones)
      ? (ref.validaciones[0] || {})
      : (ref?.validaciones || {});

    const idExp =
      ref?.IdExperienciaLaboral ||
      ref?.id ||
      null;

    let observacionHojita = '';

    if (idExp) {
      try {
        const resObs = await GetObservacionesExperienciaLaboral(idExp);
        if (resObs?.ok) {
          const dataObs = await resObs.json();
          observacionHojita =
            dataObs?.Observaciones ??
            dataObs?.observaciones ??
            dataObs?.observacionesInternas ??
            dataObs?.observaciones_internas ??
            '';
        }
      } catch (e) {
        console.error('Error consultando observaciones de experiencia laboral:', e);
      }
    }

    const campos = {
      LOGO: await getLogoBase64('LOGO1'),
      LOGO2: await getLogoBase64('LOGO2'),

      EMPRESA_REFERENCIADA: (ref?.Compania || '').toUpperCase(),
      CARGO: (ref?.Cargo || '').toUpperCase(),
      TIEMPO_LABORADO: (validacion?.TiempoDuracion || ref?.TiempoDuracion || '').toUpperCase(),
      MOTIVO_RETIRO: (validacion?.MotivoRetiroReal || '').toUpperCase(),
      EVALUACION_DESEMPEÑO: (validacion?.DesempenoReportado || '').toUpperCase(),

      NOMBRE_REFERENCIA: (
        validacion?.PersonaQueReferencia ||
        formData?.experienciaLaboralValidacion?.PersonaQueReferencia ||
        ''
      ).toUpperCase(),

      TELEFONO_REFERENCIA: validacion?.Telefono || ref?.TelefonoJefe || '',
      FUNCIONES: (ref?.Funciones || '').toUpperCase(),

      OBSERVACIONES_EXP: (observacionHojita || obsRefLabText || '').toUpperCase(),

      CONCEPTO_FINAL: (validacion?.Concepto || '').toUpperCase(),

      OBSERVACIONES: (
        validacion?.ComentariosDelReferenciado ||
        validacion?.ComentariosDelReferenciador ||
        validacion?.Observaciones ||
        ''
      ).toUpperCase(),

      FECHA_REGISTRO: validacion?.CreadoEn || '',
      REFERENCIADOR_ALP: (validacion?.ReferenciadoPor || '').toUpperCase(),
      IDENTIFICACION: formData?.cedula || '',
    };

    let pdf_base64 = '';
    const response = await DescargarDocumentoPdf(campos, 'referencias');

    if (response && typeof response.json === 'function') {
      const data = await response.json();
      pdf_base64 = data.pdf_base64;
    } else if (response && response.pdf_base64) {
      pdf_base64 = response.pdf_base64;
    }

    if (!pdf_base64) {
      console.error('No se recibió pdf_base64');
      return;
    }

    const doc = {
      DocumentoBase64: 'data:application/pdf;base64,' + pdf_base64,
    };

    descargarDocumento(doc);
  } catch (error) {
    console.error('Error al descargar referencia:', error);
  }
};
    const handleDescargarTratamientoDatos = async () => {
    const campos = {
      LOGO: await getLogoBase64('LOGO1'),
      LOGO2: await getLogoBase64('LOGO2'),
      NOMBRES: ((formData?.nombres || '') + ' ' + (formData?.apellidos || '')).trim(),
      TIPO_IDENTIFICACION: formData?.DescripcionTipoIdentificacion || '',
      NUMERO_IDENTIFICACION: formData?.cedula || '',
      CIUDAD_EXPEDICION: formData?.lugarExpedicion || '',
      FECHA_FIRMA: formData?.fechaExpedicion || '',
      FIRMA: getDocumentoBase64Tipo42(),
      EMAIL: formData?.email || '',
    };

    let pdf_base64 = '';
    const response = await DescargarDocumentoPdf(campos, 'tratamiento_datos');
    if (response && typeof response.json === 'function') {
      const data = await response.json();
      pdf_base64 = data.pdf_base64;
    } else if (response && response.pdf_base64) {
      pdf_base64 = response.pdf_base64;
    }
    const doc = { DocumentoBase64: 'data:application/pdf;base64,' + (pdf_base64 || '') };
    descargarDocumento(doc);
  };

   const handleVerDocumentoSeguridad = (doc, isTratamientoDatos = false) => {
   try {
      if (isTratamientoDatos) {
         handleDescargarTratamientoDatos();
         return;
      }

      if (!doc || !doc.DocumentoBase64) {
         alert('No se encontró el documento para visualizar.');
         return;
      }

      const formato = doc.Formato || 'application/pdf';
      let base64 = doc.DocumentoBase64 || '';

      if (base64.startsWith('data:')) {
         base64 = base64.split(',')[1];
      }

      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
         byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: formato });
      const blobUrl = URL.createObjectURL(blob);

      window.open(blobUrl, '_blank', 'noopener,noreferrer');
   } catch (error) {
      console.error('Error al visualizar documento de seguridad:', error);
      alert('No fue posible visualizar el documento.');
   }
   };


  // Function to handle viewing reference laboral
    const [refLabEstadosCargados, setRefLabEstadosCargados] = useState({});

    const handleViewRefLaboral = (idx, ref) => {

      const payload_1 = localStorage.getItem('estadoValidacionExperienciaLaboral_payload_1');
      const payload_2 = localStorage.getItem('estadoValidacionExperienciaLaboral_payload_2');
      localStorage.setItem('IndexValidacionExperienciaLaboral', idx + 1);
  
    const aspiranteDetalle = formData;
    const validacionSeleccionada = formData?.experienciaLaboral?.[idx]?.validaciones?.[0] || null;

    if (!payload_1 || !payload_2) {
      setNombreContacto(aspiranteDetalle?.experienciaLaboral?.[idx]?.JefeInmediato || '');
      setIndexValidacionExperiencia(idx + 1);
      setconcepto(validacionSeleccionada?.Concepto || '');
      setDesempeñoReportado(validacionSeleccionada?.DesempenoReportado || '');
      setMotivoRetiro(validacionSeleccionada?.MotivoRetiroReal || '');
      setpersonaQReferencia(validacionSeleccionada?.PersonaQueReferencia || '');
      settelefonoExperiencia(validacionSeleccionada?.Telefono || '');
      setreferenciadoPor(validacionSeleccionada?.ReferenciadoPor || '');
      setreEps(validacionSeleccionada?.Eps || '');
      setTiempoDuracion(validacionSeleccionada?.TiempoDuracion || '');
      setFechaExpedicion(validacionSeleccionada?.FechaExpedicionDocumentoIdentidad || '');
      setComentariosReferenciador(validacionSeleccionada?.ComentariosDelReferenciado || '');
      setCargoExperiencia(formData?.experienciaLaboral?.[idx]?.Cargo || aspiranteDetalle?.experienciaLaboral?.[idx]?.Cargo ||  '');
      setFuncionesExperiencia(formData?.experienciaLaboral?.[idx]?.Funciones || aspiranteDetalle?.experienciaLaboral?.[idx]?.Funciones ||  '');
    }

    if (payload_1 && idx + 1 == 1) {
      let payload = JSON.parse(payload_1);
      setNombreContacto(aspiranteDetalle?.experienciaLaboral?.[idx]?.JefeInmediato || '');
      setIndexValidacionExperiencia(idx + 1);
      setconcepto(payload.Concepto || '');
      setDesempeñoReportado(payload.DesempenoReportado || '');
      setMotivoRetiro(payload.MotivoRetiroReal || '');
      setpersonaQReferencia(payload.PersonaQueReferencia || '');
      settelefonoExperiencia(payload.Telefono || '');
      setreferenciadoPor(payload.ReferenciadoPor || '');
      setreEps(payload.Eps || '');
      setTiempoDuracion(payload.TiempoDuracion || '');
      setFechaExpedicion(payload.FechaExpedicionDocumentoIdentidad || '');
      setComentariosReferenciador(payload.ComentariosDelReferenciado || '');
    }

    if (payload_2 && idx + 1 == 2) {
      let payload = JSON.parse(payload_2);
      setNombreContacto(aspiranteDetalle?.experienciaLaboral?.[idx]?.JefeInmediato || '');
      setIndexValidacionExperiencia(idx + 1);
      setconcepto(payload.Concepto || '');
      setDesempeñoReportado(payload.DesempenoReportado || '');
      setMotivoRetiro(payload.MotivoRetiroReal || '');
      setpersonaQReferencia(payload.PersonaQueReferencia || '');
      settelefonoExperiencia(payload.Telefono || '');
      setreferenciadoPor(payload.ReferenciadoPor || '');
      setreEps(payload.Eps || '');
      setTiempoDuracion(payload.TiempoDuracion || '');
      setFechaExpedicion(payload.FechaExpedicionDocumentoIdentidad || '');
      setComentariosReferenciador(payload.ComentariosDelReferenciado || '');
    }

   
    if (isAddingRefLab && selectedRefLabIdx === idx) {
      setIsAddingRefLab(false);
      setSelectedRefLabIdx(null);
      return;
    }

    setSelectedRefLabIdx(idx);
    setNewRefLaboral(
      ref?.validacion
        ? { ...EMPTY_REF_LAB_VALIDACION, ...ref.validacion }
        : EMPTY_REF_LAB_VALIDACION
    );
// ✅ Precargar fecha de expedición desde Datos Personales
      const fechaExpAspirante = formData?.seleccion?.fechaExpedicion || '';
      setFechaExpedicion(fechaExpAspirante);

    // ✅ Precargar EPS desde Datos Personales (IdTipoEps -> texto)
      const epsTexto =
      EPS?.find((e) => String(e.key) === String(formData?.IdTipoEps))?.value ||
  '';

// ✅ llenar el input del formulario
setreEps(epsTexto);
    setIsAddingRefLab(true);
    setRefLabEstadosCargados(prev => ({ ...prev, [idx]: true }));
  };

  const handleEliminarExperienciaLaboral = async (idx, ref) => {
  try {
    const idExp =
      ref?.IdExperienciaLaboral ||
      ref?.id ||
      formData?.experienciaLaboral?.[idx]?.IdExperienciaLaboral;

    if (!idExp) {
      alert("No se encontró el IdExperienciaLaboral del registro.");
      return;
    }

    const confirmar = window.confirm("¿Seguro que deseas eliminar esta experiencia laboral?");
    if (!confirmar) return;

    const response = await EliminarExperienciaLaboral(idExp);

    if (response.ok) {
      setFormData((prev) => {
        const listaActual = Array.isArray(prev?.experienciaLaboral)
          ? [...prev.experienciaLaboral]
          : [];

        const nuevaLista = listaActual.filter((_, i) => i !== idx);

        return {
          ...prev,
          experienciaLaboral: nuevaLista,
        };
      });

      alert("Experiencia laboral eliminada correctamente.");
    } else {
      const txt = await response.text();
      console.error("Error eliminando experiencia laboral:", response.status, txt);
      alert("No fue posible eliminar la experiencia laboral.");
    }
  } catch (error) {
    console.error("Error inesperado eliminando experiencia laboral:", error);
    alert("Ocurrió un error inesperado al eliminar la experiencia laboral.");
  }
};

  // Devuelve el primer DocumentoBase64 de tipo 42 como string
  const getDocumentoBase64Tipo42 = () => {
    if (!Array.isArray(formData?.documentos)) return '';
    const doc = formData.documentos.find(
      d => d && String(d.IdTipoDocumentacion) === '42' && d.DocumentoBase64
    );
    if (!doc) return '';
    const base64 = doc.DocumentoBase64 || '';
    return base64.startsWith('data:image/png;base64,')
      ? base64
      : 'data:image/png;base64,' + base64;
  };

  function calcularEdad(fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  }

  // ✅ Convertir IdTipoEps (número) -> nombre (texto) usando el catálogo EPS
      const epsTexto =
      EPS?.find((e) => String(e.key) === String(formData?.IdTipoEps))?.value || '';

  const handleDescargarEntrevista = async () => {

  const entrevistaBase = Array.isArray(formData?.entrevista)
  ? (formData.entrevista[0] || {})
  : (formData?.entrevista || {});

   const experienciasValidas = Array.isArray(formData?.experienciaLaboral)
  ? formData.experienciaLaboral.slice(0, 2)
  : [];

let observacionExperiencia = '';

if (experienciasValidas.length > 0) {
  try {
    const observacionesExperiencias = [];

    for (let i = 0; i < experienciasValidas.length; i++) {
      const exp = experienciasValidas[i];

      const idExp =
        exp?.IdExperienciaLaboral ||
        exp?.id ||
        null;

      if (!idExp) continue;

      const resObs = await GetObservacionesExperienciaLaboral(idExp);

      if (!resObs?.ok) continue;

      const dataObs = await resObs.json();

      const observacion = String(dataObs?.Observaciones || '').trim();
      const empresa = String(exp?.Compania || '').trim();

      if (observacion) {
        observacionesExperiencias.push(
          empresa
            ? `${i + 1}. ${empresa}: ${observacion}`
            : `${i + 1}. ${observacion}`
        );
      }
    }

    observacionExperiencia = observacionesExperiencias.join(' | ');
  } catch (e) {
    console.error('Error consultando observaciones de experiencia laboral para entrevista:', e);
  }
}

console.log('observacionExperiencia final:', observacionExperiencia);
const campos = {
  LOGO: await getLogoBase64('LOGO1'),
  LOGO2: await getLogoBase64('LOGO2'),
  NOMBRES: ((formData?.nombres || '').toUpperCase() + ' ' + (formData?.apellidos || '').toUpperCase()).trim(),
  DOCUMENTO: formData?.cedula || '',
  BARRIO: (formData?.datosAdicionales?.[0]?.Barrio || '').toUpperCase(),
  LOCALIDAD: formData?.datosAdicionales?.[0]?.localidad?.Nombre || '',
  CARGO: formData?.asignacionCargo?.CargoNombre || '',
  NUCLEO_FAMILIAR: (formData?.observacionesNucleFamiliarEntrevista || '').toUpperCase(),
  HIJOS: formData?.CuantosHijos || '',
  EDAD: calcularEdad(formData?.fechaNacimiento),
  ESTADO_CIVIL: formData?.estadoCivil || '',
  ESTUDIA: formData?.estudiaActualmente || '',
  CELULAR: formData?.celular || '',
  EVALUADOR: (entrevistaBase?.EntrevistadorPor || '').toUpperCase(),
  ASPECTOS_ACADEMICOS: (formData?.nivelEducativo?.Descripcion || '').toUpperCase(),
  EXPERIENCIA: (observacionExperiencia || '').toUpperCase(),
  HA_TRABAJADO_EN_ALP: (
    formData?.datosSeleccion?.HaTrabajadoAntesEnLaEmpresa === true
      ? 'SI'
      : formData?.datosSeleccion?.HaTrabajadoAntesEnLaEmpresa === false
        ? 'NO'
        : (formData?.datosSeleccion?.HaTrabajadoAntesEnLaEmpresa || '')
  ),
  VALIDACION_AM: (formData?.AntecedentesMedicos || '').toUpperCase(),
  EPS: epsTexto || '',
  FORTALEZAS: (entrevistaBase?.Fortalezas || '').toUpperCase(),
  AREAS_DE_MEJORA: (entrevistaBase?.AreasDeMejora || '').toUpperCase(),
  PRUEBA_FISICA: (
    entrevistaBase?.ConceptoFinalPruebaFisica ||
    entrevistaBase?.ConceptoFinalSeleccion ||
    entrevistaBase?.ConceptoFinalS ||
    ''
  ).toUpperCase(),
  CONCEPTO_FINAL: (
    entrevistaBase?.ConceptoFinalSeleccion ||
    entrevistaBase?.ConceptoFinalS ||
    ''
  ).toUpperCase(),
  OBSERVACIONES: (entrevistaBase?.ObservacionesFinales || '').toUpperCase()
};

    let pdf_base64 = '';
console.log('=== VALIDACION FINAL PDF ENTREVISTA ===');
console.log('experienciasValidas:', experienciasValidas);
console.log('observacionExperiencia final:', observacionExperiencia);
console.log('campos.EXPERIENCIA:', campos?.EXPERIENCIA);
console.log('campos completos:', campos);

    const response = await DescargarDocumentoPdf(campos, 'entrevista');
    if (response && typeof response.json === 'function') {
      const data = await response.json();
      pdf_base64 = data.pdf_base64;
    } else if (response && response.pdf_base64) {
      pdf_base64 = response.pdf_base64;
    }
    const doc = { DocumentoBase64: 'data:application/pdf;base64,' + (pdf_base64 || '') };
    descargarDocumento(doc);
  };

  // =========================
  // Datos de Proceso (Selección) - API /api/datos-proceso-aspirante/{id}
  // =========================
const API_BASE =
  import.meta?.env?.VITE_API_URL ||
  import.meta?.env?.VITE_API_BASE_URL ||
  'http://localhost:8000/api';  
  const token = localStorage.getItem('access_token') || localStorage.getItem('token') || '';
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const handleGuardarContactoEmergencia = async () => {
  try {
    if (!formData?.IdRegistroPersonal) {
      alert('No se encontró el IdRegistroPersonal.');
      return;
    }

    const payload = {
      ContactoEmergencia: formData?.contactoEmergencia || '',
      TelefonoContactoEmergencia: formData?.telefonoContactoEmergencia || '',
      UsuarioActualizacion: localStorage.getItem('usuario') || 'sistema',
    };

    const response = await axios.put(
      `${API_BASE}/registro-personal/${formData.IdRegistroPersonal}`,
      payload,
      { headers: { ...authHeaders } }
    );

    if (response?.status === 200) {
      alert('Contacto de emergencia guardado correctamente.');
      return;
    }

    alert('No fue posible guardar el contacto de emergencia.');
  } catch (error) {
    console.error('Error guardando contacto de emergencia:', error);
    alert('Error al guardar el contacto de emergencia.');
  }
};

  const toDateOnly = (value) => {
    if (!value) return null;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const siNoToBool = (v) => {
    if (v === true || v === false) return v;
    if (typeof v === 'string') {
      const up = v.trim().toUpperCase();
      if (up === 'SI' || up === 'SÍ' || up === 'YES' || up === 'TRUE') return true;
      if (up === 'NO' || up === 'FALSE') return false;
    }
    return null;
  };

  const [loadingDatosProceso, setLoadingDatosProceso] = useState(false);
  const [savingDatosProceso, setSavingDatosProceso] = useState(false);
  const datosProcesoFetchedRef = useRef(false);

  // ✅ (CAMBIO) SOLO reinicia guard (NO escribas localStorage aquí porque aún no está cargado)
  useEffect(() => {
    datosProcesoFetchedRef.current = false;
  }, [isOpen, aspirante?.id]);

  // Carga los 5 campos del back cuando el modal abre
  useEffect(() => {
    if (!isOpen || !aspirante?.id) return;
    if (datosProcesoFetchedRef.current) return;

    const pick = (obj, keys, fallback = '') => {
      for (const k of keys) {
        if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
      }
      return fallback;
    };

    const normalizeSiNo = (v) => {
      if (v === true) return 'SI';
      if (v === false) return 'NO';
      if (typeof v === 'string') {
        const up = v.trim().toUpperCase();
        if (up === 'SI' || up === 'SÍ' || up === 'YES' || up === 'TRUE') return 'SI';
        if (up === 'NO' || up === 'FALSE') return 'NO';
      }
      return v || 'NO';
    };

    const fetchDatosProceso = async () => {
      try {
        setLoadingDatosProceso(true);
        datosProcesoFetchedRef.current = true;

        const { data } = await axios.get(
          `${API_BASE}/datos-proceso-aspirante/${aspirante.id}`,
          { headers: { ...authHeaders } }
        );

        const validacionReintegroFromApi =
          data?.validacionReintegro ||
          data?.validacion_reintegro ||
          {
            cumpleTiempo: pick(data, ['cumpleTiempo', 'cumple_tiempo'], false),
            procesosDisciplinarios: pick(data, ['procesosDisciplinarios', 'procesos_disciplinarios'], false),
            aprobadoOperaciones: pick(data, ['aprobadoOperaciones', 'aprobado_operaciones'], false),
          };

        const nextSeleccion = {
          fechaProceso: toDateOnly(pick(data, ['fechaProceso', 'fecha_proceso'], formData?.seleccion?.fechaProceso || '')) || (formData?.seleccion?.fechaProceso || ''),
          tipoCargo: (() => {
            const v = pick(data, ['id_tipo_cargo', 'tipoCargo', 'tipo_cargo'], formData?.seleccion?.tipoCargo || '');
            return (v === null || v === undefined) ? '' : String(v);
          })(),
          tipoIntegro: pick(data, ['tipoIntegro', 'tipo_integro'], formData?.seleccion?.tipoIntegro || ''),
          haTrabajadoAntesEmpresa: normalizeSiNo(
            pick(data, ['haTrabajadoAntesEmpresa', 'ha_trabajado_antes_empresa', 'ha_trabajado_antes_en_la_empresa'], formData?.seleccion?.haTrabajadoAntesEmpresa || 'NO')
          ),
          validacionReintegro: {
            cumpleTiempo: !!validacionReintegroFromApi?.cumpleTiempo,
            procesosDisciplinarios: !!validacionReintegroFromApi?.procesosDisciplinarios,
            aprobadoOperaciones: !!validacionReintegroFromApi?.aprobadoOperaciones,
          },
        };

        setFormData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            seleccion: {
              ...(prev.seleccion || {}),
              ...nextSeleccion,
            },
            AntecedentesMedicos: pick(
              data,
              ['antecedentes_medicos', 'antecedentesMedicos', 'AntecedentesMedicos'],
              prev?.AntecedentesMedicos || ''
            ),
            medicamentos: pick(data, ['medicamentos'], prev?.medicamentos || ''),
          };
        });
      } catch (error) {
        console.error('Error al cargar /api/datos-proceso-aspirante:', error);
      } finally {
        setLoadingDatosProceso(false);
      }
    };

    fetchDatosProceso();
    // ✅ (CAMBIO) NO dependas de formData para no re-ejecutar infinito
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, aspirante?.id]);

  const handleGuardarAsignacionCargoCliente = async () => {
    setSavingDatosProceso(true);
    try {
      setLoadingAspiranteDetalle(true);
      if (!formData.asignacionCargo?.IdCargo) {
  toast({
    title: 'Campo requerido',
    description: 'Debe seleccionar un cargo antes de guardar.',
    variant: 'destructive',
  });
  return;
}
      const payload = {
      IdRegistroPersonal: formData.IdRegistroPersonal,
      IdCliente: formData.asignacionCargo?.IdCliente
         ? Number(formData.asignacionCargo.IdCliente)
         : null,
      IdCargo: formData.asignacionCargo?.IdCargo
         ? Number(formData.asignacionCargo.IdCargo)
         : null,
      UsuarioActualizacion: localStorage.getItem('usuario') || 'sistema',
      Salario:
         formData?.asignacionCargo?.Salario !== undefined &&
         formData?.asignacionCargo?.Salario !== null &&
         String(formData.asignacionCargo.Salario).trim() !== ''
            ? Number(formData.asignacionCargo.Salario)
            : null
      };
      const response = await upsertAsignacionCargoCliente(payload);
      if (response.ok) {
        toast({
          title: 'Asignación cargo',
          description: 'Asignación cargo cliente guardada con éxito.',
          variant: 'success',
        });
      }
    } catch (error) {
      toast({
        title: 'Advertencia cargo',
        description: 'Lo sentimos, no fue posible actualizar el estado proceso, si el error persiste comunicarse con el administrador',
        variant: 'destructive',
      });
      setLoadingAspiranteDetalle(false);
    } finally {
      setSavingDatosProceso(false);
      setLoadingAspiranteDetalle(false);
    }
  };

 const handleActualizarEstadoProceso = async () => {
  setSavingDatosProceso(true);
  try {
    setLoadingAspiranteDetalle(true);

    const estadoInt = parseInt(formData.estadoProceso, 10);

    const tieneCargoCompleto =
      formData?.asignacionCargo?.IdCargo !== undefined &&
      formData?.asignacionCargo?.IdCargo !== null &&
      String(formData.asignacionCargo.IdCargo).trim() !== '' &&
      String(formData.asignacionCargo.IdCargo) !== '0';

    const tieneClienteCompleto =
      formData?.asignacionCargo?.IdCliente !== undefined &&
      formData?.asignacionCargo?.IdCliente !== null &&
      String(formData.asignacionCargo.IdCliente).trim() !== '' &&
      String(formData.asignacionCargo.IdCliente) !== '0';

    const tieneSalarioCompleto =
      formData?.asignacionCargo?.Salario !== undefined &&
      formData?.asignacionCargo?.Salario !== null &&
      String(formData.asignacionCargo.Salario).trim() !== '' &&
      Number(formData.asignacionCargo.Salario) > 0;

    if (estadoInt === 24) {
      if (!tieneCargoCompleto || !tieneClienteCompleto || !tieneSalarioCompleto) {
        toast({
          title: 'No es posible avanzar a contratación',
          description: 'Para avanzar a contratación debe tener cargo, cliente y salario completos.',
          variant: 'destructive',
        });
        return;
      }
    }

    const response = await ActualizarEstadoProcesoService(
      formData.idRegistroPersonal,
      estadoInt,
      localStorage.getItem('usuario') || 'sistema'
    );

      if (formData.estadoProceso == 28) {
        const payload = {
          MotivoCierre: formData?.entrevista?.[0]?.motivo || formData?.entrevista?.motivo || '',
          Observaciones: '',
          UsuarioActualizacion: localStorage.getItem('usuario') || 'sistema',
        };
        const responseMotivo = await upsertMotivoCierre(formData.IdRegistroPersonal, payload);
        if (responseMotivo.data.ok) {
          toast({
            title: 'Motivo Cierre',
            description: 'El motivo de cierre se ha actualizado con éxito.',
            variant: 'success',
          });
        } else {
          toast({
            title: 'Motivo Cierre',
            description: 'Error al actualizar el motivo de cierre.',
            variant: 'destructive',
          });
        }
      }

      if (response.ok) {
        toast({
          title: 'Estado Proceso',
          description: 'Estado del proceso actualizado con éxito.',
          variant: 'success',
        });
      }
    } catch (error) {
      toast({
        title: 'Estado Proceso',
        description: 'Lo sentimos, no fue posible actualizar el estado proceso, si el error persiste comunicarse con el administrador',
        variant: 'destructive',
      });
      console.error('Error al guardar asignación cargo cliente:', error);
    } finally {
      setSavingDatosProceso(false);
      setLoadingAspiranteDetalle(false);
    }
  };

  const [clienteQuery, setClienteQuery] = useState('');
  const clientesFiltrados = clientesALP.filter((c) =>
    c.name.toLowerCase().includes(clienteQuery.toLowerCase().trim())
  );

  // Helper states for dynamic lists
  const [newFamiliar, setNewFamiliar] = useState({
    parentesco: '',
    nombre: '',
    edad: '',
    ocupacion: '',
    observaciones: formData?.observacionesNucleFamiliarEntrevista
  });

  // ✅ Estructuras de validación (Selección)
  const EMPTY_REF_LAB_VALIDACION = {
    concepto: 'Sin hallazgo',
    desempeñoReportado: 'Desempeño positivo',
    motivoRetiroReal: 'Renuncia voluntaria',
    personaQueReferencia: '',
    telefono: '',
    referenciadoPor: 'Genoveva Cubides',
    eps: '',
    tiempoDuracion: 'Menos de 2 meses',
    comentariosEntrevistador: '',
  };

  const EMPTY_REF_PERS_VALIDACION = {
    tiempoDuracion: '',
    descripcion: '',
    lugarVivienda: '',
    tieneHijos: '',
    ObservacionesReferenciador: '',
  };

  const [newRefLaboral, setNewRefLaboral] = useState(EMPTY_REF_LAB_VALIDACION);
  const [newRefPersonal, setNewRefPersonal] = useState(EMPTY_REF_PERS_VALIDACION);

  const EMPTY_EXPERIENCIA_LABORAL = {
  IdExperienciaLaboral: null,
  Compania: '',
  Cargo: '',
  Funciones: '',
  TiempoDuracion: '',
  JefeInmediato: '',
  TelefonoJefe: '',
  FechaIngreso: '',
  FechaRetiro: '',
};

const [isAddingExperiencia, setIsAddingExperiencia] = useState(false);
const [newExperiencia, setNewExperiencia] = useState(EMPTY_EXPERIENCIA_LABORAL);

const soloLetras = (valor) => valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
const soloLetrasYNumeros = (valor) => valor.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '');
const soloNumeros = (valor) => valor.replace(/[^0-9]/g, '');

  const [selectedRefLabIdx, setSelectedRefLabIdx] = useState(null);
  const [selectedRefPersIdx, setSelectedRefPersIdx] = useState(null);

  // ✅ Modal Observaciones (solo para referencia laboral)
  const [obsRefLabOpen, setObsRefLabOpen] = useState(false);
  const [obsRefLabText, setObsRefLabText] = useState('');

  const [isAddingFamiliar, setIsAddingFamiliar] = useState(false);
  const [isAddingRefLab, setIsAddingRefLab] = useState(false);
  const [isAddingRefPers, setIsAddingRefPers] = useState(false);

  // Entrevista Modal State
  const [entrevistaModalOpen, setEntrevistaModalOpen] = useState(false);
  const [selectedEntrevista, setSelectedEntrevista] = useState(null);

  // ✅ (CAMBIO) Estados para el Select "Estado del Proceso General"
  const statusOptions = (() => {
    const filtered = (ALL_STATUS_OPTIONS || []).filter(
      (s) => s !== 'Contratación Validada' && s !== 'CONTRATACIÓN VALIDADA'
    );
    return filtered.includes('RECHAZADO') ? filtered : ['RECHAZADO', ...filtered];
  })();

  useEffect(() => {
    if (aspirante) {
      const estadoFinal =
        aspirante.IdEstadoProceso !== undefined && aspirante.IdEstadoProceso !== null
          ? aspirante.IdEstadoProceso
          : (aspirante.estado && aspirante.estado !== 'Contratación Validada' && aspirante.estado !== 'CONTRATACIÓN VALIDADA'
            ? aspirante.estado
            : 'RECHAZADO');

      setFormData(prev => ({
        ...initialFormData,
        ...aspirante,
        estado: estadoFinal?.toString(),
        seleccion: aspirante.seleccion || {
          fechaProceso: aspirante.fechaRegistro || new Date().toISOString().split('T')[0],
          tipoCargo: aspirante.cargo || 'Operativo',
          tipoIntegro: 'Nuevo',
          identificacion: aspirante.cedula,
          haTrabajadoAntesEmpresa: (aspirante.seleccion && aspirante.seleccion.haTrabajadoAntesEmpresa) ? aspirante.seleccion.haTrabajadoAntesEmpresa : 'NO',
          validacionReintegro: (aspirante.seleccion && aspirante.seleccion.validacionReintegro) ? aspirante.seleccion.validacionReintegro : {
            cumpleTiempo: false,
            procesosDisciplinarios: false,
            aprobadoOperaciones: false
          }
        },
        formacion: aspirante.formacion || {
          nivelAcademico: '',
          formacionAcademica: '',
          estudiaActualmente: 'No',
          experienciaPrevia: 'No',
          estado: ''
        },
        // ✅ (CAMBIO) entrevista como array (para entrevista[0])
        entrevista: Array.isArray(aspirante.entrevista)
          ? aspirante.entrevista
          : (aspirante.entrevista ? [aspirante.entrevista] : []),

        entrevistas: aspirante.entrevistas || [],
        referenciasLaborales: aspirante.referenciasLaborales || [],
        referenciasPersonales: aspirante.referenciasPersonales || aspirante.referencias || [],
        contactoEmergencia: aspirante.contactoEmergencia || { nombre: '', parentesco: '', telefono: '', direccion: '' },

        // ⚠️ Nota: aquí tu "documentos" es objeto, pero arriba en el fetch es array.
        // Lo dejo igual como lo tenías para no romper nada; solo asegúrate que en tu UI no mezclas ambos.
        documentos: aspirante.documentos || {
          fotoFrontalUrl: '',
          conflictoInteres: 'NO',
          autorizacionDatos: false,
          firmaDigitalUrl: '',
          hojaVida: false,
          cedulaCiudadania: false,
          certificadosLaborales: false,
          certificadoEstudio: false,
          certificadosPersonales: false,
          tarjetaProfesional: false,
          certificadoFondosPension: false,
          certificadoAfiliacionEPS: false,
          carnetVacunas: false,
          fotoReciboPublico: false,
          certificacionBancaria: false
        }
      }));
    }
  }, [aspirante, isOpen]);

  if (loadingAspiranteDetalle) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md flex flex-col items-center justify-center min-h-[240px] text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100">
            <svg
              className="animate-spin h-10 w-10 text-emerald-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          </div>

          <div className="mt-6 flex flex-col gap-1">
            <span className="text-lg font-semibold text-gray-800">
              Procesando información
            </span>
            <span className="text-sm text-gray-500">
              Cargando datos del aspirante, por favor espera…
            </span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!formData) return null;

  
   // Modificar handleInputChange para guardar el texto (label) si value es un objeto de lista
   const handleInputChange = (section, field, value) => {
         let processedValue = value;
         // Si el campo es 'estado' en la raíz, siempre guardar el id (número)
         if (section === 'root' && field === 'estado') {
            processedValue = value ? Number(value) : '';
         } else if (value && typeof value === 'object' && value.label) {
            processedValue = value.label;
         }
         setFormData(prev => {
            if (!prev) return prev;
            // Sincronizar IdTipoEstadoFormacion y estadoFormacion.IdTipoEstadoFormacion
            if (section === 'root' && field === 'IdTipoEstadoFormacion') {
               return {
                  ...prev,
                  IdTipoEstadoFormacion: processedValue,
                  estadoFormacion: {
                     ...prev.estadoFormacion,
                     IdTipoEstadoFormacion: processedValue
                  }
               };
            }
            // Sincronizar DescripcionFormacionAcademica y descripcionFormacionAcademica
            if (section === 'root' && (field === 'DescripcionFormacionAcademica' || field === 'descripcionFormacionAcademica')) {
               return {
                  ...prev,
                  descripcionFormacionAcademica: processedValue
               };
            }
            if (section === 'root') {
               return { ...prev, [field]: processedValue };
            }
            if (section === 'newRefLaboral') {
               return { ...prev, newRefLaboral: { ...prev.newRefLaboral, [field]: processedValue } };
            }
            if (section) {
               return { ...prev, [section]: { ...prev[section], [field]: processedValue } };
            }
            return { ...prev, [field]: processedValue };
         });
      // Si el campo es de newRefLaboral, actualizar el estado correspondiente
      if (section === 'newRefLaboral') {
         setNewRefLaboral(prev => ({ ...prev, [field]: processedValue }));
      }
      // Si el campo es de newRefPersonal, actualizar el estado correspondiente
      if (section === 'newRefPersonal') {
         setNewRefPersonal(prev => ({ ...prev, [field]: processedValue }));
      }
   };


   // Elimina documentos (seguridad u obligatorios) del estado
 const removeDocument = async (docId) => {
  try {
    const idRegistroPersonal =
      formData?.IdRegistroPersonal ||
      aspirante?.id ||
      aspirante?.IdRegistroPersonal ||
      null;

    if (!idRegistroPersonal) {
      alert('No se encontró el IdRegistroPersonal.');
      return;
    }

    const response = await EliminarDocumentoSeguridadPorTipo(idRegistroPersonal, docId);

    if (!response.ok) {
      const txt = await response.text();
      console.error('Error eliminando documento de seguridad:', txt);
      alert('No fue posible eliminar el documento.');
      return;
    }

    const respDocsSeguridad = await getDocumentosSeguridad(idRegistroPersonal);
    const documentosSeguridadActualizados = respDocsSeguridad?.data || [];

    setFormData(prev => ({
      ...prev,
      documentosSeguridad: documentosSeguridadActualizados,
    }));

    alert('Documento eliminado correctamente.');
  } catch (error) {
    console.error('Error eliminando documento de seguridad:', error);
    alert('Ocurrió un error al eliminar el documento.');
  }
};

   // Construye el payload para documentos de seguridad y lo muestra en consola
   const handleEnviarDocumentosSeguridad = async (docsSeguridad) => {
      setLoadingAspiranteDetalle(true);
      const idRegistroPersonal = aspirante?.id || formData?.IdRegistroPersonal;

      // Generar PDF de tratamiento de datos y agregarlo al listado
      // Solo si no existe ya en docsSeguridad
      const yaTieneTratamiento = docsSeguridad.some(doc => String(doc.IdTipoDocumentacion) === '73');
      let docsSeguridadFinal = [...docsSeguridad];
      if (!yaTieneTratamiento) {
         // Construir los campos necesarios para la plantilla
         const campos = {
            LOGO: await getLogoBase64('LOGO1'),
            LOGO2: await getLogoBase64('LOGO2'),
            NOMBRES: formData?.nombres + ' ' + formData?.apellidos || '',
            TIPO_IDENTIFICACION: formData.DescripcionTipoIdentificacion || '',
            NUMERO_IDENTIFICACION: formData?.cedula || '',
            CIUDAD_EXPEDICION: formData?.lugarExpedicion || '',
            FECHA_FIRMA: formData?.fechaExpedicion || '',
            FIRMA: getDocumentoBase64Tipo42 && typeof getDocumentoBase64Tipo42 === 'function' ? getDocumentoBase64Tipo42() : '',
            EMAIL: formData?.email || '',
         };
         let pdf_base64 = '';
         try {
            const response = await DescargarDocumentoPdf(campos, 'tratamiento_datos');
            if (response && typeof response.json === 'function') {
               const data = await response.json();
               pdf_base64 = data.pdf_base64;
            } else if (response && response.pdf_base64) {
               pdf_base64 = response.pdf_base64;
            }
         } catch (e) {
            pdf_base64 = '';
         }
         if (pdf_base64) {
            docsSeguridadFinal.push({
               IdTipoDocumentacion: 73,
               Nombre: 'Tratamiento de datos',
               DocumentoBase64: 'data:application/pdf;base64,' + pdf_base64,
               Formato: 'application/pdf',
            });
         }
      }

      const payload = {
         idRegistroPersonal,
         documentos_seguridad: docsSeguridadFinal.map(doc => ({
            IdTipoDocumentacion: doc.IdTipoDocumentacion,
            Nombre: doc.Nombre,
            DocumentoCargado: doc.DocumentoBase64 || doc.DocumentoCargado,
            Formato: doc.Formato || 'application/pdf',
         }))
      };
      const res = await RegistrarDocumentosSeguridad(payload);
      if (res && res.status === 201) {
         alert('Documentos de seguridad registrados correctamente.');
         setLoadingAspiranteDetalle(false);
      } else {
         alert('Error al registrar documentos de seguridad.');
         setLoadingAspiranteDetalle(false);
      }
      setLoadingAspiranteDetalle(false);
      // Aquí puedes hacer el fetch/post a la API usando 'payload'
   };


   // field: id del documento, value: base64 o url
   const handleDocumentChange = (field, value, extra = {}) => {
      setFormData(prev => {
         let documentos = Array.isArray(prev.documentos) ? [...prev.documentos] : [];
         let documentosSeguridad = Array.isArray(prev.documentosSeguridad) ? [...prev.documentosSeguridad] : [];
         // Si ya existe, reemplaza; si no, agrega
         const idx = documentos.findIndex(d => String(d.IdTipoDocumentacion) === String(field));
         const idxSeg = documentosSeguridad.findIndex(d => String(d.IdTipoDocumentacion) === String(field));
         const newDoc = {
            IdTipoDocumentacion: field,
            DocumentoBase64: value,
            ...extra
         };
         if (idx !== -1) {
            documentos[idx] = { ...documentos[idx], ...newDoc };
         } else {
            documentos.push(newDoc);
         }
         // Si es un documento de seguridad, también actualizar documentosSeguridad
         const isSeguridad = documentosSeguridad.some(d => String(d.IdTipoDocumentacion) === String(field)) ||
            (typeof field !== 'undefined' && documentosSeguridad.length < 1 && documentosSeguridad !== undefined &&
              (Array.isArray(documentosSeguridad) || documentosSeguridad === undefined));
         if (documentosSeguridad && documentosSeguridad.length >= 0 &&
            (documentosSeguridad.some(d => String(d.IdTipoDocumentacion) === String(field)) ||
             documentosSeguridad.length === 0 || idxSeg === -1)) {
            if (idxSeg !== -1) {
               documentosSeguridad[idxSeg] = { ...documentosSeguridad[idxSeg], ...newDoc };
            } else {
               documentosSeguridad.push(newDoc);
            }
         }
         return {
            ...prev,
            documentos,
            documentosSeguridad
         };
      });
   };

   // field: id del documento, event: input event
   const handleFileUpload = (field, event) => {
      let file, docId;
      // Permitir ambos órdenes de argumentos por compatibilidad con UI
      if (typeof field === 'object' && event) {
         // llamado como (e, id)
         file = field.target.files[0];
         docId = event;
      } else {
         // llamado como (id, e)
         file = event.target.files[0];
         docId = field;
      }
      if (file && docId) {
         const reader = new FileReader();
         reader.onloadend = () => {
            handleDocumentChange(docId, reader.result, { Nombre: file.name });
         };
         reader.readAsDataURL(file);
      }
   };

   // Simple signature pad component using canvas
   const SignaturePad = ({ value, onChange }) => {
      const canvasRef = useRef(null);
      const drawing = useRef(false);

      useEffect(() => {
         const canvas = canvasRef.current;
         if (!canvas) return;
         const ctx = canvas.getContext('2d');
         ctx.lineWidth = 2;
         ctx.lineCap = 'round';
         // If there's an existing value (dataURL), draw it as image
         if (value) {
            const img = new Image();
            img.onload = () => {
               ctx.clearRect(0, 0, canvas.width, canvas.height);
               ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = value;
         }
      }, [value]);

      const getPos = (e) => {
         const rect = canvasRef.current.getBoundingClientRect();
         if (e.touches && e.touches[0]) {
            return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
         }
         return { x: e.clientX - rect.left, y: e.clientY - rect.top };
      };

      const start = (e) => {
         drawing.current = true;
         const pos = getPos(e);
         const ctx = canvasRef.current.getContext('2d');
         ctx.beginPath();
         ctx.moveTo(pos.x, pos.y);
         e.preventDefault();
      };

      const move = (e) => {
         if (!drawing.current) return;
         const pos = getPos(e);
         const ctx = canvasRef.current.getContext('2d');
         ctx.lineTo(pos.x, pos.y);
         ctx.stroke();
         e.preventDefault();
      };

      const end = (e) => {
         if (!drawing.current) return;
         drawing.current = false;
         e.preventDefault();
      };

      const clear = () => {
         const canvas = canvasRef.current;
         const ctx = canvas.getContext('2d');
         ctx.clearRect(0, 0, canvas.width, canvas.height);
         onChange('');
      };

      const save = () => {
         const dataUrl = canvasRef.current.toDataURL('image/png');
         onChange(dataUrl);
      };

      return (
         <div className="flex flex-col items-start gap-2">
            <canvas
               ref={canvasRef}
               width={380}
               height={120}
               className="border rounded-md touch-none"
               onMouseDown={start}
               onMouseMove={move}
               onMouseUp={end}
               onMouseLeave={end}
               onTouchStart={start}
               onTouchMove={move}
               onTouchEnd={end}
            />
            
         </div>
      );
   };

  // --- Dynamic List Handlers ---

  // Familiar
   const addFamiliar = () => {
      // Mapear las propiedades a las que espera el renderizado (mayúsculas)
      const familiar = {
         Nombre: newFamiliar.nombre || '',
         Parentesco: newFamiliar.parentesco || '',
         Edad: newFamiliar.edad || '',
         Ocupacion: newFamiliar.ocupacion || '',
         Telefono: newFamiliar.telefono || '',
         DependeEconomicamente: newFamiliar.depende || '',
         Observaciones: newFamiliar.observaciones || '',
         observaciones: { Observaciones: newFamiliar.observaciones || '' },
      };
      setFormData(prev => ({ ...prev, nucleoFamiliar: [...prev.nucleoFamiliar, familiar] }));
      setNewFamiliar({ parentesco: '', nombre: '', edad: '', ocupacion: '', telefono: '', depende: '', observaciones: formData?.observacionesNucleFamiliarEntrevista });
      setIsAddingFamiliar(false);
   };
  const removeFamiliar = (index) => {
    setFormData(prev => ({ ...prev, nucleoFamiliar: prev.nucleoFamiliar.filter((_, i) => i !== index) }));
  };

   const cancelarRefLaboral = async () => {
      setIndexValidacionExperiencia(null);
      setNombreContacto('');
      setIsAddingRefLab(false);
   };

   const addRefLaboral = async () => {
      if (selectedRefLabIdx === null || selectedRefLabIdx === undefined) {
         // No cerrar ni limpiar, solo salir
         return;
      }

      const refLab = (formData.referenciasLaborales || [])[selectedRefLabIdx] || {};
      let idExperienciaLaboral = null;
      if (Array.isArray(formData.experienciaLaboral) && formData.experienciaLaboral[selectedRefLabIdx]) {
        idExperienciaLaboral = formData.experienciaLaboral[selectedRefLabIdx].IdExperienciaLaboral || null;
      } else {
        idExperienciaLaboral = refLab.id || refLab.IdExperienciaLaboral || null;
      }
      // Si los campos son objetos de lista, extraer el texto, si no, enviar el valor tal cual
      const getTextValue = (val) => {
         if (!val) return '';
         if (typeof val === 'object' && val.label) return val.label;
         return val;
      };

      const payload = {
         IdExperienciaLaboral: idExperienciaLaboral,
         Concepto: concepto || '',
         DesempenoReportado: desempeñoReportado || '',
         MotivoRetiroReal: motivoRetiro || '',
         PersonaQueReferencia: personaQReferencia || '',
         CreadoEn: new Date().toISOString(),
         ActualizadoEn: new Date().toISOString(),
         Telefono: telefonoExperiencia || '',
         ReferenciadoPor: referenciadoPor || '',
         Eps: reEps || '',
         TiempoDuracion: tiempoDuracion || '',
         FechaExpedicionDocumentoIdentidad: fechaExpedicion || '',
         ComentariosDelReferenciado: comentariosReferenciador || '',
      };

    const response = await ValidarExperienciaLaboral(payload);
await ActualizarEstadoValidacionExperienciaLaboral(payload);

if (response && response.status === 201) {
  try {
    const idRegistroPersonal =
      formData?.IdRegistroPersonal ||
      aspirante?.id ||
      aspirante?.IdRegistroPersonal ||
      null;

    if (idRegistroPersonal) {
      const respPdf = await GenerarPdfConsolidadoReferencias(idRegistroPersonal);
      const dataPdf = await respPdf.json();

      if (dataPdf?.ok && dataPdf?.pdf_base64) {
        const payloadDocumento = {
          idRegistroPersonal: Number(idRegistroPersonal),
          documentos_seguridad: [
            {
              IdTipoDocumentacion: 68,
              DocumentoCargado: dataPdf.pdf_base64.startsWith('data:application/pdf;base64,')
                ? dataPdf.pdf_base64
                : `data:application/pdf;base64,${dataPdf.pdf_base64}`,
              Formato: 'application/pdf',
              Nombre: `Confirmacion_Referencias_${idRegistroPersonal}.pdf`,
            },
          ],
        };

        const responseUpload = await RegistrarDocumentosSeguridad(payloadDocumento);

        if (!responseUpload.ok) {
          const txt = await responseUpload.text();
          console.error('Error adjuntando consolidado de referencias:', txt);
        } else {
          const respDocsSeguridad = await getDocumentosSeguridad(idRegistroPersonal);
          const documentosSeguridadActualizados = respDocsSeguridad?.data || [];

          setFormData(prev => ({
            ...prev,
            documentosSeguridad: documentosSeguridadActualizados,
          }));
        }
      } else {
        console.warn('No se generó PDF consolidado de referencias:', dataPdf);
      }
    }
  } catch (error) {
    console.error('Error generando o adjuntando consolidado de referencias:', error);
  }

  setIsAddingRefLab(false);
  setNombreContacto('');
  setIndexValidacionExperiencia(null);
  alert('Referencia laboral validada correctamente.');
} else {
  setIsAddingRefLab(false);
  setNombreContacto('');
  setIndexValidacionExperiencia(null);
  alert('Error al validar la referencia laboral.');
}
      // No limpiar ni cerrar el modal ni los campos, para mantener los datos visibles
   };

   const ActualizarEstadoValidacionExperienciaLaboral = async (payload) => {
      const index = localStorage.getItem('IndexValidacionExperienciaLaboral');
      if(index === "1"){
         localStorage.setItem('estadoValidacionExperienciaLaboral_payload_1', JSON.stringify(payload));   
      } else {
         localStorage.setItem('estadoValidacionExperienciaLaboral_payload_2', JSON.stringify(payload));   
      }
      setconcepto(payload.Concepto);
      setDesempeñoReportado(payload.DesempenoReportado);
      setMotivoRetiro(payload.MotivoRetiroReal);
      setpersonaQReferencia(payload.PersonaQueReferencia);
      settelefonoExperiencia(payload.Telefono);
      setreferenciadoPor(payload.ReferenciadoPor);
      setreEps(payload.Eps);
      setTiempoDuracion(payload.TiempoDuracion);
      setFechaExpedicion(payload.FechaExpedicionDocumentoIdentidad);
      setComentariosReferenciador(payload.ComentariosDelReferenciado);
   }

  const addDatosSeleccion = async () => {
   // if (!validarAntesDeGuardar()) return;

   const estadoSeleccionado = String(formData?.estado || formData?.estadoProceso || '');

   const tieneCargoCompleto = !!formData?.asignacionCargo?.IdCargo;
   const tieneClienteCompleto = !!formData?.asignacionCargo?.IdCliente;
   const tieneSalarioCompleto =
      formData?.asignacionCargo?.Salario !== undefined &&
      formData?.asignacionCargo?.Salario !== null &&
      String(formData.asignacionCargo.Salario).trim() !== '';

   if (estadoSeleccionado === '24') {
      if (!tieneCargoCompleto || !tieneClienteCompleto || !tieneSalarioCompleto) {
         toast({
            title: 'No es posible avanzar a contratación',
            description: 'Para avanzar a contratación debe tener cargo, cliente y salario completos.',
            variant: 'destructive',
         });
         return;
      }
   }

   const payload = {
      IdRegistroPersonal: formData.IdRegistroPersonal || '',
      FechaProceso: formData.datosSeleccion?.FechaProceso || '',
      TipoCargo: formData.datosSeleccion?.TipoCargo || '',
      HaTrabajadoAntesEnLaEmpresa: formData.datosSeleccion?.HaTrabajadoAntesEnLaEmpresa === true,
      Arl: formData.datosSeleccion?.Arl || '',
      AntecedentesMedicos: formData.datosSeleccion?.AntecedentesMedicos || '',
      Medicamentos: formData.datosSeleccion?.Medicamentos || '',
      UsuarioActualizacion: localStorage.getItem('usuario') || 'sistema',
   };

      // Asegurar que IdGrupoSanguineo sea numérico
      let idGrupoSanguineo = formData?.IdGrupoSanguineo;
      if (typeof idGrupoSanguineo === 'string') {
        const found = GRUPOS_SANGUINEOS.find(g => g.value === idGrupoSanguineo);
        idGrupoSanguineo = found ? found.key : 2;
      }
      const payloadDatosSeleccion = {
         IdTipoIdentificacion: formData.IdTipoIdentificacion || '',
         NumeroIdentificacion: formData.cedula || '',
         FechaExpedicion: formData.fechaExpedicion || '',
         LugarExpedicion: formData.lugarExpedicion || '',
         Nombres: formData.nombres || '',
         Apellidos: formData.apellidos || '',
         FechaNacimiento: formData.fechaNacimiento || '',
         IdLugarNacimiento: formData.IdLugarNacimiento || '',
         Email: formData.email || '',
         Celular: formData.celular || '',
         DireccionDatosAdicionales: formData.direccion || '',
         IdGrupoSanguineo: idGrupoSanguineo || 2,
         AlturaMetros: formData.estatura || '',
         PesoKilogramos: formData.peso || '',
         IdTipoEps: formData?.IdTipoEps || 1, // Usar el nuevo método para obtener el ID de EPS
         IdFondoPensiones: formData?.IdFondoPensiones || 2,
      };

      // Mostrar el payload en consola para depuración
      
      const response = await DatosSeleccion(payload);
      const responseDatosSeleccion = await ActualizarDatosSeleccion(formData.IdRegistroPersonal, payloadDatosSeleccion);      
      if (response.ok == true || response.status === 200) {
         alert('Datos de selección guardados correctamente.');
      }
      else if (responseDatosSeleccion.ok == true || responseDatosSeleccion.status === 200) {
         alert('Datos de selección actualizados correctamente.');
      }
      else {
         alert('Error al guardar los datos de selección.');
      }

      setNewRefLaboral(EMPTY_REF_LAB_VALIDACION);
      setIsAddingRefLab(false);
      setSelectedRefLabIdx(null);
   };

     const ActualizarDatosFormacion = async () => {
      // if (!validarAntesDeGuardar()) return;

      const payload = {
         IdNivelEducativo: formData.IdNivelEducativo || 1,
         EstudiaActualmente: formData.estudiaActualmente || 'NO',
         DescripcionFormacionAcademica: formData.descripcionFormacionAcademica || '',
         IdTipoEstadoFormacion: formData.estadoFormacion.IdTipoEstadoFormacion || 1,
         UsuarioActualizacion: localStorage.getItem('usuario') || 'sistema',
      }

      const response = await ActualizarFormacionEducacion(formData.IdRegistroPersonal, payload);      
      if (response.ok == true || response.status === 200) {
         alert('Datos de formación guardados correctamente.');
      }
      else {
         alert('Error al guardar los datos de formación.');
      }

      setNewRefLaboral(EMPTY_REF_LAB_VALIDACION);
      setIsAddingRefLab(false);
      setSelectedRefLabIdx(null);
   };
   
  const removeRefLaboral = (index) => {
    setFormData(prev => ({ ...prev, referenciasLaborales: prev.referenciasLaborales.filter((_, i) => i !== index) }));
  };

  // Referencia Personal
  const addRefPersonal = async () => {
      if (selectedRefPersIdx === null || selectedRefPersIdx === undefined) {
         setIsAddingRefPers(false);
         return;
      }

      // Armar el payload solicitado
      const aspirante_id = aspirante?.id || null;
      const ref_idx = selectedRefPersIdx;
      const validado = true;
      const validado_por = 0; // Ajusta según corresponda
      const payload = {
         IdReferencia: formData.referencias[0].IdReferencia,
         HaceCuantoLoConoce: formData.referenciaPersonalValidacion.HaceCuantoLoConoce || '',
         Descripcion: formData.referenciaPersonalValidacion.Descripcion || '',
         LugarVivienda: formData.referenciaPersonalValidacion.LugarVivienda || '',
         TieneHijos: formData.referenciaPersonalValidacion.TieneHijos === '1' ? true : false,
         Observaciones: formData.referenciaPersonalValidacion.ObservacionesReferenciador || '',
         IdRegistroPersonal: formData.idRegistroPersonal || '',
      };

      const referenciaPayload = {
         aspirante_id,
         ref_idx,
         validado,
         payload,
         validado_por,
      };

      // Mostrar el payload en consola para depuración
      console.log('Payload referencia personal a enviar:', referenciaPayload);

      setFormData(prev => {
         const next = [...(prev.referenciasPersonales || [])];
         const current = next[selectedRefPersIdx] || {};
         next[selectedRefPersIdx] = {
            ...current,
            validacion: { ...newRefPersonal },
            validado: true,
            fechaValidacion: new Date().toISOString().split('T')[0],
         };
         return { ...prev, referenciasPersonales: next };
      });

      setNewRefPersonal(EMPTY_REF_PERS_VALIDACION);
      setIsAddingRefPers(false);
      setSelectedRefPersIdx(null);
      const response = await ValidarReferenciaPersonal(payload);
      if (response.statusText == "OK" || response.status === 201) {
         alert('Referencia personal validada correctamente.');
      }else {
         alert('Error al validar la referencia personal.');
      }
   };
  const removeRefPersonal = (index) => {
    setFormData(prev => ({ ...prev, referenciasPersonales: prev.referenciasPersonales.filter((_, i) => i !== index) }));
  };

  // --- Entrevista Handlers ---
  const handleAddEntrevista = () => {
    setSelectedEntrevista(null);
    setEntrevistaModalOpen(true);
  };

  const handleEditEntrevista = (entrevista, index) => {
    setSelectedEntrevista({ ...entrevista, _index: index });
    setEntrevistaModalOpen(true);
  };

 const handleSaveEntrevista = async (entrevistaData) => {
  try {
    let documentosSeguridadActualizados = [];

    if (aspirante?.id) {
      const respDocsSeguridad = await getDocumentosSeguridad(aspirante.id);
      documentosSeguridadActualizados = respDocsSeguridad?.data || [];
    }

    setFormData(prev => {
      let newEntrevistas = [...(prev.entrevistas || [])];

      if (selectedEntrevista && selectedEntrevista._index !== undefined) {
        newEntrevistas[selectedEntrevista._index] = entrevistaData;
      } else {
        newEntrevistas.push(entrevistaData);
      }

      return {
        ...prev,
        entrevistas: newEntrevistas,
        entrevista: [entrevistaData],
        documentosSeguridad: documentosSeguridadActualizados,
      };
    });

    setEntrevistaModalOpen(false);
  } catch (error) {
    console.error('Error recargando documentos de seguridad después de guardar entrevista:', error);

    setFormData(prev => {
      let newEntrevistas = [...(prev.entrevistas || [])];

      if (selectedEntrevista && selectedEntrevista._index !== undefined) {
        newEntrevistas[selectedEntrevista._index] = entrevistaData;
      } else {
        newEntrevistas.push(entrevistaData);
      }

      return {
        ...prev,
        entrevistas: newEntrevistas,
        entrevista: [entrevistaData],
      };
    });

    setEntrevistaModalOpen(false);
  }
};

  const handleRemoveEntrevista = (index) => {
    setFormData(prev => ({ ...prev, entrevistas: prev.entrevistas.filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    try {
       if (!validarAntesDeGuardar()) return;
      // 1) Guardar primero los 5 campos (Selección) en el backend
      if (aspirante?.id) {
        setSavingDatosProceso(true);

        const tipoCargoRaw = formData?.seleccion?.tipoCargo;
        const tipoCargoStr = (tipoCargoRaw ?? '').toString().trim();
        const idTipoCargo = /^\d+$/.test(tipoCargoStr) ? Number(tipoCargoStr) : null;

        const payload = {
          // ✅ Ajustado a tu estructura actual (backend espera: date + bool)
          fecha_proceso: toDateOnly(formData?.seleccion?.fechaProceso),
          id_tipo_cargo: idTipoCargo,
          tipo_cargo: tipoCargoRaw || null, // se deja por compatibilidad si ya lo usan como texto en tu back
          tipo_integro: formData?.seleccion?.tipoIntegro || null,
          ha_trabajado_antes_empresa: siNoToBool(formData?.seleccion?.haTrabajadoAntesEmpresa) ?? false,
          antecedentes_medicos: (formData?.AntecedentesMedicos || '').trim() || null,
          medicamentos: (formData?.medicamentos || '').trim() || null,
          validacion_reintegro: {
            cumpleTiempo: !!formData?.seleccion?.validacionReintegro?.cumpleTiempo,
            procesosDisciplinarios: !!formData?.seleccion?.validacionReintegro?.procesosDisciplinarios,
            aprobadoOperaciones: !!formData?.seleccion?.validacionReintegro?.aprobadoOperaciones,
          },
        };

       await axios.put(
         `${API_BASE}/datos-proceso-aspirante/${aspirante.id}`,
         payload,
         { headers: { ...authHeaders } }
         );

      }

      await fetchDatosProceso(); // ✅ vuelve a consultar y actualiza el estado

      // 2) Mantener tu lógica existente
       await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error guardando /api/datos-proceso-aspirante:', error);
      // Si falla, NO cerramos el modal para que puedas corregir y volver a guardar
    } finally {
      setSavingDatosProceso(false);
    }
  };

  const descargarDocumento = (doc) => {
   if (!doc?.DocumentoBase64) return;
      let prefix = '';
      if (doc.Formato === 'image/png') {
         prefix = doc && doc.Formato === 'image/png'
      ? 'data:image/png;base64,'
      : '';
      } else if (doc.Formato === 'application/pdf') {
         prefix = doc && doc.Formato === 'application/pdf'
         ? 'data:application/pdf;base64,'
         : '';
      }

      const link = document.createElement('a');
      link.href = `${prefix}${doc.DocumentoBase64}`;
      link.download = doc.Nombre || 'documento';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
   };

  const handelObservacionesExperienciaLaboral = async () => {
  setSavingDatosProceso(true);

  try {
    setLoadingAspiranteDetalle(true);

    // ✅ validar idx seleccionado
    if (selectedRefLabIdx === null || selectedRefLabIdx === undefined) {
      toast({
        title: 'Observaciones experiencia laboral',
        description: 'No hay experiencia seleccionada.',
        variant: 'destructive',
      });
      return;
    }

    // ✅ sacar el registro correcto según la fila abierta
    const exp = formData?.experienciaLaboral?.[selectedRefLabIdx];
    const idExp = exp?.IdExperienciaLaboral || exp?.id || null;

    if (!idExp) {
      toast({
        title: 'Observaciones experiencia laboral',
        description: 'No se encontró IdExperienciaLaboral del registro.',
        variant: 'destructive',
      });
      return;
    }

    const obs = (obsRefLabText ?? '').trim();
    if (!obs) {
      toast({
        title: 'Observaciones experiencia laboral',
        description: 'Escribe una observación antes de guardar.',
        variant: 'destructive',
      });
      return;
    }

    // ✅ ojo: a veces el backend espera "observaciones" en minúscula
    // Te dejo ambas (la que no use la ignora, pero no falla)
    const payload = {
      Observaciones: obs,
      observaciones: obs,
      UsuarioActualizacion: localStorage.getItem('usuario') || 'sistema',
      usuarioActualizacion: localStorage.getItem('usuario') || 'sistema',
    };

    const response = await ObservacionesExperienciaLaboral(payload, idExp);

    if (response?.ok || response?.status === 200 || response?.status === 201) {
      // ✅ actualizar el estado local para que al cerrar y abrir quede visible
      setFormData((prev) => {
        const list = Array.isArray(prev?.experienciaLaboral) ? [...prev.experienciaLaboral] : [];
        if (!list[selectedRefLabIdx]) return prev;

        list[selectedRefLabIdx] = {
          ...list[selectedRefLabIdx],
          observacionesInternas: obs,
          ObservacionesInternas: obs,
          Observaciones: obs,
          observaciones: obs,
        };

        return { ...prev, experienciaLaboral: list };
      });

      toast({
        title: 'Observaciones experiencia laboral',
        description: 'Guardadas con éxito.',
        variant: 'success',
      });

      // ✅ si tú quieres cerrar el modal de obs al guardar:
      setObsRefLabOpen(false);
    } else {
      const txt = response?.text ? await response.text() : '';
      console.error('Error guardando obs exp laboral:', response?.status, txt);

      toast({
        title: 'Observaciones experiencia laboral',
        description: 'No fue posible guardar. Revisa consola (Network).',
        variant: 'destructive',
      });
    }
  } catch (error) {
    console.error(error);
    toast({
      title: 'Observaciones experiencia laboral',
      description: 'Error inesperado al guardar.',
      variant: 'destructive',
    });
  } finally {
    setSavingDatosProceso(false);
    setLoadingAspiranteDetalle(false);
  }
};

  if (!formData) return null;

  const getFondoLabelFromAny = (raw) => {
  if (raw == null) return "";

  const s = String(raw).trim();

  // Si ya viene exactamente como texto, lo devolvemos
  const existsByLabel = FONDOS_PENSIONES.some(f => f.value === s);
  if (existsByLabel) return s;

  // Si viene como ID ("1","2","4"), lo convertimos a texto
  const byKey = FONDOS_PENSIONES.find(f => String(f.key) === s);
  if (byKey) return byKey.value;

  // Si viene en otro formato raro (ej: "PORVENIR"), intenta match simple
  const upper = s.toUpperCase();
  const approx = FONDOS_PENSIONES.find(f => f.value.toUpperCase() === upper);
  return approx ? approx.value : "";
};


   const getNivelEducativoLabel = (raw) => {
   if (raw == null) return "";

   const s = String(raw).trim();

   // si viene como id
   if (/^\d+$/.test(s)) {
      const found = NIVELES_EDUCATIVOS.find(n => String(n.key) === s);
      return found ? found.value : "";
   }

   // si viene como texto
   const exact = NIVELES_EDUCATIVOS.find(n => n.value === s);
   if (exact) return exact.value;

   const approx = NIVELES_EDUCATIVOS.find(n => n.value.toUpperCase() === s.toUpperCase());
   return approx ? approx.value : s; // no lo borra si no coincide
   };

   const getNivelEducativoIdFromLabel = (label) => {
   const found = NIVELES_EDUCATIVOS.find(n => n.value === label);
   return found ? found.key : "";
   };


  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden bg-gray-50">
        <DialogHeader className="px-6 py-4 bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center justify-between">
             <div>
                <DialogTitle className="text-xl font-bold text-gray-800">Detalle del Candidato</DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                   Gestiona la información completa de {formData.nombres} {formData.apellidos}
                </DialogDescription>
             </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex">
           <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="flex-1 flex h-full">
              {/* Sidebar Navigation for Tabs */}
              <div className="w-64 bg-white border-r border-gray-200 h-full overflow-y-auto shrink-0 py-2">
                 <TabsList className="flex flex-col h-auto w-full bg-transparent space-y-1 p-2">
                    {[
                       { id: 'personal', label: 'Datos Personales', icon: User },
                       { id: 'familiar', label: 'Núcleo Familiar', icon: Users },
                       { id: 'formacion', label: 'Formación', icon: GraduationCap },
                       { id: 'referencias', label: 'Referencias', icon: Users },
                       { id: 'contacto', label: 'Contacto Emergencia', icon: Phone },
                       { id: 'documentos', label: 'Documentos', icon: FileText },
                       { id: 'entrevista', label: 'Entrevista', icon: User }
                     //   { id: 'seguimiento de instrucciones', label: 'Seguimiento de Instrucciones', icon: CheckSquare },

                    ].map(tab => (
                       <TabsTrigger 
                          key={tab.id} 
                          value={tab.id} 
                          className="w-full justify-start px-3 py-2.5 text-sm font-medium text-gray-600 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:border-r-4 data-[state=active]:border-emerald-600 rounded-none transition-all"
                       >
                          <tab.icon className="w-4 h-4 mr-3" />
                          {tab.label}
                       </TabsTrigger>
                    ))}
                 </TabsList>
              </div>

              {/* Content Area */}
              <ScrollArea className="flex-1 h-full bg-gray-50/50">
                 <div className="p-6 max-w-4xl mx-auto pb-20">
                    {/* 2. Datos Personales */}
                    <TabsContent value="personal" className="mt-0 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                           <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">Datos Personales</h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Identificación y Registro */}
                              <div className="space-y-2">
                                 <Label>Tipo de identificación</Label>
                                 <Input value={formData?.DescripcionTipoIdentificacion ? String(formData.DescripcionTipoIdentificacion) : ''} className="bg-gray-50" />
                              </div>
                              <div className="space-y-2">
                                 <Label>Número de identificación</Label>
                                 <Input value={formData.seleccion.identificacion} onChange={(e) => handleInputChange('seleccion', 'identificacion', e.target.value)} className="bg-gray-50" />
                              </div>
                              <div className="space-y-2">
                                 <Label>Fecha de expedición</Label>
                                 <Input
                                 type="date" value={formData?.seleccion?.fechaExpedicion || ''} onChange={(e) => handleInputChange('seleccion', 'fechaExpedicion', e.target.value)}
                                 />
                              </div>
                              <div className="space-y-2">
                                 <Label>Lugar de expedición</Label>
                                 <Input value={formData?.lugarExpedicion || ''} onChange={(e) => handleInputChange('root', 'lugarExpedicion', e.target.value)} />
                              </div>
													
                              {/* ✅ Bloque oculto que sale SOLO si responde SI */}
                              {formData.seleccion.haTrabajadoAntesEmpresa === 'SI' && (
                                <div className="space-y-2 md:col-span-2 border border-emerald-200 bg-emerald-50/40 rounded-xl p-4">
                                  <Label className="text-sm font-semibold text-emerald-800 mb-3 block">
                                    Validación previa (Reintegro)
                                  </Label>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <label className="flex items-start gap-2 cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        className="mt-1"
                                        checked={!!formData?.seleccion?.validacionReintegro?.cumpleTiempo}
                                        onChange={(e) => {
                                          const next = {
                                            ...(formData.seleccion.validacionReintegro || {}),
                                            cumpleTiempo: e.target.checked
                                          };
                                          handleInputChange('seleccion', 'validacionReintegro', next);
                                        }}
                                      />
                                      <span className="text-sm text-gray-700">Cumple con el tiempo</span>
                                    </label>

                                    <label className="flex items-start gap-2 cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        className="mt-1"
                                        checked={!!formData?.seleccion?.validacionReintegro?.procesosDisciplinarios}
                                        onChange={(e) => {
                                          const next = {
                                            ...(formData.seleccion.validacionReintegro || {}),
                                            procesosDisciplinarios: e.target.checked
                                          };
                                          handleInputChange('seleccion', 'validacionReintegro', next);
                                        }}
                                      />
                                      <span className="text-sm text-gray-700">Procesos disciplinarios</span>
                                    </label>

                                    <label className="flex items-start gap-2 cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        className="mt-1"
                                        checked={!!formData?.seleccion?.validacionReintegro?.aprobadoOperaciones}
                                        onChange={(e) => {
                                          const next = {
                                            ...(formData.seleccion.validacionReintegro || {}),
                                            aprobadoOperaciones: e.target.checked
                                          };
                                          handleInputChange('seleccion', 'validacionReintegro', next);
                                        }}
                                      />
                                      <span className="text-sm text-gray-700">Aprobado por operaciones</span>
                                    </label>
                                  </div>
                                </div>
                              )}

                              {/* Datos personales */}
                              <div className="space-y-2">
                                 <Label>Nombres</Label>
                                 <Input value={formData.nombres || ''} onChange={(e) => handleInputChange('root', 'nombres', e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                 <Label>Apellidos</Label>
                                 <Input value={formData.apellidos || ''} onChange={(e) => handleInputChange('root', 'apellidos', e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                 <Label>Fecha de nacimiento</Label>
                                 <Input type="date" value={formData.fechaNacimiento || ''} onChange={(e) => handleInputChange('root', 'fechaNacimiento', e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                 <Label>Lugar de Nacimiento *</Label>
                                 <Select
                                 value={formData.IdLugarNacimiento !== undefined && formData.IdLugarNacimiento !== null && formData.IdLugarNacimiento !== '' ? String(formData.IdLugarNacimiento) : ''}
                                 // onValueChange={v => setFormData(prev => ({ ...prev, IdLugarNacimiento: Number(v) }))}
                                 onValueChange={(value) => handleInputChange('root', 'IdLugarNacimiento', value)}
                                 >
                                 <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                 </SelectTrigger>
                                 <SelectContent className="max-h-60 overflow-y-auto">
                                    {lugarNacimiento.length > 0
                                       ? lugarNacimiento.map((item) => (
                                          <SelectItem key={item.IdLugarNacimiento} value={String(item.IdLugarNacimiento)}>
                                             {item.Nombre}
                                          </SelectItem>
                                       ))
                                       : <div className="px-3 py-2 text-sm text-gray-500">Sin opciones</div>
                                    }
                                 </SelectContent>
                                 </Select>
                              </div>
                              {/* Información de contacto */}
                              <div className="space-y-2">
                                 <Label>Correo electrónico</Label>
                                 <Input value={formData.email || ''} onChange={(e) => handleInputChange('root', 'email', e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                 <Label>Teléfono</Label>
                                 <Input value={formData.telefono || ''} onChange={(e) => handleInputChange('root', 'telefono', e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                 <Label>Dirección</Label>
                                 <Input value={formData.direccion || ''} onChange={(e) => handleInputChange('root', 'direccion', e.target.value)} />
                              </div>
                              {/* Datos físicos y salud */}
                              <div className="space-y-2">
                                 <Label>Estatura (cm)</Label>
                                 <Input value={formData.estatura} onChange={(e) => handleInputChange('root', 'estatura', e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                 <Label>Peso (kg)</Label>
                                 <Input value={formData.peso} onChange={(e) => handleInputChange('root', 'peso', e.target.value)} />
                              </div>
                              <div className="space-y-2">
                              <Label>Grupo sanguíneo</Label>

                              <Select
                                 value={formData.IdGrupoSanguineo || 1}
                                 onValueChange={(value) => handleInputChange('root', 'IdGrupoSanguineo', Number(value))}
                              >
                                 <SelectTrigger>
                                    <SelectValue placeholder="Selecciona grupo sanguíneo" />
                                 </SelectTrigger>

                                 <SelectContent>
                                    {GRUPOS_SANGUINEOS.map((g) => (
                                    <SelectItem key={g.key} value={g.key}>
                                       {g.value}
                                    </SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                              </div>

                              <div className="space-y-2">
                                <div className="space-y-2">
                                 <Label>EPS</Label>
                                 <Select
                                    value={formData.IdTipoEps ||1}
                                    onValueChange={(value) => handleInputChange('root', 'IdTipoEps', Number(value))}
                                 >
                                    <SelectTrigger>
                                       <SelectValue placeholder="Seleccione una EPS" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-72 overflow-y-auto z-50">
                                       {EPS.map((e) => (
                                          <SelectItem key={e.key} value={e.key}>
                                             {e.value}
                                          </SelectItem>
                                       ))}
                                    </SelectContent>
                                 </Select>
                              </div>
                              </div>
                            <div className="space-y-2">
                              <Label>Fondo de pensiones</Label>

                              <Select
                                 value={formData.IdFondoPensiones?.toString() || ''}
                                 onValueChange={v => setFormData(prev => ({ ...prev, IdFondoPensiones: v }))}
                              >
                                 <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar Fondo de Pensiones" />
                                 </SelectTrigger>
                                 <SelectContent className="max-h-60 overflow-y-auto z-50 pointer-events-auto overscroll-contain"
                                    onWheelCapture={e => e.stopPropagation()}
                                    onTouchMoveCapture={e => e.stopPropagation()}>
                                    {FONDOS_PENSIONES.map((f) => (
                                      <SelectItem key={f.key} value={f.key.toString()}>
                                        {f.value}
                                      </SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                              </div>
                              <div className="space-y-2">
                                 <Label>Antecedentes Médicos</Label>
                                 <Input value={formData.datosSeleccion?.AntecedentesMedicos || ''} onChange={(e) => handleInputChange('datosSeleccion', 'AntecedentesMedicos', e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                 <Label>Medicamentos</Label>
                                 <Input value={formData.datosSeleccion?.Medicamentos || ''} onChange={(e) => handleInputChange('datosSeleccion', 'Medicamentos', e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                 <Label>Fecha de proceso</Label>
                                 <Input type="date" value={formData.datosSeleccion?.FechaProceso || ''} onChange={(e) => handleInputChange('datosSeleccion', 'FechaProceso', e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                 <Label>Tipo de cargo</Label>
                                 <Select value={formData.datosSeleccion?.TipoCargo || ''} onValueChange={(v) => handleInputChange('datosSeleccion', 'TipoCargo', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                       <SelectItem value="5">Administrativo</SelectItem>
                                    <SelectItem value="6">Operativo</SelectItem> 
                                    </SelectContent>  
                                 </Select>
                              </div>
                              {/* Select de Asignación cargo y cliente solo si hay cargo asignado */}
                              {Number(formData?.asignacionCargo?.idCargo) > 0 && (
                                 <div className="space-y-2">
                                    <Label>Asignación cargo y cliente</Label>
                                    <Select
                                       value={formData.asignacionCargo?.idCargo ? String(formData.asignacionCargo.idCargo) : ''}
                                       onValueChange={v => {
                                          setFormData(prev => ({
                                             ...prev,
                                             asignacionCargo: {
                                                ...prev.asignacionCargo,
                                                idCargo: v
                                             }
                                          }));
                                       }}
                                    >
                                       <SelectTrigger><SelectValue placeholder="Seleccione un cargo" /></SelectTrigger>
                                       <SelectContent>
                                          {listaCargo.map(cargo => (
                                             <SelectItem key={cargo.id} value={String(cargo.id)}>{cargo.name}</SelectItem>
                                          ))}
                                       </SelectContent>
                                    </Select>
                                    {/* Aquí podrías agregar un select de cliente si lo necesitas */}
                                 </div>
                              )}
                              {/* ✅✅✅ (ÚNICO CAMBIO EN EL FORMULARIO) */}
                              <div className="space-y-2">
                                 <Label>¿Ha trabajado antes en la empresa?</Label>
                                    <Select 
                                 value={formData.datosSeleccion?.HaTrabajadoAntesEnLaEmpresa === true ? 'SI' : 'NO'} 
                                 onValueChange={(v) => {
                                 handleInputChange('datosSeleccion', 'HaTrabajadoAntesEnLaEmpresa', v === 'SI'); // ✅ guarda true/false
                                 if (v === 'NO') {
                                    handleInputChange('seleccion', 'validacionReintegro', {
                                       cumpleTiempo: false,
                                       procesosDisciplinarios: false,
                                       aprobadoOperaciones: false
                                    });
                                 }
                                 }}
                                    >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                       <SelectItem value="SI">SI</SelectItem>
                                       <SelectItem value="NO">NO</SelectItem>
                                    </SelectContent>
                                 </Select>
                              </div>
                           </div>
                        </div>
                        <Button
                           type="button"
                           variant="outline"
                           onClick={() => {
                              addDatosSeleccion()
                           }}
                        >Actualizar registro</Button>
                    </TabsContent>

                    {/* 3. Núcleo Familiar */}
                    <TabsContent value="familiar" className="mt-0 space-y-6">
                       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                          <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">Núcleo Familiar</h3>
                          {/* <div className="flex justify-between items-center mb-4">
                             <Button size="sm" variant="outline" onClick={() => setIsAddingFamiliar(true)}><Plus className="w-4 h-4 mr-2"/> Agregar Familiar</Button>
                          </div> */}
                          {isAddingFamiliar && (
                             <div className="bg-gray-50 p-3 rounded-lg mb-4 border border-emerald-200">
                                <div className="grid grid-cols-1 md:grid-cols-7 gap-2 mb-3">
                                   <Input placeholder="Nombre" value={newFamiliar.nombre} onChange={(e) => setNewFamiliar({...newFamiliar, nombre: e.target.value})} />
                                   <Input placeholder="Parentesco" value={newFamiliar.parentesco} onChange={(e) => setNewFamiliar({...newFamiliar, parentesco: e.target.value})} />
                                   <Input placeholder="Edad" value={newFamiliar.edad} onChange={(e) => setNewFamiliar({...newFamiliar, edad: e.target.value})} />
                                   <Select value={newFamiliar.ocupacion} onValueChange={(v) => setNewFamiliar({...newFamiliar, ocupacion: v})}>
                                      <SelectTrigger><SelectValue placeholder="Ocupación" /></SelectTrigger>
                                      <SelectContent>
                                         <SelectItem value="Empleado">Empleado</SelectItem>
                                         <SelectItem value="Independiente">Independiente</SelectItem>
                                         <SelectItem value="Estudiante">Estudiante</SelectItem>
                                         <SelectItem value="Desempleado">Desempleado</SelectItem>
                                         <SelectItem value="Otro">Otro</SelectItem>
                                      </SelectContent>
                                   </Select>
                                   <Input placeholder="Teléfono" value={newFamiliar.telefono || ''} onChange={(e) => setNewFamiliar({...newFamiliar, telefono: e.target.value})} />
                                   <Select value={newFamiliar.depende || ''} onValueChange={(v) => setNewFamiliar({...newFamiliar, depende: v})}>
                                      <SelectTrigger><SelectValue placeholder="¿Depende del aspirante?" /></SelectTrigger>
                                      <SelectContent>
                                         <SelectItem value="SI">SI</SelectItem>
                                         <SelectItem value="NO">NO</SelectItem>
                                      </SelectContent>
                                   </Select>
                                  
                                </div>
                                <div className="flex justify-end gap-2">
                                   <Button size="sm" variant="ghost" onClick={() => setIsAddingFamiliar(false)}>Cancelar</Button>
                                   <Button size="sm" onClick={addFamiliar}>Guardar Familiar</Button>
                                </div>
                             </div>
                          )}

                          
                          <div className="overflow-x-auto">
                            <table className="min-w-[400px] w-full border border-gray-200 rounded-lg table-auto">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Nombre</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Parentesco</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Edad</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Ocupación</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Teléfono</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Depende económicamente</th>
                                  {/* <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Acciones</th> */}
                                </tr>
                              </thead>
                              <tbody>
                                {formData.nucleoFamiliar.length === 0 && (
                                  <tr>
                                   <td colSpan={6} className="text-center text-sm text-gray-500 italic py-4">No hay familiares registrados.</td>
                                  </tr>
                                )}
                                {formData.nucleoFamiliar.map((fam, idx) => (
                                  <tr key={idx} className="border-t">
                                    <td className="px-3 py-2 text-sm">{fam.Nombre}</td>
                                    <td className="px-3 py-2 text-sm">{fam.Parentesco}</td>
                                    <td className="px-3 py-2 text-sm">{fam.Edad}</td>
                                    <td className="px-3 py-2 text-sm">{fam.Ocupacion}</td>
                                    <td className="px-3 py-2 text-sm">{fam.Telefono}</td>
                                    <td className="px-3 py-2 text-sm">{fam.DependeEconomicamente == null ? 'No' : fam.DependeEconomicamente}</td>

                                    <td className="px-3 py-2 text-sm align-top">
                                    <div className="min-w-[120px] flex flex-col gap-1">
                                       <textarea
                                          className="w-full min-h-[28px] resize-y rounded border border-gray-200 bg-white px-1 py-1 text-xs text-gray-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100"
                                          placeholder="Observaciones..."
                                          value={fam.Observaciones ?? fam.observaciones?.Observaciones ?? ""}
                                          onChange={(e) => {
                                             const value = e.target.value;
                                             setFormData((prev) => {
                                                const list = Array.isArray(prev?.nucleoFamiliar) ? [...prev.nucleoFamiliar] : [];
                                                if (!list[idx]) return prev;
                                                // Preserve other fields, update Observaciones
                                                list[idx] = {
                                                   ...list[idx],
                                                   Observaciones: value,
                                                   observaciones: {
                                                      ...list[idx].observaciones,
                                                      Observaciones: value,
                                                   },
                                                };
                                                return { ...prev, nucleoFamiliar: list };
                                             });
                                          }}
                                       />
                                       <button
                                          type="button"
                                          className="inline-flex items-center justify-center rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                                          onClick={async () => {
                                    try {
                                    const token = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
                                    const idNucleoFamiliar = fam.IdNucleoFamiliar;
                                    const observaciones = (fam.Observaciones ?? "").trim();
                                    if (!idNucleoFamiliar) {
                                       alert("No se encontró IdNucleoFamiliar.");
                                       return;
                                    }
                                    const res = await fetch(
                                       `http://localhost:8000/api/observaciones-nucleo-familiar/${idNucleoFamiliar}`,
                                       {
                                          method: "PUT",
                                          headers: {
                                          "Content-Type": "application/json",
                                          ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                          },
                                          body: JSON.stringify({
                                          observaciones: observaciones,
                                          usuarioActualizacion: "juan",
                                          }),
                                       }
                                    );
                                    if (!res.ok) {
                                       const txt = await res.text();
                                       console.error("Error API:", res.status, txt);
                                       alert("Error guardando observación.");
                                       return;
                                    }
                                    alert("Observación guardada.");
                                    } catch (err) {
                                    console.error(err);
                                    alert("Error guardando observación.");
                                    }
                                    }}
                                    >
                                          Guardar
                                       </button>
                                    </div>
                                    </td>

                                    {/* <td className="px-3 py-2 text-sm">
                                      <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-600 shrink-0" onClick={() => removeFamiliar(idx)}>
                                        <Trash2 className="w-3 h-3"/>
                                      </Button>
                                    </td> */}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        <div className="mt-6 border-t pt-4">
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                           Observaciones generales del núcleo familiar
                        </Label>

                        <Textarea
                           className="min-h-[120px] resize-y"
                           placeholder="Escribe aquí las observaciones generales del núcleo familiar..."
                           value={formData?.observacionesNucleFamiliarEntrevista || ""}
                           onChange={(e) =>
                              setFormData((prev) => ({
                              ...prev,
                              observacionesNucleFamiliarEntrevista: e.target.value,
                              }))
                           }
                        />

                        <div className="flex justify-end mt-3">
                           <Button
                              type="button"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={async () => {
                              try {
                                 const token =
                                    localStorage.getItem("access_token") ||
                                    localStorage.getItem("token") ||
                                    "";

                                 const idNucleoFamiliar = formData?.nucleoFamiliar?.[0]?.IdNucleoFamiliar;
                                 const observaciones = (formData?.observacionesNucleFamiliarEntrevista || "").trim();

                                 const observacionOriginalLimpia = (observacionNucleoOriginal || "").trim();
                                 const seIntentoBorrarUnaObservacionExistente =
                                    !!observacionOriginalLimpia && !observaciones;

                                 if (!idNucleoFamiliar) {
                                    alert("No se encontró un registro de núcleo familiar para guardar la observación.");
                                    return;
                                 }

                                 if (seIntentoBorrarUnaObservacionExistente) {
                                    alert("La observación general del núcleo familiar no puede quedar vacía. Si deseas cambiarla, escribe una nueva observación.");
                                    return;
                                 }

                                 const res = await fetch(
                                    `${API_BASE}/observaciones-nucleo-familiar/${idNucleoFamiliar}`,
                                    {
                                    method: "PUT",
                                    headers: {
                                       "Content-Type": "application/json",
                                       ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                    },
                                   body: JSON.stringify({
                                    observaciones: observaciones,
                                    usuarioActualizacion: localStorage.getItem("usuario") || "sistema",
                                    }),
                                    }
                                 );

                                 if (!res.ok) {
                                    throw new Error("No fue posible guardar la observación");
                                 }

                                 setObservacionNucleoOriginal(observaciones);
                                 alert("Observación guardada correctamente.");
                              } catch (error) {
                                 console.error("Error guardando observación:", error);
                                 alert("Error guardando observación.");
                              }
                              }}
                           >
                              Guardar observaciones
                           </Button>
                        </div>
                        </div>

                       </div>
                    </TabsContent>

                    {/* 4. Formación */}
                    <TabsContent value="formacion" className="mt-0 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                           <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">Formación y Educación</h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                               <div className="space-y-2">
                                 <Label>Nivel académico</Label>
                                 <Select
                                    value={getNivelEducativoLabel(formData.IdNivelEducativo) || ""}
                                    onValueChange={(label) => {
                                       const id = getNivelEducativoIdFromLabel(label);
                                       setFormData(prev => ({
                                          ...prev,
                                          IdNivelEducativo: id,
                                          nivelAcademico: label, // opcional
                                       }));
                                    }}
                                    >
                                    <SelectTrigger>
                                       <SelectValue placeholder="Seleccionar nivel académico" />
                                    </SelectTrigger>

                                    <SelectContent
                                       className="max-h-60 overflow-y-auto z-50 pointer-events-auto overscroll-contain"
                                       onWheelCapture={(e) => e.stopPropagation()}
                                       onTouchMoveCapture={(e) => e.stopPropagation()}
                                    >
                                       {NIVELES_EDUCATIVOS.map((n) => (
                                       <SelectItem key={n.key} value={n.value}>
                                          {n.value}
                                       </SelectItem>
                                       ))}
                                    </SelectContent>
                                 </Select>
                                 </div>
                              </div>

                              <div className="space-y-2">
                                 <Label>Estudia actualmente</Label>
                                 <Select value={formData.estudiaActualmente || ''} onValueChange={v => handleInputChange('root', 'estudiaActualmente', v)}>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                    <SelectContent>
                                       <SelectItem value="No">No</SelectItem>
                                       <SelectItem value="Si-Presencial">Sí, presencial</SelectItem>
                                       <SelectItem value="Si-Virtual">Sí, virtual</SelectItem>
                                    </SelectContent>
                                 </Select>
                              </div>
                             
                              <div className="space-y-2 md:col-span-2">
                                 <Label>Descripción formación / especialidad</Label>
                                 <Textarea
                                    value={formData.descripcionFormacionAcademica || ''}
                                    onChange={e => {
                                      handleInputChange('root', 'descripcionFormacionAcademica', e.target.value); 
                                    }}
                                    placeholder="Ejemplo: Ingeniería de Sistemas, Especialidad en Seguridad Informática"
                                 />
                              </div>
                              <div className="space-y-2" style={{ width: '100px !important' }}>
                                 <Label>Estado formación</Label>
                                 <div className="flex gap-2">
                                    {ESTADOS_FORMACION.map((estado) => (
                                       <Button
                                          key={estado.key}
                                          type="button"
                                          variant={
                                             String(formData?.IdTipoEstadoFormacion) === String(estado.key)
                                                ? "default"
                                                : "outline"
                                          }
                                          onClick={() => handleInputChange("root", "IdTipoEstadoFormacion", estado.key)}
                                          style={estado.value === 'En curso' ? { minWidth: 120 } : {}}
                                       >
                                          {estado.value}
                                       </Button>
                                    ))}
                                 </div>
                              </div>
                           </div>
                           <Button
                                 type="button"
                                 variant="outline"
                                 style={{ marginTop: '1rem' }}
                                 onClick={() => {
                                    ActualizarDatosFormacion()
                                 }}
                              >Actualizar registro</Button>
                        </div>
                    </TabsContent>

                    {/* Experiencia Laboral */}
                     <TabsContent value="experiencia" className="mt-0 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                           <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">Experiencia Laboral</h3>
                           <div className="space-y-4">
                              {formData.experiencias && formData.experiencias.map((exp, index) => (
                                 <div key={index} className="p-4 border rounded-lg bg-gray-50/50 relative">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                       <div className="space-y-1"><Label>Compañía</Label><Input value={exp.compañia || ''} onChange={e => {
                                          const val = e.target.value;
                                          setFormData(prev => {
                                             const experiencias = [...prev.experiencias];
                                             experiencias[index].compañia = val;
                                             return { ...prev, experiencias };
                                          });
                                       }} /></div>
                                       <div className="space-y-1"><Label>Cargo desempeñado</Label><Input value={exp.cargo || ''} onChange={e => {
                                          const val = e.target.value;
                                          setFormData(prev => {
                                             const experiencias = [...prev.experiencias];
                                             experiencias[index].cargo = val;
                                             return { ...prev, experiencias };
                                          });
                                       }} /></div>
                                       <div className="space-y-1">
                                          <Label>Tiempo duración</Label>
                                          <Select value={exp.tiempoDuracion || ''} onValueChange={v => {
                                             setFormData(prev => {
                                                const experiencias = [...prev.experiencias];
                                                experiencias[index].tiempoDuracion = v;
                                                return { ...prev, experiencias };
                                             });
                                          }}>
                                             <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                             <SelectContent>
                                                <SelectItem value="menos de 2 meses">Menos de 2 meses</SelectItem>
                                                <SelectItem value="2 meses a 1 año">De 2 meses a 1 año</SelectItem>
                                                <SelectItem value="más de 1 año">Más de 1 año</SelectItem>
                                             </SelectContent>
                                          </Select>
                                       </div>
                                       <div className="space-y-1"><Label>Fecha de inicio</Label><Input value={exp.inicio || ''} onChange={e => {
                                          const val = e.target.value;
                                          setFormData(prev => {
                                             const experiencias = [...prev.experiencias];
                                             experiencias[index].inicio = val;
                                             return { ...prev, experiencias };
                                          });
                                       }} type="date" /></div>
                                       <div className="space-y-1"><Label>Fecha de fin</Label><Input value={exp.fin || ''} onChange={e => {
                                          const val = e.target.value;
                                          setFormData(prev => {
                                             const experiencias = [...prev.experiencias];
                                             experiencias[index].fin = val;
                                             return { ...prev, experiencias };
                                          });
                                       }} type="date" /></div>
                                       <div className="col-span-1 md:col-span-2 space-y-1"><Label>Funciones</Label><Textarea value={exp.funciones || ''} onChange={e => {
                                          const val = e.target.value;
                                          setFormData(prev => {
                                             const experiencias = [...prev.experiencias];
                                             experiencias[index].funciones = val;
                                             return { ...prev, experiencias };
                                          });
                                       }} /></div>
                                       <div className="space-y-1 md:col-span-2">
                                          <Label>Nombre de jefe inmediato</Label>
                                          <Input value={exp.jefeInmediato || ''} onChange={e => {
                                             const val = e.target.value;
                                             setFormData(prev => {
                                                const experiencias = [...prev.experiencias];
                                                experiencias[index].jefeInmediato = val;
                                                return { ...prev, experiencias };
                                             });
                                          }} placeholder="Nombre del jefe inmediato" />
                                       </div>
                                       <div className="space-y-1 md:col-span-2">
                                          <Label>Teléfono empresa o jefe inmediato</Label>
                                          <Input value={exp.telefonoJefe || ''} onChange={e => {
                                             const val = e.target.value;
                                             setFormData(prev => {
                                                const experiencias = [...prev.experiencias];
                                                experiencias[index].telefonoJefe = val;
                                                return { ...prev, experiencias };
                                             });
                                          }} placeholder="Teléfono de contacto" />
                                       </div>
                                    </div>
                                    {formData.experiencias.length > 1 && (
                                       <Button type="button" variant="destructive" size="sm" className="absolute -top-3 -right-3" onClick={() => {
                                          setFormData(prev => {
                                             const experiencias = [...prev.experiencias];
                                             experiencias.splice(index, 1);
                                             return { ...prev, experiencias };
                                          });
                                       }}><Trash2 className="w-4 h-4" /></Button>
                                    )}
                                 </div>
                              ))}
                              <Button type="button" variant="outline" onClick={() => {
                                 setFormData(prev => ({
                                    ...prev,
                                    experiencias: [...(prev.experiencias || []), { inicio: '', fin: '', compañia: '', cargo: '', funciones: '', tiempoDuracion: '', jefeInmediato: '', telefonoJefe: '' }]
                                 }));
                              }}>Añadir Experiencia</Button>
                           </div>
                        </div>
                        
                     </TabsContent>

                    {/* 5. Referencias */}
                    <TabsContent value="referencias" className="mt-0 space-y-6">
                       {/* Laborales */}
                       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                          <div className="flex justify-between items-center mb-4 border-b pb-2">
                              <h3 className="text-lg font-bold text-gray-800">Experiencia Laboral</h3>
                              <div className="mt-1 text-sm text-gray-600">
                                 Validación {indexValidacionExperiencia} Contacto {nombreContacto}
                              </div>
                          </div>
                          {isAddingRefLab && (
                             <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-emerald-200">
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className='space-y-2'>
                                          <Label className="mb-2">Concepto</Label>
                                          <Select
                                             placeholder="Concepto"
                                             value={concepto || ''}
                                             onValueChange={v => {
                                                setconcepto(v);
                                                setFormData(prev => ({
                                                   ...prev,
                                                   experiencia_laboral: {
                                                      ...prev.experiencia_laboral,
                                                      Concepto: v
                                                   }
                                                }));
                                             }}
                                          >
                                          <SelectTrigger><SelectValue placeholder="Concepto" /></SelectTrigger>
                                          <SelectContent>
                                             <SelectItem value="Sin hallazgo">Sin hallazgo</SelectItem>
                                             <SelectItem value="Con hallazgo menor">Con hallazgo menor</SelectItem>
                                             <SelectItem value="Con hallazgo">Con hallazgo</SelectItem>
                                          </SelectContent>
                                       </Select>
                                    </div>
                                    <div className='space-y-2'>
                                          <Label className="mb-2">Desempeño reportado</Label>
                                          <Select
                                             placeholder="Desempeño reportado"
                                             value={desempeñoReportado || ''}
                                             onValueChange={v => {
                                                setDesempeñoReportado(v);
                                                setFormData(prev => ({
                                                   ...prev,
                                                   experiencia_laboral: {
                                                      ...prev.experiencia_laboral,
                                                      validaciones: {
                                                         ...prev.experiencia_laboral?.validaciones,
                                                         DesempenoReportado: v
                                                      }
                                                   }
                                                }));
                                             }}
                                          >
                                          <SelectTrigger><SelectValue placeholder="Desempeño reportado" /></SelectTrigger>
                                          <SelectContent>
                                             <SelectItem value="Desempeño positivo">Desempeño positivo</SelectItem>
                                             <SelectItem value="Desempeño negativo">Desempeño negativo</SelectItem>
                                             <SelectItem value="Desempeño neutral">Desempeño neutral</SelectItem>
                                             <SelectItem value="Desempeño con novedad">Desempeño con novedad</SelectItem>
                                             <SelectItem value="No reporta">No reporta</SelectItem>
                                             <SelectItem value="Sin experiencia">Sin experiencia</SelectItem>
                                          </SelectContent>
                                       </Select>
                                    </div>
                                    <div className='space-y-2'>
                                          <Label className="mb-2">Motivo retiro real</Label>
                                          <Select
                                             placeholder="Motivo retiro real"
                                             value={motivoRetiro || ''}
                                             onValueChange={v => {
                                                setMotivoRetiro(v);
                                                setFormData(prev => ({
                                                   ...prev,
                                                   experiencia_laboral: {
                                                      ...prev.experiencia_laboral,
                                                      validaciones: {
                                                         ...prev.experiencia_laboral?.validaciones,
                                                         MotivoRetiroReal: v
                                                      }
                                                   }
                                                }));
                                             }}
                                          >
                                          <SelectTrigger><SelectValue placeholder="Motivo retiro real" /></SelectTrigger>
                                          <SelectContent>
                                             <SelectItem value="Renuncia voluntaria">Renuncia voluntaria</SelectItem>
                                             <SelectItem value="Despido con justa causa">Despido con justa causa</SelectItem>
                                             <SelectItem value="Despido sin justa causa">Despido sin justa causa</SelectItem>
                                             <SelectItem value="Terminación de contrato">Terminación de contrato</SelectItem>
                                             <SelectItem value="Incapacidad permanente">Incapacidad permanente</SelectItem>
                                          </SelectContent>
                                       </Select>
                                    </div>
                                    <div className='space-y-2'>
                                       <Label className="mb-2">Persona que Referencia</Label>
                                    <Input
                                       placeholder="Persona que referencia"
                                       value={personaQReferencia || ""}
                                       onChange={(e) => {
                                          const cleaned = e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, ""); // ✅ solo letras + espacios
                                          setpersonaQReferencia(cleaned);
                                          setFormData((prev) => ({
                                             ...prev,
                                             experiencia_laboral: {
                                             ...prev.experiencia_laboral,
                                             validaciones: {
                                                ...prev.experiencia_laboral?.validaciones,
                                                PersonaQueReferencia: cleaned,
                                             },
                                             },
                                          }));
                                       }}
                                    />
                                    </div>
                                    <div className='space-y-2'>
                                       <Label className="mb-2">Teléfono</Label>
                                       <Input
                                       placeholder="Teléfono"
                                       value={telefonoExperiencia || ""}
                                       onChange={(e) => {
                                          const cleaned = e.target.value.replace(/[^\d]/g, "").slice(0, 10); // ✅ solo números, máx 10
                                          settelefonoExperiencia(cleaned);
                                          setFormData((prev) => ({
                                             ...prev,
                                             experiencia_laboral: {
                                             ...prev.experiencia_laboral,
                                             validaciones: {
                                                ...prev.experiencia_laboral?.validaciones,
                                                Telefono: cleaned,
                                             },
                                             },
                                          }));
                                       }}
                                       inputMode="numeric"
                                       pattern="[0-9]*"
                                       />
                                    </div>
                                    <div className='space-y-2'>
                                       <Label className="mb-2">Referenciado por</Label>
                                          <Select
                                             placeholder="Referenciado por"
                                             value={referenciadoPor || ''}
                                             onValueChange={v => {
                                                setreferenciadoPor(v);
                                                setFormData(prev => ({
                                                   ...prev,
                                                   experiencia_laboral: {
                                                      ...prev.experiencia_laboral,
                                                      validaciones: {
                                                         ...prev.experiencia_laboral?.validaciones,
                                                         ReferenciadoPor: v
                                                      }
                                                   }
                                                }));
                                             }}
                                          >
                                          <SelectTrigger><SelectValue placeholder="Referenciado por" /></SelectTrigger>
                                          <SelectContent>
                                             <SelectItem value="Genoveva Cubides">Genoveva Cubides</SelectItem>
                                             <SelectItem value="Cecilia Duque">Cecilia Duque</SelectItem>
                                             <SelectItem value="Aprendiz">Aprendiz</SelectItem>
                                          </SelectContent>
                                       </Select>
                                    </div>
                                    <div className='space-y-2'>
                                       <Label className="mb-2">Eps</Label>
                                       <Input
                                          placeholder="eps"
                                          value={reEps || ''}
                                          onChange={e => {
                                             setreEps(e.target.value);
                                             setFormData(prev => ({
                                                ...prev,
                                                experiencia_laboral: {
                                                   ...prev.experiencia_laboral,
                                                   validaciones: {
                                                      ...prev.experiencia_laboral?.validaciones,
                                                      descripcionEps: e.target.value
                                                   }
                                                }
                                             }));
                                          }}
                                       />
                                    </div>
                                    <div className='space-y-2'>
                                       <Label className="mb-2">Tiempo Duracion</Label>
                                          <Select
                                             placeholder="tiempo duracion"
                                             value={tiempoDuracion || ''}
                                             onValueChange={v => {
                                                setTiempoDuracion(v);
                                                setFormData(prev => ({
                                                   ...prev,
                                                   experiencia_laboral: {
                                                      ...prev.experiencia_laboral,
                                                      validaciones: {
                                                         ...prev.experiencia_laboral?.validaciones,
                                                         TiempoDuracion: v
                                                      }
                                                   }
                                                }));
                                             }}
                                          >
                                          <SelectTrigger><SelectValue placeholder="tiempo duracion" /></SelectTrigger>
                                          <SelectContent>
                                             <SelectItem value="Menos de 2 meses">Menos de 2 meses</SelectItem>
                                             <SelectItem value="De 2 meses a 1 año">De 2 meses a 1 año</SelectItem>
                                             <SelectItem value="Más de 1 año">Más de 1 año</SelectItem>
                                          </SelectContent>
                                       </Select>
                                    </div>
                                  <div className="space-y-2">
                                    <Label>Fecha de expedición Documento Identidad</Label>
                                    <Input
                                       type="date"
                                       placeholder="Fecha de expedición Documento Identidad"
                                       value={fechaExpedicion || ''}
                                       onChange={e => {
                                          setFechaExpedicion(e.target.value);
                                          setFormData(prev => ({
                                             ...prev,
                                             experiencia_laboral: {
                                                ...prev.experiencia_laboral,
                                                validaciones: {
                                                   ...prev.experiencia_laboral?.validaciones,
                                                   FechaExpedicionDocumentoIdentidad: e.target.value
                                                }
                                             }
                                          }));
                                       }}
                                    />
                                 </div>

                                 <div className="space-y-2">
                                    <Label>Cargo desempeñado</Label>
                                    <Input value={cargoExperiencia || ''} disabled />
                                 </div>

                                 <div className="space-y-2 md:col-span-2">
                                    <Label>Funciones realizadas</Label>
                                    <Textarea
                                       value={funcionesExperiencia || ''}
                                       disabled
                                       className="min-h-[110px]"
                                    />
                                 </div>

                                 <div className="mb-2">
                                    <Label>Comentarios del referenciador</Label>
                                       <Textarea
                                          placeholder="Comentarios del referenciador..."
                                          value={comentariosReferenciador || ''}
                                          onChange={e => {
                                             setComentariosReferenciador(e.target.value);
                                             setFormData(prev => ({
                                                ...prev,
                                                experiencia_laboral: {
                                                   ...prev.experiencia_laboral,
                                                   validaciones: {
                                                      ...prev.experiencia_laboral?.validaciones,
                                                      ComentariosDelReferenciado: e.target.value
                                                   }
                                                }
                                             }));
                                          }}
                                       />
                                    </div>
                                 </div>
                                 <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="ghost" onClick={cancelarRefLaboral}>Cancelar</Button>
                                    <Button size="sm" onClick={addRefLaboral}>Guardar</Button>
                                 </div>
                           </div>
                              )}

                              <div className="flex justify-end mb-3">
                              <Button
                                 type="button"
                                 variant="outline"
                                 onClick={() => {
                                    setIsAddingExperiencia(true);
                                    setNewExperiencia(EMPTY_EXPERIENCIA_LABORAL);
                                 }}
                              >
                                 Añadir experiencia
                              </Button>
                              </div>

                              {isAddingExperiencia && (
                              <div className="border rounded-xl p-4 mb-4 bg-gray-50">
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                    <Label>Empresa</Label>
                                       <Input
                                          value={newExperiencia.Compania}
                                          onChange={(e) =>
                                             setNewExperiencia((prev) => ({
                                             ...prev,
                                             Compania: soloLetrasYNumeros(e.target.value),
                                             }))
                                          }
                                       />
                                    </div>

                                 <div>
                                    <Label>Cargo</Label>
                                    <Input
                                       value={newExperiencia.Cargo}
                                       onChange={(e) =>
                                          setNewExperiencia((prev) => ({
                                          ...prev,
                                          Cargo: soloLetras(e.target.value),
                                          }))
                                       }
                                    />
                                    </div>

                                    <div>
                                       <Label>Funciones</Label>
                                       <Textarea
                                          value={newExperiencia.Funciones}
                                          onChange={(e) =>
                                             setNewExperiencia((prev) => ({
                                             ...prev,
                                             Funciones: soloLetrasYNumeros(e.target.value),
                                             }))
                                          }
                                       />
                                    </div>
                                 <div>
                                    <Label>Tiempo de duración</Label>
                                    <Input
                                       value={newExperiencia.TiempoDuracion}
                                       onChange={(e) =>
                                          setNewExperiencia((prev) => ({
                                          ...prev,
                                          TiempoDuracion: soloLetrasYNumeros(e.target.value),
                                          }))
                                       }
                                    />
                                    </div>

                                 <div>
                                    <Label>Jefe inmediato</Label>
                                    <Input
                                       value={newExperiencia.JefeInmediato}
                                       onChange={(e) =>
                                          setNewExperiencia((prev) => ({
                                          ...prev,
                                          JefeInmediato: soloLetras(e.target.value),
                                          }))
                                       }
                                    />
                                    </div>

                                 <div>
                                    <Label>Teléfono jefe</Label>
                                    <Input
                                       value={newExperiencia.TelefonoJefe}
                                       onChange={(e) =>
                                          setNewExperiencia((prev) => ({
                                          ...prev,
                                          TelefonoJefe: soloNumeros(e.target.value),
                                          }))
                                       }
                                    />
                                    </div>
                                 </div>

                                 <div className="flex justify-end gap-2 mt-4">
                                    <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                       setIsAddingExperiencia(false);
                                       setNewExperiencia(EMPTY_EXPERIENCIA_LABORAL);
                                    }}
                                    >
                                    Cancelar
                                    </Button>
                              <Button
                              type="button"
                              onClick={async () => {
                                 try {
                                    if (!newExperiencia.Compania?.trim() || !newExperiencia.Cargo?.trim()) {
                                    return;
                                    }

                                    const payloadExperiencia = {
                                    IdRegistroPersonal: aspirante?.id,
                                    Cargo: newExperiencia.Cargo || '',
                                    Compania: newExperiencia.Compania || '',
                                    TiempoDuracion: newExperiencia.TiempoDuracion || '',
                                    Funciones: newExperiencia.Funciones || '',
                                    JefeInmediato: newExperiencia.JefeInmediato || '',
                                    TelefonoJefe: newExperiencia.TelefonoJefe || '',
                                    TieneExperienciaPrevia: true,
                                    };

                                    const response = await axios.post(
                                    `${API_BASE}/experiencia-laboral`,
                                    payloadExperiencia,
                                    { headers: { ...authHeaders } }
                                    );

                                    const experienciaCreada = response?.data;

                                    setFormData((prev) => ({
                                    ...prev,
                                    experienciaLaboral: [
                                       ...(Array.isArray(prev?.experienciaLaboral) ? prev.experienciaLaboral : []),
                                       { ...experienciaCreada },
                                    ],
                                    }));

                                    setIsAddingExperiencia(false);
                                    setNewExperiencia(EMPTY_EXPERIENCIA_LABORAL);

                                    toast({
                                    title: 'Experiencia laboral',
                                    description: 'Experiencia agregada correctamente.',
                                    });
                                 } catch (error) {
                                    console.error('Error creando experiencia laboral:', error);
                                    toast({
                                    title: 'Error',
                                    description: 'No se pudo guardar la experiencia laboral.',
                                    variant: 'destructive',
                                    });
                                 }
                              }}
                              >
                              Agregar
                              </Button>
                                 </div>
                              </div>
                              )}

                              <div className="overflow-x-auto">
                            <table className="min-w-full border border-gray-200 rounded-lg">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Nombre contacto</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Telefono</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Nombre Empresa</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Cargo</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Duración</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {formData.experienciaLaboral.length === 0 &&  (
                                  <tr>
                                    <td colSpan={7} className="text-center text-sm text-gray-500 italic py-4">No hay referencias laborales registradas.</td>
                                  </tr>
                                )}
                                {formData.experienciaLaboral.map((ref, idx) => (
                                  <tr key={idx} className="border-t">
                                    <td className="px-3 py-2 text-sm">{ref.JefeInmediato}</td>
                                    <td className="px-3 py-2 text-sm">{ref.TelefonoJefe}</td>
                                    <td className="px-3 py-2 text-sm">{ref.Compania}</td>
                                    <td className="px-3 py-2 text-sm">{ref.Cargo}</td>
                                    <td className="px-3 py-2 text-sm whitespace-pre-wrap">{ref.TiempoDuracion}</td>
                                    <td className="px-3 py-2 text-sm">
                                       <div className="flex flex-row items-center justify-center gap-2 w-full">
                                          <Button
                                             type="button"
                                             size="icon"
                                             variant="outline"
                                             className="h-9 w-9 flex items-center justify-center"
                                             onClick={() => handleDescargarReferencia(ref)}
                                          >
                                             <Download size={18} />
                                          </Button>
                                          <Button
                                             size="icon"
                                             variant="outline"
                                             className="h-9 w-9 flex items-center justify-center"
                                             onClick={() => handleViewRefLaboral(idx, ref)}
                                          >
                                             <Eye className="w-5 h-5" />
                                          </Button>
                                          <Button
                                             size="icon"
                                             variant="outline"
                                             className="h-9 w-9 flex items-center justify-center"
                                            onClick={async () => {
                                             setSelectedRefLabIdx(idx);

                                             const idExp =
                                                ref?.IdExperienciaLaboral ||
                                                ref?.id ||
                                                formData?.experienciaLaboral?.[idx]?.IdExperienciaLaboral;

                                             // 1) por si ya venía algo local
                                             setObsRefLabText(ref?.observacionesInternas || '');

                                             // 2) traer del backend (lo que garantiza que al volver a entrar cargue)
                                             try {
                                                if (idExp) {
                                                   const res = await GetObservacionesExperienciaLaboral(idExp);
                                                   if (res.ok) {
                                                   const data = await res.json();

                                                   // Ajusta el nombre según lo que devuelva tu API:
                                                   const obs =
                                                      data?.Observaciones ??
                                                      data?.observaciones ??
                                                      data?.observacionesInternas ??
                                                      data?.observaciones_internas ??
                                                      "";

                                                   setObsRefLabText(obs);

                                                   // ✅ opcional: también lo guardas en formData para que quede cacheado en la tabla
                                                   setFormData(prev => {
                                                      const list = Array.isArray(prev?.experienciaLaboral) ? [...prev.experienciaLaboral] : [];
                                                      if (!list[idx]) return prev;
                                                      list[idx] = { ...list[idx], observacionesInternas: obs };
                                                      return { ...prev, experienciaLaboral: list };
                                                   });
                                                   }
                                                }
                                             } catch (e) {
                                                console.error("Error cargando observación experiencia laboral:", e);
                                             }

                                             // 3) abre modal
                                             setObsRefLabOpen(true);
                                             }}

                                          >
                                             <FileText className="w-5 h-5" />
                                          </Button>
                                          <Button
                                          size="icon"
                                          variant="outline"
                                          className="h-9 w-9 flex items-center justify-center border-red-200 text-red-600 hover:bg-red-50"
                                          onClick={() => handleEliminarExperienciaLaboral(idx, ref)}
                                          >
                                          <Trash2 className="w-5 h-5" />
                                          </Button>
                                          </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                       </div>
                      {/* ✅ Referencias Personales (OCULTO) */}
                        {false && (
                        <>
                           {/* Personales */}
                           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                              <div className="flex justify-between items-center mb-4 border-b pb-2">
                              <h3 className="text-lg font-bold text-gray-800">Referencias Personales</h3>
                              </div>

                              {isAddingRefPers && (
                              <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-emerald-200">
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-3">
                                    <div className="space-y-2">
                                    <Label className="mb-2">Hace cuanto lo conoce</Label>
                                    <Select
                                       placeholder="Hace cuanto lo conoce"
                                       value={formData.referenciaPersonalValidacion.HaceCuantoLoConoce || ''}
                                       onValueChange={(v) =>
                                          setFormData((prev) => ({
                                          ...prev,
                                          referenciaPersonalValidacion: {
                                             ...prev.referenciaPersonalValidacion,
                                             HaceCuantoLoConoce: v,
                                          },
                                          }))
                                       }
                                    >
                                       <SelectTrigger>
                                          <SelectValue placeholder="Hace cuanto lo conoce" />
                                       </SelectTrigger>
                                       <SelectContent>
                                          <SelectItem value="Menos de 1 año">Menos de 1 año</SelectItem>
                                          <SelectItem value="Más de 1 año">Más de 1 año</SelectItem>
                                       </SelectContent>
                                    </Select>
                                    </div>

                                    <div className="space-y-2">
                                    <Label className="mb-2">Descripción</Label>
                                    <Select
                                       placeholder="Descripción"
                                       value={formData.referenciaPersonalValidacion.Descripcion || ''}
                                       onValueChange={(v) =>
                                          setFormData((prev) => ({
                                          ...prev,
                                          referenciaPersonalValidacion: {
                                             ...prev.referenciaPersonalValidacion,
                                             Descripcion: v,
                                          },
                                          }))
                                       }
                                    >
                                       <SelectTrigger>
                                          <SelectValue placeholder="Seleccionar descripción" />
                                       </SelectTrigger>
                                       <SelectContent>
                                          <SelectItem value="bueno">Bueno - Refiere comportamiento adecuado</SelectItem>
                                          <SelectItem value="regular">Regular - Refiere comportamiento neutral</SelectItem>
                                          <SelectItem value="malo">Malo - Refiere comportamiento inadecuado</SelectItem>
                                       </SelectContent>
                                    </Select>
                                    </div>

                                    <div className="space-y-2">
                                    <Label className="mb-2">Lugar de vivienda</Label>
                                    {/* <Select placeholder="Lugar de vivienda" value={formData.referenciaPersonalValidacion.LugarVivienda || ''} onValueChange={(v) => setNewRefPersonal({...newRefPersonal, lugarVivienda: v})}> */}
                                    <Select
                                       placeholder="Lugar de vivienda"
                                       value={formData.referenciaPersonalValidacion.LugarVivienda || ''}
                                       onValueChange={(v) =>
                                          setFormData((prev) => ({
                                          ...prev,
                                          referenciaPersonalValidacion: {
                                             ...prev.referenciaPersonalValidacion,
                                             LugarVivienda: v,
                                          },
                                          }))
                                       }
                                    >
                                       <SelectTrigger>
                                          <SelectValue placeholder="Seleccionar localidad" />
                                       </SelectTrigger>
                                       <SelectContent position="popper" className="max-h-72 overflow-y-auto">
                                          <SelectItem value="Usaquen">Usaquén</SelectItem>
                                          <SelectItem value="Chapinero">Chapinero</SelectItem>
                                          <SelectItem value="SantaFe">Santa Fe</SelectItem>
                                          <SelectItem value="SanCristobal">San Cristóbal</SelectItem>
                                          <SelectItem value="Usme">Usme</SelectItem>
                                          <SelectItem value="Tunjuelito">Tunjuelito</SelectItem>
                                          <SelectItem value="Bosa">Bosa</SelectItem>
                                          <SelectItem value="Kennedy">Kennedy</SelectItem>
                                          <SelectItem value="Fontibon">Fontibón</SelectItem>
                                          <SelectItem value="Engativa">Engativá</SelectItem>
                                          <SelectItem value="Suba">Suba</SelectItem>
                                          <SelectItem value="BarriosUnidos">Barrios Unidos</SelectItem>
                                          <SelectItem value="Teusaquillo">Teusaquillo</SelectItem>
                                          <SelectItem value="AntonioNarino">Antonio Nariño</SelectItem>
                                          <SelectItem value="PuenteAranda">Puente Aranda</SelectItem>
                                          <SelectItem value="LaCandelaria">La Candelaria</SelectItem>
                                          <SelectItem value="RafaelUribe">Rafael Uribe Uribe</SelectItem>
                                          <SelectItem value="CiudadBolivar">Ciudad Bolívar</SelectItem>
                                          <SelectItem value="Sumapaz">Sumapaz</SelectItem>
                                       </SelectContent>
                                    </Select>
                                    </div>

                                    <div className="space-y-2">
                                    <Label className="mb-2">Tiene hijos</Label>
                                    <Select
                                       placeholder="Tiene hijos"
                                       value={formData.referenciaPersonalValidacion.TieneHijos || ''}
                                       onValueChange={(v) =>
                                          setFormData((prev) => ({
                                          ...prev,
                                          referenciaPersonalValidacion: {
                                             ...prev.referenciaPersonalValidacion,
                                             TieneHijos: v,
                                          },
                                          }))
                                       }
                                    >
                                       <SelectTrigger>
                                          <SelectValue placeholder="Tiene hijos" />
                                       </SelectTrigger>
                                       <SelectContent>
                                          <SelectItem value="1">SI</SelectItem>
                                          <SelectItem value="2">NO</SelectItem>
                                       </SelectContent>
                                    </Select>
                                    </div>
                                 </div>

                                 <div className="mb-3">
                                    <Label className="mb-2">Observaciones del Referenciador</Label>
                                    <Textarea
                                    placeholder="Observaciones del referenciador..."
                                    value={formData.referenciaPersonalValidacion.ObservacionesReferenciador || ''}
                                    onChange={(e) =>
                                       setFormData((prev) => ({
                                          ...prev,
                                          referenciaPersonalValidacion: {
                                          ...prev.referenciaPersonalValidacion,
                                          ObservacionesReferenciador: e.target.value,
                                          },
                                       }))
                                    }
                                    />
                                 </div>

                                 <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => setIsAddingRefPers(false)}>
                                    Cancelar
                                    </Button>
                                    <Button size="sm" onClick={addRefPersonal}>
                                    Guardar
                                    </Button>
                                 </div>
                              </div>
                              )}

                              <div className="overflow-x-auto">
                              <table className="min-w-full border border-gray-200 rounded-lg">
                                 <thead className="bg-gray-100">
                                    <tr>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Nombre</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Teléfono</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Parentesco-Relación</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                                       Tiempo de conocer al aspirante
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Acciones</th>
                                    </tr>
                                 </thead>

                                 <tbody>
                                    {formData.referencias.length === 0 && (
                                    <tr>
                                       <td colSpan={6} className="text-center text-sm text-gray-500 italic py-4">
                                          No hay referencias personales registradas.
                                       </td>
                                    </tr>
                                    )}

                                    {formData.referencias.map((ref, idx) => (
                                    <tr key={idx} className="border-t">
                                       <td className="px-3 py-2 text-sm">{ref.Nombre}</td>
                                       <td className="px-3 py-2 text-sm">{ref.Telefono}</td>
                                       <td className="px-3 py-2 text-sm">{ref.Parentesco}</td>
                                       <td className="px-3 py-2 text-sm whitespace-pre-wrap">{ref.TiempoConocerlo}</td>
                                       <td className="px-3 py-2 text-sm">
                                          <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                             setSelectedRefPersIdx(idx);
                                             setNewRefPersonal(
                                                ref?.validacion
                                                ? { ...EMPTY_REF_PERS_VALIDACION, ...ref.validacion }
                                                : EMPTY_REF_PERS_VALIDACION
                                             );
                                             setIsAddingRefPers(true);
                                          }}
                                          >
                                          <Eye className="w-4 h-4 mr-2" /> Validar Ref
                                          </Button>
                                       </td>
                                    </tr>
                                    ))}
                                 </tbody>
                              </table>
                              </div>
                           </div>
                              </>
                        )}
                    </TabsContent>

                   {/* 6. Contacto Emergencia */}
                     <TabsContent value="contacto" className="mt-0 space-y-6">
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">
                           CONTACTO DE EMERGENCIA
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2">
                           <Label>NOMBRE COMPLETO</Label>
                           <Input
                              value={formData.contactoEmergencia || ""}
                              onChange={(e) =>
                                 setFormData((prev) => ({
                                 ...prev,
                                 contactoEmergencia: e.target.value,
                                 }))
                              }
                           />
                           </div>

                           <div className="space-y-2">
                           <Label>Teléfono</Label>
                          <Input
                           value={formData.telefonoContactoEmergencia || ""}
                           inputMode="numeric"
                           maxLength={10}
                           onChange={(e) => {
                              const soloNumeros = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setFormData((prev) => ({
                                 ...prev,
                                 telefonoContactoEmergencia: soloNumeros,
                              }));
                           }}
                           />
                           </div>
                        </div>

                        <div className="flex justify-end mt-6">
                           <Button
                           type="button"
                           className="bg-emerald-600 hover:bg-emerald-700 text-white"
                           onClick={handleGuardarContactoEmergencia}
                           >
                           Guardar contacto de emergencia
                           </Button>
                        </div>
                     </div>
                     </TabsContent>

                    {/* 7. Documentos */}
                    <TabsContent value="documentos" className="mt-0 space-y-6">
                       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                          <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">Documentación Legal</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="border p-4 rounded-lg flex flex-col items-center justify-center bg-gray-50 border-dashed border-gray-300 min-h-[200px]">
                                <Label htmlFor="fotoFrontal" className="cursor-pointer flex flex-col items-center gap-2">
                                    {(() => {
                                       let fotoDoc = null;
                                       if (Array.isArray(formData.documentos)) {
                                          fotoDoc = formData.documentos.find(d => String(d.IdTipoDocumentacion) === '2');
                                       }
                                       if (fotoDoc && fotoDoc.DocumentoBase64) {
                                          // Si el base64 no tiene prefijo, agregarlo
                                          let src = fotoDoc.DocumentoBase64;
                                          if (!src.startsWith('data:image')) {
                                             src = 'data:image/jpeg;base64,' + src;
                                          }
                                          return (
                                             <img src={src} alt="Foto Frontal" className="w-24 h-24 object-cover rounded-full mb-2" />
                                          );
                                       } else {
                                          return (
                                             <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                                                <ImageIcon className="w-8 h-8 text-gray-400" />
                                             </div>
                                          );
                                       }
                                    })()}
                                   <span className="text-sm font-medium text-gray-600">Foto Frontal</span>
                                </Label>
                             </div>
                             
                             <div className="space-y-4">
                                <div className="border p-3 rounded-lg">
                                   <Label className="mb-2 block">FIRMA DIGITAL</Label>
                                   <div className="flex flex-col md:flex-row gap-4">
                                      <div>
                                       {/* Mostrar firma digital si existe en documentos (id: 42) */}
                                       {(() => {
                                          let firmaDoc = null;
                                          if (Array.isArray(formData.documentos)) {
                                             firmaDoc = formData.documentos.find(d => String(d.IdTipoDocumentacion) === '42');
                                          }
                                          if (firmaDoc && firmaDoc.DocumentoBase64) {
                                             let src = firmaDoc.DocumentoBase64;
                                             if (!src.startsWith('data:image')) {
                                                src = 'data:image/png;base64,' + src;
                                             }
                                             return (
                                                <img src={src} alt="Firma digital" className="w-40 h-20 object-contain border rounded bg-white mb-2" />
                                             );
                                          } else {
                                             return (
                                                <SignaturePad value={formData.documentos.firmaDigitalUrl} onChange={(dataUrl) => handleDocumentChange('firmaDigitalUrl', dataUrl)} />
                                             );
                                          }
                                       })()}
                                      </div>
                                      <div className="flex flex-col justify-center gap-2">
                                         <div className="text-sm text-gray-500">También puedes subir una imagen de la firma</div>
                                         <Input id="firmaDigital" type="file" className="hidden" onChange={(e) => handleFileUpload('firmaDigitalUrl', e)} />
                                         <label htmlFor="firmaDigital" className="text-sm inline-block px-3 py-1 border rounded-md cursor-pointer bg-white hover:bg-emerald-50">Cargar Imagen</label>
                                         {formData.documentos.firmaDigitalUrl && (
                                            <a href={formData.documentos.firmaDigitalUrl} download="firma.png" className="text-sm text-emerald-600 mt-2">Descargar firma</a>
                                         )}
                                      </div>
                                   </div>
                                </div>
                             </div>
                         
                              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-12 w-full max-w-none">
                              <div className="w-full flex justify-end mb-2">
                                 <Button
                                    type="button"
                                    variant="outline"
                                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                                    onClick={handleDescargaMasivaDocumentosIngreso}
                                 >
                                    Descargar masivamente documentos de ingreso
                                 </Button>
                              </div>
                              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-600"/> Documentos de Ingreso</h3>
                               <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                              {requisitosObligatorios.map((req) => {
                                 // Buscar el documento correspondiente en el array de documentos
                                 let doc = Array.isArray(formData.documentos)
                                    ? formData.documentos.find(d => String(d.IdTipoDocumentacion) === String(req.id))
                                    : null;
                                 let hasFile = !!doc;
                                 let accept = '.pdf,image/*';
                                 if (req.id === 'fotoAspirante') accept = 'image/*';
                                 if (req.id === 'reciboPublico') accept = '.pdf,image/*';
                                 return (
                                    <div key={req.id} className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm flex flex-col justify-between h-full group w-full">
                                       <div>
                                          <h4 className="font-semibold text-gray-800 mb-3 text-sm leading-tight min-h-[40px]">{req.label}</h4>
                                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium mb-4 border ${hasFile ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-100'}`}> 
                                             {hasFile ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />} 
                                             {hasFile ? 'Adjuntado' : 'Falta adjuntar'}
                                          </div>
                                       </div>
                                       <div className="space-y-3">
                                          {!hasFile && (
                                             <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                   <input 
                                                      type="file" 
                                                      id={`file-${req.id}`} 
                                                      className="hidden" 
                                                      onChange={(e) => handleFileUpload(e, req.id)} 
                                                      accept={accept}
                                                   />
                                                   {/* <label 
                                                      htmlFor={`file-${req.id}`}
                                                      className="cursor-pointer flex items-center justify-center w-full px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                                   >
                                                      Cargar
                                                   </label> */}
                                                </div>
                                             </div>
                                          )}
                                          {hasFile && (
                                             <div className="flex flex-col gap-2 w-full">
                                                <Button 
                                                   type="button" 
                                                   variant="outline" 
                                                   size="sm"
                                                   className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 px-3 h-auto w-full"
                                                   onClick={() => descargarDocumento(doc)}
                                                >
                                                   Descargar
                                                </Button>
                                                {/* <Button 
                                                   type="button" 
                                                   variant="outline" 
                                                   size="sm"
                                                   className="text-red-600 border-red-200 hover:bg-red-50 px-3 h-auto w-full"
                                                   onClick={() => removeDocument(req.id)}
                                                >
                                                   Eliminar
                                                </Button> */}
                                             </div>
                                          )}
                                          <p className="text-xs text-gray-400 truncate h-4">
                                             {hasFile && doc ? doc.Nombre : 'Sin archivo'}
                                          </p>
                                       </div>
                                    </div>
                                 );
                              })}
                                       </div>
                                 </div>
                                 {/* Sección Documentos de Seguridad */}
                                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-12 w-full max-w-none">
                                    <div className="w-full flex justify-end mb-2">
                                       <Button
                                          type="button"
                                          variant="outline"
                                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                                          onClick={() => {
                                             // Filtrar documentos de seguridad cargados
                                             const docsSeguridad = Array.isArray(formData.documentos)
                                                ? formData.documentos.filter(d => documentosSeguridad.some(s => String(s.id) === String(d.IdTipoDocumentacion)))
                                                : [];
                                             handleEnviarDocumentosSeguridad(docsSeguridad);
                                          }}
                                       >
                                          Guardar documentos de selección
                                       </Button>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-600"/> Documentos de Seguridad</h3>
                                    <div className="w-full flex flex-wrap gap-6 justify-center">
                                       {documentosSeguridad.map((seguridadDoc) => {
                                          const isTratamientoDatos = String(seguridadDoc.id) === '73';
                                          const foundDoc = Array.isArray(formData.documentosSeguridad)
                                          ? formData.documentosSeguridad.find(d => String(d.IdTipoDocumentacion) === String(seguridadDoc.id))
                                          : null;
                                          let hasFile = !!foundDoc;
                                          let accept = '.pdf,image/*';
                                          // Forzar que Tratamiento de datos siempre aparezca como adjuntado
                                          if (isTratamientoDatos) {
                                            hasFile = true;
                                          }
                                          return (
                                             <div key={seguridadDoc.id} className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm flex flex-col justify-between h-full group w-full max-w-xs min-w-[220px] flex-1">
                                                <div>
                                                   <h4 className="font-semibold text-gray-800 mb-3 text-sm leading-tight min-h-[40px]">{seguridadDoc.label}</h4>
                                                   <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium mb-4 border ${hasFile ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-100'}`}> 
                                                      {hasFile ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />} 
                                                      {hasFile ? 'Adjuntado' : 'Falta adjuntar'}
                                                   </div>
                                                </div>
                                                <div className="space-y-3">
                                                   {!hasFile && !isTratamientoDatos && (
                                                      <div className="flex gap-2">
                                                         <div className="relative flex-1">
                                                            <input 
                                                               type="file" 
                                                               id={`file-seguridad-${seguridadDoc.id}`} 
                                                               className="hidden" 
                                                               onChange={(e) => handleFileUpload(seguridadDoc.id, e)} 
                                                               accept={accept}
                                                            />
                                                            <label 
                                                               htmlFor={`file-seguridad-${seguridadDoc.id}`}
                                                               className="cursor-pointer flex items-center justify-center w-full px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                                            >
                                                               Cargar
                                                            </label>
                                                         </div>
                                                      </div>
                                                   )}
                                                   {hasFile && (
                                                   <div className="flex flex-col gap-2 w-full">
                                                      <Button 
                                                         type="button" 
                                                         variant="outline" 
                                                         size="sm"
                                                         className="text-sky-600 border-sky-200 hover:bg-sky-50 px-3 h-auto w-full"
                                                         onClick={() => handleVerDocumentoSeguridad(foundDoc, isTratamientoDatos)}
                                                      >
                                                         Ver
                                                      </Button>

                                                      <Button 
                                                         type="button" 
                                                         variant="outline" 
                                                         size="sm"
                                                         className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 px-3 h-auto w-full"
                                                         onClick={() => {
                                                            if (isTratamientoDatos) {
                                                               handleDescargarTratamientoDatos();
                                                            } else {
                                                               descargarDocumento(foundDoc);
                                                            }
                                                         }}
                                                      >
                                                         Descargar
                                                      </Button>

                                                      {!isTratamientoDatos && (
                                                      <Button 
                                                         type="button" 
                                                         variant="outline" 
                                                         size="sm"
                                                         className="text-red-600 border-red-200 hover:bg-red-50 px-3 h-auto w-full"
                                                         onClick={() => removeDocument(seguridadDoc.id)}
                                                      >
                                                         Eliminar
                                                      </Button>
                                                      )}
                                                   </div>
)}
                                                   <p className="text-xs text-gray-400 truncate h-4">
                                                      {hasFile && foundDoc && !isTratamientoDatos ? foundDoc.Nombre : (isTratamientoDatos ? 'Generado automáticamente' : 'Sin archivo')}
                                                   </p>
                                                </div>
                                             </div>
                                          );
                                       })}
                                    </div>
                                 </div>
                              </div>
                           </div>
                     </TabsContent>
                    <TabsContent value="entrevista" className="mt-0 space-y-6">
                       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                         {/* 8. Entrevista */}
                           <TabsContent value="entrevista" className="mt-0 space-y-6">
                           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                              <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">
                                 Gestión de Entrevista
                              </h3>

                              {/* Fila 1: Botón Registrar Información Entrevista */}
                              {!(formData?.entrevistas && formData.entrevistas.length > 0) && (
                                <div className="mb-6 flex justify-center">
                                   <Button
                                   onClick={handleAddEntrevista}
                                   className="w-full md:w-auto bg-white text-emerald-600 border border-emerald-600 hover:bg-emerald-50 shadow-sm"
                                   >
                                   <Plus className="w-4 h-4 mr-2" />
                                   Registrar Información de Entrevista
                                   </Button>
                                </div>
                              )}

                              {/* Fila 3: Historial de Entrevistas */}
                              <div className="mb-6">
                                 <h4 className="font-medium text-gray-700 mb-3">HISTORIAL DE ENTREVISTAS</h4>

                                 <div className="border rounded-lg overflow-hidden">
                                 <Table>
                                    <TableHeader>
                                       <TableRow className="bg-gray-50">
                                       <TableHead>FECHA</TableHead>
                                       <TableHead>CONCEPTO SELECCIÓN</TableHead>
                                       <TableHead>ENTREVISTADOR</TableHead>
                                       <TableHead className="text-right">ACCIONES</TableHead>
                                       </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                       {formData?.entrevistas && formData.entrevistas.length > 0 ? (
                                       formData.entrevistas.map((ent, idx) => (
                                          <TableRow key={idx}>
                                             <TableCell>{ent.FechaCreacion}</TableCell>
                                             <TableCell>
                                             <span
                                                className={cn(
                                                   "px-2 py-1 rounded-full text-xs font-semibold",
                                                    ent.ConceptoFinalSeleccion === "Aprobado"
                                                   ? "bg-green-100 text-green-700"
                                                   : ent.ConceptoFinalSeleccion === "Rechazado"
                                                   ? "bg-red-100 text-red-700"
                                                   : "bg-yellow-100 text-yellow-700"
                                                )}
                                             >
                                                {ent.ConceptoFinalSeleccion}
                                             </span>
                                             </TableCell>

                                             <TableCell>{ent.EntrevistadorPor}</TableCell>

                                             <TableCell className="text-right">
                                             <div className="flex justify-end gap-2">
                                                <Button
                                                   size="icon"
                                                   variant="ghost"
                                                   className="h-8 w-8"
                                                   onClick={() => handleEditEntrevista(ent, idx)}
                                                >
                                                   <Eye className="w-4 h-4 text-blue-500" />
                                                </Button>

                                                <Button
                                                   size="icon"
                                                   variant="ghost"
                                                   className="h-8 w-8"
                                                   onClick={() => handleRemoveEntrevista(idx)}
                                                >
                                                   <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                             </div>
                                             </TableCell>
                                          </TableRow>
                                       ))
                                       ) : (
                                       <TableRow>
                                          <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                             NO SE HAN REGISTRADO ENTREVISTAS AÚN.
                                          </TableCell>
                                       </TableRow>
                                       )}
                                    </TableBody>
                                 </Table>
                                 </div>
                              </div>
                              <Button
                                 type="button"
                                 size="sm"
                                 className="h-9 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
                                 onClick={() => {
  console.log('CLICK BOTON DESCARGAR ENTREVISTA');
  handleDescargarEntrevista();
}}
                                 style={{ marginTop: '1rem' }}
                              >
                                 Descargar entrevista
                              </Button>
                           </div>
                           </TabsContent>

                              {/* ✅✅✅ NUEVO BLOQUE: Asignación cargo y cliente (JUSTO AQUÍ, debajo del historial) */}
                           {/* <details className="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm"> */}
                             <summary className="cursor-pointer select-none list-none px-4 py-3 flex items-center justify-between">
                               <span className="font-semibold text-gray-800">Asignación cargo y cliente</span>
                               {/* <span className="text-xs text-gray-500">Clic para desplegar</span> */}
                             </summary>

                             <div className="px-4 pb-4 pt-2">
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                 <div className="space-y-2">
                                    <Label>Cargo</Label>
                                    <Select
                                       value={formData?.asignacionCargo?.IdCargo ? String(formData.asignacionCargo.IdCargo) : ''}
                                       onValueChange={v => {
                                          setFormData(prev => ({
                                             ...prev,
                                             asignacionCargo: {
                                                ...prev.asignacionCargo,
                                                IdCargo: parseInt(v, 10)
                                             }
                                          }));
                                       }}
                                    >
                                       <SelectTrigger>
                                          <SelectValue placeholder="Seleccionar..." />
                                       </SelectTrigger>
                                       <SelectContent className="max-h-60 overflow-y-auto">
                                          {listaCargo.length > 0
                                             ? listaCargo.map((item) => (
                                                   <SelectItem key={item.IdCargo} value={String(item.IdCargo)}>
                                                      {item.NombreCargo}
                                                   </SelectItem>
                                                ))
                                             : <div className="px-3 py-2 text-sm text-gray-500">Sin opciones</div>
                                          }
                                       </SelectContent>
                                    </Select>
                                 </div>
                                 {/* SALARIO (manual) */}
                                 <div className="space-y-2">
                                    <Label>Salario</Label>
                                    <Input
                                       value={formData?.asignacionCargo?.Salario || ""}
                                       inputMode="numeric"
                                       pattern="[0-9]*"
                                       placeholder="Ej: 1300000"
                                       onChange={(e) => {
                                          const onlyNums = (e.target.value || "").replace(/\D/g, "").slice(0, 9); // 👈 solo números (máx 9 dígitos)
                                          handleInputChange("asignacionCargo", "Salario", onlyNums);
                                       }}
                                    />
                                 </div>

                                 {/* CLIENTE (desplegable, pendiente lista) */}
                                 <div className="space-y-2">
                                   <Label>Cliente</Label>
                                    <Select
                                    value={formData?.asignacionCargo?.IdCliente ? String(formData.asignacionCargo.IdCliente) : ''}
                                    onValueChange={v => {
                                       setFormData(prev => ({
                                          ...prev,
                                          asignacionCargo: {
                                          ...prev.asignacionCargo,
                                          IdCliente: parseInt(v, 10)
                                          }
                                       }));
                                    }}
                                    onOpenChange={open => { if (!open) setClienteQuery(''); }}
                                    >
                                    <SelectTrigger className="bg-white border-gray-200">
                                       <SelectValue placeholder="Seleccionar cliente" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-72 overflow-y-auto">
                                       <div className="sticky top-0 z-10 bg-popover p-2 border-b">
                                          <Input
                                          value={clienteQuery}
                                          onChange={e => setClienteQuery(e.target.value)}
                                          placeholder="Buscar cliente..."
                                          className="h-9"
                                          />
                                       </div>
                                       {clientesFiltrados.length > 0 ? (
                                          clientesFiltrados.map((c) => (
                                          <SelectItem key={c.id} value={String(c.id)}>
                                             {c.name}
                                          </SelectItem>
                                          ))
                                       ) : (
                                          <div className="px-3 py-2 text-sm text-muted-foreground">
                                          Sin resultados
                                          </div>
                                       )}
                                    </SelectContent>
                                    </Select>
                                 </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    className="h-9 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
                                    onClick={handleGuardarAsignacionCargoCliente}
                                 >
                                    Guardar
                                 </Button>
                               </div>
                             </div>
                           {/* </details> */}
                           {/* CONTENEDOR: Estado del proceso general y motivo de cierre */}
                           <div className="mb-6 p-4 rounded-xl border border-emerald-200 flex flex-col gap-4" style={{ marginTop: '20px' }}>
                              <div>
                                 <Label className="mb-2">Estado del Proceso General</Label>
                                 <Select value={formData.estadoProceso} onValueChange={(v) => handleInputChange('root', 'estadoProceso', v)}>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar motivo" /></SelectTrigger>
                                    <SelectContent>
                                       <SelectItem value={18}>Nuevo</SelectItem>
                                       <SelectItem value={19}>Entrevista</SelectItem>
                                       <SelectItem value={20}>Entrevista Jefe Inmediato</SelectItem>
                                       <SelectItem value={21}>Exámenes</SelectItem>
                                       <SelectItem value={22}>Seguridad</SelectItem>
                                       <SelectItem value={24}>Avanza a Contratación</SelectItem>
                                       <SelectItem value={26}>Referenciación</SelectItem>
                                       <SelectItem value={27}>Desiste del Proceso</SelectItem>
                                       <SelectItem value={28}>Rechazado</SelectItem>
                                    </SelectContent>
                                 </Select>
                              </div>
                              {formData.estadoProceso?.toString() === '28' && (
                                 <div>
                                    <Label className="mb-2">Motivo (Cierre)</Label>
                                    <Select value={formData.entrevista.motivo} onValueChange={(v) => handleInputChange('entrevista', 'motivo', v)}>
                                       <SelectTrigger><SelectValue placeholder="Seleccionar motivo" /></SelectTrigger>
                                       <SelectContent>
                                          <SelectItem value="Desiste del Proceso">DESISTE DEL PROCESO</SelectItem>
                                          <SelectItem value="No Cumple Perfil">NO CUMPLE PERFIL</SelectItem>
                                          <SelectItem value="No asiste a Examenes Medicos">NO ASISTE A EXAMENES MEDICOS </SelectItem>
                                          <SelectItem value="Exámenes No Aptos">EXÁMENES NO APTOS</SelectItem>
                                          <SelectItem value="Documentación Incompleta">DOCUMENTACIÓN INCOMPLETA</SelectItem>
                                          <SelectItem value="No asiste a Contratación">NO ASISTE A CONTRATACIÓN</SelectItem>
                                       </SelectContent>
                                    </Select>
                                 </div>
                              )}
                              <div className="flex justify-end">
                                 <Button type="button" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleActualizarEstadoProceso}>
                                    Actualizar Estado Proceso
                                 </Button>
                              </div>
                           </div>
                       </div>
                    </TabsContent>
                 </div>
              </ScrollArea>
           </Tabs>
        </div>
      </DialogContent>
    </Dialog>


    {/* Modal Observaciones - Experiencia Laboral */}
    <Dialog open={obsRefLabOpen} onOpenChange={setObsRefLabOpen}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Observaciones - Experiencia Laboral</DialogTitle>
          <DialogDescription>
            Notas internas de selección (independientes de la validación).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Observaciones</Label>
          <Textarea
            value={obsRefLabText}
            onChange={(e) => setObsRefLabText(e.target.value)}
            placeholder="Escribe acá las observaciones..."
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setObsRefLabOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={async () => {
               if (selectedRefLabIdx === null || selectedRefLabIdx === undefined) return;
                  setFormData(prev => {
                     const next = [...(prev.referenciasLaborales || [])];
                     const current = next[selectedRefLabIdx] || {};
                     next[selectedRefLabIdx] = {
                        ...current,
                        observacionesInternas: obsRefLabText,
                        fechaObservacion: new Date().toISOString().split('T')[0],
                     };
                     return { ...prev, referenciasLaborales: next };
                  });
                  await handelObservacionesExperienciaLaboral();
                  setObsRefLabOpen(false);
                  setSelectedRefLabIdx(null);
               }}
            >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Nested Entrevista Modal */}
    <EntrevistaModal 
        isOpen={entrevistaModalOpen} 
        onClose={() => setEntrevistaModalOpen(false)} 
        onSave={handleSaveEntrevista} 
        aspirante={formData}
        existingData={selectedEntrevista}
    />
    </>
  );
};
export default AspiranteDetailModal;