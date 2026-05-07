
import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';
import { Search, Filter, UserCheck, Eye, ChevronLeft, ChevronRight, ArrowUpDown, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { getEstadoInfo, ALL_STATUS_OPTIONS_SELECCION } from '@/utils/statusUtils';
import { useAspirantes } from '@/hooks/useAspirantes';
import StatusUpdateModal from '@/components/modals/StatusUpdateModal';
import AspiranteDetailModal from '@/components/modals/AspiranteDetailModal';

const SeleccionView = () => {
  const { aspirantes, updateAspirante, token } = useAspirantes();
  const [filteredAspirantes, setFilteredAspirantes] = useState([]);
  
  // Filter UI State
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // Modals State
  const [statusModalState, setStatusModalState] = useState({ isOpen: false, aspirante: null, newStatus: null });
  const [detailModalState, setDetailModalState] = useState({ isOpen: false, aspirante: null });
  
  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

 useEffect(() => {
  let filtered = aspirantes;

  filtered = filtered.filter(
    asp => (asp.estado || '').trim().toUpperCase() !== 'CONTRATADO'
  );

  if (estadoFilter !== 'todos') {
    filtered = filtered.filter(asp => asp.estado.trim() === estadoFilter.trim());
  }

  if (searchTerm) {
    const lowerTerm = searchTerm.toLowerCase();
    filtered = filtered.filter(asp =>
      `${asp.nombres} ${asp.apellidos}`.toLowerCase().includes(lowerTerm) ||
      (asp.cedula && asp.cedula.includes(lowerTerm))
    );
  }

  if (dateFilter) {
    filtered = filtered.filter(asp => asp.fechaRegistro && asp.fechaRegistro.startsWith(dateFilter));
  }

  setFilteredAspirantes(filtered);
  setCurrentPage(1);
}, [estadoFilter, searchTerm, dateFilter, aspirantes]);

  // Handlers
  const handleStatusChangeRequest = (aspirante, newStatus) => {
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

  // Sorting Logic
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

  // Exportar datos filtrados a Excel
const exportToExcel = async () => {
  try {
    const response = await fetch(
  `${import.meta.env.VITE_API_BASE_URL}/datos-seleccion/reporte-excel`,
  {
    method: "GET",
  }
);

    if (!response.ok) {
      throw new Error("Error al generar el Excel");
    }

    const contentType = response.headers.get("content-type");
console.log("Content-Type Excel:", contentType);

const blob = await response.blob();
console.log("Blob size Excel:", blob.size);

    const file = new Blob([blob], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(file);

    const a = document.createElement("a");
    a.href = url;
    a.download = "reporte_seleccion.xlsx";
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      a.remove();
    }, 100);

    toast({
      title: "✅ Excel generado",
      description: "El reporte se descargó correctamente",
    });

  } catch (error) {
    console.error(error);
    toast({
      title: "Error descargando el Excel",
      description: "No se pudo generar el archivo",
      variant: "destructive",
    });
  }
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
              <h2 className="text-2xl font-bold text-gray-800">Selección y Seguimiento</h2>
                <p className="text-sm text-gray-500">Gestiona el flujo completo y detalles de los candidatos.</p>
                <p className="text-xs text-gray-400 mt-1">Token: {token ? `${String(token).slice(0, 8)}…` : 'no disponible'}</p>
            </div>
          </div>

          {/* Search Filters Section */}
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-4">
                    <Label className="mb-2 block text-sm font-semibold text-gray-700">Buscar Candidato</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input 
                            placeholder="Nombre, apellido o cédula..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="pl-9 bg-white" 
                        />
                    </div>
                </div>
                <div className="md:col-span-3">
                    <Label className="mb-2 block text-sm font-semibold text-gray-700">Estado del Proceso</Label>
                    <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                        <SelectTrigger className="bg-white">
                            <Filter className="w-4 h-4 mr-2 text-emerald-600" />
                            <SelectValue placeholder="Todos los estados" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="todos">Todos los estados</SelectItem>
                        {ALL_STATUS_OPTIONS_SELECCION.map(status => (
                            <SelectItem key={status} value={status}>{getEstadoInfo(status).label}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="md:col-span-3">
                    <Label className="mb-2 block text-sm font-semibold text-gray-700">Fecha de Registro</Label>
                    <Input 
                        type="date" 
                        value={dateFilter} 
                        onChange={(e) => setDateFilter(e.target.value)} 
                        className="bg-white"
                    />
                </div>
            </div>
            {/* Botón de descarga debajo de los filtros */}
            <div className="flex gap-2 mt-6">
              <Button onClick={exportToExcel} variant="outline" className="border-green-400 text-green-700 hover:bg-green-50">Descargar Excel</Button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3">Nombre</th>
                    <th className="px-6 py-3">Cédula</th>
                    <th className="px-6 py-3">Cargo</th>
                    <th className="px-6 py-3">Fecha Registro</th>
                    <th className="px-6 py-3">Estado</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="uppercase">
                  {currentItems.map((item) => {
                    const estadoInfo = getEstadoInfo(item.estado);
                    return (
                      <tr key={item.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{item.nombres} {item.apellidos}</td>
                        <td className="px-6 py-4 text-gray-600">{item.cedula}</td>
                        <td className="px-6 py-4 text-gray-600">{item.nombreCargo || 'No especificado'}</td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                            {item.fechaRegistro ? new Date(item.fechaRegistro).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4">
                          {estadoInfo.label ? (
                            <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold cursor-pointer", estadoInfo.color)} onClick={() => handleStatusChangeRequest(item, item.estado)}>
                              {estadoInfo.icon && <estadoInfo.icon className="w-3 h-3" />}
                              {estadoInfo.label}
                            </span>
                          ) : (
                            <span className="text-gray-500">Desconocido</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50" title="Ver Detalle Completo" onClick={() => openDetailModal(item)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                  )})}
                  {currentItems.length === 0 && (
                    <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                    <Search className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-lg font-medium text-gray-900">No se encontraron aspirantes</p>
                                <p className="text-sm text-gray-400">Intenta ajustar los filtros.</p>
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
                        {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedData.length)} de {sortedData.length}
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

      {/* Status Modal */}
      <StatusUpdateModal 
        isOpen={statusModalState.isOpen}
        onClose={() => setStatusModalState({ isOpen: false, aspirante: null, newStatus: null })}
        onSubmit={confirmStatusUpdate}
        currentStatus={statusModalState.aspirante?.estado}
        newStatus={statusModalState.newStatus}
        aspiranteName={statusModalState.aspirante ? `${statusModalState.aspirante.nombres} ${statusModalState.aspirante.apellidos}` : ''}
      />

      {/* New Comprehensive Detail Modal */}
      <AspiranteDetailModal 
        isOpen={detailModalState.isOpen}
        onClose={() => setDetailModalState({ isOpen: false, aspirante: null })}
        aspirante={detailModalState.aspirante}
        onSave={handleDetailSave}
      />
    </>
  );
};

export default SeleccionView;
