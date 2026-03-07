import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, CalendarPlus, User, Calendar as CalendarIcon, Save, ChevronLeft, ChevronRight, ArrowUpDown, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getEstadoInfo } from '@/utils/statusUtils';
import { useAspirantes } from '@/hooks/useAspirantes';

const SeleccionProcesoView = () => {
  const { aspirantes, updateAspirante } = useAspirantes();
  const [filteredAspirantes, setFilteredAspirantes] = useState([]);
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAspirante, setSelectedAspirante] = useState(null);
  const [interviewData, setInterviewData] = useState({ date: '', time: '', notes: '' });

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  useEffect(() => {
    // Filter only those in process or interview
    const inProcess = aspirantes.filter(asp => asp.estado === 'en-proceso' || asp.estado === 'entrevista');
    
    let filtered = inProcess;
    if (estadoFilter !== 'todos') {
      filtered = filtered.filter(asp => asp.estado === estadoFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(asp =>
        `${asp.nombres} ${asp.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asp.cedula.includes(searchTerm)
      );
    }
    setFilteredAspirantes(filtered);
    setCurrentPage(1);
  }, [estadoFilter, searchTerm, aspirantes]);

  const openInterviewModal = (aspirante) => {
    setSelectedAspirante(aspirante);
    setInterviewData({ date: '', time: '', notes: '' });
    setIsModalOpen(true);
  };

  const handleScheduleInterview = () => {
    if (!interviewData.date || !interviewData.time) {
      toast({
        title: "⚠️ Faltan datos",
        description: "Por favor, especifica la fecha y la hora de la entrevista.",
        variant: "destructive",
      });
      return;
    }

    const fechaHora = `${interviewData.date}T${interviewData.time}:00`;
    const newInterview = {
      id: Date.now(),
      aspiranteId: selectedAspirante.id,
      nombre: `${selectedAspirante.nombres} ${selectedAspirante.apellidos}`,
      cargo: selectedAspirante.cargo || 'No especificado',
      fechaHora,
      estado: 'Pendiente',
      observaciones: interviewData.notes,
      observacionesRefPersonales: '',
      observacionesRefLaborales: '',
      documentosPrueba: {}
    };

    const entrevistas = JSON.parse(localStorage.getItem('entrevistas') || '[]');
    entrevistas.push(newInterview);
    localStorage.setItem('entrevistas', JSON.stringify(entrevistas));
    
    // Update aspirante status to 'entrevista'
    const updatedAspirante = { ...selectedAspirante, estado: 'entrevista' };
    updateAspirante(updatedAspirante);

    toast({
      title: "✅ Entrevista Agendada",
      description: `Se ha programado una entrevista para ${newInterview.nombre}.`,
    });

    setIsModalOpen(false);
  };

  // Sorting Logic
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    let sortableItems = [...filteredAspirantes];
    if (sortConfig.key !== null) {
        sortableItems.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    }
    return sortableItems;
  }, [filteredAspirantes, sortConfig]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="w-4 h-4 ml-2 text-gray-500 opacity-50" />;
    return <ArrowUpDown className={cn("w-4 h-4 ml-2", sortConfig.direction === 'ascending' ? "text-emerald-400" : "text-emerald-400 rotate-180")} />;
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-emerald-600">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <CalendarPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Selección en Proceso</h2>
              <p className="text-sm text-gray-500">Gestiona y agenda entrevistas para los candidatos activos.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input placeholder="Buscar por nombre o cédula..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 border-emerald-200 focus:border-emerald-500 rounded-xl" />
            </div>
            <div className="w-full md:w-64">
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger className="border-emerald-200 focus:border-emerald-500 rounded-xl"><Filter className="w-4 h-4 mr-2 text-emerald-600" /><SelectValue placeholder="Filtrar por estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="en-proceso">En Proceso</SelectItem>
                  <SelectItem value="entrevista">Entrevista</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                <thead>
                    <tr className="bg-black text-white border-b border-gray-800">
                    <th className="p-4 font-semibold cursor-pointer hover:bg-gray-900 transition-colors" onClick={() => handleSort('nombres')}>
                        <div className="flex items-center">Nombre <SortIcon columnKey="nombres" /></div>
                    </th>
                    <th className="p-4 font-semibold cursor-pointer hover:bg-gray-900 transition-colors" onClick={() => handleSort('cargo')}>
                        <div className="flex items-center">Cargo Aspirado <SortIcon columnKey="cargo" /></div>
                    </th>
                    <th className="p-4 font-semibold cursor-pointer hover:bg-gray-900 transition-colors" onClick={() => handleSort('fechaRegistro')}>
                        <div className="flex items-center">Fecha Aplicación <SortIcon columnKey="fechaRegistro" /></div>
                    </th>
                    <th className="p-4 font-semibold text-center cursor-pointer hover:bg-gray-900 transition-colors" onClick={() => handleSort('estado')}>
                        <div className="flex items-center justify-center">Estado <SortIcon columnKey="estado" /></div>
                    </th>
                    <th className="p-4 font-semibold text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {currentItems.length > 0 ? (
                    currentItems.map((aspirante) => (
                        <motion.tr key={aspirante.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="p-4">
                            <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-800">{aspirante.nombres} {aspirante.apellidos}</p>
                                <p className="text-xs text-gray-500">{aspirante.cedula}</p>
                            </div>
                            </div>
                        </td>
                        <td className="p-4 text-gray-600">{aspirante.cargo || 'No especificado'}</td>
                        <td className="p-4 text-gray-600">{new Date(aspirante.fechaRegistro).toLocaleDateString('es-ES')}</td>
                        <td className="p-4 text-center">
                            <span className={cn('px-3 py-1 text-xs font-semibold rounded-full inline-block shadow-sm', getEstadoInfo(aspirante.estado).color)}>
                            {getEstadoInfo(aspirante.estado).label}
                            </span>
                        </td>
                        <td className="p-4 text-center">
                            <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 rounded-lg h-8" onClick={() => openInterviewModal(aspirante)}>
                            <CalendarIcon className="w-4 h-4 mr-2" /> Agendar Entrevista
                            </Button>
                        </td>
                        </motion.tr>
                    ))
                    ) : (
                    <tr>
                        <td colSpan="5">
                            <div className="text-center py-16 text-gray-500">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                        <Search className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-lg font-medium text-gray-900">No se encontraron candidatos en proceso</p>
                                    <p className="text-sm text-gray-500">Puedes cambiar el estado de los aspirantes en la sección de "Seguimiento".</p>
                                </div>
                            </div>
                        </td>
                    </tr>
                    )}
                </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200 bg-gray-50/50">
                    <div className="text-sm text-gray-500">
                        Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a <span className="font-medium">{Math.min(indexOfLastItem, sortedData.length)}</span> de <span className="font-medium">{sortedData.length}</span> resultados
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            onClick={() => paginate(1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronsLeft className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        
                        <div className="flex items-center gap-1 mx-2">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum = i + 1;
                                if (totalPages > 5 && currentPage > 3) {
                                    pageNum = currentPage - 2 + i;
                                    if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                                }
                                
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? "default" : "outline"}
                                        size="sm"
                                        className={cn("h-8 w-8 rounded-lg p-0", currentPage === pageNum ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "")}
                                        onClick={() => paginate(pageNum)}
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            onClick={() => paginate(totalPages)}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronsRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
          </div>
        </div>
      </motion.div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white"> 
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2"><CalendarPlus/> Agendar Entrevista</DialogTitle>
            <DialogDescription>
              Para: <span className="font-semibold">{selectedAspirante?.nombres} {selectedAspirante?.apellidos}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interview-date">Fecha</Label>
                <Input id="interview-date" type="date" value={interviewData.date} onChange={(e) => setInterviewData({...interviewData, date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interview-time">Hora</Label>
                <Input id="interview-time" type="time" value={interviewData.time} onChange={(e) => setInterviewData({...interviewData, time: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="interview-notes">Notas / Observaciones</Label>
              <Textarea id="interview-notes" placeholder="Ej: Entrevista virtual vía Google Meet, traer portafolio..." value={interviewData.notes} onChange={(e) => setInterviewData({...interviewData, notes: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleScheduleInterview} className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
              <Save className="w-4 h-4 mr-2" />
              Guardar Entrevista
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SeleccionProcesoView;