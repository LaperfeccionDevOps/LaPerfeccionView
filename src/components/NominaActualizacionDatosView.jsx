import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  PencilLine,
  RefreshCw,
  Save,
  Search,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  '';

const ENDPOINT_BASE = `${API_BASE_URL}/nomina-actualizacion-datos`;

const VALORES_INICIALES = {
  Email: '',
  Direccion: '',
  Barrio: '',
  IdLocalidad: '',
  Celular: '',
  TieneWhatsapp: false,
  NumeroWhatsapp: '',
  IdTipoEps: '',
  IdFondoPensiones: '',
};

const MAPEO_CAMPO = {
  CORREO: 'Email',
  DIRECCION: 'Direccion',
  BARRIO: 'Barrio',
  LOCALIDAD: 'IdLocalidad',
  TELEFONO: 'Celular',
  TIENE_WHATSAPP: 'TieneWhatsapp',
  NUMERO_WHATSAPP: 'NumeroWhatsapp',
  EPS: 'IdTipoEps',
  FONDO_PENSION: 'IdFondoPensiones',
};

const obtenerData = (respuesta) => {
  if (respuesta && Object.prototype.hasOwnProperty.call(respuesta, 'data')) {
    return respuesta.data;
  }

  return respuesta;
};

const obtenerLista = (respuesta, posiblesClaves = []) => {
  const data = obtenerData(respuesta);

  if (Array.isArray(data)) return data;

  for (const clave of posiblesClaves) {
    if (Array.isArray(data?.[clave])) return data[clave];
    if (Array.isArray(respuesta?.[clave])) return respuesta[clave];
  }

  return [];
};

const obtenerValor = (objeto, claves, valorDefecto = '') => {
  for (const clave of claves) {
    if (objeto?.[clave] !== undefined && objeto?.[clave] !== null) {
      return objeto[clave];
    }
  }

  return valorDefecto;
};

const normalizarTrabajadorBusqueda = (item) => ({
  idRegistroPersonal: Number(
    obtenerValor(item, ['IdRegistroPersonal', 'idRegistroPersonal', 'id'], 0),
  ),
  identificacion: String(
    obtenerValor(item, ['NumeroIdentificacion', 'numeroIdentificacion', 'Identificacion', 'identificacion'], ''),
  ),
  nombre: String(
    obtenerValor(
      item,
      ['NombreCompleto', 'nombreCompleto', 'Nombre', 'nombre'],
      `${obtenerValor(item, ['Nombres', 'nombres'], '')} ${obtenerValor(item, ['Apellidos', 'apellidos'], '')}`,
    ),
  ).trim(),
  estado: String(
    obtenerValor(item, ['EstadoProceso', 'estadoProceso', 'Estado', 'estado'], ''),
  ),
});

const normalizarDetalle = (respuesta) => {
  const data = obtenerData(respuesta) || {};
  const trabajador = data.Trabajador || data.trabajador || data;

  return {
    idRegistroPersonal: Number(
      obtenerValor(trabajador, ['IdRegistroPersonal', 'idRegistroPersonal'], 0),
    ),
    nombre: String(
      obtenerValor(
        trabajador,
        ['NombreCompleto', 'nombreCompleto', 'Nombre', 'nombre'],
        `${obtenerValor(trabajador, ['Nombres', 'nombres'], '')} ${obtenerValor(trabajador, ['Apellidos', 'apellidos'], '')}`,
      ),
    ).trim(),
    identificacion: String(
      obtenerValor(
        trabajador,
        ['NumeroIdentificacion', 'numeroIdentificacion', 'Identificacion', 'identificacion'],
        '',
      ),
    ),
    Email: obtenerValor(trabajador, ['Email', 'email', 'Correo', 'correo'], '') ?? '',
    Direccion: obtenerValor(trabajador, ['Direccion', 'direccion'], '') ?? '',
    Barrio: obtenerValor(trabajador, ['Barrio', 'barrio'], '') ?? '',
    IdLocalidad: obtenerValor(trabajador, ['IdLocalidad', 'idLocalidad'], '') ?? '',
    Celular: obtenerValor(trabajador, ['Celular', 'celular', 'Telefono', 'telefono'], '') ?? '',
    TieneWhatsapp: Boolean(
      obtenerValor(trabajador, ['TieneWhatsapp', 'tieneWhatsapp'], false),
    ),
    NumeroWhatsapp:
      obtenerValor(trabajador, ['NumeroWhatsapp', 'numeroWhatsapp'], '') ?? '',
    IdTipoEps: obtenerValor(trabajador, ['IdTipoEps', 'idTipoEps'], '') ?? '',
    IdFondoPensiones:
      obtenerValor(trabajador, ['IdFondoPensiones', 'idFondoPensiones'], '') ?? '',
  };
};

const normalizarCatalogos = (respuesta) => {
  const data = obtenerData(respuesta) || {};

  return {
    localidades:
      data.Localidades ||
      data.localidades ||
      respuesta?.Localidades ||
      respuesta?.localidades ||
      [],
    eps:
      data.EPS ||
      data.Eps ||
      data.eps ||
      data.TipoEps ||
      data.tipoEps ||
      respuesta?.EPS ||
      respuesta?.eps ||
      [],
    fondos:
      data.FondosPension ||
      data.FondosPensiones ||
      data.fondosPension ||
      data.fondosPensiones ||
      data.Fondos ||
      data.fondos ||
      respuesta?.FondosPension ||
      respuesta?.FondosPensiones ||
      respuesta?.fondosPension ||
      respuesta?.fondosPensiones ||
      [],
  };
};

const obtenerIdCatalogo = (item, tipo) => {
  const claves =
    tipo === 'localidad'
      ? ['IdLocalidad', 'idLocalidad', 'Id', 'id']
      : tipo === 'eps'
        ? ['IdTipoEps', 'idTipoEps', 'IdEps', 'idEps', 'Id', 'id']
        : ['IdFondoPensiones', 'idFondoPensiones', 'IdFondoPension', 'idFondoPension', 'Id', 'id'];

  return obtenerValor(item, claves, '');
};

const obtenerNombreCatalogo = (item, tipo) => {
  const claves =
    tipo === 'localidad'
      ? ['NombreLocalidad', 'nombreLocalidad', 'Nombre', 'nombre', 'Descripcion', 'descripcion']
      : tipo === 'eps'
        ? ['NombreEps', 'nombreEps', 'NombreEPS', 'Nombre', 'nombre', 'Descripcion', 'descripcion']
        : ['NombreFondoPensiones', 'nombreFondoPensiones', 'NombreFondo', 'nombreFondo', 'Nombre', 'nombre', 'Descripcion', 'descripcion'];

  return String(obtenerValor(item, claves, 'Sin nombre'));
};

const valorComparable = (valor, tipo) => {
  if (tipo === 'boolean') return Boolean(valor);
  if (tipo === 'number') {
    if (valor === '' || valor === null || valor === undefined) return null;
    return Number(valor);
  }

  return valor ?? '';
};

