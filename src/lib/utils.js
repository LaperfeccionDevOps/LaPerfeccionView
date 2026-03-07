// Importación dinámica para compatibilidad con Vite/React
let jsPDF, html2canvas;
async function ensurePDFLibs() {
	if (!jsPDF || !html2canvas) {
		const [{ jsPDF: _jsPDF }, _html2canvas] = await Promise.all([
			import('jspdf'),
			import('html2canvas')
		]);
		jsPDF = _jsPDF;
		html2canvas = _html2canvas.default || _html2canvas;
	}
}
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

/**
 * Genera el HTML de la plantilla de Referencia Laboral reemplazando los campos indicados.
 * @param {Object} campos - Objeto con los valores a reemplazar.
 * @returns {Promise<string>} HTML resultante con los campos reemplazados.
 */
export async function generarReferenciaLaboralHTML(campos) {
	const response = await fetch('/src/utils/plantillas/referencias/ReferenciaLaboral.txt');
	let template = await response.text();
	const camposReemplazo = [
		'LOGO',
		'EMPRESA_REFERENCIADA',
		'CARGO',
		'TIEMPO_LABORADO',
		'MOTIVO_RETIRO',
		'EVALUACION_DESEMPEÑO',
		'NOMBRE_REFERENCIA',
		'TELEFONO_REFERENCIA',
		'CONCEPTO_FINAL',
		'OBSERVACIONES',
		'FECHA_REGISTRO',
		'REFERENCIADOR_ALP',
		'IDENTIFICACION'
	];
	camposReemplazo.forEach((campo) => {
		const valor = campos[campo] || '';
		template = template.replaceAll(`@${campo}`, valor);
	});
	return template;
}

export async function generarEntrevistaHTML(campos) {
	const response = await fetch('/src/utils/plantillas/entrevista/Entrevista.txt');
	let template = await response.text();
	const camposReemplazo = [
		'NOMBRES',
		'DOCUMENTO',
		'BARRIO',
		'LOCALIDAD',
		'CARGO',
		'EDAD',
		'ESTADO_CIVIL',
		'ESTUDIA',
		'LUGAR',
		'CELULAR',
		'EVALUADOR',
		'ASPECTOS_ACADEMICOS',
		'EXPERIENCIA',
		'HA_TRABAJADO_EN_ALP',
		'VALIDACION_AM',
		'EPS',
		'FORTALEZAS',
		'AREAS_DE_MEJORA',
		'PRUEBA_FISICA',
		'CONCEPTO_FINAL',
		'OBSERVACIONES',
		'HIJOS'

	];
	camposReemplazo.forEach((campo) => {
		const valor = campos[campo] || '';
		template = template.replaceAll(`@${campo}`, valor);
	});
	return template;
}

export async function generarTratamientoDatosHTML(campos) {
	const response = await fetch('/src/utils/plantillas/tratamiento_datos/TratamientoDatos.txt');
	let template = await response.text();
	const camposReemplazo = [
		'NOMBRES',
		'TIPO_IDENTIFICACION',
		'NUMERO_IDENTIFICACION',
		'CIUDAD_EXPEDICION',
		'FECHA_FIRMA',
		'FIRMA',
		'EMAIL'
	];
	camposReemplazo.forEach((campo) => {
		const valor = campos[campo] || '';
		template = template.replaceAll(`@${campo}`, valor);
	});
	return template;
}

export async function generarContratoObraLaborHTML() {
  const response = await fetch('/src/utils/plantillas/contrato/ContratoObraLabor.txt');
  let campos = {
	NOMBRES: 'Juan Pérez Gómez',
  }
  let template = await response.text();
	const camposReemplazo = [
		'NOMBRES'
	];
	camposReemplazo.forEach((campo) => {
		const valor = campos[campo] || '';
		template = template.replaceAll(`@${campo}`, valor);
	});
	return template;
}

// export async function createContract(data){
// 	const response = await fetch('/src/utils/plantillas/contrato/createContract.jsx');
// }

/**
 * Descarga el HTML generado de la plantilla como PDF.
 * @param {string} htmlString - HTML a convertir en PDF.
 * @param {string} [fileName] - Nombre del archivo PDF.
 */
export async function descargarDocumentoPDF(htmlString, fileName = 'Documento.pdf') {
	await ensurePDFLibs();
	// Crear un contenedor temporal oculto con ancho A4
	const container = document.createElement('div');
	container.style.position = 'fixed';
	container.style.left = '-9999px';
	container.style.width = '800px'; // Aproximado a A4 en px
	container.style.background = '#fff';
	container.innerHTML = htmlString;
	document.body.appendChild(container);

	try {
		// Esperar a que se renderice
		await new Promise((resolve) => setTimeout(resolve, 100));

		const canvas = await html2canvas(container, { scale: 1.2 }); // Menor escala para mayor tamaño

		// ✅ Intentar PNG primero
		let imgData = canvas.toDataURL('image/png');

		// ✅ Detectar formato real según el DataURL
		let fmt = null;
		if (imgData.startsWith('data:image/png')) fmt = 'PNG';
		else if (imgData.startsWith('data:image/jpeg') || imgData.startsWith('data:image/jpg')) fmt = 'JPEG';

		// ✅ Fallback: si no es PNG/JPEG válido, forzamos JPEG
		if (!fmt) {
			imgData = canvas.toDataURL('image/jpeg', 0.95);
			fmt = 'JPEG';
		}

		const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
		const pageWidth = pdf.internal.pageSize.getWidth();
		const pageHeight = pdf.internal.pageSize.getHeight();
		const marginLeft = 60;
		const marginRight = 60;
		const imgWidth = pageWidth - marginLeft - marginRight;
		const imgHeight = (canvas.height * imgWidth) / canvas.width;

		// ✅ Usar el formato detectado para evitar "wrong PNG signature"
		pdf.addImage(imgData, fmt, marginLeft, 0, imgWidth, imgHeight);
		pdf.save(fileName);
	} finally {
		// ✅ Siempre limpiar el contenedor aunque falle el PDF
		if (container && container.parentNode) {
			container.parentNode.removeChild(container);
		}
	}
}
