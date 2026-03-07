import { getApiUrl } from '../configFiles/api';
function getToken() {
  return (
    localStorage.getItem("token")
  );
}
export async function ValidarReferenciaPersonal(payload) {
    const token = getToken();
    const url = getApiUrl(`/referencias-personales-validacion/upsert`);
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
    return response;
}