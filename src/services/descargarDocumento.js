import axios from 'axios';
import { getApiUrl } from '../configFiles/api';

function getToken() {
  return (
    localStorage.getItem("token")
  );
}

export async function DescargarDocumentoPdf(
  payload,
  tipoDocumento,
  idVinculacionLaboral,
  contexto = {}
) {
  const token = getToken();

  const url = getApiUrl(
    '/descargar-documentos/descargar-documento-pdf'
  );

  // Compatibilidad con los flujos anteriores de tres argumentos.
  // Los modales QA envían IdRegistroPersonal y empresa como cuarto argumento.
  const vinc = Number(idVinculacionLaboral);
  const reg = Number(contexto?.IdRegistroPersonal ?? contexto?.idRegistroPersonal);
  const emp = Number(contexto?.IdEmpresaContratante ?? contexto?.idEmpresaContratante);

  const body = {
    tipo: tipoDocumento,
    datos: {
      additionalProp1: payload
    },
    IdVinculacionLaboral: Number.isInteger(vinc) && vinc > 0 ? vinc : null,
    ...(Number.isInteger(reg) && reg > 0 ? { IdRegistroPersonal: reg } : {}),
    ...(Number.isInteger(emp) && emp > 0 ? { IdEmpresaContratante: emp } : {})
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