import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FolderOpen,
  Search,
  Folder,
  Files,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAspirantes } from '@/hooks/useAspirantes';
import { useAuth } from '@/context/AuthContext';
import DocumentUploadModal from '@/components/modals/DocumentUploadModal';
import { getEstadoInfo } from '@/utils/statusUtils';
import { cn } from '@/lib/utils';

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
  { id: 41, label: 'Fotocopia de carne de vacunas covid' },
  { id: 35, label: 'Fotocopia de carné de vacunas Hepatitis - Tétano' },
  { id: 42, label: 'Firma digital' },
  { id: 30, label: 'Certificado de afiliación EPS' },
  { id: 73, label: 'Tratamiento de datos' },
];

const documentosSeleccion = [
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
  { id: 73, label: 'Tratamiento de datos' },
];

const documentosContratacion = [
  { id: 62, label: 'Acuerdos de confidencialidad' },
  { id: 37, label: 'Constancia de inducción' },
  { id: 64, label: 'Otro si (Si aplica)' },
  { id: 26, label: 'Afiliación ARL' },
  { id: 27, label: 'Afiliación EPS' },
  { id: 31, label: 'Afiliación caja de compensación' },
  { id: 36, label: 'Entrega de dotación' },
  { id: 65, label: 'Carnet Aseo la Perfección' },
  { id: 57, label: 'Paquete contratación' },
  { id: 20, label: 'Descripción del cargo y manual de funciones' },
  { id: 74, label: 'Contrato de trabajo' },
  { id: 32, label: 'Cuenta bancaria' },
];

const documentosRetiro = [
  { id: 2, label: 'Paz y salvo' },
  { id: 4, label: 'Carta finalización contrato' },
  { id: 10, label: 'Paquete de retiro' },
];

const documentosOperaciones = [
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
];

const docTypes = {
  ingreso: {
    title: 'Documentos de Ingreso',
    list: documentosIngreso,
    color: 'yellow',
  },
  seleccion: {
    title: 'Documentos de Selección',
    list: documentosSeleccion,
    color: 'orange',
  },
  contratacion: {
    title: 'Documentos de Contratación',
    list: documentosContratacion,
    color: 'emerald',
  },
  retiro: {
    title: 'Documentos de Retiro',
    list: documentosRetiro,
    color: 'red',
  },
  operaciones: {
  title: 'Documentos Operaciones',
  list: documentosOperaciones,
  color: 'emerald',
},
};

const ArchivosView = () => {
  const { aspirantes, updateAspirante, loadAspirantes } = useAspirantes();

  const { user } = useAuth();
  const isOperaciones = user?.role === 'Operaciones';

  const [filteredAspirantes, setFilteredAspirantes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [modalState, setModalState] = useState({
    isOpen: false,
    aspirante: null,
    isDemo: false,
    carpeta: 'ingreso',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  
  useEffect(() => {
    if (aspirantes.length === 0) loadAspirantes();
  }, [loadAspirantes, aspirantes.length]);

  useEffect(() => {
    let filtered = aspirantes;

    const q = (searchTerm || '').trim().toLowerCase();

    if (!q) {
      setFilteredAspirantes([]);
      setCurrentPage(1);
      return;
    }

   filtered = filtered.filter(a => {
    const nombre = `${a?.nombres || ''} ${a?.apellidos || ''}`.toLowerCase();
    const correo = (a?.correo || '').toLowerCase();

    const cedula = (
      a?.cedula ||
      a?.identificacion ||
      a?.NumeroIdentificacion ||
      a?.numeroIdentificacion ||
      a?.documento ||
      ''
    ).toString().toLowerCase();

    return (
      nombre.includes(q) ||
      correo.includes(q) ||
      cedula.includes(q)
    );
  });

   setFilteredAspirantes(filtered);

    setCurrentPage(1);
  }, [searchTerm, aspirantes]);

  const openDocumentosTrabajador = (aspirante, carpeta = 'ingreso') => {
    const isDemo = false;

    setModalState({
      isOpen: true,
      aspirante,
      isDemo,
      carpeta,
    });
  };

  const closeDocumentosTrabajador = () => {
    setModalState({
      isOpen: false,
      aspirante: null,
      isDemo: false,
      carpeta: 'ingreso',
    });
  };

  const handleDocumentSave = (updatedDocs) => {
    if (modalState.isDemo) {
      toast({
        title: 'Modo ejemplo',
        description: 'Este registro es DEMO. No guarda cambios.',
      });
      return;
    }

    const targetAspirante = modalState.aspirante;
    const updatedAspirante = {
      ...targetAspirante,
      documentosGestion: updatedDocs,
    };

    updateAspirante(updatedAspirante);

    toast({
      title: 'Cambios guardados',
      description: 'Documentación actualizada exitosamente.',
    });
  };

 const getModalConfigs = () => {
  if (modalState.carpeta === 'ingreso') {
    return {
      ingreso: docTypes.ingreso,
      seguridad: docTypes.seleccion,
      contratacion: docTypes.contratacion,
    };
  }

  if (modalState.carpeta === 'operaciones') {
    return {
      ingreso: docTypes.operaciones,
      seguridad: {
        title: 'Documentos Operaciones',
        list: [],
        color: 'emerald',
      },
      contratacion: {
        title: 'Documentos Operaciones',
        list: [],
        color: 'emerald',
      },
    };
  }

  if (modalState.carpeta === 'activo') {
    return {
      ingreso: {
        title: 'Documentos Activos',
        list: [],
        color: 'emerald',
      },
      seguridad: {
        title: 'Documentos Activos',
        list: [],
        color: 'emerald',
      },
      contratacion: {
        title: 'Documentos Activos',
        list: [],
        color: 'emerald',
      },
    };
  }

  if (modalState.carpeta === 'retiro') {
    return {
      ingreso: {
        title: 'Documentos de Retiro',
        list: [],
        color: 'red',
      },
      seguridad: {
        title: 'Documentos de Retiro',
        list: [],
        color: 'red',
      },
      contratacion: {
        title: 'Documentos de Retiro',
        list: [],
        color: 'red',
      },
    };
  }

  return {
    ingreso: docTypes.ingreso,
    seguridad: docTypes.seleccion,
    contratacion: docTypes.contratacion,
  };
};

  const modalConfigs = getModalConfigs();

  const handleSort = (key) => {
    let direction = 'ascending';

    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }

    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    const sortableItems = [...filteredAspirantes];

    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a?.[sortConfig.key] < b?.[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }

        if (a?.[sortConfig.key] > b?.[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }

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

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 ml-2 text-gray-500 opacity-50" />;
    }

    return (
      <ArrowUpDown
        className={cn(
          'w-4 h-4 ml-2',
          sortConfig.direction === 'ascending'
            ? 'text-emerald-400'
            : 'text-emerald-400 rotate-180'
        )}
      />
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-emerald-600">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-800">Gestión de Archivos</h1>
              <p className="text-sm text-gray-500">
                Repositorio digital de expedientes de colaboradores.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <Input
                placeholder="Buscar por nombre o cédula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full md:w-64 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="p-4 font-semibold cursor-pointer hover:bg-gray-800 transition-colors" onClick={() => handleSort('nombres')}>
                    <div className="flex items-center">
                      Colaborador <SortIcon columnKey="nombres" />
                    </div>
                  </th>

                  <th className="p-4 font-semibold cursor-pointer hover:bg-gray-800 transition-colors" onClick={() => handleSort('cedula')}>
                    <div className="flex items-center">
                      Identificación <SortIcon columnKey="cedula" />
                    </div>
                  </th>

                  <th className="p-4 font-semibold cursor-pointer hover:bg-gray-800 transition-colors" onClick={() => handleSort('cargo')}>
                    <div className="flex items-center">
                      Cargo <SortIcon columnKey="cargo" />
                    </div>
                  </th>

                  <th className="p-4 font-semibold text-center">Estado</th>
                  <th className="p-4 font-semibold text-center">Carpeta Digital</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {currentItems.length > 0 ? (
                  currentItems.map((aspirante) => {
                   const isDemoRow = false;

                    return (
                      <motion.tr
                        key={aspirante.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                       className={cn(
                          'hover:bg-emerald-50/30 transition-colors group'
                        )}
                        
                      >
                        <td className="p-4">
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {`${aspirante.nombres || ''} ${aspirante.apellidos || ''}`.toUpperCase()}

                            {isDemoRow && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                                DEMO
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-gray-500">
                            {(aspirante.correo || 'SIN CORREO').toUpperCase()}
                          </div>
                        </td>

                        <td className="p-4 text-gray-600 font-mono text-sm">
                          {aspirante.cedula}
                        </td>

                        <td className="p-4 text-gray-600">
                          {aspirante.cargo ||
                            aspirante.Cargo ||
                            aspirante.nombreCargo ||
                            aspirante.NombreCargo ||
                            aspirante.descripcionCargo ||
                            aspirante.DescripcionCargo ||
                            aspirante.cargoNombre ||
                            aspirante.CargoNombre ||
                            'No asignado'}
                        </td>

                        <td className="p-4 text-center">
                          <span
                            className={cn(
                              'px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border',
                              getEstadoInfo(aspirante.estado).color
                                .replace('text-', 'bg-')
                                .replace('700', '100 text-')
                                .replace('600', '700 border-')
                            )}
                          >
                            {getEstadoInfo(aspirante.estado).label}
                          </span>
                        </td>

                       <td className="p-4 text-center">
  <div className="flex gap-5 justify-center items-center">
    {isOperaciones ? (
      <button
        type="button"
        title="Documentos Operaciones"
        onClick={() => openDocumentosTrabajador(aspirante, 'operaciones')}
        className="flex flex-col items-center gap-1 text-emerald-600 hover:scale-105 transition-transform"
      >
        <FolderOpen className="w-6 h-6" />
        <span className="text-[11px] font-semibold text-gray-600">
          Operaciones
        </span>
      </button>
    ) : (
      <>
        <button
          type="button"
          title="Documentos de ingreso"
          onClick={() => openDocumentosTrabajador(aspirante, 'ingreso')}
          className="flex flex-col items-center gap-1 text-yellow-600 hover:scale-105 transition-transform"
        >
          <Folder className="w-6 h-6" />
          <span className="text-[11px] font-semibold text-gray-600">
            Ingreso
          </span>
        </button>

        <button
          type="button"
          title="Documentos activos"
          onClick={() => openDocumentosTrabajador(aspirante, 'activo')}
          className="flex flex-col items-center gap-1 text-emerald-600 hover:scale-105 transition-transform"
        >
          <Files className="w-6 h-6" />
          <span className="text-[11px] font-semibold text-gray-600">
            Activos
          </span>
        </button>

        <button
          type="button"
          title="Documentos de retiro"
          onClick={() => openDocumentosTrabajador(aspirante, 'retiro')}
          className="flex flex-col items-center gap-1 text-red-600 hover:scale-105 transition-transform"
        >
          <FolderOpen className="w-6 h-6" />
          <span className="text-[11px] font-semibold text-gray-600">
            Retiro
          </span>
        </button>
      </>
    )}
  </div>
</td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-16">
                      <div className="flex flex-col items-center text-gray-500">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Search className="w-8 h-8 text-gray-400" />
                        </div>

                        <p className="text-lg font-medium">
                          {searchTerm.trim()
                            ? 'No se encontraron registros'
                            : 'Busca un trabajador'}
                        </p>

                        <p className="text-sm">
                          {searchTerm.trim()
                            ? 'No se encontró ningún colaborador con ese criterio.'
                            : 'Ingresa el nombre o número de identificación para consultar la carpeta digital.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200 bg-gray-50/50">
              <div className="text-sm text-gray-500">
                Mostrando {indexOfFirstItem + 1}-
                {Math.min(indexOfLastItem, sortedData.length)} de {sortedData.length}
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

      <DocumentUploadModal
        key={`${modalState.aspirante?.id || 'sin-aspirante'}-${modalState.carpeta}`}
        isOpen={modalState.isOpen}
        onClose={closeDocumentosTrabajador}
        aspirante={modalState.aspirante}
        onSave={handleDocumentSave}
        docTypeConfigIngreso={modalConfigs.ingreso}
        docTypeConfigSeguridad={modalConfigs.seguridad}
        docTypeConfigContratacion={modalConfigs.contratacion}
        tipoCarpeta={modalState.carpeta}
        soloLectura={modalState.carpeta !== 'retiro'}
      />
    </motion.div>
  );
};

export default ArchivosView;