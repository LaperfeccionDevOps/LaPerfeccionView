
import axios from 'axios';
import { getApiUrl } from '../configFiles/api';

function getToken() {
  return (
    localStorage.getItem("token")
  );
}

export async function RegistroPersonal(payload) {
    const token = getToken();
    const url = getApiUrl('/registro-personal');
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqdWFuZGlheiIsInVpZCI6Ijc0MWZmMGY5LTZkZjAtNDMxYi1iY2Q1LWEyNGZhZmMyNWEzYyIsInJvbGVzIjpbIkRlc2Fycm9sbGFkb3IiXSwicm9sZXNfaWRzIjpbMTVdLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzY2OTU2ODAzLCJleHAiOjE3NjY5NjA0MDN9.Qo6h25VgBU_Hl6vuIg0TrK1yvvgWhGZDGepWYHSbdUg`,
        },
        body: JSON.stringify(payload),
    });
    return response;
}

export async function ActualizarEstadoProcesoService(id_registro,nuevo_estado, usuario) {
    const token = getToken();
    const url = getApiUrl(`/aspirantes/${id_registro}/estado?nuevo_estado=${encodeURIComponent(nuevo_estado)}&usuario=${encodeURIComponent(usuario)}`);
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });
    return response;
}

export async function DatosSeleccion(payload) {
    const token = getToken();
    const url = getApiUrl('/datos-seleccion/upsert');
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

export async function getListaLocalidades() {
    const url = getApiUrl(`/localidades`);
    const response = await axios.get(url, {
        headers: {
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqdWFuZGlheiIsInVpZCI6Ijc0MWZmMGY5LTZkZjAtNDMxYi1iY2Q1LWEyNGZhZmMyNWEzYyIsInJvbGVzIjpbIkRlc2Fycm9sbGFkb3IiXSwicm9sZXNfaWRzIjpbMTVdLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzY2OTU2ODAzLCJleHAiOjE3NjY5NjA0MDN9.Qo6h25VgBU_Hl6vuIg0TrK1yvvgWhGZDGepWYHSbdUg`,
        }
    });
    return response;
}

export async function getListaLugarNacimiento() {
    const url = getApiUrl(`/listado-lugar-nacimiento`);
    const response = await axios.get(url, {
        headers: {
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqdWFuZGlheiIsInVpZCI6Ijc0MWZmMGY5LTZkZjAtNDMxYi1iY2Q1LWEyNGZhZmMyNWEzYyIsInJvbGVzIjpbIkRlc2Fycm9sbGFkb3IiXSwicm9sZXNfaWRzIjpbMTVdLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzY2OTU2ODAzLCJleHAiOjE3NjY5NjA0MDN9.Qo6h25VgBU_Hl6vuIg0TrK1yvvgWhGZDGepWYHSbdUg`,
        }
    });
    return response;
}

export async function getAspirantexNumeroIdentificacion(identificacion) {
    // Nueva nomenclatura: /aspirantes/documento?id={identificacion}
    const url = getApiUrl(`/aspirantes/documento?id=${identificacion}`);
    const response = await axios.get(url, {
        headers: {
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqdWFuZGlheiIsInVpZCI6Ijc0MWZmMGY5LTZkZjAtNDMxYi1iY2Q1LWEyNGZhZmMyNWEzYyIsInJvbGVzIjpbIkRlc2Fycm9sbGFkb3IiXSwicm9zZXNfaWRzIjpbMTVdLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzY2OTU2ODAzLCJleHAiOjE3NjY5NjA0MDN9.Qo6h25VgBU_Hl6vuIg0TrK1yvvgWhGZDGepWYHSbdUg`,
        }
    });
    return response;
}

export async function ActualizarRegistro(id, payload) {
    const url = getApiUrl(`/registro-personal/full/${id}`);
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqdWFuZGlheiIsInVpZCI6Ijc0MWZmMGY5LTZkZjAtNDMxYi1iY2Q1LWEyNGZhZmMyNWEzYyIsInJvbGVzIjpbIkRlc2Fycm9sbGFkb3IiXSwicm9zZXNfaWRzIjpbMTVdLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzY2OTU2ODAzLCJleHAiOjE3NjY5NjA0MDN9.Qo6h25VgBU_Hl6vuIg0TrK1yvvgWhGZDGepWYHSbdUg`,
        },
        body: JSON.stringify(payload),
    });
    return response;
}

export async function getDocumentacionIngreso(id) {
    const token = getToken();
    const url = getApiUrl(`documentos-ingreso/aspirante/${id}/categoria/6`);
    const response = await axios.get(url, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response;
}

export async function ActualizarDatosSeleccion(id,payload) {
    const token = getToken();
    const url = getApiUrl(`/datos-seleccion/registro-personal/${id}`);
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
    return response;
}