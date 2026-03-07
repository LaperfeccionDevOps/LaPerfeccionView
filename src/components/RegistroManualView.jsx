import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Briefcase, ArrowLeft, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { useAspirantes } from "@/hooks/useAspirantes";

const RegistroManualView = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { aspirantes, loadAspirantes, updateAspirante } = useAspirantes();

  useEffect(() => {
    if (aspirantes.length === 0) loadAspirantes();
  }, [aspirantes.length, loadAspirantes]);

  const aspirante = useMemo(() => {
    return aspirantes.find((a) => String(a.id) === String(id));
  }, [aspirantes, id]);

  const [data, setData] = useState({
    fechaRegistro: new Date().toISOString().split("T")[0],
    tipoContrato: "",
    fechaInicio: "",
    salario: "",
    observaciones: "",
  });

  useEffect(() => {
    if (!aspirante) return;

    const m = aspirante.contratacionManual;
    if (m) {
      setData({
        fechaRegistro: m.fechaRegistro || new Date().toISOString().split("T")[0],
        tipoContrato: m.tipoContrato || "",
        fechaInicio: m.fechaInicio || "",
        salario: m.salario || "",
        observaciones: m.observaciones || "",
      });
    }
  }, [aspirante]);

  const handleSave = () => {
    if (!aspirante) return;

    const updatedAspirante = {
      ...aspirante,
      contratacionManual: {
        ...data,
        actualizadoEn: new Date().toISOString(),
      },
    };

    updateAspirante(updatedAspirante);

    toast({
      title: "💾 Registro manual guardado",
      description: "Se guardó la información manual de contratación.",
    });

    navigate(-1); // vuelve a la tabla
  };

  if (!aspirante) {
    return (
      <div className="p-8">
        <div className="text-gray-600">Cargando aspirante...</div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 md:p-8 space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-emerald-600">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Registro manual</h1>
              <p className="text-sm text-gray-500">
                {aspirante.nombres} {aspirante.apellidos} · {aspirante.cargo}
              </p>
            </div>
          </div>

          <Button variant="outline" className="rounded-xl" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label>Fecha de registro</Label>
            <Input
              type="date"
              value={data.fechaRegistro}
              onChange={(e) => setData((p) => ({ ...p, fechaRegistro: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de contrato</Label>
            <Input
              value={data.tipoContrato}
              onChange={(e) => setData((p) => ({ ...p, tipoContrato: e.target.value }))}
              placeholder="Ej: Obra/Labor, Fijo, Indefinido..."
            />
          </div>

          <div className="space-y-2">
            <Label>Fecha de inicio</Label>
            <Input
              type="date"
              value={data.fechaInicio}
              onChange={(e) => setData((p) => ({ ...p, fechaInicio: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Salario</Label>
            <Input
              value={data.salario}
              onChange={(e) => setData((p) => ({ ...p, salario: e.target.value }))}
              placeholder="Ej: 1.300.000"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Observaciones</Label>
            <Textarea
              value={data.observaciones}
              onChange={(e) => setData((p) => ({ ...p, observaciones: e.target.value }))}
              placeholder="Notas internas de contratación..."
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate(-1)} className="rounded-xl">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2">
            <Save className="w-4 h-4" />
            Guardar
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default RegistroManualView;
