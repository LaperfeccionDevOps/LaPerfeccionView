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
import { Folder, Upload, Trash2, Download, CheckCircle2, AlertCircle, Eye } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { listaDocumentosContratacion } from '@/utils/listaDocumentos';
import { DescargarDocumentoPdf } from '../../services/descargarDocumento';

import {
  listarDocumentosActivos,
  obtenerDocumentoActivo,
  subirDocumentosActivos,
  eliminarDocumentoActivo
} from '@/services/documentosActivos';

const DocumentUploadModal = ({
  isOpen,
  onClose,
  aspirante,
  onSave,
  docTypeConfigIngreso,
  docTypeConfigSeguridad,
  docTypeConfigContratacion,
  tipoCarpeta = 'ingreso',
  soloLectura = false,
}) => {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('ingreso');

  const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

  const esCarpetaIngreso = tipoCarpeta === 'ingreso';
  const esCarpetaActivos = tipoCarpeta === 'activo';
  const esCarpetaRetiro = tipoCarpeta === 'retiro';
  const esCarpetaOperaciones = tipoCarpeta === 'operaciones';

 const tituloModal = esCarpetaActivos
  ? 'Documentos Activos'
  : esCarpetaRetiro
    ? 'Documentos de Retiro'
    : esCarpetaOperaciones
      ? 'Documentos Operaciones'
      : 'Documentos del Aspirante';

  const descripcionVacia = esCarpetaActivos
    ? 'Actualmente no hay documentos activos configurados para este trabajador.'
    : 'Actualmente no hay documentos de retiro configurados para este trabajador.';

  const colorIcono = esCarpetaActivos
    ? 'text-emerald-600'
    : esCarpetaRetiro
      ? 'text-red-600'
      : 'text-yellow-500';

 useEffect(() => {
  if (!aspirante) {
    setDocumentos([]);
    return;
  }

  const id =
    aspirante?.IdRegistroPersonal ||
    aspirante?.idRegistroPersonal ||
    aspirante?.id_registro_personal ||
    aspirante?.id;

    if (esCarpetaRetiro) {
      setLoading(true);
      setTab('ingreso');

      fetch(`${API_BASE}/retiros-laborales/carpeta-digital/${id}/documentos`)
        .then((res) => res.json())
        .then((res) => {
          setDocumentos(Array.isArray(res?.data) ? res.data : []);
        })
        .catch((error) => {
          console.error('Error cargando documentos de retiro:', error);
          setDocumentos([]);
        })
        .finally(() => setLoading(false));

      return;
    }

  if (esCarpetaActivos) {
  setLoading(true);
  setTab('ingreso');

 listarDocumentosActivos(id)
  .then((res) => {
    console.log('ID ACTIVOS ENVIADO =>', id);
    console.log('DOCUMENTOS ACTIVOS RESPUESTA =>', res);
    setDocumentos(Array.isArray(res) ? res : []);
  })
    .catch((error) => {
      console.error('Error cargando documentos activos:', error);
      setDocumentos([]);
    })
    .finally(() => setLoading(false));

  return;
}

   if (!esCarpetaIngreso && !esCarpetaOperaciones) {
      setDocumentos([]);
      setTab('ingreso');
      return;
    }

    setLoading(true);

    Promise.all([
      getDocumentacionIngreso(id).catch(() => null),
      obtenerDocumentoSeguridadBase64(id).catch(() => null),
      obtenerDocumentosContratacion(id).catch(() => null),
    ])
      .then(([ingreso, seguridad, contratacion]) => {
        let docs = [];

        if (ingreso && Array.isArray(ingreso.data)) {
          docs = docs.concat(ingreso.data);
        } else if (ingreso && ingreso.data) {
          docs.push(ingreso.data);
        }

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
      })
      .finally(() => setLoading(false));
 }, [aspirante, esCarpetaIngreso, esCarpetaActivos, esCarpetaRetiro, esCarpetaOperaciones, API_BASE]);

  if (!aspirante) return null;

  const obtenerBase64Documento = (doc) => {
    return doc?.DocumentoBase64 || doc?.DocumentoCargado || '';
  };

  const obtenerMimeDocumento = (doc) => {
  const nombre = (doc?.Nombre || doc?.NombreArchivo || '').toLowerCase();
  const formato = String(doc?.Formato || '').toLowerCase().trim();

  if (formato === 'application/pdf') return 'application/pdf';
  if (formato === 'pdf') return 'application/pdf';

  if (formato === 'image/jpeg') return 'image/jpeg';
  if (formato === 'jpg') return 'image/jpeg';
  if (formato === 'jpeg') return 'image/jpeg';

  if (formato === 'image/png') return 'image/png';
  if (formato === 'png') return 'image/png';

  if (formato === 'image/webp') return 'image/webp';
  if (formato === 'webp') return 'image/webp';

  if (nombre.match(/\.(jpg|jpeg)$/)) return 'image/jpeg';
  if (nombre.match(/\.png$/)) return 'image/png';
  if (nombre.match(/\.webp$/)) return 'image/webp';

  return 'application/pdf';
};

  const crearBlobDocumento = (doc) => {
    const base64Original = obtenerBase64Documento(doc);

    if (!base64Original) {
      return null;
    }

    const mime = obtenerMimeDocumento(doc);
    const base64Limpio = String(base64Original).replace(/^data:.*;base64,/, '');
    const byteChars = atob(base64Limpio);
    const bytes = new Uint8Array(byteChars.length);

    for (let i = 0; i < byteChars.length; i++) {
      bytes[i] = byteChars.charCodeAt(i);
    }

    return new Blob([bytes], { type: mime });
  };

  const verDocumento = (doc) => {
    const blob = crearBlobDocumento(doc);

    if (!blob) {
      return toast({ title: 'No hay archivo para visualizar' });
    }

    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');

    setTimeout(() => URL.revokeObjectURL(url), 15000);
  };

  const descargarDocumento = (doc) => {
    const blob = crearBlobDocumento(doc);

    if (!blob) {
      return toast({ title: 'No hay archivo para descargar' });
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = doc.Nombre || doc.NombreArchivo || 'documento.pdf';
    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

const verDocumentoRetiro = async (doc) => {
  try {
    if (doc?.OrigenArchivo === 'ENTREVISTA' && !doc?.IdEntrevistaRetiro) {
      return toast({ title: 'No hay entrevista para visualizar' });
    }

    if (doc?.OrigenArchivo !== 'ENTREVISTA' && !doc?.IdRetiroLaboralAdjunto) {
      return toast({ title: 'No hay archivo para visualizar' });
    }

    const urlDescarga =
      doc?.OrigenArchivo === 'ENTREVISTA'
        ? `${API_BASE}/retiros-laborales/carpeta-digital/entrevista-retiro/${doc.IdEntrevistaRetiro}/descargar`
        : `${API_BASE}/rrll/adjuntos/${doc.IdRetiroLaboralAdjunto}/descargar`;

    const response = await fetch(urlDescarga);

    if (!response.ok) {
      throw new Error('No fue posible visualizar el documento.');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    window.open(url, '_blank');

    setTimeout(() => URL.revokeObjectURL(url), 15000);
  } catch (error) {
    console.error('Error visualizando documento de retiro:', error);
    toast({
      title: 'Error al visualizar documento',
      description: error.message || 'No fue posible abrir el documento.',
      variant: 'destructive',
    });
  }
};

const descargarDocumentoRetiro = async (doc) => {
  try {
    if (doc?.OrigenArchivo === 'ENTREVISTA' && !doc?.IdEntrevistaRetiro) {
      return toast({ title: 'No hay entrevista para descargar' });
    }

    if (doc?.OrigenArchivo !== 'ENTREVISTA' && !doc?.IdRetiroLaboralAdjunto) {
      return toast({ title: 'No hay archivo para descargar' });
    }

    const urlDescarga =
      doc?.OrigenArchivo === 'ENTREVISTA'
        ? `${API_BASE}/retiros-laborales/carpeta-digital/entrevista-retiro/${doc.IdEntrevistaRetiro}/descargar`
        : `${API_BASE}/rrll/adjuntos/${doc.IdRetiroLaboralAdjunto}/descargar`;

    const response = await fetch(urlDescarga);

    if (!response.ok) {
      throw new Error('No fue posible descargar el documento.');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download =
      doc.NombreArchivoOriginal ||
      doc.NombreArchivo ||
      `${doc.NombreDocumento || 'documento_retiro'}.pdf`;

    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (error) {
    console.error('Error descargando documento de retiro:', error);
    toast({
      title: 'Error al descargar documento',
      description: error.message || 'No fue posible descargar el documento.',
      variant: 'destructive',
    });
  }
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

      if (response?.data?.pdf_base64) {
        pdf_base64 = response.data.pdf_base64;
      } else if (response?.pdf_base64) {
        pdf_base64 = response.pdf_base64;
      } else if (response && typeof response.json === 'function') {
        const data = await response.json();
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

      descargarDocumento({
        DocumentoBase64: 'data:application/pdf;base64,' + pdf_base64,
        Nombre: 'Tratamiento_de_datos.pdf',
        Formato: 'application/pdf',
      });
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

    const idRegistroPersonal =
      aspirante?.idRegistroPersonal ||
      aspirante?.IdRegistroPersonal ||
      aspirante?.id;

    let docsPayload = docsContratacion
      .filter(doc => idsContratacion.includes(String(doc.IdTipoDocumentacion)))
      .map(doc => ({
        IdTipoDocumentacion: doc.IdTipoDocumentacion,
        Nombre: doc.Nombre,
        DocumentoCargado: doc.DocumentoBase64 || doc.DocumentoCargado,
        Formato: doc.Formato || 'application/pdf',
      }));

    const tieneContratoTrabajo = docsPayload.some(
      doc => String(doc.IdTipoDocumentacion) === '74'
    );

    if (!tieneContratoTrabajo) {
      docsPayload.push({
        IdTipoDocumentacion: 74,
        Nombre: 'Contrato de trabajo',
        DocumentoCargado: '',
        Formato: 'application/pdf',
      });
    }

    const payload = {
      idRegistroPersonal,
      documentos_contratacion: docsPayload,
    };

    const res = await RegistrarDocumentosContratacion(payload);

    if (res && res.status === 201) {
      alert('Documentos de contratación registrados correctamente.');
    } else {
      alert('Error al registrar documentos de contratación.');
    }
  };

  const removeDocument = async (tipoId) => {
    if (soloLectura) return;

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
        title: 'Documento eliminado correctamente',
      });
    } catch (error) {
      console.error('Error eliminando documento:', error);
      toast({
        title: 'Error al eliminar documento',
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = async (e, tipoId) => {
    if (soloLectura) return;

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
            },
          ],
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
          },
        ]);

        toast({
          title: 'Documento cargado correctamente',
        });

        if (input) input.value = '';
      } catch (error) {
        console.error('Error cargando documento:', error);
        toast({
          title: 'Error al cargar documento',
          variant: 'destructive',
        });

        if (input) input.value = '';
      }
    };

    reader.readAsDataURL(file);
  };

  const esDocumentoRetiroManual = (doc) => {
  const nombre = (doc?.NombreDocumento || '').toUpperCase();

  return (
  nombre.includes('RETIRO ARL') ||
  nombre.includes('LIQUIDACIÓN DE CONTRATO') ||
  nombre.includes('LIQUIDACION DE CONTRATO')
);
};

const recargarDocumentosRetiro = async () => {
  const id =
    aspirante?.idRegistroPersonal ||
    aspirante?.IdRegistroPersonal ||
    aspirante?.id;

  const res = await fetch(`${API_BASE}/retiros-laborales/carpeta-digital/${id}/documentos`);
  const data = await res.json();

  setDocumentos(Array.isArray(data?.data) ? data.data : []);
};

const handleFileUploadRetiro = async (e, doc) => {
  if (soloLectura) return;

  const file = e.target.files[0];
  if (!file) return;

  const input = e.target;

  const idRetiroLaboral =
    doc?.IdRetiroLaboral ||
    doc?.idRetiroLaboral ||
    aspirante?.IdRetiroLaboral ||
    aspirante?.idRetiroLaboral;

  if (!idRetiroLaboral) {
    console.error('No hay IdRetiroLaboral para adjuntar documento de retiro', {
      doc,
      aspirante,
    });

    toast({
      title: 'No se puede adjuntar',
      description: 'Este trabajador no tiene IdRetiroLaboral asociado en la carpeta digital.',
      variant: 'destructive',
    });

    if (input) input.value = '';
    return;
  }

  try {
    const formData = new FormData();

    formData.append('file', file);
    formData.append('IdTipoDocumentoRetiro', doc.IdTipoDocumentoRetiro);

    const response = await fetch(
      `${API_BASE}/rrll/retiro/${idRetiroLaboral}/adjuntos`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('No fue posible adjuntar el documento.');
    }

    toast({
      title: 'Documento adjuntado correctamente',
    });

    await recargarDocumentosRetiro();

    if (input) input.value = '';
  } catch (error) {
    console.error('Error adjuntando documento de retiro:', error);

    toast({
      title: 'Error al adjuntar documento',
      description: error.message || 'No fue posible adjuntar el documento.',
      variant: 'destructive',
    });

    if (input) input.value = '';
  }
};

const recargarDocumentosActivos = async () => {
  const id =
    aspirante?.IdRegistroPersonal ||
    aspirante?.idRegistroPersonal ||
    aspirante?.id_registro_personal ||
    aspirante?.id;

  const res = await listarDocumentosActivos(id);
  setDocumentos(Array.isArray(res) ? res : []);
};

const verDocumentoActivo = async (doc) => {
  const data = await obtenerDocumentoActivo(doc.IdDocumento);
  verDocumento({
    ...data,
    DocumentoBase64: data.DocumentoBase64,
  });
};

const descargarDocumentoActivo = async (doc) => {
  const data = await obtenerDocumentoActivo(doc.IdDocumento);
  descargarDocumento({
    ...data,
    DocumentoBase64: data.DocumentoBase64,
  });
};

const handleFileUploadActivo = async (e, idTipoDocumentacion) => {

  const file = e.target.files[0];
  if (!file) return;

  const input = e.target;
  const reader = new FileReader();

  reader.onload = async (event) => {
    try {
      const base64 = String(event.target.result || '').split(',')[1] || '';

      const idRegistroPersonal =
        aspirante?.IdRegistroPersonal ||
        aspirante?.idRegistroPersonal ||
        aspirante?.id_registro_personal ||
        aspirante?.id;

      const response = await subirDocumentosActivos({
        idRegistroPersonal,
        documentos: [
          {
            IdTipoDocumentacion: idTipoDocumentacion,
            Nombre: file.name,
            Formato: file.type || 'application/pdf',
            DocumentoCargado: base64,
          },
        ],
      });

      if (!response.ok) throw new Error('No fue posible cargar el documento activo');

      toast({ title: 'Documento activo cargado correctamente' });
      await recargarDocumentosActivos();

      if (input) input.value = '';
    } catch (error) {
      console.error('Error cargando documento activo:', error);
      toast({
        title: 'Error al cargar documento activo',
        variant: 'destructive',
      });

      if (input) input.value = '';
    }
  };

  reader.readAsDataURL(file);
};

const eliminarDocumentoActivoFront = async (idDocumento) => {
  
  const confirmar = window.confirm('¿Seguro que deseas eliminar este documento activo?');
  if (!confirmar) return;

  try {
    const response = await eliminarDocumentoActivo(idDocumento);

    if (!response.ok) throw new Error('No fue posible eliminar el documento activo');

    toast({ title: 'Documento activo eliminado correctamente' });
    await recargarDocumentosActivos();
  } catch (error) {
    console.error('Error eliminando documento activo:', error);
    toast({
      title: 'Error al eliminar documento activo',
      variant: 'destructive',
    });
  }
};

 const renderCarpetaActivos = () => (
  <div className="py-4">
    {loading ? (
      <div className="py-14 text-center text-gray-500">
        Cargando documentos activos...
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[55vh] overflow-y-auto pr-2">
        {documentos.map((grupo) => {
          const docsGrupo = Array.isArray(grupo.documentos) ? grupo.documentos : [];
          const hasFile = docsGrupo.length > 0;

          return (
            <div
              key={grupo.IdTipoDocumentacion}
              className="border-2 border-emerald-200 rounded-2xl p-6 bg-white/90 shadow-lg flex flex-col justify-between h-full w-full hover:shadow-2xl transition-shadow duration-200"
            >
              <div>
                <h4 className="font-bold text-emerald-900 mb-3 text-base leading-tight tracking-wide">
                  {grupo.tipo_documento}
                </h4>

                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4 border shadow-sm ${hasFile ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-red-100 text-red-700 border-red-300'}`}>
                  {hasFile ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {hasFile ? `${docsGrupo.length} documento(s)` : 'Sin archivos'}
                </div>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="file"
                    id={`file-activo-${grupo.IdTipoDocumentacion}-${aspirante.id}`}
                    className="hidden"
                    onChange={(e) => handleFileUploadActivo(e, grupo.IdTipoDocumentacion)}
                    accept=".pdf,image/*"
                  />

                  <label
                    htmlFor={`file-activo-${grupo.IdTipoDocumentacion}-${aspirante.id}`}
                    className="cursor-pointer flex items-center justify-center w-full px-3 py-2 border-2 border-emerald-300 shadow-sm text-sm font-semibold rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-2" /> Adjuntar documento
                  </label>
                </div>

                {hasFile ? (
                  <div className="space-y-2">
                    {docsGrupo.map((doc) => (
                      <div
                        key={doc.IdDocumento}
                        className="flex items-center gap-2 border border-gray-200 bg-gray-50 rounded-lg px-3 py-2"
                      >
                        <span className="flex-1 text-sm font-semibold text-gray-700 truncate">
                          {doc.Nombre || 'Documento activo'}
                        </span>

                        <button
                          type="button"
                          title="Ver"
                          className="text-blue-700 hover:text-blue-900"
                          onClick={() => verDocumentoActivo(doc)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          title="Descargar"
                          className="text-emerald-700 hover:text-emerald-900"
                          onClick={() => descargarDocumentoActivo(doc)}
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          title="Eliminar"
                          className="text-red-700 hover:text-red-900"
                          onClick={() => eliminarDocumentoActivoFront(doc.IdDocumento)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">
                    Sin documentos adjuntos
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

  const renderCarpetaRetiro = () => (
    <div className="py-4">
      {loading ? (
        <div className="py-14 text-center text-gray-500">
          Cargando documentos de retiro...
        </div>
      ) : documentos.length === 0 ? (
        <div className="py-14 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mb-4 shadow-sm">
            <Folder className={`w-10 h-10 ${colorIcono}`} />
          </div>

          <h3 className="text-xl font-bold text-gray-800">
            Documentos de Retiro
          </h3>

          <p className="text-sm text-gray-500 mt-2 max-w-md">
            Este trabajador aún no tiene retiro laboral registrado.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[50vh] overflow-y-auto pr-2">
          {documentos.map((doc) => {
            const hasFile = !!doc?.Adjuntado;

            return (
              <div
                key={doc.IdTipoDocumentoRetiro}
                className="border-2 border-red-200 rounded-2xl p-6 bg-white/90 shadow-lg flex flex-col justify-between h-full group w-full hover:shadow-2xl transition-shadow duration-200"
              >
                <div>
                  <h4 className="font-bold text-red-800 mb-3 text-base leading-tight min-h-[40px] tracking-wide flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-400"></span>
                    {doc.NombreDocumento}
                  </h4>

                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4 border shadow-sm ${hasFile ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-red-100 text-red-700 border-red-300'}`}>
                    {hasFile ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {hasFile ? 'Adjuntado' : 'Sin archivo'}
                  </div>
                </div>
                <div className="space-y-3">
                  {!hasFile && !soloLectura && esDocumentoRetiroManual(doc) && (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="file"
                          id={`file-retiro-${doc.IdTipoDocumentoRetiro}-${aspirante.id}`}
                          className="hidden"
                          onChange={(e) => handleFileUploadRetiro(e, doc)}
                          accept=".pdf,image/*,.doc,.docx"
                        />

                        <label
                          htmlFor={`file-retiro-${doc.IdTipoDocumentoRetiro}-${aspirante.id}`}
                          className="cursor-pointer flex items-center justify-center w-full px-3 py-2 border-2 border-red-300 shadow-sm text-sm font-semibold rounded-xl text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          <Upload className="w-4 h-4 mr-2" /> Adjuntar
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
                        className="text-blue-700 border-blue-300 hover:bg-blue-100 px-3 h-auto w-full font-semibold"
                        onClick={() => verDocumentoRetiro(doc)}
                      >
                        <Eye className="w-4 h-4 mr-2" /> Ver
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-emerald-700 border-emerald-300 hover:bg-emerald-100 px-3 h-auto w-full font-semibold"
                        onClick={() => descargarDocumentoRetiro(doc)}
                      >
                        <Download className="w-4 h-4 mr-2" /> Descargar
                      </Button>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 truncate h-4 italic">
                    {hasFile
                      ? doc.NombreArchivoOriginal || doc.NombreArchivo || 'Documento disponible'
                      : 'Sin archivo adjunto'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
          className={
            esCarpetaOperaciones
              ? 'w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] max-h-[calc(100vh-1rem)] overflow-hidden rounded-2xl border-0 p-0 shadow-2xl sm:max-w-[850px] sm:rounded-3xl'
              : 'rounded-3xl border-0 p-0 shadow-2xl sm:max-w-[850px]'
          }
        >
        <div className="rounded-t-3xl bg-gradient-to-br from-yellow-50 via-white to-emerald-50 px-0 pt-0 pb-0">
          <div
              className={
                esCarpetaOperaciones
                  ? 'border-b border-emerald-100 px-4 pb-3 pt-5 sm:px-8 sm:pb-4 sm:pt-8'
                  : 'border-b border-emerald-100 px-8 pb-4 pt-8'
              }
            >
            <DialogHeader>
           <DialogTitle
                className={
                  esCarpetaOperaciones
                    ? 'flex min-w-0 items-center gap-3 break-words pr-6 text-xl font-extrabold leading-tight text-emerald-700 drop-shadow-sm sm:gap-4 sm:text-3xl'
                    : 'flex items-center gap-4 text-3xl font-extrabold text-emerald-700 drop-shadow-sm'
                }
              >
                <Folder
                  className={
                    esCarpetaOperaciones
                      ? `h-7 w-7 shrink-0 sm:h-10 sm:w-10 ${colorIcono}`
                      : `h-10 w-10 ${colorIcono}`
                  }
                />

                <span className="min-w-0 break-words">
                  {tituloModal}
                </span>
              </DialogTitle>

             <DialogDescription
                  className={
                    esCarpetaOperaciones
                      ? 'mt-2 break-words pr-4 text-sm leading-relaxed text-gray-600 sm:text-lg'
                      : 'mt-2 text-lg text-gray-600'
                  }
                >
                Gestiona la documentación para{' '}
                <span className="font-semibold text-emerald-800">
                  {aspirante.nombres} {aspirante.apellidos}
                </span>.
              </DialogDescription>

              {soloLectura && (
                <p className="text-sm text-gray-500 mt-2">
                  Modo consulta: en la carpeta digital solo se permite visualizar y descargar documentos.
                </p>
              )}
            </DialogHeader>

            {esCarpetaIngreso && (
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
            )}
          </div>

          <div
              className={
                esCarpetaOperaciones
                  ? 'min-w-0 overflow-hidden px-3 pb-2 pt-2 sm:px-8'
                  : 'px-8 pb-2 pt-2'
              }
            >
            {esCarpetaActivos && renderCarpetaActivos()}

            {esCarpetaRetiro && renderCarpetaRetiro()}

            {esCarpetaOperaciones && (
  <div className="grid min-w-0 grid-cols-1 gap-3 overflow-y-auto overflow-x-hidden py-3 pr-0 sm:grid-cols-2 sm:gap-6 sm:py-4 sm:pr-2 max-h-[calc(100vh-17rem)] sm:max-h-[50vh]">
    {[
      { id: 3, label: 'Hoja de vida' },
      { id: 4, label: 'Documento de identidad' },
      { id: 65, label: 'Carnet de la empresa' },
      { id: 30, label: 'Certificado EPS' },
      { id: 26, label: 'Certificado ARL' },
      { id: 41, label: 'Vacunación COVID' },
      { id: 35, label: 'Vacunación tétano Hepatitis' },
      { id: 6, label: 'Consulta Antecedentes Policía' },
      { id: 7, label: 'Consulta Procuraduría' },
      { id: 8, label: 'Consulta Contraloría' },
      { id: 9, label: 'Consulta Rama Judicial' },
    ].map((req) => {
      const doc = Array.isArray(documentos)
        ? documentos.find(d => String(d.IdTipoDocumentacion) === String(req.id))
        : null;

      const hasFile = !!doc && (doc.DocumentoBase64 || doc.DocumentoCargado);

      return (
        <div
          key={req.id}
          className="group flex h-full w-full min-w-0 flex-col justify-between overflow-hidden rounded-2xl border-2 border-emerald-200 bg-white/90 p-4 shadow-lg transition-shadow duration-200 hover:shadow-2xl sm:p-6"
        >
          <div>
          <h4 className="mb-3 flex min-w-0 items-start gap-2 break-words text-sm font-bold leading-tight tracking-wide text-emerald-900 sm:min-h-[40px] sm:text-base">
            <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-400"></span>
            {req.label}
          </h4>

            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4 border shadow-sm ${hasFile ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-red-100 text-red-700 border-red-300'}`}>
              {hasFile ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {hasFile ? 'Adjuntado' : 'No disponible'}
            </div>
          </div>

          <div className="space-y-3">
            {hasFile && (
              <div className="flex flex-col gap-2 w-full">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-11 w-full border-blue-300 px-3 font-semibold text-blue-700 hover:bg-blue-100"
                  onClick={() => verDocumento(doc)}
                >
                  <Eye className="w-4 h-4 mr-2" /> Ver
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                 className="min-h-11 w-full border-emerald-300 px-3 font-semibold text-emerald-700 hover:bg-emerald-100"
                  onClick={() => descargarDocumento(doc)}
                >
                  <Download className="w-4 h-4 mr-2" /> Descargar
                </Button>
              </div>
            )}

           <p className="min-w-0 break-all text-xs italic leading-relaxed text-gray-500">
            {hasFile ? doc.Nombre : 'Sin archivo'}
          </p>
          </div>
        </div>
      );
    })}
  </div>
)}

            {esCarpetaIngreso && (
              <Tabs value={tab} onValueChange={setTab} className="w-full">
                <TabsContent value="ingreso">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4 max-h-[50vh] overflow-y-auto pr-2">
                    {docTypeConfigIngreso?.list?.map((req) => {
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
                            {!hasFile && !soloLectura && (
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
                                  className="text-blue-700 border-blue-300 hover:bg-blue-100 px-3 h-auto w-full font-semibold"
                                  onClick={() => verDocumento(doc)}
                                >
                                  <Eye className="w-4 h-4 mr-2" /> Ver
                                </Button>

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="text-emerald-700 border-emerald-300 hover:bg-emerald-100 px-3 h-auto w-full font-semibold"
                                  onClick={() => descargarDocumento(doc)}
                                >
                                  <Download className="w-4 h-4 mr-2" /> Descargar
                                </Button>

                                {!soloLectura && (
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

                      const docFirma42 = String(req.id) === '73'
                        ? documentosArray.find(d => String(d.IdTipoDocumentacion) === '42')
                        : null;

                      const doc = docDirecto || docFirma42 || null;
                      const hasFile = !!doc;
                      const esTratamientoDatos = String(req.id) === '73';

                      return (
                        <div key={req.id} className="border-2 border-orange-200 rounded-2xl p-6 bg-white/90 shadow-lg flex flex-col justify-between h-full group w-full hover:shadow-2xl transition-shadow duration-200">
                          <div>
                            <h4 className="font-bold text-orange-800 mb-3 text-base leading-tight min-h-[40px] tracking-wide flex items-center gap-2">
                              <span className="inline-block w-2 h-2 rounded-full bg-orange-400"></span>
                              {req.nombre || req.label}
                            </h4>

                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4 border shadow-sm ${hasFile ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-red-100 text-red-700 border-red-300'}`}>
                              {hasFile ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                              {hasFile ? 'Adjuntado' : 'Falta adjuntar'}
                            </div>
                          </div>

                          <div className="space-y-3">
                            {!hasFile && !soloLectura && (
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <input
                                    type="file"
                                    id={`file-seguridad-${req.id}-${aspirante.id}`}
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(e, req.id)}
                                    accept=".pdf,image/*"
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
                                  className="text-blue-700 border-blue-300 hover:bg-blue-100 px-3 h-auto w-full font-semibold"
                                  onClick={() => verDocumento(doc)}
                                >
                                  <Eye className="w-4 h-4 mr-2" /> Ver
                                </Button>

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="text-emerald-700 border-emerald-300 hover:bg-emerald-100 px-3 h-auto w-full font-semibold"
                                  onClick={() =>
                                    soloLectura
                                      ? descargarDocumento(doc)
                                      : esTratamientoDatos
                                        ? handleDescargarTratamientoDatos()
                                        : descargarDocumento(doc)
                                  }
                                >
                                  <Download className="w-4 h-4 mr-2" /> Descargar
                                </Button>

                                {!soloLectura && !esTratamientoDatos && (
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
                    {listaDocumentosContratacion.map((req) => {
                      const doc = Array.isArray(documentos)
                        ? documentos.find(d => String(d.IdTipoDocumentacion) === String(req.id))
                        : null;

                      const hasFile = !!doc && (doc.DocumentoBase64 || doc.DocumentoCargado);

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
                            {!hasFile && !soloLectura && (
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <input
                                    type="file"
                                    id={`file-contratacion-${req.id}-${aspirante.id}`}
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(e, req.id)}
                                    accept=".pdf,image/*"
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
                                  className="text-blue-700 border-blue-300 hover:bg-blue-100 px-3 h-auto w-full font-semibold"
                                  onClick={() => verDocumento(doc)}
                                >
                                  <Eye className="w-4 h-4 mr-2" /> Ver
                                </Button>

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="text-emerald-700 border-emerald-300 hover:bg-emerald-100 px-3 h-auto w-full font-semibold"
                                  onClick={() => descargarDocumento(doc)}
                                >
                                  <Download className="w-4 h-4 mr-2" /> Descargar
                                </Button>

                                {!soloLectura && (
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
                              {hasFile ? doc.Nombre : 'Sin archivo'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {!soloLectura && (
                    <div className="flex justify-end mt-4">
                      <Button
                        variant="default"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-2 rounded-xl shadow-md"
                        onClick={() => handleEnviarDocumentosContratacion?.(documentos)}
                      >
                        Guardar documentos
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>

        <DialogFooter
              className={
                esCarpetaOperaciones
                  ? 'flex shrink-0 justify-end rounded-b-2xl border-t border-emerald-100 bg-gradient-to-r from-emerald-50 to-yellow-50 px-3 py-3 sm:rounded-b-3xl sm:px-8 sm:py-4'
                  : 'flex justify-end rounded-b-3xl border-t border-emerald-100 bg-gradient-to-r from-emerald-50 to-yellow-50 px-8 py-4'
              }
            >
          <Button
            variant="outline"
            onClick={onClose}
            className={
            esCarpetaOperaciones
              ? 'min-h-11 w-full rounded-xl border-emerald-300 bg-white px-6 py-2 text-base font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50 sm:w-auto sm:px-8 sm:text-lg'
              : 'rounded-xl border-emerald-300 bg-white px-8 py-2 text-lg font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50'
          }
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUploadModal;