import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Search,
  TrendingDown,
  Users,
} from 'lucide-react';

const PanelGerencialRRLLView = () => {
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('mes');
  const [fechaInicial, setFechaInicial] = useState('');
  const [fechaFinal, setFechaFinal] = useState('');
  const [sedeSeleccionada, setSedeSeleccionada] = useState('');
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('todos');
  const [idRegistroPersonal, setIdRegistroPersonal] = useState('');
  const [textoBusquedaTrabajador, setTextoBusquedaTrabajador] = useState('');
  const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState(null);
  const [resultadosTrabajadores, setResultadosTrabajadores] = useState([]);
  const [buscandoTrabajador, setBuscandoTrabajador] = useState(false);
  const [mostrarResultadosTrabajador, setMostrarResultadosTrabajador] =
    useState(false);
  const [errorBusquedaTrabajador, setErrorBusquedaTrabajador] = useState('');
  const contenedorTrabajadorRef = useRef(null);
  const [datosPanel, setDatosPanel] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorConsulta, setErrorConsulta] = useState('');
  const [fechaUltimaConsulta, setFechaUltimaConsulta] = useState(null);

  const [gestionMensual, setGestionMensual] = useState(null);
  const [analisisMes, setAnalisisMes] = useState('');
  const [planAccion, setPlanAccion] = useState('');
  const [analisisGuardado, setAnalisisGuardado] = useState('');
  const [planAccionGuardado, setPlanAccionGuardado] = useState('');
  const [calificacionMensual, setCalificacionMensual] = useState('');
  const [calificacionGuardada, setCalificacionGuardada] = useState('');
  const [cargandoGestion, setCargandoGestion] = useState(false);
  const [guardandoGestion, setGuardandoGestion] = useState(false);
  const [guardandoCalificacion, setGuardandoCalificacion] = useState(false);
  const [errorGestion, setErrorGestion] = useState('');
  const [mensajeGestion, setMensajeGestion] = useState('');

  const periodos = [
    { id: 'hoy', label: 'Hoy' },
    { id: 'semana', label: 'Esta semana' },
    { id: 'mes', label: 'Este mes' },
    { id: 'anio', label: 'Este año' },
    { id: 'todos', label: 'Histórico' },
    { id: 'personalizado', label: 'Personalizado' },
  ];

  const formatearNumero = (valor, decimales = 0) =>
    Number(valor ?? 0).toLocaleString('es-CO', {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
    });

  const formatearCantidad = (cantidad, singular, plural) => {
    const valor = Number(cantidad ?? 0);
    return `${formatearNumero(valor)} ${valor === 1 ? singular : plural}`;
  };

  const formatearFechaHora = (fecha) => {
    if (!fecha) {
      return '—';
    }

    try {
      return new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Bogota',
      }).format(new Date(fecha));
    } catch {
      return String(fecha);
    }
  };

  const formatearDuracion = (dias) => {
    const valorDias = Number(dias ?? 0);

    if (!Number.isFinite(valorDias) || valorDias <= 0) {
      return '0 min';
    }

    const totalMinutos = Math.round(valorDias * 24 * 60);
    const diasCompletos = Math.floor(totalMinutos / 1440);
    const minutosRestantesDia = totalMinutos % 1440;
    const horas = Math.floor(minutosRestantesDia / 60);
    const minutos = minutosRestantesDia % 60;

    if (diasCompletos > 0) {
      return `${diasCompletos} ${
        diasCompletos === 1 ? 'día' : 'días'
      } ${horas} h ${minutos} min`;
    }

    if (horas > 0) {
      return `${horas} h ${minutos} min`;
    }

    return `${minutos} min`;
  };

  const periodoMostrado = useMemo(() => {
    const hoy = new Date();

    const formatoMes = new Intl.DateTimeFormat('es-CO', {
      month: 'long',
      year: 'numeric',
    });

    const formatoFecha = new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    if (periodoSeleccionado === 'hoy') {
      return formatoFecha.format(hoy);
    }

    if (periodoSeleccionado === 'semana') {
      const inicioSemana = new Date(hoy);
      const diaSemana = hoy.getDay() === 0 ? 7 : hoy.getDay();
      inicioSemana.setDate(hoy.getDate() - diaSemana + 1);

      return `${formatoFecha.format(inicioSemana)} al ${formatoFecha.format(
        hoy
      )}`;
    }

    if (periodoSeleccionado === 'mes') {
      return formatoMes.format(hoy);
    }

    if (periodoSeleccionado === 'anio') {
      return String(hoy.getFullYear());
    }

    if (periodoSeleccionado === 'todos') {
      return 'Histórico completo';
    }

    if (fechaInicial && fechaFinal) {
      const inicio = new Date(`${fechaInicial}T00:00:00`);
      const fin = new Date(`${fechaFinal}T00:00:00`);

      return `${formatoFecha.format(inicio)} al ${formatoFecha.format(fin)}`;
    }

    return 'Seleccione las fechas';
  }, [periodoSeleccionado, fechaInicial, fechaFinal]);

  const periodoMensualSeleccionado = useMemo(() => {
    if (periodoSeleccionado === 'mes') {
      const hoy = new Date();

      return {
        anio: hoy.getFullYear(),
        mes: hoy.getMonth() + 1,
      };
    }

    if (
      periodoSeleccionado !== 'personalizado' ||
      !fechaInicial ||
      !fechaFinal
    ) {
      return null;
    }

    const periodoInicio = String(fechaInicial).substring(0, 7);
    const periodoFin = String(fechaFinal).substring(0, 7);

    if (
      periodoInicio.length !== 7 ||
      periodoFin.length !== 7 ||
      periodoInicio !== periodoFin
    ) {
      return null;
    }

    const [anioTexto, mesTexto] = periodoInicio.split('-');
    const anio = Number(anioTexto);
    const mes = Number(mesTexto);

    if (!anio || !mes || mes < 1 || mes > 12) {
      return null;
    }

    return {
      anio,
      mes,
    };
  }, [
    periodoSeleccionado,
    fechaInicial,
    fechaFinal,
  ]);

  const seleccionarPeriodo = (periodo) => {
    setPeriodoSeleccionado(periodo);
    limpiarGestionMensual();

    if (periodo !== 'personalizado') {
      setFechaInicial('');
      setFechaFinal('');
    }
  };

  const obtenerUrlPanel = () => {
    const baseApi =
      import.meta.env.VITE_API_URL ||
      import.meta.env.VITE_API_BASE_URL ||
      'http://127.0.0.1:8000/api';

    const baseLimpia = baseApi.replace(/\/$/, '');

    return baseLimpia.endsWith('/api')
      ? `${baseLimpia}/panel-gerencial-rrll`
      : `${baseLimpia}/api/panel-gerencial-rrll`;
  };


  const obtenerUrlBusquedaTrabajadores = () =>
    `${obtenerUrlPanel()}/buscar-trabajadores`;

  const obtenerBaseApi = () => {
    const baseApi =
      import.meta.env.VITE_API_URL ||
      import.meta.env.VITE_API_BASE_URL ||
      'http://127.0.0.1:8000/api';

    const baseLimpia = String(baseApi).replace(/\/$/, '');

    return baseLimpia.endsWith('/api')
      ? baseLimpia
      : `${baseLimpia}/api`;
  };

  useEffect(() => {
    const manejarClicFuera = (event) => {
      if (
        contenedorTrabajadorRef.current &&
        !contenedorTrabajadorRef.current.contains(event.target)
      ) {
        setMostrarResultadosTrabajador(false);
      }
    };

    document.addEventListener('mousedown', manejarClicFuera);

    return () => {
      document.removeEventListener('mousedown', manejarClicFuera);
    };
  }, []);

  useEffect(() => {
    const texto = textoBusquedaTrabajador.trim();

    if (trabajadorSeleccionado) {
      return undefined;
    }

    if (texto.length < 2) {
      setResultadosTrabajadores([]);
      setBuscandoTrabajador(false);
      setErrorBusquedaTrabajador('');
      return undefined;
    }

    const controlador = new AbortController();

    const temporizador = window.setTimeout(async () => {
      try {
        setBuscandoTrabajador(true);
        setErrorBusquedaTrabajador('');

        const parametros = new URLSearchParams();
        parametros.set('busqueda', texto);
        parametros.set('limite', '10');

        const respuesta = await fetch(
          `${obtenerUrlBusquedaTrabajadores()}?${parametros.toString()}`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
            signal: controlador.signal,
          }
        );

        if (!respuesta.ok) {
          let detalle = '';

          try {
            const cuerpoError = await respuesta.json();
            detalle =
              cuerpoError?.detail ||
              cuerpoError?.mensaje ||
              cuerpoError?.message ||
              '';
          } catch {
            detalle = '';
          }

          throw new Error(
            detalle ||
              `La búsqueda de trabajadores respondió con estado ${respuesta.status}.`
          );
        }

        const datos = await respuesta.json();
        const resultados = Array.isArray(datos?.resultados)
          ? datos.resultados
          : [];

        setResultadosTrabajadores(resultados);
        setMostrarResultadosTrabajador(true);
      } catch (error) {
        if (error?.name === 'AbortError') {
          return;
        }

        console.error('Error buscando trabajadores:', error);
        setResultadosTrabajadores([]);
        setMostrarResultadosTrabajador(true);
        setErrorBusquedaTrabajador(
          error instanceof Error
            ? error.message
            : 'No fue posible buscar trabajadores.'
        );
      } finally {
        if (!controlador.signal.aborted) {
          setBuscandoTrabajador(false);
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(temporizador);
      controlador.abort();
    };
  }, [textoBusquedaTrabajador, trabajadorSeleccionado]);

  const limpiarGestionMensual = () => {
    setGestionMensual(null);
    setAnalisisMes('');
    setPlanAccion('');
    setAnalisisGuardado('');
    setPlanAccionGuardado('');
    setCalificacionMensual('');
    setCalificacionGuardada('');
    setErrorGestion('');
    setMensajeGestion('');
  };

  const consultarGestionMensual = async (periodo) => {
    if (!periodo) {
      limpiarGestionMensual();
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      limpiarGestionMensual();
      setErrorGestion(
        'No fue posible consultar la gestión mensual porque no se encontró la sesión autenticada.'
      );
      return;
    }

    setCargandoGestion(true);
    setErrorGestion('');
    setMensajeGestion('');

    try {
      const url =
        `${obtenerBaseApi()}` +
        `/gestion-mensual-indicadores` +
        `/RRLL_RETIROS` +
        `/PANEL_GERENCIAL` +
        `/${periodo.anio}` +
        `/${periodo.mes}`;

      const respuesta = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const resultado = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          typeof resultado?.detail === 'string'
            ? resultado.detail
            : 'No fue posible consultar la gestión mensual del panel.'
        );
      }

      const analisisCargado =
        resultado?.gestionMensual?.analisisMes || '';
      const planCargado =
        resultado?.gestionMensual?.planAccion || '';
      const calificacionCargada =
        resultado?.gestionMensual?.calificacionMensual;

      const calificacionTexto =
        calificacionCargada !== null &&
        calificacionCargada !== undefined
          ? String(calificacionCargada)
          : '';

      setGestionMensual(resultado);
      setAnalisisMes(analisisCargado);
      setPlanAccion(planCargado);
      setCalificacionMensual(calificacionTexto);
      setAnalisisGuardado(analisisCargado);
      setPlanAccionGuardado(planCargado);
      setCalificacionGuardada(calificacionTexto);
    } catch (error) {
      console.error(
        'Error consultando gestión mensual del Panel Gerencial RRLL:',
        error
      );

      limpiarGestionMensual();
      setErrorGestion(
        error instanceof Error
          ? error.message
          : 'No fue posible consultar la gestión mensual del panel.'
      );
    } finally {
      setCargandoGestion(false);
    }
  };

  const guardarCamposGestionMensual = async (
    campos,
    { mostrarConfirmacion = true } = {}
  ) => {
    if (!periodoMensualSeleccionado || !gestionMensual) {
      return false;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      setErrorGestion(
        'No fue posible guardar porque no se encontró la sesión autenticada.'
      );
      setMensajeGestion('');
      return false;
    }

    setGuardandoGestion(true);
    setErrorGestion('');

    if (mostrarConfirmacion) {
      setMensajeGestion('');
    }

    try {
      const url =
        `${obtenerBaseApi()}` +
        `/gestion-mensual-indicadores` +
        `/RRLL_RETIROS` +
        `/PANEL_GERENCIAL` +
        `/${periodoMensualSeleccionado.anio}` +
        `/${periodoMensualSeleccionado.mes}` +
        `/gestion`;

      const respuesta = await fetch(url, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(campos),
      });

      const resultado = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          typeof resultado?.detail === 'string'
            ? resultado.detail
            : 'No fue posible guardar la gestión mensual.'
        );
      }

      const analisisCargado =
        resultado?.gestionMensual?.analisisMes || '';
      const planCargado =
        resultado?.gestionMensual?.planAccion || '';
      const calificacionCargada =
        resultado?.gestionMensual?.calificacionMensual;

      const calificacionTexto =
        calificacionCargada !== null &&
        calificacionCargada !== undefined
          ? String(calificacionCargada)
          : '';

      setGestionMensual(resultado);
      setAnalisisMes(analisisCargado);
      setPlanAccion(planCargado);
      setCalificacionMensual(calificacionTexto);
      setAnalisisGuardado(analisisCargado);
      setPlanAccionGuardado(planCargado);
      setCalificacionGuardada(calificacionTexto);

      if (mostrarConfirmacion) {
        setMensajeGestion(
          'La gestión mensual fue guardada correctamente.'
        );
      }

      return true;
    } catch (error) {
      console.error(
        'Error guardando gestión mensual del Panel Gerencial RRLL:',
        error
      );

      setErrorGestion(
        error instanceof Error
          ? error.message
          : 'No fue posible guardar la gestión mensual.'
      );

      return false;
    } finally {
      setGuardandoGestion(false);
    }
  };

  const guardarGestionMensual = async () => {
    if (!periodoMensualSeleccionado || !gestionMensual) {
      return;
    }

    const permisos = gestionMensual?.permisos || {};
    const body = {};

    const analisisActual = analisisMes.trim();
    const planActual = planAccion.trim();

    if (
      permisos.puedeEditarAnalisis &&
      analisisActual &&
      analisisActual !== analisisGuardado.trim()
    ) {
      body.analisisMes = analisisActual;
    }

    if (
      permisos.puedeEditarPlanAccion &&
      planActual &&
      planActual !== planAccionGuardado.trim()
    ) {
      body.planAccion = planActual;
    }

    if (Object.keys(body).length === 0) {
        setErrorGestion('');
        setMensajeGestion('Los cambios ya se encuentran guardados.');
        return;
      }

    await guardarCamposGestionMensual(body);
  };

  const guardarAnalisisAlSalir = async () => {
    if (
      !gestionMensual?.periodo?.esPeriodoActual ||
      !gestionMensual?.permisos?.puedeEditarAnalisis ||
      guardandoGestion
    ) {
      return;
    }

    const valorActual = analisisMes.trim();

    if (
      !valorActual ||
      valorActual === analisisGuardado.trim()
    ) {
      return;
    }

    await guardarCamposGestionMensual(
      { analisisMes: valorActual },
      { mostrarConfirmacion: false }
    );
  };

  const guardarPlanAccionAlSalir = async () => {
    if (
      !gestionMensual?.periodo?.esPeriodoActual ||
      !gestionMensual?.permisos?.puedeEditarPlanAccion ||
      guardandoGestion
    ) {
      return;
    }

    const valorActual = planAccion.trim();

    if (
      !valorActual ||
      valorActual === planAccionGuardado.trim()
    ) {
      return;
    }

    await guardarCamposGestionMensual(
      { planAccion: valorActual },
      { mostrarConfirmacion: false }
    );
  };

  const guardarCalificacionMensual = async () => {
    if (
      !periodoMensualSeleccionado ||
      !gestionMensual?.permisos?.puedeEditarCalificacion
    ) {
      return;
    }

    const valorTexto = String(calificacionMensual).trim();

    if (!valorTexto) {
      setErrorGestion(
        'Debe ingresar una calificación mensual entre 0 y 100.'
      );
      setMensajeGestion('');
      return;
    }

    const valorNumerico = Number(valorTexto.replace(',', '.'));

    if (
      Number.isNaN(valorNumerico) ||
      valorNumerico < 0 ||
      valorNumerico > 100
    ) {
      setErrorGestion(
        'La calificación mensual debe estar entre 0 y 100.'
      );
      setMensajeGestion('');
      return;
    }

    if (
      String(valorNumerico) ===
      String(calificacionGuardada).replace(',', '.')
    ) {
      setErrorGestion(
        'No hay cambios pendientes en la calificación.'
      );
      setMensajeGestion('');
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      setErrorGestion(
        'No fue posible guardar la calificación porque no se encontró la sesión autenticada.'
      );
      setMensajeGestion('');
      return;
    }

    setGuardandoCalificacion(true);
    setErrorGestion('');
    setMensajeGestion('');

    try {
      const url =
        `${obtenerBaseApi()}` +
        `/gestion-mensual-indicadores` +
        `/RRLL_RETIROS` +
        `/PANEL_GERENCIAL` +
        `/${periodoMensualSeleccionado.anio}` +
        `/${periodoMensualSeleccionado.mes}` +
        `/calificacion`;

      const respuesta = await fetch(url, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          calificacionMensual: valorNumerico,
        }),
      });

      const resultado = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          typeof resultado?.detail === 'string'
            ? resultado.detail
            : 'No fue posible guardar la calificación mensual.'
        );
      }

      const calificacionCargada =
        resultado?.gestionMensual?.calificacionMensual;
      const calificacionTexto =
        calificacionCargada !== null &&
        calificacionCargada !== undefined
          ? String(calificacionCargada)
          : '';

      setGestionMensual(resultado);
      setCalificacionMensual(calificacionTexto);
      setCalificacionGuardada(calificacionTexto);
      setMensajeGestion(
        'La calificación mensual fue guardada correctamente.'
      );
    } catch (error) {
      console.error(
        'Error guardando calificación mensual del Panel Gerencial RRLL:',
        error
      );

      setErrorGestion(
        error instanceof Error
          ? error.message
          : 'No fue posible guardar la calificación mensual.'
      );
    } finally {
      setGuardandoCalificacion(false);
    }
  };

  const limpiarFiltros = () => {
    setPeriodoSeleccionado('mes');
    setFechaInicial('');
    setFechaFinal('');
    setSedeSeleccionada('');
    setMotivoSeleccionado('todos');
    setIdRegistroPersonal('');
    setTextoBusquedaTrabajador('');
    setTrabajadorSeleccionado(null);
    setResultadosTrabajadores([]);
    setMostrarResultadosTrabajador(false);
    setErrorBusquedaTrabajador('');
    setDatosPanel(null);
    setErrorConsulta('');
    setFechaUltimaConsulta(null);
    limpiarGestionMensual();
  };

  const seleccionarTrabajador = (trabajador) => {
    setTrabajadorSeleccionado(trabajador);
    setIdRegistroPersonal(String(trabajador.idRegistroPersonal));
    setTextoBusquedaTrabajador(
      trabajador.textoMostrar ||
        `${trabajador.nombreCompleto} - CC ${trabajador.numeroIdentificacion}`
    );
    setResultadosTrabajadores([]);
    setMostrarResultadosTrabajador(false);
    setErrorBusquedaTrabajador('');
    setErrorConsulta('');
  };

  const limpiarTrabajadorSeleccionado = () => {
    setTrabajadorSeleccionado(null);
    setIdRegistroPersonal('');
    setTextoBusquedaTrabajador('');
    setResultadosTrabajadores([]);
    setMostrarResultadosTrabajador(false);
    setErrorBusquedaTrabajador('');
    setErrorConsulta('');
  };

  const manejarCambioBusquedaTrabajador = (event) => {
    const valor = event.target.value;

    setTextoBusquedaTrabajador(valor);
    setErrorConsulta('');

    if (trabajadorSeleccionado) {
      setTrabajadorSeleccionado(null);
      setIdRegistroPersonal('');
    }

    setMostrarResultadosTrabajador(valor.trim().length >= 2);
  };

  const consultarPanel = async () => {
    if (
      periodoSeleccionado === 'personalizado' &&
      (!fechaInicial || !fechaFinal)
    ) {
      setErrorConsulta(
        'Debe seleccionar la fecha inicial y la fecha final para consultar un periodo personalizado.'
      );
      return;
    }

    if (
      periodoSeleccionado === 'personalizado' &&
      fechaInicial > fechaFinal
    ) {
      setErrorConsulta(
        'La fecha inicial no puede ser mayor que la fecha final.'
      );
      return;
    }

    const idNormalizado = idRegistroPersonal.trim();

    if (
      textoBusquedaTrabajador.trim() &&
      !trabajadorSeleccionado &&
      !idNormalizado
    ) {
      setErrorConsulta(
        'Seleccione un trabajador de la lista de resultados antes de consultar.'
      );
      return;
    }

    try {
      setCargando(true);
      setErrorConsulta('');

      const parametros = new URLSearchParams();
      parametros.set('periodo', periodoSeleccionado);

      if (periodoSeleccionado === 'personalizado') {
        parametros.set('fechaInicial', fechaInicial);
        parametros.set('fechaFinal', fechaFinal);
      }

      const sedeNormalizada = sedeSeleccionada.trim();

      if (sedeNormalizada) {
        parametros.set('sede', sedeNormalizada);
      }

      if (motivoSeleccionado !== 'todos') {
        parametros.set('motivo', motivoSeleccionado);
      }

      if (idNormalizado) {
        parametros.set('idRegistroPersonal', idNormalizado);
      }

      const respuesta = await fetch(
        `${obtenerUrlPanel()}?${parametros.toString()}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!respuesta.ok) {
        let detalle = '';

        try {
          const cuerpoError = await respuesta.json();
          detalle =
            cuerpoError?.detail ||
            cuerpoError?.mensaje ||
            cuerpoError?.message ||
            '';
        } catch {
          detalle = '';
        }

        throw new Error(
          detalle || `La API respondió con estado ${respuesta.status}.`
        );
      }

      const datos = await respuesta.json();

      if (!datos?.ok) {
        throw new Error(
          datos?.mensaje || 'La consulta no devolvió una respuesta válida.'
        );
      }

      setDatosPanel(datos);
      setFechaUltimaConsulta(new Date());

      if (periodoMensualSeleccionado) {
        await consultarGestionMensual(
          periodoMensualSeleccionado
        );
      } else {
        limpiarGestionMensual();
      }
    } catch (error) {
      console.error('Error consultando Panel Gerencial RRLL:', error);
      setDatosPanel(null);
      setFechaUltimaConsulta(null);
      limpiarGestionMensual();
      setErrorConsulta(
        error instanceof Error
          ? error.message
          : 'No fue posible consultar el Panel Gerencial RRLL.'
      );
    } finally {
      setCargando(false);
    }
  };

  const indicadoresBackend = datosPanel?.indicadores || {};
  const detalleTiempoLaborado = datosPanel?.detalleTiempoLaborado || {};
  const detalleTiempoDesvinculacion =
    datosPanel?.detalleTiempoDesvinculacion || {};

  const rotacionTotal = Number(indicadoresBackend.rotacionTotal ?? 0);
  const retirosPeriodo = Number(indicadoresBackend.retirosPeriodo ?? 0);
  const rotacionVoluntaria = Number(
    indicadoresBackend.rotacionVoluntaria ?? 0
  );
  const terminaciones = Number(indicadoresBackend.terminaciones ?? 0);
  const nuncaIngreso = Number(indicadoresBackend.nuncaIngreso ?? 0);
  const abandonos = Number(indicadoresBackend.abandonos ?? 0);
  const pendientesRRLL = Number(indicadoresBackend.pendientesRRLL ?? 0);

  const tiempoLaboradoPromedioDias = Number(
    detalleTiempoLaborado.promedioDias ??
      indicadoresBackend.tiempoLaboradoPromedioDias ??
      0
  );

  const tiempoLaboradoPromedioMeses = Number(
    detalleTiempoLaborado.promedioMesesAproximado ?? 0
  );

  const registrosValidosTiempoLaborado = Number(
    detalleTiempoLaborado.registrosValidos ?? 0
  );

  const registrosSinFechaIngreso = Number(
    detalleTiempoLaborado.registrosSinFechaIngreso ?? 0
  );

  const registrosSinFechaRetiro = Number(
    detalleTiempoLaborado.registrosSinFechaRetiro ?? 0
  );

  const registrosFechaLaboralInconsistente = Number(
    detalleTiempoLaborado.registrosFechaInconsistente ?? 0
  );

  const registrosRetiroFuturo = Number(
    detalleTiempoLaborado.registrosRetiroFuturo ?? 0
  );

  const tiempoPromedioDesvinculacion = Number(
    detalleTiempoDesvinculacion.promedioDias ??
      indicadoresBackend.tiempoDesvinculacion ??
      0
  );

  const registrosValidosTiempo = Number(
    detalleTiempoDesvinculacion.registrosValidos ?? 0
  );

  const registrosExcluidosTiempo = Number(
    detalleTiempoDesvinculacion
      .registrosExcluidosFechaInconsistente ?? 0
  );

  const hallazgosOrdenados = useMemo(() => {
    const hallazgos = Array.isArray(datosPanel?.resumenEjecutivo)
      ? datosPanel.resumenEjecutivo
      : [];

    return [...hallazgos].sort(
      (hallazgoA, hallazgoB) =>
        Number(hallazgoA?.prioridad ?? 0) -
        Number(hallazgoB?.prioridad ?? 0)
    );
  }, [datosPanel]);

  const alertasResumen = hallazgosOrdenados.filter(
    (hallazgo) => hallazgo.tipo === 'alerta'
  );

  const informativosResumen = hallazgosOrdenados.filter(
    (hallazgo) => hallazgo.tipo !== 'alerta'
  );

  const totalHallazgos = hallazgosOrdenados.length;

  const descripcionResumen =
    datosPanel === null
      ? 'Realice una consulta para generar la lectura automática del periodo.'
      : totalHallazgos === 0
        ? 'No se encontraron hallazgos relevantes para los filtros seleccionados.'
        : `Se identificaron ${formatearCantidad(
            alertasResumen.length,
            'alerta',
            'alertas'
          )} y ${formatearCantidad(
            informativosResumen.length,
            'hallazgo informativo',
            'hallazgos informativos'
          )}.`;

  const clasificacionRetiros = Array.isArray(datosPanel?.clasificacion)
    ? datosPanel.clasificacion
    : [];

  const sedesRetiro = Array.isArray(datosPanel?.sedes)
    ? datosPanel.sedes
    : [];

  const motivosRetiro = Array.isArray(datosPanel?.motivos)
    ? datosPanel.motivos
    : [];

  const sedeMayorRotacion = datosPanel?.sedeMayorRotacion || {
    nombre: 'SIN INFORMACIÓN',
    cantidad: 0,
    porcentaje: 0,
  };

  const indicadoresPrincipales = [
    {
      titulo: 'Rotación total',
      valor: datosPanel === null ? '—' : formatearNumero(rotacionTotal),
      descripcion:
        'Total de retiros clasificados en el periodo, sin duplicar categorías.',
      detalle: 'Voluntaria + terminaciones + nunca ingreso + abandonos',
      icono: TrendingDown,
      tipo: 'principal',
    },
    {
      titulo: 'Retiros del periodo',
      valor: datosPanel === null ? '—' : formatearNumero(retirosPeriodo),
      descripcion:
        'Cantidad de registros de retiro incluidos en el periodo y filtros seleccionados.',
      detalle: datosPanel?.periodoConsultado || 'Periodo sin consultar',
      icono: Users,
      tipo: 'normal',
    },
    {
      titulo: 'Rotación voluntaria',
      valor:
        datosPanel === null ? '—' : formatearNumero(rotacionVoluntaria),
      descripcion:
        'Retiros identificados como voluntarios dentro de la consulta.',
      detalle: formatearCantidad(
        rotacionVoluntaria,
        'caso',
        'casos'
      ),
      icono: CheckCircle2,
      tipo: 'normal',
    },
    {
      titulo: 'Terminaciones',
      valor: datosPanel === null ? '—' : formatearNumero(terminaciones),
      descripcion:
        'Terminaciones de contrato que no corresponden a abandono ni nunca ingreso.',
      detalle: formatearCantidad(terminaciones, 'caso', 'casos'),
      icono: Activity,
      tipo: 'normal',
    },
    {
      titulo: 'Nunca ingreso',
      valor: datosPanel === null ? '—' : formatearNumero(nuncaIngreso),
      descripcion:
        'Casos clasificados como personas que no iniciaron el vínculo laboral.',
      detalle: formatearCantidad(nuncaIngreso, 'caso', 'casos'),
      icono: Search,
      tipo: 'normal',
    },
    {
      titulo: 'Abandonos',
      valor: datosPanel === null ? '—' : formatearNumero(abandonos),
      descripcion:
        'Retiros cuyo motivo corresponde a abandono de cargo.',
      detalle: formatearCantidad(abandonos, 'caso', 'casos'),
      icono: AlertTriangle,
      tipo: abandonos > 0 ? 'alerta' : 'normal',
    },
    {
      titulo: 'Pendientes en RRLL',
      valor: datosPanel === null ? '—' : formatearNumero(pendientesRRLL),
      descripcion:
        'Fotografía actual de procesos abiertos pendientes de gestión en RRLL.',
      detalle: formatearCantidad(
        pendientesRRLL,
        'proceso pendiente',
        'procesos pendientes'
      ),
      icono: Activity,
      tipo: pendientesRRLL > 0 ? 'alerta' : 'normal',
    },
    {
      titulo: 'Tiempo laborado',
      valor:
        datosPanel === null
          ? '—'
          : registrosValidosTiempoLaborado === 0
            ? 'Sin datos'
            : `${formatearNumero(tiempoLaboradoPromedioDias, 2)} días`,
      descripcion:
        'Promedio entre la última fecha de ingreso disponible y la fecha de retiro.',
      detalle:
        registrosValidosTiempoLaborado === 0
          ? 'Sin registros válidos para calcular'
          : `${formatearNumero(
              tiempoLaboradoPromedioMeses,
              2
            )} meses aproximados`,
      icono: CalendarDays,
      tipo: 'normal',
    },
    {
      titulo: 'Tiempo total de desvinculación',
      valor:
        datosPanel === null
          ? '—'
          : registrosValidosTiempo === 0
            ? 'Sin datos'
            : formatearDuracion(tiempoPromedioDesvinculacion),
    descripcion:
      'Promedio transcurrido desde la carga del Paz y Salvo hasta la finalización definitiva del retiro por Nómina.',
      detalle:
        registrosValidosTiempo === 0
          ? 'Sin registros válidos para calcular'
          : formatearCantidad(
              registrosValidosTiempo,
              'registro válido',
              'registros válidos'
            ),
      icono: Clock3,
      tipo: 'normal',
    },
  ];

  const claseTarjetaIndicador = (tipo) => {
    if (tipo === 'alerta') {
      return {
        icono: 'bg-amber-100 text-amber-700',
        etiqueta: 'bg-amber-100 text-amber-700',
      };
    }

    if (tipo === 'principal') {
      return {
        icono: 'bg-emerald-700 text-white',
        etiqueta: 'bg-emerald-100 text-emerald-800',
      };
    }

    return {
      icono: 'bg-emerald-50 text-emerald-700',
      etiqueta: 'bg-slate-100 text-slate-600',
    };
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 xl:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Relaciones Laborales
              </p>

              <h1 className="mt-1 text-3xl font-bold text-slate-900 md:text-4xl">
                Panel Gerencial
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-slate-600 md:text-base">
                Análisis de rotación, retiros, pendientes, tiempos de gestión,
                motivos, clasificaciones y sedes.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Última actualización
              </p>

              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <CalendarDays className="h-4 w-4 text-emerald-700" />
                {fechaUltimaConsulta
                  ? new Intl.DateTimeFormat('es-CO', {
                      dateStyle: 'long',
                      timeStyle: 'short',
                    }).format(fechaUltimaConsulta)
                  : 'Pendiente de consulta'}
              </p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 md:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-emerald-700" />

                  <h2 className="text-lg font-bold text-slate-900">
                    Filtros de consulta
                  </h2>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Los filtros se combinan entre sí y se envían directamente al
                  backend.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                  Periodo seleccionado
                </p>

                <p className="mt-0.5 text-sm font-bold capitalize text-slate-900">
                  {periodoMostrado}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 md:p-6">
            <div className="flex flex-wrap gap-2">
              {periodos.map((periodo) => {
                const seleccionado =
                  periodoSeleccionado === periodo.id;

                return (
                  <button
                    key={periodo.id}
                    type="button"
                    onClick={() => seleccionarPeriodo(periodo.id)}
                    className={`inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-semibold transition ${
                      seleccionado
                        ? 'border-emerald-700 bg-emerald-700 text-white shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800'
                    }`}
                  >
                    {periodo.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {periodoSeleccionado === 'personalizado' && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      Fecha inicial
                    </label>

                    <input
                      type="date"
                      value={fechaInicial}
                      onChange={(event) =>
                        setFechaInicial(event.target.value)
                      }
                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      Fecha final
                    </label>

                    <input
                      type="date"
                      value={fechaFinal}
                      min={fechaInicial || undefined}
                      onChange={(event) =>
                        setFechaFinal(event.target.value)
                      }
                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Sede
                </label>

                <input
                  type="text"
                  value={sedeSeleccionada}
                  onChange={(event) =>
                    setSedeSeleccionada(event.target.value)
                  }
                  placeholder="Ej. COMPENSAR CL 94 RECREACION"
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Motivo
                </label>

                <select
                  value={motivoSeleccionado}
                  onChange={(event) =>
                    setMotivoSeleccionado(event.target.value)
                  }
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="todos">Todos los motivos</option>
                  <option value="rotacion-voluntaria">
                    Rotación voluntaria
                  </option>
                  <option value="terminacion">Terminación</option>
                  <option value="nunca-ingreso">Nunca ingreso</option>
                  <option value="abandono">Abandono</option>
                </select>
              </div>

              <div
                ref={contenedorTrabajadorRef}
                className="relative md:col-span-2 xl:col-span-1"
              >
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Trabajador
                </label>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="text"
                    value={textoBusquedaTrabajador}
                    onChange={manejarCambioBusquedaTrabajador}
                    onFocus={() => {
                      if (
                        !trabajadorSeleccionado &&
                        textoBusquedaTrabajador.trim().length >= 2
                      ) {
                        setMostrarResultadosTrabajador(true);
                      }
                    }}
                    placeholder="Buscar por nombre o identificación"
                    autoComplete="off"
                    className={`h-10 w-full rounded-xl border bg-white pl-9 pr-10 text-sm text-slate-800 outline-none transition focus:ring-2 ${
                      trabajadorSeleccionado
                        ? 'border-emerald-500 focus:border-emerald-600 focus:ring-emerald-100'
                        : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-100'
                    }`}
                  />

                  {(textoBusquedaTrabajador || trabajadorSeleccionado) && (
                    <button
                      type="button"
                      onClick={limpiarTrabajadorSeleccionado}
                      className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-lg font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Limpiar trabajador"
                      title="Limpiar trabajador"
                    >
                      ×
                    </button>
                  )}
                </div>

                {trabajadorSeleccionado && (
                  <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <p className="text-xs font-bold text-emerald-800">
                      Trabajador seleccionado
                    </p>

                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      {trabajadorSeleccionado.nombreCompleto}
                    </p>

                    <p className="text-xs text-slate-600">
                      CC {trabajadorSeleccionado.numeroIdentificacion}
                    </p>
                  </div>
                )}

                {!trabajadorSeleccionado &&
                  mostrarResultadosTrabajador && (
                    <div className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                      {buscandoTrabajador ? (
                        <div className="px-4 py-4 text-sm text-slate-500">
                          Buscando trabajadores...
                        </div>
                      ) : errorBusquedaTrabajador ? (
                        <div className="px-4 py-4 text-sm text-red-600">
                          {errorBusquedaTrabajador}
                        </div>
                      ) : resultadosTrabajadores.length > 0 ? (
                        resultadosTrabajadores.map((trabajador) => (
                          <button
                            key={trabajador.idRegistroPersonal}
                            type="button"
                            onClick={() =>
                              seleccionarTrabajador(trabajador)
                            }
                            className="block w-full border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-emerald-50"
                          >
                            <p className="text-sm font-bold text-slate-800">
                              {trabajador.nombreCompleto}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              CC {trabajador.numeroIdentificacion}
                            </p>
                          </button>
                        ))
                      ) : textoBusquedaTrabajador.trim().length >= 2 ? (
                        <div className="px-4 py-4 text-sm text-slate-500">
                          No se encontraron trabajadores con retiros
                          registrados.
                        </div>
                      ) : null}
                    </div>
                  )}

                {!trabajadorSeleccionado &&
                  textoBusquedaTrabajador.trim().length > 0 &&
                  textoBusquedaTrabajador.trim().length < 2 && (
                    <p className="mt-1.5 text-xs text-slate-500">
                      Escriba al menos 2 caracteres.
                    </p>
                  )}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={limpiarFiltros}
                disabled={cargando}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Limpiar filtros
              </button>

              <button
                type="button"
                onClick={consultarPanel}
                disabled={
                  cargando ||
                  (periodoSeleccionado === 'personalizado' &&
                    (!fechaInicial || !fechaFinal))
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Search className="h-4 w-4" />
                {cargando ? 'Consultando...' : 'Consultar panel'}
              </button>
            </div>
          </div>
        </section>

        {(datosPanel?.mensaje || errorConsulta) && (
          <section
            className={`rounded-2xl border px-5 py-4 text-sm font-semibold shadow-sm ${
              errorConsulta
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
          >
            <p>{errorConsulta || datosPanel?.mensaje}</p>

            {!errorConsulta && datosPanel?.periodoConsultado && (
              <p className="mt-1 text-xs font-medium">
                Periodo aplicado: {datosPanel.periodoConsultado} · Modo:{' '}
                {datosPanel.modo === 'individual'
                  ? 'consulta individual'
                  : 'consulta general'}
              </p>
            )}
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 px-5 py-5 text-white md:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                  <BarChart3 className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">
                    Lectura automática del periodo
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    Resumen ejecutivo
                  </h2>

                  <p className="mt-1 max-w-3xl text-sm leading-6 text-emerald-50">
                    {descripcionResumen}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold ring-1 ring-white/20">
                  <AlertTriangle className="h-4 w-4 text-amber-300" />
                  {formatearCantidad(
                    alertasResumen.length,
                    'alerta',
                    'alertas'
                  )}
                </span>

                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold ring-1 ring-white/20">
                  <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                  {formatearCantidad(
                    informativosResumen.length,
                    'informativo',
                    'informativos'
                  )}
                </span>

                <span className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-xs font-bold text-emerald-800">
                  {formatearCantidad(
                    totalHallazgos,
                    'hallazgo',
                    'hallazgos'
                  )}
                </span>
              </div>
            </div>
          </div>

          {datosPanel === null ? (
            <div className="p-8 text-center">
              <BarChart3 className="mx-auto h-8 w-8 text-slate-400" />

              <h3 className="mt-3 font-bold text-slate-800">
                Panel pendiente de consulta
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Seleccione los filtros y presione Consultar panel.
              </p>
            </div>
          ) : (
            <div className="grid gap-0 lg:grid-cols-2 lg:divide-x lg:divide-slate-200">
              <div className="p-5 md:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <AlertTriangle className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900">
                        Alertas y prioridades
                      </h3>

                      <p className="text-xs text-slate-500">
                        Situaciones que requieren seguimiento.
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                    {alertasResumen.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {alertasResumen.length > 0 ? (
                    alertasResumen.map((hallazgo) => (
                      <article
                        key={hallazgo.id}
                        className="rounded-xl border border-amber-200 bg-amber-50/60 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                          <div className="min-w-0">
                            <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700 shadow-sm ring-1 ring-amber-200">
                              {hallazgo.indicador}
                            </span>

                            <p className="mt-2 text-sm leading-6 text-slate-700">
                              {hallazgo.texto}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                      <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600" />

                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        No se identificaron alertas para esta consulta.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 p-5 md:p-6 lg:border-t-0">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900">
                        Hallazgos informativos
                      </h3>

                      <p className="text-xs text-slate-500">
                        Lectura general de los resultados consultados.
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    {informativosResumen.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {informativosResumen.length > 0 ? (
                    informativosResumen.map((hallazgo) => (
                      <article
                        key={hallazgo.id}
                        className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />

                          <div className="min-w-0">
                            <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700 shadow-sm ring-1 ring-emerald-200">
                              {hallazgo.indicador}
                            </span>

                            <p className="mt-2 text-sm leading-6 text-slate-700">
                              {hallazgo.texto}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                      <p className="text-sm font-semibold text-slate-700">
                        No hay hallazgos informativos para mostrar.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">
              Indicadores principales
            </h2>

            <p className="text-sm text-slate-500">
              Resultados recibidos directamente desde el backend.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {indicadoresPrincipales.map((indicador) => {
              const Icono = indicador.icono;
              const clases = claseTarjetaIndicador(indicador.tipo);

              return (
                <article
                  key={indicador.titulo}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-600">
                        {indicador.titulo}
                      </p>

                      <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
                        {indicador.valor}
                      </p>
                    </div>

                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${clases.icono}`}
                    >
                      <Icono className="h-5 w-5" />
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {indicador.descripcion}
                  </p>

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${clases.etiqueta}`}
                    >
                      {indicador.detalle}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Clasificación de los retiros
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Distribución porcentual de las clasificaciones consultadas.
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                Total: {formatearNumero(retirosPeriodo)}
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {clasificacionRetiros.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">
                  Sin clasificaciones para la consulta realizada.
                </p>
              ) : (
                clasificacionRetiros.map((item) => (
                  <div key={item.nombre}>
                    <div className="mb-2 flex items-end justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {item.nombre}
                        </p>

                        <p className="text-xs text-slate-500">
                          {formatearCantidad(
                            item.cantidad,
                            'caso',
                            'casos'
                          )}
                        </p>
                      </div>

                      <p className="text-xl font-bold text-slate-900">
                        {formatearNumero(item.porcentaje, 2)}%
                      </p>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-600"
                        style={{
                          width: `${Math.min(
                            Number(item.porcentaje ?? 0),
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Principales motivos de retiro
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Motivos con mayor participación dentro del periodo.
              </p>
            </div>

            <div className="mt-6 space-y-4">
              {motivosRetiro.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">
                  Sin motivos para la consulta realizada.
                </p>
              ) : (
                motivosRetiro.map((motivo, index) => (
                  <div
                    key={motivo.nombre}
                    className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-bold text-emerald-700 shadow-sm">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800">
                        {motivo.nombre}
                      </p>

                      <p className="text-xs text-slate-500">
                        {formatearCantidad(
                          motivo.cantidad,
                          'caso',
                          'casos'
                        )}
                      </p>
                    </div>

                    <p className="text-xl font-bold text-slate-900">
                      {formatearNumero(motivo.porcentaje, 2)}%
                    </p>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Sedes con más retiros
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Participación de cada sede dentro de los retiros consultados.
              </p>
            </div>

            {datosPanel !== null && (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Sede con mayor rotación
                </p>

                <p className="mt-1 font-bold text-slate-900">
                  {sedeMayorRotacion.nombre}
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {formatearCantidad(
                    sedeMayorRotacion.cantidad,
                    'retiro',
                    'retiros'
                  )}{' '}
                  · {formatearNumero(sedeMayorRotacion.porcentaje, 2)}%
                </p>
              </div>
            )}

            <div className="mt-6 space-y-5">
              {sedesRetiro.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">
                  Sin sedes para la consulta realizada.
                </p>
              ) : (
                sedesRetiro.map((sede) => (
                  <div key={sede.nombre}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {sede.nombre}
                        </p>

                        <p className="text-xs text-slate-500">
                          {formatearCantidad(
                            sede.cantidad,
                            'retiro',
                            'retiros'
                          )}
                        </p>
                      </div>

                      <p className="text-lg font-bold text-slate-900">
                        {formatearNumero(sede.porcentaje, 2)}%
                      </p>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-600"
                        style={{
                          width: `${Math.min(
                            Number(sede.porcentaje ?? 0),
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Calidad de fechas laborales
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Validaciones utilizadas para calcular el tiempo laborado.
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />

                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Registros válidos
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {datosPanel === null
                    ? '—'
                    : formatearNumero(registrosValidosTiempoLaborado)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <CalendarDays className="h-5 w-5 text-amber-600" />

                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Sin fecha de retiro
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {datosPanel === null
                    ? '—'
                    : formatearNumero(registrosSinFechaRetiro)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <CalendarDays className="h-5 w-5 text-amber-600" />

                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Sin fecha de ingreso
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {datosPanel === null
                    ? '—'
                    : formatearNumero(registrosSinFechaIngreso)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <AlertTriangle className="h-5 w-5 text-amber-600" />

                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Fechas inconsistentes
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {datosPanel === null
                    ? '—'
                    : formatearNumero(
                        registrosFechaLaboralInconsistente
                      )}
                </p>
              </div>
            </div>

            {datosPanel !== null && registrosRetiroFuturo > 0 && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Se identificaron{' '}
                {formatearCantidad(
                  registrosRetiroFuturo,
                  'retiro futuro',
                  'retiros futuros'
                )}{' '}
                excluidos del promedio.
              </div>
            )}
          </article>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
               Tiempo total de desvinculación
            </h2>

            <p className="mt-1 text-sm text-slate-500">
            Cálculo desde la carga del Paz y Salvo hasta la finalización definitiva
            del retiro por Nómina.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <Clock3 className="h-5 w-5 text-emerald-700" />

              <p className="mt-3 text-sm font-semibold text-slate-600">
                Tiempo promedio
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {datosPanel === null
                  ? '—'
                  : registrosValidosTiempo === 0
                    ? 'Sin datos'
                    : formatearDuracion(tiempoPromedioDesvinculacion)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-700" />

              <p className="mt-3 text-sm font-semibold text-slate-600">
                Registros válidos
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {datosPanel === null
                  ? '—'
                  : formatearNumero(registrosValidosTiempo)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-600" />

              <p className="mt-3 text-sm font-semibold text-slate-600">
                Fechas inconsistentes
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {datosPanel === null
                  ? '—'
                  : formatearNumero(registrosExcluidosTiempo)}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">
              Interpretación
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-700">
              {datosPanel === null
                ? 'Realice una consulta para calcular el tiempo total de desvinculación.'
                : registrosValidosTiempo === 0
                  ? 'No existen retiros finalizados por Nómina con Paz y Salvo y fechas válidas para calcular el promedio.'
                  : `El tiempo promedio fue de ${formatearDuracion(
                      tiempoPromedioDesvinculacion
                    )}, calculado con ${formatearCantidad(
                      registrosValidosTiempo,
                      'registro válido',
                      'registros válidos'
                    )}.`}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5 md:p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Estado general de los indicadores
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Resumen rápido de los principales resultados consultados.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Indicador
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Resultado
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Detalle
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Estado
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {indicadoresPrincipales.map((indicador) => (
                  <tr
                    key={indicador.titulo}
                    className="hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-800">
                      {indicador.titulo}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-slate-900">
                      {indicador.valor}
                    </td>

                    <td className="min-w-[260px] px-5 py-4 text-sm text-slate-600">
                      {indicador.detalle}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                          datosPanel === null
                            ? 'bg-slate-100 text-slate-600'
                            : indicador.tipo === 'alerta'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {datosPanel === null ? (
                          <Clock3 className="h-3.5 w-3.5" />
                        ) : indicador.tipo === 'alerta' ? (
                          <AlertTriangle className="h-3.5 w-3.5" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}

                        {datosPanel === null
                          ? 'Sin consultar'
                          : indicador.tipo === 'alerta'
                            ? 'Requiere seguimiento'
                            : 'Consultado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {datosPanel !== null && periodoMensualSeleccionado && (
          <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-sm">
            <div className="border-b border-emerald-100 bg-white px-5 py-5 md:px-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-bold text-emerald-700">
                    Gestión mensual del Panel Gerencial
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    Análisis, plan de acción y calificación mensual
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Información asociada exclusivamente al mes y año consultado en el Panel Gerencial de Retiros.
                  </p>
                </div>

                <div className="w-fit rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold capitalize text-emerald-800">
                  {new Intl.DateTimeFormat('es-CO', {
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'America/Bogota',
                  }).format(
                    new Date(
                      periodoMensualSeleccionado.anio,
                      periodoMensualSeleccionado.mes - 1,
                      1
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6">
              {cargandoGestion ? (
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                  Consultando gestión mensual...
                </div>
              ) : (
                <>
                  {errorGestion && (
                    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                      {errorGestion}
                    </div>
                  )}

                  {mensajeGestion && (
                    <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                      {mensajeGestion}
                    </div>
                  )}

                  {gestionMensual && (
                    <>
                      <div className="grid gap-5 xl:grid-cols-2">
                        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                          <div className="mb-3">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <label
                                htmlFor="analisisMesPanelRRLL"
                                className="text-sm font-bold text-slate-900"
                              >
                                Análisis del mes
                              </label>

                              <span
                                className={
                                  gestionMensual?.permisos?.puedeEditarAnalisis
                                    ? 'w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700'
                                    : 'w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600'
                                }
                              >
                                {gestionMensual?.permisos?.puedeEditarAnalisis
                                  ? gestionMensual?.periodo?.esPeriodoAnterior
                                    ? 'Pendiente · un solo guardado'
                                    : 'Editable'
                                  : 'Solo lectura'}
                              </span>
                            </div>

                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              Describa el comportamiento de los retiros, las causas relevantes y las situaciones presentadas durante el mes.
                            </p>
                          </div>

                          <textarea
                            id="analisisMesPanelRRLL"
                            value={analisisMes}
                            onChange={(event) =>
                              setAnalisisMes(event.target.value)
                            }
                            onBlur={guardarAnalisisAlSalir}
                            disabled={
                              !gestionMensual?.permisos?.puedeEditarAnalisis ||
                              guardandoGestion
                            }
                            rows={7}
                            placeholder="Escriba el análisis del mes..."
                            className="w-full resize-y rounded-xl border border-slate-300 bg-white p-4 text-sm leading-6 text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-600"
                          />

                          <p className="mt-3 text-xs text-slate-500">
                            {gestionMensual?.gestionMensual?.usuarioAnalisis ? (
                              <>
                                Registrado por{' '}
                                <span className="font-semibold text-slate-700">
                                  {gestionMensual.gestionMensual.usuarioAnalisis}
                                </span>
                                {' · '}
                                {formatearFechaHora(
                                  gestionMensual.gestionMensual.fechaAnalisis
                                )}
                              </>
                            ) : (
                              'Pendiente de diligenciar.'
                            )}
                          </p>
                        </article>

                        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                          <div className="mb-3">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <label
                                htmlFor="planAccionPanelRRLL"
                                className="text-sm font-bold text-slate-900"
                              >
                                Plan de acción
                              </label>

                              <span
                                className={
                                  gestionMensual?.permisos?.puedeEditarPlanAccion
                                    ? 'w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700'
                                    : 'w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600'
                                }
                              >
                                {gestionMensual?.permisos?.puedeEditarPlanAccion
                                  ? gestionMensual?.periodo?.esPeriodoAnterior
                                    ? 'Pendiente · un solo guardado'
                                    : 'Editable'
                                  : 'Solo lectura'}
                              </span>
                            </div>

                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              Registre las acciones definidas para corregir, mejorar o mantener los resultados del Panel Gerencial.
                            </p>
                          </div>

                          <textarea
                            id="planAccionPanelRRLL"
                            value={planAccion}
                            onChange={(event) =>
                              setPlanAccion(event.target.value)
                            }
                            onBlur={guardarPlanAccionAlSalir}
                            disabled={
                              !gestionMensual?.permisos?.puedeEditarPlanAccion ||
                              guardandoGestion
                            }
                            rows={7}
                            placeholder="Escriba el plan de acción..."
                            className="w-full resize-y rounded-xl border border-slate-300 bg-white p-4 text-sm leading-6 text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-600"
                          />

                          <p className="mt-3 text-xs text-slate-500">
                            {gestionMensual?.gestionMensual?.usuarioPlanAccion ? (
                              <>
                                Registrado por{' '}
                                <span className="font-semibold text-slate-700">
                                  {gestionMensual.gestionMensual.usuarioPlanAccion}
                                </span>
                                {' · '}
                                {formatearFechaHora(
                                  gestionMensual.gestionMensual.fechaPlanAccion
                                )}
                              </>
                            ) : (
                              'Pendiente de diligenciar.'
                            )}
                          </p>
                        </article>
                      </div>

                      <article className="mt-5 rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex-1">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                              <p className="text-sm font-bold text-slate-900">
                                Calificación mensual
                              </p>

                              <span
                                className={
                                  gestionMensual?.permisos?.puedeEditarCalificacion
                                    ? 'w-fit rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700'
                                    : 'w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600'
                                }
                              >
                                {gestionMensual?.permisos?.puedeEditarCalificacion
                                  ? gestionMensual?.periodo?.esPeriodoAnterior
                                    ? 'Pendiente · un solo guardado'
                                    : 'Editable por Super Administrador'
                                  : 'Solo lectura'}
                              </span>
                            </div>

                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              La calificación es registrada manualmente por el Super Administrador y no modifica los cálculos automáticos del Panel Gerencial.
                            </p>

                            <p className="mt-2 text-xs text-slate-500">
                              {gestionMensual?.gestionMensual?.usuarioCalificacion ? (
                                <>
                                  Calificado por{' '}
                                  <span className="font-semibold text-slate-700">
                                    {gestionMensual.gestionMensual.usuarioCalificacion}
                                  </span>
                                  {' · '}
                                  {formatearFechaHora(
                                    gestionMensual.gestionMensual.fechaCalificacion
                                  )}
                                </>
                              ) : (
                                'Pendiente de calificación.'
                              )}
                            </p>

                            {gestionMensual?.permisos?.puedeEditarCalificacion && (
                              <div className="mt-5 max-w-md">
                                <label
                                  htmlFor="calificacionMensualPanelRRLL"
                                  className="mb-2 block text-xs font-bold text-slate-700"
                                >
                                  Calificación del panel
                                </label>

                                <div className="flex flex-col gap-3 sm:flex-row">
                                  <div className="relative flex-1">
                                    <input
                                      id="calificacionMensualPanelRRLL"
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.01"
                                      value={calificacionMensual}
                                      onChange={(event) =>
                                        setCalificacionMensual(event.target.value)
                                      }
                                      disabled={guardandoCalificacion}
                                      placeholder="0 - 100"
                                      className="h-11 w-full rounded-xl border border-violet-300 bg-white px-4 pr-10 text-sm font-bold text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                                    />

                                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-violet-700">
                                      %
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={guardarCalificacionMensual}
                                    disabled={guardandoCalificacion}
                                    className="inline-flex h-11 items-center justify-center rounded-xl bg-violet-700 px-5 text-sm font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[190px]"
                                  >
                                    {guardandoCalificacion
                                      ? 'Guardando...'
                                      : 'Guardar calificación'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="min-w-[200px] rounded-2xl border border-violet-200 bg-violet-50 px-6 py-5 text-center">
                            <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
                              Resultado
                            </p>

                            <p className="mt-1 text-3xl font-bold text-violet-800">
                              {gestionMensual?.gestionMensual?.calificacionMensual !== null &&
                              gestionMensual?.gestionMensual?.calificacionMensual !== undefined
                                ? `${Number(
                                    gestionMensual.gestionMensual.calificacionMensual
                                  )
                                    .toFixed(2)
                                    .replace('.', ',')} %`
                                : 'Pendiente'}
                            </p>
                          </div>
                        </div>
                      </article>

                      {(gestionMensual?.permisos?.puedeEditarAnalisis ||
                        gestionMensual?.permisos?.puedeEditarPlanAccion) && (
                        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs leading-5 text-slate-500">
                            {gestionMensual?.periodo?.esPeriodoAnterior
                              ? 'El periodo ya finalizó. Los campos pendientes pueden diligenciarse una sola vez y quedarán bloqueados después de guardar.'
                              : 'Mientras el mes se encuentre vigente, los cambios se guardan al salir de cada campo y también puede usar el botón Guardar gestión mensual.'}
                          </p>

                          <button
                            type="button"
                            onClick={guardarGestionMensual}
                            disabled={guardandoGestion}
                            className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[220px]"
                          >
                            {guardandoGestion
                              ? 'Guardando...'
                              : 'Guardar gestión mensual'}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </section>
        )}

        <p className="pb-4 text-center text-xs text-slate-400">
          Los indicadores se actualizan al consultar la información del
          backend del Panel Gerencial RRLL.
        </p>
      </div>
    </div>
  );
};

export default PanelGerencialRRLLView;