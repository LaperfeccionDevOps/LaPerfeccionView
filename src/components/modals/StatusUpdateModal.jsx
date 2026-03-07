import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save } from 'lucide-react';
import { getEstadoInfo } from '@/utils/statusUtils';
import { cn } from '@/lib/utils';

const StatusUpdateModal = ({ isOpen, onClose, onSubmit, currentStatus, newStatus, aspiranteName }) => {
    const [details, setDetails] = useState({ motivo: '', descripcion: '', observaciones: '' });
    // Estado para habilitar/inabilitar el campo Motivo
    const [motivoEnabled, setMotivoEnabled] = useState(false);

    useEffect(() => {
        // Habilita el campo Motivo solo si el estado es 'Rechazado' o 'Contratado'
        if (newStatus === 'RECHAZADO' || newStatus === 'CONTRATADO') {
            setMotivoEnabled(true);
        } else {
            setMotivoEnabled(false);
        }
    }, [newStatus]);

    useEffect(() => {
        if (isOpen) {
            setDetails({ motivo: '', descripcion: '', observaciones: '' });
        }
    }, [isOpen]);

    const handleSubmit = () => {
        onSubmit(details);
        onClose();
    };

    if (!isOpen) return null;

    const { label, color } = getEstadoInfo(newStatus);
    const { label: currentLabel } = getEstadoInfo(currentStatus);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        Cambiar estado de <span className="font-bold">{currentLabel}</span> a <span className={cn("px-3 py-1 text-base font-bold rounded-full", color)}>{label}</span>
                    </DialogTitle>
                    <DialogDescription>
                        {aspiranteName ? `Añade detalles sobre el cambio de estado para ${aspiranteName}.` : 'Añade detalles sobre el cambio de estado.'} Esta información quedará registrada.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className={cn("space-y-2", !motivoEnabled && "hidden")}> 
                        <Label htmlFor="motivo">Motivo</Label>
                        <Input id="motivo" value={details.motivo} onChange={(e) => setDetails(prev => ({ ...prev, motivo: e.target.value }))} placeholder="Ej: Cumple requisitos" disabled={!motivoEnabled} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="descripcion">Descripción</Label>
                        <Textarea id="descripcion" value={details.descripcion} onChange={(e) => setDetails(prev => ({ ...prev, descripcion: e.target.value }))} placeholder="Ej: Revisión completada." />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="observaciones">Observaciones Adicionales</Label>
                        <Textarea id="observaciones" value={details.observaciones} onChange={(e) => setDetails(prev => ({ ...prev, observaciones: e.target.value }))} placeholder="Ej: Notas adicionales." />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit}><Save className="w-4 h-4 mr-2" /> Guardar Cambio</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default StatusUpdateModal;