
import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';
import { Search, Filter, UserCheck, Eye, ChevronLeft, ChevronRight, ArrowUpDown, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { getEstadoInfo, ALL_STATUS_OPTIONS } from '@/utils/statusUtils';
import { useAspirantes } from '@/hooks/useAspirantes';
import StatusUpdateModal from '@/components/modals/StatusUpdateModal';
import AspiranteDetailModal from '@/components/modals/AspiranteDetailModal';


const SeguimientoView = () => {
  const { aspirantes, updateAspirante } = useAspirantes();
  const [filteredAspirantes, setFilteredAspirantes] = useState([]);
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Exportar datos filtrados a Excel
  const exportToExcel = () => {
    if (!filteredAspirantes.length) {
      toast({ title: 'No hay datos para exportar', description: 'No existen registros para exportar.' });
      return;
    }
    const data = filteredAspirantes.map(({ nombres, apellidos, cedula, cargo, estado }) => ({
      Nombres: nombres,
      Apellidos: apellidos,
      Cédula: cedula,
      Cargo: cargo,
      Estado: getEstadoInfo(estado).label
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, 'reporte_seguimiento.xlsx');
  };

  // Exportar datos filtrados a CSV
  const exportToCSV = () => {
    if (!filteredAspirantes.length) {
      toast({ title: 'No hay datos para exportar', description: 'No existen registros para exportar.' });
      return;
    }
    const data = filteredAspirantes.map(({ nombres, apellidos, cedula, cargo, estado }) => ({
      Nombres: nombres,
      Apellidos: apellidos,
      Cédula: cedula,
      Cargo: cargo,
      Estado: getEstadoInfo(estado).label
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reporte_seguimiento.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };
  
  const [detailModalState, setDetailModalState] = useState({ isOpen: false, aspirante: null });
  const [statusModalState, setStatusModalState] = useState({ isOpen: false, aspirante: null, newStatus: null });

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  useEffect(() => {
    let filtered = aspirantes;
    if (estadoFilter !== 'todos') {
      filtered = filtered.filter(asp => asp.estado === estadoFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(asp =>
        `${asp.nombres} ${asp.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asp.cedula && asp.cedula.includes(searchTerm))
      );
    }
    setFilteredAspirantes(filtered);
    setCurrentPage(1);
  }, [estadoFilter, searchTerm, aspirantes]);

  const handleStatusChange = (aspirante, newStatus) => {
    if (aspirante.estado === newStatus) return;
    setStatusModalState({ isOpen: true, aspirante, newStatus });
  };

  const confirmStatusUpdate = (details) => {
    const { aspirante, newStatus } = statusModalState;
    const newHistoryEntry = {
      estado: newStatus,
      fecha: new Date().toISOString(),
      ...details
    };
    const updatedAspirante = {
        ...aspirante,
        estado: newStatus,
        historialEstados: aspirante.historialEstados ? [...aspirante.historialEstados, newHistoryEntry] : [newHistoryEntry]
    };
    updateAspirante(updatedAspirante);
    toast({ title: "✅ Estado Actualizado", description: `El aspirante ha sido movido a "${getEstadoInfo(newStatus).label}".` });
    setStatusModalState({ isOpen: false, aspirante: null, newStatus: null });
  };
  
  const openDetailModal = (aspirante) => {
    setDetailModalState({ isOpen: true, aspirante });
  };

  const handleDetailSave = (updatedAspiranteData) => {
    updateAspirante(updatedAspiranteData);
    toast({ title: "💾 Información Actualizada", description: "Los detalles del aspirante han sido guardados." });
    setDetailModalState({ isOpen: false, aspirante: null });
  };

  // Sorting
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
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
            <UserCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Seguimiento de Candidatos</h2>
            <p className="text-sm text-gray-500">Visualiza y edita los detalles completos de cada proceso.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex gap-2 mb-2 md:mb-0">
            <Button onClick={exportToExcel} variant="outline" className="border-green-400 text-green-700 hover:bg-green-50">Descargar Excel</Button>
            <Button onClick={exportToCSV} variant="outline" className="border-blue-400 text-blue-700 hover:bg-blue-50">Descargar CSV</Button>
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input placeholder="Buscar por nombre o cédula..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 border-emerald-200 focus:border-emerald-500 rounded-xl" />
          </div>
          <div className="w-full md:w-64">
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="border-emerald-200 focus:border-emerald-500 rounded-xl"><Filter className="w-4 h-4 mr-2 text-emerald-600" /><SelectValue placeholder="Filtrar por estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {ALL_STATUS_OPTIONS.map(status => (
                  <SelectItem key={status} value={status}>{getEstadoInfo(status).label}</SelectItem>
                ))}
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
                    <th className="p-4 font-semibold cursor-pointer hover:bg-gray-900 transition-colors" onClick={() => handleSort('cedula')}>
                        <div className="flex items-center">Cédula <SortIcon columnKey="cedula" /></div>
                    </th>
                    <th className="p-4 font-semibold cursor-pointer hover:bg-gray-900 transition-colors" onClick={() => handleSort('cargo')}>
                        <div className="flex items-center">Cargo <SortIcon columnKey="cargo" /></div>
                    </th>
                    <th className="p-4 font-semibold text-center cursor-pointer hover:bg-gray-900 transition-colors" onClick={() => handleSort('estado')}>
                        <div className="flex items-center justify-center">Estado <SortIcon columnKey="estado" /></div>
                    </th>
                    <th className="p-4 font-semibold text-center">Acciones</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {currentItems.map((aspirante) => {
                    const estadoInfo = getEstadoInfo(aspirante.estado);
                    return (
                    <motion.tr key={aspirante.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="p-4 font-medium text-gray-700">{aspirante.nombres} {aspirante.apellidos}</td>
                    <td className="p-4 text-gray-600">{aspirante.cedula}</td>
                    <td className="p-4 text-gray-600">{aspirante.cargo || 'No especificado'}</td>
                    <td className="p-4 text-center">
                        <Select value={aspirante.estado} onValueChange={(value) => handleStatusChange(aspirante, value)}>
                            <SelectTrigger className="w-48 mx-auto h-8 text-xs font-semibold border-emerald-100 bg-white shadow-sm focus:ring-emerald-500/20">
                                <SelectValue>{estadoInfo.label}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {ALL_STATUS_OPTIONS.map(status => (
                                    <SelectItem key={status} value={status} disabled={aspirante.estado === status}>{getEstadoInfo(status).label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </td>
                    <td className="p-4">
                        <div className="flex justify-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 rounded-lg" onClick={() => openDetailModal(aspirante)}>
                            <Eye className="w-4 h-4" />
                        </Button>
                        </div>
                    </td>
                    </motion.tr>
                )})}
                {currentItems.length === 0 && (
                    <tr>
                        <td colSpan="5" className="text-center py-16 text-gray-500">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                    <Search className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-lg font-medium text-gray-900">No se encontraron aspirantes</p>
                            </div>
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200 bg-gray-50/50">
                    <div className="text-sm text-gray-500">
                        Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedData.length)} de {sortedData.length}
                    </div>
                    <div className="flex gap-1 items-center">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
                        {Array.from({ length: totalPages }, (_, i) => (
                          <Button 
                            key={i + 1} 
                            variant={currentPage === i + 1 ? "default" : "outline"} 
                            size="sm" 
                            className="h-8 w-8 p-0" 
                            onClick={() => paginate(i + 1)}
                          >
                            {i + 1}
                          </Button>
                        ))}
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></Button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </motion.div>

    <StatusUpdateModal 
        isOpen={statusModalState.isOpen}
        onClose={() => setStatusModalState({ isOpen: false, aspirante: null, newStatus: null })}
        onSubmit={confirmStatusUpdate}
        currentStatus={statusModalState.aspirante?.estado}
        newStatus={statusModalState.newStatus}
    />
    
    <AspiranteDetailModal 
        isOpen={detailModalState.isOpen}
        onClose={() => setDetailModalState({ isOpen: false, aspirante: null })}
        aspirante={detailModalState.aspirante}
        onSave={handleDetailSave}
    />
    </>
  );
};

export default SeguimientoView;
