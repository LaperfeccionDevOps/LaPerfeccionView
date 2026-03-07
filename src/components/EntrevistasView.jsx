
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Calendar, User, Briefcase, Clock, FileText, Upload, Save, Eye, Download, Trash2, ArrowLeft, BookUser, ChevronLeft, ChevronRight, ArrowUpDown, ChevronsLeft, ChevronsRight, Info, UserCheck, ShieldCheck, Users, Heart, MapPin, Phone, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useAspirantes } from '@/hooks/useAspirantes';
import { ALL_STATUS_OPTIONS, getEstadoInfo } from '@/utils/statusUtils';

const tiposDocumentosPrueba = [
  'Prueba Psicotécnica',
  'Prueba de Conocimientos',
  'Evaluación de Competencias',
  'Referencias Laborales',
  'Certificado de Antecedentes',
  'Otros Documentos'
];

const tiposDocumentosReferencia = [
    { id: 'referenciaPersonal1', nombre: 'Carta Referencia Personal 1' },
    { id: 'referenciaPersonal2', nombre: 'Carta Referencia Personal 2' },
    { id: 'referenciaLaboral1', nombre: 'Certificado Laboral 1' },
    { id: 'referenciaLaboral2', nombre: 'Certificado Laboral 2' },
];

const REQUISITOS_OBLIGATORIOS = [
    { key: 'hojaVida', label: 'Hoja de Vida' },
    { key: 'cedula', label: 'Cédula de Ciudadanía' },
    { key: 'antecedentes', label: 'Antecedentes Policiales/Disciplinarios' },
    { key: 'certificados', label: 'Certificados Laborales Previos' },
    { key: 'examenes', label: 'Exámenes Médicos de Ingreso' }
];

