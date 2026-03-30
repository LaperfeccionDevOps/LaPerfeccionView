import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Save,
  X,
  UserCheck,
  Briefcase,
  ClipboardCheck
} from 'lucide-react';

import entrevistaCandidatoService from "../../services/entrevistaCandidatoService";
import { getAsignacionCargoCliente } from "../../services/asignacionCargoClienteServiceApi";
import { RegistrarDocumentosSeguridad } from "../../services/documentosSeguridad";
import { DescargarDocumentoPdf } from "../../services/descargarDocumento";
import { toast } from '@/components/ui/use-toast';

const DOCUMENTO_ENTREVISTA_SELECCION_ID = 67;

const getLogoBase64 = async (logo) => {
  let res = null;

  switch (logo) {
    case 'LOGO1':
      res = await fetch('/LOGO/LOGOPRINCIPAL.png');
      break;
    case 'LOGO2':
      res = await fetch('/LOGO/LOGO_MANTENER_INGENIERIA.png');
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


// Si ya tienes una URL base en .env, úsala (ej: VITE_API_URL=http://localhost:8000)
// Si no existe, usa http://localhost:8000 por defecto.
const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL)) ||
  'http://localhost:8000';

const EntrevistaModal = ({ isOpen, onClose, onSave, aspirante, existingData = null }) => {
  const [loadingPrefill, setLoadingPrefill] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [cargoAplicaNombre, setCargoAplicaNombre] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    tipoDocumento: 'Cédula de Ciudadanía',
    tipoDocumentoId: null,
    identificacion: '',
    expedicion: '',
    fechaExpedicion: '',
    barrio: '',
    localidad: '',
    cargo: '',
    edad: '',
    estadoCivil: '',
    hijos: '',
    celular: '',
    idTipoCargo: '',
    tipoCargo: '',
    estudiaActualmente: 'No',
    aspectoAcademico: '',
    aspectoLaboralExperiencia: '',
    fortalezas: '',
    areasDeMejora: '',
    reintegroProceso: 'No',
    haTenidoAccidentes: 'No',
    validacionMinSalud: 'Si',
    antecedentesMedicos: '',
    idEps: '',
    haTrabajado: 'No',
    detalleAccidente: '',

    // ✅ NUEVO (SIN TOCAR LO DEMÁS): Patologías / Enfermedades
    haTenidoPatologias: 'No',
    detallePatologia: '',

    conceptoFinalPruebaFisica: '',
    conceptoFinalPruebaSeleccion: '',
    observacionesFinales: '',
    entrevistadoPor: 'Usuario Actual',
    cargoAccion: '',
    examenesMedicos: 'PENDIENTE',
    estadoProceso: 'NUEVO',
    fechaAvanzaContratacion: '',
    motivoAvanza: '',
    salario: '',
    cliente: '',

    fechaCreacion: new Date().toISOString().split('T')[0],
    fechaActualizacion: new Date().toISOString().split('T')[0],
  });
  console.log('formData', formData);

  const getToken = () => {
    // No tocamos tu lógica: solo intentamos leer lo que exista.
    return (
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      ''
    );
  };

  const getIdRegistroPerso = () => {
    // Intentamos varias variantes para no dañarte nada si cambia el nombre
    return (
      aspirante?.IdRegistroPersonal ??
      aspirante?.idRegistroPersonal ??
      aspirante?.IdRegistroPerso ??
      aspirante?.idRegistroPerso ??
      aspirante?.id_registro_perso ??
      aspirante?.id ??
      null
    );
  };

  const mapTipoDocumentoToLabel = (value) => {
    // Si llega un número desde backend, lo mapeamos con una lógica segura.
    // Si ya llega string, lo dejamos.
    if (value === null || value === undefined) return 'Cédula de Ciudadanía';
    if (typeof value === 'string') return value;

    const map = {
      1: 'Cédula de Ciudaddania',
      2: 'Cédula de Extranjería',
      3: 'Permiso Protección (PPT)',
      4: 'Tarjeta de Identidad'
    };
    return map[value] || 'Cédula de Ciudadanía';
  };

  // const applyPrefillToForm = (prefillResp) => {
  //   const datos = prefillResp?.datos_personales || {};
  //   const entrevista = prefillResp?.entrevista || null;

  //   setFormData(prev => {
  //     const next = { ...prev };

  //     // Datos personales
  //     next.nombre = datos?.NombreCompleto ?? prev.nombre ?? '';
  //     next.tipoDocumentoId = datos?.TipoDocumento ?? prev.tipoDocumentoId ?? null;
  //     next.tipoDocumento = mapTipoDocumentoToLabel(datos?.TipoDocumento ?? prev.tipoDocumento);
  //     next.identificacion = datos?.Identificacion ?? prev.identificacion ?? '';

  //     // En tu API vienen dos: FechaExpedicion y LugarExpedicion
  //     // UI tiene "Lugar Expedición" (campo expedicion)
  //     next.expedicion = datos?.LugarExpedicion ?? prev.expedicion ?? '';
  //     next.fechaExpedicion = datos?.FechaExpedicion ?? prev.fechaExpedicion ?? '';

  //     next.edad = (datos?.Edad ?? prev.edad ?? '').toString();
  //     next.estadoCivil = (datos?.EstadoCivil ?? prev.estadoCivil ?? '').toString();
  //     next.hijos = (datos?.Hijos ?? prev.hijos ?? '').toString();
  //     next.celular = datos?.Celular ?? prev.celular ?? '';
  //     next.barrio = datos?.Barrio ?? prev.barrio ?? '';
  //     next.localidad = datos?.Localidad ?? prev.localidad ?? '';

  //     // Si ya existe entrevista guardada en BD, la cargamos
  //     if (entrevista) {
  //       // Backend: Cargo, HaTenidoAccide(bool), Fortalezas, AreasDeMejora, ConceptoFinalS, ObservacionesF, EntrevistadorPo, AccidenteCual
  //       if (entrevista.Cargo !== undefined && entrevista.Cargo !== null) next.cargo = entrevista.Cargo;
  //       if (entrevista.Fortalezas !== undefined && entrevista.Fortalezas !== null) next.fortalezas = entrevista.Fortalezas;
  //       if (entrevista.AreasDeMejora !== undefined && entrevista.AreasDeMejora !== null) next.areasDeMejora = entrevista.AreasDeMejora;
  //       if (entrevista.ConceptoFinalS !== undefined && entrevista.ConceptoFinalS !== null) next.conceptoFinalPruebaSeleccion = entrevista.ConceptoFinalS;
  //       if (entrevista.ObservacionesF !== undefined && entrevista.ObservacionesF !== null) next.observacionesFinales = entrevista.ObservacionesF;
  //       if (entrevista.EntrevistadorPo !== undefined && entrevista.EntrevistadorPo !== null) next.entrevistadoPor = entrevista.EntrevistadorPo;

  //       const tuvoAcc = !!entrevista.HaTenidoAccide;
  //       next.haTenidoAccidentes = tuvoAcc ? 'Si' : 'No';
  //       next.detalleAccidente = tuvoAcc ? (entrevista.AccidenteCual || prev.detalleAccidente || '') : '';

  //       // Fechas si existen
  //       if (entrevista.FechaActualizacion) {
  //         // viene timestamp; dejamos yyyy-mm-dd
  //         const d = new Date(entrevista.FechaActualizacion);
  //         if (!isNaN(d.getTime())) next.fechaActualizacion = d.toISOString().split('T')[0];
  //       } else {
  //         next.fechaActualizacion = new Date().toISOString().split('T')[0];
  //       }
  //     } else {
  //       // Si no hay entrevista, solo actualizamos fecha actual
  //       next.fechaActualizacion = new Date().toISOString().split('T')[0];
  //     }

  //     return next;
  //   });
  // };

  // const fallbackFromAspirante = () => {
  //   // Tu lógica anterior (por si la API falla o no hay id)
  //   if (!aspirante) return;

  //   setFormData(prev => ({
  //     ...prev,
  //     nombre: `${aspirante.nombres || ''} ${aspirante.apellidos || ''}`.trim() || '',
  //     identificacion: aspirante.cedula || '',
  //     expedicion: aspirante.lugarExpedicion || '',
  //     barrio: aspirante.barrio || '',
  //     localidad: aspirante.localidad || '',
  //     cargo: aspirante.cargo || '',
  //     edad: aspirante.fechaNacimiento
  //       ? Math.floor((new Date() - new Date(aspirante.fechaNacimiento)) / 31557600000).toString()
  //       : '',
  //     estadoCivil: aspirante.estadoCivil || '',
  //     hijos: aspirante.cuantosHijos || '',
  //     celular: aspirante.celular || '',
  //     tipoCargo: aspirante.cargo || '',
  //     idEps: aspirante.eps || '',
  //     fechaCreacion: new Date().toISOString().split('T')[0],
  //     fechaActualizacion: new Date().toISOString().split('T')[0],
  //   }));
  // };

  // const fetchPrefill = async (idRegistroPerso) => {
  //   setErrorMsg('');
  //   setLoadingPrefill(true);
  //   try {
  //     const token = getToken();
  //     const headers = {
  //       Accept: 'application/json',
  //     };
  //     if (token) headers.Authorization = `Bearer ${token}`;

  //     const resp = await fetch(`${API_BASE}/api/entrevistas-candidato/prefill/${idRegistroPerso}`, {
  //       method: 'GET',
  //       headers
  //     });

  //     if (!resp.ok) {
  //       const txt = await resp.text();
  //       throw new Error(`Prefill falló (${resp.status}): ${txt}`);
  //     }

  //     const data = await resp.json();
  //     applyPrefillToForm(data);
  //   } catch (e) {
  //     // Si falla, no bloqueamos: caemos al autollenado anterior
  //     console.error(e);
  //     fallbackFromAspirante();
  //   } finally {
  //     setLoadingPrefill(false);
  //   }
  // };

  // useEffect(() => {
  //   if (!isOpen) return;

  //   // Si ya te pasan existingData, lo respetamos.
  //   if (existingData) {
  //     setFormData({ ...existingData });
  //     setErrorMsg('');
  //     return;
  //   }

  //   const idRegistro = getIdRegistroPerso();
  //   if (idRegistro) {
  //     fetchPrefill(idRegistro);
  //   } else {
  //     fallbackFromAspirante();
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [isOpen, aspirante, aspirante?.entrevista, existingData]);

  // Nuevo useEffect: actualiza el nombre completo si cambia la entrevista
useEffect(() => {
  if (!aspirante) return;

  const cargarCargoAsignado = async () => {
    try {
      const idRegistro =
        aspirante?.IdRegistroPersonal ??
        aspirante?.idRegistroPersonal ??
        aspirante?.IdRegistroPerso ??
        aspirante?.idRegistroPerso ??
        aspirante?.id_registro_perso ??
        aspirante?.id ??
        null;

      if (!idRegistro) return;

      const respCargo = await getAsignacionCargoCliente(idRegistro);
      const nombreCargo =
        respCargo?.CargoNombre ||
        respCargo?.cargoNombre ||
        respCargo?.NombreCargo ||
        '';

      setCargoAplicaNombre(nombreCargo);
    } catch (error) {
      console.error('Error cargando cargo asignado para entrevista:', error);
      setCargoAplicaNombre('');
    }
  };

  cargarCargoAsignado();

    const entrevistaBase = Array.isArray(aspirante?.entrevista)
    ? (aspirante.entrevista[0] || {})
    : (aspirante?.entrevista || {});

  setFormData(prev => ({
    ...prev,
    nombre: `${aspirante.nombres || ''} ${aspirante.apellidos || ''}`.trim() || prev.nombre || '',
    tipoDocumento: aspirante?.tipoDocumento || aspirante?.IdTipoIdentificacion || prev.tipoDocumento || '',
    identificacion: aspirante.cedula || aspirante.identificacion || prev.identificacion || '',
    expedicion: aspirante.lugarExpedicion || prev.expedicion || '',
    fechaExpedicion: aspirante.fechaExpedicion || prev.fechaExpedicion || '',
    edad: aspirante.fechaNacimiento
      ? Math.floor((new Date() - new Date(aspirante.fechaNacimiento)) / 31557600000).toString()
      : (aspirante.edad || prev.edad || ''),
    estadoCivil: aspirante.estadoCivil || aspirante.tipoEstadoCivil?.Descripcion || prev.estadoCivil || '',
    hijos: aspirante.cuantosHijos?.toString() || aspirante.CuantosHijos?.toString() || prev.CuantosHijos || '',
    celular: aspirante.celular || aspirante.telefono || prev.celular || '',
    barrio: aspirante.barrio || aspirante.datosAdicionales?.[0]?.Barrio || prev.barrio || '',
    localidad: aspirante.localidad || aspirante.datosAdicionales?.[0]?.IdLocalidad || prev.localidad || '',
    eps: aspirante.eps || prev.eps || '',
    fondoPensiones: aspirante.fondoPensiones || prev.fondoPensiones || '',
    arl: aspirante.arl || prev.arl || '',
    antecedentesMedicos:
    aspirante?.AntecedentesMedicos ||
    aspirante?.antecedentesMedicos ||
    aspirante?.datosSeleccion?.AntecedentesMedicos ||
    prev.antecedentesMedicos ||
    '',
    cargo: aspirante.cargo || prev.cargo || '',
    tipoCargo: aspirante.tipoCargo || aspirante.cargo || prev.tipoCargo || '',
    estudiaActualmente: aspirante.formacion?.estudiaActualmente || prev.estudiaActualmente || 'No',
       fortalezas: entrevistaBase?.Fortalezas || prev.fortalezas || '',
    areasDeMejora: entrevistaBase?.AreasDeMejora || prev.areasDeMejora || '',
    conceptoFinalPruebaSeleccion: entrevistaBase?.ConceptoFinalSeleccion || prev.conceptoFinalPruebaSeleccion || '',
    observacionesFinales: entrevistaBase?.ObservacionesFinales || prev.observacionesFinales || '',
    entrevistadoPor: entrevistaBase?.EntrevistadorPor || prev.entrevistadoPor || '',
    haTenidoAccidentes: entrevistaBase?.HaTenidoAccide ? 'SI' : 'NO',
    detalleAccidente: entrevistaBase?.AccidenteCual || prev.detalleAccidente || '',
    haTenidoPatologias: entrevistaBase?.HaTenidoPatologias ? 'Si' : 'No',
    detallePatologia: entrevistaBase?.PatologiaCual || prev.detallePatologia || '',
    fechaActualizacion: entrevistaBase?.FechaActualizacion
      ? new Date(entrevistaBase.FechaActualizacion).toISOString().split('T')[0]
      : (prev.fechaActualizacion || new Date().toISOString().split('T')[0]),
  }));
}, [aspirante]);

  const handleChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'haTenidoAccidentes' && value === 'No') {
        next.detalleAccidente = '';
      }

      // ✅ NUEVO: misma lógica que accidentes
      if (field === 'haTenidoPatologias' && value === 'No') {
        next.detallePatologia = '';
      }

      return next;
    });
  };

  const generarYAdjuntarPdfEntrevista = async (idRegistro) => {
  const campos = {
  LOGO: await getLogoBase64('LOGO1'),
  LOGO2: await getLogoBase64('LOGO2'),
  NOMBRES: (formData?.nombre || '').toUpperCase(),
  DOCUMENTO: formData?.identificacion || '',
  BARRIO: (formData?.barrio || '').toUpperCase(),
  LOCALIDAD: String(formData?.localidad || ''),
  CARGO: (cargoAplicaNombre || formData?.cargo || '').toUpperCase(),
  HIJOS: formData?.hijos || '',
  EDAD: formData?.edad || '',
  ESTADO_CIVIL: (formData?.estadoCivil || '').toUpperCase(),
  ESTUDIA: (formData?.estudiaActualmente || '').toUpperCase(),
  CELULAR: formData?.celular || '',
  EVALUADOR: (formData?.entrevistadoPor || '').toUpperCase(),
 ASPECTOS_ACADEMICOS: (aspirante?.nivelEducativo?.Descripcion || aspirante?.descripcionNivelEducativo || '').toUpperCase(),
EXPERIENCIA: (aspirante?.experienciaLaboral?.[0]?.Compania || '').toUpperCase(),
HA_TRABAJADO_EN_ALP:
  aspirante?.datosSeleccion?.HaTrabajadoAntesEnLaEmpresa === true
    ? 'SI'
    : aspirante?.datosSeleccion?.HaTrabajadoAntesEnLaEmpresa === false
      ? 'NO'
      : (aspirante?.datosSeleccion?.HaTrabajadoAntesEnLaEmpresa || ''),
VALIDACION_AM: (aspirante?.AntecedentesMedicos || aspirante?.datosSeleccion?.AntecedentesMedicos || '').toUpperCase(),
EPS: (aspirante?.descripcionEps || aspirante?.eps?.Descripcion || aspirante?.eps || '').toUpperCase(),
  FORTALEZAS: (formData?.fortalezas || '').toUpperCase(),
  AREAS_DE_MEJORA: (formData?.areasDeMejora || '').toUpperCase(),
  PRUEBA_FISICA: (formData?.conceptoFinalPruebaSeleccion || '').toUpperCase(),
  CONCEPTO_FINAL: (formData?.conceptoFinalPruebaSeleccion || '').toUpperCase(),
  OBSERVACIONES: (formData?.observacionesFinales || '').toUpperCase(),
};

  const responsePdf = await DescargarDocumentoPdf(campos, 'entrevista');
  console.log('PDF entrevista - responsePdf:', responsePdf);

  let pdf_base64 = '';
  if (responsePdf && typeof responsePdf.json === 'function') {
    const dataPdf = await responsePdf.json();
    pdf_base64 = dataPdf?.pdf_base64 || '';
  } else if (responsePdf?.pdf_base64) {
    pdf_base64 = responsePdf.pdf_base64;
  }

  console.log('PDF entrevista - base64 generado:', !!pdf_base64, pdf_base64 ? pdf_base64.length : 0);

  if (!pdf_base64) {
    throw new Error('No fue posible generar el PDF de la entrevista.');
  }

  const payloadDocumento = {
    idRegistroPersonal: Number(idRegistro),
    documentos_seguridad: [
      {
        IdTipoDocumentacion: DOCUMENTO_ENTREVISTA_SELECCION_ID,
        DocumentoCargado: pdf_base64.startsWith('data:application/pdf;base64,')
          ? pdf_base64
          : `data:application/pdf;base64,${pdf_base64}`,
        Formato: 'application/pdf',
        Nombre: `Entrevista_Seleccion_${idRegistro}.pdf`,
      },
    ],
  };

  console.log('Payload documento seguridad:', payloadDocumento);
const responseUpload = await RegistrarDocumentosSeguridad(payloadDocumento);
console.log('Upload documento seguridad - status:', responseUpload.status, responseUpload.ok);

let uploadResult = null;
try {
  uploadResult = await responseUpload.clone().json();
} catch (e) {
  uploadResult = null;
}

console.log('Upload documento seguridad - respuesta:', uploadResult);

if (!responseUpload.ok) {
  const errorDetalle =
    uploadResult?.detail ||
    'No fue posible adjuntar automáticamente la entrevista en documentos de seguridad.';
  throw new Error(errorDetalle);
}

return true;
};

const handleSubmit = async () => {
    setErrorMsg('');
    const idRegistro = getIdRegistroPerso();

    if (!idRegistro) {
      setErrorMsg('No encontré el IdRegistroPersonal del aspirante. Revisa qué campo estás pasando al modal.');
      return;
    }

    const payload = {
      IdRegistroPerso: Number(idRegistro),
      Cargo: formData.cargo || null,
      HaTenidoAccide: formData.haTenidoAccidentes === 'Si',
      AccidenteCual: formData.haTenidoAccidentes === 'Si' ? (formData.detalleAccidente || null) : null,
      Fortalezas: formData.fortalezas || null,
      AreasDeMejora: formData.areasDeMejora || null,
      ConceptoFinalS: formData.conceptoFinalPruebaSeleccion || null,
      ObservacionesF: formData.observacionesFinales || null,
      EntrevistadorPo: formData.entrevistadoPor || null,
      FechaActualizacion: formData.fechaActualizacion || null,

      // ✅ NUEVO: Guardar Patologías en BD (NO se imprime en PDF)
      HaTenidoPatologias: formData.haTenidoPatologias === 'Si',
      PatologiaCual: formData.haTenidoPatologias === 'Si' ? (formData.detallePatologia || null) : null,
      // opcional compatibilidad:
      HaTenidoPatolo: formData.haTenidoPatologias === 'Si',
    };

    setSaving(true);
    try {
      const resp = await entrevistaCandidatoService.RegistrarEntrevista(payload);
      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
      throw new Error(data?.detail || `Error guardando entrevista (${resp.status})`);
    } else {
      toast({
        title: 'Entrevista guardada',
        description: 'La información de la entrevista se ha guardado correctamente.',
        duration: 4000,
      });

            let errorPdfAdjunto = '';

      try {
        await generarYAdjuntarPdfEntrevista(idRegistro);
      } catch (errorAdjunto) {
        console.error('Error generando o adjuntando PDF de entrevista:', errorAdjunto);
        errorPdfAdjunto =
          errorAdjunto?.message ||
          'La entrevista se guardó, pero no fue posible generar o adjuntar el PDF automáticamente.';
      }

      if (typeof onSave === 'function') {
        onSave({
          FechaCreacion: formData.fechaActualizacion || new Date().toISOString().split('T')[0],
          ConceptoFinalSeleccion: formData.conceptoFinalPruebaSeleccion || '',
          EntrevistadorPor: formData.entrevistadoPor || '',
          Fortalezas: formData.fortalezas || '',
          AreasDeMejora: formData.areasDeMejora || '',
          ObservacionesFinales: formData.observacionesFinales || '',
          ...formData
        });
      }

      if (errorPdfAdjunto) {
        setErrorMsg(errorPdfAdjunto);
      }
    }
      onClose();
    } catch (e) {
      console.error(e);
      setErrorMsg(e.message || 'Error guardando entrevista.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 bg-gray-50">
        <DialogHeader className="px-6 py-4 bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-full">
              <ClipboardCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-800">Entrevista</DialogTitle>
              <DialogDescription>
                Diligencia la información detallada de la entrevista para {formData.nombre || 'el candidato'}.
              </DialogDescription>

              {loadingPrefill && (
                <div className="mt-2 text-sm text-gray-500">
                  Cargando datos del candidato...
                </div>
              )}

              {errorMsg && (
                <div className="mt-2 text-sm text-red-600">
                  {errorMsg}
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-6">
          <div className="space-y-8 pb-8">

            {/* Section 1: Verificación de Datos Personales */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                <UserCheck className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-800">Verificación Datos Personales</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nombre Completo</Label>
                  <Input value={formData.nombre} disabled onChange={(e) => handleChange('nombre', e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Tipo Documento</Label>
                  <Select value={formData.tipoDocumento} disabled onValueChange={(v) => handleChange('tipoDocumento', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={'1'}>Cédula de Ciudadanía</SelectItem>
                      <SelectItem value={'2'}>Cédula de Extranjería</SelectItem>
                      <SelectItem value={'3'}>PEP</SelectItem>
                      <SelectItem value={'4'}>PPT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Identificación</Label>
                  <Input value={formData.identificacion} disabled onChange={(e) => handleChange('identificacion', e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Lugar Expedición</Label>
                  <Input value={formData.expedicion} disabled onChange={(e) => handleChange('expedicion', e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Edad</Label>
                  <Input type="number" value={formData.edad} disabled onChange={(e) => handleChange('edad', e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Estado Civil</Label>
                  <Input type="text" value={formData.estadoCivil} disabled onChange={(e) => handleChange('estadoCivil', e.target.value)} />
                  {/* <Select value={formData.estadoCivil} disabled onValueChange={(e) => handleChange('estadoCivil', e.target.value)}>
                    <SelectTrigger><SelectValue /> </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={1}>SIN DEFINIR</SelectItem>
                      <SelectItem value={2}>SOLTERO</SelectItem>
                      <SelectItem value={3}>CASADO</SelectItem>
                      <SelectItem value={4}>UNION LIBRE</SelectItem>
                      <SelectItem value={5}>VIUDO</SelectItem>
                      <SelectItem value={6}>SEPARADO</SelectItem>
                    </SelectContent>
                  </Select> */}
                </div>

                <div className="space-y-2">
                  <Label>Hijos</Label>
                  <Input type="number" value={formData.hijos} disabled onChange={(e) => handleChange('hijos', e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Celular</Label>
                  <Input value={formData.celular} disabled onChange={(e) => handleChange('celular', e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Barrio</Label>
                  <Input value={formData.barrio} disabled onChange={(e) => handleChange('barrio', e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Localidad</Label>
                  <Select value={formData.localidad} disabled onValueChange={(v) => handleChange('localidad', v)}>
                    <SelectTrigger><SelectValue /> </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={1}>Usaquén</SelectItem>
                      <SelectItem value={2}>Chapinero</SelectItem>
                      <SelectItem value={3}>Santa fe</SelectItem>
                      <SelectItem value={4}>San Cristobal</SelectItem>
                      <SelectItem value={5}>Usme</SelectItem>
                      <SelectItem value={6}>Tunjuelito</SelectItem>
                      <SelectItem value={7}>Bosa</SelectItem>
                      <SelectItem value={8}>Kennedy</SelectItem>
                      <SelectItem value={9}>Fontibon</SelectItem>
                      <SelectItem value={10}>Engativa</SelectItem>
                      <SelectItem value={11}>Suba</SelectItem>
                      <SelectItem value={12}>Barrios Unidos</SelectItem>
                      <SelectItem value={13}>Teusaquillo</SelectItem>
                      <SelectItem value={14}>Los Martires</SelectItem>
                      <SelectItem value={15}>Antonio Nariño</SelectItem>
                      <SelectItem value={16}>Puente Aranda</SelectItem>
                      <SelectItem value={17}>La Candelaria</SelectItem>
                      <SelectItem value={18}>Rafael Uribe Uribe</SelectItem>
                      <SelectItem value={19}>Ciudad Bolivar</SelectItem>
                      <SelectItem value={20}>Sumapaz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section 2: Validación Previa del Candidato */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                <Briefcase className="w-5 h-5 text-emerald-500" />
                <h3 className="font-semibold text-gray-800">Validación Previa del Candidato</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/*
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>¿Ha tenido accidentes Personales, laborales y/o Transito?</Label>
                      <Select
                        value={formData.haTenidoAccidentes}
                        onValueChange={(v) => handleChange('haTenidoAccidentes', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>

                        <SelectContent className="max-h-64 overflow-y-auto">
                          <SelectItem value="Si">Sí</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  */}


                {/* ✅ NUEVO CAMPO: Patologías / Enfermedades (idéntico al de accidentes) */}
                <div className="space-y-2">
                  <Label>¿Qué patologías o enfermedades médicas ha tenido?</Label>
                  <Select value={formData.haTenidoPatologias} onValueChange={(v) => handleChange('haTenidoPatologias', v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent className="max-h-64 overflow-y-auto">
                      <SelectItem value="Si">Sí</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className={`space-y-2 ${formData.haTenidoPatologias === 'Si' ? '' : 'opacity-60'}`}>
                  <Label>¿Cuál?</Label>
                  <Textarea
                    value={formData.detallePatologia}
                    onChange={(e) => handleChange('detallePatologia', e.target.value)}
                    placeholder="Escriba aquí cuál patología o enfermedad..."
                    disabled={formData.haTenidoPatologias !== 'Si'}
                    className="min-h-[92px]"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Concepto Final de Entrevista */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                <ClipboardCheck className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-gray-800">Concepto Final de Entrevista</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fortalezas</Label>
                  <Textarea
                    className="h-24"
                    value={formData.fortalezas}
                    onChange={(e) => handleChange('fortalezas', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Áreas de Mejora</Label>
                  <Textarea
                    className="h-24"
                    value={formData.areasDeMejora}
                    onChange={(e) => handleChange('areasDeMejora', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Concepto Proceso Selección</Label>
                  <Select
                    value={formData.conceptoFinalPruebaSeleccion}
                    onValueChange={(v) => handleChange('conceptoFinalPruebaSeleccion', v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="APROBADO">APROBADO</SelectItem>
                      <SelectItem value="RECHAZADO">RECHAZADO</SelectItem>
                      <SelectItem value="SEGUNDA OPCION">SEGUNDA OPCION</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

               <div className="col-span-1 md:col-span-2 space-y-2">
                    <Label>Observaciones Finales</Label>
                    <Textarea
                      value={formData.observacionesFinales}
                      onChange={(e) => handleChange('observacionesFinales', e.target.value)}
                    />
                  </div>

                    <div className="col-span-1 md:col-span-2 space-y-2">
                      <Label>Cargo al que aplica</Label>
                      <Input
                        value={cargoAplicaNombre || ''}
                        disabled
                      />
                    </div>

                  <div className="space-y-2">
                    <Label>Entrevistado Por</Label>
                  <Select
                    value={formData.entrevistadoPor}
                    onValueChange={(v) => handleChange('entrevistadoPor', v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Seleccionar entrevistador" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Usuario Actual">Usuario Actual</SelectItem>
                      <SelectItem value="YURLEIVIS CORREA">YURLEIVIS CORREA</SelectItem>
                      <SelectItem value="LIZETH DELGADO">LIZETH DELGADO</SelectItem>
                      <SelectItem value="YENNY CUESTO">YENNY CUESTO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fecha Actualización</Label>
                  <Input
                    type="date"
                    value={formData.fechaActualizacion}
                    onChange={(e) => handleChange('fechaActualizacion', e.target.value)}
                  />
                </div>
              </div>
            </div>

          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 bg-white border-t border-gray-200 shrink-0">
          <Button variant="outline" onClick={onClose} className="gap-2" disabled={saving}>
            <X className="w-4 h-4" /> Cancelar
          </Button>
          <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" disabled={saving}>
            <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar Entrevista'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EntrevistaModal;
