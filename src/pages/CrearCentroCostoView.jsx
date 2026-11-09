import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Eye,
  FilePlus2,
  Loader2,
  MapPin,
  Plus,
  Search,
  UserPlus,
} from "lucide-react";

import CampoTexto from "@/components/contabilidad/CampoTexto";
import DetalleCentroCostoDialog from "@/components/contabilidad/DetalleCentroCostoDialog";
import EncabezadoCentrosCosto, {
  RUTAS_CENTROS_COSTO,
} from "@/components/contabilidad/EncabezadoCentrosCosto";
import FiltroBuscable from "@/components/contabilidad/FiltroBuscable";
import PasoLineaCentroCosto from "@/components/contabilidad/PasoLineaCentroCosto";
import PasoSedeCentroCosto from "@/components/contabilidad/PasoSedeCentroCosto";
import PasoServicioCentroCosto from "@/components/contabilidad/PasoServicioCentroCosto";
import ValidacionCombinacion from "@/components/contabilidad/ValidacionCombinacion";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  consultarCentrosCosto,
  crearCentroCosto,
  obtenerDepartamentosGeograficos,
  obtenerFiltrosCentrosCosto,
  obtenerMunicipios,
} from "@/services/contabilidadService";

// Mismo formato que valida la base: dígitos, guion y dígito de verificación.
const FORMATO_NIT = /^[0-9]{5,15}-[0-9]$/;
const FORMATO_CODIGO = /^[A-Z0-9]{2,20}$/;

const CLIENTE_NUEVO_INICIAL = { nit: "", razonSocial: "", codigo: "", nombre: "" };
const DEPARTAMENTO_NUEVO_INICIAL = { idGeografico: "", idMunicipio: "", codigo: "", nombre: "" };
// Valor del selector de departamento cuando se va a registrar uno nuevo.
const DEPARTAMENTO_NUEVO = "nuevo";

const OPCIONES_CLIENTE = [
  {
    valor: "existente",
    titulo: "Cliente existente",
    descripcion: "Agregar el centro de costo a un cliente / proyecto ya registrado.",
    icono: Building2,
  },
  {
    valor: "nuevo",
    titulo: "Cliente nuevo",
    descripcion: "Registrar un cliente y su proyecto (CEN 1) por primera vez.",
    icono: UserPlus,
  },
];

