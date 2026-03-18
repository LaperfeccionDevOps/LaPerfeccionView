import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EntrevistaRetiroPage() {
  const [searchParams] = useSearchParams();

  const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  const API_BASE_ENTREVISTA = API_BASE.replace(/\/api$/, "");

  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(null);

  const [respuestas, setRespuestas] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const preguntas = info?.Preguntas || [];

  const preguntaDescripcionRetiro =
    preguntas.find((p) => Number(p.Orden) === 1) || null;

  const preguntasObservacionesFinales = preguntas.filter(
    (p) => Number(p.Orden) >= 2 && Number(p.Orden) <= 9
  );

  const preguntasDotacion = preguntas.filter(
    (p) => Number(p.Orden) >= 10
  );

  const setRespuestaPregunta = (codigo, valor) => {
    setRespuestas((prev) => ({
      ...prev,
      [codigo]: valor,
    }));
  };

  useEffect(() => {
    const cargarFormulario = async () => {
      try {
        setLoading(true);
        setError("");

        if (!token) {
          setError("No se encontró el token de la entrevista.");
          return;
        }

        const res = await fetch(
          `${API_BASE_ENTREVISTA}/entrevista-retiro/formulario-por-token?token=${encodeURIComponent(token)}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!res.ok) {
          const msg = await res.text().catch(() => "");
          throw new Error(msg || "No se pudo cargar la entrevista.");
        }

        const data = await res.json();
        setInfo(data?.data || data || null);
      } catch (err) {
        console.error("Error cargando formulario de entrevista:", err);
        setError(err?.message || "No se pudo cargar la entrevista.");
      } finally {
        setLoading(false);
      }
    };

    cargarFormulario();
  }, [API_BASE_ENTREVISTA, token]);

  const handleEnviarEntrevista = async () => {
    try {
      setMensaje("");

      if (!info) {
        setMensaje("No se encontró información de la entrevista.");
        return;
      }

      const preguntasObligatorias = preguntas.filter(
        (p) => p.EsObligatoria === true
      );

      for (const p of preguntasObligatorias) {
        const valor = (respuestas[p.CodigoPregunta] || "").toString().trim();
        if (!valor) {
          setMensaje(`Debe responder la pregunta: ${p.TextoPregunta}`);
          return;
        }
      }

      const payload = {
        token,
        numero_identificacion: String(info?.NumeroIdentificacion || "").trim(),
        respuestas: preguntas.map((p) => ({
          id_pregunta: Number(p.IdPreguntaEntrevistaRetiro),
          respuesta: (respuestas[p.CodigoPregunta] || "").toString().trim(),
        })),
      };

      setGuardando(true);

      const res = await fetch(`${API_BASE_ENTREVISTA}/entrevista-retiro/guardar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "No se pudo guardar la entrevista.");
      }

      setMensaje("Entrevista enviada correctamente.");

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error("Error guardando entrevista:", err);
      setMensaje(err?.message || "No se pudo guardar la entrevista.");
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-slate-200 p-8">
          <h1 className="text-2xl font-bold text-slate-800">
            Entrevista de retiro
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Cargando información del formulario...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-red-200 p-8">
          <h1 className="text-2xl font-bold text-red-700">
            Entrevista de retiro
          </h1>
          <p className="mt-3 text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto w-full max-w-4xl rounded-2xl bg-white shadow-xl border-t-4 border-emerald-600 p-8">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-bold text-slate-800 leading-tight">
            Entrevista de Retiro Aseos La Perfección S.A.S
          </h1>
        </div>

        {/* Datos generales */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden mb-6">
          <div className="bg-emerald-600 px-5 py-3">
            <h2 className="text-white font-semibold text-lg">Datos Generales</h2>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-slate-600">Nombre</Label>
              <Input
                value={info?.NombreCompleto || ""}
                readOnly
                className="bg-slate-50"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-600">Documento de Identidad</Label>
              <Input
                value={info?.NumeroIdentificacion || ""}
                readOnly
                className="bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* Descripción del retiro */}
        {preguntaDescripcionRetiro && (
          <div className="rounded-2xl border border-slate-200 overflow-hidden mb-6">
            <div className="bg-emerald-600 px-5 py-3">
              <h2 className="text-white font-semibold text-lg">Descripción del Retiro</h2>
            </div>

            <div className="p-5">
              <Label className="text-base font-semibold text-slate-800">
                {preguntaDescripcionRetiro.TextoPregunta}
                {preguntaDescripcionRetiro.EsObligatoria ? " *" : ""}
              </Label>

              <p className="mt-2 text-sm text-slate-500">
                Escriba detalladamente todos los comentarios que tenga sobre el punto anterior.
              </p>

              <textarea
                className="mt-4 w-full min-h-[140px] rounded-xl border border-slate-200 p-3 text-sm outline-none bg-white"
                placeholder="Escriba aquí..."
                value={respuestas[preguntaDescripcionRetiro.CodigoPregunta] || ""}
                onChange={(e) =>
                  setRespuestaPregunta(
                    preguntaDescripcionRetiro.CodigoPregunta,
                    e.target.value
                  )
                }
              />
            </div>
          </div>
        )}

        {/* Observaciones finales */}
        {preguntasObservacionesFinales.length > 0 && (
          <div className="rounded-2xl border border-slate-200 overflow-hidden mb-6">
            <div className="bg-emerald-600 px-5 py-3">
              <h2 className="text-white font-semibold text-lg">Observaciones Finales</h2>
            </div>

            <div className="p-5 space-y-6">
              {preguntasObservacionesFinales.map((pregunta) => (
                <div
                  key={pregunta.IdPreguntaEntrevistaRetiro}
                  className="rounded-xl border border-slate-100 bg-white p-4"
                >
                  <p className="text-base font-medium text-slate-800">
                    {pregunta.TextoPregunta}
                    {pregunta.EsObligatoria ? " *" : ""}
                  </p>

                  {pregunta.TipoRespuesta === "SI_NO" && (
                    <div className="mt-4 space-y-3">
                      <label className="flex items-center gap-3 text-sm text-slate-700">
                        <input
                          type="radio"
                          name={pregunta.CodigoPregunta}
                          value="SI"
                          checked={respuestas[pregunta.CodigoPregunta] === "SI"}
                          onChange={(e) =>
                            setRespuestaPregunta(pregunta.CodigoPregunta, e.target.value)
                          }
                        />
                        SI
                      </label>

                      <label className="flex items-center gap-3 text-sm text-slate-700">
                        <input
                          type="radio"
                          name={pregunta.CodigoPregunta}
                          value="NO"
                          checked={respuestas[pregunta.CodigoPregunta] === "NO"}
                          onChange={(e) =>
                            setRespuestaPregunta(pregunta.CodigoPregunta, e.target.value)
                          }
                        />
                        NO
                      </label>
                    </div>
                  )}

                  {pregunta.TipoRespuesta === "OPCION" && (
                    <div className="mt-4 space-y-3">
                      {pregunta.CodigoPregunta === "P04" && (
                        <>
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="radio"
                              name={pregunta.CodigoPregunta}
                              value="BUENO"
                              checked={respuestas[pregunta.CodigoPregunta] === "BUENO"}
                              onChange={(e) =>
                                setRespuestaPregunta(pregunta.CodigoPregunta, e.target.value)
                              }
                            />
                            Bueno
                          </label>

                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="radio"
                              name={pregunta.CodigoPregunta}
                              value="REGULAR"
                              checked={respuestas[pregunta.CodigoPregunta] === "REGULAR"}
                              onChange={(e) =>
                                setRespuestaPregunta(pregunta.CodigoPregunta, e.target.value)
                              }
                            />
                            Regular
                          </label>

                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="radio"
                              name={pregunta.CodigoPregunta}
                              value="MALO"
                              checked={respuestas[pregunta.CodigoPregunta] === "MALO"}
                              onChange={(e) =>
                                setRespuestaPregunta(pregunta.CodigoPregunta, e.target.value)
                              }
                            />
                            Malo
                          </label>
                        </>
                      )}

                      {pregunta.CodigoPregunta === "P07" && (
                        <>
                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="radio"
                              name={pregunta.CodigoPregunta}
                              value="BUENAS"
                              checked={respuestas[pregunta.CodigoPregunta] === "BUENAS"}
                              onChange={(e) =>
                                setRespuestaPregunta(pregunta.CodigoPregunta, e.target.value)
                              }
                            />
                            Buenas
                          </label>

                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="radio"
                              name={pregunta.CodigoPregunta}
                              value="REGULARES"
                              checked={respuestas[pregunta.CodigoPregunta] === "REGULARES"}
                              onChange={(e) =>
                                setRespuestaPregunta(pregunta.CodigoPregunta, e.target.value)
                              }
                            />
                            Regulares
                          </label>

                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="radio"
                              name={pregunta.CodigoPregunta}
                              value="MALAS"
                              checked={respuestas[pregunta.CodigoPregunta] === "MALAS"}
                              onChange={(e) =>
                                setRespuestaPregunta(pregunta.CodigoPregunta, e.target.value)
                              }
                            />
                            Malas
                          </label>
                        </>
                      )}
                    </div>
                  )}

                  {pregunta.TipoRespuesta === "TEXTO" && (
                    <textarea
                      className="mt-4 w-full min-h-[120px] rounded-xl border border-slate-200 p-3 text-sm outline-none bg-white"
                      placeholder="Escriba aquí..."
                      value={respuestas[pregunta.CodigoPregunta] || ""}
                      onChange={(e) =>
                        setRespuestaPregunta(pregunta.CodigoPregunta, e.target.value)
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dotación */}
        {preguntasDotacion.length > 0 && (
          <div className="rounded-2xl border border-slate-200 overflow-hidden mb-6">
            <div className="bg-emerald-600 px-5 py-3">
              <h2 className="text-white font-semibold text-lg">Entrega de Dotación</h2>
            </div>

            <div className="p-5 space-y-6">
              {preguntasDotacion.map((pregunta) => (
                <div
                  key={pregunta.IdPreguntaEntrevistaRetiro}
                  className="rounded-xl border border-slate-100 bg-white p-4"
                >
                  <p className="text-base font-medium text-slate-800">
                    {pregunta.TextoPregunta}
                    {pregunta.EsObligatoria ? " *" : ""}
                  </p>

                  {pregunta.TipoRespuesta === "SI_NO" && (
                    <div className="mt-4 space-y-3">
                      <label className="flex items-center gap-3 text-sm text-slate-700">
                        <input
                          type="radio"
                          name={pregunta.CodigoPregunta}
                          value="SI"
                          checked={respuestas[pregunta.CodigoPregunta] === "SI"}
                          onChange={(e) =>
                            setRespuestaPregunta(pregunta.CodigoPregunta, e.target.value)
                          }
                        />
                        SI
                      </label>

                      <label className="flex items-center gap-3 text-sm text-slate-700">
                        <input
                          type="radio"
                          name={pregunta.CodigoPregunta}
                          value="NO"
                          checked={respuestas[pregunta.CodigoPregunta] === "NO"}
                          onChange={(e) =>
                            setRespuestaPregunta(pregunta.CodigoPregunta, e.target.value)
                          }
                        />
                        NO
                      </label>
                    </div>
                  )}

                  {pregunta.TipoRespuesta === "TEXTO" && (
                    <Input
                      className="mt-4 bg-white"
                      placeholder="Escriba aquí..."
                      value={respuestas[pregunta.CodigoPregunta] || ""}
                      onChange={(e) =>
                        setRespuestaPregunta(pregunta.CodigoPregunta, e.target.value)
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {mensaje ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {mensaje}
            </div>
          ) : null}

          <div className="flex gap-3 flex-wrap">
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleEnviarEntrevista}
              disabled={guardando}
            >
              {guardando ? "Enviando..." : "Enviar entrevista"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="border-gray-200"
              onClick={() => window.location.reload()}
              disabled={guardando}
            >
              Recargar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}