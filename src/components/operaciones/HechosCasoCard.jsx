import React from 'react';
import { MessageSquare } from 'lucide-react';

const HechosCasoCard = ({
  formData,
  onChange,
}) => {
  return (
    <section className="mt-6 min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex min-w-0 items-start gap-3 border-b border-gray-100 pb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
          <MessageSquare className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h2 className="break-words text-lg font-bold text-gray-800">
            Hechos del caso
          </h2>

          <p className="mt-1 break-words text-sm text-gray-500">
            Describe claramente la falta y los hechos reportados.
          </p>
        </div>
      </div>

      <div className="mt-5 grid min-w-0 grid-cols-1 gap-5">
        <div className="min-w-0">
          <label
            htmlFor="tipoFalta"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Tipo de falta disciplinaria *
          </label>

          <select
            id="tipoFalta"
            name="tipoFalta"
            value={formData.tipoFalta}
            onChange={onChange}
            className="min-h-11 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">
              Selecciona el tipo de falta
            </option>

            <option value="INCUMPLIMIENTO_FUNCIONES">
              Incumplimiento de funciones
            </option>

            <option value="AUSENCIA_INJUSTIFICADA">
              Ausencia injustificada
            </option>

            <option value="RETARDO_INJUSTIFICADO">
              Retardo injustificado
            </option>

            <option value="DESOBEDIENCIA">
              Desobediencia de instrucciones
            </option>

            <option value="COMPORTAMIENTO_INADECUADO">
              Comportamiento inadecuado
            </option>

            <option value="INCUMPLIMIENTO_REGLAMENTO">
              Incumplimiento del reglamento
            </option>

            <option value="OTRO">
              Otro
            </option>
          </select>
        </div>

        <div className="min-w-0">
          <label
            htmlFor="relatoHechos"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Relato de los hechos *
          </label>

          <textarea
            id="relatoHechos"
            name="relatoHechos"
            value={formData.relatoHechos}
            onChange={onChange}
            rows={6}
            placeholder="Describe qué ocurrió, cuándo ocurrió, dónde ocurrió y quiénes estuvieron presentes."
            className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-800 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="min-w-0">
          <label
            htmlFor="observacionesAdicionales"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Observaciones gestor(a)
          </label>

          <textarea
            id="observacionesAdicionales"
            name="observacionesAdicionales"
            value={formData.observacionesAdicionales}
            onChange={onChange}
            rows={4}
            placeholder="Registra información adicional del gestor(a) que deba conocer Relaciones Laborales, si aplica."
            className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-800 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </div>
    </section>
  );
};

export default HechosCasoCard;