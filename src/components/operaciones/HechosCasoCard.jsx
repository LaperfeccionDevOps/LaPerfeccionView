import React from 'react';
import { MessageSquare } from 'lucide-react';


const HechosCasoCard = ({
  formData,
  onChange,
}) => {
  return (
    <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50">
          <MessageSquare
            size={24}
            className="text-orange-600"
          />
        </div>

        <div className="min-w-0">
          <h2 className="break-words text-lg font-bold text-gray-800">
            Hechos del caso
          </h2>

          <p className="mt-1 break-words text-sm text-gray-500">
            Registra el tipo de gestión, el motivo de la citación y los
            hechos reportados.
          </p>
        </div>
      </div>

      <div className="mt-5 grid min-w-0 grid-cols-1 gap-5">
        {/* ===================================================== */}
        {/* TIPO DE GESTIÓN */}
        {/* ===================================================== */}

        <div className="min-w-0">
          <label
            htmlFor="tipoGestion"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Tipo de gestión *
          </label>

          <select
            id="tipoGestion"
            name="tipoGestion"
            value={formData.tipoGestion || ''}
            onChange={onChange}
            className="min-h-11 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">
              Selecciona el tipo de gestión
            </option>

            <option value="NO_ATENCION">
              No atención
            </option>

            <option value="PERIODO_PRUEBA">
              Período de prueba
            </option>

            <option value="PROCESO_DISCIPLINARIO">
              Proceso disciplinario
            </option>

            <option value="RENUNCIAS">
              Renuncias
            </option>

            <option value="REUNIONES_CAPACITACIONES">
              Reuniones y capacitaciones
            </option>
          </select>
        </div>

        {/* ===================================================== */}
        {/* MOTIVO DE CITACIÓN / PRESUNTA FALTA */}
        {/* ===================================================== */}

        <div className="min-w-0">
          <label
            htmlFor="tipoFalta"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Motivo de citación / presunta falta *
          </label>

          <select
            id="tipoFalta"
            name="tipoFalta"
            value={formData.tipoFalta || ''}
            onChange={onChange}
            className="min-h-11 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">
              Selecciona el motivo de citación / presunta falta
            </option>

            <option value="ACCIDENTE_LABORAL_SST">
              Accidente laboral (SST)
            </option>

            <option value="ACTOS_INSEGUROS_SST">
              Actos inseguros (SST)
            </option>

            <option value="ATENCION_LINEA_VERDE">
              Atención línea verde
            </option>

            <option value="AUSENCIA_INJUSTIFICADA">
              Ausencia injustificada
            </option>

            <option value="CLIMA_LABORAL">
              Clima laboral
            </option>

            <option value="DANOS_BIEN_AJENO_AFECTACION_CLIENTE">
              Daños en bien ajeno - afectación al cliente
            </option>

            <option value="INCUMPLIMIENTO_FUNCIONES">
              Incumplimiento de funciones
            </option>

            <option value="INCUMPLIMIENTO_NORMAS">
              Incumplimiento de normas
            </option>

            <option value="NO_USAR_EPP_LABOR">
              No usar EPP para la labor
            </option>

            <option value="OMISION_REPORTE_CONFLICTO_INTERES">
              Omisión reporte conflicto de interés
            </option>

            <option value="PERDIDA_OBJETOS_CLIENTE_COMPANEROS">
              Pérdida de objetos cliente/compañeros
            </option>

            <option value="PERIODO_PRUEBA">
              Período de prueba
            </option>

            <option value="RETARDOS_INJUSTIFICADOS">
              Retardos injustificados
            </option>
          </select>
        </div>

        {/* ===================================================== */}
        {/* RELATO DE LOS HECHOS */}
        {/* ===================================================== */}

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
            value={formData.relatoHechos || ''}
            onChange={onChange}
            rows={6}
            placeholder="Describe qué ocurrió, cuándo ocurrió, dónde ocurrió y quiénes estuvieron presentes."
            className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-800 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        {/* ===================================================== */}
        {/* OBSERVACIONES GESTOR(A) */}
        {/* ===================================================== */}

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
            value={formData.observacionesAdicionales || ''}
            onChange={onChange}
            rows={4}
            placeholder="Registra información adicional del gestor(a) que deba conocer Relaciones Laborales, si aplica."
            className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-800 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        {/* ===================================================== */}
        {/* NIVEL DE DESEMPEÑO DEL COLABORADOR */}
        {/* ===================================================== */}

        <div className="min-w-0 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 sm:p-5">
          <div className="min-w-0">
            <label
              htmlFor="desempenoContinua"
              className="block text-base font-bold text-gray-800"
            >
              Selecciona el nivel de desempeño del colaborador *
            </label>

            <p className="mt-1 text-sm leading-relaxed text-gray-500">
              Selecciona la valoración que corresponde al desempeño del
              colaborador de acuerdo con la gestión realizada por Operaciones.
            </p>
          </div>

          <div className="mt-4">
            <select
              id="desempenoContinua"
              name="desempenoContinua"
              value={formData.desempenoContinua || ''}
              onChange={onChange}
              required
              className="min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">
                Selecciona el nivel de desempeño
              </option>

              <option value="EXCELENTE">
                Excelente
              </option>

              <option value="BUENO">
                Bueno
              </option>

              <option value="REGULAR">
                Regular
              </option>

              <option value="DEFICIENTE">
                Deficiente
              </option>
            </select>
          </div>

          <div className="mt-5 min-w-0">
            <label
              htmlFor="justificacionDesempeno"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              ¿Por qué? *
            </label>

            <textarea
              id="justificacionDesempeno"
              name="justificacionDesempeno"
              value={
                formData.justificacionDesempeno || ''
              }
              onChange={onChange}
              rows={4}
              required
              placeholder="Explica el motivo del nivel de desempeño seleccionado."
              className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-800 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />

            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              La justificación es obligatoria para cualquier nivel de
              desempeño seleccionado.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};


export default HechosCasoCard;