const EntrevistasView = () => {
  const { aspirantes, updateAspirante } = useAspirantes();
  const [searchDate, setSearchDate] = useState('');
  const [entrevistas, setEntrevistas] = useState([]);
  const [filteredEntrevistas, setFilteredEntrevistas] = useState([]);
  const [selectedEntrevista, setSelectedEntrevista] = useState(null);
  const [managementView, setManagementView] = useState(false);

  // Estado para gestión de entrevista
  const [estadoEntrevista, setEstadoEntrevista] = useState('');
  const [estadoAspirante, setEstadoAspirante] = useState('');
  const [observaciones, setObservaciones] = useState(''); 
  const [documentosPrueba, setDocumentosPrueba] = useState({});
  const [documentosAspirante, setDocumentosAspirante] = useState({});
  
  // Estado para edición de datos del aspirante
  const [aspiranteFormData, setAspiranteFormData] = useState(null);

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  useEffect(() => {
    const stored = localStorage.getItem('entrevistas');
    if (stored) {
      const data = JSON.parse(stored);
      setEntrevistas(data);
      setFilteredEntrevistas(data);
    } else {
      const ejemplos = [
        {
          id: 1,
          aspiranteId: 1731677707000,
          nombre: 'Juan Díaz',
          cargo: 'Contador',
          fechaHora: '2025-11-21T10:00:00',
          estado: 'En proceso',
          observaciones: '',
          documentosPrueba: {}
        },
        {
          id: 2,
          aspiranteId: null,
          nombre: 'María González',
          cargo: 'Supervisor de Limpieza',
          fechaHora: '2025-11-22T14:30:00',
          estado: 'Pendiente',
          observaciones: '',
          documentosPrueba: {}
        },
        {
          id: 3,
          aspiranteId: null,
          nombre: 'Carlos Ramírez',
          cargo: 'Operario de Aseo',
          fechaHora: '2025-11-23T09:00:00',
          estado: 'Pendiente',
          observaciones: '',
          documentosPrueba: {}
        }
      ];
      setEntrevistas(ejemplos);
      setFilteredEntrevistas(ejemplos);
      localStorage.setItem('entrevistas', JSON.stringify(ejemplos));
    }
  }, []);

  const handleSearch = () => {
    if (!searchDate) {
      setFilteredEntrevistas(entrevistas);
      return;
    }
    const filtered = entrevistas.filter(e => {
      const entrevistaDate = new Date(e.fechaHora).toISOString().split('T')[0];
      return entrevistaDate === searchDate;
    });
    setFilteredEntrevistas(filtered);
    setCurrentPage(1);
    toast({ title: `🔍 Búsqueda completada`, description: `Se encontraron ${filtered.length} entrevista(s)` });
  };

  const getEstadoColor = (estado) => {
    const colors = {
      'Pendiente': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'En proceso': 'bg-blue-100 text-blue-700 border-blue-300',
      'Completada': 'bg-green-100 text-green-700 border-green-300',
      'Cancelada': 'bg-red-100 text-red-700 border-red-300',
      'Reprogramada': 'bg-purple-100 text-purple-700 border-purple-300'
    };
    return colors[estado] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const handleGestionarEntrevista = (entrevista) => {
    setSelectedEntrevista(entrevista);
    setEstadoEntrevista(entrevista.estado);
    setObservaciones(entrevista.observaciones || '');
    setDocumentosPrueba(entrevista.documentosPrueba || {});
    
    if (entrevista.aspiranteId) {
        const aspirante = aspirantes.find(a => a.id === entrevista.aspiranteId);
        if (aspirante) {
            setDocumentosAspirante(aspirante.documentos || {});
            setEstadoAspirante(aspirante.estado || '');
            setAspiranteFormData({ ...aspirante });
        } else {
            setDocumentosAspirante({});
            setEstadoAspirante('');
            setAspiranteFormData(null);
        }
    } else {
        setDocumentosAspirante({});
        setEstadoAspirante('');
        setAspiranteFormData(null);
    }

    setManagementView(true);
  };

  const handleAspiranteChange = (field, value) => {
    setAspiranteFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e, tipoDoc) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setDocumentosPrueba(prev => ({
        ...prev,
        [tipoDoc]: { nombre: file.name, tipo: file.type, fecha: new Date().toISOString(), url: event.target.result }
      }));
      toast({ title: `✅ Documento cargado` });
    };
    reader.readAsDataURL(file);
  };

  const removeDocument = (tipoDoc) => {
    const newDocs = { ...documentosPrueba };
    delete newDocs[tipoDoc];
    setDocumentosPrueba(newDocs);
    toast({ title: "🗑️ Documento eliminado" });
  };

  const viewDocument = (doc) => {
    window.open(doc.url, '_blank');
  };

  const handleSaveGestion = () => {
    const updatedEntrevistas = entrevistas.map(e => 
      e.id === selectedEntrevista.id 
        ? { ...e, estado: estadoEntrevista, observaciones, documentosPrueba }
        : e
    );

    setEntrevistas(updatedEntrevistas);
    setFilteredEntrevistas(updatedEntrevistas);
    localStorage.setItem('entrevistas', JSON.stringify(updatedEntrevistas));

    if (selectedEntrevista.aspiranteId && aspiranteFormData) {
        const updatedAspirante = {
            ...aspiranteFormData,
            estado: estadoAspirante 
        };
        updateAspirante(updatedAspirante);
    }

    toast({ title: '🎉 Datos guardados', description: 'La entrevista y ficha del aspirante han sido actualizadas.' });
    setManagementView(false);
    setSelectedEntrevista(null);
    setAspiranteFormData(null);
  };

  // Sorting & Pagination
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    let sortableItems = [...filteredEntrevistas];
    if (sortConfig.key !== null) {
        sortableItems.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
    }
    return sortableItems;
  }, [filteredEntrevistas, sortConfig]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const SortIcon = ({ columnKey }) => (sortConfig.key !== columnKey ? <ArrowUpDown className="w-4 h-4 ml-2 opacity-50" /> : <ArrowUpDown className={cn("w-4 h-4 ml-2", sortConfig.direction === 'ascending' ? "text-emerald-400" : "text-emerald-400 rotate-180")} />);


  if (managementView && selectedEntrevista) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" onClick={() => setManagementView(false)} className="flex items-center gap-2 rounded-xl">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Ficha de Entrevista y Validación</h2>
            <p className="text-sm text-gray-500">Gestión integral del candidato {selectedEntrevista.nombre}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-t-4 border-emerald-600">
          {/* Sticky Header for Actions */}
          <div className="bg-gray-50 p-4 border-b flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="bg-emerald-100 p-2 rounded-lg">
                      <Calendar className="w-6 h-6 text-emerald-700" />
                  </div>
                  <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Agendada para</p>
                      <p className="text-sm font-bold text-gray-800">
                          {new Date(selectedEntrevista.fechaHora).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                  </div>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                 <div className="flex-1 md:flex-none">
                     <Label className="text-xs mb-1 block">Estado Entrevista</Label>
                     <Select value={estadoEntrevista} onValueChange={setEstadoEntrevista}>
                        <SelectTrigger className="h-9 w-full md:w-[180px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Pendiente">Pendiente</SelectItem>
                            <SelectItem value="En proceso">En proceso</SelectItem>
                            <SelectItem value="Completada">Completada</SelectItem>
                            <SelectItem value="Cancelada">Cancelada</SelectItem>
                            <SelectItem value="Reprogramada">Reprogramada</SelectItem>
                        </SelectContent>
                     </Select>
                 </div>
                 <Button onClick={handleSaveGestion} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md self-end">
                    <Save className="w-4 h-4 mr-2" /> Guardar
                 </Button>
              </div>
          </div>

          <div className="p-8 space-y-10">
            
            {/* 1. Identificación y Registro */}
            <section>
                <div className="flex items-center gap-3 mb-4 border-b pb-2 border-gray-100">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600"><UserCheck className="w-5 h-5" /></div>
                    <h3 className="text-lg font-bold text-gray-800">1. Identificación y Registro</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="space-y-1.5"><Label className="text-xs text-gray-500">Tipo Identificación</Label>
                        <Select value={aspiranteFormData?.IdTipoIdentificacion || 'CC'} onValueChange={(v) => handleAspiranteChange('IdTipoIdentificacion', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CC">Cédula Ciudadanía</SelectItem>
                                <SelectItem value="CE">Cédula Extranjería</SelectItem>
                                <SelectItem value="PPT">Permiso P. Temp</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs text-gray-500">Número Identificación</Label>
                        <Input value={aspiranteFormData?.NumeroIdentificacion || aspiranteFormData?.cedula || ''} onChange={(e) => handleAspiranteChange('NumeroIdentificacion', e.target.value)} />
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs text-gray-500">Fecha Expedición</Label>
                        <Input type="date" value={aspiranteFormData?.FechaExpedicion || ''} onChange={(e) => handleAspiranteChange('FechaExpedicion', e.target.value)} />
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs text-gray-500">Lugar Expedición</Label>
                        <Input value={aspiranteFormData?.LugarExpedicion || ''} onChange={(e) => handleAspiranteChange('LugarExpedicion', e.target.value)} />
                    </div>
                    {/* Registro Info */}
                    <div className="space-y-1.5"><Label className="text-xs text-gray-500">Cargo al que aspira</Label>
                        <Input value={aspiranteFormData?.cargo || selectedEntrevista.cargo || ''} onChange={(e) => handleAspiranteChange('cargo', e.target.value)} />
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs text-gray-500">Fecha Registro</Label>
                        <Input disabled value={aspiranteFormData?.fechaRegistro ? new Date(aspiranteFormData.fechaRegistro).toLocaleDateString() : 'N/A'} className="bg-gray-50 text-gray-500" />
                    </div>
                    <div className="lg:col-span-2 space-y-1.5">
                        <Label className="text-xs font-bold text-emerald-700">Estado del Proceso (Aspirante)</Label>
                        <Select value={estadoAspirante} onValueChange={setEstadoAspirante} disabled={!selectedEntrevista.aspiranteId}>
                            <SelectTrigger className="border-emerald-200 bg-emerald-50/30 text-emerald-900 font-medium"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {ALL_STATUS_OPTIONS.map((status) => (
                                    <SelectItem key={status} value={status}>{getEstadoInfo(status).label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </section>

            {/* 2. Datos Personales */}
            <section>
                <div className="flex items-center gap-3 mb-4 border-b pb-2 border-gray-100">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600"><User className="w-5 h-5" /></div>
                    <h3 className="text-lg font-bold text-gray-800">2. Datos Personales</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1.5"><Label className="text-xs text-gray-500">Nombres</Label><Input value={aspiranteFormData?.Nombres || aspiranteFormData?.nombres || ''} onChange={(e) => handleAspiranteChange('Nombres', e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-xs text-gray-500">Apellidos</Label><Input value={aspiranteFormData?.Apellidos || aspiranteFormData?.apellidos || ''} onChange={(e) => handleAspiranteChange('Apellidos', e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-xs text-gray-500">Fecha Nacimiento</Label><Input type="date" value={aspiranteFormData?.FechaNacimiento || aspiranteFormData?.fechaNacimiento || ''} onChange={(e) => handleAspiranteChange('FechaNacimiento', e.target.value)} /></div>
                    <div className="space-y-1.5">
                        <Label className="text-xs text-gray-500">Género</Label>
                        <Select value={aspiranteFormData?.IdTipoGenero || aspiranteFormData?.genero || ''} onValueChange={(v) => handleAspiranteChange('IdTipoGenero', v)}>
                            <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Masculino">Masculino</SelectItem>
                                <SelectItem value="Femenino">Femenino</SelectItem>
                                <SelectItem value="Otro">Otro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs text-gray-500">Estado Civil</Label>
                        <Select value={aspiranteFormData?.IdEstadoCivil || aspiranteFormData?.estadoCivil || ''} onValueChange={(v) => handleAspiranteChange('IdEstadoCivil', v)}>
                            <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Soltero">Soltero(a)</SelectItem>
                                <SelectItem value="Casado">Casado(a)</SelectItem>
                                <SelectItem value="UnionLibre">Unión Libre</SelectItem>
                                <SelectItem value="Separado">Separado(a)</SelectItem>
                                <SelectItem value="Viudo">Viudo(a)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs text-gray-500">Nº Hijos</Label><Input type="number" value={aspiranteFormData?.CuantosHijos || ''} onChange={(e) => handleAspiranteChange('CuantosHijos', e.target.value)} /></div>
                </div>
            </section>

            {/* 3. Información de Contacto */}
            <section>
                <div className="flex items-center gap-3 mb-4 border-b pb-2 border-gray-100">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600"><Phone className="w-5 h-5" /></div>
                    <h3 className="text-lg font-bold text-gray-800">3. Información de Contacto</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1.5"><Label className="text-xs text-gray-500">Celular</Label><Input value={aspiranteFormData?.Celular || aspiranteFormData?.celular || ''} onChange={(e) => handleAspiranteChange('Celular', e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-xs text-gray-500">Correo Electrónico</Label><Input value={aspiranteFormData?.Email || aspiranteFormData?.correo || ''} onChange={(e) => handleAspiranteChange('Email', e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-xs text-gray-500">Dirección Residencia</Label><Input value={aspiranteFormData?.Direccion || aspiranteFormData?.direccion || ''} onChange={(e) => handleAspiranteChange('Direccion', e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-xs text-gray-500">Barrio</Label><Input value={aspiranteFormData?.Barrio || aspiranteFormData?.barrio || ''} onChange={(e) => handleAspiranteChange('Barrio', e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-xs text-gray-500">Nombre Contacto Emergencia</Label><Input value={aspiranteFormData?.ContactoEmergencia || ''} onChange={(e) => handleAspiranteChange('ContactoEmergencia', e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-xs text-gray-500">Tel. Contacto Emergencia</Label><Input value={aspiranteFormData?.TelefonoContactoEmergencia || ''} onChange={(e) => handleAspiranteChange('TelefonoContactoEmergencia', e.target.value)} /></div>
                </div>
            </section>

            {/* 4. Datos Físicos y Salud */}
            <section>
                <div className="flex items-center gap-3 mb-4 border-b pb-2 border-gray-100">
                    <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center text-rose-600"><Heart className="w-5 h-5" /></div>
                    <h3 className="text-lg font-bold text-gray-800">4. Datos Físicos y Salud</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                     <div className="space-y-1.5">
                        <Label className="text-xs text-gray-500">EPS</Label>
                        <Select value={aspiranteFormData?.IdEps || ''} onValueChange={(v) => handleAspiranteChange('IdEps', v)}>
                            <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Sanitas">Sanitas</SelectItem>
                                <SelectItem value="Sura">Sura</SelectItem>
                                <SelectItem value="NuevaEPS">Nueva EPS</SelectItem>
                                <SelectItem value="Compensar">Compensar</SelectItem>
                                <SelectItem value="Famisanar">Famisanar</SelectItem>
                                <SelectItem value="Sisben">Sisbén</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs text-gray-500">Talla Camisa</Label><Input value={aspiranteFormData?.tallaCamisa || ''} onChange={(e) => handleAspiranteChange('tallaCamisa', e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-xs text-gray-500">Talla Pantalón</Label><Input value={aspiranteFormData?.tallaPantalon || ''} onChange={(e) => handleAspiranteChange('tallaPantalon', e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className="text-xs text-gray-500">Talla Zapato</Label><Input value={aspiranteFormData?.tallaZapato || ''} onChange={(e) => handleAspiranteChange('tallaZapato', e.target.value)} /></div>
                </div>
            </section>

            {/* 5. Núcleo Familiar */}
            <section>
                <div className="flex items-center gap-3 mb-4 border-b pb-2 border-gray-100">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600"><Users className="w-5 h-5" /></div>
                    <h3 className="text-lg font-bold text-gray-800">5. Núcleo Familiar</h3>
                </div>
                {aspiranteFormData?.nucleoFamiliar && aspiranteFormData.nucleoFamiliar.length > 0 ? (
                    <div className="border rounded-xl overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                <tr><th className="p-3">Nombre</th><th className="p-3">Parentesco</th><th className="p-3">Edad</th><th className="p-3">Ocupación</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {aspiranteFormData.nucleoFamiliar.map((fam, idx) => (
                                    <tr key={idx}>
                                        <td className="p-3">{fam.nombre}</td>
                                        <td className="p-3">{fam.parentesco}</td>
                                        <td className="p-3">{fam.edad}</td>
                                        <td className="p-3">{fam.ocupacion}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg text-center">No hay información del núcleo familiar registrada.</div>
                )}
            </section>

            {/* 6. Referencias Personales */}
            <section>
                <div className="flex items-center gap-3 mb-4 border-b pb-2 border-gray-100">
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600"><BookUser className="w-5 h-5" /></div>
                    <h3 className="text-lg font-bold text-gray-800">6. Referencias Personales y Laborales</h3>
                </div>
                
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Datos de Referencia</h4>
                    {aspiranteFormData?.referencias && aspiranteFormData.referencias.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                            {aspiranteFormData.referencias.map((ref, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded-lg border text-sm">
                                    <p className="font-bold text-gray-800">{ref.nombre}</p>
                                    <p className="text-gray-500">{ref.telefono} - {ref.ocupacion}</p>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-sm text-gray-500 italic mb-4">No hay referencias registradas en la hoja de vida.</p>}

                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Documentos de Soporte (Referencias)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {tiposDocumentosReferencia.map(tipo => (
                            <div key={tipo.id} className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
                                <span className="text-sm text-gray-600">{tipo.nombre}</span>
                                {documentosAspirante[tipo.id] ? (
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => viewDocument(documentosAspirante[tipo.id])}><Eye className="w-4 h-4"/></Button>
                                        <a href={documentosAspirante[tipo.id].url} download={documentosAspirante[tipo.id].nombre}><Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600"><Download className="w-4 h-4"/></Button></a>
                                    </div>
                                ) : <span className="text-xs text-gray-400 italic">No adjunto</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 7. Requisitos Obligatorios */}
            <section>
                <div className="flex items-center gap-3 mb-4 border-b pb-2 border-gray-100">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-600"><ShieldCheck className="w-5 h-5" /></div>
                    <h3 className="text-lg font-bold text-gray-800">7. Requisitos Obligatorios</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {REQUISITOS_OBLIGATORIOS.map((req) => {
                        const isUploaded = !!documentosAspirante[req.key];
                        return (
                            <div key={req.key} className={cn("flex items-center p-3 rounded-lg border", isUploaded ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200")}>
                                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center mr-3", isUploaded ? "bg-emerald-500 text-white" : "bg-gray-300 text-gray-500")}>
                                    {isUploaded ? <FileCheck className="w-3 h-3" /> : <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                                <div className="flex-1">
                                    <p className={cn("text-sm font-medium", isUploaded ? "text-emerald-800" : "text-gray-600")}>{req.label}</p>
                                    <p className="text-xs text-gray-400">{isUploaded ? "Documento verificado en sistema" : "Pendiente de carga"}</p>
                                </div>
                                {isUploaded && (
                                    <Button variant="ghost" size="sm" className="text-emerald-600 h-8 w-8 p-0" onClick={() => viewDocument(documentosAspirante[req.key])}>
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* 8. Documentos de Pruebas */}
            <section>
                <div className="flex items-center gap-3 mb-4 border-b pb-2 border-gray-100">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600"><FileText className="w-5 h-5" /></div>
                    <h3 className="text-lg font-bold text-gray-800">8. Documentos de Pruebas (Carga por Entrevistador)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tiposDocumentosPrueba.map((tipo) => (
                        <div key={tipo} className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50/50 hover:bg-white hover:border-emerald-400 transition-all">
                             <div className="flex justify-between items-start mb-2">
                                 <p className="text-sm font-medium text-gray-700 leading-tight">{tipo}</p>
                                 {documentosPrueba[tipo] && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded-full">Cargado</span>}
                             </div>
                             
                             {documentosPrueba[tipo] ? (
                                 <div className="flex items-center justify-between mt-3 bg-white p-2 rounded border shadow-sm">
                                     <span className="text-xs text-gray-500 truncate max-w-[100px]">{documentosPrueba[tipo].nombre}</span>
                                     <div className="flex gap-1">
                                         <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => viewDocument(documentosPrueba[tipo])}><Eye className="w-3 h-3 text-blue-500"/></Button>
                                         <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeDocument(tipo)}><Trash2 className="w-3 h-3 text-red-500"/></Button>
                                     </div>
                                 </div>
                             ) : (
                                 <label className="mt-3 flex items-center justify-center w-full py-2 border border-gray-200 bg-white text-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 hover:text-emerald-600 text-xs font-medium transition-colors">
                                     <Upload className="w-3 h-3 mr-2" /> Adjuntar Archivo
                                     <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, tipo)} />
                                 </label>
                             )}
                        </div>
                    ))}
                </div>
            </section>

            {/* 9. Comentarios del Entrevistador */}
            <section>
                 <div className="flex items-center gap-3 mb-4 border-b pb-2 border-gray-100">
                     <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-700"><Info className="w-5 h-5" /></div>
                     <h3 className="text-lg font-bold text-gray-800">9. Comentarios del Entrevistador</h3>
                 </div>
                 <Textarea 
                    value={observaciones} 
                    onChange={(e) => setObservaciones(e.target.value)} 
                    placeholder="Ingrese sus conclusiones finales, observaciones sobre el perfil, y recomendaciones para la siguiente etapa..." 
                    className="min-h-[120px] border-amber-200 focus:border-amber-400 bg-amber-50/30 text-gray-800"
                 />
            </section>

          </div>
          
          <div className="bg-gray-50 p-6 border-t flex justify-end gap-4">
             <Button variant="outline" onClick={() => setManagementView(false)}>Cancelar</Button>
             <Button onClick={handleSaveGestion} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 shadow-lg shadow-emerald-600/20">
                <Save className="w-4 h-4 mr-2" /> Guardar Todos los Cambios
             </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-emerald-600">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Entrevistas agendadas</h2>
          </div>
        </div>

        <div className="flex gap-4 items-end mb-6">
          <div className="flex-1 space-y-2">
            <Label htmlFor="searchDate">Fecha agendada</Label>
            <Input
              id="searchDate"
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="border-emerald-200 focus:border-emerald-500 rounded-xl"
            />
          </div>
          <Button
            onClick={handleSearch}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-8 rounded-xl shadow-md"
          >
            <Search className="w-5 h-5 mr-2" />
            BUSCAR
          </Button>
        </div>

        <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
                <thead>
                <tr className="bg-black text-white border-b border-gray-800">
                    <th className="p-4 font-semibold cursor-pointer hover:bg-gray-900 transition-colors" onClick={() => handleSort('nombre')}>
                        <div className="flex items-center">Nombre <SortIcon columnKey="nombre" /></div>
                    </th>
                    <th className="p-4 font-semibold cursor-pointer hover:bg-gray-900 transition-colors" onClick={() => handleSort('cargo')}>
                        <div className="flex items-center">Cargo <SortIcon columnKey="cargo" /></div>
                    </th>
                    <th className="p-4 font-semibold cursor-pointer hover:bg-gray-900 transition-colors" onClick={() => handleSort('fechaHora')}>
                        <div className="flex items-center">Fecha hora entrevista <SortIcon columnKey="fechaHora" /></div>
                    </th>
                    <th className="text-center p-4 font-semibold">Opciones</th>
                    <th className="text-center p-4 font-semibold cursor-pointer hover:bg-gray-900 transition-colors" onClick={() => handleSort('estado')}>
                        <div className="flex items-center justify-center">Estado <SortIcon columnKey="estado" /></div>
                    </th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {currentItems.length === 0 ? (
                    <tr>
                    <td colSpan="5" className="text-center p-16 text-gray-500">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                <Calendar className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-lg font-medium text-gray-900">No se encontraron entrevistas</p>
                        </div>
                    </td>
                    </tr>
                ) : (
                    currentItems.map((entrevista) => (
                    <tr key={entrevista.id} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-sm">
                            <User className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-medium text-gray-800">{entrevista.nombre}</span>
                        </div>
                        </td>
                        <td className="p-4">
                        <div className="flex items-center gap-2 text-gray-600">
                            <Briefcase className="w-4 h-4 text-emerald-600" />
                            <span>{entrevista.cargo}</span>
                        </div>
                        </td>
                        <td className="p-4">
                        <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4 text-emerald-600" />
                            <span>
                            {new Date(entrevista.fechaHora).toLocaleString('es-ES', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                            </span>
                        </div>
                        </td>
                        <td className="p-4 text-center">
                        <Button
                            onClick={() => handleGestionarEntrevista(entrevista)}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-sm px-4 py-2 text-sm h-auto"
                            title="Gestionar entrevista"
                        >
                            Gestionar entrevista
                        </Button>
                        </td>
                        <td className="p-4 text-center">
                        <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-semibold border inline-block shadow-sm",
                            getEstadoColor(entrevista.estado)
                        )}>
                            {entrevista.estado}
                        </span>
                        </td>
                    </tr>
                    ))
                )}
                </tbody>
            </table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200 bg-gray-50/50">
                    <div className="text-sm text-gray-500">
                        Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a <span className="font-medium">{Math.min(indexOfLastItem, sortedData.length)}</span> de <span className="font-medium">{sortedData.length}</span> resultados
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => paginate(1)} disabled={currentPage === 1}><ChevronsLeft className="w-4 h-4" /></Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
                        <div className="flex items-center gap-1 mx-2">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum = i + 1;
                                if (totalPages > 5 && currentPage > 3) {
                                    pageNum = currentPage - 2 + i;
                                    if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                                }
                                return (
                                    <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" className={cn("h-8 w-8 rounded-lg p-0", currentPage === pageNum ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "")} onClick={() => paginate(pageNum)}>{pageNum}</Button>
                                );
                            })}
                        </div>
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => paginate(totalPages)} disabled={currentPage === totalPages}><ChevronsRight className="w-4 h-4" /></Button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </motion.div>
  );
};

export default EntrevistasView;
