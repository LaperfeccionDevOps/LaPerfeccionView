
import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getDocumentacionIngreso } from '@/services/detalle_aspirante';
import {
  obtenerDocumentoSeguridadBase64,
  RegistrarDocumentosSeguridad,
  EliminarDocumentoSeguridadPorTipo
} from '@/services/documentosSeguridad';
import { RegistrarDocumentosContratacion, obtenerDocumentosContratacion } from '@/services/contratacionService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Folder, Upload, Trash2, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { listaDocumentosContratacion } from '@/utils/listaDocumentos'
import { DescargarDocumentoPdf } from '../../services/descargarDocumento';


const DocumentUploadModal = ({ isOpen, onClose, aspirante, onSave, docTypeConfigIngreso, docTypeConfigSeguridad, docTypeConfigContratacion }) => {
    const [documentos, setDocumentos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState('ingreso');

    useEffect(() => {
        if (!aspirante) {
            setDocumentos([]);
            return;
        }
        setLoading(true);
        const id = aspirante.idRegistroPersonal || aspirante.id;
        Promise.all([
            getDocumentacionIngreso(id).catch(() => null),
            obtenerDocumentoSeguridadBase64(id).catch(() => null),
            obtenerDocumentosContratacion(id).catch(() => null)
        ]).then(([ingreso, seguridad, contratacion]) => {
            let docs = [];
            // Documentos de ingreso
            if (ingreso && Array.isArray(ingreso.data)) {
                docs = docs.concat(ingreso.data);
            } else if (ingreso && ingreso.data) {
                docs.push(ingreso.data);
            }
            // Documentos de seguridad
            if (seguridad) {
                if (Array.isArray(seguridad.data)) {
                    docs = docs.concat(seguridad.data);
                } else if (Array.isArray(seguridad)) {
                    docs = docs.concat(seguridad);
                } else if (seguridad.data) {
                    docs.push(seguridad.data);
                } else if (seguridad) {
                    docs.push(seguridad);
                }
            }
            // Documentos de contratación
            if (contratacion) {
                if (Array.isArray(contratacion.data)) {
                    docs = docs.concat(contratacion.data);
                } else if (Array.isArray(contratacion)) {
                    docs = docs.concat(contratacion);
                } else if (contratacion.data) {
                    docs.push(contratacion.data);
                } else if (contratacion) {
                    docs.push(contratacion);
                }
            }
            setDocumentos(docs);
        }).finally(() => setLoading(false));
    }, [aspirante]);

    if (!aspirante) return null;

    // Descargar documento (base64)
    const descargarDocumento = (doc) => {
        if (!doc?.DocumentoBase64) return toast({ title: 'No hay archivo para descargar' });
        let mime = 'application/pdf';
        if (doc.Nombre && doc.Nombre.toLowerCase().match(/\.(jpg|jpeg|png)$/)) mime = 'image/jpeg';
        const byteChars = atob(doc.DocumentoBase64.replace(/^data:.*;base64,/, ''));
        const bytes = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
        const blob = new Blob([bytes], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.Nombre || doc.NombreArchivo || 'documento.pdf';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    };


const getDocumentoBase64Tipo42 = () => {
    if (!Array.isArray(documentos)) return '';
    const doc = documentos.find(
        d => d && String(d.IdTipoDocumentacion) === '42' && d.DocumentoBase64
    );
    if (!doc) return '';
    const base64 = doc.DocumentoBase64 || '';
    return base64.startsWith('data:image/png;base64,')
        ? base64
        : 'data:image/png;base64,' + base64;
};

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

const handleDescargarTratamientoDatos = async () => {
    try {
        const firmaBase64 = getDocumentoBase64Tipo42();

        if (!firmaBase64) {
            toast({
                title: 'No se encontró la firma digital',
                description: 'No es posible generar el tratamiento de datos sin la firma del aspirante.',
                variant: 'destructive',
            });
            return;
        }

        const nombreCompleto = `${aspirante?.nombres || ''} ${aspirante?.apellidos || ''}`.trim();

       const campos = {
        LOGO: await getLogoBase64('LOGO1'),
        LOGO2: await getLogoBase64('LOGO2'),
        NOMBRES: nombreCompleto,
        TIPO_IDENTIFICACION: aspirante?.DescripcionTipoIdentificacion || aspirante?.tipoIdentificacion || '',
        NUMERO_IDENTIFICACION: aspirante?.cedula || aspirante?.NumeroIdentificacion || '',
        CIUDAD_EXPEDICION: aspirante?.lugarExpedicion || '',
        FECHA_FIRMA: aspirante?.fechaExpedicion || '',
        FIRMA: firmaBase64,
        EMAIL: aspirante?.email || '',
    };

       let pdf_base64 = '';
const response = await DescargarDocumentoPdf(campos, 'tratamiento_datos');

console.log('RESPUESTA tratamiento_datos:', response);

if (response?.data?.pdf_base64) {
    pdf_base64 = response.data.pdf_base64;
} else if (response?.pdf_base64) {
    pdf_base64 = response.pdf_base64;
} else if (response && typeof response.json === 'function') {
    const data = await response.json();
    console.log('DATA tratamiento_datos:', data);
    pdf_base64 = data?.pdf_base64 || '';
}

        if (!pdf_base64) {
            toast({
                title: 'No se pudo generar el documento',
                description: 'La respuesta del servicio no devolvió el PDF de tratamiento de datos.',
                variant: 'destructive',
            });
            return;
        }

        const docPdf = {
            DocumentoBase64: 'data:application/pdf;base64,' + pdf_base64,
            Nombre: 'Tratamiento_de_datos.pdf',
        };

        descargarDocumento(docPdf);
    } catch (error) {
        console.error('Error al descargar tratamiento de datos:', error);
        toast({
            title: 'Error al generar el documento',
            description: 'No fue posible descargar el tratamiento de datos.',
            variant: 'destructive',
        });
    }
};
    const handleEnviarDocumentosContratacion = async (docsContratacion) => {
        const idsContratacion = listaDocumentosContratacion.map(d => String(d.id));
        const idRegistroPersonal = aspirante?.id || formData?.IdRegistroPersonal;
        let docsPayload = docsContratacion
            .filter(doc => idsContratacion.includes(String(doc.IdTipoDocumentacion)))
            .map(doc => ({
                IdTipoDocumentacion: doc.IdTipoDocumentacion,
                Nombre: doc.Nombre,
                DocumentoCargado: doc.DocumentoBase64 || doc.DocumentoCargado,
                Formato: doc.Formato || 'application/pdf',
            }));

        // Asegurar que el id 74 (Contrato de trabajo) siempre esté presente
        const tieneContratoTrabajo = docsPayload.some(doc => String(doc.IdTipoDocumentacion) === '74');
        if (!tieneContratoTrabajo) {
            docsPayload.push({
                IdTipoDocumentacion: 74,
                Nombre: 'Contrato de trabajo',
                DocumentoCargado: '', // O puedes poner null si el backend lo permite
                Formato: 'application/pdf',
            });
        }

        const payload = {
            idRegistroPersonal,
            documentos_contratacion: docsPayload
        };
        const res = await RegistrarDocumentosContratacion(payload);
        if (res && res.status === 201) {
            alert('Documentos de contratación registrados correctamente.');
        } else {
            alert('Error al registrar documentos de contratación.');
        }
    };
    // Eliminar documento (solo frontend)
  const removeDocument = async (tipoId) => {
  try {
    const idRegistroPersonal =
      aspirante?.idRegistroPersonal ||
      aspirante?.IdRegistroPersonal ||
      aspirante?.id;

    const response = await EliminarDocumentoSeguridadPorTipo(
      idRegistroPersonal,
      tipoId
    );

    if (!response.ok) {
      throw new Error('Error al eliminar documento');
    }

    setDocumentos(prev =>
      prev.filter(d => String(d.IdTipoDocumentacion) !== String(tipoId))
    );

    toast({
      title: '✅ Documento eliminado correctamente',
    });
  } catch (error) {
    console.error('Error eliminando documento:', error);
    toast({
      title: '❌ Error al eliminar documento',
      variant: 'destructive'
    });
  }
};

   // Manejar carga de archivo (guardar en backend)
const handleFileUpload = async (e, tipoId) => {
    const file = e.target.files[0];
    if (!file) return;

    const input = e.target;
    const reader = new FileReader();

    reader.onload = async (event) => {
        try {
            const base64Completo = event.target.result || '';
            const base64 = String(base64Completo).split(',')[1] || '';

            const idRegistroPersonal =
                aspirante?.idRegistroPersonal ||
                aspirante?.IdRegistroPersonal ||
                aspirante?.id;

            const payload = {
                idRegistroPersonal,
                documentos_seguridad: [
                    {
                        IdTipoDocumentacion: tipoId,
                        Nombre: file.name,
                        DocumentoCargado: base64,
                        Formato: file.type || 'application/pdf',
                    }
                ]
            };

            const response = await RegistrarDocumentosSeguridad(payload);

            if (!response.ok) {
                throw new Error('Error al registrar documento de seguridad');
            }

            setDocumentos(prev => [
                ...prev.filter(d => String(d.IdTipoDocumentacion) !== String(tipoId)),
                {
                    IdTipoDocumentacion: tipoId,
                    Nombre: file.name,
                    DocumentoBase64: base64,
                    Formato: file.type,
                    NombreArchivo: file.name,
                }
            ]);

            toast({
                title: '✅ Documento cargado correctamente',
            });

            if (input) input.value = '';
        } catch (error) {
            console.error('Error cargando documento:', error);
            toast({
                title: '❌ Error al cargar documento',
                variant: 'destructive'
            });
            if (input) input.value = '';
        }
    };

    reader.readAsDataURL(file);
};

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[850px] border-0 shadow-2xl rounded-3xl p-0">
                <div className="rounded-t-3xl bg-gradient-to-br from-yellow-50 via-white to-emerald-50 px-0 pt-0 pb-0">
                    <div className="px-8 pt-8 pb-4 border-b border-emerald-100">
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-extrabold flex items-center gap-4 text-emerald-700 drop-shadow-sm">
                                <Folder className="w-10 h-10 text-yellow-500" /> Documentos del Aspirante
                            </DialogTitle>
                            <DialogDescription className="text-lg text-gray-600 mt-2">
                                Gestiona la documentación para <span className="font-semibold text-emerald-800">{aspirante.nombres} {aspirante.apellidos}</span>.
                            </DialogDescription>
                        </DialogHeader>
                        <Tabs value={tab} onValueChange={setTab} className="w-full mt-6">
                            <TabsList className="flex gap-2 mb-2 bg-emerald-50 rounded-xl p-1 border border-emerald-100 shadow-sm">
                                <TabsTrigger value="ingreso" className="rounded-lg px-6 py-2 text-base font-semibold data-[state=active]:bg-yellow-400 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-yellow-500 data-[state=active]:border">
                                    Documentos de Aspirante
                                </TabsTrigger>
                                <TabsTrigger value="seguridad" className="rounded-lg px-6 py-2 text-base font-semibold data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-orange-600 data-[state=active]:border">
                                    Documentos de Selección
                                </TabsTrigger>
                                <TabsTrigger value="contratacion" className="rounded-lg px-6 py-2 text-base font-semibold data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-emerald-600 data-[state=active]:border">
                                    Documentos de Contratación
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                    <div className="px-8 pb-2 pt-2">
                        <Tabs value={tab} onValueChange={setTab} className="w-full">
                       <TabsContent value="ingreso">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4 max-h-[50vh] overflow-y-auto pr-2">
                        {docTypeConfigIngreso?.list
                            ?.filter((req) => String(req.id) !== '73')
                            ?.map((req) => {
                                const doc = Array.isArray(documentos)
                                    ? documentos.find(d => String(d.IdTipoDocumentacion) === String(req.id))
                                    : null;
                                const hasFile = !!doc;
                                let accept = '.pdf,image/*';
                                if (req.id === 'fotoAspirante') accept = 'image/*';
                                if (req.id === 'reciboPublico') accept = '.pdf,image/*';
                                return (
                                    <div key={req.id} className="border-2 border-yellow-200 rounded-2xl p-6 bg-white/90 shadow-lg flex flex-col justify-between h-full group w-full hover:shadow-2xl transition-shadow duration-200">
                                        <div>
                                            <h4 className="font-bold text-emerald-800 mb-3 text-base leading-tight min-h-[40px] tracking-wide flex items-center gap-2">
                                                <span className="inline-block w-2 h-2 rounded-full bg-yellow-400"></span>
                                                {req.nombre || req.label}
                                            </h4>
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4 border shadow-sm ${hasFile ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-red-100 text-red-700 border-red-300'}`}> 
                                                {hasFile ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                                {hasFile ? 'Adjuntado' : 'Falta adjuntar'}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {!hasFile && (
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <input
                                                            type="file"
                                                            id={`file-ingreso-${req.id}-${aspirante.id}`}
                                                            className="hidden"
                                                            onChange={(e) => handleFileUpload(e, req.id)}
                                                            accept={accept}
                                                        />
                                                        <label
                                                            htmlFor={`file-ingreso-${req.id}-${aspirante.id}`}
                                                            className="cursor-pointer flex items-center justify-center w-full px-3 py-2 border-2 border-yellow-300 shadow-sm text-sm font-semibold rounded-xl text-yellow-700 bg-yellow-50 hover:bg-yellow-100 transition-colors"
                                                        >
                                                            <Upload className="w-4 h-4 mr-2" /> Cargar
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
                                                        className="text-emerald-700 border-emerald-300 hover:bg-emerald-100 px-3 h-auto w-full font-semibold"
                                                        onClick={() => descargarDocumento(doc)}
                                                    >
                                                        <Download className="w-4 h-4 mr-2" /> Descargar
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-700 border-red-300 hover:bg-red-100 px-3 h-auto w-full font-semibold"
                                                        onClick={() => removeDocument(req.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                                                    </Button>
                                                </div>
                                            )}
                                            <p className="text-xs text-gray-500 truncate h-4 italic">
                                                {hasFile ? doc.Nombre : 'Sin archivo'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </TabsContent>
                       <TabsContent value="seguridad">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4 max-h-[50vh] overflow-y-auto pr-2">
                    {docTypeConfigSeguridad?.list?.map((req) => {
                    const documentosArray = Array.isArray(documentos) ? documentos : [];

                    const docDirecto = documentosArray.find(
                        d => String(d.IdTipoDocumentacion) === String(req.id)
                    );

                    // Caso especial para Tratamiento de datos:
                    // si no existe el 73, tomar la firma digital (42) como respaldo
                    const docFirma42 = String(req.id) === '73'
                        ? documentosArray.find(d => String(d.IdTipoDocumentacion) === '42')
                        : null;

                    const doc = docDirecto || docFirma42 || null;
                    const hasFile = !!doc;

                    let accept = '.pdf,image/*';

                    const esTratamientoDatos = String(req.id) === '73';

                    return (
                        <div
                        key={req.id}
                        className="border-2 border-orange-200 rounded-2xl p-6 bg-white/90 shadow-lg flex flex-col justify-between h-full group w-full hover:shadow-2xl transition-shadow duration-200"
                        >
                        <div>
                            <h4 className="font-bold text-orange-800 mb-3 text-base leading-tight min-h-[40px] tracking-wide flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-orange-400"></span>
                            {req.nombre || req.label}
                            </h4>

                            <div
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4 border shadow-sm ${
                                hasFile
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                : 'bg-red-100 text-red-700 border-red-300'
                            }`}
                            >
                            {hasFile ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            {hasFile ? 'Adjuntado' : 'Falta adjuntar'}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {!hasFile && (
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                <input
                                    type="file"
                                    id={`file-seguridad-${req.id}-${aspirante.id}`}
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(e, req.id)}
                                    accept={accept}
                                />
                                <label
                                    htmlFor={`file-seguridad-${req.id}-${aspirante.id}`}
                                    className="cursor-pointer flex items-center justify-center w-full px-3 py-2 border-2 border-orange-300 shadow-sm text-sm font-semibold rounded-xl text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors"
                                >
                                    <Upload className="w-4 h-4 mr-2" /> Cargar
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
                                className="text-emerald-700 border-emerald-300 hover:bg-emerald-100 px-3 h-auto w-full font-semibold"
                                onClick={() =>
                                    esTratamientoDatos
                                    ? handleDescargarTratamientoDatos()
                                    : descargarDocumento(doc)
                                }
                                >
                                <Download className="w-4 h-4 mr-2" /> Descargar
                                </Button>

                                {!esTratamientoDatos && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-red-700 border-red-300 hover:bg-red-100 px-3 h-auto w-full font-semibold"
                                    onClick={() => removeDocument(req.id)}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                                </Button>
                                )}
                            </div>
                            )}

                            <p className="text-xs text-gray-500 truncate h-4 italic">
                            {hasFile ? (doc?.Nombre || 'Documento disponible') : 'Sin archivo'}
                            </p>
                        </div>
                        </div>
                    );
                    })}
                </div>

                </TabsContent>
                <TabsContent value="contratacion">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4 max-h-[50vh] overflow-y-auto pr-2">
                        {docTypeConfigContratacion?.list?.map((req) => {
                            const doc = Array.isArray(documentos)
                                ? documentos.find(d => String(d.IdTipoDocumentacion) === String(req.id))
                                : null;
                            // Solo marcar como adjuntado si tiene archivo
                            const hasFile = !!doc && (doc.DocumentoBase64 || doc.DocumentoCargado);
                            let accept = '.pdf,image/*';
                            return (
                                <div key={req.id} className="border-2 border-emerald-200 rounded-2xl p-6 bg-white/90 shadow-lg flex flex-col justify-between h-full group w-full hover:shadow-2xl transition-shadow duration-200">
                                    <div>
                                        <h4 className="font-bold text-emerald-900 mb-3 text-base leading-tight min-h-[40px] tracking-wide flex items-center gap-2">
                                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                                            {req.nombre || req.label}
                                        </h4>
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4 border shadow-sm ${hasFile ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-red-100 text-red-700 border-red-300'}`}>
                                            {hasFile ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                            {hasFile ? 'Adjuntado' : 'Falta adjuntar'}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {!hasFile && (
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <input
                                                        type="file"
                                                        id={`file-contratacion-${req.id}-${aspirante.id}`}
                                                        className="hidden"
                                                        onChange={(e) => handleFileUpload(e, req.id)}
                                                        accept={accept}
                                                    />
                                                    <label
                                                        htmlFor={`file-contratacion-${req.id}-${aspirante.id}`}
                                                        className="cursor-pointer flex items-center justify-center w-full px-3 py-2 border-2 border-emerald-300 shadow-sm text-sm font-semibold rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                                                    >
                                                        <Upload className="w-4 h-4 mr-2" /> Cargar
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
                                                    className="text-emerald-700 border-emerald-300 hover:bg-emerald-100 px-3 h-auto w-full font-semibold"
                                                    onClick={() => descargarDocumento(doc)}
                                                >
                                                    <Download className="w-4 h-4 mr-2" /> Descargar
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-red-700 border-red-300 hover:bg-red-100 px-3 h-auto w-full font-semibold"
                                                    onClick={() => removeDocument(req.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                                                </Button>
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-500 truncate h-4 italic">
                                            {hasFile ? doc.Nombre : 'Sin archivo'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-end mt-4">
                        <Button
                            variant="default"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-2 rounded-xl shadow-md"
                            onClick={() => handleEnviarDocumentosContratacion?.(documentos)}
                        >
                            Guardar documentos
                        </Button>
                    </div>
                </TabsContent>
                {/* <TabsContent value="paquete-contratacion">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4 max-h-[50vh] overflow-y-auto pr-2">
                        <p className="text-sm text-gray-600 mb-6 italic">
                            <b>En esta sección puedes cargar el paquete de contratación, el cual debe corresponder a un único documento en formato PDF que contenga los siguientes ítems:</b><br /><br /><br /><br />
                            1) Datos personales de colaboradores – Consentimiento informado<br />
                            2) Conocimiento informado – Política de prevención de tabaquismo, alcoholismo y consumo de sustancias<br />
                            3) Responsabilidad SG-SST: Nivel de autoliderazgo de colaboradores<br />
                            4) Notificación de recomendaciones médicas y compromisos F-SS-035
                        </p>
                        {docTypeConfigPaquete?.list?.map((req) => {
                            const doc = Array.isArray(documentos)
                                ? documentos.find(d => String(d.IdTipoDocumentacion) === String(req.id))
                                : null;
                            const hasFile = !!doc;
                            let accept = '.pdf,image/*';
                            return (
                                <div key={req.id} className="border-2 border-purple-200 rounded-2xl p-6 bg-white/90 shadow-lg flex flex-col justify-between h-full group w-full hover:shadow-2xl transition-shadow duration-200">
                                    <div>
                                        <h4 className="font-bold text-purple-900 mb-3 text-base leading-tight min-h-[40px] tracking-wide flex items-center gap-2">
                                            <span className="inline-block w-2 h-2 rounded-full bg-purple-400"></span>
                                            {req.nombre || req.label}
                                        </h4>
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4 border shadow-sm ${hasFile ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-red-100 text-red-700 border-red-300'}`}> 
                                            {hasFile ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                            {hasFile ? 'Adjuntado' : 'Falta adjuntar'}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {!hasFile && (
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <input
                                                        type="file"
                                                        id={`file-paquete-contratacion-${req.id}-${aspirante.id}`}
                                                        className="hidden"
                                                        onChange={(e) => handleFileUpload(e, req.id)}
                                                        accept={accept}
                                                    />
                                                    <label
                                                        htmlFor={`file-paquete-contratacion-${req.id}-${aspirante.id}`}
                                                        className="cursor-pointer flex items-center justify-center w-full px-3 py-2 border-2 border-purple-300 shadow-sm text-sm font-semibold rounded-xl text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
                                                    >
                                                        <Upload className="w-4 h-4 mr-2" /> Cargar
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
                                                    className="text-emerald-700 border-emerald-300 hover:bg-emerald-100 px-3 h-auto w-full font-semibold"
                                                    onClick={() => descargarDocumento(doc)}
                                                >
                                                    <Download className="w-4 h-4 mr-2" /> Descargar
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-red-700 border-red-300 hover:bg-red-100 px-3 h-auto w-full font-semibold"
                                                    onClick={() => removeDocument(req.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                                                </Button>
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-500 truncate h-4 italic">
                                            {hasFile ? doc.Nombre : 'Sin archivo'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-end mt-4">
                        <Button
                            variant="default"
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-2 rounded-xl shadow-md"
                            onClick={() => onSave?.(documentos)}
                        >
                            Guardar documentos
                        </Button>
                    </div>
                </TabsContent> */}
            </Tabs>
            </div>
        </div>
        <DialogFooter className="bg-gradient-to-r from-emerald-50 to-yellow-50 rounded-b-3xl px-8 py-4 border-t border-emerald-100 flex justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-xl px-8 py-2 text-lg font-semibold border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-700 shadow-sm">
                Cerrar
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
);
};
export default DocumentUploadModal;
