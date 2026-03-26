import React, { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* =========================================================
   ✅ LISTA REAL DE CLIENTES (pegada en el mismo archivo)
========================================================= */
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
];

/* =========================================================
   ✅ MOTIVOS -> ID (NECESARIO para PUT IdMotivoRetiro)
========================================================= */
const MOTIVO_ID_MAP = {
  "RETIRO VOLUNTARIO": 1,
  "TERMINACIÓN DE CONTRATO CON JUSTA CAUSA/ABANDONO DE CARGO": 2,
  "TERMINACIÓN DE CONTRATO SIN JUSTA CAUSA": 3,
  "TERMINACIÓN DE CONTRATO CON JUSTA CAUSA": 4,
  "TERMINACIÓN DE CONTRATO PERIODO DE PRUEBA": 5,
  "TERMINACIÓN DE CONTRATO OBRA LABOR": 6,
  "TERMINACIÓN DE CONTRATO DE APRENDIZAJE": 7,
  "MUERTE DEL COLABORADOR": 8,
  "MUTUO ACUERDO": 9,
  "NUNCA INGRESÓ": 10,
  "ACUERDO TRANSACCIONAL": 11,
};

const MOTIVO_NAME_BY_ID = {
  1: "RETIRO VOLUNTARIO",
  2: "TERMINACIÓN DE CONTRATO CON JUSTA CAUSA/ABANDONO DE CARGO",
  3: "TERMINACIÓN DE CONTRATO SIN JUSTA CAUSA",
  4: "TERMINACIÓN DE CONTRATO CON JUSTA CAUSA",
  5: "TERMINACIÓN DE CONTRATO PERIODO DE PRUEBA",
  6: "TERMINACIÓN DE CONTRATO OBRA LABOR",
  7: "TERMINACIÓN DE CONTRATO DE APRENDIZAJE",
  8: "MUERTE DEL COLABORADOR",
  9: "MUTUO ACUERDO",
  10: "NUNCA INGRESÓ",
  11: "ACUERDO TRANSACCIONAL",
};

/* =========================================================
   ✅ TIPIFICACIONES (PENDIENTE)
========================================================= */
const TIPIFICACIONES_RETIRO = [
  { id: 1, label: "ABANDONO" },
  { id: 2, label: "FALLECIMIENTO" },
  { id: 3, label: "FINALIZACIÓN DE CONTRATO APRENDIZAJE" },
  { id: 4, label: "JORNADAS LABORALES EXTENSAS" },
  { id: 5, label: "MALA RELACIÓN ENTRE COMPAÑEROS" },
  { id: 6, label: "MANEJO DE PROCEDIMIENTOS COMPLEJOS" },
  { id: 7, label: "MEJOR OFERTA LABORAL" },
  { id: 8, label: "MOTIVOS PERSONALES" },
  { id: 9, label: "MOTIVOS PERSONALES - VIAJES" },
  { id: 10, label: "NO DESCANSO DOMINICAL" },
  { id: 11, label: "NORMAS Y POLÍTICAS ALP" },
  { id: 12, label: "NUNCA INGRESO" },
  { id: 13, label: "PROGRAMACIÓN NO OPORTUNA" },
  { id: 14, label: "SEDE ASIGNADA MUY LEJOS" },
  { id: 15, label: "TERMINACIÓN CONTRATO (JUSTA CAUSA)" },
  { id: 16, label: "TERMINACIÓN DE CONTRATO (PERIODO DE PRUEBA)" },
  { id: 17, label: "TERMINACIÓN DE CONTRATO MUTUO ACUERDO" },
  { id: 18, label: "TERMINACIÓN CONTRATO OBRA LABOR" },
  { id: 19, label: "TRATO DE LA SUPERVISIÓN" },
];


const TIPO_DOCUMENTO_RETIRO = [
  { id: 1, nombre: "CARTA DE RENUNCIA", tipo: "ADJUNTABLE" },
  { id: 2, nombre: "PAZ Y SALVO", tipo: "VIEW_ONLY" },
  { id: 3, nombre: "ACTA DE ENTREGA DE CARNET", tipo: "ADJUNTABLE" },
  { id: 4, nombre: "CARTA DE FINALIZACIÓN DEL CONTRATO", tipo: "GENERADO" },
  { id: 5, nombre: "EDICTO", tipo: "GENERADO" },
  { id: 6, nombre: "DOCUMENTOS BENEFICIARIOS", tipo: "ADJUNTABLE" },
  { id: 7, nombre: "ACTA DE MUTUO ACUERDO", tipo: "GENERADO" },
  { id: 8, nombre: "ACTA O EVIDENCIA DE NO INGRESO", tipo: "ADJUNTABLE" },
  { id: 9, nombre: "OTROS SOPORTES", tipo: "ADJUNTABLE" },
  { id: 10, nombre: "PAQUETE DE RETIRO", tipo: "PAQUETE" },
  { id: 11, nombre: "EVIDENCIA PRIMER LLAMADO", tipo: "ADJUNTABLE" },
  { id: 12, nombre: "EVIDENCIA SEGUNDO LLAMADO", tipo: "ADJUNTABLE" },
  { id: 13, nombre: "PRIMER LLAMADO ABANDONO INASISTENCIA AL CARGO", tipo: "GENERADO" },
  { id: 14, nombre: "SEGUNDO LLAMADO ABANDONO INASISTENCIA AL CARGO", tipo: "GENERADO" },
];
/* =========================================================
   ✅ REQUISITOS POR MOTIVO (ESTRUCTURA UNIFICADA)
========================================================= */
const REQUISITOS_POR_MOTIVO = {
  "RETIRO VOLUNTARIO": [
    { label: "PAZ Y SALVO", tipo: "VIEW_ONLY", idTipoDocumentoRetiro: 2 },
    { label: "CARTA DE RENUNCIA", tipo: "ADJUNTABLE", idTipoDocumentoRetiro: 1 },
    { label: "DEVOLUCIÓN CARNET", tipo: "SI/NO" },
    {
      label: "ACTA CARNET",
      tipo: "ADJUNTABLE",
      idTipoDocumentoRetiro: 3,
      showIf: { label: "DEVOLUCIÓN CARNET", equals: "NO" },
    },
    { label: "PAQUETE DE RETIRO", tipo: "PAQUETE", idTipoDocumentoRetiro: 10 },
    { label: "OBSERVACIONES", tipo: "ESCRIBIR" },
  ],

  "TERMINACIÓN DE CONTRATO CON JUSTA CAUSA/ABANDONO DE CARGO": [
    { label: "PAZ Y SALVO", tipo: "VIEW_ONLY", idTipoDocumentoRetiro: 2 },
    {
      label: "PRIMER LLAMADO ABANDONO INASISTENCIA AL CARGO",
      tipo: "GENERADO",
      idTipoDocumentoRetiro: 13,
    },
    {
      label: "SEGUNDO LLAMADO ABANDONO INASISTENCIA AL CARGO",
      tipo: "GENERADO",
      idTipoDocumentoRetiro: 14,
    },
    {
      label: "CARTA DE FINALIZACIÓN DEL CONTRATO",
      tipo: "GENERADO",
      idTipoDocumentoRetiro: 4,
    },
    {
      label: "EVIDENCIA PRIMER LLAMADO",
      tipo: "ADJUNTABLE",
      idTipoDocumentoRetiro: 11,
    },
    {
      label: "EVIDENCIA SEGUNDO LLAMADO",
      tipo: "ADJUNTABLE",
      idTipoDocumentoRetiro: 12,
    },
    { label: "PAQUETE DE RETIRO", tipo: "PAQUETE", idTipoDocumentoRetiro: 10 },
    { label: "OBSERVACIONES", tipo: "ESCRIBIR" },
  ],

  "TERMINACIÓN DE CONTRATO CON JUSTA CAUSA": [
    { label: "PAZ Y SALVO", tipo: "VIEW_ONLY", idTipoDocumentoRetiro: 2 },
    {
      label: "CARTA DE FINALIZACIÓN DEL CONTRATO",
      tipo: "ADJUNTABLE",
      idTipoDocumentoRetiro: 4,
    },
    { label: "DEVOLUCIÓN CARNET", tipo: "SI/NO" },
    {
      label: "ACTA CARNET",
      tipo: "ADJUNTABLE",
      idTipoDocumentoRetiro: 3,
      showIf: { label: "DEVOLUCIÓN CARNET", equals: "NO" },
    },
    { label: "PAQUETE DE RETIRO", tipo: "PAQUETE", idTipoDocumentoRetiro: 10 },
    { label: "OBSERVACIONES", tipo: "ESCRIBIR" },
  ],

  "TERMINACIÓN DE CONTRATO SIN JUSTA CAUSA": [
    { label: "PAZ Y SALVO", tipo: "VIEW_ONLY", idTipoDocumentoRetiro: 2 },
    {
      label: "CARTA DE FINALIZACIÓN DEL CONTRATO",
      tipo: "ADJUNTABLE",
      idTipoDocumentoRetiro: 4,
    },
    { label: "DEVOLUCIÓN CARNET", tipo: "SI/NO" },
    {
      label: "ACTA CARNET",
      tipo: "ADJUNTABLE",
      idTipoDocumentoRetiro: 3,
      showIf: { label: "DEVOLUCIÓN CARNET", equals: "NO" },
    },
    { label: "PAQUETE DE RETIRO", tipo: "PAQUETE", idTipoDocumentoRetiro: 10 },
    { label: "OBSERVACIONES", tipo: "ESCRIBIR" },
  ],

  "TERMINACIÓN DE CONTRATO PERIODO DE PRUEBA": [
    { label: "PAZ Y SALVO", tipo: "VIEW_ONLY", idTipoDocumentoRetiro: 2 },
    {
      label: "CARTA DE FINALIZACIÓN DEL CONTRATO",
      tipo: "ADJUNTABLE",
      idTipoDocumentoRetiro: 4,
    },
    { label: "DEVOLUCIÓN CARNET", tipo: "SI/NO" },
    {
      label: "ACTA CARNET",
      tipo: "ADJUNTABLE",
      idTipoDocumentoRetiro: 3,
      showIf: { label: "DEVOLUCIÓN CARNET", equals: "NO" },
    },
    { label: "PAQUETE DE RETIRO", tipo: "PAQUETE", idTipoDocumentoRetiro: 10 },
    { label: "OBSERVACIONES", tipo: "ESCRIBIR" },
  ],

  "TERMINACIÓN DE CONTRATO OBRA LABOR": [
    { label: "PAZ Y SALVO", tipo: "VIEW_ONLY", idTipoDocumentoRetiro: 2 },
    {
      label: "CARTA DE FINALIZACIÓN DEL CONTRATO",
      tipo: "ADJUNTABLE",
      idTipoDocumentoRetiro: 4,
    },
    { label: "DEVOLUCIÓN CARNET", tipo: "SI/NO" },
    {
      label: "ACTA CARNET",
      tipo: "ADJUNTABLE",
      idTipoDocumentoRetiro: 3,
      showIf: { label: "DEVOLUCIÓN CARNET", equals: "NO" },
    },
    { label: "PAQUETE DE RETIRO", tipo: "PAQUETE", idTipoDocumentoRetiro: 10 },
    { label: "OBSERVACIONES", tipo: "ESCRIBIR" },
  ],

  "TERMINACIÓN DE CONTRATO DE APRENDIZAJE": [
    { label: "PAZ Y SALVO", tipo: "VIEW_ONLY", idTipoDocumentoRetiro: 2 },
    {
      label: "CARTA DE FINALIZACIÓN DEL CONTRATO",
      tipo: "ADJUNTABLE",
      idTipoDocumentoRetiro: 4,
    },
    { label: "DEVOLUCIÓN CARNET", tipo: "SI/NO" },
    {
      label: "ACTA CARNET",
      tipo: "ADJUNTABLE",
      idTipoDocumentoRetiro: 3,
      showIf: { label: "DEVOLUCIÓN CARNET", equals: "NO" },
    },
    { label: "PAQUETE DE RETIRO", tipo: "PAQUETE", idTipoDocumentoRetiro: 10 },
    { label: "OBSERVACIONES", tipo: "ESCRIBIR" },
  ],

  "MUERTE DEL COLABORADOR": [
    { label: "PAZ Y SALVO", tipo: "VIEW_ONLY", idTipoDocumentoRetiro: 2 },
    { label: "EDICTO", tipo: "ADJUNTABLE", idTipoDocumentoRetiro: 5 },
    {
      label: "DOCUMENTOS BENEFICIARIOS",
      tipo: "ADJUNTABLE",
      idTipoDocumentoRetiro: 6,
    },
    { label: "PAQUETE DE RETIRO", tipo: "PAQUETE", idTipoDocumentoRetiro: 10 },
  ],

  "MUTUO ACUERDO": [
    { label: "PAZ Y SALVO", tipo: "VIEW_ONLY", idTipoDocumentoRetiro: 2 },
    {
      label: "ACTA DE MUTUO ACUERDO",
      tipo: "ADJUNTABLE",
      idTipoDocumentoRetiro: 7,
    },
    { label: "DEVOLUCIÓN CARNET", tipo: "SI/NO" },
    {
      label: "ACTA CARNET",
      tipo: "ADJUNTABLE",
      idTipoDocumentoRetiro: 3,
      showIf: { label: "DEVOLUCIÓN CARNET", equals: "NO" },
    },
    { label: "PAQUETE DE RETIRO", tipo: "PAQUETE", idTipoDocumentoRetiro: 10 },
    { label: "OBSERVACIONES", tipo: "ESCRIBIR" },
    ],
    "NUNCA INGRESÓ": [
      {
        label: "ACTA O EVIDENCIA DE NO INGRESO",
        tipo: "ADJUNTABLE",
        idTipoDocumentoRetiro: 8,
      },
      { label: "OBSERVACIONES", tipo: "ESCRIBIR" },
    ],


  "ACUERDO TRANSACCIONAL": [
    { label: "PAZ Y SALVO", tipo: "VIEW_ONLY", idTipoDocumentoRetiro: 2 },
    {
      label: "ACTA DE MUTUO ACUERDO",
      tipo: "ADJUNTABLE",
      idTipoDocumentoRetiro: 7,
    },
    { label: "DEVOLUCIÓN CARNET", tipo: "SI/NO" },
    {
      label: "ACTA CARNET",
      tipo: "ADJUNTABLE",
      idTipoDocumentoRetiro: 3,
      showIf: { label: "DEVOLUCIÓN CARNET", equals: "NO" },
    },
    { label: "PAQUETE DE RETIRO", tipo: "PAQUETE", idTipoDocumentoRetiro: 10 },
    { label: "OBSERVACIONES", tipo: "ESCRIBIR" },
  ],
};
function pretty(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/(^|\s)\S/g, (t) => t.toUpperCase());
}

function keyFromLabel(label) {
  return String(label || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/* =========================================================
   ✅ FIX CLAVE: toDateInput (ANTES NO EXISTÍA y rompía la carga)
   Convierte cualquier fecha a formato YYYY-MM-DD para inputs type="date"
========================================================= */
function toDateInput(value) {
  if (!value) return "";

  // Si ya viene como "YYYY-MM-DD"
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";

    // toISOString => "YYYY-MM-DDTHH:mm:ss.sssZ"
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

// ✅ descarga local del archivo seleccionado (UI)
function downloadLocalFile(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name || "archivo";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ✅ ver archivo local en otra pestaña (UI)
function viewLocalFile(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function viewBackendAdjunto(apiBase, file) {
  if (!file?.IdRetiroLaboralAdjunto) return;
  const url = `${apiBase}/rrll/adjuntos/${file.IdRetiroLaboralAdjunto}/descargar`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function downloadBackendAdjunto(apiBase, file) {
  if (!file?.IdRetiroLaboralAdjunto) return;
  const url = `${apiBase}/rrll/adjuntos/${file.IdRetiroLaboralAdjunto}/descargar`;

  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function RelacionesLaboralesView() {
  // ✅ lee tu .env (debe ser: http://localhost:8000/api)
  const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  const API_BASE_ENTREVISTA = API_BASE.replace(/\/api$/, "");

  const [step, setStep] = useState("inicio");

  const [fechaInicioExcel, setFechaInicioExcel] = useState("");
  const [fechaFinExcel, setFechaFinExcel] = useState("");

  // ✅ filtros
  const [filtroTipoDocumento, setFiltroTipoDocumento] = useState("CC");
  const [filtroDocumento, setFiltroDocumento] = useState("");

  // ✅ estados UX
  const [loadingBuscar, setLoadingBuscar] = useState(false);
  const [errorBuscar, setErrorBuscar] = useState("");

  // ✅ NUEVO (solo UX del botón actualizar)
  const [loadingActualizar, setLoadingActualizar] = useState(false);
  const [msgActualizar, setMsgActualizar] = useState("");

  const [form, setForm] = useState({
  // ids para luego POST/PUT retiro
  idRegistroPersonal: null,
  idCliente: null,

  // ✅ NUEVO: para poder hacer PUT
  idRetiroLaboral: null,
  idMotivoRetiro: null,

  fechaProceso: "",
  tipoId: "",
  numeroDocumento: "",
  nombre: "",
  cargo: "",
  direccionResidencia: "",
  barrio: "",
  telefono: "",
  correo: "",
  fechaInicio: "",
  fechaFinal: "",
  fechaEnvioOperaciones: "",
  fechaCierreProceso: "",
  motivoRetiro: "",
  cliente: "",
});

  const [adjuntos, setAdjuntos] = useState({});
  const [observaciones, setObservaciones] = useState({});
  const [checks, setChecks] = useState({});

  const [adjuntosBackend, setAdjuntosBackend] = useState({});
  const [loadingAdjuntosBackend, setLoadingAdjuntosBackend] = useState(false);

  const [entrevistaRetiroData, setEntrevistaRetiroData] = useState(null);
  const [loadingEntrevistaRetiro, setLoadingEntrevistaRetiro] = useState(false);

  const [qrEntrevistaInfo, setQrEntrevistaInfo] = useState({
  open: false,
  link: "",
  mensaje: "",
});

const [mensajeEntrevista, setMensajeEntrevista] = useState({
  tipo: "",
  texto: "",
});

  const motivos = useMemo(() => Object.keys(REQUISITOS_POR_MOTIVO), []);
  const tiposId = useMemo(() => ["CC", "CE", "TI", "PPT"], []);

  const handleDescargarExcel = async () => {
  try {
    if (!fechaInicioExcel || !fechaFinExcel) {
      alert("Debes seleccionar la fecha de inicio y la fecha final.");
      return;
    }

    if (fechaInicioExcel > fechaFinExcel) {
      alert("La fecha de inicio no puede ser mayor que la fecha final.");
      return;
    }

    const url = `http://127.0.0.1:8000/api/rrll-excel/exportar-retiros?fecha_inicio=${fechaInicioExcel}&fecha_fin=${fechaFinExcel}`;

    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "No se pudo descargar el archivo Excel.");
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `reporte_retiros_rrll_${fechaInicioExcel}_a_${fechaFinExcel}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error("Error al descargar Excel:", error);
    alert("Ocurrió un error al descargar el Excel.");
  }
};

  // ✅ Estado general del caso (solo visual por ahora)
  const [estadoProceso, setEstadoProceso] = useState("ABIERTO"); // ABIERTO | CERRADO
  
  const [ownerProceso, setOwnerProceso] = useState("RRLL"); // RRLL | NOMINA
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("ABIERTO");

  // ✅ Tipificación retiro (pendiente lista)
  const [tipificacionRetiro, setTipificacionRetiro] = useState("");
  const [retiroLegalizado, setRetiroLegalizado] = useState("");

  const [motivoPersistidoId, setMotivoPersistidoId] = useState(null);

  // ✅ Clientes reales (alfabético + sin duplicados)
  const clientes = useMemo(() => {
    const nombres = (clientesALP || [])
      .map((x) => (x?.name ?? "").trim())
      .filter(Boolean);

    const unicos = Array.from(new Set(nombres));

    return unicos.sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    );
  }, []);

  // ✅ helper: obtener IdCliente desde el nombre seleccionado
  const getClienteIdByName = (nombreCliente) => {
    const n = String(nombreCliente || "").trim();
    const found = (clientesALP || []).find(
      (x) => String(x?.name || "").trim() === n
    );
    return found?.id ?? null;
  };

  const getClienteNameById = (idCliente) => {
  const nId = Number(idCliente);

  const foundEnClientesALP = (clientesALP || []).find(
    (x) => Number(x?.id) === nId
  );
  if (foundEnClientesALP?.name) return String(foundEnClientesALP.name).trim();

  

  const foundEnClientes = (clientes || []).find((x) => {
    if (typeof x === "object" && x !== null) {
      return Number(x?.id ?? x?.IdCliente) === nId;
    }
    return false;
  });

  if (foundEnClientes) {
    if (typeof foundEnClientes === "object") {
      return String(
        foundEnClientes?.name ??
        foundEnClientes?.Nombre ??
        foundEnClientes?.cliente ??
        ""
      ).trim();
    }
  }

  return "";
};

const getMotivoValueById = (idMotivo) => {
  const nId = Number(idMotivo);
  const found = (motivos || []).find((m) => Number(MOTIVO_ID_MAP[m]) === nId);
  return found || "";
};
  // ✅ motivos donde NO va entrevista
  const EXCLUIR_ENTREVISTA_POR_MOTIVO = useMemo(
    () =>
      new Set([
        "TERMINACIÓN DE CONTRATO CON JUSTA CAUSA/ABANDONO DE CARGO",
        "MUERTE DEL COLABORADOR",
        "NUNCA INGRESÓ",
      ]),
    []
  );

  const requisitosActuales = useMemo(() => {
    if (!form.motivoRetiro) return [];
    const base = REQUISITOS_POR_MOTIVO[form.motivoRetiro] || [];

    const shouldAddEntrevista = !EXCLUIR_ENTREVISTA_POR_MOTIVO.has(
      form.motivoRetiro
    );

    const all = (() => {
      if (!shouldAddEntrevista) return [...base];

      const entrevistaReq = { label: "ENTREVISTA DE RETIRO", tipo: "ENTREVISTA" };
      const tipificacionReq = {
        label: "TIPIFICACIÓN DE RETIRO",
        tipo: "TIPIFICACION",
      };

      const retiroLegalizadoReq = {
        label: "RETIRO LEGALIZADO",
        tipo: "RETIRO_LEGALIZADO",
      };

      const idxObs = base.findIndex(
        (x) =>
          String(x?.tipo).toUpperCase() === "ESCRIBIR" &&
          String(x?.label).toUpperCase().includes("OBSERV")
      );

      if (idxObs >= 0) {
  return [
    ...base.slice(0, idxObs),
    entrevistaReq,
    tipificacionReq,
    retiroLegalizadoReq,
    ...base.slice(idxObs),
  ];
}

      return [...base, entrevistaReq, tipificacionReq];
    })();

    return all.map((r) => {
      const key = keyFromLabel(`${form.motivoRetiro}_${r.label}`);
      const showIfKey = r.showIf?.label
        ? keyFromLabel(`${form.motivoRetiro}_${r.showIf.label}`)
        : null;

      return {
        ...r,
        key,
        showIfKey,
        labelPretty: pretty(r.label),
      };
    });
  }, [form.motivoRetiro, EXCLUIR_ENTREVISTA_POR_MOTIVO]);

  // ✅ BOTÓN BUSCAR: pega al backend y recarga cabecera
  const handleBuscar = async () => {
    try {
      setErrorBuscar("");
      setMsgActualizar("");

      const tipo = (filtroTipoDocumento || "").trim().toUpperCase();
      const numero = (filtroDocumento || "").trim();

      if (!tipo || !numero) {
        setErrorBuscar("Debe seleccionar tipo_documento y escribir numero_documento.");
        return;
      }

      if (!API_BASE) {
        setErrorBuscar("No se encontró VITE_API_BASE_URL en el .env");
        return;
      }

      setLoadingBuscar(true);

      const url =
        `${API_BASE}/rrll/trabajador/detalle` +
        `?tipo_documento=${encodeURIComponent(tipo)}` +
        `&numero_documento=${encodeURIComponent(numero)}`;

      console.log("URL BUSCAR TRABAJADOR =>", url);
      console.log("TIPO =>", tipo, "NUMERO =>", numero);

      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      console.log("STATUS =>", res.status);
      const raw = await res.text().catch(() => "");
      console.log("RESPUESTA RAW =>", raw);

            if (!res.ok) {
        throw new Error(raw || `Error consultando trabajador (${res.status})`);
      }

      

      const data = raw ? JSON.parse(raw) : {};
      console.log("DATA PARSEADA =>", data);

      let detalleRetiroBusqueda = null;

      if (data?.IdRetiroLaboral) {
        try {
          const respDetalle = await consultarDetalleRetiroBackend(data.IdRetiroLaboral);
          detalleRetiroBusqueda = respDetalle?.data ?? null;
          console.log("DETALLE RETIRO BUSQUEDA =>", detalleRetiroBusqueda);
        } catch (err) {
          console.error("No se pudo consultar detalle del retiro en búsqueda:", err);
        }
      }

      // ✅ consultar retiro activo para traer IdRetiroLaboral, IdMotivoRetiro y FechaRetiro
      let retiroActivo = null;
      try {
        const rpId = data?.IdRegistroPersonal ?? null;
        if (rpId) {
          const r2 = await fetch(`${API_BASE}/rrll/retiro/activo/${rpId}`, {
            method: "GET",
            headers: { Accept: "application/json" },
          });
          if (r2.ok) {
            retiroActivo = await r2.json();
          }
        }

        console.log("RETIRO ACTIVO =>", retiroActivo);
        console.log("ESTADO RRLL DESDE ACTIVO =>", retiroActivo?.retiro?.EstadoCasoRRLL || retiroActivo?.EstadoCasoRRLL);

        const data = raw ? JSON.parse(raw) : null;
        console.log("DATA PARSEADA =>", data);
        console.log("PAZ Y SALVO =>", data?.PazYSalvo ?? data?.pazYSalvo ?? data?.paz_y_salvo);
        console.log("FechaUltimoDiaLaborado =>",
          data?.FechaUltimoDiaLaborado,
          data?.fechaUltimoDiaLaborado,
          data?.PazYSalvo?.FechaUltimoDiaLaborado,
          data?.pazYSalvo?.FechaUltimoDiaLaborado
        );
      } catch (e) {
        // silencioso para no romper nada
      }

      // ✅ IMPORTANTE: tu backend devuelve { tieneRetiroActivo, retiro: {...} }
      const retiroDb = retiroActivo?.retiro ?? null;

      // ✅ tu backend envía { tieneRetiroActivo, retiro: {...} }
      const retiroObj = retiroActivo?.retiro ?? retiroActivo;

      const estadoRecuperadoBusqueda = String(
        detalleRetiroBusqueda?.EstadoCasoRRLL ||
        retiroDb?.EstadoCasoRRLL ||
        retiroObj?.EstadoCasoRRLL ||
        ""
      ).toUpperCase();

      if (
        estadoRecuperadoBusqueda === "CERRADO" ||
        estadoRecuperadoBusqueda === "ABIERTO"
      ) {
        setEstadoProceso(estadoRecuperadoBusqueda);
        setEstadoSeleccionado(estadoRecuperadoBusqueda);
        setOwnerProceso(
          estadoRecuperadoBusqueda === "CERRADO" ? "NOMINA" : "RRLL"
        );
      } else {
        setEstadoProceso("ABIERTO");
        setEstadoSeleccionado("ABIERTO");
        setOwnerProceso("RRLL");
      }

      // ✅ Fecha final: prioridad 1 = RRLL (FechaRetiro), prioridad 2 = Paz y Salvo (Operaciones)
      const fechaFinalFromBackend =
        toDateInput(retiroObj?.FechaRetiro) ||
        toDateInput(data?.FechaUltimoDiaLaborado) ||
        toDateInput(data?.fechaUltimoDiaLaborado) ||
        toDateInput(data?.PazYSalvo?.FechaUltimoDiaLaborado) ||
        toDateInput(data?.pazYSalvo?.FechaUltimoDiaLaborado) ||
        toDateInput(retiroObj?.FechaUltimoDiaLaborado) ||
        toDateInput(retiroObj?.fechaUltimoDiaLaborado) ||
        toDateInput(retiroObj?.fecha_ultimo_dia_laborado) ||
        "";

      const fechaProcesoFromBackend =
        toDateInput(retiroDb?.FechaProceso || data?.FechaProceso) || "";

      const clienteIdDb = retiroDb?.IdCliente ?? null;
      const motivoIdDb =
        detalleRetiroBusqueda?.IdMotivoRetiro ??
        retiroDb?.IdMotivoRetiro ??
        data?.IdMotivoRetiro ??
        null;

        setMotivoPersistidoId(motivoIdDb ?? null);

      const clienteNombreDb = clienteIdDb ? getClienteNameById(clienteIdDb) : "";

      const motivoVisualFinal =
        String(data?.MotivoRetiroNombre || "").trim() ||
        getMotivoValueById(motivoIdDb) ||
        "";
        console.log("ANTES DE SETFORM", data);
         setForm((prev) => {
      const clienteIdFinal = retiroDb?.IdCliente ?? data?.IdCliente ?? prev.idCliente ?? null;

      const clienteNombreFinal =
        (clienteIdFinal ? getClienteNameById(clienteIdFinal) : "") ||
        String(data?.ClienteNombre || "").replace(/\s+/g, " ").trim() ||
        prev.cliente ||
        "";

      return {
        ...prev,
        idRegistroPersonal: data?.IdRegistroPersonal ?? null,
        idRetiroLaboral:
        detalleRetiroBusqueda?.IdRetiroLaboral ??
        retiroDb?.IdRetiroLaboral ??
        data?.IdRetiroLaboral ??
        prev.idRetiroLaboral ??
        null,

        idCliente: clienteIdFinal,
        cliente: clienteNombreFinal,

        idMotivoRetiro: motivoIdDb ?? prev.idMotivoRetiro ?? null,
        motivoRetiro: motivoVisualFinal || prev.motivoRetiro || "",

        fechaFinal: fechaFinalFromBackend || "",
        fechaProceso: fechaProcesoFromBackend || prev.fechaProceso || "",
        fechaCierreProceso: toDateInput(retiroDb?.FechaCierre || data?.FechaCierre) || "",

        tipoId: tipo,
        numeroDocumento: data?.NumeroDocumento ?? numero,

        nombre:
          data?.NombreCompleto ||
          `${data?.Nombres ?? ""} ${data?.Apellidos ?? ""}`.trim() ||
          "—",

        cargo: data?.Cargo ?? "—",
        direccionResidencia: data?.Direccion ?? "—",
        barrio: data?.Barrio ?? "—",
        telefono: data?.Telefono ?? "—",
        correo: data?.Correo ?? "—",

        fechaInicio: toDateInput(data?.FechaInicio),
      };
    });

      setTipificacionRetiro(
      detalleRetiroBusqueda?.IdTipificacionRetiro != null
        ? String(detalleRetiroBusqueda.IdTipificacionRetiro)
        : data?.IdTipificacionRetiro != null
        ? String(data.IdTipificacionRetiro)
        : ""
    );

    const valorRetiroLegalizado =
      detalleRetiroBusqueda?.RetiroLegalizado ??
      retiroDb?.RetiroLegalizado ??
      data?.RetiroLegalizado ??
      "";

    setRetiroLegalizado(valorRetiroLegalizado);

    setObservaciones((prev) => ({
      ...prev,
      [keyFromLabel(`${motivoVisualFinal || ""}_OBSERVACIONES`)]:
        detalleRetiroBusqueda?.ObservacionRetiro ||
        retiroDb?.ObservacionRetiro ||
        "",
    }));

    setChecks((prev) => ({
      ...prev,
      [keyFromLabel(`${motivoVisualFinal || ""}_DEVOLUCIÓN CARNET`)]:
        detalleRetiroBusqueda?.DevolucionCarnet === true
          ? "SI"
          : detalleRetiroBusqueda?.DevolucionCarnet === false
          ? "NO"
          : retiroDb?.DevolucionCarnet === true
          ? "SI"
          : retiroDb?.DevolucionCarnet === false
          ? "NO"
          : "",
    }));
          console.log("DESPUÉS DE SETFORM");
        } catch (e) {
          console.error("💥 ERROR handleBuscar =>", e);

          // ✅ MUY IMPORTANTE: muestra el error real para no quedar “a ciegas”
          setErrorBuscar(
            e?.message?.includes("No se encontró")
              ? e.message
              : (e?.message || "No se pudo cargar el trabajador. Verifica documento o el backend.")
          );
        } finally {
          setLoadingBuscar(false);
        }
      };

      // ✅ Mantengo tu comportamiento: seleccionar motivo abre docs,
      // pero ahora también guardamos idMotivoRetiro para el PUT.
        const handleSelectMotivo = async (value) => {
  try {
    if (retiroBloqueado) return;

    const id = MOTIVO_ID_MAP[value] ?? null;
    const cambioDeMotivo = String(form.motivoRetiro || "") !== String(value || "");

    // ✅ Si cambió de motivo, limpiar TODO lo visible del motivo anterior
    if (cambioDeMotivo) {
      setAdjuntos({});
      setAdjuntosBackend({});
      setObservaciones({});
      setChecks({});
      setTipificacionRetiro("");
      setMsgActualizar("");
    }

    // ✅ Actualizar motivo en pantalla
    setForm((p) => ({
      ...p,
      motivoRetiro: value,
      idMotivoRetiro: id,
    }));

    // ✅ Si no existe retiro todavía, lo aseguramos
    let idRetiro = form.idRetiroLaboral;

    if (!idRetiro) {
      idRetiro = await asegurarRetiroActivo();
    }

    // ✅ Ir a documentos con el nuevo motivo
    if (idRetiro || form.idRetiroLaboral) {
      setStep("retiros_docs");
    }
  } catch (error) {
    console.error("Error cambiando motivo de retiro:", error);
    setMsgActualizar(error?.message || "No se pudo cambiar el motivo de retiro.");
  }
};

    // ✅ NUEVO: volver/ir a la vista de documentos del retiro actual
        const abrirVistaDocumentos = async (idRetiro) => {
        // si no viene idRetiro, intentamos asegurarlo (GET/POST)
        let finalId = idRetiro || form?.idRetiroLaboral || null;

        if (!finalId) {
          finalId = await asegurarRetiroActivo();
        }

        if (!finalId) {
          setMsgActualizar("⚠️ Aún no hay un retiro activo. Presiona Buscar o selecciona un motivo para crearlo.");
          return;
        }

        setMsgActualizar("");
        setForm((p) => ({ ...p, idRetiroLaboral: finalId }));
        setStep("retiros_docs");
      };

      const ESTADO_PROCESO_ID_MAP = {
        ABIERTO: 1,
        CERRADO: 2,
      };

      const faltaPazYSalvo = !form?.fechaFinal;

      // ✅ NUEVO: botón actualizar cabecera (Fecha final + Cliente + Motivo)
      const handleActualizarCabecera = async () => {

        if (retiroBloqueado) {
            setMsgActualizar("El retiro está cerrado. No se puede modificar.");
            return;
          }

          try {
          setMsgActualizar("");
          setErrorBuscar("");

          if (!API_BASE) {
            setMsgActualizar("No se encontró VITE_API_BASE_URL en el .env");
            return;
          }

        if (!form?.idRegistroPersonal) {
          setMsgActualizar("Primero busque el trabajador (IdRegistroPersonal vacío).");
          return;
        }

        if (!form?.idCliente) {
          setMsgActualizar("Seleccione un cliente válido (IdCliente vacío).");
          return;
        }

        if (!form?.idMotivoRetiro) {
          setMsgActualizar("Seleccione un motivo válido (IdMotivoRetiro vacío).");
          return;
        }

        setLoadingActualizar(true);

        // ✅ 1) Si no hay retiro activo, lo creamos primero
        let idRetiro = form.idRetiroLaboral;

        // ✅ Si no tengo idRetiro, primero miro si ya existe retiro activo
        if (!idRetiro) {
          const r0 = await fetch(
            `${API_BASE}/rrll/retiro/activo/${Number(form.idRegistroPersonal)}`,
            { method: "GET", headers: { Accept: "application/json" } }
          );

          if (r0.ok) {
            const activo0 = await r0.json();
            const retiro0 = activo0?.retiro ?? activo0;
            const existing0 = retiro0?.IdRetiroLaboral ?? null;
            if (existing0) {
              idRetiro = existing0;
              setForm((p) => ({ ...p, idRetiroLaboral: existing0 }));
            }
          }
        }

        if (!idRetiro) {
          const resCreate = await fetch(`${API_BASE}/rrll/retiro`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              IdRegistroPersonal: Number(form.idRegistroPersonal),
              IdCliente: Number(form.idCliente),
              IdMotivoRetiro: Number(form.idMotivoRetiro),
              FechaRetiro: form.fechaFinal ? form.fechaFinal : null,
              IdEstadoProceso: ESTADO_PROCESO_ID_MAP[estadoProceso] ?? 1,
              FechaProceso: form.fechaProceso
                ? form.fechaProceso
                : new Date().toISOString().slice(0, 10),
              UsuarioCreacion: "RRLL",
            }),
          });

          if (!resCreate.ok) {
            const msg = await resCreate.text().catch(() => "");

            // ✅ Asegura que exista retiro activo y deja cabecera guardada en BD
            const asegurarRetiroActivo = async ({ forceUpdate = false } = {}) => {
              if (!API_BASE) {
                setMsgActualizar("No se encontró VITE_API_BASE_URL en el .env");
                return null;
              }

              if (!form?.idRegistroPersonal) {
                setMsgActualizar("Primero busque el trabajador.");
                return null;
              }

              if (!form?.idCliente) {
                setMsgActualizar("Seleccione un cliente válido.");
                return null;
              }

              if (!form?.idMotivoRetiro) {
                setMsgActualizar("Seleccione un motivo válido.");
                return null;
              }

              try {
                setMsgActualizar("");

                // 1) Intentar traer retiro activo
                let idRetiro = form.idRetiroLaboral ?? null;

                const r0 = await fetch(
                  `${API_BASE}/rrll/retiro/activo/${Number(form.idRegistroPersonal)}`,
                  { method: "GET", headers: { Accept: "application/json" } }
                );

                if (r0.ok) {
                  const activo0 = await r0.json();
                  const retiro0 = activo0?.retiro ?? activo0;
                  const existing0 = retiro0?.IdRetiroLaboral ?? null;

                  if (existing0) {
                    idRetiro = existing0;
                    setForm((p) => ({ ...p, idRetiroLaboral: existing0 }));
                  }
                }

                // 2) Si no hay retiro -> crear
                if (!idRetiro) {
                  const resCreate = await fetch(`${API_BASE}/rrll/retiro`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Accept: "application/json" },
                    body: JSON.stringify({
                      IdRegistroPersonal: Number(form.idRegistroPersonal),
                      IdCliente: Number(form.idCliente),
                      IdMotivoRetiro: Number(form.idMotivoRetiro),
                      FechaRetiro: form.fechaFinal ? form.fechaFinal : null,
                      // Puedes dejar fijo "ABIERTO" si así lo manejas:
                      EstadoCasoRRLL: "ABIERTO",
                      FechaProceso: form.fechaProceso ? form.fechaProceso : new Date().toISOString().slice(0, 10),
                      UsuarioActualizacion: "RRLL",
                      ObservacionGeneral: null,
                    }),
                  });

                  if (!resCreate.ok) {
                    const msg = await resCreate.text().catch(() => "");
                    setMsgActualizar(msg || "No se pudo crear el retiro.");
                    return null;
                  }

                  const created = await resCreate.json();
                  const newId = created?.IdRetiroLaboral ?? null;

                  if (!newId) {
                    setMsgActualizar("El backend creó el retiro pero no devolvió IdRetiroLaboral.");
                    return null;
                  }

                  idRetiro = newId;
                  setForm((p) => ({ ...p, idRetiroLaboral: newId }));
                }

                // 3) (Opcional pero recomendado) Si ya existe retiro, sincronizar cabecera cuando cambien cosas
                // Esto evita que mañana el retiro quede con cliente/motivo viejos.
                if (idRetiro && (forceUpdate || true)) {
                  await fetch(`${API_BASE}/rrll/retiro/${Number(idRetiro)}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", Accept: "application/json" },
                    body: JSON.stringify({
                      IdCliente: Number(form.idCliente),
                      IdMotivoRetiro: Number(form.idMotivoRetiro),
                      FechaRetiro: form.fechaFinal ? form.fechaFinal : null,
                      FechaProceso: form.fechaProceso ? form.fechaProceso : new Date().toISOString().slice(0, 10),
                      UsuarioActualizacion: "RRLL",
                      // EstadoCasoRRLL: "ABIERTO", // si aplica en tu modelo
                    }),
                  }).catch(() => {});
                }

                return idRetiro;
              } catch (e) {
                setMsgActualizar(e?.message || "Error asegurando retiro activo.");
                return null;
              }
            };

            // ✅ Caso: ya existe retiro activo -> consulto el retiro activo y uso ese ID
            if (String(msg).includes("Ya existe un retiro activo")) {
              const r3 = await fetch(
                `${API_BASE}/rrll/retiro/activo/${Number(form.idRegistroPersonal)}`,
                { method: "GET", headers: { Accept: "application/json" } }
              );

              if (!r3.ok) {
                const msg2 = await r3.text().catch(() => "");
                throw new Error(
                  msg2 || "Ya existe retiro activo, pero no se pudo consultar retiro/activo."
                );
              }

              const activo = await r3.json();
              const retiroObj = activo?.retiro ?? activo;

              let existingId =
                retiroObj?.IdRetiroLaboral ??
                retiroObj?.idRetiroLaboral ??
                retiroObj?.IdRetiro ??
                retiroObj?.idRetiro ??
                null;

              if (!existingId && activo?.detail) {
                const match = String(activo.detail).match(/IdRetiroLaboral\s*=\s*(\d+)/i);
                if (match) existingId = Number(match[1]);
              }

              if (!existingId) {
                throw new Error(
                  "El backend dice que existe retiro activo, pero el GET /retiro/activo no devolvió IdRetiroLaboral."
                );
              }

              idRetiro = existingId;
              setForm((p) => ({ ...p, idRetiroLaboral: existingId }));
            } else {
              throw new Error(msg || `No se pudo crear el retiro (${resCreate.status})`);
            }
          } else {
            const created = await resCreate.json();

            idRetiro =
              created?.IdRetiroLaboral ??
              created?.idRetiroLaboral ??
              created?.id ??
              null;

            if (!idRetiro) {
              throw new Error("Se creó el retiro, pero el backend no devolvió IdRetiroLaboral.");
            }

            setForm((p) => ({ ...p, idRetiroLaboral: idRetiro }));
          }
        }

        // ✅ 2) PUT actualizar
        const payload = {
          IdCliente: Number(form.idCliente),
          IdMotivoRetiro: Number(form.idMotivoRetiro),
          FechaRetiro: form.fechaFinal ? form.fechaFinal : null,
          IdEstadoProceso: ESTADO_PROCESO_ID_MAP[estadoProceso] ?? 1,
          FechaProceso: form.fechaProceso
            ? form.fechaProceso
            : new Date().toISOString().slice(0, 10),
          UsuarioActualizacion: "RRLL",
        };

        const res = await fetch(`${API_BASE}/rrll/retiro/${idRetiro}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `Error actualizando (${res.status})`);
      }

      setMotivoPersistidoId(Number(form.idMotivoRetiro) || null);
      setMsgActualizar("✅ Actualizado correctamente.");

    } catch (e) {
      setMsgActualizar(
        String(e?.message || "No se pudo actualizar. Verifica backend.")
          .replace(/^\{.*"detail":\s*"?/s, "")
            .replace(/"\}\s*$/s, "")
        );
      } finally {
        setLoadingActualizar(false);
      }
    };

    const resetDocsState = () => {
      setAdjuntos({});
      setObservaciones({});
      setChecks({});
      setTipificacionRetiro("");
      setRetiroLegalizado("");
    };

    // ✅ util: quitar adjunto sin romper nada
    const removeAdjuntoByKey = (k) => {
      setAdjuntos((p) => {
        const copy = { ...p };
        delete copy[k];
        return copy;
      });
    };

    const listarAdjuntosRetiroBackend = async (idRetiroLaboral) => {
  const res = await fetch(
    `${API_BASE}/rrll/retiro/${idRetiroLaboral}/adjuntos`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "No se pudieron consultar los adjuntos del retiro.");
  }

  return await res.json();
};

const cargarAdjuntosDesdeBackend = async (idRetiroLaboral) => {
  if (!idRetiroLaboral) return;

  try {
    setLoadingAdjuntosBackend(true);

    const data = await listarAdjuntosRetiroBackend(idRetiroLaboral);
    const agrupados = {};

    for (const item of data || []) {
      const tipoDoc = Number(item.IdTipoDocumentoRetiro || 0);

      const reqMatch = requisitosActuales.find(
        (req) => Number(req.idTipoDocumentoRetiro || 0) === tipoDoc
      );

      if (!reqMatch) continue;

      // ✅ Si el motivo actual NO es el persistido,
      // permitir también Paquete de Retiro (10)
      if (!motivoActualEsPersistido && ![2, 8, 10].includes(tipoDoc)) {
        continue;
      }

      const actual = agrupados[reqMatch.key];

      if (!actual) {
        agrupados[reqMatch.key] = item;
        continue;
      }

      const actualEsGenerado =
        String(actual.OrigenArchivo || "").toUpperCase() === "GENERADO";

      const nuevoEsGenerado =
        String(item.OrigenArchivo || "").toUpperCase() === "GENERADO";

      // ✅ Si el actual es generado y el nuevo no, mostrar el nuevo
      if (actualEsGenerado && !nuevoEsGenerado) {
        agrupados[reqMatch.key] = item;
        continue;
      }

      // ✅ Si ambos son del mismo tipo, dejar el más reciente
      const idActual = Number(actual.IdRetiroLaboralAdjunto || 0);
      const idNuevo = Number(item.IdRetiroLaboralAdjunto || 0);

      if (idNuevo > idActual) {
        agrupados[reqMatch.key] = item;
      }
    }

    setAdjuntosBackend(agrupados);
  } catch (error) {
    console.error("Error cargando adjuntos desde backend:", error);
    setAdjuntosBackend({});
  } finally {
    setLoadingAdjuntosBackend(false);
  }
};

const retiroBloqueado = estadoProceso === "CERRADO";

const motivoActualEsPersistido =
  !form.idRetiroLaboral ||
  !motivoPersistidoId ||
  Number(form.idMotivoRetiro) === Number(motivoPersistidoId);

useEffect(() => {
  if (
    step === "retiros_docs" &&
    form.idRetiroLaboral &&
    Array.isArray(requisitosActuales) &&
    requisitosActuales.length > 0
  ) {
    cargarAdjuntosDesdeBackend(form.idRetiroLaboral);
  }
}, [step, form.idRetiroLaboral, requisitosActuales, motivoActualEsPersistido]);



useEffect(() => {
  if (
    step === "retiros_docs" &&
    form.idRetiroLaboral &&
    Array.isArray(requisitosActuales) &&
    requisitosActuales.length > 0
  ) {
    if (motivoActualEsPersistido) {
      cargarAdjuntosDesdeBackend(form.idRetiroLaboral);
    } else {
      setAdjuntosBackend({});
    }
  }
}, [step, form.idRetiroLaboral, requisitosActuales, motivoActualEsPersistido]);

useEffect(() => {
  const hidratarDetalleRetiro = async () => {
    try {
      if (!form.idRetiroLaboral) return;

      // ✅ Si el usuario cambió el motivo y aún no corresponde al persistido,
      // no traer detalle del backend para que la vista quede limpia.
      if (!motivoActualEsPersistido) {
        setTipificacionRetiro("");
        return;
      }

      const resp = await consultarDetalleRetiroBackend(form.idRetiroLaboral);
      const retiro = resp?.data || null;
      if (!retiro) return;

      const estadoRecuperado = (retiro?.EstadoCasoRRLL || "").toUpperCase();
      if (estadoRecuperado === "CERRADO" || estadoRecuperado === "ABIERTO") {
        setEstadoProceso(estadoRecuperado);
        setEstadoSeleccionado(estadoRecuperado);
        setOwnerProceso(estadoRecuperado === "CERRADO" ? "NOMINA" : "RRLL");
      }

      setTipificacionRetiro(
        retiro?.IdTipificacionRetiro != null
          ? String(retiro.IdTipificacionRetiro)
          : ""
      );

      setObservaciones((prev) => ({
        ...prev,
        [keyFromLabel(`${form.motivoRetiro || ""}_OBSERVACIONES`)]: retiro?.ObservacionRetiro || "",
      }));

      setChecks((prev) => ({
        ...prev,
        [keyFromLabel(`${form.motivoRetiro || ""}_DEVOLUCIÓN CARNET`)]:
          retiro?.DevolucionCarnet === true
            ? "SI"
            : retiro?.DevolucionCarnet === false
            ? "NO"
            : "",
      }));
    } catch (error) {
      console.error("Error hidratando detalle del retiro:", error);
    }
  };

  if (step === "retiros_docs" && form.idRetiroLaboral) {
    hidratarDetalleRetiro();
  }
}, [step, form.idRetiroLaboral, form.motivoRetiro, motivoActualEsPersistido]);

useEffect(() => {
  if (step === "retiros_docs" && form.idRetiroLaboral) {
    cargarEntrevistaRetiroDesdeBackend(form.idRetiroLaboral);
  } else {
    setEntrevistaRetiroData(null);
  }
}, [step, form.idRetiroLaboral]);

const subirAdjuntoRetiroBackend = async ({
  idRetiroLaboral,
  idTipoDocumentoRetiro,
  file,
}) => {
  const formData = new FormData();
  formData.append("IdTipoDocumentoRetiro", String(idTipoDocumentoRetiro));
  formData.append("file", file);

  const res = await fetch(
    `${API_BASE}/rrll/retiro/${idRetiroLaboral}/adjuntos`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "No se pudo guardar el adjunto.");
  }

  return await res.json();
};

const verAdjuntoRetiroBackend = async (idAdjunto) => {
  const res = await fetch(
    `${API_BASE}/rrll/adjuntos/${idAdjunto}/descargar`,
    {
      method: "GET",
    }
  );

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "No se pudo abrir el adjunto.");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");

  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 60000);
};

const descargarAdjuntoRetiroBackend = async (
  idAdjunto,
  nombreArchivo = "adjunto.pdf"
) => {
  const res = await fetch(
    `${API_BASE}/rrll/adjuntos/${idAdjunto}/descargar`,
    {
      method: "GET",
    }
  );

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "No se pudo descargar el adjunto.");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 60000);
};

const consultarEntrevistaRetiroBackend = async (idRetiroLaboral) => {
  const res = await fetch(`${API_BASE_ENTREVISTA}/entrevista-retiro/${idRetiroLaboral}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "No se pudo consultar la entrevista de retiro.");
  }

  return await res.json();
};

