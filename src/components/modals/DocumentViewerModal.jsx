import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FolderOpen, FileText, Eye, Download, File, FileImage } from 'lucide-react';

const getFileIcon = (fileType) => {
  if (!fileType) return <File className="w-6 h-6 text-gray-500" />;
  if (fileType.startsWith('image/')) return <FileImage className="w-6 h-6 text-blue-500" />;
  if (fileType === 'application/pdf') return <FileText className="w-6 h-6 text-red-500" />;
  return <File className="w-6 h-6 text-gray-500" />;
};

const DocumentViewerModal = ({ isOpen, onClose, aspirante }) => {
  if (!aspirante) return null;

  const allDocs = { ...(aspirante.documentos || {}), ...(aspirante.documentosGestion || {}) };
  const docEntries = Object.entries(allDocs).filter(([, doc]) => doc && doc.url);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-emerald-600" /> Documentos de {aspirante.nombres} {aspirante.apellidos}
          </DialogTitle>
          <DialogDescription>
            Visualiza y descarga los archivos del aspirante.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto pr-2 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2"><FileText className="w-5 h-5" /> Archivos Adjuntos</h3>
            <div className="space-y-3">
              {docEntries.length > 0 ? (
                docEntries.map(([key, doc]) => (
                  <div key={key} className="bg-gray-50 p-3 rounded-lg border flex items-center justify-between transition-all hover:bg-gray-100">
                    <div className="flex items-center gap-3">
                      {getFileIcon(doc.tipo)}
                      <div>
                        <p className="text-sm font-semibold text-gray-800 capitalize">{key.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[250px]">{doc.nombre}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="ghost" size="icon" onClick={() => window.open(doc.url, '_blank')} className="text-blue-600 h-9 w-9"><Eye className="w-4 h-4" /></Button>
                      <a href={doc.url} download={doc.nombre}><Button type="button" variant="ghost" size="icon" className="text-emerald-600 h-9 w-9"><Download className="w-4 h-4" /></Button></a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">No hay documentos para mostrar.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewerModal;