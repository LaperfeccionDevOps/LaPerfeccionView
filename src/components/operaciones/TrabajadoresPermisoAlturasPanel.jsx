import React, { useEffect, useState } from "react";
import { Loader2, Trash2, UserPlus } from "lucide-react";

import BuscadorPersonaContratada from "@/components/operaciones/BuscadorPersonaContratada";
import CampoFirma from "@/components/operaciones/CampoFirma";
import OpcionSiNo from "@/components/operaciones/OpcionSiNo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  agregarTrabajadorPermiso,
  obtenerFirmaTrabajadorPermiso,
  obtenerTrabajadoresPermiso,
  quitarTrabajadorPermiso,
} from "@/services/permisosAlturasService";
import {
  CONDICIONES_SALUD,
  IMPEDIMENTOS_ALTURAS,
} from "@/utils/permisosAlturas";

const FORMULARIO_INICIAL = {
  fechaExamenMedico: "",
  fechaCertificadoAlturas: "",
  seguridadSocialVerificada: "",
  presentaImpedimentoAlturas: "",
  ...Object.fromEntries(IMPEDIMENTOS_ALTURAS.map(({ campo }) => [campo, ""])),
  otroImpedimentoAlturas: "",
  consumeMedicamentos: "",
  medicamentosPresionArterial: "",
  medicamentosSomnolencia: "",
  cualMedicamentoSomnolencia: "",
  otroMedicamento: "",
  presentaCondicionSalud: "",
  ...Object.fromEntries(CONDICIONES_SALUD.map(({ campo }) => [campo, ""])),
  otraCondicionSalud: "",
};

// Las condiciones específicas solo se muestran si responde SI; al cambiar a
// NO se limpian (el backend las guarda en NO).
const CONDICIONES_VACIAS = {
  ...Object.fromEntries(CONDICIONES_SALUD.map(({ campo }) => [campo, ""])),
  otraCondicionSalud: "",
};

// Subpreguntas de impedimentos: se limpian si responde NO a la principal.
const IMPEDIMENTOS_VACIOS = {
  ...Object.fromEntries(IMPEDIMENTOS_ALTURAS.map(({ campo }) => [campo, ""])),
  otroImpedimentoAlturas: "",
};

// Declaró un impedimento, pero respondió NO a todos los preguntados: debe
// describir cuál.
const requiereOtroImpedimento = (formulario) =>
  formulario.presentaImpedimentoAlturas === "SI" &&
  IMPEDIMENTOS_ALTURAS.every(({ campo }) => formulario[campo] === "NO");

// Subpreguntas de medicamentos: se limpian si responde NO a la principal.
const MEDICAMENTOS_VACIOS = {
  medicamentosPresionArterial: "",
  medicamentosSomnolencia: "",
  cualMedicamentoSomnolencia: "",
  otroMedicamento: "",
};

// Consume medicamentos, pero NO de presión arterial ni de los que causan
// somnolencia: debe indicar cuál.
const requiereOtroMedicamento = (formulario) =>
  formulario.consumeMedicamentos === "SI" &&
  formulario.medicamentosPresionArterial === "NO" &&
  formulario.medicamentosSomnolencia === "NO";

// Declaró una condición de salud, pero respondió NO a todas las de la lista:
// debe describir cuál es para que quede informada.
const requiereOtraCondicion = (formulario) =>
  formulario.presentaCondicionSalud === "SI" &&
  CONDICIONES_SALUD.every(({ campo }) => formulario[campo] === "NO");

// Fecha de hoy en Colombia con formato YYYY-MM-DD (para el atributo max).
const obtenerHoyISO = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
  }).format(new Date());

const formatearFechaCorta = (valor) => {
  if (!valor) {
    return "";
  }

  const [anio, mes, dia] = valor.split("-");
  return `${dia}/${mes}/${anio}`;
};

const Respuesta = ({ valor, alertaSi = false }) => {
  const esAlerta = alertaSi ? valor : !valor;

  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-semibold",
        esAlerta
          ? "bg-red-100 text-red-700"
          : "bg-emerald-100 text-emerald-700"
      )}
    >
      {valor ? "Sí" : "No"}
    </span>
  );
};

