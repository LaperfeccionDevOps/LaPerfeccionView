import axios from 'axios';
import { getApiUrl } from '../configFiles/api';

function getToken() {
  return (
    localStorage.getItem("token")
  );
}

export async function DescargarDocumentoPdf(payload, tipoDocumento) {
    const token = getToken();
    const url = getApiUrl('/descargar-documentos/descargar-documento-pdf');
    // Construir el payload requerido
    const body = {
      tipo: tipoDocumento,
      datos: {
        additionalProp1: payload
      }
    };
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    return response;
}