const NominaActualizacionDatosView = () => {
  const { user } = useAuth();

  const [campos, setCampos] = useState([]);
  const [catalogos, setCatalogos] = useState({
    localidades: [],
    eps: [],
    fondos: [],
  });

  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [trabajador, setTrabajador] = useState(null);

  const [formulario, setFormulario] = useState(VALORES_INICIALES);
  const [original, setOriginal] = useState(VALORES_INICIALES);

  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [cargandoTrabajador, setCargandoTrabajador] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [actualizacionExitosa, setActualizacionExitosa] = useState(null);

  const token = localStorage.getItem('token');

  const headersBase = useMemo(
    () => ({
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  );

  const usuarioActualizacion =
    String(user?.name || user?.nombre || user?.username || user?.email || 'NOMINA').trim();

  const camposOrdenados = useMemo(
    () =>
      [...campos]
        .filter((campo) => campo?.Activo !== false && campo?.activo !== false)
        .sort(
          (a, b) =>
            Number(a?.Orden ?? a?.orden ?? 0) -
            Number(b?.Orden ?? b?.orden ?? 0),
        ),
    [campos],
  );

  const cargarConfiguracion = async () => {
    setCargandoInicial(true);
    setError('');

    try {
      const [responseCampos, responseCatalogos] = await Promise.all([
        fetch(`${ENDPOINT_BASE}/campos`, {
          method: 'GET',
          headers: headersBase,
        }),
        fetch(`${ENDPOINT_BASE}/catalogos`, {
          method: 'GET',
          headers: headersBase,
        }),
      ]);

      const dataCampos = await responseCampos.json().catch(() => ({}));
      const dataCatalogos = await responseCatalogos.json().catch(() => ({}));

      if (!responseCampos.ok) {
        throw new Error(
          dataCampos?.detail ||
            dataCampos?.message ||
            'No fue posible consultar la configuración de campos.',
        );
      }

      if (!responseCatalogos.ok) {
        throw new Error(
          dataCatalogos?.detail ||
            dataCatalogos?.message ||
            'No fue posible consultar los catálogos.',
        );
      }

      setCampos(
        obtenerLista(dataCampos, [
          'campos',
          'Campos',
          'items',
          'Items',
        ]),
      );

      setCatalogos(normalizarCatalogos(dataCatalogos));
    } catch (err) {
      console.error('Error cargando Actualización de Datos:', err);
      setError(err.message || 'No fue posible cargar la pantalla.');
    } finally {
      setCargandoInicial(false);
    }
  };

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const buscarTrabajadores = async () => {
    const q = busqueda.trim();

    setMensaje('');
    setError('');
    setTrabajador(null);
    setResultados([]);

    if (!q) {
      setError('Ingresa el número de identificación o el nombre del trabajador.');
      return;
    }

    setBuscando(true);

    try {
      const response = await fetch(
        `${ENDPOINT_BASE}/trabajadores/buscar?q=${encodeURIComponent(q)}`,
        {
          method: 'GET',
          headers: headersBase,
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            'No fue posible buscar trabajadores.',
        );
      }

      const lista = obtenerLista(data, [
        'trabajadores',
        'Trabajadores',
        'resultados',
        'Resultados',
        'items',
        'Items',
      ]).map(normalizarTrabajadorBusqueda);

      setResultados(lista);

      if (lista.length === 0) {
        setMensaje('No se encontraron trabajadores habilitados con ese criterio.');
      }
    } catch (err) {
      console.error('Error buscando trabajadores:', err);
      setError(err.message || 'Error consultando trabajadores.');
    } finally {
      setBuscando(false);
    }
  };

  const cargarTrabajador = async (idRegistroPersonal) => {
    if (!idRegistroPersonal) return;

    setCargandoTrabajador(true);
    setMensaje('');
    setError('');

    try {
      const response = await fetch(
        `${ENDPOINT_BASE}/trabajadores/${idRegistroPersonal}`,
        {
          method: 'GET',
          headers: headersBase,
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            'No fue posible consultar los datos del trabajador.',
        );
      }

      const detalle = normalizarDetalle(data);

      const valores = {
        Email: detalle.Email,
        Direccion: detalle.Direccion,
        Barrio: detalle.Barrio,
        IdLocalidad: detalle.IdLocalidad,
        Celular: detalle.Celular,
        TieneWhatsapp: detalle.TieneWhatsapp,
        NumeroWhatsapp: detalle.NumeroWhatsapp,
        IdTipoEps: detalle.IdTipoEps,
        IdFondoPensiones: detalle.IdFondoPensiones,
      };

      setTrabajador(detalle);
      setFormulario(valores);
      setOriginal(valores);
      setResultados([]);
    } catch (err) {
      console.error('Error cargando trabajador:', err);
      setError(err.message || 'Error consultando los datos del trabajador.');
    } finally {
      setCargandoTrabajador(false);
    }
  };

  const actualizarCampo = (campo, valor) => {
    setMensaje('');
    setError('');

    if (campo === 'TieneWhatsapp') {
      const tieneWhatsapp = valor === true || valor === 'true';

      setFormulario((prev) => ({
        ...prev,
        TieneWhatsapp: tieneWhatsapp,
        NumeroWhatsapp: tieneWhatsapp ? prev.NumeroWhatsapp : '',
      }));

      return;
    }

    setFormulario((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const cambiosPendientes = useMemo(() => {
    const cambios = {};

    const comparar = (campo, tipo = 'text') => {
      const nuevo = valorComparable(formulario[campo], tipo);
      const anterior = valorComparable(original[campo], tipo);

      if (nuevo !== anterior) {
        cambios[campo] = nuevo;
      }
    };

    comparar('Email');
    comparar('Direccion');
    comparar('Barrio');
    comparar('IdLocalidad', 'number');
    comparar('Celular');
    comparar('TieneWhatsapp', 'boolean');

    if (formulario.TieneWhatsapp === false) {
      const numeroAnterior = original.NumeroWhatsapp ?? '';

      if (numeroAnterior !== '') {
        cambios.NumeroWhatsapp = null;
      }
    } else {
      comparar('NumeroWhatsapp');
    }

    comparar('IdTipoEps', 'number');
    comparar('IdFondoPensiones', 'number');

    return cambios;
  }, [formulario, original]);

  const cantidadCambios = Object.keys(cambiosPendientes).length;

  const guardarCambios = async () => {
    if (!trabajador?.idRegistroPersonal) {
      setError('Selecciona un trabajador antes de guardar.');
      return;
    }

    if (cantidadCambios === 0) {
      setMensaje('No hay cambios pendientes por guardar.');
      return;
    }

    setGuardando(true);
    setMensaje('');
    setError('');
    setActualizacionExitosa(null);

    try {
      const body = {
        ...cambiosPendientes,
        UsuarioActualizacion: usuarioActualizacion,
      };

      const response = await fetch(
        `${ENDPOINT_BASE}/trabajadores/${trabajador.idRegistroPersonal}`,
        {
          method: 'PUT',
          headers: {
            ...headersBase,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            'No fue posible guardar la actualización.',
        );
      }

      const cantidad =
        data?.cantidadCambios ??
        data?.CantidadCambios ??
        data?.data?.cantidadCambios ??
        cantidadCambios;

      await cargarTrabajador(trabajador.idRegistroPersonal);

      setActualizacionExitosa({
        cantidad,
        mensaje:
          data?.message ||
          'Los datos del trabajador fueron actualizados correctamente.',
      });
    } catch (err) {
      console.error('Error guardando Actualización de Datos:', err);
      setError(err.message || 'Error guardando la actualización.');
    } finally {
      setGuardando(false);
    }
  };

  const limpiarSeleccion = () => {
    setTrabajador(null);
    setResultados([]);
    setBusqueda('');
    setFormulario(VALORES_INICIALES);
    setOriginal(VALORES_INICIALES);
    setMensaje('');
    setError('');
    setActualizacionExitosa(null);
  };

  const renderCampo = (campoConfig) => {
    const codigo = String(
      campoConfig?.CodigoCampo ?? campoConfig?.codigoCampo ?? '',
    ).toUpperCase();

    const nombre =
      campoConfig?.NombreCampo ??
      campoConfig?.nombreCampo ??
      codigo;

    const soloLectura =
      Boolean(campoConfig?.SoloLectura ?? campoConfig?.soloLectura) ||
      codigo === 'NOMBRE' ||
      codigo === 'IDENTIFICACION';

    if (codigo === 'NOMBRE') {
      return (
        <label key={codigo} className="block">
          <span className="text-sm font-semibold text-gray-700">{nombre}</span>
          <Input
            value={trabajador?.nombre || ''}
            readOnly
            disabled
            className="mt-2 bg-gray-100 text-gray-600"
          />
        </label>
      );
    }

    if (codigo === 'IDENTIFICACION') {
      return (
        <label key={codigo} className="block">
          <span className="text-sm font-semibold text-gray-700">{nombre}</span>
          <Input
            value={trabajador?.identificacion || ''}
            readOnly
            disabled
            className="mt-2 bg-gray-100 text-gray-600"
          />
        </label>
      );
    }

    const campoFormulario = MAPEO_CAMPO[codigo];

    if (!campoFormulario) return null;

    if (codigo === 'LOCALIDAD') {
      return (
        <label key={codigo} className="block">
          <span className="text-sm font-semibold text-gray-700">{nombre}</span>
          <select
            value={formulario.IdLocalidad ?? ''}
            onChange={(e) => actualizarCampo('IdLocalidad', e.target.value)}
            disabled={soloLectura || guardando}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-emerald-500 disabled:bg-gray-100"
          >
            <option value="">Seleccionar localidad</option>
            {catalogos.localidades.map((item) => {
              const id = obtenerIdCatalogo(item, 'localidad');
              return (
                <option key={id} value={id}>
                  {obtenerNombreCatalogo(item, 'localidad')}
                </option>
              );
            })}
          </select>
        </label>
      );
    }

    if (codigo === 'EPS') {
      return (
        <label key={codigo} className="block">
          <span className="text-sm font-semibold text-gray-700">{nombre}</span>
          <select
            value={formulario.IdTipoEps ?? ''}
            onChange={(e) => actualizarCampo('IdTipoEps', e.target.value)}
            disabled={soloLectura || guardando}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-emerald-500 disabled:bg-gray-100"
          >
            <option value="">Sin EPS / seleccionar</option>
            {catalogos.eps.map((item) => {
              const id = obtenerIdCatalogo(item, 'eps');
              return (
                <option key={id} value={id}>
                  {obtenerNombreCatalogo(item, 'eps')}
                </option>
              );
            })}
          </select>
        </label>
      );
    }

    if (codigo === 'FONDO_PENSION') {
      return (
        <label key={codigo} className="block">
          <span className="text-sm font-semibold text-gray-700">{nombre}</span>
          <select
            value={formulario.IdFondoPensiones ?? ''}
            onChange={(e) => actualizarCampo('IdFondoPensiones', e.target.value)}
            disabled={soloLectura || guardando}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-emerald-500 disabled:bg-gray-100"
          >
            <option value="">Sin fondo / seleccionar</option>
            {catalogos.fondos.map((item) => {
              const id = obtenerIdCatalogo(item, 'fondo');
              return (
                <option key={id} value={id}>
                  {obtenerNombreCatalogo(item, 'fondo')}
                </option>
              );
            })}
          </select>
        </label>
      );
    }

    if (codigo === 'TIENE_WHATSAPP') {
      return (
        <label key={codigo} className="block">
          <span className="text-sm font-semibold text-gray-700">{nombre}</span>
          <select
            value={formulario.TieneWhatsapp ? 'true' : 'false'}
            onChange={(e) => actualizarCampo('TieneWhatsapp', e.target.value)}
            disabled={soloLectura || guardando}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-emerald-500 disabled:bg-gray-100"
          >
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </label>
      );
    }

    const deshabilitadoWhatsapp =
      codigo === 'NUMERO_WHATSAPP' && !formulario.TieneWhatsapp;

    return (
      <label key={codigo} className="block">
        <span className="text-sm font-semibold text-gray-700">{nombre}</span>
        <Input
          type={codigo === 'CORREO' ? 'email' : 'text'}
          value={formulario[campoFormulario] ?? ''}
          onChange={(e) => actualizarCampo(campoFormulario, e.target.value)}
          readOnly={soloLectura}
          disabled={soloLectura || deshabilitadoWhatsapp || guardando}
          placeholder={
            deshabilitadoWhatsapp
              ? 'Deshabilitado porque no tiene WhatsApp'
              : `Ingresa ${String(nombre).toLowerCase()}`
          }
          className={`mt-2 ${
            soloLectura || deshabilitadoWhatsapp
              ? 'bg-gray-100 text-gray-600'
              : ''
          }`}
        />
      </label>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-2xl border bg-white p-6 shadow-md">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
            <PencilLine className="h-7 w-7" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Actualización de Datos
            </h1>
            <p className="text-sm text-gray-500">
              Consulta y actualiza la información permitida de los trabajadores.
            </p>
          </div>
        </div>
      </div>

      {cargandoInicial ? (
        <div className="rounded-2xl border bg-white p-10 text-center shadow-md">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm font-semibold text-gray-600">
            Cargando configuración...
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border bg-white p-6 shadow-md">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                Buscar trabajador
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Busca por número de identificación o nombre.
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row">
              <Input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') buscarTrabajadores();
                }}
                placeholder="Ejemplo: 1012345678 o nombre del trabajador"
                className="flex-1"
                disabled={buscando || cargandoTrabajador}
              />

              <Button
                type="button"
                onClick={buscarTrabajadores}
                disabled={buscando || cargandoTrabajador}
              >
                {buscando ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                {buscando ? 'Buscando...' : 'Buscar'}
              </Button>

              {(trabajador || busqueda) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={limpiarSeleccion}
                  disabled={buscando || cargandoTrabajador || guardando}
                >
                  <X className="mr-2 h-4 w-4" />
                  Limpiar
                </Button>
              )}
            </div>

            {resultados.length > 0 && (
              <div className="mt-5 overflow-hidden rounded-2xl border">
                <div className="border-b bg-gray-50 px-4 py-3">
                  <p className="text-sm font-bold text-gray-700">
                    Resultados encontrados
                  </p>
                </div>

                <div className="divide-y">
                  {resultados.map((item) => (
                    <button
                      key={item.idRegistroPersonal}
                      type="button"
                      onClick={() => cargarTrabajador(item.idRegistroPersonal)}
                      className="flex w-full flex-col gap-1 px-4 py-4 text-left transition hover:bg-emerald-50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-bold text-gray-800">
                          {item.nombre || 'Sin nombre'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Identificación: {item.identificacion || 'Sin información'}
                        </p>
                      </div>

                      <span className="mt-2 text-sm font-semibold text-emerald-700 sm:mt-0">
                        Seleccionar
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {cargandoTrabajador && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                Consultando información del trabajador...
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {mensaje && (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{mensaje}</p>
            </div>
          )}

          {actualizacionExitosa && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
              <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="titulo-actualizacion-exitosa"
                className="w-full max-w-xl rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-2xl"
              >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-12 w-12" />
                </div>

                <h2
                  id="titulo-actualizacion-exitosa"
                  className="mt-5 text-2xl font-bold text-gray-900"
                >
                  Actualización exitosa
                </h2>

                <p className="mt-3 text-base text-gray-600">
                  {actualizacionExitosa.mensaje}
                </p>

                <p className="mt-2 text-sm font-semibold text-emerald-700">
                  Campos actualizados: {actualizacionExitosa.cantidad}
                </p>

                <Button
                  type="button"
                  onClick={() => setActualizacionExitosa(null)}
                  className="mt-7 min-w-[180px]"
                >
                  Aceptar
                </Button>
              </div>
            </div>
          )}

          {trabajador && (
            <div className="rounded-2xl border bg-white p-6 shadow-md">
              <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
                    <Search className="h-6 w-6" />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-gray-800">
                      {trabajador.nombre || 'Trabajador'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Identificación: {trabajador.identificacion || 'Sin información'}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => cargarTrabajador(trabajador.idRegistroPersonal)}
                  disabled={cargandoTrabajador || guardando}
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${
                      cargandoTrabajador ? 'animate-spin' : ''
                    }`}
                  />
                  Recargar
                </Button>
              </div>

              <div className="mt-6">
                <h3 className="font-bold text-gray-800">
                  Información del trabajador
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Nombre e identificación son únicamente de consulta. Los demás
                  campos habilitados pueden actualizarse.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                {camposOrdenados.map(renderCampo)}
              </div>

              <div className="mt-7 flex flex-col gap-4 rounded-2xl border bg-gray-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-gray-800">
                    Cambios pendientes: {cantidadCambios}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Solo se enviarán al backend los campos que realmente fueron modificados.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={guardarCambios}
                  disabled={guardando || cantidadCambios === 0}
                  className="min-w-[180px]"
                >
                  {guardando ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NominaActualizacionDatosView;