const ResumenSalud = ({ trabajador }) => {
  if (trabajador.presenta_condicion_salud == null) {
    // Registrado antes de que existieran estas preguntas.
    return <span className="text-xs text-gray-400">Sin dato</span>;
  }

  if (!trabajador.presenta_condicion_salud) {
    return <Respuesta valor={false} alertaSi />;
  }

  const condiciones = CONDICIONES_SALUD.filter(
    ({ api }) => trabajador[api]
  ).map(({ corto }) => corto);

  return (
    <div>
      <Respuesta valor alertaSi />
      <p className="mt-1 text-xs text-gray-500">
        {condiciones.length > 0
          ? condiciones.join(", ")
          : trabajador.otra_condicion_salud || "Ninguna de la lista"}
      </p>
    </div>
  );
};

const FirmaMiniatura = ({ idPermiso, idPermisoTrabajador }) => {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vigente = true;
    let urlCreada = null;

    obtenerFirmaTrabajadorPermiso(idPermiso, idPermisoTrabajador)
      .then((blob) => {
        if (vigente) {
          urlCreada = URL.createObjectURL(blob);
          setUrl(urlCreada);
        }
      })
      .catch(() => vigente && setError(true));

    return () => {
      vigente = false;
      if (urlCreada) {
        URL.revokeObjectURL(urlCreada);
      }
    };
  }, [idPermiso, idPermisoTrabajador]);

  if (error) {
    return <span className="text-xs text-red-500">No disponible</span>;
  }

  if (!url) {
    return <span className="text-xs text-gray-400">Cargando...</span>;
  }

  return (
    <a href={url} target="_blank" rel="noreferrer" title="Ver firma completa">
      <img
        src={url}
        alt="Firma del trabajador"
        className="h-10 w-28 rounded border border-gray-200 bg-white object-contain"
      />
    </a>
  );
};

const ResumenImpedimentos = ({ trabajador }) => {
  if (trabajador.presenta_impedimento_alturas == null) {
    // Registrado antes de esta pregunta: solo se preguntaba por sustancias.
    return (
      <div>
        <Respuesta valor={trabajador.consume_sustancias} alertaSi />
        <p className="mt-1 text-xs text-gray-500">Sustancias</p>
      </div>
    );
  }

  const impedimentos = IMPEDIMENTOS_ALTURAS.filter(
    ({ api }) => trabajador[api]
  ).map(({ corto }) => corto);

  return (
    <div>
      <Respuesta valor={trabajador.presenta_impedimento_alturas} alertaSi />
      {trabajador.presenta_impedimento_alturas && (
        <p className="mt-1 text-xs text-gray-500">
          {impedimentos.length > 0
            ? impedimentos.join(", ")
            : trabajador.otro_impedimento_alturas}
        </p>
      )}
    </div>
  );
};

const ResumenMedicamentos = ({ trabajador }) => {
  const detalles = [];

  if (trabajador.medicamentos_presion_arterial) {
    detalles.push("Presión arterial");
  }

  if (trabajador.medicamentos_somnolencia) {
    detalles.push(
      `Somnolencia: ${trabajador.cual_medicamento_somnolencia || ""}`
    );
  }

  if (trabajador.otro_medicamento) {
    detalles.push(trabajador.otro_medicamento);
  }

  // Registros anteriores a la pregunta nueva de medicamentos.
  if (detalles.length === 0 && trabajador.cuales_medicamentos) {
    detalles.push(trabajador.cuales_medicamentos);
  }

  return (
    <div>
      <Respuesta valor={trabajador.consume_medicamentos} alertaSi />
      {trabajador.consume_medicamentos && detalles.length > 0 && (
        <p className="mt-1 text-xs text-gray-500">{detalles.join(" · ")}</p>
      )}
    </div>
  );
};

/**
 * Paso 2 del permiso: registro de los trabajadores con sus respuestas de
 * aptitud y su firma. Si el permiso ya no es editable (autorizado), solo
 * muestra la lista.
 */
