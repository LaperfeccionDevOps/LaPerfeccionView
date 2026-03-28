
import { RegistroPersonal, getListaLocalidades, getListaLugarNacimiento, getAspirantexNumeroIdentificacion, ActualizarRegistro, getDocumentacionIngreso } from '../services/aspirante';
import { getAspirante } from '../services/detalle_aspirante';
import React, { useState, useEffect } from 'react';
import SignaturePad from 'react-signature-canvas';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import {
  Save,
  FileCheck,
  Info,
  User,
  Phone,
  Heart,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Users,
  BookOpen,
  MapPin,
  Key,
  ExternalLink,
  X,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';

/* ✅ NUEVO: límite de tamaño (puedes subir/bajar este número) */
const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/* ✅ NUEVO: URLs de PDFs (deben existir en /public/docs/) */
const PDF_TRATAMIENTO_DATOS_URL = '/PDF/POLITICA DE PRIVACIDAD.pdf';
const PDF_CONFLICTO_INTERES_URL = '/PDF/CONFLICTOS DE INTERÉS.pdf';

/* =========================================================
   ✅ NUEVO: Direccion estructurada (SIN romper el mapeo)
   - TODO termina guardándose en: formData.DatosAdicionales.Direccion
   - Selección / Contratación / Contrato NO se afectan porque el campo final es el mismo.
   ========================================================= */
const TIPOS_VIA = [
  { key: 'Calle', value: 'Calle' },
  { key: 'Carrera', value: 'Carrera' },
  { key: 'Avenida', value: 'Avenida' },
  { key: 'Diagonal', value: 'Diagonal' },
  { key: 'Transversal', value: 'Transversal' },
];

const ORIENTACIONES = [
  { key: '', value: 'Sin orientación' },
  { key: 'Norte', value: 'Norte' },
  { key: 'Sur', value: 'Sur' },
  { key: 'Este', value: 'Este' },
  { key: 'Oeste', value: 'Oeste' },
];

const LETRAS = [
  { key: '__NONE__', value: 'Sin letra' },
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((l) => ({ key: l, value: l })),
];

const NIVELES_EDUCATIVOS = [
  { key: 1, value: 'SIN DEFINIR' },
  { key: 2, value: 'PRIMARIA' },
  { key: 3, value: 'SECUNDARIA' },
  { key: 4, value: 'BACHILLERATO' },
  { key: 5, value: 'TÉCNICO' },
  { key: 6, value: 'TECNOLÓGICO' },
  { key: 7, value: 'UNIVERSITARIO' },
  { key: 8, value: 'ESPECIALIZACIÓN' },
  { key: 9, value: 'DOCTORADO' },

];

// ✅ ARREGLADO: array plano y bien cerrado
const requisitosObligatorios = [
  { IdTipoDocumentacion: 3, label: 'Hoja de vida' },
  { IdTipoDocumentacion: 4, label: 'Fotocopia del Documento de Identidad' },
  { IdTipoDocumentacion: 10, label: 'Certificados laborales (todos)' },
  { IdTipoDocumentacion: 11, label: 'Certificados de estudio Académicos (Todos)' },
  { IdTipoDocumentacion: 12, label: 'Tarjeta profesional (si aplica)' },
  { IdTipoDocumentacion: 40, label: 'Certificado fondo de pensiones' },
  { IdTipoDocumentacion: 30, label: 'Certificado de afiliación EPS' },
  //{ IdTipoDocumentacion: 32, label: 'Certificación bancaria' },

  // 👇 IDs únicos
  { IdTipoDocumentacion: 41, label: 'Fotocopia de carné de vacunas covid' },
  { IdTipoDocumentacion: 35, label: 'Fotocopia de carné de vacunas Hepatitis - Tétano' },

  { IdTipoDocumentacion: 1, label: 'Recibo Servicio Público' },
  { IdTipoDocumentacion: 2, label: 'Foto del Aspirante' },
  { IdTipoDocumentacion: 39, label: 'Certificado de Cursos Especiales (si aplica)' },
];

const CIUDADES_COLOMBIA = [
  { key: 2, value: 'Agua de Dios' },
  { key: 3, value: 'Alban' },
  { key: 4, value: 'Anapoima' },
  { key: 5, value: 'Anolaima' },
  { key: 6, value: 'Apulo' },
  { key: 7, value: 'Arbelaez' },
  { key: 8, value: 'Beltran' },
  { key: 9, value: 'Bituima' },
  { key: 10, value: 'Bogotá D.C.' },
  { key: 11, value: 'Bojaca' },
  { key: 12, value: 'Cabrera' },
  { key: 13, value: 'Cachipay' },
  { key: 14, value: 'Cajica' },
  { key: 15, value: 'Caparrapi' },
  { key: 16, value: 'Caqueza' },
  { key: 17, value: 'Carmen de Carupa' },
  { key: 18, value: 'Chaguani' },
  { key: 19, value: 'Chia' },
  { key: 20, value: 'Chipaque' },
  { key: 21, value: 'Choachi' },
  { key: 22, value: 'Choconta' },
  { key: 23, value: 'Cogua' },
  { key: 24, value: 'Cota' },
  { key: 25, value: 'Cucunuba' },
  { key: 26, value: 'El Colegio' },
  { key: 27, value: 'El Peñon' },
  { key: 28, value: 'El Rosal' },
  { key: 29, value: 'Facatativa' },
  { key: 30, value: 'Fomeque' },
  { key: 31, value: 'Fosca' },
  { key: 32, value: 'Fontibon' },
  { key: 33, value: 'Funza' },
  { key: 34, value: 'Fuquene' },
  { key: 35, value: 'Fusagasuga' },
  { key: 36, value: 'Gachala' },
  { key: 37, value: 'Gachancipa' },
  { key: 38, value: 'Gacheta' },
  { key: 39, value: 'Gama' },
  { key: 40, value: 'Girardot' },
  { key: 41, value: 'Granada' },
  { key: 42, value: 'Guacheta' },
  { key: 43, value: 'Guaduas' },
  { key: 44, value: 'Guasca' },
  { key: 45, value: 'Guataqui' },
  { key: 46, value: 'Guatavita' },
  { key: 47, value: 'Guayabal de Siquima' },
  { key: 48, value: 'Guayabetal' },
  { key: 49, value: 'Gutierrez' },
  { key: 50, value: 'Jerusalen' },
  { key: 51, value: 'Junin' },
  { key: 52, value: 'La Calera' },
  { key: 53, value: 'La Mesa' },
  { key: 54, value: 'La Palma' },
  { key: 55, value: 'La Peña' },
  { key: 56, value: 'La Vega' },
  { key: 57, value: 'Lenguazaque' },
  { key: 58, value: 'Macheta' },
  { key: 59, value: 'Madrid' },
  { key: 60, value: 'Manta' },
  { key: 61, value: 'Medina' },
  { key: 62, value: 'Mosquera' },
  { key: 63, value: 'Nariño' },
  { key: 64, value: 'Nemocon' },
  { key: 65, value: 'Nilo' },
  { key: 66, value: 'Nimaima' },
  { key: 67, value: 'Nocaima' },
  { key: 68, value: 'Pacho' },
  { key: 69, value: 'Paime' },
  { key: 70, value: 'Pandi' },
  { key: 71, value: 'Paratebueno' },
  { key: 72, value: 'Pasca' },
  { key: 73, value: 'Puerto Salgar' },
  { key: 74, value: 'Puli' },
  { key: 75, value: 'Quebradanegra' },
  { key: 76, value: 'Quetame' },
  { key: 77, value: 'Quipile' },
  { key: 78, value: 'Ricaurte' },
  { key: 79, value: 'San Antonio de Tequendama' },
  { key: 80, value: 'San Bernardo' },
  { key: 81, value: 'San Cayetano' },
  { key: 82, value: 'San Francisco' },
  { key: 83, value: 'San Juan de Rioseco' },
  { key: 84, value: 'Sasaima' },
  { key: 85, value: 'Sesquile' },
  { key: 86, value: 'Sibate' },
  { key: 87, value: 'Silvania' },
  { key: 88, value: 'Simijaca' },
  { key: 89, value: 'Soacha' },
  { key: 90, value: 'Sopo' },
  { key: 91, value: 'Subachoque' },
  { key: 92, value: 'Suesca' },
  { key: 93, value: 'Supata' },
  { key: 94, value: 'Susa' },
  { key: 95, value: 'Sutatausa' },
  { key: 96, value: 'Tabio' },
  { key: 97, value: 'Tausa' },
  { key: 98, value: 'Tena' },
  { key: 99, value: 'Tenjo' },
  { key: 100, value: 'Tibacuy' },
  { key: 101, value: 'Tibirita' },
  { key: 102, value: 'Tocaima' },
  { key: 103, value: 'Tocancipa' },
  { key: 104, value: 'Topaipi' },
  { key: 105, value: 'Ubala' },
  { key: 106, value: 'Ubaque' },
  { key: 107, value: 'Ubate' },
  { key: 108, value: 'Une' },
  { key: 109, value: 'Usaquen' },
  { key: 110, value: 'Usme' },
  { key: 111, value: 'Utica' },
  { key: 112, value: 'Venecia' },
  { key: 113, value: 'Vergara' },
  { key: 114, value: 'Viani' },
  { key: 115, value: 'Villagomez' },
  { key: 116, value: 'Villapinzon' },
  { key: 117, value: 'Villeta' },
  { key: 118, value: 'Viota' },
  { key: 119, value: 'Yacopi' },
  { key: 120, value: 'Zipacon' },
  { key: 121, value: 'Zipaquira' },
];

// Ciudades/municipios cercanos a Bogotá
const CIUDADES_MUNICIPIOS_BOGOTA = [
  { key: 1, value: 'Bogotá D.C.' },
  { key: 3, value: 'Soacha' },
  { key: 4, value: 'Chía' },
  { key: 5, value: 'Zipaquirá' },
  { key: 6, value: 'Cajicá' },
  { key: 7, value: 'Funza' },
  { key: 8, value: 'Facatativá' },
  { key: 9, value: 'Mosquera' },
  { key: 10, value: 'Madrid' },
  { key: 11, value: 'La Calera' },
  { key: 12, value: 'Sibaté' },
];

const PARENTESCOS = [
  { key: 'Padre', value: 'Padre' },
  { key: 'Hijo(a)', value: 'Hijo(a)' },
  { key: 'Madre', value: 'Madre' },
  { key: 'Hermano(a)', value: 'Hermano(a)' },
  { key: 'Abuelo(a)', value: 'Abuelo(a)' },
  { key: 'Tío(a)', value: 'Tío(a)' },
  { key: 'Primo(a)', value: 'Primo(a)' },
  { key: 'Sobrino(a)', value: 'Sobrino(a)' },
  { key: 'Suegro(a)', value: 'Suegro(a)' },
  { key: 'Cuñado(a)', value: 'Cuñado(a)' },
  { key: 'Cónyuge/Compañero permanente', value: 'Cónyuge/Compañero permanente' },
 ];

const GRUPOS_SANGUINEOS = [
  { key: 1, value: 'Sin definir' },
  { key: 2, value: 'A+' },
  { key: 3, value: 'A-' },
  { key: 4, value: 'B+' },
  { key: 5, value: 'B-' },
  { key: 6, value: 'O+' },
  { key: 7, value: 'O-' },
  { key: 8, value: 'AB+' },
  { key: 9, value: 'AB-' },
];

const HOBBIES = [
  { key: 'Deporte', value: 'Deporte' },
  { key: 'Jugar fútbol', value: 'Jugar fútbol' },
  { key: 'Leer', value: 'Leer' },
  { key: 'Cantar', value: 'Cantar' },
  { key: 'Bailar', value: 'Bailar' },
  { key: 'Cocinar', value: 'Cocinar' },
  { key: 'Videojuegos', value: 'Videojuegos' },
  { key: 'Gimnasio', value: 'Gimnasio' },
  { key: 'Ciclismo', value: 'Ciclismo' },
  { key: 'Caminar', value: 'Caminar' },
  { key: 'Dibujar / pintar', value: 'Dibujar / pintar' },
  { key: 'Música (escuchar)', value: 'Música (escuchar)' },
  { key: 'Ver series / películas', value: 'Ver series / películas' }
];

const FUENTES_VACANTE = [
  { key: 'computrabajo', value: 'Computrabajo' },
  { key: 'facebook', value: 'Facebook' },
  { key: 'Sena', value: 'Sena' },
  { key: 'Agencia de Empleo Compensar', value: 'Agencia de Empleo Compensar' },
  { key: 'Agencia de Empleo Colsubsidio', value: 'Agencia de Empleo Colsubsidio' },
  { key: 'Agencia de Empleo Cafam', value: 'Agencia de Empleo Cafam' },
  { key: 'Agencia de Empleo del Distrito', value: 'Agencia de Empleo del Distrito' },
  { key: 'Volante', value: 'Volante' },
  { key: 'Vos a Vos', value: 'Vos a Vos' },
   { key: 'TiKToK', value: 'TiKToK' },
  { key: 'otras Redes Sociales', value: 'otras Redes Sociales' },
];

const TIPOS_IDENTIFICACION = [
  { key: 1, value: 'Cédula de Ciudadania' },
  { key: 2, value: 'Cédula de Extranjería' },
  { key: 3, value: 'Permiso Protección (PPT)' },
  { key: 4, value: 'Tarjeta de Identidad' },
];

const GENEROS = [
  { key: 6, value: 'Masculino' },
  { key: 7, value: 'Femenino' },
  { key: 9, value: 'Otro' },
];

const ESTADOS_CIVIL = [
  { key: 8, value: 'Soltero(a)' },
  { key: 9, value: 'Casado(a)' },
  { key: 10, value: 'Unión Libre' },
  { key: 11, value: 'Separado(a)' },
  { key: 12, value: 'Divorciado(a)' },
  { key: 13, value: 'Viudo(a)' },
];

const LIMITACIONES = [
  { key: 1, value: 'Ninguna' },
  { key: 2, value: 'Discapacidad visual' },
  { key: 3, value: 'Discapacidad auditiva' },
  { key: 4, value: 'Discapacidad motriz' },
  { key: 5, value: 'Condicion cognitiva' },
  { key: 7, value: 'Discapacidad múltiple' },
  { key: 8, value: 'Otra' },
];

const SI_NO = [
  { key: 'Si', value: 'Si' },
  { key: 'No', value: 'No' },
];

const ESTRATO = [
  { key: 1, value: '1' },
  { key: 2, value: '2' },
  { key: 3, value: '3' },
  { key: 4, value: '4' },
  { key: 5, value: '5' },
  { key: 6, value: '6' },
];

const EPS = [
  { key: 1, value: 'ASOCIACION INDIGENA DEL CAUCA' },
  { key: 2, value: 'ASOCIACION MUTUAL LA ESPERANZA ASMET SALUD' },
  { key: 3, value: 'ASOCIACION MUTUAL SER EMPRESA SOLIDARIA DE SALUS ESS' },
  { key: 4, value: 'ASOCIACIÓN MUTUAL BARRIOS UNIDOS DE QUIBDÓ E.S.S' },
  { key: 5, value: 'CAPITAL SALUD' },
  { key: 6, value: 'CAPITAL SALUD S.A.S.' },
  { key: 7, value: 'CAPRESOCA E.P.S' },
  { key: 8, value: 'COMPARTA' },
  { key: 9, value: 'COOSALUD MOVILIDAD' },
  { key: 10, value: 'ECOOPSOS' },
  { key: 11, value: 'E. P. S. ALIANSALUD' },
  { key: 12, value: 'E. P. S. CAFESALUD' },
  { key: 13, value: 'E. P. S. CAJANAL' },
  { key: 14, value: 'E. P. S. CAPRECOM' },
  { key: 15, value: 'E. P. S. COMFENALCO ANTIOQUIA' },
  { key: 16, value: 'E. P. S. COMFENALCO VALLE' },
  { key: 17, value: 'E. P. S. COMPENSAR' },
  { key: 18, value: 'E. P. S. COOMEVA S. A.' },
  { key: 19, value: 'E. P. S. CRUZ BLANCA S. A.' },
  { key: 20, value: 'E. P. S. FAMISANAR L. T. D. A.' },
  { key: 21, value: 'E. P. S. FOSYGA' },
  { key: 22, value: 'E. P. S. GOLDEN GROUP S. A.' },
  { key: 23, value: 'E. P. S. HUMANA VIVIR' },
  { key: 24, value: 'E. P. S. INSTITUTO DE SEGUROS SOCIALES' },
  { key: 25, value: 'E. P. S. NUEVA E. P. S. S. A.' },
  { key: 26, value: 'E. P. S. RED SALUD' },
  { key: 27, value: 'E. P. S. SALUD COLPATRIA' },
  { key: 28, value: 'E. P. S. SALUD TOTAL' },
  { key: 29, value: 'E. P. S. SALUD VIDA' },
  { key: 30, value: 'E. P. S. SALUDCOOP' },
  { key: 31, value: 'E. P. S. SANITAS S. A.' },
  { key: 32, value: 'E. P. S. SERVICIO OCCIDENTAL DE SALUD S. O. S.' },
  { key: 33, value: 'E. P. S. SOL SALUD' },
  { key: 34, value: 'E. P. S. SURA' },
  { key: 35, value: 'EMSSANAR EPS' },
  { key: 36, value: 'EPS COMPARTA' },
  { key: 37, value: 'EPS MEDIMAS' },
  { key: 38, value: 'EPS MUTUAL SER' },
  { key: 39, value: 'EPS-S CONVIDA' },
  { key: 40, value: 'FUNDACIÓN SALUD MIA EPS' },
  { key: 41, value: 'NUEVA EPS S.A. MOVILIDAD' },
  { key: 42, value: 'SAVIA SALUD EPS' },
];


const FONDOS_PENSION = [
  { key: 1, value: 'Colfondos' },
  { key: 2, value: 'Colpensiones' },
  { key: 3, value: 'Horizontes' },
  { key: 4, value: 'Porvenir' },
  { key: 5, value: 'Protección + I.N.G' },
  { key: 6, value: 'sin definir' },
  { key: 7, value: 'Skandia Pensiones y Cesantías S.A' },
];

const ESTADOS_CIVILES = [
  { key: 1, value: 'SIN DEFINIR' },
  { key: 2, value: 'SOLTERO' },
  { key: 3, value: 'CASADO' },
  { key: 4, value: 'UNION LIBRE' },
  { key: 5, value: 'VIUDO' },
  { key: 6, value: 'SEPARADO' },
];

const TIPO_ESTADO_FORMACION = [
  { Key: 1, Value: 'En curso' },
  { key: 2, value: 'Finalizado' },
  { key: 3, value: 'Incompleto' },
  ];

  const BIS_OPCIONES = [
  { key: '__NONE__', value: 'Sin BIS' },
  { key: 'BIS', value: 'BIS' },
  { key: 'BIS A', value: 'BIS A' },
  { key: 'BIS B', value: 'BIS B' },
  { key: 'BIS C', value: 'BIS C' },
];


/* ✅ NUEVO: Modal visor PDF */
const PdfViewerModal = ({ open, title, url, onClose }) => {
  if (!open) return null;

  const safeUrl = url ? encodeURI(url) : '';

  return (
    <div className="fixed inset-0 z-[10000] bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl h-[85vh] rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-bold text-gray-800 truncate">{title}</h3>
            <p className="text-xs text-gray-500 truncate">{safeUrl}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="text-xs"
              onClick={() => window.open(safeUrl, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Abrir en pestaña
            </Button>

            <Button type="button" variant="outline" className="text-xs" onClick={onClose}>
              <X className="w-4 h-4 mr-1" />
              Cerrar
            </Button>
          </div>
        </div>

        <div className="flex-1 bg-gray-50">
          <iframe
            title={title}
            src={safeUrl}
            className="w-full h-full"
            style={{ border: 'none' }}
          />
        </div>
      </div>
    </div>
  );
};

const AspiranteView = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Confirmación de correo (solo front; NO se envía al backend)
  const [emailConfirmacion, setEmailConfirmacion] = useState('');
  // ✅ Confirmación de número de identificación (solo front; NO se envía al backend)
  const [numeroIdConfirmacion, setNumeroIdConfirmacion] = useState('');


  // ✅ BLOQUEANTE: Consentimientos obligatorios (SIEMPRE al entrar)
  const [showConsentGate, setShowConsentGate] = useState(true);
  const [aceptaTratamientoDatos, setAceptaTratamientoDatos] = useState(false);
  const [aceptaConflictoInteres, setAceptaConflictoInteres] = useState(false);

  // ✅ NUEVO: visor de PDF
  const [pdfViewer, setPdfViewer] = useState({
    open: false,
    title: '',
    url: '',
  });

  const [localidades, setLocalidades] = useState([]);
  const [lugarNacimiento, setLugarNacimiento] = useState([]);
  const [existeAspirante, setExisteAspirante] = useState(false);

  // Definir la función fuera del useEffect para evitar error de referencia
  const fetchDropDownList = async () => {
    console.log('fetchDropDownList called');
    try {
      const response = await getListaLocalidades();
      setLocalidades(response.data || []);

      const responseNacimiento = await getListaLugarNacimiento();

      setLugarNacimiento(
        (responseNacimiento.data || [])
          .slice()
          .sort((a, b) =>
            (a?.Nombre || "").localeCompare((b?.Nombre || ""), "es", { sensitivity: "base" })
          )
      );
    } catch (error) {
      console.error('Error cargando lista drop:', error);
    }
  };

  // Cargar la lista apenas abra la página (al montar el componente)
  useEffect(() => {
    console.log('useEffect for fetchDropDownList running');
    fetchDropDownList();
  }, []);

  const handlePreloadAspirante = async () => {
    const identificacion = String(formData.NumeroIdentificacion ?? '').trim();
    setFormData(prev => ({
      ...prev,
      IdRegistroPersonal: 0
    }));
    setExisteAspirante(false);
    if (!identificacion) return;
    try {
      const response = await getAspirantexNumeroIdentificacion(identificacion);
      const docIngreso = await getDocumentacionIngreso(response.data[0].IdRegistroPersonal);
      // Precargar documentos adjuntos si existen
      if (docIngreso && Array.isArray(docIngreso.data)) {
        const documentosPrecargados = {};
        let firmaBase64 = null;
        docIngreso.data.forEach(doc => {
          // Si el base64 no tiene prefijo, agregarlo
          let base64 = doc.DocumentoBase64 || '';
          let formato = (doc.Formato || '').toLowerCase();
          // Detectar si es PNG o PDF
          if (!formato) {
            if (doc.Nombre && doc.Nombre.toLowerCase().endsWith('.png')) {
              formato = 'image/png';
            } else {
              formato = 'application/pdf';
            }
          }
          if (base64 && typeof base64 === 'string' && !base64.startsWith('data:')) {
            if (formato === 'image/png') {
              base64 = `data:image/png;base64,${base64}`;
            } else {
              base64 = `data:application/pdf;base64,${base64}`;
            }
          }
          documentosPrecargados[doc.IdTipoDocumentacion] = {
            DocumentoCargado: base64,
            PreviewUrl: base64,
            NombreDocumento: doc.Descripcion || doc.Nombre || '',
            Nombre: doc.Nombre || doc.Descripcion || '',
            Formato: formato,
            IdTipoDocumentacion: doc.IdTipoDocumentacion,
          };
          // Si es firma digital, guardar para cargarla en el SignaturePad
          if (doc.IdTipoDocumentacion === 42 && formato === 'image/png' && base64) {
            firmaBase64 = base64;
          }
        });
        setDocumentos(documentosPrecargados);
        // Cargar la firma en el SignaturePad si existe
        setTimeout(() => {
          if (firmaBase64 && window.firmaPad && typeof window.firmaPad.fromDataURL === 'function') {
            try {
              window.firmaPad.fromDataURL(firmaBase64);
            } catch (e) {}
          }
        }, 500);
      }
      if (response.data.length > 0) {
        setExisteAspirante(true);
      }
      if (response && response.data) {
        // Precargar todos los núcleos familiares usando addFamiliar
        const nucleos = response.data[0].nucleo_familiar || [];
        const experienciaLaboral = response.data[0].experiencia_laboral || [];
        setFormData(prev => ({
          ...prev,
          IdRegistroPersonal: response.data[0].IdRegistroPersonal || null,
          IdEstadoProceso: response.data[0].IdEstadoProceso || 18,
          UsuarioActualizacion: 'admin',
          IdTipoIdentificacion: response.data[0].tipo_identificacion.IdTipoIdentificacion || 1,
          FechaExpedicion: response.data[0].FechaExpedicion || '',
          LugarExpedicion: response.data[0].LugarExpedicion || '',
          ComoSeEnteroVacante: response.data[0].ComoSeEnteroVacante || '',
          Nombres: response.data[0].Nombres || '',
          Apellidos: response.data[0].Apellidos || '',
          IdTipoGenero: response.data[0].IdTipoGenero || 1,
          IdTipoEstadoCivil: response.data[0].IdTipoEstadoCivil || '',
          IdLugarNacimiento: response.data[0].IdLugarNacimiento || '',
          FechaNacimiento: response.data[0].FechaNacimiento || '',
          TieneHijos: response.data[0].TieneHijos || false,
          CuantosHijos: response.data[0].CuantosHijos || 0,
          TieneLimitacionesFisicas: response.data[0].TieneLimitacionesFisicas || false,
          Email: response.data[0].Email || '',
          Celular: response.data[0].Celular || '',
          TieneWhatsapp: response.data[0].TieneWhatsapp || false,
          NumeroWhatsapp: response.data[0].NumeroWhatsapp || '',
          ContactoEmergencia: response.data[0].ContactoEmergencia || '',
          TelefonoContactoEmergencia: response.data[0].TelefonoContactoEmergencia || '',
          PesoKilogramos: response.data[0].PesoKilogramos || 0,
          AlturaMetros: response.data[0].AlturaMetros || 0,
          IdTipoEps: response.data[0].IdTipoEps || 1,
          IdFondoPensiones: response.data[0].IdFondoPensiones || 1,
          DescripcionFormacionAcademica: response.data[0].DescripcionFormacionAcademica || '',
          IdNivelEducativo: response.data[0].IdNivelEducativo || 1,
          EstudiaActualmente: response.data[0].EstudiaActualmente || '',
          IdTipoEstadoFormacion: response.data[0].IdTipoEstadoFormacion || 1,
          IdLimitacionFisicaHijo: response.data[0].IdLimitacionFisicaHijo || 1,
          DatosAdicionales: {
            Direccion: response.data[0].datos_adicionales[0]?.Direccion || '',
            IdCiudad: response.data[0].datos_adicionales[0]?.IdCiudad || 1,
            IdLocalidad: response.data[0].datos_adicionales[0]?.IdLocalidad || 1,
            Barrio: response.data[0].datos_adicionales[0]?.Barrio || '',
            Estrato: response.data[0].datos_adicionales[0]?.Estrato || 1,
            IdGrupoSanguineo: response.data[0].datos_adicionales[0]?.IdGrupoSanguineo || 1,
            HobbyPasatiempo: response.data[0].datos_adicionales[0]?.HobbyPasatiempo || '',
            // HobbyPasatiempoOtro: '',
          },
          ExperienciaLaboral: experienciaLaboral.length > 0 ? experienciaLaboral : prev.ExperienciaLaboral,
          NucleoFamiliar: nucleos.length > 0 ? nucleos : prev.NucleoFamiliar,
          Referencias: [{ IdTipoReferencia: 1, Nombre: response.data[0].referencias[0]?.Nombre || '', Telefono: response.data[0].referencias[0]?.Telefono || '', Parentesco: response.data[0].referencias[0]?.Parentesco || '', TiempoConocerlo: response.data[0].referencias[0]?.TiempoConocerlo || '' }],
        }));
        Swal.fire({
          position: "center",
          icon: "success",
          title: "Datos precargados",
          text: "Se han cargado los datos principales del aspirante.",
          showConfirmButton: false,
          timer: 5000,
          customClass: {
            title: 'swal2-title-sm'
          }
        });
      }
    } catch (error) {
      // Si no existe, no mostrar error
    }
  };

  // Permite abrir PDF o imagen desde base64 o URL
  // Permite abrir PDF o imagen desde base64 o URL, corrige base64 puro
  const openPdf = (title, urlOrBase64) => {
    let url = urlOrBase64;
    if (url && typeof url === 'string' && !url.startsWith('data:') && url.length > 100) {
      // Si parece base64 puro (no dataURL), asumimos PDF
      url = `data:application/pdf;base64,${url}`;
    }
    setPdfViewer({ open: true, title, url });
  };

  // Descarga un documento base64 o url
  const downloadDocument = (doc) => {
    let base64 = doc.DocumentoBase64 || doc.PreviewUrl || doc.DocumentoCargado;
    let nombre = doc.NombreDocumento || doc.Nombre || 'documento.pdf';
    if (!base64) return;
    // Si es dataURL
    if (base64.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = base64;
      a.download = nombre;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Si es solo base64 sin dataURL, asumimos PDF
      const a = document.createElement('a');
      a.href = `data:application/pdf;base64,${base64}`;
      a.download = nombre;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const closePdf = () => {
    setPdfViewer({ open: false, title: '', url: '' });
  };

  /* ✅ NUEVO: modo y partes para direccion (estructurada/manual) */
 const [direccionParts, setDireccionParts] = useState({
  tipoVia: '',
  viaNumero: '',
  viaBis: '__NONE__',          // 👈 NUEVO
  viaLetra: '__NONE__',
  viaOrient: 'Sin orientación',
  placaNumero: '',
  placaLetra: '__NONE__',
  placaNumero2: '', // 👈 NUEVO (segundo número después de la letra, ej: 45C-12)
  placaOrient: 'Sin orientación',
  observaciones: '',
});


const buildDireccionEstructurada = (p) => {
  const tipo = (p.tipoVia || '').trim();
  const num = (p.viaNumero || '').trim();

  const bis =
    p.viaBis && p.viaBis !== '__NONE__'
      ? String(p.viaBis).trim()
      : '';

  const letra =
    p.viaLetra && p.viaLetra !== '__NONE__'
      ? String(p.viaLetra).trim()
      : '';

  const ori =
    p.viaOrient && p.viaOrient !== 'Sin orientación'
      ? String(p.viaOrient).trim()
      : '';

  const placa = (p.placaNumero || '').trim();
  const placa2 = (p.placaNumero2 || '').trim();

  const placaLetra =
    p.placaLetra && p.placaLetra !== '__NONE__'
      ? String(p.placaLetra).trim()
      : '';

  const placaOri =
    p.placaOrient && p.placaOrient !== 'Sin orientación'
      ? String(p.placaOrient).trim()
      : '';

  // mínimos para que la dirección “sirva”
  if (!tipo || !num || !placa) return '';

  // ✅ BIS va entre el número y la letra/orientación
  const via = `${tipo} ${num}${bis ? ` ${bis}` : ''}${letra}${ori ? ` ${ori}` : ''}`
    .replace(/\s+/g, ' ')
    .trim();

  const placaFull = `${placa}${placaLetra}${placa2 ? `-${placa2}` : ''}${placaOri ? ` ${placaOri}` : ''}`
    .replace(/\s+/g, ' ')
    .trim();


  return `${via} # ${placaFull}`.replace(/\s+/g, ' ').trim();
};

  const buildDireccionFinal = (base, obs) => {
    const b = (base || '').trim();
    const o = (obs || '').trim();
    if (!b) return '';
    if (!o) return b;
    return `${b} ${o}`;
  };

  const [formData, setFormData] = useState({
    FechaActualizacion: new Date().toISOString().split('T')[0],
    UsuarioActualizacion: 'admin',
    IdEstadoProceso: 18,
    IdTipoIdentificacion: 0,
    NumeroIdentificacion: '',
    FechaExpedicion: '',
    LugarExpedicion: '',
    ComoSeEnteroVacante: '',
    Nombres: '',
    Apellidos: '',
    IdTipoGenero: 1,
    IdTipoEstadoCivil: '',
    IdLugarNacimiento: '',
    FechaNacimiento: '',
    TieneHijos: false,
    CuantosHijos: 0,
    TieneLimitacionesFisicas: '',
    Email: '',
    Celular: '',
    TieneWhatsapp: false,
    NumeroWhatsapp: '',
    ContactoEmergencia: '',
    TelefonoContactoEmergencia: '',
    PesoKilogramos: 0,
    AlturaMetros: 0,
    IdTipoEps: 1,
    IdFondoPensiones: 1,
    DescripcionFormacionAcademica: '',
    IdNivelEducativo: 1,
    EstudiaActualmente: '',
    IdTipoEstadoFormacion: 1,
    IdLimitacionFisicaHijo: 1,

    DatosAdicionales: {
      Direccion: '',
      IdCiudad: 0,
      IdLocalidad: 0,
      Barrio: '',
      Estrato: 0,
      IdGrupoSanguineo: 1,
      HobbyPasatiempo: ''
      // HobbyPasatiempoOtro: '',
    },

    ExperienciaLaboral: [{ Cargo: '', Compania: '', TiempoDuracion: '', Funciones: '', JefeInmediato: '', TelefonoJefe: '', TieneExperienciaPrevia: false }],

    NucleoFamiliar: [
      { TieneparentescoEnLaEmpresa: 'No', NombreFamiliarEmpresa: '', CargoDesempenaEmpresa: '', CedulaFamiliarEmpresa: '', ParentescoFamiliarEmpresa: '', Nombre: '', Parentesco: 'No', Edad: 0, Ocupacion: '', Telefono: '', Depende: 'No' },
    ],

    Referencias: [{ IdTipoReferencia: 1, Nombre: '', Telefono: '', Parentesco: '', TiempoConocerlo: '' }],
  });

  // ✅ CLAVE: siempre sincronizar el campo real que va a la BD
 useEffect(() => {
  const base = buildDireccionEstructurada(direccionParts);

  const obs = (direccionParts.observaciones || '').trim();
  const final = obs ? `${base} ${obs}` : base;

  setFormData((prev) => ({
    ...prev,
    DatosAdicionales: {
      ...prev.DatosAdicionales,
      Direccion: final,
    },
  }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [direccionParts]);


  const [documentos, setDocumentos] = useState({});
  const [aspirantes, setAspirantes] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('aspirantes');
    if (stored) setAspirantes(JSON.parse(stored));
  }, []);

  // ✅ SIEMPRE mostrar el bloqueante al entrar a esta vista
  useEffect(() => {
    setShowConsentGate(true);
    setAceptaTratamientoDatos(false);
    setAceptaConflictoInteres(false);
  }, []);

  // ✅ Bloquear scroll mientras el modal está activo
  useEffect(() => {
    if (showConsentGate || pdfViewer.open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showConsentGate, pdfViewer.open]);

      const handleInputChange = (e) => {
      const { name, value } = e.target;

      // 1) regla especial: solo letras para Nombres y Apellidos
      let v = value;
      if (name === "Nombres" || name === "Apellidos") {
        v = value.replace(/[^\p{L}\s'-]/gu, ""); // letras + espacios + ' y -
      }
      if (name === "PesoKilogramos") {
        v = value.replace(/[^\d]/g, ""); // solo 0-9
        v = v.slice(0, 3);               // ✅ máximo 3 números
      }
      if (name === "AlturaMetros") {
        v = value.replace(/[^\d]/g, ""); // solo 0-9
        v = v.slice(0, 3);               // máximo 3 números
      }

      setFormData((prev) => ({
        ...prev,
        // 2) regla especial: CuantosHijos numérico
        [name]: name === "CuantosHijos" ? (parseInt(v, 10) || 0) : v,

        // 3) lo que ya tenías
        FechaActualizacion: new Date().toISOString().split("T")[0],
      }));
    };

  // ✅ VALIDACIÓN CELULAR (solo 10 dígitos)
const [celularError, setCelularError] = useState("");

const handleCelularChange = (e) => {
  const raw = e.target.value || "";
  const onlyDigits = raw.replace(/\D/g, ""); // solo números

  // Si intenta pasar de 10, mostramos error
  if (onlyDigits.length > 10) {
    if (!celularError) {
     
      Swal.fire({
        position: "center",
        icon: "success",
        title: "⚠️ Celular inválido ",
        text: "El celular debe tener exactamente 10 dígitos.",
        showConfirmButton: false,
        timer: 5000,
        customClass: {
          title: 'swal2-title-sm'
        }
      });
    }
    setCelularError("El celular debe tener exactamente 10 dígitos.");
  } else {
    setCelularError("");
  }

  // Siempre guardamos máximo 10
  const value10 = onlyDigits.slice(0, 10);

  setFormData((prev) => ({
    ...prev,
    Celular: value10,
    FechaActualizacion: new Date().toISOString().split("T")[0],
  }));
};

// ✅ VALIDACIÓN WHATSAPP (solo 10 dígitos)
const [whatsappError, setWhatsappError] = useState("");

const handleWhatsappChange = (e) => {
  const raw = e.target.value || "";
  const onlyDigits = raw.replace(/\D/g, "");

  if (onlyDigits.length > 10) {
    setWhatsappError("El número de WhatsApp debe tener 10 dígitos.");
  } else {
    setWhatsappError("");
  }

  const value10 = onlyDigits.slice(0, 10);

  setFormData((prev) => ({
    ...prev,
    NumeroWhatsapp: value10,
    FechaActualizacion: new Date().toISOString().split("T")[0],
  }));
};

// ✅ VALIDACIÓN TELÉFONO EMERGENCIA (solo 10 dígitos)
const [telEmergenciaError, setTelEmergenciaError] = useState("");

const handleTelEmergenciaChange = (e) => {
  const raw = e.target.value || "";
  const onlyDigits = raw.replace(/\D/g, "");

  if (onlyDigits.length > 10) {
    setTelEmergenciaError("El teléfono de emergencia debe tener 10 dígitos.");
  } else {
    setTelEmergenciaError("");
  }

  const value10 = onlyDigits.slice(0, 10);

  setFormData((prev) => ({
    ...prev,
    TelefonoContactoEmergencia: value10,
    FechaActualizacion: new Date().toISOString().split("T")[0],
  }));
};

  // ✅ ARREGLADO: tu versión tenía `parent` y `prev` sin definir (podía romper)
  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: name === "CuantosHijos" ? parseInt(value, 10) || 0 : value,
      FechaActualizacion: new Date().toISOString().split('T')[0],
    }));
  };

  const handleDynamicListChange = (listName, index, field, value) => {
    const list = [...formData[listName]];
    list[index][field] = value;
    setFormData((prev) => ({ ...prev, [listName]: list }));
  };

  const addItemToList = (listName, initialItem) => {
    setFormData((prev) => ({
      ...prev,
      [listName]: [...prev[listName], initialItem],
    }));
  };

  const removeItemFromList = (listName, index) => {
    const list = [...formData[listName]];
    list.splice(index, 1);
    setFormData((prev) => ({ ...prev, [listName]: list }));
  };

  const handleExperienciaChange = (index, e) =>
    handleDynamicListChange('ExperienciaLaboral', index, e.target.name, e.target.value);

  const addExperiencia = () =>
    addItemToList('ExperienciaLaboral', { Cargo: '', Compania: '', TiempoDuracion: '', Funciones: '', JefeInmediato: '', TelefonoJefe: '', TieneExperienciaPrevia: false });

  const removeExperiencia = (index) => removeItemFromList('ExperienciaLaboral', index);

  const handleFamiliarChange = (index, e) =>
    handleDynamicListChange('NucleoFamiliar', index, e.target.name, e.target.value);

  const handleFamiliarSelectChange = (index, field, value) => {
    if (field === 'Parentesco' && value !== 'Otro') {
      handleDynamicListChange('NucleoFamiliar', index, 'ParentescoOtro', '');
    }
    handleDynamicListChange('NucleoFamiliar', index, field, value);
  };

  const addFamiliar = () =>
    addItemToList('NucleoFamiliar', {
      TieneparentescoEnLaEmpresa: true,
      NombreFamiliarEmpresa: '',
      CargoDesempenaEmpresa: '',
      CedulaFamiliarEmpresa: '',
      ParentescoFamiliarEmpresa: '',
      Nombre: '',
      Parentesco: '',
      Edad: '',
      Ocupacion: '',
      Telefono: '',
      Depende: '',
      Observaciones: ''
    });

  const removeFamiliar = (index) => removeItemFromList('NucleoFamiliar', index);

  const handleReferenciaPersonalChange = (index, e) =>
    handleDynamicListChange('Referencias', index, e.target.name, e.target.value);

  const handleReferenciaPersonalSelectChange = (index, field, value) => {
    if (field === 'Parentesco' && value !== 'Otro') {
      handleDynamicListChange('Referencias', index, 'ParentescoOtro', '');
    }
    handleDynamicListChange('Referencias', index, field, value);
  };

  const addReferenciaPersonal = () =>
    addItemToList('Referencias', { IdTipoReferencia: 1, Nombre: '', Telefono: '', Parentesco: '', TiempoConocerlo: '' });

  const removeReferenciaPersonal = (index) => removeItemFromList('Referencias', index);

  const getDocName = (id) => {
    // En esta vista, algunos documentos (como la foto) se guardan con key string ('fotoAspirante')
    if (id === 'fotoAspirante') return 'Foto del Aspirante';

    // Normal: buscar por IdTipoDocumentacion (número)
    const req = requisitosObligatorios.find((r) => r.IdTipoDocumentacion === id);
    return req ? req.label : 'Documento';
  };

  const handleFileUpload = (e, tipoId) => {
    // La foto se puede guardar con key string, pero el IdTipoDocumentacion real en BD es 2
    const idTipoDocReal = tipoId === 'fotoAspirante' ? 2 : tipoId;
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    /* ✅ NUEVO: validaciones (solo PDF excepto Foto=2 y Firma=42) + límite tamaño */
    const isFoto = Number(idTipoDocReal) === 2;
    const isFirma = Number(idTipoDocReal) === 42;

    const fileType = (file.type || '').toLowerCase();
    const fileName = (file.name || '').toLowerCase();

    const isPdf = fileType === 'application/pdf' || fileName.endsWith('.pdf');
    const isImage = fileType.startsWith('image/');

    // Tamaño máximo
    if (file.size > MAX_FILE_SIZE_BYTES) {
       Swal.fire({
        position: "center",
        icon: "success",
        title: "⚠️ Archivo demasiado pesado",
        text: `El archivo supera el límite permitido de ${MAX_FILE_SIZE_MB} MB.`,
        showConfirmButton: false,
        timer: 5000,
        customClass: {
          title: 'swal2-title-sm'
        }
      });
      e.target.value = '';
      return;
    }

    // Reglas de formato:
    // - Foto (2) y Firma (42): SOLO imagen
    // - Resto: SOLO PDF
    if (!isFoto && !isFirma && !isPdf) {
       Swal.fire({
        position: "center",
        icon: "success",
        title: "⚠️ Formato no permitido",
        text: 'Este documento debe cargarse en formato PDF.',
        showConfirmButton: false,
        timer: 5000,
        customClass: {
          title: 'swal2-title-sm'
        }
      });
      e.target.value = '';
      return;
    }

    if ((isFoto || isFirma) && !isImage) {
      Swal.fire({
        position: "center",
        icon: "success",
        title: "⚠️ Formato no permitido",
        text: isFoto
          ? 'La foto del aspirante debe ser una imagen (PNG/JPG).'
          : 'La firma debe ser una imagen (preferible PNG).',
        showConfirmButton: false,
        timer: 5000,
        customClass: {
          title: 'swal2-title-sm'
        }
      });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result; // base64/dataURL

      setDocumentos((prev) => {
        const next = {
          ...prev,
          // Guardamos con la key que usa la UI (string o número)
          [tipoId]: {
            IdTipoDocumentacion: idTipoDocReal,
            Nombre: file.name,
            Formato: file.type,
            fecha: new Date().toISOString(),
            DocumentoCargado: dataUrl,
            PreviewUrl: dataUrl,
          },
        };

        // ✅ IMPORTANTÍSIMO:
        // Si la UI usa 'fotoAspirante' pero el checklist usa IdTipoDocumentacion=2,
        // guardamos también bajo la key numérica para que marque "Adjuntado".
        if (String(tipoId) !== String(idTipoDocReal)) {
          next[idTipoDocReal] = next[tipoId];
        }

        return next;
      });

      toast({ title: `✅ ${getDocName(tipoId)} cargado exitosamente` });
    };
    reader.readAsDataURL(file);
  };

  const removeDocument = (tipoId) => {
    const idTipoDocReal = tipoId === 'fotoAspirante' ? 2 : tipoId;

    setDocumentos((prev) => {
      const next = { ...prev };
      delete next[tipoId];
      if (String(tipoId) !== String(idTipoDocReal)) {
        delete next[idTipoDocReal];
      }
      // Si borran desde el checklist (2) también limpiamos la key string por si existe
      if (tipoId === 2) {
        delete next['fotoAspirante'];
      }
      return next;
    });

    toast({ title: '🗑️ Documento eliminado' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Seguridad extra: no permitir enviar si no aceptó consentimientos
    if (showConsentGate || !aceptaTratamientoDatos || !aceptaConflictoInteres) {
      toast({
        title: 'Debes aceptar los consentimientos',
        description: 'Acepta Tratamiento de datos y Conflicto de interés para poder registrar.',
        variant: 'destructive',
      });
      return;
    }


    // ✅ FOTO DEL ASPIRANTE (IdTipoDocumentacion = 2) SIEMPRE OBLIGATORIA
    const tieneFotoCargada = () => {
      const d = documentos?.[2] || documentos?.['2'] || documentos?.['fotoAspirante'];
      const data = d?.DocumentoCargado || d?.PreviewUrl || '';
      if (typeof data !== 'string') return false;
      // 1) foto cargada (base64)
      if (data.startsWith('data:image/') && data.length > 50) return true;
      // 2) foto adjunta (url/archivo)
      if (data.startsWith('http')) return true;
      if (/\.(png|jpg|jpeg|webp)$/i.test(data)) return true;
      return false;
    };
    if (!tieneFotoCargada()) {
       Swal.fire({
        position: "center",
        icon: "warning",
        title: "⚠️ Falta foto del aspirante",
        text: "Debes adjuntar la foto del aspirante para poder guardar el registro.",
        showConfirmButton: false,
        timer: 5000,
        customClass: {
          title: 'swal2-title-sm'
        }
      });
      return;
    }

    // Validar campos requeridos
    const camposRequeridos = [
      { campo: formData.IdTipoIdentificacion, nombre: 'Tipo de identificación' },
      { campo: formData.NumeroIdentificacion, nombre: 'Número de identificación' },
      { campo: formData.FechaExpedicion, nombre: 'Fecha de expedición' },
      { campo: formData.LugarExpedicion, nombre: 'Lugar de expedición' },
      { campo: formData.IdTipoGenero, nombre: 'Género' },
      { campo: formData.IdTipoEstadoCivil, nombre: 'Estado civil' },
      // Validar que al menos uno de los dos campos de lugar de nacimiento esté presente
      { campo: (formData.IdLugarNacimiento || formData.DatosAdicionales?.IdLugarNacimiento), nombre: 'Lugar de nacimiento' },
      { campo: formData.FechaNacimiento, nombre: 'Fecha de nacimiento' },
      { campo: formData.DatosAdicionales.Direccion, nombre: 'Dirección de residencia' },
      { campo: formData.DatosAdicionales.IdLocalidad, nombre: 'Localidad' },
      { campo: formData.DatosAdicionales.Barrio, nombre: 'Barrio' },
      { campo: formData.DatosAdicionales.Estrato, nombre: 'Estrato' },
      { campo: formData.DatosAdicionales.IdGrupoSanguineo, nombre: 'Grupo sanguíneo' },
      { campo: formData.DatosAdicionales.HobbyPasatiempo, nombre: 'Hobby o actividad favorita' },
      { campo: formData.Email, nombre: 'Email' },
      { campo: emailConfirmacion, nombre: 'Confirmación correo' },
      { campo: formData.Celular, nombre: 'Celular' },
      { campo: formData.ContactoEmergencia, nombre: 'Nombre contacto de emergencia' },
      { campo: formData.TelefonoContactoEmergencia, nombre: 'Teléfono de emergencia' },
      { campo: formData.IdTipoEps, nombre: 'EPS' },
      { campo: formData.PesoKilogramos, nombre: 'Peso' },
      { campo: formData.AlturaMetros, nombre: 'Altura' },
      { campo: formData.IdNivelEducativo, nombre: 'Nivel educativo' },
      { campo: formData.IdTipoEstadoFormacion, nombre: 'Estado formación' },
      { campo: formData.EstudiaActualmente, nombre: '¿Estudia actualmente?' },
      { campo: formData.Nombres, nombre: 'Nombres' },
      { campo: formData.Apellidos, nombre: 'Apellidos' },
      { campo: formData.IdFondoCesantias, nombre: 'Fondo de cesantías' },
    ];
    const faltantes = camposRequeridos.filter(f => f.campo === undefined || f.campo === null || f.campo === '' || f.campo === 0);
    if (faltantes.length > 0) {
        Swal.fire({
        position: "center",
        icon: "warning",
        title: "⚠️ Campos requeridos",
        text: "Por favor completa: " + faltantes.map(f => f.nombre).join(', '),
        showConfirmButton: false,
        timer: 5000,
        customClass: {
          title: 'swal2-title-sm'
        }
      });
      return;
    }

    // Validar email
    const email = formData.Email ? formData.Email.trim() : '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      toast({
        title: 'Correo electrónico inválido',
        description: 'Por favor ingresa un correo electrónico válido.',
        variant: 'destructive',
      });
      return;
    }

    // ✅ Confirmación de correo (debe coincidir con Email)
    const emailConfirm = emailConfirmacion ? emailConfirmacion.trim() : '';
    if (!emailConfirm) {
      toast({
        title: 'Confirmación de correo requerida',
        description: 'Por favor confirma el correo electrónico.',
        variant: 'destructive',
      });
      return;
    }
    if (emailConfirm.toLowerCase() !== email.toLowerCase()) {
      toast({
        title: 'Los correos no coinciden',
        description: 'El correo y la confirmación deben ser iguales.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    // Eliminar duplicidad de 'Parentesco' en Referencias
    const referenciasLimpias = (formData.Referencias || []).map(ref => {
      const { Parentesco, parentesco, ParentescoOtro, ...rest } = ref;
      return {
        ...rest,
        Parentesco: Parentesco || parentesco || '',
        IdTipoReferencia: ref.IdTipoReferencia ?? 1 // Asegura que siempre esté presente
      };
    });

    // ✅ Confirmación de Número de Identificación (debe coincidir)
    const id1 = String(formData.NumeroIdentificacion ?? "").trim();
    const id2 = String(numeroIdConfirmacion ?? "").trim();

    if (!id2) {
       Swal.fire({
        position: "center",
        icon: "warning",
        title: "Confirmación de identificación requerida",
        text: "Por favor confirma el número de identificación.",
        showConfirmButton: false,
        timer: 5000,
        customClass: {
          title: 'swal2-title-sm'
        }
      });
      return;
    }

    if (id1 !== id2) {
      toast({
        title: 'Los números de identificación no coinciden',
        description: 'El número y la confirmación deben ser iguales.',
        variant: 'destructive',
      });
      
      return;
    }


    // Limpiar ParentescoOtro de NucleoFamiliar y convertir TieneparentescoEnLaEmpresa a booleano
    const nucleoFamiliarLimpio = (formData.NucleoFamiliar || []).map(fam => {
      const { ParentescoOtro, ...rest } = fam;
      let tieneParentesco = rest.TieneparentescoEnLaEmpresa;
      // Convertir a booleano si es string
      if (typeof tieneParentesco === 'string') {
        tieneParentesco = tieneParentesco === 'true' || tieneParentesco === 'Si' || tieneParentesco === 'sí';
      }
      return {
        ...rest,
        TieneparentescoEnLaEmpresa: !!tieneParentesco
      };
    });

    const { Referencias, ...restFormData } = formData;

    // Transformar documentos (objeto) a Documentacion (array)
    const Documentacion = Object.entries(documentos).map(([key, doc]) => {
      // Asegurar IdTipoDocumentacion numérico (la foto se guarda con key 'fotoAspirante', pero su ID real es 2)
      const idTipoDoc =
        doc.IdTipoDocumentacion ?? (key === 'fotoAspirante' ? 2 : Number(key));

      // Nombre y Formato
      const nombre = doc.Nombre || doc.NombreDocumento || '';
      let formato = (doc.Formato || '').toLowerCase();
      if (!formato) {
        if (nombre && nombre.toLowerCase().endsWith('.png')) {
          formato = 'image/png';
        } else {
          formato = 'application/pdf';
        }
      }
      // DocumentoCargado: asegurar prefijo correcto
      let documentoCargado = doc.DocumentoCargado || '';
      if (documentoCargado && typeof documentoCargado === 'string' && !documentoCargado.startsWith('data:')) {
        if (formato === 'image/png') {
          documentoCargado = `data:image/png;base64,${documentoCargado}`;
        } else {
          documentoCargado = `data:application/pdf;base64,${documentoCargado}`;
        }
      }

      return {
        IdTipoDocumentacion: idTipoDoc,
        Nombre: nombre,
        Formato: formato,
        DocumentoCargado: documentoCargado,
      };
    });

   // Si NumeroWhatsapp está vacío o no definido, enviarlo como null
        const numeroWhatsappFinal =
          !formData.NumeroWhatsapp || formData.NumeroWhatsapp.trim() === ''
            ? null
            : formData.NumeroWhatsapp;

        const payload = {
          ...restFormData,
          Nombres: formData.Nombres,
          Apellidos: formData.Apellidos,
          NumeroIdentificacion: formData.NumeroIdentificacion,
          IdEstadoProceso: formData.IdEstadoProceso,
          IdTipoCargo: 5,
          NumeroWhatsapp: numeroWhatsappFinal,
          Documentacion,
          Referencias: referenciasLimpias,
          NucleoFamiliar: nucleoFamiliarLimpio,
          IdLugarNacimiento: (() => {
            // Si ya es número, devolverlo
            if (!isNaN(Number(formData.IdLugarNacimiento))) {
              return Number(formData.IdLugarNacimiento);
            }

            // Buscar el key correspondiente al texto
            const lugarNacimientoEncontrado = lugarNacimiento.find(
              (c) =>
                c.value.toLowerCase() ===
                String(formData.IdLugarNacimiento).toLowerCase()
            );

            return lugarNacimientoEncontrado
              ? lugarNacimientoEncontrado.key
              : '';
          })(),
        };
        try {

        if (!tieneFirmaCargada()) {
          Swal.fire({
            position: "center",
            icon: "warning",
            title: "⚠️ Falta firma",
            text: "Debes registrar la firma digital (dibujada) para poder guardar el registro.",
            showConfirmButton: false,
            timer: 5000,
            customClass: {
              title: 'swal2-title-sm'
            }
          });
          return; // ⛔ bloquea el submit (Guardar Registro)
        }

      let response;

      if (!existeAspirante) {
        response = await RegistroPersonal(payload)
      } else {
        response = await ActualizarRegistro(formData.IdRegistroPersonal, payload)
      }

      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}));
        Swal.fire({
          position: "center",
          icon: "warning",
          title: "¡Alerta! ",
          text: errorData.detail,
          showConfirmButton: false,
          timer: 7000,
          customClass: {
            title: 'swal2-title-sm'
          }
        });
        return;
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error del servidor: ${response.status}`);
      }

      await response.json();

      const updated = [...aspirantes, payload];
      setAspirantes(updated);

      Swal.fire({
        position: "center",
        icon: "success",
        title: "¡Registro exitoso! ",
        text: "La información ha sido enviada y guardada correctamente.",
        showConfirmButton: false,
        timer: 5000,
        customClass: {
          title: 'swal2-title-sm'
        }
      });

      // El estilo swal2-title-sm ahora está en el CSS global

} catch (error) {
  console.error('Error al enviar formulario:', error);
  Swal.fire({
    position: "center",
    icon: "error",
    title: "Error de conexión",
    text: "La información no se ha enviado. Si persisten los problemas, por favor contacta a soporte.",
    showConfirmButton: false,
    timer: 5000,
    customClass: {
      title: 'swal2-title-sm'
    }
  });
} finally {
  setIsSubmitting(false);
}
};

  const handleFinalizarDocumentacion = () => {
    const missing = requisitosObligatorios.filter((req) => {
      const key = req.IdTipoDocumentacion === 2 ? 'fotoAspirante' : req.IdTipoDocumentacion;
      return !documentos[key];
    });
    if (missing.length > 0) {
      Swal.fire({
        position: "center",
        icon: "warning",
        title: "¡Advertencia!",
        text: `Faltan ${missing.length} documentos obligatorios.`,
        showConfirmButton: false,
        timer: 5000,
        customClass: {
          title: 'swal2-title-sm'
        }
      });
    } else {
      Swal.fire({
        position: "center",
        icon: "success",
        title: "Todos los requisitos obligatorios han sido cargados.",
        text: `Faltan ${missing.length} documentos obligatorios.`,
        showConfirmButton: false,
        timer: 5000,
        customClass: {
          title: 'swal2-title-sm'
        }
      });
    }
  };

  const renderSection = (title, icon, children) => (
    <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-emerald-600 mb-8">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700">
          {icon}
        </div>
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  );

  const showExperienciaLaboral =
    (formData.ExperienciaLaboral && formData.ExperienciaLaboral[0]?.TieneExperienciaPrevia === true) ||
    (formData.ExperienciaLaboral && formData.ExperienciaLaboral[0]?.TieneExperienciaPrevia === 'true');

  // ✅ VALIDACIÓN: Certificado laboral (id 10) obligatorio si marcó experiencia
  const tieneExperienciaMarcada = () => {
    const exps = formData?.ExperienciaLaboral;
    if (!Array.isArray(exps) || exps.length === 0) return false;

    // Si cualquiera marca experiencia previa
    return exps.some((e) => e?.TieneExperienciaPrevia === true || e?.TieneExperienciaPrevia === 'true');
  };

  const tieneDocCargado = (docId) => {
    const d = documentos?.[docId] || documentos?.[String(docId)];
    return !!(d && (d.DocumentoCargado || d.PreviewUrl));
  };

  // ✅ VALIDACIÓN: Firma obligatoria (IdTipoDocumentacion = 42)
const tieneFirmaCargada = () => {
  const d = documentos?.[42] || documentos?.["42"];
  const data = d?.DocumentoCargado || d?.PreviewUrl || "";
  return typeof data === "string" && data.startsWith("data:image/") && data.length > 50;
};

  // foto del aspirante si ya fue cargada
  const fotoDoc = documentos['fotoAspirante'];

  return (
    <>
      {/* ✅ NUEVO: visor PDF */}
      <PdfViewerModal
        open={pdfViewer.open}
        title={pdfViewer.title}
        url={pdfViewer.url}
        onClose={closePdf}
      />
 

 
      {/* ✅ BLOQUEANTE OBLIGATORIO (SIEMPRE AL ENTRAR) */}
      {showConsentGate && (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b bg-emerald-50">
              <h2 className="text-lg md:text-xl font-bold text-emerald-900">
                Consentimientos obligatorios
              </h2>
              <p className="text-sm text-emerald-800 mt-1">
                ¡Bienvenido al proceso de selección de Aseos La Perfección S.A.S.! A continuación,
                completarás información clave para agilizar tu proceso de selección. Estos datos serán utilizados exclusivamente para fines de selección y contratación en caso de avanzar en el proceso.
                Antes de continuar, es importante que leas y aceptes lo siguiente:
                <b> Tratamiento de datos</b> y <b>Conflicto de interés</b>.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <label className="flex gap-3 items-start cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={aceptaTratamientoDatos}
                  onChange={(e) => setAceptaTratamientoDatos(e.target.checked)}
                />
                <span className="text-sm text-gray-700">
                  Acepto el{' '}
                  <button
                    type="button"
                    onClick={() => openPdf('Política de privacidad / Tratamiento de datos', PDF_TRATAMIENTO_DATOS_URL)}
                    className="font-semibold text-emerald-700 underline inline-flex items-center gap-1"
                  >
                    Tratamiento de datos personales <ExternalLink className="w-3 h-3" />
                  </button>{' '}
                  conforme a las políticas de la empresa.
                </span>
              </label>

              <label className="flex gap-3 items-start cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={aceptaConflictoInteres}
                  onChange={(e) => setAceptaConflictoInteres(e.target.checked)}
                />
                <span className="text-sm text-gray-700">
                  Declaro y acepto el{' '}
                  <button
                    type="button"
                    onClick={() => openPdf('Conflicto de interés', PDF_CONFLICTO_INTERES_URL)}
                    className="font-semibold text-emerald-700 underline inline-flex items-center gap-1"
                  >
                    Conflicto de interés <ExternalLink className="w-3 h-3" />
                  </button>{' '}
                  (en caso de existir, informarlo).
                </span>
              </label>
            </div>

            <div className="p-6 border-t flex flex-col md:flex-row gap-3 md:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  Swal.fire({
                    position: "center",
                    icon: "warning",
                    title: "¡Advertencia Debes aceptar para continuar!",
                    text: "No puedes registrar aspirantes sin aceptar los consentimientos.",
                    showConfirmButton: false,
                    timer: 5000,
                    customClass: {
                      title: 'swal2-title-sm'
                    }
                  });
                }}
              >
                No aceptar
              </Button>

              <Button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={!aceptaTratamientoDatos || !aceptaConflictoInteres}
                onClick={() => {
                  setShowConsentGate(false);
                  Swal.fire({
                    position: "center",
                    icon: "success",
                    title: "Consentimientos aceptados",
                    text: "Ya puedes continuar con el registro del aspirante.",
                    showConfirmButton: false,
                    timer: 5000,
                    customClass: {
                      title: 'swal2-title-sm'
                    }
                  });
                }}
              >
                Aceptar y continuar
              </Button>
            </div>
          </div>
        </div>
      )}

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className={`space-y-6 max-w-6xl mx-auto ${showConsentGate ? 'pointer-events-none select-none blur-[1px]' : ''}`}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Registro de Personal</h1>
            <p className="text-gray-500">Diligencie la información del aspirante</p>
          </div>
          <div className="flex gap-2">
            <div className="text-right text-xs text-gray-400">
              <p>Creado: {formData.FechaCreacion}</p>
              <p>Usuario: {formData.UsuarioActualizacion}</p>
            </div>
          </div>
        </div>

        {/* 1. Identificación y Registro (con foto grande y cuadrada) */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-emerald-600 mb-8">
          <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="relative">
                {fotoDoc ? (
                  <img
                    src={fotoDoc.DocumentoCargado || fotoDoc.url || ''}
                    alt="Foto del aspirante"
                    className="w-32 h-32 rounded-xl object-cover border-2 border-emerald-500 shadow-md"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 border-2 border-dashed border-emerald-300">
                    <User className="w-12 h-12" />
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-800">Identificación y Registro</h2>
                <p className="text-xs text-gray-500">
                  Cargue la foto del aspirante. Esta imagen se usará en todo el proceso Documento obligatorio
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="relative">
                <input
                  id="fotoAspiranteInput"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'fotoAspirante')}
                />
                <label
                  htmlFor="fotoAspiranteInput"
                  className="cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-emerald-600 text-emerald-700 text-xs font-semibold rounded-full bg-white hover:bg-emerald-50 transition-colors"
                >
                  Cargar / Cambiar foto
                </label>
              </div>
              {fotoDoc && (
                <p className="text-[11px] text-gray-400 max-w-[180px] text-right truncate">
                  Archivo: {fotoDoc.Nombre}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Tipo de Identificación *</Label>
              <Select
                disabled={existeAspirante} // 🚫 Bloquear cambio de tipo de identificación si el aspirante ya existe
                value={formData.IdTipoIdentificacion !== undefined && formData.IdTipoIdentificacion !== null ? String(formData.IdTipoIdentificacion) : ''}
                onValueChange={(v) => handleSelectChange('IdTipoIdentificacion', parseInt(v, 10))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {TIPOS_IDENTIFICACION.map((item) => (
                    <SelectItem key={item.key} value={String(item.key)}>{item.value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

           <div className="space-y-2">
            <Label>Número de Identificación *</Label>
            <Input
              name="NumeroIdentificacion"
              value={formData.NumeroIdentificacion ?? ""}
              placeholder="Ej. 1012345678"
              inputMode="numeric"
              pattern="\d*"
              maxLength={10}
              disabled={existeAspirante} // 🚫 Bloquear edición del número de identificación si el aspirante ya existe
              onChange={(e) => {
                const soloNumeros = (e.target.value || "").replace(/\D/g, "").slice(0, 10);
                setFormData((prev) => ({
                  ...prev,
                  NumeroIdentificacion: soloNumeros,
                }));
              }}
              onBlur={handlePreloadAspirante}
            />
          </div>

          <div className="space-y-2">
            <Label>Confirmar Número de Identificación *</Label>
            <Input
              name="NumeroIdentificacionConfirmacion"
              value={numeroIdConfirmacion ?? ""}
              placeholder="Vuelva a escribir el número"
              inputMode="numeric"
              pattern="\d*"
              maxLength={10}
              onChange={(e) => {
                const soloNumeros = (e.target.value || "").replace(/\D/g, "").slice(0, 10);
                setNumeroIdConfirmacion(soloNumeros);
              }}
              // 🚫 Bloquear pegar (y también copiar/cortar/arrastrar)
              onPaste={(e) => e.preventDefault()}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
              className={
                numeroIdConfirmacion &&
                String(numeroIdConfirmacion).trim() !== String(formData.NumeroIdentificacion ?? "").trim()
                  ? "border-red-500 focus-visible:ring-red-500"
                  : ""
              }
              onBlur={() => {
                const a = String(formData.NumeroIdentificacion ?? "").trim();
                const b = String(numeroIdConfirmacion ?? "").trim();
                if (b && a !== b) {
                  toast({
                    title: "❌ Los números no coinciden",
                    description: "El número de identificación confirmado debe ser igual al número principal.",
                    variant: "destructive",
                  });
                }
              }}
            />

            {numeroIdConfirmacion &&
              String(numeroIdConfirmacion).trim() !== String(formData.NumeroIdentificacion ?? "").trim() && (
                <p className="text-xs text-red-600">El número no coincide con el principal.</p>
              )}
          </div>


            <div className="space-y-2">
              <Label>Fecha de Expedición *</Label>
              <Input
                type="date"
                name="FechaExpedicion"
                value={formData.FechaExpedicion}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Lugar de Expedición *</Label>
              <Input
                name="LugarExpedicion"
                value={formData.LugarExpedicion}
                onChange={(e) => {
                  const soloLetras = e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '');
                  handleInputChange({
                    target: {
                      name: 'LugarExpedicion',
                      value: soloLetras,
                    },
                  });
                }}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>¿Cómo se enteró de la vacante?</Label>
              <Select
                value={formData.ComoSeEnteroVacante}
                onValueChange={(v) => handleSelectChange('ComoSeEnteroVacante', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {FUENTES_VACANTE.map((item) => (
                    <SelectItem key={item.key} value={item.value}>
                      {item.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 2. Datos Personales */}
        {renderSection(
          'Datos Personales',
          <Info className="w-5 h-5" />,
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Nombres *</Label>
               <Input
                name="Nombres"
                value={formData.Nombres}
                placeholder="Nombres completos"
                onChange={(e) => {
                  const raw = e.target.value;
                  // ✅ Solo letras (cualquier idioma) + espacios
                  const cleaned = raw.replace(/[^\p{L}\s]/gu, "");
                  setFormData((prev) => ({ ...prev, Nombres: cleaned }));
                }}
              />
              </div>

            <div className="space-y-2">
              <Label>Apellidos *</Label>
              <Input
                name="Apellidos"
                value={formData.Apellidos}
                onChange={handleInputChange}
                placeholder="Apellidos completos"
              />
            </div>

            <div className="space-y-2">
              <Label>Género *</Label>
              <Select
                value={formData.IdTipoGenero !== undefined && formData.IdTipoGenero !== null ? String(formData.IdTipoGenero) : ''}
                onValueChange={(v) => handleSelectChange('IdTipoGenero', parseInt(v, 10))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {GENEROS.map((item) => (
                    <SelectItem key={item.key} value={String(item.key)}>
                      {item.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estado Civil *</Label>
              <Select
                value={formData.IdTipoEstadoCivil !== undefined && formData.IdTipoEstadoCivil !== null ? String(formData.IdTipoEstadoCivil) : ''}
                onValueChange={(v) => handleSelectChange('IdTipoEstadoCivil', parseInt(v, 10))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {ESTADOS_CIVILES.map((item) => (
                    <SelectItem key={item.key} value={String(item.key)}>
                      {item.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* <div className="space-y-2">
                <Label>Lugar de Nacimiento *</Label>
                <Input
                  name="IdLugarNacimiento"
                  value={formData.IdLugarNacimiento}
                  onChange={handleInputChange}
                  placeholder="Selecciona o escribe la ciudad"
                  list="IdLugarNacimiento"
                />
                <datalist id="IdLugarNacimiento">
                  {localidades.length > 0
                    ? localidades.map((item) => (
                        <option key={item.IdLocalidad} value={item.Nombre} />
                      ))
                    : null
                  }
                </datalist>
              </div> */}
              <div className="space-y-2">
                <Label>Lugar de Nacimiento *</Label>
                <Select
                  value={formData.IdLugarNacimiento ? String(formData.IdLugarNacimiento) : ''}
                  onValueChange={v => handleSelectChange('IdLugarNacimiento', Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {lugarNacimiento.length > 0
                      ? lugarNacimiento.map((item) => (
                          <SelectItem key={item.IdLugarNacimiento} value={String(item.IdLugarNacimiento)}>
                            {item.Nombre}
                          </SelectItem>
                        ))
                      : <div className="px-3 py-2 text-sm text-gray-500">Sin opciones</div>
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha de Nacimiento</Label>
                <Input
                  type="date"
                  name="FechaNacimiento"
                  value={formData.FechaNacimiento}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 space-y-2">
              <Label>
                ¿Tiene Usted alguna limitación física, sensorial o cognitiva que debamos considerar?
              </Label>
              <Select
                value={formData.TieneLimitacionesFisicas}
                onValueChange={(v) => handleSelectChange('TieneLimitacionesFisicas', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value="Ninguna">Ninguna</SelectItem>
                  <SelectItem value="Limitacion visual">Limitacion  visual</SelectItem>
                  <SelectItem value="Limitacion  auditiva">Limitacion auditiva</SelectItem>
                  <SelectItem value="Limitacion  motriz">Limitacion motriz</SelectItem>
                  <SelectItem value="Limitacion  Cognitiva">Limitacion intelectual</SelectItem>
                  <SelectItem value="Limitacion  múltiple">Limitacion  múltiple</SelectItem>
                </SelectContent>
              </Select>

              {formData.LimitacionFisica === 'Otra' && (
                <Input
                  name="LimitacionFisicaOtra"
                  value={formData.LimitacionFisicaOtra || ''}
                  onChange={handleInputChange}
                  placeholder="Describa la limitación..."
                  className="mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>¿Tiene Hijos?</Label>
              <Select
                value={formData.TieneHijos === true ? 'true' : formData.TieneHijos === false ? 'false' : ''}
                onValueChange={(v) => handleSelectChange('TieneHijos', v === 'true')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value="true">Si</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

          {formData.TieneHijos === true && (
            <div className="space-y-2">
            <Label>¿Cuántos hijos?</Label>

            <Input
              type="text"
              name="CuantosHijos"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Ej: 1"
              value={
                formData.CuantosHijos === 0 ||
                formData.CuantosHijos === null ||
                formData.CuantosHijos === undefined
                  ? ""
                  : String(formData.CuantosHijos)
              }
              onChange={(e) => {
                // Solo números y máximo 2 dígitos
                const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 2);
                handleInputChange({
                  target: { name: "CuantosHijos", value: onlyDigits },
                });
              }}
              onKeyDown={(e) => {
                if (["e", "E", "+", "-", ".", ",", " "].includes(e.key)) e.preventDefault();
              }}
            />
          </div>
        )}

            

            {formData.TieneHijos === true && (
              <div className="col-span-1 md:col-span-2 space-y-2">
                <Label>
                  ¿Tiene su Hijo (a) alguna limitación física, sensorial o cognitiva que debamos
                  considerar?
                </Label>
                <Select
                  value={formData.IdLimitacionFisicaHijo !== undefined && formData.IdLimitacionFisicaHijo !== null ? String(formData.IdLimitacionFisicaHijo) : ''}
                  onValueChange={v => handleSelectChange('IdLimitacionFisicaHijo', Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value="1">Ninguna</SelectItem>
                    <SelectItem value="2">Limitacion  visual</SelectItem>
                    <SelectItem value="3">Limitacion auditiva</SelectItem>
                    <SelectItem value="4">Limitacion motriz</SelectItem>
                    <SelectItem value="5">Limitacion cognitiva</SelectItem>
                    <SelectItem value="7">Limitacion múltiple</SelectItem>
                    <SelectItem value="8">Otra</SelectItem>
                  </SelectContent>
                </Select>

                {formData.LimitacionFisica === 'Otra' && (
                  <Input
                    name="LimitacionFisicaOtra"
                    value={formData.LimitacionFisicaOtra || ''}
                    onChange={handleInputChange}
                    placeholder="Describa la limitación..."
                    className="mt-2"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. Dirección y Datos Adicionales */}
        {renderSection(
          'Dirección y Datos Adicionales',
          <MapPin className="w-5 h-5" />,
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ✅ NUEVO: Dirección estructurada + manual (mismo campo final) */}
           {/* ✅ Dirección ESTRUCTURADA (única) */}
          <div className="space-y-2 md:col-span-2">
            <div>
              <Label>Dirección de residencia *</Label>
              <p className="text-xs text-gray-500 mt-1">
                Completa la dirección en formato estructurado. Si tu dirección es por Manzana/Torre/Lote/Interior/Apto, usa el campo de observaciones.
              </p>
            </div>

            {/* Estructurada */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Tipo de vía</Label>
                <Select
                  value={direccionParts.tipoVia}
                  onValueChange={(v) => setDireccionParts((p) => ({ ...p, tipoVia: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_VIA.map((t) => (
                      <SelectItem key={t.key} value={t.value}>
                        {t.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Input
                value={direccionParts.viaNumero}
                onChange={(e) => {
                  const v = (e.target.value || "").replace(/\D/g, "").slice(0, 5); // solo números, máx 5
                  setDireccionParts((p) => ({ ...p, viaNumero: v }));
                }}
                placeholder="Ej: 16"
                inputMode="numeric"
                maxLength={5}
/>


               {/* ✅ BIS (AQUÍ VA PEGADO) */}
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">BIS (opcional)</Label>
                <Select
                  value={direccionParts.viaBis}
                  onValueChange={(v) => setDireccionParts((p) => ({ ...p, viaBis: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin BIS" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {BIS_OPCIONES.map((b) => (
                      <SelectItem key={b.key} value={b.key}>
                        {b.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>


              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Letra (opcional)</Label>
                <Select
                  value={direccionParts.viaLetra}
                  onValueChange={(v) => setDireccionParts((p) => ({ ...p, viaLetra: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin letra" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {LETRAS.map((l) => (
                      <SelectItem key={`viaL-${l.key}`} value={l.key}>
                        {l.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Orientación (opcional)</Label>
                <Select
                  value={direccionParts.viaOrient || 'Sin orientación'}
                  onValueChange={(v) =>
                    setDireccionParts((p) => ({ ...p, viaOrient: v === 'Sin orientación' ? '' : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin orientación" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* 👇 IMPORTANTE: valores NO vacíos */}
                    <SelectItem value="Sin orientación">Sin orientación</SelectItem>
                    <SelectItem value="Norte">Norte</SelectItem>
                    <SelectItem value="Sur">Sur</SelectItem>
                    <SelectItem value="Este">Este</SelectItem>
                    <SelectItem value="Oeste">Oeste</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
              {/* Placa número */}
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Placa número</Label>
                <Input
                  value={direccionParts.placaNumero}
                  onChange={(e) => {
                    const v = (e.target.value || "").replace(/\D/g, "").slice(0, 5);
                    setDireccionParts((p) => ({ ...p, placaNumero: v }));
                  }}
                  placeholder="Ej: 45"
                  inputMode="numeric"
                  maxLength={5}
                />
              </div>

              {/* Letra placa */}
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Letra placa (opcional)</Label>
                <Select
                  value={direccionParts.placaLetra}
                  onValueChange={(v) => setDireccionParts((p) => ({ ...p, placaLetra: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin letra" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {LETRAS.map((l) => (
                      <SelectItem key={`plaL-${l.key}`} value={l.key}>
                        {l.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ✅ NUEVO: Segundo número después de la letra */}
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Número adicional (opcional)</Label>
                <Input
                  value={direccionParts.placaNumero2}
                  onChange={(e) => {
                    const v = (e.target.value || "").replace(/\D/g, "").slice(0, 5);
                    setDireccionParts((p) => ({ ...p, placaNumero2: v }));
                  }}
                  placeholder="Ej: 12"
                  inputMode="numeric"
                  maxLength={5}
                />
              </div>

              {/* Orientación placa */}
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Orientación placa (opcional)</Label>
                <Select
                  value={direccionParts.placaOrient || 'Sin orientación'}
                  onValueChange={(v) =>
                    setDireccionParts((p) => ({ ...p, placaOrient: v === 'Sin orientación' ? '' : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin orientación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sin orientación">Sin orientación</SelectItem>
                    <SelectItem value="Norte">Norte</SelectItem>
                    <SelectItem value="Sur">Sur</SelectItem>
                    <SelectItem value="Este">Este</SelectItem>
                    <SelectItem value="Oeste">Oeste</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>


            <div className="mt-3">
              <Label className="text-xs text-gray-600">Dirección final (así quedará guardada)</Label>
              <Input value={formData.DatosAdicionales.Direccion || ''} readOnly className="bg-gray-50" />
            </div>

            <div className="mt-3">
              <Label className="text-xs text-gray-600">
                Observaciones (Manzana / Torre / Lote / Interior / Apto) (opcional)
              </Label>

              {/* ✅ Leyenda que pediste */}
              <p className="text-[11px] text-gray-500 mt-1">
                Si tu dirección no tiene nomenclatura estándar (por ejemplo: Manzana, Torre, Lote), escríbela aquí.
              </p>

              <Textarea
                value={direccionParts.observaciones}
                onChange={(e) => setDireccionParts((p) => ({ ...p, observaciones: e.target.value }))}
                placeholder="Ej: Manzana 3 Torre 2 Apto 401, Conjunto X..."
              />
            </div>
          </div>


            {/* <div className="space-y-2">
              <Label>Ciudad / Municipio</Label>
              <Select
                value={formData.DatosAdicionales.IdCiudad ? String(formData.DatosAdicionales.IdCiudad) : ''}
                onValueChange={v => {
                  setFormData(prev => ({
                    ...prev,
                    DatosAdicionales: {
                      ...prev.DatosAdicionales,
                      IdCiudad: Number(v)
                    }
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {CIUDADES_MUNICIPIOS_BOGOTA.map((items) => (
                    <SelectItem key={items.key} value={String(items.key)}>
                      {items.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}

            <div className="space-y-2">
              <Label>Localidad</Label>
              <Select
                value={formData.DatosAdicionales.IdLocalidad ? String(formData.DatosAdicionales.IdLocalidad) : ''}
                onValueChange={v => {
                  setFormData(prev => ({
                    ...prev,
                    DatosAdicionales: {
                      ...prev.DatosAdicionales,
                      IdLocalidad: Number(v)
                    }
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {localidades.length > 0
                    ? localidades.map((item) => (
                        <SelectItem key={item.IdLocalidad} value={String(item.IdLocalidad)}>
                          {item.Nombre}
                        </SelectItem>
                      ))
                    : <div className="px-3 py-2 text-sm text-gray-500">Sin opciones</div>
                  }
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Barrio</Label>
              <Input
                name="Barrio"
                value={formData.DatosAdicionales.Barrio || ''}
                onChange={e => {
                  setFormData(prev => ({
                    ...prev,
                    DatosAdicionales: {
                      ...prev.DatosAdicionales,
                      Barrio: e.target.value
                    }
                  }));
                }}
                placeholder="Escriba el nombre del barrio"
              />
            </div>

            <div className="space-y-2">
              <Label>Estrato</Label>
              <Select
                value={formData.DatosAdicionales.Estrato ? String(formData.DatosAdicionales.Estrato) : ''}
                onValueChange={v => {
                  setFormData(prev => ({
                    ...prev,
                    DatosAdicionales: {
                      ...prev.DatosAdicionales,
                      Estrato: Number(v)
                    }
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="6">6</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Grupo sanguíneo</Label>
              <Select
                value={formData.DatosAdicionales.IdGrupoSanguineo !== undefined && formData.DatosAdicionales.IdGrupoSanguineo !== null ? String(formData.DatosAdicionales.IdGrupoSanguineo) : ''}
                onValueChange={v => {
                  setFormData(prev => ({
                    ...prev,
                    DatosAdicionales: {
                      ...prev.DatosAdicionales,
                      IdGrupoSanguineo: Number(v)
                    }
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {Array.isArray(GRUPOS_SANGUINEOS) && GRUPOS_SANGUINEOS.length > 0 ? (
                    GRUPOS_SANGUINEOS.map((item) => (
                      <SelectItem key={item.key} value={String(item.key)}>
                        {item.value}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">Sin opciones</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Hobby / Actividad favorita</Label>
              <Select
                value={formData.DatosAdicionales.HobbyPasatiempo || ''}
                onValueChange={v => {
                  setFormData(prev => ({
                    ...prev,
                    DatosAdicionales: {
                      ...prev.DatosAdicionales,
                      HobbyPasatiempo: v
                    }
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {HOBBIES.map((items) => (
                    <SelectItem key={items.key} value={items.value}>
                      {items.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {formData.DatosAdicionales.HobbyPasatiempo === 'Otro' && (
                <Input
                  name="HobbyPasatiempoOtro"
                  value={formData.DatosAdicionales.HobbyPasatiempoOtro || ''}
                  onChange={e => {
                    setFormData(prev => ({
                      ...prev,
                      DatosAdicionales: {
                        ...prev.DatosAdicionales,
                        HobbyPasatiempoOtro: e.target.value
                      }
                    }));
                  }}
                  placeholder="Especifique su hobby..."
                  className="mt-2"
                />
              )}
            </div>
          </div>
        )}

        {/* 4. Información de Contacto */}
        {renderSection(
          'Información de Contacto',
          <Phone className="w-5 h-5" />,
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email principal (NO se toca) */}
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              name="Email"
              value={formData.Email}
              onChange={handleInputChange}
              placeholder="correo@ejemplo.com"
            />
          </div>

          {/* Confirmación correo (AQUÍ va el bloqueo) */}
          <div className="space-y-2">
            <Label>Confirmación Correo*</Label>
            <Input
              type="email"
              name="EmailConfirmacion"
              value={emailConfirmacion}
              onChange={(e) => setEmailConfirmacion(e.target.value)}
              placeholder="correo@ejemplo.com"

              // 🚫 Bloquear pegar/copiar/cortar/arrastrar/soltar
              onPaste={(e) => e.preventDefault()}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}

              className={
                emailConfirmacion &&
                emailConfirmacion.trim().toLowerCase() !==
                  String(formData.Email ?? "").trim().toLowerCase()
                  ? "border-red-500 focus-visible:ring-red-500"
                  : ""
              }
              onBlur={() => {
                const email1 = String(formData.Email ?? "").trim().toLowerCase();
                const email2 = String(emailConfirmacion ?? "").trim().toLowerCase();
                if (email2 && email1 !== email2) {
                  toast({
                    title: "❌ Los correos no coinciden",
                    description:
                      "El correo de confirmación debe ser igual al correo principal.",
                    variant: "destructive",
                  });
                }
              }}
            />

            {emailConfirmacion &&
              formData.Email &&
              emailConfirmacion.trim().toLowerCase() !==
                String(formData.Email ?? "").trim().toLowerCase() && (
                <p className="text-xs text-red-600">
                  El correo no coincide con el email principal.
                </p>
              )}
          </div>

           <div className="space-y-2">
            <Label>Celular *</Label>

            <Input
              type="tel"
              name="Celular"
              value={formData.Celular}
              onChange={handleCelularChange}
              placeholder="3001234567"
              inputMode="numeric"
              maxLength={10}
              aria-invalid={!!celularError}
              className={celularError ? "border-red-500 focus-visible:ring-red-500" : ""}
            />

            {celularError && (
              <p className="text-sm text-red-600">{celularError}</p>
            )}
          </div>


            <div className="space-y-2">
              <Label>¿Tiene WhatsApp?</Label>
              <Select
                value={formData.TieneWhatsapp === true ? 'true' : formData.TieneWhatsapp === false ? 'false' : ''}
                onValueChange={v => handleSelectChange('TieneWhatsapp', v === 'true')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value="true">Si</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
            <Label>Número WhatsApp</Label>

            <Input
              type="tel"
              name="NumeroWhatsapp"
              value={formData.NumeroWhatsapp}
              onChange={handleWhatsappChange}
              disabled={formData.TieneWhatsapp === false}
              placeholder="3001234567"
              inputMode="numeric"
              maxLength={10}
              aria-invalid={!!whatsappError}
              className={whatsappError ? "border-red-500 focus-visible:ring-red-500" : ""}
            />

            {whatsappError && (
              <p className="text-sm text-red-600">{whatsappError}</p>
            )}
          </div>


            <div className="space-y-2">
              <Label>Nombre Completo Contacto Emergencia</Label>
              <Input
                name="ContactoEmergencia"
                value={formData.ContactoEmergencia}
                onChange={handleInputChange}
                placeholder="Nombre y relación"
              />
            </div>

            <div className="space-y-2">
              <Label>Teléfono Emergencia</Label>
              <Input
                type="tel"
                name="TelefonoContactoEmergencia"
                value={formData.TelefonoContactoEmergencia}
                onChange={handleInputChange}
              />
            </div>
          </div>
        )}

        {/* 5. Datos Físicos y Salud */}
          {renderSection(
            'Datos Físicos y Salud',
            <Heart className="w-5 h-5" />,
            <>
              {/* ✅ FILA 1: EPS | Fondo de Pensiones | Fondo de Cesantías */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* EPS */}
                <div className="space-y-2">
                  <Label>EPS *</Label>
                  <Select
                    value={formData.IdTipoEps ? String(formData.IdTipoEps) : ''}
                    onValueChange={(v) => handleSelectChange('IdTipoEps', parseInt(v, 10))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar EPS" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {EPS.map((item) => (
                        <SelectItem key={item.key} value={String(item.key)}>
                          {item.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Fondo de Pensiones */}
                <div className="space-y-2">
                  <Label>Fondo de Pensiones *</Label>
                  <Select
                    value={
                      formData.IdFondoPensiones !== undefined && formData.IdFondoPensiones !== null
                        ? String(formData.IdFondoPensiones)
                        : ''
                    }
                    onValueChange={(v) => {
                      if (v === 'Otro') {
                        handleSelectChange('IdFondoPensiones', v);
                      } else {
                        handleSelectChange('IdFondoPensiones', parseInt(v, 10));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar Fondo de Pensiones" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      <SelectItem value="1">Colfondos</SelectItem>
                      <SelectItem value="2">Colpensiones</SelectItem>
                      <SelectItem value="3">Horizontes</SelectItem>
                      <SelectItem value="4">Porvenir</SelectItem>
                      <SelectItem value="5">Protección + I.N.G</SelectItem>
                      <SelectItem value="7">Skandia Pensiones y Cesantías S.A</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>

                  {formData.IdFondoPensiones === 'Otro' && (
                    <Input
                      name="IdFondoPensionesOtro"
                      value={formData.IdFondoPensionesOtro || ''}
                      onChange={handleInputChange}
                      placeholder="Especifique el fondo..."
                      className="mt-2"
                    />
                  )}
                </div>

                {/* ✅ NUEVO: Fondo de Cesantías (tipo lista, aunque aún no tengas la lista real) */}
                <div className="space-y-2">
                  <Label>Fondo de Cesantías</Label>
                  <Select
                    value={
                      formData.IdFondoCesantias !== undefined && formData.IdFondoCesantias !== null
                        ? String(formData.IdFondoCesantias)
                        : ''
                    }
                    onValueChange={(v) => {
                      if (v === 'Otro') {
                        handleSelectChange('IdFondoCesantias', v);
                      } else {
                        handleSelectChange('IdFondoCesantias', parseInt(v, 10));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar Fondo de Cesantías" />
                    </SelectTrigger>

                    <SelectContent className="max-h-60 overflow-y-auto">
                      <SelectItem value="1">SIN DEFINIR</SelectItem>
                      <SelectItem value="2">CESANTÍAS COLFONDOS</SelectItem>
                      <SelectItem value="3">CESANTÍAS FONDO NACIONAL DEL AHORRO</SelectItem>
                      <SelectItem value="4">CESANTÍAS HORIZONTE</SelectItem>
                      <SelectItem value="5">CESANTÍAS PORVENIR</SelectItem>
                      <SelectItem value="6">CESANTÍAS PROTECCIÓN S. A.</SelectItem>
                      <SelectItem value="7">CESANTÍAS I. N. G.</SelectItem>
                      <SelectItem value="8">CESANTÍAS SKANDIA</SelectItem>
                      <SelectItem value="9">CESANTÍAS SANTANDER</SelectItem>
                      <SelectItem value="10">CESANTÍAS OLD MUTUAL</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>

                  </Select>

                  {/* ✅ Si quieres también la opción "Otro" para cesantías, cuando metas la lista, deja esto listo */}
                  {formData.IdFondoCesantias === 'Otro' && (
                    <Input
                      name="IdFondoCesantiasOtro"
                      value={formData.IdFondoCesantiasOtro || ''}
                      onChange={handleInputChange}
                      placeholder="Especifique el fondo..."
                      className="mt-2"
                    />
                  )}
                </div>
              </div>

             {/* ✅ FILA 2: Peso | Altura */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* PESO */}
                <div className="space-y-2">
                  <Label>Peso (Kg)</Label>
                  <Input
                    type="text"
                    name="PesoKilogramos"
                    value={formData.PesoKilogramos ? String(formData.PesoKilogramos) : ""}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 3);
                      handleInputChange({
                        target: { name: "PesoKilogramos", value: digits },
                      });
                    }}
                    onKeyDown={(e) => {
                      if (["e", "E", "+", "-", ".", ",", " "].includes(e.key)) e.preventDefault();
                    }}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder=""
                  />
                </div>

                {/* ALTURA */}
                <div className="space-y-2">
                  <Label>Altura (Metros)</Label>
                  <Input
                    type="text"
                    name="AlturaMetros"
                    value={formData.AlturaMetros ? String(formData.AlturaMetros) : ""}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 3);
                      handleInputChange({
                        target: { name: "AlturaMetros", value: digits },
                      });
                    }}
                    onKeyDown={(e) => {
                      if (["e", "E", "+", "-", ".", ",", " "].includes(e.key)) e.preventDefault();
                    }}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder=""
                  />
                </div>
              </div>
            </>
          )}

        {/* 6. Núcleo Familiar */}
        {renderSection(
          'Núcleo Familiar',
          <Users className="w-5 h-5" />,
          <div className="space-y-4">
            {/* Familiares en la empresa */}
            <div className="p-4 border rounded-lg bg-white">
              <div className="space-y-2">
                <Label>¿Tiene familiares que actualmente trabajen en Aseos La Perfección?</Label>
                <Select
                  value={formData.NucleoFamiliar[0].TieneparentescoEnLaEmpresa || 'false'}
                  onValueChange={(v) => {
                    setFormData(prev => {
                      let updatedFamiliar = {
                        ...prev.NucleoFamiliar[0],
                        TieneparentescoEnLaEmpresa: v
                      };
                      if (v === 'false') {
                        updatedFamiliar = {
                          ...updatedFamiliar,
                          NombreFamiliarEmpresa: '',
                          CedulaFamiliarEmpresa: '',
                          CargoDesempenaEmpresa: '',
                          ParentescoFamiliarEmpresa: ''
                        };
                      }
                      return {
                        ...prev,
                        NucleoFamiliar: [
                          updatedFamiliar,
                          ...prev.NucleoFamiliar.slice(1)
                        ]
                      };
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value="true">Sí</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.NucleoFamiliar[0].TieneparentescoEnLaEmpresa === 'true' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-1">
                    <Label>Nombre del familiar que labora en la empresa</Label>
                   <Input
                      name="NombreFamiliarEmpresa"
                      value={formData.NucleoFamiliar?.[0]?.NombreFamiliarEmpresa || ""}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, ""); // ✅ solo letras + espacios
                        handleFamiliarChange(0, { target: { name: e.target.name, value: cleaned } });
                      }}
                      placeholder="Nombre completo"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Cédula del familiar</Label>
                    <Input
                      name="CedulaFamiliarEmpresa"
                      value={formData.NucleoFamiliar?.[0]?.CedulaFamiliarEmpresa || ""}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[^\d]/g, "").slice(0, 10); // ✅ solo 0-9 y máx 10
                        handleFamiliarChange(0, { target: { name: e.target.name, value: cleaned } });
                      }}
                      placeholder="Número de identificación"
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Cargo que desempeña</Label>
                    <Input
                      name="CargoDesempenaEmpresa"
                      value={formData.NucleoFamiliar?.[0]?.CargoDesempenaEmpresa || ""}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, ""); // ✅ solo letras + espacios
                        handleFamiliarChange(0, { target: { name: e.target.name, value: cleaned } });
                      }}
                      placeholder="Cargo actual en la empresa"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Parentesco</Label>
                    <Select
                      value={formData.NucleoFamiliar[0].ParentescoFamiliarEmpresa || ''}
                      onValueChange={v => handleFamiliarSelectChange(0, 'ParentescoFamiliarEmpresa', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {PARENTESCOS.map((item) => (
                          <SelectItem key={item.key} value={item.value}>
                            {item.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* ✅ Nota para el aspirante (frase #4) */}
            <div className="mt-2 mb-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <p className="text-sm text-emerald-900">
                <span className="font-semibold">Nota:</span>⚠️ Obligatorio: Registra todas las personas que viven contigo sin importar el parentesco. Si falta alguien, el registro quedará incompleto.
              </p>
            </div>

            {formData.NucleoFamiliar.map((familiar, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gray-50/50 relative">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label>Nombres y Apellidos Completos del familiar</Label>
                   <Input
                      name="Nombre"
                      value={familiar.Nombre || ""}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, ""); // ✅ solo letras + espacios
                        handleFamiliarChange(index, { target: { name: e.target.name, value: cleaned } });
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Parentesco</Label>
                    <Select
                      value={familiar.Parentesco || ''}
                      onValueChange={(v) => handleFamiliarSelectChange(index, 'Parentesco', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {PARENTESCOS.map((item) => (
                          <SelectItem key={item.key} value={item.value}>
                            {item.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {familiar.Parentesco === 'Otro' && (
                      <Input
                        className="mt-2"
                        name="ParentescoOtro"
                        value={familiar.ParentescoOtro || ''}
                        onChange={(e) => handleFamiliarChange(index, e)}
                        placeholder="Especifique el parentesco..."
                      />
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label>Edad</Label>
                   <Input
                    name="Edad"
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={String(familiar.Edad ?? "")}
                    onChange={(e) => {
                      const v = (e.target.value || "").replace(/\D/g, "").slice(0, 2); // solo 2 dígitos
                      handleDynamicListChange("NucleoFamiliar", index, "Edad", v);
                    }}
                    placeholder="00"
                  />

                  </div>

                  <div className="space-y-1">
                    <Label>Ocupación</Label>
                    <Select
                      value={familiar.Ocupacion}
                      onValueChange={(v) => handleFamiliarSelectChange(index, 'Ocupacion', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        <SelectItem value="estudiante">Estudiante</SelectItem>
                        <SelectItem value="empleado">Empleado</SelectItem>
                        <SelectItem value="independiente">Independiente</SelectItem>
                        <SelectItem value="desempleado">Desempleado</SelectItem>
                        <SelectItem value="pensionado">Pensionado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label>Teléfono</Label>
                    <Input
                      name="Telefono"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={String(familiar.Telefono ?? "")}
                      onChange={(e) => {
                        const v = (e.target.value || "").replace(/\D/g, "").slice(0, 10);
                        handleDynamicListChange("NucleoFamiliar", index, "Telefono", v);
                      }}
                      placeholder="3001234567"
                    />

                  </div>

                  <div className="space-y-1">
                    <Label>Depende Económicamente</Label>
                    <Select
                      value={familiar.Depende}
                      onValueChange={(v) => handleFamiliarSelectChange(index, 'Depende', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        <SelectItem value="Si">Si</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 md:col-span-3">
                    <Label>Observaciones</Label>
                    <Input
                      name="Observaciones"
                      value={familiar.Observaciones || ''}
                      onChange={(e) => handleFamiliarChange(index, e)}
                      placeholder="Observaciones adicionales..."
                    />
                  </div>
                </div>

                {formData.NucleoFamiliar.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-3 -right-3"
                    onClick={() => removeFamiliar(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addFamiliar}>
              Añadir Familiar
            </Button>
          </div>
        )}

        {/* 7. Formación y Educación */}
        {renderSection(
          'Formación y Educación',
          <BookOpen className="w-5 h-5" />,
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Nivel académico</Label>
              <Select
                value={formData.IdNivelEducativo !== undefined && formData.IdNivelEducativo !== null ? String(formData.IdNivelEducativo) : ''}
                onValueChange={(v) => handleSelectChange('IdNivelEducativo', Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>

                <SelectContent className="max-h-60 overflow-y-auto">
                  {NIVELES_EDUCATIVOS.map((item) => (
                    <SelectItem key={item.key} value={String(item.key)}>
                      {item.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estado formación</Label>
              <Select
                value={formData.IdTipoEstadoFormacion || ''}
                onValueChange={(v) => handleSelectChange('IdTipoEstadoFormacion', parseInt(v, 10))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value={1}>En curso</SelectItem>
                  <SelectItem value={2}>Finalizado</SelectItem>
                  <SelectItem value={3}>Incompleto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estudia actualmente</Label>
              <Select
                value={formData.EstudiaActualmente || ''}
                onValueChange={(v) => handleSelectChange('EstudiaActualmente', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value="No">No</SelectItem>
                  <SelectItem value="Si-Presencial">Sí, presencial</SelectItem>
                  <SelectItem value="Si-Virtual">Sí, virtual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Descripción formación / especialidad</Label>
              <Input
                name="DescripcionFormacionAcademica"
                value={formData.DescripcionFormacionAcademica}
                onChange={handleInputChange}
                placeholder="Ejemplo: Ingeniería de Sistemas, Especialidad en Seguridad Informática"
              />
            </div>
          </div>
        )}

        {/* 8. Experiencia Laboral */}
        {renderSection(
          'Experiencia Laboral',
          <Calendar className="w-5 h-5" />,
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Solo relacione experiencia laboral si cuenta con su debida certificación o soporte.
            </p>

            <div className="space-y-2">
              <Label>¿Cuenta con experiencia laboral previa?</Label>
              <Select
                value={formData.ExperienciaLaboral && formData.ExperienciaLaboral[0]?.TieneExperienciaPrevia ? 'true' : 'false'}
                onValueChange={(v) => {
                  const updated = [...formData.ExperienciaLaboral];
                  if (updated[0]) updated[0].TieneExperienciaPrevia = v === 'true';
                  handleSelectChange('ExperienciaLaboral', updated);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value={'true'}>Sí</SelectItem>
                  <SelectItem value={'false'}>No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {showExperienciaLaboral && (
              <>
                {formData.ExperienciaLaboral.map((exp, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50/50 relative">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label>Empresa</Label>
                        <Input
                          name="Compania"
                          value={exp.Compania || ""}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/[^A-Za-z0-9ÁÉÍÓÚáéíóúÑñÜü\s]/g, ""); // ✅ letras + números + espacios
                            handleExperienciaChange(index, { target: { name: e.target.name, value: cleaned } });
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Cargo desempeñado</Label>
                        <Input
                          name="Cargo"
                          value={exp.Cargo || ""}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, ""); // ✅ solo letras + espacios
                            handleExperienciaChange(index, { target: { name: e.target.name, value: cleaned } });
                          }}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>Tiempo duración</Label>
                        <Select
                          value={exp.TiempoDuracion || ''}
                          onValueChange={(v) =>
                            handleDynamicListChange('ExperienciaLaboral', index, 'TiempoDuracion', v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto">
                            <SelectItem value="menos de 2 meses">Menos de 2 meses</SelectItem>
                            <SelectItem value="2 meses a 1 año">De 2 meses a 1 año</SelectItem>
                            <SelectItem value="más de 1 año">Más de 1 año</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-1 md:col-span-2 space-y-1">
                        <Label>Funciones</Label>
                        <Textarea
                          name="Funciones"
                          value={exp.Funciones || ''}
                          onChange={(e) => handleExperienciaChange(index, e)}
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <Label>Nombres y apellidos del jefe inmediato</Label>
                       <Input
                          name="JefeInmediato"
                          value={exp.JefeInmediato || ""}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, ""); // ✅ solo letras + espacios
                            handleExperienciaChange(index, { target: { name: e.target.name, value: cleaned } });
                          }}
                          placeholder="Nombre del jefe inmediato"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <Label>Teléfono empresa o jefe inmediato</Label>
                        <Input
                          name="TelefonoJefe"
                          value={exp.TelefonoJefe || ""}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/[^\d]/g, "").slice(0, 10); // ✅ solo 0-9 y máx 10
                            handleExperienciaChange(index, { target: { name: e.target.name, value: cleaned } });
                          }}
                          placeholder="Teléfono de contacto"
                          inputMode="numeric"
                          pattern="[0-9]*"
                        />
                      </div>
                    </div>

                    {formData.ExperienciaLaboral.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-3 -right-3"
                        onClick={() => removeExperiencia(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={addExperiencia}>
                  Añadir Experiencia
                </Button>
              </>
            )}
          </div>
        )}

        <div style={{ display: "none" }}>
          {/* 9. Referencias Personales */}
            {renderSection(
              'Referencias Personales',
              <BookOpen className="w-5 h-5" />,
              <div className="space-y-4">
                {formData.Referencias.map((ref, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50/50 relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Nombre Completo</Label>
                      <Input
                          name="Nombre"
                          value={ref.Nombre || ""}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, ""); // ✅ solo letras + espacios
                            handleReferenciaPersonalChange(index, { target: { name: e.target.name, value: cleaned } });
                          }}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>Teléfono</Label>
                        <Input
                          name="Telefono"
                          type="tel"
                          value={ref.Telefono || ""}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/[^\d]/g, "").slice(0, 10); // ✅ solo 0-9 y máx 10
                            handleReferenciaPersonalChange(index, { target: { name: e.target.name, value: cleaned } });
                          }}
                          inputMode="numeric"
                          pattern="[0-9]*"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <Label>Parentesco/Relación</Label>
                        <Select
                          value={ref.Parentesco || ''}
                          onValueChange={(v) =>
                            handleReferenciaPersonalSelectChange(index, 'Parentesco', v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto">
                            {PARENTESCOS.map((item) => (
                              <SelectItem key={item.key} value={item.value}>
                                {item.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* ✅ NUEVO CAMPO: Tiempo de conocer al aspirante (desplegable) */}
                      <div className="space-y-1 md:col-span-2">
                        <Label>Tiempo de conocer al aspirante</Label>
                        <Select
                          value={ref.TiempoConocerlo || ''}
                          onValueChange={(v) =>
                            handleReferenciaPersonalSelectChange(index, 'TiempoConocerlo', v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto">
                            <SelectItem value="Menos de un año">Menos de un año</SelectItem>
                            <SelectItem value="Más de un año">Más de un año</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* ✅ FIN NUEVO CAMPO */}
                    </div>

                    {formData.Referencias.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-3 -right-3"
                        onClick={() => removeReferenciaPersonal(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={addReferenciaPersonal}>
                  Añadir Referencia Personal
                </Button>
              </div>
            )}
        </div>

        {/* 10. Requisitos obligatorios */}

        {renderSection(
          'Requisitos obligatorios',
          <FileCheck className="w-5 h-5" />,
          <div className="space-y-6">
            <p className="text-sm text-gray-500 -mt-2 mb-4">
              Adjunta cada soporte. Formato permitido: PDF (máx. {MAX_FILE_SIZE_MB} MB) para
              documentos. Foto y firma: imagen (PNG/JPG).
            </p>
            <p className="text-sm text-gray-500 -mt-2 mb-4">
              Importante: Para cada categoría, adjunte un (1) solo archivo PDF que contenga todos los soportes relacionados.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {requisitosObligatorios.map((req) => {
                const hasFile = !!documentos[req.IdTipoDocumentacion];

                /* ✅ CAMBIO: solo PDF, excepto Foto (2) que es imagen */
                let accept = '.pdf';
                if (req.IdTipoDocumentacion === 2) accept = 'image/*';

                return (
                  <div
                    key={req.IdTipoDocumentacion}
                    className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-all duración-200 flex flex-col justify-between h-full group"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 text-sm leading-tight min-h-[40px]">
                        {req.label}
                      </h4>

                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium mb-4 border ${hasFile
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-600 border-red-100'
                          }`}
                      >
                        {hasFile ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {hasFile ? 'Adjuntado' : 'Falta adjuntar'}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="file"
                            id={`file-${req.IdTipoDocumentacion}`}
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, req.IdTipoDocumentacion)}
                            accept={accept}
                          />
                          <label
                            htmlFor={`file-${req.IdTipoDocumentacion}`}
                            className="cursor-pointer flex items-center justify-center w-full px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                          >
                            Adjuntar
                          </label>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50 px-3 h-auto"
                          onClick={() => removeDocument(req.IdTipoDocumentacion)}
                          disabled={!hasFile}
                        >
                          Quitar
                        </Button>
                      </div>

                      <p className="text-xs text-gray-400 truncate h-4">
                        {hasFile ? (documentos[req.IdTipoDocumentacion].Nombre || documentos[req.IdTipoDocumentacion].NombreDocumento || 'Documento precargado') : 'Sin archivo'}
                      </p>

                      {/* NUEVO: enlace para VER y DESCARGAR el archivo */}
                      {hasFile && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="text-[11px] text-emerald-700 underline hover:text-emerald-900 transition-colors"
                            onClick={() => {
                              const doc = documentos[req.IdTipoDocumentacion];
                              const url = doc.PreviewUrl || doc.DocumentoCargado || doc.DocumentoBase64;
                              const nombre = doc.Nombre || doc.NombreDocumento || 'Documento';
                              openPdf(nombre, url);
                            }}
                          >
                            Ver archivo
                          </button>
                          <button
                            type="button"
                            className="text-[11px] text-blue-700 underline hover:text-blue-900 transition-colors"
                            onClick={() => {
                              const doc = documentos[req.IdTipoDocumentacion];
                              downloadDocument(doc);
                            }}
                          >
                            Descargar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Firma Digital (Dibujo) */}
            <div className="border p-4 rounded-lg mt-6 bg-gray-50">
              <Label className="mb-2 block">FIRMA DIGITAL (DIBUJO)</Label>
              <div className="flex flex-col md:flex-row gap-4">
                <div>
                  <SignaturePad
                    ref={(ref) => (window.firmaPad = ref)}
                    penColor="black"
                   canvasProps={{
                    width: window.innerWidth < 640 ? 320 : 300,
                    height: 140,
                    className: "rounded-lg bg-white border",
                    style: { touchAction: "none", width: "100%", maxWidth: 420, height: 140 }
                  }}

                    onEnd={() => {
                      if (window.firmaPad && !window.firmaPad.isEmpty()) {
                        const dataUrl = window.firmaPad.toDataURL();
                        setDocumentos((prev) => ({
                          ...prev,
                          42: {
                            IdTipoDocumentacion: 42,
                            Nombre: 'firma-digital.png',
                            Formato: 'image/png',
                            DocumentoCargado: dataUrl,
                          },
                        }));
                      }
                    }}
                  />

                  <div className="flex gap-2 mt-2">
                   <Button
                      type="button"
                      onClick={() => {
                        window.firmaPad?.clear();
                        setDocumentos((prev) => {
                          const copy = { ...prev };
                          delete copy[42];
                          return copy;
                        });
                      }}
                    >
                      Limpiar
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      className="bg-emerald-600 text-white"
                      onClick={() => {
                        if (window.firmaPad && !window.firmaPad.isEmpty()) {
                          const dataUrl = window.firmaPad.toDataURL();
                          setDocumentos((prev) => ({
                            ...prev,
                            42: {
                              IdTipoDocumentacion: 42,
                              Nombre: 'firma-digital.png',
                              Formato: 'image/png',
                              DocumentoCargado: dataUrl,
                            },
                          }));
                          toast({ title: '✅ Firma digital guardada exitosamente' });
                        }
                      }}
                    >
                      Guardar Firma
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-2">
                  <div className="text-sm text-gray-500">También puedes subir una imagen de la firma</div>
                  <Input
                    id="firmaDigital"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 42)}
                  />
                  <label
                    htmlFor="firmaDigital"
                    className="text-sm inline-block px-3 py-1 border rounded-md cursor-pointer bg-white hover:bg-emerald-50"
                  >
                    Cargar Imagen
                  </label>
                  {documentos[42] && (
                    <a
                      href={documentos[42].PreviewUrl || documentos[42].DocumentoCargado}
                      download="firma.png"
                      className="text-sm text-emerald-600 mt-2"
                    >
                      Descargar firma
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
              <Button
                type="button"
                onClick={handleFinalizarDocumentacion}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Finalizar Documentación
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-6 pb-12 sticky bottom-0 bg-white/80 backdrop-blur-sm p-4 border-t z-10">
          <Button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2 text-lg shadow-lg rounded-full flex-1 md:flex-none md:min-w-[200px]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" /> Guardar Registro
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="px-8 py-2 text-lg rounded-full"
            onClick={() => window.location.reload()}
            disabled={isSubmitting}
          >
            Nuevo
          </Button>
        </div>
      </motion.form>
    </>
  );
};

export default AspiranteView;
