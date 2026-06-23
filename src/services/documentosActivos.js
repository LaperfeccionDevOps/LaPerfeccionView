const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export const listarDocumentosActivos = async (idRegistroPersonal) => {
  const response = await fetch(`${API_BASE}/documentos-activos/registro/${idRegistroPersonal}`);
  if (!response.ok) throw new Error('Error listando documentos activos');
  return response.json();
};

export const obtenerDocumentoActivo = async (idDocumento) => {
  const response = await fetch(`${API_BASE}/documentos-activos/documento/${idDocumento}`);
  if (!response.ok) throw new Error('Error obteniendo documento activo');
  return response.json();
};

export const subirDocumentosActivos = async (payload) => {
  return fetch(`${API_BASE}/documentos-activos/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
};

export const eliminarDocumentoActivo = async (idDocumento) => {
  return fetch(`${API_BASE}/documentos-activos/documento/${idDocumento}`, {
    method: 'DELETE',
  });
};