// "GIRARDOT" -> "Girardot", "BOGOTÁ D.C." -> "Bogotá D.C." (los municipios
// vienen en mayúsculas).
const nombrePropio = (valor) =>
  String(valor || "")
    .toLowerCase()
    .replace(/(^|[\s(-])(\S)/g, (_, inicio, letra) => inicio + letra.toUpperCase())
    .replace(/\bD\.c\./g, "D.C.");

// "Cundinamarca · Girardot", o un solo nombre cuando no tiene municipio o
// coincide con el departamento (Bogotá D.C.).
const ubicacionDepartamento = (d) => {
  const municipio = d.municipio && nombrePropio(d.municipio);

  return municipio && municipio !== d.departamento_geografico
    ? `${d.departamento_geografico} · ${municipio}`
    : d.departamento_geografico;
};

const CODIFICACION = [
  { cen: "CEN 1", nombre: "Proyecto" },
  { cen: "CEN 2", nombre: "Departamento" },
  { cen: "CEN 3", nombre: "Sede" },
  { cen: "CEN 4", nombre: "Línea de negocio" },
  { cen: "CEN 5", nombre: "Servicio asociado" },
];

/**
 * Contabilidad > Centros de costo > Crear: codificación CEN 1 a CEN 5 (cada
 * uno existente o nuevo), validación de que la combinación no exista y
 * creación del centro ABIERTO con fecha de apertura de hoy.
 * `onReiniciar` vuelve a montar el formulario vacío para crear otro.
 */
const FormularioCrearCentroCosto = ({ onReiniciar }) => {
  const [catalogos, setCatalogos] = useState(null);
  const [tipoCliente, setTipoCliente] = useState("existente");
  const [idProyecto, setIdProyecto] = useState("");
  const [clienteNuevo, setClienteNuevo] = useState(CLIENTE_NUEVO_INICIAL);
  const [idDepartamento, setIdDepartamento] = useState("");
  const [departamentoNuevo, setDepartamentoNuevo] = useState(DEPARTAMENTO_NUEVO_INICIAL);
  // Centros que ya tiene el proyecto elegido, por código de departamento.
  const [usoDepartamentos, setUsoDepartamentos] = useState({});
  // CEN 3 listo que informa el paso de sede (null mientras no esté completo).
  const [cen3, setCen3] = useState(null);
  // Líneas que ya tiene la sede elegida ({ código: centros }); null si es nueva.
  const [lineasSede, setLineasSede] = useState(null);
  // Línea y servicio listos ({ codigo, nombre, nueva/nuevo }) que informan sus
  // pasos; cada paso maneja su propia selección y su formulario de alta.
  const [lineaElegida, setLineaElegida] = useState(null);
  const [servicioElegido, setServicioElegido] = useState(null);
  // Datos de la sede para guardarla ({ codigo, descripcion?, nuevo }).
  const [sedeDatos, setSedeDatos] = useState(null);
  // Respuesta de la validación de la combinación (null mientras valida).
  const [validacion, setValidacion] = useState(null);
  const [observacion, setObservacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  // Centro creado (detalle que devuelve la API) y si se está viendo su detalle.
  const [creado, setCreado] = useState(null);
  const [verCreado, setVerCreado] = useState(false);
  // Catálogos para ubicar un CEN 2 nuevo; se cargan al elegir "Nuevo departamento".
  const [departamentosGeo, setDepartamentosGeo] = useState(null);
  const [municipios, setMunicipios] = useState([]);
  const [cargandoMunicipios, setCargandoMunicipios] = useState(false);

  useEffect(() => {
    obtenerFiltrosCentrosCosto()
      .then(setCatalogos)
      .catch((error) =>
        toast({
          title: "No se pudieron cargar los clientes",
          description: error.message,
          variant: "destructive",
        })
      );
  }, []);

  const proyectos = catalogos?.proyectos || [];

  const opcionesProyecto = useMemo(
    () =>
      proyectos.map((p) => ({
        id: p.id,
        etiqueta: `${p.cliente} (${p.codigo})`,
        detalle: `NIT ${p.nit}${p.nombre !== p.cliente ? ` · Proyecto ${p.nombre}` : ""}`,
        busqueda: `${p.codigo} ${p.nit} ${p.nombre}`,
      })),
    [catalogos]
  );

  const proyectoElegido = proyectos.find((p) => String(p.id) === String(idProyecto));

  // Para orientar el CEN 2: en qué departamentos ya tiene centros el proyecto.
  useEffect(() => {
    setUsoDepartamentos({});

    if (!idProyecto) {
      return undefined;
    }

    let vigente = true;

    const contar = async () => {
      const uso = {};
      let pagina = 1;
      let total = 0;

      do {
        const datos = await consultarCentrosCosto({ idProyecto, pagina, tamanoPagina: 200 });
        total = datos.total;
        datos.centros.forEach((c) => {
          const codigoDepartamento = c.codigo.split("-")[1];
          uso[codigoDepartamento] = (uso[codigoDepartamento] || 0) + 1;
        });
        pagina += 1;
      } while ((pagina - 1) * 200 < total);

      if (vigente) {
        setUsoDepartamentos(uso);
      }
    };

    contar().catch(() => {
      // Es solo una ayuda; si falla, el departamento se elige igual.
    });

    return () => {
      vigente = false;
    };
  }, [idProyecto]);

  const cambiarClienteNuevo = (campo, valor) =>
    setClienteNuevo((prev) => ({ ...prev, [campo]: valor }));

  // Validaciones del cliente nuevo (solo se muestran cuando hay algo escrito).
  const nit = clienteNuevo.nit.trim();
  const codigo = clienteNuevo.codigo.trim();
  const nitRegistrado = proyectos.find((p) => p.nit === nit);
  const codigoRegistrado = proyectos.find((p) => p.codigo === codigo);

  const errores = {
    nit:
      nit && !FORMATO_NIT.test(nit)
        ? "Escribe el NIT con el dígito de verificación, p. ej. 860066942-4."
        : nitRegistrado
          ? `Este NIT ya está registrado (${nitRegistrado.cliente}). Usa "Cliente existente".`
          : null,
    codigo:
      codigo && !FORMATO_CODIGO.test(codigo)
        ? "Solo letras mayúsculas y números, entre 2 y 20 caracteres."
        : codigoRegistrado
          ? `El código ${codigo} ya es de ${codigoRegistrado.cliente}.`
          : null,
  };

  const clienteNuevoCompleto =
    FORMATO_NIT.test(nit) &&
    clienteNuevo.razonSocial.trim() &&
    FORMATO_CODIGO.test(codigo) &&
    clienteNuevo.nombre.trim() &&
    !errores.nit &&
    !errores.codigo;

  const cen1 =
    tipoCliente === "existente"
      ? proyectoElegido?.codigo
      : clienteNuevoCompleto
        ? codigo
        : null;

  useEffect(() => {
    if (idDepartamento !== DEPARTAMENTO_NUEVO || departamentosGeo) {
      return;
    }

    obtenerDepartamentosGeograficos()
      .then(setDepartamentosGeo)
      .catch((error) =>
        toast({
          title: "No se pudieron cargar los departamentos de Colombia",
          description: error.message,
          variant: "destructive",
        })
      );
  }, [idDepartamento, departamentosGeo]);

  const departamentoGeoElegido = (departamentosGeo || []).find(
    (d) => String(d.id) === String(departamentoNuevo.idGeografico)
  );

  useEffect(() => {
    setMunicipios([]);

    if (!departamentoGeoElegido) {
      return undefined;
    }

    let vigente = true;
    setCargandoMunicipios(true);

    obtenerMunicipios(departamentoGeoElegido.codigo_dane)
      .then((lista) => vigente && setMunicipios(lista))
      .catch(
        (error) =>
          vigente &&
          toast({
            title: "No se pudieron cargar los municipios",
            description: error.message,
            variant: "destructive",
          })
      )
      .finally(() => vigente && setCargandoMunicipios(false));

    return () => {
      vigente = false;
    };
  }, [departamentoGeoElegido]);

  const opcionesDepartamentoGeo = useMemo(
    () =>
      (departamentosGeo || []).map((d) => ({
        id: d.id,
        etiqueta: d.nombre,
        detalle: `Código DANE ${d.codigo_dane}`,
        busqueda: d.codigo_dane,
      })),
    [departamentosGeo]
  );

  const opcionesMunicipio = useMemo(
    () => municipios.map((m) => ({ id: m.id, etiqueta: nombrePropio(m.nombre) })),
    [municipios]
  );

  const municipioElegido = municipios.find(
    (m) => String(m.id) === String(departamentoNuevo.idMunicipio)
  );

  const departamentos = catalogos?.departamentos || [];
  const departamentoElegido = departamentos.find(
    (d) => String(d.id) === String(idDepartamento)
  );

  const cambiarDepartamentoNuevo = (campo, valor) =>
    setDepartamentoNuevo((prev) => ({ ...prev, [campo]: valor }));

  // Al elegir la ubicación se sugiere el nombre del CEN 2; se puede cambiar.
  const elegirDepartamentoGeo = (id) => {
    const elegido = (departamentosGeo || []).find((d) => String(d.id) === String(id));
    setDepartamentoNuevo((prev) => ({
      ...prev,
      idGeografico: id,
      idMunicipio: "",
      nombre: elegido ? elegido.nombre : "",
    }));
  };

  const elegirMunicipio = (id) => {
    const elegido = municipios.find((m) => String(m.id) === String(id));
    setDepartamentoNuevo((prev) => ({
      ...prev,
      idMunicipio: id,
      nombre: elegido ? nombrePropio(elegido.nombre) : departamentoGeoElegido?.nombre || "",
    }));
  };

  const codigoDepartamento = departamentoNuevo.codigo.trim();
  const nombreDepartamento = departamentoNuevo.nombre.trim();
  const codigoDepartamentoRegistrado = departamentos.find((d) => d.codigo === codigoDepartamento);
  const nombreDepartamentoRegistrado = departamentos.find(
    (d) => d.nombre.toLowerCase() === nombreDepartamento.toLowerCase()
  );

  const erroresDepartamento = {
    codigo:
      codigoDepartamento && !FORMATO_CODIGO.test(codigoDepartamento)
        ? "Solo letras mayúsculas y números, entre 2 y 20 caracteres."
        : codigoDepartamentoRegistrado
          ? `El código ${codigoDepartamento} ya es de ${codigoDepartamentoRegistrado.nombre}.`
          : null,
    nombre: nombreDepartamentoRegistrado
      ? `${nombreDepartamentoRegistrado.nombre} ya existe con el código ${nombreDepartamentoRegistrado.codigo}.`
      : null,
  };

  // Una misma ubicación (municipio, o departamento sin municipio) no debe
  // tener dos CEN 2.
  const ubicacionRegistrada = departamentoNuevo.idGeografico
    ? departamentos.find((d) =>
        departamentoNuevo.idMunicipio
          ? String(d.id_municipio) === String(departamentoNuevo.idMunicipio)
          : String(d.id_departamento_geografico) === String(departamentoNuevo.idGeografico) &&
            !d.id_municipio
      )
    : null;

  const departamentoNuevoCompleto =
    departamentoGeoElegido &&
    !ubicacionRegistrada &&
    FORMATO_CODIGO.test(codigoDepartamento) &&
    nombreDepartamento &&
    !erroresDepartamento.codigo &&
    !erroresDepartamento.nombre;

  const cen2 =
    idDepartamento === DEPARTAMENTO_NUEVO
      ? departamentoNuevoCompleto
        ? codigoDepartamento
        : null
      : departamentoElegido?.codigo;

  // Un segundo clic sobre el mismo departamento lo deselecciona.
  const elegirDepartamento = (valor) => {
    setIdDepartamento((actual) => (actual === valor ? "" : valor));
    setDepartamentoNuevo(DEPARTAMENTO_NUEVO_INICIAL);
  };

  const lineas = catalogos?.lineas || [];
  const cen4 = lineaElegida?.codigo || null;
  const hastaCen3 = Boolean(cen1 && cen2 && cen3);
  const servicios = catalogos?.servicios || [];
  const cen5 = servicioElegido?.codigo || null;
  const hastaCen4 = Boolean(hastaCen3 && cen4);
  const codificacionCompleta = Boolean(hastaCen4 && cen5);

  const puedeCrear = codificacionCompleta && validacion?.existe === false && !guardando;

  const crear = async () => {
    setGuardando(true);

    try {
      const centro = await crearCentroCosto({
        ...(tipoCliente === "existente"
          ? { proyecto_codigo: cen1 }
          : {
              proyecto_nuevo: {
                nit: clienteNuevo.nit.trim(),
                razon_social: clienteNuevo.razonSocial.trim(),
                codigo: cen1,
                nombre: clienteNuevo.nombre.trim(),
              },
            }),
        departamento:
          idDepartamento === DEPARTAMENTO_NUEVO
            ? {
                codigo: cen2,
                nombre: departamentoNuevo.nombre.trim(),
                nuevo: true,
                id_departamento_geografico: Number(departamentoNuevo.idGeografico),
                id_municipio: departamentoNuevo.idMunicipio
                  ? Number(departamentoNuevo.idMunicipio)
                  : null,
              }
            : { codigo: cen2 },
        sede: sedeDatos,
        linea: { codigo: cen4, nombre: lineaElegida.nombre, nuevo: lineaElegida.nueva },
        servicio: { codigo: cen5, nombre: servicioElegido.nombre, nuevo: servicioElegido.nuevo },
        observacion: observacion.trim() || null,
      });

      setCreado(centro);
      toast({ title: "Centro de costo creado", description: centro.codigo });
    } catch (error) {
      toast({
        title: "No se pudo crear el centro de costo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGuardando(false);
    }
  };

  const elegirTipo = (valor) => {
    setTipoCliente(valor);
    setIdProyecto("");
    setClienteNuevo(CLIENTE_NUEVO_INICIAL);
  };

  if (creado) {
    return (
      <div className="w-full min-w-0 max-w-full space-y-4 overflow-x-hidden">
        <EncabezadoCentrosCosto compacto />

        <section className="w-full min-w-0 rounded-2xl bg-white p-4 shadow-xl sm:p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-800">Centro de costo creado</h2>
              <p className="mt-1 break-all font-mono text-sm font-bold text-emerald-800">
                {creado.codigo}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {creado.cliente} · {creado.sede} · {creado.servicio}. Quedó{" "}
                <span className="font-semibold">ABIERTO</span> con apertura del{" "}
                {creado.fecha_apertura.split("-").reverse().join("/")}.
              </p>
              {creado.pendiente_revision && (
                <p className="mt-3 flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  Quedó pendiente de revisión: {creado.observacion_revision}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <Button type="button" onClick={onReiniciar} className="rounded-full bg-emerald-600 hover:bg-emerald-700">
              <FilePlus2 className="mr-2 h-4 w-4" />
              Crear otro centro de costo
            </Button>
            <Button type="button" variant="outline" onClick={() => setVerCreado(true)} className="rounded-full">
              <Eye className="mr-2 h-4 w-4" />
              Ver detalle
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to={RUTAS_CENTROS_COSTO.consultar}>
                <Search className="mr-2 h-4 w-4" />
                Ir a Consultar
              </Link>
            </Button>
          </div>
        </section>

        <DetalleCentroCostoDialog
          idCentro={verCreado ? creado.id_centro_costo_contable : null}
          onClose={() => setVerCreado(false)}
        />
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 overflow-x-hidden">
      <EncabezadoCentrosCosto
        compacto
        descripcion="Registro de un nuevo centro de costo con su cliente, proyecto, sede, línea de negocio y servicio."
      >
        {/* Codificación del centro de costo */}
        <div className="mt-3 flex flex-wrap gap-2">
          {CODIFICACION.map(({ cen, nombre }, indice) => {
            const valor = [
              cen1,
              cen2,
              cen1 && cen2 ? cen3 : null,
              hastaCen3 ? cen4 : null,
              hastaCen4 ? cen5 : null,
            ][indice];

            return (
              <div
                key={cen}
                title={nombre}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
                  valor ? "border-emerald-300 bg-emerald-50" : "border-dashed border-gray-200"
                )}
              >
                <span className="font-bold uppercase text-gray-700">{cen}</span>
                <span
                  className={cn(
                    "font-mono font-bold",
                    valor ? "text-emerald-800" : "text-gray-300"
                  )}
                >
                  {valor || "—"}
                </span>
              </div>
            );
          })}
        </div>
      </EncabezadoCentrosCosto>

      <section className="w-full min-w-0 rounded-2xl bg-white p-4 shadow-xl sm:p-6">
        <h2 className="text-lg font-bold text-gray-800">1. Cliente / Proyecto (CEN 1)</h2>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {OPCIONES_CLIENTE.map(({ valor, titulo, descripcion, icono: Icono }) => (
            <button
              key={valor}
              type="button"
              onClick={() => elegirTipo(valor)}
              aria-pressed={tipoCliente === valor}
              className={cn(
                "flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
                tipoCliente === valor
                  ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100"
                  : "border-gray-200 hover:border-emerald-300"
              )}
            >
              <Icono
                className={cn(
                  "mt-0.5 h-5 w-5 shrink-0",
                  tipoCliente === valor ? "text-emerald-700" : "text-gray-400"
                )}
              />
              <span>
                <span className="block text-sm font-bold text-gray-800">{titulo}</span>
                <span className="block text-xs text-gray-500">{descripcion}</span>
              </span>
            </button>
          ))}
        </div>

        {!catalogos ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando clientes...
          </div>
        ) : tipoCliente === "existente" ? (
          <div className="mt-4 space-y-4">
            <FiltroBuscable
              id="crearProyecto"
              label="Buscar cliente / proyecto"
              opciones={opcionesProyecto}
              valor={idProyecto}
              onChange={setIdProyecto}
              placeholder="Sin seleccionar"
              listaEnLinea
            />

            {proyectoElegido && (
              <div className="grid grid-cols-1 gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs font-bold uppercase text-gray-700">Cliente</p>
                  <p className="text-gray-800">{proyectoElegido.cliente}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-700">NIT</p>
                  <p className="text-gray-800">{proyectoElegido.nit}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-700">Proyecto (CEN 1)</p>
                  <p className="text-gray-800">
                    {proyectoElegido.nombre}{" "}
                    <span className="font-mono font-bold text-emerald-800">
                      ({proyectoElegido.codigo})
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <CampoTexto
                id="nuevoNit"
                label="NIT"
                valor={clienteNuevo.nit}
                onChange={(v) => cambiarClienteNuevo("nit", v.replace(/[^0-9-]/g, ""))}
                placeholder="860066942-4"
                maxLength={20}
                error={errores.nit}
              />
              <CampoTexto
                id="nuevoRazonSocial"
                label="Razón social"
                valor={clienteNuevo.razonSocial}
                onChange={(v) => cambiarClienteNuevo("razonSocial", v)}
                placeholder="Nombre del cliente"
                maxLength={200}
              />
              <CampoTexto
                id="nuevoCodigo"
                label="Código del proyecto (CEN 1)"
                valor={clienteNuevo.codigo}
                onChange={(v) => cambiarClienteNuevo("codigo", v.toUpperCase().replace(/\s/g, ""))}
                placeholder="P. ej. COMPEN"
                maxLength={20}
                error={errores.codigo}
                ayuda="Debe coincidir con el código del proyecto en Synergy."
              />
              <CampoTexto
                id="nuevoNombre"
                label="Nombre del proyecto"
                valor={clienteNuevo.nombre}
                onChange={(v) => cambiarClienteNuevo("nombre", v)}
                placeholder="Normalmente igual a la razón social"
                maxLength={200}
              />
            </div>

            {clienteNuevoCompleto && (
              <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Datos del cliente completos. El CEN 1 será {codigo}.
              </p>
            )}
          </div>
        )}

      </section>

      <section
        className={cn(
          "w-full min-w-0 rounded-2xl bg-white p-4 shadow-xl sm:p-6 lg:p-8",
          !cen1 && "opacity-60"
        )}
      >
        <h2 className="text-lg font-bold text-gray-800">2. Departamento (CEN 2)</h2>

        {!cen1 ? (
          <p className="mt-2 text-sm text-gray-500">
            Primero elige o diligencia el cliente / proyecto.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-gray-500">
              Ciudad o departamento donde se presta el servicio.
              {Object.keys(usoDepartamentos).length > 0 &&
                " El número indica cuántos centros de costo tiene ya este proyecto en ese departamento."}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {departamentos.map((d) => {
                const elegido = String(d.id) === String(idDepartamento);
                const usados = usoDepartamentos[d.codigo];

                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => elegirDepartamento(String(d.id))}
                    aria-pressed={elegido}
                    className={cn(
                      "flex items-center gap-2 rounded-2xl border px-3 py-2 text-left transition-colors",
                      elegido
                        ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100"
                        : "border-gray-200 hover:border-emerald-300"
                    )}
                  >
                    <MapPin
                      className={cn("h-4 w-4 shrink-0", elegido ? "text-emerald-700" : "text-gray-400")}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-gray-800">
                        {d.nombre}
                      </span>
                      <span className="block font-mono text-xs text-gray-500">{d.codigo}</span>
                      {d.departamento_geografico && (
                        <span className="block truncate text-xs text-gray-400" title={ubicacionDepartamento(d)}>
                          {ubicacionDepartamento(d)}
                        </span>
                      )}
                    </span>
                    {usados && (
                      <span
                        title={`${usados} centro(s) de este proyecto en ${d.nombre}`}
                        className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800"
                      >
                        {usados}
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => elegirDepartamento(DEPARTAMENTO_NUEVO)}
                aria-pressed={idDepartamento === DEPARTAMENTO_NUEVO}
                className={cn(
                  "flex items-center gap-2 rounded-2xl border border-dashed px-3 py-2 text-left text-sm font-semibold transition-colors",
                  idDepartamento === DEPARTAMENTO_NUEVO
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100"
                    : "border-gray-300 text-gray-600 hover:border-emerald-300"
                )}
              >
                <Plus className="h-4 w-4 shrink-0" />
                Nuevo departamento
              </button>
            </div>

            {idDepartamento === DEPARTAMENTO_NUEVO && (
              <div className="mt-4 space-y-3">
                {!departamentosGeo ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando departamentos de Colombia...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FiltroBuscable
                      id="nuevoDepartamentoGeo"
                      label="Departamento"
                      opciones={opcionesDepartamentoGeo}
                      valor={departamentoNuevo.idGeografico}
                      onChange={elegirDepartamentoGeo}
                      placeholder="Sin seleccionar"
                      listaEnLinea
                    />
                    <FiltroBuscable
                      id="nuevoMunicipio"
                      label={cargandoMunicipios ? "Municipio (cargando...)" : "Municipio (opcional)"}
                      opciones={opcionesMunicipio}
                      valor={departamentoNuevo.idMunicipio}
                      onChange={elegirMunicipio}
                      placeholder={departamentoGeoElegido ? "Todo el departamento" : "Elige primero el departamento"}
                      disabled={!departamentoGeoElegido || cargandoMunicipios}
                      listaEnLinea
                    />
                  </div>
                )}

                {ubicacionRegistrada && (
                  <p className="flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    {municipioElegido ? nombrePropio(municipioElegido.nombre) : departamentoGeoElegido?.nombre} ya
                    tiene el CEN 2 {ubicacionRegistrada.codigo} ({ubicacionRegistrada.nombre}). Elígelo en
                    las tarjetas de arriba.
                  </p>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <CampoTexto
                    id="nuevoDepartamentoCodigo"
                    label="Código del departamento (CEN 2)"
                    valor={departamentoNuevo.codigo}
                    onChange={(v) =>
                      cambiarDepartamentoNuevo("codigo", v.toUpperCase().replace(/\s/g, ""))
                    }
                    placeholder="P. ej. CMEDEL"
                    maxLength={20}
                    error={erroresDepartamento.codigo}
                    ayuda="Debe coincidir con Synergy; los actuales empiezan con C."
                  />
                  <CampoTexto
                    id="nuevoDepartamentoNombre"
                    label="Nombre"
                    valor={departamentoNuevo.nombre}
                    onChange={(v) => cambiarDepartamentoNuevo("nombre", v)}
                    placeholder="P. ej. Medellín"
                    maxLength={200}
                    error={erroresDepartamento.nombre}
                    ayuda="Se sugiere según la ubicación; se puede cambiar."
                  />
                </div>
              </div>
            )}
          </>
        )}

      </section>

      <section
        className={cn(
          "w-full min-w-0 rounded-2xl bg-white p-4 shadow-xl sm:p-6",
          !(cen1 && cen2) && "opacity-60"
        )}
      >
        <h2 className="text-lg font-bold text-gray-800">3. Sede (CEN 3)</h2>

        {!(cen1 && cen2) ? (
          <p className="mt-2 text-sm text-gray-500">
            Primero elige el cliente / proyecto y el departamento.
          </p>
        ) : (
          <PasoSedeCentroCosto
            key={`${tipoCliente}-${idProyecto}-${cen1}`}
            idProyecto={tipoCliente === "existente" ? idProyecto : null}
            codigoProyecto={cen1}
            cen2={cen2}
            nombreDepartamento={
              idDepartamento === DEPARTAMENTO_NUEVO
                ? departamentoNuevo.nombre.trim()
                : departamentoElegido?.nombre
            }
            onChange={(codigo, lineasDeSede, datos) => {
              setCen3(codigo);
              setLineasSede(lineasDeSede);
              setSedeDatos(datos);
            }}
          />
        )}
      </section>

      <section
        className={cn(
          "w-full min-w-0 rounded-2xl bg-white p-4 shadow-xl sm:p-6",
          !hastaCen3 && "opacity-60"
        )}
      >
        <h2 className="text-lg font-bold text-gray-800">4. Línea de negocio (CEN 4)</h2>

        {!hastaCen3 ? (
          <p className="mt-2 text-sm text-gray-500">Primero completa la sede.</p>
        ) : (
          <PasoLineaCentroCosto
            lineas={lineas}
            codigoSede={cen3}
            lineasSede={lineasSede}
            onChange={setLineaElegida}
          />
        )}
      </section>

      <section
        className={cn(
          "w-full min-w-0 rounded-2xl bg-white p-4 shadow-xl sm:p-6",
          !hastaCen4 && "opacity-60"
        )}
      >
        <h2 className="text-lg font-bold text-gray-800">5. Servicio asociado (CEN 5)</h2>

        {!hastaCen4 ? (
          <p className="mt-2 text-sm text-gray-500">Primero elige la línea de negocio.</p>
        ) : (
          <PasoServicioCentroCosto
            key={cen4}
            servicios={servicios}
            cen4={cen4}
            nombreLinea={lineaElegida?.nombre}
            onChange={setServicioElegido}
          />
        )}

        {codificacionCompleta && (
          <div className="mt-4">
            <ValidacionCombinacion
              cen1={cen1}
              cen2={cen2}
              cen3={cen3}
              cen4={cen4}
              cen5={cen5}
              onResultado={setValidacion}
            />
          </div>
        )}
      </section>

      <section
        className={cn(
          "w-full min-w-0 rounded-2xl bg-white p-4 shadow-xl sm:p-6",
          !codificacionCompleta && "opacity-60"
        )}
      >
        <h2 className="text-lg font-bold text-gray-800">6. Crear</h2>

        <div className="mt-3 space-y-1">
          <label htmlFor="crearObservacion" className="text-xs font-bold uppercase text-gray-700">
            Observación (opcional)
          </label>
          <textarea
            id="crearObservacion"
            rows={3}
            maxLength={500}
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            disabled={!codificacionCompleta}
            placeholder="P. ej. Apertura por nuevo contrato del cliente"
            className="w-full resize-y rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed"
          />
          <p className="px-4 text-xs text-gray-500">
            Queda en el historial del centro. {observacion.length}/500
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            {!codificacionCompleta
              ? "Completa los pasos 1 a 5 para crear el centro de costo."
              : validacion?.existe
                ? "Esta combinación ya existe; cambia algún paso para continuar."
                : "Se creará ABIERTO, con la fecha de hoy como apertura."}
          </p>

          <Button
            type="button"
            onClick={crear}
            disabled={!puedeCrear}
            className="w-full shrink-0 rounded-full bg-emerald-600 hover:bg-emerald-700 sm:w-auto"
          >
            {guardando ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FilePlus2 className="mr-2 h-4 w-4" />
            )}
            {guardando ? "Creando..." : "Crear centro de costo"}
          </Button>
        </div>
      </section>
    </div>
  );
};

// Al crear otro centro se vuelve a montar el formulario: queda vacío y recarga
// los catálogos (que ya incluyen lo que se acaba de registrar).
const CrearCentroCostoView = () => {
  const [formulario, setFormulario] = useState(0);

  return (
    <FormularioCrearCentroCosto
      key={formulario}
      onReiniciar={() => setFormulario((n) => n + 1)}
    />
  );
};

export default CrearCentroCostoView;