const cargarEntrevistaRetiroDesdeBackend = async (idRetiroLaboral) => {
  if (!idRetiroLaboral) {
    setEntrevistaRetiroData(null);
    return;
  }

  try {
    setLoadingEntrevistaRetiro(true);
    const resp = await consultarEntrevistaRetiroBackend(idRetiroLaboral);
    setEntrevistaRetiroData(resp?.data ?? null);
  } catch (error) {
    console.error("Error cargando entrevista de retiro:", error);
    setEntrevistaRetiroData(null);
  } finally {
    setLoadingEntrevistaRetiro(false);
  }
};

const verPdfEntrevistaRetiro = (idRetiroLaboral) => {
  if (!idRetiroLaboral) return;
  const url = `${API_BASE_ENTREVISTA}/entrevista-retiro/${idRetiroLaboral}/pdf`;
  window.open(url, "_blank", "noopener,noreferrer");
};

const descargarPdfEntrevistaRetiro = async (idRetiroLaboral) => {
  if (!idRetiroLaboral) return;

  const res = await fetch(
    `${API_BASE_ENTREVISTA}/entrevista-retiro/${idRetiroLaboral}/pdf`,
    {
      method: "GET",
      headers: {
        Accept: "application/pdf",
      },
    }
  );

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "No se pudo descargar el PDF de la entrevista.");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `entrevista_retiro_${idRetiroLaboral}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 60000);
};

const generarQrEntrevistaRetiro = async (idRetiroLaboral) => {
  try {
    if (!idRetiroLaboral) {
      setQrEntrevistaInfo({
        open: true,
        link: "",
        mensaje: "No existe IdRetiroLaboral para generar el enlace de la entrevista.",
      });
      return;
    }

    const res = await fetch(
      `${API_BASE_ENTREVISTA}/entrevista-retiro/generar-token/${idRetiroLaboral}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(msg || "No se pudo generar el token de entrevista.");
    }

    const data = await res.json();

    const linkFormulario =
      data?.data?.LinkFormulario ||
      data?.data?.linkFormulario ||
      data?.linkFormulario ||
      "";

    setQrEntrevistaInfo({
      open: true,
      link: linkFormulario,
     mensaje: linkFormulario
  ? "Escanee este código QR con el celular del trabajador para diligenciar la entrevista."
  : "Código QR generado correctamente.",
    });
  } catch (error) {
    console.error("Error generando QR de entrevista:", error);
    setQrEntrevistaInfo({
      open: true,
      link: "",
      mensaje: error.message || "No se pudo generar el QR de la entrevista.",
    });
  }
};
const actualizarDetalleRetiroBackend = async ({
  idRetiroLaboral,
  idTipificacionRetiro,
  observacionRetiro,
  devolucionCarnet,
  retiroLegalizado,
  usuarioActualizacion = "RRLL",
}) => {
  const res = await fetch(
    `${API_BASE}/retiros-laborales/${idRetiroLaboral}/detalle`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        IdTipificacionRetiro: idTipificacionRetiro,
        ObservacionRetiro: observacionRetiro,
        DevolucionCarnet: devolucionCarnet,
        RetiroLegalizado: retiroLegalizado,
        UsuarioActualizacion: usuarioActualizacion,
      }),
    }
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.detail || "No se pudo actualizar el detalle del retiro.");
  }

  return data;
};

const consultarDetalleRetiroBackend = async (idRetiroLaboral) => {
  const res = await fetch(`${API_BASE}/retiros-laborales/${idRetiroLaboral}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "No se pudo consultar el detalle del retiro.");
  }

  return await res.json();
};


const generarPrimerLlamadoBackend = async (idRetiroLaboral) => {
  const res = await fetch(
    `${API_BASE}/retiros-laborales/${idRetiroLaboral}/documentos/primer-llamado/generar`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "No se pudo generar el primer llamado.");
  }

  return await res.json();
};

const generarSegundoLlamadoBackend = async (idRetiroLaboral) => {
  const res = await fetch(
    `${API_BASE}/retiros-laborales/${idRetiroLaboral}/documentos/segundo-llamado/generar`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "No se pudo generar el segundo llamado.");
  }

  return await res.json();
};

const generarCartaFinalizacionBackend = async (idRetiroLaboral) => {
  const res = await fetch(
    `${API_BASE}/retiros-laborales/${idRetiroLaboral}/documentos/carta-finalizacion/generar`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "No se pudo generar la carta de finalización.");
  }

  return await res.json();
};

const generarPaqueteRetiroBackend = async (idRetiroLaboral) => {
  const res = await fetch(
    `${API_BASE}/retiros-laborales/${idRetiroLaboral}/documentos/paquete-retiro/generar`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "No se pudo generar el paquete de retiro.");
  }

  return await res.json();
};

const handleActualizarEstadoProceso = async () => {
  try {
    setMsgActualizar("");
    setErrorBuscar("");

    if (!API_BASE) {
      setMsgActualizar("No se encontró VITE_API_BASE_URL en el .env");
      return;
    }

    if (!form?.idRetiroLaboral) {
      setMsgActualizar("No se encontró el IdRetiroLaboral para actualizar el estado.");
      return;
    }

    setLoadingActualizar(true);

    const estadoCasoRRLL = estadoSeleccionado;
    const idEstadoProceso = estadoSeleccionado === "CERRADO" ? 31 : 30;

    const payload = {
      EstadoCasoRRLL: estadoCasoRRLL,
      IdEstadoProceso: idEstadoProceso,
      FechaCierre:
        estadoSeleccionado === "CERRADO"
          ? new Date().toISOString()
          : null,
      FechaEnvioNomina: null,
      UsuarioActualizacion: "RRLL",
    };

    const res = await fetch(
      `${API_BASE}/retiros-laborales/${form.idRetiroLaboral}/estado`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(msg || "No se pudo actualizar el estado del proceso.");
    }

    const data = await res.json();

    if (data?.success) {
      setEstadoProceso(estadoCasoRRLL);
      setOwnerProceso(estadoCasoRRLL === "CERRADO" ? "NOMINA" : "RRLL");
      setMsgActualizar("✅ Estado del proceso actualizado correctamente.");
    } else {
      setMsgActualizar("No fue posible actualizar el estado del proceso.");
    }
  } catch (error) {
    console.error("Error al actualizar estado del proceso:", error);
    setMsgActualizar(error?.message || "Ocurrió un error al actualizar el estado del proceso.");
  } finally {
    setLoadingActualizar(false);
  }
};

  // --------------------------
  // VISTA INICIAL
  // --------------------------
 if (step === "inicio") {
  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-emerald-600">
        <div className="mb-1">
          <h2 className="text-2xl font-bold text-gray-800">
            Relaciones Laborales
          </h2>
          <p className="text-sm text-gray-500">Vista inicial</p>
        </div>

        <div className="mt-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Seleccione un flujo:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setStep("retiros")}
              className="text-left bg-white rounded-xl border border-emerald-100 p-4 hover:border-emerald-300 hover:shadow-sm transition"
            >
              <p className="font-bold text-emerald-700">Retiros</p>
              <p className="text-xs text-gray-500">
                Gestión de retiros y documentación…
              </p>
            </button>

            <button
              onClick={() =>
                alert("Pendiente: Procesos disciplinarios (lo hacemos después)")
              }
              className="text-left bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition"
            >
              <p className="font-bold text-gray-800">Procesos disciplinarios</p>
              <p className="text-xs text-gray-500">
                Citación, descargos, actas y compromisos…
              </p>
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="w-full md:w-auto">
                <Label className="text-sm font-medium text-gray-700">
                  Fecha inicio:
                </Label>
                <Input
                  type="date"
                  value={fechaInicioExcel}
                  onChange={(e) => setFechaInicioExcel(e.target.value)}
                  className="bg-white h-12 mt-2 w-full md:w-[190px]"
                />
              </div>

              <div className="w-full md:w-auto">
                <Label className="text-sm font-medium text-gray-700">
                  Fecha fin:
                </Label>
                <Input
                  type="date"
                  value={fechaFinExcel}
                  onChange={(e) => setFechaFinExcel(e.target.value)}
                  className="bg-white h-12 mt-2 w-full md:w-[190px]"
                />
              </div>

              <div className="w-full md:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDescargarExcel}
                  className="w-full md:w-[220px] h-12 border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                >
                  Descargar Excel
                </Button>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------
  // VISTA DOCUMENTOS (REQUISITOS)
  // --------------------------
if (step === "retiros_docs") {
  const motivo = form.motivoRetiro;

 const copiarLinkEntrevista = async () => {
  try {
    if (!qrEntrevistaInfo.link) return;

    await navigator.clipboard.writeText(qrEntrevistaInfo.link);

    setQrEntrevistaInfo((prev) => ({
      ...prev,
      mensaje: "Enlace copiado correctamente.",
    }));
  } catch (error) {
    console.error("Error copiando enlace:", error);

    setQrEntrevistaInfo((prev) => ({
      ...prev,
      mensaje: "No se pudo copiar el enlace.",
    }));
  }
};

  const entrevistaCabecera = entrevistaRetiroData?.cabecera || null;
  const entrevistaRespuestas = entrevistaRetiroData?.respuestas || [];
  const tieneEntrevistaRetiro =
    !!entrevistaCabecera?.IdEntrevistaRetiro && entrevistaRespuestas.length > 0;

    console.log("entrevistaRetiroData =>", entrevistaRetiroData);
  console.log("entrevistaCabecera =>", entrevistaCabecera);
  console.log("entrevistaRespuestas =>", entrevistaRespuestas);
  console.log("tieneEntrevistaRetiro =>", tieneEntrevistaRetiro);
  console.log("form.idRetiroLaboral =>", form.idRetiroLaboral);

    const DocCard = ({ idx, title, subtitle, file, displayFileName, actions, fileNode, children }) => (
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-base font-bold text-slate-900">
              {idx}. {title}
            </p>
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          </div>
          {actions}
        </div>

        <div className="mt-3">
        {file ? (
          <div className="text-xs text-emerald-700">
          <b className="break-words">
            {displayFileName || `Archivo: ${file?.NombreArchivoOriginal || file?.name || "archivo"}`}
          </b>
        </div>
      ) : (
        <div className="text-xs text-slate-500">Sin archivo</div>
        )}
      </div>

        {fileNode ? <div className="mt-4">{fileNode}</div> : null}
        {children ? <div className="mt-3">{children}</div> : null}
      </div>
    );

        return (
          <div className="p-6">
          <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-emerald-600">
            {qrEntrevistaInfo.open && (
      <div className="fixed top-4 right-4 z-50 w-[420px] max-w-[95vw] rounded-xl border border-emerald-200 bg-white shadow-2xl px-4 py-4 text-sm text-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="font-semibold text-emerald-700">
              {qrEntrevistaInfo.mensaje}
            </div>
    {qrEntrevistaInfo.link ? (
      <div className="mt-4 flex flex-col items-center">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <QRCodeSVG value={qrEntrevistaInfo.link} size={180} />
        </div>
      </div>
    ) : null}

            <div className="mt-4 flex gap-2 flex-wrap">
              {qrEntrevistaInfo.link ? (
                <Button
                  type="button"
                  variant="outline"
                  className="border-gray-200"
                  onClick={copiarLinkEntrevista}
                >
                  Copiar enlace
                </Button>
              ) : null}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="border-gray-200"
            onClick={() =>
              setQrEntrevistaInfo({
                open: false,
                link: "",
                mensaje: "",
              })
            }
          >
            Cerrar
          </Button>
        </div>
      </div>
    )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Retiros</h2>
              <p className="text-sm text-gray-500">Documentos y requisitos</p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-gray-200"
                onClick={() => setStep("retiros")}
              >
                Volver a cabecera
              </Button>

              <Button
                variant="outline"
                className="border-gray-200"
                onClick={() => {
                  resetDocsState();
                  setStep("retiros");
                }}
              >
                Limpiar requisitos
              </Button>
            </div>
          </div>

          {/* Motivo seleccionado */}
          <div className="mt-6 bg-gray-50 p-5 rounded-xl border border-gray-100">
            <p className="text-sm font-semibold text-gray-700">
              Motivo seleccionado
            </p>
            <div className="mt-2 rounded-xl bg-white border border-emerald-100 px-4 py-3">
              <p className="font-bold text-emerald-700">{pretty(motivo)}</p>
            </div>
          </div>

          {/* Requisitos */}
          <div className="mt-6 bg-white p-5 rounded-xl border border-gray-100">
            <p className="font-semibold text-gray-700 mb-4">
              Requisitos / Documentos
            </p>

            <div className="space-y-4">
              {requisitosActuales.map((req, idx) => {
                if (req.showIf && req.showIfKey) {
                  const val = checks[req.showIfKey] || "";
                  if (String(val) !== String(req.showIf.equals)) return null;
                }

            const tipo = String(req.tipo || "ADJUNTABLE").toUpperCase();
            const fileLocal = adjuntos[req.key];
            const fileBackend = adjuntosBackend[req.key] || null;
            const file = fileBackend || fileLocal || null;

            const displayFileName =
              tipo === "GENERADO"
                ? `Archivo generado: ${req.labelPretty}`
                : `Archivo: ${file?.NombreArchivoOriginal || file?.name || "archivo"}`;

            const esTarjetaEntrevista = tipo === "ENTREVISTA";
            const archivoEntrevistaVisible = tieneEntrevistaRetiro
              ? { NombreArchivoOriginal: `entrevista_retiro_${form.idRetiroLaboral}.pdf` }
              : file;

               if (tipo === "VIEW_ONLY") {
                  return (
                    <DocCard
                      key={req.key}
                      idx={idx + 1}
                      title={req.labelPretty}
                      subtitle="Tipo: Solo ver (Operaciones adjunta)"
                      file={file}
                      actions={
                        <div className="flex flex-wrap gap-2 justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            className="border-gray-200"
                            disabled={!file}
                            onClick={async () => {
                              try {
                                const fileBackend = adjuntosBackend[req.key] || null;
                                const fileLocal = adjuntos[req.key] || null;

                                if (fileBackend?.IdRetiroLaboralAdjunto) {
                                  await verAdjuntoRetiroBackend(fileBackend.IdRetiroLaboralAdjunto);
                                  return;
                                }

                                if (fileLocal) {
                                  viewLocalFile(fileLocal);
                                }
                              } catch (error) {
                                console.error("Error abriendo adjunto VIEW_ONLY:", error);
                                alert(error.message || "No se pudo abrir el adjunto.");
                              }
                            }}
                          >
                            Ver
                          </Button>
                        </div>
                      }
                    />
                  );
                }

                if (tipo === "ADJUNTABLE") {
                  return (
                    <DocCard
                      key={req.key}
                      idx={idx + 1}
                      title={req.labelPretty}
                      subtitle="Tipo: Adjuntable"
                      file={file}
                      actions={
                        <div className="flex flex-wrap gap-2 justify-end">
                          <Button
                          type="button"
                          variant="outline"
                          className="border-gray-200"
                          disabled={!file}
                          onClick={async () => {
                            try {
                              const fileBackend = adjuntosBackend[req.key] || null;
                              const fileLocal = adjuntos[req.key] || null;

                              if (fileBackend?.IdRetiroLaboralAdjunto) {
                                await verAdjuntoRetiroBackend(fileBackend.IdRetiroLaboralAdjunto);
                                return;
                              }

                              if (fileLocal) {
                                viewLocalFile(fileLocal);
                              }
                            } catch (error) {
                              console.error("Error abriendo adjunto:", error);
                              alert(error.message || "No se pudo abrir el adjunto.");
                            }
                          }}
                        >
                          Ver
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          className="border-gray-200"
                          disabled={!file}
                          onClick={async () => {
                            try {
                              const fileBackend = adjuntosBackend[req.key] || null;
                              const fileLocal = adjuntos[req.key] || null;

                              if (fileBackend?.IdRetiroLaboralAdjunto) {
                                await descargarAdjuntoRetiroBackend(
                                  fileBackend.IdRetiroLaboralAdjunto,
                                  fileBackend.NombreArchivoOriginal || "adjunto.pdf"
                                );
                                return;
                              }

                              if (fileLocal) {
                                downloadLocalFile(fileLocal);
                              }
                            } catch (error) {
                              console.error("Error descargando adjunto:", error);
                              alert(error.message || "No se pudo descargar el adjunto.");
                            }
                          }}
                        >
                          Descargar
                        </Button>

                        <Button
                        type="button"
                        variant="outline"
                        className="border-gray-200"
                        disabled={!file || retiroBloqueado}
                        onClick={async () => {
                          try {
                            if (retiroBloqueado) return;

                            const fileBackend = adjuntosBackend[req.key] || null;
                            const fileLocal = adjuntos[req.key] || null;

                            if (fileBackend?.IdRetiroLaboralAdjunto) {
                              const res = await fetch(
                                `${API_BASE}/rrll/adjuntos/${fileBackend.IdRetiroLaboralAdjunto}`,
                                {
                                  method: "DELETE",
                                }
                              );

                              if (!res.ok) {
                                const msg = await res.text().catch(() => "");
                                throw new Error(msg || "No se pudo eliminar el adjunto.");
                              }

                              await cargarAdjuntosDesdeBackend(form.idRetiroLaboral);

                              setAdjuntos((p) => {
                                const copy = { ...p };
                                delete copy[req.key];
                                return copy;
                              });

                              return;
                            }

                            if (fileLocal) {
                              setAdjuntos((p) => {
                                const copy = { ...p };
                                delete copy[req.key];
                                return copy;
                              });
                            }
                          } catch (error) {
                            console.error("Error eliminando adjunto:", error);
                            alert(error.message || "No se pudo eliminar el adjunto.");
                          }
                        }}
                      >
                        Eliminar
                      </Button>

                         <label className="inline-flex items-center">
                          <input
                            type="file"
                            className="hidden"
                            disabled={retiroBloqueado}
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;

                              try {
                                if (retiroBloqueado) return;

                                if (!form.idRetiroLaboral) {
                                  alert("No existe IdRetiroLaboral para guardar el adjunto.");
                                  return;
                                }

                                if (!req.idTipoDocumentoRetiro) {
                                  alert(`El requisito ${req.label} no tiene idTipoDocumentoRetiro configurado.`);
                                  return;
                                }

                                await subirAdjuntoRetiroBackend({
                                  idRetiroLaboral: form.idRetiroLaboral,
                                  idTipoDocumentoRetiro: req.idTipoDocumentoRetiro,
                                  file: f,
                                });

                                await cargarAdjuntosDesdeBackend(form.idRetiroLaboral);

                                setAdjuntos((p) => {
                                  const copy = { ...p };
                                  delete copy[req.key];
                                  return copy;
                                });
                              } catch (error) {
                                console.error("Error subiendo adjunto:", error);
                                alert(error.message || "No se pudo guardar el adjunto.");
                              } finally {
                                e.target.value = "";
                              }
                            }}
                          />
                          <span
                            className={`h-10 px-4 rounded-xl font-semibold flex items-center ${
                              retiroBloqueado
                                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                                : "bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                            }`}
                          >
                            Adjuntar
                          </span>
                        </label>
                        </div>
                      }
                    />
                  );
                }

             if (tipo === "PAQUETE") {
              return (
                <DocCard
                  key={req.key}
                  idx={idx + 1}
                  title={req.labelPretty}
                  subtitle="Tipo: Paquete de retiro (Generar + cargar firmado)"
                  file={file}
                  actions={
                    <div className="flex flex-wrap gap-2 justify-end">
                      <Button
                        type="button"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        disabled={retiroBloqueado}
                        onClick={async () => {
                          try {
                            if (retiroBloqueado) {
                              alert("El retiro está cerrado. No se puede modificar.");
                              return;
                            }

                            if (!form.idRetiroLaboral) {
                              alert("Primero debes guardar/crear el retiro laboral para poder generar el paquete.");
                              return;
                            }

                            await generarPaqueteRetiroBackend(form.idRetiroLaboral);
                            await cargarAdjuntosDesdeBackend(form.idRetiroLaboral);

                            setAdjuntos((prev) => ({
                              ...prev,
                              [req.key]: null,
                            }));

                            alert("Paquete de retiro generado correctamente.");
                          } catch (e) {
                            console.error(e);
                            alert(e.message || "No se pudo generar el paquete de retiro.");
                          }
                        }}
                      >
                        Generar
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        className="border-gray-200"
                        disabled={!file}
                        onClick={() => {
                          if (file?.IdRetiroLaboralAdjunto) {
                            viewBackendAdjunto(API_BASE, file);
                          } else {
                            viewLocalFile(file);
                          }
                        }}
                      >
                        Ver
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        className="border-gray-200"
                        disabled={!file}
                        onClick={() => {
                          if (file?.IdRetiroLaboralAdjunto) {
                            downloadBackendAdjunto(API_BASE, file);
                          } else {
                            downloadLocalFile(file);
                          }
                        }}
                      >
                        Descargar
                      </Button>

                      <Button
  type="button"
  variant="outline"
  className="border-gray-200"
  disabled={!file || retiroBloqueado}
  onClick={() => removeAdjuntoByKey(req.key)}
>
  Eliminar
</Button>

                      <label className="inline-flex items-center">
                        <input
                          type="file"
                          className="hidden"
                          disabled={retiroBloqueado}
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;

                            try {
                              if (retiroBloqueado) return;

                              if (!form.idRetiroLaboral) {
                                alert("No existe IdRetiroLaboral para guardar el paquete firmado.");
                                return;
                              }

                              if (!req.idTipoDocumentoRetiro) {
                                alert(`El requisito ${req.label} no tiene idTipoDocumentoRetiro configurado.`);
                                return;
                              }

                              await subirAdjuntoRetiroBackend({
                                idRetiroLaboral: form.idRetiroLaboral,
                                idTipoDocumentoRetiro: req.idTipoDocumentoRetiro,
                                file: f,
                              });

                              await cargarAdjuntosDesdeBackend(form.idRetiroLaboral);

                              setAdjuntos((p) => {
                                const copy = { ...p };
                                delete copy[req.key];
                                return copy;
                              });

                              alert("Paquete firmado adjuntado correctamente.");
                            } catch (error) {
                              console.error("Error subiendo paquete firmado:", error);
                              alert(error.message || "No se pudo guardar el paquete firmado.");
                            } finally {
                              e.target.value = "";
                            }
                          }}
                        />
                        <span
                          className={`h-10 px-4 rounded-xl font-semibold flex items-center ${
                            retiroBloqueado
                              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                              : "bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                          }`}
                        >
                          Adjuntar firmado
                        </span>
                      </label>
                    </div>
                  }
                >
                  <div className="text-xs text-slate-500 leading-5">
                    1) Generar paquete → 2) Descargar y enviar → 3) Firma → 4)
                    Adjuntar firmado.
                  </div>
                </DocCard>
              );
            }
                if (tipo === "GENERADO") {
                  return (
                    <DocCard
                        key={req.key}
                        idx={idx + 1}
                        title={req.labelPretty}
                        subtitle="Tipo: Generado automáticamente"
                        file={file}
                        displayFileName={displayFileName}
                        actions={
                        <div className="flex flex-wrap gap-2 justify-end">
                          <Button
                          type="button"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          disabled={retiroBloqueado}
                          onClick={async () => {
                            try {
                              if (retiroBloqueado) return;

                              if (!form.idRetiroLaboral) {
                                alert("No existe IdRetiroLaboral para generar el documento.");
                                return;
                              }

                          if (Number(req.idTipoDocumentoRetiro) === 13) {
                            await generarPrimerLlamadoBackend(form.idRetiroLaboral);
                          } else if (Number(req.idTipoDocumentoRetiro) === 14) {
                            await generarSegundoLlamadoBackend(form.idRetiroLaboral);
                          } else if (Number(req.idTipoDocumentoRetiro) === 4) {
                            await generarCartaFinalizacionBackend(form.idRetiroLaboral);
                          } else {
                            alert("Por ahora este documento generado aún no está conectado.");
                            return;
                          }

                              await cargarAdjuntosDesdeBackend(form.idRetiroLaboral);
                              setAdjuntos((p) => {
                                const copy = { ...p };
                                delete copy[req.key];
                                return copy;
                              });

                              alert(`${req.labelPretty} generado correctamente.`);
                            } catch (error) {
                              console.error("Error generando documento:", error);
                              alert(error.message || "No se pudo generar el documento.");
                            }
                          }}
                        >
                          Generar
                        </Button>

                          <Button
                            type="button"
                            variant="outline"
                            className="border-gray-200"
                            disabled={!file}
                            onClick={async () => {
                              try {
                                const fileBackend = adjuntosBackend[req.key] || null;
                                const fileLocal = adjuntos[req.key] || null;

                                if (fileBackend?.IdRetiroLaboralAdjunto) {
                                  await verAdjuntoRetiroBackend(fileBackend.IdRetiroLaboralAdjunto);
                                  return;
                                }

                                if (fileLocal) {
                                  viewLocalFile(fileLocal);
                                }
                              } catch (error) {
                                console.error("Error abriendo documento generado:", error);
                                alert(error.message || "No se pudo abrir el documento.");
                              }
                            }}
                          >
                            Ver
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            className="border-gray-200"
                            disabled={!file}
                            onClick={async () => {
                              try {
                                const fileBackend = adjuntosBackend[req.key] || null;
                                const fileLocal = adjuntos[req.key] || null;

                                if (fileBackend?.IdRetiroLaboralAdjunto) {
                                  await descargarAdjuntoRetiroBackend(
                                    fileBackend.IdRetiroLaboralAdjunto,
                                    fileBackend.NombreArchivoOriginal || "documento_generado.docx"
                                  );
                                  return;
                                }

                                if (fileLocal) {
                                  downloadLocalFile(fileLocal);
                                }
                              } catch (error) {
                                console.error("Error descargando documento generado:", error);
                                alert(error.message || "No se pudo descargar el documento.");
                              }
                            }}
                          >
                            Descargar
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            className="border-gray-200"
                            disabled={!file || retiroBloqueado}
                            onClick={async () => {
                              try {
                                if (retiroBloqueado) return;

                                const fileBackend = adjuntosBackend[req.key] || null;
                                const fileLocal = adjuntos[req.key] || null;

                                if (fileBackend?.IdRetiroLaboralAdjunto) {
                                  const res = await fetch(
                                    `${API_BASE}/rrll/adjuntos/${fileBackend.IdRetiroLaboralAdjunto}`,
                                    {
                                      method: "DELETE",
                                    }
                                  );

                                  if (!res.ok) {
                                    const msg = await res.text().catch(() => "");
                                    throw new Error(msg || "No se pudo eliminar el documento.");
                                  }

                                  await cargarAdjuntosDesdeBackend(form.idRetiroLaboral);

                                  setAdjuntos((p) => {
                                    const copy = { ...p };
                                    delete copy[req.key];
                                    return copy;
                                  });

                                  return;
                                }

                                if (fileLocal) {
                                  setAdjuntos((p) => {
                                    const copy = { ...p };
                                    delete copy[req.key];
                                    return copy;
                                  });
                                }
                              } catch (error) {
                                console.error("Error eliminando documento generado:", error);
                                alert(error.message || "No se pudo eliminar el documento.");
                              }
                            }}
                          >
                            Eliminar
                          </Button>
                        </div>
                      }
                     fileNode={null}
                    />
                  );
                }

   if (tipo === "ENTREVISTA") {
  return (
    <DocCard
      key={req.key}
      idx={idx + 1}
      title={req.labelPretty}
      subtitle="Tipo: Entrevista (QR / cargue automático pendiente)"
      file={
        tieneEntrevistaRetiro
          ? { NombreArchivoOriginal: `entrevista_retiro_${form.idRetiroLaboral}.pdf` }
          : null
      }
      actions={
        <div className="flex flex-wrap gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            className="border-gray-200"
            disabled={!tieneEntrevistaRetiro}
            onClick={() => verPdfEntrevistaRetiro(form.idRetiroLaboral)}
          >
            Ver
          </Button>

          <Button
            type="button"
            variant="outline"
            className="border-gray-200"
            disabled={!tieneEntrevistaRetiro}
            onClick={() => descargarPdfEntrevistaRetiro(form.idRetiroLaboral)}
          >
            Descargar
          </Button>

          <Button
            type="button"
            className="bg-slate-900 text-white hover:bg-slate-800"
            disabled={!form.idRetiroLaboral}
            onClick={() => generarQrEntrevistaRetiro(form.idRetiroLaboral)}
          >
            Generar QR
          </Button>
        </div>
      }
    >
      <div className="text-xs text-slate-500">
        {tieneEntrevistaRetiro
          ? "La entrevista fue diligenciada por el trabajador y ya se encuentra disponible en PDF."
          : "La entrevista aún no ha sido diligenciada por el trabajador. Genere el QR para que pueda responderla."}
      </div>
    </DocCard>
  );
}

            if (tipo === "TIPIFICACION") {
              return (
                <div
                  key={req.key}
                  className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5"
                >
                  <p className="text-base font-bold text-slate-900">
                    {idx + 1}. {req.labelPretty}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Tipo: <span className="font-semibold">Tipificación</span> (lista pendiente)
                  </p>

                  <div className="mt-4 max-w-md">
                    <Select
                      value={tipificacionRetiro || ""}
                      disabled={retiroBloqueado}
                      onValueChange={async (value) => {
                        try {
                          if (retiroBloqueado) return;

                          setTipificacionRetiro(value);

                          if (!form.idRetiroLaboral) return;

                          const devolucionCarnetActual =
                            checks[keyFromLabel(`${form.motivoRetiro || ""}_DEVOLUCIÓN CARNET`)] === "SI"
                              ? true
                              : checks[keyFromLabel(`${form.motivoRetiro || ""}_DEVOLUCIÓN CARNET`)] === "NO"
                              ? false
                              : null;

                          const observacionActual =
                            observaciones[keyFromLabel(`${form.motivoRetiro || ""}_OBSERVACIONES`)] || "";

                          await actualizarDetalleRetiroBackend({
                            idRetiroLaboral: form.idRetiroLaboral,
                            idTipificacionRetiro: value ? Number(value) : null,
                            observacionRetiro: observacionActual,
                            devolucionCarnet: devolucionCarnetActual,
                            usuarioActualizacion: "RRLL",
                          });
                        } catch (error) {
                          console.error("Error guardando tipificación:", error);
                          alert(error.message || "No se pudo guardar la tipificación.");
                        }
                      }}
                    >
                      <SelectTrigger
                        className={`h-12 ${
                          retiroBloqueado ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-white"
                        }`}
                      >
                        <SelectValue placeholder="Seleccionar tipificación..." />
                      </SelectTrigger>

                      <SelectContent className="max-h-60 overflow-y-auto">
                        {(TIPIFICACIONES_RETIRO || []).length === 0 ? (
                          <SelectItem value="PENDIENTE" disabled>
                            (Pendiente: faltan las tipificaciones)
                          </SelectItem>
                        ) : (
                          TIPIFICACIONES_RETIRO.map((t) => (
                            <SelectItem key={t.id} value={String(t.id)}>
                              {t.label}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            }

      if (tipo === "RETIRO_LEGALIZADO") {
                  return (
                    <div
                      key={req.key}
                      className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5"
                    >
                      <p className="text-base font-bold text-slate-900">
                        {idx + 1}. {req.labelPretty}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Tipo: <span className="font-semibold">Retiro legalizado</span>
                      </p>

                      <div className="mt-4 max-w-md">
                       <Select
                          value={
                            retiroLegalizado === "SI"
                              ? "PRESENCIAL"
                              : retiroLegalizado === "NO"
                              ? "VIRTUAL"
                              : ""
                          }
                          disabled={retiroBloqueado}
                          onValueChange={async (value) => {
                            try {
                              if (retiroBloqueado) return;

                              const valorBackend =
                                value === "PRESENCIAL"
                                  ? "SI"
                                  : value === "VIRTUAL"
                                  ? "NO"
                                  : "";

                              setRetiroLegalizado(valorBackend);

                              if (!form.idRetiroLaboral) return;

                              await actualizarDetalleRetiroBackend({
                                idRetiroLaboral: form.idRetiroLaboral,
                                retiroLegalizado: valorBackend,
                                usuarioActualizacion: "RRLL",
                              });
                            } catch (error) {
                              console.error("Error guardando retiro legalizado:", error);
                              alert(error.message || "No se pudo guardar el retiro legalizado.");
                            }
                          }}
                        >
                          <SelectTrigger
                            className={`h-12 ${
                              retiroBloqueado ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-white"
                            }`}
                          >
                            <SelectValue placeholder="Seleccionar." />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="PRESENCIAL">PRESENCIAL</SelectItem>
                            <SelectItem value="VIRTUAL">VIRTUAL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                }

                if (tipo === "ESCRIBIR") {
                  return (
                    <div
                      key={req.key}
                      className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5"
                    >
                      <p className="text-base font-bold text-slate-900">
                        {idx + 1}. {req.labelPretty}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Tipo: <span className="font-semibold">Observaciones</span>
                      </p>

                     <textarea
                      className={`mt-4 w-full min-h-[130px] rounded-xl border border-slate-200 p-3 text-sm outline-none ${
                        retiroBloqueado ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-white"
                      }`}
                      placeholder="Escriba aquí..."
                      value={observaciones[req.key] || ""}
                      disabled={retiroBloqueado}
                      onChange={(e) =>
                        setObservaciones((p) => ({
                          ...p,
                          [req.key]: e.target.value,
                        }))
                      }
                      onBlur={async (e) => {
                        try {
                          if (retiroBloqueado) return;
                          if (!form.idRetiroLaboral) return;

                          const devolucionCarnetActual =
                            checks[keyFromLabel(`${form.motivoRetiro || ""}_DEVOLUCIÓN CARNET`)] === "SI"
                              ? true
                              : checks[keyFromLabel(`${form.motivoRetiro || ""}_DEVOLUCIÓN CARNET`)] === "NO"
                              ? false
                              : null;

                          await actualizarDetalleRetiroBackend({
                            idRetiroLaboral: form.idRetiroLaboral,
                            idTipificacionRetiro: tipificacionRetiro ? Number(tipificacionRetiro) : null,
                            observacionRetiro: e.target.value || "",
                            devolucionCarnet: devolucionCarnetActual,
                            usuarioActualizacion: "RRLL",
                          });
                        } catch (error) {
                          console.error("Error guardando observación:", error);
                          alert(error.message || "No se pudo guardar la observación.");
                        }
                      }}
                    />
                    </div>
                  );
                }

                if (tipo === "SI/NO") {
                return (
                  <div
                    key={req.key}
                    className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5"
                  >
                    <p className="text-base font-bold text-slate-900">
                      {idx + 1}. {req.labelPretty}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Tipo: <span className="font-semibold">Selección (SI / NO)</span>
                    </p>

                    <div className="mt-4 max-w-sm">
                      <Select
                        value={checks[req.key] || ""}
                        disabled={retiroBloqueado}
                        onValueChange={async (v) => {
                          try {
                            if (retiroBloqueado) return;

                            setChecks((p) => ({ ...p, [req.key]: v }));

                            if (!form.idRetiroLaboral) return;

                            const devolucionCarnetActual =
                              v === "SI" ? true : v === "NO" ? false : null;

                            const observacionActual =
                              observaciones[keyFromLabel(`${form.motivoRetiro || ""}_OBSERVACIONES`)] || "";

                            await actualizarDetalleRetiroBackend({
                              idRetiroLaboral: form.idRetiroLaboral,
                              idTipificacionRetiro: tipificacionRetiro ? Number(tipificacionRetiro) : null,
                              observacionRetiro: observacionActual,
                              devolucionCarnet: devolucionCarnetActual,
                              usuarioActualizacion: "RRLL",
                            });
                          } catch (error) {
                            console.error("Error guardando devolución carnet:", error);
                            alert(error.message || "No se pudo guardar devolución carnet.");
                          }
                        }}
                      >
                        <SelectTrigger
                          className={`h-12 ${
                            retiroBloqueado
                              ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                              : checks[req.key] === "SI"
                              ? "bg-white text-emerald-600 font-semibold"
                              : checks[req.key] === "NO"
                              ? "bg-white text-rose-600 font-semibold"
                              : "bg-white"
                          }`}
                        >
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          <SelectItem value="SI">SI</SelectItem>
                          <SelectItem value="NO">NO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              }

              if (tipo === "VIEW_DOWNLOAD") {
                return (
                  <DocCard
                    key={req.key}
                    idx={idx + 1}
                    title={req.labelPretty}
                    subtitle="Tipo: Solo consulta (Operaciones adjunta)"
                    file={file}
                    actions={
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          className="border-gray-200"
                          disabled={!file}
                          onClick={async () => {
                            try {
                              const fileBackend = adjuntosBackend[req.key] || null;
                              const fileLocal = adjuntos[req.key] || null;

                              if (fileBackend?.IdRetiroLaboralAdjunto) {
                                await verAdjuntoRetiroBackend(fileBackend.IdRetiroLaboralAdjunto);
                                return;
                              }

                              if (fileLocal) {
                                viewLocalFile(fileLocal);
                              }
                            } catch (error) {
                              console.error("Error abriendo adjunto VIEW_DOWNLOAD:", error);
                              alert(error.message || "No se pudo abrir el adjunto.");
                            }
                          }}
                        >
                          Ver
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          className="border-gray-200"
                          disabled={!file}
                          onClick={async () => {
                            try {
                              const fileBackend = adjuntosBackend[req.key] || null;
                              const fileLocal = adjuntos[req.key] || null;

                              if (fileBackend?.IdRetiroLaboralAdjunto) {
                                await descargarAdjuntoRetiroBackend(
                                  fileBackend.IdRetiroLaboralAdjunto,
                                  fileBackend.NombreArchivoOriginal || "adjunto.pdf"
                                );
                                return;
                              }

                              if (fileLocal) {
                                downloadLocalFile(fileLocal);
                              }
                            } catch (error) {
                              console.error("Error descargando adjunto VIEW_DOWNLOAD:", error);
                              alert(error.message || "No se pudo descargar el adjunto.");
                            }
                          }}
                        >
                          Descargar
                        </Button>
                      </div>
                    }
                  />
                );
              }

                return null;
              })}
            </div>

            <div className="mt-5 text-xs text-gray-500">
              * Por ahora esto es interfaz. Luego conectamos BD/API para guardar y descargar desde servidor.
            </div>
          </div>

                   

          {/* ✅ Estado del Proceso General (UI) — AL FINAL */}
          <div className="mt-6 bg-white p-5 rounded-xl border border-gray-100">
            <p className="font-semibold text-gray-700 mb-3">
              Estado del Proceso General
            </p>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-8">
                <Label className="text-xs text-gray-600">Estado</Label>

                <Select
                  value={estadoSeleccionado}
                  onValueChange={setEstadoSeleccionado}
                >
                  <SelectTrigger className="bg-white h-12 border border-emerald-200">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>

                  <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value="ABIERTO">ABIERTO</SelectItem>
                    <SelectItem value="CERRADO">CERRADO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-4">
                <Button
                  type="button"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 h-12"
                  onClick={handleActualizarEstadoProceso}
                  disabled={loadingActualizar}
                >
                  {loadingActualizar ? "Actualizando..." : "Actualizar Estado Proceso"}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            Estado actual: <b>{estadoProceso}</b> | Owner: <b>{ownerProceso}</b>
          </div>

          {retiroBloqueado && (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Este retiro se encuentra <b>CERRADO</b>. Para modificarlo nuevamente, Nómina debe devolverlo a estado <b>ABIERTO</b>.
            </div>
          )}
        </div>
      </div>
    );
  }

  // --------------------------
  // VISTA RETIROS (CABECERA)
  // --------------------------
  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-emerald-600">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Relaciones Laborales</h2>
            <p className="text-sm text-gray-500">Retiros - búsqueda y cabecera</p>
          </div>

          <Button
            variant="outline"
            className="border-gray-200"
            onClick={() => setStep("inicio")}
          >
            Volver
          </Button>
        </div>

        {/* Filtro */}
        <div className="mt-6 bg-gray-50 p-5 rounded-xl border border-gray-100">
          <p className="font-semibold text-gray-700">Filtro</p>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mt-3">
            <div className="md:col-span-4">
              <Label className="text-xs text-gray-600">Tipo Documento</Label>
              <Select
                value={filtroTipoDocumento || ""}
                onValueChange={(v) => setFiltroTipoDocumento(v)}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {["CC", "CE", "TI", "PPT"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-4">
              <Label className="text-xs text-gray-600">Número documento</Label>
              <Input
                value={filtroDocumento}
                onChange={(e) => setFiltroDocumento(e.target.value)}
                placeholder="Buscar por documento..."
                className="bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <Button
                onClick={handleBuscar}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={loadingBuscar}
              >
                {loadingBuscar ? "Buscando..." : "Buscar"}
              </Button>
            </div>
          </div>

          {errorBuscar ? (
            <div className="mt-3 text-xs text-red-600">{errorBuscar}</div>
          ) : null}
        </div>

        {/* Datos Personales */}
        <div className="mt-6 bg-white p-5 rounded-xl border border-gray-100">
          <p className="font-semibold text-gray-700 mb-4">Datos Personales</p>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
              <Label className="text-xs text-gray-600">Fecha de Proceso</Label>
             <Input
              type="date"
              value={form.fechaProceso || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  fechaProceso: e.target.value,
                }))
              }
            />
            </div>

            <div className="md:col-span-3">
              <Label className="text-xs text-gray-600">Tipo ID</Label>
              <Select
                value={form.tipoId || ""}
                onValueChange={(v) => setForm((p) => ({ ...p, tipoId: v }))}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {["CC", "CE", "TI", "PPT"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3">
              <Label className="text-xs text-gray-600">Número documento</Label>
              <Input value={form.numeroDocumento || ""} readOnly className="bg-gray-50" />
            </div>

            <div className="md:col-span-3">
              <Label className="text-xs text-gray-600">Nombre</Label>
              <Input value={form.nombre} readOnly className="bg-gray-50" />
            </div>

            <div className="md:col-span-3">
              <Label className="text-xs text-gray-600">Cargo</Label>
              <Input value={form.cargo} readOnly className="bg-gray-50" />
            </div>

            <div className="md:col-span-3">
              <Label className="text-xs text-gray-600">Dirección de residencia</Label>
              <Input value={form.direccionResidencia} readOnly className="bg-gray-50" />
            </div>

            <div className="md:col-span-3">
              <Label className="text-xs text-gray-600">Barrio</Label>
              <Input value={form.barrio} readOnly className="bg-gray-50" />
            </div>

            <div className="md:col-span-3">
              <Label className="text-xs text-gray-600">Teléfono</Label>
              <Input value={form.telefono} readOnly className="bg-gray-50" />
            </div>

            <div className="md:col-span-3">
              <Label className="text-xs text-gray-600">Correo</Label>
              <Input value={form.correo} readOnly className="bg-gray-50" />
            </div>

            <div className="md:col-span-3">
              <Label className="text-xs text-gray-600">Fecha de ingreso</Label>
              <Input type="date" value={form.fechaInicio || ""} readOnly className="bg-gray-50" />
            </div>



<div className="md:col-span-3">
  <Label className="text-xs text-gray-600">Fecha envío operaciones</Label>
  <Input
    type="text"
    value={form.fechaEnvioOperaciones || ""}
    readOnly
    className="bg-white font-bold text-gray-700 cursor-default"
  />
</div>

<div className="md:col-span-3">
  <Label className="text-xs text-gray-600">Último día laborado</Label>
  <Input
    type="text"
    value={form.fechaFinal || ""}
    readOnly
    className="bg-white font-bold text-gray-700 cursor-default"
    title="Esta fecha la define Operaciones en el Paz y Salvo"
  />
</div>

<div className="md:col-span-3">
  <Label className="text-xs text-gray-600">Fecha cierre proceso</Label>
  <Input
    type="text"
    value={form.fechaCierreProceso || ""}
    readOnly
    className="bg-white font-bold text-gray-700 cursor-default"
  />
</div>

{faltaPazYSalvo && (
  <div className="md:col-span-12">
    <p className="mt-2 text-xs text-gray-500">
      ⚠️ Aún no hay Paz y Salvo de Operaciones. El <b>último día laborado</b> se cargará
      automáticamente cuando Operaciones lo registre. (Presiona <b>Buscar</b> para refrescar)
    </p>
  </div>
)}

            {/* Cliente */}
            <div className="md:col-span-3">
              <Label className="text-xs text-gray-600">Cliente</Label>
              <Select
                value={form.cliente || ""}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    cliente: v,
                    idCliente: getClienteIdByName(v),
                  }))
                }
              >
                <SelectTrigger className="bg-white h-12">
                  <SelectValue placeholder="Seleccionar." className="truncate" />
                </SelectTrigger>

                <SelectContent className="max-h-72 overflow-y-auto">
                  {clientes.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="mt-2 text-[11px] text-gray-400">
                IdRegistroPersonal: <b>{String(form.idRegistroPersonal ?? "")}</b> | IdRetiroLaboral:{" "}
                <b>{String(form.idRetiroLaboral ?? "")}</b> | IdCliente:{" "}
                <b>{String(form.idCliente ?? "")}</b> | IdMotivoRetiro:{" "}
                <b>{String(form.idMotivoRetiro ?? "")}</b>
              </div>
            </div>

             {/* Motivo de retiro */}
        <div className="md:col-span-3">
          <Label className="text-xs text-gray-600">Motivo de retiro</Label>

      <Select
            value={
              form.idMotivoRetiro
                ? getMotivoValueById(form.idMotivoRetiro)
                : (form.motivoRetiro || "")
            }
            onValueChange={handleSelectMotivo}
            disabled={retiroBloqueado}
          >
            <SelectTrigger
              className={`min-h-[64px] flex items-center ${
                retiroBloqueado
                  ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                  : "bg-white"
              }`}
            >
              <SelectValue
                placeholder="Seleccionar (lista)"
                className="whitespace-normal text-center leading-5 w-full"
              />
            </SelectTrigger>

            <SelectContent className="max-h-64 overflow-y-auto">
              {motivos.map((m) => (
                <SelectItem key={m} value={m}>
                  {pretty(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="mt-2 text-xs text-gray-500">
            * Al seleccionar un motivo se abre la vista de documentos automáticamente.
          </p>

          {retiroBloqueado && (
          <p className="mt-2 text-xs text-amber-700">
            ⚠️ El motivo de retiro no se puede cambiar porque el proceso ya está en estado <b>CERRADO</b>.
          </p>
        )}

          {/* ✅ BOTONES */}
          <div className="mt-3 flex flex-wrap items-center justify-start gap-3">
          <button
          type="button"
          className="bg-sky-600 hover:bg-sky-700 text-white shadow-md rounded-xl px-6 py-3"
          onClick={() => {
            console.log("CLICK BOTON IR DOCS", form.idRetiroLaboral);

            if (!form.idRetiroLaboral) {
              setMsgActualizar("⚠️ Aún no hay un retiro activo. Presiona Buscar o selecciona un motivo para crearlo.");
              return;
            }

            abrirVistaDocumentos(form.idRetiroLaboral);
          }}
          title={form.idRetiroLaboral ? "Volver a documentos" : "Aún no hay retiro activo"}
        >
          Ir a documentos
        </button>
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md rounded-xl px-6"
              onClick={handleActualizarCabecera}
              disabled={loadingActualizar}
            >
              {loadingActualizar ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>

          {/* ✅ ALERTA BONITA (pegada al campo) */}
          {msgActualizar ? (
            <div className="mt-3 w-full max-w-md rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {msgActualizar}
            </div>
          ) : null}

                    </div>
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  * El botón Buscar ya recarga desde backend usando tu VITE_API_BASE_URL.
                </div>
              </div>
            </div>
          );
        }