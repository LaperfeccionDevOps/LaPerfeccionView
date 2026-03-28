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

  const [loading, setLoading] = useState(!!token);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(null);

  const [respuestas, setRespuestas] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // ✅ flujo QR general
  const [numeroIdentificacionQr, setNumeroIdentificacionQr] = useState("");
  const [nombreTrabajadorQr, setNombreTrabajadorQr] = useState("");
  const [idRegistroPersonalQr, setIdRegistroPersonalQr] = useState(null);
  const [idRetiroLaboralQr, setIdRetiroLaboralQr] = useState(null);
  const [mensajeValidacionQr, setMensajeValidacionQr] = useState("");
  const [validadoQr, setValidadoQr] = useState(false);
  const [loadingValidacionQr, setLoadingValidacionQr] = useState(false);

  const preguntas = info?.Preguntas || [];

  const preguntaDescripcionRetiro =
    preguntas.find((p) => Number(p.Orden) === 1) || null;

  const preguntasObservacionesFinales = preguntas.filter(
    (p) => Number(p.Orden) >= 2 && Number(p.Orden) <= 9
  );

  const preguntasDotacion = preguntas.filter((p) => Number(p.Orden) >= 10);


  const setRespuestaPregunta = (codigo, valor) => {
  setRespuestas((prev) => ({
    ...prev,
    [codigo]: valor,
  }));
};

