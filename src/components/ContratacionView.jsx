import React, { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { motion } from 'framer-motion';
import { pdf } from "@react-pdf/renderer";
import CreateContract from "@/utils/plantillas/contrato/createContract";
import { getReporteSinergy } from '../services/reporteServiceApi';
import { MotivoRechazoProceso } from '../services/motivoRechazoContratacion';
import { MarcarContratadoProceso } from '../services/motivoContratadoContratacion';


// ✅ FIX: evita "Buffer is not defined" en navegador (Vite/React)
import { Buffer } from "buffer";
if (typeof window !== "undefined" && !window.Buffer) window.Buffer = Buffer;

import {
  FileText,
  Search,
  Filter,
  Briefcase,
  ClipboardList,
  Sheet,
  ChevronLeft,
  ChevronRight,
  Download,
  CalendarDays,
  Landmark,
  Shield,
  FileSignature,
  FileSpreadsheet
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { getEstadoInfo, ALL_STATUS_OPTIONS } from '@/utils/statusUtils';
import { useAspirantes } from '@/hooks/useAspirantes';
import StatusUpdateModal from '@/components/modals/StatusUpdateModal';
import DocumentUploadModal from '@/components/modals/DocumentUploadModal';

// ✅ Modales inline (no tocar otros archivos)
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// ✅ Scroll del modal
import { Textarea } from '@/components/ui/textarea';

// ✅ NUEVO: Scroll del modal para poder bajar/subir y ver el botón Guardar
import { ScrollArea } from '@/components/ui/scroll-area';

// ------------------------------
// ✅ API BASE + Helpers
// ------------------------------
const API_BASE_URL = import.meta?.env?.VITE_API_URL || 'http://localhost:8000';

const getAccessToken = () => {
  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token') ||
    ''
  );
};

const buildAuthHeaders = () => {
  const token = getAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const safeJson = async (res) => {
  const txt = await res.text();
  try { return txt ? JSON.parse(txt) : null; } catch { return txt || null; }
};

// ✅ Helper: intenta varios endpoints hasta que uno responda OK
const apiGetFirstOk = async (paths = []) => {
  for (const path of paths) {
    try {
      const url = `${API_BASE_URL}${path}`;
      const res = await fetch(url, { method: 'GET', headers: buildAuthHeaders() });
      const data = await safeJson(res);
      if (res.ok) return data;
    } catch (e) { /* sigue */ }
  }
  return null;
};

// ✅ Unwrap para respuestas tipo {data: ...} / {items: ...} / {result: ...} y arrays
const unwrapApiPayload = (resp) => {
  if (!resp) return null;
  if (Array.isArray(resp)) return resp;
  if (resp?.data !== undefined) return resp.data;
  if (resp?.items !== undefined) return resp.items;
  if (resp?.result !== undefined) return resp.result;
  if (resp?.registroPersonal !== undefined) return resp.registroPersonal;
  if (resp?.datosAdicionales !== undefined) return resp.datosAdicionales;
  return resp;
};

const buildIdLabelMap = (items, idKeys, labelKeys) => {
  const map = {};
  if (!Array.isArray(items)) return map;

  for (const it of items) {
    if (!it || typeof it !== 'object') continue;

    const idKey = idKeys.find(k => it[k] !== undefined && it[k] !== null);
    const labelKey = labelKeys.find(k => it[k] !== undefined && it[k] !== null && String(it[k]).trim() !== '');

    if (!idKey || !labelKey) continue;

    const id = it[idKey];
    const label = it[labelKey];

    if (id !== undefined && id !== null && label !== undefined && label !== null) {
      map[String(id)] = String(label).trim();
    }
  }
  return map;
};

// ✅ Normaliza texto para comparar (tildes/espacios/mayúsculas)
const normalizeText = (s) => {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

// ✅ Convierte (label o id) -> id number (usa mapa label->id)
const resolveId = (value, labelToIdMap) => {
  if (value === null || value === undefined) return null;

  // si ya es número o string numérica
  const asNum = Number(value);
  if (!Number.isNaN(asNum) && String(value).trim() !== '') return asNum;

  // si es label
  const key = normalizeText(value);
  return labelToIdMap[key] ?? null;
};

// ✅ Detecta IdRegistroPersonal desde el objeto aspirante
const getIdRegistroPersonal = (a) => {
  if (!a) return null;
  return (
    a.IdRegistroPersonal ??
    a.idRegistroPersonal ??
    a.id_registro_personal ??
    a.idRegistro_personal ??
    a.idReg ??
    a.id ??
    null
  );
};

// ✅ helpers numéricos / strings
const isNumericLike = (v) => {
  if (v === null || v === undefined) return false;
  const s = String(v).trim();
  if (!s) return false;
  return !Number.isNaN(Number(s));
};

const pickFirst = (...vals) => {
  for (const v of vals) {
    if (v !== null && v !== undefined && String(v).trim() !== '') return v;
  }
  return null;
};

/* =========================================================
   ✅ HELPERS PARA COMPLETAR DATOS DEL CONTRATO
   ========================================================= */
let _ciudadesIdToLabelCache = null;

// ✅ GET RegistroPersonal por IdRegistroPersonal
const apiGetRegistroPersonalById = async (idRegistroPersonal) => {
  if (!idRegistroPersonal) return null;

  return await apiGetFirstOk([
    `/api/registro-personal/${idRegistroPersonal}`,
    `/api/registro-personal/id/${idRegistroPersonal}`,
    `/api/registro-personal/registro/${idRegistroPersonal}`,
    `/api/registro-personal/registro-personal/${idRegistroPersonal}`,
    `/api/registro_personal/${idRegistroPersonal}`,
  ]);
};

// ✅ GET DatosAdicionales por IdRegistroPersonal
const apiGetDatosAdicionalesByRegistroPersonal = async (idRegistroPersonal) => {
  if (!idRegistroPersonal) return null;

  return await apiGetFirstOk([
    `/api/datos-adicionales/registro-personal/${idRegistroPersonal}`,
    `/api/datos-adicionales/registro_personal/${idRegistroPersonal}`,
    `/api/datos-adicionales/${idRegistroPersonal}`,
    `/api/datosadicionales/registro-personal/${idRegistroPersonal}`,
    `/api/datosadicionales/registro_personal/${idRegistroPersonal}`,
    `/api/datosadicionales/${idRegistroPersonal}`,
    `/api/datos_adicionales/registro_personal/${idRegistroPersonal}`,
    `/api/datos_adicionales/${idRegistroPersonal}`,
  ]);
};

// ✅ Resolver nombre de ciudad desde IdCiudad (caché)
const apiResolveCiudadNombreById = async (idCiudad) => {
  if (!idCiudad) return null;

  // si ya existe en cache
  if (_ciudadesIdToLabelCache && _ciudadesIdToLabelCache[String(idCiudad)]) {
    return _ciudadesIdToLabelCache[String(idCiudad)];
  }

  // intentar cargar lista de ciudades
  const ciudadesResp = await apiGetFirstOk([
    `/api/combos/ciudades`,
    `/api/ciudades`,
    `/api/combos/ciudad`,
    `/api/ciudad`,
  ]);

  const raw = unwrapApiPayload(ciudadesResp);

  const ciudadesList = Array.isArray(raw)
    ? raw
    : (raw?.ciudades || raw?.data || raw?.items || raw?.result || []);

  // construir mapa id -> label
  const map = buildIdLabelMap(
    ciudadesList,
    ['IdCiudad', 'idCiudad', 'id', 'value', 'ID', 'Id'],
    ['NombreCiudad', 'CiudadNombre', 'Nombre', 'nombre', 'Descripcion', 'descripcion', 'label', 'Ciudad', 'ciudad']
  );

  _ciudadesIdToLabelCache = map;

  return map[String(idCiudad)] || String(idCiudad);
};

// ✅ Resolver ciudad desde (id o texto)
const resolveCiudadFromAny = async (maybeIdOrName) => {
  if (!maybeIdOrName) return '';
  if (isNumericLike(maybeIdOrName)) {
    const name = await apiResolveCiudadNombreById(Number(maybeIdOrName));
    return name || String(maybeIdOrName);
  }
  return String(maybeIdOrName);
};

// ✅ GET Asignación (cargo/cliente/salario) por IdRegistroPersonal
const apiGetAsignacionCargoCliente = async (idRegistroPersonal) => {
  if (!idRegistroPersonal) return null;

  const url = `${API_BASE_URL}/api/asignacion-cargo-cliente/${idRegistroPersonal}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: buildAuthHeaders(),
  });

  if (res.status === 404) return null;

  const data = await safeJson(res);

  if (!res.ok) {
    console.error('[CONTRATACION] Error GET asignacion-cargo-cliente:', res.status, data);
    throw new Error(typeof data === 'string' ? data : (data?.detail || 'Error consultando asignación'));
  }

  return data;
};

// ✅ POST Upsert Contratación Básica
const apiUpsertContratacionBasica = async (body) => {
  const url = `${API_BASE_URL}/api/contratacion-basica`;
  const res = await fetch(url, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify(body),
  });

  const data = await safeJson(res);

  if (!res.ok) {
    console.error('[CONTRATACION] Error POST contratacion-basica:', res.status, data);
    throw new Error(typeof data === 'string' ? data : (data?.detail || 'Error guardando contratación básica'));
  }

  return data;
};

// ✅ GET Contratación Básica por IdRegistroPersonal (para precargar el modal)
const apiGetContratacionBasicaByRegistroPersonal = async (idRegistroPersonal) => {
  if (!idRegistroPersonal) return null;

  const url = `${API_BASE_URL}/api/contratacion-basica/registro-personal/${idRegistroPersonal}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: buildAuthHeaders(),
  });

  if (res.status === 404) return null;

  const data = await safeJson(res);

  if (!res.ok) {
    console.error('[CONTRATACION] Error GET contratacion-basica:', res.status, data);
    throw new Error(typeof data === 'string' ? data : (data?.detail || 'Error consultando contratación básica'));
  }

  return data;
};

// ------------------------------
// ✅ FALLBACK (porque NO existe tabla Banco / TipoContrato en tu BD)
// ------------------------------
const BANCOS_FALLBACK = [
  { id: 1, label: 'Banco Caja Social' },
  { id: 2, label: 'Davivienda' },
];

const TIPOS_CONTRATO_FALLBACK = [
  { id: 1, label: 'Indefinido' },
  { id: 2, label: 'Termino Fijo' },
  { id: 3, label: 'Labor Contratada' },
  { id: 4, label: 'Aprendizaje Sena' },
];

const buildLabelToIdFromOptions = (opts = []) => {
  const m = {};
  opts.forEach(o => {
    if (!o) return;
    const id = o.id ?? o.value ?? o.Id ?? o.ID;
    const label = o.label ?? o.nombre ?? o.Nombre ?? o.descripcion ?? o.Descripcion;
    if (id !== undefined && id !== null && label) {
      m[normalizeText(label)] = Number(id);
    }
  });
  return m;
};

// ------------------------------
// ✅ Documentos Ingreso
// ------------------------------

const documentosIngreso = [
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
   { id: 30, label: 'Certificado de afiliación EPS' },
   { id: 73, label: 'Tratamiento de datos' },
   { id: 35, label: 'Fotocopia de carné de vacunas Hepatitis - Tétano' },
];

const documentosSeguridad = [
   { id: 6, label: 'Autorizacón de Tratamiento de datos' },
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
];

const documentosContratacion = [
  { id: 62, label: 'Acuerdos de confidencialidad' },
  { id: 37, label: 'Constancia de inducción' },
  { id: 64, label: 'Otro si (Si aplica)' },
  { id: 26, label: 'Afiliación ARL' },
  { id: 27, label: 'Afiliación EPS' },
  { id: 31, label: 'Afiliación caja de compensación' },
  { id: 36, label: 'Entrega de dotación' },
  { id: 65, label: 'Carnet Aseos la Perfección' },
  { id: 57, label: 'Paquete contratación' },
  { id: 20, label: 'Descripción del cargo y manual de funciones' },
  { id: 74, label: 'Contrato de trabajo' },
  { id: 32, label: 'Certificación bancaria' },
];

const docTypes = {
  ingreso: { title: 'Documentos de Ingreso', list: documentosIngreso, color: 'yellow' },
  seguridad: { title: 'Documentos de Seguridad', list: documentosSeguridad, color: 'blue' },
  contratacion: { title: 'Documentos de Contratación', list: documentosContratacion, color: 'green' },
};

// ------------------------------
// ✅ Modal: Archivo Plano (CSV)
// ------------------------------
const ArchivoPlanoModal = ({ isOpen, onClose, aspirante, onDownload }) => {
  if (!aspirante) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Archivo plano (Synergy / Auditoría)</DialogTitle>
          <DialogDescription>
            Descarga un archivo tipo Excel (CSV) con la información del aspirante para subir a Synergy.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 space-y-2">
          <div><span className="font-semibold">Aspirante:</span> {aspirante.nombres} {aspirante.apellidos}</div>
          <div><span className="font-semibold">Cédula:</span> {aspirante.cedula}</div>
          <div><span className="font-semibold">Cargo:</span> {aspirante.cargo}</div>
          <div><span className="font-semibold">Estado:</span> {aspirante.estado}</div>
          <div className="text-xs text-gray-500 pt-2">
            Nota: Por ahora se genera CSV (abre perfecto en Excel).
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button onClick={onDownload} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Download className="w-4 h-4" /> Descargar CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ------------------------------
// ✅ Modal: Registro (con nuevos campos) + SCROLL
// ------------------------------
const RegistroContratacionModal = ({
  isOpen,
  onClose,
  aspirante,
  onSave,
  bancosOptions = [],
  tiposContratoOptions = [],
  bancosLabelToId = {},
  tiposLabelToId = {},
}) => {
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [banco, setBanco] = useState('');
  const [riesgoLaboral, setRiesgoLaboral] = useState('');
  const [tipoContrato, setTipoContrato] = useState('');
  const [duracionFijo, setDuracionFijo] = useState('');

  // ✅ NUEVOS
  const [posicion, setPosicion] = useState('');
  const [escalafon, setEscalafon] = useState('');
  const [numeroCuenta, setNumeroCuenta] = useState('');

  useEffect(() => {
    let cancel = false;

    const precargar = async () => {
      if (!aspirante || !isOpen) return;

      // reset
      setFechaIngreso('');
      setBanco('');
      setTipoContrato('');
      setRiesgoLaboral('');
      setDuracionFijo('');
      setPosicion('');
      setEscalafon('');
      setNumeroCuenta('');

      const idReg = getIdRegistroPersonal(aspirante);

      // 1) Precargar desde BD (API real)
      if (idReg) {
        try {
          const fromDb = await apiGetContratacionBasicaByRegistroPersonal(idReg);
          if (!cancel && fromDb) {
            const fecha = fromDb.FechaIngreso ? String(fromDb.FechaIngreso).slice(0, 10) : '';
            setFechaIngreso(fecha);

            setBanco(fromDb.IdBanco !== null && fromDb.IdBanco !== undefined ? String(fromDb.IdBanco) : '');
            setTipoContrato(fromDb.IdTipoContrato !== null && fromDb.IdTipoContrato !== undefined ? String(fromDb.IdTipoContrato) : '');
            setRiesgoLaboral(fromDb.RiesgoLaboral || '');

            // ✅ NUEVOS
            setPosicion(fromDb.Posicion || '');
            setEscalafon(fromDb.Escalafon || '');
            setNumeroCuenta(fromDb.NumeroCuenta || '');

            setDuracionFijo('');
            return;
          }
        } catch (e) {
          console.warn('[CONTRATACION] No se pudo precargar contratación básica desde BD:', e);
        }
      }

      // 2) fallback viejo
      const cm = aspirante.contratacionManual || {};

      setFechaIngreso(cm.fechaInicio || cm.fechaIngreso || '');

      const bancoId = cm.IdBanco ?? cm.idBanco ?? resolveId(cm.banco, bancosLabelToId);
      setBanco(bancoId ? String(bancoId) : '');

      const tipoId = cm.IdTipoContrato ?? cm.idTipoContrato ?? resolveId(cm.tipoContrato, tiposLabelToId);
      setTipoContrato(tipoId ? String(tipoId) : '');

      setRiesgoLaboral(cm.riesgoLaboral || '');
      setDuracionFijo(cm.duracionFijo || '');
    };

    precargar();
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspirante, isOpen, bancosLabelToId, tiposLabelToId]);

  useEffect(() => {
    const fijoId = resolveId('Fijo', tiposLabelToId);
    if (String(tipoContrato) !== String(fijoId ?? '')) setDuracionFijo('');
  }, [tipoContrato, tiposLabelToId]);

  const riesgos = ['I', 'II', 'III', 'IV', 'V'];
  const duraciones = ['2 meses', '4 meses', '6 meses', '8 meses', '12 meses'];

  const guardar = () => {
    if (!aspirante) return;

    const payload = {
      fechaInicio: fechaIngreso,
      bancoId: banco,
      riesgoLaboral,
      tipoContratoId: tipoContrato,
      duracionFijo,

      // ✅ NUEVOS
      posicion,
      escalafon,
      numeroCuenta,
    };

    onSave(payload);
  };

  if (!aspirante) return null;

  const bancosFinal = (Array.isArray(bancosOptions) && bancosOptions.length > 0)
    ? bancosOptions
    : BANCOS_FALLBACK;

  const tiposFinal = (Array.isArray(tiposContratoOptions) && tiposContratoOptions.length > 0)
    ? tiposContratoOptions
    : TIPOS_CONTRATO_FALLBACK;

  const fijoId = resolveId('Fijo', tiposLabelToId);
  const isFijo = fijoId ? (String(tipoContrato) === String(fijoId)) : false;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden border-0 max-h-[92vh]">
        <div className="h-2 bg-gradient-to-r from-emerald-600 to-blue-600" />

        <div className="p-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Registro de contratación</h2>
              <p className="text-sm text-gray-500 mt-1">
                Completa la información para{' '}
                <span className="font-semibold text-gray-800">
                  {aspirante.nombres} {aspirante.apellidos}
                </span>
              </p>

              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                <ClipboardList className="w-4 h-4" />
                Información básica de contratación
              </div>
            </div>

            <Button variant="ghost" className="text-gray-500 hover:bg-gray-100" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>

        <ScrollArea className="max-h-[72vh] px-6 pb-6">
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-4 h-4 text-emerald-600" />
                <Label className="text-sm font-semibold text-gray-800">Fecha de ingreso</Label>
              </div>

              <Input
                type="date"
                value={fechaIngreso}
                onChange={(e) => setFechaIngreso(e.target.value)}
                className="rounded-xl"
              />
              <p className="text-xs text-gray-500 mt-2">Puedes seleccionarla desde el calendario.</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Landmark className="w-4 h-4 text-blue-600" />
                <Label className="text-sm font-semibold text-gray-800">Banco</Label>
              </div>

              <Select value={banco} onValueChange={setBanco}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecciona banco" />
                </SelectTrigger>
                <SelectContent>
                  {bancosFinal.map((b) => {
                    const id = b.id ?? b.IdBanco ?? b.value ?? b.Id ?? b.ID;
                    const label = b.label ?? b.NombreBanco ?? b.nombre ?? b.Nombre ?? b.descripcion ?? b.Descripcion ?? `Banco ${id}`;
                    return (
                      <SelectItem key={String(id)} value={String(id)}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <p className="text-xs text-gray-500 mt-2">Entidad para pago de nómina.</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-emerald-700" />
                <Label className="text-sm font-semibold text-gray-800">Riesgo laboral</Label>
              </div>

              <Select value={riesgoLaboral} onValueChange={setRiesgoLaboral}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecciona riesgo" />
                </SelectTrigger>
                <SelectContent>
                  {riesgos.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <p className="text-xs text-gray-500 mt-2">Nivel de riesgo (I a V).</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <FileSignature className="w-4 h-4 text-blue-700" />
                <Label className="text-sm font-semibold text-gray-800">Contrato</Label>
              </div>

              <Select value={tipoContrato} onValueChange={setTipoContrato}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecciona tipo de contrato" />
                </SelectTrigger>
                <SelectContent>
                  {tiposFinal.map((t) => {
                    const id = t.id ?? t.IdTipoContrato ?? t.value ?? t.Id ?? t.ID;
                    const label = t.label ?? t.NombreTipoContrato ?? t.nombre ?? t.Nombre ?? t.descripcion ?? t.Descripcion ?? `Contrato ${id}`;
                    return (
                      <SelectItem key={String(id)} value={String(id)}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <p className="text-xs text-gray-500 mt-2">Selecciona el tipo según la contratación.</p>
            </div>

            {isFijo && (
              <div className="md:col-span-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <Label className="text-sm font-semibold text-emerald-800">Duración del contrato fijo</Label>
                    <p className="text-xs text-emerald-700 mt-1">Solo aplica cuando el contrato es “Fijo”.</p>
                  </div>
                </div>

                <div className="mt-3">
                  <Select value={duracionFijo} onValueChange={setDuracionFijo}>
                    <SelectTrigger className="rounded-xl bg-white">
                      <SelectValue placeholder="Selecciona duración (2,4,6,8,12 meses)" />
                    </SelectTrigger>
                    <SelectContent>
                      {duraciones.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-emerald-700" />
                <Label className="text-sm font-semibold text-gray-800">Posición</Label>
              </div>

             <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={15} // ayuda cuando el teclado ya es numérico
                placeholder="Escribe el código de posición"
                value={posicion}
                onChange={(e) => {
                  const soloNumeros = e.target.value.replace(/\D/g, "").slice(0, 15);
                  setPosicion(soloNumeros);
                }}
                className="rounded-xl"
              />


              <p className="text-xs text-gray-500 mt-2">Campo manual (código numérico).</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="w-4 h-4 text-blue-700" />
                <Label className="text-sm font-semibold text-gray-800">Escalafón</Label>
              </div>

              <Select value={escalafon} onValueChange={setEscalafon}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecciona escalafón" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="200">200</SelectItem>
                  <SelectItem value="220">220</SelectItem>
                </SelectContent>
              </Select>

              <p className="text-xs text-gray-500 mt-2">Solo 200 o 220.</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                <Label className="text-sm font-semibold text-gray-800">Número de cuenta</Label>
              </div>

             <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Escribe el número de cuenta"
              value={numeroCuenta}
              onChange={(e) => {
                const soloNumeros = e.target.value.replace(/\D/g, "");
                setNumeroCuenta(soloNumeros);
              }}
              className="rounded-xl"
            />

              <p className="text-xs text-gray-500 mt-2">Campo manual (se guarda como texto para no perder ceros).</p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm md:col-span-1 flex flex-col">
              <div>
                <Label className="text-sm font-semibold text-emerald-800"></Label>
                <p className="text-xs text-emerald-700 mt-1">
                  Guarda la información en Contratación Básica.
                </p>
              </div>

              <div className="mt-4 flex items-center justify-end gap-3">
                <Button variant="outline" onClick={onClose} className="rounded-xl px-6">
                  Cerrar
                </Button>
                <Button
                  onClick={guardar}
                  className="rounded-xl px-6 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Guardar
                </Button>
              </div>
            </div>

            <div className="md:col-span-2 h-2" />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

// ------------------------------
const ContratacionView = () => {
    // Estados para los filtros de fecha
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // ✅ VISUAL: Modal No Contratado (solo UI por ahora)
  const [ncModal, setNcModal] = useState({ isOpen: false, aspirante: null });
  const [ncObservacion, setNcObservacion] = useState('');

  // ✅ VISUAL: estado local "C / NC" (solo para mostrar en pantalla)
  // Clave: IdRegistroPersonal (string) => "C" | "NC"
  const [estadoVisualMap, setEstadoVisualMap] = useState({});

  // Abrir modal NC
  const openNCModal = (aspirante) => {
    setNcObservacion('');
    setNcModal({ isOpen: true, aspirante });
  };

  // Guardar NC (solo visual)
  const guardarNCVisual = async () => {
    const a = ncModal.aspirante;
    if (!a) return;

    
    const idReg = String(getIdRegistroPersonal(a) ?? '');
    const payload = {
      IdRegistroPersonal: idReg,
      ObservacionesRechazo: ncObservacion,
    };
    const respons = await MotivoRechazoProceso(payload)
  
    setEstadoVisualMap((prev) => ({ ...prev, [idReg]: 'NC' }));
    if (respons.status === 200 || respons.status === 201) {
      toast({
        title: '✅ Actualización Exitosa',
        description: "Motivo de rechazo guardado correctamente.",
      });
    } else {
      toast({
        title: '❌ Error al guardar',
        description: "No se pudo guardar el motivo de rechazo.",
        variant: 'destructive',
      });
    }
    setNcModal({ isOpen: false, aspirante: null });
  };

        // Marcar C (solo visual)
          const marcarContratadoBD = async (aspirante) => {
        const idReg = String(getIdRegistroPersonal(aspirante) ?? '');
        if (!idReg) return;

        const asignacion = asignacionMap?.[idReg] || {};

        const tieneCargoCompleto =
          asignacion?.IdCargo !== undefined &&
          asignacion?.IdCargo !== null &&
          String(asignacion.IdCargo).trim() !== '' &&
          String(asignacion.IdCargo) !== '0';

        const tieneClienteCompleto =
          asignacion?.IdCliente !== undefined &&
          asignacion?.IdCliente !== null &&
          String(asignacion.IdCliente).trim() !== '' &&
          String(asignacion.IdCliente) !== '0';

        const tieneSalarioCompleto =
          asignacion?.Salario !== undefined &&
          asignacion?.Salario !== null &&
          String(asignacion.Salario).trim() !== '' &&
          Number(asignacion.Salario) > 0;

        if (!tieneCargoCompleto || !tieneClienteCompleto || !tieneSalarioCompleto) {
          toast({
            title: 'No es posible avanzar a contratación',
            description: 'Para marcar como contratado debe tener cargo, cliente y salario completos.',
            variant: 'destructive',
          });
          return;
        }

      const payload = { IdRegistroPersonal: Number(idReg) };
      const resp = await MarcarContratadoProceso(payload);

      if (resp.status === 200) {
        setEstadoVisualMap((prev) => ({ ...prev, [idReg]: 'C' }));

        toast({
          title: '✅ Aspirante CONTRATADO',
          description: 'Estado actualizado correctamente en la BD.',
        });

        // refresca tabla desde backend
        if (typeof loadAspirantes === 'function') loadAspirantes();
      } else {
        toast({
          title: '❌ Error al actualizar',
          description: resp?.data?.detail || 'No se pudo marcar como contratado.',
          variant: 'destructive',
        });
      }
    };
  // ------------------------------
  // ✅ Export Sinergy Excel
  // ------------------------------
  const exportToExcel = async () => {
    if (!fechaInicio || !fechaFin) {
      toast({
        title: '⚠️ Falta rango de fecha',
        description: 'Por favor seleccionar el rango de fecha para descargar el reporte de Sinergy',
        variant: 'destructive',
      });
      return;
    }

    const response = await getReporteSinergy(fechaInicio, fechaFin);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Cargue Sinergy');

    const columns = [
      'empleado','pnombre','snombre','papellido','sapellido','fecha_nacimiento','tipo_doc_id','num_doc_id','ciudad_doc_id','sexo','fecha_ingreso','salario','fecha_sueldo','tipo_sueldo','sucursal','centro_costos_1','centro_costos_2','centro_costos_3','centro_costos_4','centro_costos_5','tipo_empleado','tipo_contrato','fecha_terminacion','regimen','cargo','fondo_cesantias','fecha_cesantia','entidad_pension','sucursal_pension','fecha_pension','entidad_salud','sucursal_salud','fecha_salud','caja_compensacion','fecha_caja_compensacion','corporacion','cuenta','tipo_cuenta','sucursal_bancaria','tipo_pago','auxilio_seguro','porcentaje_seguro','indicador_retencion','porcentaje_retención','estado','fecha_retiro','motivo_retiro','cuenta_gasto','entidad_riesgo','sucur_Ent_riesgo','fecha_riesgo','centro_trabajo','fecha_centro_trabajo','tarifa_especial','ncontrato','email','direccion','telefono','estado_civil','fecha_cencos','tipo_acumulado','barrio','pais','departamento','lugar_nacimiento','tipo_sangre','estatura','peso','ojos','piel','cabello','seNales','tipo_libreta_militar','libreta_militar','categ_conducir','licencia_conducir','pasaporte','certif_juducial','fecha_vencimiento_certif_judicial','nivel_estudios','matricula_profesional','fecha_matricula_prof','tarjeta_profesional','fecha_tarjeta_prof','empresa','posicion','abreviatura','tipo_cotizante','subtipo_cotizante','extranjero_pension','reside_exterior','activo_pensionado','codigo_campo_dia_sabado','trabaja_sabado','fecha_cambio_sabado','codigo_talla','talla','codigo_calzado','calzado','escalafon','fecha_escalafon','auxilio_pension','porcentaje_pension','auxilio_solidaridad','porcentaje_solidaridad','tipo_sueldo_empleado','depto_residencia','municipio_resid'
    ];

    // Fila de encabezados descriptivos (puedes personalizar)
    const headers = [
        'Descripción',
        'Si la compaNía definió en la creación de empleados asignar un código es necesario que el usuario relacione el código del empleado, de lo contrario, se debe dejar el campo vacío para que en la creación el sistema asigne un consecutivo.',
        'Primer nombre',
        'Segundo nombre',
        'Primer apellido',
        'Segundo apellido',
        'Fecha de nacimiento   (dd/mm/yyyy)',
        'Tipo de documento de identidad:\n(C) para cédula de ciudadanía \n(T) para tarjeta de identidad \n(E) para cédula de extranjería \n(U) Permiso por protección temporal',
        'Número de identificación, sin carácter especial.',
        'Nombre de la ciudad de expedición del documento de identidad',
        'Debe ser \n(M) Masculino ó \n(F) Femenino',
        'Fecha de ingreso del empleado en la compaNía (dd/mm/yyyy)',
        'Sueldo actual, este campo no debe ser: Vacío, con caracteres alfanuméricos, en ceros o un número negativo',
        'Fecha del último aumento de salario del empleado. Si no se puede determinar esta fecha se debe mover la misma fecha de ingreso (dd/mm/yyyy)',
        'Código que identifica el tipo de sueldo del empleado como son: (000) Sin Definir. (001) Salario Interno Pesos. (002) Salario Dólares. Debe existir una equivalencia',
        'Código de la sucursal a la que pertenece el empleado. Si no se conoce colocar (001)',
        'Código del centro de costos nivel 1 especificado en la implementación, si no se conoce o no tiene es necesario dejar el campo con el código (000).',
        'Código del centro de costos nivel 2 especificado en la implementación, si no se conoce o no tiene es necesario dejar el campo con el código (000)',
        'Código del centro de costos nivel 3 especificado en la implementación, si no se conoce o no tiene es necesario dejar el campo con el código (000)',
        '4 Código del centro de costos nivel  especificado en la implementación, si no se conoce o no tiene es necesario dejar el campo con el código (000)',
        '5 Código del centro de costos nivel  especificado en la implementación, si no se conoce o no tiene es necesario dejar el campo con el código (000)',
        'Código del tipo de empleado según la tabla tipo_empleado del sistema Sinergy. Por ejemplo: (001) – Administrativos (002) – Pensionados Se asigna el código estipulado en la implementación',
        'Código del tipo de contrato. Estos deben ser: (1) Indefinido \n(2) Término Fijo \n(3) Labor contratada \n(4) Aprendizaje SENA',
        'Si el tipo de contrato es (2 Término Fijo o 4 Aprendizaje SENA), mover la fecha de terminación del contrato. De lo contrario no mover nada (dd/mm/yyyy)',
        'Código del régimen laboral del empleado. Debe ser: \n(1) Integral \n(2) Ley 50 \n(3) Régimen anterior \n(4) Aprendizaje SENA',
        'Código del cargo del empleado. Si existe integración con Gestión Humana, este campo debe ir en blanco ya que, bajo integración, el cargo está dado por la posición.',
        'Código del fondo de cesantías al que se halla afiliado el empleado. Si no está definido el código del fondo cesantías se debe mover el código: (000) sin definir',
        'Fecha de afiliación del empleado al fondo de Cesantías . Si la fecha existe no debe ser menor a la fecha de ingreso, si no se puede determinar esta fecha se debe mover la fecha de ingreso (dd/mm/yyyy)',
        'Código del fondo de pensiones (A.F.P.) al que se halla afiliado el empleado. Si no está definido el código de la entidad pensión se debe mover el código: (P000) sin definir.',
        'Se debe especificar el código de la sucursal de la entidad. Si no se conoce es importante asignar la sucursal (001) como principal.',
        'Fecha de afiliación del empleado al fondo de pensión . Si la fecha existe no debe ser menor a la fecha de ingreso, si no se puede determinar esta fecha se debe mover la fecha de ingreso (dd/mm/yyyy)',
        'Código de la entidad promotora de salud (E.P.S.) a la que se halla afiliado el empleado. Si no está definido algún código de entidad_salud se debe mover el código: (S000) sin definir',
        'Se debe especificar el código de la sucursal de la entidad. Si no se conoce es importante asignar la sucursal (001) como principal.',
        'Fecha de afiliación del empleado a la entidad promotora de salud (E.P.S). Si la fecha existe no debe ser menor a la fecha de ingreso, si no se puede determinar esta fecha se debe mover la fecha de ingreso (dd/mm/yyyy).',
        'Código de la caja de compensación. Si no está definida se debe mover el código: (000) Sin Definir',
        'Fecha afiliación del empleado caja de compensación. Si no se puede determinar esta fecha se debe mover la fecha de ingreso (dd/mm/yyyy)',
        'Código de la corporación a la que pertenece la cuenta de consignación. Si no hay consignación por que el pago es 100% en efectivo, no mover nada.',
        'Número de la cuenta de la corporación donde se le consignan los pagos.',
        'ipo de cuenta bancaria. Debe ser: (001) Ahorros, (002) Corriente. ',
        'Se debe especificar el código de la sucursal de la entidad. Si no se conoce es importante asignar la sucursal (001) como principal.',
        'Puede ser: \n(CO) - Consignación \n(CH) - Cheque \n(EF) - Efectivo',
        'Código (1) si no existe auxilio de seguro Código (2) si existe auxilio de seguro',
        'Si el auxilio_seguro es código (1) no mover nada. (2) se debe mover el porcentaje del auxilio que la empresa da al empleado, Si el auxilio_seguro es código ',
        'Código 1 si la retención es por porcentaje, Código 2 si la retención es por tabla.',
        'Si el indicador _retención es código 1 se debe mover el porcentaje de retención correspondiente al semestre. Si es código 2 no se mueve nada.',
        'Estado actual del empleado. (A) Activo y (R) Retirado.',
        'Si el empleado está retirado (estado=R) mover la fecha de retiro, la cual debe ser mayor a la de ingreso.',
        'Motivo por el cual se retiró. Debe ser: (001) Voluntario, (002) Terminación contrato, (003) Despido injustificado, (004) Despido justificado, o en general, cualquier código existente en la tabla motivo_retiro. Si no se puede determinar el motivo del retiro mover (000)Sin Definir.',
        'Cuenta contable asociada al empleado para efectos de contabilización de la nómina. Si no se conoce la cuenta_gasto no mover nada.',
        'Código de la entidad de riesgo. Si no se conoce mover (R000).',
        'Se debe especificar el código de la sucursal de la entidad. Si no se conoce es importante asignar la sucursal (001) como principal.',
        'Fecha de afiliación a la entidad de riesgo. Si no se conoce mover la fecha de ingreso. (dd/mm/yyyy).',
        'Agrupación para determinar el nivel (o la tarifa) de riesgo. Si hay integración con Gestión Humana y se han asignado tarifas de riesgo a los sitios de trabajo y éstos, a su vez, tiene asignadas posiciones, este campo puede ir en blanco; en este caso, el sistema asigna automáticamente la tarifa de riesgo desde Gestión Humana. Si existe integración pero este campo no viene en blanco entonces el sistema asigna el del archivo (es decir, prevalece el centro de trabajo del archivo plano). Si no hay integración, este campo es obligatorio.',
        'Fecha de cambio del centro de trabajo.',
        'Tarifa especial de pensión. Indicar el porcentaje.',
        'Asignar el número del último contrato. Verficar con la plantilla de historico de contrato. Si solo ha tenido un contrato diligenciar "1"',
        'El email del empleado debe llevar el @.',
        'Direción del empleado',
        'Número telefónico del empleado',
        '(000) Sin Definir \n(001) Soltero \n(002) Casado \n(003) Unión Libre \n(004) Viudo (005) Separado',
        'Fecha de centro (dd/mm/yyyy). Si viene en blanco se asigna la fecha de ingreso.',
        '(N) Nomina (P) presupuesto Si viene en blanco el sistema asigna (N).',
        'Nombre del barrio ',
        '(000) Sin definir (169) Colombiano ',
        'Se debe asignar con la codificación del DANE.',
        'Se debe asignar con la codificación del DANE del lugar de nacimiento',
        '(000) Sin Definir \n(001) A+ \n(002) A- \n(003) B+ \n(004) B- \n(005) O+ \n(006) O- \n(007) AB+ \n(008) AB-',
        'Numero: (1) entero y (2) decimales. La estatura del empleado debe expresarse en metros; es decir para una persona que su estatura son 180 centímetros, este campo debe expresarse 1,80, ya que es el espacio reservado en la base de datos para este campo. Si la medida sobre pasa más de 1 número entero, es decir de 10 en adelante el sistema arrojara un error de “Desbordamiento Aritmético” ya que no cumple con la medida máxima permitida.',
        'Peso del empleado (Kg)',
        '(000) Sin Definir \n(001) Negros \n(002) Verdes \n(003) Cafés \n(004) Azules',
        '(000) Sin Definir \n(001) Blanca \n(002) Negra \n(003) TrigueNa',
        '(000) Sin Definir \n(001) Negro \(002) CastaNo \n(003) Rubio \(004) Rojizo',
        'Descripción de seNales o dejar en blanco',
        '(N) No tiente (P) Primera clase S Segunda Clase',
        'Número de libreta militar. Si el empleado no tiene libreta se deja vacío el campo.',
        'Número de categoria para conducir.',
        'Número de licencia. Si el empleado no tiene licencia se deja vacio el campo.',
        'Número de número de pasaporte. Si el empleado no tiene pasaporte se deja vacio el campo.',
        'Número de certificado judicial',
        'Fecha vencimiento certificado judicial (dd/mm/yyyy)',
        '000 Sin Definir \n001 Primaria \n002 Bachillerato \n003 Técnico \n004 Tecnológico \n005 Universitario \n006 Especialización \n007 Maestría \n008 Doctorado \n009 P.H.D',
        'Número de matricula profecional.',
        'Fecha de matricula profecional.',
        'Número de tarjeta profesional.',
        'Fecha de tarjeta profesional',
        'Código de la empresa a la que pertenece el empleado. Debe ser un código existente en el maestro de componentes (tabla grm_componente). Este campo es obligatorio sólo si existe manejo de empresa; de lo contrario, puede ir en blanco.',
        'Posición de la que es titular el empleado. Debe ser un código existente en el maestro de componentes (tabla grm_componente.',
        'Código de identificación del empleado definido por el usuario. Este campo permite al usuario manejar una codificación personalizada, independiente del código consecutivo asignado automáticamente por el sistema (cuando hay manejo de consecutivo para empleado). Si viene en blanco, el sistema asigna como abreviatura el primer apellido seguido de la primera letra del segundo apellido, del primer nombre y del segundo nombre (por ejemplo HURTADOCA para Camilo Alfonso Hurtado).',
        'Código del tipo cotizante según las resoluciones del Ministerio de Protección Social para empleados activos o pensionados activos.',
        'Código del subtipo cotizante según las resoluciones del Ministerio de Protección Social para empleados activos o pensionados activos.',
        'Indica si es un extranjero que aporta a pensión., Pude tener (N) o (S).',
        'Indica si el empleado es colombiano y está trabajando temporalmente en el exterior. Puede tener (N) o (S).',
        'Indica si el empleado es un activo o es un pensionado. Puede tener (A) – Activo ó (P) – Pensionado Nota: Este campo tambien es utilizado para los empleados retirados que requieren tener una misma posición. El campo se asigna como(P) y con esto la posición pa puede ser utilizada para por el empleado.',
        'Código correspondiente al campo adicional para información del empleado debe ser (01)',
        'Definición del parámetro para trabajo en día sábado: Trabaja día sábado: (S); No trabaja día sábado: (N) ó vacio.',
        'Fecha de cambio de trabajo día sábado, permite manejar la información histórica con cada cambio de fecha (dd/mm/yyyy)',
        'Código correspondiente al campo adicional para información del empleado (se definen en la tabladatos_adicionales)',
        'Definición de talla del empleado, si no se conoce dejar el campo sin llenar.',
        'Código correspondiente al campo adicional para información delempleado (se definen en la tabladatos_adicionales), si no se conoce dejar el campo sin llenar.',
        'Definición de calzado del empleado, si no se conoce dejar el campo sin llenar.',
        'Código escalafón: \n(000) Sin Definir; \n(120) Jornada 120 horas \n(150) Jornada 150 horas \n(180) Jornada 180 horas \n(240) Jornada 240 horas',
        'Fecha de cambio escalafón (dd/mm/yyyy)',
        'Definición del tipo de auxilio pensión según los siguientes criterios: \n(1) Sin auxilio \n(2) Depende del concepto \n(3) Depende del empleador \n(4) Por la diferencia \n(5) Total empresa \n(6) Total Empleado.',
        'Si el auxilio_pension es código (3) se debe mover el porcentaje del auxilio que la empresa da al empleado, de lo contrario no mover nada',
        'Definición del tipo de auxilio pensión según los siguientes criterios: (1) Sin auxilio (2) Depende del concepto (3) Depende del empleador (4) Por la diferencia (5) Total empresa (6) Total Empleado.',
        'Si el auxilio_pension es código (3) se debe mover el porcentaje del auxilio que la empresa da al empleado, de lo contrario no mover nada',
        'Código de tipo de sueldo para el empleado Fijo: (F) ó Variable: (V)',
        'Código del departamento de residencia.',
        'Municipio de residencia.'
      ];

      // Fila de obligatoriedad
      const required = [
        'Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio',
        'Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio',
        'Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio',
        'Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio',
        'Obligatorio','opcional','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Opcional','Obligatorio','Obligatorio',
        'Obligatorio','Obligatorio','Obligatorio','Opcional','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio',
        'Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio',
        'Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Opcional','Obligatorio','Opcional','Opcional',
        'Opcional','Opcional','Opcional','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio',
        'Obligatorio','Obligatorio','Opcional','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio',
        'Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio','Obligatorio'
      ];


    // Fila de ejemplo: 110 columnas vacías
    const example = Array(110).fill('');

    // Mapear datos del servicio response.data
    let dataRows = [];
    if (response && Array.isArray(response.data.filas)) {
      dataRows = response.data.filas.map(item =>
        ['', ...columns.map(col => item[col] !== undefined ? item[col] : '')]
      );
    } else {
      // Fallback: usar aspirantes locales si no hay datos del servicio
      const aspirantesToExport = (!filteredAspirantes || filteredAspirantes.length === 0)
        ? aspirantes
        : filteredAspirantes;
      dataRows = aspirantesToExport.map(a =>
        ['', ...columns.map(col => a[col] !== undefined ? a[col] : '')]
      );
    }

      // Fila de códigos de columna (según lo solicitado por el usuario)
      const codes = [
        '1','2','3','4','5','6','7','8','9','10','11/01/1900','12','13/01/1900','14','15','16','17','18','19','20','21','22','23','24','25','26','27/01/1900','28','29','30/01/1900','31','32','02/02/1900','34','04/02/1900','36','37','38','39','40','41','42','43','44','45','46','47','48','49','50','20/02/1900','52','22/02/1900','54','55','56','57','58','59','29/02/1900','61','62','63','64','65','66','67','68','69','70','71','72','73','74','75','76','77','78','79','80','81','82','83','84','85','86','87','88','89','90','91','92','93','94','95','96','97','98','99','100','10/04/1900','102','103','104','105','106','107','108'
      ];

      // Fila de formato/códigos por columna (según lo solicitado por el usuario)
      const formatCodes = [
        'A(15)','A(30)','A(30)','A(30)','A(30)','A(10)','A(1)','N(15)','A(25)','A(1)','A(10)','F(15)','A(10)','A(3)','A(4)','A(20)','A(20)','A(20)','A(20)','A(20)','A(3)','N(1)','A(10)','N(1)','A(6)','A(4)','A(10)','A(4)','A(3)','A(10)','A(4)','A(3)','A(10)','A(5)','A(10)','A(6)','A(20)','A(3)','A(3)','A(2)','N(1)','N(7)','N(1)','N(7)','A(1)','A(10)','A(3)','A(15)','A(4)','A(3)','A(10)','A(6)','A(10)','N(7)','N(1)','A(100)','A(80)','A(25)','A(3)','A(10)','A(1)','A(80)','A(3)','A(6)','A(25)','A(3)','A(3)','N(5)','A(3)','A(3)','A(3)','A(100)','A(1)','A(15)','A(15)','A(15)','A(15)','A(20)','A(10)','A(3)','A(20)','A(10)','A(20)','A(10)','A(15)','A(10)','A(20)','A(2)','A(2)','A(1)','A(1)','A(1)','A(15)','A(1)','A(10)','A(15)','A(2)','A(15)','A(15)','A(16)','A(10)','N(1)','N(7)','N(1)','N(7)','A(6)','A(6)','A(6)'
      ];

      // Agregar filas, comenzando desde la columna D (deja A, B y C vacías para filas 1, 3, 4 y 5)
      worksheet.addRow(['', '', '', ...codes]); // Fila 1: códigos, empieza desde D
      worksheet.addRow(['', '', ...headers]);   // Fila 2: encabezados, sigue desde C (como antes)
      worksheet.addRow(['', '', '', ...formatCodes]); // Fila 3: formatos, empieza desde D
      worksheet.addRow(['', '', '', ...columns]);     // Fila 4: columnas, empieza desde D
      worksheet.addRow(['', '', '', ...required]);    // Fila 5: obligatoriedad, empieza desde D
      worksheet.addRow(['', '', ...example]);         // Fila 6: ejemplo, sigue desde C (como antes)
      dataRows.forEach(row => worksheet.addRow(['', '', ...row])); // Datos reales, siguen desde D
      // Centrar los datos de las filas exportadas
      const firstDataRow = 7; // La primera fila de datos reales (después de encabezados y ejemplo)
      for (let i = 0; i < dataRows.length; i++) {
        const row = worksheet.getRow(firstDataRow + i);
        row.eachCell(cell => {
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        });
      }

      // Estilos de color de fondo para filas 1, 2 y 3 (exceljs soporta degradado simple, pero usamos sólido para compatibilidad)
      // Azul vivo
      const pastelBlue = '1976D2';
      [1,2,3].forEach(rowIdx => {
        const row = worksheet.getRow(rowIdx);
        row.eachCell(cell => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: pastelBlue }
          };
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: rowIdx === 2 };
        });
      });

      // Aplicar color de fondo más claro a partir de la columna D (col 4) en filas 2 y 3
      const lightBlue = '90CAF9';
      [2,3].forEach(rowIdx => {
        const row = worksheet.getRow(rowIdx);
        for (let col = 4; col <= row.cellCount; col++) {
          const cell = row.getCell(col);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: lightBlue }
          };
        }
      });

      // Aplicar bordes marcados a todas las celdas de las filas 1,2,3,4,5
      const borderStyle = {
        top:    { style: 'thin' },
        left:   { style: 'thin' },
        bottom: { style: 'thin' },
        right:  { style: 'thin' }
      };
      [1,2,3,4,5].forEach(rowIdx => {
        const row = worksheet.getRow(rowIdx);
        row.eachCell(cell => {
          cell.border = borderStyle;
        });
      });

      // Ajustar altura de la fila 2 (headers descriptivos y espacio para imagen)
      worksheet.getRow(2).height = 150; // Puedes ajustar este valor según lo necesites

      [1,2,3,4,5].forEach(rowIdx => {
        const row = worksheet.getRow(rowIdx);
        [1,2].forEach(colIdx => {
          const cell = row.getCell(colIdx);
          cell.fill = undefined; // Quita color
          cell.border = undefined; // Quita bordes
        });
      });

      // Ajustar ancho de todas las columnas a 25
      for (let i = 1; i <= columns.length + 3; i++) { // +3 por las columnas vacías al inicio
        worksheet.getColumn(i).width = 25;
      }

      const row3 = worksheet.getRow(3);
      row3.eachCell(cell => {
        cell.alignment = { ...cell.alignment, wrapText: true };
      });

      const row4 = worksheet.getRow(4);
      row4.eachCell(cell => {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.font = { ...cell.font, bold: true };
      });

      const row5 = worksheet.getRow(5);
      row5.eachCell(cell => {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      });

       try {
        const response = await fetch('/LOGO/sinergy-lowells.png');
        if (!response.ok) throw new Error('No se pudo obtener la imagen: ' + response.statusText);
        const imageBlob = await response.blob();
        const arrayBuffer = await imageBlob.arrayBuffer();
        const imageId = workbook.addImage({
          buffer: new Uint8Array(arrayBuffer),
          extension: 'png',
        });
        worksheet.addImage(imageId, {
          tl: { col: 0, row: 0 },
          br: { col: 2, row: 2 }
        });
      } catch (err) {
        console.error('No se pudo agregar la imagen:', err);
      }

      // Descargar archivo
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `plantilla_contratacion_${new Date().toISOString().slice(0,10)}.xlsx`);
      toast({ title: "📄 Reporte Sinergy", description: "Archivo Excel descargado correctamente." });
    };
  const { aspirantes, updateAspirante, loadAspirantes } = useAspirantes();
  const navigate = useNavigate();

  const [filteredAspirantes, setFilteredAspirantes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(['todos','Contratado']);

  const [asignacionMap, setAsignacionMap] = useState({});
  const [cargoMap, setCargoMap] = useState({});
  const [clienteMap, setClienteMap] = useState({});

  const [bancosOptions, setBancosOptions] = useState([]);
  const [tiposContratoOptions, setTiposContratoOptions] = useState([]);
  const [bancoLabelToId, setBancoLabelToId] = useState(buildLabelToIdFromOptions(BANCOS_FALLBACK));
  const [tipoContratoLabelToId, setTipoContratoLabelToId] = useState(buildLabelToIdFromOptions(TIPOS_CONTRATO_FALLBACK));

  const [modalState, setModalState] = useState({ isOpen: false, aspirante: null, docType: null });
  const [planoModalState, setPlanoModalState] = useState({ isOpen: false, aspirante: null });
  const [registroModalState, setRegistroModalState] = useState({ isOpen: false, aspirante: null });
  const [statusUpdateModalState, setStatusUpdateModalState] = useState({ isOpen: false, aspirante: null, newStatus: null });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  useEffect(() => {
    if (aspirantes.length === 0) loadAspirantes();
  }, [loadAspirantes, aspirantes.length]);

  useEffect(() => {
    let cancel = false;

    const cargarCombosContratacion = async () => {
      try {
        const [bancosResp, tiposResp] = await Promise.all([
          apiGetFirstOk(['/api/combos/bancos', '/api/bancos', '/api/combos/banco', '/api/banco']),
          apiGetFirstOk([
            '/api/combos/tipos-contrato',
            '/api/tipos-contrato',
            '/api/combos/tipo-contrato',
            '/api/tipo-contrato',
            '/api/combos/tipo-contratos',
          ]),
        ]);

        if (cancel) return;

        const bancosRaw = unwrapApiPayload(bancosResp);
        const tiposRaw = unwrapApiPayload(tiposResp);

        const bancosList =
          Array.isArray(bancosRaw) ? bancosRaw :
            (bancosRaw?.data || bancosRaw?.items || bancosRaw?.result || bancosRaw?.bancos || []);

        const tiposList =
          Array.isArray(tiposRaw) ? tiposRaw :
            (tiposRaw?.data || tiposRaw?.items || tiposRaw?.result || tiposRaw?.tiposContrato || tiposRaw?.tipos || []);

        if (Array.isArray(bancosList) && bancosList.length > 0) {
          const bancosIdToLabel = buildIdLabelMap(
            bancosList,
            ['IdBanco', 'idBanco', 'id', 'value', 'ID', 'Id'],
            ['NombreBanco', 'BancoNombre', 'Nombre', 'nombre', 'Descripcion', 'descripcion', 'label', 'Banco', 'banco']
          );

          const opts = Object.entries(bancosIdToLabel).map(([id, label]) => ({ id: Number(id), label }));
          setBancosOptions(opts);
          setBancoLabelToId(buildLabelToIdFromOptions(opts));
        }

        if (Array.isArray(tiposList) && tiposList.length > 0) {
          const tiposIdToLabel = buildIdLabelMap(
            tiposList,
            ['IdTipoContrato', 'idTipoContrato', 'id', 'value', 'ID', 'Id'],
            ['NombreTipoContrato', 'TipoContratoNombre', 'Nombre', 'nombre', 'Descripcion', 'descripcion', 'label', 'TipoContrato', 'tipoContrato']
          );

          const opts = Object.entries(tiposIdToLabel).map(([id, label]) => ({ id: Number(id), label }));
          setTiposContratoOptions(opts);
          setTipoContratoLabelToId(buildLabelToIdFromOptions(opts));
        }

      } catch (err) {
        console.warn('[CONTRATACION] No se pudieron cargar combos bancos/tipos contrato (se usa fallback).', err);
      }
    };

    cargarCombosContratacion();
    return () => { cancel = true; };
  }, []);

  useEffect(() => {
    let cancel = false;

    const cargarCombos = async () => {
      try {
        const [cargosResp, clientesResp] = await Promise.all([
          apiGetFirstOk(['/api/combos/cargos', '/api/cargos', '/api/combos/cargo', '/api/cargo']),
          apiGetFirstOk(['/api/combos/clientes', '/api/clientes', '/api/combos/cliente', '/api/cliente']),
        ]);

        if (cancel) return;

        const cargosRaw = unwrapApiPayload(cargosResp);
        const clientesRaw = unwrapApiPayload(clientesResp);

        const cargosList =
          Array.isArray(cargosRaw) ? cargosRaw :
            (cargosRaw?.data || cargosRaw?.items || cargosRaw?.result || cargosRaw?.cargos || []);

        const clientesList =
          Array.isArray(clientesRaw) ? clientesRaw :
            (clientesRaw?.data || clientesRaw?.items || clientesRaw?.result || clientesRaw?.clientes || []);

        const cargoMapBuilt = buildIdLabelMap(
          cargosList,
          ['IdCargo', 'idCargo', 'id', 'value', 'ID', 'Id'],
          [
            'DescripcionCargo', 'NombreCargo', 'CargoNombre',
            'Descripcion', 'descripcion',
            'Nombre', 'nombre',
            'label',
            'Cargo', 'cargo'
          ]
        );

        const clienteMapBuilt = buildIdLabelMap(
          clientesList,
          ['IdCliente', 'idCliente', 'id', 'value', 'ID', 'Id'],
          [
            'NombreCliente', 'ClienteNombre',
            'RazonSocial', 'NombreComercial',
            'Descripcion', 'descripcion',
            'Nombre', 'nombre',
            'label',
            'Cliente', 'cliente'
          ]
        );

        setCargoMap(cargoMapBuilt);
        setClienteMap(clienteMapBuilt);

      } catch (err) {
        console.warn('[CONTRATACION] No se pudieron cargar combos de cargo/cliente (se mostrará “—”).', err);
      }
    };

    cargarCombos();
    return () => { cancel = true; };
  }, []);

  useEffect(() => {
    let filtered = aspirantes;

    if (statusFilter !== 'todos') {
      filtered = filtered.filter(a => a.estado.trim() === statusFilter);
    }

    if (statusFilter === 'todos') {
      filtered = filtered.filter(a => a.estado.trim() === 'Avanza a Contratación' || a.estado.trim() === 'Contratado');
    }

    if (searchTerm) {
      filtered = filtered.filter(a =>
        `${a.nombres} ${a.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.cedula || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAspirantes(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, aspirantes]);

  const openModal = (aspirante, docType) => {
    setModalState({ isOpen: true, aspirante, docType });
  };

  const openRegistroModal = (aspirante) => {
    setRegistroModalState({ isOpen: true, aspirante });
  };

  const openPlanoModal = (aspirante) => {
    setPlanoModalState({ isOpen: true, aspirante });
  };

  const confirmStatusUpdate = (details) => {
    const { aspirante, newStatus } = statusUpdateModalState;

    const newHistoryEntry = { estado: newStatus, fecha: new Date().toISOString(), ...details };
    const updatedAspirante = {
      ...aspirante,
      estado: newStatus,
      historialEstados: aspirante.historialEstados ? [...aspirante.historialEstados, newHistoryEntry] : [newHistoryEntry]
    };

    updateAspirante(updatedAspirante);

    toast({
      title: "✅ Estado Actualizado",
      description: `El aspirante ha sido movido a "${getEstadoInfo(newStatus).label}".`
    });

    setStatusUpdateModalState({ isOpen: false, aspirante: null, newStatus: null });
  };

  const handleDocumentSave = (updatedDocs) => {
    const targetAspirante = modalState.aspirante;
    const updatedAspirante = { ...targetAspirante, documentosGestion: updatedDocs };

    updateAspirante(updatedAspirante);
    toast({ title: "💾 Cambios guardados", description: "La documentación ha sido actualizada." });
  };

  const handleRegistroSave = async (payload) => {
    const a = registroModalState.aspirante;
    if (!a) return;

    const idRegistroPersonal = getIdRegistroPersonal(a);
    if (!idRegistroPersonal) {
      toast({
        title: "❌ Error",
        description: "No se encontró IdRegistroPersonal del aspirante. Revisa el objeto aspirante.",
        variant: "destructive",
      });
      return;
    }

    const idBanco = resolveId(payload.bancoId, bancoLabelToId);
    const idTipoContrato = resolveId(payload.tipoContratoId, tipoContratoLabelToId);

    if (!idBanco) {
      toast({
        title: "❌ Banco inválido",
        description: "No pude convertir el banco seleccionado a su ID.",
        variant: "destructive",
      });
      return;
    }

    if (!idTipoContrato) {
      toast({
        title: "❌ Tipo de contrato inválido",
        description: "No pude convertir el tipo de contrato seleccionado a su ID.",
        variant: "destructive",
      });
      return;
    }

    if (!payload.fechaInicio) {
      toast({
        title: "❌ Falta fecha",
        description: "La fecha de ingreso es obligatoria.",
        variant: "destructive",
      });
      return;
    }

    if (!payload.riesgoLaboral) {
      toast({
        title: "❌ Falta riesgo",
        description: "El riesgo laboral es obligatorio.",
        variant: "destructive",
      });
      return;
    }

    const body = {
      IdRegistroPersonal: Number(idRegistroPersonal),
      IdBanco: Number(idBanco),
      IdTipoContrato: Number(idTipoContrato),
      FechaIngreso: payload.fechaInicio,
      RiesgoLaboral: payload.riesgoLaboral,

      Posicion: (payload.posicion ?? '').trim() || null,
      Escalafon: (payload.escalafon ?? '').trim() || null,
      NumeroCuenta: (payload.numeroCuenta ?? '').trim() || null,
    };

    try {
      await apiUpsertContratacionBasica(body);

      toast({
        title: "✅ Registro guardado",
        description: "Se guardó correctamente en Contratación Básica (BD).",
      });

      setRegistroModalState({ isOpen: false, aspirante: null });

      if (typeof loadAspirantes === 'function') loadAspirantes();
    } catch (err) {
      toast({
        title: "❌ No se pudo guardar",
        description: String(err?.message || err),
        variant: "destructive",
      });
    }
  };

  const escapeCSV = (v) => {
    const s = String(v ?? '');
    if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const buildArchivoPlanoRows = (a) => {
    const headersRow = [
      'cedula',
      'nombres',
      'apellidos',
      'cargo',
      'telefono',
      'email',
      'estado',
      'fecha_exportacion',
      'tipo_contrato',
      'duracion_fijo',
      'fecha_inicio',
      'salario',
      'observaciones_contratacion'
    ];

    const row = [
      a.cedula,
      a.nombres,
      a.apellidos,
      a.cargo,
      a.telefono,
      a.email,
      a.estado,
      new Date().toISOString(),
      a.contratacionManual?.tipoContrato || '',
      a.contratacionManual?.duracionFijo || '',
      a.contratacionManual?.fechaInicio || '',
      a.contratacionManual?.salario || '',
      a.contratacionManual?.observaciones || ''
    ];

    return { headers: headersRow, row };
  };

  const downloadCSV = () => {
    const a = planoModalState.aspirante;
    if (!a) return;

    const { headers: headersRow, row } = buildArchivoPlanoRows(a);

    const csv = [
      headersRow.map(escapeCSV).join(';'),
      row.map(escapeCSV).join(';')
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `archivo_plano_synergy_${a.cedula || 'aspirante'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    toast({ title: "📄 Archivo plano generado", description: "CSV descargado correctamente." });
    setPlanoModalState({ isOpen: false, aspirante: null });
  };

  const formatMoney = (n) => {
    if (n === null || n === undefined || n === '') return '';
    const num = Number(n);
    if (Number.isNaN(num)) return String(n);
    return new Intl.NumberFormat('es-CO').format(num);
  };

  const sortedData = React.useMemo(() => {
    let sortableItems = [...filteredAspirantes];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredAspirantes, sortConfig]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // ✅ Cargar asignación SOLO para visibles
  const currentIdsKey = currentItems
    .map(a => String(getIdRegistroPersonal(a) ?? ''))
    .filter(Boolean)
    .join('|');

  useEffect(() => {
    let cancel = false;

    const cargarAsignacionesVisibles = async () => {
      if (!currentItems || currentItems.length === 0) return;

      const ids = currentItems
        .map(a => getIdRegistroPersonal(a))
        .filter(Boolean)
        .map(id => String(id));

      const idsPendientes = ids.filter(id => !asignacionMap[id]);
      if (idsPendientes.length === 0) return;

      try {
        await Promise.all(
          idsPendientes.map(async (idStr) => {
            const data = await apiGetAsignacionCargoCliente(idStr);
            if (!data) return;
            if (cancel) return;

            setAsignacionMap(prev => ({
              ...prev,
              [String(idStr)]: data,
            }));
          })
        );
      } catch (err) {
        console.error('[CONTRATACION] Error cargando asignaciones:', err);
      }
    };

    cargarAsignacionesVisibles();
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdsKey]);

  /* =========================================================
     /* =========================================================
     ✅ buildContractData
     - Solo barrio (sin ciudad)
     - Fecha nacimiento prioriza RegistroPersonal
     - Nacionalidad NO se anula (se deja venir del aspirante)
     - ✅ Expedida en: prioriza RegistroPersonal (LugarExpedicion)
     ========================================================= */
  const buildContractData = async (aspirante) => {
    const idReg = getIdRegistroPersonal(aspirante);

    // 1) Asignación (salario/cargo/cliente)
    let asignacion = idReg ? asignacionMap[String(idReg)] : null;
    if (!asignacion && idReg) {
      try {
        asignacion = await apiGetAsignacionCargoCliente(idReg);
      } catch (e) {
        console.warn("[CONTRATO] No pude traer asignación:", e);
      }
    }

    // 2) RegistroPersonal
    let regResp = null;
    if (idReg) {
      try {
        regResp = await apiGetRegistroPersonalById(idReg);
      } catch (e) {
        console.warn("[CONTRATO] No pude traer RegistroPersonal:", e);
      }
    }
    const regRaw = unwrapApiPayload(regResp);
    const regObj = Array.isArray(regRaw) ? (regRaw[0] || null) : regRaw;

    // 3) DatosAdicionales
    let daResp = null;
    if (idReg) {
      try {
        daResp = await apiGetDatosAdicionalesByRegistroPersonal(idReg);
      } catch (e) {
        console.warn("[CONTRATO] No pude traer DatosAdicionales:", e);
      }
    }
    const daRaw = unwrapApiPayload(daResp);
    const daObj = Array.isArray(daRaw) ? (daRaw[0] || null) : daRaw;

    // 3.1) Si la API no trae nada, conserva lo que ya venía en el aspirante
    const aspiranteDA =
      aspirante?.datos_adicionales ??
      aspirante?.datosAdicionales ??
      aspirante?.DatosAdicionales ??
      null;

    const aspiranteDA0 = Array.isArray(aspiranteDA) ? (aspiranteDA[0] || null) : aspiranteDA;

    // 4) IdCiudad (lo conservamos por si lo ocupas, pero NO vamos a mandar ciudad al contrato)
    const idCiudadNum =
      pickFirst(
        daObj?.IdCiudad, daObj?.idCiudad,
        aspiranteDA0?.IdCiudad, aspiranteDA0?.idCiudad,
        aspirante?.IdCiudad, aspirante?.idCiudad
      );

    // ✅ SOLO BARRIO: no enviamos ciudad
    const ciudadNombre = "";

    // 5) Dirección/Barrio (con fallback)
    const direccion =
      pickFirst(
        daObj?.Direccion, daObj?.direccion,
        aspiranteDA0?.Direccion, aspiranteDA0?.direccion,
        aspirante?.Direccion, aspirante?.direccion
      ) || "";

    const barrio =
      pickFirst(
        daObj?.Barrio, daObj?.barrio,
        aspiranteDA0?.Barrio, aspiranteDA0?.barrio,
        aspirante?.Barrio, aspirante?.barrio
      ) || "";

    // 6) ✅ EXPEDIDA EN (prioriza BD RegistroPersonal)
    const expedidaRaw =
      pickFirst(
        // ✅ REGISTROPERSONAL (BD) primero
        regObj?.LugarExpedicion, regObj?.lugarExpedicion,
        regObj?.CiudadExpedicion, regObj?.ciudadExpedicion,
        regObj?.ExpedidaEn, regObj?.expedidaEn,
        regObj?.ciudad_expedicion, regObj?.CiudadDocumento, regObj?.ciudadDocumento,
        regObj?.CiudadDoc, regObj?.ciudadDoc,

        // ✅ Si en BD llega ID (por si acaso)
        regObj?.IdCiudadExpedicion, regObj?.idCiudadExpedicion,
        regObj?.IdCiudadDocumento, regObj?.idCiudadDocumento,

        // ✅ Aspirante (después)
        aspirante?.expedida_en, aspirante?.expedidaEn,
        aspirante?.ciudad_expedicion, aspirante?.ciudadExpedicion,
        aspirante?.CiudadExpedicion
      );

    const expedidaEnFinal = expedidaRaw? (await resolveCiudadFromAny(expedidaRaw)).toString().trim(): "";

    // 7) datos_adicionales FINAL (solo barrio)
    const datos_adicionales_final = [
      {
        Direccion: direccion,
        Barrio: barrio,
        Ciudad: "",
        IdCiudad: "",
        direccion,
        barrio,
        ciudad: "",
        IdCiudadNum: idCiudadNum ?? null,
        ciudad_barrio: barrio || "", // ✅ SOLO barrio
      }
    ];

    // 8) Teléfonos / correo
    const celular =
      pickFirst(
        aspirante?.celular,
        aspirante?.telefono,
        aspirante?.Telefono,
        regObj?.Celular,
        regObj?.celular,
        regObj?.Telefono,
        regObj?.telefono
      ) || "";

    const correo =
      pickFirst(
        aspirante?.correo,
        aspirante?.email,
        aspirante?.Email,
        regObj?.Correo,
        regObj?.correo,
        regObj?.Email,
        regObj?.email
      ) || "";

    // ✅ nacionalidad: SOLO aspirante
    const nacionalidadSoloAspirante =
      pickFirst(
        aspirante?.nacionalidad,
        aspirante?.Nacionalidad
      ) || null;

    // 9) Data final para el PDF
    const contractData = {
      ...aspirante,

      celular: aspirante?.celular ?? celular,
      correo: aspirante?.correo ?? correo,

      telefono_fijo: aspirante?.telefono_fijo ?? aspirante?.telefonoFijo ?? celular,

      // ✅ FECHA NACIMIENTO (prioriza RegistroPersonal)
      fecha_nacimiento:
        regObj?.FechaNacimiento ??
        regObj?.fecha_nacimiento ??
        regObj?.fechaNacimiento ??
        aspirante?.fecha_nacimiento ??
        aspirante?.FechaNacimiento ??
        null,

      // ✅ NACIONALIDAD (solo aspirante)
      nacionalidad: nacionalidadSoloAspirante,

      salario: aspirante?.salario ?? asignacion?.Salario,

      cargo_nombre: aspirante?.cargo_nombre ?? asignacion?.CargoNombre ?? aspirante?.cargo,
      cliente_nombre: aspirante?.cliente_nombre ?? asignacion?.ClienteNombre,

      // ✅ “Expedida en”
      expedida_en: expedidaEnFinal,
      expedidaEn: expedidaEnFinal,
      ciudad_expedicion: expedidaEnFinal,
      ciudadExpedicion: expedidaEnFinal,

      // ✅ por si el contrato lee dirección/barrio directo del root
      Direccion: aspirante?.Direccion ?? direccion,
      direccion: aspirante?.direccion ?? direccion,
      Barrio: aspirante?.Barrio ?? barrio,
      barrio: aspirante?.barrio ?? barrio,
      Ciudad: ciudadNombre,
      ciudad: ciudadNombre,

      // ✅ esto es lo que usa normalmente el contrato
      datos_adicionales: datos_adicionales_final,
    };

    return contractData;
  };


  const descargarContrato = async (aspirante) => {
    try {
      const contractData = await buildContractData(aspirante);

      console.log("CONTRATO DATA FINAL:", contractData);

      const blob = await pdf(
        <CreateContract data={contractData} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contrato_laboral_${contractData?.cedula || "aspirante"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "✅ Contrato generado",
        description: "PDF descargado correctamente.",
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "❌ Error generando contrato",
        description: String(e?.message || e),
        variant: "destructive",
      });
    }
  };

   // ------------------------------
  // ✅ Acciones con íconos (FUNCIONANDO)
  // ------------------------------
 const ActionIconButton = ({ title, onClick, children, variant = 'slate' }) => {
  const variants = {
    emerald:
      'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300',
    blue:
      'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300',
    indigo:
      'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300',
    slate:
      'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white hover:border-slate-300',
  };

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={[
        'h-9 w-9 inline-flex items-center justify-center rounded-xl border',
        'shadow-sm transition-all hover:shadow-md active:scale-95',
        variants[variant],
      ].join(' ')}
    >
      {/* El icono hereda el color del botón */}
      {React.cloneElement(children, { className: 'w-4 h-4' })}
    </button>
    );
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-emerald-600">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Contratación</h1>
                <p className="text-sm text-gray-500">Gestión inicial y formalización de contratos.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
              <div className="flex-1 relative flex items-center">
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-4 pr-10 w-full md:w-56 border-emerald-200 focus:border-emerald-500 rounded-xl"
                />
                <Button size="icon" variant="ghost" className="absolute right-0 hover:bg-transparent" onClick={() => { }}>
                  <Search className="w-5 h-5 text-gray-400" />
                </Button>
              </div>

              <div className="w-full sm:w-64 flex flex-col gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-emerald-200 focus:border-emerald-500 rounded-xl">
                    <Filter className="w-4 h-4 mr-2 text-emerald-600" />
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los Estados</SelectItem>
                   {ALL_STATUS_OPTIONS
                      .filter((s) =>
                        ["Avanza a Contratación", "Contratado"].includes(s)
                      )
                      .map((status) => (
                        <SelectItem key={status} value={status}>
                          {getEstadoInfo(status).label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          {/* Contenedor independiente para descarga Sinergy */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex flex-col gap-2">
            <span style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 2 }}>
              Seleccionar la fecha correspondiente a la fecha de ingreso para generar archivo plano para el reporte de Sinergy
            </span>
            <div className="flex flex-row flex-wrap items-center gap-2 mt-1">
              <label className="font-medium text-sm flex items-center gap-1">
                Fecha inicio:
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={e => setFechaInicio(e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                  style={{ minWidth: 120 }}
                />
              </label>
              <label className="font-medium text-sm flex items-center gap-1">
                Fecha fin:
                <input
                  type="date"
                  value={fechaFin}
                  onChange={e => setFechaFin(e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                  style={{ minWidth: 120 }}
                />
              </label>
              <Button
                onClick={exportToExcel}
                className="border-green-400 text-green-700 hover:bg-green-50 rounded-xl gap-2"
                variant="outline"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Descargar Excel
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-center">Estado</th>
                    <th className="px-6 py-3">Nombre</th>
                    <th className="px-6 py-3">Apellido</th>
                    <th className="px-6 py-3">Cargo</th>
                    <th className="px-6 py-3">Salario</th>
                    <th className="px-6 py-3">Cliente</th>
                    <th className="px-6 py-3 text-center">Actualizar Estado</th>
                    <th className="px-6 py-3 text-right" style={{ textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>

                <tbody className="uppercase">
                    {currentItems.length > 0 ? (
                      currentItems.map(aspirante => {
                      const idReg = getIdRegistroPersonal(aspirante);
                      const asignacion = idReg ? asignacionMap[String(idReg)] : null;

                      const cargoNombre =
                        asignacion?.CargoNombre ||
                        (asignacion?.IdCargo ? cargoMap[String(asignacion.IdCargo)] : '') ||
                        (aspirante.cargo || '');

                      const cargoCell = cargoNombre || '—';

                      const salarioCell = asignacion && asignacion.Salario !== undefined && asignacion.Salario !== null
                        ? formatMoney(asignacion.Salario)
                        : '';

                      const clienteCell = asignacion && asignacion.ClienteNombre
                        ? asignacion.ClienteNombre
                        : '';

                      return (
                        <tr>
                          <td className="px-6 py-4 font-medium text-gray-900">{aspirante.estado}</td>
                          <td className="px-6 py-4 font-medium text-gray-900">{aspirante.nombres}</td>
                          <td className="px-6 py-4 text-gray-600">{aspirante.apellidos}</td>

                          <td className="px-6 py-4 text-gray-600">{cargoCell}</td>
                          <td className="px-6 py-4 text-gray-600">{salarioCell}</td>

                          <td className="px-6 py-4">
                            {clienteCell ? (
                              <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-xs font-medium border border-indigo-100">
                                {clienteCell}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {(() => {
                              const idRegStr = String(getIdRegistroPersonal(aspirante) ?? '');
                              const estadoVisual = idRegStr ? estadoVisualMap[idRegStr] || '' : '';

                              const baseBtn = 'h-8 w-10 rounded-lg border text-xs font-bold transition';
                              const activoC = 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700';
                              const activoNC = 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700';
                              const inactivo = 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50';

                              return (
                              <div className="inline-flex items-center gap-2">
                                <button
                                type="button"
                                title="Contratado"
                                className={`${baseBtn} ${estadoVisual === 'C' ? activoC : inactivo}`}
                                onClick={() => marcarContratadoBD(aspirante)}
                                >
                                C
                                </button>
                                {aspirante.estado.trim() !== "Contratado" && (
                                  <button
                                    type="button"
                                    title="No contratado"
                                    className={`${baseBtn} ${estadoVisual === 'NC' ? activoNC : inactivo}`}
                                    onClick={() => openNCModal(aspirante)}
                                  >
                                  NC
                                  </button>
                                )}
                              </div>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex items-center justify-end gap-2">
                              <ActionIconButton
                                title="Registro de contratación"
                                onClick={() => openRegistroModal(aspirante)}
                              >
                                <ClipboardList className="w-4 h-4" />
                              </ActionIconButton>
                              <ActionIconButton
                                title="Documentos de ingreso"
                                onClick={() => openModal(aspirante, 'activos')}
                              >
                                <Sheet className="w-4 h-4" />
                              </ActionIconButton>
                              <ActionIconButton
                                title="Descargar contrato"
                                onClick={() => descargarContrato(aspirante)}
                              >
                                <Download className="w-4 h-4" />
                              </ActionIconButton>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No se encontraron resultados</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200 bg-gray-50/50">
                <div className="text-sm text-gray-500">
                  Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedData.length)} de {sortedData.length}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <RegistroContratacionModal
        isOpen={registroModalState.isOpen}
        onClose={() => setRegistroModalState({ isOpen: false, aspirante: null })}
        aspirante={registroModalState.aspirante}
        onSave={handleRegistroSave}
        bancosOptions={bancosOptions}
        tiposContratoOptions={tiposContratoOptions}
        bancosLabelToId={bancoLabelToId}
        tiposLabelToId={tipoContratoLabelToId}
      />

      <DocumentUploadModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, aspirante: null, docType: null })}
        aspirante={modalState.aspirante}
        onSave={handleDocumentSave}
        docTypeConfigIngreso={docTypes.ingreso}
        docTypeConfigSeguridad={docTypes.seguridad}
        docTypeConfigContratacion={docTypes.contratacion}
        docTypeConfigPaquete={docTypes.paquete}
      />

      <ArchivoPlanoModal
        isOpen={planoModalState.isOpen}
        onClose={() => setPlanoModalState({ isOpen: false, aspirante: null })}
        aspirante={planoModalState.aspirante}
        onDownload={downloadCSV}
      />

      <StatusUpdateModal
        isOpen={statusUpdateModalState.isOpen}
        onClose={() => setStatusUpdateModalState({ isOpen: false, aspirante: null, newStatus: null })}
        onSubmit={confirmStatusUpdate}
        currentStatus={statusUpdateModalState.aspirante?.estado}
        newStatus={statusUpdateModalState.newStatus}
        aspiranteName={`${statusUpdateModalState.aspirante?.nombres} ${statusUpdateModalState.aspirante?.apellidos}`}
      />
      <Dialog open={ncModal.isOpen} onOpenChange={(open) => setNcModal((p) => ({ ...p, isOpen: open }))}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>No contratado</DialogTitle>
            <DialogDescription>Escribe la observación. (Solo visual por ahora)</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Observación</Label>
            <Textarea
              value={ncObservacion}
              onChange={(e) => setNcObservacion(e.target.value)}
              placeholder="Ej: No cumple perfil..."
              className="min-h-[110px]"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setNcModal({ isOpen: false, aspirante: null })}>
              Cancelar
            </Button>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white" onClick={guardarNCVisual}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContratacionView;