import React, { useEffect, useMemo, useState } from "react";

const BANCOS = ["Banco Caja Social", "Vivienda"];
const RIESGOS = ["I", "II", "III", "IV", "V"];

const CONTRATOS = ["Obra Labor", "Indefinido", "Fijo", "Contrato de Aprendizaje"];
const PLAZOS_FIJO = ["2 meses", "4 meses", "6 meses", "8 meses", "12 meses"];

export default function RegistroModal({
  open,
  onClose,
  onSave,
  idRegistroPersonal,
}) {
  const [form, setForm] = useState({
    fechaIngreso: "",
    banco: "",
    riesgoLaboral: "",
    contrato: "",
    plazoFijo: "",
  });

  // Reset cada vez que se abra (para que no quede pegado lo anterior)
  useEffect(() => {
    if (open) {
      setForm({
        fechaIngreso: "",
        banco: "",
        riesgoLaboral: "",
        contrato: "",
        plazoFijo: "",
      });
    }
  }, [open]);

  const isFijo = form.contrato === "Fijo";

  const canSave = useMemo(() => {
    if (!form.fechaIngreso) return false;
    if (!form.banco) return false;
    if (!form.riesgoLaboral) return false;
    if (!form.contrato) return false;
    if (isFijo && !form.plazoFijo) return false;
    return true;
  }, [form, isFijo]);

  const onChange = (e) => {
    const { name, value } = e.target;

    // Si cambian contrato y ya no es Fijo, limpiamos el plazo
    if (name === "contrato") {
      setForm((p) => ({ ...p, contrato: value, plazoFijo: "" }));
      return;
    }

    setForm((p) => ({ ...p, [name]: value }));
  };

  const submit = (e) => {
    e.preventDefault();

    const payload = {
      idRegistroPersonal,
      ...form,
      plazoFijo: isFijo ? form.plazoFijo : null,
    };

    onSave?.(payload);
    onClose?.();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl mx-4 bg-white rounded-2xl shadow-xl border">
        <div className="p-5 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Registro</h2>
            <p className="text-sm text-gray-500">
              IdRegistroPersonal: <b>{idRegistroPersonal ?? "—"}</b>
            </p>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-2 rounded-lg border hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {/* Fecha de ingreso */}
          <div>
            <label className="block text-sm font-medium mb-1">Fecha de ingreso *</label>

            {/* ✅ Esto es calendario pero también se puede escribir manual en la mayoría de navegadores */}
            <input
              type="date"
              name="fechaIngreso"
              value={form.fechaIngreso}
              onChange={onChange}
              className="w-full border rounded-lg px-3 py-2"
            />

            <p className="text-xs text-gray-500 mt-1">
              Si quieres que sea solo “escrita” (sin calendario), me dices y lo dejamos como texto.
            </p>
          </div>

          {/* Banco */}
          <div>
            <label className="block text-sm font-medium mb-1">Banco *</label>
            <select
              name="banco"
              value={form.banco}
              onChange={onChange}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Seleccione...</option>
              {BANCOS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Riesgo Laboral */}
          <div>
            <label className="block text-sm font-medium mb-1">Riesgo Laboral *</label>
            <select
              name="riesgoLaboral"
              value={form.riesgoLaboral}
              onChange={onChange}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Seleccione...</option>
              {RIESGOS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Contrato */}
          <div>
            <label className="block text-sm font-medium mb-1">Contrato *</label>
            <select
              name="contrato"
              value={form.contrato}
              onChange={onChange}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Seleccione...</option>
              {CONTRATOS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Plazo si es Fijo */}
          {isFijo && (
            <div>
              <label className="block text-sm font-medium mb-1">Plazo (Fijo) *</label>
              <select
                name="plazoFijo"
                value={form.plazoFijo}
                onChange={onChange}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Seleccione...</option>
                {PLAZOS_FIJO.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-2 flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border hover:bg-gray-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!canSave}
              className={`px-4 py-2 rounded-lg text-white ${
                canSave ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
