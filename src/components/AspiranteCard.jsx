import React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Briefcase, Calendar, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getEstadoInfo } from '@/utils/statusUtils';

const AspiranteCard = ({ aspirante }) => {
  const { label, color } = getEstadoInfo(aspirante.estado);
  const documentsCount = aspirante.documentos ? Object.keys(aspirante.documentos).length : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">{aspirante.nombres} {aspirante.apellidos}</h3>
            <p className="text-sm text-gray-500">CC: {aspirante.cedula}</p>
          </div>
        </div>
        <span className={cn("px-3 py-1 rounded-full text-xs font-semibold border", color)}>
          {label}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        {aspirante.email && (
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="w-4 h-4 text-emerald-600" />
            <span className="truncate">{aspirante.email}</span>
          </div>
        )}
        
        {aspirante.telefono && (
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>{aspirante.telefono}</span>
          </div>
        )}

        {aspirante.cargo && (
          <div className="flex items-center gap-2 text-gray-600">
            <Briefcase className="w-4 h-4 text-emerald-600" />
            <span>{aspirante.cargo}</span>
          </div>
        )}

        {aspirante.fechaRegistro && (
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>{new Date(aspirante.fechaRegistro).toLocaleDateString()}</span>
          </div>
        )}

        {documentsCount > 0 && (
          <div className="flex items-center gap-2 text-gray-600">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>{documentsCount} documento(s)</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AspiranteCard;