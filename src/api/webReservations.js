import axios from 'axios';

// Usar la misma configuración de base URL que el resto de la app
const API_URL = import.meta.env.PROD 
  ? 'https://backspring-wrc6.onrender.com/api'
  : (import.meta.env.VITE_API_URL || 'http://localhost:8080/api');

const api = axios.create({ 
  baseURL: API_URL 
});

// Interceptor para agregar token si existe
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Listar solicitudes de reserva desde el sitio web
 */
export async function listWebReservationRequests(status = 'pending') {
  const res = await api.get('/web-reservation-requests', { params: { status } });
  return res.data?.requests || [];
}

/**
 * Obtener una solicitud específica
 */
export async function getWebReservationRequest(id) {
  const res = await api.get(`/web-reservation-requests/${id}`);
  return res.data?.request || null;
}

/**
 * Actualizar estado de una solicitud
 */
export async function updateWebReservationRequest(id, data) {
  const res = await api.patch(`/web-reservation-requests/${id}`, data);
  return res.data?.data || null;
}

export default api;