const formatearNombreBonito = (texto) => {
  return (texto || "")
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(" ");
};

  const cargarFormularioPorToken = async () => {
    try {
      setLoading(true);
      setError("");
      setMensaje("");

      const res = await fetch(
        `${API_BASE_ENTREVISTA}/entrevista-retiro/formulario-por-token?token=${encodeURIComponent(
          token
        )}`,
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
      const payload = data?.data || data || null;

      setInfo(payload);
      setNumeroIdentificacionQr(
        String(payload?.NumeroIdentificacion || "").trim()
      );
      setNombreTrabajadorQr(payload?.NombreCompleto || "");
      setIdRegistroPersonalQr(payload?.IdRegistroPersonal || null);
      setIdRetiroLaboralQr(payload?.IdRetiroLaboral || null);
      setValidadoQr(true);
    } catch (err) {
      console.error("Error cargando formulario de entrevista:", err);
      setError(err?.message || "No se pudo cargar la entrevista.");
    } finally {
      setLoading(false);
    }
  };

  const cargarPreguntasQrGeneral = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${API_BASE_ENTREVISTA}/entrevista-retiro/preguntas`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "No se pudieron cargar las preguntas.");
      }

      const data = await res.json();
      const preguntasBackend = data?.data || [];

      setInfo((prev) => ({
        ...(prev || {}),
        IdRegistroPersonal: idRegistroPersonalQr,
        IdRetiroLaboral: idRetiroLaboralQr,
        NumeroIdentificacion: numeroIdentificacionQr,
        NombreCompleto: nombreTrabajadorQr,
        Preguntas: preguntasBackend,
      }));
    } catch (err) {
      console.error("Error cargando preguntas QR general:", err);
      setError(err?.message || "No se pudieron cargar las preguntas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      cargarFormularioPorToken();
    } else {
      setLoading(false);
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE_ENTREVISTA, token]);

  const validarIdentificacionEntrevistaQr = async () => {
    try {
      setLoadingValidacionQr(true);
      setMensajeValidacionQr("");
      setMensaje("");
      setError("");
      setValidadoQr(false);
      setNombreTrabajadorQr("");
      setIdRegistroPersonalQr(null);
      setIdRetiroLaboralQr(null);
      setInfo(null);
      setRespuestas({});

      const numero = (numeroIdentificacionQr || "").trim();

      if (!numero) {
        setMensajeValidacionQr("Debe ingresar el número de identificación.");
        return;
      }

      const res = await fetch(
        `${API_BASE_ENTREVISTA}/entrevista-retiro/validar-identificacion`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            numero_identificacion: numero,
          }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "No se pudo validar la identificación."
        );
      }

      const infoBackend = data?.data || {};

      setNombreTrabajadorQr(infoBackend?.NombreCompleto || "");
      setIdRegistroPersonalQr(infoBackend?.IdRegistroPersonal || null);
      setIdRetiroLaboralQr(infoBackend?.IdRetiroLaboral || null);
      setValidadoQr(true);
      setMensajeValidacionQr(
        "Identificación validada correctamente. Verifique que el nombre corresponda a sus datos antes de continuar."
      );

      await cargarPreguntasQrGeneral();
    } catch (errorValidacion) {
      setValidadoQr(false);
      setNombreTrabajadorQr("");
      setIdRegistroPersonalQr(null);
      setIdRetiroLaboralQr(null);
      setMensajeValidacionQr(
        errorValidacion?.message || "Error al validar la identificación."
      );
    } finally {
      setLoadingValidacionQr(false);
    }
  };

  const handleEnviarEntrevista = async () => {
    try {
      setMensaje("");

      if (!info) {
        setMensaje("No se encontró información de la entrevista.");
        return;
      }

      const numeroIdentificacionEnviar = token
        ? String(info?.NumeroIdentificacion || "").trim()
        : String(numeroIdentificacionQr || "").trim();

      if (!numeroIdentificacionEnviar) {
        setMensaje("No se encontró el número de identificación.");
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
        numero_identificacion: numeroIdentificacionEnviar,
        respuestas: preguntas.map((p) => ({
          id_pregunta: Number(p.IdPreguntaEntrevistaRetiro),
          respuesta: (respuestas[p.CodigoPregunta] || "").toString().trim(),
        })),
      };

      if (token) {
        payload.token = token;
      }

      setGuardando(true);

      const res = await fetch(
        `${API_BASE_ENTREVISTA}/entrevista-retiro/guardar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.detail || data?.message || "No se pudo guardar la entrevista."
        );
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

  const mostrarFormulario = token || validadoQr;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto w-full max-w-4xl rounded-2xl bg-white shadow-xl border-t-4 border-emerald-600 p-8">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-bold text-slate-800 leading-tight">
            Entrevista de Retiro Aseos La Perfección S.A.S
          </h1>
        </div>

        {/* ✅ bloque inicial QR general */}
        {!token && (
          <div className="rounded-2xl border border-slate-200 overflow-hidden mb-6">
            <div className="bg-emerald-600 px-5 py-3">
              <h2 className="text-white font-semibold text-lg">
                Validación de Identidad
              </h2>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <Label className="text-xs text-slate-600">
                  Número de identificación
                </Label>
                <Input
                  value={numeroIdentificacionQr}
                  onChange={(e) => setNumeroIdentificacionQr(e.target.value)}
                  placeholder="Ingrese su número de identificación"
                  className="mt-2"
                  disabled={loadingValidacionQr || guardando}
                />
              </div>

              <div className="flex gap-3 flex-wrap">
                <Button
                  type="button"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={validarIdentificacionEntrevistaQr}
                  disabled={loadingValidacionQr || guardando}
                >
                  {loadingValidacionQr ? "Validando..." : "Validar identidad"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="border-gray-200"
                  onClick={() => {
                    setNumeroIdentificacionQr("");
                    setNombreTrabajadorQr("");
                    setIdRegistroPersonalQr(null);
                    setIdRetiroLaboralQr(null);
                    setMensajeValidacionQr("");
                    setValidadoQr(false);
                    setInfo(null);
                    setRespuestas({});
                  }}
                  disabled={loadingValidacionQr || guardando}
                >
                  Limpiar
                </Button>
              </div>

             {mensajeValidacionQr ? (
  <div
    className={`rounded-2xl border px-5 py-4 shadow-sm ${
      validadoQr
        ? "border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-800"
        : "border-red-300 bg-gradient-to-r from-red-50 to-rose-50 text-red-700"
    }`}
  >
    <div className="flex items-start gap-3">
      <div
        className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${
          validadoQr
            ? "bg-emerald-600 text-white"
            : "bg-red-600 text-white"
        }`}
      >
        {validadoQr ? "✓" : "!"}
      </div>

      <div className="flex-1">
        <p className="text-sm font-bold uppercase tracking-wide">
          {validadoQr ? "Identidad validada" : "Validación no exitosa"}
        </p>
        <p className="mt-1 text-sm leading-6">
          {validadoQr
            ? "Antes de continuar con la entrevista, confirme cuidadosamente que el nombre mostrado corresponde exactamente a sus datos personales."
            : mensajeValidacionQr}
        </p>
      </div>
    </div>
  </div>
) : null}

{validadoQr ? (
  <div className="rounded-2xl border border-emerald-200 bg-white shadow-sm overflow-hidden">
    <div className="bg-emerald-600 px-5 py-3">
      <p className="text-white text-sm font-semibold tracking-wide uppercase">
        Confirmación del trabajador
      </p>
    </div>

    <div className="p-5 bg-gradient-to-br from-white to-emerald-50">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold">
        Nombre validado
      </p>

     <p className="mt-2 text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
      {formatearNombreBonito(nombreTrabajadorQr || "Sin nombre")}
    </p>
      <div className="mt-4 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Documento:
        </span>
        <span className="ml-2 text-base font-bold text-emerald-900">
          {numeroIdentificacionQr || ""}
        </span>
      </div>

      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm font-medium text-amber-800 leading-6">
          Si el nombre mostrado no corresponde a sus datos, no continúe con el diligenciamiento y repórtelo de inmediato al personal encargado.
        </p>
      </div>
    </div>
  </div>
) : null}
            </div>
          </div>
        )}

        {mostrarFormulario ? (
          <>
            {/* Datos generales */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden mb-6">
              <div className="bg-emerald-600 px-5 py-3">
                <h2 className="text-white font-semibold text-lg">
                  Datos Generales
                </h2>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-600">Nombre</Label>
                  <Input
                    value={
                      token
                        ? info?.NombreCompleto || ""
                        : nombreTrabajadorQr || info?.NombreCompleto || ""
                    }
                    readOnly
                    className="bg-slate-50"
                  />
                </div>

                <div>
                  <Label className="text-xs text-slate-600">
                    Documento de Identidad
                  </Label>
                  <Input
                    value={
                      token
                        ? info?.NumeroIdentificacion || ""
                        : numeroIdentificacionQr || info?.NumeroIdentificacion || ""
                    }
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
                  <h2 className="text-white font-semibold text-lg">
                    Descripción del Retiro
                  </h2>
                </div>

                <div className="p-5">
                  <Label className="text-base font-semibold text-slate-800">
                    {preguntaDescripcionRetiro.TextoPregunta}
                    {preguntaDescripcionRetiro.EsObligatoria ? " *" : ""}
                  </Label>

                  <p className="mt-2 text-sm text-slate-500">
                    Escriba detalladamente todos los comentarios que tenga sobre
                    el punto anterior.
                  </p>

                  <textarea
                    className="mt-4 w-full min-h-[140px] rounded-xl border border-slate-200 p-3 text-sm outline-none bg-white"
                    placeholder="Escriba aquí..."
                    value={
                      respuestas[preguntaDescripcionRetiro.CodigoPregunta] || ""
                    }
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
                  <h2 className="text-white font-semibold text-lg">
                    Observaciones Finales
                  </h2>
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
                              checked={
                                respuestas[pregunta.CodigoPregunta] === "SI"
                              }
                              onChange={(e) =>
                                setRespuestaPregunta(
                                  pregunta.CodigoPregunta,
                                  e.target.value
                                )
                              }
                            />
                            SI
                          </label>

                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="radio"
                              name={pregunta.CodigoPregunta}
                              value="NO"
                              checked={
                                respuestas[pregunta.CodigoPregunta] === "NO"
                              }
                              onChange={(e) =>
                                setRespuestaPregunta(
                                  pregunta.CodigoPregunta,
                                  e.target.value
                                )
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
                                  checked={
                                    respuestas[pregunta.CodigoPregunta] ===
                                    "BUENO"
                                  }
                                  onChange={(e) =>
                                    setRespuestaPregunta(
                                      pregunta.CodigoPregunta,
                                      e.target.value
                                    )
                                  }
                                />
                                Bueno
                              </label>

                              <label className="flex items-center gap-3 text-sm text-slate-700">
                                <input
                                  type="radio"
                                  name={pregunta.CodigoPregunta}
                                  value="REGULAR"
                                  checked={
                                    respuestas[pregunta.CodigoPregunta] ===
                                    "REGULAR"
                                  }
                                  onChange={(e) =>
                                    setRespuestaPregunta(
                                      pregunta.CodigoPregunta,
                                      e.target.value
                                    )
                                  }
                                />
                                Regular
                              </label>

                              <label className="flex items-center gap-3 text-sm text-slate-700">
                                <input
                                  type="radio"
                                  name={pregunta.CodigoPregunta}
                                  value="MALO"
                                  checked={
                                    respuestas[pregunta.CodigoPregunta] === "MALO"
                                  }
                                  onChange={(e) =>
                                    setRespuestaPregunta(
                                      pregunta.CodigoPregunta,
                                      e.target.value
                                    )
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
                                  checked={
                                    respuestas[pregunta.CodigoPregunta] ===
                                    "BUENAS"
                                  }
                                  onChange={(e) =>
                                    setRespuestaPregunta(
                                      pregunta.CodigoPregunta,
                                      e.target.value
                                    )
                                  }
                                />
                                Buenas
                              </label>

                              <label className="flex items-center gap-3 text-sm text-slate-700">
                                <input
                                  type="radio"
                                  name={pregunta.CodigoPregunta}
                                  value="REGULARES"
                                  checked={
                                    respuestas[pregunta.CodigoPregunta] ===
                                    "REGULARES"
                                  }
                                  onChange={(e) =>
                                    setRespuestaPregunta(
                                      pregunta.CodigoPregunta,
                                      e.target.value
                                    )
                                  }
                                />
                                Regulares
                              </label>

                              <label className="flex items-center gap-3 text-sm text-slate-700">
                                <input
                                  type="radio"
                                  name={pregunta.CodigoPregunta}
                                  value="MALAS"
                                  checked={
                                    respuestas[pregunta.CodigoPregunta] ===
                                    "MALAS"
                                  }
                                  onChange={(e) =>
                                    setRespuestaPregunta(
                                      pregunta.CodigoPregunta,
                                      e.target.value
                                    )
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
                            setRespuestaPregunta(
                              pregunta.CodigoPregunta,
                              e.target.value
                            )
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
                  <h2 className="text-white font-semibold text-lg">
                    Entrega de Dotación
                  </h2>
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
                              checked={
                                respuestas[pregunta.CodigoPregunta] === "SI"
                              }
                              onChange={(e) =>
                                setRespuestaPregunta(
                                  pregunta.CodigoPregunta,
                                  e.target.value
                                )
                              }
                            />
                            SI
                          </label>

                          <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="radio"
                              name={pregunta.CodigoPregunta}
                              value="NO"
                              checked={
                                respuestas[pregunta.CodigoPregunta] === "NO"
                              }
                              onChange={(e) =>
                                setRespuestaPregunta(
                                  pregunta.CodigoPregunta,
                                  e.target.value
                                )
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
                            setRespuestaPregunta(
                              pregunta.CodigoPregunta,
                              e.target.value
                            )
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
          </>
        ) : !token ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-600">
              Valide su identidad para continuar con la entrevista de retiro.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}