const TrabajadoresPermisoAlturasPanel = ({
  idPermiso,
  editable = true,
  onCantidadCambia = () => {},
}) => {
  const [trabajadores, setTrabajadores] = useState([]);
  const [cargando, setCargando] = useState(false);

  const [seleccionado, setSeleccionado] = useState(null);

  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [firmaPng, setFirmaPng] = useState(null);
  const [versionFirma, setVersionFirma] = useState(0);

  const hoy = obtenerHoyISO();

  useEffect(() => {
    if (!idPermiso) {
      return;
    }

    setTrabajadores([]);
    setSeleccionado(null);
    setFormulario(FORMULARIO_INICIAL);
    setCargando(true);

    obtenerTrabajadoresPermiso(idPermiso)
      .then(setTrabajadores)
      .catch((error) =>
        toast({
          title: "No se pudieron cargar los trabajadores",
          description: error.message,
          variant: "destructive",
        })
      )
      .finally(() => setCargando(false));
  }, [idPermiso]);

  const actualizarCampo = (campo, valor) => {
    setFormulario((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const limpiarSeleccion = () => {
    setSeleccionado(null);
    setFormulario(FORMULARIO_INICIAL);
    setFirmaPng(null);
    setVersionFirma((version) => version + 1);
  };

  const handleAgregar = async (e) => {
    e.preventDefault();

    const camposCompletos =
      seleccionado &&
      formulario.fechaExamenMedico &&
      formulario.fechaCertificadoAlturas &&
      formulario.seguridadSocialVerificada &&
      formulario.presentaImpedimentoAlturas &&
      formulario.consumeMedicamentos &&
      formulario.presentaCondicionSalud;

    if (!camposCompletos) {
      toast({
        title: "Campos requeridos",
        description:
          "Selecciona el trabajador y responde todas las preguntas.",
        variant: "destructive",
      });
      return;
    }

    if (
      formulario.presentaCondicionSalud === "SI" &&
      CONDICIONES_SALUD.some(({ campo }) => !formulario[campo])
    ) {
      toast({
        title: "Campos requeridos",
        description: "Responde todas las condiciones de salud del trabajador.",
        variant: "destructive",
      });
      return;
    }

    if (
      requiereOtraCondicion(formulario) &&
      !formulario.otraCondicionSalud.trim()
    ) {
      toast({
        title: "Campos requeridos",
        description:
          "Describe la condición o restricción de salud del trabajador.",
        variant: "destructive",
      });
      return;
    }

    if (
      formulario.presentaImpedimentoAlturas === "SI" &&
      IMPEDIMENTOS_ALTURAS.some(({ campo }) => !formulario[campo])
    ) {
      toast({
        title: "Campos requeridos",
        description:
          "Responde las preguntas sobre condiciones o situaciones que impiden trabajar en alturas.",
        variant: "destructive",
      });
      return;
    }

    if (
      requiereOtroImpedimento(formulario) &&
      !formulario.otroImpedimentoAlturas.trim()
    ) {
      toast({
        title: "Campos requeridos",
        description:
          "Describe la condición o situación que le impide realizar el trabajo en alturas de manera segura.",
        variant: "destructive",
      });
      return;
    }

    if (
      formulario.consumeMedicamentos === "SI" &&
      (!formulario.medicamentosPresionArterial ||
        !formulario.medicamentosSomnolencia)
    ) {
      toast({
        title: "Campos requeridos",
        description: "Responde las preguntas de medicamentos del trabajador.",
        variant: "destructive",
      });
      return;
    }

    if (
      formulario.consumeMedicamentos === "SI" &&
      formulario.medicamentosSomnolencia === "SI" &&
      !formulario.cualMedicamentoSomnolencia.trim()
    ) {
      toast({
        title: "Campos requeridos",
        description:
          "Indica cuál medicamento que causa somnolencia toma el trabajador.",
        variant: "destructive",
      });
      return;
    }

    if (
      requiereOtroMedicamento(formulario) &&
      !formulario.otroMedicamento.trim()
    ) {
      toast({
        title: "Campos requeridos",
        description: "Indica cuál medicamento consume el trabajador.",
        variant: "destructive",
      });
      return;
    }

    if (!firmaPng) {
      toast({
        title: "Firma requerida",
        description: "El trabajador debe firmar antes de agregarlo al permiso.",
        variant: "destructive",
      });
      return;
    }

    setGuardando(true);

    try {
      const nuevo = await agregarTrabajadorPermiso(idPermiso, {
        ...formulario,
        idRegistroPersonal: seleccionado.id_registro_personal,
        firmaPng,
        cualMedicamentoSomnolencia:
          formulario.consumeMedicamentos === "SI" &&
          formulario.medicamentosSomnolencia === "SI"
            ? formulario.cualMedicamentoSomnolencia.trim()
            : null,
        otroImpedimentoAlturas: requiereOtroImpedimento(formulario)
          ? formulario.otroImpedimentoAlturas.trim()
          : null,
        otroMedicamento: requiereOtroMedicamento(formulario)
          ? formulario.otroMedicamento.trim()
          : null,
        otraCondicionSalud: requiereOtraCondicion(formulario)
          ? formulario.otraCondicionSalud.trim()
          : null,
      });

      const lista = [...trabajadores, nuevo];
      setTrabajadores(lista);
      onCantidadCambia(idPermiso, lista.length);
      limpiarSeleccion();

      toast({
        title: "Trabajador agregado",
        description: `${nuevo.nombre_completo} quedó registrado en el permiso.`,
      });
    } catch (error) {
      toast({
        title: "No se pudo agregar el trabajador",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleQuitar = async (trabajador) => {
    const confirmado = window.confirm(
      `¿Quitar a ${trabajador.nombre_completo} de este permiso?`
    );

    if (!confirmado) {
      return;
    }

    try {
      await quitarTrabajadorPermiso(
        idPermiso,
        trabajador.id_permiso_trabajo_alturas_trabajador
      );

      const lista = trabajadores.filter(
        (t) =>
          t.id_permiso_trabajo_alturas_trabajador !==
          trabajador.id_permiso_trabajo_alturas_trabajador
      );

      setTrabajadores(lista);
      onCantidadCambia(idPermiso, lista.length);
    } catch (error) {
      toast({
        title: "No se pudo quitar el trabajador",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
        {editable && (
        <form
          onSubmit={handleAgregar}
          className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4"
        >
          <h3 className="font-semibold text-gray-800">
            Agregar trabajador
          </h3>

          <BuscadorPersonaContratada
            id="buscarTrabajador"
            label="Trabajador *"
            seleccionado={seleccionado}
            onSeleccionar={(persona) =>
              persona ? setSeleccionado(persona) : limpiarSeleccion()
            }
            disabled={guardando}
            // Una persona solo puede estar una vez en el mismo permiso.
            idsNoSeleccionables={trabajadores.map((t) => t.id_registro_personal)}
            motivoNoSeleccionable="Ya registrado en este permiso"
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fechaExamenMedico">
                Fecha del examen médico *
              </Label>

              <Input
                id="fechaExamenMedico"
                type="date"
                max={hoy}
                value={formulario.fechaExamenMedico}
                onChange={(e) =>
                  actualizarCampo("fechaExamenMedico", e.target.value)
                }
                disabled={guardando}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaCertificadoAlturas">
                Fecha del certificado de alturas *
              </Label>

              <Input
                id="fechaCertificadoAlturas"
                type="date"
                max={hoy}
                value={formulario.fechaCertificadoAlturas}
                onChange={(e) =>
                  actualizarCampo("fechaCertificadoAlturas", e.target.value)
                }
                disabled={guardando}
              />
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
            <OpcionSiNo
              id="presentaCondicionSalud"
              label="¿Presenta actualmente alguna condición de salud que deba ser informada para realizar el trabajo en alturas? *"
              value={formulario.presentaCondicionSalud}
              onChange={(valor) =>
                setFormulario((prev) => ({
                  ...prev,
                  presentaCondicionSalud: valor,
                  ...(valor === "NO" ? CONDICIONES_VACIAS : {}),
                }))
              }
              disabled={guardando}
            />

            {formulario.presentaCondicionSalud === "SI" && (
              <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 md:grid-cols-2">
                {CONDICIONES_SALUD.map(({ campo, pregunta }) => (
                  <OpcionSiNo
                    key={campo}
                    id={campo}
                    label={`${pregunta} *`}
                    value={formulario[campo]}
                    onChange={(valor) => actualizarCampo(campo, valor)}
                    disabled={guardando}
                  />
                ))}
              </div>
            )}

            {requiereOtraCondicion(formulario) && (
              <div className="space-y-2 border-t border-gray-100 pt-4">
                <Label htmlFor="otraCondicionSalud">
                  ¿Cuál otra condición o restricción de salud presenta? *
                </Label>

                <Input
                  id="otraCondicionSalud"
                  value={formulario.otraCondicionSalud}
                  maxLength={300}
                  placeholder="Describe la condición o restricción de salud que debe ser informada"
                  onChange={(e) =>
                    actualizarCampo("otraCondicionSalud", e.target.value)
                  }
                  disabled={guardando}
                />

                <p className="text-xs text-gray-500">
                  Indicaste que presenta una condición de salud, pero ninguna
                  de la lista aplica.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
            <OpcionSiNo
              id="consumeMedicamentos"
              label="¿Consume actualmente algún medicamento que deba ser informado para realizar el trabajo en alturas? *"
              value={formulario.consumeMedicamentos}
              onChange={(valor) =>
                setFormulario((prev) => ({
                  ...prev,
                  consumeMedicamentos: valor,
                  ...(valor === "NO" ? MEDICAMENTOS_VACIOS : {}),
                }))
              }
              disabled={guardando}
            />

            {formulario.consumeMedicamentos === "SI" && (
              <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 md:grid-cols-2">
                <OpcionSiNo
                  id="medicamentosPresionArterial"
                  label="¿Actualmente toma medicamentos para la presión arterial alta/baja? *"
                  value={formulario.medicamentosPresionArterial}
                  onChange={(valor) =>
                    actualizarCampo("medicamentosPresionArterial", valor)
                  }
                  disabled={guardando}
                />

                <div className="space-y-4">
                  <OpcionSiNo
                    id="medicamentosSomnolencia"
                    label="¿Está tomando medicamentos que pueden causar somnolencia? *"
                    value={formulario.medicamentosSomnolencia}
                    onChange={(valor) =>
                      setFormulario((prev) => ({
                        ...prev,
                        medicamentosSomnolencia: valor,
                        ...(valor === "NO"
                          ? { cualMedicamentoSomnolencia: "" }
                          : {}),
                      }))
                    }
                    disabled={guardando}
                  />

                  {formulario.medicamentosSomnolencia === "SI" && (
                    <div className="space-y-2">
                      <Label htmlFor="cualMedicamentoSomnolencia">
                        ¿Cuál? *
                      </Label>

                      <Input
                        id="cualMedicamentoSomnolencia"
                        value={formulario.cualMedicamentoSomnolencia}
                        maxLength={300}
                        placeholder="Medicamento que puede causar somnolencia"
                        onChange={(e) =>
                          actualizarCampo(
                            "cualMedicamentoSomnolencia",
                            e.target.value
                          )
                        }
                        disabled={guardando}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {requiereOtroMedicamento(formulario) && (
              <div className="space-y-2 border-t border-gray-100 pt-4">
                <Label htmlFor="otroMedicamento">
                  ¿Cuál medicamento consume? *
                </Label>

                <Input
                  id="otroMedicamento"
                  value={formulario.otroMedicamento}
                  maxLength={300}
                  placeholder="Escribe el medicamento que debe ser informado"
                  onChange={(e) =>
                    actualizarCampo("otroMedicamento", e.target.value)
                  }
                  disabled={guardando}
                />

                <p className="text-xs text-gray-500">
                  Indicaste que consume un medicamento, pero no es para la
                  presión arterial ni causa somnolencia.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
            <OpcionSiNo
              id="presentaImpedimentoAlturas"
              label="¿Presenta actualmente alguna condición o situación que le impida realizar trabajo en alturas de manera segura? *"
              value={formulario.presentaImpedimentoAlturas}
              onChange={(valor) =>
                setFormulario((prev) => ({
                  ...prev,
                  presentaImpedimentoAlturas: valor,
                  ...(valor === "NO" ? IMPEDIMENTOS_VACIOS : {}),
                }))
              }
              disabled={guardando}
            />

            {formulario.presentaImpedimentoAlturas === "SI" && (
              <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 md:grid-cols-2">
                {IMPEDIMENTOS_ALTURAS.map(({ campo, pregunta }) => (
                  <OpcionSiNo
                    key={campo}
                    id={campo}
                    label={`${pregunta} *`}
                    value={formulario[campo]}
                    onChange={(valor) => actualizarCampo(campo, valor)}
                    disabled={guardando}
                  />
                ))}
              </div>
            )}

            {requiereOtroImpedimento(formulario) && (
              <div className="space-y-2 border-t border-gray-100 pt-4">
                <Label htmlFor="otroImpedimentoAlturas">
                  ¿Cuál condición o situación le impide trabajar en alturas de manera segura? *
                </Label>

                <Input
                  id="otroImpedimentoAlturas"
                  value={formulario.otroImpedimentoAlturas}
                  maxLength={300}
                  placeholder="Describe la condición o situación"
                  onChange={(e) =>
                    actualizarCampo("otroImpedimentoAlturas", e.target.value)
                  }
                  disabled={guardando}
                />

                <p className="text-xs text-gray-500">
                  Indicaste que presenta una condición o situación, pero
                  ninguna de las anteriores.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <OpcionSiNo
              id="seguridadSocial"
              label="¿Seguridad social verificada? *"
              value={formulario.seguridadSocialVerificada}
              onChange={(valor) =>
                actualizarCampo("seguridadSocialVerificada", valor)
              }
              disabled={guardando}
            />
          </div>

          <CampoFirma
            key={versionFirma}
            id="firmaTrabajador"
            label="Firma del trabajador *"
            onChange={setFirmaPng}
            disabled={guardando}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={guardando || !seleccionado}
              className="h-11 gap-2 rounded-xl bg-emerald-600 px-6 text-white hover:bg-emerald-700"
            >
              {guardando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Agregar trabajador
            </Button>
          </div>
        </form>
        )}

        <div>
          <h3 className="mb-3 font-semibold text-gray-800">
            Trabajadores registrados ({trabajadores.length})
          </h3>

          {cargando ? (
            <p className="text-sm text-gray-500">
              Cargando trabajadores...
            </p>
          ) : trabajadores.length === 0 ? (
            <p className="text-sm text-gray-500">
              Este permiso aún no tiene trabajadores.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-3">Trabajador</th>
                    <th className="px-3 py-3">Examen</th>
                    <th className="px-3 py-3">Certificado</th>
                    <th className="px-3 py-3">Cond. salud</th>
                    <th className="px-3 py-3">Seg. social</th>
                    <th className="px-3 py-3">Impedimentos</th>
                    <th className="px-3 py-3">Medicamentos</th>
                    <th className="px-3 py-3">Firma</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {trabajadores.map((trabajador) => (
                    <tr key={trabajador.id_permiso_trabajo_alturas_trabajador}>
                      <td className="px-3 py-3">
                        <p className="font-medium text-gray-800">
                          {trabajador.nombre_completo}
                        </p>
                        <p className="text-xs text-gray-500">
                          C.C. {trabajador.numero_identificacion}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-gray-700">
                        {formatearFechaCorta(trabajador.fecha_examen_medico)}
                      </td>
                      <td className="px-3 py-3 text-gray-700">
                        {formatearFechaCorta(trabajador.fecha_certificado_alturas)}
                      </td>
                      <td className="px-3 py-3">
                        <ResumenSalud trabajador={trabajador} />
                      </td>
                      <td className="px-3 py-3">
                        <Respuesta valor={trabajador.seguridad_social_verificada} />
                      </td>
                      <td className="px-3 py-3">
                        <ResumenImpedimentos trabajador={trabajador} />
                      </td>
                      <td className="px-3 py-3">
                        <ResumenMedicamentos trabajador={trabajador} />
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-500">
                        {trabajador.fecha_firma ? (
                          <FirmaMiniatura
                            idPermiso={idPermiso}
                            idPermisoTrabajador={
                              trabajador.id_permiso_trabajo_alturas_trabajador
                            }
                          />
                        ) : (
                          "Sin firma"
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {editable && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleQuitar(trabajador)}
                            title="Quitar del permiso"
                            className="text-red-500 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </div>
  );
};

export default TrabajadoresPermisoAlturasPanel;
