import React, { useRef } from 'react';
import {
  CheckCircle2,
  Download,
  Eye,
  Trash2,
  Upload,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

const formatearTamano = (bytes) => {
  if (!bytes) {
    return '';
  }

  const kilobytes = bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  return `${(kilobytes / 1024).toFixed(1)} MB`;
};

const EvidenciasProcesoCard = ({
  evidencias,
  onAgregarEvidencias,
  onEliminarEvidencia,
}) => {
  const inputRef = useRef(null);

  const abrirSelector = () => {
    inputRef.current?.click();
  };

  const handleArchivos = (event) => {
    const archivos = Array.from(
      event.target.files || []
    );

    if (archivos.length > 0) {
      onAgregarEvidencias(archivos);
    }

    event.target.value = '';
  };

  const obtenerUrlTemporal = (
    evidencia
  ) => {
    if (
      evidencia.esPersistida &&
      evidencia.urlArchivo
    ) {
      return {
        url: evidencia.urlArchivo,
        temporal: false,
      };
    }

    if (evidencia.archivo) {
      return {
        url: URL.createObjectURL(
          evidencia.archivo
        ),
        temporal: true,
      };
    }

    return {
      url: null,
      temporal: false,
    };
  };

  const verEvidencia = (
    evidencia
  ) => {
    const {
      url,
      temporal,
    } = obtenerUrlTemporal(
      evidencia
    );

    if (!url) {
      return;
    }

    window.open(
      url,
      '_blank',
      'noopener,noreferrer'
    );

    if (temporal) {
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 15000);
    }
  };

  const descargarEvidencia = (
    evidencia
  ) => {
    const {
      url,
      temporal,
    } = obtenerUrlTemporal(
      evidencia
    );

    if (!url) {
      return;
    }

    const enlace =
      document.createElement('a');

    enlace.href = url;
    enlace.download =
      evidencia.nombre ||
      'evidencia';

    enlace.target = '_blank';
    enlace.rel = 'noopener noreferrer';

    document.body.appendChild(
      enlace
    );

    enlace.click();
    enlace.remove();

    if (temporal) {
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 5000);
    }
  };

  return (
    <section className="mt-6 min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex min-w-0 items-start gap-3 border-b border-gray-100 pb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
          <Upload className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h2 className="break-words text-lg font-bold text-gray-800">
            Evidencias del proceso
          </h2>

          <p className="mt-1 break-words text-sm text-gray-500">
            Adjunta fotografías, actas, documentos o soportes relacionados con el caso.
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
        onChange={handleArchivos}
        className="hidden"
      />

      <button
        type="button"
        onClick={abrirSelector}
        className="mt-5 flex min-h-40 w-full min-w-0 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 px-4 py-8 text-center transition-colors hover:bg-emerald-50"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm">
          <Upload className="h-7 w-7" />
        </div>

        <p className="mt-4 font-bold text-gray-800">
          Seleccionar evidencias
        </p>

        <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-500">
          Puedes seleccionar uno o varios archivos PDF, Word, Excel o imágenes.
        </p>
      </button>

      {evidencias.length > 0 && (
        <div className="mt-5 space-y-3">
          <p className="text-sm font-semibold text-gray-700">
            Evidencias ({evidencias.length})
          </p>

          {evidencias.map(
            (evidencia) => (
              <article
                key={evidencia.id}
                className="flex min-w-0 flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="break-all text-sm font-semibold text-gray-800">
                    {evidencia.nombre}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    {evidencia.archivo?.size ? (
                      <span>
                        {formatearTamano(
                          evidencia.archivo
                            .size
                        )}
                      </span>
                    ) : null}

                    {evidencia.esPersistida ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Guardada
                      </span>
                    ) : (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                        Pendiente de guardar
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      evidencia
                        .esPersistida &&
                      !evidencia
                        .archivoDisponible
                    }
                    onClick={() =>
                      verEvidencia(
                        evidencia
                      )
                    }
                    className="min-h-10 px-3 text-blue-700"
                  >
                    <Eye className="h-4 w-4 sm:mr-2" />

                    <span className="hidden sm:inline">
                      Ver
                    </span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      evidencia
                        .esPersistida &&
                      !evidencia
                        .archivoDisponible
                    }
                    onClick={() =>
                      descargarEvidencia(
                        evidencia
                      )
                    }
                    className="min-h-10 px-3 text-emerald-700"
                  >
                    <Download className="h-4 w-4 sm:mr-2" />

                    <span className="hidden sm:inline">
                      Descargar
                    </span>
                  </Button>

                <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                    onEliminarEvidencia(
                    evidencia
                    )
                }
                className="col-span-2 min-h-10 border-red-200 px-3 text-red-700 hover:bg-red-50 hover:text-red-800 sm:col-span-1"
                >
                <Trash2 className="h-4 w-4 sm:mr-2" />

                <span className="hidden sm:inline">
                    Eliminar
                </span>
                </Button>               
                </div>
              </article>
            )
          )}
        </div>
      )}
    </section>
  );
};

export default EvidenciasProcesoCard;